import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/utils/theme";

type ScreenPlaceholderProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function ScreenPlaceholder({ title, subtitle, children }: ScreenPlaceholderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  content: {
    marginTop: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    padding: spacing.md
  }
});