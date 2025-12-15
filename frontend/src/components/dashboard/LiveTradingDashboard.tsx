import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { StatusDot } from '../ui/StatusDot';
import { ArrowUp, ArrowDown, TrendingUp, Eye, Pause, Square, Download, Book } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { generateLiveTradeData, generatePortfolioData, generatePnlBreakdown } from '../../utils/mockData';
import { useWebSocket } from '../../hooks/useWebSocket';
import { fetchInitialMetrics, fetchInitialTrades, startEngine, stopEngine, registerStrategy, unregisterStrategy, fetchTrades, getStrategyMetrics, getOrderBook, exportOrderBook, getLatencyReport } from '../../api/apiClient';

export function LiveTradingDashboard() {
  const [liveData, setLiveData] = useState(generateLiveTradeData());
  const [portfolioData, setPortfolioData] = useState(generatePortfolioData());
  const [pnlBreakdown, setPnlBreakdown] = useState(generatePnlBreakdown());
  const [portfolioValue, setPortfolioValue] = useState(123456.78);
  const [portfolioChange, setPortfolioChange] = useState(3.2);
  const [totalPnl, setTotalPnl] = useState(5432.10);
  const [totalPnlPercent, setTotalPnlPercent] = useState(4.2);
  const [latency, setLatency] = useState(2.3);
  const [processCount, setProcessCount] = useState(4);
  const [queueSize, setQueueSize] = useState(0);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingPause, setLoadingPause] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [orderBookModalOpen, setOrderBookModalOpen] = useState(false);
  const [orderBook, setOrderBook] = useState<any[]>([]);
  const [latencyReport, setLatencyReport] = useState<any>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configData, setConfigData] = useState<any>(null);
  const [timelineRange, setTimelineRange] = useState('24h');
  const [selectedStrategy, setSelectedStrategy] = useState('all');
  
  // Fetch initial snapshot from API if available
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const metrics = await fetchInitialMetrics();
        if (metrics && mounted) {
          // Global metrics
          if (metrics.global) {
            const g = metrics.global;
            if (g.portfolioValue) setPortfolioValue(g.portfolioValue);
            if (g.portfolioChange) setPortfolioChange(g.portfolioChange);
            if (g.totalPnl) setTotalPnl(g.totalPnl);
            if (g.totalPnlPercent) setTotalPnlPercent(g.totalPnlPercent);
          }
          
          // System metrics
          if (metrics.system) {
            setLatency(metrics.system.latency_ms || 2.3);
            setProcessCount(metrics.system.process_count || 4);
            setQueueSize(metrics.system.queue_size || 0);
          }
          
          // Convert strategies to table rows
          if (metrics.strategies) {
            const strategyArray = Object.entries(metrics.strategies).map(([strategyId, strat]: [string, any]) => ({
              coin: strat.coin || strategyId.split('_')[0],
              strategy: strategyId,
              currentPrice: strat.current_price || strat.price || 0,
              pnl24h: strat.pnl || 0,
              return24h: strat.return_pct || 0,
              status: strat.status || 'ACTIVE',
              trades24h: strat.trades || 0
            }));
            if (strategyArray.length > 0) setLiveData(strategyArray);
          }
          
          // Portfolio history for chart
          if (metrics.portfolio_history && metrics.portfolio_history.length > 0) {
            const chartData = metrics.portfolio_history.map((p: any) => ({
              time: p.time || new Date(p.timestamp).toLocaleTimeString(),
              value: p.value
            }));
            setPortfolioData(chartData);
          }
        }
      } catch (e) { console.error('Failed to fetch initial metrics:', e); }
    })();
    return () => { mounted = false; };
  }, []);

  // WebSocket message handler
  const handleWsMessage = useCallback((data: any) => {
    if (!data) return;
    // backend uses type: "metrics" and "trade"
    if (data.type === 'metrics' || data.type === 'live_update') {
      const payload = data;
      // metrics -> global and strategies
      if (payload.global) {
        const g = payload.global;
        if (g.portfolioValue) setPortfolioValue(g.portfolioValue);
        if (g.portfolioChange) setPortfolioChange(g.portfolioChange);
        if (g.totalPnl) setTotalPnl(g.totalPnl);
        if (g.totalPnlPercent) setTotalPnlPercent(g.totalPnlPercent);
      }
      
      // System metrics
      if (payload.system) {
        setLatency(payload.system.latency_ms || 2.3);
        setProcessCount(payload.system.process_count || 4);
        setQueueSize(payload.system.queue_size || 0);
      }

      if (payload.strategies) {
        // convert strategies dict to liveData rows if possible
        try {
          const strategyEntries = Object.entries(payload.strategies as any);
          const updated = strategyEntries.map(([k, v]: any) => ({
            coin: v.coin || k.split('_')[0],
            strategy: k,
            currentPrice: v.current_price || v.price || 0,
            pnl24h: v.pnl || 0,
            return24h: v.return_pct || 0,
            status: v.status || 'ACTIVE',
            trades24h: v.trades || 0
          }));
          if (updated.length) setLiveData(updated);
        } catch (e) { /* ignore */ }
      }
      
      // Portfolio history for chart - update in real-time
      if (payload.portfolio_history && payload.portfolio_history.length > 0) {
        const chartData = payload.portfolio_history.map((p: any) => ({
          time: p.time || new Date(p.timestamp).toLocaleTimeString(),
          value: p.value
        }));
        if (chartData.length > 0) setPortfolioData(chartData);
      }

      // P&L Breakdown by coin for pie chart - convert from dict to array with colors
      if (payload.pnlBreakdown) {
        const breakdownDict = payload.pnlBreakdown;
        const colors = {
          'BTC': '#FFD700',
          'ETH': '#627EEA',
          'BNB': '#F3BA2F',
          'DOGE': '#C99D00',
          'ADA': '#0033FF',
          'LTC': '#345D9D',
          'XRP': '#23292F'
        };
        
        const breakdownArray = Object.entries(breakdownDict).map(([coin, pnl]: [string, any]) => ({
          name: coin,
          value: Math.abs(pnl), // Use absolute value for pie chart sizing
          color: colors[coin as keyof typeof colors] || '#00d4ff',
          pnl: pnl // Keep original for reference
        }));
        
        if (breakdownArray.length > 0) {
          setPnlBreakdown(breakdownArray);
        }
      }
    }

    if (data.type === 'trade' || data.type === 'trade_event') {
      const t = data.trade || data.payload;
      if (!t) return;
      // Update the specific row in live data when a trade occurs
      setLiveData(prev => {
        const idx = prev.findIndex(p => p.coin === t.coin && p.strategy === (t.strategy || `${t.coin}_strategy`));
        if (idx === -1) return prev;
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...t };
        return copy;
      });
    }
  }, []);

  const wsProtocol = (location.protocol === 'https:' ? 'wss' : 'ws');
  const WS_URL = (import.meta.env.VITE_WS_URL) || `${wsProtocol}://${location.hostname}:8000/ws/metrics`;
  useWebSocket(WS_URL, handleWsMessage);
  
  const activeStrategies = liveData.filter(d => d.status === 'ACTIVE').length;

  const handleStartAll = async () => {
    setLoadingStart(true);
    try {
      const res = await startEngine({ data_source: 'synthetic', coins: 'BTC,ETH', interval: 1 });
      if (res) {
        // optimistic UI update
        setLiveData(prev => prev.map(p => ({ ...p, status: 'ACTIVE' })));
      }
    } catch (e) { console.error(e); }
    setLoadingStart(false);
  };

  const handlePauseAll = async () => {
    setLoadingPause(true);
    try {
      const res = await stopEngine();
      if (res) {
        setLiveData(prev => prev.map(p => ({ ...p, status: 'PAUSED' })));
      }
    } catch (e) { console.error(e); }
    setLoadingPause(false);
  };

  const handleExportTrades = async () => {
    setExporting(true);
    try {
      const data = await fetchInitialTrades();
      const trades = data?.trades || data || [];
      // convert to CSV
      const headers = trades.length ? Object.keys(trades[0]) : [];
      const csv = [headers.join(',')].concat(trades.map((t:any) => headers.map(h => JSON.stringify(t[h] ?? '')).join(','))).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trades_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    setExporting(false);
  };

  const openStrategyDetails = async (strategyId:string) => {
    try {
      const metrics = await getStrategyMetrics(strategyId);
      const tradesRes = await fetchTrades(strategyId, 200);
      setDetailData({ metrics, trades: tradesRes?.trades || tradesRes || [] });
      setDetailModalOpen(true);
    } catch (e) { console.error(e); }
  };

  const toggleStrategy = async (item:any) => {
    // if active -> unregister, else register
    const strategyId = item.strategy;
    if (item.status === 'ACTIVE') {
      await unregisterStrategy(strategyId);
      setLiveData(prev => prev.map(p => p.strategy === strategyId ? { ...p, status: 'PAUSED' } : p));
    } else {
      // parse name from strategy id (format COIN_NAME)
      const parts = strategyId.split('_');
      const coin = item.coin || parts[0];
      const name = parts.slice(1).join('_') || parts[1] || 'SMA_Crossover';
      await registerStrategy(name, coin);
      setLiveData(prev => prev.map(p => p.strategy === strategyId ? { ...p, status: 'ACTIVE' } : p));
    }
  };

  const exportStrategyTrades = async (item:any) => {
    try {
      const res = await fetchTrades(item.strategy, 1000);
      const trades = res?.trades || res || [];
      if (!trades.length) return;
      const headers = Object.keys(trades[0]);
      const csv = [headers.join(',')].concat(trades.map((t:any)=> headers.map(h=> JSON.stringify(t[h] ?? '')).join(','))).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.strategy}_trades.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
  };

  const openOrderBook = async () => {
    try {
      const data = await getOrderBook(100);
      if (data?.order_book) {
        setOrderBook(data.order_book);
      }
      const report = await getLatencyReport();
      if (report) {
        setLatencyReport(report);
      }
      setOrderBookModalOpen(true);
    } catch (e) { console.error(e); }
  };

  const handleExportOrderBook = async () => {
    try {
      await exportOrderBook();
    } catch (e) { console.error(e); }
  };

  const openStrategyConfig = (strategyName?: string) => {
    setConfigData({
      name: strategyName || 'SMA_Crossover',
      params: {
        fast_period: 10,
        slow_period: 30,
        stop_loss: 2.5,
        take_profit: 5.0
      }
    });
    setConfigModalOpen(true);
  };

  const saveStrategyConfig = async () => {
    try {
      // In real implementation, save to backend
      console.log('Saving config:', configData);
      setConfigModalOpen(false);
    } catch (e) { console.error(e); }
  };

  const handleTimelineChange = (range: string) => {
    setTimelineRange(range);
    // In real implementation, fetch filtered data based on timeline
  };

  const filterLiveDataByStrategy = () => {
    if (selectedStrategy === 'all') return liveData;
    return liveData.filter(d => d.strategy.includes(selectedStrategy));
  };

  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover>
          <div className="space-y-2">
            <div className="text-sm text-[#808080] uppercase tracking-wider">Portfolio Value</div>
            <div className="text-3xl monospace text-[#00d4ff]">
              ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center gap-2 ${portfolioChange > 0 ? 'text-[#00ff41]' : 'text-[#ff0055]'}`}>
              {portfolioChange > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              <span className="monospace">{portfolioChange > 0 ? '+' : ''}{portfolioChange}% (24h)</span>
            </div>
          </div>
        </Card>
        
        <Card hover>
          <div className="space-y-2">
            <div className="text-sm text-[#808080] uppercase tracking-wider">Total P&L</div>
            <div className={`text-3xl monospace ${totalPnl > 0 ? 'text-[#00ff41]' : 'text-[#ff0055]'}`}>
              ${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-[#808080]">
              <span className={totalPnlPercent > 0 ? 'text-[#00ff41]' : 'text-[#ff0055]'}>
                {totalPnlPercent > 0 ? '+' : ''}{totalPnlPercent}%
              </span>
              {' '}• Win Rate: 65%
            </div>
          </div>
        </Card>
        
        <Card hover>
          <div className="space-y-2">
            <div className="text-sm text-[#808080] uppercase tracking-wider">Active Strategies</div>
            <div className="text-3xl text-[#00d4ff]">{activeStrategies}</div>
            <div className="flex flex-wrap gap-1">
              {liveData.filter(d => d.status === 'ACTIVE').slice(0, 3).map(d => (
                <Badge key={d.coin} variant="info" className="text-xs">{d.coin}</Badge>
              ))}
            </div>
          </div>
        </Card>
        
        <Card hover>
          <div className="space-y-2">
            <div className="text-sm text-[#808080] uppercase tracking-wider">System Status</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">Latency</span>
                <span className={`monospace ${latency < 5 ? 'text-[#00ff41]' : 'text-yellow-500'}`}>
                  {latency.toFixed(1)}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Processes</span>
                <span className="text-[#00ff41]">{processCount}/4 Running</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Queue</span>
                <span className="text-[#808080]">{queueSize} msgs</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Live Trading Table */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl">Live Trading Activity</h2>
              <select 
                value={selectedStrategy} 
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#00d4ff] rounded text-sm"
              >
                <option value="all">All Strategies</option>
                <option value="SMA_Crossover">SMA Crossover</option>
                <option value="Momentum">Momentum</option>
                <option value="RSI">RSI</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => openStrategyConfig()}>Configure Strategy</Button>
              <Button size="sm" variant="outline">Filter</Button>
              <Button size="sm" variant="outline">Search</Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Coin</th>
                  <th className="text-left py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Strategy</th>
                  <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Price</th>
                  <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">24h P&L</th>
                  <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">24h Return</th>
                  <th className="text-left py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Trades</th>
                  <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterLiveDataByStrategy().map((item, idx) => (
                  <tr 
                    key={idx} 
                    className="border-b border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors group"
                  >
                    <td className="py-3 px-4 text-[#00d4ff] monospace">{item.coin}</td>
                    <td className="py-3 px-4">{item.strategy}</td>
                    <td className="py-3 px-4 text-right monospace flash-update">
                      ${item.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`py-3 px-4 text-right monospace ${item.pnl24h > 0 ? 'text-[#00ff41]' : 'text-[#ff0055]'}`}>
                      {item.pnl24h > 0 ? '+' : ''}${item.pnl24h.toFixed(2)}
                    </td>
                    <td className={`py-3 px-4 text-right monospace ${item.return24h > 0 ? 'text-[#00ff41]' : 'text-[#ff0055]'}`}>
                      {item.return24h > 0 ? '+' : ''}{item.return24h}%
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <StatusDot 
                          status={item.status === 'ACTIVE' ? 'active' : item.status === 'ERROR' ? 'error' : item.status === 'PAUSED' ? 'warning' : 'idle'} 
                          pulse={item.status === 'ACTIVE'}
                        />
                        <Badge 
                          variant={
                            item.status === 'ACTIVE' ? 'success' : 
                            item.status === 'ERROR' ? 'danger' : 
                            item.status === 'PAUSED' ? 'warning' : 
                            'neutral'
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-[#808080]">{item.trades24h}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openStrategyDetails(item.strategy)} className="p-1 hover:text-[#00d4ff]" title="Details"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => toggleStrategy(item)} className="p-1 hover:text-yellow-500" title={item.status === 'ACTIVE' ? 'Pause' : 'Start'}><Pause className="w-4 h-4" /></button>
                        <button onClick={() => exportStrategyTrades(item)} className="p-1 hover:text-[#ff0055]" title="Export Trades"><Square className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
      
      {/* Charts Section with Timeline & Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg">Portfolio Value</h3>
            <div className="flex gap-2">
              {['1h', '4h', '24h', '7d', '30d'].map(range => (
                <Button
                  key={range}
                  size="sm"
                  variant={timelineRange === range ? 'primary' : 'outline'}
                  onClick={() => handleTimelineChange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={portfolioData}>
              <XAxis dataKey="time" stroke="#808080" style={{ fontSize: '12px' }} />
              <YAxis stroke="#808080" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #00d4ff',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="value" stroke="#00d4ff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        
        <Card>
          <h3 className="text-lg mb-4">P&L Breakdown by Coin</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pnlBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pnlBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #00d4ff',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" size="lg" onClick={handleStartAll} disabled={loadingStart}>
          <TrendingUp className="w-5 h-5 mr-2" />
          {loadingStart ? 'Starting...' : 'Start All Strategies'}
        </Button>
        <Button variant="warning" size="lg" onClick={handlePauseAll} disabled={loadingPause}>
          <Pause className="w-5 h-5 mr-2" />
          {loadingPause ? 'Pausing...' : 'Pause All'}
        </Button>
        <Button variant="secondary" size="lg">Configure Strategy</Button>
        <Button variant="outline" size="lg" onClick={handleExportTrades} disabled={exporting}>
          {exporting ? 'Exporting...' : 'Export Trades CSV'}
        </Button>
        <Button variant="outline" size="lg" onClick={openOrderBook}>
          <Book className="w-5 h-5 mr-2" />
          View Order Book
        </Button>
      </div>
      
      {/* Order Book Modal */}
      {orderBookModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl">Order Book</h2>
              <button onClick={() => setOrderBookModalOpen(false)} className="text-[#808080] hover:text-[#00d4ff]">✕</button>
            </div>
            
            {/* Latency Report Summary */}
            {latencyReport && (
              <div className="grid grid-cols-4 gap-4 mb-4 pb-4 border-b border-[#2a2a2a]">
                <div>
                  <div className="text-sm text-[#808080]">Avg Latency</div>
                  <div className="text-lg text-[#00ff41]">{latencyReport.avg_latency_ms.toFixed(2)}ms</div>
                </div>
                <div>
                  <div className="text-sm text-[#808080]">Min Latency</div>
                  <div className="text-lg text-[#00d4ff]">{latencyReport.min_latency_ms.toFixed(2)}ms</div>
                </div>
                <div>
                  <div className="text-sm text-[#808080]">Max Latency</div>
                  <div className="text-lg text-[#ff0055]">{latencyReport.max_latency_ms.toFixed(2)}ms</div>
                </div>
                <div>
                  <div className="text-sm text-[#808080]">Total Trades</div>
                  <div className="text-lg text-[#00d4ff]">{latencyReport.total_trades}</div>
                </div>
              </div>
            )}
            
            {/* Order Book Table */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left py-2 px-2 text-[#00d4ff]">Order ID</th>
                    <th className="text-left py-2 px-2 text-[#00d4ff]">Coin</th>
                    <th className="text-left py-2 px-2 text-[#00d4ff]">Type</th>
                    <th className="text-right py-2 px-2 text-[#00d4ff]">Price</th>
                    <th className="text-right py-2 px-2 text-[#00d4ff]">Qty</th>
                    <th className="text-right py-2 px-2 text-[#00d4ff]">Latency (ms)</th>
                    <th className="text-left py-2 px-2 text-[#00d4ff]">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orderBook.map((order: any) => (
                    <tr key={order.order_id} className="border-b border-[#2a2a2a]">
                      <td className="py-2 px-2 text-[#00d4ff]">{order.order_id}</td>
                      <td className="py-2 px-2">{order.coin}</td>
                      <td className={`py-2 px-2 ${order.type === 'BUY' ? 'text-[#00ff41]' : 'text-[#ff0055]'}`}>{order.type}</td>
                      <td className="py-2 px-2 text-right text-[#808080]">${order.price.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right text-[#808080]">{order.quantity.toFixed(6)}</td>
                      <td className="py-2 px-2 text-right text-[#00ff41]">{order.decision_time_ms?.toFixed(2) || 'N/A'}</td>
                      <td className="py-2 px-2 text-[#808080] text-xs">{new Date(order.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleExportOrderBook}>
                <Download className="w-4 h-4 mr-2" />
                Export Order Book CSV
              </Button>
              <Button variant="outline" onClick={() => setOrderBookModalOpen(false)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
