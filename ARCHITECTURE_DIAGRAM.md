# VELOCITAS HFT ENGINE - SYSTEM ARCHITECTURE DIAGRAM

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                        FRONTEND (React + Figma)                         │
│                  (Charts, Tables, Real-time Metrics)                    │
│                                                                           │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼ HTTP/REST    ▼ WebSocket    ▼ HTTP
    ┌─────────────────────────────────────────┐
    │      FASTAPI SERVER (port 8000)         │
    │ ┌──────────────────────────────────────┐│
    │ │ Route Handlers:                      ││
    │ │ - Strategy Management                ││
    │ │ - Engine Control                     ││
    │ │ - Metrics Retrieval                  ││
    │ │ - Optimization Endpoints             ││
    │ │ - Trend Analysis Endpoints           ││
    │ │ - Copilot Endpoints                  ││
    │ └──────────────────────────────────────┘│
    └────────────────┬────────────────────────┘
                     │
                     ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │              HFT ENGINE (In-Process)                            │
    │                                                                  │
    │  ┌───────────────────────────────────────────────────────────┐ │
    │  │ SHARED STATE (multiprocessing.Manager)                   │ │
    │  │                                                           │ │
    │  │  metrics: Dict                                           │ │
    │  │  ├─ total_trades: int                                   │ │
    │  │  ├─ net_pnl: float                                      │ │
    │  │  ├─ win_rate: float                                     │ │
    │  │  └─ ...                                                 │ │
    │  │                                                           │ │
    │  │  strategy_metrics: Dict[strategy_id → metrics]          │ │
    │  │  pnl_history: List[(timestamp, strategy_id, pnl)]       │ │
    │  │  trades: List[Trade records]                            │ │
    │  │                                                           │ │
    │  └───────────────────────────────────────────────────────────┘ │
    │                           ▲                                     │
    │                           │ Protected by                        │
    │                           ▼                                     │
    │  ┌───────────────────────────────────────────────────────────┐ │
    │  │ GLOBAL LOCK (multiprocessing.Lock)                       │ │
    │  │                                                           │ │
    │  │ All writes to shared state must acquire lock:           │ │
    │  │   with engine.lock:                                     │ │
    │  │       metrics['total_trades'] += 1  # SAFE             │ │
    │  │       trades.append(trade)          # SAFE             │ │
    │  │                                                           │ │
    │  └───────────────────────────────────────────────────────────┘ │
    └────┬────────────────────────────────────┬──────────────────┬───┘
         │                                    │                  │
         ▼                                    ▼                  ▼
    ┌──────────────┐          ┌──────────────────┐      ┌──────────────┐
    │   PRODUCER   │          │    CONSUMER      │      │  MULTITHREAD │
    │   THREAD     │          │    THREAD        │      │   SUPPORT    │
    │              │          │                  │      │              │
    │ Fetches data │          │ Dispatches to    │      │ (For future  │
    │ from API/CSV │          │ ProcessPool      │      │  multi-mode) │
    │ Puts in Queue│          │ Collects results │      │              │
    └──────┬───────┘          └─────────┬────────┘      └──────────────┘
           │                            │
           └────────────┬───────────────┘
                        ▼
            ┌─────────────────────────┐
            │  QUEUE (Thread-safe)    │
            │                         │
            │  Market data stream →   │
            │  Ready for processing   │
            └────────────┬────────────┘
                         │
                         ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │      ProcessPoolExecutor (4+ Worker Processes)                  │
    │                                                                  │
    │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
    │  │   WORKER 1     │  │   WORKER 2     │  │   WORKER 3     │ ...│
    │  │                │  │                │  │                │    │
    │  │ Strategy       │  │ Strategy       │  │ Strategy       │    │
    │  │ Execution      │  │ Execution      │  │ Execution      │    │
    │  │ (BTC_SMA)      │  │ (BTC_Momentum) │  │ (ETH_RSI)      │    │
    │  │                │  │                │  │                │    │
    │  │ CPU Core 1     │  │ CPU Core 2     │  │ CPU Core 3     │    │
    │  └────────────────┘  └────────────────┘  └────────────────┘    │
    │         ▲                   ▲                   ▲                 │
    │         │                   │                   │                 │
    │         └───────────────────┼───────────────────┘                 │
    │                             │                                     │
    │                      TRULY PARALLEL                              │
    │                   (4 CPU cores simultaneously)                   │
    │                                                                  │
    └──────────────────────────────────────────────────────────────────┘
