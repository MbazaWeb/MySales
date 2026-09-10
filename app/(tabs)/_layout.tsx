import { Tabs, useRouter }  from "expo-router";
import { useEffect }        from "react";
import { useAppCtx }        from "@/lib/context";
import { C }                from "@/lib/colors";
import { Ionicons }         from "@expo/vector-icons";
import { View, Text }       from "react-native";

function TabIcon({ name, focused, label }: { name: any; focused: boolean; label: string }) {
  return (
    <View style={{ alignItems: "center", paddingTop: 6 }}>
      {focused && (
        <View style={{ position: "absolute", top: -3, width: 32, height: 3, borderRadius: 2, backgroundColor: C.gold500 }} />
      )}
      <Ionicons
        name={name}
        size={23}
        color={focused ? C.navy700 : C.textMuted}
        style={{ strokeWidth: focused ? 2.5 : 1.8 }}
      />
      <Text style={{ fontSize: 10, fontWeight: "600", color: focused ? C.navy700 : C.textMuted, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const router      = useRouter();
  const { ctx, loading } = useAppCtx();

  useEffect(() => {
    if (!loading && !ctx) router.replace("/(auth)/login");
  }, [ctx, loading]);

  if (!ctx) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor:  C.surface,
          borderTopColor:   C.border,
          borderTopWidth:   1,
          height:           68,
          paddingBottom:    8,
          paddingTop:       0,
          elevation:        12,
          shadowColor:      C.navy900,
          shadowOpacity:    0.08,
          shadowRadius:     16,
        },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? "grid" : "grid-outline"} focused={focused} label="Home" /> }} />
      <Tabs.Screen name="sales"     options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? "receipt" : "receipt-outline"} focused={focused} label="Sales" /> }} />
      <Tabs.Screen name="inventory" options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? "cube" : "cube-outline"} focused={focused} label="Stock" /> }} />
      <Tabs.Screen name="reports"   options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? "bar-chart" : "bar-chart-outline"} focused={focused} label="Reports" /> }} />
      <Tabs.Screen name="profile"   options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? "person" : "person-outline"} focused={focused} label="Me" /> }} />
    </Tabs>
  );
}
