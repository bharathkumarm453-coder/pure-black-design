export interface Trade {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  quantity: number;
  entryDate: string;
  exitDate: string;
  fees: number;
  notes: string;
  tags: string[];
  setup: string;
  images: string[]; // base64 data URLs
}

export function getRiskReward(trade: Trade): number | null {
  if (!trade.stopLoss || trade.stopLoss === 0) return null;
  const risk = Math.abs(trade.entryPrice - trade.stopLoss);
  if (risk === 0) return null;
  const reward = trade.direction === 'LONG'
    ? trade.exitPrice - trade.entryPrice
    : trade.entryPrice - trade.exitPrice;
  return reward / risk;
}

export interface TradeStats {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  avgRRR: number;
  winStreak: number;
  loseStreak: number;
}

const STORAGE_KEY = 'trading-journal-trades';

export function getTrades(): Trade[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTrades(trades: Trade[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}

export function addTrade(trade: Omit<Trade, 'id'>): Trade {
  const trades = getTrades();
  const newTrade = { ...trade, id: crypto.randomUUID() };
  trades.push(newTrade);
  saveTrades(trades);
  return newTrade;
}

export function updateTrade(id: string, updates: Partial<Trade>) {
  const trades = getTrades();
  const idx = trades.findIndex(t => t.id === id);
  if (idx !== -1) {
    trades[idx] = { ...trades[idx], ...updates };
    saveTrades(trades);
  }
}

export function deleteTrade(id: string) {
  const trades = getTrades().filter(t => t.id !== id);
  saveTrades(trades);
}

export function getPnL(trade: Trade): number {
  const raw = trade.direction === 'LONG'
    ? (trade.exitPrice - trade.entryPrice) * trade.quantity
    : (trade.entryPrice - trade.exitPrice) * trade.quantity;
  return raw - trade.fees;
}

export function calculateStats(trades: Trade[]): TradeStats {
  if (trades.length === 0) {
    return { totalTrades: 0, winRate: 0, totalPnL: 0, avgWin: 0, avgLoss: 0, profitFactor: 0, largestWin: 0, largestLoss: 0, avgRRR: 0, winStreak: 0, loseStreak: 0 };
  }

  const pnls = trades.map(getPnL);
  const wins = pnls.filter(p => p > 0);
  const losses = pnls.filter(p => p < 0);
  const totalPnL = pnls.reduce((a, b) => a + b, 0);

  let winStreak = 0, loseStreak = 0, curWin = 0, curLose = 0;
  pnls.forEach(p => {
    if (p > 0) { curWin++; curLose = 0; winStreak = Math.max(winStreak, curWin); }
    else { curLose++; curWin = 0; loseStreak = Math.max(loseStreak, curLose); }
  });

  const totalWins = wins.reduce((a, b) => a + b, 0);
  const totalLosses = Math.abs(losses.reduce((a, b) => a + b, 0));

  return {
    totalTrades: trades.length,
    winRate: (wins.length / trades.length) * 100,
    totalPnL,
    avgWin: wins.length ? totalWins / wins.length : 0,
    avgLoss: losses.length ? totalLosses / losses.length : 0,
    profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
    largestWin: wins.length ? Math.max(...wins) : 0,
    largestLoss: losses.length ? Math.min(...losses) : 0,
    avgRRR: losses.length && wins.length ? (totalWins / wins.length) / (totalLosses / losses.length) : 0,
    winStreak,
    loseStreak,
  };
}

export function exportTradesToCSV(trades: Trade[]): string {
  const headers = ['Symbol', 'Direction', 'Entry Price', 'Exit Price', 'Quantity', 'Entry Date', 'Exit Date', 'Fees', 'Setup', 'Tags', 'Notes', 'P&L', 'Stop Loss'];
  const rows = trades.map(t => [
    t.symbol, t.direction, t.entryPrice, t.exitPrice, t.quantity, t.entryDate, t.exitDate, t.fees, t.setup, t.tags.join(';'), `"${t.notes.replace(/"/g, '""')}"`, getPnL(t).toFixed(2), t.stopLoss || 0
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function importTradesFromCSV(csv: string): Trade[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  return lines.slice(1).map(line => {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { parts.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    parts.push(current.trim());

    return {
      id: crypto.randomUUID(),
      symbol: parts[0] || '',
      direction: (parts[1] || 'LONG') as 'LONG' | 'SHORT',
      entryPrice: parseFloat(parts[2]) || 0,
      exitPrice: parseFloat(parts[3]) || 0,
      stopLoss: parseFloat(parts[12]) || 0,
      quantity: parseFloat(parts[4]) || 0,
      entryDate: parts[5] || new Date().toISOString().split('T')[0],
      exitDate: parts[6] || new Date().toISOString().split('T')[0],
      fees: parseFloat(parts[7]) || 0,
      setup: parts[8] || '',
      tags: (parts[9] || '').split(';').filter(Boolean),
      notes: parts[10] || '',
      images: [],
    };
  });
}

export function getCumulativePnL(trades: Trade[]): { date: string; pnl: number; cumulative: number }[] {
  const sorted = [...trades].sort((a, b) => a.exitDate.localeCompare(b.exitDate));
  let cumulative = 0;
  return sorted.map(t => {
    const pnl = getPnL(t);
    cumulative += pnl;
    return { date: t.exitDate, pnl, cumulative };
  });
}

export function getDrawdownSeries(trades: Trade[]): { date: string; cumulative: number; peak: number; drawdown: number }[] {
  const series = getCumulativePnL(trades);
  let peak = 0;
  return series.map(point => {
    peak = Math.max(peak, point.cumulative);
    const drawdown = point.cumulative - peak; // <= 0
    return { date: point.date, cumulative: point.cumulative, peak, drawdown };
  });
}

export function getMaxDrawdown(trades: Trade[]): { maxDrawdown: number; maxDrawdownPct: number } {
  const series = getDrawdownSeries(trades);
  if (series.length === 0) return { maxDrawdown: 0, maxDrawdownPct: 0 };
  let maxDD = 0;
  let maxDDPct = 0;
  for (const s of series) {
    if (s.drawdown < maxDD) {
      maxDD = s.drawdown;
      maxDDPct = s.peak > 0 ? (s.drawdown / s.peak) * 100 : 0;
    }
  }
  return { maxDrawdown: maxDD, maxDrawdownPct: maxDDPct };
}
