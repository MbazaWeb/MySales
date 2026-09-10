import { useState } from "react";
import {
  View, Text, ScrollView, FlatList, StyleSheet,
  TouchableOpacity, Modal, RefreshControl,
  KeyboardAvoidingView, Platform, TextInput,
} from "react-native";
import { SafeAreaView }   from "react-native-safe-area-context";
import { Ionicons }       from "@expo/vector-icons";
import * as Haptics       from "expo-haptics";
import { useAppCtx }      from "@/lib/context";
import { useSales, useProducts } from "@/lib/supabase/hooks";
import { recordSale, money }     from "@/lib/supabase/api";
import { C }              from "@/lib/colors";
import { GoldButton, Input, EmptyState, Badge } from "@/components/UI";

const PAYMENT_METHODS = ["Cash", "M-Pesa", "Airtel Money", "Tigo Pesa", "Halo Pesa", "Credit"];
const MOBILE_PAY      = ["M-Pesa", "Airtel Money", "Tigo Pesa", "Halo Pesa"];

export default function SalesScreen() {
  const { ctx }                         = useAppCtx();
  const { sales, loading, refresh }     = useSales(ctx?.branch.id ?? null);
  const { products }                    = useProducts(ctx?.branch.id ?? null);

  const [modal, setModal]               = useState(false);
  const [productId, setProductId]       = useState(products[0]?.id ?? "");
  const [qty, setQty]                   = useState("1");
  const [payment, setPayment]           = useState("Cash");
  const [custName, setCustName]         = useState("");
  const [custPhone, setCustPhone]       = useState("");
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [q, setQ]                       = useState("");

  const selectedProduct = products.find(p => p.id === productId) ?? products[0];
  const lineTotal       = (selectedProduct?.selling_price ?? 0) * Number(qty || 0);
  const lineProfit      = ((selectedProduct?.selling_price ?? 0) - (selectedProduct?.cost_price ?? 0)) * Number(qty || 0);
  const needsCustomer   = MOBILE_PAY.includes(payment) || payment === "Credit";

  const filtered = q
    ? sales.filter(s => s.product_name.toLowerCase().includes(q.toLowerCase()) ||
        (s.customer_name ?? "").toLowerCase().includes(q.toLowerCase()))
    : sales;

  async function handleSave() {
    if (!selectedProduct) return;
    if (needsCustomer && !custName.trim()) { setError("Customer name required for " + payment); return; }
    setError(null); setSaving(true);
    try {
      await recordSale({
        productId:     selectedProduct.id,
        qty:           Number(qty),
        payment,
        status:        payment === "Credit" ? "Not paid" : "Paid",
        customerName:  custName.trim() || undefined,
        customerPhone: custPhone.trim() || undefined,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModal(false);
      setQty("1"); setCustName(""); setCustPhone(""); setError(null);
      refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const totalRevenue = sales.reduce((a, s) => a + s.total, 0);
  const totalProfit  = sales.reduce((a, s) => a + (s.profit ?? 0), 0);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Sales</Text>
          <Text style={s.sub}>{sales.length} transactions recorded</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => { setModal(true); setError(null); }}>
          <Ionicons name="add" size={20} color={C.navy900} />
          <Text style={s.addBtnText}>New sale</Text>
        </TouchableOpacity>
      </View>

      {/* Summary pills */}
      <View style={s.pills}>
        <View style={[s.pill, { backgroundColor: C.surface }]}>
          <Text style={s.pillLabel}>Revenue</Text>
          <Text style={s.pillValue}>{money(totalRevenue)}</Text>
        </View>
        <View style={[s.pill, { backgroundColor: C.successBg }]}>
          <Text style={[s.pillLabel, { color: C.success }]}>Profit</Text>
          <Text style={[s.pillValue, { color: C.success }]}>{money(totalProfit)}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchBar}>
        <Ionicons name="search-outline" size={17} color={C.textMuted} />
        <TextInput
          value={q} onChangeText={setQ}
          placeholder="Search product or customer…"
          placeholderTextColor={C.textMuted}
          style={s.searchInput}
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={C.gold500} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListEmptyComponent={<EmptyState icon="🧾" title="No sales yet" sub="Tap + New sale to record your first transaction." />}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.border, marginHorizontal: 4 }} />}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowName}>{item.product_name}</Text>
              <Text style={s.rowMeta}>
                {item.qty} units · {item.payment}
                {item.customer_name ? ` · ${item.customer_name}` : ""}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.rowTotal}>{money(item.total)}</Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                <Badge label={item.status} variant={item.status === "Paid" ? "ok" : item.status === "Returned" ? "err" : "warn"} />
                {(item.profit ?? 0) > 0 && (
                  <Text style={{ fontSize: 11, color: C.success, fontWeight: "600" }}>+{money(item.profit ?? 0)}</Text>
                )}
              </View>
            </View>
          </View>
        )}
      />

      {/* New sale modal */}
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <SafeAreaView style={m.sheet} edges={["top", "bottom"]}>
            <View style={m.handle} />
            <View style={m.mHeader}>
              <Text style={m.mTitle}>Record a sale</Text>
              <TouchableOpacity onPress={() => setModal(false)} style={m.closeBtn}>
                <Ionicons name="close" size={22} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={m.body} keyboardShouldPersistTaps="handled">
              {error && <View style={m.error}><Text style={m.errorText}>{error}</Text></View>}

              {products.length === 0 ? (
                <View style={m.warning}><Text style={{ color: C.warning, fontSize: 13 }}>No products found. Add products in Inventory first.</Text></View>
              ) : (
                <>
                  {/* Product picker */}
                  <Text style={m.label}>Product</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                    {products.map(p => (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => setProductId(p.id)}
                        style={[m.productChip, productId === p.id && m.productChipActive]}
                      >
                        <Text style={[m.productChipText, productId === p.id && m.productChipTextActive]} numberOfLines={1}>
                          {p.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: productId === p.id ? "rgba(255,255,255,0.7)" : C.textMuted }}>
                          {money(p.selling_price ?? p.price)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Input label="Quantity" value={qty} onChangeText={setQty} keyboardType="numeric" placeholder="1" />

                  {/* Payment method */}
                  <Text style={m.label}>Payment method</Text>
                  <View style={m.paymentGrid}>
                    {PAYMENT_METHODS.map(pm => (
                      <TouchableOpacity
                        key={pm}
                        onPress={() => setPayment(pm)}
                        style={[m.payBtn, payment === pm && m.payBtnActive]}
                      >
                        <Text style={[m.payBtnText, payment === pm && m.payBtnTextActive]}>{pm}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Customer fields */}
                  {needsCustomer && (
                    <View style={m.customerBox}>
                      <Text style={m.customerTitle}>
                        {payment === "Credit" ? "Record customer for debt tracking" : `${payment} — customer details required`}
                      </Text>
                      <Input label="Customer name" value={custName} onChangeText={setCustName} placeholder="Full name" />
                      <Input label="Phone (optional)" value={custPhone} onChangeText={setCustPhone} placeholder="+255 7•• ••• •••" keyboardType="phone-pad" />
                    </View>
                  )}

                  {/* Total preview */}
                  <View style={m.totalBox}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={m.totalLabel}>Total</Text>
                      <Text style={m.totalValue}>{money(lineTotal)}</Text>
                    </View>
                    {(selectedProduct?.cost_price ?? 0) > 0 && (
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                        <Text style={{ fontSize: 12, color: C.textMuted }}>Profit on this sale</Text>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: lineProfit >= 0 ? C.success : C.danger }}>
                          {lineProfit >= 0 ? "+" : ""}{money(lineProfit)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <GoldButton label="Save sale" onPress={handleSave} loading={saving} />
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  title:       { fontSize: 20, fontWeight: "700", color: C.textPrimary },
  sub:         { fontSize: 12, color: C.textMuted, marginTop: 2 },
  addBtn:      { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.gold500, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9 },
  addBtnText:  { fontSize: 14, fontWeight: "600", color: C.navy900 },
  pills:       { flexDirection: "row", gap: 10, padding: 12, paddingTop: 10 },
  pill:        { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  pillLabel:   { fontSize: 11, color: C.textMuted, fontWeight: "500" },
  pillValue:   { fontSize: 15, fontWeight: "700", color: C.textPrimary, marginTop: 3 },
  searchBar:   { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 12, marginBottom: 4, backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, height: 42, fontSize: 14, color: C.textPrimary },
  row:         { flexDirection: "row", alignItems: "center", paddingVertical: 13, backgroundColor: C.surface, paddingHorizontal: 16 },
  rowName:     { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  rowMeta:     { fontSize: 12, color: C.textMuted, marginTop: 2 },
  rowTotal:    { fontSize: 14, fontWeight: "700", color: C.textPrimary },
});
const m = StyleSheet.create({
  sheet:       { flex: 1, backgroundColor: C.surface },
  handle:      { width: 36, height: 4, backgroundColor: C.border, borderRadius: 99, alignSelf: "center", marginTop: 10 },
  mHeader:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  mTitle:      { fontSize: 18, fontWeight: "700", color: C.textPrimary },
  closeBtn:    { padding: 4 },
  body:        { padding: 16, paddingBottom: 48 },
  label:       { fontSize: 13, fontWeight: "600", color: C.textPrimary, marginBottom: 8 },
  error:       { backgroundColor: C.dangerBg, borderRadius: 8, padding: 12, marginBottom: 14 },
  errorText:   { color: C.danger, fontSize: 13 },
  warning:     { backgroundColor: C.warningBg, borderRadius: 8, padding: 12, marginBottom: 14 },
  productChip: { backgroundColor: C.bg, borderRadius: 10, padding: 12, marginRight: 8, minWidth: 120, borderWidth: 1, borderColor: C.border },
  productChipActive: { backgroundColor: C.navy700, borderColor: C.navy700 },
  productChipText:   { fontSize: 13, fontWeight: "600", color: C.textPrimary, marginBottom: 3 },
  productChipTextActive: { color: "#fff" },
  paymentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  payBtn:      { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  payBtnActive:{ backgroundColor: C.navy700, borderColor: C.navy700 },
  payBtnText:  { fontSize: 13, fontWeight: "500", color: C.textSecondary },
  payBtnTextActive: { color: "#fff", fontWeight: "600" },
  customerBox: { backgroundColor: C.gold100, borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: C.gold300 },
  customerTitle: { fontSize: 12, fontWeight: "600", color: C.gold500, marginBottom: 12 },
  totalBox:    { backgroundColor: C.gold100, borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.gold300 },
  totalLabel:  { fontSize: 14, fontWeight: "600", color: C.navy700 },
  totalValue:  { fontSize: 18, fontWeight: "700", color: C.navy700 },
});
