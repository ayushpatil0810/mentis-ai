import { streamText } from "ai";
import { requireAuth } from "@/lib/auth/auth-utils";
import * as messageService from "@/lib/services/message";
import { getProvider } from "@/lib/ai/providers";

export async function POST(req: Request) {
  try {
    const { user } = await requireAuth();
    const { chatId, messages, modelId } = await req.json();

    if (!chatId) {
      return new Response("Missing chatId", { status: 400 });
    }

    // `messages` from the client will contain the entire history, but we only trust our database.
    // We just extract the latest user message from the incoming array.
    const latestMessage = messages[messages.length - 1];
    console.log("Incoming latest message:", JSON.stringify(latestMessage, null, 2));
    
    if (!latestMessage || latestMessage.role !== "user") {
      return new Response("Invalid message format", { status: 400 });
    }

    const content = latestMessage.content || (latestMessage.parts && Array.isArray(latestMessage.parts) ? latestMessage.parts.map((p: any) => p.text || '').join('') : "") || latestMessage.text;

    if (!content) {
      return new Response("Missing message content", { status: 400 });
    }

    // 1. Save the user's new message to the database
    await messageService.createMessage(user.id, {
      chatId,
      role: "user",
      content: content,
    });

    // 2. Load the complete trusted conversation history from the database
    const dbMessages = await messageService.getMessagesByChatId(user.id, chatId);

    // 3. Convert history into the format required by the Vercel AI SDK (CoreMessage)
    const coreMessages: any[] = dbMessages.map((msg) => ({
      role: msg.role as "system" | "user" | "assistant" | "tool",
      content: msg.content,
    }));

    // 4. Resolve the correct provider and model based on modelId
    // modelId format: "provider/model" (e.g. "openai/gpt-4o-mini", "default/gpt-4o-mini")
    
    let targetProviderName = "openai";
    let targetModelName = "gpt-4o-mini";
    
    if (modelId && typeof modelId === "string") {
      const parts = modelId.split("/");
      if (parts.length >= 2) {
        targetProviderName = parts[0];
        targetModelName = parts.slice(1).join("/"); // join back in case model name has slashes
      }
    }
    
    // If it's default fallback, we just use openai configured with the env var
    if (targetProviderName === "default") {
      targetProviderName = "openai";
    }

    const provider = await getProvider(user.id, targetProviderName);

    // 5. Stream the AI response
    const result = streamText({
      model: provider(targetModelName),
      messages: coreMessages,
      onFinish: async (event) => {
        // 6. Persist the complete assistant response only after streaming successfully completes.
        await messageService.createMessage(user.id, {
          chatId,
          role: "assistant",
          content: event.text,
          status: "complete",
        });
      },
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Chat API Error:", error);
    // If unauthorized
    if (error.message?.includes("Unauthorized") || error.name === "UnauthorizedError") {
      return new Response("Unauthorized", { status: 401 });
    }
    return new Response(error.message || "Internal Server Error", { status: 500 });
  }
}
