<div align="center">
  <img src="./public/logo.png" alt="Mentis AI Logo" width="200" />
  <h1>Mentis AI</h1>
  <p><strong>Next-generation, elegant, fast, and feature-rich AI assistant.</strong></p>
  <p><a href="https://mentis.ayushpatil.in"><strong>Live Demo: https://mentis.ayushpatil.in</strong></a></p>
</div>

---

## Overview

Mentis AI is a production-ready AI chat application inspired by modern AI assistants but built with a focus on speed, simplicity, and extensibility. With multi-provider support, bring-your-own-keys (BYOK), and a completely type-safe full-stack architecture, Mentis AI aims to provide the best developer and user experience possible.

## Features

- **Multi-Provider Support:** First-class support for OpenAI, Anthropic, and Google Gemini.
- **Streaming Responses:** Ultra-fast, real-time message streaming using Vercel AI SDK.
- **User-Owned API Keys:** Secure encryption for user-provided API keys.
- **Chat Management:** Create, rename, pin, archive, delete, branch, and share conversations.
- **Exporting & Sharing:** Export chats to PDF, JSON, or Markdown cleanly.
- **Rich Markdown & Code:** Syntax highlighting, markdown rendering, and structural display.
- **Modern UI:** Built on top of Tailwind CSS, shadcn/ui, and motion for buttery smooth micro-animations.

## Architecture & Flows

Mentis AI follows a clean, domain-driven architecture utilizing Next.js App Router, React Server Components (RSC), and Drizzle ORM.

### User Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Next.js UI
    participant Auth as Better Auth
    participant DB as PostgreSQL (Drizzle)
    participant API as Route Handlers

    User->>Frontend: Access Application
    Frontend->>Auth: Check Session
    Auth-->>Frontend: Authenticated (or Redirect to Login)
    User->>Frontend: Enter API Key (Optional)
    Frontend->>API: Encrypt & Save Key
    API->>DB: Store Encrypted Key
    User->>Frontend: Send Message
    Frontend->>API: POST /api/chat
    API->>DB: Save User Message (Optimistic)
    API->>API: Initialize Vercel AI Stream
    API-->>Frontend: Stream Chunks
    Frontend-->>User: Render Real-time Response
    API->>DB: Save Assistant Message (Completion)
```

### Backend Flow

```mermaid
flowchart TD
    Client([Client Request]) --> Handler[Next.js Route Handler]
    Handler --> Auth{Authenticated?}
    Auth -- No --> 401[401 Unauthorized]
    Auth -- Yes --> ProviderCheck{Has API Key?}
    
    ProviderCheck -- System --> Model[Init System Model]
    ProviderCheck -- User --> Decrypt[Decrypt User Key]
    Decrypt --> Model[Init Custom Model]
    
    Model --> Stream[Vercel AI streamText]
    Stream --> DB_Start[(PostgreSQL)]
    DB_Start -.-> |Save User Message| DB_Start
    
    Stream -- Stream Data --> Client
    Stream -- onFinish --> DB_End[(PostgreSQL)]
    DB_End -.-> |Save Assistant Message| DB_End
```

## Tech Stack

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router, Server Actions)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication:** [Better Auth](https://better-auth.com/)
- **AI Core:** [Vercel AI SDK](https://sdk.vercel.ai/)
- **State Management:** [TanStack Query](https://tanstack.com/query)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Provider API Keys (OpenAI, Anthropic, or Google)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/mentis-ai.git
   cd mentis-ai
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add the required variables. Use the `.env.example` as a reference.
   ```env
   DATABASE_URL="postgresql://user:pass@localhost:5432/mentis"
   BETTER_AUTH_SECRET="your-auth-secret"
   BETTER_AUTH_URL="http://localhost:3000"
   ENCRYPTION_KEY="32-byte-hex-string-for-api-keys"
   ```

4. **Run Database Migrations**
   ```bash
   bun run db:push
   ```

5. **Start the Development Server**
   ```bash
   bun run dev
   ```
   The application will be available at `http://localhost:3000`.

## License

Mentis AI is open-sourced software licensed under the [MIT license](LICENSE).
