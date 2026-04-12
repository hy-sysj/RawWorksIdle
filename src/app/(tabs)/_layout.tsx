import { Tabs } from "expo-router";

import { colors } from "@/utils/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: colors.border
        },
        sceneStyle: {
          backgroundColor: colors.background
        }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "채취" }} />
      <Tabs.Screen name="produce" options={{ title: "생산" }} />
      <Tabs.Screen name="upgrade" options={{ title: "업그레이드" }} />
      <Tabs.Screen name="factory" options={{ title: "공장" }} />
      <Tabs.Screen name="worker" options={{ title: "작업자" }} />
      <Tabs.Screen name="prestige" options={{ title: "프레스티지" }} />
    </Tabs>
  );
}