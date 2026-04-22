import { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2, Edit2, TrendingUp, TrendingDown, BarChart, Plus } from "lucide-react";
import { Trade, getPnL, getRiskReward } from "@/lib/trades";
import ImageGallery, { ImageThumbnail } from "@/components/ImageGallery";
import TradeDetailDrawer from "@/components/TradeDetailDrawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface TradeTableProps {
  trades: Trade[];
  onDelete: (id: string) => void;
  onEdit: (trade: Trade) => void;
}

function TradeCard({ trade, onDelete, onEdit, onImageClick, index }: { trade: Trade; onDelete: () => void; onEdit: () => void; onImageClick: () => void; index: number }) {
  const pnl = getPnL(trade);
  const rr = getRiskReward(trade);
  const isWin = pnl >= 0;
  const images = trade.images || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      className="surface-card p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold tracking-tight">{trade.symbol}</span>
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            trade.direction === 'LONG' ? 'bg-profit-subtle text-profit' : 'bg-loss-subtle text-loss'
          }`}>
            {trade.direction === 'LONG' ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {trade.direction}
          </span>
          {trade.setup && <span className="text-[11px] text-muted-foreground">{trade.setup}</span>}
        </div>
        <span className={`text-sm font-mono font-semibold ${isWin ? 'text-profit' : 'text-loss'}`}>
          {isWin ? '+' : ''}{pnl.toFixed(2)}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 text-[11px]">
        <div>
          <p className="text-muted-foreground/60 mb-0.5">Entry</p>
          <p className="font-mono font-medium">${trade.entryPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground/60 mb-0.5">Exit</p>
          <p className="font-mono font-medium">${trade.exitPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground/60 mb-0.5">Qty</p>
          <p className="font-mono font-medium">{trade.quantity}</p>
        </div>
        <div>
          <p className="text-muted-foreground/60 mb-0.5">R:R</p>
          <p className={`font-mono font-medium ${rr !== null ? (rr >= 0 ? 'text-profit' : 'text-loss') : 'text-muted-foreground'}`}>
            {rr !== null ? `${rr.toFixed(1)}R` : '—'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border/40">
        <span className="text-[10px] text-muted-foreground font-mono">{trade.exitDate}</span>
        <div className="flex items-center gap-1">
          {images.length > 0 && (
            <button onClick={onImageClick} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              <ImageThumbnail images={images} onClick={onImageClick} />
            </button>
          )}
          <button onClick={onEdit} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-loss hover:bg-loss-subtle transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function TradeTable({ trades, onDelete, onEdit }: TradeTableProps) {
  const sorted = [...trades].sort((a, b) => b.exitDate.localeCompare(a.exitDate));
  const [galleryTrade, setGalleryTrade] = useState<Trade | null>(null);
  const [detailTrade, setDetailTrade] = useState<Trade | null>(null);
  const isMobile = useIsMobile();

  if (trades.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="surface-card p-12 md:p-16 text-center">
        <BarChart className="mx-auto mb-4 text-muted-foreground/20" size={40} />
        <p className="text-muted-foreground font-medium">No trades recorded</p>
        <p className="text-muted-foreground/60 text-sm mt-1">Add your first trade to begin tracking</p>
      </motion.div>
    );
  }

  if (isMobile) {
    return (
      <>
        <div className="space-y-2.5">
          {sorted.map((trade, i) => (
            <div key={trade.id} onClick={() => setDetailTrade(trade)} className="cursor-pointer">
              <TradeCard
                trade={trade}
                index={i}
                onDelete={() => onDelete(trade.id)}
                onEdit={() => onEdit(trade)}
                onImageClick={() => setGalleryTrade(trade)}
              />
            </div>
          ))}
        </div>
        <ImageGallery images={galleryTrade?.images || []} open={!!galleryTrade} onClose={() => setGalleryTrade(null)} symbol={galleryTrade?.symbol} />
        <TradeDetailDrawer trade={detailTrade} onClose={() => setDetailTrade(null)} onEdit={onEdit} onDelete={onDelete} />
      </>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: [0.16, 1, 0.3, 1] }} className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Date', 'Symbol', 'Side', 'Entry', 'SL', 'Exit', 'Qty', 'P&L', 'R:R', 'Setup', 'Chart', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {sorted.map((trade, i) => {
                  const pnl = getPnL(trade);
                  const rr = getRiskReward(trade);
                  const isWin = pnl >= 0;
                  const images = trade.images || [];
                  return (
                    <motion.tr
                      key={trade.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => setDetailTrade(trade)}
                      className="border-b border-border/40 hover:bg-muted/40 transition-colors duration-300 group cursor-pointer"
                    >
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{trade.exitDate}</td>
                      <td className="px-5 py-4 font-semibold tracking-tight">{trade.symbol}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          trade.direction === 'LONG' ? 'bg-profit-subtle text-profit' : 'bg-loss-subtle text-loss'
                        }`}>
                          {trade.direction === 'LONG' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {trade.direction}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-sm">${trade.entryPrice.toFixed(2)}</td>
                      <td className="px-5 py-4 font-mono text-sm text-muted-foreground">{trade.stopLoss ? `$${trade.stopLoss.toFixed(2)}` : '—'}</td>
                      <td className="px-5 py-4 font-mono text-sm">${trade.exitPrice.toFixed(2)}</td>
                      <td className="px-5 py-4 font-mono text-sm">{trade.quantity}</td>
                      <td className={`px-5 py-4 font-mono text-sm font-semibold ${isWin ? 'text-profit' : 'text-loss'}`}>
                        {isWin ? '+' : ''}{pnl.toFixed(2)}
                      </td>
                      <td className={`px-5 py-4 font-mono text-xs font-medium ${rr !== null ? (rr >= 0 ? 'text-profit' : 'text-loss') : 'text-muted-foreground'}`}>
                        {rr !== null ? `${rr.toFixed(1)}R` : '—'}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">{trade.setup}</td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <ImageThumbnail images={images} onClick={() => setGalleryTrade(trade)} />
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button onClick={() => onEdit(trade)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => onDelete(trade.id)} className="p-2 rounded-lg hover:bg-loss-subtle text-muted-foreground hover:text-loss transition-all duration-200">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      <ImageGallery images={galleryTrade?.images || []} open={!!galleryTrade} onClose={() => setGalleryTrade(null)} symbol={galleryTrade?.symbol} />
      <TradeDetailDrawer trade={detailTrade} onClose={() => setDetailTrade(null)} onEdit={onEdit} onDelete={onDelete} />
    </>
  );
}
