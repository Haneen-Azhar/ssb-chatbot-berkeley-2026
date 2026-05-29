# Auth, Query Logging, Analytics & Role-Aware Responses - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase-backed auth, query logging, admin analytics, and role-aware AI responses to the SSB chatbot.

**Architecture:** Supabase provides auth (Google OAuth + magic link) and Postgres database. The Express API validates JWTs via middleware, logs every query, and injects role context into Claude prompts. Frontend gets a login screen, onboarding flow, and settings panel. A separate /admin page shows analytics.

**Tech Stack:** Supabase (auth + Postgres), Express.js, Anthropic Claude SDK, vanilla JS frontend, Vercel serverless

---

## Task 1: Supabase Setup & Database Service

**Files:**
- Create: `api/src/services/database.js`
- Create: `api/supabase-schema.sql`
- Modify: `api/package.json`

- [ ] **Step 1: Install Supabase client**

```bash
cd api && npm install @supabase/supabase-js
```

- [ ] **Step 2: Create the SQL schema file**

Create `api/supabase-schema.sql` with the full schema: profiles table, queries table, RLS policies, and the domain-check trigger for auth. This file is run once in the Supabase SQL editor.

```sql
-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  role text check (role in ('CD', 'AM', 'SPA', 'Mentor', 'Instructor')),
  bot_name text default 'Summer',
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Queries table
create table public.queries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  session_id uuid not null,
  message text not null,
  response text,
  sources jsonb default '[]',
  kb_results_count int default 0,
  search_used boolean default false,
  input_tokens int default 0,
  output_tokens int default 0,
  response_time_ms int default 0,
  created_at timestamptz default now()
);

-- Indexes for analytics queries
create index idx_queries_user_id on public.queries(user_id);
create index idx_queries_created_at on public.queries(created_at desc);
create index idx_queries_session_id on public.queries(session_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.queries enable row level security;

-- Profiles: users can read/update their own profile, admins can read all
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Queries: users can read own queries, admins can read all
create policy "Users can view own queries"
  on public.queries for select
  using (auth.uid() = user_id);

create policy "Service role can insert queries"
  on public.queries for insert
  with check (true);

create policy "Admins can view all queries"
  on public.queries for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
```

- [ ] **Step 3: Create database service**

Create `api/src/services/database.js`:

```javascript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase credentials not configured — database features disabled');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function getProfile(userId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

export async function updateProfile(userId, updates) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }
  return data;
}

export async function logQuery({ userId, sessionId, message, response, sources, kbResultsCount, searchUsed, inputTokens, outputTokens, responseTimeMs }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('queries')
    .insert({
      user_id: userId,
      session_id: sessionId,
      message,
      response,
      sources,
      kb_results_count: kbResultsCount,
      search_used: searchUsed,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      response_time_ms: responseTimeMs
    })
    .select()
    .single();
  if (error) {
    console.error('Error logging query:', error);
  }
  return data;
}

export async function getAdminOverview() {
  if (!supabase) return null;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [totalResult, todayResult, weekResult, usersResult, avgTimeResult] = await Promise.all([
    supabase.from('queries').select('id', { count: 'exact', head: true }),
    supabase.from('queries').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
    supabase.from('queries').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
    supabase.from('queries').select('user_id').gte('created_at', weekStart),
    supabase.from('queries').select('response_time_ms').not('response_time_ms', 'is', null)
  ]);

  const activeUserIds = new Set((usersResult.data || []).map(q => q.user_id));
  const times = (avgTimeResult.data || []).map(q => q.response_time_ms).filter(Boolean);
  const avgResponseTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  return {
    totalQueries: totalResult.count || 0,
    queriesToday: todayResult.count || 0,
    queriesThisWeek: weekResult.count || 0,
    activeUsers: activeUserIds.size,
    avgResponseTimeMs: avgResponseTime
  };
}

export async function getAdminQueries({ page = 1, pageSize = 50, userId, role }) {
  if (!supabase) return { data: [], count: 0 };
  let query = supabase
    .from('queries')
    .select('*, profiles!inner(name, role, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (userId) query = query.eq('user_id', userId);
  if (role) query = query.eq('profiles.role', role);

  const { data, count, error } = await query;
  if (error) {
    console.error('Error fetching admin queries:', error);
    return { data: [], count: 0 };
  }
  return { data: data || [], count: count || 0 };
}

export async function getAdminUsers() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, bot_name, is_admin, created_at')
    .order('name');
  if (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }

  const { data: queryCounts } = await supabase
    .from('queries')
    .select('user_id, created_at');

  const userStats = {};
  (queryCounts || []).forEach(q => {
    if (!userStats[q.user_id]) {
      userStats[q.user_id] = { count: 0, lastActive: null };
    }
    userStats[q.user_id].count++;
    if (!userStats[q.user_id].lastActive || q.created_at > userStats[q.user_id].lastActive) {
      userStats[q.user_id].lastActive = q.created_at;
    }
  });

  return (data || []).map(user => ({
    ...user,
    queryCount: userStats[user.id]?.count || 0,
    lastActive: userStats[user.id]?.lastActive || null
  }));
}

export async function getAdminTopics() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('queries')
    .select('sources')
    .not('sources', 'is', null);

  if (error) {
    console.error('Error fetching topics:', error);
    return [];
  }

  const topicCounts = {};
  (data || []).forEach(row => {
    const sources = row.sources || [];
    sources.forEach(source => {
      if (source.file) {
        const friendly = source.file
          .replace(/^\d+_/, '')
          .replace(/\.md$/, '')
          .replace(/_/g, ' ')
          .replace(/^scenarios\//, '')
          .replace(/^training\//, 'Training: ');
        topicCounts[friendly] = (topicCounts[friendly] || 0) + 1;
      }
    });
  });

  return Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);
}

export { supabase };
```

