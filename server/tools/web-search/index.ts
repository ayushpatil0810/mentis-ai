import { z } from "zod";
import { ToolConfig } from "@/types/tool";

export const webSearchTool: ToolConfig<any> = {
  name: "webSearch",
  description: "Search the web for real-time, current, or changing information (e.g. latest news, software versions, release notes, documentation, pricing). Do not use for static common knowledge or if freshness is not important. Returns titles, URLs, and snippets.",
  parameters: z.object({
    query: z.string().describe("The search query to look up on the web."),
  }),
  execute: async ({ query }) => {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }

      const html = await response.text();

      // Extract results using regex matching
      const results: Array<{ title: string; url: string; snippet: string }> = [];
      const resultBlocks = html.split(/<div[^>]*class="[^"]*web-result[^"]*"[^>]*>/);

      for (let i = 1; i < resultBlocks.length && results.length < 5; i++) {
        const block = resultBlocks[i];
        
        // Order-independent regex match for class="result__a" and href="..."
        const titleMatch = block.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/) ||
                           block.match(/<a[^>]*href="([^"]+)"[^>]*class="[^"]*result__a[^"]*"[^>]*>([\s\S]*?)<\/a>/);
        
        const snippetMatch = block.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/);

        if (titleMatch) {
          let rawUrl = titleMatch[1];
          if (rawUrl.startsWith("//")) {
            rawUrl = "https:" + rawUrl;
          }
          if (rawUrl.includes("uddg=")) {
            const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
            if (uddgMatch) {
              rawUrl = decodeURIComponent(uddgMatch[1]);
            }
          }

          const title = titleMatch[2].replace(/<[^>]+>/g, "").trim();
          const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, "").trim() : "";
          
          results.push({
            title,
            url: rawUrl,
            snippet,
          });
        }
      }

      return {
        query,
        results: results.map((r, index) => ({
          citation: `[${index + 1}]`,
          title: r.title,
          url: r.url,
          snippet: r.snippet,
        })),
      };
    } catch (err: any) {
      throw new Error(`Web search failed: ${err.message}`);
    }
  }
};
