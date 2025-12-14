import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  TrendingUp, 
  Zap, 
  History, 
  Settings, 
  Bell, 
  User,
  Menu,
  X
} from 'lucide-react';
import { StatusDot } from './components/ui/StatusDot';
import { useWsConnection } from './hooks/useWebSocketManager';
import { Badge } from './components/ui/Badge';
import { LiveTradingDashboard } from './components/dashboard/LiveTradingDashboard';
import { StrategyManagement } from './components/dashboard/StrategyManagement';
import { OptimizationDashboard } from './components/dashboard/OptimizationDashboard';
import { TrendAnalysisDashboard } from './components/dashboard/TrendAnalysisDashboard';
import { CopilotDashboard } from './components/dashboard/CopilotDashboard';
import { TradeHistoryDashboard } from './components/dashboard/TradeHistoryDashboard';

type View = 'dashboard' | 'strategy' | 'optimization' | 'trends' | 'copilot' | 'history';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications] = useState(3);
  const { connected } = useWsConnection();
  
  const menuItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'strategy' as View, label: 'Strategies', icon: Settings },
    { id: 'optimization' as View, label: 'Optimization', icon: TrendingUp },
    { id: 'trends' as View, label: 'Trend Analysis', icon: Activity },
    { id: 'copilot' as View, label: 'Copilot', icon: Zap },
    { id: 'history' as View, label: 'Trade History', icon: History },
  ];
  
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <LiveTradingDashboard />;
      case 'strategy':
        return <StrategyManagement />;
      case 'optimization':
        return <OptimizationDashboard />;
      case 'trends':
        return <TrendAnalysisDashboard />;
      case 'copilot':
        return <CopilotDashboard />;
      case 'history':
        return <TradeHistoryDashboard />;
      default:
        return <LiveTradingDashboard />;
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e0e0e0]">
      {/* Top Navigation Bar */}
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a] sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 lg:px-6 py-4">
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-[#00d4ff] hover:text-[#00b8e6]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00d4ff] to-[#0080ff] rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#00d4ff]">Velocitas</h1>
                <p className="text-xs text-[#808080] hidden sm:block">HFT Engine</p>
              </div>
            </div>
          </div>
          
          {/* Center: Mode Badge */}
          <div className="hidden md:flex items-center gap-2">
            <Badge variant="info">LIVE</Badge>
            <StatusDot status="active" pulse />
          </div>
          
          {/* Right: User Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <StatusDot status={connected ? 'active' : 'error'} pulse={connected} />
              <span className="text-sm text-[#808080]">{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            
            <button className="relative p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff0055] text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            
            <button className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            
            <button className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#2a2a2a] bg-[#1a1a1a]">
            <nav className="px-4 py-2 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      currentView === item.id
                        ? 'bg-[#00d4ff] text-white shadow-[0_0_20px_rgba(0,212,255,0.3)]'
                        : 'text-[#808080] hover:bg-[#2a2a2a] hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </header>
      
      <div className="flex">
        {/* Left Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-[#1a1a1a] border-r border-[#2a2a2a] min-h-[calc(100vh-73px)] sticky top-[73px]">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    currentView === item.id
                      ? 'bg-[#00d4ff] text-white shadow-[0_0_20px_rgba(0,212,255,0.3)]'
                      : 'text-[#808080] hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
          {renderView()}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#2a2a2a] z-40">
        <nav className="flex justify-around py-2">
          {menuItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  currentView === item.id
                    ? 'text-[#00d4ff]'
                    : 'text-[#808080]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
