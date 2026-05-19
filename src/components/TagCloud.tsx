import { useMemo } from "react";
import { motion } from "framer-motion";
import { Tag } from "lucide-react";
import { Trade, getPnL } from "@/lib/trades";
import { tagColor } from "@/lib/tagColors";

interface TagStat {
  tag: string;
  count: number;
  pnl: number;
  wins: number;
}

export default function TagCloud({ trades }: { trades: Trade[] }) {
  const stats = useMemo<TagStat[]>(() => {
    const map = new Map<string, TagStat>();
    for (const t of trades) {
      const pnl = getPnL(t);
      for (const raw of t.tags || []) {
        const tag = raw.trim();
        if (!tag) continue;
        const s = map.get(tag) ?? { tag, count: 0, pnl: 0, wins: 0 };
        s.count++;
        s.pnl += pnl;
        if (pnl > 0) s.wins++;
        map.set(tag, s);
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [trades]);

  if (stats.length === 0) return null;

  const maxCount = stats[0].count;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="surface-card p-4 md:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center">
          <Tag size={12} className="text-foreground" />
        </div>
        <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Tags · {stats.length}
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {stats.map((s, i) => {
          const color = tagColor(s.tag);
          // size scales 12–18px with frequency
          const size = 12 + Math.round((s.count / maxCount) * 6);
          const winRate = Math.round((s.wins / s.count) * 100);
          return (
            <motion.span
              key={s.tag}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02, duration: 0.25 }}
              title={`${s.count} trades · ${winRate}% win · ${s.pnl >= 0 ? '+' : ''}$${s.pnl.toFixed(0)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-medium tabular-nums"
              style={{
                fontSize: `${size}px`,
                backgroundColor: color.background,
                color: color.color,
                borderColor: color.border,
              }}
            >
              <span>{s.tag}</span>
              <span className="text-[10px] opacity-70">×{s.count}</span>
            </motion.span>
          );
        })}
      </div>
    </motion.div>
  );
}
