import type { ResourceId } from '@/data/resources';

export type MountainDefinition = {
  id: string;
  index: number;
  resources: ResourceId[];
  unlockedAtStage: number;
  baseRoundTripSec: number;
};

export const MOUNTAIN_NAME_PREFIXES: string[] = [
  '청',
  '백',
  '금',
  '적',
  '흑',
  '은',
  '녹',
  '철',
  '수',
  '화',
  '운',
  '용',
  '호',
  '봉',
  '월',
  '성',
  '천',
  '옥',
  '자',
  '비',
];

export const MOUNTAIN_NAME_SUFFIXES: string[] = [
  '봉산',
  '악산',
  '령',
  '봉',
  '골산',
  '암산',
  '대산',
  '운산',
  '정산',
  '광산',
];

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swapIndex] as T;
    copy[swapIndex] = current as T;
  }

  return copy;
}

export function generateMountainNames(count: number): string[] {
  if (count > MOUNTAIN_NAME_PREFIXES.length) {
    throw new Error(`Cannot generate ${count} unique mountain names from the current prefix pool.`);
  }

  const shuffledPrefixes = shuffle(MOUNTAIN_NAME_PREFIXES).slice(0, count);

  return shuffledPrefixes.map((prefix) => {
    const suffix = MOUNTAIN_NAME_SUFFIXES[Math.floor(Math.random() * MOUNTAIN_NAME_SUFFIXES.length)];
    return `${prefix}${suffix}`;
  });
}

export const MOUNTAINS: MountainDefinition[] = [
  { id: 'mountain_1', index: 1, resources: ['log'], unlockedAtStage: 1, baseRoundTripSec: 2.0 },
  { id: 'mountain_2', index: 2, resources: ['log', 'copper_ore'], unlockedAtStage: 1, baseRoundTripSec: 2.5 },
  { id: 'mountain_3', index: 3, resources: ['log', 'copper_ore', 'iron_ore'], unlockedAtStage: 2, baseRoundTripSec: 3.0 },
  { id: 'mountain_4', index: 4, resources: ['copper_ore', 'iron_ore'], unlockedAtStage: 2, baseRoundTripSec: 3.5 },
  { id: 'mountain_5', index: 5, resources: ['iron_ore', 'crude_oil'], unlockedAtStage: 2, baseRoundTripSec: 4.0 },
  { id: 'mountain_6', index: 6, resources: ['iron_ore', 'crude_oil', 'bauxite'], unlockedAtStage: 2, baseRoundTripSec: 4.5 },
  { id: 'mountain_7', index: 7, resources: ['crude_oil', 'bauxite'], unlockedAtStage: 3, baseRoundTripSec: 5.0 },
  { id: 'mountain_8', index: 8, resources: ['bauxite', 'quartz'], unlockedAtStage: 4, baseRoundTripSec: 5.5 },
  { id: 'mountain_9', index: 9, resources: ['bauxite', 'quartz', 'lithium_ore'], unlockedAtStage: 4, baseRoundTripSec: 6.0 },
  { id: 'mountain_10', index: 10, resources: ['quartz', 'lithium_ore'], unlockedAtStage: 4, baseRoundTripSec: 6.5 },
  { id: 'mountain_11', index: 11, resources: ['lithium_ore', 'gold_ore'], unlockedAtStage: 4, baseRoundTripSec: 7.0 },
  { id: 'mountain_12', index: 12, resources: ['gold_ore', 'rare_earth_ore'], unlockedAtStage: 5, baseRoundTripSec: 8.0 },
  {
    id: 'mountain_13',
    index: 13,
    resources: ['gold_ore', 'rare_earth_ore', 'uranium_ore'],
    unlockedAtStage: 6,
    baseRoundTripSec: 9.0,
  },
  { id: 'mountain_14', index: 14, resources: ['rare_earth_ore', 'uranium_ore'], unlockedAtStage: 6, baseRoundTripSec: 10.0 },
  { id: 'mountain_15', index: 15, resources: ['uranium_ore'], unlockedAtStage: 6, baseRoundTripSec: 11.0 },
];

export const mountainById: Record<string, MountainDefinition> = Object.fromEntries(
  MOUNTAINS.map((mountain) => [mountain.id, mountain]),
);

export function getMountainsAtStage(stage: number): MountainDefinition[] {
  return MOUNTAINS.filter((mountain) => mountain.unlockedAtStage <= stage);
}