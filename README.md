# SSB Chatbot - Berkeley 2026

AI-powered assistant for Summer Springboard staff at UC Berkeley.

## Quick Start

**One command to run everything:**

```bash
cd "/Users/haneenazhar/Desktop/Claude Code/Chatbot"
./start.sh
```

Then open: **http://localhost:8765/**

## What It Does

- Real-time streaming responses (words appear as Claude writes)
- 51 knowledge base files (636 pages of Director Training)
- Intelligent follow-up questions for nuanced situations
- Mobile-optimized with elegant gradient design
- Complete scenario playbooks for:
  - Medical emergencies (anaphylaxis, diabetes, seizures, etc.)
  - Behavioral issues (fighting, substances, harassment, etc.)
  - Mental health crises (suicidal ideation, panic attacks, etc.)
  - Parent issues (angry parents, legal threats, refund demands, etc.)

## Staff Info

- **CD:** Liz (Campus Director)
- **PD:** Claudine Jones (760-579-1822)
- **DoCO:** Tracy

## Manual Commands

If you want to run things separately:

**Backend:**
```bash
cd "team B bot/backend"
npm start
```

**Frontend:**
```bash
cd "Berkeley-Portal-Reconstruction"
python3 -m http.server 8765
```

## Stop Everything

```bash
lsof -ti:3001,8765 | xargs kill -9
```

## Logs

```bash
tail -f /tmp/ssb-backend.log
tail -f /tmp/ssb-frontend.log
```

## Tech Stack

- **Frontend:** Vanilla JS, HTML5, CSS3 (mobile-first)
- **Backend:** Node.js/Express, Claude Sonnet 4.5
- **Knowledge Base:** 51 markdown files with metadata tags
- **Search:** Inverted index with phrase matching
- **Streaming:** Server-Sent Events (SSE)

## Features

✅ Real-time streaming responses
✅ Smart contextual questioning
✅ Mobile-optimized design
✅ Gradient background
✅ Glass-morphism effects
✅ Enhanced search with tags
✅ Prompt caching (90% faster responses)
✅ 636 pages of training content indexed
