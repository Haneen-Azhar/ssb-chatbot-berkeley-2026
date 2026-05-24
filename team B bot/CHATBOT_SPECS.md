# Summer Springboard Chatbot - Technical Specifications

## Overview

A mobile-first chatbot for Summer Springboard UC Berkeley 2026 staff and students, providing instant access to program information with real-time web search capabilities.

---

## Design Specifications

### Brand Colors (from logo)
- **Primary Orange:** `#F7941D` - Main accent, CTAs, user messages
- **Dark Blue:** `#3A5F7D` - Secondary, bot messages, headers
- **Light Blue:** `#5B9BD5` - Accents, links
- **Lighter Blue:** `#A5D8E6` - Subtle backgrounds
- **White:** `#FFFFFF` - Main background
- **Light Gray:** `#F5F5F5` - Chat background
- **Dark Gray:** `#333333` - Text

### Typography
- **Primary Font:** Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI"
- **Sizes:**
  - Headers: 24px (bold)
  - Bot messages: 15px
  - User messages: 15px
  - Metadata/timestamps: 12px

### Layout (Mobile-First)

#### Mobile (< 768px)
- Full-screen chat interface
- Fixed header with logo
- Scrollable message area
- Fixed input at bottom
- Floating emergency button
- Slide-up source panel

#### Desktop (≥ 768px)
- Centered chat container (max-width: 800px)
- Sidebar with quick links (optional)
- Source panel on right side
- More whitespace and breathing room

---

## Chatbot Personality & Behavior

### Personality Profile: "Summer" (the SSB Assistant)

**Tone:**
- Friendly and approachable, like a helpful camp counselor
- Professional when discussing safety/medical topics
- Conversational but never overly casual
- Encouraging and supportive

**Voice Characteristics:**
- Uses "you" and "your" (second person)
- Short, scannable responses when possible
- Breaks complex info into digestible chunks
- Uses emojis strategically (not excessively):
  - 🚨 Emergencies
  - 📚 Sources/documentation
  - 📍 Locations
  - 📞 Contact info
  - ⚕️ Medical info
  - 🏫 Academic info
  - 📅 Schedule info
  - ✅ Confirmations

**Example Responses:**

**Emergency Query:**
```
🚨 For a life-threatening emergency, call 9-1-1 immediately.

Then contact:
📞 SSB 24/7 Helpline: +1.858.779.0555
📞 UC Berkeley Police (cell): 510-642-3333

📚 Sources:
- Emergency Action Plan (Important Resources)
- UC Berkeley Emergency Info: emergency.berkeley.edu
```

**General Query:**
```
Great question! Your mentor night off needs to be at least one night (6pm-8am) during the week.

Key rules:
• Starts when commuters leave
• Ends at breakfast
• NO time off Saturday, Sunday, or final night
• Must stay within 2 hours of campus

📚 Source: Staff Schedules & Policies (CD/AM/SPA Resources)
Need more details? I can break down all 6 time-off policy points.
```

**Proactive Behavior:**
- Suggests related questions
- Offers to provide more detail
- Links to related topics
- Flags important safety information

---

## Technical Architecture

### Stack

**Frontend:**
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS
- **Markdown:** react-markdown with remark-gfm
- **Icons:** Lucide React
- **State:** React Context + useState
- **HTTP:** Axios

**Backend:**
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **API:** Anthropic Claude API (Sonnet 4)
- **Search:** Tavily Search API or Brave Search API
- **CORS:** cors middleware
- **Env:** dotenv

**Knowledge Base:**
- **Storage:** Local markdown files (knowledge_base folder)
- **Search:** Simple keyword matching + semantic chunking
- **Future:** Vector embeddings with ChromaDB or Pinecone

---

## Features & Functionality

### Core Features

#### 1. Chat Interface
- **Message Types:**
  - User messages (right-aligned, orange)
  - Bot messages (left-aligned, blue)
  - System messages (centered, gray)
  - Typing indicator (3 bouncing dots)

- **Message Components:**
  - Avatar (Summer Springboard logo)
  - Timestamp
  - Message content (markdown rendered)
  - Source citations (expandable)
  - Copy button
  - Useful/Not useful feedback

