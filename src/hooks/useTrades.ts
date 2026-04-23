import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trade } from "@/lib/trades";
import { useAuth } from "@/hooks/useAuth";

interface DbTrade {
  id: string;
  user_id: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  entry_price: number | string;
  exit_price: number | string;
  stop_loss: number | string;
  quantity: number | string;
  entry_date: string;
  exit_date: string;
  fees: number | string;
  notes: string;
  tags: string[];
  setup: string;
  images: string[];
}

const toTrade = (row: DbTrade): Trade => ({
  id: row.id,
  symbol: row.symbol,
  direction: row.direction,
  entryPrice: Number(row.entry_price),
  exitPrice: Number(row.exit_price),
  stopLoss: Number(row.stop_loss),
  quantity: Number(row.quantity),
  entryDate: row.entry_date.split("T")[0],
  exitDate: row.exit_date.split("T")[0],
  fees: Number(row.fees),
  notes: row.notes ?? "",
  tags: row.tags ?? [],
  setup: row.setup ?? "",
  images: row.images ?? [],
});

const toRow = (trade: Omit<Trade, "id">, userId: string) => ({
  user_id: userId,
  symbol: trade.symbol,
  direction: trade.direction,
  entry_price: trade.entryPrice,
  exit_price: trade.exitPrice,
  stop_loss: trade.stopLoss || 0,
  quantity: trade.quantity,
  entry_date: trade.entryDate,
  exit_date: trade.exitDate,
  fees: trade.fees || 0,
  notes: trade.notes || "",
  tags: trade.tags || [],
  setup: trade.setup || "",
  images: trade.images || [],
});

export function useTrades() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setTrades([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("entry_date", { ascending: true });
    if (error) {
      console.error("Failed to load trades", error);
      setLoading(false);
      return;
    }
    setTrades((data ?? []).map((r) => toTrade(r as unknown as DbTrade)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const addTrade = useCallback(
    async (trade: Omit<Trade, "id">) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("trades").insert(toRow(trade, user.id));
      if (error) throw error;
      await refresh();
    },
    [user, refresh]
  );

  const updateTrade = useCallback(
    async (id: string, trade: Omit<Trade, "id">) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("trades")
        .update(toRow(trade, user.id))
        .eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [user, refresh]
  );

  const deleteTrade = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("trades").delete().eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh]
  );

  const importTrades = useCallback(
    async (newTrades: Omit<Trade, "id">[]) => {
      if (!user || newTrades.length === 0) return;
      const rows = newTrades.map((t) => toRow(t, user.id));
      const { error } = await supabase.from("trades").insert(rows);
      if (error) throw error;
      await refresh();
    },
    [user, refresh]
  );

  return { trades, loading, addTrade, updateTrade, deleteTrade, importTrades, refresh };
}
