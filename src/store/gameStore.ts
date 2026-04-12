import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { ipUpgradeById, ipUpgradeIds, STARTING_RESOURCE_AMOUNT_PER_LEVEL, tierUnlockUpgradeIds, type IpUpgradeId } from "@/data/ipUpgrades";
import { prestigeResourceIds, rawResourceIds, resourceById, type ResourceId } from "@/data/resources";
import { recipeById, type RecipeId } from "@/data/recipes";
import { stages } from "@/data/stages";
import { upgradeById, upgradeIds, type UpgradeCost, type UpgradeId } from "@/data/upgrades";

type WorkerGrade = "N" | "R" | "U" | "L";
type WorkerAbilityType = "yield" | "speed" | "power";
type PrestigeItemId = (typeof prestigeResourceIds)[number];
type RawResourceId = (typeof rawResourceIds)[number];

type WorkerAbility = {
  type: WorkerAbilityType;
  multiplier: number;
};

export type Worker = {
  id: string;
  grade: WorkerGrade;
  abilities: WorkerAbility[];
  level: number;
  dupeCount: number;
  locked: boolean;
};

export type ActiveRecipe = {
  recipeId: RecipeId;
  endTime: number;
  slot: number;
};

export type MasteryEntry = {
  level: number;
  xp: number;
};

type PersistedGameState = {
  version: number;
  resources: Record<ResourceId, number>;
  prestigeItems: Record<PrestigeItemId, number>;
  diamonds: number;
  activeRecipes: ActiveRecipe[];
  upgrades: Record<UpgradeId, number>;
  workers: Worker[];
  workerAssignments: Record<RawResourceId, string | null>;
  gachaPity: number;
  mastery: Record<RecipeId, MasteryEntry>;
  totalPrestigeCount: number;
  highestStageThisRun: number;
  stage: number;
  prestigeTier: number;
  prestigeCount: Record<1 | 2 | 3, number>;
  industryPoints: number;
  ipUpgrades: Record<IpUpgradeId, number>;
  lastSaveTime: string;
};

export type GameStore = PersistedGameState & {
  addResource: (id: ResourceId, amount: number) => void;
  deductResource: (id: ResourceId, amount: number) => boolean;
  startRecipe: (recipeId: RecipeId, slot: number) => boolean;
  completeRecipe: (slot: number) => boolean;
  cancelRecipe: (slot: number) => boolean;
  applyUpgrade: (upgradeId: UpgradeId) => void;
  triggerPrestige: (tier: 1 | 2 | 3) => boolean;
  buyIpUpgrade: (upgradeId: IpUpgradeId) => boolean;
  canUnlockTier: (tier: 1 | 2 | 3) => boolean;
  getMaxProductionSlots: () => number;
  getMaxOfflineHours: () => number;
  pullGacha: (type: "single" | "ten") => Worker[];
  assignWorker: (rawResourceId: RawResourceId, workerId: string) => boolean;
  unassignWorker: (rawResourceId: RawResourceId) => void;
  recycleWorker: (workerId: string) => number;
  feedDuplicateWorker: (targetId: string, feedId: string) => boolean;
  addMasteryXp: (recipeId: RecipeId, xp: number) => MasteryEntry;
  getScaledCost: (recipeId: RecipeId) => Array<{ resourceId: ResourceId; amount: number }>;
  getScaledDuration: (recipeId: RecipeId) => number;
};

const STORE_NAME = "rawworks-game-store";
const STORE_VERSION = 1;
const SAVE_DEBOUNCE_MS = 2000;
const SINGLE_PULL_COST = 50;
const TEN_PULL_COST = 450;
const PITY_THRESHOLD = 50;

const recycleDiamondValues: Record<WorkerGrade, number> = {
  N: 1,
  R: 5,
  U: 15,
  L: 50
};

const maxDuplicateCounts: Record<WorkerGrade, number> = {
  N: 5,
  R: 4,
  U: 3,
  L: 2
};

const duplicateBonusPerFeed: Record<WorkerGrade, number> = {
  N: 0.02,
  R: 0.03,
  U: 0.04,
  L: 0.06
};

const workerTemplates: Record<
  WorkerGrade,
  { abilityCount: { min: number; max: number }; multiplierRange: { min: number; max: number } }
