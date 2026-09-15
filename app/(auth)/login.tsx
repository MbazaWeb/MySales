import { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter }      from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase }       from "@/lib/supabase/client";
import { useAppCtx }      from "@/lib/context";
import { C }              from "@/lib/colors";
import { Input, GoldButton } from "@/components/UI";
import { LocationPicker } from "@/components/LocationPicker";

type Mode       = "login" | "register";
type LoginField = "email" | "phone";

const BIZ_TYPES = ["Bar", "Grocery", "Mini-market", "Retail shop", "Other"];

export default function AuthScreen() {
  const router      = useRouter();
  const { refresh } = useAppCtx();

  const [mode,      setMode]      = useState<Mode>("login");
  const [step,      setStep]      = useState(1);
  const [field,     setField]     = useState<LoginField>("email");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [fullName,  setFullName]  = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Business details (step 2)
  const [bizName,   setBizName]   = useState("");
  const [bizType,   setBizType]   = useState("Bar");
  const [location,  setLocation]  = useState({ region: "", district: "", ward: "" });

  const identifier = field === "email" ? email.trim() : phone.trim();

  function switchMode(m: Mode) {
    setMode(m); setStep(1); setError(null);
    setPassword(""); setConfirmPw("");
  }

  // ── Step 1: personal details validation ──────────────────────────────────
  function handleStep1(e?: any) {
    setError(null);
    if (!fullName.trim())     { setError("Enter your full name."); return; }
    if (!identifier)          { setError(field === "email" ? "Enter your email address." : "Enter your phone number."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPw) { setError("Passwords do not match."); return; }
    setStep(2);
  }

  // ── Step 2: submit registration ───────────────────────────────────────────
  async function handleRegister() {
    setError(null);
    if (!bizName.trim())      { setError("Enter your business name."); return; }
    if (!location.region)     { setError("Select your region."); return; }
    if (!location.district)   { setError("Select your district."); return; }

    const locationStr = [location.ward, location.district, location.region, "Tanzania"]
      .filter(Boolean).join(", ");

    setLoading(true);
    try {
      const meta = {
        full_name:         fullName.trim(),
        business_name:     bizName.trim(),
        business_type:     bizType,
        branch_name:       bizName.trim(),
        business_location: locationStr,
      };

      const { error: err } = field === "email"
        ? await supabase.auth.signUp({ email: identifier, password, options: { data: meta } })
        : await supabase.auth.signUp({ phone: identifier, password, options: { data: meta } });

      if (err) throw new Error(err.message);
      await refresh();
      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async function handleLogin() {
    setError(null);
    if (!identifier) { setError(field === "email" ? "Enter your email." : "Enter your phone."); return; }
    if (!password)   { setError("Enter your password."); return; }
    setLoading(true);
    try {
      const { error: err } = field === "email"
        ? await supabase.auth.signInWithPassword({ email: identifier, password })
        : await supabase.auth.signInWithPassword({ phone: identifier, password });
      if (err) throw new Error(err.message);
      await refresh();
      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <LinearGradient colors={[C.navy900, "#162844"]} style={s.hero}>
        <View style={s.logoWrap}>
          <Text style={s.logoText}>DV</Text>
        </View>
        <Text style={s.wordmark}>DukaVerse</Text>
        <Text style={s.tagline}>Business platform</Text>
      </LinearGradient>

      <ScrollView style={s.sheet} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

        {/* Tabs */}
        <View style={s.tabs}>
          {(["login", "register"] as Mode[]).map(m => (
            <TouchableOpacity key={m} onPress={() => switchMode(m)}
              style={[s.tab, mode === m && s.tabActive]}>
              <Text style={[s.tabText, mode === m && s.tabTextActive]}>
                {m === "login" ? "Sign in" : "Create account"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Step indicator for register */}
        {mode === "register" && (
          <View style={s.stepRow}>
            {[1, 2].map(n => (
              <View key={n} style={[s.stepDot, step >= n && s.stepDotActive]}>
                <Text style={[s.stepNum, step >= n && s.stepNumActive]}>{n}</Text>
              </View>
            ))}
            <View style={[s.stepLine, step >= 2 && s.stepLineActive]} />
          </View>
        )}

        <Text style={s.heading}>
          {mode === "login" ? "Welcome back"
            : step === 1 ? "Your account details"
            : "Your business details"}
        </Text>

        {/* Error */}
        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* ── LOGIN ── */}
        {mode === "login" && (
          <>
            <FieldToggle value={field} onChange={f => { setField(f); setEmail(""); setPhone(""); }} />
            {field === "email"
              ? <Input label="Email address" value={email} onChangeText={setEmail}
                  placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
              : <Input label="Phone number" value={phone} onChangeText={setPhone}
                  placeholder="+255 7xx xxx xxx" keyboardType="phone-pad" autoCapitalize="none" />
            }
            <PwField label="Password" value={password} onChange={setPassword}
              show={showPw} onToggle={() => setShowPw(!showPw)} placeholder="Your password" />
            <GoldButton label="Sign in" onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />
          </>
        )}

        {/* ── REGISTER STEP 1 ── */}
        {mode === "register" && step === 1 && (
          <>
            <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="e.g. David Mbazza" />
            <FieldToggle value={field} onChange={f => { setField(f); setEmail(""); setPhone(""); }} />
            {field === "email"
              ? <Input label="Email address" value={email} onChangeText={setEmail}
                  placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
              : <Input label="Phone number" value={phone} onChangeText={setPhone}
                  placeholder="+255 7xx xxx xxx" keyboardType="phone-pad" autoCapitalize="none" />
            }
            <PwField label="Password" value={password} onChange={setPassword}
              show={showPw} onToggle={() => setShowPw(!showPw)}
              placeholder="At least 8 characters" hint="Minimum 8 characters" />
            <PwField label="Confirm password" value={confirmPw} onChange={setConfirmPw}
              show={showPw} onToggle={() => setShowPw(!showPw)} placeholder="Re-enter password" />
            <GoldButton label="Continue" onPress={handleStep1} style={{ marginTop: 8 }} />
          </>
        )}

        {/* ── REGISTER STEP 2 ── */}
        {mode === "register" && step === 2 && (
          <>
            {/* Business name */}
            <Input label="Business name" value={bizName} onChangeText={setBizName}
              placeholder="e.g. Safari Corner Bar" />

            {/* Business type */}
            <Text style={s.fieldLabel}>Business type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {BIZ_TYPES.map(t => (
                <TouchableOpacity key={t} onPress={() => setBizType(t)}
                  style={[s.typeChip, bizType === t && s.typeChipActive]}>
                  <Text style={[s.typeChipText, bizType === t && s.typeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Tanzania location cascade */}
            <Text style={s.fieldLabel}>Branch location</Text>
            <LocationPicker value={location} onChange={setLocation} />

            <GoldButton label="Create account & start trial" onPress={handleRegister}
              loading={loading} style={{ marginTop: 16 }} />
            <TouchableOpacity onPress={() => { setStep(1); setError(null); }}
              style={{ marginTop: 14, alignItems: "center" }}>
              <Text style={{ color: C.textMuted, fontSize: 13 }}>Back</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          </Text>
          <TouchableOpacity onPress={() => switchMode(mode === "login" ? "register" : "login")}>
            <Text style={{ color: C.gold500, fontSize: 13, fontWeight: "600" }}>
              {mode === "login" ? "Create one" : "Sign in"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldToggle({ value, onChange }: { value: LoginField; onChange: (v: LoginField) => void }) {
  return (
    <View style={s.fieldToggle}>
      {(["email", "phone"] as LoginField[]).map(f => (
        <TouchableOpacity key={f} onPress={() => onChange(f)}
          style={[s.fieldBtn, value === f && s.fieldBtnActive]}>
          <Text style={[s.fieldBtnText, value === f && s.fieldBtnTextActive]}>
            {f === "email" ? "Email" : "Phone"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function PwField({ label, value, onChange, show, onToggle, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder: string; hint?: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={s.inputLabel}>{label}</Text>
        <TouchableOpacity onPress={onToggle}>
          <Text style={{ fontSize: 12, color: C.gold500 }}>{show ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>
      <Input label="" value={value} onChangeText={onChange} placeholder={placeholder}
        secureTextEntry={!show} autoCapitalize="none" />
      {hint && <Text style={{ fontSize: 11, color: C.textMuted, marginTop: -8 }}>{hint}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  hero:        { paddingTop: 72, paddingBottom: 44, alignItems: "center" },
  logoWrap:    { width: 68, height: 68, borderRadius: 18, backgroundColor: C.gold500, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  logoText:    { fontSize: 22, fontWeight: "800", color: C.navy900 },
  wordmark:    { fontSize: 28, fontWeight: "700", color: "#fff", letterSpacing: -0.5 },
  tagline:     { fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4, letterSpacing: 1 },
  sheet:       { flex: 1, backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 },
  body:        { padding: 24, paddingBottom: 48 },
  tabs:        { flexDirection: "row", backgroundColor: C.bg, borderRadius: 10, padding: 4, marginBottom: 20 },
  tab:         { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 7 },
  tabActive:   { backgroundColor: C.surface, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText:     { fontSize: 13, fontWeight: "500", color: C.textMuted },
  tabTextActive:{ color: C.navy700, fontWeight: "600" },
  stepRow:     { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 8, position: "relative" },
  stepDot:     { width: 28, height: 28, borderRadius: 14, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: C.border, zIndex: 1 },
  stepDotActive:{ backgroundColor: C.navy700, borderColor: C.navy700 },
  stepNum:     { fontSize: 12, fontWeight: "700", color: C.textMuted },
  stepNumActive:{ color: "#fff" },
  stepLine:    { flex: 1, height: 2, backgroundColor: C.border, marginHorizontal: -4 },
  stepLineActive:{ backgroundColor: C.navy700 },
  heading:     { fontSize: 22, fontWeight: "700", color: C.textPrimary, marginBottom: 18 },
  errorBox:    { backgroundColor: C.dangerBg, borderRadius: 8, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: "#FECACA" },
  errorText:   { color: C.danger, fontSize: 13, lineHeight: 18 },
  fieldToggle: { flexDirection: "row", gap: 8, marginBottom: 14 },
  fieldBtn:    { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 9, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  fieldBtnActive:{ backgroundColor: C.navy700, borderColor: C.navy700 },
  fieldBtnText:  { fontSize: 13, fontWeight: "500", color: C.textSecondary },
  fieldBtnTextActive:{ color: "#fff", fontWeight: "600" },
  inputLabel:  { fontSize: 13, fontWeight: "600", color: C.textPrimary },
  fieldLabel:  { fontSize: 13, fontWeight: "600", color: C.textPrimary, marginBottom: 8 },
  typeChip:    { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, marginRight: 8 },
  typeChipActive:{ backgroundColor: C.navy700, borderColor: C.navy700 },
  typeChipText:  { fontSize: 13, fontWeight: "500", color: C.textSecondary },
  typeChipTextActive:{ color: "#fff", fontWeight: "600" },
  footer:      { marginTop: 24, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  footerText:  { fontSize: 13, color: C.textMuted },
});
