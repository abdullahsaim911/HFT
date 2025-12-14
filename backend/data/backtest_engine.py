"""
VELOCITAS HFT ENGINE - Optimization/Backtesting Engine
Supports optimization mode: upload CSV data, test multiple strategies on multiple coins.

Features:
- Load market data from CSV files
- Run strategies on historical data
- Calculate comprehensive metrics
- Rank strategies by performance
- Suggest best strategy-coin combinations
"""

import logging
from typing import List, Dict, Optional, Tuple
from pathlib import Path
from datetime import datetime
import json
from collections import defaultdict

from engine.engine_core import HFTEngine, EngineMode, MarketData, Strategy
from strategies import create_strategy, AVAILABLE_STRATEGIES
from data.crypto_data_provider import CSVDataLoader

logger = logging.getLogger(__name__)


class BacktestResult:
    """Store and analyze backtest results."""
    
    def __init__(self, strategy_id: str, coin: str, strategy_name: str):
        self.strategy_id = strategy_id
        self.coin = coin
        self.strategy_name = strategy_name
        
        self.total_trades = 0
        self.winning_trades = 0
        self.losing_trades = 0
        
        self.total_profit = 0.0
        self.total_loss = 0.0
        self.net_pnl = 0.0
        
        self.max_drawdown = 0.0
        self.sharpe_ratio = 0.0
        self.win_rate = 0.0
        self.profit_factor = 0.0
        
        self.trades = []
        self.pnl_history = []
    
    def calculate_metrics(self):
        """Calculate derived metrics."""
        if self.total_trades > 0:
            self.win_rate = (self.winning_trades / self.total_trades) * 100
        
        if self.total_loss != 0:
            self.profit_factor = abs(self.total_profit / self.total_loss)
        elif self.total_profit > 0:
            self.profit_factor = float('inf')
        else:
            self.profit_factor = 0.0
        
        # Calculate max drawdown from P&L history
        if self.pnl_history:
            cumulative = 0
            peak = 0
            max_dd = 0
            for entry in self.pnl_history:
                cumulative += entry.get('pnl', 0)
                if cumulative > peak:
                    peak = cumulative
                drawdown = peak - cumulative
                if drawdown > max_dd:
                    max_dd = drawdown
            self.max_drawdown = max_dd
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            'strategy_id': self.strategy_id,
            'coin': self.coin,
            'strategy_name': self.strategy_name,
            'total_trades': self.total_trades,
            'winning_trades': self.winning_trades,
            'losing_trades': self.losing_trades,
            'total_profit': self.total_profit,
            'total_loss': self.total_loss,
            'net_pnl': self.net_pnl,
            'max_drawdown': self.max_drawdown,
            'sharpe_ratio': self.sharpe_ratio,
            'win_rate': self.win_rate,
            'profit_factor': self.profit_factor,
            'trades_count': len(self.trades),
            'pnl_history_points': len(self.pnl_history)
        }


