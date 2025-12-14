"""
VELOCITAS HFT ENGINE - Crypto Data Provider
Fetches real market data from free APIs (CoinGecko, Binance, Kraken)
No API keys required for public market data.
"""

import requests
import time
import logging
from typing import List, Dict, Optional, Generator
from datetime import datetime
from engine_core import MarketData
import asyncio

logger = logging.getLogger(__name__)


class CryptoDataProvider:
    """Base class for crypto data providers."""
    
    def __init__(self, coins: List[str], interval: int = 1):
        """
        Initialize provider.
        
        Args:
            coins: List of coin symbols (e.g., ['bitcoin', 'ethereum'])
            interval: Update interval in seconds
        """
        self.coins = coins
        self.interval = interval
        self.prices = {coin: 0.0 for coin in coins}
        self.volumes = {coin: 0.0 for coin in coins}
    
    def get_live_stream(self) -> Generator[MarketData, None, None]:
        """Get live market data stream."""
        raise NotImplementedError


class BinanceDataProvider(CryptoDataProvider):
    """Fetch market data from Binance public API (no auth required)."""
    
    def __init__(self, coins: List[str] = None, interval: int = 1):
        """
        Initialize Binance provider.
        
        Args:
            coins: List of coins (e.g., ['BTC', 'ETH', 'XRP'])
            interval: Update interval in seconds
        """
        if coins is None:
            coins = ['BTC', 'ETH', 'BNB', 'XRP', 'SOL']
        
        self.coins = coins
        self.interval = interval
        self.base_url = "https://api.binance.com/api/v3"
        self.prices = {coin: 0.0 for coin in coins}
        self.volumes = {coin: 0.0 for coin in coins}
    
    def _get_ticker(self, coin: str) -> Optional[Dict]:
        """Fetch ticker data for a coin."""
        try:
            symbol = f"{coin}USDT"
            url = f"{self.base_url}/ticker/24hr?symbol={symbol}"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'coin': coin,
                    'price': float(data['lastPrice']),
                    'volume': float(data['quoteAssetVolume']),
                    'bid': float(data['bidPrice']),
                    'ask': float(data['askPrice'])
                }
        except Exception as e:
            logger.warning(f"Error fetching {coin} from Binance: {e}")
        
        return None
    
    def get_live_stream(self) -> Generator[MarketData, None, None]:
        """
        Yield live market data from Binance.
        Updates every `interval` seconds.
        """
        while True:
            try:
                for coin in self.coins:
                    ticker = self._get_ticker(coin)
                    
                    if ticker:
                        market_data = MarketData(
                            coin=ticker['coin'],
                            price=ticker['price'],
                            volume=ticker['volume'],
                            timestamp=time.time(),
                            bid=ticker.get('bid'),
                            ask=ticker.get('ask')
                        )
                        
                        yield market_data
                        time.sleep(0.1)  # Small delay between coins
                
                time.sleep(self.interval)
            except KeyboardInterrupt:
                break
            except Exception as e:
                logger.error(f"Error in live stream: {e}")
                time.sleep(5)


class CoinGeckoDataProvider(CryptoDataProvider):
    """Fetch market data from CoinGecko public API."""
    
    def __init__(self, coins: List[str] = None, interval: int = 5):
        """
        Initialize CoinGecko provider.
        
        Args:
            coins: List of coin IDs (e.g., ['bitcoin', 'ethereum'])
            interval: Update interval in seconds (min 5 due to rate limit)
        """
        if coins is None:
            coins = ['bitcoin', 'ethereum', 'binancecoin', 'ripple', 'solana']
        
        self.coins = coins
        self.interval = max(interval, 5)  # Min 5 seconds for free tier
        self.base_url = "https://api.coingecko.com/api/v3"
        self.coin_map = {
            'bitcoin': 'BTC',
            'ethereum': 'ETH',
            'binancecoin': 'BNB',
            'ripple': 'XRP',
            'solana': 'SOL',
            'cardano': 'ADA',
            'polkadot': 'DOT',
        }
    
    def _get_price_data(self) -> Dict[str, Dict]:
        """Fetch price data for all coins."""
        try:
            ids = ','.join(self.coins)
            url = f"{self.base_url}/simple/price?ids={ids}&vs_currency=usd&include_market_cap=true&include_24hr_vol=true"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logger.warning(f"Error fetching from CoinGecko: {e}")
        
        return {}
    
    def get_live_stream(self) -> Generator[MarketData, None, None]:
        """Yield live market data from CoinGecko."""
        while True:
            try:
                data = self._get_price_data()
                
                for coin_id in self.coins:
                    if coin_id in data:
                        price_data = data[coin_id]
                        
                        market_data = MarketData(
                            coin=self.coin_map.get(coin_id, coin_id.upper()),
                            price=float(price_data.get('usd', 0)),
                            volume=float(price_data.get('usd_24h_vol', 0)),
                            timestamp=time.time()
                        )
                        
                        yield market_data
                
                time.sleep(self.interval)
            except KeyboardInterrupt:
                break
            except Exception as e:
                logger.error(f"Error in CoinGecko stream: {e}")
                time.sleep(self.interval)


