export type DailyQuestEventType =
  | 'mining_tick'
  | 'recipe_complete'
  | 'tap_mine'
  | 'worker_assign'
  | 'upgrade_apply'
  | 'road_upgrade'
  | 'cross_complete';

export type DailyQuestTemplate = {
  id: string;
  nameKo: string;
  eventType: DailyQuestEventType;
  target: number;
  reward: number;
};

export const DAILY_QUEST_COMPLETION_BONUS = 10;

export const DAILY_QUEST_TEMPLATES = [
  { id: 'busy_miner', nameKo: '부지런한 광부', eventType: 'mining_tick', target: 500, reward: 5 },
  { id: 'production_master', nameKo: '생산의 달인', eventType: 'recipe_complete', target: 10, reward: 5 },
  { id: 'tap_master', nameKo: '탭 마스터', eventType: 'tap_mine', target: 20, reward: 3 },
  { id: 'cross_crafter', nameKo: '크로스 장인', eventType: 'cross_complete', target: 2, reward: 8 },
  { id: 'assignment_manager', nameKo: '인사 배치', eventType: 'worker_assign', target: 3, reward: 3 },
  { id: 'upgrade_once', nameKo: '업그레이드', eventType: 'upgrade_apply', target: 1, reward: 5 },
  { id: 'road_builder', nameKo: '도로 공사', eventType: 'road_upgrade', target: 1, reward: 5 },
  { id: 'repeat_crafter', nameKo: '장인의 반복', eventType: 'recipe_complete', target: 5, reward: 5 },
  { id: 'steady_output', nameKo: '꾸준한 생산', eventType: 'mining_tick', target: 1000, reward: 8 },
  { id: 'cross_chain_push', nameKo: '크로스 돌파', eventType: 'cross_complete', target: 5, reward: 8 },
  { id: 'upgrade_spree', nameKo: '장비 정비', eventType: 'upgrade_apply', target: 3, reward: 8 },
] as const satisfies readonly DailyQuestTemplate[];