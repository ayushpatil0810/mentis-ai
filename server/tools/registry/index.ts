import { tool, Tool } from "ai";
import { ToolContext, ToolConfig, ToolResult, ToolExecutionError } from "@/types/tool";
import { logger } from "@/lib/utils/logger";

// Import all tools
import { calculatorTool } from "../calculator";
import { datetimeTool } from "../datetime";
import { webSearchTool } from "../web-search";
import { fetchUrlTool } from "../fetch-url";
import { searchConversationsTool } from "../conversations";
import { searchMessagesTool } from "../messages";

const registeredTools: ToolConfig<any, any>[] = [
  calculatorTool,
  datetimeTool,
  webSearchTool,
  fetchUrlTool,
  searchConversationsTool,
  searchMessagesTool,
];

export function getTools(context: ToolContext): Record<string, Tool<any, any>> {
  const aiTools: Record<string, Tool<any, any>> = {};

  for (const t of registeredTools) {
    aiTools[t.name] = tool({
      description: t.description,
      inputSchema: t.parameters, // AI SDK 5.0+ uses inputSchema instead of parameters
      execute: async (args: any): Promise<ToolResult> => {
        try {
          logger.info(`Executing tool: ${t.name}`, { args, userId: context.userId });
          const data = await t.execute(args, context);
          return {
            status: "success",
            data,
          };
        } catch (error: any) {
          logger.error(`Error executing tool ${t.name}`, error);
          
          let code: any = "EXECUTION_ERROR";
          let message = error.message || "An error occurred during tool execution.";
          
          if (error instanceof ToolExecutionError) {
            code = error.code;
          } else if (error.name === "ZodError" || error.message?.includes("validation")) {
            code = "VALIDATION_ERROR";
          } else if (error.message?.includes("Unauthorized") || error.message?.includes("session")) {
            code = "AUTH_ERROR";
          } else if (error.message?.includes("fetch") || error.message?.includes("network")) {
            code = "NETWORK_ERROR";
          }

          return {
            status: "error",
            error: {
              code,
              message,
            },
          };
        }
      },
    });
  }

  return aiTools;
}
