# Auth, Query Logging, Analytics & Role-Aware Responses

## Overview

Add user authentication, query logging, an admin analytics dashboard, and role-aware AI responses to the SSB chatbot. Uses Supabase for auth + database.

## Database Schema (Supabase Postgres)

### `profiles` table
Extends Supabase Auth users with app-specific data.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | FK to auth.users |
| email | text | from auth |
| name | text | set during onboarding |
| role | text | CD, AM, SPA, Mentor, Instructor |
| is_admin | boolean | default false |
| created_at | timestamptz | |

### `queries` table
Every chat interaction.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK to profiles |
| session_id | uuid | groups conversation turns |
| message | text | user's question |
| response | text | bot's response |
| sources | jsonb | KB sources returned |
| kb_results_count | int | number of KB matches |
| search_used | boolean | was web search triggered |
| input_tokens | int | |
| output_tokens | int | |
| response_time_ms | int | end-to-end latency |
| created_at | timestamptz | |

### Row Level Security
- Regular users: can only read their own queries
- Admins: can read all queries and profiles

## Auth Flow

### Signup restrictions
- Supabase Auth configured to allow signup only from `@summerspringboard.com` emails
- Admins can generate invite links that bypass the domain restriction (for instructors with university emails, contractors, etc.)

### User journey
1. Visit chatbot → see login screen (no chatbot visible until authed)
2. "Sign up" → enter @summerspringboard.com email → receive magic link or set password
3. First login → onboarding modal: enter name, pick role from dropdown
4. Subsequent visits → auto-logged in via Supabase session (persisted in localStorage)
5. Chat widget shows user's name, role badge

### Auth implementation
- Supabase JS client handles login/signup/session in the browser
- Every API request includes the Supabase access token in Authorization header
- API middleware validates the JWT and attaches user profile to the request
- No custom auth server needed — Supabase handles it all client-side

## Role-Aware Responses

### How it works
The user's role and name are injected into the system prompt as additional context. The role context is appended after the existing SYSTEM_PROMPT.

### Role contexts

**CD (Campus Director):**
"You're speaking with {name}, a Campus Director — the senior on-site leader at Berkeley. Don't tell them to escalate to themselves. Guide them on: delegating to AM/SPA, when to notify PD directly, how to manage their team's response. They make disciplinary decisions."

**AM (Academic Manager):**
"You're speaking with {name}, an Academic Manager — second-in-command to the CD. They manage academic programming and can handle most issues independently. Guide them on: when to loop in CD vs handle themselves, coordinating with instructors, academic scheduling decisions."

**SPA (Summer Program Assistant):**
"You're speaking with {name}, a Summer Program Assistant. They handle logistics, transport coordination, and on-the-ground operations. Guide them on: executing tasks assigned by CD/AM, what to escalate vs handle, proper documentation."

**Mentor (Resident Mentor):**
"You're speaking with {name}, a Resident Mentor — frontline staff living with students. They should escalate serious issues to CD. Guide them on: what they can handle independently (minor conflicts, homesickness check-ins), when to escalate immediately, proper incident documentation."

**Instructor:**
"You're speaking with {name}, an Instructor. They focus on academic delivery. Guide them on: classroom management, coordinating with AM for scheduling, when to flag student concerns to mentors/CD."

### Prompt injection
In `prompts.js`, add a function `buildRoleContext(user)` that returns the role string. This gets appended to the system prompt before sending to Claude.

## Admin Dashboard

### Access
- URL: `/admin`
- Protected: only users with `is_admin = true` in profiles
- Static HTML page with JS that fetches from admin API endpoints

### Dashboard sections

**Overview cards:**
- Total queries (all time)
- Queries today / this week
- Active users (queried in last 7 days)
- Avg response time

**Queries by person:**
- Table: name, role, query count, last active
- Click to expand → see their recent queries

**Queries by role:**
- Bar chart or table: how many queries per role
- What topics each role asks about most

**Common topics:**
- Derived from KB file matches in the sources field
- Table: topic (KB filename mapped to friendly name), query count

**Recent queries:**
- Scrollable feed of recent queries with user, message preview, timestamp
- Click to see full exchange

### API endpoints
- `GET /api/admin/overview` — aggregate stats
- `GET /api/admin/queries?page=1&user_id=&role=` — paginated query list with filters
- `GET /api/admin/users` — all users with query counts
- `GET /api/admin/topics` — KB topic frequency

All admin endpoints check `is_admin` on the requesting user.

## File Changes

### Modified files
- `js/chatbot-widget.js` — login/signup UI, auth token handling, onboarding flow, user name display
- `css/chatbot-widget.css` — login form styles, onboarding modal styles
- `api/src/routes/chat.js` — auth middleware, query logging, role injection
- `api/src/utils/prompts.js` — `buildRoleContext()` function
- `api/src/server.js` — mount new routes
- `package.json` (api) — add `@supabase/supabase-js`

### New files
- `api/src/services/database.js` — Supabase client, query logging functions
- `api/src/middleware/auth.js` — JWT validation middleware
- `api/src/routes/admin.js` — admin analytics endpoints
- `admin.html` — analytics dashboard page
- `css/admin.css` — dashboard styles

### New environment variables
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anonymous/public key
- `SUPABASE_SERVICE_KEY` — Supabase service role key (for admin operations)

## Setup Steps (one-time)
1. Create Supabase project
2. Run SQL to create tables + RLS policies
3. Configure auth: enable magic link, restrict to @summerspringboard.com
4. Add env vars to Vercel
5. Set initial admin user (Haneen's account)
