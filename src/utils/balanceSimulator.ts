import { MOUNTAINS } from '@/data/mountains';
import { RECIPES, recipeById, type RecipeDefinition, type RecipeId } from '@/data/recipes';
import type { ResourceId } from '@/data/resources';
import { stageById } from '@/data/stages';
import {
  BASE_PRODUCTION_SLOTS,
  MINING_YIELD_BY_LEVEL,
  ROAD_SPEED_BY_LEVEL,
  TRANSPORT_CARGO_BY_LEVEL,
  TRANSPORT_SPEED_BY_LEVEL,
  upgradeById,
} from '@/data/upgrades';

type Inventory = Record<ResourceId, number>;

type ActiveRecipe = {
  recipeId: RecipeId;
  remainingSec: number;
};

type Strategy = {
  id: string;
  name: string;
  phases: Phase[];
};

type Phase = {
  id: string;
  description: string;
  targets: Partial<Record<ResourceId, number>>;
  onComplete: (state: SimulationState) => void;
};

type SimulationState = {
  timeSec: number;
  stage: number;
  transportLevel: number;
  miningToolLevel: number;
  roadLevel: number;
  inventory: Inventory;
  activeRecipes: ActiveRecipe[];
  currentPhaseIndex: number;
  completedPhaseTimes: Array<{ id: string; timeSec: number }>;
};

type StrategyReport = {
  strategyId: string;
  strategyName: string;
  totalMinutes: number;
  finalState: Pick<SimulationState, 'stage' | 'transportLevel' | 'miningToolLevel' | 'roadLevel'>;
  phaseTimes: Array<{ id: string; minutes: number }>;
};

const recipeByOutputId = Object.fromEntries(
  RECIPES.map((recipe) => [recipe.output.resourceId, recipe]),
) as Partial<Record<ResourceId, RecipeDefinition>>;

const trackedResourceIds = Array.from(
  new Set<ResourceId>([
    ...RECIPES.flatMap((recipe) => recipe.inputs.map((input) => input.resourceId)),
    ...RECIPES.map((recipe) => recipe.output.resourceId),
    ...MOUNTAINS.flatMap((mountain) => mountain.resources),
  ]),
);

function createEmptyInventory(): Inventory {
  return Object.fromEntries(trackedResourceIds.map((resourceId) => [resourceId, 0])) as Inventory;
}

function getUnlockedMountains(stage: number) {
  return MOUNTAINS.filter((mountain) => mountain.unlockedAtStage <= stage);
}

function getResourceRates(state: SimulationState): Partial<Record<ResourceId, number>> {
  const rates: Partial<Record<ResourceId, number>> = {};
  const cargo = TRANSPORT_CARGO_BY_LEVEL[state.transportLevel] ?? 1;
  const transportSpeed = TRANSPORT_SPEED_BY_LEVEL[state.transportLevel] ?? 1;
  const roadSpeed = ROAD_SPEED_BY_LEVEL[state.roadLevel] ?? 1;
  const miningYield = MINING_YIELD_BY_LEVEL[state.miningToolLevel] ?? 1;

  for (const mountain of getUnlockedMountains(state.stage)) {
    const cycleSec = mountain.baseRoundTripSec / (transportSpeed * roadSpeed);
    const perTripYield = cargo * miningYield;
    const perSecPerResource = perTripYield / cycleSec;

    for (const resourceId of mountain.resources) {
      rates[resourceId] = (rates[resourceId] ?? 0) + perSecPerResource;
    }
  }

  return rates;
}

function addMiningIncome(state: SimulationState, deltaSec: number) {
  const rates = getResourceRates(state);

  for (const [resourceId, rate] of Object.entries(rates) as Array<[ResourceId, number]>) {
    state.inventory[resourceId] += rate * deltaSec;
  }
}

function canAfford(inventory: Inventory, recipe: RecipeDefinition): boolean {
  return recipe.inputs.every((input) => inventory[input.resourceId] >= input.amount);
}

function startRecipe(state: SimulationState, recipe: RecipeDefinition): boolean {
  if (state.activeRecipes.length >= BASE_PRODUCTION_SLOTS || !canAfford(state.inventory, recipe)) {
    return false;
  }

  for (const input of recipe.inputs) {
    state.inventory[input.resourceId] -= input.amount;
  }

  state.activeRecipes.push({ recipeId: recipe.id as RecipeId, remainingSec: recipe.baseDurationSec });
  return true;
}

