# COMPREHENSIVE FIGMA DESIGN PROMPT: High-Frequency Trading (HFT) Engine Dashboard

## **1. PROJECT OVERVIEW & THEME**

**Project Name:** Velocitas HFT Engine – Real-Time Trading Dashboard  
**Theme:** High-Contrast Cyber-Terminal Professional Dark Mode  
**Purpose:** Real-time monitoring, trading execution, backtesting, trend analysis, and automated copilot alerts for multi-strategy, multi-coin crypto trading.

**Color Palette (Core):**
- **Background:** `#0f0f0f` (Deep Black) or Tailwind `bg-gray-950`
- **Secondary BG:** `#1a1a1a` (Charcoal)
- **Primary Accent:** `#00d4ff` (Electric Cyan) – Titles, section headers, active states, chart lines
- **Secondary Accent:** `#0080ff` (Electric Blue) – Secondary highlights, borders
- **Success/Profit:** `#00ff41` (Neon Green) – BUY signals, positive metrics, healthy status
- **Danger/Loss:** `#ff0055` (Hot Pink/Red) – SELL signals, losses, warnings, latency alerts
- **Neutral Text:** `#e0e0e0` (Light Gray) – Body text
- **Muted Text:** `#808080` (Medium Gray) – Secondary info, timestamps
- **Border/Divider:** `#2a2a2a` (Dark Gray) – Subtle separation

**Visual Style:** Glassmorphism + Neumorphism hybrid  
- Rounded corner cards (12–16px radius)  
- Subtle backdrop blur or semi-transparent overlays (`opacity-90`)  
- Layered depth with soft shadows (`shadow-lg` with cyan/blue glow on hover)  
- Monospace fonts for metrics (data authenticity), Sans-serif for UI labels

---

## **2. LAYOUT ARCHITECTURE**

**Main App Grid:** 12-column responsive layout
- **Breakpoints:** Mobile (320px), Tablet (768px), Desktop (1024px+)
- **Gutter:** 16–20px

**Top Navigation Bar (Always Visible)**
- Left: Velocitas logo + "HFT Engine" title (Cyan accent)
- Center: Current mode badge (LIVE, OPTIMIZATION, TREND_ANALYSIS, COPILOT) with status indicator
- Right: User profile, notifications (bell icon with unread count), settings (gear icon), connection status (green/red dot + "Connected / Disconnected")

**Primary 3-Column Dashboard (Desktop)**
1. **Left Sidebar (Fixed, 280px):**
   - Navigation menu (Dashboard, Live Trading, Optimization, Trend Analysis, Copilot, Settings)
   - Active section highlighted in Cyan
   - Collapsible on mobile

2. **Main Content Area (Fluid, ~820px):**
   - Primary section view (changes per mode)
   - Full-bleed on mobile

3. **Right Sidebar (Fixed, ~400px, collapsible):**
   - Real-time metrics summary
   - Quick action panel
   - Collapsible or drawer on mobile

---

## **3. KEY SCREENS & COMPONENTS**

### **SCREEN 1: LIVE TRADING DASHBOARD (Default View)**

**Header Section (Hero Metrics)**
- **Grid Layout:** 4 cards in a row (responsive: 2x2 on tablet, 1x4 on mobile)
- Card 1: **Portfolio Value** (large number, Cyan, with % change arrow + Green/Red color)
  - Format: "$123,456.78" / "↑ +3.2% (24h)"
  - Sparkline mini-chart (Green line if up, Red if down)
- Card 2: **Total P&L** (Cyan header, value in Green if profit, Red if loss)
  - Format: "$5,432.10 (4.2%)" 
  - Small bar showing Win Rate (e.g., "45/50 wins")
- Card 3: **Active Strategies** (Cyan)
  - Format: "6 Active" with a badge for each coin (BTC, ETH, SOL, etc. with strategy name)
- Card 4: **System Status** (Cyan)
  - Latency: "2.3ms ↓" (Green if < 5ms, Yellow if 5–10ms, Red if > 10ms)
  - Processes: "4/4 Running" (Green if all healthy)
  - Queue Depth: "127 messages" (Muted if < 1000, Yellow if > 1000)

