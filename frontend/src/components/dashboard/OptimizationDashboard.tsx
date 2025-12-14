import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Upload, TrendingUp, Download, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { generateBacktestResults } from '../../utils/mockData';

export function OptimizationDashboard() {
  const [hasResults, setHasResults] = useState(false);
  const [results] = useState(generateBacktestResults());
  const [isRunning, setIsRunning] = useState(false);
  
  const handleRunBacktest = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasResults(true);
    }, 2000);
  };
  
  const bestStrategy = results.reduce((prev, current) => 
    (prev.sharpe > current.sharpe) ? prev : current
  );
  
  const avgWinRate = (results.reduce((sum, r) => sum + r.winRate, 0) / results.length).toFixed(1);
  
  const chartData = results.map(r => ({
    name: `${r.coin}_${r.strategy.split('_')[0]}`,
    sharpe: r.sharpe,
    return: r.return
  }));
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Optimization & Backtesting</h1>
        <p className="text-[#808080]">Upload historical data and run strategy backtests</p>
      </div>
      
      {/* Upload Section */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl">CSV Upload & Configuration</h2>
          
          <div className="border-2 border-dashed border-[#00d4ff] rounded-lg p-12 text-center hover:border-[#00b8e6] transition-colors cursor-pointer">
            <Upload className="w-12 h-12 text-[#00d4ff] mx-auto mb-4" />
            <p className="text-lg mb-2">Drag CSV here or click to browse</p>
            <p className="text-sm text-[#808080]">Supported formats: CSV (OHLCV data)</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">From Date</label>
              <input 
                type="date" 
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none"
                defaultValue="2024-01-01"
              />
            </div>
            <div>
              <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">To Date</label>
              <input 
                type="date" 
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none"
                defaultValue="2024-12-14"
              />
            </div>
            <div>
              <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">Initial Capital</label>
              <input 
                type="number" 
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none"
                defaultValue="10000"
              />
            </div>
            <div>
              <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">Strategy</label>
              <select className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none">
                <option>All Strategies</option>
                <option>SMA_Crossover</option>
                <option>Momentum</option>
                <option>RSI</option>
                <option>MACD</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="success" size="lg" onClick={handleRunBacktest} isLoading={isRunning}>
              Run Backtest
            </Button>
            <Button variant="outline" size="lg">Load Sample Data</Button>
          </div>
        </div>
      </Card>
      
      {/* Results Section */}
      {hasResults && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card hover>
              <div className="space-y-2">
                <div className="text-sm text-[#808080] uppercase tracking-wider">Best Strategy</div>
                <div className="text-xl text-[#00d4ff]">{bestStrategy.strategy}</div>
                <div className="text-sm">
                  <span className="text-[#808080]">Sharpe:</span>{' '}
                  <span className="text-white monospace">{bestStrategy.sharpe}</span>
                </div>
              </div>
            </Card>
            
            <Card hover>
              <div className="space-y-2">
                <div className="text-sm text-[#808080] uppercase tracking-wider">Best Coin</div>
                <div className="text-xl text-[#00d4ff]">{bestStrategy.coin}</div>
                <div className="text-sm">
                  <span className="text-[#00ff41] monospace">+{bestStrategy.return}%</span>
                </div>
              </div>
            </Card>
            
            <Card hover>
              <div className="space-y-2">
                <div className="text-sm text-[#808080] uppercase tracking-wider">Avg Win Rate</div>
                <div className="text-xl text-[#00ff41] monospace">{avgWinRate}%</div>
                <div className="text-sm text-[#808080]">Across all strategies</div>
              </div>
            </Card>
            
            <Card hover>
              <div className="space-y-2">
                <div className="text-sm text-[#808080] uppercase tracking-wider">Recommended</div>
                <div className="text-lg text-[#00d4ff]">BTC_SMA + ETH_RSI</div>
                <Button variant="success" size="sm" className="mt-2">Apply Combo</Button>
              </div>
            </Card>
          </div>
          
          {/* Detailed Results Table */}
          <Card>
            <div className="space-y-4">
              <h2 className="text-xl">Backtest Results</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="text-left py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Strategy</th>
                      <th className="text-left py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Coin</th>
                      <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Return %</th>
                      <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Sharpe</th>
                      <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">CAGR</th>
                      <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Max DD</th>
                      <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Win Rate</th>
                      <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Trades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.sort((a, b) => b.sharpe - a.sharpe).map((item, idx) => (
                      <tr 
                        key={idx} 
                        className="border-b border-[#2a2a2a] hover:bg-[#1a1a1a] hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all cursor-pointer"
                      >
                        <td className="py-3 px-4">{item.strategy}</td>
                        <td className="py-3 px-4 text-[#00d4ff] monospace">{item.coin}</td>
                        <td className={`py-3 px-4 text-right monospace ${item.return > 0 ? 'text-[#00ff41]' : 'text-[#ff0055]'}`}>
                          {item.return > 0 ? '+' : ''}{item.return}%
                        </td>
                        <td className="py-3 px-4 text-right monospace">{item.sharpe}</td>
                        <td className="py-3 px-4 text-right monospace text-[#00ff41]">{item.cagr}%</td>
                        <td className="py-3 px-4 text-right monospace text-[#ff0055]">{item.maxDD}%</td>
                        <td className="py-3 px-4 text-right monospace">{item.winRate}%</td>
                        <td className="py-3 px-4 text-right text-[#808080]">{item.trades}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
          
          {/* Strategy Ranking Chart */}
          <Card>
            <h3 className="text-lg mb-4">Strategy Performance (Sharpe Ratio)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#808080" style={{ fontSize: '12px' }} />
                <YAxis stroke="#808080" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #00d4ff',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="sharpe" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.return > 0 ? '#00ff41' : '#ff0055'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button variant="success" size="lg">
              <TrendingUp className="w-5 h-5 mr-2" />
              Apply Best Combo to Live
            </Button>
            <Button variant="secondary" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Download Report (PDF)
            </Button>
            <Button variant="outline" size="lg" onClick={() => setHasResults(false)}>
              <RefreshCw className="w-5 h-5 mr-2" />
              Clear & Run Again
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
