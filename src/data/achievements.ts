export type AchievementId = string;

export type AchievementDefinition = {
  id: AchievementId;
  nameKo: string;
  category: 'mining' | 'production' | 'prestige' | 'worker' | 'exploration' | 'road' | 'mastery';
  condition: {
    type:
      | 'resources_mined'
      | 'recipes_completed'
      | 'cross_completed'
      | 'prestige_total'
      | 'workers_owned'
      | 'legendary_worker'
      | 'mountains_unlocked'
      | 'road_level'
      | 'mastery_level';
    target: number;
  };
  reward: number;
};

export const ACHIEVEMENTS = [
  { id: 'mining_100', nameKo: '초보 광부', category: 'mining', condition: { type: 'resources_mined', target: 100 }, reward: 5 },
  { id: 'mining_500', nameKo: '현장 광부', category: 'mining', condition: { type: 'resources_mined', target: 500 }, reward: 8 },
  { id: 'mining_1000', nameKo: '숙련 광부', category: 'mining', condition: { type: 'resources_mined', target: 1000 }, reward: 10 },
  { id: 'mining_5000', nameKo: '채굴 반장', category: 'mining', condition: { type: 'resources_mined', target: 5000 }, reward: 15 },
  { id: 'mining_10000', nameKo: '전설의 광부', category: 'mining', condition: { type: 'resources_mined', target: 10000 }, reward: 20 },
  { id: 'mining_50000', nameKo: '심층 채굴자', category: 'mining', condition: { type: 'resources_mined', target: 50000 }, reward: 30 },
  { id: 'mining_100000', nameKo: '광산왕', category: 'mining', condition: { type: 'resources_mined', target: 100000 }, reward: 50 },
  { id: 'production_10', nameKo: '첫 생산 라인', category: 'production', condition: { type: 'recipes_completed', target: 10 }, reward: 5 },
  { id: 'production_50', nameKo: '견습 장인', category: 'production', condition: { type: 'recipes_completed', target: 50 }, reward: 5 },
  { id: 'production_100', nameKo: '숙련 제작자', category: 'production', condition: { type: 'recipes_completed', target: 100 }, reward: 8 },
  { id: 'production_500', nameKo: '생산의 달인', category: 'production', condition: { type: 'recipes_completed', target: 500 }, reward: 10 },
  { id: 'production_1000', nameKo: '라인 관리자', category: 'production', condition: { type: 'recipes_completed', target: 1000 }, reward: 20 },
  { id: 'cross_1', nameKo: '첫 크로스!', category: 'production', condition: { type: 'cross_completed', target: 1 }, reward: 15 },
  { id: 'cross_3', nameKo: '조합 입문', category: 'production', condition: { type: 'cross_completed', target: 3 }, reward: 20 },
  { id: 'cross_5', nameKo: '조합 엔지니어', category: 'production', condition: { type: 'cross_completed', target: 5 }, reward: 25 },
  { id: 'cross_10', nameKo: '크로스 마스터', category: 'production', condition: { type: 'cross_completed', target: 10 }, reward: 30 },
  { id: 'prestige_1', nameKo: '첫 매각', category: 'prestige', condition: { type: 'prestige_total', target: 1 }, reward: 20 },
  { id: 'prestige_3', nameKo: '반복 매각', category: 'prestige', condition: { type: 'prestige_total', target: 3 }, reward: 35 },
  { id: 'prestige_5', nameKo: '연속 매각', category: 'prestige', condition: { type: 'prestige_total', target: 5 }, reward: 50 },
  { id: 'prestige_7', nameKo: '산업 브로커', category: 'prestige', condition: { type: 'prestige_total', target: 7 }, reward: 65 },
  { id: 'prestige_10', nameKo: '프레스티지 마스터', category: 'prestige', condition: { type: 'prestige_total', target: 10 }, reward: 100 },
  { id: 'prestige_20', nameKo: '기업 재벌', category: 'prestige', condition: { type: 'prestige_total', target: 20 }, reward: 150 },
  { id: 'worker_1', nameKo: '첫 동료', category: 'worker', condition: { type: 'workers_owned', target: 1 }, reward: 5 },
  { id: 'worker_5', nameKo: '작업반 편성', category: 'worker', condition: { type: 'workers_owned', target: 5 }, reward: 8 },
  { id: 'worker_10', nameKo: '팀 빌딩', category: 'worker', condition: { type: 'workers_owned', target: 10 }, reward: 10 },
  { id: 'worker_20', nameKo: '생산대 구성', category: 'worker', condition: { type: 'workers_owned', target: 20 }, reward: 20 },
  { id: 'worker_30', nameKo: '드림팀', category: 'worker', condition: { type: 'workers_owned', target: 30 }, reward: 30 },
  { id: 'worker_40', nameKo: '작업자 네트워크', category: 'worker', condition: { type: 'workers_owned', target: 40 }, reward: 50 },
  { id: 'worker_50', nameKo: '노동 제국', category: 'worker', condition: { type: 'workers_owned', target: 50 }, reward: 75 },
  { id: 'worker_legendary', nameKo: '전설의 일꾼', category: 'worker', condition: { type: 'legendary_worker', target: 1 }, reward: 100 },
  { id: 'exploration_3', nameKo: '산길 개척', category: 'exploration', condition: { type: 'mountains_unlocked', target: 3 }, reward: 5 },
  { id: 'exploration_5', nameKo: '탐험가', category: 'exploration', condition: { type: 'mountains_unlocked', target: 5 }, reward: 10 },
  { id: 'exploration_8', nameKo: '계곡 탐사자', category: 'exploration', condition: { type: 'mountains_unlocked', target: 8 }, reward: 15 },
  { id: 'exploration_10', nameKo: '산악인', category: 'exploration', condition: { type: 'mountains_unlocked', target: 10 }, reward: 30 },
  { id: 'exploration_12', nameKo: '고원 탐험가', category: 'exploration', condition: { type: 'mountains_unlocked', target: 12 }, reward: 40 },
  { id: 'exploration_15', nameKo: '정복자', category: 'exploration', condition: { type: 'mountains_unlocked', target: 15 }, reward: 50 },
  { id: 'road_1', nameKo: '길 닦기', category: 'road', condition: { type: 'road_level', target: 1 }, reward: 5 },
  { id: 'road_2', nameKo: '철도왕', category: 'road', condition: { type: 'road_level', target: 2 }, reward: 10 },
  { id: 'road_3', nameKo: '포장 전문가', category: 'road', condition: { type: 'road_level', target: 3 }, reward: 20 },
  { id: 'road_4', nameKo: '고속도로 건설', category: 'road', condition: { type: 'road_level', target: 4 }, reward: 30 },
  { id: 'mastery_3', nameKo: '손에 익다', category: 'mastery', condition: { type: 'mastery_level', target: 3 }, reward: 5 },
  { id: 'mastery_5', nameKo: '반복의 힘', category: 'mastery', condition: { type: 'mastery_level', target: 5 }, reward: 10 },
  { id: 'mastery_7', nameKo: '숙련된 손길', category: 'mastery', condition: { type: 'mastery_level', target: 7 }, reward: 15 },
  { id: 'mastery_10', nameKo: '장인의 경지', category: 'mastery', condition: { type: 'mastery_level', target: 10 }, reward: 20 },
  { id: 'mastery_12', nameKo: '정밀 장인', category: 'mastery', condition: { type: 'mastery_level', target: 12 }, reward: 25 },
  { id: 'mastery_15', nameKo: '달인', category: 'mastery', condition: { type: 'mastery_level', target: 15 }, reward: 30 },
  { id: 'mastery_18', nameKo: '숙련 공학자', category: 'mastery', condition: { type: 'mastery_level', target: 18 }, reward: 40 },
  { id: 'mastery_20', nameKo: '그랜드마스터', category: 'mastery', condition: { type: 'mastery_level', target: 20 }, reward: 50 },
] as const satisfies readonly AchievementDefinition[];

export const achievementById: Record<AchievementId, AchievementDefinition> = Object.fromEntries(
  ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]),
) as Record<AchievementId, AchievementDefinition>;