- [ ] **Step 4: Commit**

```bash
git add api/package.json api/package-lock.json api/supabase-schema.sql api/src/services/database.js
git commit -m "feat: add Supabase database service and schema"
```

---

## Task 2: Auth Middleware

**Files:**
- Create: `api/src/middleware/auth.js`

- [ ] **Step 1: Create auth middleware**

Create `api/src/middleware/auth.js`:

```javascript
import { createClient } from '@supabase/supabase-js';
import { getProfile } from '../services/database.js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase not configured — skipping auth');
    req.user = null;
    return next();
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    const profile = await getProfile(user.id);
    req.user = { ...user, profile };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

export async function requireAdmin(req, res, next) {
  await requireAuth(req, res, () => {
    if (!req.user?.profile?.is_admin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
  });
}

export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ') || !supabaseUrl || !supabaseAnonKey) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (!error && user) {
      const profile = await getProfile(user.id);
      req.user = { ...user, profile };
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
}
```

- [ ] **Step 2: Commit**

```bash
git add api/src/middleware/auth.js
git commit -m "feat: add auth middleware (requireAuth, requireAdmin, optionalAuth)"
```

---

## Task 3: Role-Aware Prompts

**Files:**
- Modify: `api/src/utils/prompts.js`

- [ ] **Step 1: Add buildRoleContext function**

Add this function at the end of `prompts.js`, before the closing of the file:

```javascript
const ROLE_CONTEXTS = {
  CD: (name) => `You're speaking with ${name}, a Campus Director — the senior on-site leader at Berkeley. Don't tell them to escalate to themselves. Guide them on: delegating to AM/SPA, when to notify PD directly, how to manage their team's response. They make disciplinary decisions. Address them as a peer leader, not a subordinate.`,
  AM: (name) => `You're speaking with ${name}, an Academic Manager — second-in-command to the CD. They manage academic programming and can handle most issues independently. Guide them on: when to loop in CD vs handle themselves, coordinating with instructors, academic scheduling decisions.`,
  SPA: (name) => `You're speaking with ${name}, a Summer Program Assistant. They handle logistics, transport coordination, and on-the-ground operations. Guide them on: executing tasks assigned by CD/AM, what to escalate vs handle, proper documentation.`,
  Mentor: (name) => `You're speaking with ${name}, a Resident Mentor — frontline staff living with students. They should escalate serious issues to CD. Guide them on: what they can handle independently (minor conflicts, homesickness check-ins), when to escalate immediately, proper incident documentation.`,
  Instructor: (name) => `You're speaking with ${name}, an Instructor. They focus on academic delivery. Guide them on: classroom management, coordinating with AM for scheduling, when to flag student concerns to mentors/CD.`
};

export function buildRoleContext(user) {
  if (!user) return '';

  const name = user.name || 'staff member';
  const botName = user.bot_name || 'Summer';
  const role = user.role;

  let context = `\n\nUSER PERSONALIZATION:\nYour name is ${botName}.`;

  if (role && ROLE_CONTEXTS[role]) {
    context += `\n${ROLE_CONTEXTS[role](name)}`;
  } else {
    context += `\nYou're speaking with ${name}.`;
  }

  context += `\nUse their name naturally in conversation. Greet them warmly on first message.`;

  return context;
}
```

- [ ] **Step 2: Commit**

```bash
git add api/src/utils/prompts.js
git commit -m "feat: add role-aware prompt builder with per-user bot naming"
```

---

## Task 4: Update Chat Routes (Auth + Logging + Role Context)

**Files:**
- Modify: `api/src/routes/chat.js`

- [ ] **Step 1: Update chat.js with auth, logging, and role injection**

Replace the full contents of `api/src/routes/chat.js`. The key changes:
- Import auth middleware and database service
- Use `optionalAuth` middleware (graceful degradation if no token)
- Build system prompt with role context when user is authenticated
- Log queries to Supabase after response completes
- Track response time
- Accept `sessionId` from the client

The streaming endpoint (`/stream`) gets the same treatment: auth, role context in the prompt, and async query logging after the stream ends.

The profile endpoints (`GET /profile`, `PUT /profile`) let the frontend read and update the user's name, role, and bot_name.

- [ ] **Step 2: Commit**

```bash
git add api/src/routes/chat.js
git commit -m "feat: add auth, query logging, and role-aware prompts to chat routes"
```

---

## Task 5: Admin API Routes

**Files:**
- Create: `api/src/routes/admin.js`
- Modify: `api/src/server.js`

- [ ] **Step 1: Create admin routes**

Create `api/src/routes/admin.js` with four endpoints:
- `GET /api/admin/overview` — aggregate stats (total queries, today, this week, active users, avg response time)
- `GET /api/admin/queries` — paginated query list with optional `user_id` and `role` filters
- `GET /api/admin/users` — all users with query counts and last active
- `GET /api/admin/topics` — KB topic frequency from sources JSON

All endpoints use `requireAdmin` middleware.

- [ ] **Step 2: Mount admin routes in server.js**

Add to `api/src/server.js`:
```javascript
import adminRoutes from './routes/admin.js';
app.use('/api/admin', adminRoutes);
```

- [ ] **Step 3: Commit**

```bash
git add api/src/routes/admin.js api/src/server.js
git commit -m "feat: add admin analytics API endpoints"
```

---

## Task 6: Frontend Auth & Onboarding

**Files:**
- Modify: `js/chatbot-widget.js`
- Modify: `css/chatbot-widget.css`
- Modify: `index.html` (add Supabase CDN script)

- [ ] **Step 1: Add Supabase CDN script to all HTML pages**

Add before the chatbot-widget.js script tag in every HTML file:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
```

