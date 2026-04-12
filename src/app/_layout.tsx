import { useEffect } from "react";
import { Stack } from "expo-router";

import { startLoop, stopLoop } from "@/engine/GameLoop";
import { colors } from "@/utils/theme";

export default function RootLayout() {
  useEffect(() => {
    startLoop();

    return () => {
      stopLoop();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background }
      }}
    />
  );
}