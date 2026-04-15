import { AppState, type AppStateStatus } from 'react-native';

import { generateMountainNames, getMountainsAtStage, MOUNTAINS } from '@/data/mountains';
import { ACHIEVEMENTS } from '@/data/achievements';
import { RESOURCES, type ResourceId } from '@/data/resources';
import { tutorialQuestByStep } from '@/data/tutorial';
import { OfflineEngine } from '@/engine/OfflineEngine';
import { useGameStore } from '@/store/gameStore';

const HEARTBEAT_MS = 250;

let loopTimer: ReturnType<typeof setInterval> | null = null;
let lastHeartbeat = 0;
let appStateSubscription: { remove: () => void } | null = null;
const mountainAccumulators: Record<string, number> = Object.fromEntries(MOUNTAINS.map((mountain) => [mountain.id, 0]));

function getPowerChance(mountainId: string): number {
  const state = useGameStore.getState();
  const assignedWorkerId = state.workerAssignments[mountainId];
  const worker = state.workers.find((candidate) => candidate.id === assignedWorkerId);
  if (!worker) {
    return 0;
  }

  const powerAbility = worker.abilities.find((ability) => ability.type === 'power');
  return Math.max(0, (powerAbility?.multiplier ?? 1) - 1);
}

function getBonusPool(resourceId: ResourceId): ResourceId[] {
  const unlockedAtStage = RESOURCES.find((resource) => resource.id === resourceId)?.unlockedAtStage;
  if (!unlockedAtStage) {
    return [];
  }

  return RESOURCES.filter(
    (resource) => resource.isRaw && resource.unlockedAtStage === unlockedAtStage && resource.id !== resourceId,
  ).map((resource) => resource.id as ResourceId);
}

function chooseRandom<T>(items: readonly T[]): T | undefined {
  if (!items.length) {
    return undefined;
  }

  return items[Math.floor(Math.random() * items.length)];
}

function checkTutorialConditions(): void {
  const state = useGameStore.getState();
  if (state.tutorialComplete) {
    return;
  }

  const currentStep = state.tutorialStep === 0 ? 1 : state.tutorialStep;
  const quest = tutorialQuestByStep[currentStep];

  if (!quest) {
    return;
  }

  let completed = false;

  if (quest.targetAction === 'tap_mountain_1') {
    completed = state.stats.mountain1TapLog >= quest.targetValue;
  } else if (quest.targetAction === 'produce_lumber') {
    completed = (state.resources.lumber ?? 0) >= quest.targetValue || state.stats.recipesCompleted >= quest.targetValue;
  } else if (quest.targetAction === 'produce_copper_ingot') {
    completed = (state.resources.copper_ingot ?? 0) >= quest.targetValue;
  } else if (quest.targetAction === 'upgrade_transport') {
    completed = state.upgrades.transport >= quest.targetValue;
  } else if (quest.targetAction === 'upgrade_mining_tool') {
    completed = state.upgrades.mining_tool >= quest.targetValue;
  } else if (quest.targetAction === 'reach_stage_2') {
    completed = state.stage >= quest.targetValue;
  }

  if (completed) {
    state.advanceTutorial(currentStep);
  }
}

function checkAchievements(): void {
  const state = useGameStore.getState();

  for (const achievement of ACHIEVEMENTS) {
    if (state.achievements[achievement.id]) {
      continue;
    }

    const condition = achievement.condition;
    let unlocked = false;

    if (condition.type === 'resources_mined') {
      unlocked = state.stats.resourcesMined >= condition.target;
    } else if (condition.type === 'recipes_completed') {
      unlocked = state.stats.recipesCompleted >= condition.target;
    } else if (condition.type === 'cross_completed') {
      unlocked = state.stats.crossCompleted >= condition.target;
    } else if (condition.type === 'prestige_total') {
      unlocked = state.totalPrestigeCount >= condition.target;
    } else if (condition.type === 'workers_owned') {
      unlocked = state.workers.length >= condition.target;
    } else if (condition.type === 'legendary_worker') {
      unlocked = state.workers.some((worker) => worker.grade === 'L' && worker.level >= condition.target);
    } else if (condition.type === 'mountains_unlocked') {
      unlocked = getMountainsAtStage(state.stage).length >= condition.target;
    } else if (condition.type === 'road_level') {
      unlocked = state.roadLevel >= condition.target;
    } else if (condition.type === 'mastery_level') {
      unlocked = Object.values(state.mastery).some((progress) => progress.level >= condition.target);
    }

    if (unlocked) {
      state.unlockAchievement(achievement.id);
    }
  }
}

function processMining(deltaMs: number): void {
  const state = useGameStore.getState();

  for (const mountain of getMountainsAtStage(state.stage)) {
    mountainAccumulators[mountain.id] = (mountainAccumulators[mountain.id] ?? 0) + deltaMs;
    const cycleMs = state.getMiningCycleMs(mountain.id);

    if (cycleMs <= 0) {
      continue;
    }

    while ((mountainAccumulators[mountain.id] ?? 0) >= cycleMs) {
      const currentAccumulator = mountainAccumulators[mountain.id] ?? 0;
      mountainAccumulators[mountain.id] = currentAccumulator - cycleMs;

      const yields = useGameStore.getState().getMiningYield(mountain.id);
      for (const [resourceId, amount] of Object.entries(yields) as [ResourceId, number][]) {
        useGameStore.getState().addResource(resourceId, amount, 'mining', mountain.id);
        useGameStore.getState().checkDailyQuestProgress('mining_tick', amount);

        if (Math.random() < getPowerChance(mountain.id)) {
          const bonusResourceId = chooseRandom(getBonusPool(resourceId));
          if (bonusResourceId) {
            useGameStore.getState().addResource(bonusResourceId, 1, 'mining', mountain.id);
          }
        }
      }
    }
  }
}

function processRecipes(): void {
  const state = useGameStore.getState();
  const now = Date.now();

  for (const activeRecipe of state.activeRecipes) {
    if (activeRecipe.endTime <= now) {
      useGameStore.getState().completeRecipe(activeRecipe.slot);
    }
  }
}

function tick(): void {
  const now = Date.now();
  const deltaMs = lastHeartbeat === 0 ? HEARTBEAT_MS : now - lastHeartbeat;
  lastHeartbeat = now;

  processMining(deltaMs);
  processRecipes();
  checkAchievements();
  checkTutorialConditions();
}

async function handleAppStateChange(nextState: AppStateStatus): Promise<void> {
  if (nextState === 'background' || nextState === 'inactive') {
    await OfflineEngine.saveBackgroundTimestamp();
    return;
  }

  if (nextState === 'active') {
    await OfflineEngine.calculate();
  }
}

export function startLoop(): void {
  if (loopTimer) {
    return;
  }

  const state = useGameStore.getState();
  if (!state.mountainNames.length) {
    useGameStore.setState({ mountainNames: generateMountainNames(MOUNTAINS.length) });
  }

  lastHeartbeat = Date.now();
  loopTimer = setInterval(tick, HEARTBEAT_MS);
  appStateSubscription = AppState.addEventListener('change', (nextState) => {
    void handleAppStateChange(nextState);
  });
}

export function stopLoop(): void {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }

  lastHeartbeat = 0;

  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
}