"""
VELOCITAS HFT ENGINE - Strategy Library
Pre-built strategies with configurable parameters.
All strategies are independent and can be combined on same/different coins.
"""

from typing import Optional, Tuple
from collections import deque
import logging
from engine_core import Strategy, MarketData

logger = logging.getLogger(__name__)


class SMAStrategy(Strategy):
    """
    Simple Moving Average Crossover Strategy.
    BUY: Fast SMA > Slow SMA (golden cross)
    SELL: Fast SMA < Slow SMA (death cross)
    """
    
    def __init__(self, coin: str, fast_period: int = 5, slow_period: int = 20, 
                 position_size: float = 1.0, **kwargs):
        """
        Args:
            coin: Target coin
            fast_period: Fast moving average period
            slow_period: Slow moving average period
            position_size: Quantity per trade
        """
        super().__init__('SMA_Crossover', coin, 
                        fast_period=fast_period, slow_period=slow_period,
                        position_size=position_size)
        
        self.fast_period = fast_period
        self.slow_period = slow_period
        self.position_size = position_size
        self.price_history = deque(maxlen=slow_period)
        self.prev_signal = None
    
    def _calculate_sma(self, prices: deque, period: int) -> Optional[float]:
        """Calculate SMA."""
        if len(prices) < period:
            return None
        recent = list(prices)[-period:]
        return sum(recent) / period
    
    def execute(self, market_data: MarketData) -> Optional[Tuple[str, float]]:
        """Execute SMA crossover."""
        self.price_history.append(market_data.price)
        
        if len(self.price_history) < self.slow_period:
            return None
        
        fast_sma = self._calculate_sma(self.price_history, self.fast_period)
        slow_sma = self._calculate_sma(self.price_history, self.slow_period)
        
        if fast_sma is None or slow_sma is None:
            return None
        
        current_signal = 'above' if fast_sma > slow_sma else 'below'
        
        if self.prev_signal is None:
            self.prev_signal = current_signal
            return None
        
        action = None
        if self.prev_signal == 'below' and current_signal == 'above':
            action = 'BUY'
        elif self.prev_signal == 'above' and current_signal == 'below':
            action = 'SELL'
        
        self.prev_signal = current_signal
        
        if action:
            return (action, self.position_size)
        return None


class MomentumStrategy(Strategy):
    """
    Rate-of-Change Momentum Strategy.
    BUY: Momentum > threshold
    SELL: Momentum < -threshold
    """
    
    def __init__(self, coin: str, lookback: int = 5, momentum_threshold: float = 0.002,
                 position_size: float = 1.0, **kwargs):
        """
        Args:
            coin: Target coin
            lookback: Periods for momentum calculation
            momentum_threshold: Threshold for signal
            position_size: Quantity per trade
        """
        super().__init__('Momentum', coin,
                        lookback=lookback, momentum_threshold=momentum_threshold,
                        position_size=position_size)
        
        self.lookback = lookback
        self.momentum_threshold = momentum_threshold
        self.position_size = position_size
        self.price_history = deque(maxlen=lookback + 1)
        self.in_position = False
    
    def execute(self, market_data: MarketData) -> Optional[Tuple[str, float]]:
        """Execute momentum strategy."""
        self.price_history.append(market_data.price)
        
        if len(self.price_history) < self.lookback + 1:
            return None
        
        current_price = market_data.price
        past_price = list(self.price_history)[0]
        momentum = (current_price - past_price) / past_price if past_price != 0 else 0
        
        if not self.in_position and momentum > self.momentum_threshold:
            self.in_position = True
            return ('BUY', self.position_size)
        elif self.in_position and momentum < -self.momentum_threshold:
            self.in_position = False
            return ('SELL', self.position_size)
        
        return None


