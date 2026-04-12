import { StyleSheet, View } from "react-native";

import { colors } from "@/utils/theme";

type ProgressBarProps = {
  progress: number;
  color?: string;
};

export function ProgressBar({ progress, color = colors.accent }: ProgressBarProps) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(progress, 1)) * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    width: "100%",
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)"
  },
  fill: {
    height: "100%",
    borderRadius: 999
  }
});