import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView }  from "react-native-safe-area-context";
import { useAppCtx }     from "@/lib/context";
import { useReports }    from "@/lib/supabase/hooks";
import { useProducts }   from "@/lib/supabase/hooks";
import { money }         from "@/lib/supabase/api";
import { todayInBizTz }  from "@/lib/supabase/tz";
import { C }             from "@/lib/colors";
import { StatCard, Card, Badge, EmptyState, SectionHeader } from "@/components/UI";

type Period = "Daily" | "Weekly" | "Monthly";

function periodRange(period: Period, today: string): [string, string] {
  if (period === "Daily")   return [today, today];
  if (period === "Weekly") {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return [d.toISOString().slice(0, 10), today];
  }
  return [`${today.slice(0, 7)}-01`, today];
}

export default function ReportsScreen() {
  const { ctx }           = useAppCtx();
  const today             = todayInBizTz();
  const [period, setPeriod] = useState<Period>("Daily");
  const [from, to]          = periodRange(period, today);
  const { sales, loading, refresh } = useReports(ctx?.branch.id ?? null, from, to);
  const { products }        = useProducts(ctx?.branch.id ?? null);

  const total   = sales.reduce((a, s) => a + s.total, 0);
  const paid    = sales.filter(s => s.status === "Paid").reduce((a, s) => a + s.total, 0);
  const unpaid  = total - paid;
  const profit  = sales.reduce((a, s) => a + (s.profit ?? 0), 0);
  const low     = products.filter(p => p.stock <= p.reorder);
  const units   = products.reduce((a, p) => a + p.stock, 0);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <Text style={s.title}>Reports</Text>
        <View style={s.periodTabs}>
          {(["Daily", "Weekly", "Monthly"] as Period[]).map(p => (
            <TouchableOpacity key={p} onPress={() => setPeriod(p)} style={[s.periodTab, period === p && s.periodTabActive]}>
              <Text style={[s.periodTabText, period === p && s.periodTabTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={C.gold500} />}
      >
        {/* Stat cards */}
        <View style={s.grid}>
          <StatCard label="Revenue"     value={money(total)}  sub={`${sales.length} transactions`} accent />
          <StatCard label="Profit"      value={money(profit)} sub="Gross margin" ok />
        </View>
        <View style={[s.grid, { marginTop: 10 }]}>
          <StatCard label="Collected"   value={money(paid)}   sub="Received" ok />
          <StatCard label="Outstanding" value={money(unpaid)} sub="Not paid" warn={unpaid > 0} />
        </View>

        {/* Stock value */}
        <Card style={{ marginTop: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ fontSize: 13, color: C.textMuted }}>Stock on hand</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: C.textPrimary, marginTop: 3 }}>
                {units} units
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 13, color: C.textMuted }}>Selling value</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: C.gold500, marginTop: 3 }}>
                {money(products.reduce((a,p)=>a+p.stock*(p.selling_price??p.price),0))}
              </Text>
            </View>
          </View>
          {low.length > 0 && (
            <View style={{ marginTop: 12, backgroundColor: C.warningBg, borderRadius: 8, padding: 10 }}>
              <Text style={{ color: C.warning, fontSize: 12, fontWeight: "600" }}>{low.length} items need restocking</Text>
              <Text style={{ color: "#92400E", fontSize: 11, marginTop: 2 }}>{low.map(p=>p.name).join(", ")}</Text>
            </View>
          )}
        </Card>

        {/* Sales breakdown */}
        <Card style={{ marginTop: 14 }}>
          <SectionHeader title="Sales breakdown" />
          {sales.length === 0 ? (
            <EmptyState icon="📋" title="No sales in this period" />
          ) : (
            sales.map((sale, i) => (
              <View key={sale.id}>
                {i > 0 && <View style={{ height: 1, backgroundColor: C.border }} />}
                <View style={s.saleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.saleName} numberOfLines={1}>{sale.product_name}</Text>
                    <Text style={s.saleMeta}>{sale.qty} units · {new Date(sale.created_at).toLocaleDateString("en-TZ", { day: "numeric", month: "short" })}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={s.saleTotal}>{money(sale.total)}</Text>
                    <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                      <Badge label={sale.status} variant={sale.status === "Paid" ? "ok" : "warn"} />
                      {(sale.profit ?? 0) > 0 && (
                        <Text style={{ fontSize: 11, color: C.success, fontWeight: "600" }}>+{money(sale.profit ?? 0)}</Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: C.bg },
  header:          { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, padding: 16 },
  title:           { fontSize: 20, fontWeight: "700", color: C.textPrimary, marginBottom: 12 },
  periodTabs:      { flexDirection: "row", backgroundColor: C.bg, borderRadius: 9, padding: 3, gap: 2 },
  periodTab:       { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 7 },
  periodTabActive: { backgroundColor: C.navy700 },
  periodTabText:   { fontSize: 13, fontWeight: "500", color: C.textMuted },
  periodTabTextActive: { color: "#fff", fontWeight: "600" },
  scroll:          { padding: 16, paddingBottom: 40 },
  grid:            { flexDirection: "row", gap: 10 },
  saleRow:         { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  saleName:        { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  saleMeta:        { fontSize: 12, color: C.textMuted, marginTop: 2 },
  saleTotal:       { fontSize: 14, fontWeight: "700", color: C.textPrimary },
});
