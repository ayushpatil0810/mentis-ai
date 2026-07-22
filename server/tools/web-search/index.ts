import { z } from "zod";
import { Tool } from "@/types/tool";
import { betterFetch } from "@better-fetch/fetch";

export const webSearchTool: Tool = {
  name: "webSearch",
  description:
    "Search the web for real-time, current, or changing information (e.g. latest news, software versions, release notes, documentation, pricing). Do not use for static common knowledge or if freshness is not important. Returns titles, URLs, and snippets.",
  parameters: z.object({
    query: z.string().describe("The search query to look up on the web."),
  }),
  execute: async ({ query }) => {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      throw new Error(
        "TAVILY_API_KEY environment variable is missing. Please configure TAVILY_API_KEY in your environment variables to enable web search."
      );
    }

    try {
      const { data, error } = await betterFetch<any>("/search", {
        baseURL: "https://api.tavily.com",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          api_key: apiKey,
          query,
          max_results: 5,
        },
        timeout: 8000,
      });

      if (error) {
        throw new Error(
          `Tavily search API error: ${error.status || 500} ${error.statusText || "Request failed"}`
        );
      }

      if (!data?.results || !Array.isArray(data.results) || data.results.length === 0) {
        return {
          query,
          results: [],
        };
      }

      return {
        query,
        results: data.results.map((r: any, index: number) => ({
          citation: `[${index + 1}]`,
          title: r.title || "Untitled",
          url: r.url || "",
          snippet: r.content || r.snippet || "",
        })),
      };
    } catch (err: any) {
      throw new Error(`Web search failed: ${err.message}`);
    }
  },
};
