# Summer Springboard Chatbot - "Summer"

A beautiful, mobile-first AI chatbot for Summer Springboard's UC Berkeley 2026 program. Built with React, Express, and Claude AI.

![Summer Springboard Logo](frontend/public/ssb-logo.png)

## Features

✨ **Smart & Accurate**
- Powered by Anthropic's Claude Sonnet 4
- Access to comprehensive knowledge base (20,700+ words)
- Real-time web search capability
- Always cites sources with links

🎨 **Beautiful Mobile-First Design**
- Tailored for mobile with responsive desktop view
- Summer Springboard brand colors and logo
- Smooth animations and transitions
- Intuitive touch-friendly interface

💬 **Conversational & Helpful**
- Friendly "camp counselor" personality
- Strategic emoji usage (🚨 📚 📍 📞 ⚕️ 🏫 📅)
- Markdown-formatted responses
- Suggested follow-up questions

🚨 **Safety-First**
- Prioritizes emergency information
- Quick action buttons for urgent needs
- Clear escalation paths
- SSB 24/7 Helpline integration

📚 **Comprehensive Knowledge**
- Emergency procedures and contacts
- Staff schedules and policies
- Student arrival procedures
- Medical and healthcare resources
- Course information and instructors
- Program overview

---

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Anthropic API key ([get one here](https://console.anthropic.com/))
- Optional: Tavily or Brave Search API key for web search

### 1. Navigate to Team B Bot Folder

```bash
cd "team B bot"
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env and add your API keys
# Required: ANTHROPIC_API_KEY
# Optional: TAVILY_API_KEY or BRAVE_API_KEY
```

**Edit `backend/.env`:**
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here  # Optional
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file (optional - defaults to localhost:3001)
cp .env.example .env
```

**Edit `frontend/.env` (optional):**
```env
VITE_API_URL=http://localhost:3001
```

### 4. Add Summer Springboard Logo

Copy your SSB logo image to:
```
frontend/public/ssb-logo.png
```

Or use the one from the image you provided.

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
🚀 SSB Chatbot Backend running on port 3001
📝 Health check: http://localhost:3001/api/health
📚 Loaded 10 knowledge base files
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 6. Open in Browser

Visit: **http://localhost:5173/**

---

## Project Structure

```
team B bot/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── routes/
│   │   │   └── chat.js     # Chat API endpoints
│   │   ├── services/
│   │   │   ├── claude.js   # Anthropic Claude integration
│   │   │   ├── search.js   # Web search (Tavily/Brave)
│   │   │   └── knowledgeBase.js  # KB search & retrieval
│   │   ├── utils/
│   │   │   └── prompts.js  # System prompts & helpers
│   │   └── server.js       # Express server
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── frontend/                # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── QuickActions.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── TypingIndicator.jsx
│   │   │   └── InputArea.jsx
│   │   ├── utils/
│   │   │   └── api.js      # API client
│   │   ├── App.jsx         # Main app component
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Tailwind styles
│   ├── public/
│   │   └── ssb-logo.png    # Summer Springboard logo
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
├── CHATBOT_SPECS.md         # Comprehensive technical specs
├── README.md                # This file
├── QUICK_START.md           # 5-minute quickstart
└── SETUP_CHECKLIST.md       # Testing checklist
```

**Note:** Knowledge base is located in `../knowledge_base/` (parent directory)

---

## How It Works

### User Sends Message

1. **Frontend**: User types message and clicks send
2. **API Request**: Message sent to `/api/chat` with conversation history
3. **Backend Processing**:
   - Searches knowledge base for relevant context
   - Checks if web search needed (based on query keywords)
   - Calls search API if needed (Tavily or Brave)
   - Builds comprehensive prompt with KB context + search results
   - Sends to Anthropic Claude API
   - Parses response and extracts sources
4. **Response**: Frontend displays formatted response with:
   - Markdown rendering
   - Source citations (expandable)
   - Suggested follow-up questions
   - Copy and feedback buttons

### Knowledge Base Search

Simple keyword matching algorithm:
- Extracts keywords from user query
- Searches all `.md` files in `../knowledge_base/` (parent directory)
- Calculates relevance score based on keyword frequency and position
- Returns top 3 most relevant files with excerpts
- Provides full context to Claude for accurate responses

### Web Search (Optional)

Triggered when query contains keywords like:
- "latest", "current", "recent", "today"
- "search for", "find", "look up"

Search results integrated into Claude prompt for up-to-date information.

---

## API Endpoints

### `POST /api/chat`

Send a chat message and get AI response.

**Request:**
```json
{
  "message": "What do I do in an earthquake?",
  "history": [
    {"role": "user", "content": "previous question"},
    {"role": "assistant", "content": "previous answer"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "response": "🚨 During an earthquake:\n\n1. **DROP** to the floor...",
  "sources": [
    {
      "type": "kb",
      "file": "01_emergency_procedures.md",
      "confidence": "high"
    },
    {
      "type": "portal",
      "title": "Emergency Action Plan",
      "url": "https://sites.google.com/..."
    }
  ],
  "searchUsed": false,
  "suggestions": [
    "What's the Emergency Assembly Area?",
    "Who do I call after an earthquake?",
    "Where is the first aid kit?"
  ],
  "usage": {
    "inputTokens": 1523,
    "outputTokens": 412
  },
  "timestamp": "2026-05-23T12:00:00Z"
}
```

### `POST /api/chat/feedback`

Submit user feedback on a response.

**Request:**
```json
{
  "messageId": "123456789",
  "helpful": true,
  "comment": "Very helpful!"
}
```

### `GET /api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-23T12:00:00Z",
  "version": "1.0.0"
}
```

---

## Customization

### Change Brand Colors

Edit `frontend/tailwind.config.js`:

```javascript
colors: {
  ssb: {
    orange: '#F7941D',      // Primary orange
    blue: '#3A5F7D',        // Dark blue
    'light-blue': '#5B9BD5', // Light blue
    'lighter-blue': '#A5D8E6', // Lighter blue
  }
}
```

### Modify Chatbot Personality

Edit `backend/src/utils/prompts.js`:

```javascript
export const SYSTEM_PROMPT = `You are "Summer," ...`;
```

### Add/Update Knowledge Base

Add new `.md` files to `../knowledge_base/` folder (parent directory). The backend automatically loads all `.md` files on startup.

### Quick Actions

Edit `frontend/src/components/QuickActions.jsx`:

```javascript
const quickActions = [
  { icon: AlertCircle, label: 'Emergency', query: '...', color: 'bg-red-500' },
  // Add more...
];
```

---

## Deployment

### Frontend (Vercel)

```bash
cd frontend
npm run build

# Deploy to Vercel
vercel deploy --prod
```

Set environment variable:
- `VITE_API_URL`: Your backend API URL

### Backend (Render/Railway/Heroku)

```bash
cd backend

# Build command: npm install
# Start command: npm start
```

Set environment variables:
- `ANTHROPIC_API_KEY`: Your Anthropic API key
- `TAVILY_API_KEY` or `BRAVE_API_KEY`: Optional search API key
- `PORT`: 3001 (or assigned by platform)
- `NODE_ENV`: production
- `FRONTEND_URL`: Your frontend URL (for CORS)

---

## Cost Estimates

**Anthropic Claude API:**
- Model: Claude Sonnet 4
- ~$3/million input tokens, ~$15/million output tokens
- Average query: 2K input, 500 output
- **1000 queries/month ≈ $10-15**

**Search API (Optional):**
- Tavily: Free tier 1000 searches/month or $0.001/search
- Brave: Free tier 2000 searches/month
- **Estimate: $0-5/month**

**Hosting:**
- Vercel: Free for frontend
- Render/Railway: Free tier or ~$7/month
- **Estimate: $0-7/month**

**Total: ~$15-25/month for moderate usage**

---

## Troubleshooting

### Backend won't start

**Error: `ANTHROPIC_API_KEY is not defined`**
- Make sure you created `backend/.env` file
- Copy from `.env.example` and add your API key
- Restart the server

**Error: `Cannot find module '@anthropic-ai/sdk'`**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

**Error: `Failed to load knowledge base`**
- Make sure `../knowledge_base/` folder exists (parent directory)
- Check that `.md` files are present
- Verify path in `backend/src/services/knowledgeBase.js`

### Frontend won't start

**Error: `Cannot find module 'react'`**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Blank page / Logo not showing**
- Make sure `frontend/public/ssb-logo.png` exists
- Check browser console for errors
- Verify backend is running on port 3001

### API connection issues

**Error: `Failed to send message`**
- Check backend is running: http://localhost:3001/api/health
- Check CORS settings in `backend/src/server.js`
- Verify `VITE_API_URL` in frontend `.env`

### Web search not working

- Web search is optional - chatbot works without it
- Check API key is set: `TAVILY_API_KEY` or `BRAVE_API_KEY`
- Verify API key is valid
- Check console logs for search errors

### Knowledge base not loading

**Error: `Failed to load knowledge base`**
- Verify `../knowledge_base/` folder exists in parent directory
- Check that all 10 .md files are present
- Path should be: `../../knowledge_base` from backend/src/services/

---

## Testing

### Quick Test Queries

Try these to test different features:

**Emergency (should prioritize safety):**
- "What do I do in an earthquake?"
- "Emergency contacts"
- "Call 911"

**Knowledge Base (should cite sources):**
- "What time is bed check?"
- "Who teaches Emergency Medicine?"
- "What's in the first aid kit?"

**Web Search (if enabled):**
- "Latest news about UC Berkeley"
- "Current weather in Berkeley"

**Sources & Links:**
- Check that responses include 📚 Sources
- Verify links are clickable and formatted correctly

---

## Future Enhancements

- [ ] Voice input/output
- [ ] File upload (images, PDFs)
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Export chat history
- [ ] Push notifications
- [ ] Calendar integration
- [ ] Vector embeddings for better search (ChromaDB/Pinecone)

---

## Support

**For technical issues:**
- Check troubleshooting section above
- Review CHATBOT_SPECS.md for detailed architecture
- Check browser console and backend logs

**For Summer Springboard program questions:**
- **SSB 24/7 Helpline:** +1.858.779.0555
- **Program Director:** Claudine Jones - 760-579-1822
- **Campus Directors:** See knowledge base for contact info

---

## License

MIT License - feel free to modify and use for your program!

---

## Credits

**Built with:**
- [Anthropic Claude](https://www.anthropic.com/) - AI language model
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Express](https://expressjs.com/) - Backend API
- [Lucide React](https://lucide.dev/) - Icons

**Created for:**
Summer Springboard UC Berkeley 2026

---

**Questions or feedback?** Contact the development team or submit an issue.

Happy chatting! 💬✨
