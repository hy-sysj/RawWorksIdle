import AsyncStorage from "@react-native-async-storage/async-storage";

import { recipeById } from "@/data/recipes";
import { rawResourceIds, resourceById, type ResourceId } from "@/data/resources";
import { useGameStore } from "@/store/gameStore";

type RawResourceId = (typeof rawResourceIds)[number];

export type OfflineReport = {
  elapsedSec: number;
  earned: Array<{ resourceId: ResourceId; amount: number }>;
};

export const LAST_BACKGROUND_TIME_KEY = "rawworks-last-background-time";
export const BASE_MINING_TICK_MS = 1000;
export const BASE_MINING_AMOUNT = 1;

let latestOfflineReport: OfflineReport | null = null;

const nowIso = () => new Date().toISOString();

const getRecipe = (recipeId: keyof typeof recipeById) => recipeById[recipeId]!;

const addEarnedAmount = (earnedMap: Map<ResourceId, number>, resourceId: ResourceId, amount: number) => {
  if (amount <= 0) {
    return;
  }

  earnedMap.set(resourceId, (earnedMap.get(resourceId) ?? 0) + amount);
};

const getWorkerMultipliers = (rawResourceId: RawResourceId) => {
  const state = useGameStore.getState();
  const workerId = state.workerAssignments[rawResourceId];
  const worker = state.workers.find((entry) => entry.id === workerId);

  if (!worker) {
    return { yieldMult: 1, speedMult: 1 };
  }

  let yieldMult = 1;
  let speedMult = 1;

  for (const ability of worker.abilities) {
    if (ability.type === "yield") {
      yieldMult *= ability.multiplier;
    }

    if (ability.type === "speed") {
      speedMult *= ability.multiplier;
    }
  }

  return { yieldMult, speedMult };
};

const getMiningAmountPerTick = (rawResourceId: RawResourceId) => {
  const state = useGameStore.getState();
  const { yieldMult } = getWorkerMultipliers(rawResourceId);
  const miningLevel = state.upgrades.mining ?? 0;
  const ipMiningLevel = state.ipUpgrades.mining_speed ?? 0;
  const miningMultiplier = Math.pow(1.5, miningLevel) * (1 + ipMiningLevel * 0.25);

  return BASE_MINING_AMOUNT * miningMultiplier * yieldMult;
};

const getEffectiveTickMs = (rawResourceId: RawResourceId) => {
  const state = useGameStore.getState();
  const { speedMult } = getWorkerMultipliers(rawResourceId);
  const miningLevel = state.upgrades.mining ?? 0;
  const ipMiningLevel = state.ipUpgrades.mining_speed ?? 0;
  const miningSpeedMultiplier = Math.pow(1.5, miningLevel) * (1 + ipMiningLevel * 0.25);

  return BASE_MINING_TICK_MS / (speedMult * miningSpeedMultiplier);
};

const getRecipeCompletionXp = (recipeId: keyof typeof recipeById) => {
  const recipe = getRecipe(recipeId);
  if (recipe.kind === "cross") {
    return 2;
  }

  if (recipe.kind === "prestige") {
    return 3;
  }

  return 1;
};

const getMasteryLevel = (recipeId: keyof typeof recipeById) => useGameStore.getState().mastery[recipeId]?.level ?? 1;

const getMasteryYieldMultiplier = (recipeId: keyof typeof recipeById) => Math.min(1 + getMasteryLevel(recipeId) * 0.05, 2);

const canAutoRepeatRecipeOffline = (recipeId: keyof typeof recipeById) => {
  const state = useGameStore.getState();
  const recipe = getRecipe(recipeId);
  const masteryLevel = getMasteryLevel(recipeId);
  const conveyorActive = (state.upgrades.automation ?? 0) > 0 && recipe.kind === "chain";

  return masteryLevel >= 5 || conveyorActive;
};

export const formatOfflineReport = (report: OfflineReport) => {
  const lines = report.earned
    .filter((entry) => entry.amount > 0)
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 6)
    .map((entry) => `${resourceById[entry.resourceId].emoji} ${resourceById[entry.resourceId].nameKo} +${Math.floor(entry.amount)}`);

  if (report.earned.length > 6) {
    lines.push(`외 ${report.earned.length - 6}종`);
  }

  return `${Math.floor(report.elapsedSec / 60)}분 동안 생산이 진행되었습니다.\n\n${lines.join("\n")}`;
};

