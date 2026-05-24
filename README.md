# Berkeley B Summer Staff Portal - Reconstruction

This is an exact reconstruction of the Berkeley B Summer Staff Portal (Google Sites).

## Features

- ✅ Identical navigation structure with 5 main sections
- ✅ Exact color scheme matching Google Sites (navy blue #05062D)
- ✅ Montserrat and Open Sans fonts
- ✅ Responsive design for mobile, tablet, and desktop
- ✅ Hero section with background image overlay
- ✅ Sticky header navigation
- ✅ Footer with report abuse and page details links
- ✨ **NEW: AI Chatbot Assistant** - "Ask me anything" button with full SSB knowledge base

## Pages Included

1. **Home** (`index.html`) - Main landing page
2. **Schedules, Groups, & Lists** (`schedules-groups-lists.html`)
3. **Course-Specific Info** (`course-specific-info.html`)
4. **Important Resources** (`important-resources.html`)
5. **CD/AM/SPA Resources** (`cdamspa-resources.html`)

## 🤖 AI Chatbot Assistant

The portal now includes an embedded SSB AI chatbot that can answer any question about Summer Springboard 2026!

**Features:**
- 💬 Floating "Ask me anything" button in top right
- 🎯 Quick actions: Emergency, Contacts, Locations, Schedule
- 📚 Full access to knowledge base (emergency procedures, staff schedules, courses, etc.)
- 📱 Mobile responsive modal interface
- 🔗 Provides links and sources with every answer

**To use the chatbot:**

1. **Start the backend server:**
   ```bash
   cd "team B bot/backend"
   npm install
   npm run dev
   ```

2. **Open any portal page** (index.html, etc.)

3. **Click the blue "Ask me anything" button** in top right

See [CHATBOT_SETUP.md](CHATBOT_SETUP.md) for full documentation.

---

## How to Run the Portal

### Option 1: Using Python's built-in server

```bash
cd Berkeley-Portal-Reconstruction
python3 -m http.server 8000
```

Then open: http://localhost:8000

### Option 2: Using Node.js http-server

```bash
npm install -g http-server
cd Berkeley-Portal-Reconstruction
http-server -p 8000
```

Then open: http://localhost:8000

### Option 3: Using Live Server (VS Code)

1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## File Structure

```
Berkeley-Portal-Reconstruction/
├── index.html
├── schedules-groups-lists.html
├── course-specific-info.html
├── important-resources.html
├── cdamspa-resources.html
├── README.md
├── CHATBOT_SETUP.md
├── css/
│   ├── normalize.css
│   ├── berkeley-portal.css
│   └── chatbot-widget.css          ← Chatbot styles
├── js/
│   └── chatbot-widget.js            ← Chatbot logic
└── images/
    ├── favicon.png
    └── ssb-avatar.png               ← SSB logo for chatbot
```

## Design Details

### Colors
- Primary Dark: `rgba(5, 6, 45, 1)` - #05062D
- Secondary Dark: `rgba(27, 27, 27, 1)` - #1B1B1B
- Text Light: `rgba(243, 243, 243, 1)` - #F3F3F3
- Text Dark: `rgba(6, 8, 56, 1)` - #060838
- Accent Gray: `rgba(211, 211, 211, 1)` - #D3D3D3

### Typography
- **Headings**: Montserrat (400, 500, 600, 700)
- **Body**: Open Sans (300, 400, 600)

### Responsive Breakpoints
- Desktop: 1200px max-width
- Tablet: < 768px
- Mobile: < 480px

## Content Included

### Schedules, Groups, & Lists
- **Schedules**: Staff Schedule/Assignments, Daily Student Schedule, Master Schedule
- **Groups**: Academic Groups, Clubs, CRW Groups, Commuter List, Mentor Groups
- **Lists**: Airport List, Housing List, Master Student List, Supplies Tracking, First Aid Kit Restock, Student Arrival Checklist

### Course-Specific Info
All 10 courses with instructor info (TBA):
- Architecture, Astrophysics, Biotechnology, Design Thinking & Rapid Prototyping
- Generative AI & Machine Learning, Emergency Medicine, Neuroscience & Behavioral Biology
- Nursing, Physics & Quantum Computing, Pre Med

### Important Resources
14 resources including:
- Campus Boundary Map, Campus Tracker, Student Code of Conduct
- Excursion Cheat-Sheets, Student Orientation Slides, Photo/Video Upload
- Staff Manual, Student Folders, Student POA's, Emergency Action Plan
- Staff Binder, Unit 3 Campus Photos

### CD/AM/SPA Resources
- **Administrative**: Petty Cash Log, Training materials, Emergency contacts, Phone directory
- **Excursions**: Saturday Excursion info, Great America/Six Flags info with PDFs

## Testing Checklist

- [x] All navigation links work correctly
- [x] Active page highlighted in navigation
- [x] Hero section displays with background image
- [x] Responsive design works on all screen sizes
- [x] Header stays sticky on scroll
- [x] Footer displays on all pages
- [x] Fonts load correctly from Google Fonts
- [x] Color scheme matches original site
- [x] All actual content from original site included
- [x] All embedded Google Docs/Sheets/Drive links functional
- [x] Course cards display in responsive grid
- [x] Resource lists styled correctly

## Notes

This reconstruction uses:
- External Google Fonts (Montserrat, Open Sans)
- External hero background image from Google's CDN
- Vanilla JavaScript for chatbot (no frameworks required)
- Standards-compliant HTML5 and CSS3

**Portal built to exactly match:** https://sites.google.com/summerspringboard.com/berkeley-b-summer-staff-portal/home

**Chatbot powered by:** Anthropic Claude Sonnet 4 via "team B bot" backend

## Related Projects

- **team B bot/** - Standalone React chatbot application
- **knowledge_base/** - Complete SSB 2026 knowledge base (20,700+ words)
- **Berkeley-Portal-Reconstruction/** - This portal with embedded chatbot
