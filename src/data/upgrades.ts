import type { RecipeIngredient } from '@/data/recipes';

export type UpgradeCategory =
  | 'transport'
  | 'mining'
  | 'smelting'
  | 'automation'
  | 'facility'
  | 'research'
  | 'road';

export type UpgradeEffect = Partial<{
  transportSpeed: number;
  transportCargo: number;
  miningYield: number;
  smeltingTimeMultiplier: number;
  offlineHoursBonus: number;
  productionSlotsBonus: number;
  stageUnlock: number;
  globalProductionSpeed: number;
  roadSpeed: number;
}>;

export type UpgradeTier = {
  level: number;
  nameKo: string;
  unlockedAtStage: number;
  cost: RecipeIngredient[];
  effect: UpgradeEffect;
};

export type UpgradeDefinition = {
  id: string;
  nameKo: string;
  category: UpgradeCategory;
  tiers: UpgradeTier[];
};

export const BASE_PRODUCTION_SLOTS = 2;

export const TRANSPORT_SPEED_BY_LEVEL = [1, 1.5, 2, 3, 4.5] as const;
export const TRANSPORT_CARGO_BY_LEVEL = [1, 2, 3, 4, 6] as const;
export const MINING_YIELD_BY_LEVEL = [1, 1.5, 2, 3, 4] as const;
export const ROAD_SPEED_BY_LEVEL = [1, 1.2, 1.5, 2, 2.5] as const;

export function getProductionSlotCount(workbenchLevel: number, ipSlotExpansionLevel = 0): number {
  return BASE_PRODUCTION_SLOTS + workbenchLevel + ipSlotExpansionLevel;
}

