/**
 * Core UI primitives — styled consistently with the DukaVerse design system
 */
import {
  View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, ViewStyle, TextStyle,
} from "react-native";
import { C } from "@/lib/colors";

// ── Stat card ─────────────────────────────────────────────────────────────────
export function StatCard({
  label, value, sub, accent, warn, ok,
}: {
  label: string; value: string; sub?: string;
  accent?: boolean; warn?: boolean; ok?: boolean;
}) {
  const bg   = accent ? C.navy700 : warn ? C.warningBg : ok ? C.successBg : C.surface;
  const valC = accent ? "#fff"    : warn ? C.warning   : ok ? C.success   : C.textPrimary;
  const lblC = accent ? "rgba(255,255,255,0.6)" : C.textMuted;

  return (
    <View style={[s.statCard, { backgroundColor: bg, borderColor: accent ? C.navy500 : warn ? "#FDE68A" : C.borderGold }]}>
      <Text style={[s.statLabel, { color: lblC }]}>{label}</Text>
      <Text style={[s.statValue, { color: valC }]}>{value}</Text>
      {sub && <Text style={[s.statSub, { color: lblC }]}>{sub}</Text>}
    </View>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

// ── Gold button ───────────────────────────────────────────────────────────────
export function GoldButton({
  label, onPress, loading, danger, ghost, style,
}: {
  label: string; onPress: () => void; loading?: boolean;
  danger?: boolean; ghost?: boolean; style?: ViewStyle;
}) {
  const bg = ghost ? "transparent" : danger ? C.danger : C.gold500;
  const tc = ghost ? C.textSecondary : danger ? "#fff" : C.navy900;
  const border = ghost ? { borderWidth: 1, borderColor: C.border } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      style={[s.btn, { backgroundColor: bg, opacity: loading ? 0.7 : 1 }, border, style]}
    >
      {loading
        ? <ActivityIndicator color={danger ? "#fff" : C.navy900} size="small" />
        : <Text style={[s.btnText, { color: tc }]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({
  label, value, onChangeText, placeholder,
  keyboardType, secureTextEntry, autoCapitalize,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words";
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label && <Text style={s.inputLabel}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        keyboardType={keyboardType ?? "default"}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? "sentences"}
        style={s.input}
      />
    </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={s.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ label, variant }: { label: string; variant: "ok" | "warn" | "err" | "info" }) {
  const map = {
    ok:   { bg: C.successBg, tc: C.success },
    warn: { bg: C.warningBg, tc: C.warning },
    err:  { bg: C.dangerBg,  tc: C.danger  },
    info: { bg: "#EFF6FF",   tc: "#1D4ED8" },
  };
  const { bg, tc } = map[variant];
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color: tc }]}>{label}</Text>
    </View>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>{icon}</Text>
      <Text style={s.emptyTitle}>{title}</Text>
      {sub && <Text style={s.emptySub}>{sub}</Text>}
    </View>
  );
}

// ── Row separator ─────────────────────────────────────────────────────────────
export function Separator() {
  return <View style={{ height: 1, backgroundColor: C.border }} />;
}

// ── Screen title ──────────────────────────────────────────────────────────────
export function ScreenTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.screenTitle}>{title}</Text>
      {sub && <Text style={s.screenSub}>{sub}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  statCard:   { borderRadius: 12, padding: 16, borderWidth: 1, flex: 1, minWidth: 140 },
  statLabel:  { fontSize: 11, fontWeight: "500", marginBottom: 6 },
  statValue:  { fontSize: 22, fontWeight: "700", letterSpacing: -0.5 },
  statSub:    { fontSize: 11, marginTop: 3 },

  card:       { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16 },

  btn:        { height: 48, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  btnText:    { fontSize: 15, fontWeight: "600" },

  inputLabel: { fontSize: 13, fontWeight: "600", color: C.textPrimary, marginBottom: 6 },
  input:      { height: 48, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, fontSize: 15, color: C.textPrimary, backgroundColor: C.surface },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle:  { fontSize: 16, fontWeight: "600", color: C.textPrimary },
  sectionAction: { fontSize: 13, fontWeight: "600", color: C.gold500 },

  badge:     { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "600" },

  empty:      { alignItems: "center", paddingVertical: 48 },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: C.textPrimary, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: C.textMuted, textAlign: "center" },

  screenTitle: { fontSize: 22, fontWeight: "700", color: C.textPrimary, letterSpacing: -0.3 },
  screenSub:   { fontSize: 13, color: C.textMuted, marginTop: 3 },
});
