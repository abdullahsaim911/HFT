// Mock data for the HFT Dashboard

export const coins = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'MATIC'];
export const strategies = ['SMA_Crossover', 'Momentum', 'MeanReversion', 'RSI', 'BollingerBands', 'MACD'];

export interface LiveTradeData {
  coin: string;
  strategy: string;
  currentPrice: number;
  pnl24h: number;
  return24h: number;
  status: 'ACTIVE' | 'IDLE' | 'PAUSED' | 'ERROR';
  trades24h: number;
}

export interface TradeRecord {
  id: string;
  timestamp: string;
  coin: string;
  strategy: string;
  orderType: 'BUY' | 'SELL';
  quantity: number;
  executionPrice: number;
  currentPrice: number;
  pnl: number;
  status: 'Executed' | 'Pending' | 'Failed';
}

export interface Alert {
  id: string;
  type: 'BUY' | 'SELL' | 'WARNING' | 'INFO';
  title: string;
  details: string;
  timestamp: string;
  strategyCoain: string;
}

export const generateLiveTradeData = (): LiveTradeData[] => {
  return [
    { coin: 'BTC', strategy: 'SMA_Crossover', currentPrice: 43210, pnl24h: 542.10, return24h: 3.2, status: 'ACTIVE', trades24h: 12 },
    { coin: 'ETH', strategy: 'Momentum', currentPrice: 2320, pnl24h: -50.30, return24h: -1.1, status: 'IDLE', trades24h: 8 },
    { coin: 'SOL', strategy: 'RSI', currentPrice: 98.50, pnl24h: 120.45, return24h: 2.8, status: 'ACTIVE', trades24h: 15 },
    { coin: 'XRP', strategy: 'MACD', currentPrice: 0.62, pnl24h: 89.20, return24h: 1.9, status: 'ACTIVE', trades24h: 20 },
    { coin: 'DOGE', strategy: 'BollingerBands', currentPrice: 0.089, pnl24h: -23.10, return24h: -0.5, status: 'PAUSED', trades24h: 5 },
    { coin: 'ADA', strategy: 'MeanReversion', currentPrice: 0.55, pnl24h: 67.80, return24h: 1.4, status: 'ACTIVE', trades24h: 11 },
  ];
};

export const generateTradeHistory = (): TradeRecord[] => {
  const records: TradeRecord[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 50; i++) {
    const coin = coins[Math.floor(Math.random() * coins.length)];
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    const orderType = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const quantity = Math.random() * 2;
    const executionPrice = Math.random() * 50000;
    const currentPrice = executionPrice * (1 + (Math.random() - 0.5) * 0.1);
    const pnl = (currentPrice - executionPrice) * quantity * (orderType === 'BUY' ? 1 : -1);
    
    records.push({
      id: `trade-${i}`,
      timestamp: new Date(now - i * 3600000).toISOString(),
      coin,
      strategy,
      orderType,
      quantity,
      executionPrice,
      currentPrice,
      pnl,
      status: i < 2 ? 'Pending' : i < 3 ? 'Failed' : 'Executed'
    });
  }
  
  return records;
};

export const generateAlerts = (): Alert[] => {
  return [
    {
      id: 'alert-1',
      type: 'BUY',
      title: 'ETH_Momentum – BUY Signal Detected',
      details: 'Price: $2,350 | Strength: 78% | Suggested Trade Size: 0.5 ETH',
      timestamp: '2 minutes ago',
      strategyCoain: 'ETH_Momentum'
    },
    {
      id: 'alert-2',
      type: 'SELL',
      title: 'BTC_SMA_Crossover – SELL Signal Detected',
      details: 'Price: $43,100 | Strength: 82% | Suggested Trade Size: 0.2 BTC',
      timestamp: '15 minutes ago',
      strategyCoain: 'BTC_SMA_Crossover'
    },
    {
      id: 'alert-3',
      type: 'WARNING',
      title: 'High Latency Warning',
      details: 'Current latency: 12.3ms | Threshold exceeded',
      timestamp: '1 hour ago',
      strategyCoain: 'System'
    },
    {
      id: 'alert-4',
      type: 'BUY',
      title: 'SOL_RSI – BUY Signal Detected',
      details: 'Price: $98.50 | Strength: 71% | Suggested Trade Size: 2 SOL',
      timestamp: '2 hours ago',
      strategyCoain: 'SOL_RSI'
    }
  ];
};

export const generatePortfolioData = () => {
  const data = [];
  const now = Date.now();
  
  for (let i = 24; i >= 0; i--) {
    data.push({
      time: new Date(now - i * 3600000).toLocaleTimeString('en-US', { hour: '2-digit' }),
      value: 100000 + Math.random() * 30000 + i * 500
    });
  }
  
  return data;
};

export const generatePnlBreakdown = () => {
  return [
    { name: 'BTC', value: 2450, color: '#00d4ff' },
    { name: 'ETH', value: 1340, color: '#00ff41' },
    { name: 'SOL', value: 890, color: '#0080ff' },
    { name: 'XRP', value: 752, color: '#ff00ff' },
  ];
};

export const generateBacktestResults = () => {
  return [
    { strategy: 'SMA_Crossover', coin: 'BTC', return: 24.5, sharpe: 2.8, cagr: 18.2, maxDD: -8.5, winRate: 67, trades: 124 },
    { strategy: 'Momentum', coin: 'ETH', return: 32.1, sharpe: 3.2, cagr: 22.4, maxDD: -12.1, winRate: 71, trades: 156 },
    { strategy: 'RSI', coin: 'SOL', return: 28.7, sharpe: 2.9, cagr: 20.5, maxDD: -10.2, winRate: 69, trades: 143 },
    { strategy: 'MACD', coin: 'XRP', return: 19.3, sharpe: 2.3, cagr: 15.8, maxDD: -7.8, winRate: 64, trades: 98 },
    { strategy: 'BollingerBands', coin: 'DOGE', return: 15.2, sharpe: 1.9, cagr: 12.4, maxDD: -9.5, winRate: 61, trades: 87 },
    { strategy: 'MeanReversion', coin: 'ADA', return: 21.8, sharpe: 2.5, cagr: 17.2, maxDD: -8.9, winRate: 65, trades: 112 },
  ];
};

export const generateTrendData = () => {
  return [
    { 
      coin: 'BTC', 
      trend: 'UPTREND', 
      strength: 'Strong', 
      rsi: 65.3, 
      volatility: 'Low', 
      suggestedStrategy: 'Momentum Buy',
      confidence: 87
    },
    { 
      coin: 'ETH', 
      trend: 'UPTREND', 
      strength: 'Weak', 
      rsi: 58.2, 
      volatility: 'Medium', 
      suggestedStrategy: 'SMA_Crossover',
      confidence: 68
    },
    { 
      coin: 'SOL', 
      trend: 'DOWNTREND', 
      strength: 'Strong', 
      rsi: 32.5, 
      volatility: 'High', 
      suggestedStrategy: 'RSI Oversold',
      confidence: 82
    },
    { 
      coin: 'XRP', 
      trend: 'FLAT', 
      strength: 'Weak', 
      rsi: 48.7, 
      volatility: 'Low', 
      suggestedStrategy: 'MeanReversion',
      confidence: 54
    },
  ];
};