class MeanReversionStrategy(Strategy):
    """
    Mean Reversion Strategy.
    BUY: Price deviates below mean
    SELL: Price deviates above mean
    """
    
    def __init__(self, coin: str, period: int = 20, deviation_threshold: float = 0.02,
                 position_size: float = 1.0, **kwargs):
        """
        Args:
            coin: Target coin
            period: Period for moving average
            deviation_threshold: Deviation threshold from mean
            position_size: Quantity per trade
        """
        super().__init__('MeanReversion', coin,
                        period=period, deviation_threshold=deviation_threshold,
                        position_size=position_size)
        
        self.period = period
        self.deviation_threshold = deviation_threshold
        self.position_size = position_size
        self.price_history = deque(maxlen=period)
        self.in_position = False
    
    def execute(self, market_data: MarketData) -> Optional[Tuple[str, float]]:
        """Execute mean reversion strategy."""
        self.price_history.append(market_data.price)
        
        if len(self.price_history) < self.period:
            return None
        
        mean_price = sum(self.price_history) / len(self.price_history)
        current_price = market_data.price
        deviation = (current_price - mean_price) / mean_price if mean_price != 0 else 0
        
        if not self.in_position and deviation < -self.deviation_threshold:
            self.in_position = True
            return ('BUY', self.position_size)
        elif self.in_position and deviation > self.deviation_threshold:
            self.in_position = False
            return ('SELL', self.position_size)
        
        return None


class RSIStrategy(Strategy):
    """
    Relative Strength Index Strategy.
    BUY: RSI < lower_bound (oversold)
    SELL: RSI > upper_bound (overbought)
    """
    
    def __init__(self, coin: str, period: int = 14, lower_bound: float = 30.0,
                 upper_bound: float = 70.0, position_size: float = 1.0, **kwargs):
        """
        Args:
            coin: Target coin
            period: RSI period
            lower_bound: Oversold threshold
            upper_bound: Overbought threshold
            position_size: Quantity per trade
        """
        super().__init__('RSI', coin,
                        period=period, lower_bound=lower_bound, upper_bound=upper_bound,
                        position_size=position_size)
        
        self.period = period
        self.lower_bound = lower_bound
        self.upper_bound = upper_bound
        self.position_size = position_size
        self.price_history = deque(maxlen=period + 1)
        self.in_position = False
    
    def _calculate_rsi(self, prices: deque) -> Optional[float]:
        """Calculate RSI."""
        if len(prices) < self.period + 1:
            return None
        
        price_list = list(prices)
        deltas = [price_list[i] - price_list[i-1] for i in range(1, len(price_list))]
        
        gains = sum(max(d, 0) for d in deltas) / self.period
        losses = abs(sum(min(d, 0) for d in deltas)) / self.period
        
        if losses == 0:
            return 100.0 if gains > 0 else 0.0
        
        rs = gains / losses
        return 100 - (100 / (1 + rs))
    
    def execute(self, market_data: MarketData) -> Optional[Tuple[str, float]]:
        """Execute RSI strategy."""
        self.price_history.append(market_data.price)
        
        rsi = self._calculate_rsi(self.price_history)
        if rsi is None:
            return None
        
        if not self.in_position and rsi < self.lower_bound:
            self.in_position = True
            return ('BUY', self.position_size)
        elif self.in_position and rsi > self.upper_bound:
            self.in_position = False
            return ('SELL', self.position_size)
        
        return None


