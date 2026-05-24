# Berkeley B Summer Staff Portal - UI Redesign Specification

**Date:** 2026-05-23
**Status:** Approved
**Goal:** Modernize portal UI while preserving sidebar navigation and original photo, improve resource link presentation

## Problems Being Solved

1. Redundant "Home" header above hero section
2. Hero photo not displaying properly from original site
3. Plain text links difficult to scan
4. Generic presentation lacks visual hierarchy
5. Footer positioning issues
6. No visual distinction between resource types

## Design Decisions

### Layout Structure (Preserved)
- **Sidebar:** 250px fixed left, dark charcoal (#1B1B1B), unchanged
- **Hero Section:** Replace top header, becomes primary page identifier
- **Main Content:** Offset by sidebar, clean white background

### Hero Section Improvements
- Use actual image from original site (NYC skyline)
- Full-width display with proper aspect ratio
- Dark overlay (rgba 0,0,0,0.5) for text contrast
- Centered white text in bordered box (matching original exactly)
- Remove redundant page title headers

### Resource Card System

**Card Visual Specs:**
- White background with subtle shadow (0 2px 4px rgba(0,0,0,0.08))
- 4px left border color-coded by type:
  - Blue (#4285f4): Google Docs
  - Green (#0f9d58): Google Sheets
  - Yellow (#f4b400): Google Drive folders
  - Red (#db4437): External links
  - Gray (#9e9e9e): Plain text items
- Icon + title + optional description layout
- Hover: lift 2px + shadow (0 4px 12px rgba(0,0,0,0.15))
- Smooth transitions (0.2s ease)

**Icon System:**
- Google Material Icons (CDN)
- 24px icons positioned left of text
- Types: description, table_chart, folder, open_in_new, event

### Page-Specific Designs

**Homepage:**
- Hero with NYC skyline
- Quick access grid: 6 featured resources (2 columns × 3 rows)
- Featured: Staff Schedule, Master Student List, Emergency Action Plan, Staff Manual, Orientation Slides, Campus Tracker

**Schedules, Groups, & Lists:**
- 3 sections with styled headers
- Card grid layout for each section
- Schedules: 3 cards
- Groups: 5 cards
- Lists: 7 cards

**Course-Specific Info:**
- Keep existing grid of course cards
- Enhanced with color-coded borders by category
- Instructor placeholder with initials (TBA)
- Contact icon for future phone/email

**Important Resources:**
- Single column card layout
- 14 resource cards with proper icons
- Clean spacing between cards

**CD/AM/SPA Resources:**
- Two sections: Administrative + Excursions
- Card layout within each section
- PDF links get download icon

### Footer Fix
- Sticky to bottom on short pages
- Fixed position at page end on long pages
- Proper dark background contrast maintained

## Technical Implementation

**New Dependencies:**
- Google Material Icons: `https://fonts.googleapis.com/icon?family=Material+Icons`

**CSS Updates:**
- Remove `.site-header` from pages (keep only in sidebar)
- New `.resource-card` class
- New `.quick-access-grid` class
- New `.hero-section` background image fix
- Footer positioning utilities

**HTML Structure Changes:**
- Remove `<header class="site-header">` from main-wrapper
- Replace resource lists with card grids
- Add Material Icons to links
- Update hero sections with proper image

## Success Criteria

✓ No redundant headers above hero
✓ Hero photo displays correctly from original site
✓ All resource links are interactive cards with icons
✓ Color-coded borders help identify resource types
✓ Footer stays at bottom properly
✓ Sidebar navigation unchanged
✓ Responsive design maintained
✓ Professional, modern aesthetic

## Out of Scope

- Authentication/login system
- Dynamic content updates
- Search functionality
- Mobile hamburger menu (sidebar just hides on mobile)
- Database integration
