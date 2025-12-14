"""
VELOCITAS HFT ENGINE - FastAPI Server
REST API + WebSocket streaming for real-time frontend updates.

Endpoints:
- POST /api/strategies/register - Register strategy
- POST /api/strategies/unregister - Unregister strategy
- GET /api/strategies - Get all registered strategies
- GET /api/metrics - Get global metrics
- GET /api/metrics/{strategy_id} - Get strategy-specific metrics
- GET /api/trades - Get trades history
- GET /api/trades/{strategy_id} - Get strategy trades
- POST /api/engine/start - Start engine
- POST /api/engine/stop - Stop engine
- WS /ws/metrics - WebSocket real-time metrics updates
- WS /ws/trades - WebSocket real-time trade updates
"""

from fastapi import FastAPI, WebSocket, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import logging
from typing import List, Dict, Optional
from datetime import datetime
import threading

from engine_core import HFTEngine, EngineMode, Strategy
from strategies import create_strategy, AVAILABLE_STRATEGIES

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Velocitas HFT Engine",
    description="High-Frequency Trading Simulation Engine with Parallel Processing",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global engine instance
engine: Optional[HFTEngine] = None
engine_lock = threading.Lock()

# WebSocket manager for broadcasting
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"WebSocket broadcast error: {e}")


manager = ConnectionManager()


# ==================== INITIALIZATION ====================

@app.on_event("startup")
async def startup_event():
    """Initialize engine on startup."""
    global engine
    with engine_lock:
        engine = HFTEngine(mode=EngineMode.LIVE, num_workers=4)
    logger.info("Engine initialized")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    global engine
    if engine:
        engine.shutdown()


# ==================== STRATEGY MANAGEMENT ====================

@app.post("/api/strategies/register")
async def register_strategy(
    strategy_name: str,
    coin: str,
    params: Dict = None
) -> Dict:
    """
    Register a new strategy for a coin.
    
    Args:
        strategy_name: Name of strategy (e.g., 'SMA_Crossover')
        coin: Target coin (e.g., 'BTC')
        params: Strategy parameters (optional)
    """
    if engine is None:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    if strategy_name not in AVAILABLE_STRATEGIES:
        raise HTTPException(
            status_code=400, 
            detail=f"Unknown strategy. Available: {list(AVAILABLE_STRATEGIES.keys())}"
        )
    
    try:
        params = params or {}
        strategy = create_strategy(strategy_name, coin, **params)
        
        if strategy is None:
            raise HTTPException(status_code=400, detail="Failed to create strategy")
        
        engine.register_strategy(strategy)
        
        return {
            "status": "success",
            "message": f"Strategy {strategy_name} registered for {coin}",
            "strategy_id": strategy.get_strategy_id(),
            "config": strategy.get_config()
        }
    except Exception as e:
        logger.error(f"Error registering strategy: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/strategies/unregister")
async def unregister_strategy(strategy_id: str) -> Dict:
    """Unregister a strategy."""
    if engine is None:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    engine.unregister_strategy(strategy_id)
    
    return {
        "status": "success",
        "message": f"Strategy {strategy_id} unregistered"
    }


@app.get("/api/strategies")
async def get_strategies() -> Dict:
    """Get all registered strategies."""
    if engine is None:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    return {
        "strategies": engine.get_registered_strategies(),
        "available_strategies": list(AVAILABLE_STRATEGIES.keys())
    }


# ==================== ENGINE CONTROL ====================

async def run_engine_consumer(data_source):
    """Run engine consumer in background."""
    try:
        engine.consume_market_data()
    except Exception as e:
        logger.error(f"Error in engine consumer: {e}")


async def run_engine_producer(data_source):
    """Run engine producer in background."""
    try:
        engine.produce_market_data(data_source)
    except Exception as e:
        logger.error(f"Error in engine producer: {e}")


@app.post("/api/engine/start")
async def start_engine(
    background_tasks: BackgroundTasks,
    data_source: str = "binance",
    coins: str = "BTC,ETH,BNB",
    interval: int = 1
) -> Dict:
    """
    Start the trading engine.
    
    Args:
        data_source: 'binance', 'coingecko', 'synthetic', or 'csv'
        coins: Comma-separated coin symbols
        interval: Update interval in seconds
    """
    if engine is None:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    if engine.running:
        return {"status": "already_running", "message": "Engine is already running"}
    
    try:
        from data.crypto_data_provider import (
            BinanceDataProvider, CoinGeckoDataProvider, 
            SyntheticDataGenerator, CSVDataLoader
        )
        
        coin_list = [c.strip().upper() for c in coins.split(",")]
        
        # Select data source
        if data_source == "binance":
            provider = BinanceDataProvider(coins=coin_list, interval=interval)
            data_stream = provider.get_live_stream()
        elif data_source == "coingecko":
            coin_ids = [c.lower() for c in coin_list]
            provider = CoinGeckoDataProvider(coins=coin_ids, interval=interval)
            data_stream = provider.get_live_stream()
        elif data_source == "synthetic":
            base_prices = {coin: 45000 if coin == "BTC" else 2500 for coin in coin_list}
            generator = SyntheticDataGenerator(coin_list, base_prices)
            data_stream = generator.continuous_stream(interval=interval)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown data source: {data_source}")
        
        # Start engine in background threads
        engine.running = True
        background_tasks.add_task(run_engine_producer, data_stream)
        background_tasks.add_task(run_engine_consumer, None)
        
        return {
            "status": "success",
            "message": "Engine started",
            "mode": engine.mode.value,
            "data_source": data_source,
            "coins": coin_list,
            "workers": engine.num_workers
        }
    except Exception as e:
        logger.error(f"Error starting engine: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/engine/stop")
