import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Plus, Download, Upload, BarChart3, BookOpen, Activity, CalendarDays, Sun, Moon, MoreHorizontal, Calculator } from "lucide-react";
import { Trade, getTrades, saveTrades, addTrade, deleteTrade, updateTrade, calculateStats, exportTradesToCSV, importTradesFromCSV, getRiskReward } from "@/lib/trades";
import StatsOverview from "@/components/StatsOverview";
import TradeTable from "@/components/TradeTable";
import EquityCurve from "@/components/EquityCurve";
import DrawdownChart from "@/components/DrawdownChart";
import AddTradeModal from "@/components/AddTradeModal";
import CalendarHeatMap from "@/components/CalendarHeatMap";
import PerformanceBreakdown from "@/components/PerformanceBreakdown";
import PositionSizer from "@/components/PositionSizer";
import TradeFilters, { TradeFilterState, defaultFilters, applyFilters } from "@/components/TradeFilters";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Tab = 'dashboard' | 'journal' | 'analytics' | 'calendar' | 'tools';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
      aria-label="Toggle theme"
    >
      <motion.div
        key={isDark ? 'moon' : 'sun'}
        initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {isDark ? <Moon size={16} /> : <Sun size={16} />}
      </motion.div>
    </button>
  );
}

export default function Index() {
  const [trades, setTrades] = useState<Trade[]>(getTrades);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [journalFilters, setJournalFilters] = useState<TradeFilterState>(defaultFilters);
  const filteredTrades = applyFilters(trades, journalFilters);
  const isMobile = useIsMobile();

  const stats = calculateStats(trades);
  const refresh = useCallback(() => setTrades(getTrades()), []);

  const handleAdd = (trade: Omit<Trade, 'id'>) => {
    if (editTrade) { updateTrade(editTrade.id, trade); toast.success('Trade updated'); }
    else { addTrade(trade); toast.success('Trade added'); }
    setEditTrade(null);
    refresh();
  };

  const handleDelete = (id: string) => { deleteTrade(id); toast.success('Trade deleted'); refresh(); };
  const handleEdit = (trade: Trade) => { setEditTrade(trade); setModalOpen(true); };

  const handleExport = () => {
    const csv = exportTradesToCSV(trades);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `trades-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Trades exported');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imported = importTradesFromCSV(ev.target?.result as string);
      saveTrades([...getTrades(), ...imported]);
      refresh();
      toast.success(`Imported ${imported.length} trades`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={isMobile ? 20 : 15} /> },
    { id: 'journal', label: 'Journal', icon: <BookOpen size={isMobile ? 20 : 15} /> },
    { id: 'analytics', label: 'Analytics', icon: <Activity size={isMobile ? 20 : 15} /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarDays size={isMobile ? 20 : 15} /> },
    { id: 'tools', label: 'Tools', icon: <Calculator size={isMobile ? 20 : 15} /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <Activity size={13} className="text-background" />
            </div>
            <h1 className="text-[15px] font-semibold tracking-tight">TradeVault</h1>
          </div>

          {/* Desktop nav */}
          {!isMobile && (
            <nav className="flex items-center gap-0.5 bg-muted/60 rounded-xl p-1">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-300 ${
                    tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </nav>
          )}

          {/* Desktop actions */}
          {!isMobile && (
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200">
                <Upload size={14} /> Import
              </button>
              <button onClick={handleExport} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200">
                <Download size={14} /> Export
              </button>
              <button onClick={() => { setEditTrade(null); setModalOpen(true); }} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity duration-200">
                <Plus size={15} /> New Trade
              </button>
            </div>
          )}

          {/* Mobile actions */}
          {isMobile && (
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
              <button
                onClick={() => { setEditTrade(null); setModalOpen(true); }}
                className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center"
              >
                <Plus size={18} />
              </button>
              <Sheet>
                <SheetTrigger asChild>
                  <button className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
                    <MoreHorizontal size={18} />
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl pb-8">
                  <SheetHeader>
                    <SheetTitle className="text-base">Actions</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 mt-4">
                    <button onClick={() => fileRef.current?.click()} className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm text-foreground hover:bg-muted/60 transition-all">
                      <Upload size={18} className="text-muted-foreground" /> Import Trades
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm text-foreground hover:bg-muted/60 transition-all">
                      <Download size={18} className="text-muted-foreground" /> Export Trades
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className={`max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8 space-y-4 md:space-y-6 ${isMobile ? 'pb-24' : ''}`}>
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
          {tab === 'dashboard' && (
            <div className="space-y-4 md:space-y-6">
              <StatsOverview stats={stats} />
              <EquityCurve trades={trades} />
              <DrawdownChart trades={trades} />
              <div>
                <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-3">Recent Trades</h2>
                <TradeTable trades={trades.slice(-10)} onDelete={handleDelete} onEdit={handleEdit} />
              </div>
            </div>
          )}
          {tab === 'journal' && (
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {filteredTrades.length === trades.length ? `All Trades · ${trades.length}` : `${filteredTrades.length} of ${trades.length} Trades`}
                </h2>
              </div>
              <TradeFilters filters={journalFilters} onChange={setJournalFilters} trades={trades} />
              <TradeTable trades={filteredTrades} onDelete={handleDelete} onEdit={handleEdit} />
            </div>
          )}
          {tab === 'analytics' && (
            <div className="space-y-4 md:space-y-6">
              <StatsOverview stats={stats} />
              <EquityCurve trades={trades} />
              <DrawdownChart trades={trades} />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
                {(() => {
                  const rrs = trades.map(getRiskReward).filter((r): r is number => r !== null);
                  const avgRR = rrs.length ? rrs.reduce((a, b) => a + b, 0) / rrs.length : 0;
                  return [
                    { label: 'Largest Win', value: `$${stats.largestWin.toFixed(2)}`, type: 'profit' as const },
                    { label: 'Largest Loss', value: `$${stats.largestLoss.toFixed(2)}`, type: 'loss' as const },
                    { label: 'Avg R:R', value: `${avgRR.toFixed(2)}R`, type: (avgRR >= 1 ? 'profit' : 'loss') as 'profit' | 'loss' },
                    { label: 'Win Streak', value: stats.winStreak, type: 'profit' as const },
                    { label: 'Lose Streak', value: stats.loseStreak, type: 'loss' as const },
                  ];
                })().map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.04, ease: [0.16, 1, 0.3, 1] }} className="surface-card p-3 md:p-5">
                    <p className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5 md:mb-2">{s.label}</p>
                    <p className={`text-lg md:text-2xl font-semibold tracking-tight tabular-nums ${s.type === 'profit' ? 'text-profit' : 'text-loss'}`}>{s.value}</p>
                  </motion.div>
                ))}
              </div>
              <PerformanceBreakdown trades={trades} />
            </div>
          )}
          {tab === 'calendar' && (
            <CalendarHeatMap trades={trades} />
          )}
          {tab === 'tools' && (
            <PositionSizer />
          )}
        </motion.div>
      </main>

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-xl safe-area-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex flex-col items-center gap-1 flex-1 py-1"
              >
                <motion.div
                  animate={{
                    scale: tab === t.id ? 1 : 0.9,
                    color: tab === t.id ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {t.icon}
                </motion.div>
                <span className={`text-[10px] font-medium transition-colors duration-200 ${
                  tab === t.id ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {t.label}
                </span>
                {tab === t.id && (
                  <motion.div
                    layoutId="bottomTabIndicator"
                    className="absolute top-0 w-8 h-0.5 rounded-full bg-foreground"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </nav>
      )}

      <AddTradeModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTrade(null); }} onSave={handleAdd} editTrade={editTrade} />
    </div>
  );
}
