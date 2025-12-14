# FRONTEND DEVELOPMENT CHECKLIST

## 🚀 Backend Status: COMPLETE & READY

The backend is fully implemented and ready for frontend integration.

---

## 📋 FRONTEND IMPLEMENTATION CHECKLIST

### Phase 1: Project Setup (30 minutes)
- [ ] Create React app (create-react-app or Vite)
- [ ] Install dependencies:
  ```bash
  npm install axios react-router-dom recharts zustand
  npm install @tanstack/react-query
  npm install tailwindcss @tailwindcss/forms
  ```
- [ ] Setup environment variables:
  ```
  REACT_APP_API_URL=http://localhost:8000
  REACT_APP_WS_URL=ws://localhost:8000
  ```
- [ ] Setup folder structure:
  ```
  src/
  ├── components/
  ├── pages/
  ├── hooks/
  ├── services/
  ├── store/
  └── utils/
  ```

### Phase 2: Core Services (45 minutes)
- [ ] Create API client wrapper:
  ```typescript
  // services/api.ts
  import axios from 'axios'
  
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL
  })
  
  export const strategiesAPI = {
    register: (name, coin, params) => 
      api.post('/api/strategies/register', ...),
    unregister: (strategyId) => 
      api.post(`/api/strategies/unregister`, ...),
    list: () => api.get('/api/strategies'),
    available: () => api.get('/api/available-strategies')
  }
  
  export const engineAPI = {
    start: (dataSource, coins) => 
      api.post('/api/engine/start', ...),
    stop: () => api.post('/api/engine/stop'),
    metrics: () => api.get('/api/metrics'),
    strategyMetrics: (id) => 
      api.get(`/api/metrics/${id}`),
    trades: (limit = 100) => 
      api.get('/api/trades', {params: {limit}}),
    pnl: (strategyId) => 
      api.get('/api/pnl', {params: {strategy_id: strategyId}})
  }
  ```

- [ ] Create WebSocket hook:
  ```typescript
  // hooks/useWebSocket.ts
  export function useMetricsWebSocket() {
    const [metrics, setMetrics] = useState(null)
    const [connected, setConnected] = useState(false)
    
    useEffect(() => {
      const ws = new WebSocket(process.env.REACT_APP_WS_URL + '/ws/metrics')
      
      ws.onopen = () => setConnected(true)
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data)
        setMetrics(data)
      }
      
      return () => ws.close()
    }, [])
    
    return { metrics, connected }
  }
  ```

- [ ] Create state management (Zustand):
  ```typescript
  // store/engineStore.ts
  export const useEngineStore = create((set) => ({
    running: false,
    mode: 'live',
    strategies: [],
    metrics: null,
    trades: [],
    
    setRunning: (running) => set({running}),
    addStrategy: (strategy) => 
      set((state) => ({
        strategies: [...state.strategies, strategy]
      }))
  }))
  ```

### Phase 3: Live Trading UI (1 hour)
- [ ] **Layout Components:**
  - [ ] Header (logo, mode selector, health status)
  - [ ] Sidebar (navigation)
  - [ ] Footer (system status)

- [ ] **Strategy Management Panel:**
  - [ ] Strategy selector dropdown (fetch from `/api/available-strategies`)
  - [ ] Coin input (text or dropdown)
  - [ ] Parameter inputs (dynamic based on strategy)
  - [ ] Register button → `POST /api/strategies/register`
  - [ ] Registered strategies list
  - [ ] Unregister buttons → `POST /api/strategies/unregister`

- [ ] **Engine Control Panel:**
  - [ ] Data source selector (binance, coingecko, synthetic, csv)
  - [ ] Coins input (comma-separated)
  - [ ] Start button → `POST /api/engine/start`
  - [ ] Stop button → `POST /api/engine/stop`
  - [ ] Status indicator (running/stopped)

- [ ] **Real-time Metrics Display:**
  - [ ] Connect to `WS /ws/metrics`
  - [ ] Display global metrics:
    - Total trades
    - Net P&L
    - Win rate %
    - Active strategies count
  - [ ] Strategy metrics table:
    - Strategy ID
    - Total trades
    - Net P&L
    - Win rate
  - [ ] Update every 1 second from WebSocket

- [ ] **Charts & Visualization:**
  - [ ] P&L Chart (Recharts):
    ```jsx
    // Fetch from GET /api/pnl
    <LineChart data={pnlHistory}>
      <Line type="monotone" dataKey="pnl" stroke="#8884d8" />
    </LineChart>
    ```
  - [ ] Strategy comparison bar chart
  - [ ] Win/loss pie chart

