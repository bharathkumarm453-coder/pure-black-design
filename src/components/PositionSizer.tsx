import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Target, DollarSign, Hash, TrendingUp, Shield, Layers } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type Direction = 'long' | 'short';
type InstrumentType = 'stock' | 'forex' | 'xauusd';

function AnimatedValue({ value, prefix = '', suffix = '', className = '' }: { value: number; prefix?: string; suffix?: string; className?: string }) {
  return (
    <motion.span
      key={value.toFixed(4)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {prefix}{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: value < 1 ? 4 : 2 })}{suffix}
    </motion.span>
  );
}

export default function PositionSizer() {
  const [accountSize, setAccountSize] = useState<string>('10000');
  const [riskPercent, setRiskPercent] = useState<string>('1');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [direction, setDirection] = useState<Direction>('long');
  const [instrument, setInstrument] = useState<InstrumentType>('stock');
  const [leverage, setLeverage] = useState<string>('1');
  const isMobile = useIsMobile();

  // Auto-set leverage defaults when instrument changes
  const handleInstrumentChange = (type: InstrumentType) => {
    setInstrument(type);
    if (type === 'stock') setLeverage('1');
    else if (type === 'forex') setLeverage('100');
    else if (type === 'xauusd') setLeverage('100');
  };

  const calc = useMemo(() => {
    const acc = parseFloat(accountSize) || 0;
    const risk = parseFloat(riskPercent) || 0;
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const tp = parseFloat(takeProfit) || 0;
    const lev = parseFloat(leverage) || 1;

    const dollarRisk = acc * (risk / 100);
    const riskPerShare = Math.abs(entry - sl);

    let positionSize = 0;
    let totalValue = 0;
    let lots = 0;
    let miniLots = 0;
    let microLots = 0;
    let margin = 0;
    let pipRisk = 0;

    if (instrument === 'stock') {
      positionSize = riskPerShare > 0 ? Math.floor(dollarRisk / riskPerShare) : 0;
      totalValue = positionSize * entry;
      margin = totalValue / lev;
    } else if (instrument === 'forex') {
      // Forex: pip = 0.0001 for most pairs, 0.01 for JPY
      const pipSize = entry > 50 ? 0.01 : 0.0001; // heuristic: if price > 50, likely JPY pair
      pipRisk = riskPerShare / pipSize;
      const pipValuePerStandardLot = pipSize === 0.01 ? 1000 : 10; // $10 per pip for standard, ~$10 for JPY
      lots = pipRisk > 0 ? dollarRisk / (pipRisk * pipValuePerStandardLot) : 0;
      miniLots = lots * 10;
      microLots = lots * 100;
      totalValue = lots * 100000 * entry;
      margin = totalValue / lev;
    } else if (instrument === 'xauusd') {
      // XAUUSD: 1 lot = 100 oz, $1 move = $100/lot
      const pointValue = 100; // $100 per $1 move per lot
      const slPoints = riskPerShare; // in dollar terms
      lots = slPoints > 0 ? dollarRisk / (slPoints * pointValue) : 0;
      pipRisk = slPoints;
      totalValue = lots * 100 * entry;
      margin = totalValue / lev;
    }

    let rr = 0;
    if (tp > 0 && riskPerShare > 0) {
      const reward = direction === 'long' ? tp - entry : entry - tp;
      rr = reward / riskPerShare;
    }

    const potentialProfit = tp > 0 && instrument === 'stock'
      ? positionSize * Math.abs(tp - entry)
      : tp > 0 && instrument === 'xauusd'
        ? lots * 100 * Math.abs(tp - entry)
        : tp > 0 && instrument === 'forex'
          ? lots * (entry > 50 ? 1000 : 10) * (Math.abs(tp - entry) / (entry > 50 ? 0.01 : 0.0001))
          : 0;

    return {
      riskPerShare, dollarRisk, positionSize, totalValue, rr, potentialProfit,
      lots, miniLots, microLots, margin, pipRisk,
      isValid: entry > 0 && sl > 0 && riskPerShare > 0
    };
  }, [accountSize, riskPercent, entryPrice, stopLoss, takeProfit, direction, instrument, leverage]);

  const inputClass = "w-full bg-transparent text-foreground text-base md:text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none";

  const sizeLabel = instrument === 'stock' ? 'shares / units' : 'lots';
  const primarySize = instrument === 'stock' ? calc.positionSize : calc.lots;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Position Sizer</h2>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Calculate optimal position size based on risk</p>
          </div>
          {/* Direction toggle */}
          <div className="flex items-center gap-0.5 bg-muted/60 rounded-xl p-1">
            <button
              onClick={() => setDirection('long')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                direction === 'long' ? 'bg-background text-profit shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowUpRight size={13} /> Long
            </button>
            <button
              onClick={() => setDirection('short')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                direction === 'short' ? 'bg-background text-loss shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownRight size={13} /> Short
            </button>
          </div>
        </div>

        {/* Instrument type toggle */}
        <div className="flex items-center gap-0.5 bg-muted/60 rounded-xl p-1 w-fit">
          {(['stock', 'forex', 'xauusd'] as InstrumentType[]).map(type => (
            <button
              key={type}
              onClick={() => handleInstrumentChange(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                instrument === type ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {type === 'stock' ? 'Stock' : type === 'forex' ? 'Forex' : 'XAUUSD'}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 md:gap-6`}>
        {/* Inputs */}
        <div className="space-y-3">
          <div className="surface-card p-4 md:p-5 space-y-4">
            <h3 className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-3">Trade Parameters</h3>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Account Size</label>
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <DollarSign size={14} className="text-muted-foreground/50" />
                <input type="number" value={accountSize} onChange={e => setAccountSize(e.target.value)} placeholder="10,000" className={inputClass} min="0" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Risk Percentage</label>
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <Shield size={14} className="text-muted-foreground/50" />
                <input type="number" value={riskPercent} onChange={e => setRiskPercent(e.target.value)} placeholder="1" className={inputClass} min="0" max="100" step="0.1" />
                <span className="text-xs text-muted-foreground/50">%</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Entry Price</label>
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <TrendingUp size={14} className="text-muted-foreground/50" />
                <input type="number" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} placeholder="0.00" className={inputClass} min="0" step="0.01" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Stop Loss</label>
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <ArrowDownRight size={14} className="text-loss/50" />
                <input type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="0.00" className={inputClass} min="0" step="0.01" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Take Profit <span className="text-muted-foreground/40">(optional)</span></label>
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <Target size={14} className="text-profit/50" />
                <input type="number" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} placeholder="0.00" className={inputClass} min="0" step="0.01" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Leverage</label>
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <Layers size={14} className="text-muted-foreground/50" />
                <input type="number" value={leverage} onChange={e => setLeverage(e.target.value)} placeholder="1" className={inputClass} min="1" step="1" />
                <span className="text-xs text-muted-foreground/50">x</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {calc.isValid ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3"
              >
                {/* Primary result */}
                <div className="surface-card p-5 md:p-6 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2">Position Size</p>
                  <div className="flex items-center justify-center gap-2">
                    <Hash size={20} className="text-muted-foreground/40" />
                    <AnimatedValue value={primarySize} className="text-3xl md:text-4xl font-semibold font-mono tracking-tight text-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-1.5">{sizeLabel}</p>
                </div>

                {/* Lot breakdown for forex */}
                {instrument === 'forex' && calc.lots > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="surface-card p-3 text-center">
                      <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">Standard</p>
                      <AnimatedValue value={calc.lots} className="text-sm font-semibold font-mono text-foreground" />
                    </div>
                    <div className="surface-card p-3 text-center">
                      <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">Mini</p>
                      <AnimatedValue value={calc.miniLots} className="text-sm font-semibold font-mono text-foreground" />
                    </div>
                    <div className="surface-card p-3 text-center">
                      <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">Micro</p>
                      <AnimatedValue value={calc.microLots} className="text-sm font-semibold font-mono text-foreground" />
                    </div>
                  </div>
                )}

                {/* Secondary results grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="surface-card p-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5">Dollar Risk</p>
                    <AnimatedValue value={calc.dollarRisk} prefix="$" className="text-lg font-semibold font-mono tracking-tight text-loss" />
                  </div>
                  <div className="surface-card p-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5">
                      {instrument === 'forex' ? 'Pip Risk' : instrument === 'xauusd' ? 'Point Risk' : 'Risk / Share'}
                    </p>
                    <AnimatedValue
                      value={instrument === 'stock' ? calc.riskPerShare : calc.pipRisk}
                      prefix={instrument === 'stock' ? '$' : ''}
                      suffix={instrument === 'forex' ? ' pips' : instrument === 'xauusd' ? ' pts' : ''}
                      className="text-lg font-semibold font-mono tracking-tight text-foreground"
                    />
                  </div>
                  <div className="surface-card p-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5">Req. Margin</p>
                    <AnimatedValue value={calc.margin} prefix="$" className="text-lg font-semibold font-mono tracking-tight text-foreground" />
                  </div>
                  {calc.rr > 0 ? (
                    <div className="surface-card p-4">
                      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5">Risk : Reward</p>
                      <AnimatedValue value={calc.rr} suffix="R" className={`text-lg font-semibold font-mono tracking-tight ${calc.rr >= 1 ? 'text-profit' : 'text-loss'}`} />
                    </div>
                  ) : (
                    <div className="surface-card p-4">
                      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5">Risk : Reward</p>
                      <span className="text-lg font-semibold font-mono tracking-tight text-muted-foreground/40">—</span>
                    </div>
                  )}
                </div>

                {calc.potentialProfit > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="surface-card p-4 flex items-center justify-between"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Potential Profit</p>
                    <AnimatedValue value={calc.potentialProfit} prefix="+$" className="text-lg font-semibold font-mono tracking-tight text-profit" />
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="surface-card p-8 md:p-12 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
                  <Target size={20} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground/60">Enter entry price and stop loss to calculate position size</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