class CSVDataLoader:
    """Load market data from CSV for backtesting."""
    
    def __init__(self, csv_path: str):
        """
        Initialize CSV loader.
        
        Args:
            csv_path: Path to CSV file
                     Columns: coin, price, volume, timestamp (optional: bid, ask)
        """
        self.csv_path = csv_path
    
    def load_data(self) -> Generator[MarketData, None, None]:
        """Load and yield market data from CSV."""
        try:
            import csv
            with open(self.csv_path, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    yield MarketData(
                        coin=row['coin'],
                        price=float(row['price']),
                        volume=float(row['volume']),
                        timestamp=float(row.get('timestamp', time.time())),
                        bid=float(row['bid']) if 'bid' in row else None,
                        ask=float(row['ask']) if 'ask' in row else None
                    )
        except FileNotFoundError:
            logger.error(f"CSV file not found: {self.csv_path}")
        except Exception as e:
            logger.error(f"Error loading CSV: {e}")


class SyntheticDataGenerator:
    """Generate synthetic market data for testing."""
    
    def __init__(self, coins: List[str], base_prices: Dict[str, float], 
                 volatility: float = 0.02):
        """
        Initialize synthetic generator.
        
        Args:
            coins: List of coin symbols
            base_prices: Initial prices for each coin
            volatility: Price volatility (daily)
        """
        self.coins = coins
        self.current_prices = base_prices.copy()
        self.volatility = volatility
    
    def generate_batch(self, num_samples: int = 1000) -> Generator[MarketData, None, None]:
        """Generate synthetic data batch."""
        import random
        
        for i in range(num_samples):
            for coin in self.coins:
                # Geometric Brownian motion
                drift = 0.0001
                shock = random.gauss(0, self.volatility)
                price_change = drift + shock
                
                new_price = self.current_prices[coin] * (1 + price_change)
                new_price = max(new_price, self.current_prices[coin] * 0.5)
                
                self.current_prices[coin] = new_price
                
                yield MarketData(
                    coin=coin,
                    price=new_price,
                    volume=random.uniform(100, 10000),
                    timestamp=time.time() + i
                )
    
    def continuous_stream(self, interval: float = 0.1) -> Generator[MarketData, None, None]:
        """Generate continuous stream."""
        import random
        
        while True:
            for coin in self.coins:
                drift = 0.0001
                shock = random.gauss(0, self.volatility)
                price_change = drift + shock
                
                new_price = self.current_prices[coin] * (1 + price_change)
                new_price = max(new_price, self.current_prices[coin] * 0.5)
                
                self.current_prices[coin] = new_price
                
                yield MarketData(
                    coin=coin,
                    price=new_price,
                    volume=random.uniform(100, 10000),
                    timestamp=time.time()
                )
            
            time.sleep(interval)


# Helper function to test data providers
def test_binance_provider():
    """Test Binance data provider."""
    provider = BinanceDataProvider(coins=['BTC', 'ETH', 'BNB'])
    
    print("Testing Binance provider...")
    count = 0
    for market_data in provider.get_live_stream():
        print(f"{market_data.coin}: ${market_data.price:.2f}")
        count += 1
        if count >= 10:
            break


if __name__ == '__main__':
    test_binance_provider()
