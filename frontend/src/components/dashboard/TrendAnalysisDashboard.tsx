import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { TrendingUp, TrendingDown, Minus, Download, RefreshCw, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { generateTrendData } from '../../utils/mockData';

export function TrendAnalysisDashboard() {
  const [hasResults, setHasResults] = useState(false);
  const [trendData] = useState(generateTrendData());
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  
  const handleAnalyze = () => {
    setHasResults(true);
  };
  
  // Generate mock price data for the selected coin
  const generatePriceData = () => {
    const data = [];
    let price = 43000;
    for (let i = 0; i < 50; i++) {
      price = price * (1 + (Math.random() - 0.48) * 0.02);
      data.push({
        time: i,
        price: price,
        rsi: 30 + Math.random() * 40,
        maShort: price * (1 + (Math.random() - 0.5) * 0.01),
        maLong: price * (1 + (Math.random() - 0.5) * 0.015)
      });
    }
    return data;
  };
  
  const [priceData] = useState(generatePriceData());
  
  const getTrendIcon = (trend: string) => {
    if (trend === 'UPTREND') return <TrendingUp className="w-6 h-6" />;
    if (trend === 'DOWNTREND') return <TrendingDown className="w-6 h-6" />;
    return <Minus className="w-6 h-6" />;
  };
  
  const getTrendColor = (trend: string) => {
    if (trend === 'UPTREND') return 'text-[#00ff41]';
    if (trend === 'DOWNTREND') return 'text-[#ff0055]';
    return 'text-[#808080]';
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Trend Analysis & Insights</h1>
        <p className="text-[#808080]">Detect market trends and get strategy recommendations</p>
      </div>
      
      {/* Upload Section */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl">CSV Upload & Analysis Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">Coin Filter</label>
              <select className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none">
                <option>All Coins</option>
                <option>BTC</option>
                <option>ETH</option>
                <option>SOL</option>
                <option>XRP</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="primary" size="lg" onClick={handleAnalyze}>
              Analyze Trends
            </Button>
            <Button variant="outline" size="lg">Load Sample Data</Button>
          </div>
        </div>
      </Card>
      
      {/* Results Section */}
      {hasResults && (
        <>
          {/* Trend Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendData.map((item, idx) => (
              <Card 
                key={idx} 
                hover 
                onClick={() => setSelectedCoin(item.coin)}
                variant={selectedCoin === item.coin ? 'active' : 'default'}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl text-[#00d4ff] monospace">{item.coin}</div>
                    <div className={getTrendColor(item.trend)}>
                      {getTrendIcon(item.trend)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`${getTrendColor(item.trend)} uppercase text-sm`}>
                        {item.trend}
                      </span>
                      <Badge variant={item.strength === 'Strong' ? 'info' : 'neutral'} className="text-xs">
                        {item.strength}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-[#808080]">RSI:</span>{' '}
                        <span className="monospace">{item.rsi}</span>
                      </div>
                      <div>
                        <span className="text-[#808080]">Vol:</span>{' '}
                        <span className={item.volatility === 'High' ? 'text-yellow-500' : 'text-[#00ff41]'}>
                          {item.volatility}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <Badge variant="info" className="text-xs w-full text-center">
                        {item.suggestedStrategy}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Strategy Suggestions Table */}
          <Card>
            <div className="space-y-4">
              <h2 className="text-xl">Strategy Suggestions</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="text-left py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Coin</th>
                      <th className="text-left py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Detected Trend</th>
                      <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Confidence</th>
                      <th className="text-left py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Recommended</th>
                      <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Strength</th>
                      <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.map((item, idx) => (
                      <tr 
                        key={idx} 
                        className="border-b border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors"
                      >
                        <td className="py-3 px-4 text-[#00d4ff] monospace">{item.coin}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={getTrendColor(item.trend)}>
                              {getTrendIcon(item.trend)}
                            </div>
                            <span className={getTrendColor(item.trend)}>
                              {item.strength} {item.trend}
                            </span>
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-right monospace ${
                          item.confidence > 75 ? 'text-[#00ff41]' : 
                          item.confidence > 50 ? 'text-yellow-500' : 
                          'text-[#808080]'
                        }`}>
                          {item.confidence}%
                        </td>
                        <td className="py-3 px-4 text-[#00d4ff]">{item.suggestedStrategy}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="w-full bg-[#2a2a2a] rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                item.confidence > 75 ? 'bg-[#00ff41]' : 
                                item.confidence > 50 ? 'bg-yellow-500' : 
                                'bg-[#808080]'
                              }`}
                              style={{ width: `${item.confidence}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="success" size="sm">
                            Apply Strategy
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
          
          {/* Trend Detail Chart */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl">{selectedCoin} Trend Analysis</h2>
                <div className="flex gap-2">
                  {trendData.map(item => (
                    <Button 
                      key={item.coin}
                      variant={selectedCoin === item.coin ? 'primary' : 'outline'} 
                      size="sm"
                      onClick={() => setSelectedCoin(item.coin)}
                    >
                      {item.coin}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white rounded-full" />
                    <span className="text-[#808080]">Price</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#00d4ff] rounded-full" />
                    <span className="text-[#808080]">RSI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#00d4ff] rounded-full" />
                    <span className="text-[#808080]">MA Short</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#0080ff] rounded-full border-2 border-dashed" />
                    <span className="text-[#808080]">MA Long</span>
                  </div>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={priceData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#808080" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#808080" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#808080" style={{ fontSize: '12px' }} />
                  <YAxis yAxisId="price" stroke="#808080" style={{ fontSize: '12px' }} />
                  <YAxis yAxisId="rsi" orientation="right" domain={[0, 100]} stroke="#808080" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #00d4ff',
                      borderRadius: '8px'
                    }}
                  />
                  <Area yAxisId="price" type="monotone" dataKey="price" stroke="#fff" fill="url(#colorPrice)" strokeWidth={2} />
                  <Line yAxisId="rsi" type="monotone" dataKey="rsi" stroke="#00d4ff" strokeWidth={2} dot={false} />
                  <Line yAxisId="price" type="monotone" dataKey="maShort" stroke="#00d4ff" strokeWidth={1.5} dot={false} />
                  <Line yAxisId="price" type="monotone" dataKey="maLong" stroke="#0080ff" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button variant="success" size="lg">
              <TrendingUp className="w-5 h-5 mr-2" />
              Apply Suggested Strategies
            </Button>
            <Button variant="secondary" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Download Trend Report
            </Button>
            <Button variant="outline" size="lg" onClick={() => setHasResults(false)}>
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh Analysis
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
