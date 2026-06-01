# Summer - SSB Staff Assistant

AI chatbot for Summer Springboard camp staff. Built with Next.js, Claude, and Supabase.

**Live:** https://ssb-chatbot-berkeley-2026.vercel.app

## What it does

Staff sign in with Google or magic link, ask questions about camp policies, schedules, emergencies, and student issues. The bot responds with accurate, sourced answers from a 50-file knowledge base covering everything from incident reporting to meal logistics.

- Role-aware responses (CD, AM, SPA, Mentor, Instructor get different guidance)
- Each user names their own bot
- Conversation history persists across devices (stored in Supabase)
- Campus memory: upload XLSX/CSV files to give the bot live data (schedules, rooming, mentor lists)
- Admin dashboard with AI-powered query analysis and session archiving

## Quick start

```bash
git clone https://github.com/Haneen-Azhar/ssb-chatbot-berkeley-2026.git
cd ssb-chatbot-berkeley-2026
npm install
cp .env.example .env.local  # fill in your keys
npm run dev                  # http://localhost:3000
```

### Environment variables

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Architecture

```
Next.js App Router (Vercel)
├── Frontend: React client component (app/page.js)
├── API Routes: /api/chat, /api/admin, /api/campus-memory
├── Auth: Supabase (Google OAuth + magic link)
├── Database: Supabase Postgres (profiles, queries, campus_memory)
├── AI: Anthropic Claude Sonnet 4
├── Knowledge Base: 50 markdown files (loaded at startup, keyword search)
└── CI/CD: GitHub Actions → Vercel auto-deploy
```

## Project structure

```
.
├── app/
│   ├── page.js                    # Main chat interface (login, chat, sidebar, settings)
│   ├── layout.js                  # Root layout (fonts, metadata, PWA)
│   ├── globals.css                # All styles (mobile-first)
│   ├── admin/page.js              # Admin analytics dashboard
│   ├── campus-memory/page.js      # Upload/manage campus-specific files
│   └── api/
│       ├── chat/route.js          # Non-streaming chat endpoint
│       ├── chat/stream/route.js   # SSE streaming chat endpoint
│       ├── chat/profile/route.js  # GET/PUT user profile
│       ├── chat/conversations/    # GET/DELETE conversation history
│       ├── chat/feedback/         # POST feedback
│       ├── admin/route.js         # Overview stats
│       ├── admin/queries/         # Paginated query list
│       ├── admin/users/           # User list with query counts
│       ├── admin/topics/          # KB topic frequency
│       ├── admin/analyze/         # AI-powered query analysis
│       ├── admin/sessions/        # Session archive/rename
│       ├── campus-memory/         # CRUD for campus context
│       ├── parse-file/            # Server-side XLSX/CSV parsing
│       └── health/                # Health check
├── lib/
│   ├── auth.js                    # JWT validation (getUser, requireAdmin)
│   ├── claude.js                  # Anthropic SDK (chat + streaming)
│   ├── database.js                # Supabase queries (profiles, queries, campus memory, admin)
│   ├── knowledgeBase.js           # KB loader + inverted index search
│   ├── prompts.js                 # System prompt + role context + bot naming
│   ├── rateLimit.js               # In-memory rate limiter (per IP)
│   ├── search.js                  # Web search (Tavily → Brave fallback)
│   ├── supabase.js                # Client factories (server + browser)
│   └── validation.js              # Input validation (message length, history)
├── knowledge_base/                # 50 markdown files
│   ├── 01_emergency_procedures.md
│   ├── ...
│   ├── scenarios/                 # behavioral, medical, mental_health, parent_issues
│   └── training/                  # mentorship, de-escalation, boundaries, wellness
├── tests/                         # 386 tests across 19 files
├── public/images/                 # Cal Bear mascot, avatars
├── supabase/                      # Schema SQL, email templates, config
├── .github/workflows/ci.yml       # CI pipeline (test + security audit)
└── next.config.mjs                # CORS, server packages
```

## Database schema

**profiles** - extends Supabase auth
- id, email, name, role (CD/AM/SPA/Mentor/Instructor/Other), bot_name, is_admin

**queries** - every chat interaction
- id, user_id, session_id, message, response, sources (JSONB), kb_results_count, search_used, input_tokens, output_tokens, response_time_ms, session_label

**campus_memory** - configurable context
- id, memory_type (text_block/file), title, content, file_name, file_type, uploaded_by

## Auth flow

1. Google Sign-In or magic link (restricted to @summerspringboard.com + invited emails)
2. First login → onboarding: set name, role, bot name
3. JWT token sent with every API request
4. `optionalAuth` on chat (works without login), `requireAdmin` on admin routes

## How the chat works

1. User sends message
2. Rate limit check (15/min per IP)
3. Input validation (5000 char max)
4. Knowledge base search (inverted index, top 5 results)
5. Web search (if query contains time-sensitive keywords)
6. Campus memory context loaded from Supabase
7. System prompt + role context + KB results + campus memory → Claude
8. Response streamed via SSE
9. Query logged to Supabase (async, never blocks response)

## Admin dashboard

Access: `/admin` (requires is_admin = true in profiles)

- Overview cards: total queries, today, this week, active users, avg response time
- Users table with expandable query history
- Topic frequency from KB source matches
- AI analysis: Claude analyzes all queries and reports confusion areas per role
- Session management: archive current queries, filter by session, rename sessions

## Campus memory

Access: `/campus-memory` (any authenticated user)

- Text block: free-form notes (contacts, building info, dining details)
- File uploads: XLSX, CSV, TXT, ODS, PDF
- XLSX files parsed server-side with sheet grouping (SCHEDULE, EXCURSIONS, STAFF, etc.)
- Content injected into system prompt on every chat request
- Delete = context immediately removed from next chat

## Testing

```bash
npm test          # run all 386 tests
npm run test:watch  # watch mode
```

19 test files covering:
- API routes (chat, stream, profile, feedback, admin, conversations, health)
- Auth (token validation, admin checks, null guards)
- Database (CRUD, query logging, admin analytics, session filtering)
- Knowledge base (loading, search relevance, source URL mapping)
- Prompts (system prompt, role context, bot naming, search triggers)
- Security (no secrets in code, CORS, auth on admin routes)
- Structure (all files exist, dependencies, manifest)
- PWA (manifest, viewport, apple-web-app)
- Rate limiting and input validation
- CI pipeline (workflow exists, correct config)
- KB completeness (every scenario, training, and policy file exists)

## CI/CD

Push to `main` triggers:
1. **GitHub Actions** - tests + security audit (secret scanning, npm audit, CORS check)
2. **Vercel** - auto-deploys to production

Branch protection on `main`: both CI checks must pass, no force pushes.

## Security

- Supabase Auth (Google OAuth + magic link)
- JWT validation on all API requests
- Row Level Security on Supabase tables
- Rate limiting: 15 chat/min, 10 auth/min, 30 admin/min per IP
- Input validation: 5000 char message limit, 30 history items max
- CORS restricted to deployment domain
- Secret scanning in CI (blocks commits with API keys)
- No secrets in git history

## Deployment

**Production:** Vercel (auto-deploy from GitHub `main` branch)
**Database:** Supabase (PostgreSQL + Auth)
**AI:** Anthropic Claude Sonnet 4
**Domain:** ssb-chatbot-berkeley-2026.vercel.app
