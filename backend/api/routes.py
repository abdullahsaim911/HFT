"""
VELOCITAS HFT ENGINE - API Routes for all modes
Optimization, Trend Analysis, and Copilot modes endpoints.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import List, Dict, Optional
from pathlib import Path
import logging
import tempfile
import os

from data.backtest_engine import BacktestEngine
from data.trend_analyzer import TrendAnalysisService
from engine.strategies import AVAILABLE_STRATEGIES

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["advanced"])

# Initialize services
backtest_engine = BacktestEngine()
trend_service = TrendAnalysisService()


# ==================== OPTIMIZATION MODE ====================

@router.post("/optimization/upload-csv")
async def upload_csv_for_optimization(file: UploadFile = File(...)) -> Dict:
    """
    Upload CSV file for backtesting.
    Expected columns: coin, price, volume, timestamp (optional: bid, ask)
    """
    try:
        # Save uploaded file
        suffix = Path(file.filename).suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Validate file by loading it
        from data.crypto_data_provider import CSVDataLoader
        loader = CSVDataLoader(tmp_path)
        data = list(loader.load_data())
        
        if not data:
            os.unlink(tmp_path)
            raise HTTPException(status_code=400, detail="CSV file is empty or invalid")
        
        return {
            "status": "success",
            "message": "CSV file uploaded successfully",
            "file_path": tmp_path,
            "data_points": len(data),
            "coins": list(set(d.coin for d in data))
        }
    except Exception as e:
        logger.error(f"Error uploading CSV: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/optimization/backtest")
async def run_backtest(
    csv_path: str,
    strategy_configs: List[Dict],
    coins: Optional[List[str]] = None
) -> Dict:
    """
    Run backtest with specified strategies on CSV data.
    
    Example strategy_configs:
    [
        {
            "name": "SMA_Crossover",
            "coin": "BTC",
            "params": {"fast_period": 5, "slow_period": 20}
        },
        {
            "name": "Momentum",
            "coin": "ETH",
            "params": {"lookback": 5}
        }
    ]
    """
    try:
        results = backtest_engine.run_backtest(csv_path, strategy_configs, coins)
        report = backtest_engine.get_report()
        
        return {
            "status": "success",
            "report": report
        }
    except Exception as e:
        logger.error(f"Error running backtest: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/optimization/strategies-for-coin")
async def get_strategies_for_coin(coin: str) -> Dict:
    """Get all available strategies ranked for a specific coin from backtest results."""
    results_for_coin = [
        (strategy_id, result.to_dict())
        for strategy_id, result in backtest_engine.results.items()
        if result.coin == coin
    ]
    
    # Sort by net P&L
    results_for_coin.sort(key=lambda x: x[1]['net_pnl'], reverse=True)
    
    return {
        "coin": coin,
        "strategies": [
            {
                "strategy_id": strategy_id,
                "metrics": result
            }
            for strategy_id, result in results_for_coin
        ],
        "count": len(results_for_coin)
    }


@router.get("/optimization/best-combos")
async def get_best_strategy_combos() -> Dict:
    """Get best strategy-coin combinations from backtest."""
    best = backtest_engine.get_best_strategy_coin_combo()
    
    if not best:
        return {"error": "No backtest results available"}
    
    strategy_id, coin, pnl = best
    
    return {
        "best_combo": {
            "strategy_id": strategy_id,
            "coin": coin,
            "net_pnl": pnl
        },
        "all_rankings": [
            {"strategy_id": s_id, "net_pnl": result.net_pnl}
            for s_id, result in backtest_engine.results.items()
        ]
    }


@router.get("/optimization/recommendations")
async def get_recommendations() -> Dict:
    """Get strategy recommendations based on backtest results."""
    suggestions = backtest_engine.get_suggestions()
    
    return {
        "coin_strategy_suggestions": suggestions,
        "description": "Best strategy for each coin based on backtest results"
    }


# ==================== TREND ANALYSIS MODE ====================

@router.post("/trend-analysis/upload-csv")
async def upload_csv_for_trend_analysis(file: UploadFile = File(...)) -> Dict:
    """Upload CSV file for trend analysis."""
    try:
        suffix = Path(file.filename).suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Validate
        from data.crypto_data_provider import CSVDataLoader
        loader = CSVDataLoader(tmp_path)
        data = list(loader.load_data())
        
        if not data:
            os.unlink(tmp_path)
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        return {
            "status": "success",
            "file_path": tmp_path,
            "data_points": len(data),
            "coins": list(set(d.coin for d in data))
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/trend-analysis/analyze")
async def analyze_trends(csv_path: str) -> Dict:
    """
    Analyze market trends from CSV data.
    Returns trend type, indicators, and strategy suggestions.
    """
    try:
        report = trend_service.analyze_csv(csv_path)
        
        return {
            "status": "success",
            "report": report
        }
    except Exception as e:
        logger.error(f"Error analyzing trends: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/trend-analysis/suggestions-for-coin")
async def get_trend_suggestions(coin: str) -> Dict:
    """Get strategy suggestions for a coin based on trend analysis."""
    suggestions = trend_service.analyzer.get_strategy_suggestions(coin)
    signal = trend_service.analyzer.trend_signals.get(coin, {})
    
    return {
        "coin": coin,
        "trend": signal.get('trend'),
        "rsi": signal.get('rsi'),
        "volatility": signal.get('volatility'),
        "suggested_strategies": [
            {
                "name": name,
                "confidence": confidence
            }
            for name, confidence in suggestions
        ]
    }


# ==================== COPILOT MODE ====================

@router.get("/copilot/status")
async def get_copilot_status() -> Dict:
    """Get Copilot mode status and alerts."""
    return {
        "status": "active",
        "mode": "copilot",
        "description": "Live monitoring with alerts and decision support",
        "features": [
            "real-time price monitoring",
            "strategy signal detection",
            "automated buy/sell alerts",
            "risk management",
            "performance metrics"
        ]
    }


@router.post("/copilot/enable-alerts")
async def enable_copilot_alerts(
    coin: str,
    strategies: List[str],
    alert_types: List[str] = None
) -> Dict:
    """
    Enable Copilot alerts for specific coin and strategies.
    
    Args:
        coin: Coin to monitor
        strategies: List of strategies to use
        alert_types: Types of alerts (price_movement, signal, risk, etc)
    """
    if alert_types is None:
        alert_types = ["signal", "risk"]
    
    return {
        "status": "success",
        "message": f"Copilot alerts enabled for {coin}",
        "coin": coin,
        "strategies": strategies,
        "alert_types": alert_types
    }


@router.get("/copilot/active-alerts")
async def get_active_copilot_alerts() -> Dict:
    """Get all active Copilot alerts."""
    return {
        "alerts": [],
        "total": 0,
        "description": "No active alerts"
    }


# ==================== UTILITY ENDPOINTS ====================

@router.get("/available-strategies")
async def list_available_strategies() -> Dict:
    """List all available trading strategies with descriptions."""
    strategies_info = {
        'SMA_Crossover': {
            'description': 'Simple Moving Average Crossover',
            'best_for': ['Trending markets'],
            'parameters': {
                'fast_period': 5,
                'slow_period': 20,
                'position_size': 1.0
            }
        },
        'Momentum': {
            'description': 'Rate of Change Momentum',
            'best_for': ['Uptrends', 'Strong movements'],
            'parameters': {
                'lookback': 5,
                'momentum_threshold': 0.002,
                'position_size': 1.0
            }
        },
        'MeanReversion': {
            'description': 'Mean Reversion',
            'best_for': ['Sideways markets', 'Ranging'],
            'parameters': {
                'period': 20,
                'deviation_threshold': 0.02,
                'position_size': 1.0
            }
        },
        'RSI': {
            'description': 'Relative Strength Index',
            'best_for': ['Overbought/Oversold detection'],
            'parameters': {
                'period': 14,
                'lower_bound': 30.0,
                'upper_bound': 70.0,
                'position_size': 1.0
            }
        },
        'BollingerBands': {
            'description': 'Bollinger Bands',
            'best_for': ['Volatile markets'],
            'parameters': {
                'period': 20,
                'std_dev': 2.0,
                'position_size': 1.0
            }
        },
        'MACD': {
            'description': 'Moving Average Convergence Divergence',
            'best_for': ['Trend confirmation'],
            'parameters': {
                'fast': 12,
                'slow': 26,
                'signal': 9,
                'position_size': 1.0
            }
        }
    }
    
    return {
        "total_strategies": len(strategies_info),
        "strategies": strategies_info
    }


@router.post("/validate-strategy-config")
async def validate_strategy_config(
    strategy_name: str,
    params: Dict
) -> Dict:
    """Validate strategy configuration parameters."""
    if strategy_name not in AVAILABLE_STRATEGIES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown strategy: {strategy_name}"
        )
    
    try:
        from engine.strategies import create_strategy
        strategy = create_strategy(strategy_name, "TEST", **params)
        
        if strategy is None:
            raise HTTPException(status_code=400, detail="Failed to create strategy")
        
        return {
            "status": "valid",
            "strategy": strategy_name,
            "config": strategy.get_config()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid config: {str(e)}")