**Live Trading Table / Grid (Large central area)**
- **Columns (Responsive):**
  - Coin (BTC, ETH, etc.) – Cyan bold
  - Strategy Name (SMA_Crossover, Momentum, etc.) – White
  - Current Price – White (update on every tick, slight flash animation on change)
  - 24h P&L – Green/Red (e.g., "+$542.10" in Green, "-$123.45" in Red)
  - 24h Return % – Green/Red (e.g., "+3.2%")
  - Status – Badge (ACTIVE/Green, IDLE/Gray, PAUSED/Yellow, ERROR/Red)
  - Trades (24h) – Gray (e.g., "12 trades")
  - Actions – Buttons (View Details, Pause, Stop) on hover
- **Row hover:** Subtle Cyan glow, slight lift animation
- **Sorting:** Click headers to sort (ascending/descending arrow indicator in Cyan)
- **Search/Filter bar** above table: Filter by Coin, Strategy, Status

**Real-Time Metrics Cards (Below/Inline)**
- **Cards per row:** 3 (desktop) / 1 (mobile)
- Card styles: Glassmorphism with Cyan borders (2px on active, 1px on inactive)
- Example cards:
  - **BTC SMA_Crossover:** Price $43,210 | Last Trade 2m ago | +$340 P&L | Status ACTIVE (Green dot)
  - **ETH Momentum:** Price $2,320 | Last Trade 5m ago | -$50 P&L | Status IDLE (Gray dot)
  - **SOL RSI:** Price $98.50 | Last Trade 1m ago | +$120 P&L | Status ACTIVE (Green dot)

**Chart Section (Lower area)**
- **Layout:** 2 sub-sections side-by-side (stacked on mobile)
- Left: **24h Portfolio Value Chart** (Line chart, Cyan line, Green fill under line if net positive)
  - X-axis: Time labels (12am, 4am, 8am, 12pm, 4pm, 8pm, 12am)
  - Y-axis: Value ($k)
  - Hover tooltip: Timestamp + Value
  - Legend: "Portfolio Value"
- Right: **P&L Breakdown by Coin (Pie/Donut chart, 300x300px)**
  - Each slice in different bright color (Cyan, Green, Blue, Magenta)
  - Center label: "Total P&L: +$5,432"
  - Hover slice: Show coin + amount + %
  - Legend below with coin names and values

**Action Buttons (Bottom of screen or fixed footer on mobile)**
- "Start All Strategies" (Cyan bg, white text) – Primary CTA
- "Pause All" (Yellow bg) – Secondary
- "Configure Strategy" (Blue outline) – Tertiary
- "Export Trades CSV" (Gray outline) – Utility

---

### **SCREEN 2: STRATEGY CONFIGURATION & MANAGEMENT**

**Header:** "Manage Strategies" (Cyan title)

**2-Column Layout (Desktop)**

**Left Panel: Strategy List (300px fixed)**
- Scrollable list of registered strategies
- Items: `[SMA_Crossover, Momentum, MeanReversion, RSI, BollingerBands, MACD]`
- Each item: Name + icon (line chart icon) + "(2 active, 1 paused)" label
- Hover: Light Cyan highlight
- Click to select: Cyan border + highlight

**Right Panel: Strategy Config Form (Fluid)**
- Selected strategy details
- Section 1: **Strategy Info** (Cyan accent border-left)
  - Name (read-only, Cyan)
  - Description (italic, Gray)
  - Created: "2025-12-14" (Muted Gray)
  - Version: "v1.0"
- Section 2: **Parameters** (Cyan accent border-left)
  - Input fields for each param (e.g., "SMA Window: [____]", "Threshold: [____]%")
  - Each field with label + input + unit (right-aligned Gray text)
  - Validation feedback (red border + error message if invalid)
- Section 3: **Coin Assignment** (Cyan accent border-left)
  - Multi-select checkboxes: BTC, ETH, SOL, XRP, DOGE (etc.)
  - Currently assigned coins highlighted (Cyan check, white bg)