- [ ] **Trade History Table:**
  - [ ] Fetch from `GET /api/trades`
  - [ ] Columns: Date, Coin, Strategy, Action, Price, Qty, P&L
  - [ ] Sortable, filterable
  - [ ] Pagination

### Phase 4: Optimization Mode UI (45 minutes)
- [ ] **CSV Upload Section:**
  - [ ] Drag-drop or file input
  - [ ] Upload to `POST /api/optimization/upload-csv`
  - [ ] Show data preview (rows, coins)
  - [ ] Store file_path from response

- [ ] **Strategy Selection:**
  - [ ] Checkbox grid for strategy-coin combinations
  - [ ] Preset templates (all coins, all strategies, etc.)
  - [ ] Parameter adjustments per strategy

- [ ] **Backtest Execution:**
  - [ ] Run button → `POST /api/optimization/backtest`
  - [ ] Loading spinner during backtest
  - [ ] Results display

- [ ] **Results Display:**
  - [ ] Rankings table:
    - Strategy ID
    - Total trades
    - Win rate
    - Net P&L
    - Profit factor
    - Max drawdown
  - [ ] Sortable columns (P&L, win rate, profit factor)
  - [ ] Best combo highlight

- [ ] **Recommendations:**
  - [ ] Card for each coin showing best strategy
  - [ ] Fetch from `GET /api/optimization/recommendations`

### Phase 5: Trend Analysis UI (30 minutes)
- [ ] **CSV Upload:**
  - [ ] Similar to optimization mode
  - [ ] Upload to `POST /api/trend-analysis/upload-csv`

- [ ] **Analysis Results:**
  - [ ] Trend summary per coin (uptrend/downtrend/sideways)
  - [ ] Technical indicators (RSI, volatility, price change)
  - [ ] Visual trend indication (arrows, colors)

- [ ] **Strategy Suggestions:**
  - [ ] Card per coin showing:
    - Top 3 suggested strategies
    - Confidence % for each
    - Reasoning (e.g., "Uptrend → Use Momentum")
  - [ ] Clickable to register strategy

### Phase 6: Copilot Mode UI (20 minutes)
- [ ] **Status Display:**
  - [ ] Copilot active/inactive toggle
  - [ ] Fetch from `GET /api/copilot/status`

- [ ] **Alert Configuration:**
  - [ ] Coin selector
  - [ ] Strategy multi-select
  - [ ] Alert type checkboxes (signal, risk)
  - [ ] Enable button → `POST /api/copilot/enable-alerts`

- [ ] **Active Alerts Section:**
  - [ ] Real-time alert list
  - [ ] Fetch from `GET /api/copilot/active-alerts`
  - [ ] Alert details (coin, strategy, signal type, timestamp)
  - [ ] Dismiss/action buttons

### Phase 7: Common Components (20 minutes)
- [ ] Metrics cards (reusable component)
- [ ] Data tables (reusable, sortable)
- [ ] Charts (reusable wrappers)
- [ ] Form inputs (strategy parameters)
- [ ] Loading spinners
- [ ] Error/success notifications (toast)
- [ ] Modals/dialogs

### Phase 8: Routing & Navigation (15 minutes)
- [ ] Routes:
  - `/` - Live trading
  - `/optimization` - Backtesting
  - `/trend-analysis` - Trend analysis
  - `/copilot` - Copilot mode
  - `/dashboard` - Overall dashboard
  - `/settings` - Configuration

- [ ] Navigation:
  - [ ] Main menu links
  - [ ] Tab-based mode switching
  - [ ] Breadcrumbs

### Phase 9: Styling & Polish (30 minutes)
- [ ] Tailwind CSS utility classes
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark/light mode toggle
- [ ] Color scheme consistency
- [ ] Icons (FontAwesome or similar)
- [ ] Animations & transitions

### Phase 10: Testing & Debugging (30 minutes)
- [ ] Test with real backend:
  ```bash
  # Terminal 1: Start backend
  cd backend
  python main.py
  
  # Terminal 2: Start frontend
  npm start
  ```
- [ ] Test each mode
- [ ] Test WebSocket connection
- [ ] Error handling
- [ ] Edge cases
- [ ] Browser console errors

---

## 🔗 KEY API ENDPOINTS TO INTEGRATE

### Live Mode
```javascript
// Start engine
POST /api/engine/start?data_source=binance&coins=BTC,ETH

// Register strategy
POST /api/strategies/register
Body: {
  strategy_name: "SMA_Crossover",
  coin: "BTC",
  params: {fast_period: 5, slow_period: 20}
}

// Get metrics
GET /api/metrics

// Get strategy metrics
GET /api/metrics/{strategy_id}

// Get trades
GET /api/trades?limit=100

// WebSocket
WS /ws/metrics
WS /ws/trades
```

