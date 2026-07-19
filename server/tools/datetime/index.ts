import { z } from "zod";
import { ToolConfig } from "@/types/tool";

export const datetimeTool: ToolConfig<any> = {
  name: "datetime",
  description: "Get the current date, time, timezone, or compute relative dates.",
  parameters: z.object({
    action: z.enum(["current", "relative"]).default("current").describe("Whether to get the current time or calculate a relative date/time."),
    offsetValue: z.number().optional().describe("Number of units to offset (positive for future, negative for past). Required if action is 'relative'."),
    offsetUnit: z.enum(["minutes", "hours", "days", "weeks", "months", "years"]).optional().describe("Unit for the relative offset."),
    timezone: z.string().optional().describe("Optional target IANA timezone (e.g., 'America/New_York'). Defaults to UTC."),
  }),
  execute: async ({ action, offsetValue, offsetUnit, timezone = "UTC" }) => {
    try {
      let date = new Date();
      if (action === "relative" && offsetValue !== undefined && offsetUnit !== undefined) {
        switch (offsetUnit) {
          case "minutes":
            date.setMinutes(date.getMinutes() + offsetValue);
            break;
          case "hours":
            date.setHours(date.getHours() + offsetValue);
            break;
          case "days":
            date.setDate(date.getDate() + offsetValue);
            break;
          case "weeks":
            date.setDate(date.getDate() + offsetValue * 7);
            break;
          case "months":
            date.setMonth(date.getMonth() + offsetValue);
            break;
          case "years":
            date.setFullYear(date.getFullYear() + offsetValue);
            break;
        }
      }

      // Format with specified timezone
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      };

      const formatter = new Intl.DateTimeFormat("en-US", options);
      const formattedString = formatter.format(date);

      return {
        iso: date.toISOString(),
        formatted: formattedString,
        timezone,
        timestamp: date.getTime(),
      };
    } catch (error: any) {
      throw new Error(`Failed to process datetime: ${error.message}`);
    }
  }
};
