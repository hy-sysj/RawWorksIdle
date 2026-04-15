import AsyncStorage from '@react-native-async-storage/async-storage';
import { achievementById, type AchievementId } from '@/data/achievements';
import { DAILY_QUEST_COMPLETION_BONUS, DAILY_QUEST_TEMPLATES, type DailyQuestEventType, type DailyQuestTemplate } from '@/data/dailyQuests';
import { IP_UPGRADES, ipUpgradeById, type IpUpgradeDefinition, type IpUpgradeId } from '@/data/ipUpgrades';
import { generateMountainNames, MOUNTAINS, mountainById } from '@/data/mountains';
import { canPrestige as canPrestigeWithState, executePrestige, getPrestigeItemId } from '@/engine/PrestigeEngine';
import { PRESTIGE_RESOURCE_IDS, RESOURCES, resourceById, type ResourceId } from '@/data/resources';
import { RECIPES, recipeById, type RecipeDefinition, type RecipeId, type RecipeIngredient, type RecipeKind } from '@/data/recipes';
import { tutorialQuestByStep } from '@/data/tutorial';
import {
  BASE_PRODUCTION_SLOTS,
  getProductionSlotCount,
  getUpgradeTier,
  MINING_YIELD_BY_LEVEL,
  ROAD_SPEED_BY_LEVEL,
  TRANSPORT_CARGO_BY_LEVEL,
  TRANSPORT_SPEED_BY_LEVEL,
  UPGRADES,
  type UpgradeId,
} from '@/data/upgrades';
import {
  FAMILY_NAMES,
  GIVEN_NAMES,
  WORKER_GRADE_DEFINITIONS,
  WORKER_RECYCLE_REWARDS,
  type Worker,
  type WorkerAbility,
  type WorkerAbilityType,
  type WorkerGrade,
  type WorkerGradeDefinition,
} from '@/data/workers';
import { STAGES } from '@/data/stages';
import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';

const STORE_KEY = 'rawworks-game-store';
const STORE_VERSION = 2;
const SAVE_DEBOUNCE_MS = 2000;
const MAX_WORKER_STORAGE_BASE = 50;
const MANUAL_MINE_COOLDOWN_MS = 5000;
const RECIPE_COST_PER_PRESTIGE = 0.15;
const RECIPE_DURATION_PER_PRESTIGE = 0.1;
const UPGRADE_COST_MULTIPLIER = 1.5;
const PRESTIGE_ITEM_REPEAT_MULTIPLIER = 0.2;
const MAX_COST_MULTIPLIER = 5;
const MAX_DURATION_MULTIPLIER = 3;

export type PrestigeTier = 1 | 2 | 3;

export type ActiveRecipe = {
  recipeId: RecipeId;
  endTime: number;
  slot: number;
};

export type MasteryProgress = {
  level: number;
  xp: number;
};

export type DailyQuest = {
  questId: string;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
};

export type ProgressStats = {
  resourcesMined: number;
  recipesCompleted: number;
  crossCompleted: number;
  tapMineCount: number;
  mountain1TapLog: number;
  workerAssignmentsMade: number;
  upgradesApplied: number;
  roadUpgradesApplied: number;
};

export type OfflineRewardReport = {
  elapsedSec: number;
  earned: Array<{ resourceId: string; amount: number }>;
  miningEarned: Array<{ resourceId: string; amount: number }>;
  productionEarned: Array<{ resourceId: string; amount: number }>;
};

export type PrestigeRewardReport = {
  tier: PrestigeTier;
  ipEarned: number;
  timestamp: number;
};

type TapState = {
  lastTapAt: number;
  lastTappedMountainId: string | null;
  comboMultiplier: number;
  cooldowns: Record<string, number>;
};

type PersistedGameState = {
  resources: Record<ResourceId, number>;
  prestigeItems: Record<ResourceId, number>;
  diamonds: number;
  activeRecipes: ActiveRecipe[];
  upgrades: Record<UpgradeId, number>;
  workers: Worker[];
  workerAssignments: Record<string, string | null>;
  mountainNames: string[];
  gachaPity: number;
  mastery: Record<RecipeId, MasteryProgress>;
  roadLevel: number;
  tutorialStep: number;
  tutorialComplete: boolean;
  achievements: Record<AchievementId, boolean>;
  dailyQuests: DailyQuest[];
  dailyQuestDate: string;
  totalPrestigeCount: number;
  highestStageThisRun: number;
  stage: number;
  prestigeTier: number;
  prestigeCount: Record<PrestigeTier, number>;
  industryPoints: number;
  ipUpgrades: Record<IpUpgradeId, number>;
  stats: ProgressStats;
  lastSaveTime: string;
};

export type GameStoreState = PersistedGameState & {
  tapState: TapState;
  isHydrated: boolean;
  lastOfflineReport: OfflineRewardReport | null;
  lastPrestigeReport: PrestigeRewardReport | null;
  addResource: (id: ResourceId, amount: number, source?: 'mining' | 'recipe' | 'other', mountainId?: string) => void;
  deductResource: (id: ResourceId, amount: number) => boolean;
  startRecipe: (recipeId: RecipeId, slot: number) => boolean;
  completeRecipe: (slot: number) => boolean;
  cancelRecipe: (slot: number) => boolean;
  applyUpgrade: (upgradeId: UpgradeId) => boolean;
  triggerPrestige: (tier: PrestigeTier) => boolean;
  buyIpUpgrade: (upgradeId: IpUpgradeId) => boolean;
  canUnlockTier: (tier: PrestigeTier) => boolean;
  getMaxProductionSlots: () => number;
  getMaxOfflineHours: () => number;
  pullGacha: (type: 'single' | 'ten') => Worker[];
  assignWorker: (mountainId: string, workerId: string) => boolean;
  unassignWorker: (mountainId: string) => boolean;
  getMiningYield: (mountainId: string) => Partial<Record<ResourceId, number>>;
  getMiningCycleMs: (mountainId: string) => number;
  getTransportLevel: () => number;
  getMiningToolLevel: () => number;
  getRoadLevel: () => number;
  upgradeRoad: () => boolean;
  tapMine: (mountainId: string) => boolean;
  recycleWorker: (workerId: string) => boolean;
  feedDuplicateWorker: (targetId: string, feedId: string) => boolean;
  addMasteryXp: (recipeId: RecipeId, xp: number) => void;
  getScaledCost: (recipeId: RecipeId) => RecipeIngredient[];
  getScaledDuration: (recipeId: RecipeId) => number;
  advanceTutorial: (step: number) => void;
  unlockAchievement: (achievementId: AchievementId) => void;
  completeDailyQuest: (questIndex: number) => void;
  refreshDailyQuests: () => void;
  checkDailyQuestProgress: (eventType: DailyQuestEventType, amount: number) => void;
  dismissOfflineReport: () => void;
  dismissPrestigeReport: () => void;
};

