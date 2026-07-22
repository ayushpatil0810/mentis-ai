import { z } from "zod";
import { ToolConfig } from "@/types/tool";
import { betterFetch } from "@better-fetch/fetch";

interface SearchItem {
  title: string;
  url: string;
  snippet: string;
}

export const webSearchTool: ToolConfig<any> = {
  name: "webSearch",
  description:
    "Search the web for real-time, current, or changing information (e.g. latest news, software versions, release notes, documentation, pricing). Do not use for static common knowledge or if freshness is not important. Returns titles, URLs, and snippets.",
  parameters: z.object({
    query: z.string().describe("The search query to look up on the web."),
  }),
  execute: async ({ query }) => {
    let lastError: string | null = null;
    let is403Forbidden = false;

    // --- Provider 1: Tavily Search API (Primary if TAVILY_API_KEY is configured) ---
    if (process.env.TAVILY_API_KEY) {
      try {
        const { data, error } = await betterFetch<any>("", {
          baseURL: "https://api.tavily.com/search",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: {
            api_key: process.env.TAVILY_API_KEY,
            query,
            max_results: 5,
          },
          timeout: 8000,
        });
        if (!error && data?.results && Array.isArray(data.results) && data.results.length > 0) {
          return {
            query,
            results: data.results.map((r: any, index: number) => ({
              citation: `[${index + 1}]`,
              title: r.title || "Untitled",
              url: r.url || "",
              snippet: r.content || r.snippet || "",
            })),
          };
        }
      } catch (err: any) {
        lastError = `Tavily API error: ${err.message}`;
      }
    }

    // --- Provider 2: Serper.dev Google Search API (if SERPER_API_KEY is configured) ---
    if (process.env.SERPER_API_KEY) {
      try {
        const { data, error } = await betterFetch<any>("", {
          baseURL: "https://google.serper.dev/search",
          method: "POST",
          headers: {
            "X-API-KEY": process.env.SERPER_API_KEY,
            "Content-Type": "application/json",
          },
          body: { q: query },
          timeout: 8000,
        });
        if (!error && data?.organic && Array.isArray(data.organic) && data.organic.length > 0) {
          return {
            query,
            results: data.organic.slice(0, 5).map((r: any, index: number) => ({
              citation: `[${index + 1}]`,
              title: r.title || "Untitled",
              url: r.link || "",
              snippet: r.snippet || "",
            })),
          };
        }
      } catch (err: any) {
        lastError = `Serper API error: ${err.message}`;
      }
    }

    // --- Provider 3: Brave Search API (if BRAVE_SEARCH_API_KEY is configured) ---
    if (process.env.BRAVE_SEARCH_API_KEY) {
      try {
        const { data, error } = await betterFetch<any>("", {
          baseURL: "https://api.search.brave.com/res/v1/web/search",
          query: { q: query, count: "5" },
          headers: {
            Accept: "application/json",
            "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY,
          },
          timeout: 8000,
        });
        if (!error && data?.web?.results && Array.isArray(data.web.results) && data.web.results.length > 0) {
          return {
            query,
            results: data.web.results.slice(0, 5).map((r: any, index: number) => ({
              citation: `[${index + 1}]`,
              title: r.title || "Untitled",
              url: r.url || "",
              snippet: r.description || "",
            })),
          };
        }
      } catch (err: any) {
        lastError = `Brave API error: ${err.message}`;
      }
    }

    // --- Provider 4: SearXNG Meta Search Instance (if SEARXNG_URL is configured) ---
    if (process.env.SEARXNG_URL) {
      try {
        const baseUrl = process.env.SEARXNG_URL.replace(/\/$/, "");
        const { data, error } = await betterFetch<any>("", {
          baseURL: `${baseUrl}/search`,
          query: { q: query, format: "json" },
          timeout: 8000,
        });
        if (!error && data?.results && Array.isArray(data.results) && data.results.length > 0) {
          return {
            query,
            results: data.results.slice(0, 5).map((r: any, index: number) => ({
              citation: `[${index + 1}]`,
              title: r.title || "Untitled",
              url: r.url || "",
              snippet: r.content || r.snippet || "",
            })),
          };
        }
      } catch (err: any) {
        lastError = `SearXNG error: ${err.message}`;
      }
    }

    // --- Provider 5: DuckDuckGo Lite Scraping ---
    try {
      const { data: html, error: liteError } = await betterFetch<string>("", {
        baseURL: "https://lite.duckduckgo.com/lite/",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        body: `q=${encodeURIComponent(query)}`,
        timeout: 8000,
      });

      if (liteError?.status === 403) {
        is403Forbidden = true;
      }

      if (!liteError && typeof html === "string") {
        const trs = html.split("<tr>");
        const results: SearchItem[] = [];

        for (let i = 0; i < trs.length && results.length < 5; i++) {
          const tr = trs[i];
          const linkMatch =
            tr.match(/href=["']([^"']+)["'][^>]*class=["']result-link["']/i) ||
            tr.match(/class=["']result-link["'][^>]*href=["']([^"']+)["']/i);

          if (linkMatch) {
            let url = linkMatch[1];
            if (url.startsWith("//")) url = "https:" + url;
            if (url.includes("uddg=")) {
              const uddgMatch = url.match(/uddg=([^&]+)/);
              if (uddgMatch) url = decodeURIComponent(uddgMatch[1]);
            }

            const titleMatch = tr.match(/class=["']result-link["'][^>]*>([\s\S]*?)<\/a>/i);
            const title = titleMatch
              ? titleMatch[1]
                  .replace(/<[^>]+>/g, "")
                  .replace(/&#x27;/g, "'")
                  .replace(/&amp;/g, "&")
                  .replace(/&quot;/g, '"')
                  .trim()
              : "";

            let snippet = "";
            if (i + 1 < trs.length) {
              const nextTr = trs[i + 1];
              const snippetMatch = nextTr.match(/class=["']result-snippet["'][^>]*>([\s\S]*?)<\/td>/i);
              if (snippetMatch) {
                snippet = snippetMatch[1]
                  .replace(/<[^>]+>/g, "")
                  .replace(/&#x27;/g, "'")
                  .replace(/&amp;/g, "&")
                  .replace(/&quot;/g, '"')
                  .trim();
              }
            }

            if (title && url) {
              results.push({ title, url, snippet });
            }
          }
        }

        if (results.length > 0) {
          return {
            query,
            results: results.map((r, index) => ({
              citation: `[${index + 1}]`,
              title: r.title,
              url: r.url,
              snippet: r.snippet,
            })),
          };
        }
      }
    } catch (err: any) {
      lastError = `DDG Lite error: ${err.message}`;
    }

    // --- Provider 6: DuckDuckGo Standard HTML Scraping ---
    try {
      const { data: html, error: htmlError } = await betterFetch<string>("", {
        baseURL: "https://html.duckduckgo.com/html/",
        query: { q: query },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 8000,
      });

      if (htmlError?.status === 403) {
        is403Forbidden = true;
      }

      if (!htmlError && typeof html === "string") {
        const results: SearchItem[] = [];
        const resultBlocks = html.split(/<div[^>]*class="[^"]*web-result[^"]*"[^>]*>/);

        for (let i = 1; i < resultBlocks.length && results.length < 5; i++) {
          const block = resultBlocks[i];
          const titleMatch =
            block.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/) ||
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

            const title = titleMatch[2].replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").trim();
            const snippet = snippetMatch
              ? snippetMatch[1].replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").trim()
              : "";

            results.push({ title, url: rawUrl, snippet });
          }
        }

        if (results.length > 0) {
          return {
            query,
            results: results.map((r, index) => ({
              citation: `[${index + 1}]`,
              title: r.title,
              url: r.url,
              snippet: r.snippet,
            })),
          };
        }
      }
    } catch (err: any) {
      lastError = `DDG HTML error: ${err.message}`;
    }

    // --- Provider 7: DuckDuckGo Instant Answer API Fallback ---
    try {
      const { data, error } = await betterFetch<any>("", {
        baseURL: "https://api.duckduckgo.com/",
        query: {
          q: query,
          format: "json",
          no_html: "1",
          skip_disambig: "1",
        },
        timeout: 8000,
      });

      if (!error && data) {
        const results: SearchItem[] = [];

        if (data.AbstractText && data.AbstractURL) {
          results.push({
            title: data.Heading || query,
            url: data.AbstractURL,
            snippet: data.AbstractText,
          });
        }

        if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
          for (const topic of data.RelatedTopics) {
            if (results.length >= 5) break;
            if (topic.FirstURL && topic.Text) {
              results.push({
                title: topic.Text.split(" - ")[0] || topic.Text,
                url: topic.FirstURL,
                snippet: topic.Text,
              });
            }
          }
        }

        if (results.length > 0) {
          return {
            query,
            results: results.map((r, index) => ({
              citation: `[${index + 1}]`,
              title: r.title,
              url: r.url,
              snippet: r.snippet,
            })),
          };
        }
      }
    } catch (err: any) {
      lastError = `DDG API error: ${err.message}`;
    }

    // --- Provider 8: Wikipedia Open Search API Fallback ---
    try {
      const { data, error } = await betterFetch<any>("", {
        baseURL: "https://en.wikipedia.org/w/api.php",
        query: {
          action: "query",
          list: "search",
          srsearch: query,
          format: "json",
          origin: "*",
        },
        timeout: 8000,
      });

      if (!error && data?.query?.search && Array.isArray(data.query.search) && data.query.search.length > 0) {
        return {
          query,
          results: data.query.search.slice(0, 5).map((item: any, index: number) => ({
            citation: `[${index + 1}]`,
            title: item.title,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
            snippet: item.snippet ? item.snippet.replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&") : "",
          })),
        };
      }
    } catch (err: any) {
      lastError = `Wikipedia API error: ${err.message}`;
    }

    // --- Final Error Handling ---
    if (is403Forbidden) {
      throw new Error(
        "Web search HTTP 403: DuckDuckGo blocks direct HTML scraping from Vercel datacenter IPs. Please configure TAVILY_API_KEY (or SERPER_API_KEY / BRAVE_SEARCH_API_KEY) in Vercel Environment Variables."
      );
    }

    throw new Error(`Web search failed: ${lastError || "No results found across search providers."}`);
  },
};