- Section 4: **Status & Actions** (Bottom)
  - Current Status: "ACTIVE" (Green badge) or "IDLE" (Gray badge)
  - Buttons: 
    - "Start" (Green, if paused/idle)
    - "Pause" (Yellow, if active)
    - "Stop" (Red, if active)
    - "Save & Apply" (Cyan primary)
    - "Delete Strategy" (Red outline, destructive)

**Tab: Strategy Backtest Results (if applicable)**
- Results summary table: Coin | Sharpe | CAGR | Max DD | Win Rate | (Toggle to expand details)

---

### **SCREEN 3: OPTIMIZATION / BACKTESTING**

**Header:** "Optimization & Backtesting" (Cyan title)

**Section 1: CSV Upload & Config (Card, Glassmorphism)**
- Drag-and-drop zone (dashed Cyan border, 200px height)
  - Icon: Upload cloud (Cyan)
  - Text: "Drag CSV here or click to browse"
- After upload: File name + size (e.g., "BTC_2024.csv – 2.4 MB")
- Form fields (inline or below upload):
  - Date Range: [From Date Picker] to [To Date Picker] (Cyan date inputs)
  - Initial Capital: [____] (default 10000)
  - Strategy Selection: Multi-select dropdown (Cyan)
  - Submit: "Run Backtest" (Green bg, Cyan text)

**Section 2: Backtest Results (Expands after run)**
- **Results Summary Cards (4 per row, desktop):**
  - Card 1: Best Strategy – Name (Cyan) + Sharpe ratio (White)
  - Card 2: Best Coin – (Coin name) Cyan + Return % (Green/Red)
  - Card 3: Avg Win Rate – Value + % (Green text)
  - Card 4: Recommended Combo – "BTC_SMA + ETH_RSI" (Cyan, with "Apply" button on hover)
- **Detailed Results Table:**
  - Columns: Strategy | Coin | Return % | Sharpe | CAGR | Max DD | Win Rate | Trades | (Expand detail)
  - Rows sorted by Sharpe (descending)
  - Row hover: Cyan glow, "View Report" button appears
- **Strategy Ranking Chart (Bar chart below table)**
  - X-axis: Strategy names (BTC_SMA, ETH_RSI, SOL_Momentum, etc.)
  - Y-axis: Sharpe ratio or Return %
  - Bars colored: Green if positive return, Red if negative
  - Hover: Show exact values

**Action Buttons:**
- "Apply Best Combo to Live" (Green primary, large)
- "Download Report (PDF)" (Blue outline)
- "Clear & Run Again" (Gray outline)

---

### **SCREEN 4: TREND ANALYSIS**

**Header:** "Trend Analysis & Insights" (Cyan title)

**Section 1: CSV Upload & Analysis (Card, Glassmorphism)**
- Similar to Optimization: Drag-drop CSV, date range, coin filter
- Submit: "Analyze Trends" (Cyan primary)

**Section 2: Trend Results (After analysis, full-width)**

**Sub-section A: Trend Status Grid (4 cards per row, responsive)**
- Each card represents a coin (BTC, ETH, SOL, XRP, etc.)
- Card content:
  - Coin name (Cyan title, large)
  - Trend icon (↑ UPTREND in Green, ↓ DOWNTREND in Red, ↔ FLAT in Gray)
  - Trend strength: "Strong" (Cyan) or "Weak" (Gray)
  - RSI value (White, e.g., "65.3")
  - Volatility (Yellow if high, Green if low)
  - Suggested strategy badge (Cyan bg, white text, e.g., "Momentum Buy")
- Card hover: Slight scale-up, Cyan glow, "Details" button appears

**Sub-section B: Strategy Suggestions Table**
- Columns: Coin | Detected Trend | Confidence | Recommended Strategy | Strength | Action
- Each row:
  - Coin: BTC (Cyan)
  - Trend: "Strong Uptrend" (Cyan bold)
  - Confidence: "87%" (Green if > 75%, Yellow if 50–75%, Gray if < 50%)
  - Recommended: "Momentum" (or "SMA_Crossover", etc., Cyan)
  - Strength: Bar chart (micro inline bar, Green/Yellow/Red)
  - Action: "Apply Strategy" button (Green) or "View Details" (Cyan outline)