export const getLatestOfflineReport = () => latestOfflineReport;

export const calculate = async (): Promise<OfflineReport | null> => {
  const lastBackgroundTimeRaw = await AsyncStorage.getItem(LAST_BACKGROUND_TIME_KEY);

  if (!lastBackgroundTimeRaw) {
    return null;
  }

  const lastBackgroundTime = Number(lastBackgroundTimeRaw);

  if (!Number.isFinite(lastBackgroundTime) || lastBackgroundTime <= 0) {
    return null;
  }

  const state = useGameStore.getState();
  const maxOfflineSec = state.getMaxOfflineHours() * 3600;
  const elapsedSec = Math.min((Date.now() - lastBackgroundTime) / 1000, maxOfflineSec);

  await AsyncStorage.setItem(LAST_BACKGROUND_TIME_KEY, Date.now().toString());

  if (elapsedSec <= 0) {
    return null;
  }

  const earnedMap = new Map<ResourceId, number>();
  const unlockedRawResources = rawResourceIds.filter((resourceId) => resourceById[resourceId].unlockedAtStage <= state.stage);

  for (const resourceId of unlockedRawResources) {
    const tickMs = getEffectiveTickMs(resourceId);
    const cycles = Math.floor((elapsedSec * 1000) / tickMs);
    const amount = Math.floor(cycles * getMiningAmountPerTick(resourceId));

    if (amount > 0) {
      state.addResource(resourceId, amount);
      addEarnedAmount(earnedMap, resourceId, amount);
    }
  }

  const nextActiveRecipes = [] as typeof state.activeRecipes;
  const autoCrossEnabled = (state.ipUpgrades.auto_cross ?? 0) > 0;

  for (const activeRecipe of state.activeRecipes) {
    const recipe = getRecipe(activeRecipe.recipeId);

    if (recipe.kind === "cross" && !autoCrossEnabled) {
      nextActiveRecipes.push({
        ...activeRecipe,
        endTime: activeRecipe.endTime + elapsedSec * 1000
      });
      continue;
    }

    const durationSec = state.getScaledDuration(activeRecipe.recipeId);
    const remainingSec = Math.max(0, (activeRecipe.endTime - lastBackgroundTime) / 1000);

    if (elapsedSec < remainingSec) {
      nextActiveRecipes.push({
        ...activeRecipe,
        endTime: Date.now() + (remainingSec - elapsedSec) * 1000
      });
      continue;
    }

    const autoRepeat = canAutoRepeatRecipeOffline(activeRecipe.recipeId);
    const completedAfterFirst = autoRepeat ? Math.floor((elapsedSec - remainingSec) / durationSec) : 0;
    const cycles = 1 + completedAfterFirst;
    const outputAmount = Math.max(1, Math.floor(recipe.output.amount * getMasteryYieldMultiplier(activeRecipe.recipeId)));
    const totalAmount = cycles * outputAmount;

    state.addResource(recipe.output.resourceId, totalAmount);
    addEarnedAmount(earnedMap, recipe.output.resourceId, totalAmount);
    state.addMasteryXp(activeRecipe.recipeId, cycles * getRecipeCompletionXp(activeRecipe.recipeId));

    if (!autoRepeat) {
      continue;
    }

    const progressedAfterFirst = Math.max(0, elapsedSec - remainingSec);
    const progressIntoNextCycle = progressedAfterFirst % durationSec;
    nextActiveRecipes.push({
      ...activeRecipe,
      endTime: Date.now() + (durationSec - progressIntoNextCycle) * 1000
    });
  }

  useGameStore.setState({
    activeRecipes: nextActiveRecipes,
    lastSaveTime: nowIso()
  });

  latestOfflineReport = {
    elapsedSec,
    earned: Array.from(earnedMap.entries()).map(([resourceId, amount]) => ({ resourceId, amount }))
  };

  return latestOfflineReport;
};