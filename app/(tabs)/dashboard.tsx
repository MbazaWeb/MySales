import { useCallback } from "react";
import {
  View, Text, ScrollView, RefreshControl,
  StyleSheet, ActivityIndicator,
} from "react-native";
import { SafeAreaView }              from "react-native-safe-area-context";
import { useAppCtx }                 from "@/lib/context";
import { useDashboard }              from "@/lib/supabase/hooks";
import { money }                     from "@/lib/supabase/api";
import { C }                         from "@/lib/colors";
import { StatCard, Card, SectionHeader, Separator, EmptyState } from "@/components/UI";
import { todayInBizTz }              from "@/lib/supabase/tz";

export default function DashboardScreen() {
  const { ctx }                      = useAppCtx();
  const { data, loading, refresh }   = useDashboard(ctx?.branch.id ?? null);

  const today = new Date().toLocaleDateString("en-TZ", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.logoMark}>
          <Text style={{ color: C.navy900, fontWeight: "800", fontSize: 16 }}>D</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.bizName}>{ctx?.biz.name ?? "DukaVerse"}</Text>
          <Text style={s.dateText}>{today}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={C.gold500} />}
      >
        {loading && !data ? (
          <ActivityIndicator color={C.gold500} size="large" style={{ marginTop: 40 }} />
        ) : !data ? (
          <EmptyState icon="📊" title="No data yet" sub="Add products and record sales to see your dashboard." />
        ) : (
          <>
            {/* Low stock alert */}
            {data.lowStock.length > 0 && (
              <View style={s.alertBanner}>
                <Text style={s.alertText}>⚠️ {data.lowStock.length} items need restocking</Text>
                <Text style={s.alertSub}>{data.lowStock.map(p => p.name).join(", ")}</Text>
              </View>
            )}

            {/* Stat cards */}
            <View style={s.statsGrid}>
              <StatCard label="Today's revenue" value={money(data.revenue)} sub={`${data.todaySales.length} transactions`} accent />
              <StatCard label="Today's profit"  value={money(data.profit)}  sub="Gross profit" ok />
            </View>
            <View style={s.statsGrid}>
              <StatCard label="Units in stock"  value={String(data.totalUnits)} sub={`${data.products.length} products`} />
              <StatCard label="Low stock"       value={String(data.lowStock.length)} sub="Need reorder" warn={data.lowStock.length > 0} />
            </View>

            {/* Recent sales */}
            <Card style={{ marginTop: 16 }}>
              <SectionHeader title="Recent sales" action="See all" onAction={() => {}} />
              {data.todaySales.length === 0 ? (
                <EmptyState icon="🧾" title="No sales today" sub="Record your first sale." />
              ) : (
                data.todaySales.slice(0, 5).map((s, i) => (
                  <View key={s.id}>
                    {i > 0 && <Separator />}
                    <View style={sr.saleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={sr.saleName}>{s.product_name}</Text>
                        <Text style={sr.saleMeta}>{s.qty} units · {s.payment}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={sr.saleTotal}>{money(s.total)}</Text>
                        <View style={[sr.badge, { backgroundColor: s.status === "Paid" ? C.successBg : C.warningBg }]}>
                          <Text style={[sr.badgeText, { color: s.status === "Paid" ? C.success : C.warning }]}>
                            {s.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </Card>

            {/* Top sellers */}
            {data.topSellers.length > 0 && (
              <Card style={{ marginTop: 12 }}>
                <SectionHeader title="Top sellers today" />
                {data.topSellers.map(([name, qty]) => {
                  const max = data.topSellers[0][1];
                  return (
                    <View key={name} style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text style={{ fontSize: 13, color: C.textPrimary, fontWeight: "500", flex: 1 }} numberOfLines={1}>{name}</Text>
                        <Text style={{ fontSize: 12, color: C.textMuted }}>{qty} sold</Text>
                      </View>
                      <View style={{ height: 5, backgroundColor: C.border, borderRadius: 99 }}>
                        <View style={{ height: 5, backgroundColor: C.gold500, borderRadius: 99, width: `${(qty / max) * 100}%` }} />
                      </View>
                    </View>
                  );
                })}
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: C.bg },
  header:     { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.navy900 },
  logoMark:   { width: 36, height: 36, borderRadius: 10, backgroundColor: C.gold500, alignItems: "center", justifyContent: "center" },
  bizName:    { fontSize: 16, fontWeight: "700", color: "#fff" },
  dateText:   { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 1 },
  scroll:     { padding: 16, paddingBottom: 32 },
  statsGrid:  { flexDirection: "row", gap: 10, marginBottom: 10 },
  alertBanner:{ backgroundColor: C.warningBg, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#FDE68A", marginBottom: 14 },
  alertText:  { fontSize: 13, fontWeight: "600", color: C.warning },
  alertSub:   { fontSize: 11, color: "#92400E", marginTop: 3 },
});
const sr = StyleSheet.create({
  saleRow:    { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  saleName:   { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  saleMeta:   { fontSize: 12, color: C.textMuted, marginTop: 2 },
  saleTotal:  { fontSize: 14, fontWeight: "700", color: C.textPrimary },
  badge:      { borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2, marginTop: 3 },
  badgeText:  { fontSize: 10, fontWeight: "700" },
});