const TUTORIAL_REWARDS: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 10,
  5: 10,
  6: 20,
};

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function todayIsoDate(): string {
  return nowIso().slice(0, 10);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function coerceBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 1;
}

function rollRandom(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sampleWithoutReplacement<T>(items: readonly T[], count: number): T[] {
  const copy = [...items];
  const selected: T[] = [];

  while (selected.length < count && copy.length > 0) {
    const index = randomInt(0, copy.length - 1);
    const [item] = copy.splice(index, 1);
    if (item !== undefined) {
      selected.push(item);
    }
  }

  return selected;
}

function createEmptyResourceRecord(includePrestige = false): Record<ResourceId, number> {
  const entries = RESOURCES.filter(
    (resource) => includePrestige || (resource as { isPrestigeItem?: boolean }).isPrestigeItem !== true,
  ).map((resource) => [resource.id, 0]);
  return Object.fromEntries(entries) as Record<ResourceId, number>;
}

function createEmptyPrestigeRecord(): Record<ResourceId, number> {
  return Object.fromEntries(PRESTIGE_RESOURCE_IDS.map((resourceId) => [resourceId, 0])) as Record<ResourceId, number>;
}

function createEmptyUpgradeRecord(): Record<UpgradeId, number> {
  return Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.id, 0])) as Record<UpgradeId, number>;
}

function createEmptyWorkerAssignments(): Record<string, string | null> {
  return Object.fromEntries(MOUNTAINS.map((mountain) => [mountain.id, null]));
}

function createEmptyMasteryRecord(): Record<RecipeId, MasteryProgress> {
  return Object.fromEntries(RECIPES.map((recipe) => [recipe.id, { level: 0, xp: 0 }])) as Record<RecipeId, MasteryProgress>;
}

function createEmptyIpUpgradeRecord(): Record<IpUpgradeId, number> {
  return Object.fromEntries(IP_UPGRADES.map((upgrade) => [upgrade.id, 0])) as Record<IpUpgradeId, number>;
}

function createInitialTapState(): TapState {
  return {
    lastTapAt: 0,
    lastTappedMountainId: null,
    comboMultiplier: 1,
    cooldowns: Object.fromEntries(MOUNTAINS.map((mountain) => [mountain.id, 0])),
  };
}

function createInitialStats(): ProgressStats {
  return {
    resourcesMined: 0,
    recipesCompleted: 0,
    crossCompleted: 0,
    tapMineCount: 0,
    mountain1TapLog: 0,
    workerAssignmentsMade: 0,
    upgradesApplied: 0,
    roadUpgradesApplied: 0,
  };
}

function generateDailyQuests(): DailyQuest[] {
  return sampleWithoutReplacement(DAILY_QUEST_TEMPLATES, 3).map((template) => ({
    questId: template.id,
    progress: 0,
    target: template.target,
    completed: false,
    claimed: false,
  }));
}

function getDailyQuestReward(questId: string): number {
  return DAILY_QUEST_TEMPLATES.find((template) => template.id === questId)?.reward ?? 0;
}

function createBasePersistedState(): PersistedGameState {
  return {
    resources: createEmptyResourceRecord(),
    prestigeItems: createEmptyPrestigeRecord(),
    diamonds: 0,
    activeRecipes: [],
    upgrades: createEmptyUpgradeRecord(),
    workers: [],
    workerAssignments: createEmptyWorkerAssignments(),
    mountainNames: generateMountainNames(MOUNTAINS.length),
    gachaPity: 0,
    mastery: createEmptyMasteryRecord(),
    roadLevel: 0,
    tutorialStep: 0,
    tutorialComplete: false,
    achievements: {},
    dailyQuests: generateDailyQuests(),
    dailyQuestDate: todayIsoDate(),
    totalPrestigeCount: 0,
    highestStageThisRun: 1,
    stage: 1,
    prestigeTier: 0,
    prestigeCount: { 1: 0, 2: 0, 3: 0 },
    industryPoints: 0,
    ipUpgrades: createEmptyIpUpgradeRecord(),
    stats: createInitialStats(),
    lastSaveTime: nowIso(),
  };
}

