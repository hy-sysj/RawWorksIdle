import { useEffect } from 'react';
import { Stack } from 'expo-router';

import { startLoop, stopLoop } from '@/engine/GameLoop';
import { useGameStore } from '@/store/gameStore';
import { palette } from '@/utils/theme';

export default function RootLayout() {
  const isHydrated = useGameStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      return undefined;
    }

    startLoop();
    return () => {
      stopLoop();
    };
  }, [isHydrated]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: palette.background,
        },
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}