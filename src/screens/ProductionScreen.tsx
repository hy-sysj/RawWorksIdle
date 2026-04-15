import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/ScreenShell';
import { RECIPES, recipeById, type RecipeDefinition, type RecipeId } from '@/data/recipes';
import { resourceById } from '@/data/resources';
import { useGameStore } from '@/store/gameStore';
import { palette, spacing, typography } from '@/utils/theme';

const SECTION_ORDER = ['wood', 'iron', 'oil', 'copper', 'aluminum', 'silicon', 'lithium', 'gold', 'rare_earth', 'uranium', 'cross', 'prestige'] as const;

const CHAIN_LABELS: Record<string, string> = {
  wood: '목재',
  iron: '철강',
  oil: '석유',
  copper: '구리',
  aluminum: '알루미늄',
  silicon: '실리콘',
  lithium: '리튬',
  gold: '금',
  rare_earth: '희토류',
  uranium: '우라늄',
  cross: '크로스',
  prestige: '프레스티지',
};

function formatDuration(ms: number): string {
  return `${Math.max(1, Math.round(ms / 1000))}초`;
}

function getRequiredXpForLevel(level: number): number {
  return Math.ceil(5 * level ** 1.5);
}

function getMasteryTimeReduction(level: number): number {
  return Math.min(level * 0.03, 0.6);
}

function getDisplayChain(recipe: RecipeDefinition): string {
  if (recipe.kind === 'cross') {
    return 'cross';
  }

  if (recipe.kind === 'prestige') {
    return 'prestige';
  }

  return recipe.chain;
}

function getRecipeOrThrow(recipeId: RecipeId): RecipeDefinition {
  const recipe = recipeById[recipeId];

  if (!recipe) {
    throw new Error(`Unknown recipe: ${recipeId}`);
  }

  return recipe;
}

