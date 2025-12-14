"""
VELOCITAS HFT ENGINE - Configuration
Default settings for the engine.
"""

# Server Configuration
SERVER_HOST = "0.0.0.0"
SERVER_PORT = 8000
DEBUG = False

# Engine Configuration
DEFAULT_NUM_WORKERS = 4
DEFAULT_MODE = "live"  # live, optimization, trend_analysis, copilot

# Data Sources
DEFAULT_DATA_SOURCE = "binance"  # binance, coingecko, synthetic, csv
DEFAULT_COINS = ["BTC", "ETH", "BNB"]
DEFAULT_UPDATE_INTERVAL = 1  # seconds

# WebSocket Configuration
WEBSOCKET_UPDATE_INTERVAL = 1  # seconds
WEBSOCKET_MAX_CONNECTIONS = 100

# Strategy Configuration
DEFAULT_POSITION_SIZE = 1.0
DEFAULT_FAST_PERIOD = 5
DEFAULT_SLOW_PERIOD = 20

# Risk Management
MAX_POSITION_SIZE = 100.0
MIN_POSITION_SIZE = 0.1

# API Rate Limiting
BINANCE_RATE_LIMIT = 1200  # requests per minute
COINGECKO_RATE_LIMIT = 50  # requests per minute

# Logging
LOG_LEVEL = "INFO"
LOG_FILE = "hft_engine.log"

# Performance Tuning
QUEUE_MAXSIZE = 10000
METRICS_HISTORY_SIZE = 10000

# CSV Validation
CSV_REQUIRED_COLUMNS = ["coin", "price", "volume"]
CSV_OPTIONAL_COLUMNS = ["timestamp", "bid", "ask"]