async def stop_engine() -> Dict:
    """Stop the trading engine."""
    if engine is None:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    engine.shutdown()
    
    return {
        "status": "success",
        "message": "Engine stopped"
    }


# ==================== METRICS & DATA ====================

@app.get("/api/metrics")
async def get_metrics() -> Dict:
    """Get global engine metrics."""
    if engine is None:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    metrics = engine.get_metrics()
    strategy_metrics = engine.get_strategy_metrics()
    
    return {
        "global_metrics": metrics,
        "strategy_metrics": dict(strategy_metrics),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/metrics/{strategy_id}")
async def get_strategy_metrics(strategy_id: str) -> Dict:
    """Get metrics for a specific strategy."""
    if engine is None:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    metrics = engine.get_strategy_metrics(strategy_id)
    
    if not metrics:
        raise HTTPException(status_code=404, detail=f"Strategy {strategy_id} not found")
    
    pnl_history = engine.get_pnl_history(strategy_id)
    
    return {
        "strategy_id": strategy_id,
        "metrics": metrics,
        "pnl_history": pnl_history,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/trades")
async def get_trades(strategy_id: Optional[str] = None, limit: int = 100) -> Dict:
    """Get trades history."""
    if engine is None:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    trades = engine.get_trades(strategy_id=strategy_id, limit=limit)
    
    return {
        "trades": trades,
        "count": len(trades),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/pnl")
async def get_pnl_history(strategy_id: Optional[str] = None) -> Dict:
    """Get P&L history."""
    if engine is None:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    history = engine.get_pnl_history(strategy_id=strategy_id)
    
    return {
        "pnl_history": history,
        "count": len(history),
        "timestamp": datetime.now().isoformat()
    }


# ==================== HEALTH & STATUS ====================

@app.get("/api/health")
async def health_check() -> Dict:
    """System health check."""
    if engine is None:
        status = "not_initialized"
    elif engine.running:
        status = "running"
    else:
        status = "stopped"
    
    return {
        "status": status,
        "engine_mode": engine.mode.value if engine else None,
        "timestamp": datetime.now().isoformat()
    }


# ==================== WEBSOCKET STREAMING ====================

@app.websocket("/ws/metrics")
async def websocket_metrics(websocket: WebSocket):
    """
    WebSocket endpoint for real-time metrics streaming.
    Sends metrics updates every second.
    """
    await manager.connect(websocket)
    try:
        while True:
            if engine and engine.running:
                metrics = engine.get_metrics()
                strategy_metrics = engine.get_strategy_metrics()
                
                message = {
                    "type": "metrics",
                    "global": metrics,
                    "strategies": dict(strategy_metrics),
                    "timestamp": datetime.now().isoformat()
                }
                
                await websocket.send_json(message)
            
            await asyncio.sleep(1)  # Update every second
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket)


@app.websocket("/ws/trades")
async def websocket_trades(websocket: WebSocket):
    """
    WebSocket endpoint for real-time trade streaming.
    Sends new trades as they occur.
    """
    await manager.connect(websocket)
    last_trade_count = 0
    
    try:
        while True:
            if engine:
                trades = engine.get_trades(limit=1000)
                current_count = len(trades)
                
                # Send new trades only
                if current_count > last_trade_count:
                    new_trades = trades[last_trade_count:]
                    
                    for trade in new_trades:
                        message = {
                            "type": "trade",
                            "trade": trade,
                            "timestamp": datetime.now().isoformat()
                        }
                        await websocket.send_json(message)
                    
                    last_trade_count = current_count
            
            await asyncio.sleep(0.5)  # Check every 500ms
    except Exception as e:
        logger.error(f"WebSocket trade error: {e}")
    finally:
        manager.disconnect(websocket)


# ==================== ROOT ENDPOINT ====================

@app.get("/")
async def root() -> Dict:
    """API documentation root."""
    return {
        "name": "Velocitas HFT Engine",
        "version": "1.0.0",
        "description": "High-Frequency Trading Simulation Engine with Parallel Processing",
        "mode": engine.mode.value if engine else None,
        "endpoints": {
            "health": "GET /api/health",
            "strategies": "GET /api/strategies",
            "register_strategy": "POST /api/strategies/register",
            "metrics": "GET /api/metrics",
            "trades": "GET /api/trades",
            "start_engine": "POST /api/engine/start",
            "stop_engine": "POST /api/engine/stop",
            "ws_metrics": "WS /ws/metrics",
            "ws_trades": "WS /ws/trades"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