**Sub-section C: Trend Detail Chart (One large chart per coin, toggleable via tabs or carousel)**
- Title: "BTC Trend Analysis" (Cyan)
- Chart type: Combination chart
  - Candles/line for price (White line + Gray fill under)
  - Overlay RSI (Cyan line, 50-level dashed Gray line)
  - Overlay Moving Averages (short MA = Cyan, long MA = Blue dashed)
  - Background shading: Green tint if uptrend, Red tint if downtrend
- X-axis: Time labels (dates or candles)
- Y-axis: Price (left), RSI (right 0–100)
- Hover tooltip: Candle detail (OHLC) + RSI value + date
- Legend: Price | RSI | MA Short | MA Long (Cyan text, small)

**Action Buttons:**
- "Apply Suggested Strategies" (Green primary, large)
- "Download Trend Report" (Blue outline)
- "Refresh Analysis" (Cyan outline)

---

### **SCREEN 5: COPILOT / AUTOMATED MONITORING**

**Header:** "Copilot – Automated Monitoring & Alerts" (Cyan title)

**Section 1: Copilot Status (Card, Glassmorphism, top-center)**
- Large status indicator: "ACTIVE" (Green dot + text) or "INACTIVE" (Gray dot + text)
- Subtext: "Monitoring 12 strategy-coin pairs" (Cyan)
- Toggle switch: ON/OFF (Green when ON, Gray when OFF)
- Last Alert: "15 minutes ago – ETH_Momentum BUY signal" (Muted Gray, small)

**Section 2: Active Alerts Feed (Center, scrollable list)**
- List of alerts in reverse chronological order (newest at top)
- Each alert card (full-width, Glassmorphism):
  - Left border: Colored by alert type (Cyan = INFO, Green = BUY, Red = SELL, Yellow = WARNING)
  - Left side: Icon (info circle, arrow up/down, warning triangle)
  - Center: 
    - Title: "ETH_Momentum – BUY Signal Detected" (Bold Cyan text, large)
    - Details: "Price: $2,350 | Strength: 78% | Suggested Trade Size: 0.5 ETH" (White text)
    - Timestamp: "2 minutes ago" (Muted Gray, right-aligned)
  - Right side: Actions
    - If BUY alert: "Execute Trade" button (Green) + "Snooze 1h" button (Gray outline)
    - If SELL alert: "Execute Trade" button (Red) + "Snooze 1h" button (Gray outline)
    - Always: "Dismiss" button (X icon, Gray)
- Alert animation on new: Slide-in from top + subtle pulse effect (Cyan glow)

**Section 3: Alert Configuration (Collapsible card below feed)**
- Title: "Alert Settings" (Cyan, click to expand/collapse)
- Content (when expanded):
  - Checkbox: "Enable Buy Alerts" (checked, Green check)
  - Checkbox: "Enable Sell Alerts" (checked, Green check)
  - Checkbox: "Enable Latency Warnings" (checked, Yellow check)
  - Slider: "Confidence Threshold" [====●=======] 75% (Cyan track, Cyan thumb)
  - Dropdown: "Notification Method" [Email, Slack, Push, In-App] (Cyan selection)
  - Button: "Save Alert Settings" (Cyan primary)

**Section 4: Copilot Activity Log (Bottom, expandable tab)**
- Tabbed view: "Alerts" | "Trades Executed" | "Monitoring Stats"
- Alert tab shows: Timestamp | Alert Type (BUY/SELL/WARNING) | Strategy-Coin | Action Taken
- Trades tab shows: Timestamp | Strategy-Coin | Order Type | Size | Price | Status (Executed/Pending)
- Stats tab shows: Uptime (e.g., "99.8%"), Avg Response Time (e.g., "1.2ms"), Total Alerts (e.g., "347"), Executed Trades (e.g., "23")

---

