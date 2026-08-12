<div align="center">
  <img src="./public/logo.png" alt="Mentis AI Logo" width="200" />
  <h1>Mentis AI</h1>
  <p><strong>Next-generation, elegant, fast, multi-provider AI assistant with native web search, tools, and Bring-Your-Own-Key (BYOK) privacy.</strong></p>
  <p>
    <a href="https://mentis.ayushpatil.in"><strong>Live Demo: mentis.ayushpatil.in</strong></a>
  </p>
</div>

---

## Overview

Mentis AI is a production-ready, full-stack AI chat application designed for performance, privacy, and extensibility. Built with Next.js 16 (App Router), React 19, Vercel AI SDK, Better Auth, and PostgreSQL with Drizzle ORM, Mentis AI empowers users to interact with state-of-the-art AI models across OpenAI, Anthropic, and Google Gemini using their own API keys or system defaults.

With a domain-driven tool ecosystem, real-time response streaming, full-text message search, conversation branching, custom system prompts, and PDF/Markdown/JSON exporting, Mentis AI brings a premium AI workbench experience directly to your web browser.

---

## Integrated Tools & Capabilities

Mentis AI features a dynamic tool execution engine built into the server route handlers. The assistant seamlessly selects and invokes tools when necessary to fulfill complex requests.

| Tool Name | Key / Function | Description |
| :--- | :--- | :--- |
| **Web Search** | `webSearch` | Performs live, real-time web searches via Tavily API to fetch current events, software releases, live documentation, and pricing with source citations. |
| **URL Content Reader** | `fetchUrl` | Extracts, cleans, and converts public webpage content into structured text with SSRF protection against private IP ranges and token limit truncation. |
| **Safe Calculator** | `calculator` | Evaluates arithmetic, complex mathematical expressions, and formulas accurately without model calculation hallucinations. |
| **Date & Time Manager** | `datetime` | Fetches current timestamps in any target IANA timezone and calculates relative offset dates (days, weeks, months, years). |
| **Full-Text Message Search** | `searchMessages` | Leverages PostgreSQL full-text search (`to_tsvector` / `websearch_to_tsquery` with `ILIKE` fallback) to search past user conversations and message content. |
| **Conversation Search** | `searchConversations` | Searches active user's conversation titles, pinned status, and archival states across history. |
| **Auto Title Generator** | `generateTitle` | Asynchronously generates concise, 3-6 word contextual chat titles after initial conversation exchanges. |

---

## Key Features

- **Multi-Provider BYOK (Bring Your Own Key):** Connect your own OpenAI, Anthropic, or Google Gemini API keys with client & server-side AES-256 encryption.
- **Dynamic Model Discovery:** Automatically lists available models (e.g., GPT-4o, o1/o3 reasoning models, Claude 3.5/3.7 Sonnet & Opus, Gemini 2.0 Flash & 1.5 Pro) dynamically based on connected keys.
- **Real-Time Streaming:** Ultra-low latency response streaming powered by Vercel AI SDK and custom UI message streams.
- **Conversation Branching & Versioning:** Retry assistant responses to generate alternative versions without overwriting prior history.
- **Custom System Instructions:** Set custom system prompts per chat or workspace to align AI personality and output requirements.
- **Exporting & Sharing:** Export full conversations to **PDF** (via jsPDF), **Markdown**, or **JSON**, or share conversations via public links.
- **High-Performance Search:** Instant search across chat titles and message histories using native PostgreSQL full-text search.
- **Token & Cost Tracking:** Calculates request latency, input/output token counts, and estimated model usage costs on every turn.
- **Modern Dark-First UI:** Responsive, WCAG 2.2 AA accessible design built on Tailwind CSS v4, Geist typography, shadcn/ui, and micro-animations.

---

## Architecture & System Flow

Mentis AI follows a type-safe, domain-driven architecture utilizing Next.js Server Actions, Route Handlers, and Drizzle ORM.

### Complete Interaction Flow

```mermaid
sequenceDiagram
    actor User as User / Client
    participant UI as Next.js 16 UI
    participant Auth as Better Auth
    participant API as Chat Route Handler
    participant DB as PostgreSQL (Drizzle)
    participant SDK as Vercel AI SDK
    participant Tools as Tool Execution Engine

    User->>UI: Send Prompt / Select Model
    UI->>Auth: Verify Session & Rate Limit
    Auth-->>UI: Session Valid
    UI->>API: POST /api/chat (Payload & chatId)
    API->>DB: Save User Message
    API->>DB: Fetch History & Trim Context
    API->>SDK: streamText() with Registered Tools & System Prompt
    
    opt Tool Calling Triggered
        SDK->>Tools: Invoke Tool (webSearch, fetchUrl, calculator, datetime, searchMessages)
        Tools->>Tools: Execute with Parameters & SSRF Protection
        Tools-->>SDK: Return Tool Result / Data
    end

    SDK-->>UI: Stream Response Chunks & Tool Executions
    UI-->>User: Render Real-time Text, Code & Micro-animations
    SDK->>DB: Save Assistant Message, Token Usage & Tool Metadata (onFinish)
    
    opt First Exchange in Chat
        API->>Tools: Trigger Async Title Generator
        Tools->>DB: Update Chat Title
    end
```

---

## Tech Stack

- **Framework:** [Next.js 16+](https://nextjs.org/) (App Router, Server Actions, Server Components)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **UI & Styling:** [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Motion](https://motion.dev/)
- **Database & ORM:** [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/) & Drizzle Kit
- **Authentication:** [Better Auth](https://better-auth.com/)
- **AI Core:** [Vercel AI SDK 4+](https://sdk.vercel.ai/) (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`)
- **Web Search Engine:** [Tavily API](https://tavily.com/)
- **State & Data Fetching:** [TanStack Query v5](https://tanstack.com/query)
- **PDF Exporting:** [jsPDF](https://github.com/parallax/jsPDF)

---

## Getting Started

### Prerequisites

- **Node.js:** 18+ or **Bun** (recommended)
- **Database:** PostgreSQL instance
- **API Keys (Optional for BYOK):** OpenAI, Anthropic, or Google Gemini API key
- **Web Search Key:** Tavily API Key (for real-time web search capabilities)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ayushpatil0810/mentis-ai.git
   cd mentis-ai
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/mentis"

   # Authentication
   BETTER_AUTH_SECRET="your-32-character-secret"
   BETTER_AUTH_URL="http://localhost:3000"

   # Security & Key Encryption (32-byte hex key)
   ENCRYPTION_KEY="your-32-byte-hex-encryption-key"

   # Server-side Tool API Keys
   TAVILY_API_KEY="your-tavily-api-key"
   ```

4. **Run Database Migrations**
   Push the schema directly to your PostgreSQL database:
   ```bash
   bun run db:push
   ```

5. **Start the Development Server**
   ```bash
   bun run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Available Scripts

- `bun run dev`: Launches the Next.js development server.
- `bun run build`: Builds the production-ready application package.
- `bun run start`: Starts the Next.js production server.
- `bun run lint`: Runs ESLint to inspect code quality.
- `bun run db:push`: Applies database schema changes directly via Drizzle Kit.
- `bun run db:generate`: Generates migration files based on Drizzle schema changes.

---

## License

Mentis AI is open-sourced software licensed under the [MIT license](LICENSE).

