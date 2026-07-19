import { generateText } from "ai";
import { getProvider } from "@/lib/ai/providers";
import { getChatById, updateChat } from "@/lib/services/chat";
import { logger } from "@/lib/utils/logger";

export async function generateTitle(
  chatId: string,
  userId: string,
  firstUserMessage: string,
  firstAssistantResponse: string,
  providerName: string,
  modelName: string
) {
  try {
    // 1. Fetch current chat to check if it's already titled
    const chat = await getChatById(userId, chatId);
    
    // Only generate if it is currently "New Chat" (default title)
    if (chat.title !== "New Chat") {
      return;
    }

    logger.info("Generating chat title asynchronously", { chatId });

    // 2. Instantiate provider and model
    const provider = await getProvider(userId, providerName);
    const model = provider(modelName);

    // 3. Generate title
    const prompt = `You are a conversation title generator. Analyze the following conversation start and generate a concise title (3 to 6 words).
Do NOT use quotes, markdown formatting, or any introductory text. Output ONLY the title itself.

User message: "${firstUserMessage.slice(0, 500)}"
Assistant response: "${firstAssistantResponse.slice(0, 1000)}"`;

    const { text } = await generateText({
      model,
      prompt,
      maxOutputTokens: 20,
    });

    const cleanTitle = text.replace(/["']/g, "").trim();

    if (cleanTitle) {
      // 4. Update the chat title
      await updateChat(userId, chatId, { title: cleanTitle });
      logger.info("Successfully updated chat title", { chatId, title: cleanTitle });
    }
  } catch (error) {
    logger.error("Failed to generate chat title", error);
  }
}
