import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from "recharts";
import { Trade, getPnL, getCumulativePnL, calculateStats } from "@/lib/trades";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-elevated px-4 py-2.5 text-xs">
      <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-mono font-semibold" style={{ color: p.color }}>
          {p.name}: ${Number(p.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
}

const springTransition = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

export default function EquityCurve({ trades }: { trades: Trade[] }) {
  const data = getCumulativePnL(trades);
  const stats = calculateStats(trades);

  const dailyPnL = [...trades]
    .sort((a, b) => a.exitDate.localeCompare(b.exitDate))
    .map(t => ({ date: t.exitDate, pnl: getPnL(t), symbol: t.symbol }));

  const setupStats = trades.reduce((acc, t) => {
    const setup = t.setup || 'Other';
    if (!acc[setup]) acc[setup] = { wins: 0, losses: 0, pnl: 0 };
    const pnl = getPnL(t);
    if (pnl >= 0) acc[setup].wins++; else acc[setup].losses++;
    acc[setup].pnl += pnl;
    return acc;
  }, {} as Record<string, { wins: number; losses: number; pnl: number }>);

  const pieData = [
    { name: 'Wins', value: Math.round(stats.winRate), fill: 'hsl(152, 60%, 40%)' },
    { name: 'Losses', value: Math.round(100 - stats.winRate), fill: 'hsl(0, 60%, 52%)' },
  ];

  if (trades.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springTransition, delay: 0.05 }} className="lg:col-span-2 surface-card p-6">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-5">Equity Curve</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0.12} />
                <stop offset="100%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(0, 0%, 46%)' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(0, 0%, 46%)' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="cumulative" name="Cumulative P&L" stroke="hsl(152, 60%, 40%)" fill="url(#equityGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springTransition, delay: 0.1 }} className="surface-card p-6 flex flex-col items-center justify-center">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-5 self-start">Win / Loss</h3>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={64} dataKey="value" strokeWidth={0}>
              {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex gap-5 text-xs mt-3">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-profit" /> Wins {stats.winRate.toFixed(0)}%</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-loss" /> Losses {(100 - stats.winRate).toFixed(0)}%</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springTransition, delay: 0.15 }} className="lg:col-span-2 surface-card p-6">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-5">Daily P&L</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyPnL}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(0, 0%, 46%)' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(0, 0%, 46%)' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} content={<CustomTooltip />} />
            <Bar dataKey="pnl" name="P&L" radius={[6, 6, 0, 0]}>
              {dailyPnL.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? 'hsl(152, 60%, 40%)' : 'hsl(0, 60%, 52%)'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springTransition, delay: 0.2 }} className="surface-card p-6">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-5">Setup Performance</h3>
        <div className="space-y-4">
          {Object.entries(setupStats).map(([setup, data]) => {
            const total = data.wins + data.losses;
            const wr = (data.wins / total) * 100;
            return (
              <div key={setup} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{setup}</span>
                  <span className={`font-mono font-semibold ${data.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>${data.pnl.toFixed(0)}</span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${wr}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full bg-profit" />
                </div>
                <p className="text-[10px] text-muted-foreground">{data.wins}W / {data.losses}L · {wr.toFixed(0)}% win rate</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
