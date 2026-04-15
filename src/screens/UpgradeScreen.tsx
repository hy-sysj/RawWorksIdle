import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/ScreenShell';
import { STAGES, type StageTransitionCondition } from '@/data/stages';
import { resourceById, type ResourceId } from '@/data/resources';
import { ROAD_SPEED_BY_LEVEL, TRANSPORT_CARGO_BY_LEVEL, TRANSPORT_SPEED_BY_LEVEL, UPGRADES, getUpgradeTier, type UpgradeCategory, type UpgradeEffect, type UpgradeId, type UpgradeTier } from '@/data/upgrades';
import { useGameStore } from '@/store/gameStore';
import { palette, spacing, typography } from '@/utils/theme';

const UPGRADE_COST_MULTIPLIER = 1.5;

const CATEGORY_ORDER: UpgradeCategory[] = ['transport', 'mining', 'road', 'smelting', 'automation', 'facility', 'research'];

const CATEGORY_META: Record<UpgradeCategory, { label: string; emoji: string; accent: string; description: string }> = {
  transport: { label: '이동수단', emoji: '🚛', accent: '#5bb6ff', description: '왕복 속도와 적재량을 함께 밀어 올립니다.' },
  mining: { label: '채굴도구', emoji: '⛏️', accent: '#f28b54', description: '한 번 왕복할 때 캐오는 자원량을 강화합니다.' },
  road: { label: '도로', emoji: '🛣️', accent: '#d7a34b', description: '모든 산의 이동 사이클에 전역 배율이 적용됩니다.' },
  smelting: { label: '제련설비', emoji: '🔥', accent: '#ff6b6b', description: '체인 레시피의 생산 시간을 꾸준히 압축합니다.' },
  automation: { label: '자동화', emoji: '🤖', accent: '#6fe3c1', description: '오프라인 누적 시간과 중반 편의성을 담당합니다.' },
  facility: { label: '시설', emoji: '🏭', accent: '#b48cff', description: '작업대 슬롯과 에너지 그리드 같은 기반 시설을 올립니다.' },
  research: { label: '연구소', emoji: '🔬', accent: '#8bd450', description: '다음 시대 진입을 열어 주는 핵심 마일스톤입니다.' },
};

const UPGRADE_EMOJI: Partial<Record<UpgradeId, string>> = {
  transport: '🚛',
  mining_tool: '⛏️',
  road: '🛣️',
  smelting: '🔥',
  automation: '🤖',
  workbench: '🧰',
  research: '🔬',
  energy_grid: '⚡',
};

function formatValue(value: number): string {
  if (Number.isInteger(value)) {
    return `${value}`;
  }

  return value.toFixed(1);
}

function getCurrentLevel(upgradeId: UpgradeId, upgrades: Record<UpgradeId, number>, roadLevel: number): number {
  return upgradeId === 'road' ? roadLevel : upgrades[upgradeId] ?? 0;
}

function getScaledUpgradeCost(currentLevel: number, tier: UpgradeTier): UpgradeTier['cost'] {
  return tier.cost.map((ingredient) => ({
    ...ingredient,
    amount: Math.ceil(ingredient.amount * UPGRADE_COST_MULTIPLIER ** currentLevel),
  }));
}

function getEffectSummary(upgradeId: UpgradeId, effect: UpgradeEffect): string[] {
  const summaries: string[] = [];

  if (upgradeId === 'transport') {
    summaries.push(`속도 x${formatValue(effect.transportSpeed ?? 1)}`);
    summaries.push(`적재량 ${formatValue(effect.transportCargo ?? 1)}`);
    return summaries;
  }

  if (upgradeId === 'mining_tool') {
    summaries.push(`채굴량 x${formatValue(effect.miningYield ?? 1)}`);
    return summaries;
  }

  if (upgradeId === 'road') {
    summaries.push(`전역 이동 x${formatValue(effect.roadSpeed ?? 1)}`);
    return summaries;
  }

  if (upgradeId === 'smelting') {
    const value = effect.smeltingTimeMultiplier ?? 1;
    summaries.push(`체인 시간 x${formatValue(value)}`);
    summaries.push(`기준 대비 ${Math.round((1 - value) * 100)}% 단축`);
    return summaries;
  }

  if (upgradeId === 'automation') {
    summaries.push(`오프라인 +${formatValue(effect.offlineHoursBonus ?? 0)}h`);
    return summaries;
  }

  if (upgradeId === 'workbench') {
    summaries.push(`작업대 슬롯 +${formatValue(effect.productionSlotsBonus ?? 0)}`);
    return summaries;
  }

  if (upgradeId === 'research') {
    summaries.push(`단계 해금 ${effect.stageUnlock ? `${effect.stageUnlock}단계` : '대기'}`);
    return summaries;
  }

  if (upgradeId === 'energy_grid') {
    summaries.push(`생산 속도 x${formatValue(effect.globalProductionSpeed ?? 1)}`);
    return summaries;
  }

  return summaries;
}

