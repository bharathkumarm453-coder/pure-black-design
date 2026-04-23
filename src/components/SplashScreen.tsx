import { motion } from "framer-motion";
import { Activity } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={(def) => {
        // Trigger completion after the inner animation timeline finishes
      }}
    >
      {/* Subtle radial glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{ duration: 2.2, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--foreground) / 0.08), transparent 60%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-5">
        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="relative"
        >
          {/* Pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl border border-foreground/20"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.3, repeat: 1 }}
          />
          <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center shadow-lg">
            <Activity size={28} className="text-background" strokeWidth={2.25} />
          </div>
        </motion.div>

        {/* Wordmark */}
        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
            className="text-4xl font-semibold tracking-tight text-foreground lowercase"
          >
            ada
          </motion.h1>
        </div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="flex items-center gap-2"
        >
          <span className="h-px w-6 bg-border" />
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Trading Journal
          </p>
          <span className="h-px w-6 bg-border" />
        </motion.div>

        {/* Loading bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.3 }}
          className="mt-2 w-32 h-[2px] bg-muted rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-foreground rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1], delay: 0.9 }}
            onAnimationComplete={onComplete}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
