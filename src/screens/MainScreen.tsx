import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { recipeById } from "@/data/recipes";
import { getLatestOfflineReport } from "@/engine/OfflineEngine";
import { rawResourceIds, resourceById, type ResourceId } from "@/data/resources";
import { useGameStore } from "@/store/gameStore";
import { ResourceStatCard } from "@/components/ResourceStatCard";
import { formatBigNumber } from "@/utils/bigNumber";
import { formatDuration } from "@/utils/timeUtils";
import { colors, spacing } from "@/utils/theme";

type RawResourceId = (typeof rawResourceIds)[number];

const getWorkerSummary = (worker: NonNullable<ReturnType<typeof getAssignedWorker>>) => {
  const yieldAbility = worker.abilities.find((ability) => ability.type === "yield");
  const speedAbility = worker.abilities.find((ability) => ability.type === "speed");
  const parts = [] as string[];

  if (yieldAbility) {
    parts.push(`📦×${yieldAbility.multiplier.toFixed(1)}`);
  }

  if (speedAbility) {
    parts.push(`⚡×${speedAbility.multiplier.toFixed(1)}`);
  }

  return parts.join(" ");
};

const getAssignedWorker = (rawResourceId: RawResourceId) => {
  const state = useGameStore.getState();
  const workerId = state.workerAssignments[rawResourceId];
  return state.workers.find((worker) => worker.id === workerId) ?? null;
};

const getMiningRatePerSecond = (rawResourceId: RawResourceId) => {
  const state = useGameStore.getState();
  const worker = getAssignedWorker(rawResourceId);
  const miningLevel = state.upgrades.mining ?? 0;
  const ipMiningLevel = state.ipUpgrades.mining_speed ?? 0;
  const miningMultiplier = Math.pow(1.5, miningLevel) * (1 + ipMiningLevel * 0.25);
  const yieldMult = worker
    ? worker.abilities.filter((ability) => ability.type === "yield").reduce((accumulator, ability) => accumulator * ability.multiplier, 1)
    : 1;
  const speedMult = worker
    ? worker.abilities.filter((ability) => ability.type === "speed").reduce((accumulator, ability) => accumulator * ability.multiplier, 1)
    : 1;

  return miningMultiplier * yieldMult * speedMult;
};

export function MainScreen() {
  const router = useRouter();
  const { stage, resources, prestigeItems, activeRecipes, diamonds, totalPrestigeCount, workerAssignments } = useGameStore((state) => ({
    stage: state.stage,
    resources: state.resources,
    prestigeItems: state.prestigeItems,
    activeRecipes: state.activeRecipes,
    diamonds: state.diamonds,
    totalPrestigeCount: state.totalPrestigeCount,
    workerAssignments: state.workerAssignments
  }));
  const addResource = useGameStore((state) => state.addResource);
  const [latestOfflineSummary, setLatestOfflineSummary] = useState(() => getLatestOfflineReport());

  useEffect(() => {
    const interval = setInterval(() => {
      setLatestOfflineSummary(getLatestOfflineReport());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const unlockedResources = useMemo(
    () =>
      Object.values(resourceById)
        .filter((resource) => resource.unlockedAtStage <= stage)
        .filter((resource) => !resource.isPrestigeItem || (prestigeItems[resource.id as keyof typeof prestigeItems] ?? 0) > 0),
    [prestigeItems, stage]
  );

  const producingResourceIds = useMemo(() => {
    const ids = new Set<string>(rawResourceIds.filter((resourceId) => resourceById[resourceId].unlockedAtStage <= stage));
    for (const activeRecipe of activeRecipes) {
      ids.add(recipeById[activeRecipe.recipeId]!.output.resourceId);
    }
    return ids;
  }, [activeRecipes, stage]);

  const unlockedRawResources = rawResourceIds.filter((resourceId) => resourceById[resourceId].unlockedAtStage <= stage);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Raw Works</Text>
          <Text style={styles.subtitle}>프레스티지 {totalPrestigeCount}회 · Stage {stage}</Text>
        </View>
        <View style={styles.diamondPill}>
          <Text style={styles.diamondText}>💎 {formatBigNumber(diamonds)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>자원 현황</Text>
        <View style={styles.grid}>
          {unlockedResources.map((resource) => {
            const resourceId = resource.id as ResourceId;
            const amount = resource.isPrestigeItem ? prestigeItems[resourceId as keyof typeof prestigeItems] ?? 0 : resources[resourceId] ?? 0;
            return (
              <ResourceStatCard
                key={resourceId}
                emoji={resource.emoji}
                name={resource.nameKo}
                amount={formatBigNumber(amount)}
                producing={producingResourceIds.has(resourceId)}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderInline}>
          <Text style={styles.sectionTitle}>채취</Text>
          <Text style={styles.sectionCaption}>탭으로 즉시 +1, 루프 엔진으로 자동 채취 진행</Text>
        </View>
        <View style={styles.miningList}>
          {unlockedRawResources.map((resourceId) => {
            const resource = resourceById[resourceId];
            const assignedWorker = getAssignedWorker(resourceId);
            const assignment = workerAssignments[resourceId];
            return (
              <View key={resourceId} style={styles.mineCard}>
                <View style={styles.mineHeader}>
                  <View>
                    <Text style={styles.mineTitle}>{resource.emoji} {resource.nameKo}</Text>
                    <Text style={styles.mineRate}>자동: +{getMiningRatePerSecond(resourceId).toFixed(1)}/s</Text>
                  </View>
                  <Pressable style={styles.mineButton} onPress={() => addResource(resourceId, 1)}>
                    <Text style={styles.mineButtonText}>채취</Text>
                  </Pressable>
                </View>
                <View style={styles.mineFooter}>
                  <Pressable style={styles.workerBadge} onPress={() => router.push("/worker")}>
                    <Text style={styles.workerBadgeText}>
                      {assignedWorker ? `${assignedWorker.grade} · ${getWorkerSummary(assignedWorker)}` : "작업자 미배치"}
                    </Text>
                  </Pressable>
                  <Text style={styles.mineOwned}>보유 {formatBigNumber(resources[resourceId] ?? 0)}</Text>
                </View>
                {assignment ? null : <Text style={styles.mineHint}>작업자 탭에서 배치하면 자동 채취 효율이 올라갑니다.</Text>}
              </View>
            );
          })}
        </View>
      </View>

      {latestOfflineSummary && latestOfflineSummary.elapsedSec >= 60 ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>오프라인 수익 반영됨</Text>
          <Text style={styles.bannerText}>
            {formatDuration(latestOfflineSummary.elapsedSec)} 동안 {latestOfflineSummary.earned.length}종 자원이 누적되었습니다.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.lg * 2
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700"
  },
  subtitle: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13
  },
  diamondPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  diamondText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  section: {
    gap: spacing.sm
  },
  sectionHeaderInline: {
    gap: 4
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700"
  },
  sectionCaption: {
    color: colors.muted,
    fontSize: 12
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  miningList: {
    gap: spacing.sm
  },
  mineCard: {
    gap: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    padding: spacing.md
  },
  mineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  mineTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  mineRate: {
    marginTop: 4,
    color: colors.accent,
    fontSize: 12
  },
  mineButton: {
    borderRadius: 12,
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  mineButtonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: "700"
  },
  mineFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  workerBadge: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  workerBadgeText: {
    color: colors.text,
    fontSize: 12
  },
  mineOwned: {
    color: colors.muted,
    fontSize: 12
  },
  mineHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  banner: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: "rgba(201,173,167,0.12)",
    padding: spacing.md,
    gap: 6
  },
  bannerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  bannerText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19
  }
});