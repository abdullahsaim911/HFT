import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { StatusDot } from '../ui/StatusDot';
import { TrendingUp, Play, Pause, Square, Save, Trash2 } from 'lucide-react';
import { strategies, coins } from '../../utils/mockData';
import { fetchStrategies, registerStrategy, unregisterStrategy } from '../../api/apiClient';
import { useWsMessages } from '../../hooks/useWebSocketManager';

export function StrategyManagement() {
  const [selectedStrategy, setSelectedStrategy] = useState('SMA_Crossover');
  const [strategyStatus, setStrategyStatus] = useState<'ACTIVE' | 'IDLE' | 'PAUSED'>('ACTIVE');
  const [selectedCoins, setSelectedCoins] = useState<string[]>(['BTC', 'ETH']);
  const [params, setParams] = useState({
    smaWindow: 20,
    threshold: 2.5
  });
  
  const strategyList = [
    { name: 'SMA_Crossover', active: 2, paused: 1 },
    { name: 'Momentum', active: 3, paused: 0 },
    { name: 'MeanReversion', active: 1, paused: 1 },
    { name: 'RSI', active: 2, paused: 0 },
    { name: 'BollingerBands', active: 1, paused: 1 },
    { name: 'MACD', active: 2, paused: 0 },
  ];

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await fetchStrategies();
      if (!mounted) return;
      if (data && data.strategies) {
        // Try to set strategy list from backend registered strategies
      }
    })();

    return () => { mounted = false; };
  }, []);

  useWsMessages((msg: any) => {
    // handle incoming metrics/strategy updates if needed
    if (!msg) return;
    if (msg.type === 'metrics' && msg.strategies) {
      // optionally update UI or show status
    }
  });
  
  const toggleCoin = (coin: string) => {
    if (selectedCoins.includes(coin)) {
      setSelectedCoins(selectedCoins.filter(c => c !== coin));
    } else {
      setSelectedCoins([...selectedCoins, coin]);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Strategy Configuration & Management</h1>
        <p className="text-[#808080]">Configure and manage trading strategies</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Strategy List */}
        <div className="lg:col-span-3">
          <Card>
            <div className="space-y-2">
              <h2 className="text-lg mb-4">Strategies</h2>
              
              {strategyList.map((strategy) => (
                <div
                  key={strategy.name}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedStrategy === strategy.name
                      ? 'border-[#00d4ff] bg-[#0f0f0f] shadow-[0_0_20px_rgba(0,212,255,0.3)]'
                      : 'border-[#2a2a2a] hover:border-[#00d4ff]'
                  }`}
                  onClick={() => setSelectedStrategy(strategy.name)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-[#00d4ff]" />
                    <span className="font-medium">{strategy.name}</span>
                  </div>
                  <div className="text-xs text-[#808080]">
                    {strategy.active} active, {strategy.paused} paused
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        
        {/* Right Panel: Strategy Config Form */}
        <div className="lg:col-span-9">
          <div className="space-y-6">
            {/* Strategy Info */}
            <Card>
              <div className="border-l-4 border-l-[#00d4ff] pl-4 space-y-2">
                <h2 className="text-2xl text-[#00d4ff]">{selectedStrategy}</h2>
                <p className="text-sm italic text-[#808080]">
                  Moving average crossover strategy that generates signals when short-term and long-term moving averages cross
                </p>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-[#808080]">Created:</span>{' '}
                    <span>2025-12-14</span>
                  </div>
                  <div>
                    <span className="text-[#808080]">Version:</span>{' '}
                    <span>v1.0</span>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Parameters */}
            <Card>
              <div className="border-l-4 border-l-[#00d4ff] pl-4 space-y-4">
                <h3 className="text-xl">Parameters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">
                      SMA Window
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={params.smaWindow}
                        onChange={(e) => setParams({ ...params, smaWindow: parseInt(e.target.value) })}
                        className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none monospace"
                      />
                      <span className="text-[#808080] text-sm">periods</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">
                      Threshold
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={params.threshold}
                        onChange={(e) => setParams({ ...params, threshold: parseFloat(e.target.value) })}
                        className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none monospace"
                      />
                      <span className="text-[#808080] text-sm">%</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">
                      Position Size
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        defaultValue="1.0"
                        className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none monospace"
                      />
                      <span className="text-[#808080] text-sm">units</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">
                      Stop Loss
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        defaultValue="5.0"
                        className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none monospace"
                      />
                      <span className="text-[#808080] text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Coin Assignment */}
            <Card>
              <div className="border-l-4 border-l-[#00d4ff] pl-4 space-y-4">
                <h3 className="text-xl">Coin Assignment</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {coins.map((coin) => (
                    <label
                      key={coin}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedCoins.includes(coin)
                          ? 'border-[#00d4ff] bg-[#0f0f0f]'
                          : 'border-[#2a2a2a] hover:border-[#00d4ff]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCoins.includes(coin)}
                        onChange={() => toggleCoin(coin)}
                        className="w-5 h-5 rounded border-2 border-[#00d4ff] bg-[#0f0f0f] checked:bg-[#00d4ff]"
                      />
                      <span className="monospace">{coin}</span>
                    </label>
                  ))}
                </div>
                
                <div className="text-sm text-[#808080]">
                  {selectedCoins.length} coin{selectedCoins.length !== 1 ? 's' : ''} selected
                </div>
              </div>
            </Card>
            
            {/* Status & Actions */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl">Status & Actions</h3>
                    <div className="flex items-center gap-2">
                      <StatusDot 
                        status={
                          strategyStatus === 'ACTIVE' ? 'active' : 
                          strategyStatus === 'PAUSED' ? 'warning' : 
                          'idle'
                        } 
                        pulse={strategyStatus === 'ACTIVE'}
                      />
                      <Badge 
                        variant={
                          strategyStatus === 'ACTIVE' ? 'success' : 
                          strategyStatus === 'PAUSED' ? 'warning' : 
                          'neutral'
                        }
                      >
                        {strategyStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {strategyStatus !== 'ACTIVE' && (
                    <Button 
                      variant="success" 
                      onClick={() => setStrategyStatus('ACTIVE')}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Strategy
                    </Button>
                  )}
                  
                  {strategyStatus === 'ACTIVE' && (
                    <Button 
                      variant="warning" 
                      onClick={() => setStrategyStatus('PAUSED')}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause Strategy
                    </Button>
                  )}
                  
                  {strategyStatus !== 'IDLE' && (
                    <Button 
                      variant="danger" 
                      onClick={() => setStrategyStatus('IDLE')}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop Strategy
                    </Button>
                  )}
                  
                  <Button variant="primary">
                    <Save className="w-4 h-4 mr-2" />
                    Save & Apply
                  </Button>
                  
                  <Button variant="outline">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Strategy
                  </Button>
                </div>
              </div>
            </Card>
            
            {/* Backtest Results */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-xl">Recent Backtest Results</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2a2a2a]">
                        <th className="text-left py-2 px-3 text-sm text-[#00d4ff] uppercase tracking-wider">Coin</th>
                        <th className="text-right py-2 px-3 text-sm text-[#00d4ff] uppercase tracking-wider">Sharpe</th>
                        <th className="text-right py-2 px-3 text-sm text-[#00d4ff] uppercase tracking-wider">CAGR</th>
                        <th className="text-right py-2 px-3 text-sm text-[#00d4ff] uppercase tracking-wider">Max DD</th>
                        <th className="text-right py-2 px-3 text-sm text-[#00d4ff] uppercase tracking-wider">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#2a2a2a]">
                        <td className="py-2 px-3 text-[#00d4ff] monospace">BTC</td>
                        <td className="py-2 px-3 text-right monospace">2.8</td>
                        <td className="py-2 px-3 text-right monospace text-[#00ff41]">18.2%</td>
                        <td className="py-2 px-3 text-right monospace text-[#ff0055]">-8.5%</td>
                        <td className="py-2 px-3 text-right monospace">67%</td>
                      </tr>
                      <tr className="border-b border-[#2a2a2a]">
                        <td className="py-2 px-3 text-[#00d4ff] monospace">ETH</td>
                        <td className="py-2 px-3 text-right monospace">3.2</td>
                        <td className="py-2 px-3 text-right monospace text-[#00ff41]">22.4%</td>
                        <td className="py-2 px-3 text-right monospace text-[#ff0055]">-12.1%</td>
                        <td className="py-2 px-3 text-right monospace">71%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
