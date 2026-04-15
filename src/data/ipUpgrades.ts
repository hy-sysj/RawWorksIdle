export type IpUpgradeId =
  | 'mining_boost'
  | 'smelting_accel'
  | 'start_resources'
  | 'slot_expansion'
  | 'offline_boost'
  | 'auto_cross'
  | 'worker_storage'
  | 'tier_unlock';

export type IpUpgradeDefinition = {
  id: IpUpgradeId;
  nameKo: string;
  description: string;
  cost: number;
  maxLevel: number;
  effect: string;
};

export const IP_UPGRADES = [
  {
    id: 'mining_boost',
    nameKo: '채굴 속도 강화',
    description: '채굴 속도와 채굴 산출량을 영구적으로 밀어 올립니다.',
    cost: 1,
    maxLevel: 10,
    effect: '기본 채취량 +25% 누적',
  },
  {
    id: 'smelting_accel',
    nameKo: '제련 가속',
    description: '모든 레시피의 제작 시간을 영구적으로 줄입니다.',
    cost: 2,
    maxLevel: 10,
    effect: '가공 시간 -10% 누적',
  },
  {
    id: 'start_resources',
    nameKo: '시작 자원',
    description: '프레스티지 후 기본 원자재를 넉넉하게 들고 시작합니다.',
    cost: 1,
    maxLevel: 5,
    effect: '리셋 시 기본 원자재 100개 추가',
  },
  {
    id: 'slot_expansion',
    nameKo: '슬롯 확장',
    description: '작업대 업그레이드와 별도로 생산 슬롯을 영구 확장합니다.',
    cost: 3,
    maxLevel: 3,
    effect: '생산 슬롯 +1',
  },
  {
    id: 'offline_boost',
    nameKo: '오프라인 강화',
    description: '자동화 업그레이드와 합산되는 오프라인 한도를 늘립니다.',
    cost: 2,
    maxLevel: 5,
    effect: '오프라인 최대 시간 +2h',
  },
  {
    id: 'auto_cross',
    nameKo: '자동 크로스',
    description: '오프라인 중에도 크로스 체인 레시피를 계속 굴립니다.',
    cost: 5,
    maxLevel: 1,
    effect: '크로스 조합 오프라인 진행 해금',
  },
  {
    id: 'worker_storage',
    nameKo: '작업자 보관함',
    description: '장기적으로 더 많은 작업자를 확보할 수 있게 만듭니다.',
    cost: 2,
    maxLevel: 3,
    effect: '작업자 보관함 +10명',
  },
  {
    id: 'tier_unlock',
    nameKo: '티어 해금',
    description: '다음 프레스티지 티어의 매각 권한을 개방합니다.',
    cost: 10,
    maxLevel: 2,
    effect: '다음 티어 프레스티지 해금',
  },
] as const satisfies readonly IpUpgradeDefinition[];

export const ipUpgradeById: Record<IpUpgradeId, IpUpgradeDefinition> = Object.fromEntries(
  IP_UPGRADES.map((upgrade) => [upgrade.id, upgrade]),
) as Record<IpUpgradeId, IpUpgradeDefinition>;