import AsyncStorage from '@react-native-async-storage/async-storage';

import { DAILY_QUEST_TEMPLATES } from '@/data/dailyQuests';
import { STAGES } from '@/data/stages';
import { getMountainsAtStage } from '@/data/mountains';
import { recipeById, type RecipeDefinition, type RecipeId } from '@/data/recipes';
import { resourceById, type ResourceId } from '@/data/resources';
import { useGameStore } from '@/store/gameStore';

const LAST_BACKGROUND_TIME_KEY = 'rawworks-last-background-time';

export type OfflineReport = {
  elapsedSec: number;
  earned: Array<{ resourceId: string; amount: number }>;
  miningEarned: Array<{ resourceId: string; amount: number }>;
  productionEarned: Array<{ resourceId: string; amount: number }>;
};

function mergeEarnedEntries(
  miningEarned: Map<string, number>,
  productionEarned: Map<string, number>,
): Array<{ resourceId: string; amount: number }> {
  const merged = new Map<string, number>();

  for (const [resourceId, amount] of miningEarned.entries()) {
    merged.set(resourceId, (merged.get(resourceId) ?? 0) + amount);
  }

  for (const [resourceId, amount] of productionEarned.entries()) {
    merged.set(resourceId, (merged.get(resourceId) ?? 0) + amount);
  }

  return Array.from(merged.entries()).map(([resourceId, amount]) => ({ resourceId, amount }));
}

function getRequiredXpForLevel(level: number): number {
  return Math.ceil(5 * level ** 1.5);
}

function getMasteryLevelCap(recipeKind: 'chain' | 'cross' | 'prestige'): number {
  if (recipeKind === 'cross') {
    return 15;
  }

  if (recipeKind === 'prestige') {
    return 10;
  }

  return 20;
}

function getMasteryTimeReduction(level: number): number {
  return Math.min(level * 0.03, 0.6);
}

function getMasteryYieldBonus(level: number): number {
  return Math.min(level * 0.05, 1);
}

function getRecipeOrThrow(recipeId: RecipeId): RecipeDefinition {
  const recipe = recipeById[recipeId];

  if (!recipe) {
    throw new Error(`Unknown recipe: ${recipeId}`);
  }

  return recipe;
}

function getScaledCost(state: ReturnType<typeof useGameStore.getState>, recipeId: RecipeId) {
  return state.getScaledCost(recipeId);
}

function getScaledDurationMs(
  state: ReturnType<typeof useGameStore.getState>,
  recipeId: RecipeId,
  masteryLevel: number,
): number {
  const recipe = getRecipeOrThrow(recipeId);
  const baseDurationMs = recipe.baseDurationSec * 1000;
  const prestigeMultiplier = Math.min(1 + state.totalPrestigeCount * 0.1, 3);
  const masteryReduction = 1 - getMasteryTimeReduction(masteryLevel);
  const smeltingTier = state.upgrades.smelting;
  const smeltingMultiplier = smeltingTier === 0 ? 1 : smeltingTier === 1 ? 0.7 : smeltingTier === 2 ? 0.49 : smeltingTier === 3 ? 0.343 : 0.2401;
  const ipMultiplier = 1 - Math.min(state.ipUpgrades.smelting_accel * 0.1, 0.8);
  const energyGridMultiplier = state.upgrades.energy_grid >= 1 ? 1 / 1.5 : 1;
  const chainMultiplier = recipe.kind === 'chain' ? smeltingMultiplier * ipMultiplier * energyGridMultiplier : 1;

  return Math.max(baseDurationMs * 0.2, baseDurationMs * prestigeMultiplier * masteryReduction * chainMultiplier);
}

function canAfford(
  resources: ReturnType<typeof useGameStore.getState>['resources'],
  prestigeItems: ReturnType<typeof useGameStore.getState>['prestigeItems'],
  costs: Array<{ resourceId: ResourceId; amount: number }>,
): boolean {
  return costs.every((cost) => {
    const bucket = resourceById[cost.resourceId].isPrestigeItem ? prestigeItems : resources;
    return (bucket[cost.resourceId] ?? 0) >= cost.amount;
  });
}

function deductCosts(
  resources: ReturnType<typeof useGameStore.getState>['resources'],
  prestigeItems: ReturnType<typeof useGameStore.getState>['prestigeItems'],
  costs: Array<{ resourceId: ResourceId; amount: number }>,
): void {
  for (const cost of costs) {
    const bucket = resourceById[cost.resourceId].isPrestigeItem ? prestigeItems : resources;
    bucket[cost.resourceId] = (bucket[cost.resourceId] ?? 0) - cost.amount;
  }
}