### Optimization Mode
```javascript
// Upload CSV
POST /api/optimization/upload-csv
(multipart/form-data with file)

// Run backtest
POST /api/optimization/backtest
Body: {
  csv_path: "/path/to/file.csv",
  strategy_configs: [...]
}

// Get best combos
GET /api/optimization/best-combos

// Get strategies for coin
GET /api/optimization/strategies-for-coin?coin=BTC

// Get recommendations
GET /api/optimization/recommendations
```

### Trend Analysis Mode
```javascript
// Upload CSV
POST /api/trend-analysis/upload-csv

// Analyze
POST /api/trend-analysis/analyze
Body: {csv_path: "/path/to/file.csv"}

// Get suggestions for coin
GET /api/trend-analysis/suggestions-for-coin?coin=BTC
```

### Copilot Mode
```javascript
// Enable alerts
POST /api/copilot/enable-alerts
Body: {
  coin: "BTC",
  strategies: ["SMA_Crossover"],
  alert_types: ["signal", "risk"]
}

// Get active alerts
GET /api/copilot/active-alerts

// Get status
GET /api/copilot/status
```

---

## 📊 RECOMMENDED UI FLOW

### Live Trading Mode
```
1. Select/Register Strategies
   ↓
2. Choose Data Source & Coins
   ↓
3. Click Start
   ↓
4. Real-time Metrics Update (via WebSocket)
   ↓
5. Monitor Charts & Trades
   ↓
6. Click Stop
```

### Optimization Mode
```
1. Upload CSV file
   ↓
2. Select Strategies & Coins
   ↓
3. Run Backtest
   ↓
4. View Results & Rankings
   ↓
5. See Recommendations
```

### Trend Analysis Mode
```
1. Upload CSV file
   ↓
2. Analyze Trends
   ↓
3. View Trend Summary
   ↓
4. See Strategy Suggestions
   ↓
5. Optionally Register Strategies
```

### Copilot Mode
```
1. Enable Copilot
   ↓
2. Configure Alerts (coin, strategy, types)
   ↓
3. Monitor Active Alerts
   ↓
4. See Recommendations & Signals
```

---

## 🎨 FIGMA DESIGN HINTS

### Key Sections:
1. **Header:** Logo, Mode tabs, Health status
2. **Sidebar:** Navigation menu
3. **Main Content:**
   - Live mode: Strategy panel + Engine control + Metrics + Charts + Trades
   - Optimization: File upload + Configuration + Results
   - Trend: File upload + Analysis + Suggestions
   - Copilot: Status + Alerts + Configuration
4. **Footer:** System status, Uptime

### Color Scheme:
- Primary: #2563eb (Blue)
- Success: #10b981 (Green)
- Warning: #f59e0b (Amber)
- Danger: #ef4444 (Red)
- Background: #f9fafb (Light gray)
- Text: #1f2937 (Dark gray)

### Typography:
- Headings: Inter Bold
- Body: Inter Regular
- Numbers: Roboto Mono (for metrics)

---

## 📱 RESPONSIVE DESIGN BREAKPOINTS

- **Mobile (< 640px):** Single column, stacked layout
- **Tablet (640px - 1024px):** 2 columns
- **Desktop (> 1024px):** 3+ columns, full layouts

---

## ✅ QUALITY CHECKLIST

- [ ] All API endpoints connected
- [ ] Real-time updates working
- [ ] Error messages displayed
- [ ] Loading states shown
- [ ] Mobile responsive
- [ ] Charts rendering correctly
- [ ] Tables sortable/filterable
- [ ] Forms validating
- [ ] No console errors
- [ ] Proper error handling

---

## 🚀 DEPLOYMENT

### Local Testing:
```bash
# Backend
cd backend
python main.py  # Runs on http://localhost:8000

# Frontend (new terminal)
npm start  # Runs on http://localhost:3000
```

### Production Deployment (Future):
- Backend: Deploy to AWS/Heroku/DigitalOcean
- Frontend: Deploy to Vercel/Netlify
- Setup reverse proxy (nginx)
- Configure CORS for production domain

---

## 📞 BACKEND API DOCUMENTATION

Available at: `http://localhost:8000/docs` (Swagger UI)

Backend developer contact for any API questions.

---

## 🎯 SUCCESS CRITERIA

✅ All 4 modes have functional UI
✅ Real-time WebSocket updates working
✅ All user interactions connected to backend
✅ Charts and visualizations displaying
✅ Responsive design working
✅ Error handling in place
✅ Clean, maintainable code
✅ Documentation complete

---

**Let's build something amazing! 🚀**
