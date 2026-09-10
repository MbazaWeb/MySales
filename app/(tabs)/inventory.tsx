import { useState, useMemo } from "react";
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Modal, TextInput,
  RefreshControl, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons }     from "@expo/vector-icons";
import * as Haptics     from "expo-haptics";
import { useAppCtx }    from "@/lib/context";
import { useProducts }  from "@/lib/supabase/hooks";
import { addStock, money } from "@/lib/supabase/api";
import { supabase }     from "@/lib/supabase/client";
import { C }            from "@/lib/colors";
import { GoldButton, Input, EmptyState, Badge } from "@/components/UI";
import type { Product } from "@/lib/supabase/types";

const CATEGORIES = ["Beer","Cider","Wine","Spirits","Soft Drink","Water","Juice","Energy Drink","Snacks","Tobacco","Groceries","Dairy","Bread & Bakery","Meat & Fish","Household","Personal Care","Other"];
const UNITS = ["bottles","cans","packs","cartons","kg","litres","units","pieces","sachets"];

type ModalType = "add-stock" | "new-product" | null;

export default function InventoryScreen() {
  const { ctx }                          = useAppCtx();
  const { products, loading, refresh }   = useProducts(ctx?.branch.id ?? null);

  const [modal, setModal]    = useState<ModalType>(null);
  const [target, setTarget]  = useState<Product | null>(null);
  const [q, setQ]            = useState("");
  const [filter, setFilter]  = useState<"All" | "Low">("All");
  const [saving, setSaving]  = useState(false);
  const [error, setError]    = useState<string | null>(null);

  // Add stock form
  const [qty, setQty]   = useState("1");
  const [note, setNote] = useState("");

  // New product form
  const [np, setNp] = useState({ name:"", category:"Beer", unit:"bottles", stock:"", cost_price:"", selling_price:"", reorder:"10" });

  const rows = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(q.toLowerCase()) &&
      (filter === "All" || p.stock <= p.reorder)
    ), [products, q, filter]);

  const totalStockVal   = products.reduce((a,p) => a+p.stock*(p.cost_price??0), 0);
  const totalSellingVal = products.reduce((a,p) => a+p.stock*(p.selling_price??p.price), 0);
  const lowCount        = products.filter(p => p.stock <= p.reorder).length;

  async function handleAddStock() {
    if (!target) return;
    setError(null); setSaving(true);
    try {
      await addStock(target.id, Number(qty), note.trim() || undefined);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModal(null); setQty("1"); setNote(""); setTarget(null);
      refresh();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleNewProduct() {
    if (!ctx?.branch.id) return;
    const cost = Number(np.cost_price), sell = Number(np.selling_price);
    if (!np.name.trim()) { setError("Product name required"); return; }
    if (cost <= 0 || sell <= 0) { setError("Enter valid prices"); return; }
    if (sell < cost) { setError("Selling price must be ≥ cost price"); return; }
    setError(null); setSaving(true);
    try {
      const { error: err } = await supabase.from("products").insert({
        branch_id:     ctx.branch.id,
        name:          np.name.trim(),
        category:      np.category,
        unit:          np.unit,
        stock:         Number(np.stock || 0),
        cost_price:    cost,
        selling_price: sell,
        price:         sell,
        reorder:       Number(np.reorder || 10),
      } as any);
      if (err) throw new Error(err.message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModal(null);
      setNp({ name:"", category:"Beer", unit:"bottles", stock:"", cost_price:"", selling_price:"", reorder:"10" });
      refresh();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Inventory</Text>
          <Text style={s.sub}>{products.length} products · {products.reduce((a,p)=>a+p.stock,0)} units</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={s.ghostBtn} onPress={() => { setModal("new-product"); setError(null); }}>
            <Ionicons name="add" size={18} color={C.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.addBtn} onPress={() => { setModal("add-stock"); setError(null); }}>
            <Ionicons name="add" size={18} color={C.navy900} />
            <Text style={s.addBtnText}>Add stock</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary strip */}
      <View style={s.strip}>
        {[
          { label: "Cost value",  value: money(totalStockVal) },
          { label: "Sell value",  value: money(totalSellingVal), gold: true },
          { label: "Low stock",   value: String(lowCount), warn: lowCount > 0 },
        ].map(item => (
          <View key={item.label} style={s.stripItem}>
            <Text style={s.stripLabel}>{item.label}</Text>
            <Text style={[s.stripValue, item.gold ? { color: C.gold500 } : item.warn ? { color: C.warning } : {}]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>

      {/* Search + filter */}
      <View style={s.controls}>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={16} color={C.textMuted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search…" placeholderTextColor={C.textMuted} style={s.searchInput} />
        </View>
        <View style={s.filterGroup}>
          {(["All","Low"] as const).map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[s.filterBtn, filter === f && s.filterBtnActive]}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f === "Low" ? "Low stock" : "All"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={C.gold500} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        ListEmptyComponent={<EmptyState icon="📦" title="No products yet" sub="Tap + to add your first product." />}
        renderItem={({ item: p }) => {
          const low    = p.stock <= p.reorder;
          const profit = (p.selling_price ?? p.price) - (p.cost_price ?? 0);
          const margin = p.selling_price > 0 ? Math.round((profit / p.selling_price) * 100) : 0;
          return (
            <View style={[s.card, low && { borderColor: "#FDE68A" }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardName} numberOfLines={1}>{p.name}</Text>
                  <Text style={s.cardMeta}>{p.category} · {p.unit}</Text>
                </View>
                <Badge label={low ? "Low" : "OK"} variant={low ? "warn" : "ok"} />
              </View>

              <View style={s.cardRow}>
                <View style={s.cardStat}>
                  <Text style={s.cardStatLabel}>Stock</Text>
                  <Text style={[s.cardStatValue, { color: low ? C.warning : C.textPrimary }]}>{p.stock}</Text>
                </View>
                <View style={s.cardStat}>
                  <Text style={s.cardStatLabel}>Cost</Text>
                  <Text style={s.cardStatValue}>{money(p.cost_price ?? 0)}</Text>
                </View>
                <View style={s.cardStat}>
                  <Text style={s.cardStatLabel}>Selling</Text>
                  <Text style={s.cardStatValue}>{money(p.selling_price ?? p.price)}</Text>
                </View>
                <View style={s.cardStat}>
                  <Text style={s.cardStatLabel}>Profit</Text>
                  <Text style={[s.cardStatValue, { color: profit >= 0 ? C.success : C.danger }]}>
                    {profit >= 0 ? "+" : ""}{money(profit)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={s.stockBtn}
                onPress={() => { setTarget(p); setModal("add-stock"); setError(null); }}
              >
                <Text style={s.stockBtnText}>+ Add stock</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Add stock modal */}
      <Modal visible={modal === "add-stock"} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(null)}>
        <SafeAreaView style={m.sheet} edges={["top","bottom"]}>
          <View style={m.handle} />
          <View style={m.mHeader}>
            <Text style={m.mTitle}>Add stock</Text>
            <TouchableOpacity onPress={() => setModal(null)} style={m.closeBtn}><Ionicons name="close" size={22} color={C.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={m.body}>
            {error && <View style={m.error}><Text style={m.errorText}>{error}</Text></View>}

            <Text style={m.label}>Product</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {products.map(p => (
                <TouchableOpacity key={p.id} onPress={() => setTarget(p)}
                  style={[m.chip, target?.id === p.id && m.chipActive]}>
                  <Text style={[m.chipText, target?.id === p.id && m.chipTextActive]} numberOfLines={1}>{p.name}</Text>
                  <Text style={{ fontSize: 11, color: target?.id === p.id ? "rgba(255,255,255,0.6)" : C.textMuted }}>{p.stock} in stock</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Input label="Quantity received" value={qty} onChangeText={setQty} keyboardType="numeric" placeholder="e.g. 24" />
            <Input label="Note (optional)" value={note} onChangeText={setNote} placeholder="Supplier or delivery reference" />
            <GoldButton label="Save stock addition" onPress={handleAddStock} loading={saving} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* New product modal */}
      <Modal visible={modal === "new-product"} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <SafeAreaView style={m.sheet} edges={["top","bottom"]}>
            <View style={m.handle} />
            <View style={m.mHeader}>
              <Text style={m.mTitle}>New product</Text>
              <TouchableOpacity onPress={() => setModal(null)} style={m.closeBtn}><Ionicons name="close" size={22} color={C.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={m.body} keyboardShouldPersistTaps="handled">
              {error && <View style={m.error}><Text style={m.errorText}>{error}</Text></View>}

              <Input label="Product name" value={np.name} onChangeText={v => setNp(n => ({...n, name:v}))} placeholder="e.g. Kilimanjaro Lager KB" />

              <Text style={m.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c} onPress={() => setNp(n => ({...n, category:c}))}
                    style={[m.chip, np.category === c && m.chipActive]}>
                    <Text style={[m.chipText, np.category === c && m.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={m.label}>Unit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {UNITS.map(u => (
                  <TouchableOpacity key={u} onPress={() => setNp(n => ({...n, unit:u}))}
                    style={[m.chip, np.unit === u && m.chipActive]}>
                    <Text style={[m.chipText, np.unit === u && m.chipTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Input label="Opening stock" value={np.stock} onChangeText={v => setNp(n=>({...n,stock:v}))} keyboardType="numeric" placeholder="0" />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="Reorder at" value={np.reorder} onChangeText={v => setNp(n=>({...n,reorder:v}))} keyboardType="numeric" placeholder="10" />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Input label="Cost price (TZS)" value={np.cost_price} onChangeText={v => setNp(n=>({...n,cost_price:v}))} keyboardType="numeric" placeholder="Buying price" />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="Selling price (TZS)" value={np.selling_price} onChangeText={v => setNp(n=>({...n,selling_price:v}))} keyboardType="numeric" placeholder="Customer price" />
                </View>
              </View>

              {Number(np.cost_price) > 0 && Number(np.selling_price) > 0 && (
                <View style={m.profitPreview}>
                  <Text style={{ fontSize: 12, color: C.navy700 }}>Profit per unit</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: Number(np.selling_price) >= Number(np.cost_price) ? C.success : C.danger }}>
                    {money(Number(np.selling_price) - Number(np.cost_price))}
                  </Text>
                </View>
              )}

              <GoldButton label="Create product" onPress={handleNewProduct} loading={saving} />
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
  addBtn:      { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.gold500, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText:  { fontSize: 13, fontWeight: "600", color: C.navy900 },
  ghostBtn:    { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  strip:       { flexDirection: "row", backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  stripItem:   { flex: 1, padding: 12, alignItems: "center" },
  stripLabel:  { fontSize: 10, color: C.textMuted, fontWeight: "500" },
  stripValue:  { fontSize: 13, fontWeight: "700", color: C.textPrimary, marginTop: 2 },
  controls:    { flexDirection: "row", gap: 8, padding: 12, paddingBottom: 4 },
  searchBar:   { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.surface, borderRadius: 9, paddingHorizontal: 10, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, height: 38, fontSize: 13, color: C.textPrimary },
  filterGroup: { flexDirection: "row", gap: 4 },
  filterBtn:   { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  filterBtnActive: { backgroundColor: C.navy700, borderColor: C.navy700 },
  filterText:  { fontSize: 12, color: C.textSecondary, fontWeight: "500" },
  filterTextActive: { color: "#fff", fontWeight: "600" },
  card:        { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  cardName:    { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  cardMeta:    { fontSize: 11, color: C.textMuted, marginTop: 2 },
  cardRow:     { flexDirection: "row", marginTop: 12, gap: 4 },
  cardStat:    { flex: 1, alignItems: "center" },
  cardStatLabel: { fontSize: 9, color: C.textMuted, fontWeight: "500", textTransform: "uppercase" },
  cardStatValue: { fontSize: 12, fontWeight: "700", color: C.textPrimary, marginTop: 2 },
  stockBtn:    { marginTop: 12, backgroundColor: C.gold100, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  stockBtnText: { fontSize: 12, fontWeight: "600", color: C.navy700 },
});
const m = StyleSheet.create({
  sheet:    { flex: 1, backgroundColor: C.surface },
  handle:   { width: 36, height: 4, backgroundColor: C.border, borderRadius: 99, alignSelf: "center", marginTop: 10 },
  mHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  mTitle:   { fontSize: 18, fontWeight: "700", color: C.textPrimary },
  closeBtn: { padding: 4 },
  body:     { padding: 16, paddingBottom: 48 },
  label:    { fontSize: 13, fontWeight: "600", color: C.textPrimary, marginBottom: 8 },
  error:    { backgroundColor: C.dangerBg, borderRadius: 8, padding: 12, marginBottom: 14 },
  errorText:{ color: C.danger, fontSize: 13 },
  chip:     { backgroundColor: C.bg, borderRadius: 9, padding: 10, marginRight: 8, minWidth: 100, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.navy700, borderColor: C.navy700 },
  chipText: { fontSize: 13, fontWeight: "600", color: C.textPrimary, marginBottom: 2 },
  chipTextActive: { color: "#fff" },
  profitPreview: { backgroundColor: C.gold100, borderRadius: 10, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderWidth: 1, borderColor: C.gold300 },
});
