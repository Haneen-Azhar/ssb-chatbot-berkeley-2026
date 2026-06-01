# Claude Code Project Guide

## What this project is

An AI chatbot for Summer Springboard camp staff at UC Berkeley. Staff sign in, ask questions about policies/emergencies/schedules, and get accurate answers from a knowledge base. Built as a single Next.js app with Supabase for auth and database, Claude for AI responses.

## Critical rules

- **Run `npm test` before every commit.** 386+ tests must pass. No exceptions.
- **Never hardcode API keys.** Use environment variables only. The CI pipeline scans for secrets.
- **Never modify the knowledge base files** without understanding the source mapping in `lib/knowledgeBase.js`.
- **The main chat UI is one file:** `app/page.js` (~1400 lines). It's a single React client component. Don't split it into separate files without a plan.
- **Branch protection is on.** Both CI checks (Test & Build + Security Audit) must pass before code reaches main.

## How to run

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # run all tests
npm run build   # production build
```

Requires `.env.local` with: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

## Architecture decisions

**Why one page.js file?** The entire chat app (auth, login, onboarding, chat, sidebar, settings) is in `app/page.js`. This was a deliberate choice - it's a single-page chat app where all state is interconnected (auth state affects chat, chat affects sidebar, settings affect prompts). Splitting into components would require prop drilling or context providers for no real benefit at this scale.

**Why Supabase, not a custom auth?** Supabase gives us Google OAuth, magic links, JWT validation, Row Level Security, and a Postgres database in one service. The free tier handles our scale (50-150 users) easily.

**Why file-based knowledge base, not a database?** The KB is 50 static markdown files that rarely change. Loading them into memory at startup and building an inverted index gives sub-millisecond search. No database round-trip needed. Dynamic content goes in campus_memory (Supabase table).

**Why in-memory rate limiting?** Simple, zero-cost, works for current scale. Known limitation: doesn't persist across Vercel serverless instances. Should migrate to Redis (Upstash) before enterprise deployment.

**Why SSE streaming, not WebSockets?** Next.js API routes don't support WebSockets natively. SSE works through standard HTTP, no special server config needed, and Vercel supports it.

## Key files and what they do

### Frontend
- `app/page.js` - The entire chat app. Auth flow (login/onboarding/chat views), Supabase client, message sending/receiving, conversation management, settings, sidebar.
- `app/globals.css` - All styles, mobile-first. Sidebar, chat bubbles, login, onboarding, settings, input bar.
- `app/admin/page.js` - Admin analytics dashboard. Session filtering, AI analysis, user/topic/query views.
- `app/campus-memory/page.js` - Upload and manage campus-specific files/text.
- `app/layout.js` - Root layout. Fonts, metadata, PWA manifest, viewport config.

### API Routes
- `app/api/chat/stream/route.js` - **Main endpoint the frontend calls.** SSE streaming. Auth → validate → KB search → web search → campus memory → build prompt → stream Claude response → log query.
- `app/api/chat/route.js` - Non-streaming version of the above.
- `app/api/chat/profile/route.js` - GET/PUT user profile (name, role, bot_name).
- `app/api/chat/conversations/route.js` - GET conversations from Supabase, DELETE individual conversations.
- `app/api/admin/*` - All require `requireAdmin`. Overview, queries, users, topics, analyze, sessions.
- `app/api/campus-memory/route.js` - CRUD for campus-specific context.
- `app/api/parse-file/route.js` - Server-side XLSX/CSV parsing. Strips empty rows, groups sheets by type.

### Libraries
- `lib/prompts.js` - System prompt (voice, rules, contacts, incident handling), `buildRoleContext(user)` for role-aware responses, `buildUserPrompt()` for KB/search context injection.
- `lib/knowledgeBase.js` - Loads all .md files from `knowledge_base/`, builds inverted index, `searchKnowledgeBase(query)` returns top 5 results with source URLs.
- `lib/database.js` - All Supabase operations. Profile CRUD, query logging, admin analytics (overview, queries, users, topics), campus memory CRUD. All functions accept `sessionFilter` for session-scoped analytics.
- `lib/auth.js` - `getUser(request)` validates JWT and returns user+profile. `requireAdmin(request)` checks is_admin.
- `lib/claude.js` - Anthropic SDK wrapper. `getChatResponse()` and `getChatResponseStream()`. Uses prompt caching on system prompt.
- `lib/rateLimit.js` - In-memory sliding window rate limiter. Pre-configured: chatLimiter (15/min), authLimiter (10/min), adminLimiter (30/min).
- `lib/validation.js` - `validateChatInput()` checks message length (5000 max), history length (30 max).

### Knowledge Base
- `knowledge_base/` - 50 markdown files. Core policies (01-13), scenarios (behavioral, medical, mental_health, parent_issues), training materials.
- Source URL mapping is in `lib/knowledgeBase.js` (lines 158-460). Maps each KB file to specific SSB Manual and Staff Portal pages.
- The KB loader only reads `.md` files, skips README and SOURCES files.

## How auth works

1. Frontend creates Supabase client with `NEXT_PUBLIC_*` env vars
2. User signs in via Google OAuth or magic link
3. Supabase stores session in localStorage
4. Every API request includes `Authorization: Bearer <access_token>`
5. API routes call `getUser(request)` which validates the JWT with Supabase and fetches the user's profile
6. Chat routes use `optionalAuth` (works without login too)
7. Admin routes use `requireAdmin` (checks is_admin on profile)

## How the system prompt works

The system prompt is built in layers:
1. **Base prompt** (`SYSTEM_PROMPT` in prompts.js) - voice, rules, terminology, contacts, incident handling protocol
2. **Role context** (`buildRoleContext(user)`) - appended based on user's role. Tells Claude the user's name, role, and how to adjust guidance. Also sets the bot's custom name.
3. **Campus memory** (`getCampusMemoryContext()`) - appended from Supabase campus_memory table. Uploaded schedules, rooming lists, etc.
4. **KB context** (injected into user prompt via `buildUserPrompt()`) - top 5 search results from the knowledge base with source URLs.

## How conversations persist

- Queries are logged to Supabase's `queries` table after every response (fire-and-forget, never blocks)
- On login, frontend fetches `GET /api/chat/conversations` which groups queries by `session_id`
- Sidebar shows past conversations from this data
- Delete calls `DELETE /api/chat/conversations?session_id=X`
- No localStorage dependency - works across devices/browsers

## How sessions work (admin)

- `queries.session_label` column: null = current session, string = archived session
- "End Session" labels all null queries with a name (e.g., "Berkeley B Session 1 - June 2026")
- Admin dashboard filters all data by session_label
- `applySessionFilter()` in database.js handles the filtering logic

## Testing patterns

- Tests use `vitest` with globals enabled
- Mocking: `vi.mock()` for modules, `vi.hoisted()` for mock variables that need to exist before imports
- API route tests: import the handler, create `new Request()`, call it directly
- Supabase mocked with chainable query builders (`.from().select().eq().is()`)
- KB tests are integration tests (load real files from disk)
- Security tests scan actual source files for patterns

## Common gotchas

- **Supabase client in `app/page.js`** has a `typeof window !== 'undefined'` guard. Without this, the build fails (SSR tries to initialize Supabase without browser APIs).
- **In-app browser detection** (WhatsApp, Instagram) renders a static "open in Safari/Chrome" page before any React/Supabase code runs. This prevents crashes in limited JS environments.
- **The `applySessionFilter()` function** chains `.is('session_label', null)` for current session queries. Test mocks need `.is()` on their mock builders or tests fail.
- **`getCampusMemoryContext()`** reads fresh from Supabase on every request. No caching. When you delete campus memory, it's gone from the next chat immediately.
- **The XLSX parser** strips empty rows and skips sheets with less than 2 non-empty rows. It groups sheets by detected type (SCHEDULE, EXCURSIONS, STAFF, etc.).

## Environment

- **Node.js**: 22+ (CI uses 22)
- **Next.js**: 16.2.6 (App Router, Turbopack)
- **Deployment**: Vercel (auto-deploy from GitHub main)
- **Database**: Supabase PostgreSQL
- **AI**: Anthropic Claude Sonnet 4 (claude-sonnet-4-20250514)
