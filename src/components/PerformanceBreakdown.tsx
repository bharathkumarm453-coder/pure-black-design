import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trade, getPnL } from "@/lib/trades";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

type View = 'symbol' | 'setup' | 'dayOfWeek';

interface GroupedData {
  name: string;
  totalPnL: number;
  trades: number;
  wins: number;
  winRate: number;
  avgPnL: number;
  avgWin: number;
  avgLoss: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function groupTrades(trades: Trade[], view: View): GroupedData[] {
  const groups: Record<string, Trade[]> = {};

  trades.forEach(t => {
    let key: string;
    if (view === 'symbol') key = t.symbol;
    else if (view === 'setup') key = t.setup || 'No Setup';
    else key = DAYS[new Date(t.exitDate).getDay()];

    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  return Object.entries(groups).map(([name, group]) => {
    const pnls = group.map(getPnL);
    const wins = pnls.filter(p => p > 0);
    const losses = pnls.filter(p => p < 0);
    const totalPnL = pnls.reduce((a, b) => a + b, 0);

    return {
      name,
      totalPnL,
      trades: group.length,
      wins: wins.length,
      winRate: (wins.length / group.length) * 100,
      avgPnL: totalPnL / group.length,
      avgWin: wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 0,
      avgLoss: losses.length ? Math.abs(losses.reduce((a, b) => a + b, 0)) / losses.length : 0,
    };
  }).sort((a, b) => b.totalPnL - a.totalPnL);
}

const viewLabels: Record<View, string> = {
  symbol: 'By Symbol',
  setup: 'By Setup',
  dayOfWeek: 'By Day of Week',
};

export default function PerformanceBreakdown({ trades }: { trades: Trade[] }) {
  const [view, setView] = useState<View>('symbol');
  const data = useMemo(() => groupTrades(trades, view), [trades, view]);

  if (trades.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="surface-card p-16 text-center">
        <p className="text-muted-foreground font-medium">No trades to analyze</p>
        <p className="text-muted-foreground/60 text-sm mt-1">Add trades to see performance breakdowns</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Performance Breakdown
        </h2>
        <div className="flex items-center gap-0.5 bg-muted/60 rounded-xl p-1">
          {(Object.keys(viewLabels) as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-300 ${
                view === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {viewLabels[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="surface-card p-6"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-4">Total P&L</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${v}`}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 8px 32px -8px rgba(0,0,0,0.12)',
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
            />
            <Bar dataKey="totalPnL" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.totalPnL >= 0 ? 'hsl(var(--profit))' : 'hsl(var(--loss))'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Table */}
      <motion.div
        key={`table-${view}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="surface-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Name', 'Trades', 'Wins', 'Win %', 'Total P&L', 'Avg P&L', 'Avg Win', 'Avg Loss'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <motion.tr
                  key={row.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/40 hover:bg-muted/40 transition-colors duration-300"
                >
                  <td className="px-5 py-4 font-semibold tracking-tight">{row.name}</td>
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{row.trades}</td>
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{row.wins}</td>
                  <td className="px-5 py-4">
                    <span className={`font-mono text-xs font-semibold ${row.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>
                      {row.winRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className={`px-5 py-4 font-mono text-sm font-semibold ${row.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {row.totalPnL >= 0 ? '+' : ''}{row.totalPnL.toFixed(2)}
                  </td>
                  <td className={`px-5 py-4 font-mono text-xs ${row.avgPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {row.avgPnL >= 0 ? '+' : ''}{row.avgPnL.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-profit">{row.avgWin.toFixed(2)}</td>
                  <td className="px-5 py-4 font-mono text-xs text-loss">{row.avgLoss.toFixed(2)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