```

## Detailed Data Flow - Live Trading Mode

```
USER INTERACTION (Frontend)
│
├─ Click "Start" with Binance, BTC,ETH
│  │
│  └─→ POST /api/engine/start?data_source=binance&coins=BTC,ETH
│      │
│      └─→ Creates HFTEngine(mode=LIVE, workers=4)
│          Starts producer & consumer threads
│
├─ Registers Strategies
│  │
│  ├─ POST /api/strategies/register (BTC_SMA_Crossover)
│  ├─ POST /api/strategies/register (BTC_Momentum)
│  ├─ POST /api/strategies/register (ETH_RSI)
│  └─ POST /api/strategies/register (ETH_MACD)
│      │
│      └─→ Each stored in strategies dict
│          Each initialized in strategy_metrics
│
└─ Monitors Real-time Updates
   │
   ├─ WS /ws/metrics (every 1 second)
   │  │
   │  └─→ Frontend receives:
   │      {
   │        "type": "metrics",
   │        "global": {
   │          "total_trades": 5,
   │          "net_pnl": 250.50,
   │          "win_rate": 60.0
   │        },
   │        "strategies": {
   │          "BTC_SMA_Crossover": {...},
   │          "BTC_Momentum": {...},
   │          "ETH_RSI": {...},
   │          "ETH_MACD": {...}
   │        }
   │      }
   │
   └─ WS /ws/trades (instantly)
      │
      └─→ Frontend receives each trade as it happens

════════════════════════════════════════════════════════════════

BACKEND PROCESSING (Happens in parallel)

BINANCE API
     │
     ├─→ {"BTC": 45000.50, ...}  Time: T+0ms
     ├─→ {"ETH": 2500.00, ...}   Time: T+100ms
     ├─→ {"BTC": 45100.00, ...}  Time: T+200ms
     └─→ ...
         │
         ▼
    PRODUCER THREAD
    │
    └─→ Puts data in Queue
        │
        ├─→ BTC at 45000.50 → Queue
        ├─→ ETH at 2500.00 → Queue
        ├─→ BTC at 45100.00 → Queue
        └─→ ...
            │
            ▼
        CONSUMER THREAD
        │
        ├─→ Get: BTC at 45000.50
        │   │
        │   ├─→ Strategy Check: Is coin = BTC?
        │   │   ├─→ Yes! BTC_SMA_Crossover → executor.submit()
        │   │   ├─→ Yes! BTC_Momentum → executor.submit()
        │   │   └─→ No: ETH_RSI, ETH_MACD (skip)
        │   │
        │   └─→ Both jobs submitted to ProcessPool (0ms)
        │       ├─→ WORKER 1 executes BTC_SMA_Crossover (CPU Core 1)
        │       └─→ WORKER 2 executes BTC_Momentum (CPU Core 2)
        │           └─→ Results in parallel!
        │
        ├─→ Get: ETH at 2500.00
        │   │
        │   ├─→ Strategy Check: Is coin = ETH?
        │   │   ├─→ No: BTC_SMA_Crossover, BTC_Momentum (skip)
        │   │   ├─→ Yes! ETH_RSI → executor.submit()
        │   │   └─→ Yes! ETH_MACD → executor.submit()
        │   │
        │   └─→ Both jobs submitted to ProcessPool (0ms)
        │       ├─→ WORKER 3 executes ETH_RSI (CPU Core 3)
        │       └─→ WORKER 4 executes ETH_MADC (CPU Core 4)
        │           └─→ Results in parallel!
        │
        └─→ Collect Results (as workers finish)
            │
            ├─→ BTC_SMA_Crossover → ('BUY', 1.0)
            ├─→ BTC_Momentum → None
            ├─→ ETH_RSI → ('SELL', 0.5)
            └─→ ETH_MACD → None
                │
                ▼
            PROCESS TRADE (Protected by Lock)
            │
            ├─→ WITH LOCK:
            │   ├─→ BTC_SMA_Crossover: Add trade, update metrics, update P&L
            │   ├─→ ETH_RSI: Add trade, update metrics, update P&L
            │   └─→ Release Lock (microseconds held)
            │
            └─→ Metrics updated:
                ├─→ metrics['total_trades'] = 2
                ├─→ metrics['net_pnl'] += pnl
                ├─→ strategy_metrics['BTC_SMA_Crossover'] updated
                ├─→ strategy_metrics['ETH_RSI'] updated
                └─→ pnl_history.append([...])

