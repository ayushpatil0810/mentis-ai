import { streamText, isStepCount } from "ai";
import { requireAuth } from "@/lib/auth/auth-utils";
import * as messageService from "@/lib/services/message";
import * as chatService from "@/lib/services/chat";
import { getProvider } from "@/lib/ai/providers";
import { logger } from "@/lib/utils/logger";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { getTools } from "@/server/tools/registry";
import { generateTitle } from "@/server/tools/title-generator";
import { buildSystemPrompt } from "@/server/prompts/builder";
import { trimDbMessages, compressMessageHistory } from "@/lib/tools/history-utils";
import { analyzePromptTokens } from "@/server/prompts/analyzer";
import { calculateCost } from "@/lib/ai/costs";
import { ulid } from "ulid";

const chatPayloadSchema = z.object({
  chatId: z.string().min(1),
  modelId: z.string().optional(),
  messages: z.array(z.any()).min(1), // Allow AI SDK message structure
  retryGroupId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const startTime = Date.now();
    const runId = ulid();

    const rawBody = await req.json();
    const parseResult = chatPayloadSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return new Response("Invalid request payload", { status: 400 });
    }

    const { chatId, messages, modelId, retryGroupId } = parseResult.data;

    const { user } = await requireAuth();
    
    // Apply rate limit for AI generation (e.g., 20 messages per minute)
    await rateLimit(`chat:${user.id}`, 20, 60000);

    let latestUserMsgContent = "";

    // 1. If not retrying, save the user's new message to the database
    if (!retryGroupId) {
      const latestMessage = messages[messages.length - 1];
      logger.debug("Incoming latest message", { latestMessage });
      
      if (!latestMessage || latestMessage.role !== "user") {
        return new Response("Invalid message format", { status: 400 });
      }

      const content = latestMessage.content || (latestMessage.parts && Array.isArray(latestMessage.parts) ? latestMessage.parts.map((p: any) => p.text || '').join('') : "") || latestMessage.text;

      if (!content) {
        return new Response("Missing message content", { status: 400 });
      }
      
      latestUserMsgContent = content;

      await messageService.createMessage(user.id, {
        chatId,
        role: "user",
        content: content,
      });
    }

    // 2. Load the complete trusted conversation history from the database
    const dbMessages = await messageService.getMessagesByChatId(user.id, chatId);

    // Filter context if retrying an assistant response
    let contextDbMessages = dbMessages;
    if (retryGroupId) {
      const activeThread: typeof dbMessages = [];
      for (const msg of dbMessages) {
        if (msg.versionGroupId) {
          const alreadyAdded = activeThread.some(m => m.versionGroupId === msg.versionGroupId);
          if (!alreadyAdded) {
            const group = dbMessages.filter(m => m.versionGroupId === msg.versionGroupId);
            const choice = group.find(m => m.isActiveVersion) || group[0];
            activeThread.push(choice);
          }
        } else {
          activeThread.push(msg);
        }
      }
      const groupIndex = activeThread.findIndex(m => m.versionGroupId === retryGroupId || m.id === retryGroupId);
      if (groupIndex !== -1) {
        contextDbMessages = activeThread.slice(0, groupIndex);
      }
    }

    // Safely trim message history to 20 messages to keep input window small
    const trimmedDbMessages = trimDbMessages(contextDbMessages, 20);

    // Compress older message payloads to prune huge tool results and responses
    const compressedDbMessages = compressMessageHistory(trimmedDbMessages, 10);

    // 3. Convert history into the format required by the Vercel AI SDK (ModelMessage/CoreMessage)
    const coreMessages: any[] = compressedDbMessages.map((msg) => {
      const content = (msg.parts && Array.isArray(msg.parts) && msg.parts.length > 0)
        ? msg.parts
        : msg.content;
      
      return {
        role: msg.role as "system" | "user" | "assistant" | "tool",
        content,
      };
    });

    // 4. Resolve the correct provider and model based on modelId
    let targetProviderName = "openai";
    let targetModelName = "gpt-4o-mini";
    
    if (modelId && typeof modelId === "string") {
      const parts = modelId.split("/");
      if (parts.length >= 2) {
        targetProviderName = parts[0];
        targetModelName = parts.slice(1).join("/"); 
      }
    }
    
    if (targetProviderName === "default") {
      targetProviderName = "openai";
    }

    const provider = await getProvider(user.id, targetProviderName);
    const tools = getTools({ userId: user.id });

    // Load user custom prompt if available
    const chatObj = await chatService.getChatById(user.id, chatId).catch(() => null);
    
    let systemPrompt = buildSystemPrompt({ provider: targetProviderName });
    
    if (chatObj?.systemPrompt) {
      systemPrompt = `${systemPrompt}\n\n# User-defined Custom Instructions\n${chatObj.systemPrompt}`;
    }

    // Run dynamic runtime token analysis
    analyzePromptTokens({
      systemPrompt,
      tools,
      messages: coreMessages,
    });

    // 5. Stream the AI response
    const result = streamText({
      model: provider(targetModelName),
      messages: coreMessages,
      system: systemPrompt,
      tools,
      stopWhen: isStepCount(5),
      onFinish: async (event) => {
        const latencyMs = Date.now() - startTime;
        const promptTokens = event.usage?.inputTokens || 0;
        const completionTokens = event.usage?.outputTokens || 0;
        const cost = calculateCost(targetProviderName, targetModelName, promptTokens, completionTokens);
        
        const responseMsgs = event.responseMessages || [];
        const toolNames: string[] = [];
        for (const msg of responseMsgs) {
          if (msg.role === "assistant" && Array.isArray(msg.content)) {
            for (const part of msg.content) {
              if (part.type === "tool-call") {
                toolNames.push(part.toolName);
              }
            }
          }
        }

        const metadata = {
          runId,
          provider: targetProviderName,
          model: targetModelName,
          latencyMs,
          usage: event.usage,
          cost,
          contextMessageCount: coreMessages.length,
          toolNames,
        };

        const targetVersionGroupId = retryGroupId || ulid();

        // 6. Persist all generated messages (assistant replies and tool results) to the database
        if (responseMsgs.length > 0) {
          for (const msg of responseMsgs) {
            await messageService.createMessage(user.id, {
              chatId,
              role: msg.role,
              content: typeof msg.content === "string" ? msg.content : "",
              parts: typeof msg.content !== "string" ? msg.content : undefined,
              status: "complete",
              versionGroupId: msg.role === "assistant" || msg.role === "tool" ? targetVersionGroupId : undefined,
              isActiveVersion: true,
              metadata,
            });
          }
        } else {
          // Fallback if responseMessages is empty or undefined
          await messageService.createMessage(user.id, {
            chatId,
            role: "assistant",
            content: event.text,
            status: "complete",
            versionGroupId: targetVersionGroupId,
            isActiveVersion: true,
            metadata,
          });
        }

        // 7. Generate title asynchronously if this is the first message exchange
        if (!retryGroupId && dbMessages.length <= 1 && latestUserMsgContent) {
          generateTitle(
            chatId,
            user.id,
            latestUserMsgContent,
            event.text,
            targetProviderName,
            targetModelName
          ).catch((err) => logger.error("Title generation background error", err));
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    logger.error("Chat API Error", error);
    if (error.name === "RateLimitError") {
      return new Response("Too many requests", { status: 429 });
    }
    if (error.message?.includes("Unauthorized") || error.name === "AuthError") {
      return new Response("Unauthorized", { status: 401 });
    }
    return new Response(error.message || "Internal Server Error", { status: 500 });
  }
}
