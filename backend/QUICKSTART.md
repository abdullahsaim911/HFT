# VELOCITAS HFT ENGINE - Quick Start Guide

## Installation (2 minutes)

```bash
# Navigate to backend folder
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the server
python main.py
```

Server will be available at: `http://localhost:8000`

## Mode 1: LIVE TRADING (Real-time with Live Crypto Data)

### Step 1: Start Engine
```bash
curl -X POST "http://localhost:8000/api/engine/start?data_source=binance&coins=BTC,ETH,BNB"
```

### Step 2: Register Strategies
```bash
# Register SMA Crossover on BTC
curl -X POST "http://localhost:8000/api/strategies/register" \
  -H "Content-Type: application/json" \
  -d '{
    "strategy_name": "SMA_Crossover",
    "coin": "BTC",
    "params": {"fast_period": 5, "slow_period": 20, "position_size": 1.0}
  }'

# Register Momentum on ETH
curl -X POST "http://localhost:8000/api/strategies/register" \
  -H "Content-Type: application/json" \
  -d '{
    "strategy_name": "Momentum",
    "coin": "ETH",
    "params": {"lookback": 5, "position_size": 1.0}
  }'
```

### Step 3: Monitor Real-time Updates
```bash
# Get current metrics
curl "http://localhost:8000/api/metrics" | jq .

# Get trades
curl "http://localhost:8000/api/trades?limit=10" | jq .

# Connect WebSocket for live updates (in browser console or Python)
# JavaScript:
# const ws = new WebSocket("ws://localhost:8000/ws/metrics");
# ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

### Step 4: Stop Trading
```bash
curl -X POST "http://localhost:8000/api/engine/stop"
```

---

## Mode 2: OPTIMIZATION MODE (Backtesting on Historical CSV Data)

### Step 1: Prepare CSV File
Create `market_data.csv`:
```
coin,price,volume,timestamp
BTC,45000.50,1000.0,1702500000
BTC,45100.20,1100.0,1702500060
BTC,45200.30,1200.0,1702500120
ETH,2500.00,500.0,1702500000
ETH,2510.50,520.0,1702500060
```

### Step 2: Upload CSV
```bash
curl -X POST "http://localhost:8000/api/optimization/upload-csv" \
  -F "file=@market_data.csv"
```

Response:
```json
{
  "file_path": "/tmp/market_data.csv",
  "data_points": 5,
  "coins": ["BTC", "ETH"]
}
```

### Step 3: Run Backtest
```bash
curl -X POST "http://localhost:8000/api/optimization/backtest" \
  -H "Content-Type: application/json" \
  -d '{
    "csv_path": "/tmp/market_data.csv",
    "strategy_configs": [
      {
        "name": "SMA_Crossover",
        "coin": "BTC",
        "params": {"fast_period": 5, "slow_period": 20}
      },
      {
        "name": "Momentum",
        "coin": "BTC",
        "params": {"lookback": 5}
      },
      {
        "name": "RSI",
        "coin": "ETH",
        "params": {"period": 14}
      }
    ]
  }'
```

### Step 4: View Results
```bash
# Get best strategy-coin combinations
curl "http://localhost:8000/api/optimization/best-combos" | jq .

# Get recommendations for specific coin
curl "http://localhost:8000/api/optimization/strategies-for-coin?coin=BTC" | jq .

# Get overall recommendations
curl "http://localhost:8000/api/optimization/recommendations" | jq .
```

---

## Mode 3: TREND ANALYSIS MODE (Market Trend Detection)

### Step 1: Upload CSV
```bash
curl -X POST "http://localhost:8000/api/trend-analysis/upload-csv" \
  -F "file=@market_data.csv"
```

### Step 2: Analyze Trends
```bash
curl -X POST "http://localhost:8000/api/trend-analysis/analyze" \
  -H "Content-Type: application/json" \
  -d '{"csv_path": "/tmp/market_data.csv"}'
```

Response includes:
- Trend type (uptrend, downtrend, sideways, volatile)
- Technical indicators (RSI, volatility)
- Suggested strategies

### Step 3: Get Strategy Suggestions for Coin
```bash
curl "http://localhost:8000/api/trend-analysis/suggestions-for-coin?coin=BTC" | jq .
```

---

## Mode 4: COPILOT MODE (Live Monitoring & Alerts)

### Step 1: Enable Copilot Alerts
```bash
curl -X POST "http://localhost:8000/api/copilot/enable-alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "coin": "BTC",
    "strategies": ["SMA_Crossover", "Momentum"],
    "alert_types": ["signal", "risk"]
  }'
