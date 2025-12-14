# VELOCITAS HFT ENGINE - Backend Documentation

## Overview

A High-Frequency Trading (HFT) Simulation Engine built with Python for PDC (Parallel and Distributed Computing) project. Supports 4 distinct modes of operation with real-time market data and strategy execution.

## Architecture

### Core Components

1. **engine_core.py** - Main engine with multiprocessing support
   - Manager-based shared state
   - Global Lock for data integrity
   - ProcessPoolExecutor for parallel execution
   - Queue-based producer-consumer pattern
   - Per-(Coin, Strategy) P&L tracking

2. **strategies.py** - Pre-built trading strategies
   - SMA Crossover
   - Momentum
   - Mean Reversion
   - RSI (Relative Strength Index)
   - Bollinger Bands
   - MACD (Moving Average Convergence Divergence)
   - Extensible Strategy ABC for custom strategies

3. **crypto_data_provider.py** - Market data sources
   - Binance API (no auth required)
   - CoinGecko API (free tier)
   - CSV data loader for backtesting
   - Synthetic data generator for testing

4. **backtest_engine.py** - Optimization mode
   - Run strategies on historical CSV data
   - Strategy ranking and comparison
   - P&L analysis and metrics
   - Best strategy-coin recommendations

5. **trend_analyzer.py** - Trend analysis mode
   - Market trend classification
   - Technical indicators (RSI, volatility)
   - Automated strategy suggestions
   - Multi-coin simultaneous analysis

6. **server.py** - FastAPI REST API
   - Full CRUD for strategy management
   - Real-time metrics via WebSockets
   - Trade history and P&L tracking
   - Health checks and system status

7. **routes.py** - Advanced mode endpoints
   - Optimization/backtesting routes
   - Trend analysis routes
   - Copilot mode routes
   - Strategy validation

## Modes of Operation

### 1. LIVE TRADING MODE
Real-time trading with live market data.

**Features:**
- Register multiple strategies on same/different coins
- Real-time P&L tracking per strategy and coin
- Parallel strategy execution
- WebSocket real-time updates to frontend

**API Endpoints:**
```
POST   /api/strategies/register
POST   /api/strategies/unregister
GET    /api/strategies
GET    /api/metrics
GET    /api/trades
POST   /api/engine/start?data_source=binance&coins=BTC,ETH
POST   /api/engine/stop
WS     /ws/metrics
WS     /ws/trades
```

**Data Sources:**
- Binance (recommended - fastest, most reliable)
- CoinGecko (free, slower)
- Synthetic (testing only)

### 2. OPTIMIZATION MODE
Backtesting and strategy optimization on historical data.

**Features:**
- Upload multiple CSV files with market data
- Test multiple strategies on same coins
- Comprehensive metrics (Sharpe, max drawdown, win rate)
- Strategy ranking by various metrics
- Best strategy-coin combo identification
- Automated recommendations

**API Endpoints:**
```
POST   /api/optimization/upload-csv
POST   /api/optimization/backtest
GET    /api/optimization/strategies-for-coin?coin=BTC
GET    /api/optimization/best-combos
GET    /api/optimization/recommendations
```

**CSV Format:**
```
coin,price,volume,timestamp
BTC,45000.50,1000.0,1702500000
BTC,45100.20,1100.0,1702500060
ETH,2500.00,500.0,1702500000
```

### 3. TREND ANALYSIS MODE
Market trend detection and automated strategy suggestions.

**Features:**
- Upload CSV market data
- Detect trend type (uptrend, downtrend, sideways, volatile)
- Calculate technical indicators (RSI, volatility)
- Suggest best strategies per trend
- Multi-coin simultaneous analysis

**API Endpoints:**
```
POST   /api/trend-analysis/upload-csv
POST   /api/trend-analysis/analyze
GET    /api/trend-analysis/suggestions-for-coin?coin=BTC
```

### 4. COPILOT MODE
Live monitoring with alerts and automated decision support.

**Features:**
- Real-time price monitoring
- Automated signal generation
- Alert notifications
- Risk management
- Performance tracking

**API Endpoints:**
```
GET    /api/copilot/status
POST   /api/copilot/enable-alerts
GET    /api/copilot/active-alerts
```

## Parallel Execution Model

### How Parallelism Works

1. **Data Producer** (Main thread)
   - Fetches market data from API/CSV
   - Puts data into Queue
   - Minimal processing

2. **Data Consumer** (Background thread)
   - Pulls from Queue
   - Dispatches strategies to ProcessPool
   - Collects results and updates shared metrics

3. **Strategy Workers** (Worker processes)
   - Execute strategy logic in parallel
   - CPU-bound operations
   - No shared state access (except through Manager)

4. **Lock Protection**
   - All writes to metrics, P&L, trades protected by global Lock
   - Guarantees data consistency
   - Zero race conditions