#### 2. Knowledge Base Integration
- **Automatic Context Retrieval:**
  - Analyze user query
  - Search across all .md files
  - Retrieve relevant sections
  - Provide to Claude as context

- **Source Attribution:**
  - Always cite which KB file used
  - Link to specific sections
  - Link to external resources (portals, websites)
  - Show confidence level (optional)

#### 3. Web Search (Real-Time)
- **Trigger Conditions:**
  - User explicitly asks for latest/current info
  - Query about events, dates not in KB
  - KB doesn't have sufficient info
  - User asks "search for..."

- **Search Display:**
  - Show search indicator
  - Display top 3-5 results
  - Synthesize with Claude
  - Cite search sources

#### 4. Smart Suggestions
- **Quick Actions (Always Visible):**
  - 🚨 Emergency Contacts
  - 📞 Call Campus Director
  - 📍 Find Location
  - 📅 Today's Schedule

- **Contextual Suggestions:**
  - Based on conversation history
  - Related topics
  - Follow-up questions

#### 5. Category Filters (Optional)
- Emergency & Safety
- Staff Schedules & Policies
- Medical & Healthcare
- Courses & Instructors
- Student Arrival & Check-In
- Housing & Dining
- General Program Info

---

## API Integration

### Anthropic Claude API

**Model:** `claude-sonnet-4-20250514` (or latest Sonnet)

**System Prompt:**
```
You are "Summer," the helpful AI assistant for Summer Springboard's UC Berkeley 2026 program. You help staff, students, and parents find information quickly and accurately.

PERSONALITY:
- Friendly and approachable, like a helpful camp counselor
- Professional when discussing safety/medical topics
- Use emojis strategically: 🚨 emergencies, 📚 sources, 📍 locations, 📞 contacts
- Keep responses concise and scannable
- Always prioritize safety information

KNOWLEDGE BASE:
You have access to comprehensive program documentation including:
- Emergency procedures and contacts
- Staff schedules and policies
- Student arrival procedures
- First aid and medical resources
- Course information and instructors
- Program overview

RESPONSE GUIDELINES:
1. For emergencies: ALWAYS lead with "Call 9-1-1 immediately" if life-threatening
2. For all answers: Provide sources and links
3. Format responses in markdown for readability
4. If uncertain, say so and suggest contacting Campus Director or SSB Helpline
5. Break complex information into bullet points or numbered lists
6. Suggest related questions at the end

SOURCES:
- Always cite which knowledge base file you used
- Include relevant portal links from SOURCES_AND_LINKS.md
- Use the response templates provided
- Link to external resources when helpful

Current date: {current_date}
```

**Request Format:**
```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 2048,
  "temperature": 0.7,
  "system": "[system prompt above]",
  "messages": [
    {
      "role": "user",
      "content": "User query + relevant KB context"
    }
  ]
}
```

### Web Search API

**Option 1: Tavily Search API**
- Clean, AI-optimized results
- Good for Q&A
- Free tier available

**Option 2: Brave Search API**
- More comprehensive
- Good privacy
- Free tier: 2000 queries/month

