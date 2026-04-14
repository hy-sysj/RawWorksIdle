import { Stack } from 'expo-router';

import { palette } from '@/utils/theme';

export default function RootLayout() {
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