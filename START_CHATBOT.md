# Start the SSB Chatbot

The chatbot wasn't working because the **backend server isn't running**. Here's how to start it:

## Quick Start (2 steps)

### Step 1: Start the Backend

```bash
cd "team B bot/backend"
npm run dev
```

You should see:
```
🚀 SSB Chatbot Backend running on port 3001
📝 Health check: http://localhost:3001/api/health
📚 Loaded 10 knowledge base files
```

**Keep this terminal open** - the backend needs to stay running.

### Step 2: Open the Portal

In a **new terminal**:

```bash
cd Berkeley-Portal-Reconstruction
python3 -m http.server 8000
```

Then open: **http://localhost:8000**

Click the blue "Ask me anything" button in the top right.

---

## Troubleshooting

### "Having trouble connecting" error

The backend isn't running. Go back to Step 1.

### Backend won't start

```bash
cd "team B bot/backend"
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Port 3001 already in use

```bash
# Find what's using port 3001
lsof -ti:3001 | xargs kill -9

# Then restart backend
npm run dev
```

---

## What Changed

**Simplified the chatbot design:**
- ✓ Removed quick action buttons
- ✓ Removed extra icons
- ✓ Elegant blue-to-teal gradient
- ✓ Cleaner, minimal interface
- ✓ Better typography and spacing
- ✓ Smooth animations

**Why it wasn't working:**
- The backend server wasn't started
- The API key is already in `.env` (correct)
- Just needed to run `npm run dev` in the backend folder

---

## File Sizes

- CSS: 448 lines → **297 lines** (simplified)
- JS: 382 lines → **309 lines** (cleaner)

The chatbot is now elegant and minimal. Just start the backend and it'll work perfectly.
