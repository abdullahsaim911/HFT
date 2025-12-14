import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Eye, Trash2, Download, Printer } from 'lucide-react';
import { fetchInitialTrades } from '../../api/apiClient';
import { useWsMessages } from '../../hooks/useWebSocketManager';

export function TradeHistoryDashboard() {
  const [trades, setTrades] = useState<any[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    coin: 'All',
    strategy: 'All',
    status: 'All'
  });
  
  const filteredTrades = trades.filter(trade => {
    if (filters.coin !== 'All' && trade.coin !== filters.coin) return false;
    if (filters.strategy !== 'All' && trade.strategy !== filters.strategy) return false;
    if (filters.status !== 'All' && trade.status !== filters.status) return false;
    return true;
  });
  
  const totalTrades = filteredTrades.length;
  const executedTrades = filteredTrades.filter(t => t.status === 'Executed');
  const winningTrades = executedTrades.filter(t => t.pnl > 0);
  const losingTrades = executedTrades.filter(t => t.pnl < 0);
  const winRate = executedTrades.length > 0 ? ((winningTrades.length / executedTrades.length) * 100).toFixed(1) : '0';
  const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length : 0;
  const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0;
  const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0;
  
  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await fetchInitialTrades();
      if (mounted && data && Array.isArray(data.trades)) setTrades(data.trades.reverse());
    })();

    return () => { mounted = false; };
  }, []);

  // subscribe to trade ws messages
  useWsMessages((msg: any) => {
    if (!msg) return;
    // backend sends {type: 'trade', trade: {...}}
    if (msg.type === 'trade') {
      const t = msg.trade;
      setTrades(prev => [t, ...prev]);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Trade History & Execution Records</h1>
        <p className="text-[#808080]">Complete record of all trading activity</p>
      </div>
      
      {/* P&L Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card hover>
          <div className="space-y-1">
            <div className="text-xs text-[#808080] uppercase tracking-wider">Total Trades</div>
            <div className="text-2xl monospace">{totalTrades}</div>
          </div>
        </Card>
        
        <Card hover>
          <div className="space-y-1">
            <div className="text-xs text-[#808080] uppercase tracking-wider">Win Rate</div>
            <div className="text-2xl text-[#00ff41] monospace">{winRate}%</div>
          </div>
        </Card>
        
        <Card hover>
          <div className="space-y-1">
            <div className="text-xs text-[#808080] uppercase tracking-wider">Avg Win</div>
            <div className="text-2xl text-[#00ff41] monospace">
              +${avgWin.toFixed(2)}
            </div>
          </div>
        </Card>
        
        <Card hover>
          <div className="space-y-1">
            <div className="text-xs text-[#808080] uppercase tracking-wider">Avg Loss</div>
            <div className="text-2xl text-[#ff0055] monospace">
              ${avgLoss.toFixed(2)}
            </div>
          </div>
        </Card>
        
        <Card hover>
          <div className="space-y-1">
            <div className="text-xs text-[#808080] uppercase tracking-wider">Largest Win</div>
            <div className="text-2xl text-[#00ff41] monospace">
              +${largestWin.toFixed(2)}
            </div>
          </div>
        </Card>
        
        <Card hover>
          <div className="space-y-1">
            <div className="text-xs text-[#808080] uppercase tracking-wider">Largest Loss</div>
            <div className="text-2xl text-[#ff0055] monospace">
              ${largestLoss.toFixed(2)}
            </div>
          </div>
        </Card>
      </div>
      
      {/* Filter & Search Bar */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">Coin</label>
            <select 
              value={filters.coin}
              onChange={(e) => setFilters({...filters, coin: e.target.value})}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none"
            >
              <option>All</option>
              <option>BTC</option>
              <option>ETH</option>
              <option>SOL</option>
              <option>XRP</option>
              <option>DOGE</option>
              <option>ADA</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">Strategy</label>
            <select 
              value={filters.strategy}
              onChange={(e) => setFilters({...filters, strategy: e.target.value})}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none"
            >
              <option>All</option>
              <option>SMA_Crossover</option>
              <option>Momentum</option>
              <option>MeanReversion</option>
              <option>RSI</option>
              <option>MACD</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">Status</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none"
            >
              <option>All</option>
              <option>Executed</option>
              <option>Pending</option>
              <option>Failed</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setFilters({ coin: 'All', strategy: 'All', status: 'All' })}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Trade Table */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Trade Records ({filteredTrades.length})</h2>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#1a1a1a]">
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Timestamp</th>
                  <th className="text-left py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Coin</th>
                  <th className="text-left py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Strategy</th>
                  <th className="text-left py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Type</th>
                  <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Quantity</th>
                  <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Exec Price</th>
                  <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Current Price</th>
                  <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">P&L</th>
                  <th className="text-left py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-sm text-[#00d4ff] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.slice(0, 25).map((trade) => (
                  <React.Fragment key={trade.id}>
                    <tr 
                      className="border-b border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
                      onClick={() => setExpandedRow(expandedRow === trade.id ? null : trade.id)}
                    >
                      <td className="py-3 px-4 text-sm monospace text-[#808080]">
                        {new Date(trade.timestamp).toLocaleString('en-US', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit',
                          hour: '2-digit', 
                          minute: '2-digit', 
                          second: '2-digit' 
                        })}
                      </td>
                      <td className="py-3 px-4 text-[#00d4ff] monospace">{trade.coin}</td>
                      <td className="py-3 px-4">{trade.strategy}</td>
                      <td className="py-3 px-4">
                        <Badge variant={trade.orderType === 'BUY' ? 'success' : 'danger'}>
                          {trade.orderType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right monospace">{trade.quantity.toFixed(4)}</td>
                      <td className="py-3 px-4 text-right monospace">
                        ${trade.executionPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right monospace">
                        ${trade.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3 px-4 text-right monospace ${trade.pnl > 0 ? 'text-[#00ff41]' : 'text-[#ff0055]'}`}>
                        {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={
                            trade.status === 'Executed' ? 'success' : 
                            trade.status === 'Pending' ? 'warning' : 
                            'danger'
                          }
                        >
                          {trade.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1 hover:text-[#00d4ff]">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 hover:text-[#ff0055]">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {expandedRow === trade.id && (
                      <tr className="bg-[#0f0f0f] border-b border-[#2a2a2a]">
                        <td colSpan={10} className="py-4 px-4">
                          <div className="space-y-3">
                            <h4 className="text-sm text-[#00d4ff] uppercase tracking-wider">Trade Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm text-[#808080]">Trade ID:</span>{' '}
                                <span className="text-sm monospace">{trade.id}</span>
                              </div>
                              <div>
                                <span className="text-sm text-[#808080]">Fee Paid:</span>{' '}
                                <span className="text-sm monospace">$0.{Math.floor(Math.random() * 100)}</span>
                              </div>
                              <div>
                                <span className="text-sm text-[#808080]">Slippage:</span>{' '}
                                <span className="text-sm monospace">0.{Math.floor(Math.random() * 10)}%</span>
                              </div>
                              <div>
                                <span className="text-sm text-[#808080]">Execution Time:</span>{' '}
                                <span className="text-sm monospace">{Math.floor(Math.random() * 50)}ms</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-sm text-[#808080]">Notes:</span>{' '}
                              <span className="text-sm italic">Signal triggered by {trade.strategy} at confidence level 78%</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredTrades.length > 25 && (
            <div className="text-center text-sm text-[#808080] pt-4 border-t border-[#2a2a2a]">
              Showing 25 of {filteredTrades.length} trades
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
