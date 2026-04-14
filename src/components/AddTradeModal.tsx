import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Check, ImagePlus, Trash2 } from "lucide-react";
import { Trade } from "@/lib/trades";
import { useIsMobile } from "@/hooks/use-mobile";

interface AddTradeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (trade: Omit<Trade, 'id'>) => void;
  editTrade?: Trade | null;
}

const defaultForm = {
  symbol: '', direction: 'LONG' as const, entryPrice: '', exitPrice: '', stopLoss: '', quantity: '', entryDate: new Date().toISOString().split('T')[0], exitDate: new Date().toISOString().split('T')[0], fees: '0', notes: '', tags: '', setup: '', images: [] as string[],
};

function compressImage(file: File, maxWidth = 800): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function AddTradeModal({ open, onClose, onSave, editTrade }: AddTradeModalProps) {
  const [form, setForm] = useState(() => editTrade ? {
    symbol: editTrade.symbol, direction: editTrade.direction, entryPrice: String(editTrade.entryPrice), exitPrice: String(editTrade.exitPrice), stopLoss: String(editTrade.stopLoss || ''), quantity: String(editTrade.quantity), entryDate: editTrade.entryDate, exitDate: editTrade.exitDate, fees: String(editTrade.fees), notes: editTrade.notes, tags: editTrade.tags.join(', '), setup: editTrade.setup, images: editTrade.images || [],
  } : defaultForm);
  const imgRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      symbol: form.symbol.toUpperCase(),
      direction: form.direction,
      entryPrice: parseFloat(form.entryPrice) || 0,
      exitPrice: parseFloat(form.exitPrice) || 0,
      stopLoss: parseFloat(form.stopLoss) || 0,
      quantity: parseFloat(form.quantity) || 0,
      entryDate: form.entryDate,
      exitDate: form.exitDate,
      fees: parseFloat(form.fees) || 0,
      notes: form.notes,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      setup: form.setup,
      images: form.images,
    });
    setForm(defaultForm);
    onClose();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const compressed = await Promise.all(files.map(f => compressImage(f)));
    setForm(f => ({ ...f, images: [...f.images, ...compressed] }));
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const inputClass = "w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-muted/60 border border-border/60 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all duration-200 placeholder:text-muted-foreground/40 font-mono";
  const labelClass = "block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5 md:mb-2";

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/10 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={isMobile ? { opacity: 0, y: '100%' } : { opacity: 0, scale: 0.97, y: 10 }}
            animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { opacity: 0, y: '100%' } : { opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            className={`bg-background border border-border/60 p-5 md:p-7 w-full max-h-[92vh] overflow-y-auto ${
              isMobile ? 'rounded-t-2xl' : 'rounded-2xl max-w-lg shadow-xl'
            }`}
          >
            {/* Mobile drag handle */}
            {isMobile && <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-4" />}
            
            <div className="flex items-center justify-between mb-5 md:mb-7">
              <h2 className="text-lg md:text-xl font-semibold tracking-tight">{editTrade ? 'Edit Trade' : 'New Trade'}</h2>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors duration-200 text-muted-foreground"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className={labelClass}>Symbol</label>
                  <input className={inputClass} placeholder="AAPL" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} required />
                </div>
                <div>
                  <label className={labelClass}>Direction</label>
                  <div className="flex gap-2">
                    {(['LONG', 'SHORT'] as const).map(d => (
                      <button key={d} type="button" onClick={() => setForm(f => ({ ...f, direction: d }))}
                        className={`flex-1 py-2.5 md:py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                          form.direction === d
                            ? (d === 'LONG' ? 'bg-profit-subtle text-profit ring-1 ring-profit/20' : 'bg-loss-subtle text-loss ring-1 ring-loss/20')
                            : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                        }`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 md:gap-4">
                <div><label className={labelClass}>Entry</label><input type="number" step="any" className={inputClass} placeholder="0.00" value={form.entryPrice} onChange={e => setForm(f => ({ ...f, entryPrice: e.target.value }))} required /></div>
                <div><label className={labelClass}>Stop Loss</label><input type="number" step="any" className={inputClass} placeholder="0.00" value={form.stopLoss} onChange={e => setForm(f => ({ ...f, stopLoss: e.target.value }))} /></div>
                <div><label className={labelClass}>Exit</label><input type="number" step="any" className={inputClass} placeholder="0.00" value={form.exitPrice} onChange={e => setForm(f => ({ ...f, exitPrice: e.target.value }))} required /></div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div><label className={labelClass}>Quantity</label><input type="number" step="any" className={inputClass} placeholder="100" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required /></div>
                <div><label className={labelClass}>Fees</label><input type="number" step="any" className={inputClass} placeholder="0.00" value={form.fees} onChange={e => setForm(f => ({ ...f, fees: e.target.value }))} /></div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div><label className={labelClass}>Entry Date</label><input type="date" className={inputClass} value={form.entryDate} onChange={e => setForm(f => ({ ...f, entryDate: e.target.value }))} required /></div>
                <div><label className={labelClass}>Exit Date</label><input type="date" className={inputClass} value={form.exitDate} onChange={e => setForm(f => ({ ...f, exitDate: e.target.value }))} required /></div>
              </div>

              <div><label className={labelClass}>Setup</label><input className={inputClass} placeholder="Breakout, Reversal..." value={form.setup} onChange={e => setForm(f => ({ ...f, setup: e.target.value }))} /></div>
              <div><label className={labelClass}>Tags</label><input className={inputClass} placeholder="swing, tech, earnings" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} /></div>
              <div><label className={labelClass}>Notes</label><textarea className={`${inputClass} resize-none h-16 md:h-20 font-sans`} placeholder="Trade notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>

              <div>
                <label className={labelClass}>Chart Screenshots</label>
                <input ref={imgRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                
                {form.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative group w-16 h-11 md:w-20 md:h-14 rounded-lg overflow-hidden border border-border/40">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                        >
                          <Trash2 size={14} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => imgRef.current?.click()}
                  className="w-full py-2.5 md:py-3 rounded-xl border-2 border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:bg-muted/30 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  <ImagePlus size={16} />
                  {form.images.length > 0 ? 'Add More' : 'Attach Screenshots'}
                </button>
              </div>

              <button type="submit" className="w-full py-3 md:py-3.5 rounded-xl bg-foreground text-background font-medium text-sm hover:opacity-90 transition-opacity duration-200 flex items-center justify-center gap-2">
                {editTrade ? <Check size={16} /> : <Plus size={16} />}
                {editTrade ? 'Save Changes' : 'Add Trade'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