function advanceRecipes(state: SimulationState, deltaSec: number) {
  for (const activeRecipe of state.activeRecipes) {
    activeRecipe.remainingSec -= deltaSec;
  }

  const completed: ActiveRecipe[] = [];
  state.activeRecipes = state.activeRecipes.filter((activeRecipe) => {
    if (activeRecipe.remainingSec <= 0) {
      completed.push(activeRecipe);
      return false;
    }

    return true;
  });

  for (const entry of completed) {
    const recipe = recipeById[entry.recipeId];

    if (!recipe) {
      continue;
    }

    state.inventory[recipe.output.resourceId] += recipe.output.amount;
  }
}

function phaseTargetsMet(state: SimulationState, phase: Phase): boolean {
  return Object.entries(phase.targets).every(([resourceId, amount]) => {
    return state.inventory[resourceId as ResourceId] >= (amount ?? 0);
  });
}

function applyUpgradeCost(state: SimulationState, upgradeId: keyof typeof upgradeById, level: number) {
  const tier = upgradeById[upgradeId].tiers.find((candidate) => candidate.level === level);

  if (!tier) {
    throw new Error(`Missing tier ${level} for upgrade ${upgradeId}.`);
  }

  for (const cost of tier.cost) {
    state.inventory[cost.resourceId] -= cost.amount;
  }
}

function findRecipeForTarget(resourceId: ResourceId, state: SimulationState): RecipeDefinition | null {
  const recipe = recipeByOutputId[resourceId];

  if (!recipe || recipe.unlockedAtStage > state.stage) {
    return null;
  }

  for (const input of recipe.inputs) {
    if (state.inventory[input.resourceId] < input.amount) {
      const upstreamRecipe = findRecipeForTarget(input.resourceId, state);

      if (upstreamRecipe) {
        return upstreamRecipe;
      }
    }
  }

  return recipe;
}

function fillRecipeSlots(state: SimulationState, phase: Phase) {
  while (state.activeRecipes.length < BASE_PRODUCTION_SLOTS) {
    const nextTarget = Object.entries(phase.targets).find(([resourceId, amount]) => {
      return state.inventory[resourceId as ResourceId] < (amount ?? 0);
    });

    if (!nextTarget) {
      return;
    }

    const [resourceId] = nextTarget;
    const recipe = findRecipeForTarget(resourceId as ResourceId, state);

    if (!recipe || !startRecipe(state, recipe)) {
      return;
    }
  }
}

function createStarterStrategies(): Strategy[] {
  return [
    {
      id: 'rush_small_factory',
      name: '장비 최소화 직행',
      phases: [
        {
          id: 'starter_tools',
          description: '손수레 + 곡괭이 확보',
          targets: { lumber: 8, copper_ingot: 8 },
          onComplete: (state) => {
            applyUpgradeCost(state, 'transport', 1);
            applyUpgradeCost(state, 'mining_tool', 1);
            state.transportLevel = 1;
            state.miningToolLevel = 1;
            state.stage = 2;
          },
        },
        {
          id: 'stage2_unlock',
          description: '복합소재패널 1개 확보',
          targets: { composite_panel: 1 },
          onComplete: (state) => {
            state.stage = 3;
          },
        },
        {
          id: 'first_prestige',
          description: '소규모공장 1개 제작',
          targets: { small_factory: 1 },
          onComplete: () => {},
        },
      ],
    },
    {
      id: 'road_then_tools',
      name: '자갈길 + 2단계 장비 후 진입',
      phases: [
        {
          id: 'starter_tools',
          description: '손수레 + 곡괭이 확보',
          targets: { lumber: 8, copper_ingot: 8 },
          onComplete: (state) => {
            applyUpgradeCost(state, 'transport', 1);
            applyUpgradeCost(state, 'mining_tool', 1);
            state.transportLevel = 1;
            state.miningToolLevel = 1;
            state.stage = 2;
          },
        },
        {
          id: 'early_infra',
          description: '자갈길 + 광차 + 착암기 준비',
          targets: {
            lumber: 20,
            plywood: 5,
            steel_plate: 8,
            copper_wire: 5,
            wire_bundle: 3,
          },
          onComplete: (state) => {
            applyUpgradeCost(state, 'road', 1);
            applyUpgradeCost(state, 'transport', 2);
            applyUpgradeCost(state, 'mining_tool', 2);
            state.roadLevel = 1;
            state.transportLevel = 2;
            state.miningToolLevel = 2;
          },
        },
        {
          id: 'stage2_unlock',
          description: '복합소재패널 1개 확보',
          targets: { composite_panel: 1 },
          onComplete: (state) => {
            state.stage = 3;
          },
        },
        {
          id: 'first_prestige',
          description: '소규모공장 1개 제작',
          targets: { small_factory: 1 },
          onComplete: () => {},
        },
      ],
    },
    {
      id: 'transport_focus',
      name: '광차만 먼저 확보',
      phases: [
        {
          id: 'starter_tools',
          description: '손수레 + 곡괭이 확보',
          targets: { lumber: 8, copper_ingot: 8 },
          onComplete: (state) => {
            applyUpgradeCost(state, 'transport', 1);
            applyUpgradeCost(state, 'mining_tool', 1);
            state.transportLevel = 1;
            state.miningToolLevel = 1;
            state.stage = 2;
          },
        },
        {
          id: 'transport2_only',
          description: '광차만 먼저 확보',
          targets: { lumber: 10, steel_plate: 3, copper_wire: 5 },
          onComplete: (state) => {
            applyUpgradeCost(state, 'transport', 2);
            state.transportLevel = 2;
          },
        },
        {
          id: 'stage2_unlock',
          description: '복합소재패널 1개 확보',
          targets: { composite_panel: 1 },
          onComplete: (state) => {
            state.stage = 3;
          },
        },
        {
          id: 'first_prestige',
          description: '소규모공장 1개 제작',
          targets: { small_factory: 1 },
          onComplete: () => {},
        },
      ],
    },
  ];
}

