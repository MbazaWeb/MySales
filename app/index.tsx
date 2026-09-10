import { useEffect } from "react";
import { useRouter }  from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAppCtx }  from "@/lib/context";
import { C }          from "@/lib/colors";

export default function Index() {
  const router  = useRouter();
  const { ctx, loading } = useAppCtx();

  useEffect(() => {
    if (loading) return;
    if (ctx) router.replace("/(tabs)/dashboard");
    else     router.replace("/(auth)/login");
  }, [ctx, loading]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.navy900 }}>
      <ActivityIndicator color={C.gold500} size="large" />
    </View>
  );
}
