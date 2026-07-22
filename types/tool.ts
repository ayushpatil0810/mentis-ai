import { z } from "zod";

export interface ToolContext {
  userId: string;
}

export type ToolErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_ERROR"
  | "NETWORK_ERROR"
  | "EXECUTION_ERROR"
  | "UNKNOWN_ERROR";



export interface ToolSuccess<T = any> {
  status: "success";
  data: T;
}

export interface ToolFailure {
  status: "error";
  error: {
    code: ToolErrorCode;
    message: string;
  };
}

export type ToolResult<T = any> = ToolSuccess<T> | ToolFailure;

export class ToolExecutionError extends Error {
  code: ToolErrorCode;
  constructor(code: ToolErrorCode, message: string) {
    super(message);
    this.name = "ToolExecutionError";
    this.code = code;
  }
}

export interface ToolConfig<TParams extends z.ZodType = z.ZodType, TResult = any> {
  name: string;
  description: string;
  parameters: TParams;
  execute: (args: z.infer<TParams>, context: ToolContext) => Promise<TResult> | TResult;
}

export type Tool = ToolConfig<any, any>;
