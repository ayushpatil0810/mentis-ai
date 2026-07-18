import { AppError } from "./errors";
import { logger } from "./logger";

export type ActionState<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export async function safeAction<T>(
  actionName: string,
  fn: () => Promise<T>
): Promise<ActionState<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error: any) {
    logger.error(`Action failed: ${actionName}`, error);
    
    if (error instanceof AppError) {
      return { 
        success: false, 
        error: error.message,
        code: error.code 
      };
    }
    
    return { 
      success: false, 
      error: error.message || "An unexpected error occurred",
      code: "INTERNAL_ERROR"
    };
  }
}