function runStrategy(strategy: Strategy): StrategyReport {
  const state: SimulationState = {
    timeSec: 0,
    stage: 1,
    transportLevel: 0,
    miningToolLevel: 0,
    roadLevel: 0,
    inventory: createEmptyInventory(),
    activeRecipes: [],
    currentPhaseIndex: 0,
    completedPhaseTimes: [],
  };

  const maxSimulationSec = 60 * 60 * 6;

  while (state.timeSec < maxSimulationSec && state.currentPhaseIndex < strategy.phases.length) {
    const phase = strategy.phases[state.currentPhaseIndex];

    if (!phase) {
      break;
    }

    addMiningIncome(state, 1);
    advanceRecipes(state, 1);

    if (phaseTargetsMet(state, phase)) {
      phase.onComplete(state);
      state.completedPhaseTimes.push({ id: phase.id, timeSec: state.timeSec });
      state.currentPhaseIndex += 1;
      continue;
    }

    fillRecipeSlots(state, phase);
    state.timeSec += 1;
  }

  const phaseTimes = state.completedPhaseTimes.map((entry, index) => {
    const previousTime = index === 0 ? 0 : state.completedPhaseTimes[index - 1]?.timeSec ?? 0;
    return {
      id: entry.id,
      minutes: Number(((entry.timeSec - previousTime) / 60).toFixed(1)),
    };
  });

  return {
    strategyId: strategy.id,
    strategyName: strategy.name,
    totalMinutes: Number((state.timeSec / 60).toFixed(1)),
    finalState: {
      stage: state.stage,
      transportLevel: state.transportLevel,
      miningToolLevel: state.miningToolLevel,
      roadLevel: state.roadLevel,
    },
    phaseTimes,
  };
}

export function runFirstPrestigeSimulation(): StrategyReport[] {
  return createStarterStrategies().map(runStrategy).sort((left, right) => left.totalMinutes - right.totalMinutes);
}

function formatStageCheck() {
  const firstPrestigeTarget = recipeById.small_factory_recipe;
  const stage3 = stageById[3];

  if (!firstPrestigeTarget || !stage3) {
    throw new Error('Simulator prerequisites are missing required recipe or stage data.');
  }

  return {
    firstPrestigeRecipeInputs: firstPrestigeTarget.inputs,
    stage3Name: stage3.nameKo,
    baseProductionSlots: BASE_PRODUCTION_SLOTS,
  };
}

if (require.main === module) {
  const reports = runFirstPrestigeSimulation();

  console.log(JSON.stringify({
    assumptions: {
      miningUsesWorkers: false,
      ipBonuses: false,
      roadAndTransportAffectMiningOnly: true,
      stageCheck: formatStageCheck(),
    },
    reports,
  }, null, 2));
}