### **SCREEN 6: TRADE HISTORY & RECORDS**

**Header:** "Trade History & Execution Records" (Cyan title)

**Section 1: Filter & Search Bar (Top)**
- Inputs (inline grid, responsive):
  - Search by Coin: Dropdown / searchable (Cyan)
  - Strategy Filter: Dropdown (Cyan)
  - Date Range: [From] to [To] (Cyan date pickers)
  - Status Filter: All | Executed | Pending | Failed (Radio buttons or toggle, Cyan)
  - Button: "Clear Filters" (Gray outline)

**Section 2: Trade Table (Main content, scrollable)**
- Columns (sticky header, Cyan text on dark bg):
  - Timestamp (White, e.g., "2025-12-14 14:23:45")
  - Coin (Cyan, bold)
  - Strategy (White)
  - Order Type (BUY in Green, SELL in Red, bold)
  - Quantity (White, e.g., "0.5 BTC")
  - Execution Price (White, e.g., "$43,210")
  - Current Price (White, if still open)
  - P&L (Green if profit, Red if loss, bold)
  - Status (Badge: Executed/Green, Pending/Yellow, Failed/Red)
  - Actions (Eye icon = expand row, Trash icon = view details)
- Row hover: Cyan glow, slight lift
- Expandable row details (click row to expand):
  - Full order JSON (monospace, Gray bg, Cyan text)
  - Fee paid (Muted text)
  - Notes / Reason (Italic, Gray)
  - Delete button (Red outline, hidden unless hovering)

**Section 3: P&L Summary Cards (Below table or sidebar)**
- Card 1: Total Trades: "342" (White, large)
- Card 2: Win Rate: "65%" (Green text, large)
- Card 3: Avg Win: "+$342.10" (Green, large)
- Card 4: Avg Loss: "-$120.50" (Red, large)
- Card 5: Largest Win: "+$2,450" (Green)
- Card 6: Largest Loss: "-$890" (Red)

**Action Buttons:**
- "Export to CSV" (Blue outline)
- "Print Report" (Gray outline)

---

## **4. GLOBAL UI COMPONENTS & PATTERNS**

### **Buttons**
- **Primary (CTA):** Cyan bg, white text, 12px rounded, hover: brighter Cyan + Cyan glow shadow
- **Secondary:** Blue outline (2px), white text, hover: Blue fill + glow
- **Danger/Destructive:** Red bg or Red outline, hover: brighter Red + Red glow
- **Success:** Green bg, white text, hover: brighter Green + Green glow
- **Neutral/Outline:** Gray outline, white text, hover: Gray fill (subtle)
- **Disabled:** Gray bg, 50% opacity

### **Cards**
- **Default:** `bg-gray-900` (or `#1a1a1a`), border: 1px `#2a2a2a`, rounded 12–16px, shadow `shadow-lg` with Cyan glow on hover
- **Active/Selected:** Border 2px Cyan, slight Cyan box-shadow
- **Error state:** Border 2px Red, red glow shadow
- **Padding:** 20px (desktop), 16px (tablet), 12px (mobile)

### **Inputs & Forms**
- **Text Input:** Dark bg (`#0f0f0f`), border 1px `#2a2a2a`, Cyan caret, text White
- **Focus state:** Border Cyan (2px), Cyan box-shadow, no outline
- **Labels:** White text, uppercase, 10px font-size, letter-spacing 0.5px (cyberpunk feel)
- **Placeholder:** Muted Gray (`#808080`)
- **Error message:** Red text, small (12px), margin-top 4px

### **Badges & Status Indicators**
- **Green Badge (Success/Active):** `bg-green-500` or `#00ff41`, white text, rounded 20px, 8px padding
- **Red Badge (Error/Loss):** `bg-red-500` or `#ff0055`, white text, rounded 20px
- **Yellow Badge (Warning):** `bg-yellow-500`, dark text, rounded 20px
- **Cyan Badge (Info/Active):** `bg-cyan-500`, white text, rounded 20px
- **Gray Badge (Inactive):** `bg-gray-600`, white text, rounded 20px

