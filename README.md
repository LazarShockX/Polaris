# ❄️ Polaris - Cursor AI Clone

Polaris is a browser-based IDE inspired by Cursor AI, combining real-time collaborative code editing with AI-powered development tools. It features intelligent code suggestions and quick edits via Cmd+K, a conversational AI assistant, and in-browser code execution powered by WebContainer. Polaris also supports GitHub import and export, along with multi-file project management for seamless development across entire projects. Check out the app on Vercel: [polaris-gamma-bay.vercel.app/](https://polaris-gamma-bay.vercel.app/)

<p align="center">
  <img width="1436" height="774" alt="Screenshot 2026-10-16 at 14 39 02" src="https://github.com/user-attachments/assets/617f4727-836b-4cae-98f2-0c5816d9af4d" />
</p>

**Note:** AI features, such as code generation, are unavailable when the associated OpenAI account has insufficient credits.

## ✨ Features

### AI-Powered App Building
- Real-time code suggestions with ghost text
- Quick edit with Cmd+k to select code and natural language instruction
- Live preview and read-only terminal
- Project and conversation history alongside generated code files
- Credit system with usage tracking

### Editor
- Syntax highlighting for JS, TS, CSS, HTML, JSON, Markdown, and Python
- Line numbers and code folding
- Minimap overview
- Bracket matching and indentation guides
- Multi-cursor editing

### File Management
- File explorer with folder hierarchy
- CRUD operations for files and folders
- VSCode-style file icons
- Tab-based file navigation
- Auto-save with debouncing

### Real-time
- Convex-powered instant updates
- Optimistic mutations
- Background job processing with Inngest

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - Build interactive UI with reusable components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling

### Backend & Database
- **[Convex](https://www.convex.dev/)** - Real-time DB
- **[Inngest](https://www.inngest.com/)** - Background job processing and agent networks

### Editor
- **[CodeMirror](https://codemirror.net/)** - Code editor component for web browsers that supports syntax highlighting and extensive customization
- **Custom Extensions**
- **One Dark Theme**

### Execution
- **[WebContainer API](https://webcontainers.io/)** - Browser-based runtime environment developed by StackBlitz that allows Node.js applications and operating system commands to run directly inside a browser tab
- **[xterm.js](https://xtermjs.org/)** - Frontend component that brings fully-featured terminals to users in the browser

### AI
- **OpenAI** - Code generation and code suggestions

### Auth and Billing
- **[Clerk](https://clerk.com/)** - Authentication system and subscription billing

### Additional Tools
- **[Firecrawl](https://www.firecrawl.dev/)** - Web scraping tool that turns websites into LLM-ready markdown
- **[Sentry](https://sentry.io/)** - Error monitoring tool
- **shadcn/ui** - Customizable and reusable components
- **Tanstack Form** - Form handling and validation
- **Zod** - TypeScript-first validation library
- **Zustand** - Global state management library

## 🚀 Getting Started

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Convex
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=
POLARIS_CONVEX_INTERNAL_KEY=

# AI
OPENAI_API_KEY=

# Firecrawl (optional)
FIRECRAWL_API_KEY=

# Sentry (optional)
SENTRY_AUTH_TOKEN=
```

### Available Scripts

- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run start` - Start production server
- `npx convex dev` - Start Convex development server
- `npx inngest-cli@latest dev` - Run Inngest Dev Server
