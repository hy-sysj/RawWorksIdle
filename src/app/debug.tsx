import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/utils/theme';

export default function DebugRoute() {
  return (
    <View style={styles.safeArea}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>NAV DEBUG</Text>
        <Text style={styles.title}>Stack Only</Text>
        <Text style={styles.meta}>이 화면이 뜨면 root Stack은 정상이고 Tabs가 크래시 원인입니다.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 24,
    gap: 10,
  },
  eyebrow: {
    color: palette.accentMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
  },
  meta: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});