import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import { colors, spacing } from "@/utils/theme";

type ResourceStatCardProps = {
  emoji: string;
  name: string;
  amount: string;
  producing?: boolean;
};

export function ResourceStatCard({ emoji, name, amount, producing = false }: ResourceStatCardProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (producing) {
      pulse.value = withRepeat(withTiming(1.03, { duration: 700 }), -1, true);
      return;
    }

    cancelAnimation(pulse);
    pulse.value = withTiming(1, { duration: 200 });
  }, [producing, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    borderColor: producing ? colors.accent : colors.border
  }));

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.amount}>{amount}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 0,
    flex: 1,
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: spacing.sm
  },
  emoji: {
    fontSize: 22
  },
  name: {
    color: colors.muted,
    fontSize: 12
  },
  amount: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700"
  }
});