> = {
  N: { abilityCount: { min: 1, max: 1 }, multiplierRange: { min: 1.1, max: 1.3 } },
  R: { abilityCount: { min: 1, max: 2 }, multiplierRange: { min: 1.2, max: 1.5 } },
  U: { abilityCount: { min: 2, max: 3 }, multiplierRange: { min: 1.4, max: 1.8 } },
  L: { abilityCount: { min: 3, max: 3 }, multiplierRange: { min: 1.6, max: 2.5 } }
};

const workerGradeRates: Array<{ grade: WorkerGrade; threshold: number }> = [
  { grade: "L", threshold: 0.03 },
  { grade: "U", threshold: 0.15 },
  { grade: "R", threshold: 0.4 },
  { grade: "N", threshold: 1 }
];

const nowIso = () => new Date().toISOString();

const roundToOneDecimal = (value: number) => Math.round(value * 10) / 10;

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

const chooseRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)] as T;

const createResourceState = (): Record<ResourceId, number> => {
  return Object.fromEntries(Object.keys(resourceById).map((resourceId) => [resourceId, 0])) as Record<ResourceId, number>;
};

const createPrestigeItemState = (): Record<PrestigeItemId, number> => {
  return Object.fromEntries(prestigeResourceIds.map((resourceId) => [resourceId, 0])) as Record<PrestigeItemId, number>;
};

const createUpgradeState = (): Record<UpgradeId, number> => {
  return Object.fromEntries(upgradeIds.map((upgradeId) => [upgradeId, 0])) as Record<UpgradeId, number>;
};

const createIpUpgradeState = (): Record<IpUpgradeId, number> => {
  return Object.fromEntries(ipUpgradeIds.map((upgradeId) => [upgradeId, 0])) as Record<IpUpgradeId, number>;
};

const createWorkerAssignmentState = (): Record<RawResourceId, string | null> => {
  return Object.fromEntries(rawResourceIds.map((resourceId) => [resourceId, null])) as Record<RawResourceId, string | null>;
};

const createInitialState = (): PersistedGameState => ({
  version: STORE_VERSION,
  resources: createResourceState(),
  prestigeItems: createPrestigeItemState(),
  diamonds: 0,
  activeRecipes: [],
  upgrades: createUpgradeState(),
  workers: [],
  workerAssignments: createWorkerAssignmentState(),
  gachaPity: 0,
  mastery: {},
  totalPrestigeCount: 0,
  highestStageThisRun: 1,
  stage: 1,
  prestigeTier: 0,
  prestigeCount: { 1: 0, 2: 0, 3: 0 },
  industryPoints: 0,
  ipUpgrades: createIpUpgradeState(),
  lastSaveTime: nowIso()
});

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSave: PersistedGameState | null = null;

const debouncedStorage = {
  getItem: async (name: string) => {
    const raw = await AsyncStorage.getItem(name);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedGameState;
    const { version, ...state } = parsed;

    return {
      state: state as PersistedGameState,
      version
    };
  },
  setItem: async (name: string, value: { state: PersistedGameState; version?: number }) => {
    pendingSave = {
      ...value.state,
      version: value.version ?? STORE_VERSION
    };

    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    saveTimer = setTimeout(async () => {
      if (!pendingSave) {
        return;
      }

      await AsyncStorage.setItem(name, JSON.stringify(pendingSave));
      pendingSave = null;
      saveTimer = null;
    }, SAVE_DEBOUNCE_MS);
  },
  removeItem: async (name: string) => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
      pendingSave = null;
    }

    await AsyncStorage.removeItem(name);
  }
};

const migrateState = (persisted: unknown, version: number): PersistedGameState => {
  if (!persisted || typeof persisted !== "object") {
    return createInitialState();
  }

  const baseState = createInitialState();
  const persistedState = persisted as Partial<PersistedGameState>;
  const merged = {
    ...baseState,
    ...persistedState,
    resources: {
      ...baseState.resources,
      ...persistedState.resources
    },
    prestigeItems: {
      ...baseState.prestigeItems,
      ...persistedState.prestigeItems
    },
    upgrades: {
      ...baseState.upgrades,
      ...persistedState.upgrades
    },
    workerAssignments: {
      ...baseState.workerAssignments,
      ...persistedState.workerAssignments
    },
    prestigeCount: {
      ...baseState.prestigeCount,
      ...persistedState.prestigeCount
    },
    ipUpgrades: {
      ...baseState.ipUpgrades,
      ...persistedState.ipUpgrades
    },
    mastery: {
      ...baseState.mastery,
      ...persistedState.mastery
    }
  };

  if (version < 1) {
    return {
      ...baseState,
      ...merged,
      version: STORE_VERSION
    };
  }

  return {
    ...baseState,
    ...merged,
    version: STORE_VERSION
  };
};

