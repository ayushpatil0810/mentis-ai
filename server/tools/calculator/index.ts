import { z } from "zod";
import { ToolConfig } from "@/types/tool";

export const calculatorTool: ToolConfig<any> = {
  name: "calculator",
  description: "Always use this tool for evaluating mathematical calculations, arithmetic, formulas, or equations. Do not calculate mentally or estimate values. Returns the computed numeric result.",
  parameters: z.object({
    expression: z.string().describe("The mathematical expression to evaluate (e.g., '153 * 423' or '(12 + 8) / 4')"),
  }),
  execute: async ({ expression }) => {
    // Basic sanitization: only allow numbers, operators, spaces, parentheses, decimal point
    const safeRegex = /^[0-9+\-*/().\s]+$/;
    if (!safeRegex.test(expression)) {
      throw new Error("Invalid characters in expression. Only numbers and basic arithmetic operators are allowed.");
    }
    try {
      // Evaluate the safe math expression
      // eslint-disable-next-line no-new-func
      const result = new Function(`return (${expression})`)();
      if (typeof result !== "number" || isNaN(result) || !isFinite(result)) {
        throw new Error("Invalid mathematical expression.");
      }
      return { result };
    } catch (err: any) {
      throw new Error(`Calculation error: ${err.message}`);
    }
  }
};
