# Data package initialization
from .crypto_data_provider import (
    BinanceDataProvider,
    CoinGeckoDataProvider,
    CSVDataLoader,
    SyntheticDataGenerator
)
from .backtest_engine import BacktestEngine
from .trend_analyzer import TrendAnalysisService, TrendAnalyzer
