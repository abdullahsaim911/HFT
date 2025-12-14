"""
VELOCITAS HFT ENGINE - Core Engine Architecture
Multi-mode High-Frequency Trading Engine with Parallel Processing & Data Integrity

Modes:
1. LIVE TRADING - Real crypto data with multiprocessing strategy execution
2. OPTIMIZATION - Backtesting with CSV data and strategy ranking
3. TREND ANALYSIS - ML-based market trend prediction and strategy suggestions
4. COPILOT - Live monitoring with automated alerts and decisions

Architecture:
- Multiprocessing (ProcessPoolExecutor) for true parallelism
- Manager-based shared state (metrics, P&L, trades) 
- Global Lock protecting all writes to shared data
- Queue-based producer-consumer pattern
- Per-(Coin, Strategy) P&L tracking with trade history
"""

import multiprocessing as mp
from multiprocessing import Manager, Lock, Queue
from concurrent.futures import ProcessPoolExecutor
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Tuple, Set
from dataclasses import dataclass, asdict, field
from datetime import datetime
from enum import Enum
import logging
import time
import json

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - %(name)s - %(message)s'
)
logger = logging.getLogger(__name__)


class EngineMode(Enum):
    """Engine operation modes."""
    LIVE = "live"
    OPTIMIZATION = "optimization"
    TREND_ANALYSIS = "trend_analysis"
    COPILOT = "copilot"


@dataclass
class MarketData:
    """Market data point."""
    coin: str
    price: float
    volume: float
    timestamp: float
    bid: Optional[float] = None
    ask: Optional[float] = None
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class Trade:
    """Trade execution record."""
    coin: str
    strategy: str
    action: str  # 'BUY' or 'SELL'
    price: float
    quantity: float
    timestamp: float
    profit_loss: float = 0.0
    position_size: float = 0.0
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class StrategyMetrics:
    """Metrics for a single strategy-coin combination."""
    strategy_id: str
    coin: str
    strategy_name: str
    
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    
    total_profit: float = 0.0
    total_loss: float = 0.0
    net_pnl: float = 0.0
    
    current_position: float = 0.0
    entry_price: float = 0.0
    
    max_drawdown: float = 0.0
    sharpe_ratio: float = 0.0
    win_rate: float = 0.0
    
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def to_dict(self) -> Dict:
        return asdict(self)


class Strategy(ABC):
    """
    Abstract base class for all trading strategies.
    Each strategy runs in isolation in a worker process.
    """
    
    def __init__(self, name: str, coin: str, **params):
        """
        Initialize strategy.
        
        Args:
            name: Strategy name (e.g., 'SMA_Crossover')
            coin: Target coin (e.g., 'BTC')
            **params: Strategy-specific parameters
        """
        self.name = name
        self.coin = coin
        self.params = params
        
        self.position = 0.0
        self.entry_price = 0.0
        self.last_trade_time = 0
    
    @abstractmethod
    def execute(self, market_data: MarketData) -> Optional[Tuple[str, float]]:
        """
        Execute strategy logic.
        
        Args:
            market_data: Current market data
            
        Returns:
            Tuple of (action, quantity) or None if no action
        """
        pass
    
    def get_strategy_id(self) -> str:
        """Return unique strategy ID: coin_strategy."""
        return f"{self.coin}_{self.name}"
    
    def get_config(self) -> Dict:
        """Return strategy configuration for frontend."""
        return {
            'name': self.name,
            'coin': self.coin,
            'params': self.params
        }


