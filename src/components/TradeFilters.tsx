import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Trade, getPnL } from "@/lib/trades";

export interface TradeFilterState {
  search: string;
  direction: 'ALL' | 'LONG' | 'SHORT';
  dateFrom: string;
  dateTo: string;
  setup: string;
  tags: string[];
  pnlMin: string;
  pnlMax: string;
  result: 'ALL' | 'WIN' | 'LOSS';
}

export const defaultFilters: TradeFilterState = {
  search: '',
  direction: 'ALL',
  dateFrom: '',
  dateTo: '',
  setup: '',
  tags: [],
  pnlMin: '',
  pnlMax: '',
  result: 'ALL',
};

export function applyFilters(trades: Trade[], filters: TradeFilterState): Trade[] {
  return trades.filter(t => {
    const pnl = getPnL(t);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!t.symbol.toLowerCase().includes(q) && !t.setup.toLowerCase().includes(q) && !t.notes.toLowerCase().includes(q) && !t.tags.some(tag => tag.toLowerCase().includes(q))) return false;
    }
    if (filters.direction !== 'ALL' && t.direction !== filters.direction) return false;
    if (filters.dateFrom && t.exitDate < filters.dateFrom) return false;
    if (filters.dateTo && t.exitDate > filters.dateTo) return false;
    if (filters.setup && t.setup.toLowerCase() !== filters.setup.toLowerCase()) return false;
    if (filters.tags.length > 0 && !filters.tags.some(ft => t.tags.some(tt => tt.toLowerCase() === ft.toLowerCase()))) return false;
    if (filters.pnlMin && pnl < parseFloat(filters.pnlMin)) return false;
    if (filters.pnlMax && pnl > parseFloat(filters.pnlMax)) return false;
    if (filters.result === 'WIN' && pnl <= 0) return false;
    if (filters.result === 'LOSS' && pnl >= 0) return false;
    return true;
  });
}

function hasActiveFilters(filters: TradeFilterState): boolean {
  return filters.direction !== 'ALL' || filters.dateFrom !== '' || filters.dateTo !== '' || filters.setup !== '' || filters.tags.length > 0 || filters.pnlMin !== '' || filters.pnlMax !== '' || filters.result !== 'ALL';
}

interface TradeFiltersProps {
  filters: TradeFilterState;
  onChange: (filters: TradeFilterState) => void;
  trades: Trade[];
}

export default function TradeFilters({ filters, onChange, trades }: TradeFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const uniqueSetups = [...new Set(trades.map(t => t.setup).filter(Boolean))].sort();
  const uniqueTags = [...new Set(trades.flatMap(t => t.tags).filter(Boolean))].sort();
  const active = hasActiveFilters(filters);
  const activeCount = [
    filters.direction !== 'ALL',
    filters.dateFrom || filters.dateTo,
    filters.setup,
    filters.tags.length > 0,
    filters.pnlMin || filters.pnlMax,
    filters.result !== 'ALL',
  ].filter(Boolean).length;

  const update = (partial: Partial<TradeFilterState>) => onChange({ ...filters, ...partial });

  const labelClass = "text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5";
  const inputClass = "w-full px-3 py-2 rounded-lg bg-muted/60 border border-border/60 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all duration-200 placeholder:text-muted-foreground/40";

  return (
    <div className="space-y-3 sticky top-14 md:top-16 z-30 bg-background/95 backdrop-blur-xl -mx-4 md:mx-0 px-4 md:px-0 py-2 md:py-0">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            value={filters.search}
            onChange={e => update({ search: e.target.value })}
            placeholder="Search..."
            className={`${inputClass} pl-9`}
          />
          {filters.search && (
            <button onClick={() => update({ search: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shrink-0 min-h-[40px] ${
            active ? 'bg-foreground text-background' : 'bg-muted/60 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && <span className="text-[11px]">({activeCount})</span>}
          <ChevronDown size={12} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {active && (
          <button
            onClick={() => onChange(defaultFilters)}
            className="px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200 shrink-0 min-h-[40px]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {active && (
        <div className="flex flex-wrap gap-1.5">
          {filters.direction !== 'ALL' && (
            <FilterChip label={filters.direction} onRemove={() => update({ direction: 'ALL' })} />
          )}
          {filters.result !== 'ALL' && (
            <FilterChip label={filters.result} onRemove={() => update({ result: 'ALL' })} />
          )}
          {filters.setup && (
            <FilterChip label={filters.setup} onRemove={() => update({ setup: '' })} />
          )}
          {filters.tags.map(tag => (
            <FilterChip key={tag} label={`#${tag}`} onRemove={() => update({ tags: filters.tags.filter(t => t !== tag) })} />
          ))}
          {(filters.dateFrom || filters.dateTo) && (
            <FilterChip label={`${filters.dateFrom || '...'} → ${filters.dateTo || '...'}`} onRemove={() => update({ dateFrom: '', dateTo: '' })} />
          )}
          {(filters.pnlMin || filters.pnlMax) && (
            <FilterChip label={`P&L ${filters.pnlMin || '−∞'}…${filters.pnlMax || '+∞'}`} onRemove={() => update({ pnlMin: '', pnlMax: '' })} />
          )}
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="surface-card p-4 md:p-5 space-y-3 md:space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div>
                  <p className={labelClass}>Direction</p>
                  <div className="flex gap-1">
                    {(['ALL', 'LONG', 'SHORT'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => update({ direction: d })}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] md:text-[12px] font-medium transition-all duration-200 ${
                          filters.direction === d
                            ? 'bg-foreground text-background'
                            : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className={labelClass}>Result</p>
                  <div className="flex gap-1">
                    {(['ALL', 'WIN', 'LOSS'] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => update({ result: r })}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] md:text-[12px] font-medium transition-all duration-200 ${
                          filters.result === r
                            ? (r === 'WIN' ? 'bg-profit text-white' : r === 'LOSS' ? 'bg-loss text-white' : 'bg-foreground text-background')
                            : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className={labelClass}>Date From</p>
                  <input type="date" value={filters.dateFrom} onChange={e => update({ dateFrom: e.target.value })} className={inputClass} />
                </div>

                <div>
                  <p className={labelClass}>Date To</p>
                  <input type="date" value={filters.dateTo} onChange={e => update({ dateTo: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div>
                  <p className={labelClass}>Setup</p>
                  <select value={filters.setup} onChange={e => update({ setup: e.target.value })} className={inputClass}>
                    <option value="">All Setups</option>
                    {uniqueSetups.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <p className={labelClass}>Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {uniqueTags.length === 0 && <span className="text-muted-foreground/40 text-xs">No tags</span>}
                    {uniqueTags.map(tag => {
                      const isActive = filters.tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => update({ tags: isActive ? filters.tags.filter(t => t !== tag) : [...filters.tags, tag] })}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all duration-200 ${
                            isActive ? 'bg-foreground text-background' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className={labelClass}>P&L Min</p>
                  <input type="number" step="any" value={filters.pnlMin} onChange={e => update({ pnlMin: e.target.value })} placeholder="-∞" className={inputClass} />
                </div>
                <div>
                  <p className={labelClass}>P&L Max</p>
                  <input type="number" step="any" value={filters.pnlMax} onChange={e => update({ pnlMax: e.target.value })} placeholder="+∞" className={inputClass} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-[11px] font-medium text-foreground border border-border/60">
      {label}
      <button onClick={onRemove} className="text-muted-foreground hover:text-foreground transition-colors -mr-0.5" aria-label={`Remove ${label}`}>
        <X size={11} />
      </button>
    </span>
  );
}
