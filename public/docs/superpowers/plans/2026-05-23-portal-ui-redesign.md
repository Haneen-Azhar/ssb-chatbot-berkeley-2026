# Portal UI Redesign Implementation Plan

**Spec:** docs/superpowers/specs/2026-05-23-portal-ui-redesign.md
**Date:** 2026-05-23

## Files to Modify

1. `css/berkeley-portal.css` - Add card system, fix hero, update footer
2. `index.html` - Remove header, add card grid for quick access
3. `schedules-groups-lists.html` - Convert lists to cards
4. `course-specific-info.html` - Enhance course cards
5. `important-resources.html` - Convert to card layout
6. `cdamspa-resources.html` - Convert to card layout with sections

## Implementation Tasks

### Phase 1: CSS Foundation
1. Add Google Material Icons to HTML head
2. Create `.resource-card` base styles
3. Create color-coded border variants (`.card-doc`, `.card-sheet`, `.card-folder`, `.card-external`, `.card-text`)
4. Add card hover effects and transitions
5. Fix hero section background image display
6. Remove redundant header styles
7. Fix footer sticky positioning

### Phase 2: Homepage
8. Remove `<header class="site-header">` from index.html
9. Update hero section with proper NYC skyline image
10. Create quick access grid below hero
11. Add 6 featured resource cards with icons
12. Test responsive layout

### Phase 3: Schedules Page
13. Remove header from schedules-groups-lists.html
14. Convert Schedules section to 3 cards
15. Convert Groups section to 5 cards
16. Convert Lists section to 7 cards
17. Add appropriate icons to each card

### Phase 4: Course Info Page
18. Remove header from course-specific-info.html
19. Enhance existing course cards with colored borders
20. Add instructor placeholder styling
21. Test grid responsiveness

### Phase 5: Important Resources
22. Remove header from important-resources.html
23. Convert 14 resource items to individual cards
24. Add proper icons for each resource type
25. Apply color-coded borders

### Phase 6: CD/AM/SPA Resources
26. Remove header from cdamspa-resources.html
27. Create section headers for Administrative + Excursions
28. Convert administrative items to cards
29. Convert excursion items to cards
30. Add download icons for PDF links

### Phase 7: Final Polish
31. Test all pages in browser
32. Verify responsive breakpoints
33. Check footer positioning on all pages
34. Verify all links work
35. Commit changes

## Testing Checklist

- [ ] Hero photo displays correctly on all pages
- [ ] No redundant headers above hero sections
- [ ] All resource cards have appropriate icons
- [ ] Color-coded borders match resource types
- [ ] Hover effects work smoothly
- [ ] Footer stays at bottom on short pages
- [ ] Footer sits below content on long pages
- [ ] Sidebar navigation unchanged and working
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] All links functional

## Success Criteria

✓ Professional card-based UI
✓ Visual hierarchy through icons and colors
✓ Original sidebar preserved
✓ Original photo properly displayed
✓ No redundant headers
✓ Clean, modern aesthetic