### **Tooltips**
- Dark bg (`#0f0f0f`), Cyan border (1px), white text, small (12px), padding 8px
- Appear on hover, 200ms delay
- Arrow pointer to target element

### **Modals & Dialogs**
- **Overlay:** Black bg, 70% opacity (backdrop blur optional)
- **Modal box:** `bg-gray-900`, Cyan border (2px), rounded 16px
- **Header:** Cyan title + close button (X, Gray, hover to Red)
- **Body:** White text, padding 24px
- **Footer:** Buttons (CTA + Cancel)

### **Tables**
- **Header row:** `bg-gray-800`, Cyan text, uppercase labels, sticky top
- **Body rows:** `bg-gray-900`, alternating row bg (`bg-gray-850` every other row)
- **Borders:** 1px `#2a2a2a`
- **Hover row:** `bg-gray-800`, Cyan glow shadow
- **Sorting icons:** Cyan arrow (↑↓) in header

### **Charts**
- **Background:** Transparent (shows card/section bg)
- **Lines:** Cyan (#00d4ff), Blue (#0080ff), Green (#00ff41), Red (#ff0055), secondary colors as needed
- **Fills:** Semi-transparent (20–30% opacity) versions of line colors
- **Grid lines:** Subtle (1px, `#2a2a2a`)
- **Text:** Muted Gray (#808080) for axes labels, White for values
- **Hover tooltip:** Dark bg, Cyan border, white text

### **Animations**
- **Micro-interactions:**
  - Button hover: 100ms scale (1.02x) + Cyan glow
  - Card hover: 150ms ease, slight lift (translateY -4px) + glow
  - Alert slide-in: 300ms ease-out from top
  - Loading spinner: Cyan ring rotating (600ms)
- **Data updates:** Subtle flash (100ms) on value change (opacity fade)
- **Transitions:** All 200–300ms ease-in-out (smooth, not snappy)

### **Notifications / Toast Messages**
- **Success:** Green bg, White text, rounded 12px, 16px padding, appears top-right, auto-dismisses 4s
- **Error:** Red bg, White text, same styling, can be dismissed manually
- **Info:** Cyan bg, White text
- **Warning:** Yellow bg, dark text

---

## **5. RESPONSIVE DESIGN**

**Mobile (320–767px)**
- Single-column layout (stack left sidebar, main content, right sidebar vertically)
- Hamburger menu (Cyan icon) replaces left sidebar
- Bottom navigation bar (5 items: Dashboard, Live, Optimization, Trends, Copilot)
- Cards: Full width, padding 12px
- Tables: Horizontal scroll, sticky first column (Coin name)
- Charts: 100% width, auto-height
- Hero cards: 1x4 grid (stack vertically)

**Tablet (768–1023px)**
- 2-column layout (sidebar + main content; right sidebar hidden, accessible via toggle)
- Sidebar width: 240px
- Hero cards: 2x2 grid
- Tables: Horizontal scroll if needed

**Desktop (1024px+)**
- 3-column layout (sidebar 280px + main 820px + right sidebar 400px, all visible)
- Hero cards: 4 per row

---

## **6. DATA FLOW & INTERACTIVITY NOTES**

**Real-Time Updates:**
- Hero metric cards: Poll every 1 second (slight animation on change)
- Live trading table: WebSocket updates from backend, row flash on change (Cyan glow 500ms)
- Charts: Append new data point on every tick (smooth line animation)
- Alert feed: New alerts slide in from top with sound notification (optional)

**User Actions:**
- Click strategy in list → Load its config form (smooth transition)
- Upload CSV → Show progress bar (Cyan fill), then display results
- Click "Execute Trade" on alert → Confirm modal (Cyan border), execute, show success toast
- Toggle strategy status → Immediate visual feedback (badge color change)

**Loading States:**
- Show skeleton loaders (pulsing Gray cards) while fetching data
- Spinner (Cyan rotating ring) on button click (disable button until done)

---

## **7. TYPOGRAPHY**

- **Headlines (H1, H2, H3):** `Sora` or `Inter`, bold, Cyan color (for main titles)
- **Body text:** `Inter` or `Roboto`, 14–16px, White/Gray
- **Monospace (metrics, code):** `Courier New` or `JetBrains Mono`, 12–14px, White (for data authenticity)
- **Labels (forms, buttons):** Uppercase, 12px, letter-spacing 0.5px, Gray or White

---

## **8. COMPONENT LIBRARY (FIGMA ASSETS)**

Create these reusable components in Figma:
1. **Button** (variants: Primary, Secondary, Danger, Success, Disabled; states: Default, Hover, Active, Loading)
2. **Card** (variants: Default, Active, Error; with/without border)
3. **Badge** (variants: Green, Red, Yellow, Cyan, Gray)
4. **Input Field** (text, number, date; states: Default, Focus, Error, Disabled)
5. **Dropdown / Select** (with/without multi-select)
6. **Toggle / Switch** (ON/OFF states)
7. **Modal / Dialog** (with header, body, footer slots)
8. **Tooltip**
9. **Alert / Toast** (Success, Error, Info, Warning)
10. **Table Row** (default, hover, active, expanded)
11. **Chart Container** (frame for Line, Bar, Pie, Candle charts)
12. **Avatar / User Profile Icon**
13. **Navigation Item** (active/inactive states)
14. **Status Indicator Dot** (Green, Red, Yellow, Cyan, Gray)
15. **Spinner / Loading Ring**

---

## **9. SCREENS CHECKLIST (For Figma)**

- [ ] **Screen 1:** Live Trading Dashboard (default home view)
- [ ] **Screen 2:** Strategy Configuration & Management
- [ ] **Screen 3:** Optimization / Backtesting Results
- [ ] **Screen 4:** Trend Analysis & Insights
- [ ] **Screen 5:** Copilot / Automated Monitoring & Alerts
- [ ] **Screen 6:** Trade History & Execution Records
- [ ] **Screen 7:** Settings & User Profile (bonus)
- [ ] **Screen 8:** Mobile Navigation & Responsive Views
- [ ] **Interactive Prototypes:** Link screens with page transitions, modal opens, dropdown toggles, etc.

---

## **10. DESIGN HANDOFF NOTES FOR DEVELOPERS**

- **Color Tokens:** Export as CSS variables (e.g., `--color-primary: #00d4ff`, `--color-danger: #ff0055`)
- **Font Stack:** Export as font declarations
- **Spacing Scale:** Use 4px base grid (12px, 16px, 20px, 24px, 32px spacing)
- **Shadow Tokens:** Define reusable shadow values (e.g., `--shadow-lg-cyan` for glowing shadows)
- **Border Radius:** Consistent 12px for cards, 6px for inputs, 20px for badges
- **Responsive Breakpoints:** Annotate with pixel breakpoints (320, 768, 1024)
- **Interaction Specs:** Document animation timings, hover states, focus states in Figma (or Specs panel)
- **SVG Icons:** Export all icons as SVGs (button icons, status indicators, etc.)

---

## **QUICK SUMMARY FOR FIGMA**

**Deliverables:**
1. Component library (15+ reusable components)
2. 6–8 full-screen designs (Live Dashboard, Strategy Config, Optimization, Trends, Copilot, Trades, Settings, Mobile)
3. Interactive prototype with smooth transitions
4. Design tokens (colors, typography, spacing, shadows)
5. Responsive annotations (mobile, tablet, desktop breakpoints)

**Design Philosophy:**
- **Cyberpunk aesthetic:** Dark mode (black/charcoal), electric accents (Cyan/Blue), neon status colors (Green/Red)
- **Data-centric:** Large metrics, clean typography, minimal distractions, real-time animation
- **Glassmorphism:** Cards with subtle blur/transparency for depth and focus
- **Intuitive UX:** Clear action hierarchy, consistent patterns, fast feedback (animations, toasts)

This prompt covers **all backend features** (live trading, multi-strategy, backtesting/optimization, trend analysis, copilot alerts, trade history) and specifies every detail (colors, fonts, spacing, interactions) for a production-ready design handoff.
