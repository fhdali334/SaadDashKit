# SaaS Dashboard Design Guidelines

## Design Approach
**Selected Framework:** Material Design-inspired data dashboard with Linear's refined aesthetics
**Justification:** Information-dense chatbot management platform requiring clear data visualization, efficient workflows, and professional polish. Linear's clean typography and spatial organization combined with Material's robust data components create an optimal experience for managing usage, limits, and knowledge bases.

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- Background Base: 222 47% 11%
- Surface Elevated: 222 47% 15%
- Surface Hover: 222 47% 18%
- Border Subtle: 222 20% 25%
- Primary Brand: 217 91% 60%
- Primary Hover: 217 91% 55%
- Success: 142 71% 45%
- Warning: 38 92% 50%
- Danger: 0 84% 60%
- Text Primary: 210 40% 98%
- Text Secondary: 215 20% 65%
- Text Tertiary: 215 16% 47%

**Light Mode:**
- Background Base: 0 0% 100%
- Surface: 210 20% 98%
- Border: 214 32% 91%
- Primary: 217 91% 60%
- Text: 222 47% 11%

### B. Typography
- **Primary Font:** Inter (Google Fonts) for UI elements, data tables
- **Monospace Font:** JetBrains Mono for API keys, JSON data, code snippets
- **Scale:** text-xs (labels), text-sm (body), text-base (headings), text-lg/xl (page titles), text-2xl (dashboard title)
- **Weights:** font-normal (400), font-medium (500), font-semibold (600)

### C. Layout System
**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-4 to gap-6
- Page margins: px-6 py-8 (mobile), px-8 py-12 (desktop)

**Grid Structure:**
- Sidebar: fixed w-64 with navigation
- Main content: flex-1 with max-w-7xl container
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Responsive breakpoints: sm:640px, md:768px, lg:1024px, xl:1280px

### D. Component Library

**Navigation:**
- Sidebar with logo, main nav items (Dashboard, Usage, Knowledge Base, Transcripts), settings footer
- Active state: subtle background highlight + primary color left border
- Icons from Heroicons (outline style)

**Data Visualization:**
- Usage charts: Line/area charts for timeline data, bar charts for comparisons
- Chart library: Chart.js via CDN
- Chart colors: Primary blue gradient, multi-color for category breakdowns
- Chart container: rounded-lg border with p-6, dark background

**Cards & Surfaces:**
- Base card: rounded-lg border bg-surface p-6
- Stat cards: Large number (text-3xl font-bold), label (text-sm text-secondary), trend indicator (small arrow + percentage)
- Elevation: subtle border, no shadow (Linear-style flatness)

**Data Tables:**
- Striped rows for readability
- Sticky headers on scroll
- Row hover: subtle background change
- Sort indicators on column headers
- Pagination controls at bottom

**Forms & Inputs:**
- File upload area: dashed border, drag-drop zone, file list with remove buttons
- Input fields: rounded-md border focus:ring-2 focus:ring-primary
- Buttons: rounded-md px-4 py-2, primary (bg-primary text-white), secondary (border variant), danger (bg-danger)
- Search bars: with leading icon, rounded-full option for aesthetic variety

**Status Indicators:**
- Credit limit progress bar: linear with color transitions (green → yellow → red)
- Usage badges: pill-shaped with colored backgrounds (success/warning/danger states)
- Active/inactive toggles for knowledge base items

**Knowledge Base Manager:**
- File list with columns: filename, size, upload date, actions
- Upload button prominent at top-right
- Delete confirmation modal
- Empty state: icon + message + CTA button

**Modals & Overlays:**
- Backdrop: bg-black/50 backdrop-blur-sm
- Modal: rounded-lg max-w-lg mx-auto with close button
- Slide-over panels for detailed views (transcripts)

### E. Dashboard Layout

**Page Structure:**
1. **Header:** Dashboard title, date range selector, export button
2. **Stats Row:** 4 stat cards (Total Usage, Credits Used, Active Conversations, Files in KB)
3. **Charts Section:** 2-column grid (Usage Over Time, Top Intents/Categories)
4. **Quick Actions:** Knowledge Base summary card, Recent transcripts preview
5. **Alerts:** Credit limit warnings if approaching threshold

**Knowledge Base Page:**
- Header with upload button
- Search/filter bar
- File grid/list view toggle
- Bulk selection and actions

**Transcripts Page:**
- Conversation list (sidebar or main table)
- Transcript viewer with message bubbles
- Export individual transcript button
- Search and date filtering

## Images
No hero images for utility dashboard. Use:
- Icon illustrations for empty states (upload cloud for KB, chat bubble for transcripts)
- Placeholder avatars for user profiles
- Product logo in sidebar (120x40px area)

## Key Principles
- **Efficiency First:** Minimize clicks to complete tasks
- **Data Clarity:** Charts and numbers immediately scannable
- **Consistent Density:** Balanced information without overwhelming
- **Progressive Disclosure:** Hide complexity until needed
- **Status Visibility:** Always show current usage vs. limits