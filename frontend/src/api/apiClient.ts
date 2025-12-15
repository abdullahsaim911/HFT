export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
export const API_ROOT = `${API_BASE}/api`;

export async function fetchInitialMetrics() {
  try {
    const res = await fetch(`${API_ROOT}/metrics`);
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return await res.json();
  } catch (err) {
    console.error('fetchInitialMetrics error', err);
    return null;
  }
}

export async function fetchInitialTrades() {
  try {
    const res = await fetch(`${API_ROOT}/trades`);
    if (!res.ok) throw new Error('Failed to fetch trades');
    return await res.json();
  } catch (err) {
    console.error('fetchInitialTrades error', err);
    return null;
  }
}

export async function fetchStrategies() {
  try {
    const res = await fetch(`${API_BASE}/api/strategies`);
    if (!res.ok) throw new Error('Failed to fetch strategies');
    return await res.json();
  } catch (err) {
    console.error('fetchStrategies error', err);
    return null;
  }
}

export async function registerStrategy(strategyName: string, coin: string, params: any = {}) {
  try {
    const res = await fetch(`${API_BASE}/api/strategies/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy_name: strategyName, coin, params })
    });
    return await res.json();
  } catch (err) {
    console.error('registerStrategy error', err);
    return null;
  }
}

export async function unregisterStrategy(strategyId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/strategies/unregister`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy_id: strategyId })
    });
    return await res.json();
  } catch (err) {
    console.error('unregisterStrategy error', err);
    return null;
  }
}

export async function startEngine(opts: { data_source?: string; coins?: string; interval?: number } = {}) {
  try {
    const body = JSON.stringify({ data_source: opts.data_source || 'synthetic', coins: opts.coins || 'BTC,ETH,BNB', interval: opts.interval || 1 });
    const res = await fetch(`${API_BASE}/api/engine/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    return await res.json();
  } catch (err) {
    console.error('startEngine error', err);
    return null;
  }
}

export async function stopEngine() {
  try {
    const res = await fetch(`${API_BASE}/api/engine/stop`, { method: 'POST' });
    return await res.json();
  } catch (err) {
    console.error('stopEngine error', err);
    return null;
  }
}

export async function uploadCsvForOptimization(file: File) {
  try {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/api/optimization/upload-csv`, { method: 'POST', body: fd });
    return await res.json();
  } catch (err) {
    console.error('uploadCsvForOptimization error', err);
    return null;
  }
}

export async function runBacktest(csvPath: string, strategyConfigs: any[], coins?: string[]) {
  try {
    const res = await fetch(`${API_BASE}/api/optimization/backtest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv_path: csvPath, strategy_configs: strategyConfigs, coins })
    });
    return await res.json();
  } catch (err) {
    console.error('runBacktest error', err);
    return null;
  }
}

export async function uploadCsvForTrend(file: File) {
  try {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/api/trend-analysis/upload-csv`, { method: 'POST', body: fd });
    return await res.json();
  } catch (err) {
    console.error('uploadCsvForTrend error', err);
    return null;
  }
}

export async function analyzeTrends(csvPath: string) {
  try {
    const res = await fetch(`${API_BASE}/api/trend-analysis/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv_path: csvPath })
    });
    return await res.json();
  } catch (err) {
    console.error('analyzeTrends error', err);
    return null;
  }
}

export async function getCopilotActiveAlerts() {
  try {
    const res = await fetch(`${API_BASE}/api/copilot/active-alerts`);
    return await res.json();
  } catch (err) {
    console.error('getCopilotActiveAlerts error', err);
    return null;
  }
}

export async function getStrategyMetrics(strategyId: string) {
  try {
    const res = await fetch(`${API_ROOT}/metrics/${strategyId}`);
    if (!res.ok) throw new Error('Failed to fetch strategy metrics');
    return await res.json();
  } catch (err) {
    console.error('getStrategyMetrics error', err);
    return null;
  }
}

export async function fetchTrades(strategyId?: string, limit: number = 100) {
  try {
    const url = new URL(`${API_ROOT}/trades`);
    if (strategyId) url.searchParams.set('strategy_id', strategyId);
    url.searchParams.set('limit', String(limit));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch trades');
    return await res.json();
  } catch (err) {
    console.error('fetchTrades error', err);
    return null;
  }
}

export async function getOrderBook(limit: number = 100) {
  try {
    const res = await fetch(`${API_ROOT}/order-book?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch order book');
    return await res.json();
  } catch (err) {
    console.error('getOrderBook error', err);
    return null;
  }
}

export async function exportOrderBook() {
  try {
    const res = await fetch(`${API_ROOT}/order-book/export`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to export order book');
    
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'order_book.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { status: 'success' };
  } catch (err) {
    console.error('exportOrderBook error', err);
    return null;
  }
}

export async function getLatencyReport() {
  try {
    const res = await fetch(`${API_ROOT}/latency-report`);
    if (!res.ok) throw new Error('Failed to fetch latency report');
    return await res.json();
  } catch (err) {
    console.error('getLatencyReport error', err);
    return null;
  }
}

