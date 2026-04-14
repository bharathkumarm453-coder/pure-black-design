import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  open: boolean;
  onClose: () => void;
  symbol?: string;
}

export default function ImageGallery({ images, open, onClose, symbol }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);

  if (!open || images.length === 0) return null;

  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrent(i => (i + 1) % images.length);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/20 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            className="relative max-w-4xl w-full mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-foreground/80">
                {symbol && <span className="font-semibold">{symbol}</span>}
                {images.length > 1 && <span className="text-muted-foreground ml-2">{current + 1} / {images.length}</span>}
              </p>
              <button onClick={onClose} className="p-2 rounded-xl bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-all duration-200">
                <X size={16} />
              </button>
            </div>

            {/* Image */}
            <div className="relative surface-elevated overflow-hidden rounded-2xl">
              <AnimatePresence mode="wait">
                <motion.img
                  key={current}
                  src={images[current]}
                  alt={`Chart ${current + 1}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-h-[70vh] object-contain"
                />
              </AnimatePresence>

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-background/80 backdrop-blur-sm hover:bg-background text-muted-foreground hover:text-foreground transition-all duration-200 shadow-sm">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-background/80 backdrop-blur-sm hover:bg-background text-muted-foreground hover:text-foreground transition-all duration-200 shadow-sm">
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 justify-center">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      i === current ? 'border-foreground/60 shadow-sm' : 'border-border/40 opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Small inline thumbnail button for trade table
export function ImageThumbnail({ images, onClick }: { images: string[]; onClick: () => void }) {
  if (images.length === 0) return null;
  return (
    <button onClick={onClick} className="relative group flex items-center gap-1">
      <div className="w-8 h-6 rounded-md overflow-hidden border border-border/40 group-hover:border-foreground/20 transition-all duration-200">
        <img src={images[0]} alt="" className="w-full h-full object-cover" />
      </div>
      {images.length > 1 && (
        <span className="text-[10px] text-muted-foreground font-medium">+{images.length - 1}</span>
      )}
      <ZoomIn size={10} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
    </button>
  );
}
