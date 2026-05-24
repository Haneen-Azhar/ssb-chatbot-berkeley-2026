# ✅ Setup Checklist - Summer Springboard Chatbot

Use this checklist to ensure everything is configured correctly.

## Pre-Launch Checklist

### 1. Backend Setup
- [ ] `cd backend && npm install` completed successfully
- [ ] `.env` file created from `.env.example`
- [ ] `ANTHROPIC_API_KEY` added to `.env`
- [ ] Optional: `TAVILY_API_KEY` or `BRAVE_API_KEY` added for web search
- [ ] Test backend: `npm run dev`
- [ ] Verify: http://localhost:3001/api/health returns `{"status":"ok"}`
- [ ] Check console shows: "📚 Loaded 10 knowledge base files"

### 2. Frontend Setup
- [ ] `cd frontend && npm install` completed successfully
- [ ] Optional: `.env` file created (defaults are fine)
- [ ] SSB logo copied to `frontend/public/ssb-logo.png`
- [ ] Test frontend: `npm run dev`
- [ ] Verify: http://localhost:5173/ opens the chatbot

### 3. Visual Verification
- [ ] SSB logo appears in header
- [ ] Brand colors look correct (orange, blue)
- [ ] Quick action buttons visible
- [ ] Chat input field at bottom
- [ ] Welcome message from "Summer" displays

### 4. Functionality Testing

**Basic Chat:**
- [ ] Can type and send a message
- [ ] Bot responds with formatted text
- [ ] Typing indicator shows while waiting
- [ ] Messages display with timestamps

**Quick Actions:**
- [ ] Emergency button works
- [ ] Contacts button works
- [ ] Locations button works
- [ ] Schedule button works

**Knowledge Base Integration:**
- [ ] Ask "What do I do in an earthquake?"
- [ ] Response includes emergency procedures
- [ ] Sources section appears and is expandable
- [ ] Sources cite knowledge base files

**Source Citations:**
- [ ] Bot responses include 📚 Sources section
- [ ] Can expand/collapse sources
- [ ] Links are clickable (for web sources)
- [ ] KB file names shown for knowledge base sources

**Suggested Questions:**
- [ ] Suggested questions appear after bot responses
- [ ] Clicking suggestion sends that question
- [ ] New suggestions generated for each response

**Markdown Formatting:**
- [ ] **Bold text** renders correctly
- [ ] Bullet points display properly
- [ ] Numbered lists work
- [ ] Links are blue and clickable
- [ ] Code blocks (if any) formatted correctly

**Mobile Responsiveness:**
- [ ] Resize browser to mobile width
- [ ] Layout adjusts properly
- [ ] Quick actions scroll horizontally
- [ ] Messages are readable and properly sized
- [ ] Input area stays at bottom

**Feedback System:**
- [ ] Thumbs up/down buttons appear
- [ ] Clicking thumbs up highlights it
- [ ] Clicking thumbs down highlights it
- [ ] Copy button copies message text

### 5. Error Handling

- [ ] Stop backend → Try sending message → See error message
- [ ] Start backend → Chat works again
- [ ] Error message is user-friendly

### 6. Performance

- [ ] Initial page load is fast (< 2 seconds)
- [ ] Message send/response is reasonable (< 5 seconds)
- [ ] No console errors in browser dev tools
- [ ] No errors in backend terminal

---

## Advanced Features Testing

### Web Search (if enabled)

- [ ] Ask "Latest news about UC Berkeley"
- [ ] Check backend logs for "🔍 Searching for"
- [ ] Response includes search results
- [ ] Sources include web URLs

### Long Conversations

- [ ] Send 5+ messages back and forth
- [ ] Chat history maintained
- [ ] Context carried through conversation
- [ ] Scroll works properly with many messages

### Emergency Queries

- [ ] Ask "What's the emergency number?"
- [ ] Response prioritizes 9-1-1
- [ ] Includes 🚨 emoji
- [ ] Links to emergency resources

---

## Common Issues & Fixes

### ❌ Backend Error: "ANTHROPIC_API_KEY is not defined"
**Fix:** Create `backend/.env` and add your API key

### ❌ Frontend shows blank page
**Fix:**
1. Check `frontend/public/ssb-logo.png` exists
2. Verify backend is running
3. Check browser console for errors

### ❌ "Network Error" when sending message
**Fix:**
1. Verify backend is running on port 3001
2. Check `FRONTEND_URL` in backend `.env`
3. Check CORS settings

### ❌ Sources not showing
**Fix:**
1. Check knowledge base files exist in `knowledge_base/`
2. Verify backend logs show "Loaded X knowledge base files"
3. Check response object in browser dev tools

### ❌ Styling looks broken
**Fix:**
1. Make sure Tailwind compiled: check for errors in frontend terminal
2. Clear browser cache
3. Verify `index.css` imports Tailwind directives

---

## Production Deployment Checklist

### Backend (Render/Railway/Heroku)

- [ ] Environment variables set:
  - `ANTHROPIC_API_KEY`
  - `NODE_ENV=production`
  - `FRONTEND_URL` (your frontend URL)
  - Optional: `TAVILY_API_KEY` or `BRAVE_API_KEY`
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Health check endpoint responding
- [ ] Logs show no errors

### Frontend (Vercel/Netlify)

- [ ] Environment variable set:
  - `VITE_API_URL` (your backend URL)
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Logo image deployed
- [ ] Site loads correctly
- [ ] Can send/receive messages

### Final Tests

- [ ] Test from actual mobile device
- [ ] Test from different browsers (Chrome, Safari, Firefox)
- [ ] Check response times are acceptable
- [ ] Verify SSL/HTTPS working
- [ ] Test error scenarios

---

## Monitoring After Launch

### Daily
- [ ] Check backend logs for errors
- [ ] Monitor API usage/costs
- [ ] Review user feedback (thumbs up/down)

### Weekly
- [ ] Review most common queries
- [ ] Identify knowledge gaps
- [ ] Update knowledge base if needed
- [ ] Check response accuracy

### Monthly
- [ ] Analyze usage patterns
- [ ] Review API costs
- [ ] Plan improvements
- [ ] Update documentation

---

## Support Resources

**Documentation:**
- `README.md` - Full setup guide
- `QUICK_START.md` - 5-minute quick start
- `CHATBOT_SPECS.md` - Technical specifications
- `knowledge_base/README.md` - Knowledge base guide

**API Documentation:**
- Anthropic Claude: https://docs.anthropic.com/
- Tavily Search: https://docs.tavily.com/
- Brave Search: https://brave.com/search/api/

**SSB Contacts:**
- SSB 24/7 Helpline: +1.858.779.0555
- Program Director: Claudine Jones - 760-579-1822

---

**Last Updated:** May 23, 2026
**Status:** ✅ Ready for deployment