function mergePersistedState(partialState: Partial<PersistedGameState> | undefined): PersistedGameState {
  const base = createBasePersistedState();
  const normalizedDailyQuests = partialState?.dailyQuests?.length
    ? partialState.dailyQuests.map((quest, index) => ({
        questId: quest.questId ?? base.dailyQuests[index]?.questId ?? DAILY_QUEST_TEMPLATES[0]?.id ?? 'daily_quest',
        progress: typeof quest.progress === 'number' ? quest.progress : 0,
        target: typeof quest.target === 'number' ? quest.target : base.dailyQuests[index]?.target ?? 0,
        completed: coerceBoolean(quest.completed),
        claimed: coerceBoolean(quest.claimed),
      }))
    : base.dailyQuests;
  const normalizedWorkers = partialState?.workers?.map((worker) => ({
    ...worker,
    locked: coerceBoolean(worker.locked),
  })) ?? base.workers;
  const normalizedAchievements = Object.fromEntries(
    Object.entries({ ...base.achievements, ...partialState?.achievements }).map(([achievementId, unlocked]) => [achievementId, coerceBoolean(unlocked)]),
  ) as Record<AchievementId, boolean>;
  const normalizedPrestigeCount: Record<PrestigeTier, number> = {
    1: typeof partialState?.prestigeCount?.[1] === 'number' ? partialState.prestigeCount[1] : base.prestigeCount[1],
    2: typeof partialState?.prestigeCount?.[2] === 'number' ? partialState.prestigeCount[2] : base.prestigeCount[2],
    3: typeof partialState?.prestigeCount?.[3] === 'number' ? partialState.prestigeCount[3] : base.prestigeCount[3],
  };

  return {
    resources: { ...base.resources, ...partialState?.resources },
    prestigeItems: { ...base.prestigeItems, ...partialState?.prestigeItems },
    diamonds: typeof partialState?.diamonds === 'number' ? partialState.diamonds : base.diamonds,
    activeRecipes: Array.isArray(partialState?.activeRecipes) ? partialState.activeRecipes : base.activeRecipes,
    upgrades: { ...base.upgrades, ...partialState?.upgrades },
    workers: normalizedWorkers,
    workerAssignments: { ...base.workerAssignments, ...partialState?.workerAssignments },
    mountainNames:
      partialState?.mountainNames && partialState.mountainNames.length === MOUNTAINS.length
        ? partialState.mountainNames
        : base.mountainNames,
    gachaPity: typeof partialState?.gachaPity === 'number' ? partialState.gachaPity : base.gachaPity,
    mastery: { ...base.mastery, ...partialState?.mastery },
    roadLevel: clamp(typeof partialState?.roadLevel === 'number' ? partialState.roadLevel : base.roadLevel, 0, 4),
    tutorialStep: typeof partialState?.tutorialStep === 'number' ? partialState.tutorialStep : base.tutorialStep,
    tutorialComplete: coerceBoolean(partialState?.tutorialComplete ?? base.tutorialComplete),
    achievements: normalizedAchievements,
    dailyQuests: normalizedDailyQuests,
    dailyQuestDate: typeof partialState?.dailyQuestDate === 'string' ? partialState.dailyQuestDate : base.dailyQuestDate,
    totalPrestigeCount: typeof partialState?.totalPrestigeCount === 'number' ? partialState.totalPrestigeCount : base.totalPrestigeCount,
    highestStageThisRun: clamp(typeof partialState?.highestStageThisRun === 'number' ? partialState.highestStageThisRun : base.highestStageThisRun, 1, 8),
    stage: clamp(typeof partialState?.stage === 'number' ? partialState.stage : base.stage, 1, 8),
    prestigeTier: clamp(typeof partialState?.prestigeTier === 'number' ? partialState.prestigeTier : base.prestigeTier, 0, 3),
    prestigeCount: normalizedPrestigeCount,
    industryPoints: typeof partialState?.industryPoints === 'number' ? partialState.industryPoints : base.industryPoints,
    ipUpgrades: { ...base.ipUpgrades, ...partialState?.ipUpgrades },
    stats: { ...base.stats, ...partialState?.stats },
    lastSaveTime: typeof partialState?.lastSaveTime === 'string' ? partialState.lastSaveTime : base.lastSaveTime,
  };
}

function migratePersistedState(persistedState: unknown, version: number): PersistedGameState {
  const state = typeof persistedState === 'object' && persistedState !== null ? (persistedState as Partial<PersistedGameState>) : undefined;

  switch (version) {
    case 0:
    case 1:
    case 2:
    default:
      return mergePersistedState(state);
  }
}

const debouncedStorage: PersistStorage<PersistedGameState> = {
  getItem: async (name) => {
    const raw = await AsyncStorage.getItem(name);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { version?: number } & Partial<PersistedGameState>;
    const { version = 0, ...state } = parsed;

    return {
      state: state as PersistedGameState,
      version,
    };
  },
  setItem: async (name, value) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    await new Promise<void>((resolve) => {
      saveTimeout = setTimeout(() => {
        void AsyncStorage.setItem(name, JSON.stringify({ version: value.version, ...value.state })).finally(() => resolve());
      }, SAVE_DEBOUNCE_MS);
    });
  },
  removeItem: async (name) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }

    await AsyncStorage.removeItem(name);
  },
};

function withTimestamp<T extends object>(partial: T): T & Pick<PersistedGameState, 'lastSaveTime'> {
  return {
    ...partial,
    lastSaveTime: nowIso(),
  };
}

function getRequiredXpForLevel(level: number): number {
  return Math.ceil(5 * level ** 1.5);
}