class HFTEngine:
    """
    Main HFT Engine: orchestrates parallel strategy execution with guaranteed data integrity.
    
    Thread-safety model:
    - Manager: Shared state across processes
    - Lock: Protects all writes to metrics/P&L
    - Queue: Decouples producer (data) from consumers (strategies)
    - ProcessPoolExecutor: Parallel strategy execution
    """
    
    def __init__(self, mode: EngineMode = EngineMode.LIVE, num_workers: int = 4):
        """
        Initialize HFT Engine.
        
        Args:
            mode: Engine operation mode
            num_workers: Number of worker processes
        """
        self.mode = mode
        self.num_workers = num_workers
        
        # Multiprocessing primitives
        self.manager = Manager()
        self.lock = Lock()
        self.market_data_queue = Queue()
        self.command_queue = Queue()  # For runtime commands (pause, resume, etc)
        
        # Shared state (protected by lock)
        self.metrics = self.manager.dict()  # Global metrics
        self.strategy_metrics = self.manager.dict()  # Per-strategy metrics
        self.pnl_history = self.manager.list()  # Historical P&L: [(ts, strategy_id, pnl), ...]
        self.trades = self.manager.list()  # All trades executed
        self.alerts = self.manager.list()  # System alerts
        
        # Strategy registry
        self.strategies: Dict[str, Strategy] = {}
        self.running = False
        self.executor: Optional[ProcessPoolExecutor] = None
        
        self._initialize_metrics()
        logger.info(f"HFT Engine initialized in {mode.value} mode with {num_workers} workers")
    
    def _initialize_metrics(self):
        """Initialize global metrics."""
        with self.lock:
            self.metrics['mode'] = self.mode.value
            self.metrics['status'] = 'initialized'
            self.metrics['total_trades'] = 0
            self.metrics['total_profit'] = 0.0
            self.metrics['total_loss'] = 0.0
            self.metrics['net_pnl'] = 0.0
            self.metrics['win_rate'] = 0.0
            self.metrics['active_strategies'] = 0
            self.metrics['active_coins'] = 0
            self.metrics['max_drawdown'] = 0.0
            self.metrics['sharpe_ratio'] = 0.0
            self.metrics['last_update'] = datetime.now().isoformat()
    
    def register_strategy(self, strategy: Strategy):
        """
        Register strategy for execution.
        
        Args:
            strategy: Strategy instance
        """
        strategy_id = strategy.get_strategy_id()
        self.strategies[strategy_id] = strategy
        
        with self.lock:
            # Initialize strategy metrics
            metrics = StrategyMetrics(
                strategy_id=strategy_id,
                coin=strategy.coin,
                strategy_name=strategy.name
            )
            self.strategy_metrics[strategy_id] = metrics.to_dict()
            
            # Update active counts
            active_strategies = len(self.strategies)
            active_coins = len(set(s.coin for s in self.strategies.values()))
            self.metrics['active_strategies'] = active_strategies
            self.metrics['active_coins'] = active_coins
        
        logger.info(f"Strategy registered: {strategy_id}")
    
    def unregister_strategy(self, strategy_id: str):
        """Unregister a strategy."""
        if strategy_id in self.strategies:
            del self.strategies[strategy_id]
            
            with self.lock:
                if strategy_id in self.strategy_metrics:
                    del self.strategy_metrics[strategy_id]
                
                active_strategies = len(self.strategies)
                active_coins = len(set(s.coin for s in self.strategies.values()))
                self.metrics['active_strategies'] = active_strategies
                self.metrics['active_coins'] = active_coins
            
            logger.info(f"Strategy unregistered: {strategy_id}")
    
    def get_registered_strategies(self) -> List[Dict]:
        """Get list of registered strategies with configs."""
        return [
            {
                'strategy_id': strategy_id,
                'config': strategy.get_config()
            }
            for strategy_id, strategy in self.strategies.items()
        ]
    
    def execute_strategy_worker(self, strategy_id: str, market_data: MarketData) -> Optional[Dict]:
        """
        Worker function executed in subprocess.
        Runs strategy logic on market data.
        
        Args:
            strategy_id: Strategy identifier
            market_data: Market data point
            
        Returns:
            Trade dict or None
        """
        strategy = self.strategies.get(strategy_id)
        if not strategy:
            return None
        
        try:
            action_result = strategy.execute(market_data)
            if action_result is None:
                return None
            
            action, quantity = action_result
            
            trade = Trade(
                coin=market_data.coin,
                strategy=strategy.name,
                action=action,
                price=market_data.price,
                quantity=quantity,
                timestamp=market_data.timestamp,
            )
            
            return trade.to_dict()
        except Exception as e:
            logger.error(f"Error executing strategy {strategy_id}: {e}")
            return None
    
    def process_trade(self, trade_dict: Dict, market_data: MarketData):
        """
        Process executed trade with lock protection.
        Updates P&L, metrics, and history in shared memory.
        
        Args:
            trade_dict: Trade record
            market_data: Current market data
        """
        if not trade_dict:
            return
        
        strategy_id = f"{trade_dict['coin']}_{trade_dict['strategy']}"
        
        with self.lock:
            # Get current metrics
            strat_metrics = self.strategy_metrics.get(strategy_id, {})
            
            # Update trade counts
            strat_metrics['total_trades'] = strat_metrics.get('total_trades', 0) + 1
            
            # Calculate P&L
            pnl = 0.0
            if trade_dict['action'] == 'BUY':
                strat_metrics['current_position'] = strat_metrics.get('current_position', 0.0) + trade_dict['quantity']
                strat_metrics['entry_price'] = trade_dict['price']
            elif trade_dict['action'] == 'SELL':
                current_pos = strat_metrics.get('current_position', 0.0)
                if current_pos > 0:
                    entry = strat_metrics.get('entry_price', 0.0)
                    pnl = (trade_dict['price'] - entry) * current_pos
                    strat_metrics['total_profit'] = strat_metrics.get('total_profit', 0.0) + max(pnl, 0)
                    strat_metrics['total_loss'] = strat_metrics.get('total_loss', 0.0) + abs(min(pnl, 0))
                    strat_metrics['winning_trades'] = strat_metrics.get('winning_trades', 0) + (1 if pnl > 0 else 0)
                    strat_metrics['losing_trades'] = strat_metrics.get('losing_trades', 0) + (1 if pnl < 0 else 0)
                
                strat_metrics['current_position'] = max(0, current_pos - trade_dict['quantity'])
            
            strat_metrics['net_pnl'] = strat_metrics.get('total_profit', 0.0) - strat_metrics.get('total_loss', 0.0)
            strat_metrics['position_size'] = strat_metrics.get('current_position', 0.0)
            
            if strat_metrics.get('total_trades', 0) > 0:
                strat_metrics['win_rate'] = (strat_metrics.get('winning_trades', 0) / strat_metrics.get('total_trades', 0)) * 100
            
            self.strategy_metrics[strategy_id] = strat_metrics
            
            # Update global metrics
            self.metrics['total_trades'] = int(self.metrics.get('total_trades', 0)) + 1
            self.metrics['total_profit'] = float(self.metrics.get('total_profit', 0.0)) + max(pnl, 0)
            self.metrics['total_loss'] = float(self.metrics.get('total_loss', 0.0)) + abs(min(pnl, 0))
            self.metrics['net_pnl'] = float(self.metrics.get('total_profit', 0.0)) - float(self.metrics.get('total_loss', 0.0))
            
            if self.metrics.get('total_trades', 0) > 0:
                wins = sum(1 for t in self.trades if t.get('profit_loss', 0) > 0)
                self.metrics['win_rate'] = (wins / max(1, self.metrics.get('total_trades', 0))) * 100
            
            self.metrics['last_update'] = datetime.now().isoformat()
            
            # Record in history
            self.pnl_history.append({
                'timestamp': market_data.timestamp,
                'strategy_id': strategy_id,
                'pnl': pnl,
                'position': strat_metrics.get('current_position', 0.0)
            })
            
            # Record trade
            trade_dict['profit_loss'] = pnl
            self.trades.append(trade_dict)
            
            logger.info(
                f"Trade: {strategy_id} - {trade_dict['action']} "
                f"{trade_dict['quantity']} @ {trade_dict['price']:.2f} | P&L: {pnl:.2f}"
            )
    
    def consume_market_data(self):
        """
        Consumer: Process market data and execute strategies in parallel.
        """
        with ProcessPoolExecutor(max_workers=self.num_workers) as executor:
            futures = {}
            
            while self.running:
                try:
                    # Get market data from queue
                    market_data_dict = self.market_data_queue.get(timeout=1)
                    market_data = MarketData(**market_data_dict)
                    
                    # Dispatch strategies for this coin to workers
                    for strategy_id, strategy in self.strategies.items():
                        if strategy.coin == market_data.coin:
                            future = executor.submit(
                                self.execute_strategy_worker,
                                strategy_id,
                                market_data
                            )
                            futures[future] = (strategy_id, market_data)
                    
                    # Collect completed results
                    completed = [f for f in futures.keys() if f.done()]
                    for future in completed:
                        try:
                            strategy_id, mkt_data = futures.pop(future)
                            trade_result = future.result()
                            self.process_trade(trade_result, mkt_data)
                        except Exception as e:
                            logger.error(f"Error processing trade: {e}")
                
                except mp.TimeoutError:
                    pass
                except Exception as e:
                    logger.error(f"Error in consumer: {e}")
    
    def produce_market_data(self, data_source):
        """
        Producer: Feed market data to queue.
        
        Args:
            data_source: Iterable of MarketData objects
        """
        try:
            for data in data_source:
                if not self.running:
                    break
                
                if isinstance(data, MarketData):
                    self.market_data_queue.put(data.to_dict())
                elif isinstance(data, dict):
                    self.market_data_queue.put(data)
                
                time.sleep(0.001)  # 1ms between data points
        except Exception as e:
            logger.error(f"Error in producer: {e}")
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current engine metrics (thread-safe)."""
        with self.lock:
            return dict(self.metrics)
    
    def get_strategy_metrics(self, strategy_id: Optional[str] = None) -> Dict[str, Any]:
        """Get strategy metrics (thread-safe)."""
        with self.lock:
            if strategy_id:
                return self.strategy_metrics.get(strategy_id, {})
            return dict(self.strategy_metrics)
    
    def get_trades(self, strategy_id: Optional[str] = None, limit: int = 100) -> List[Dict]:
        """Get trades (thread-safe)."""
        with self.lock:
            trades = list(self.trades)
            if strategy_id:
                trades = [t for t in trades if f"{t['coin']}_{t['strategy']}" == strategy_id]
            return trades[-limit:]
    
    def get_pnl_history(self, strategy_id: Optional[str] = None) -> List[Dict]:
        """Get P&L history (thread-safe)."""
        with self.lock:
            history = list(self.pnl_history)
            if strategy_id:
                history = [h for h in history if h.get('strategy_id') == strategy_id]
            return history
    
    def shutdown(self):
        """Gracefully shutdown engine."""
        self.running = False
        logger.info("HFT Engine shutting down...")
