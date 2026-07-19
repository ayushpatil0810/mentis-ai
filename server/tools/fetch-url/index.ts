import { z } from "zod";
import { ToolConfig } from "@/types/tool";

export const fetchUrlTool: ToolConfig<any> = {
  name: "fetchUrl",
  description: "Fetch a public webpage's main text. Use when the user provides a URL and asks to summarize, analyze, or explain its contents. Do not guess web contents or fetch private/local IPs. Returns page title and cleaned markdown-like text.",
  parameters: z.object({
    url: z.string().url().describe("The absolute URL of the webpage to fetch."),
  }),
  execute: async ({ url }) => {
    try {
      const parsedUrl = new URL(url);
      
      // Basic SSRF protection: block private/local addresses
      const hostname = parsedUrl.hostname.toLowerCase();
      const isPrivate = 
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "0.0.0.0" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        hostname.startsWith("172.16.") ||
        hostname.startsWith("172.17.") ||
        hostname.startsWith("172.18.") ||
        hostname.startsWith("172.19.") ||
        hostname.startsWith("172.20.") ||
        hostname.startsWith("172.21.") ||
        hostname.startsWith("172.22.") ||
        hostname.startsWith("172.23.") ||
        hostname.startsWith("172.24.") ||
        hostname.startsWith("172.25.") ||
        hostname.startsWith("172.26.") ||
        hostname.startsWith("172.27.") ||
        hostname.startsWith("172.28.") ||
        hostname.startsWith("172.29.") ||
        hostname.startsWith("172.30.") ||
        hostname.startsWith("172.31.") ||
        hostname.endsWith(".local") ||
        hostname.endsWith(".internal");

      if (isPrivate) {
        throw new Error("Access to local/private network addresses is restricted.");
      }

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL. Status: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("application/json")) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }

      let text = await response.text();
      let title = parsedUrl.hostname;

      if (contentType.includes("text/html")) {
        // Extract Title tag before stripping
        const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1]
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
        }

        // Strip scripts
        text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
        // Strip styles
        text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
        // Strip nav, footer, header, ads, aside
        text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "");
        text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");
        text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");
        text = text.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "");
        text = text.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, "");

        // Convert common block elements to newlines to preserve formatting
        text = text.replace(/<\/p>/gi, "\n\n");
        text = text.replace(/<\/div>/gi, "\n");
        text = text.replace(/<br\s*\/?>/gi, "\n");
        text = text.replace(/<\/li>/gi, "\n");
        text = text.replace(/<\/h[1-6]>/gi, "\n\n");

        // Strip remaining HTML tags
        text = text.replace(/<[^>]+>/g, " ");

        // Decode HTML entities
        text = text
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");

        // Normalize spacing
        text = text
          .replace(/[ \t]+/g, " ")
          .replace(/\n\s*\n\s*\n+/g, "\n\n")
          .trim();
      }

      // Limit length to avoid blowing up context window (max 12000 characters)
      const maxLength = 12000;
      if (text.length > maxLength) {
        text = text.substring(0, maxLength) + "\n\n[Content truncated due to length limits...]";
      }

      return {
        url,
        title,
        content: text,
      };
    } catch (err: any) {
      throw new Error(`Failed to fetch or parse URL: ${err.message}`);
    }
  }
};
