import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingDown } from "lucide-react";
import { Trade, getDrawdownSeries, getMaxDrawdown } from "@/lib/trades";

function DDTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const dd = payload[0].value;
  return (
    <div className="surface-elevated px-4 py-2.5 text-xs">
      <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      <p className="font-semibold tabular-nums" style={{ color: 'hsl(var(--loss))' }}>
        Drawdown: ${Number(dd).toFixed(2)}
      </p>
    </div>
  );
}

const springTransition = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

export default function DrawdownChart({ trades }: { trades: Trade[] }) {
  const data = getDrawdownSeries(trades);
  const { maxDrawdown, maxDrawdownPct } = getMaxDrawdown(trades);

  if (trades.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.18 }}
      className="surface-card p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Drawdown</h3>
          <p className="text-[10px] text-muted-foreground/70 mt-1">Distance from peak equity</p>
        </div>
        <div className="flex items-center gap-2 text-right">
          <TrendingDown size={14} className="text-loss" />
          <div>
            <p className="text-lg font-semibold tabular-nums text-loss leading-none">
              ${Math.abs(maxDrawdown).toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
              Max DD · {maxDrawdownPct.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--loss))" stopOpacity={0} />
              <stop offset="100%" stopColor="hsl(var(--loss))" stopOpacity={0.18} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="2 2" />
          <Tooltip content={<DDTooltip />} />
          <Area type="monotone" dataKey="drawdown" stroke="hsl(var(--loss))" fill="url(#ddGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