function getTransitionRequirementLabel(condition: StageTransitionCondition): string[] {
  if (condition.type === 'upgrade_levels') {
    return Object.entries(condition.upgrades).map(([upgradeId, level]) => {
      const definition = UPGRADES.find((entry) => entry.id === upgradeId);
      return `${definition?.nameKo ?? upgradeId} Lv.${level ?? 0}`;
    });
  }

  return Object.entries(condition.resources).map(([resourceId, amount]) => {
    const resource = resourceById[resourceId as ResourceId];
    return `${resource.emoji} ${resource.nameKo} x${amount ?? 0}`;
  });
}

function getTransitionRequirementProgress(
  condition: StageTransitionCondition,
  upgrades: Record<UpgradeId, number>,
  roadLevel: number,
  resources: Record<ResourceId, number>,
) {
  if (condition.type === 'upgrade_levels') {
    return Object.entries(condition.upgrades).map(([upgradeId, level]) => {
      const numericLevel = level ?? 0;
      const definition = UPGRADES.find((entry) => entry.id === upgradeId);
      const currentLevel = getCurrentLevel(upgradeId as UpgradeId, upgrades, roadLevel);
      return {
        label: `${definition?.nameKo ?? upgradeId} Lv.${numericLevel}`,
        current: currentLevel,
        target: numericLevel,
        done: currentLevel >= numericLevel,
      };
    });
  }

  return Object.entries(condition.resources).map(([resourceId, amount]) => {
    const numericAmount = amount ?? 0;
    const resource = resourceById[resourceId as ResourceId];
    const currentAmount = resources[resourceId as ResourceId] ?? 0;
    return {
      label: `${resource.emoji} ${resource.nameKo}`,
      current: currentAmount,
      target: numericAmount,
      done: currentAmount >= numericAmount,
    };
  });
}

