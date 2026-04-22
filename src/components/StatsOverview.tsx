import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, Target, BarChart3, Percent } from "lucide-react";
import { TradeStats } from "@/lib/trades";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  type?: 'profit' | 'loss' | 'neutral';
  delay?: number;
}

function StatCard({ label, value, icon, type = 'neutral', delay = 0 }: StatCardProps) {
  const valueColor = type === 'profit' ? 'text-profit' : type === 'loss' ? 'text-loss' : 'text-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="surface-card p-3 md:p-5 hover:shadow-md transition-shadow duration-500"
    >
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <span className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
        <span className="text-muted-foreground/40 hidden md:inline-flex">{icon}</span>
      </div>
      <p className={`text-[18px] md:text-[28px] font-semibold tracking-tight leading-none tabular-nums ${valueColor}`}>{value}</p>
    </motion.div>
  );
}

export default function StatsOverview({ stats }: { stats: TradeStats }) {
  const pnlType = stats.totalPnL >= 0 ? 'profit' : 'loss';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard label="Total P&L" value={`$${stats.totalPnL.toFixed(2)}`} icon={<TrendingUp size={16} />} type={pnlType} delay={0} />
      <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon={<Percent size={16} />} type={stats.winRate >= 50 ? 'profit' : 'loss'} delay={0.04} />
      <StatCard label="Total Trades" value={stats.totalTrades} icon={<Activity size={16} />} delay={0.08} />
      <StatCard label="Profit Factor" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} icon={<BarChart3 size={16} />} type={stats.profitFactor >= 1 ? 'profit' : 'loss'} delay={0.12} />
      <StatCard label="Avg Win" value={`$${stats.avgWin.toFixed(2)}`} icon={<TrendingUp size={16} />} type="profit" delay={0.16} />
      <StatCard label="Avg Loss" value={`$${stats.avgLoss.toFixed(2)}`} icon={<TrendingDown size={16} />} type="loss" delay={0.2} />
    </div>
  );
}
