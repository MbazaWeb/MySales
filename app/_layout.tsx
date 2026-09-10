import { useEffect } from "react";
import { Stack }      from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider }  from "@/lib/context";
import { StatusBar }     from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Fonts could be loaded here if needed
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="light" backgroundColor="#0F1B2D" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)"    options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)"    options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
