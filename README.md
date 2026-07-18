# Mentis AI

An elegant, fast, and feature-rich AI assistant built with Next.js, React, Tailwind CSS, and Better Auth.

## Features

- **Modern Chat Interface**: Streaming responses, markdown rendering, and syntax highlighting.
- **Dynamic Model Selection**: Select between OpenAI, Anthropic, and Google Gemini models easily.
- **Provider Management**: Manage your own API keys securely.
- **Full History & Persistence**: Your chat histories are securely saved in a PostgreSQL database using Drizzle ORM.
- **User Authentication**: Handled seamlessly by Better Auth.
- **Responsive Design**: Polished, animated, and fully responsive on desktop and mobile.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: PostgreSQL (via Neon) + Drizzle ORM
- **Authentication**: Better Auth
- **AI SDK**: Vercel AI SDK
- **Icons**: Hugeicons

## Getting Started

1. Clone the repository
2. Install dependencies with `bun install`
3. Setup `.env` based on `.env.example`:
   ```bash
   DATABASE_URL="postgres://..."
   BETTER_AUTH_SECRET="your-secret"
   BETTER_AUTH_URL="http://localhost:3000"
   ```
4. Push database schema: `bunx drizzle-kit push`
5. Run the dev server: `bun dev`

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Production Checklist

Mentis AI is configured with production-ready features:
- Global Error Boundaries
- Centralized Structured Logging
- Memory Rate Limiting on critical endpoints
- Strict Security Headers (HSTS, X-Frame-Options)
- SEO Optimized (Manifest, Robots.txt, Open Graph)
- Fully accessible and responsive.

## Deployment

Mentis AI can be easily deployed to Vercel or any other Node.js hosting platform. Ensure your environment variables are configured in the dashboard before deploying.