════════════════════════════════════════════════════════════════

EVERY 1 SECOND: WebSocket broadcasts metrics to all connected frontends
```

## Data Structure - What Gets Tracked

```
ENGINE.METRICS (Dict)
{
  'mode': 'live',
  'status': 'running',
  'total_trades': 5,
  'total_profit': 1000.0,
  'total_loss': 499.50,
  'net_pnl': 500.50,
  'win_rate': 60.0,
  'active_strategies': 4,
  'active_coins': 2,
  'max_drawdown': 250.0,
  'sharpe_ratio': 1.5,
  'last_update': '2024-01-01T12:00:00'
}

ENGINE.STRATEGY_METRICS (Dict)
{
  'BTC_SMA_Crossover': {
    'strategy_id': 'BTC_SMA_Crossover',
    'coin': 'BTC',
    'strategy_name': 'SMA_Crossover',
    'total_trades': 3,
    'winning_trades': 2,
    'losing_trades': 1,
    'total_profit': 600.0,
    'total_loss': 100.0,
    'net_pnl': 500.0,
    'current_position': 1.0,
    'entry_price': 45000.0,
    'max_drawdown': 100.0,
    'win_rate': 66.7,
    'sharpe_ratio': 1.8
  },
  'BTC_Momentum': {...},
  'ETH_RSI': {...},
  'ETH_MACD': {...}
}

ENGINE.TRADES (List)
[
  {
    'coin': 'BTC',
    'strategy': 'SMA_Crossover',
    'action': 'BUY',
    'price': 45000.0,
    'quantity': 1.0,
    'timestamp': 1702500000.0,
    'profit_loss': 0.0,
    'position_size': 1.0
  },
  {
    'coin': 'BTC',
    'strategy': 'SMA_Crossover',
    'action': 'SELL',
    'price': 45500.0,
    'quantity': 1.0,
    'timestamp': 1702500060.0,
    'profit_loss': 500.0,  # (45500 - 45000) * 1
    'position_size': 0.0
  },
  ...
]

ENGINE.PNL_HISTORY (List)
[
  {
    'timestamp': 1702500060.0,
    'strategy_id': 'BTC_SMA_Crossover',
    'pnl': 500.0,
    'position': 0.0
  },
  {
    'timestamp': 1702500120.0,
    'strategy_id': 'ETH_RSI',
    'pnl': -50.0,
    'position': 0.5
  },
  ...
]
```

## Lock Acquisition Pattern

```
Process A (Worker 1)          Process B (Worker 2)
│                             │
├─ Complete task              ├─ Complete task
│                             │
├─ Want to update metrics     ├─ Want to update metrics
│                             │
├─ Acquire Lock ✓             ├─ Try to Acquire Lock...
│                             │   BLOCKED! Waiting for A
├─ Update metrics             │
│  metrics['trades'] += 1     │
│  strategy_metrics[...] = {} │
│  pnl_history.append(...)    │
│  trades.append(...)         │
│                             │
├─ Release Lock               │   ✓ Now have lock!
│                             │
│                             ├─ Update metrics
│                             │  metrics['trades'] += 1
│                             │  strategy_metrics[...] = {}
│                             │  pnl_history.append(...)
│                             │  trades.append(...)
│                             │
│                             ├─ Release Lock
│
Result: All updates applied correctly, zero race conditions!
Lock held: ~microseconds
Throughput: ~1000 updates/second possible
```

## Mode-Specific Data Flow

```
LIVE MODE:                  OPTIMIZATION MODE:
API ──→ Queue ──→ Strategies    CSV File ──→ Load ──→ Strategies
    ↓                                ↓
    All Parallel                     Sequential (Backtest)
    ↓                                ↓
Real-time Metrics           Batch Results & Rankings


TREND ANALYSIS MODE:        COPILOT MODE:
CSV File ──→ Load ──→ Analyzer    API ──→ Monitor ──→ Alert System
    ↓                                ↓
    Trend Detection                 Decision Engine
    ↓                                ↓
    Suggestions                      Notifications
```

This architecture ensures:
✅ **Scalability** - Add more workers for more parallelism
✅ **Reliability** - Lock prevents data corruption
✅ **Responsiveness** - WebSocket for instant updates
✅ **Flexibility** - Multiple modes, multiple data sources
✅ **Performance** - Parallel execution = 4x faster
