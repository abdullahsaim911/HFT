import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { StatusDot } from '../ui/StatusDot';
import { AlertCircle, TrendingUp, TrendingDown, AlertTriangle, X, Bell, Settings } from 'lucide-react';
import { generateAlerts } from '../../utils/mockData';

export function CopilotDashboard() {
  const [isActive, setIsActive] = useState(true);
  const [alerts, setAlerts] = useState(generateAlerts());
  const [settings, setSettings] = useState({
    buyAlerts: true,
    sellAlerts: true,
    latencyWarnings: true,
    confidenceThreshold: 75,
    notificationMethod: 'In-App'
  });
  const [showSettings, setShowSettings] = useState(false);
  
  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };
  
  const getAlertIcon = (type: string) => {
    if (type === 'BUY') return <TrendingUp className="w-6 h-6" />;
    if (type === 'SELL') return <TrendingDown className="w-6 h-6" />;
    if (type === 'WARNING') return <AlertTriangle className="w-6 h-6" />;
    return <AlertCircle className="w-6 h-6" />;
  };
  
  const getAlertBorderColor = (type: string) => {
    if (type === 'BUY') return 'border-l-4 border-l-[#00ff41]';
    if (type === 'SELL') return 'border-l-4 border-l-[#ff0055]';
    if (type === 'WARNING') return 'border-l-4 border-l-yellow-500';
    return 'border-l-4 border-l-[#00d4ff]';
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Copilot – Automated Monitoring & Alerts</h1>
        <p className="text-[#808080]">Real-time signal detection and automated trade execution</p>
      </div>
      
      {/* Copilot Status */}
      <Card variant={isActive ? 'active' : 'default'}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <StatusDot status={isActive ? 'active' : 'idle'} pulse={isActive} className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl">Copilot Status</h2>
                <Badge variant={isActive ? 'success' : 'neutral'}>
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
              <p className="text-sm text-[#00d4ff] mt-1">
                Monitoring 12 strategy-coin pairs
              </p>
              <p className="text-xs text-[#808080] mt-1">
                Last Alert: 2 minutes ago – ETH_Momentum BUY signal
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm uppercase tracking-wider text-[#808080]">Enable Copilot</span>
              <div 
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  isActive ? 'bg-[#00ff41]' : 'bg-gray-600'
                }`}
                onClick={() => setIsActive(!isActive)}
              >
                <div 
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    isActive ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </div>
            </label>
          </div>
        </div>
      </Card>
      
      {/* Active Alerts Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Active Alerts</h2>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-4 h-4 mr-2" />
            Alert Settings
          </Button>
        </div>
        
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {alerts.map((alert, idx) => (
            <Card 
              key={alert.id} 
              className={`slide-in ${getAlertBorderColor(alert.type)}`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={`
                  ${alert.type === 'BUY' ? 'text-[#00ff41]' : ''}
                  ${alert.type === 'SELL' ? 'text-[#ff0055]' : ''}
                  ${alert.type === 'WARNING' ? 'text-yellow-500' : ''}
                  ${alert.type === 'INFO' ? 'text-[#00d4ff]' : ''}
                `}>
                  {getAlertIcon(alert.type)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg text-[#00d4ff]">{alert.title}</h3>
                      <p className="text-sm text-white mt-1">{alert.details}</p>
                      <p className="text-xs text-[#808080] mt-2">{alert.timestamp}</p>
                    </div>
                    
                    <button 
                      className="text-[#808080] hover:text-[#ff0055] transition-colors"
                      onClick={() => handleDismiss(alert.id)}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {(alert.type === 'BUY' || alert.type === 'SELL') && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant={alert.type === 'BUY' ? 'success' : 'danger'} 
                        size="sm"
                      >
                        Execute Trade
                      </Button>
                      <Button variant="outline" size="sm">
                        Snooze 1h
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Alert Configuration */}
      {showSettings && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl">Alert Settings</h2>
              <button onClick={() => setShowSettings(false)}>
                <X className="w-5 h-5 text-[#808080] hover:text-white" />
              </button>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.buyAlerts}
                  onChange={(e) => setSettings({...settings, buyAlerts: e.target.checked})}
                  className="w-5 h-5 rounded border-2 border-[#00d4ff] bg-[#0f0f0f] checked:bg-[#00ff41]"
                />
                <span>Enable Buy Alerts</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.sellAlerts}
                  onChange={(e) => setSettings({...settings, sellAlerts: e.target.checked})}
                  className="w-5 h-5 rounded border-2 border-[#00d4ff] bg-[#0f0f0f] checked:bg-[#00ff41]"
                />
                <span>Enable Sell Alerts</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.latencyWarnings}
                  onChange={(e) => setSettings({...settings, latencyWarnings: e.target.checked})}
                  className="w-5 h-5 rounded border-2 border-[#00d4ff] bg-[#0f0f0f] checked:bg-yellow-500"
                />
                <span>Enable Latency Warnings</span>
              </label>
              
              <div>
                <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">
                  Confidence Threshold: {settings.confidenceThreshold}%
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={settings.confidenceThreshold}
                  onChange={(e) => setSettings({...settings, confidenceThreshold: parseInt(e.target.value)})}
                  className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00d4ff]"
                />
              </div>
              
              <div>
                <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">
                  Notification Method
                </label>
                <select 
                  value={settings.notificationMethod}
                  onChange={(e) => setSettings({...settings, notificationMethod: e.target.value})}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none"
                >
                  <option>Email</option>
                  <option>Slack</option>
                  <option>Push</option>
                  <option>In-App</option>
                </select>
              </div>
              
              <Button variant="primary" className="w-full">
                Save Alert Settings
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Copilot Activity Log */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl">Activity Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
              <div className="text-sm text-[#808080] uppercase tracking-wider mb-1">Uptime</div>
              <div className="text-2xl text-[#00ff41] monospace">99.8%</div>
            </div>
            
            <div className="p-4 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
              <div className="text-sm text-[#808080] uppercase tracking-wider mb-1">Avg Response</div>
              <div className="text-2xl text-[#00d4ff] monospace">1.2ms</div>
            </div>
            
            <div className="p-4 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
              <div className="text-sm text-[#808080] uppercase tracking-wider mb-1">Total Alerts</div>
              <div className="text-2xl monospace">347</div>
            </div>
            
            <div className="p-4 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
              <div className="text-sm text-[#808080] uppercase tracking-wider mb-1">Executed Trades</div>
              <div className="text-2xl monospace">23</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
