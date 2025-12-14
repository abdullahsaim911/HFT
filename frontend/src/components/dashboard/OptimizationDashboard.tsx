import React, { useState, useRef } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Upload, TrendingUp, Download, RefreshCw, Lock, FileText } from 'lucide-react'; 
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { generateBacktestResults } from '../../utils/mockData';

export function OptimizationDashboard() {
  const [hasResults, setHasResults] = useState(false);
  const [results, setResults] = useState(generateBacktestResults());
  const [isRunning, setIsRunning] = useState(false);
  
  // Track if file is uploaded
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Reference for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [fromDate, setFromDate] = useState("2024-01-01");
  const [toDate, setToDate] = useState("2024-12-14");
  const [capital, setCapital] = useState(10000);
  const [selectedStrategy, setSelectedStrategy] = useState("All Strategies");

  // --- 1. CORE UPLOAD FUNCTION ---
  const uploadRealFile = async (file: File) => {
    try {
      setUploadStatus("Uploading...");
      setFileName(file.name);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadStatus("Success! Data loaded.");
        setIsFileUploaded(true);
        console.log(`Backend says: ${data.message}`); 
      } else {
        setUploadStatus("Upload failed.");
        setIsFileUploaded(false);
        setFileName(null);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("Error connecting to server.");
      setIsFileUploaded(false);
      setFileName(null);
    }
  };

  // --- 2. EVENT HANDLERS ---
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      uploadRealFile(event.target.files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault(); 
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const droppedFile = event.dataTransfer.files[0];
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith('.csv')) {
        uploadRealFile(droppedFile);
      } else {
        alert("⚠️ Please drop a valid CSV file.");
      }
    }
  };

  const handleLoadSampleData = () => {
     const blob = new Blob(["timestamp,open,high,low,close,volume\n1,100,105,95,102,1000"], { type: 'text/csv' });
     const file = new File([blob], "sample_data.csv", { type: "text/csv" });
     uploadRealFile(file);
  };

  // --- 3. BACKTEST LOGIC ---
  const handleRunBacktest = async () => {
    if (!isFileUploaded) {
        alert("⚠️ Please upload a CSV file first!");
        return;
    }
    if (!fromDate || !toDate) {
        alert("⚠️ Please select both a Start Date and End Date.");
        return;
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        alert("⚠️ Invalid Date Selection.");
        return;
    }

    if (start > end) {
      alert("❌ Error: 'From Date' must be before 'To Date'");
      return;
    }

    setIsRunning(true);
    setHasResults(false);

    try {
      const response = await fetch('http://localhost:8000/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: selectedStrategy,
          from_date: fromDate,
          to_date: toDate,
          capital: Number(capital)
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.results && Array.isArray(data.results)) {
           setResults(data.results);
        } else {
           setResults(generateBacktestResults()); 
        }
        setHasResults(true);
      } else {
         try {
            const err = await response.json();
            alert(`Server Error: ${err.detail}`);
        } catch {
            alert("Backtest failed to start on server.");
        }
      }
    } catch (error) {
      console.error("Backtest error:", error);
      alert("Error connecting to backend.");
    } finally {
      setIsRunning(false);
    }
  };
  
  // --- 4. CALCULATE BEST STRATEGY ---
  const bestStrategy = results.length > 0 ? results.reduce((prev, current) => 
    (prev.sharpe > current.sharpe) ? prev : current
  ) : { strategy: "N/A", coin: "N/A", sharpe: 0, return: 0 };
  
  const avgWinRate = results.length > 0 ? (results.reduce((sum, r) => sum + r.winRate, 0) / results.length).toFixed(1) : 0;
  
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
      
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl">CSV Upload & Configuration</h2>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer 
                ${isFileUploaded ? 'border-[#00ff41] bg-[#00ff41]/5' : 'border-[#00d4ff] hover:border-[#00b8e6] hover:bg-[#00d4ff]/5'}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
          >
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv"
                onChange={handleFileChange}
            />

            {isFileUploaded ? (
                <>
                    <FileText className="w-12 h-12 text-[#00ff41] mx-auto mb-4" />
                    <p className="text-lg mb-2 text-white">{fileName}</p>
                    <p className="text-sm text-[#00ff41] font-mono">Upload Complete. Ready to Backtest.</p>
                </>
            ) : (
                <>
                    <Upload className="w-12 h-12 text-[#00d4ff] mx-auto mb-4" />
                    <p className="text-lg mb-2">Drag CSV here or click to browse</p>
                    <p className="text-sm text-[#808080]">Supported formats: CSV (OHLCV data)</p>
                    {uploadStatus && <p className="text-red-500 mt-2 font-mono">{uploadStatus}</p>}
                </>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">From Date</label>
              <input 
                type="date" 
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">To Date</label>
              <input 
                type="date" 
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">Initial Capital</label>
              <input 
                type="number" 
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm text-[#808080] mb-2 uppercase tracking-wider">Strategy</label>
              <select 
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-[#00d4ff] focus:outline-none"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
              >
                <option>All Strategies</option>
                <option>SMA_Crossover</option>
                <option>Momentum</option>
                <option>RSI</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
                variant={isFileUploaded ? "success" : "secondary"} 
                size="lg" 
                onClick={handleRunBacktest} 
                isLoading={isRunning}
                className={!isFileUploaded ? "opacity-50 cursor-not-allowed" : ""}
            >
              {!isFileUploaded && <Lock className="w-4 h-4 mr-2" />}
              Run Backtest
            </Button>
            <Button variant="outline" size="lg" onClick={handleLoadSampleData}>Load Sample Data</Button>
          </div>
        </div>
      </Card>
      
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
            
            {/* ✅ FIXED: Dynamic Recommendation Card */}
            <Card hover>
              <div className="space-y-2">
                <div className="text-sm text-[#808080] uppercase tracking-wider">Recommended</div>
                {/* Dynamically display the winning strategy */}
                <div className="text-lg text-[#00d4ff]">
                  {bestStrategy.strategy === "N/A" ? "No Data" : bestStrategy.strategy}
                </div>
                <div className="text-xs text-[#808080] mb-2">
                  Target: {bestStrategy.coin}
                </div>
                {/* Dynamically label the button */}
                <Button variant="success" size="sm" className="mt-2" disabled={bestStrategy.strategy === "N/A"}>
                   {bestStrategy.strategy === "N/A" ? "Wait..." : `Deploy ${bestStrategy.strategy.split('_')[0]}`}
                </Button>
              </div>
            </Card>
          </div>
          
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
                      <tr key={idx} className="border-b border-[#2a2a2a] hover:bg-[#1a1a1a] transition-all cursor-pointer">
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
          
          <Card>
            <h3 className="text-lg mb-4">Strategy Performance (Sharpe Ratio)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#808080" style={{ fontSize: '12px' }} />
                <YAxis stroke="#808080" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #00d4ff' }} />
                <Bar dataKey="sharpe" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.return > 0 ? '#00ff41' : '#ff0055'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          
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