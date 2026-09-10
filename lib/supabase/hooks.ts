import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import {
  getActiveBranch, getDashboardData, getSales,
  getProducts, getStockLogs, getReportData,
} from "./api";
import type { Product, Sale } from "./types";

type Ctx = Awaited<ReturnType<typeof getActiveBranch>>;

/** Global auth context — call once at app root */
export function useAuth() {
  const [ctx, setCtx]       = useState<Ctx>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveBranch().then(c => { setCtx(c); setLoading(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getActiveBranch().then(c => { setCtx(c); setLoading(false); });
    });
    return () => subscription.unsubscribe();
  }, []);

  return { ctx, loading, refresh: () => getActiveBranch().then(setCtx) };
}

/** Dashboard stats */
export function useDashboard(branchId: string | null) {
  const [data, setData]     = useState<Awaited<ReturnType<typeof getDashboardData>> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try { setData(await getDashboardData(branchId)); }
    finally { setLoading(false); }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, refresh: load };
}

/** Products with real-time updates */
export function useProducts(branchId: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try { setProducts(await getProducts(branchId)); }
    finally { setLoading(false); }
  }, [branchId]);

  useEffect(() => {
    load();
    if (!branchId) return;
    const channel = supabase
      .channel(`products:${branchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `branch_id=eq.${branchId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [branchId, load]);

  return { products, loading, refresh: load };
}

/** Sales with real-time updates */
export function useSales(branchId: string | null) {
  const [sales, setSales]   = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try { setSales(await getSales(branchId)); }
    finally { setLoading(false); }
  }, [branchId]);

  useEffect(() => {
    load();
    if (!branchId) return;
    const channel = supabase
      .channel(`sales:${branchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sales", filter: `branch_id=eq.${branchId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [branchId, load]);

  return { sales, loading, refresh: load };
}

export function useStockLogs(branchId: string | null) {
  const [logs, setLogs]     = useState<Awaited<ReturnType<typeof getStockLogs>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    getStockLogs(branchId).then(d => { setLogs(d); setLoading(false); });
  }, [branchId]);

  return { logs, loading };
}

export function useReports(branchId: string | null, from: string, to: string) {
  const [sales, setSales]   = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try { setSales(await getReportData(branchId, from, to)); }
    finally { setLoading(false); }
  }, [branchId, from, to]);

  useEffect(() => { load(); }, [load]);
  return { sales, loading, refresh: load };
}
