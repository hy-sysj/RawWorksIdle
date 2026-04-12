export type IpUpgrade = {
  id: string;
  nameKo: string;
  description: string;
  cost: number;
  maxLevel: number;
  effect: string;
  unlocksTier?: 2 | 3;
};

export const STARTING_RESOURCE_AMOUNT_PER_LEVEL = 100;

export const ipUpgrades = [
  {
    id: "mining_speed",
    nameKo: "채굴 속도 강화",
    description: "기본 채취 효율 +25%",
    cost: 1,
    maxLevel: 10,
    effect: "채취량/속도 +25%"
  },
  {
    id: "smelting_speed",
    nameKo: "제련 가속",
    description: "가공 시간 -10%",
    cost: 2,
    maxLevel: 10,
    effect: "제작 시간 -10%"
  },
  {
    id: "start_resources",
    nameKo: "시작 자원",
    description: "리셋 시 기본 원자재를 추가로 지급",
    cost: 1,
    maxLevel: 5,
    effect: "리셋 후 원자재 +100"
  },
  {
    id: "slot_expansion",
    nameKo: "슬롯 확장",
    description: "생산 슬롯 +1",
    cost: 3,
    maxLevel: 3,
    effect: "생산 슬롯 +1"
  },
  {
    id: "offline_boost",
    nameKo: "오프라인 강화",
    description: "오프라인 최대 시간 +2시간",
    cost: 2,
    maxLevel: 5,
    effect: "오프라인 최대 +2시간"
  },
  {
    id: "auto_cross",
    nameKo: "자동 크로스",
    description: "크로스 조합도 오프라인 진행",
    cost: 5,
    maxLevel: 1,
    effect: "오프라인 크로스 활성화"
  },
  {
    id: "worker_storage",
    nameKo: "작업자 보관함",
    description: "작업자 보관함 +10",
    cost: 2,
    maxLevel: 3,
    effect: "보관함 +10"
  },
  {
    id: "tier_unlock_2",
    nameKo: "티어 해금 II",
    description: "2티어 프레스티지 해금",
    cost: 10,
    maxLevel: 1,
    effect: "산업단지 프레스티지 해금",
    unlocksTier: 2
  },
  {
    id: "tier_unlock_3",
    nameKo: "티어 해금 III",
    description: "3티어 프레스티지 해금",
    cost: 10,
    maxLevel: 1,
    effect: "미래도시 프레스티지 해금",
    unlocksTier: 3
  }
] as const satisfies readonly IpUpgrade[];

export type IpUpgradeId = (typeof ipUpgrades)[number]["id"];

export const ipUpgradeById = Object.fromEntries(ipUpgrades.map((upgrade) => [upgrade.id, upgrade])) as Record<
  IpUpgradeId,
  IpUpgrade
>;

export const ipUpgradeIds = ipUpgrades.map((upgrade) => upgrade.id) as IpUpgradeId[];

export const tierUnlockUpgradeIds: Record<2 | 3, IpUpgradeId> = {
  2: "tier_unlock_2",
  3: "tier_unlock_3"
};