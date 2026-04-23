import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Percent,
  GripVertical,
  Eye,
  EyeOff,
  Settings2,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TradeStats } from "@/lib/trades";

type StatType = "profit" | "loss" | "neutral";

interface StatDef {
  id: string;
  label: string;
  value: string | number;
  icon: React.ReactNode;
  type: StatType;
}

interface StatPref {
  id: string;
  visible: boolean;
}

const PREF_KEY = "ada_stats_prefs_v1";

const DEFAULT_ORDER = [
  "totalPnL",
  "winRate",
  "totalTrades",
  "profitFactor",
  "avgWin",
  "avgLoss",
];

function loadPrefs(): StatPref[] {
  if (typeof window === "undefined") return DEFAULT_ORDER.map((id) => ({ id, visible: true }));
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return DEFAULT_ORDER.map((id) => ({ id, visible: true }));
    const parsed = JSON.parse(raw) as StatPref[];
    // Reconcile: ensure all known ids exist, drop unknowns
    const known = new Set(DEFAULT_ORDER);
    const filtered = parsed.filter((p) => known.has(p.id));
    const missing = DEFAULT_ORDER.filter((id) => !filtered.find((p) => p.id === id));
    return [...filtered, ...missing.map((id) => ({ id, visible: true }))];
  } catch {
    return DEFAULT_ORDER.map((id) => ({ id, visible: true }));
  }
}

function savePrefs(prefs: StatPref[]) {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
}

interface SortableCardProps {
  stat: StatDef;
  editing: boolean;
  visible: boolean;
  onToggle: (id: string) => void;
  delay: number;
}

function SortableCard({ stat, editing, visible, onToggle, delay }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stat.id,
    disabled: !editing,
  });

  const valueColor =
    stat.type === "profit" ? "text-profit" : stat.type === "loss" ? "text-loss" : "text-foreground";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
  } as React.CSSProperties;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: editing && !visible ? 0.45 : 1,
        y: 0,
        scale: isDragging ? 1.03 : 1,
      }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`relative surface-card p-3 md:p-5 transition-shadow duration-300 ${
        isDragging ? "shadow-2xl ring-1 ring-foreground/20" : "hover:shadow-md"
      } ${editing ? "cursor-grab active:cursor-grabbing" : ""}`}
      {...attributes}
      {...(editing ? listeners : {})}
    >
      {editing && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(stat.id);
            }}
            className="w-6 h-6 rounded-md flex items-center justify-center bg-background/80 backdrop-blur border border-border hover:bg-muted transition-colors"
            aria-label={visible ? "Hide card" : "Show card"}
          >
            {visible ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/60">
            <GripVertical size={14} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2 md:mb-4">
        <span className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {stat.label}
        </span>
        {!editing && <span className="text-muted-foreground/40 hidden md:inline-flex">{stat.icon}</span>}
      </div>
      <p
        className={`text-[18px] md:text-[28px] font-semibold tracking-tight leading-none tabular-nums ${valueColor}`}
      >
        {stat.value}
      </p>

      {editing && !visible && (
        <div className="absolute inset-0 rounded-[inherit] bg-background/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground bg-background/90 px-2 py-1 rounded-md border border-border">
            Hidden
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function StatsOverview({ stats }: { stats: TradeStats }) {
  const [prefs, setPrefs] = useState<StatPref[]>(loadPrefs);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const allStats: Record<string, StatDef> = useMemo(() => {
    const pnlType: StatType = stats.totalPnL >= 0 ? "profit" : "loss";
    return {
      totalPnL: {
        id: "totalPnL",
        label: "Total P&L",
        value: `$${stats.totalPnL.toFixed(2)}`,
        icon: <TrendingUp size={16} />,
        type: pnlType,
      },
      winRate: {
        id: "winRate",
        label: "Win Rate",
        value: `${stats.winRate.toFixed(1)}%`,
        icon: <Percent size={16} />,
        type: stats.winRate >= 50 ? "profit" : "loss",
      },
      totalTrades: {
        id: "totalTrades",
        label: "Total Trades",
        value: stats.totalTrades,
        icon: <Activity size={16} />,
        type: "neutral",
      },
      profitFactor: {
        id: "profitFactor",
        label: "Profit Factor",
        value: stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2),
        icon: <BarChart3 size={16} />,
        type: stats.profitFactor >= 1 ? "profit" : "loss",
      },
      avgWin: {
        id: "avgWin",
        label: "Avg Win",
        value: `$${stats.avgWin.toFixed(2)}`,
        icon: <TrendingUp size={16} />,
        type: "profit",
      },
      avgLoss: {
        id: "avgLoss",
        label: "Avg Loss",
        value: `$${stats.avgLoss.toFixed(2)}`,
        icon: <TrendingDown size={16} />,
        type: "loss",
      },
    };
  }, [stats]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPrefs((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const toggle = (id: string) =>
    setPrefs((prev) => prev.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)));

  const reset = () => setPrefs(DEFAULT_ORDER.map((id) => ({ id, visible: true })));

  const visibleIds = prefs.filter((p) => p.visible).map((p) => p.id);
  const orderedIds = editing ? prefs.map((p) => p.id) : visibleIds;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Overview
        </h2>
        <div className="flex items-center gap-1">
          <AnimatePresence>
            {editing && (
              <motion.button
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                onClick={reset}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <RotateCcw size={12} /> Reset
              </motion.button>
            )}
          </AnimatePresence>
          <button
            onClick={() => setEditing((e) => !e)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
              editing
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            {editing ? <Check size={12} /> : <Settings2 size={12} />}
            {editing ? "Done" : "Customize"}
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
          <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <AnimatePresence>
              {orderedIds.map((id, idx) => {
                const stat = allStats[id];
                if (!stat) return null;
                const visible = prefs.find((p) => p.id === id)?.visible ?? true;
                return (
                  <SortableCard
                    key={id}
                    stat={stat}
                    editing={editing}
                    visible={visible}
                    onToggle={toggle}
                    delay={idx * 0.04}
                  />
                );
              })}
            </AnimatePresence>
          </motion.div>
        </SortableContext>
      </DndContext>

      {editing && visibleIds.length === 0 && (
        <p className="text-center text-[11px] text-muted-foreground py-4">
          All cards hidden. Toggle some back on to see your stats.
        </p>
      )}
    </div>
  );
}