function getMasteryLevelCap(kind: RecipeKind): number {
  if (kind === 'cross') {
    return 15;
  }

  if (kind === 'prestige') {
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

function getWorkerStorageCapacity(ipUpgrades: Record<IpUpgradeId, number>): number {
  return MAX_WORKER_STORAGE_BASE + ipUpgrades.worker_storage * 10;
}

function getIpMiningBoost(level: number): number {
  return 1 + level * 0.25;
}

function getIpSmeltingMultiplier(level: number): number {
  return 1 - Math.min(level * 0.1, 0.8);
}

function getWorkerAbilityMultiplier(worker: Worker | undefined, abilityType: WorkerAbilityType): number {
  if (!worker) {
    return 1;
  }

  return worker.abilities
    .filter((ability) => ability.type === abilityType)
    .reduce((highest, ability) => Math.max(highest, ability.multiplier), 1);
}

function getWorkerPowerChance(worker: Worker | undefined): number {
  if (!worker) {
    return 0;
  }

  const powerMultiplier = getWorkerAbilityMultiplier(worker, 'power');
  return Math.max(0, powerMultiplier - 1);
}

function getRecipeOrThrow(recipeId: RecipeId): RecipeDefinition {
  const recipe = recipeById[recipeId];

  if (!recipe) {
    throw new Error(`Unknown recipe: ${recipeId}`);
  }

  return recipe;
}

function isPrestigeResource(resourceId: ResourceId): boolean {
  return resourceById[resourceId].isPrestigeItem === true;
}

function canAffordIngredients(state: PersistedGameState, ingredients: RecipeIngredient[]): boolean {
  return ingredients.every((ingredient) => {
    const targetBucket = isPrestigeResource(ingredient.resourceId) ? state.prestigeItems : state.resources;
    return (targetBucket[ingredient.resourceId] ?? 0) >= ingredient.amount;
  });
}

function applyIngredientDelta(
  bucket: PersistedGameState,
  ingredients: RecipeIngredient[],
  direction: 'add' | 'deduct',
): Pick<PersistedGameState, 'resources' | 'prestigeItems'> {
  const resources = { ...bucket.resources };
  const prestigeItems = { ...bucket.prestigeItems };

  for (const ingredient of ingredients) {
    const multiplier = direction === 'add' ? 1 : -1;

    if (isPrestigeResource(ingredient.resourceId)) {
      prestigeItems[ingredient.resourceId] = (prestigeItems[ingredient.resourceId] ?? 0) + ingredient.amount * multiplier;
      continue;
    }

    resources[ingredient.resourceId] = (resources[ingredient.resourceId] ?? 0) + ingredient.amount * multiplier;
  }

  return { resources, prestigeItems };
}

function getAchievementReward(achievementId: AchievementId): number {
  return achievementById[achievementId]?.reward ?? 10;
}

function pickWorkerGrade(pity: number): WorkerGrade {
  if (pity >= 50) {
    return 'L';
  }

  const roll = Math.random();

  if (roll < WORKER_GRADE_DEFINITIONS.L.rate) {
    return 'L';
  }

  if (roll < WORKER_GRADE_DEFINITIONS.L.rate + WORKER_GRADE_DEFINITIONS.U.rate) {
    return 'U';
  }

  if (roll < WORKER_GRADE_DEFINITIONS.L.rate + WORKER_GRADE_DEFINITIONS.U.rate + WORKER_GRADE_DEFINITIONS.R.rate) {
    return 'R';
  }

  return 'N';
}

function createWorker(grade: WorkerGrade): Worker {
  const definition = WORKER_GRADE_DEFINITIONS[grade];
  const abilityCount = randomInt(definition.abilityCount.min, definition.abilityCount.max);
  const abilityTypes = sampleWithoutReplacement<WorkerAbilityType>(['yield', 'speed', 'power'], abilityCount);

  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    name: `${FAMILY_NAMES[randomInt(0, FAMILY_NAMES.length - 1)]} ${GIVEN_NAMES[randomInt(0, GIVEN_NAMES.length - 1)]}`,
    grade,
    abilities: abilityTypes.map((abilityType) => ({
      type: abilityType,
      multiplier: roundToSingleDecimal(rollRandom(definition.multiplierRange.min, definition.multiplierRange.max)),
    })),
    level: 1,
    dupeCount: 0,
    locked: false,
  };
}

function shouldAdvanceStage(state: PersistedGameState): number {
  let nextStage = state.stage;

  while (nextStage < STAGES.length) {
    const currentStage = STAGES.find((stage) => stage.id === nextStage);
    const transition = currentStage?.transitionToNext;

    if (!transition) {
      break;
    }

    let passed = false;

    if (transition.type === 'upgrade_levels') {
      passed = Object.entries(transition.upgrades).every(([upgradeId, level]) => {
        if (level === undefined) {
          return true;
        }

        return (state.upgrades[upgradeId as UpgradeId] ?? 0) >= level;
      });
    }

    if (transition.type === 'resource_counts') {
      passed = Object.entries(transition.resources).every(([resourceId, amount]) => {
        if (amount === undefined) {
          return true;
        }

        return (state.resources[resourceId as ResourceId] ?? 0) >= amount;
      });
    }

    if (!passed) {
      break;
    }

    nextStage += 1;
  }

  return nextStage;
}

function syncDerivedStage(state: PersistedGameState): Pick<PersistedGameState, 'stage' | 'highestStageThisRun'> {
  const nextStage = shouldAdvanceStage(state);
  return {
    stage: nextStage,
    highestStageThisRun: Math.max(state.highestStageThisRun, nextStage),
  };
}

function getSmeltingMultiplier(state: PersistedGameState, recipeId: RecipeId): number {
  const recipe = getRecipeOrThrow(recipeId);
  if (recipe.kind !== 'chain') {
    return 1;
  }

  const smeltingTier = getUpgradeTier('smelting', state.upgrades.smelting);
  const smeltingMultiplier = smeltingTier?.effect.smeltingTimeMultiplier ?? 1;
  const ipMultiplier = getIpSmeltingMultiplier(state.ipUpgrades.smelting_accel);
  const energyGridMultiplier = state.upgrades.energy_grid >= 1 ? 1 / 1.5 : 1;

  return smeltingMultiplier * ipMultiplier * energyGridMultiplier;
}

function getPersistedSlice(state: GameStoreState): PersistedGameState {
  return {
    resources: state.resources,
    prestigeItems: state.prestigeItems,
    diamonds: state.diamonds,
    activeRecipes: state.activeRecipes,
    upgrades: state.upgrades,
    workers: state.workers,
    workerAssignments: state.workerAssignments,
    mountainNames: state.mountainNames,
    gachaPity: state.gachaPity,
    mastery: state.mastery,
    roadLevel: state.roadLevel,
    tutorialStep: state.tutorialStep,
    tutorialComplete: state.tutorialComplete,
    achievements: state.achievements,
    dailyQuests: state.dailyQuests,
    dailyQuestDate: state.dailyQuestDate,
    totalPrestigeCount: state.totalPrestigeCount,
    highestStageThisRun: state.highestStageThisRun,
    stage: state.stage,
    prestigeTier: state.prestigeTier,
    prestigeCount: state.prestigeCount,
    industryPoints: state.industryPoints,
    ipUpgrades: state.ipUpgrades,
    stats: state.stats,
    lastSaveTime: state.lastSaveTime,
  };
}

const initialPersistedState = createBasePersistedState();

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      ...initialPersistedState,
      tapState: createInitialTapState(),
      isHydrated: false,
      lastOfflineReport: null,
      lastPrestigeReport: null,

      addResource: (id, amount, source = 'other', mountainId) => {
        if (amount <= 0) {
          return;
        }

        set((state) => {
          const updatedResources = { ...state.resources };
          const updatedPrestigeItems = { ...state.prestigeItems };

          if (isPrestigeResource(id)) {
            updatedPrestigeItems[id] = (updatedPrestigeItems[id] ?? 0) + amount;
          } else {
            updatedResources[id] = (updatedResources[id] ?? 0) + amount;
          }

          const nextBaseState: PersistedGameState = {
            ...getPersistedSlice(state),
            resources: updatedResources,
            prestigeItems: updatedPrestigeItems,
            stats: {
              ...state.stats,
              resourcesMined:
                source === 'mining' && resourceById[id].isRaw
                  ? state.stats.resourcesMined + amount
                  : state.stats.resourcesMined,
              mountain1TapLog:
                source === 'mining' && mountainId === 'mountain_1' && id === 'log'
                  ? state.stats.mountain1TapLog + amount
                  : state.stats.mountain1TapLog,
            },
          };

          return withTimestamp({
            resources: updatedResources,
            prestigeItems: updatedPrestigeItems,
            stats: nextBaseState.stats,
            ...syncDerivedStage(nextBaseState),
          });
        });
      },

      deductResource: (id, amount) => {
        if (amount <= 0) {
          return true;
        }

        const state = get();
        const targetBucket = isPrestigeResource(id) ? state.prestigeItems : state.resources;
        const currentAmount = targetBucket[id] ?? 0;

        if (currentAmount < amount) {
          return false;
        }

        set((currentState) => {
          const updatedResources = { ...currentState.resources };
          const updatedPrestigeItems = { ...currentState.prestigeItems };

          if (isPrestigeResource(id)) {
            updatedPrestigeItems[id] = currentAmount - amount;
          } else {
            updatedResources[id] = currentAmount - amount;
          }

          return withTimestamp({ resources: updatedResources, prestigeItems: updatedPrestigeItems });
        });

        return true;
      },

      startRecipe: (recipeId, slot) => {
        const state = get();
        const recipe = getRecipeOrThrow(recipeId);
        const maxSlots = state.getMaxProductionSlots();

        if (slot < 0 || slot >= maxSlots) {
          return false;
        }

        if (recipe.unlockedAtStage > state.stage) {
          return false;
        }

        if (state.activeRecipes.some((activeRecipe) => activeRecipe.slot === slot)) {
          return false;
        }

        const scaledInputs = state.getScaledCost(recipeId);
        if (!canAffordIngredients(state, scaledInputs)) {
          return false;
        }

        const ingredientDelta = applyIngredientDelta(getPersistedSlice(state), scaledInputs, 'deduct');
        const durationMs = state.getScaledDuration(recipeId);

        set((currentState) =>
          withTimestamp({
            resources: ingredientDelta.resources,
            prestigeItems: ingredientDelta.prestigeItems,
            activeRecipes: [...currentState.activeRecipes, { recipeId, endTime: Date.now() + durationMs, slot }],
          }),
        );

        return true;
      },

      completeRecipe: (slot) => {
        const state = get();
        const activeRecipe = state.activeRecipes.find((entry) => entry.slot === slot);

        if (!activeRecipe) {
          return false;
        }

        const recipe = getRecipeOrThrow(activeRecipe.recipeId);
        const mastery = state.mastery[activeRecipe.recipeId] ?? { level: 0, xp: 0 };
        const outputAmount = Math.max(1, Math.floor(recipe.output.amount * (1 + getMasteryYieldBonus(mastery.level))));

        set((currentState) => {
          const resources = { ...currentState.resources };
          const prestigeItems = { ...currentState.prestigeItems };

          if (isPrestigeResource(recipe.output.resourceId)) {
            prestigeItems[recipe.output.resourceId] = (prestigeItems[recipe.output.resourceId] ?? 0) + outputAmount;
          } else {
            resources[recipe.output.resourceId] = (resources[recipe.output.resourceId] ?? 0) + outputAmount;
          }

          const nextBaseState: PersistedGameState = {
            ...getPersistedSlice(currentState),
            resources,
            prestigeItems,
          };

          return withTimestamp({
            resources,
            prestigeItems,
            activeRecipes: currentState.activeRecipes.filter((entry) => entry.slot !== slot),
            stats: {
              ...currentState.stats,
              recipesCompleted: currentState.stats.recipesCompleted + 1,
              crossCompleted:
                recipe.kind === 'cross' || recipe.kind === 'prestige'
                  ? currentState.stats.crossCompleted + 1
                  : currentState.stats.crossCompleted,
            },
            ...syncDerivedStage(nextBaseState),
          });
        });

        state.addMasteryXp(activeRecipe.recipeId, recipe.kind === 'cross' ? 2 : recipe.kind === 'prestige' ? 3 : 1);
        state.checkDailyQuestProgress('recipe_complete', 1);
        if (recipe.kind === 'cross' || recipe.kind === 'prestige') {
          state.checkDailyQuestProgress('cross_complete', 1);
        }

        return true;
      },

      cancelRecipe: (slot) => {
        const state = get();
        const activeRecipe = state.activeRecipes.find((entry) => entry.slot === slot);

        if (!activeRecipe) {
          return false;
        }

        set((currentState) =>
          withTimestamp({
            activeRecipes: currentState.activeRecipes.filter((entry) => entry.slot !== slot),
          }),
        );

        return true;
      },

      applyUpgrade: (upgradeId) => {
        const state = get();
        const currentLevel = state.upgrades[upgradeId] ?? 0;
        const nextTier = getUpgradeTier(upgradeId, currentLevel + 1);

        if (!nextTier || nextTier.unlockedAtStage > state.stage) {
          return false;
        }

        const scaledCost = nextTier.cost.map((ingredient) => ({
          ...ingredient,
          amount: Math.ceil(ingredient.amount * UPGRADE_COST_MULTIPLIER ** currentLevel),
        }));

        if (!canAffordIngredients(state, scaledCost)) {
          return false;
        }

        const ingredientDelta = applyIngredientDelta(getPersistedSlice(state), scaledCost, 'deduct');

        set((currentState) => {
          const upgrades = { ...currentState.upgrades, [upgradeId]: currentLevel + 1 };
          const nextBaseState: PersistedGameState = {
            ...getPersistedSlice(currentState),
            resources: ingredientDelta.resources,
            prestigeItems: ingredientDelta.prestigeItems,
            upgrades,
            roadLevel: upgradeId === 'road' ? currentLevel + 1 : currentState.roadLevel,
          };

          return withTimestamp({
            resources: ingredientDelta.resources,
            prestigeItems: ingredientDelta.prestigeItems,
            upgrades,
            roadLevel: upgradeId === 'road' ? currentLevel + 1 : currentState.roadLevel,
            stats: {
              ...currentState.stats,
              upgradesApplied: currentState.stats.upgradesApplied + 1,
              roadUpgradesApplied:
                upgradeId === 'road' ? currentState.stats.roadUpgradesApplied + 1 : currentState.stats.roadUpgradesApplied,
            },
            ...syncDerivedStage(nextBaseState),
          });
        });

        state.checkDailyQuestProgress(upgradeId === 'road' ? 'road_upgrade' : 'upgrade_apply', 1);
        if (upgradeId === 'road') {
          state.checkDailyQuestProgress('upgrade_apply', 1);
        }

        return true;
      },

      triggerPrestige: (tier) => {
        const state = get();
        const prestigeResourceId = getPrestigeItemId(tier);

        if ((state.prestigeItems[prestigeResourceId] ?? 0) < 1) {
          return false;
        }

        if (!canPrestigeWithState({ tier, prestigeItems: state.prestigeItems, canUnlockTier: state.canUnlockTier })) {
          return false;
        }

        const prestigeResult = executePrestige(getPersistedSlice(state), tier);

        set((currentState) => {
          return withTimestamp({
            resources: prestigeResult.resources,
            activeRecipes: prestigeResult.activeRecipes,
            upgrades: prestigeResult.upgrades,
            roadLevel: prestigeResult.roadLevel,
            workerAssignments: currentState.workerAssignments,
            stage: prestigeResult.stage,
            highestStageThisRun: prestigeResult.highestStageThisRun,
            totalPrestigeCount: prestigeResult.totalPrestigeCount,
            prestigeTier: prestigeResult.prestigeTier,
            prestigeCount: prestigeResult.prestigeCount,
            industryPoints: prestigeResult.industryPoints,
            stats: currentState.stats,
            tapState: createInitialTapState(),
            lastPrestigeReport: {
              tier,
              ipEarned: prestigeResult.ipEarned,
              timestamp: Date.now(),
            },
          });
        });

        return true;
      },

      buyIpUpgrade: (upgradeId) => {
        const state = get();
        const definition = ipUpgradeById[upgradeId];
        const currentLevel = state.ipUpgrades[upgradeId] ?? 0;

        if (currentLevel >= definition.maxLevel) {
          return false;
        }

        const cost = definition.cost;
        if (state.industryPoints < cost) {
          return false;
        }

        set((currentState) =>
          withTimestamp({
            industryPoints: currentState.industryPoints - cost,
            ipUpgrades: {
              ...currentState.ipUpgrades,
              [upgradeId]: currentLevel + 1,
            },
          }),
        );

        return true;
      },

      canUnlockTier: (tier) => {
        if (tier === 1) {
          return true;
        }

        const unlockedLevel = get().ipUpgrades.tier_unlock;
        return unlockedLevel >= tier - 1;
      },

      getMaxProductionSlots: () => {
        const state = get();
        return getProductionSlotCount(state.upgrades.workbench, state.ipUpgrades.slot_expansion);
      },

      getMaxOfflineHours: () => {
        const state = get();
        return Math.min(24, 8 + state.upgrades.automation * 2 + state.ipUpgrades.offline_boost * 2);
      },

      pullGacha: (type) => {
        const state = get();
        const cost = type === 'ten' ? 450 : 50;
        const pulls = type === 'ten' ? 10 : 1;
        const capacity = getWorkerStorageCapacity(state.ipUpgrades);

        if (state.diamonds < cost || state.workers.length + pulls > capacity) {
          return [];
        }

        let pity = state.gachaPity;
        const generatedWorkers: Worker[] = [];

        for (let index = 0; index < pulls; index += 1) {
          pity += 1;
          const grade = pickWorkerGrade(pity);
          if (grade === 'L') {
            pity = 0;
          }
          generatedWorkers.push(createWorker(grade));
        }

        if (type === 'ten' && !generatedWorkers.some((worker) => worker.grade !== 'N')) {
          generatedWorkers[0] = createWorker('R');
        }

        set((currentState) =>
          withTimestamp({
            diamonds: currentState.diamonds - cost,
            gachaPity: pity,
            workers: [...currentState.workers, ...generatedWorkers],
          }),
        );

        return generatedWorkers;
      },

      assignWorker: (mountainId, workerId) => {
        const state = get();

        if (!mountainById[mountainId]) {
          return false;
        }

        const worker = state.workers.find((candidate) => candidate.id === workerId);
        if (!worker) {
          return false;
        }

        set((currentState) => {
          const workerAssignments = { ...currentState.workerAssignments };

          for (const [assignedMountainId, assignedWorkerId] of Object.entries(workerAssignments)) {
            if (assignedWorkerId === workerId) {
              workerAssignments[assignedMountainId] = null;
            }
          }

          workerAssignments[mountainId] = workerId;

          return withTimestamp({ workerAssignments });
        });

        set((currentState) =>
          withTimestamp({
            stats: {
              ...currentState.stats,
              workerAssignmentsMade: currentState.stats.workerAssignmentsMade + 1,
            },
          }),
        );

        state.checkDailyQuestProgress('worker_assign', 1);
        return true;
      },

      unassignWorker: (mountainId) => {
        const state = get();
        if (!mountainById[mountainId] || state.workerAssignments[mountainId] === null) {
          return false;
        }

        set((currentState) =>
          withTimestamp({
            workerAssignments: {
              ...currentState.workerAssignments,
              [mountainId]: null,
            },
          }),
        );

        return true;
      },

      getMiningYield: (mountainId) => {
        const state = get();
        const mountain = mountainById[mountainId];

        if (!mountain) {
          return {};
        }

        const assignedWorkerId = state.workerAssignments[mountainId];
        const worker = state.workers.find((candidate) => candidate.id === assignedWorkerId);
        const workerYield = getWorkerAbilityMultiplier(worker, 'yield');
        const transportCargo = TRANSPORT_CARGO_BY_LEVEL[state.upgrades.transport] ?? TRANSPORT_CARGO_BY_LEVEL[0];
        const miningYield = MINING_YIELD_BY_LEVEL[state.upgrades.mining_tool] ?? MINING_YIELD_BY_LEVEL[0];
        const ipMiningBoost = getIpMiningBoost(state.ipUpgrades.mining_boost);
        const amount = transportCargo * miningYield * ipMiningBoost * workerYield;

        return Object.fromEntries(mountain.resources.map((resourceId) => [resourceId, amount])) as Partial<Record<ResourceId, number>>;
      },

      getMiningCycleMs: (mountainId) => {
        const state = get();
        const mountain = mountainById[mountainId];

        if (!mountain) {
          return 0;
        }

        const assignedWorkerId = state.workerAssignments[mountainId];
        const worker = state.workers.find((candidate) => candidate.id === assignedWorkerId);
        const transportSpeed = TRANSPORT_SPEED_BY_LEVEL[state.upgrades.transport] ?? TRANSPORT_SPEED_BY_LEVEL[0];
        const roadSpeed = ROAD_SPEED_BY_LEVEL[state.roadLevel] ?? ROAD_SPEED_BY_LEVEL[0];
        const ipMiningSpeed = getIpMiningBoost(state.ipUpgrades.mining_boost);
        const workerSpeed = getWorkerAbilityMultiplier(worker, 'speed');

        return (mountain.baseRoundTripSec * 1000) / (transportSpeed * roadSpeed * ipMiningSpeed * workerSpeed);
      },

      getTransportLevel: () => get().upgrades.transport,
      getMiningToolLevel: () => get().upgrades.mining_tool,
      getRoadLevel: () => get().roadLevel,

      upgradeRoad: () => get().applyUpgrade('road'),

      tapMine: (mountainId) => {
        const state = get();
        const mountain = mountainById[mountainId];

        if (!mountain || mountain.unlockedAtStage > state.stage) {
          return false;
        }

        const now = Date.now();
        const lastCooldownAt = state.tapState.cooldowns[mountainId] ?? 0;
        if (now - lastCooldownAt < MANUAL_MINE_COOLDOWN_MS) {
          return false;
        }

        const withinComboWindow = now - state.tapState.lastTapAt <= MANUAL_MINE_COOLDOWN_MS;
        const isDifferentMountain = state.tapState.lastTappedMountainId !== mountainId;
        const comboMultiplier = withinComboWindow && isDifferentMountain
          ? state.tapState.comboMultiplier === 1
            ? 1.5
            : state.tapState.comboMultiplier === 1.5
              ? 2
              : 3
          : 1;

        const yields = state.getMiningYield(mountainId);

        set((currentState) => {
          const resources = { ...currentState.resources };

          for (const [resourceId, amount] of Object.entries(yields) as [ResourceId, number][]) {
            resources[resourceId] = (resources[resourceId] ?? 0) + amount * comboMultiplier;
          }

          const nextBaseState: PersistedGameState = {
            ...getPersistedSlice(currentState),
            resources,
          };

          return withTimestamp({
            resources,
            stats: {
              ...currentState.stats,
              resourcesMined:
                currentState.stats.resourcesMined + Object.values(yields).reduce((sum, amount) => sum + amount * comboMultiplier, 0),
              tapMineCount: currentState.stats.tapMineCount + 1,
              mountain1TapLog:
                mountainId === 'mountain_1'
                  ? currentState.stats.mountain1TapLog + (((yields.log as number | undefined) ?? 0) * comboMultiplier)
                  : currentState.stats.mountain1TapLog,
            },
            tapState: {
              lastTapAt: now,
              lastTappedMountainId: mountainId,
              comboMultiplier,
              cooldowns: {
                ...currentState.tapState.cooldowns,
                [mountainId]: now,
              },
            },
            ...syncDerivedStage(nextBaseState),
          });
        });

        state.checkDailyQuestProgress('tap_mine', 1);
        state.checkDailyQuestProgress('mining_tick', mountain.resources.length);
        return true;
      },

      recycleWorker: (workerId) => {
        const state = get();
        const worker = state.workers.find((candidate) => candidate.id === workerId);

        if (!worker || worker.locked) {
          return false;
        }

        set((currentState) => {
          const workerAssignments = { ...currentState.workerAssignments };
          for (const [mountainId, assignedWorkerId] of Object.entries(workerAssignments)) {
            if (assignedWorkerId === workerId) {
              workerAssignments[mountainId] = null;
            }
          }

          return withTimestamp({
            workers: currentState.workers.filter((candidate) => candidate.id !== workerId),
            workerAssignments,
            diamonds: currentState.diamonds + WORKER_RECYCLE_REWARDS[worker.grade],
          });
        });

        return true;
      },

      feedDuplicateWorker: (targetId, feedId) => {
        if (targetId === feedId) {
          return false;
        }

        const state = get();
        const targetWorker = state.workers.find((worker) => worker.id === targetId);
        const feedWorker = state.workers.find((worker) => worker.id === feedId);

        if (!targetWorker || !feedWorker || targetWorker.grade !== feedWorker.grade) {
          return false;
        }

        const gradeDefinition = WORKER_GRADE_DEFINITIONS[targetWorker.grade];
        if (targetWorker.dupeCount >= gradeDefinition.dupeCap) {
          return false;
        }

        set((currentState) => {
          const updatedWorkers = currentState.workers
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
                  multiplier: roundToSingleDecimal(ability.multiplier + gradeDefinition.levelBonus),
                })),
              };
            });

          const workerAssignments = { ...currentState.workerAssignments };
          for (const [mountainId, assignedWorkerId] of Object.entries(workerAssignments)) {
            if (assignedWorkerId === feedId) {
              workerAssignments[mountainId] = null;
            }
          }

          return withTimestamp({ workers: updatedWorkers, workerAssignments });
        });

        return true;
      },

      addMasteryXp: (recipeId, xp) => {
        if (xp <= 0) {
          return;
        }

        set((state) => {
          const recipe = getRecipeOrThrow(recipeId);
          const current = state.mastery[recipeId] ?? { level: 0, xp: 0 };
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

          return withTimestamp({
            mastery: {
              ...state.mastery,
              [recipeId]: {
                level: nextLevel,
                xp: nextXp,
              },
            },
          });
        });
      },

      getScaledCost: (recipeId) => {
        const state = get();
        const recipe = getRecipeOrThrow(recipeId);
        const baseMultiplier = Math.min(
          (1 + state.totalPrestigeCount * RECIPE_COST_PER_PRESTIGE) * (1 + state.stage * 0.1),
          MAX_COST_MULTIPLIER,
        );
        const prestigeRepeatMultiplier =
          recipe.kind === 'prestige'
            ? 1 +
              PRESTIGE_ITEM_REPEAT_MULTIPLIER *
                (recipe.output.resourceId === 'small_factory'
                  ? state.prestigeCount[1]
                  : recipe.output.resourceId === 'industrial_complex'
                    ? state.prestigeCount[2]
                    : state.prestigeCount[3])
            : 1;

        return recipe.inputs.map((ingredient) => ({
          ...ingredient,
          amount: Math.ceil(ingredient.amount * baseMultiplier * prestigeRepeatMultiplier),
        }));
      },

      getScaledDuration: (recipeId) => {
        const state = get();
        const recipe = getRecipeOrThrow(recipeId);
        const mastery = state.mastery[recipeId] ?? { level: 0, xp: 0 };
        const baseDurationMs = recipe.baseDurationSec * 1000;
        const prestigeMultiplier = Math.min(1 + state.totalPrestigeCount * RECIPE_DURATION_PER_PRESTIGE, MAX_DURATION_MULTIPLIER);
        const masteryReduction = 1 - getMasteryTimeReduction(mastery.level);
        const smeltingMultiplier = getSmeltingMultiplier(state, recipeId);

        return Math.max(baseDurationMs * 0.2, baseDurationMs * prestigeMultiplier * masteryReduction * smeltingMultiplier);
      },

      advanceTutorial: (step) => {
        set((state) => {
          if (state.tutorialComplete || step < 1 || step > 6 || step < state.tutorialStep) {
            return state;
          }

          const reward = tutorialQuestByStep[step]?.reward ?? TUTORIAL_REWARDS[step] ?? 0;
          const nextStep = step >= 6 ? 7 : step + 1;

          return withTimestamp({
            tutorialStep: nextStep,
            tutorialComplete: step >= 6,
            diamonds: state.diamonds + reward,
          });
        });
      },

      unlockAchievement: (achievementId) => {
        const state = get();
        if (state.achievements[achievementId]) {
          return;
        }

        set((currentState) =>
          withTimestamp({
            achievements: {
              ...currentState.achievements,
              [achievementId]: true,
            },
            diamonds: currentState.diamonds + getAchievementReward(achievementId),
          }),
        );
      },

      completeDailyQuest: (questIndex) => {
        const state = get();
        const quest = state.dailyQuests[questIndex];

        if (!quest || !quest.completed || quest.claimed) {
          return;
        }

        set((currentState) => {
          const dailyQuests = currentState.dailyQuests.map((entry, index) =>
            index === questIndex ? { ...entry, progress: entry.target, completed: true, claimed: true } : entry,
          );
          const claimedAfterUpdate = dailyQuests.every((entry) => entry.claimed);
          const bonus = claimedAfterUpdate && !currentState.dailyQuests.every((entry) => entry.claimed) ? DAILY_QUEST_COMPLETION_BONUS : 0;

          return withTimestamp({
            dailyQuests,
            diamonds: currentState.diamonds + getDailyQuestReward(quest.questId) + bonus,
          });
        });
      },

      refreshDailyQuests: () => {
        const today = todayIsoDate();
        if (get().dailyQuestDate === today) {
          return;
        }

        set(() =>
          withTimestamp({
            dailyQuests: generateDailyQuests(),
            dailyQuestDate: today,
          }),
        );
      },

      checkDailyQuestProgress: (eventType, amount) => {
        if (amount <= 0) {
          return;
        }

        set((state) => {
          const updatedQuests = state.dailyQuests.map((quest) => {
            if (quest.completed) {
              return quest;
            }

            const template = DAILY_QUEST_TEMPLATES.find((candidate) => candidate.id === quest.questId);
            if (!template || template.eventType !== eventType) {
              return quest;
            }

            const progress = Math.min(quest.target, quest.progress + amount);
            return {
              ...quest,
              progress,
              completed: progress >= quest.target,
              claimed: quest.claimed,
            };
          });

          return withTimestamp({ dailyQuests: updatedQuests });
        });
      },

      dismissOfflineReport: () => {
        set({ lastOfflineReport: null });
      },

      dismissPrestigeReport: () => {
        set({ lastPrestigeReport: null });
      },
    }),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: debouncedStorage,
      partialize: (state) => getPersistedSlice(state),
      migrate: (persistedState, version) => migratePersistedState(persistedState, version),
      merge: (_persistedState, currentState) => ({
        ...currentState,
        ...mergePersistedState(_persistedState as Partial<PersistedGameState>),
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        const mountainNames = state.mountainNames.length ? state.mountainNames : generateMountainNames(MOUNTAINS.length);
        useGameStore.setState({
          mountainNames,
          isHydrated: true,
          lastSaveTime: nowIso(),
        });
        useGameStore.getState().refreshDailyQuests();
      },
    },
  ),
);

export { BASE_PRODUCTION_SLOTS };