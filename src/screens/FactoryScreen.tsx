import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenShell } from '@/components/ScreenShell';
import { IP_UPGRADES } from '@/data/ipUpgrades';
import { getMountainsAtStage } from '@/data/mountains';
import { recipeById } from '@/data/recipes';
import { resourceById, type ResourceId } from '@/data/resources';
import { useGameStore } from '@/store/gameStore';
import { logDiagnosticsSnapshot } from '@/utils/runtimeDiagnostics';
import { getDifficultyLabel } from '@/utils/progression';
import { palette, spacing, typography } from '@/utils/theme';

const FACTORY_MODULES = [
  { id: 'hq', label: '중앙 기지', emoji: '🏭', description: '채굴과 생산의 중심 제어실', activeWhen: 'always' },
  { id: 'smelting', label: '제련 설비', emoji: '🔥', description: '체인 레시피 시간 단축 담당', activeWhen: 'smelting' },
  { id: 'automation', label: '자동화 라인', emoji: '🤖', description: '오프라인 누적과 반복 생산 보조', activeWhen: 'automation' },
  { id: 'workbench', label: '작업대', emoji: '🧰', description: '생산 슬롯 확장 기반', activeWhen: 'workbench' },
  { id: 'research', label: '연구소', emoji: '🔬', description: '단계 개방 핵심 시설', activeWhen: 'research' },
  { id: 'energy', label: '에너지 그리드', emoji: '⚡', description: '전체 생산 속도 증폭', activeWhen: 'energy' },
  { id: 'transport', label: '운송 허브', emoji: '🚛', description: '산과 기지 사이 운반 네트워크', activeWhen: 'transport' },
  { id: 'road', label: '도로 관제', emoji: '🛣️', description: '전역 이동 효율 유지 보수', activeWhen: 'road' },
] as const;

function formatValue(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  if (value < 10 && value % 1 !== 0) {
    return value.toFixed(1);
  }

  return `${Math.round(value)}`;
}

function ModuleSpark({ active }: { active: boolean }) {
  return <Text style={[styles.spark, !active && styles.sparkHidden]}>{active ? '✦' : ''}</Text>;
}