```

### Step 2: Check Active Alerts
```bash
curl "http://localhost:8000/api/copilot/active-alerts" | jq .
```

---

## API Reference Quick Lookup

### Health & Status
- `GET /api/health` - System health check

### Strategies Management
- `GET /api/strategies` - List registered strategies
- `POST /api/strategies/register` - Register new strategy
- `POST /api/strategies/unregister` - Unregister strategy
- `GET /api/available-strategies` - List all available strategies

### Metrics & Data
- `GET /api/metrics` - Global metrics
- `GET /api/metrics/{strategy_id}` - Strategy-specific metrics
- `GET /api/trades` - Trade history
- `GET /api/pnl` - P&L history

### Engine Control
- `POST /api/engine/start` - Start trading engine
- `POST /api/engine/stop` - Stop trading engine

### WebSockets (Real-time)
- `WS /ws/metrics` - Stream metrics updates (1/sec)
- `WS /ws/trades` - Stream new trades

### Optimization
- `POST /api/optimization/upload-csv` - Upload market data
- `POST /api/optimization/backtest` - Run backtest
- `GET /api/optimization/best-combos` - Get best strategy-coin combinations
- `GET /api/optimization/strategies-for-coin` - Rank strategies for coin

### Trend Analysis
- `POST /api/trend-analysis/upload-csv` - Upload market data
- `POST /api/trend-analysis/analyze` - Analyze trends
- `GET /api/trend-analysis/suggestions-for-coin` - Get strategy suggestions

### Copilot
- `GET /api/copilot/status` - Copilot mode status
- `POST /api/copilot/enable-alerts` - Enable alerts
- `GET /api/copilot/active-alerts` - View active alerts

---

## Common Scenarios

### Scenario 1: Test 3 Strategies on BTC in Live Mode
```bash
# Start engine
curl -X POST "http://localhost:8000/api/engine/start?data_source=binance&coins=BTC"

# Register strategies
curl -X POST "http://localhost:8000/api/strategies/register" \
  -H "Content-Type: application/json" \
  -d '{"strategy_name": "SMA_Crossover", "coin": "BTC", "params": {}}'

curl -X POST "http://localhost:8000/api/strategies/register" \
  -H "Content-Type: application/json" \
  -d '{"strategy_name": "RSI", "coin": "BTC", "params": {}}'

curl -X POST "http://localhost:8000/api/strategies/register" \
  -H "Content-Type: application/json" \
  -d '{"strategy_name": "MACD", "coin": "BTC", "params": {}}'

# Monitor (repeat to see updates)
curl "http://localhost:8000/api/metrics" | jq '.global_metrics | {total_trades, net_pnl, win_rate}'

# Stop when done
curl -X POST "http://localhost:8000/api/engine/stop"
```

### Scenario 2: Compare 2 Strategies on 3 Coins (Backtesting)
```bash
# Run backtest with 2 strategies on 3 coins
curl -X POST "http://localhost:8000/api/optimization/backtest" \
  -H "Content-Type: application/json" \
  -d '{
    "csv_path": "/path/to/data.csv",
    "strategy_configs": [
      {"name": "SMA_Crossover", "coin": "BTC", "params": {}},
      {"name": "SMA_Crossover", "coin": "ETH", "params": {}},
      {"name": "SMA_Crossover", "coin": "BNB", "params": {}},
      {"name": "Momentum", "coin": "BTC", "params": {}},
      {"name": "Momentum", "coin": "ETH", "params": {}},
      {"name": "Momentum", "coin": "BNB", "params": {}}
    ]
  }'

# Get rankings
curl "http://localhost:8000/api/optimization/best-combos" | jq '.all_rankings'
```

### Scenario 3: Analyze Market Trends for 5 Coins
```bash
# Upload data
curl -X POST "http://localhost:8000/api/trend-analysis/upload-csv" \
  -F "file=@market_data.csv"

# Analyze
curl -X POST "http://localhost:8000/api/trend-analysis/analyze" \
  -H "Content-Type: application/json" \
  -d '{"csv_path": "/path/to/data.csv"}'

# Get suggestions for each coin
# (repeat for each coin: BTC, ETH, BNB, etc.)
curl "http://localhost:8000/api/trend-analysis/suggestions-for-coin?coin=BTC" | jq '.suggested_strategies'
```

---

## Using with Frontend

The frontend should:

1. Call `GET /api/available-strategies` to display dropdown
2. Call `POST /api/strategies/register` when user selects strategy
3. Call `POST /api/engine/start` to begin trading
4. Connect to `WS /ws/metrics` for real-time updates
5. Call `GET /api/metrics` on demand for full snapshot
6. Call `POST /api/engine/stop` to end trading

WebSocket message format:
```json
{
  "type": "metrics",
  "global": {
    "status": "running",
    "total_trades": 5,
    "net_pnl": 250.50,
    "win_rate": 60.0
  },
  "strategies": {
    "BTC_SMA_Crossover": {
      "net_pnl": 150.00,
      "trades": 3,
      "win_rate": 66.7
    }
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

---

## Tips for Success

✅ **Start with synthetic data** - Use `data_source=synthetic` for testing
✅ **Small position sizes** - Start with position_size=0.1
✅ **Monitor logs** - Watch console output for errors
✅ **Use WebSocket** - Better than polling for real-time updates
✅ **Test strategies first** - Run backtest before live trading
✅ **Parallel execution** - All strategies run simultaneously for best performance
✅ **Lock safety** - All shared data is protected by locks

---

## Need Help?

1. Check API docs: `http://localhost:8000/docs`
2. View backend README: `backend/README.md`
3. Check logs in console output
4. Validate strategy config: `POST /api/validate-strategy-config`
