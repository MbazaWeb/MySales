import { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter }        from "expo-router";
import { LinearGradient }   from "expo-linear-gradient";
import { signInWithPassword, signInWithOtp, verifyOtp } from "@/lib/supabase/api";
import { useAppCtx }        from "@/lib/context";
import { C }                from "@/lib/colors";
import { Input, GoldButton } from "@/components/UI";

type Step = "email" | "otp" | "password";

export default function LoginScreen() {
  const router      = useRouter();
  const { refresh } = useAppCtx();

  const [mode,     setMode]     = useState<"otp" | "password">("password");
  const [step,     setStep]     = useState<Step>("email");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [otp,      setOtp]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      if (mode === "password") {
        await signInWithPassword(email.trim(), password);
        await refresh();
        router.replace("/(tabs)/dashboard");
      } else if (step === "email") {
        await signInWithOtp(email.trim());
        setStep("otp");
      } else {
        await verifyOtp(email.trim(), otp.trim());
        await refresh();
        router.replace("/(tabs)/dashboard");
      }
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={[C.navy900, "#162844"]}
        style={s.hero}
      >
        {/* Logo mark */}
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
        {/* Mode tabs */}
        <View style={s.tabs}>
          {(["password", "otp"] as const).map(m => (
            <TouchableOpacity
              key={m}
              onPress={() => { setMode(m); setStep("email"); setError(null); }}
              style={[s.tab, mode === m && s.tabActive]}
            >
              <Text style={[s.tabText, mode === m && s.tabTextActive]}>
                {m === "password" ? "Password" : "OTP / Magic link"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.heading}>
          {step === "otp" ? "Enter your OTP" : "Sign in to your account"}
        </Text>

        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {step !== "otp" && (
          <Input
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}

        {mode === "password" && step !== "otp" && (
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            autoCapitalize="none"
          />
        )}

        {mode === "otp" && step === "otp" && (
          <Input
            label={`OTP sent to ${email}`}
            value={otp}
            onChangeText={setOtp}
            placeholder="6-digit code"
            keyboardType="numeric"
            autoCapitalize="none"
          />
        )}

        <GoldButton
          label={
            mode === "otp" && step === "email" ? "Send OTP"
            : step === "otp" ? "Verify & sign in"
            : "Sign in"
          }
          onPress={handleSubmit}
          loading={loading}
          style={{ marginTop: 8 }}
        />

        {step === "otp" && (
          <TouchableOpacity onPress={() => setStep("email")} style={{ marginTop: 16, alignItems: "center" }}>
            <Text style={{ color: C.textMuted, fontSize: 13 }}>← Back</Text>
          </TouchableOpacity>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>
            Don't have an account? Sign up at{"\n"}
            <Text style={{ color: C.gold500 }}>my-sales-flax.vercel.app</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  hero:        { paddingTop: 80, paddingBottom: 40, alignItems: "center" },
  logoWrap:    { width: 68, height: 68, borderRadius: 18, backgroundColor: C.gold500, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  logoGem:     { fontSize: 28, color: C.navy900 },
  wordmark:    { fontSize: 28, fontWeight: "700", color: "#fff", letterSpacing: -0.5 },
  tagline:     { fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4, letterSpacing: 1 },

  sheet:       { flex: 1, backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 },
  sheetContent:{ padding: 24 },

  tabs:        { flexDirection: "row", backgroundColor: C.bg, borderRadius: 10, padding: 4, marginBottom: 20 },
  tab:         { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 7 },
  tabActive:   { backgroundColor: C.surface, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText:     { fontSize: 13, fontWeight: "500", color: C.textMuted },
  tabTextActive: { color: C.navy700, fontWeight: "600" },

  heading:     { fontSize: 20, fontWeight: "700", color: C.textPrimary, marginBottom: 20 },
  errorBox:    { backgroundColor: C.dangerBg, borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText:   { color: C.danger, fontSize: 13 },

  footer:      { marginTop: 32, alignItems: "center" },
  footerText:  { fontSize: 12, color: C.textMuted, textAlign: "center", lineHeight: 18 },
});