export default function UpgradeScreen() {
  const stage = useGameStore((state) => state.stage);
  const resources = useGameStore((state) => state.resources);
  const prestigeItems = useGameStore((state) => state.prestigeItems);
  const upgrades = useGameStore((state) => state.upgrades);
  const roadLevel = useGameStore((state) => state.roadLevel);
  const ipUpgrades = useGameStore((state) => state.ipUpgrades);
  const industryPoints = useGameStore((state) => state.industryPoints);
  const activeRecipes = useGameStore((state) => state.activeRecipes.length);
  const getMaxProductionSlots = useGameStore((state) => state.getMaxProductionSlots);
  const getMaxOfflineHours = useGameStore((state) => state.getMaxOfflineHours);
  const applyUpgrade = useGameStore((state) => state.applyUpgrade);

  const groupedUpgrades = useMemo(() => {
    const groups = CATEGORY_ORDER.reduce<Record<UpgradeCategory, Array<(typeof UPGRADES)[number]>>>((accumulator, category) => {
      accumulator[category] = UPGRADES.filter((upgrade) => upgrade.category === category);
      return accumulator;
    }, {} as Record<UpgradeCategory, Array<(typeof UPGRADES)[number]>>);

    return groups;
  }, []);

  const currentStageDefinition = STAGES.find((entry) => entry.id === stage);
  const nextStageDefinition = STAGES.find((entry) => entry.id === stage + 1);
  const transitionRequirements = currentStageDefinition?.transitionToNext
    ? getTransitionRequirementProgress(currentStageDefinition.transitionToNext, upgrades, roadLevel, resources)
    : [];

  const overviewCards = [
    {
      label: '이동 배율',
      value: `x${formatValue(TRANSPORT_SPEED_BY_LEVEL[upgrades.transport] ?? TRANSPORT_SPEED_BY_LEVEL[0])}`,
      subValue: `적재 ${TRANSPORT_CARGO_BY_LEVEL[upgrades.transport] ?? TRANSPORT_CARGO_BY_LEVEL[0]}`,
      accent: CATEGORY_META.transport.accent,
    },
    {
      label: '도로',
      value: `x${formatValue(ROAD_SPEED_BY_LEVEL[roadLevel] ?? ROAD_SPEED_BY_LEVEL[0])}`,
      subValue: `Lv.${roadLevel}`,
      accent: CATEGORY_META.road.accent,
    },
    {
      label: '생산 슬롯',
      value: `${activeRecipes}/${getMaxProductionSlots()}`,
      subValue: `IP 슬롯 +${ipUpgrades.slot_expansion}`,
      accent: CATEGORY_META.facility.accent,
    },
    {
      label: '오프라인 한도',
      value: `${getMaxOfflineHours()}h`,
      subValue: `자동화 Lv.${upgrades.automation}`,
      accent: CATEGORY_META.automation.accent,
    },
  ];

  return (
    <ScreenShell
      title="업그레이드"
      subtitle="이동, 채굴, 도로, 설비를 제작 기반으로 강화해 다음 단계로 밀어 올립니다."
      body="현재 효과와 다음 티어 변화를 한 화면에 정리하고, 부족 자원과 단계 잠금 이유까지 바로 확인할 수 있도록 구성한 업그레이드 허브입니다."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroEyebrow}>PROGRESSION</Text>
              <Text style={styles.heroTitle}>{currentStageDefinition?.nameKo ?? `단계 ${stage}`}</Text>
              <Text style={styles.heroSubtitle}>현재 단계 {stage} · 산업 포인트 {industryPoints}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>다음 목표</Text>
              <Text style={styles.heroBadgeValue}>{nextStageDefinition ? `${stage + 1}단계` : '최종 단계'}</Text>
            </View>
          </View>

          <View style={styles.overviewGrid}>
            {overviewCards.map((card) => (
              <View key={card.label} style={[styles.overviewCard, { borderColor: `${card.accent}55` }]}>
                <Text style={styles.overviewLabel}>{card.label}</Text>
                <Text style={[styles.overviewValue, { color: card.accent }]}>{card.value}</Text>
                <Text style={styles.overviewSubValue}>{card.subValue}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.stageCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>다음 단계 조건</Text>
            <Text style={styles.sectionCaption}>{nextStageDefinition ? `${nextStageDefinition.nameKo} 진입` : '모든 단계 해금 완료'}</Text>
          </View>
          {currentStageDefinition?.transitionToNext ? (
            <>
              <Text style={styles.stageDescription}>
                {getTransitionRequirementLabel(currentStageDefinition.transitionToNext).join(' · ')}
              </Text>
              <View style={styles.requirementList}>
                {transitionRequirements.map((requirement) => (
                  <View key={requirement.label} style={[styles.requirementChip, requirement.done ? styles.requirementChipDone : styles.requirementChipPending]}>
                    <Text style={styles.requirementLabel}>{requirement.label}</Text>
                    <Text style={styles.requirementValue}>
                      {requirement.current}/{requirement.target}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.stageDescription}>이 단계가 현재 런의 최종 구간입니다.</Text>
          )}
        </View>

        {CATEGORY_ORDER.map((category) => {
          const upgradesInCategory = groupedUpgrades[category];
          if (upgradesInCategory.length === 0) {
            return null;
          }

          const meta = CATEGORY_META[category];

          return (
            <View key={category} style={styles.categorySection}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>{meta.emoji} {meta.label}</Text>
                  <Text style={styles.sectionCaption}>{meta.description}</Text>
                </View>
              </View>

              {upgradesInCategory.map((upgrade) => {
                const currentLevel = getCurrentLevel(upgrade.id, upgrades, roadLevel);
                const currentTier = getUpgradeTier(upgrade.id, currentLevel) ?? upgrade.tiers[0];
                const nextTier = getUpgradeTier(upgrade.id, currentLevel + 1);
                const scaledCost = nextTier ? getScaledUpgradeCost(currentLevel, nextTier) : [];
                const unlocked = nextTier ? nextTier.unlockedAtStage <= stage : true;
                const canAfford = scaledCost.every((ingredient) => {
                  const resource = resourceById[ingredient.resourceId];
                  const ownedAmount = resource.isPrestigeItem
                    ? prestigeItems[ingredient.resourceId] ?? 0
                    : resources[ingredient.resourceId] ?? 0;

                  return ownedAmount >= ingredient.amount;
                });
                const canUpgrade = Boolean(nextTier) && unlocked && canAfford;

                return (
                  <View key={upgrade.id} style={styles.upgradeCard}>
                    <View style={styles.upgradeHeader}>
                      <View style={styles.upgradeTitleBlock}>
                        <Text style={styles.upgradeTitle}>{UPGRADE_EMOJI[upgrade.id] ?? meta.emoji} {upgrade.nameKo}</Text>
                        <Text style={styles.upgradeTierLine}>{currentTier?.nameKo ?? '기본'} · Lv.{currentLevel}</Text>
                      </View>
                      <View style={[styles.levelBadge, { borderColor: `${meta.accent}66` }]}>
                        <Text style={[styles.levelBadgeText, { color: meta.accent }]}>{nextTier ? `다음 Lv.${nextTier.level}` : 'MAX'}</Text>
                      </View>
                    </View>

                    <View style={styles.effectPanel}>
                      <View style={styles.effectColumn}>
                        <Text style={styles.effectLabel}>현재 효과</Text>
                        {getEffectSummary(upgrade.id, currentTier?.effect ?? {}).map((summary) => (
                          <Text key={`${upgrade.id}_current_${summary}`} style={styles.effectValue}>{summary}</Text>
                        ))}
                      </View>
                      <View style={styles.effectDivider} />
                      <View style={styles.effectColumn}>
                        <Text style={styles.effectLabel}>다음 효과</Text>
                        {nextTier ? (
                          getEffectSummary(upgrade.id, nextTier.effect).map((summary) => (
                            <Text key={`${upgrade.id}_next_${summary}`} style={[styles.effectValue, styles.effectValueNext]}>{summary}</Text>
                          ))
                        ) : (
                          <Text style={styles.effectValue}>최대 레벨 도달</Text>
                        )}
                      </View>
                    </View>

                    {nextTier ? (
                      <>
                        <View style={styles.statusRow}>
                          <Text style={styles.statusText}>해금 단계 {nextTier.unlockedAtStage}</Text>
                          <Text style={[styles.statusText, unlocked ? styles.statusPositive : styles.statusWarning]}>
                            {unlocked ? '조건 충족' : `${nextTier.unlockedAtStage}단계 필요`}
                          </Text>
                        </View>

                        <View style={styles.costList}>
                          {scaledCost.map((ingredient) => {
                            const resource = resourceById[ingredient.resourceId];
                            const ownedAmount = resource.isPrestigeItem
                              ? prestigeItems[ingredient.resourceId] ?? 0
                              : resources[ingredient.resourceId] ?? 0;
                            const affordable = ownedAmount >= ingredient.amount;

                            return (
                              <View key={`${upgrade.id}_${ingredient.resourceId}`} style={[styles.costChip, affordable ? styles.costChipPositive : styles.costChipNegative]}>
                                <Text style={styles.costChipLabel}>{resource.emoji} {resource.nameKo}</Text>
                                <Text style={styles.costChipValue}>{ownedAmount}/{ingredient.amount}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </>
                    ) : (
                      <Text style={styles.maxedText}>현재 티어가 최대치입니다. 다음 런에서는 다른 카테고리나 연구 조건을 우선 챙기면 됩니다.</Text>
                    )}

                    {upgrade.id === 'research' ? (
                      <View style={styles.researchCallout}>
                        <Text style={styles.researchCalloutTitle}>마일스톤</Text>
                        <Text style={styles.researchCalloutText}>Lv.1 연구소는 4단계 진입, Lv.2 첨단 연구소는 6단계 진입 조건을 동시에 만족시킵니다.</Text>
                      </View>
                    ) : null}

                    <Pressable
                      disabled={!canUpgrade}
                      onPress={() => applyUpgrade(upgrade.id)}
                      style={[styles.actionButton, { backgroundColor: canUpgrade ? meta.accent : palette.border }]}
                    >
                      <Text style={styles.actionButtonText}>
                        {!nextTier ? 'MAX' : !unlocked ? `${nextTier.unlockedAtStage}단계 해금 필요` : canAfford ? '업그레이드 적용' : '재료 부족'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          );
        })}
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
  heroCard: {
    borderRadius: 22,
    padding: spacing.lg,
    backgroundColor: '#191f34',
    borderWidth: 1,
    borderColor: '#334065',
    gap: spacing.md,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heroEyebrow: {
    color: palette.accentMuted,
    fontSize: typography.caption,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  heroTitle: {
    marginTop: spacing.xs,
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
  },
  heroSubtitle: {
    marginTop: spacing.xs,
    color: palette.textMuted,
    fontSize: typography.body,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#10192d',
    borderWidth: 1,
    borderColor: '#3e507c',
    minWidth: 92,
  },
  heroBadgeText: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  heroBadgeValue: {
    marginTop: spacing.xs,
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  overviewCard: {
    flexGrow: 1,
    minWidth: 132,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: 'rgba(10, 14, 26, 0.55)',
    borderWidth: 1,
    gap: spacing.xs,
  },
  overviewLabel: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  overviewValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  overviewSubValue: {
    color: palette.text,
    fontSize: typography.caption,
  },
  stageCard: {
    borderRadius: 18,
    padding: spacing.lg,
    backgroundColor: '#1d2136',
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.sm,
  },
  sectionHeaderRow: {
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
    flexShrink: 1,
    textAlign: 'right',
  },
  stageDescription: {
    color: palette.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  requirementList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  requirementChip: {
    minWidth: 130,
    flexGrow: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    gap: spacing.xs,
  },
  requirementChipDone: {
    backgroundColor: 'rgba(84, 181, 125, 0.14)',
    borderColor: 'rgba(84, 181, 125, 0.45)',
  },
  requirementChipPending: {
    backgroundColor: 'rgba(215, 163, 75, 0.12)',
    borderColor: 'rgba(215, 163, 75, 0.38)',
  },
  requirementLabel: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  requirementValue: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  categorySection: {
    gap: spacing.sm,
  },
  upgradeCard: {
    borderRadius: 18,
    padding: spacing.lg,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.md,
  },
  upgradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  upgradeTitleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  upgradeTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
  },
  upgradeTierLine: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  levelBadge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    backgroundColor: '#16192a',
  },
  levelBadgeText: {
    fontSize: typography.caption,
    fontWeight: '800',
  },
  effectPanel: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'stretch',
  },
  effectColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  effectDivider: {
    width: 1,
    backgroundColor: palette.border,
  },
  effectLabel: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  effectValue: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  effectValueNext: {
    color: palette.accent,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statusText: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  statusPositive: {
    color: '#67d18c',
  },
  statusWarning: {
    color: palette.accent,
  },
  costList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  costChip: {
    minWidth: 132,
    flexGrow: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    gap: spacing.xs,
  },
  costChipPositive: {
    backgroundColor: 'rgba(84, 181, 125, 0.12)',
    borderColor: 'rgba(84, 181, 125, 0.35)',
  },
  costChipNegative: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  costChipLabel: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  costChipValue: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  maxedText: {
    color: palette.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  researchCallout: {
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: 'rgba(139, 212, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 212, 80, 0.28)',
    gap: spacing.xs,
  },
  researchCalloutTitle: {
    color: '#b8f58b',
    fontSize: typography.caption,
    fontWeight: '800',
  },
  researchCalloutText: {
    color: palette.text,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  actionButton: {
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#10131f',
    fontSize: typography.caption,
    fontWeight: '900',
  },
});