export default function ProductionScreen() {
  const [now, setNow] = useState(Date.now());

  const stage = useGameStore((state) => state.stage);
  const resources = useGameStore((state) => state.resources);
  const prestigeItems = useGameStore((state) => state.prestigeItems);
  const activeRecipes = useGameStore((state) => state.activeRecipes);
  const mastery = useGameStore((state) => state.mastery);
  const startRecipe = useGameStore((state) => state.startRecipe);
  const cancelRecipe = useGameStore((state) => state.cancelRecipe);
  const getScaledCost = useGameStore((state) => state.getScaledCost);
  const getScaledDuration = useGameStore((state) => state.getScaledDuration);
  const getMaxProductionSlots = useGameStore((state) => state.getMaxProductionSlots);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const maxSlots = getMaxProductionSlots();
  const occupiedSlots = new Set(activeRecipes.map((recipe) => recipe.slot));
  const firstEmptySlot = Array.from({ length: maxSlots }, (_, slot) => slot).find((slot) => !occupiedSlots.has(slot));

  const groupedRecipes = useMemo(() => {
    const groups = RECIPES.reduce<Record<string, RecipeDefinition[]>>((accumulator, recipe) => {
      const key = getDisplayChain(recipe);
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(recipe);
      return accumulator;
    }, {});

    return SECTION_ORDER.filter((section) => (groups[section]?.length ?? 0) > 0).map((section) => ({
      key: section,
      label: CHAIN_LABELS[section],
      recipes: groups[section] ?? [],
    }));
  }, []);

  return (
    <ScreenShell title="생산" subtitle="활성 슬롯과 체인별 레시피를 한 번에 관리합니다." body="생산 슬롯 점유, 현재 진행률, 스케일링된 재료 비용, 숙련도 상태를 스토어 값 그대로 반영하는 생산 체인 화면입니다.">
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>단계 {stage}</Text>
        <Text style={styles.summaryLabel}>슬롯 {activeRecipes.length}/{maxSlots}</Text>
      </View>

      <View style={styles.slotSection}>
        <Text style={styles.sectionTitle}>활성 슬롯</Text>
        <View style={styles.slotList}>
          {Array.from({ length: maxSlots }, (_, slot) => {
            const activeRecipe = activeRecipes.find((recipe) => recipe.slot === slot);

            if (!activeRecipe) {
              return (
                <View key={slot} style={[styles.slotCard, styles.slotCardEmpty]}>
                  <Text style={styles.slotTitle}>슬롯 {slot + 1}</Text>
                  <Text style={styles.slotMeta}>비어 있음</Text>
                </View>
              );
            }

            const recipe = getRecipeOrThrow(activeRecipe.recipeId);
            const output = resourceById[recipe.output.resourceId];
            const durationMs = getScaledDuration(activeRecipe.recipeId);
            const remainingMs = Math.max(0, activeRecipe.endTime - now);
            const elapsedMs = Math.max(0, durationMs - remainingMs);
            const progressPercent = durationMs > 0 ? (elapsedMs / durationMs) * 100 : 0;

            return (
              <View key={slot} style={styles.slotCard}>
                <View style={styles.slotHeader}>
                  <Text style={styles.slotTitle}>슬롯 {slot + 1}</Text>
                  <Pressable style={styles.cancelButton} onPress={() => cancelRecipe(slot)}>
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </Pressable>
                </View>
                <Text style={styles.slotRecipe}>{output.emoji} {output.nameKo}</Text>
                <Text style={styles.slotMeta}>{formatDuration(remainingMs)} 남음</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
                </View>
                <Text style={styles.slotPreview}>→ {output.emoji} x{recipe.output.amount}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.recipeSectionList} showsVerticalScrollIndicator={false}>
        {groupedRecipes.map((group) => (
          <View key={group.key} style={styles.recipeSection}>
            <Text style={styles.sectionTitle}>{group.label}</Text>
            {group.recipes.map((recipe) => {
              const scaledCost = getScaledCost(recipe.id as RecipeId);
              const unlocked = recipe.unlockedAtStage <= stage;
              const outputResource = resourceById[recipe.output.resourceId];
              const masteryProgress = mastery[recipe.id as RecipeId] ?? { level: 0, xp: 0 };
              const nextLevelXp = getRequiredXpForLevel(masteryProgress.level + 1);
              const masteryPercent = nextLevelXp > 0 ? (masteryProgress.xp / nextLevelXp) * 100 : 0;
              const autoRepeatUnlocked = masteryProgress.level >= 5;
              const baseDurationMs = recipe.baseDurationSec * 1000;
              const scaledDurationMs = getScaledDuration(recipe.id as RecipeId);
              const hasMasteryReduction = masteryProgress.level > 0;
              const hasScaledCostDelta = recipe.inputs.some((ingredient, index) => scaledCost[index]?.amount !== ingredient.amount);

              const canAfford = scaledCost.every((ingredient) => {
                const amountOwned = resourceById[ingredient.resourceId].isPrestigeItem
                  ? prestigeItems[ingredient.resourceId] ?? 0
                  : resources[ingredient.resourceId] ?? 0;

                return amountOwned >= ingredient.amount;
              });

              const canStart = unlocked && firstEmptySlot !== undefined && canAfford;

              return (
                <View key={recipe.id} style={[styles.recipeCard, !unlocked && styles.recipeCardLocked]}>
                  <View style={styles.recipeTopRow}>
                    <View style={styles.recipeHeading}>
                      <Text style={styles.recipeTitle}>{outputResource.emoji} {outputResource.nameKo}</Text>
                      <Text style={styles.recipeSubTitle}>{recipe.kind === 'cross' ? '크로스 조합' : recipe.kind === 'prestige' ? '프레스티지 레시피' : `${CHAIN_LABELS[recipe.chain] ?? recipe.chain} 체인`}</Text>
                    </View>
                    {!unlocked ? (
                      <View style={styles.lockBadge}>
                        <Text style={styles.lockBadgeText}>🔒 {recipe.unlockedAtStage}단계</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.outputRow}>
                    <Text style={styles.outputText}>
                      {recipe.inputs.map((ingredient) => `${resourceById[ingredient.resourceId].emoji} ${resourceById[ingredient.resourceId].nameKo}`).join(' + ')}
                    </Text>
                    <Text style={styles.arrowText}>→</Text>
                    <Text style={styles.outputText}>{outputResource.emoji} {outputResource.nameKo}</Text>
                  </View>

                  <View style={styles.costList}>
                    {scaledCost.map((ingredient, index) => {
                      const baseIngredient = recipe.inputs[index];
                      const currentAmount = resourceById[ingredient.resourceId].isPrestigeItem
                        ? prestigeItems[ingredient.resourceId] ?? 0
                        : resources[ingredient.resourceId] ?? 0;
                      const affordable = currentAmount >= ingredient.amount;

                      return (
                        <View key={`${recipe.id}_${ingredient.resourceId}`} style={styles.costRow}>
                          <Text style={[styles.costText, affordable ? styles.costTextAffordable : styles.costTextBlocked]}>
                            {resourceById[ingredient.resourceId].emoji} {resourceById[ingredient.resourceId].nameKo} {currentAmount}/{ingredient.amount}
                          </Text>
                          {baseIngredient && baseIngredient.amount !== ingredient.amount ? (
                            <Text style={styles.scaledCostText}>기본 ×{baseIngredient.amount} → 스케일 ×{ingredient.amount}</Text>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>

                  {!hasScaledCostDelta ? null : <Text style={styles.scaledHint}>스케일링 적용 중</Text>}

                  <View style={styles.metaRow}>
                    <Text style={styles.durationText}>
                      {hasMasteryReduction || scaledDurationMs !== baseDurationMs
                        ? `${formatDuration(baseDurationMs)} → ${formatDuration(scaledDurationMs)}${hasMasteryReduction ? ' ⭐' : ''}`
                        : formatDuration(scaledDurationMs)}
                    </Text>
                    {autoRepeatUnlocked ? <Text style={styles.autoBadge}>🔄 AUTO</Text> : null}
                  </View>

                  <View style={styles.masteryCard}>
                    <View style={styles.masteryHeader}>
                      <Text style={styles.masteryTitle}>⭐ Lv.{masteryProgress.level}</Text>
                      <Text style={styles.masteryMeta}>{masteryProgress.xp}/{nextLevelXp} XP</Text>
                    </View>
                    <View style={styles.masteryTrack}>
                      <View style={[styles.masteryFill, { width: `${Math.min(masteryPercent, 100)}%` }]} />
                    </View>
                    <Text style={styles.masteryMeta}>
                      시간 -{Math.round(getMasteryTimeReduction(masteryProgress.level) * 100)}% · 산출 보너스 +{Math.min(masteryProgress.level * 5, 100)}%
                    </Text>
                  </View>

                  <Pressable
                    disabled={!canStart}
                    onPress={() => {
                      if (firstEmptySlot !== undefined) {
                        startRecipe(recipe.id as RecipeId, firstEmptySlot);
                      }
                    }}
                    style={[styles.actionButton, !canStart && styles.actionButtonDisabled]}
                  >
                    <Text style={styles.actionButtonText}>
                      {!unlocked ? `단계 ${recipe.unlockedAtStage} 해금` : firstEmptySlot === undefined ? '모든 슬롯 사용 중' : canAfford ? '생산 시작' : '재료 부족'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  summaryLabel: {
    color: palette.accent,
    fontSize: typography.body,
    fontWeight: '700',
  },
  slotSection: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: palette.accent,
    fontSize: typography.body,
    fontWeight: '800',
  },
  slotList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slotCard: {
    minWidth: 150,
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.sm,
  },
  slotCardEmpty: {
    justifyContent: 'center',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'center',
  },
  slotTitle: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  cancelButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cancelButtonText: {
    color: palette.text,
    fontSize: 11,
    fontWeight: '700',
  },
  slotRecipe: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  slotMeta: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  slotPreview: {
    color: palette.accent,
    fontSize: typography.caption,
    fontWeight: '700',
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
  recipeSectionList: {
    gap: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  recipeSection: {
    gap: spacing.sm,
  },
  recipeCard: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.sm,
  },
  recipeCardLocked: {
    opacity: 0.72,
  },
  recipeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  recipeHeading: {
    flex: 1,
    gap: 2,
  },
  recipeTitle: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  recipeSubTitle: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  lockBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: palette.surface,
  },
  lockBadgeText: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  outputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  arrowText: {
    color: palette.accent,
    fontSize: typography.body,
    fontWeight: '800',
  },
  outputText: {
    color: palette.text,
    fontSize: typography.caption,
    flex: 1,
  },
  costList: {
    gap: spacing.xs,
  },
  costRow: {
    gap: 2,
  },
  costText: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
  costTextAffordable: {
    color: '#82d49b',
  },
  costTextBlocked: {
    color: '#ef8f85',
  },
  scaledCostText: {
    color: '#f2a85b',
    fontSize: 11,
  },
  scaledHint: {
    color: '#f2a85b',
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'center',
  },
  durationText: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  autoBadge: {
    color: palette.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  masteryCard: {
    padding: spacing.sm,
    borderRadius: 14,
    backgroundColor: palette.surface,
    gap: spacing.xs,
  },
  masteryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  masteryTitle: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  masteryMeta: {
    color: palette.textMuted,
    fontSize: 11,
  },
  masteryTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: palette.background,
    overflow: 'hidden',
  },
  masteryFill: {
    height: '100%',
    backgroundColor: palette.accent,
  },
  actionButton: {
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: palette.accent,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: palette.border,
  },
  actionButtonText: {
    color: palette.background,
    fontSize: typography.caption,
    fontWeight: '800',
  },
});