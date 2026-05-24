# SSB Chatbot Integration

The Berkeley Portal now includes an embedded AI chatbot assistant powered by the SSB chatbot from "team B bot".

## Features

✨ **Always accessible** - Floating "Ask me anything" button in top right corner
💬 **Full knowledge base** - Access to all Summer Springboard 2026 information
🎯 **Quick actions** - Emergency, Contacts, Locations, Schedule shortcuts
📱 **Mobile responsive** - Works perfectly on all devices
🔗 **Smart navigation** - Can direct users to specific portal sections

## How It Works

### For Users

1. **Click the blue button** in the top right that says "Ask me anything"
2. **Ask questions** about anything Summer Springboard related
3. **Get instant answers** with sources and links
4. **Use quick actions** for common queries (Emergency, Contacts, Locations, Schedule)
5. **Close anytime** by clicking the X or pressing Escape

### For Developers

The chatbot consists of three files:

1. **`css/chatbot-widget.css`** - All styling for the widget
2. **`js/chatbot-widget.js`** - Main chatbot logic and API integration
3. **`images/ssb-avatar.png`** - SSB logo for the chatbot avatar

All HTML pages automatically include:
```html
<link href="css/chatbot-widget.css" rel="stylesheet" type="text/css">
<script src="js/chatbot-widget.js"></script>
```

## Backend Setup

The chatbot connects to the SSB chatbot backend API.

### 1. Start the Backend Server

```bash
cd "team B bot/backend"
npm install
npm run dev
```

Backend runs on: **http://localhost:3001**

### 2. Verify Backend is Running

Visit: http://localhost:3001/api/health

Should see:
```json
{
  "status": "ok",
  "timestamp": "...",
  "version": "1.0.0"
}
```

### 3. Open the Portal

Simply open any HTML file in the Berkeley-Portal-Reconstruction folder:
- `index.html`
- `schedules-groups-lists.html`
- `course-specific-info.html`
- `important-resources.html`
- `cdamspa-resources.html`

The chatbot will appear in the top right corner.

## Configuration

### Change API Endpoint

Edit `js/chatbot-widget.js`, line 8:

```javascript
this.apiUrl = 'http://localhost:3001/api/chat';
```

For production, change to your deployed backend URL:

```javascript
this.apiUrl = 'https://your-backend.com/api/chat';
```

### Customize Quick Actions

Edit `js/chatbot-widget.js`, lines 42-57:

```javascript
<button class="quick-action-btn" style="background: #ef4444;" data-query="Your custom query">
  🚨 Custom Label
</button>
```

### Customize Colors

Edit `css/chatbot-widget.css`, lines 3-9:

```css
:root {
  --ssb-blue: #3098cc;
  --ssb-orange: #feb74f;
  --ssb-navy: #1a202c;
  --ssb-slate: #1c4861;
  --ssb-teal: #008FA4;
  --ssb-gray: #f8f8f8;
}
```

## Troubleshooting

### Chatbot button doesn't appear

- Check browser console for errors
- Verify `js/chatbot-widget.js` and `css/chatbot-widget.css` are loaded
- Verify `images/ssb-avatar.png` exists

### "Having trouble connecting" error

- Make sure backend is running: `cd "team B bot/backend" && npm run dev`
- Check backend is accessible: http://localhost:3001/api/health
- Verify API URL in `js/chatbot-widget.js` is correct
- Check browser console for CORS errors

### Messages not sending

- Open browser DevTools Network tab
- Look for failed POST requests to `/api/chat`
- Check backend logs for errors
- Verify Anthropic API key is set in `team B bot/backend/.env`

### Widget looks broken on mobile

- Clear browser cache
- Check `css/chatbot-widget.css` is loaded
- Verify viewport meta tag in HTML: `<meta content="width=device-width, initial-scale=1" name="viewport">`

## Knowledge Base

The chatbot has access to the complete SSB knowledge base:

- **Emergency procedures** - All emergency protocols, contacts, healthcare facilities
- **Student arrival** - Complete arrival day timeline and procedures
- **First aid & medical** - First aid inventory, medical resources
- **Staff schedules & policies** - Staff roles, schedules, time-off policy
- **Instructors & courses** - All instructors, courses, locations
- **Program overview** - High-level program information

Files location: `../knowledge_base/` (parent directory of "team B bot")

## Portal-Specific Features

The chatbot can help users navigate the portal by providing direct links to:

- Schedules, Groups, & Lists
- Course-Specific Info
- Important Resources
- CD/AM/SPA Resources

Example queries:
- "Where can I find the master schedule?" → Links to schedules-groups-lists.html
- "Show me course information" → Links to course-specific-info.html
- "I need emergency contacts" → Provides contacts AND links to important-resources.html

## Security Notes

- Chatbot connects to localhost by default (development mode)
- For production: Use HTTPS backend URL and enable CORS properly
- API key is stored server-side in `team B bot/backend/.env` (never exposed to client)
- User messages are sent to backend but not stored permanently
- No authentication required (chatbot is public-facing)

## Support

**Backend issues:** Check `team B bot/README.md` for full backend documentation

**Frontend issues:** Check browser console and verify all files are loaded correctly

**API issues:** Test backend directly with curl:
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What do I do in an emergency?", "history": []}'
```

## Credits

Built with:
- Anthropic Claude Sonnet 4 (AI model)
- Vanilla JavaScript (no frameworks)
- CSS3 with custom animations
- SSB brand design system

Integrated into: Berkeley B Summer Staff Portal
Created for: Summer Springboard UC Berkeley 2026

---

**Questions?** The chatbot can answer them! Just click "Ask me anything" 💬
