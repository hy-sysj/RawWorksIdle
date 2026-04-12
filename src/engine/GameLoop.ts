import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, type AppStateStatus, Alert } from "react-native";

import { calculate, formatOfflineReport, BASE_MINING_AMOUNT, BASE_MINING_TICK_MS, LAST_BACKGROUND_TIME_KEY } from "@/engine/OfflineEngine";
import { recipeById } from "@/data/recipes";
import { rawResourceIds, resourceById } from "@/data/resources";
import { useGameStore } from "@/store/gameStore";

type RawResourceId = (typeof rawResourceIds)[number];

const HEARTBEAT_MS = 250;

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let lastHeartbeatTime = 0;
let currentAppState: AppStateStatus = AppState.currentState;
let appStateSubscription: { remove: () => void } | null = null;
let accumulators: Record<RawResourceId, number> = Object.fromEntries(rawResourceIds.map((resourceId) => [resourceId, 0])) as Record<
  RawResourceId,
  number
>;

const getRecipe = (recipeId: keyof typeof recipeById) => recipeById[recipeId]!;

const getWorkerMultipliers = (rawResourceId: RawResourceId) => {
  const state = useGameStore.getState();
  const workerId = state.workerAssignments[rawResourceId];
  const worker = state.workers.find((entry) => entry.id === workerId);

  if (!worker) {
    return { yieldMult: 1, speedMult: 1, powerChance: 0 };
  }

  let yieldMult = 1;
  let speedMult = 1;
  let powerChance = 0;

  for (const ability of worker.abilities) {
    if (ability.type === "yield") {
      yieldMult *= ability.multiplier;
    }

    if (ability.type === "speed") {
      speedMult *= ability.multiplier;
    }

    if (ability.type === "power") {
      powerChance = Math.max(powerChance, ability.multiplier - 1);
    }
  }

  return { yieldMult, speedMult, powerChance };
};

const getMiningMultipliers = (rawResourceId: RawResourceId) => {
  const state = useGameStore.getState();
  const workerBonus = getWorkerMultipliers(rawResourceId);
  const miningLevel = state.upgrades.mining ?? 0;
  const ipMiningLevel = state.ipUpgrades.mining_speed ?? 0;
  const miningMultiplier = Math.pow(1.5, miningLevel) * (1 + ipMiningLevel * 0.25);

  return {
    amountPerTick: BASE_MINING_AMOUNT * miningMultiplier * workerBonus.yieldMult,
    effectiveTickMs: BASE_MINING_TICK_MS / (miningMultiplier * workerBonus.speedMult),
    powerChance: workerBonus.powerChance
  };
};

const getBonusDropTarget = (rawResourceId: RawResourceId) => {
  const sourceStage = resourceById[rawResourceId].unlockedAtStage;
  const candidates = rawResourceIds.filter(
    (resourceId) => resourceId !== rawResourceId && resourceById[resourceId].unlockedAtStage === sourceStage
  );

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
};

const maybeAutoRestartRecipe = (recipeId: keyof typeof recipeById, slot: number) => {
  const state = useGameStore.getState();
  const masteryLevel = state.mastery[recipeId]?.level ?? 1;
  const recipe = getRecipe(recipeId);
  const conveyorActive = (state.upgrades.automation ?? 0) > 0 && recipe.kind === "chain";

  if (masteryLevel >= 5 || conveyorActive) {
    state.startRecipe(recipeId, slot);
  }
};

const processMining = (deltaMs: number) => {
  const state = useGameStore.getState();
  const unlockedRawResources = rawResourceIds.filter((resourceId) => resourceById[resourceId].unlockedAtStage <= state.stage);

  for (const resourceId of unlockedRawResources) {
    accumulators[resourceId] += deltaMs;

    const { amountPerTick, effectiveTickMs, powerChance } = getMiningMultipliers(resourceId);

    while (accumulators[resourceId] >= effectiveTickMs) {
      accumulators[resourceId] -= effectiveTickMs;
      state.addResource(resourceId, amountPerTick);

      if (powerChance > 0 && Math.random() < powerChance) {
        const bonusTarget = getBonusDropTarget(resourceId);
        if (bonusTarget) {
          state.addResource(bonusTarget, 1);
        }
      }
    }
  }
};

const processRecipes = () => {
  const state = useGameStore.getState();
  const now = Date.now();
  const completedRecipes = state.activeRecipes.filter((recipe) => now >= recipe.endTime);

  for (const activeRecipe of completedRecipes) {
    const didComplete = state.completeRecipe(activeRecipe.slot);

    if (didComplete) {
      maybeAutoRestartRecipe(activeRecipe.recipeId, activeRecipe.slot);
    }
  }
};

const syncHighestStageThisRun = () => {
  const state = useGameStore.getState();

  if (state.stage <= state.highestStageThisRun) {
    return;
  }

  useGameStore.setState({
    highestStageThisRun: state.stage,
    lastSaveTime: new Date().toISOString()
  });
};

const handleAppStateChange = async (nextAppState: AppStateStatus) => {
  const wasBackgrounded = currentAppState === "background" || currentAppState === "inactive";
  const isForeground = nextAppState === "active";

  if ((nextAppState === "background" || nextAppState === "inactive") && currentAppState === "active") {
    await AsyncStorage.setItem(LAST_BACKGROUND_TIME_KEY, Date.now().toString());
  }

  if (wasBackgrounded && isForeground) {
    const report = await calculate();
    if (report && report.elapsedSec >= 60 && report.earned.length > 0) {
      Alert.alert("오프라인 수익", formatOfflineReport(report));
    }
  }

  currentAppState = nextAppState;
};

const heartbeat = () => {
  const now = Date.now();

  if (lastHeartbeatTime === 0) {
    lastHeartbeatTime = now;
    return;
  }

  const deltaMs = now - lastHeartbeatTime;
  lastHeartbeatTime = now;

  processMining(deltaMs);
  processRecipes();
  syncHighestStageThisRun();
};

export const startLoop = () => {
  if (intervalHandle) {
    return;
  }

  lastHeartbeatTime = Date.now();
  intervalHandle = setInterval(heartbeat, HEARTBEAT_MS);

  if (!appStateSubscription) {
    appStateSubscription = AppState.addEventListener("change", handleAppStateChange);
  }
};

export const stopLoop = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }

  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }

  lastHeartbeatTime = 0;
  accumulators = Object.fromEntries(rawResourceIds.map((resourceId) => [resourceId, 0])) as Record<RawResourceId, number>;
};