**Implementation:**
- Only trigger when needed (don't search every query)
- Search query optimization (extract key terms)
- Limit to top 3-5 results
- Pass results to Claude for synthesis

---

## User Interface Components

### 1. Header
- Summer Springboard logo (left)
- Title: "SSB Assistant"
- Menu button (right) - settings, help, feedback

### 2. Quick Action Bar (Sticky)
- 🚨 Emergency
- 📞 Contacts
- 📍 Locations
- 📅 Schedule
- Horizontally scrollable on mobile

### 3. Message Area
- Auto-scroll to latest message
- Smooth animations
- Infinite scroll (load history)
- Pull-to-refresh (mobile)

### 4. Message Bubble
```
┌─────────────────────────────────┐
│ [Avatar] [Name]        [Time]   │
│                                  │
│ Message content here...          │
│ (Markdown rendered)              │
│                                  │
│ 📚 Sources (expandable) ▼        │
│ ┌─────────────────────────────┐ │
│ │ • Source 1 (link)           │ │
│ │ • Source 2 (link)           │ │
│ └─────────────────────────────┘ │
│                                  │
│ [Copy] [👍 Helpful] [👎 Not]    │
└─────────────────────────────────┘
```

### 5. Input Area (Fixed Bottom)
- Text input (multi-line, auto-expand)
- Send button (paper plane icon)
- Attach file button (future)
- Voice input button (future)
- Character count (optional)

### 6. Typing Indicator
```
[Avatar] Summer is typing...
● ● ●  (bouncing animation)
```

### 7. Source Citation Panel
- Slide up from bottom (mobile)
- Sidebar panel (desktop)
- Grouped by type (KB files, portal links, external)
- Expandable sections
- Copy link button

### 8. Suggested Questions
- Chips/pills below last message
- Tap to send
- Context-aware

---

## Mobile Optimizations

### Performance
- Lazy load message history
- Virtual scrolling for long chats
- Image optimization (logo)
- Code splitting
- Service worker for offline KB access (future)

### UX
- Large touch targets (min 44x44px)
- Swipe gestures:
  - Swipe right on message: Quick reply
  - Pull down: Refresh
  - Swipe up: Close source panel
- Haptic feedback on actions
- Bottom sheet for modals
- Native-feeling animations

### Responsive Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

---

## Data Flow

### User Sends Message

```
1. User types message → clicks send
2. Frontend adds message to chat (optimistic UI)
3. Frontend sends to backend API:
   POST /api/chat
   {
     "message": "user query",
     "history": [...previous messages],
     "sessionId": "uuid"
   }

4. Backend:
   a. Search knowledge base for relevant context
   b. Check if web search needed
   c. If yes: Call search API → get results
   d. Build Claude prompt with:
      - System prompt
      - KB context
      - Search results (if any)
      - User query
   e. Call Anthropic API
   f. Parse response
   g. Extract sources/links
   h. Return to frontend:
      {
        "response": "formatted response",
        "sources": [...],
        "searchUsed": true/false,
        "confidence": "high/medium/low"
      }

5. Frontend:
   a. Display bot response with typing animation
   b. Render markdown
   c. Show source citations
   d. Suggest follow-up questions
```

---

## API Endpoints

### POST /api/chat
**Request:**
```json
{
  "message": "What do I do in an earthquake?",
  "history": [
    {"role": "user", "content": "previous message"},
    {"role": "assistant", "content": "previous response"}
  ],
  "sessionId": "uuid-here"
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
      "section": "Earthquake Emergency Plan",
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
  "timestamp": "2026-05-23T12:00:00Z"
}
```

### GET /api/health
Health check endpoint

### POST /api/feedback
User feedback on responses (helpful/not helpful)

---

## Knowledge Base Search Algorithm

### Simple Keyword Matching (v1)
```javascript
function searchKnowledgeBase(query) {
  const keywords = extractKeywords(query);
  const results = [];

  // Search each .md file
  knowledgeBaseFiles.forEach(file => {
    const content = readFile(file);
    const score = calculateRelevanceScore(content, keywords);
    if (score > threshold) {
      results.push({
        file: file,
        score: score,
        matchedSections: extractRelevantSections(content, keywords)
      });
    }
  });

  // Sort by relevance, return top 3
  return results.sort((a, b) => b.score - a.score).slice(0, 3);
}
```

### Semantic Search (v2 - Future)
- Use Anthropic embeddings API
- Store embeddings in ChromaDB
- Vector similarity search
- Better context understanding

---

## Security & Privacy

### API Key Protection
- **Never expose API keys in frontend**
- Store in `.env` file on backend
- Use environment variables
- Add to `.gitignore`

### Rate Limiting
- Limit requests per user/IP
- Prevent abuse
- Implement exponential backoff

### Data Privacy
- No PII stored without consent
- Clear data retention policy
- GDPR compliance
- Option to clear chat history

### Input Validation
- Sanitize user input
- Prevent injection attacks
- Rate limit file uploads (future)

---

## Error Handling

### User-Facing Errors
```
😕 Oops! I'm having trouble right now.

Please try:
• Refreshing the page
• Rephrasing your question
• Contacting the SSB 24/7 Helpline: +1.858.779.0555

Error ID: [uuid] (for support)
```

### Backend Error Logging
- Log all errors with context
- Track API failures
- Monitor response times
- Alert on critical failures

---

## Deployment

### Frontend
- **Platform:** Vercel or Netlify
- **Build:** `npm run build`
- **Environment:** Set API backend URL

### Backend
- **Platform:** Render, Railway, or Heroku
- **Environment Variables:**
  - `ANTHROPIC_API_KEY`
  - `SEARCH_API_KEY` (Tavily or Brave)
  - `PORT`
  - `NODE_ENV`

### Knowledge Base
- Bundle with frontend build
- Or serve from backend
- CDN for static files (future)

---

## Testing Strategy

### Unit Tests
- Message parsing
- Markdown rendering
- Source extraction
- Keyword matching

### Integration Tests
- API endpoints
- Claude API integration
- Search API integration
- Knowledge base retrieval

### E2E Tests (Playwright)
- Send message → receive response
- Click quick action → get info
- Open source panel → view links
- Mobile responsiveness

### Manual Testing Checklist
- [ ] Emergency queries return safety info first
- [ ] Sources always included
- [ ] Links work
- [ ] Mobile touch targets adequate
- [ ] Markdown renders correctly
- [ ] Emojis display properly
- [ ] Loading states clear
- [ ] Error states helpful

---

## Future Enhancements

### Phase 2
- [ ] Voice input/output
- [ ] File upload (images, PDFs)
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Export chat history
- [ ] Email transcript

### Phase 3
- [ ] Push notifications
- [ ] Calendar integration
- [ ] Task/reminder creation
- [ ] Video responses (instructor intros)
- [ ] AR campus map navigation

### Analytics
- Track most common queries
- Identify knowledge gaps
- Monitor response accuracy
- User satisfaction scores

---

## Success Metrics

### Key Metrics
- **Response Accuracy:** > 95%
- **Average Response Time:** < 3 seconds
- **User Satisfaction:** > 4.5/5
- **Source Citation Rate:** 100%
- **Mobile Usage:** > 70%
- **Repeat Users:** > 50%

### Monitoring
- Response time tracking
- Error rate monitoring
- API usage/costs
- User feedback collection

---

## File Structure

```
Chatbot/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   │   ├── ChatContainer.jsx
│   │   │   │   ├── MessageBubble.jsx
│   │   │   │   ├── InputArea.jsx
│   │   │   │   ├── TypingIndicator.jsx
│   │   │   │   └── SourcePanel.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── QuickActions.jsx
│   │   │   └── SuggestedQuestions.jsx
│   │   ├── contexts/
│   │   │   └── ChatContext.jsx
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   ├── markdown.js
│   │   │   └── helpers.js
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   │   ├── ssb-logo.png
│   │   └── favicon.ico
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── chat.js
│   │   ├── services/
│   │   │   ├── claude.js
│   │   │   ├── search.js
│   │   │   └── knowledgeBase.js
│   │   ├── utils/
│   │   │   ├── prompts.js
│   │   │   └── helpers.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── knowledge_base/
│   └── [all .md files]
└── README.md
```

---

## Budget Considerations

### API Costs (Monthly Estimates)

**Anthropic Claude API:**
- Sonnet 4: ~$3 per million input tokens, ~$15 per million output tokens
- Average query: ~2K input tokens (KB context), ~500 output tokens
- 1000 queries/month ≈ $10-15

**Search API:**
- Tavily: Free tier (1000 searches/month) or $0.001/search
- Brave: Free tier (2000 searches/month)

**Hosting:**
- Vercel: Free tier for frontend
- Render/Railway: Free tier or ~$7/month for backend

**Total:** ~$15-25/month for moderate usage

---

## Launch Checklist

### Pre-Launch
- [ ] All knowledge base files loaded and tested
- [ ] API keys secured and working
- [ ] Error handling comprehensive
- [ ] Mobile responsiveness verified
- [ ] Source citations working
- [ ] Emergency queries prioritized
- [ ] Load testing completed
- [ ] Security audit passed

### Launch
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Set environment variables
- [ ] Test production endpoints
- [ ] Monitor error rates
- [ ] Collect initial feedback

### Post-Launch
- [ ] Monitor API usage
- [ ] Track user queries
- [ ] Identify knowledge gaps
- [ ] Iterate on responses
- [ ] Improve search accuracy

---

**Document Version:** 1.0
**Last Updated:** May 23, 2026
**Author:** Claude Code