class BacktestEngine:
    """
    Runs backtests on historical data.
    Used for optimization mode.
    """
    
    def __init__(self, num_workers: int = 4):
        """Initialize backtest engine."""
        self.num_workers = num_workers
        self.results: Dict[str, BacktestResult] = {}
    
    def load_csv_data(self, csv_path: str) -> List[MarketData]:
        """Load market data from CSV."""
        loader = CSVDataLoader(csv_path)
        data = list(loader.load_data())
        logger.info(f"Loaded {len(data)} data points from {csv_path}")
        return data
    
    def run_backtest(self, 
                     csv_path: str,
                     strategy_configs: List[Dict],
                     coins: Optional[List[str]] = None) -> Dict[str, BacktestResult]:
        """
        Run backtest with specified strategies on CSV data.
        
        Args:
            csv_path: Path to CSV file
            strategy_configs: List of strategy configs
                            [{'name': 'SMA_Crossover', 'coin': 'BTC', 'params': {...}}, ...]
            coins: Optional list to filter coins from CSV
        
        Returns:
            Dictionary of strategy_id -> BacktestResult
        """
        # Load data
        market_data = self.load_csv_data(csv_path)
        
        # Filter by coins if specified
        if coins:
            market_data = [d for d in market_data if d.coin in coins]
        
        if not market_data:
            logger.error("No market data after filtering")
            return {}
        
        # Create engine for backtest
        engine = HFTEngine(mode=EngineMode.OPTIMIZATION, num_workers=self.num_workers)
        
        # Register strategies
        for config in strategy_configs:
            strategy = create_strategy(
                config['name'],
                config['coin'],
                **config.get('params', {})
            )
            if strategy:
                engine.register_strategy(strategy)
        
        # Run backt through engine
        logger.info(f"Running backtest with {len(engine.strategies)} strategies on {len(market_data)} data points")
        
        engine.running = True
        for data_point in market_data:
            engine.market_data_queue.put(data_point.to_dict())
        
        # Process trades
        while not engine.market_data_queue.empty():
            try:
                data_dict = engine.market_data_queue.get(timeout=0.1)
                market_data_point = MarketData(**data_dict)
                
                # Execute strategies (simplified - single-threaded for backtest)
                for strategy_id, strategy in engine.strategies.items():
                    if strategy.coin == market_data_point.coin:
                        action_result = strategy.execute(market_data_point)
                        if action_result:
                            from engine.engine_core import Trade
                            action, quantity = action_result
                            trade = Trade(
                                coin=market_data_point.coin,
                                strategy=strategy.name,
                                action=action,
                                price=market_data_point.price,
                                quantity=quantity,
                                timestamp=market_data_point.timestamp
                            )
                            engine.process_trade(trade.to_dict(), market_data_point)
            except:
                pass
        
        engine.running = False
        
        # Collect results
        results = {}
        strategy_metrics = engine.get_strategy_metrics()
        
        for strategy_id, metrics in strategy_metrics.items():
            result = BacktestResult(
                strategy_id=strategy_id,
                coin=metrics.get('coin', ''),
                strategy_name=metrics.get('strategy_name', '')
            )
            
            result.total_trades = metrics.get('total_trades', 0)
            result.winning_trades = metrics.get('winning_trades', 0)
            result.losing_trades = metrics.get('losing_trades', 0)
            result.total_profit = metrics.get('total_profit', 0.0)
            result.total_loss = metrics.get('total_loss', 0.0)
            result.net_pnl = metrics.get('net_pnl', 0.0)
            
            result.pnl_history = engine.get_pnl_history(strategy_id)
            result.trades = engine.get_trades(strategy_id)
            
            result.calculate_metrics()
            results[strategy_id] = result
        
        self.results = results
        return results
    
    def rank_strategies(self, metric: str = 'net_pnl') -> List[Tuple[str, float]]:
        """
        Rank strategies by specified metric.
        
        Args:
            metric: Metric to rank by (net_pnl, win_rate, profit_factor, etc)
        
        Returns:
            List of (strategy_id, metric_value) sorted by metric descending
        """
        rankings = []
        for strategy_id, result in self.results.items():
            value = getattr(result, metric, 0)
            rankings.append((strategy_id, value))
        
        rankings.sort(key=lambda x: x[1], reverse=True)
        return rankings
    
    def get_best_strategy_coin_combo(self) -> Optional[Tuple[str, str, float]]:
        """
        Find best strategy-coin combination by net P&L.
        
        Returns:
            Tuple of (strategy_id, coin, net_pnl) or None
        """
        best = None
        best_pnl = float('-inf')
        
        for strategy_id, result in self.results.items():
            if result.net_pnl > best_pnl:
                best_pnl = result.net_pnl
                best = (strategy_id, result.coin, result.net_pnl)
        
        return best
    
    def get_suggestions(self) -> Dict[str, str]:
        """Get strategy suggestions for each coin."""
        suggestions = {}
        by_coin = defaultdict(list)
        
        # Group by coin
        for strategy_id, result in self.results.items():
            by_coin[result.coin].append((strategy_id, result.net_pnl))
        
        # Get best strategy per coin
        for coin, strategies in by_coin.items():
            best = max(strategies, key=lambda x: x[1])
            suggestions[coin] = best[0]
        
        return suggestions
    
    def get_report(self) -> Dict:
        """Generate comprehensive backtest report."""
        if not self.results:
            return {"error": "No backtest results"}
        
        return {
            "timestamp": datetime.now().isoformat(),
            "total_strategies_tested": len(self.results),
            "strategies": {
                strategy_id: result.to_dict()
                for strategy_id, result in self.results.items()
            },
            "rankings": {
                "by_pnl": self.rank_strategies('net_pnl'),
                "by_win_rate": self.rank_strategies('win_rate'),
                "by_profit_factor": self.rank_strategies('profit_factor')
            },
            "best_combo": self.get_best_strategy_coin_combo(),
            "suggestions": self.get_suggestions()
        }


if __name__ == '__main__':
    # Example usage
    backtest = BacktestEngine()
    
    # Example: backtest SMA and Momentum strategies on BTC data
    configs = [
        {'name': 'SMA_Crossover', 'coin': 'BTC', 'params': {'fast_period': 5, 'slow_period': 20}},
        {'name': 'Momentum', 'coin': 'BTC', 'params': {'lookback': 5}},
    ]
    
    # Would need actual CSV file: backtest.run_backtest('data.csv', configs)
    # report = backtest.get_report()
    # print(json.dumps(report, indent=2))
