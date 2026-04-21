import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Edit2, Trash2, Calendar, Tag, Target, DollarSign } from "lucide-react";
import { Trade, getPnL, getRiskReward } from "@/lib/trades";
import { useEffect, useState } from "react";

interface TradeDetailDrawerProps {
  trade: Trade | null;
  onClose: () => void;
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
}

export default function TradeDetailDrawer({ trade, onClose, onEdit, onDelete }: TradeDetailDrawerProps) {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
    if (trade) {
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [trade, onClose]);

  return (
    <AnimatePresence>
      {trade && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full md:w-[520px] bg-card border-l border-border overflow-y-auto"
          >
            <TradeDetailContent
              trade={trade}
              onClose={onClose}
              onEdit={onEdit}
              onDelete={onDelete}
              activeImage={activeImage}
              setActiveImage={setActiveImage}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function TradeDetailContent({
  trade, onClose, onEdit, onDelete, activeImage, setActiveImage,
}: {
  trade: Trade;
  onClose: () => void;
  onEdit: (t: Trade) => void;
  onDelete: (id: string) => void;
  activeImage: number;
  setActiveImage: (n: number) => void;
}) {
  const pnl = getPnL(trade);
  const rr = getRiskReward(trade);
  const isWin = pnl >= 0;
  const images = trade.images || [];
  const tags = trade.tags || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-2xl font-semibold tracking-tight">{trade.symbol}</h2>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                trade.direction === 'LONG' ? 'bg-profit-subtle text-profit' : 'bg-loss-subtle text-loss'
              }`}>
                {trade.direction === 'LONG' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {trade.direction}
              </span>
            </div>
            <p className="text-xs text-muted-foreground tabular-nums flex items-center gap-1.5">
              <Calendar size={11} />
              {trade.entryDate} → {trade.exitDate}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* P&L Hero */}
      <div className={`rounded-2xl p-5 ${isWin ? 'bg-profit-subtle' : 'bg-loss-subtle'}`}>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2">Net P&L</p>
        <p className={`text-4xl font-semibold tracking-tight tabular-nums ${isWin ? 'text-profit' : 'text-loss'}`}>
          {isWin ? '+' : ''}${pnl.toFixed(2)}
        </p>
        {rr !== null && (
          <p className={`text-xs mt-2 tabular-nums ${rr >= 0 ? 'text-profit' : 'text-loss'}`}>
            {rr >= 0 ? '+' : ''}{rr.toFixed(2)}R risk-reward
          </p>
        )}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Entry" value={`$${trade.entryPrice.toFixed(2)}`} />
        <Metric label="Exit" value={`$${trade.exitPrice.toFixed(2)}`} />
        <Metric label="Stop Loss" value={trade.stopLoss ? `$${trade.stopLoss.toFixed(2)}` : '—'} />
        <Metric label="Quantity" value={trade.quantity.toString()} />
        <Metric label="Position Size" value={`$${(trade.entryPrice * trade.quantity).toFixed(2)}`} />
        <Metric label="Fees" value={`$${trade.fees.toFixed(2)}`} muted />
      </div>

      {/* Setup & Tags */}
      {(trade.setup || tags.length > 0) && (
        <div className="space-y-3">
          {trade.setup && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2 flex items-center gap-1.5">
                <Target size={11} /> Setup
              </p>
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-muted text-sm font-medium">
                {trade.setup}
              </span>
            </div>
          )}
          {tags.length > 0 && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2 flex items-center gap-1.5">
                <Tag size={11} /> Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2">Notes</p>
          <div className="rounded-xl bg-muted/40 border border-border/60 p-4 text-sm leading-relaxed whitespace-pre-wrap">
            {trade.notes}
          </div>
        </div>
      )}

      {/* Screenshots */}
      {images.length > 0 && (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2">Screenshots</p>
          <div className="rounded-xl overflow-hidden bg-muted/40 border border-border/60">
            <img src={images[activeImage]} alt={`Chart ${activeImage + 1}`} className="w-full max-h-[400px] object-contain" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage === i ? 'border-foreground' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 sticky bottom-0 bg-card pb-2">
        <button
          onClick={() => { onEdit(trade); onClose(); }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Edit2 size={14} /> Edit Trade
        </button>
        <button
          onClick={() => { onDelete(trade.id); onClose(); }}
          className="px-4 py-2.5 rounded-xl bg-loss-subtle text-loss text-sm font-medium hover:bg-loss hover:text-background transition-all flex items-center gap-2"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/40 border border-border/60 p-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
