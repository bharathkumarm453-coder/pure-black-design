import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, Calendar, Tag, Target } from "lucide-react";
import { Trade, getPnL } from "@/lib/trades";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Insight {
  icon: React.ReactNode;
  text: React.ReactNode;
  tone: 'profit' | 'loss' | 'neutral';
}

function groupBy<T>(arr: T[], key: (t: T) => string) {
  const out: Record<string, T[]> = {};
  for (const item of arr) {
    const k = key(item);
    if (!k) continue;
    (out[k] ??= []).push(item);
  }
  return out;
}

function winRate(trades: Trade[]) {
  if (!trades.length) return 0;
  return trades.filter(t => getPnL(t) > 0).length / trades.length * 100;
}

function totalPnL(trades: Trade[]) {
  return trades.reduce((s, t) => s + getPnL(t), 0);
}

function bestWorst<T>(entries: [string, T[]][], min = 3) {
  const eligible = entries.filter(([, v]) => v.length >= min);
  if (eligible.length < 2) return null;
  const ranked = [...eligible].sort((a, b) => winRate(b[1]) - winRate(a[1]));
  return { best: ranked[0], worst: ranked[ranked.length - 1] };
}

function computeInsights(trades: Trade[]): Insight[] {
  if (trades.length < 5) return [];
  const insights: Insight[] = [];

  // Day of week
  const byDay = Object.entries(groupBy(trades, t => DAYS[new Date(t.exitDate).getDay()]));
  const dayRanking = bestWorst(byDay, 3);
  if (dayRanking) {
    const bw = Math.round(winRate(dayRanking.best[1]));
    const ww = Math.round(winRate(dayRanking.worst[1]));
    if (bw - ww >= 15) {
      insights.push({
        icon: <Calendar size={14} />,
        tone: 'profit',
        text: <>You win <b className="text-profit tabular-nums">{bw}%</b> on {dayRanking.best[0]}s but only <b className="text-loss tabular-nums">{ww}%</b> on {dayRanking.worst[0]}s.</>,
      });
    }
  }

  // Setup
  const bySetup = Object.entries(groupBy(trades, t => t.setup || ''));
  const setupRanking = bestWorst(bySetup, 3);
  if (setupRanking) {
    const bestPnL = totalPnL(setupRanking.best[1]);
    insights.push({
      icon: <Target size={14} />,
      tone: bestPnL >= 0 ? 'profit' : 'loss',
      text: <><b>{setupRanking.best[0]}</b> is your top setup — <b className={bestPnL >= 0 ? 'text-profit tabular-nums' : 'text-loss tabular-nums'}>{bestPnL >= 0 ? '+' : ''}${bestPnL.toFixed(0)}</b> across {setupRanking.best[1].length} trades.</>,
    });
    const worstPnL = totalPnL(setupRanking.worst[1]);
    if (worstPnL < 0 && setupRanking.worst[0] !== setupRanking.best[0]) {
      insights.push({
        icon: <Target size={14} />,
        tone: 'loss',
        text: <><b>{setupRanking.worst[0]}</b> is losing — <b className="text-loss tabular-nums">${worstPnL.toFixed(0)}</b> across {setupRanking.worst[1].length} trades.</>,
      });
    }
  }

  // LONG vs SHORT
  const longs = trades.filter(t => t.direction === 'LONG');
  const shorts = trades.filter(t => t.direction === 'SHORT');
  if (longs.length >= 3 && shorts.length >= 3) {
    const lr = Math.round(winRate(longs));
    const sr = Math.round(winRate(shorts));
    if (Math.abs(lr - sr) >= 15) {
      const better = lr > sr ? 'long' : 'short';
      insights.push({
        icon: better === 'long' ? <TrendingUp size={14} /> : <TrendingDown size={14} />,
        tone: 'profit',
        text: <>You perform better going <b>{better}</b>: <b className="text-profit tabular-nums">{Math.max(lr, sr)}%</b> vs <b className="text-loss tabular-nums">{Math.min(lr, sr)}%</b> win rate.</>,
      });
    }
  }

  // Top symbol
  const bySymbol = Object.entries(groupBy(trades, t => t.symbol)).filter(([, v]) => v.length >= 3);
  if (bySymbol.length) {
    bySymbol.sort((a, b) => totalPnL(b[1]) - totalPnL(a[1]));
    const [sym, list] = bySymbol[0];
    const p = totalPnL(list);
    if (Math.abs(p) >= 1) {
      insights.push({
        icon: <Tag size={14} />,
        tone: p >= 0 ? 'profit' : 'loss',
        text: <><b>{sym}</b> is your most-traded symbol — <b className={p >= 0 ? 'text-profit tabular-nums' : 'text-loss tabular-nums'}>{p >= 0 ? '+' : ''}${p.toFixed(0)}</b> over {list.length} trades.</>,
      });
    }
  }

  // Streak warning
  const recent = [...trades].sort((a, b) => b.exitDate.localeCompare(a.exitDate)).slice(0, 5);
  if (recent.length === 5) {
    const losses = recent.filter(t => getPnL(t) < 0).length;
    if (losses >= 4) {
      insights.push({
        icon: <TrendingDown size={14} />,
        tone: 'loss',
        text: <><b className="text-loss">{losses} of your last 5 trades</b> were losses. Consider reviewing setup quality.</>,
      });
    }
  }

  return insights.slice(0, 4);
}

export default function PatternsCard({ trades }: { trades: Trade[] }) {
  const insights = useMemo(() => computeInsights(trades), [trades]);

  if (insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="surface-card p-4 md:p-6"
    >
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center">
          <Sparkles size={13} className="text-foreground" />
        </div>
        <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Detected Patterns</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {insights.map((ins, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 + i * 0.06, duration: 0.3 }}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/50"
          >
            <span className={`mt-0.5 shrink-0 ${ins.tone === 'profit' ? 'text-profit' : ins.tone === 'loss' ? 'text-loss' : 'text-muted-foreground'}`}>
              {ins.icon}
            </span>
            <p className="text-[13px] leading-snug text-foreground">{ins.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
