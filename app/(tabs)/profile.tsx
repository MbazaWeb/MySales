import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView }  from "react-native-safe-area-context";
import { Ionicons }      from "@expo/vector-icons";
import { useRouter }     from "expo-router";
import { useAppCtx }     from "@/lib/context";
import { signOut, getBranches } from "@/lib/supabase/api";
import { C }             from "@/lib/colors";
import { Card, SectionHeader } from "@/components/UI";

const PLANS = [
  { key: "monthly",   label: "Monthly",   price: "TZS 15,000", note: "/ month"    },
  { key: "quarterly", label: "3 months",  price: "TZS 40,000", note: "save 11%"   },
  { key: "biannual",  label: "6 months",  price: "TZS 75,000", note: "save 17%"   },
  { key: "yearly",    label: "Yearly",    price: "TZS 140,000", note: "best value", best: true },
];

export default function ProfileScreen() {
  const { ctx, refresh } = useAppCtx();
  const router           = useRouter();
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const fullName = ctx?.user.user_metadata?.full_name as string ?? ctx?.user.email ?? "—";
  const email    = ctx?.user.email ?? "—";
  const initials = fullName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    if (ctx?.biz.id) {
      getBranches(ctx.biz.id).then(setBranches);
    }
  }, [ctx?.biz.id]);

  const trialEndsAt = ctx?.biz.trial_ends_at ? new Date(ctx.biz.trial_ends_at) : null;
  const daysLeft    = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)) : 0;
  const onTrial     = daysLeft > 0;

  async function handleSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          await refresh();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  function handleSubscribe() {
    if (!selectedPlan) { Alert.alert("Select a plan", "Please select a subscription plan."); return; }
    Alert.alert(
      "Subscribe",
      `You selected the ${PLANS.find(p => p.key === selectedPlan)?.label} plan.\n\nOpen DukaVerse on the web to complete payment via Pesapal.\n\nmy-sales-flax.vercel.app`,
      [{ text: "OK" }]
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Owner card */}
        <View style={s.ownerCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.ownerName}>{fullName}</Text>
            <Text style={s.ownerEmail}>{email}</Text>
            <Text style={s.ownerRole}>Owner · {ctx?.biz.name}</Text>
          </View>
          {onTrial && (
            <View style={s.trialBadge}>
              <Text style={s.trialText}>Trial</Text>
              <Text style={s.trialDays}>{daysLeft}d left</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: "Branches", value: String(branches.length) },
            { label: "Role",     value: ctx?.role ?? "Owner"    },
            { label: "Plan",     value: onTrial ? "Trial" : "Active" },
          ].map(item => (
            <View key={item.label} style={s.statItem}>
              <Text style={s.statValue}>{item.value}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Branches */}
        <Card style={{ marginTop: 16 }}>
          <SectionHeader title="Branches" />
          {branches.length === 0 ? (
            <Text style={{ fontSize: 13, color: C.textMuted }}>No branches yet.</Text>
          ) : (
            branches.map((b, i) => (
              <View key={b.id} style={[s.branchRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
                <View style={s.branchIcon}>
                  <Ionicons name="business-outline" size={16} color={C.gold500} />
                </View>
                <View>
                  <Text style={s.branchName}>{b.name}</Text>
                  <Text style={s.branchLoc}>{b.location}</Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Subscription plans */}
        <Card style={{ marginTop: 14 }}>
          <SectionHeader title="Subscription" />
          <View style={s.plansGrid}>
            {PLANS.map(p => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setSelectedPlan(p.key)}
                style={[s.planCard,
                  selectedPlan === p.key && s.planCardSelected,
                  p.best && !selectedPlan && s.planCardBest,
                ]}
              >
                <Text style={[s.planLabel, selectedPlan === p.key && { color: "#fff" }]}>{p.label}</Text>
                <Text style={[s.planPrice, selectedPlan === p.key && { color: "#fff" }]}>{p.price}</Text>
                <Text style={[s.planNote, selectedPlan === p.key && { color: "rgba(255,255,255,0.6)" }, p.best && !selectedPlan && { color: C.gold500 }]}>
                  {p.note}
                </Text>
                {(p.best && !selectedPlan) && <Text style={s.bestTag}>⭐ Recommended</Text>}
                {selectedPlan === p.key && <Text style={{ fontSize: 11, color: C.gold300, marginTop: 4 }}>✓ Selected</Text>}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={handleSubscribe} style={[s.subscribeBtn, !selectedPlan && { opacity: 0.5 }]}>
            <Text style={s.subscribeBtnText}>
              {selectedPlan ? `Subscribe — ${PLANS.find(p=>p.key===selectedPlan)?.price}` : "Select a plan"}
            </Text>
          </TouchableOpacity>
          <Text style={s.pesapalNote}>Payments via Pesapal · M-Pesa, Airtel Money, Tigo Pesa, card</Text>
        </Card>

        {/* Sign out */}
        <TouchableOpacity onPress={handleSignOut} style={s.signOutBtn}>
          <Ionicons name="log-out-outline" size={18} color={C.danger} />
          <Text style={s.signOutText}>Sign out</Text>
        </TouchableOpacity>

        {/* App version */}
        <Text style={s.version}>DukaVerse Mobile v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  scroll:      { padding: 16, paddingBottom: 48 },
  ownerCard:   { backgroundColor: C.navy700, borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", gap: 14 },
  avatar:      { width: 52, height: 52, borderRadius: 26, backgroundColor: C.gold500, alignItems: "center", justifyContent: "center" },
  avatarText:  { fontSize: 18, fontWeight: "800", color: C.navy900 },
  ownerName:   { fontSize: 16, fontWeight: "700", color: "#fff" },
  ownerEmail:  { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  ownerRole:   { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 },
  trialBadge:  { backgroundColor: "rgba(201,168,76,0.2)", borderRadius: 10, padding: 8, alignItems: "center", borderWidth: 1, borderColor: "rgba(201,168,76,0.3)" },
  trialText:   { fontSize: 11, fontWeight: "700", color: C.gold500 },
  trialDays:   { fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  statsRow:    { flexDirection: "row", backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginTop: 12 },
  statItem:    { flex: 1, alignItems: "center", paddingVertical: 14 },
  statValue:   { fontSize: 15, fontWeight: "700", color: C.textPrimary },
  statLabel:   { fontSize: 11, color: C.textMuted, marginTop: 3 },
  branchRow:   { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  branchIcon:  { width: 34, height: 34, borderRadius: 9, backgroundColor: C.gold100, alignItems: "center", justifyContent: "center" },
  branchName:  { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  branchLoc:   { fontSize: 12, color: C.textMuted, marginTop: 2 },
  plansGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  planCard:    { width: "47.5%", backgroundColor: C.bg, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border },
  planCardSelected: { backgroundColor: C.navy700, borderColor: C.navy700 },
  planCardBest: { borderColor: C.gold500, borderWidth: 2 },
  planLabel:   { fontSize: 11, fontWeight: "600", color: C.textMuted },
  planPrice:   { fontSize: 14, fontWeight: "700", color: C.textPrimary, marginTop: 4 },
  planNote:    { fontSize: 11, color: C.textMuted, marginTop: 2 },
  bestTag:     { fontSize: 10, color: C.gold500, fontWeight: "700", marginTop: 6 },
  subscribeBtn:{ backgroundColor: C.gold500, borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  subscribeBtnText: { fontSize: 14, fontWeight: "700", color: C.navy900 },
  pesapalNote: { fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: 8 },
  signOutBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20, padding: 14, backgroundColor: C.dangerBg, borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  signOutText: { fontSize: 14, fontWeight: "600", color: C.danger },
  version:     { textAlign: "center", fontSize: 11, color: C.textMuted, marginTop: 16 },
});