export const UPGRADES = [
  {
    id: 'transport',
    nameKo: '이동수단',
    category: 'transport',
    tiers: [
      {
        level: 0,
        nameKo: '도보',
        unlockedAtStage: 1,
        cost: [],
        effect: { transportSpeed: TRANSPORT_SPEED_BY_LEVEL[0], transportCargo: TRANSPORT_CARGO_BY_LEVEL[0] },
      },
      {
        level: 1,
        nameKo: '손수레',
        unlockedAtStage: 1,
        cost: [
          { resourceId: 'lumber', amount: 5 },
          { resourceId: 'copper_ingot', amount: 3 },
        ],
        effect: { transportSpeed: TRANSPORT_SPEED_BY_LEVEL[1], transportCargo: TRANSPORT_CARGO_BY_LEVEL[1] },
      },
      {
        level: 2,
        nameKo: '광차',
        unlockedAtStage: 2,
        cost: [
          { resourceId: 'steel_plate', amount: 3 },
          { resourceId: 'copper_wire', amount: 5 },
          { resourceId: 'lumber', amount: 10 },
        ],
        effect: { transportSpeed: TRANSPORT_SPEED_BY_LEVEL[2], transportCargo: TRANSPORT_CARGO_BY_LEVEL[2] },
      },
      {
        level: 3,
        nameKo: '트럭',
        unlockedAtStage: 3,
        cost: [
          { resourceId: 'composite_panel', amount: 3 },
          { resourceId: 'electric_unit', amount: 2 },
          { resourceId: 'polymer', amount: 5 },
        ],
        effect: { transportSpeed: TRANSPORT_SPEED_BY_LEVEL[3], transportCargo: TRANSPORT_CARGO_BY_LEVEL[3] },
      },
      {
        level: 4,
        nameKo: '자율주행트럭',
        unlockedAtStage: 7,
        cost: [
          { resourceId: 'ev_unit', amount: 1 },
          { resourceId: 'ai_computing', amount: 1 },
        ],
        effect: { transportSpeed: TRANSPORT_SPEED_BY_LEVEL[4], transportCargo: TRANSPORT_CARGO_BY_LEVEL[4] },
      },
    ],
  },
  {
    id: 'mining_tool',
    nameKo: '채굴도구',
    category: 'mining',
    tiers: [
      {
        level: 0,
        nameKo: '맨손',
        unlockedAtStage: 1,
        cost: [],
        effect: { miningYield: MINING_YIELD_BY_LEVEL[0] },
      },
      {
        level: 1,
        nameKo: '곡괭이',
        unlockedAtStage: 1,
        cost: [
          { resourceId: 'lumber', amount: 3 },
          { resourceId: 'copper_ingot', amount: 5 },
        ],
        effect: { miningYield: MINING_YIELD_BY_LEVEL[1] },
      },
      {
        level: 2,
        nameKo: '착암기',
        unlockedAtStage: 2,
        cost: [
          { resourceId: 'steel_plate', amount: 5 },
          { resourceId: 'wire_bundle', amount: 3 },
        ],
        effect: { miningYield: MINING_YIELD_BY_LEVEL[2] },
      },
      {
        level: 3,
        nameKo: '굴착기',
        unlockedAtStage: 3,
        cost: [
          { resourceId: 'composite_panel', amount: 2 },
          { resourceId: 'smart_machine', amount: 1 },
        ],
        effect: { miningYield: MINING_YIELD_BY_LEVEL[3] },
      },
      {
        level: 4,
        nameKo: '양자드릴',
        unlockedAtStage: 7,
        cost: [
          { resourceId: 'ai_computing', amount: 1 },
          { resourceId: 'reactor_module', amount: 1 },
        ],
        effect: { miningYield: MINING_YIELD_BY_LEVEL[4] },
      },
    ],
  },
  {
    id: 'road',
    nameKo: '도로',
    category: 'road',
    tiers: [
      {
        level: 0,
        nameKo: '오솔길',
        unlockedAtStage: 1,
        cost: [],
        effect: { roadSpeed: ROAD_SPEED_BY_LEVEL[0] },
      },
      {
        level: 1,
        nameKo: '자갈길',
        unlockedAtStage: 1,
        cost: [
          { resourceId: 'lumber', amount: 10 },
          { resourceId: 'plywood', amount: 5 },
        ],
        effect: { roadSpeed: ROAD_SPEED_BY_LEVEL[1] },
      },
      {
        level: 2,
        nameKo: '레일',
        unlockedAtStage: 2,
        cost: [
          { resourceId: 'steel_plate', amount: 5 },
          { resourceId: 'lumber', amount: 15 },
        ],
        effect: { roadSpeed: ROAD_SPEED_BY_LEVEL[2] },
      },
      {
        level: 3,
        nameKo: '포장도로',
        unlockedAtStage: 3,
        cost: [
          { resourceId: 'composite_panel', amount: 5 },
          { resourceId: 'polymer', amount: 10 },
          { resourceId: 'steel_plate', amount: 10 },
        ],
        effect: { roadSpeed: ROAD_SPEED_BY_LEVEL[3] },
      },
      {
        level: 4,
        nameKo: '고속도로',
        unlockedAtStage: 5,
        cost: [
          { resourceId: 'smart_machine', amount: 2 },
          { resourceId: 'adv_circuit', amount: 1 },
          { resourceId: 'light_frame', amount: 10 },
        ],
        effect: { roadSpeed: ROAD_SPEED_BY_LEVEL[4] },
      },
    ],
  },
  {
    id: 'automation',
    nameKo: '자동화',
    category: 'automation',
    tiers: [
      { level: 0, nameKo: '수동', unlockedAtStage: 1, cost: [], effect: { offlineHoursBonus: 0 } },
      {
        level: 1,
        nameKo: '컨베이어',
        unlockedAtStage: 3,
        cost: [
          { resourceId: 'smart_machine', amount: 1 },
          { resourceId: 'plastic', amount: 10 },
        ],
        effect: { offlineHoursBonus: 2 },
      },
      {
        level: 2,
        nameKo: '로봇팔',
        unlockedAtStage: 5,
        cost: [{ resourceId: 'adv_circuit', amount: 2 }],
        effect: { offlineHoursBonus: 4 },
      },
      {
        level: 3,
        nameKo: 'AI 라인',
        unlockedAtStage: 7,
        cost: [{ resourceId: 'ai_computing', amount: 1 }],
        effect: { offlineHoursBonus: 6 },
      },
    ],
  },
  {
    id: 'workbench',
    nameKo: '작업대',
    category: 'facility',
    tiers: [
      { level: 0, nameKo: '기본 작업대', unlockedAtStage: 1, cost: [], effect: { productionSlotsBonus: 0 } },
      {
        level: 1,
        nameKo: '목재 작업대',
        unlockedAtStage: 3,
        cost: [
          { resourceId: 'furniture_part', amount: 5 },
          { resourceId: 'electric_unit', amount: 3 },
        ],
        effect: { productionSlotsBonus: 1 },
      },
      {
        level: 2,
        nameKo: '철제 작업대',
        unlockedAtStage: 5,
        cost: [{ resourceId: 'adv_circuit', amount: 1 }],
        effect: { productionSlotsBonus: 2 },
      },
      {
        level: 3,
        nameKo: '첨단 작업대',
        unlockedAtStage: 7,
        cost: [{ resourceId: 'microprocessor', amount: 2 }],
        effect: { productionSlotsBonus: 3 },
      },
      {
        level: 4,
        nameKo: '나노 작업대',
        unlockedAtStage: 8,
        cost: [
          { resourceId: 'ai_computing', amount: 1 },
          { resourceId: 'precision_electronics', amount: 2 },
        ],
        effect: { productionSlotsBonus: 4 },
      },
    ],
  },
  {
    id: 'research',
    nameKo: '연구소',
    category: 'research',
    tiers: [
      { level: 0, nameKo: '미건설', unlockedAtStage: 1, cost: [], effect: {} },
      {
        level: 1,
        nameKo: '연구소',
        unlockedAtStage: 3,
        cost: [
          { resourceId: 'smart_machine', amount: 1 },
          { resourceId: 'desk', amount: 1 },
        ],
        effect: { stageUnlock: 4 },
      },
      {
        level: 2,
        nameKo: '첨단 연구소',
        unlockedAtStage: 5,
        cost: [
          { resourceId: 'adv_circuit', amount: 1 },
          { resourceId: 'precision_electronics', amount: 1 },
        ],
        effect: { stageUnlock: 6 },
      },
    ],
  },
  {
    id: 'smelting',
    nameKo: '제련설비',
    category: 'smelting',
    tiers: [
      { level: 0, nameKo: '기본 설비', unlockedAtStage: 1, cost: [], effect: { smeltingTimeMultiplier: 1 } },
      {
        level: 1,
        nameKo: '용광로',
        unlockedAtStage: 3,
        cost: [
          { resourceId: 'copper_ingot', amount: 10 },
          { resourceId: 'wire_bundle', amount: 5 },
        ],
        effect: { smeltingTimeMultiplier: 0.7 },
      },
      {
        level: 2,
        nameKo: '전기로',
        unlockedAtStage: 4,
        cost: [
          { resourceId: 'steel_plate', amount: 5 },
          { resourceId: 'copper_wire', amount: 3 },
        ],
        effect: { smeltingTimeMultiplier: 0.49 },
      },
      {
        level: 3,
        nameKo: '아크로',
        unlockedAtStage: 6,
        cost: [{ resourceId: 'generator_core', amount: 2 }],
        effect: { smeltingTimeMultiplier: 0.343 },
      },
      {
        level: 4,
        nameKo: '플라즈마로',
        unlockedAtStage: 6,
        cost: [{ resourceId: 'reactor_module', amount: 1 }],
        effect: { smeltingTimeMultiplier: 0.2401 },
      },
    ],
  },
  {
    id: 'energy_grid',
    nameKo: '에너지 그리드',
    category: 'facility',
    tiers: [
      { level: 0, nameKo: '미건설', unlockedAtStage: 1, cost: [], effect: {} },
      {
        level: 1,
        nameKo: '에너지 그리드',
        unlockedAtStage: 6,
        cost: [
          { resourceId: 'generator_core', amount: 1 },
          { resourceId: 'energy_storage', amount: 1 },
        ],
        effect: { globalProductionSpeed: 1.5 },
      },
    ],
  },
] as const satisfies readonly UpgradeDefinition[];

export type UpgradeId = (typeof UPGRADES)[number]['id'];

export const upgradeById = Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.id, upgrade])) as unknown as Record<
  UpgradeId,
  UpgradeDefinition
>;

export function getUpgradeTier(upgradeId: UpgradeId, level: number): UpgradeTier | undefined {
  return upgradeById[upgradeId].tiers.find((tier) => tier.level === level);
}
