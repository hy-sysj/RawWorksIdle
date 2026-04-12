import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ProgressBar } from "@/components/ProgressBar";
import { recipes, type RecipeDefinition, type RecipeId } from "@/data/recipes";
import { resourceById } from "@/data/resources";
import { useGameStore } from "@/store/gameStore";
import { formatBigNumber } from "@/utils/bigNumber";
import { formatShortDuration } from "@/utils/timeUtils";
import { colors, spacing } from "@/utils/theme";

const chainLabels: Record<string, string> = {
  wood: "목재",
  iron: "철강",
  oil: "석유",
  copper: "구리",
  aluminum: "알루미늄",
  silicon: "실리콘",
  lithium: "리튬",
  gold: "금",
  rare_earth: "희토류",
  uranium: "우라늄",
  cross: "크로스",
  prestige: "프레스티지"
};

const getRequiredXpForNextLevel = (level: number) => Math.ceil(5 * Math.pow(level, 1.5));

export function ProductionScreen() {
  const [now, setNow] = useState(Date.now());
  const {
    stage,
    resources,
    prestigeItems,
    activeRecipes,
    mastery,
    getMaxProductionSlots,
    startRecipe,
    getScaledCost,
    getScaledDuration,
    cancelRecipe
  } = useGameStore((state) => ({
    stage: state.stage,
    resources: state.resources,
    prestigeItems: state.prestigeItems,
    activeRecipes: state.activeRecipes,
    mastery: state.mastery,
    getMaxProductionSlots: state.getMaxProductionSlots,
    startRecipe: state.startRecipe,
    getScaledCost: state.getScaledCost,
    getScaledDuration: state.getScaledDuration,
    cancelRecipe: state.cancelRecipe
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const groupedRecipes = useMemo(() => {
    const groups = new Map<string, RecipeDefinition[]>();

    for (const recipe of recipes) {
      const next = groups.get(recipe.chain) ?? [];
      groups.set(recipe.chain, [...next, recipe]);
    }

    return Array.from(groups.entries());
  }, []);

  const maxSlots = getMaxProductionSlots();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>활성 슬롯</Text>
        <View style={styles.slots}>
          {Array.from({ length: maxSlots }, (_, slot) => {
            const activeRecipe = activeRecipes.find((entry) => entry.slot === slot);

            if (!activeRecipe) {
              return (
                <View key={slot} style={styles.slotCard}>
                  <Text style={styles.slotLabel}>슬롯 {slot + 1}</Text>
                  <Text style={styles.emptyText}>대기 중</Text>
                </View>
              );
            }

            const recipe = recipes.find((entry) => entry.id === activeRecipe.recipeId)!;
            const durationSec = getScaledDuration(activeRecipe.recipeId);
            const remainingSec = Math.max(0, (activeRecipe.endTime - now) / 1000);
            const progress = 1 - remainingSec / durationSec;

            return (
              <View key={slot} style={styles.slotCard}>
                <View style={styles.slotHeader}>
                  <Text style={styles.slotLabel}>슬롯 {slot + 1}</Text>
                  <Pressable onPress={() => cancelRecipe(slot)}>
                    <Text style={styles.cancelText}>취소</Text>
                  </Pressable>
                </View>
                <Text style={styles.slotTitle}>{resourceById[recipe.output.resourceId].nameKo}</Text>
                <Text style={styles.slotMeta}>남은 시간 {formatShortDuration(remainingSec)}</Text>
                <ProgressBar progress={progress} />
              </View>
            );
          })}
        </View>
      </View>

      {groupedRecipes.map(([chain, items]) => (
        <View key={chain} style={styles.section}>
          <Text style={styles.sectionTitle}>{chainLabels[chain] ?? chain}</Text>
          <View style={styles.recipeList}>
            {items.map((recipe) => {
              const masteryEntry = mastery[recipe.id] ?? { level: 1, xp: 0 };
              const requiredXp = getRequiredXpForNextLevel(masteryEntry.level);
              const scaledCost = getScaledCost(recipe.id as RecipeId);
              const scaledDuration = getScaledDuration(recipe.id as RecipeId);
              const isLocked = recipe.unlockedAtStage > stage;
              const hasFreeSlot = activeRecipes.length < maxSlots;
              const hasEnough = scaledCost.every((input) => {
                const resource = resourceById[input.resourceId];
                const owned = resource.isPrestigeItem ? prestigeItems[input.resourceId as keyof typeof prestigeItems] ?? 0 : resources[input.resourceId] ?? 0;
                return owned >= input.amount;
              });

              return (
                <View key={recipe.id} style={[styles.recipeCard, isLocked && styles.recipeLocked]}>
                  <View style={styles.recipeHeader}>
                    <View style={styles.recipeHeaderText}>
                      <Text style={styles.recipeTitle}>{resourceById[recipe.output.resourceId].emoji} {resourceById[recipe.output.resourceId].nameKo}</Text>
                      <Text style={styles.recipeSubtitle}>{recipe.kind === "cross" ? "크로스" : recipe.kind === "prestige" ? "프레스티지" : "체인"}</Text>
                    </View>
                    <Text style={styles.masteryBadge}>⭐ Lv.{masteryEntry.level}</Text>
                  </View>

                  {isLocked ? (
                    <Text style={styles.lockedText}>Stage {recipe.unlockedAtStage}에서 해금</Text>
                  ) : (
                    <>
                      <View style={styles.inputsWrap}>
                        {scaledCost.map((input, index) => {
                          const baseInput = recipe.inputs[index];
                          const resource = resourceById[input.resourceId];
                          const owned = resource.isPrestigeItem ? prestigeItems[input.resourceId as keyof typeof prestigeItems] ?? 0 : resources[input.resourceId] ?? 0;
                          const scaledDiffers = baseInput !== undefined && baseInput.amount !== input.amount;

                          return (
                            <View key={`${recipe.id}-${input.resourceId}`} style={styles.inputRow}>
                              <Text style={[styles.inputText, owned >= input.amount ? styles.inputOk : styles.inputBad]}>
                                {resource.emoji} {resource.nameKo} {formatBigNumber(owned)}/{input.amount}
                              </Text>
                              {scaledDiffers && baseInput ? <Text style={styles.scaleText}>기본 {baseInput.amount} → 스케일 {input.amount}</Text> : null}
                            </View>
                          );
                        })}
                      </View>

                      <Text style={styles.durationText}>
                        시간 {formatShortDuration(recipe.baseDurationSec)}
                        {scaledDuration !== recipe.baseDurationSec ? ` → ${formatShortDuration(scaledDuration)} ⭐` : ""}
                      </Text>
                      <ProgressBar progress={masteryEntry.xp / requiredXp} color={colors.success} />
                      <Text style={styles.masteryText}>
                        숙련도 {masteryEntry.xp}/{requiredXp}
                        {masteryEntry.level >= 5 ? " · 🔄 AUTO" : ""}
                      </Text>

                      <Pressable
                        style={[styles.startButton, (!hasEnough || !hasFreeSlot) && styles.startButtonDisabled]}
                        disabled={!hasEnough || !hasFreeSlot}
                        onPress={() => {
                          const usedSlots = new Set(activeRecipes.map((entry) => entry.slot));
                          const nextSlot = Array.from({ length: maxSlots }, (_, slot) => slot).find((slot) => !usedSlots.has(slot));
                          if (nextSlot !== undefined) {
                            startRecipe(recipe.id as RecipeId, nextSlot);
                          }
                        }}
                      >
                        <Text style={styles.startButtonText}>{hasFreeSlot ? "생산 시작" : "슬롯 부족"}</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      ))}
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
  section: {
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700"
  },
  slots: {
    gap: spacing.sm
  },
  slotCard: {
    gap: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    padding: spacing.md
  },
  slotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  slotLabel: {
    color: colors.muted,
    fontSize: 12
  },
  slotTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  slotMeta: {
    color: colors.accent,
    fontSize: 12
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14
  },
  cancelText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700"
  },
  recipeList: {
    gap: spacing.sm
  },
  recipeCard: {
    gap: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    padding: spacing.md
  },
  recipeLocked: {
    opacity: 0.7
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm
  },
  recipeHeaderText: {
    flex: 1,
    gap: 4
  },
  recipeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  recipeSubtitle: {
    color: colors.muted,
    fontSize: 12
  },
  masteryBadge: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700"
  },
  lockedText: {
    color: colors.muted,
    fontSize: 13
  },
  inputsWrap: {
    gap: 6
  },
  inputRow: {
    gap: 2
  },
  inputText: {
    fontSize: 13
  },
  inputOk: {
    color: colors.success
  },
  inputBad: {
    color: colors.accent
  },
  scaleText: {
    color: colors.muted,
    fontSize: 11
  },
  durationText: {
    color: colors.text,
    fontSize: 13
  },
  masteryText: {
    color: colors.muted,
    fontSize: 12
  },
  startButton: {
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: colors.accent,
    paddingVertical: 12
  },
  startButtonDisabled: {
    opacity: 0.45
  },
  startButtonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: "700"
  }
});