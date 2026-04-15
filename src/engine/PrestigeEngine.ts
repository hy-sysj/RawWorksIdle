import { RESOURCES, type ResourceId } from '@/data/resources';
import { UPGRADES, type UpgradeId } from '@/data/upgrades';
import type { IpUpgradeId } from '@/data/ipUpgrades';
import type { PrestigeTier } from '@/store/gameStore';

export type PrestigeExecutionState = {
  resources: Record<ResourceId, number>;
  prestigeItems: Record<ResourceId, number>;
  activeRecipes: Array<{ recipeId: string; endTime: number; slot: number }>;
  upgrades: Record<UpgradeId, number>;
  workers: Array<{ id: string }>;
  workerAssignments: Record<string, string | null>;
  mountainNames: string[];
  gachaPity: number;
  mastery: Record<string, { level: number; xp: number }>;
  roadLevel: number;
  totalPrestigeCount: number;
  highestStageThisRun: number;
  stage: number;
  prestigeTier: number;
  prestigeCount: Record<PrestigeTier, number>;
  industryPoints: number;
  ipUpgrades: Record<IpUpgradeId, number>;
  diamonds: number;
};

export type PrestigeExecutionResult = {
  ipEarned: number;
  resources: Record<ResourceId, number>;
  activeRecipes: [];
  upgrades: Record<UpgradeId, number>;
  roadLevel: 0;
  stage: 1;
  highestStageThisRun: 1;
  totalPrestigeCount: number;
  prestigeTier: number;
  prestigeCount: Record<PrestigeTier, number>;
  industryPoints: number;
};

export function getPrestigeItemId(tier: PrestigeTier): ResourceId {
  if (tier === 1) {
    return 'small_factory';
  }

  if (tier === 2) {
    return 'industrial_complex';
  }

  return 'future_city';
}

export function getTierBaseStage(tier: PrestigeTier): number {
  if (tier === 1) {
    return 3;
  }

  if (tier === 2) {
    return 5;
  }

  return 8;
}

export function getTierBaseIp(tier: PrestigeTier): number {
  if (tier === 1) {
    return 1;
  }

  if (tier === 2) {
    return 5;
  }

  return 20;
}

export function calculateIpEarned(tier: PrestigeTier, highestStageThisRun: number): number {
  const baseIp = getTierBaseIp(tier);
  const bonusIp = Math.max(0, highestStageThisRun - getTierBaseStage(tier));
  return baseIp + bonusIp;
}

export function canPrestige(params: {
  tier: PrestigeTier;
  prestigeItems: Record<ResourceId, number>;
  canUnlockTier: (tier: PrestigeTier) => boolean;
}): boolean {
  const itemId = getPrestigeItemId(params.tier);
  return (params.prestigeItems[itemId] ?? 0) > 0 && params.canUnlockTier(params.tier);
}

function createResetResourceRecord(startResourceAmount: number): Record<ResourceId, number> {
  const entries = RESOURCES.filter((resource) => (resource as { isPrestigeItem?: boolean }).isPrestigeItem !== true).map((resource) => {
    const value = resource.isRaw ? startResourceAmount : 0;
    return [resource.id, value];
  });

  return Object.fromEntries(entries) as Record<ResourceId, number>;
}

function createResetUpgradeRecord(): Record<UpgradeId, number> {
  return Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.id, 0])) as Record<UpgradeId, number>;
}

export function executePrestige(state: PrestigeExecutionState, tier: PrestigeTier): PrestigeExecutionResult {
  const ipEarned = calculateIpEarned(tier, state.highestStageThisRun);
  const startResourceAmount = (state.ipUpgrades.start_resources ?? 0) * 100;
  const nextPrestigeCount = {
    ...state.prestigeCount,
    [tier]: (state.prestigeCount[tier] ?? 0) + 1,
  } as Record<PrestigeTier, number>;

  return {
    ipEarned,
    resources: createResetResourceRecord(startResourceAmount),
    activeRecipes: [],
    upgrades: createResetUpgradeRecord(),
    roadLevel: 0,
    stage: 1,
    highestStageThisRun: 1,
    totalPrestigeCount: state.totalPrestigeCount + 1,
    prestigeTier: Math.max(state.prestigeTier, tier),
    prestigeCount: nextPrestigeCount,
    industryPoints: state.industryPoints + ipEarned,
  };
}