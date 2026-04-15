import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/utils/theme';

type ScreenShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  body: string;
}>;

export function ScreenShell({ title, subtitle, body, children }: ScreenShellProps) {
  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>RAW WORKS</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.card}>
          <Text style={styles.body}>{body}</Text>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  eyebrow: {
    color: palette.accentMuted,
    fontSize: typography.caption,
    letterSpacing: 2,
    fontWeight: '700',
  },
  title: {
    color: palette.text,
    fontSize: typography.title,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  card: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  body: {
    color: palette.text,
    fontSize: typography.body,
    lineHeight: 24,
  },
});