function addOutput(
  resources: ReturnType<typeof useGameStore.getState>['resources'],
  prestigeItems: ReturnType<typeof useGameStore.getState>['prestigeItems'],
  resourceId: ResourceId,
  amount: number,
): void {
  const bucket = resourceById[resourceId].isPrestigeItem ? prestigeItems : resources;
  bucket[resourceId] = (bucket[resourceId] ?? 0) + amount;
}

function syncStage(
  stage: number,
  resources: ReturnType<typeof useGameStore.getState>['resources'],
  upgrades: ReturnType<typeof useGameStore.getState>['upgrades'],
): number {
  let nextStage = stage;

  while (nextStage < STAGES.length) {
    const transition = STAGES.find((entry) => entry.id === nextStage)?.transitionToNext;
    if (!transition) {
      break;
    }

    let passed = false;
    if (transition.type === 'upgrade_levels') {
      passed = Object.entries(transition.upgrades).every(([upgradeId, level]) => level === undefined || (upgrades[upgradeId as keyof typeof upgrades] ?? 0) >= level);
    }
    if (transition.type === 'resource_counts') {
      passed = Object.entries(transition.resources).every(([resourceId, amount]) => amount === undefined || (resources[resourceId as ResourceId] ?? 0) >= amount);
    }
    if (!passed) {
      break;
    }

    nextStage += 1;
  }

  return nextStage;
}

function addMasteryXpLocal(
  mastery: ReturnType<typeof useGameStore.getState>['mastery'],
  recipeId: RecipeId,
  xp: number,
): number {
  const recipe = getRecipeOrThrow(recipeId);
  const current = mastery[recipeId] ?? { level: 0, xp: 0 };
  const levelCap = getMasteryLevelCap(recipe.kind);
  let nextLevel = current.level;
  let nextXp = current.xp + xp;

  while (nextLevel < levelCap) {
    const requiredXp = getRequiredXpForLevel(nextLevel + 1);
    if (nextXp < requiredXp) {
      break;
    }
    nextXp -= requiredXp;
    nextLevel += 1;
  }

  mastery[recipeId] = { level: nextLevel, xp: nextXp };
  return nextLevel;
}

export async function saveBackgroundTimestamp(timestamp = Date.now()): Promise<void> {
  await AsyncStorage.setItem(LAST_BACKGROUND_TIME_KEY, String(timestamp));
}

