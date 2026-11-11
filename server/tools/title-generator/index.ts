import { generateText } from "ai";
import { getProvider } from "@/lib/ai/providers";
import {
  fallbackTitleFromMessage,
  sanitizeTitle,
  usableChatTitle,
  DEFAULT_CHAT_TITLE,
} from "@/lib/chat/title";
import { getChatById, updateChatTitleIfDefault } from "@/lib/services/chat";
import { logger } from "@/lib/utils/logger";

const TITLE_TIMEOUT_MS = 8000;

export async function generateTitle(
  chatId: string,
  userId: string,
  firstUserMessage: string,
  firstAssistantResponse: string,
  providerName: string,
  modelName: string,
) {
  try {
    const chat = await getChatById(userId, chatId);

    if (chat.title !== DEFAULT_CHAT_TITLE) {
      return;
    }

    logger.info("Generating chat title", { chatId });

    const generated = await generateModelTitle(
      userId,
      providerName,
      modelName,
      firstUserMessage,
      firstAssistantResponse,
    );
    const title = generated || fallbackTitleFromMessage(firstUserMessage);

    if (!title) {
      logger.warn("Chat title generation produced no usable title", { chatId });
      return;
    }

    // Update only while the title is still the default, so a rename made
    // while the model call is in flight is left alone.
    const updated = await updateChatTitleIfDefault(userId, chatId, title);
    if (updated) {
      logger.info("Updated chat title", {
        chatId,
        title,
        source: generated ? "model" : "fallback",
      });
    }
  } catch (error) {
    logger.error("Failed to generate chat title", error);
  }
}

async function generateModelTitle(
  userId: string,
  providerName: string,
  modelName: string,
  firstUserMessage: string,
  firstAssistantResponse: string,
): Promise<string> {
  try {
    const provider = await getProvider(userId, providerName);
    const model = provider(modelName);
    const userExcerpt = firstUserMessage.slice(0, 500);
    const assistantExcerpt = firstAssistantResponse.slice(0, 1000);

    const prompt = `You are a conversation title generator. Analyze the following conversation start and generate a concise title (3 to 6 words).
Do NOT use quotes, markdown formatting, or any introductory text. Output ONLY the title itself.

User message: "${userExcerpt}"
Assistant response: "${assistantExcerpt}"`;

    const { text, finishReason } = await generateText({
      model,
      prompt,
      // High enough that a model which still spends a few tokens on reasoning
      // can finish the title. Truncated output is discarded below.
      maxOutputTokens: 256,
      reasoning: "none",
      timeout: TITLE_TIMEOUT_MS,
    });

    if (finishReason === "length") {
      logger.warn("Chat title generation hit the output limit", { providerName, modelName });
      return "";
    }

    return usableChatTitle(sanitizeTitle(text));
  } catch (error) {
    logger.error("Chat title model call failed", error);
    return "";
  }
}