const getTierBaseStage = (tier: 1 | 2 | 3) => {
  if (tier === 1) return 3;
  if (tier === 2) return 5;
  return 8;
};

const getBaseIpReward = (tier: 1 | 2 | 3) => {
  if (tier === 1) return 1;
  if (tier === 2) return 5;
  return 20;
};

const getRecipe = (recipeId: RecipeId) => recipeById[recipeId]!;

const hasMetCost = (state: Pick<PersistedGameState, "resources" | "prestigeItems">, cost: UpgradeCost[]) => {
  return cost.every((entry) => {
    const resource = resourceById[entry.resourceId];
    const owned = resource.isPrestigeItem ? state.prestigeItems[entry.resourceId as PrestigeItemId] : state.resources[entry.resourceId];

    return owned >= entry.amount;
  });
};

const applyCost = (
  state: Pick<PersistedGameState, "resources" | "prestigeItems">,
  cost: UpgradeCost[]
): Pick<PersistedGameState, "resources" | "prestigeItems"> | null => {
  if (!hasMetCost(state, cost)) {
    return null;
  }

  const nextResources = { ...state.resources };
  const nextPrestigeItems = { ...state.prestigeItems };

  for (const entry of cost) {
    const resource = resourceById[entry.resourceId];

    if (resource.isPrestigeItem) {
      nextPrestigeItems[entry.resourceId as PrestigeItemId] = Math.max(
        0,
        nextPrestigeItems[entry.resourceId as PrestigeItemId] - entry.amount
      );
    } else {
      nextResources[entry.resourceId] = Math.max(0, nextResources[entry.resourceId] - entry.amount);
    }
  }

  return {
    resources: nextResources,
    prestigeItems: nextPrestigeItems
  };
};

const evaluateUnlockedStage = (state: Pick<PersistedGameState, "resources" | "upgrades">) => {
  let nextStage = 1;

  for (const stage of stages.slice(1)) {
    const canUnlock = stage.requirements.every((requirement) => {
      if (requirement.type === "resource") {
        return (state.resources[requirement.resourceId] ?? 0) >= requirement.amount;
      }

      return (state.upgrades[requirement.upgradeId] ?? 0) >= requirement.level;
    });

    if (!canUnlock) {
      break;
    }

    nextStage = stage.id;
  }

  return nextStage;
};

const resolveProgression = (
  state: Pick<PersistedGameState, "resources" | "upgrades" | "stage" | "highestStageThisRun">
) => {
  const unlockedStage = evaluateUnlockedStage(state);
  const nextStage = Math.max(state.stage, unlockedStage);

  return {
    stage: nextStage,
    highestStageThisRun: Math.max(state.highestStageThisRun, nextStage)
  };
};

const getMasteryEntry = (mastery: Record<RecipeId, MasteryEntry>, recipeId: RecipeId): MasteryEntry => {
  return mastery[recipeId] ?? { level: 1, xp: 0 };
};

const getRequiredXpForNextLevel = (level: number) => Math.ceil(5 * Math.pow(level, 1.5));

const getMasteryYieldMultiplier = (mastery: Record<RecipeId, MasteryEntry>, recipeId: RecipeId) => {
  const level = getMasteryEntry(mastery, recipeId).level;
  return Math.min(1 + level * 0.05, 2);
};

const getMasteryTimeReduction = (mastery: Record<RecipeId, MasteryEntry>, recipeId: RecipeId) => {
  const level = getMasteryEntry(mastery, recipeId).level;
  return Math.min(level * 0.03, 0.6);
};

const getSameTierPrestigeCount = (state: PersistedGameState, recipeId: RecipeId) => {
  const outputId = getRecipe(recipeId).output.resourceId;
  if (outputId === "small_factory") return state.prestigeCount[1];
  if (outputId === "industrial_complex") return state.prestigeCount[2];
  if (outputId === "future_city") return state.prestigeCount[3];
  return 0;
};

