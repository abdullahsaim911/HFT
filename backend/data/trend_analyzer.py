"""
VELOCITAS HFT ENGINE - Trend Analysis Module
Market trend prediction and analysis for strategy suggestions.

Features:
- Load market data and analyze trends
- Detect trend direction (uptrend, downtrend, sideways)
- Suggest best strategies based on market conditions
- Support multiple coins simultaneously
"""

import logging
from typing import List, Dict, Optional, Tuple
from collections import deque
from enum import Enum
import statistics

from engine_core import MarketData
from data.crypto_data_provider import CSVDataLoader

logger = logging.getLogger(__name__)


class TrendType(Enum):
    """Market trend classification."""
    UPTREND = "uptrend"
    DOWNTREND = "downtrend"
    SIDEWAYS = "sideways"
    VOLATILE = "volatile"


class TrendAnalyzer:
    """Analyzes market trends and suggests strategies."""
    
    def __init__(self, lookback_period: int = 50):
        """
        Initialize analyzer.
        
        Args:
            lookback_period: Period for trend calculation
        """
        self.lookback_period = lookback_period
        self.trends: Dict[str, TrendType] = {}
        self.trend_signals: Dict[str, Dict] = {}
    
    def _calculate_trend(self, prices: List[float]) -> TrendType:
        """
        Determine trend from price history.
        
        Returns:
            TrendType classification
        """
        if len(prices) < 10:
            return TrendType.SIDEWAYS
        
        # Calculate moving averages
        short_ma = statistics.mean(prices[-10:])
        long_ma = statistics.mean(prices[-30:] if len(prices) >= 30 else prices)
        
        # Calculate volatility
        returns = [(prices[i] - prices[i-1]) / prices[i-1] 
                   for i in range(1, len(prices))]
        volatility = statistics.stdev(returns) if len(returns) > 1 else 0
        
        # Determine trend
        if volatility > 0.05:  # High volatility
            return TrendType.VOLATILE
        
        if short_ma > long_ma * 1.02:  # 2% above long MA
            return TrendType.UPTREND
        elif short_ma < long_ma * 0.98:  # 2% below long MA
            return TrendType.DOWNTREND
        else:
            return TrendType.SIDEWAYS
    
    def _calculate_rsi(self, prices: List[float]) -> float:
        """Calculate RSI indicator."""
        if len(prices) < 14:
            return 50.0
        
        recent = prices[-14:]
        deltas = [recent[i] - recent[i-1] for i in range(1, len(recent))]
        
        gains = sum(max(d, 0) for d in deltas) / 14
        losses = abs(sum(min(d, 0) for d in deltas)) / 14
        
        if losses == 0:
            return 100.0 if gains > 0 else 0.0
        
        rs = gains / losses
        return 100 - (100 / (1 + rs))
    
    def _calculate_volatility(self, prices: List[float]) -> float:
        """Calculate price volatility."""
        if len(prices) < 2:
            return 0.0
        
        returns = [(prices[i] - prices[i-1]) / prices[i-1] 
                   for i in range(1, len(prices))]
        
        if not returns:
            return 0.0
        
        variance = statistics.variance(returns)
        return (variance ** 0.5) * 100  # As percentage
    
    def analyze_data(self, csv_path: str) -> Dict[str, Dict]:
        """
        Analyze market data from CSV file.
        
        Args:
            csv_path: Path to CSV file
        
        Returns:
            Dictionary mapping coin -> analysis results
        """
        loader = CSVDataLoader(csv_path)
        market_data = list(loader.load_data())
        
        if not market_data:
            logger.error("No data loaded from CSV")
            return {}
        
        # Group data by coin
        by_coin = {}
        for data in market_data:
            if data.coin not in by_coin:
                by_coin[data.coin] = []
            by_coin[data.coin].append(data)
        
        # Analyze each coin
        results = {}
        for coin, data_points in by_coin.items():
            prices = [d.price for d in data_points]
            
            trend = self._calculate_trend(prices)
            rsi = self._calculate_rsi(prices)
            volatility = self._calculate_volatility(prices)
            
            # Price statistics
            min_price = min(prices)
            max_price = max(prices)
            current_price = prices[-1] if prices else 0
            price_change = ((current_price - prices[0]) / prices[0] * 100) if prices[0] > 0 else 0
            
            results[coin] = {
                'trend': trend.value,
                'rsi': rsi,
                'volatility': volatility,
                'min_price': min_price,
                'max_price': max_price,
                'current_price': current_price,
                'price_change_percent': price_change,
                'data_points': len(prices)
            }
            
            self.trends[coin] = trend
            self.trend_signals[coin] = results[coin]
        
        return results
    
    def get_strategy_suggestions(self, coin: str) -> List[Tuple[str, float]]:
        """
        Suggest best strategies for a coin based on trend.
        
        Args:
            coin: Coin symbol
        
        Returns:
            List of (strategy_name, confidence_score) sorted by confidence
        """
        if coin not in self.trend_signals:
            return []
        
        signal = self.trend_signals[coin]
        trend = TrendType(signal['trend'])
        rsi = signal['rsi']
        volatility = signal['volatility']
        
        suggestions = []
        
        # Strategy recommendations based on trend
        if trend == TrendType.UPTREND:
            suggestions.append(('Momentum', 0.95))  # High momentum in uptrends
            suggestions.append(('SMA_Crossover', 0.85))
            suggestions.append(('BollingerBands', 0.70))
            suggestions.append(('MACD', 0.80))
        
        elif trend == TrendType.DOWNTREND:
            suggestions.append(('MeanReversion', 0.85))  # Mean reversion in downtrends
            suggestions.append(('RSI', 0.90))
            suggestions.append(('SMA_Crossover', 0.75))
        
        elif trend == TrendType.SIDEWAYS:
            suggestions.append(('MeanReversion', 0.95))  # Best in ranging markets
            suggestions.append(('BollingerBands', 0.90))
            suggestions.append(('RSI', 0.85))
        
        elif trend == TrendType.VOLATILE:
            suggestions.append(('BollingerBands', 0.95))  # Good for volatility
            suggestions.append(('RSI', 0.85))
            suggestions.append(('Momentum', 0.70))
        
        # Adjust by RSI
        if rsi > 70:  # Overbought
            for i, (name, conf) in enumerate(suggestions):
                if name in ['Momentum', 'Momentum']:
                    suggestions[i] = (name, conf * 0.7)
        
        if rsi < 30:  # Oversold
            for i, (name, conf) in enumerate(suggestions):
                if name == 'MeanReversion':
                    suggestions[i] = (name, conf * 1.1)
        
        # Sort by confidence
        suggestions.sort(key=lambda x: x[1], reverse=True)
        return suggestions
    
    def get_all_suggestions(self) -> Dict[str, List[Tuple[str, float]]]:
        """Get strategy suggestions for all analyzed coins."""
        return {
            coin: self.get_strategy_suggestions(coin)
            for coin in self.trend_signals.keys()
        }
    
    def get_report(self) -> Dict:
        """Generate comprehensive trend analysis report."""
        return {
            "analyzed_coins": list(self.trend_signals.keys()),
            "trend_analysis": self.trend_signals,
            "strategy_suggestions": self.get_all_suggestions(),
            "coins_count": len(self.trend_signals)
        }


class TrendAnalysisService:
    """Service for managing trend analysis requests."""
    
    def __init__(self):
        self.analyzer = TrendAnalyzer()
    
    def analyze_csv(self, csv_path: str) -> Dict:
        """Analyze CSV file and return recommendations."""
        results = self.analyzer.analyze_data(csv_path)
        report = self.analyzer.get_report()
        return report
    
    def analyze_multiple_csvs(self, csv_paths: List[str]) -> Dict[str, Dict]:
        """Analyze multiple CSV files."""
        all_results = {}
        
        for csv_path in csv_paths:
            results = self.analyzer.analyze_data(csv_path)
            all_results[csv_path] = self.analyzer.get_report()
        
        return all_results


if __name__ == '__main__':
    # Example usage
    service = TrendAnalysisService()
    
    # Would analyze CSV: report = service.analyze_csv('market_data.csv')
    # print(json.dumps(report, indent=2))