- [ ] **Step 2: Update chatbot-widget.js**

Major changes to the ChatbotWidget class:
- Add Supabase client initialization in constructor
- Add `checkAuth()` method — checks for existing session on load
- Add `showLoginScreen()` — renders login UI with Google Sign-In button, magic link input, and Cal Bear full-body image. Note says "Use your @summerspringboard.com email"
- Add `handleGoogleSignIn()` — calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Add `handleMagicLink(email)` — calls `supabase.auth.signInWithOtp({ email })`
- Add `showOnboarding()` — modal with name input, role dropdown (CD/AM/SPA/Mentor/Instructor), bot name input (default "Summer")
- Add `saveProfile()` — PUT to `/api/chat/profile`
- Add `showSettings()` — settings panel to update name, role, bot name
- Modify `createWidget()` — show user name + role badge in header, settings gear icon
- Modify `sendMessage()` — include auth token in fetch headers, include `sessionId`
- Modify `addWelcomeMessage()` — use the user's bot name and their name
- Update avatar image paths from `images/ssb-avatar.png` to `images/cal-bear-avatar.webp`
- Add `sessionId` property (UUID generated per browser session)
- Add `signOut()` method

- [ ] **Step 3: Update chatbot-widget.css**

Add styles for:
- Login screen (centered card with Cal Bear mascot, Google button, magic link form)
- Onboarding modal (overlay, form fields, role dropdown)
- Settings panel (slide-out panel with form fields)
- User info in header (name, role badge with color per role)
- Google Sign-In button (white background, Google colors)

- [ ] **Step 4: Commit**

```bash
git add js/chatbot-widget.js css/chatbot-widget.css index.html schedules-groups-lists.html important-resources.html cdamspa-resources.html course-specific-info.html
git commit -m "feat: add auth login screen, onboarding, settings, and role-aware UI"
```

---

## Task 7: Admin Dashboard Page

**Files:**
- Create: `admin.html`
- Create: `css/admin.css`

- [ ] **Step 1: Create admin.html**

Static HTML page with:
- Supabase CDN script for auth check
- Auth gate: if not logged in or not admin, redirect to index
- Overview cards section (total queries, today, this week, active users, avg response time)
- Users table with expandable rows showing recent queries
- Role breakdown section
- Common topics table
- Recent queries feed
- All data fetched via JS from `/api/admin/*` endpoints with auth token

- [ ] **Step 2: Create css/admin.css**

Dashboard styles:
- Card grid layout for overview stats
- Data tables with alternating row colors
- Expandable rows for user query details
- Responsive layout (cards stack on mobile)
- Berkeley blue/gold color scheme consistent with portal

- [ ] **Step 3: Commit**

```bash
git add admin.html css/admin.css
git commit -m "feat: add admin analytics dashboard"
```

---

## Task 8: Environment Variables & Deployment

**Files:**
- Create: `api/.env.example`

- [ ] **Step 1: Create .env.example**

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
TAVILY_API_KEY=tvly-...
BRAVE_API_KEY=BSA...
```

- [ ] **Step 2: Add env vars to Vercel**

```bash
cd /Users/haneenazhar/Desktop/Claude\ Code/Chatbot
echo -n "SUPABASE_URL_VALUE" | vercel env add SUPABASE_URL production
echo -n "SUPABASE_ANON_KEY_VALUE" | vercel env add SUPABASE_ANON_KEY production
echo -n "SUPABASE_SERVICE_KEY_VALUE" | vercel env add SUPABASE_SERVICE_KEY production
```

- [ ] **Step 3: Deploy and test**

```bash
vercel --prod
```

- [ ] **Step 4: Commit .env.example**

```bash
git add api/.env.example
git commit -m "feat: add .env.example with all required variables"
```