const getScaledInputs = (state: PersistedGameState, recipeId: RecipeId) => {
  const recipe = getRecipe(recipeId);
  const costMultiplier = Math.min((1 + state.totalPrestigeCount * 0.15) * (1 + state.stage * 0.1), 5);
  const prestigeRepeatMultiplier = recipe.kind === "prestige" ? 1 + getSameTierPrestigeCount(state, recipeId) * 0.2 : 1;

  return recipe.inputs.map((input) => ({
    resourceId: input.resourceId,
    amount: Math.ceil(input.amount * costMultiplier * prestigeRepeatMultiplier)
  }));
};

const getScaledRecipeDuration = (state: PersistedGameState, recipeId: RecipeId) => {
  const recipe = getRecipe(recipeId);
  const scaledDuration = recipe.baseDurationSec * Math.min(1 + state.totalPrestigeCount * 0.1, 3);
  const masteryReduction = getMasteryTimeReduction(state.mastery, recipeId);
  const smeltingFactor = Math.pow(0.7, state.upgrades.smelting ?? 0);
  const ipSmeltingFactor = Math.max(0.1, 1 - (state.ipUpgrades.smelting_speed ?? 0) * 0.1);
  const energyGridFactor = (state.upgrades.energy_grid ?? 0) > 0 ? 1 / 1.5 : 1;
  const finalDuration = scaledDuration * smeltingFactor * ipSmeltingFactor * energyGridFactor * (1 - masteryReduction);

  return Math.max(finalDuration, recipe.baseDurationSec * 0.2);
};

const markUpdated = <T extends Partial<PersistedGameState>>(partial: T): T & Pick<PersistedGameState, "lastSaveTime"> => ({
  ...partial,
  lastSaveTime: nowIso()
});

