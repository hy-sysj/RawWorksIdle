export type TutorialTargetAction =
  | 'tap_mountain_1'
  | 'produce_lumber'
  | 'produce_copper_ingot'
  | 'upgrade_transport'
  | 'upgrade_mining_tool'
  | 'reach_stage_2';

export type TutorialQuestDefinition = {
  step: number;
  nameKo: string;
  emoji: string;
  reward: number;
  targetAction: TutorialTargetAction;
  targetValue: number;
};

export const TUTORIAL_QUESTS = [
  { step: 1, nameKo: '첫 수확', emoji: '🪵', reward: 0, targetAction: 'tap_mountain_1', targetValue: 3 },
  { step: 2, nameKo: '첫 가공', emoji: '🔨', reward: 0, targetAction: 'produce_lumber', targetValue: 1 },
  { step: 3, nameKo: '금속 가공', emoji: '⛏️', reward: 0, targetAction: 'produce_copper_ingot', targetValue: 1 },
  { step: 4, nameKo: '손수레 제작', emoji: '🛒', reward: 10, targetAction: 'upgrade_transport', targetValue: 1 },
  { step: 5, nameKo: '곡괭이 제작', emoji: '⛏️', reward: 10, targetAction: 'upgrade_mining_tool', targetValue: 1 },
  { step: 6, nameKo: '새로운 땅', emoji: '🚀', reward: 20, targetAction: 'reach_stage_2', targetValue: 2 },
] as const satisfies readonly TutorialQuestDefinition[];

export const tutorialQuestByStep = Object.fromEntries(TUTORIAL_QUESTS.map((quest) => [quest.step, quest])) as Record<
  number,
  TutorialQuestDefinition
>;