class BollingerBandsStrategy(Strategy):
    """
    Bollinger Bands Strategy.
    BUY: Price closes below lower band
    SELL: Price closes above upper band
    """
    
    def __init__(self, coin: str, period: int = 20, std_dev: float = 2.0,
                 position_size: float = 1.0, **kwargs):
        """
        Args:
            coin: Target coin
            period: Period for moving average
            std_dev: Standard deviations from mean
            position_size: Quantity per trade
        """
        super().__init__('BollingerBands', coin,
                        period=period, std_dev=std_dev, position_size=position_size)
        
        self.period = period
        self.std_dev = std_dev
        self.position_size = position_size
        self.price_history = deque(maxlen=period)
        self.in_position = False
    
    def execute(self, market_data: MarketData) -> Optional[Tuple[str, float]]:
        """Execute Bollinger Bands strategy."""
        self.price_history.append(market_data.price)
        
        if len(self.price_history) < self.period:
            return None
        
        # Calculate mean and std dev
        prices = list(self.price_history)
        mean = sum(prices) / len(prices)
        variance = sum((p - mean) ** 2 for p in prices) / len(prices)
        std = variance ** 0.5
        
        upper_band = mean + (self.std_dev * std)
        lower_band = mean - (self.std_dev * std)
        
        current_price = market_data.price
        
        if not self.in_position and current_price < lower_band:
            self.in_position = True
            return ('BUY', self.position_size)
        elif self.in_position and current_price > upper_band:
            self.in_position = False
            return ('SELL', self.position_size)
        
        return None


class MACDStrategy(Strategy):
    """
    MACD (Moving Average Convergence Divergence) Strategy.
    BUY: MACD line crosses above signal line
    SELL: MACD line crosses below signal line
    """
    
    def __init__(self, coin: str, fast: int = 12, slow: int = 26, signal: int = 9,
                 position_size: float = 1.0, **kwargs):
        """
        Args:
            coin: Target coin
            fast: Fast EMA period
            slow: Slow EMA period
            signal: Signal line EMA period
            position_size: Quantity per trade
        """
        super().__init__('MACD', coin,
                        fast=fast, slow=slow, signal=signal, position_size=position_size)
        
        self.fast = fast
        self.slow = slow
        self.signal = signal
        self.position_size = position_size
        self.price_history = deque(maxlen=slow + signal)
        self.prev_signal = None
        self.in_position = False
    
    def _calculate_ema(self, prices: deque, period: int) -> Optional[float]:
        """Calculate EMA."""
        if len(prices) < period:
            return None
        
        price_list = list(prices)
        k = 2 / (period + 1)
        
        # Simple initialization with first SMA
        ema = sum(price_list[-period:]) / period
        for price in price_list[-period:]:
            ema = price * k + ema * (1 - k)
        
        return ema
    
    def execute(self, market_data: MarketData) -> Optional[Tuple[str, float]]:
        """Execute MACD strategy."""
        self.price_history.append(market_data.price)
        
        if len(self.price_history) < self.slow:
            return None
        
        # Calculate MACD line and signal line
        fast_ema = self._calculate_ema(self.price_history, self.fast)
        slow_ema = self._calculate_ema(self.price_history, self.slow)
        
        if fast_ema is None or slow_ema is None:
            return None
        
        macd_line = fast_ema - slow_ema
        
        if self.prev_signal is None:
            self.prev_signal = macd_line
            return None
        
        action = None
        if self.prev_signal <= 0 and macd_line > 0:
            action = 'BUY'
        elif self.prev_signal >= 0 and macd_line < 0:
            action = 'SELL'
        
        self.prev_signal = macd_line
        
        if action:
            return (action, self.position_size)
        return None


# Strategy factory for easy instantiation
AVAILABLE_STRATEGIES = {
    'SMA_Crossover': SMAStrategy,
    'Momentum': MomentumStrategy,
    'MeanReversion': MeanReversionStrategy,
    'RSI': RSIStrategy,
    'BollingerBands': BollingerBandsStrategy,
    'MACD': MACDStrategy,
}


def create_strategy(strategy_name: str, coin: str, **params) -> Optional[Strategy]:
    """
    Factory function to create strategy instances.
    
    Args:
        strategy_name: Name of strategy
        coin: Target coin
        **params: Strategy-specific parameters
        
    Returns:
        Strategy instance or None if strategy not found
    """
    strategy_class = AVAILABLE_STRATEGIES.get(strategy_name)
    if strategy_class:
        return strategy_class(coin, **params)
    return None
