# 🚀 Quick Start Guide - Summer Springboard Chatbot (Team B)

Get up and running in 5 minutes!

## Step 1: Navigate to Folder

```bash
cd "team B bot"
```

## Step 2: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

## Step 2: Add API Keys

**Create `backend/.env`:**
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=3001
FRONTEND_URL=http://localhost:5173
```

Get your Anthropic API key: https://console.anthropic.com/

## Step 3: Add Logo

Copy Summer Springboard logo to:
```
frontend/public/ssb-logo.png
```

## Step 4: Run Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Step 5: Open Browser

Visit: **http://localhost:5173/**

---

## Test It!

Try asking:
- "What do I do in an earthquake?"
- "Who teaches Emergency Medicine?"
- "What's the daily schedule?"
- "Show me emergency contacts"

---

## Troubleshooting

**Backend won't start?**
- Make sure you added `ANTHROPIC_API_KEY` to `backend/.env`

**Frontend blank?**
- Check backend is running: http://localhost:3001/api/health
- Make sure logo exists: `frontend/public/ssb-logo.png`

**Can't connect?**
- Verify ports 3001 and 5173 aren't in use
- Check firewall settings

---

## Optional: Add Web Search

For real-time search capability:

1. Get Tavily API key: https://tavily.com/
2. Add to `backend/.env`:
```env
TAVILY_API_KEY=tvly-your-key-here
```

---

## Knowledge Base Location

The knowledge base is in the parent directory:
```
../knowledge_base/
```

All 10 .md files are automatically loaded when the backend starts.

---

That's it! You're ready to chat with Summer! 💬
