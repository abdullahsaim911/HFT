"""
VELOCITAS HFT ENGINE - Example/Testing Script
Demonstrates all modes of operation locally (without running API server).
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

import logging
from engine.engine_core import HFTEngine, EngineMode
from engine.strategies import create_strategy
from data.crypto_data_provider import SyntheticDataGenerator, CSVDataLoader
from data.backtest_engine import BacktestEngine
from data.trend_analyzer import TrendAnalysisService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def example_live_trading():
    """Example 1: Live trading with synthetic data."""
    logger.info("\n" + "="*60)
    logger.info("EXAMPLE 1: LIVE TRADING MODE")
    logger.info("="*60)
    
    # Create engine
    engine = HFTEngine(mode=EngineMode.LIVE, num_workers=2)
    
    # Register strategies
    logger.info("Registering strategies...")
    engine.register_strategy(create_strategy('SMA_Crossover', 'BTC', fast_period=5, slow_period=20))
    engine.register_strategy(create_strategy('Momentum', 'ETH', lookback=5))
    engine.register_strategy(create_strategy('RSI', 'BTC', period=14))
    
    logger.info(f"Registered {len(engine.strategies)} strategies")
    
    # Generate synthetic data
    logger.info("Generating synthetic market data...")
    base_prices = {'BTC': 45000, 'ETH': 2500}
    generator = SyntheticDataGenerator(['BTC', 'ETH'], base_prices)
    
    # Run for limited samples
    engine.running = True
    for i, market_data in enumerate(generator.generate_batch(100)):
        engine.market_data_queue.put(market_data.to_dict())
        
        if i % 20 == 0:
            # Execute strategies
            for strategy_id, strategy in engine.strategies.items():
                if strategy.coin == market_data.coin:
                    result = strategy.execute(market_data)
                    if result:
                        action, qty = result
                        logger.info(f"Signal: {strategy_id} -> {action} {qty}")
    
    engine.running = False
    
    # Show results
    metrics = engine.get_metrics()
    logger.info(f"\nResults:")
    logger.info(f"  Total Trades: {metrics['total_trades']}")
    logger.info(f"  Net P&L: ${metrics['net_pnl']:.2f}")
    logger.info(f"  Win Rate: {metrics['win_rate']:.1f}%")
    
    return engine


def example_optimization():
    """Example 2: Optimization/backtesting mode."""
    logger.info("\n" + "="*60)
    logger.info("EXAMPLE 2: OPTIMIZATION MODE")
    logger.info("="*60)
    
    logger.info("Creating backtest engine...")
    backtest = BacktestEngine(num_workers=2)
    
    logger.info("Generating test CSV data...")
    # Create synthetic CSV data
    import tempfile
    import csv
    
    csv_path = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv').name
    
    # Generate some sample data
    with open(csv_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['coin', 'price', 'volume', 'timestamp'])
        
        prices = {'BTC': 45000, 'ETH': 2500}
        for i in range(100):
            for coin in ['BTC', 'ETH']:
                # Simulate price movement
                import random
                change = random.gauss(0, 0.01)
                prices[coin] *= (1 + change)
                
                writer.writerow([coin, f"{prices[coin]:.2f}", random.uniform(100, 1000), 1702500000 + i*60])
    
    logger.info(f"CSV data created at: {csv_path}")
    
    # Run backtest
    logger.info("Running backtest with multiple strategies...")
    configs = [
        {'name': 'SMA_Crossover', 'coin': 'BTC', 'params': {'fast_period': 5, 'slow_period': 20}},
        {'name': 'Momentum', 'coin': 'BTC', 'params': {'lookback': 5}},
        {'name': 'RSI', 'coin': 'ETH', 'params': {'period': 14}},
        {'name': 'SMA_Crossover', 'coin': 'ETH', 'params': {'fast_period': 5, 'slow_period': 20}},
    ]
    
    results = backtest.run_backtest(csv_path, configs)
    
    # Show results
    logger.info(f"\nBacktest Results:")
    logger.info(f"  Strategies tested: {len(results)}")
    
    for strategy_id, result in results.items():
        logger.info(f"\n  {strategy_id}:")
        logger.info(f"    Trades: {result.total_trades}")
        logger.info(f"    Win Rate: {result.win_rate:.1f}%")
        logger.info(f"    Net P&L: ${result.net_pnl:.2f}")
        logger.info(f"    Profit Factor: {result.profit_factor:.2f}")
    
    # Rankings
    logger.info(f"\nBest by P&L:")
    for strategy_id, pnl in backtest.rank_strategies('net_pnl')[:3]:
        logger.info(f"  {strategy_id}: ${pnl:.2f}")
    
    # Cleanup
    import os
    os.unlink(csv_path)
    
    return backtest


def example_trend_analysis():
    """Example 3: Trend analysis mode."""
    logger.info("\n" + "="*60)
    logger.info("EXAMPLE 3: TREND ANALYSIS MODE")
    logger.info("="*60)
    
    logger.info("Creating trend analyzer...")
    trend_service = TrendAnalysisService()
    
    logger.info("Generating test CSV data...")
    # Create synthetic CSV data
    import tempfile
    import csv
    
    csv_path = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv').name
    
    # Generate uptrend data
    with open(csv_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['coin', 'price', 'volume', 'timestamp'])
        
        # Uptrend for BTC
        price = 45000
        for i in range(50):
            price += 100  # Steady uptrend
            writer.writerow(['BTC', f"{price:.2f}", 1000, 1702500000 + i*60])
        
        # Downtrend for ETH
        price = 2500
        for i in range(50):
            price -= 10  # Steady downtrend
            writer.writerow(['ETH', f"{price:.2f}", 500, 1702500000 + i*60])
    
    logger.info(f"CSV data created at: {csv_path}")
    
    # Analyze
    logger.info("Analyzing market trends...")
    report = trend_service.analyze_csv(csv_path)
    
    # Show results
    logger.info(f"\nTrend Analysis Results:")
    for coin, analysis in report['trend_analysis'].items():
        logger.info(f"\n  {coin}:")
        logger.info(f"    Trend: {analysis['trend']}")
        logger.info(f"    RSI: {analysis['rsi']:.1f}")
        logger.info(f"    Volatility: {analysis['volatility']:.2f}%")
        logger.info(f"    Price Change: {analysis['price_change_percent']:.2f}%")
    
    # Suggestions
    logger.info(f"\nStrategy Suggestions:")
    for coin, suggestions in report['strategy_suggestions'].items():
        logger.info(f"\n  {coin}:")
        for strategy_name, confidence in suggestions[:3]:
            logger.info(f"    {strategy_name}: {confidence*100:.0f}% confidence")
    
    # Cleanup
    import os
    os.unlink(csv_path)
    
    return trend_service


def main():
    """Run all examples."""
    logger.info("\n")
    logger.info("╔" + "="*58 + "╗")
    logger.info("║" + " "*10 + "VELOCITAS HFT ENGINE - EXAMPLES" + " "*17 + "║")
    logger.info("╚" + "="*58 + "╝")
    
    try:
        # Run examples
        engine = example_live_trading()
        backtest = example_optimization()
        trend = example_trend_analysis()
        
        logger.info("\n" + "="*60)
        logger.info("ALL EXAMPLES COMPLETED SUCCESSFULLY")
        logger.info("="*60)
        logger.info("\nThe backend is ready for frontend integration!")
        logger.info("Start the API server with: python main.py")
        
    except Exception as e:
        logger.error(f"\nError running examples: {e}", exc_info=True)
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