export default function FactoryScreen() {
  const router = useRouter();
  const [now, setNow] = useState(Date.now());

  const activeRecipes = useGameStore((state) => state.activeRecipes);
  const stats = useGameStore((state) => state.stats);
  const mastery = useGameStore((state) => state.mastery);
  const stage = useGameStore((state) => state.stage);
  const roadLevel = useGameStore((state) => state.roadLevel);
  const totalPrestigeCount = useGameStore((state) => state.totalPrestigeCount);
  const prestigeTier = useGameStore((state) => state.prestigeTier);
  const industryPoints = useGameStore((state) => state.industryPoints);
  const ipUpgrades = useGameStore((state) => state.ipUpgrades);
  const upgrades = useGameStore((state) => state.upgrades);
  const getMiningYield = useGameStore((state) => state.getMiningYield);
  const getMiningCycleMs = useGameStore((state) => state.getMiningCycleMs);
  const getScaledDuration = useGameStore((state) => state.getScaledDuration);
  const getMaxOfflineHours = useGameStore((state) => state.getMaxOfflineHours);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 300);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    logDiagnosticsSnapshot('screen mount', {
      screen: 'FactoryScreen',
      stage,
      activeRecipeCount: activeRecipes.length,
    });
  }, [activeRecipes.length, stage]);

  const totalIpSpent = useMemo(() => {
    return IP_UPGRADES.reduce((sum, upgrade) => sum + (ipUpgrades[upgrade.id] ?? 0) * upgrade.cost, 0);
  }, [ipUpgrades]);

  const currentProductionRates = useMemo(() => {
    const rateMap = new Map<ResourceId, number>();
    const unlockedMountains = getMountainsAtStage(stage).map((mountain) => mountain.id);

    for (const mountainId of unlockedMountains) {
      const yields = getMiningYield(mountainId);
      const cycleMs = getMiningCycleMs(mountainId);
      if (cycleMs <= 0) {
        continue;
      }

      for (const [resourceId, amount] of Object.entries(yields) as [ResourceId, number][]) {
        const perSecond = amount / (cycleMs / 1000);
        rateMap.set(resourceId, (rateMap.get(resourceId) ?? 0) + perSecond);
      }
    }

    for (const activeRecipe of activeRecipes) {
      const recipe = recipeById[activeRecipe.recipeId];
      if (!recipe) {
        continue;
      }

      const durationMs = getScaledDuration(activeRecipe.recipeId);
      if (durationMs <= 0) {
        continue;
      }

      const masteryLevel = mastery[activeRecipe.recipeId]?.level ?? 0;
      const outputAmount = Math.max(1, Math.floor(recipe.output.amount * (1 + Math.min(masteryLevel * 0.05, 1))));
      const perSecond = outputAmount / (durationMs / 1000);
      rateMap.set(recipe.output.resourceId, (rateMap.get(recipe.output.resourceId) ?? 0) + perSecond);
    }

    return [...rateMap.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6);
  }, [activeRecipes, getMiningCycleMs, getMiningYield, getScaledDuration, mastery, stage]);

  const offlineRatePreview = useMemo(
    () => currentProductionRates.reduce((sum, [, value]) => sum + value, 0) * 3600,
    [currentProductionRates],
  );

  const maxMasteryLevel = useMemo(
    () => Object.values(mastery).reduce((highest, progress) => Math.max(highest, progress.level), 0),
    [mastery],
  );

  const modules = FACTORY_MODULES.map((module) => {
    const unlocked =
      module.activeWhen === 'always' ||
      (module.activeWhen === 'smelting' && upgrades.smelting > 0) ||
      (module.activeWhen === 'automation' && upgrades.automation > 0) ||
      (module.activeWhen === 'workbench' && upgrades.workbench > 0) ||
      (module.activeWhen === 'research' && upgrades.research > 0) ||
      (module.activeWhen === 'energy' && upgrades.energy_grid > 0) ||
      (module.activeWhen === 'transport' && upgrades.transport > 0) ||
      (module.activeWhen === 'road' && roadLevel > 0);

    const active =
      module.activeWhen === 'always' ||
      (module.activeWhen === 'smelting' && activeRecipes.length > 0) ||
      (module.activeWhen === 'automation' && upgrades.automation > 0) ||
      (module.activeWhen === 'workbench' && activeRecipes.length > 0) ||
      (module.activeWhen === 'research' && upgrades.research > 0) ||
      (module.activeWhen === 'energy' && upgrades.energy_grid > 0) ||
      (module.activeWhen === 'transport' && stage >= 2) ||
      (module.activeWhen === 'road' && roadLevel > 0);

    return { ...module, unlocked, active };
  });

  return (
    <ScreenShell
      title="공장"
      subtitle="해금된 시설과 현재 생산 라인의 상태를 한 장의 운영 보드로 정리합니다."
      body="상단은 공장 모듈 뷰, 하단은 현재 생산률과 누적 운영 지표, 그리고 프레스티지와 IP 상점으로 이어지는 운영 대시보드입니다."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.factoryViewCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>픽셀 공장 뷰</Text>
            <Text style={styles.sectionCaption}>해금된 설비만 점등되고 활성 설비는 스파크가 뜹니다.</Text>
          </View>

          <View style={styles.moduleGrid}>
            {modules.map((module) => (
              <View key={module.id} style={[styles.moduleTile, !module.unlocked && styles.moduleTileLocked]}>
                <ModuleSpark active={module.active} />
                <Text style={styles.moduleEmoji}>{module.emoji}</Text>
                <Text style={styles.moduleTitle}>{module.unlocked ? module.label : '미해금 설비'}</Text>
                <Text style={styles.moduleDescription}>{module.unlocked ? module.description : '업그레이드 진행 후 활성화됩니다.'}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.heroGrid}>
          <View style={styles.heroCard}>
            <Text style={styles.heroValue}>{formatValue(stats.resourcesMined)}</Text>
            <Text style={styles.heroLabel}>누적 채굴량</Text>
          </View>
          <View style={styles.heroCard}>
            <Text style={styles.heroValue}>{formatValue(stats.recipesCompleted)}</Text>
            <Text style={styles.heroLabel}>레시피 완료</Text>
          </View>
          <View style={styles.heroCard}>
            <Text style={styles.heroValue}>T{prestigeTier}</Text>
            <Text style={styles.heroLabel}>최고 프레스티지 티어</Text>
          </View>
          <View style={styles.heroCard}>
            <Text style={styles.heroValue}>{formatValue(industryPoints)}</Text>
            <Text style={styles.heroLabel}>현재 IP</Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <Text style={styles.badge}>단계 {stage}</Text>
          <Text style={styles.badge}>난이도 {getDifficultyLabel(totalPrestigeCount)}</Text>
          <Text style={styles.badge}>도로 Lv.{roadLevel}</Text>
          <Text style={styles.badge}>활성 슬롯 {activeRecipes.length}</Text>
          <Text style={styles.badge}>오프라인 {getMaxOfflineHours()}h</Text>
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>현재 생산률</Text>
            <Text style={styles.sectionCaption}>채굴과 활성 레시피 출력을 합산한 초당 기준입니다.</Text>
          </View>
          {currentProductionRates.length > 0 ? (
            currentProductionRates.map(([resourceId, perSecond]) => (
              <View key={resourceId} style={styles.rateCard}>
                <Text style={styles.rateLabel}>{resourceById[resourceId].emoji} {resourceById[resourceId].nameKo}</Text>
                <Text style={styles.rateValue}>+{formatValue(perSecond)}/s</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>현재 활성 생산 라인이 없습니다. 생산 탭에서 레시피를 시작하면 이곳에 실시간 생산률이 표시됩니다.</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>활성 슬롯 현황</Text>
            <Text style={styles.sectionCaption}>남은 시간과 진행률을 공장 기준으로 요약합니다.</Text>
          </View>
          {activeRecipes.length > 0 ? (
            activeRecipes.map((activeRecipe) => {
              const recipe = recipeById[activeRecipe.recipeId];
              if (!recipe) {
                return null;
              }

              const durationMs = getScaledDuration(activeRecipe.recipeId);
              const remainingMs = Math.max(0, activeRecipe.endTime - now);
              const progress = durationMs > 0 ? Math.min(100, ((durationMs - remainingMs) / durationMs) * 100) : 0;

              return (
                <View key={`${activeRecipe.slot}_${activeRecipe.recipeId}`} style={styles.slotCard}>
                  <View style={styles.slotHeader}>
                    <Text style={styles.slotTitle}>슬롯 {activeRecipe.slot + 1}</Text>
                    <Text style={styles.slotMeta}>{Math.max(1, Math.round(remainingMs / 1000))}초 남음</Text>
                  </View>
                  <Text style={styles.slotRecipe}>{resourceById[recipe.output.resourceId].emoji} {resourceById[recipe.output.resourceId].nameKo}</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>가동 중인 슬롯이 없습니다. 현재는 채굴 라인만 공장을 돌리고 있습니다.</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>운영 지표</Text>
            <Text style={styles.sectionCaption}>공장 전체 건강 상태를 보는 요약 카드입니다.</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>총 IP 획득량</Text>
            <Text style={styles.metricValue}>{formatValue(industryPoints + totalIpSpent)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>오프라인 1시간 예상 수익</Text>
            <Text style={styles.metricValue}>약 {formatValue(offlineRatePreview)}개</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>탭 채굴 횟수</Text>
            <Text style={styles.metricValue}>{formatValue(stats.tapMineCount)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>작업자 배치 변경</Text>
            <Text style={styles.metricValue}>{formatValue(stats.workerAssignmentsMade)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>최고 숙련도</Text>
            <Text style={styles.metricValue}>Lv.{maxMasteryLevel}</Text>
          </View>
        </View>

        <View style={styles.quickActionRow}>
          <Pressable style={styles.quickActionButton} onPress={() => router.push('/(tabs)/prestige')}>
            <Text style={styles.quickActionTitle}>프레스티지</Text>
            <Text style={styles.quickActionText}>매각 조건과 IP 수익 보기</Text>
          </Pressable>
          <Pressable style={styles.quickActionButton} onPress={() => router.push('/(tabs)/prestige?section=shop')}>
            <Text style={styles.quickActionTitle}>IP 상점</Text>
            <Text style={styles.quickActionText}>영구 업그레이드 바로 열기</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  factoryViewCard: {
    borderRadius: 22,
    padding: spacing.lg,
    backgroundColor: '#191f34',
    borderWidth: 1,
    borderColor: '#334065',
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  sectionTitle: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  sectionCaption: {
    color: palette.textMuted,
    fontSize: typography.caption,
    textAlign: 'right',
    flexShrink: 1,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  moduleTile: {
    minWidth: 132,
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 14, 26, 0.55)',
    borderWidth: 1,
    borderColor: '#2d3654',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 128,
    justifyContent: 'center',
  },
  moduleTileLocked: {
    opacity: 0.45,
  },
  moduleEmoji: {
    fontSize: 30,
  },
  moduleTitle: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  moduleDescription: {
    color: palette.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
    textAlign: 'center',
  },
  spark: {
    position: 'absolute',
    top: 10,
    right: 12,
    color: '#ffd36e',
    fontSize: 18,
    fontWeight: '900',
  },
  sparkHidden: {
    opacity: 0,
  },
  heroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heroCard: {
    flexGrow: 1,
    minWidth: 132,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
  },
  heroValue: {
    color: palette.accent,
    fontSize: 24,
    fontWeight: '800',
  },
  heroLabel: {
    color: palette.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.accent,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  sectionBlock: {
    gap: spacing.sm,
  },
  rateCard: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rateLabel: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '700',
    flex: 1,
  },
  rateValue: {
    color: palette.accent,
    fontSize: typography.body,
    fontWeight: '800',
  },
  slotCard: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.sm,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  slotTitle: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  slotMeta: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  slotRecipe: {
    color: palette.accent,
    fontSize: typography.body,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: palette.surface,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.accent,
  },
  metricCard: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metricLabel: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '700',
    flex: 1,
  },
  metricValue: {
    color: palette.accent,
    fontSize: typography.body,
    fontWeight: '800',
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: '#1d2136',
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.xs,
  },
  quickActionTitle: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  quickActionText: {
    color: palette.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  emptyCard: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
  },
  emptyText: {
    color: palette.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
});