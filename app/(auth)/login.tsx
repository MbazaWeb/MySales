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

type Mode = "login" | "register";
type LoginField = "email" | "phone";

export default function AuthScreen() {
  const router      = useRouter();
  const { refresh } = useAppCtx();

  const [mode,      setMode]      = useState<Mode>("login");
  const [field,     setField]     = useState<LoginField>("email");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [fullName,  setFullName]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [showPw,    setShowPw]    = useState(false);

  // Derive the identifier being used
  const identifier = field === "email" ? email.trim() : phone.trim();

  async function handleSubmit() {
    setError(null);

    // Validation
    if (!identifier) {
      setError(field === "email" ? "Enter your email address." : "Enter your phone number.");
      return;
    }
    if (!password) { setError("Enter your password."); return; }
    if (mode === "register") {
      if (!fullName.trim()) { setError("Enter your full name."); return; }
      if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (password !== confirmPw) { setError("Passwords do not match."); return; }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email:    field === "email" ? identifier : undefined as any,
          phone:    field === "phone" ? identifier : undefined as any,
          password,
        });
        if (err) throw new Error(err.message);
      } else {
        // Register
        const { error: err } = await supabase.auth.signUp({
          email:    field === "email" ? identifier : undefined as any,
          phone:    field === "phone" ? identifier : undefined as any,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone:     field === "phone" ? identifier : undefined,
            },
          },
        });
        if (err) throw new Error(err.message);
      }

      await refresh();
      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setPassword("");
    setConfirmPw("");
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Hero */}
      <LinearGradient colors={[C.navy900, "#162844"]} style={s.hero}>
        <View style={s.logoWrap}>
          <Text style={s.logoGem}>◆</Text>
        </View>
        <Text style={s.wordmark}>DukaVerse</Text>
        <Text style={s.tagline}>Business platform</Text>
      </LinearGradient>

      <ScrollView
        style={s.sheet}
        contentContainerStyle={s.sheetContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Sign in / Register tabs */}
        <View style={s.tabs}>
          {(["login", "register"] as Mode[]).map(m => (
            <TouchableOpacity
              key={m}
              onPress={() => switchMode(m)}
              style={[s.tab, mode === m && s.tabActive]}
            >
              <Text style={[s.tabText, mode === m && s.tabTextActive]}>
                {m === "login" ? "Sign in" : "Create account"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.heading}>
          {mode === "login" ? "Welcome back" : "Start your free trial"}
        </Text>
        <Text style={s.subheading}>
          {mode === "login"
            ? "Sign in to continue managing your business."
            : "14 days free, no credit card required."}
        </Text>

        {/* Error */}
        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* Register only — full name */}
        {mode === "register" && (
          <Input
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. David Mbazza"
          />
        )}

        {/* Email / Phone toggle */}
        <View style={s.fieldToggle}>
          {(["email", "phone"] as LoginField[]).map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => { setField(f); setEmail(""); setPhone(""); setError(null); }}
              style={[s.fieldBtn, field === f && s.fieldBtnActive]}
            >
              <Text style={[s.fieldBtnText, field === f && s.fieldBtnTextActive]}>
                {f === "email" ? "📧 Email" : "📱 Phone"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {field === "email" ? (
          <Input
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        ) : (
          <Input
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            placeholder="+255 7•• ••• •••"
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
        )}

        {/* Password */}
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={s.inputLabel}>Password</Text>
            <TouchableOpacity onPress={() => setShowPw(!showPw)}>
              <Text style={{ fontSize: 12, color: C.gold500 }}>{showPw ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
          </View>
          <Input
            label=""
            value={password}
            onChangeText={setPassword}
            placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
            secureTextEntry={!showPw}
            autoCapitalize="none"
          />
        </View>

        {/* Confirm password — register only */}
        {mode === "register" && (
          <Input
            label="Confirm password"
            value={confirmPw}
            onChangeText={setConfirmPw}
            placeholder="Re-enter your password"
            secureTextEntry={!showPw}
            autoCapitalize="none"
          />
        )}

        <GoldButton
          label={mode === "login" ? "Sign in" : "Create account & start trial"}
          onPress={handleSubmit}
          loading={loading}
          style={{ marginTop: 4 }}
        />

        {/* Register note */}
        {mode === "register" && (
          <View style={s.noteBox}>
            <Text style={s.noteText}>
              ℹ️  After registering, complete your business profile on the web at{" "}
              <Text style={{ color: C.gold500 }}>my-sales-flax.vercel.app</Text>
              {" "}to set up your branch and products.
            </Text>
          </View>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>
            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <Text style={{ color: C.gold500 }} onPress={() => switchMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Create one" : "Sign in"}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  hero:         { paddingTop: 72, paddingBottom: 44, alignItems: "center" },
  logoWrap:     { width: 68, height: 68, borderRadius: 18, backgroundColor: C.gold500, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  logoGem:      { fontSize: 28, color: C.navy900 },
  wordmark:     { fontSize: 28, fontWeight: "700", color: "#fff", letterSpacing: -0.5 },
  tagline:      { fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4, letterSpacing: 1 },

  sheet:        { flex: 1, backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 },
  sheetContent: { padding: 24, paddingBottom: 48 },

  tabs:         { flexDirection: "row", backgroundColor: C.bg, borderRadius: 10, padding: 4, marginBottom: 20 },
  tab:          { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 7 },
  tabActive:    { backgroundColor: C.surface, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText:      { fontSize: 13, fontWeight: "500", color: C.textMuted },
  tabTextActive:{ color: C.navy700, fontWeight: "600" },

  heading:      { fontSize: 22, fontWeight: "700", color: C.textPrimary, marginBottom: 4 },
  subheading:   { fontSize: 13, color: C.textMuted, marginBottom: 20, lineHeight: 18 },

  errorBox:     { backgroundColor: C.dangerBg, borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#FECACA" },
  errorText:    { color: C.danger, fontSize: 13, lineHeight: 18 },

  fieldToggle:  { flexDirection: "row", gap: 8, marginBottom: 14 },
  fieldBtn:     { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 9, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  fieldBtnActive: { backgroundColor: C.navy700, borderColor: C.navy700 },
  fieldBtnText: { fontSize: 13, fontWeight: "500", color: C.textSecondary },
  fieldBtnTextActive: { color: "#fff", fontWeight: "600" },

  inputLabel:   { fontSize: 13, fontWeight: "600", color: C.textPrimary },

  noteBox:      { marginTop: 16, backgroundColor: C.gold100, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.gold300 },
  noteText:     { fontSize: 12, color: C.navy700, lineHeight: 18 },

  footer:       { marginTop: 24, alignItems: "center" },
  footerText:   { fontSize: 13, color: C.textMuted },
});