### Example Flow

```
API Request: POST /api/engine/start?data_source=binance&coins=BTC,ETH

1. Create HFTEngine with ProcessPoolExecutor(4)
2. Register strategies (e.g., SMA on BTC, Momentum on ETH)
3. Start producer thread → fetch from Binance API
4. Start consumer thread → execute strategies in parallel
5. Strategies run in 4 worker processes
6. Results protected by Lock before updating shared state
7. WebSocket broadcasts updates to frontend every 1 second
```

## Strategy Development

### Create Custom Strategy

```python
from engine_core import Strategy, MarketData
from typing import Optional, Tuple

class MyStrategy(Strategy):
    def __init__(self, coin: str, param1: float = 1.0, **kwargs):
        super().__init__('MyStrategy', coin, param1=param1)
        self.param1 = param1
    
    def execute(self, market_data: MarketData) -> Optional[Tuple[str, float]]:
        # Your logic here
        # Return ('BUY', quantity) or ('SELL', quantity) or None
        pass

# Register and use
strategy = MyStrategy('BTC', param1=2.0)
engine.register_strategy(strategy)
```

### Built-in Strategies

All strategies accept `position_size` parameter for trade quantity:

| Strategy | Best For | Parameters |
|----------|----------|-----------|
| SMA_Crossover | Trending | fast_period, slow_period, position_size |
| Momentum | Uptrends | lookback, momentum_threshold, position_size |
| MeanReversion | Sideways | period, deviation_threshold, position_size |
| RSI | Overbought/Oversold | period, lower_bound, upper_bound, position_size |
| BollingerBands | Volatile | period, std_dev, position_size |
| MACD | Trend Confirmation | fast, slow, signal, position_size |

## Installation & Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Run Server
```bash
python main.py
```

Server starts on `http://localhost:8000`

### 3. Access API Documentation
Open browser: `http://localhost:8000/docs`

## API Usage Examples

### Register Strategy
```bash
curl -X POST "http://localhost:8000/api/strategies/register" \
  -H "Content-Type: application/json" \
  -d '{
    "strategy_name": "SMA_Crossover",
    "coin": "BTC",
    "params": {"fast_period": 5, "slow_period": 20}
  }'
```

### Start Live Trading
```bash
curl -X POST "http://localhost:8000/api/engine/start?data_source=binance&coins=BTC,ETH"
```

### Get Metrics
```bash
curl "http://localhost:8000/api/metrics"
```

### WebSocket Metrics (JavaScript)
```javascript
const ws = new WebSocket("ws://localhost:8000/ws/metrics");
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Metrics:", data.global);
};
```

## Data Integrity Guarantees

✅ **Thread-Safety:** All shared data protected by multiprocessing.Lock
✅ **ACID Properties:** Metrics and P&L updates are atomic
✅ **No Race Conditions:** Lock ensures sequential access
✅ **Consistency:** All processes see same state after Lock release

## Performance Metrics

Expected performance with 4 workers:

- **Data processing:** 100-1000 data points/second
- **Strategy execution latency:** <10ms per strategy
- **Metrics update latency:** <50ms (Lock contention)
- **Memory usage:** ~500MB for typical setup

## Monitoring & Debugging

### Health Check
```bash
curl http://localhost:8000/api/health
```

### Get All Metrics
```bash
curl http://localhost:8000/api/metrics | jq .
```

### Get Strategy-Specific Metrics
```bash
curl "http://localhost:8000/api/metrics/BTC_SMA_Crossover" | jq .
```

### Get Trades
```bash
curl "http://localhost:8000/api/trades?limit=50" | jq .
```

## Frontend Integration

The frontend should:

1. **Register strategies** via REST API
2. **Start engine** with selected coins and data source
3. **Connect WebSocket** for real-time updates
4. **Display metrics** from `/api/metrics` endpoint
5. **Show trades** from `/api/trades` endpoint
6. **Plot P&L history** from `/api/pnl` endpoint
7. **Stop engine** when finished

## Troubleshooting

### Engine won't start
- Check if Binance API is accessible
- Verify coin symbols are valid (BTC, ETH, BNB, etc.)
- Check logs for specific errors

### Low performance
- Reduce number of strategies
- Increase num_workers in HFTEngine init
- Use SyntheticDataGenerator instead of API for testing

### WebSocket disconnects
- Check frontend connection logic
- Verify CORS middleware is enabled
- Check firewall/network connectivity

## Future Enhancements

- [ ] Multi-exchange support (Kraken, Huobi, etc.)
- [ ] Advanced risk management (stop-loss, take-profit)
- [ ] Machine learning strategy training
- [ ] Portfolio management and allocation
- [ ] Historical backtest comparison
- [ ] Real trading integration (paper trading first)

## License

Academic Project - PDC Course
