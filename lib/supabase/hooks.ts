/**
 * Client-side React hooks for Supabase data.
 * Use these in Client Components that need live data.
 */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "./client";
import type { Product, Sale, StockLog } from "./types";

/** Real-time products for a branch */
export function useProducts(branchId: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!branchId) return;
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("branch_id", branchId!)
        .order("name");
      setProducts(data ?? []);
      setLoading(false);
    }

    load();

    // Real-time subscription
    const channel = supabase
      .channel(`products:${branchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `branch_id=eq.${branchId}` }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [branchId]);

  return { products, loading };
}

/** Real-time sales for a branch */
export function useSales(branchId: string | null) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId) return;
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("sales")
        .select("*")
        .eq("branch_id", branchId!)
        .order("created_at", { ascending: false })
        .limit(50);
      setSales(data ?? []);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`sales:${branchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sales", filter: `branch_id=eq.${branchId}` }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [branchId]);

  return { sales, loading };
}

/** Stock addition log for a branch */
export function useStockLogs(branchId: string | null) {
  const [logs, setLogs]     = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId) return;
    const supabase = createClient();

    supabase
      .from("stock_logs")
      .select("*")
      .eq("branch_id", branchId!)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => { setLogs(data ?? []); setLoading(false); });
  }, [branchId]);

  return { logs, loading };
}