export async function calculate(): Promise<OfflineReport | null> {
  const rawTimestamp = await AsyncStorage.getItem(LAST_BACKGROUND_TIME_KEY);
  if (!rawTimestamp) {
    return null;
  }

  const lastBackgroundTime = Number(rawTimestamp);
  if (!Number.isFinite(lastBackgroundTime)) {
    return null;
  }

  const state = useGameStore.getState();
  const maxOfflineSec = state.getMaxOfflineHours() * 3600;
  const elapsedSec = Math.min(Math.floor((Date.now() - lastBackgroundTime) / 1000), maxOfflineSec);

  if (elapsedSec < 1) {
    return null;
  }

  const miningEarned = new Map<string, number>();
  const productionEarned = new Map<string, number>();
  const nextResources = { ...state.resources };
  const nextPrestigeItems = { ...state.prestigeItems };
  const nextMastery = { ...state.mastery };
  const nextStats = { ...state.stats };
  const nextDailyQuests = state.dailyQuests.map((quest) => ({ ...quest }));
  const nextActiveRecipes: typeof state.activeRecipes = [];
  let nextStage = state.stage;
  let nextHighestStage = state.highestStageThisRun;

  const applyQuestProgress = (eventType: string, amount: number) => {
    if (amount <= 0) {
      return;
    }

    for (const quest of nextDailyQuests) {
      if (quest.completed) {
        continue;
      }

      const template = DAILY_QUEST_TEMPLATES.find((entry) => entry.id === quest.questId);
      if (!template || template.eventType !== eventType) {
        continue;
      }

      quest.progress = Math.min(quest.target, quest.progress + amount);
      quest.completed = quest.progress >= quest.target;
    }
  };

  for (const mountain of getMountainsAtStage(state.stage)) {
    const cycleMs = state.getMiningCycleMs(mountain.id);
    if (cycleMs <= 0) {
      continue;
    }

    const cycles = Math.floor((elapsedSec * 1000) / cycleMs);
    if (cycles <= 0) {
      continue;
    }

    const yields = state.getMiningYield(mountain.id);
    for (const [resourceId, amount] of Object.entries(yields)) {
      const totalAmount = amount * cycles;
      miningEarned.set(resourceId, (miningEarned.get(resourceId) ?? 0) + totalAmount);
      addOutput(nextResources, nextPrestigeItems, resourceId as ResourceId, totalAmount);
      nextStats.resourcesMined += totalAmount;
      applyQuestProgress('mining_tick', totalAmount);
    }
  }

  for (const activeRecipe of state.activeRecipes) {
    const recipe = getRecipeOrThrow(activeRecipe.recipeId);
    const isCrossRecipe = recipe.kind === 'cross';
    const autoCrossUnlocked = state.ipUpgrades.auto_cross > 0;
    const offlineEnabled = !isCrossRecipe || autoCrossUnlocked;
    const remainingMsAtBackground = Math.max(0, activeRecipe.endTime - lastBackgroundTime);
    let remainingOfflineMs = elapsedSec * 1000;

    if (!offlineEnabled) {
      nextActiveRecipes.push({
        ...activeRecipe,
        endTime: Date.now() + remainingMsAtBackground,
      });
      continue;
    }

    if (remainingOfflineMs < remainingMsAtBackground) {
      nextActiveRecipes.push({
        ...activeRecipe,
        endTime: Date.now() + (remainingMsAtBackground - remainingOfflineMs),
      });
      continue;
    }

    remainingOfflineMs -= remainingMsAtBackground;
    let masteryLevel = nextMastery[activeRecipe.recipeId]?.level ?? 0;
    const finishCycle = () => {
      const outputAmount = Math.max(1, Math.floor(recipe.output.amount * (1 + getMasteryYieldBonus(masteryLevel))));
      addOutput(nextResources, nextPrestigeItems, recipe.output.resourceId, outputAmount);
      productionEarned.set(recipe.output.resourceId, (productionEarned.get(recipe.output.resourceId) ?? 0) + outputAmount);
      nextStats.recipesCompleted += 1;
      applyQuestProgress('recipe_complete', 1);
      if (recipe.kind === 'cross' || recipe.kind === 'prestige') {
        nextStats.crossCompleted += 1;
        applyQuestProgress('cross_complete', 1);
      }
      masteryLevel = addMasteryXpLocal(nextMastery, activeRecipe.recipeId, recipe.kind === 'cross' ? 2 : recipe.kind === 'prestige' ? 3 : 1);
    };

    finishCycle();

    const canAutoRepeat = () => masteryLevel >= 5;
    let currentDurationMs = getScaledDurationMs(state, activeRecipe.recipeId, masteryLevel);
    while (canAutoRepeat() && remainingOfflineMs >= currentDurationMs) {
      const nextCost = getScaledCost(state, activeRecipe.recipeId);
      if (!canAfford(nextResources, nextPrestigeItems, nextCost)) {
        break;
      }
      deductCosts(nextResources, nextPrestigeItems, nextCost);
      remainingOfflineMs -= currentDurationMs;
      finishCycle();
      currentDurationMs = getScaledDurationMs(state, activeRecipe.recipeId, masteryLevel);
    }

    if (canAutoRepeat()) {
      const nextCost = getScaledCost(state, activeRecipe.recipeId);
      if (canAfford(nextResources, nextPrestigeItems, nextCost)) {
        deductCosts(nextResources, nextPrestigeItems, nextCost);
        currentDurationMs = getScaledDurationMs(state, activeRecipe.recipeId, masteryLevel);
        const remainingForCurrentCycle = Math.max(0, currentDurationMs - remainingOfflineMs);
        nextActiveRecipes.push({
          recipeId: activeRecipe.recipeId,
          slot: activeRecipe.slot,
          endTime: Date.now() + remainingForCurrentCycle,
        });
      }
    }
  }

  nextStage = syncStage(nextStage, nextResources, state.upgrades);
  nextHighestStage = Math.max(nextHighestStage, nextStage);
  const earned = mergeEarnedEntries(miningEarned, productionEarned);
  const miningEntries = Array.from(miningEarned.entries()).map(([resourceId, amount]) => ({ resourceId, amount }));
  const productionEntries = Array.from(productionEarned.entries()).map(([resourceId, amount]) => ({ resourceId, amount }));

  useGameStore.setState({
    resources: nextResources,
    prestigeItems: nextPrestigeItems,
    mastery: nextMastery,
    activeRecipes: nextActiveRecipes,
    dailyQuests: nextDailyQuests,
    stats: nextStats,
    stage: nextStage,
    highestStageThisRun: nextHighestStage,
    lastOfflineReport: elapsedSec >= 60 ? {
      elapsedSec,
      earned,
      miningEarned: miningEntries,
      productionEarned: productionEntries,
    } : null,
    lastSaveTime: new Date().toISOString(),
  });

  await AsyncStorage.removeItem(LAST_BACKGROUND_TIME_KEY);

  return {
    elapsedSec,
    earned,
    miningEarned: miningEntries,
    productionEarned: productionEntries,
  };
}

export const OfflineEngine = {
  calculate,
  saveBackgroundTimestamp,
};