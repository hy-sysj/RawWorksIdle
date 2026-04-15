import type { AchievementDefinition } from '@/data/achievements';
import { getMountainsAtStage } from '@/data/mountains';
import type { GameStoreState } from '@/store/gameStore';

export function getAchievementProgress(achievement: AchievementDefinition, state: Pick<
  GameStoreState,
  'stats' | 'totalPrestigeCount' | 'workers' | 'stage' | 'roadLevel' | 'mastery'
>): { current: number; target: number; completed: boolean } {
  const { condition } = achievement;
  let current = 0;

  if (condition.type === 'resources_mined') {
    current = state.stats.resourcesMined;
  } else if (condition.type === 'recipes_completed') {
    current = state.stats.recipesCompleted;
  } else if (condition.type === 'cross_completed') {
    current = state.stats.crossCompleted;
  } else if (condition.type === 'prestige_total') {
    current = state.totalPrestigeCount;
  } else if (condition.type === 'workers_owned') {
    current = state.workers.length;
  } else if (condition.type === 'legendary_worker') {
    current = state.workers.some((worker) => worker.grade === 'L' && worker.level >= condition.target) ? condition.target : 0;
  } else if (condition.type === 'mountains_unlocked') {
    current = getMountainsAtStage(state.stage).length;
  } else if (condition.type === 'road_level') {
    current = state.roadLevel;
  } else if (condition.type === 'mastery_level') {
    current = Object.values(state.mastery).reduce((highest, progress) => Math.max(highest, progress.level), 0);
  }

  return {
    current: Math.min(current, condition.target),
    target: condition.target,
    completed: current >= condition.target,
  };
}

export function getDifficultyLabel(totalPrestigeCount: number): string {
  if (totalPrestigeCount >= 10) {
    return '마스터';
  }

  if (totalPrestigeCount >= 6) {
    return '고급';
  }

  if (totalPrestigeCount >= 3) {
    return '중급';
  }

  return '초급';
}