const randomWorkerId = () => `worker_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const generateWorker = (grade: WorkerGrade): Worker => {
  const template = workerTemplates[grade];
  const abilityPool: WorkerAbilityType[] = ["yield", "speed", "power"];
  const abilityCount = Math.floor(randomBetween(template.abilityCount.min, template.abilityCount.max + 1));
  const selectedTypes: WorkerAbilityType[] = [];

  while (selectedTypes.length < abilityCount) {
    const nextType = chooseRandom(abilityPool.filter((type) => !selectedTypes.includes(type)));
    selectedTypes.push(nextType);
  }

  return {
    id: randomWorkerId(),
    grade,
    abilities: selectedTypes.map((type) => ({
      type,
      multiplier: roundToOneDecimal(randomBetween(template.multiplierRange.min, template.multiplierRange.max))
    })),
    level: 1,
    dupeCount: 0,
    locked: false
  };
};

const rollWorkerGrade = (pityCount: number): WorkerGrade => {
  if (pityCount >= PITY_THRESHOLD) {
    return "L";
  }

  const roll = Math.random();
  return workerGradeRates.find((entry) => roll < entry.threshold)?.grade ?? "N";
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      addResource: (id, amount) => {
        if (amount <= 0) {
          return;
        }

        const resource = resourceById[id];

        if (resource.isPrestigeItem) {
          set((state) => {
            const nextPrestigeItems = {
              ...state.prestigeItems,
              [id]: (state.prestigeItems[id as PrestigeItemId] ?? 0) + amount
            };

            return markUpdated({
              prestigeItems: nextPrestigeItems
            });
          });
          return;
        }

        set((state) => {
          const nextResources = {
            ...state.resources,
            [id]: (state.resources[id] ?? 0) + amount
          };
          const progression = resolveProgression({
            resources: nextResources,
            upgrades: state.upgrades,
            stage: state.stage,
            highestStageThisRun: state.highestStageThisRun
          });

          return markUpdated({
            resources: nextResources,
            ...progression
          });
        });
      },

      deductResource: (id, amount) => {
        if (amount <= 0) {
          return true;
        }

        const resource = resourceById[id];
        const currentAmount = resource.isPrestigeItem ? get().prestigeItems[id as PrestigeItemId] ?? 0 : get().resources[id] ?? 0;

        if (currentAmount < amount) {
          return false;
        }

        if (resource.isPrestigeItem) {
          set((state) =>
            markUpdated({
              prestigeItems: {
                ...state.prestigeItems,
                [id]: Math.max(0, (state.prestigeItems[id as PrestigeItemId] ?? 0) - amount)
              }
            })
          );
          return true;
        }

        set((state) =>
          markUpdated({
            resources: {
              ...state.resources,
              [id]: Math.max(0, (state.resources[id] ?? 0) - amount)
            }
          })
        );
        return true;
      },

      startRecipe: (recipeId, slot) => {
        const state = get();
        const recipe = getRecipe(recipeId);

        if (slot < 0 || slot >= state.getMaxProductionSlots()) {
          return false;
        }

        if (state.activeRecipes.some((entry) => entry.slot === slot)) {
          return false;
        }

        if (recipe.unlockedAtStage > state.stage) {
          return false;
        }

        const scaledInputs = state.getScaledCost(recipeId);
        const hasEnoughResources = scaledInputs.every((input) => {
          const resource = resourceById[input.resourceId];
          const owned = resource.isPrestigeItem
            ? state.prestigeItems[input.resourceId as PrestigeItemId] ?? 0
            : state.resources[input.resourceId] ?? 0;

          return owned >= input.amount;
        });

        if (!hasEnoughResources) {
          return false;
        }

        for (const input of scaledInputs) {
          const didDeduct = get().deductResource(input.resourceId, input.amount);
          if (!didDeduct) {
            return false;
          }
        }

        const durationSec = state.getScaledDuration(recipeId);

        set((currentState) =>
          markUpdated({
            activeRecipes: [
              ...currentState.activeRecipes,
              {
                recipeId,
                slot,
                endTime: Date.now() + durationSec * 1000
              }
            ]
          })
        );

        return true;
      },

      completeRecipe: (slot) => {
        const state = get();
        const activeRecipe = state.activeRecipes.find((entry) => entry.slot === slot);

        if (!activeRecipe) {
          return false;
        }

        const recipe = getRecipe(activeRecipe.recipeId);
        const masteryYieldMultiplier = getMasteryYieldMultiplier(state.mastery, activeRecipe.recipeId);
        const criticalMultiplier = getMasteryEntry(state.mastery, activeRecipe.recipeId).level >= 10 && Math.random() < 0.1 ? 2 : 1;
        const outputAmount = Math.max(1, Math.floor(recipe.output.amount * masteryYieldMultiplier * criticalMultiplier));

        get().addResource(recipe.output.resourceId, outputAmount);
        get().addMasteryXp(activeRecipe.recipeId, recipe.kind === "cross" ? 2 : recipe.kind === "prestige" ? 3 : 1);

        set((currentState) =>
          markUpdated({
            activeRecipes: currentState.activeRecipes.filter((entry) => entry.slot !== slot)
          })
        );

        return true;
      },

      cancelRecipe: (slot) => {
        const state = get();

        if (!state.activeRecipes.some((entry) => entry.slot === slot)) {
          return false;
        }

        set((currentState) =>
          markUpdated({
            activeRecipes: currentState.activeRecipes.filter((entry) => entry.slot !== slot)
          })
        );

        return true;
      },

      applyUpgrade: (upgradeId) => {
        const state = get();
        const upgrade = upgradeById[upgradeId];
        const currentLevel = state.upgrades[upgradeId] ?? 0;
        const nextTier = upgrade.tiers.find((tier) => tier.level === currentLevel + 1);

        if (!nextTier || state.stage < nextTier.requiredStage) {
          return;
        }

        if (nextTier.requiredUpgrades?.some((requiredUpgradeId) => (state.upgrades[requiredUpgradeId as UpgradeId] ?? 0) <= 0)) {
          return;
        }

        const nextInventory = applyCost(state, nextTier.cost);

        if (!nextInventory) {
          return;
        }

        const nextUpgrades = {
          ...state.upgrades,
          [upgradeId]: nextTier.level
        };
        const progression = resolveProgression({
          resources: nextInventory.resources,
          upgrades: nextUpgrades,
          stage: state.stage,
          highestStageThisRun: state.highestStageThisRun
        });

        set(
          markUpdated({
            resources: nextInventory.resources,
            prestigeItems: nextInventory.prestigeItems,
            upgrades: nextUpgrades,
            ...progression
          })
        );
      },

      triggerPrestige: (tier) => {
        const state = get();
        const tierBaseStage = getTierBaseStage(tier);

        if (state.highestStageThisRun < tierBaseStage) {
          return false;
        }

        const requiredPrestigeItem: PrestigeItemId = tier === 1 ? "small_factory" : tier === 2 ? "industrial_complex" : "future_city";
        if ((state.prestigeItems[requiredPrestigeItem] ?? 0) <= 0) {
          return false;
        }

        const ipEarned = Math.max(getBaseIpReward(tier), getBaseIpReward(tier) + (state.highestStageThisRun - tierBaseStage));
        const startResourceLevel = state.ipUpgrades.start_resources ?? 0;
        const resetResources = createResourceState();

        if (startResourceLevel > 0) {
          for (const rawResourceId of rawResourceIds) {
            resetResources[rawResourceId] = startResourceLevel * STARTING_RESOURCE_AMOUNT_PER_LEVEL;
          }
        }

        set(
          markUpdated({
            version: STORE_VERSION,
            resources: resetResources,
            prestigeItems: state.prestigeItems,
            diamonds: state.diamonds,
            activeRecipes: [],
            upgrades: createUpgradeState(),
            workers: state.workers,
            workerAssignments: state.workerAssignments,
            gachaPity: state.gachaPity,
            mastery: state.mastery,
            totalPrestigeCount: state.totalPrestigeCount + 1,
            highestStageThisRun: 1,
            stage: 1,
            prestigeTier: Math.max(state.prestigeTier, tier),
            prestigeCount: {
              ...state.prestigeCount,
              [tier]: state.prestigeCount[tier] + 1
            },
            industryPoints: state.industryPoints + ipEarned,
            ipUpgrades: state.ipUpgrades
          })
        );

        return true;
      },

      buyIpUpgrade: (upgradeId) => {
        const state = get();
        const definition = ipUpgradeById[upgradeId];
        const cost = definition.cost;
        const currentLevel = state.ipUpgrades[upgradeId] ?? 0;
        const maxLevel = definition.maxLevel;

        if (state.industryPoints < cost || currentLevel >= maxLevel) {
          return false;
        }

        set((currentState) =>
          markUpdated({
            industryPoints: currentState.industryPoints - cost,
            ipUpgrades: {
              ...currentState.ipUpgrades,
              [upgradeId]: currentLevel + 1
            },
            prestigeTier: definition.unlocksTier ? Math.max(currentState.prestigeTier, definition.unlocksTier) : currentState.prestigeTier
          })
        );

        return true;
      },

      canUnlockTier: (tier) => {
        const ipUpgrades = get().ipUpgrades;
        if (tier === 1) {
          return true;
        }

        return (ipUpgrades[tierUnlockUpgradeIds[tier]] ?? 0) > 0;
      },

      getMaxProductionSlots: () => {
        const state = get();
        return 2 + (state.upgrades.workbench ?? 0) + (state.ipUpgrades.slot_expansion ?? 0);
      },

      getMaxOfflineHours: () => {
        const state = get();
        return Math.min(8 + (state.upgrades.automation ?? 0) * 2 + (state.ipUpgrades.offline_boost ?? 0) * 2, 24);
      },

      pullGacha: (type) => {
        const state = get();
        const cost = type === "single" ? SINGLE_PULL_COST : TEN_PULL_COST;
        const pullCount = type === "single" ? 1 : 10;

        if (state.diamonds < cost) {
          return [];
        }

        let nextPity = state.gachaPity;
        const pulledWorkers: Worker[] = [];

        for (let index = 0; index < pullCount; index += 1) {
          nextPity += 1;
          const grade = rollWorkerGrade(nextPity);
          const worker = generateWorker(grade);

          if (grade === "L") {
            nextPity = 0;
          }

          pulledWorkers.push(worker);
        }

        if (type === "ten" && !pulledWorkers.some((worker) => worker.grade !== "N")) {
          pulledWorkers[0] = generateWorker("R");
        }

        set((currentState) =>
          markUpdated({
            diamonds: currentState.diamonds - cost,
            gachaPity: nextPity,
            workers: [...currentState.workers, ...pulledWorkers]
          })
        );

        return pulledWorkers;
      },

      assignWorker: (rawResourceId, workerId) => {
        const state = get();
        const worker = state.workers.find((entry) => entry.id === workerId);

        if (!worker) {
          return false;
        }

        set((currentState) => {
          const nextAssignments = { ...currentState.workerAssignments };

          for (const [resourceId, assignedWorkerId] of Object.entries(nextAssignments) as Array<[RawResourceId, string | null]>) {
            if (assignedWorkerId === workerId) {
              nextAssignments[resourceId] = null;
            }
          }

          nextAssignments[rawResourceId] = workerId;

          return markUpdated({
            workerAssignments: nextAssignments
          });
        });

        return true;
      },

      unassignWorker: (rawResourceId) => {
        set((state) =>
          markUpdated({
            workerAssignments: {
              ...state.workerAssignments,
              [rawResourceId]: null
            }
          })
        );
      },

      recycleWorker: (workerId) => {
        const state = get();
        const worker = state.workers.find((entry) => entry.id === workerId);

        if (!worker || worker.locked) {
          return 0;
        }

        const diamondsReturned = recycleDiamondValues[worker.grade];

        set((currentState) => {
          const nextAssignments = { ...currentState.workerAssignments };

          for (const [resourceId, assignedWorkerId] of Object.entries(nextAssignments) as Array<[RawResourceId, string | null]>) {
            if (assignedWorkerId === workerId) {
              nextAssignments[resourceId] = null;
            }
          }

          return markUpdated({
            diamonds: currentState.diamonds + diamondsReturned,
            workers: currentState.workers.filter((entry) => entry.id !== workerId),
            workerAssignments: nextAssignments
          });
        });

        return diamondsReturned;
      },

      feedDuplicateWorker: (targetId, feedId) => {
        if (targetId === feedId) {
          return false;
        }

        const state = get();
        const target = state.workers.find((worker) => worker.id === targetId);
        const feed = state.workers.find((worker) => worker.id === feedId);

        if (!target || !feed || target.grade !== feed.grade) {
          return false;
        }

        if (target.dupeCount >= maxDuplicateCounts[target.grade]) {
          return false;
        }

        const bonus = duplicateBonusPerFeed[target.grade];

        set((currentState) => {
          const nextAssignments = { ...currentState.workerAssignments };
          for (const [resourceId, assignedWorkerId] of Object.entries(nextAssignments) as Array<[RawResourceId, string | null]>) {
            if (assignedWorkerId === feedId) {
              nextAssignments[resourceId] = null;
            }
          }

          return markUpdated({
            workers: currentState.workers
              .filter((worker) => worker.id !== feedId)
              .map((worker) => {
                if (worker.id !== targetId) {
                  return worker;
                }

                return {
                  ...worker,
                  level: worker.level + 1,
                  dupeCount: worker.dupeCount + 1,
                  abilities: worker.abilities.map((ability) => ({
                    ...ability,
                    multiplier: roundToOneDecimal(ability.multiplier + bonus)
                  }))
                };
              }),
            workerAssignments: nextAssignments
          });
        });

        return true;
      },

      addMasteryXp: (recipeId, xp) => {
        const currentEntry = getMasteryEntry(get().mastery, recipeId);
        const recipe = getRecipe(recipeId);
        const maxLevel = recipe.kind === "chain" ? 20 : recipe.kind === "cross" ? 15 : 10;
        let nextLevel = currentEntry.level;
        let nextXp = currentEntry.xp + xp;

        while (nextXp >= getRequiredXpForNextLevel(nextLevel) && nextLevel < maxLevel) {
          nextXp -= getRequiredXpForNextLevel(nextLevel);
          nextLevel += 1;
        }

        const nextEntry = { level: nextLevel, xp: nextXp };

        set((state) =>
          markUpdated({
            mastery: {
              ...state.mastery,
              [recipeId]: nextEntry
            }
          })
        );

        return nextEntry;
      },

      getScaledCost: (recipeId) => {
        return getScaledInputs(get(), recipeId);
      },

      getScaledDuration: (recipeId) => {
        return getScaledRecipeDuration(get(), recipeId);
      }
    }),
    {
      name: STORE_NAME,
      version: STORE_VERSION,
      storage: debouncedStorage,
      migrate: async (persistedState, version) => migrateState(persistedState, version)
    }
  )
);