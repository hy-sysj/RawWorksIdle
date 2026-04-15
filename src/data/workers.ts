export type WorkerGrade = 'N' | 'R' | 'U' | 'L';
export type WorkerAbilityType = 'yield' | 'speed' | 'power';

export type WorkerAbility = {
  type: WorkerAbilityType;
  multiplier: number;
};

export type Worker = {
  id: string;
  name: string;
  grade: WorkerGrade;
  abilities: WorkerAbility[];
  level: number;
  dupeCount: number;
  locked: boolean;
};

export type WorkerGradeDefinition = {
  grade: WorkerGrade;
  rate: number;
  abilityCount: { min: number; max: number };
  multiplierRange: { min: number; max: number };
  dupeCap: number;
  levelBonus: number;
};

export const WORKER_GRADE_DEFINITIONS: Record<WorkerGrade, WorkerGradeDefinition> = {
  N: { grade: 'N', rate: 0.6, abilityCount: { min: 1, max: 1 }, multiplierRange: { min: 1.1, max: 1.3 }, dupeCap: 5, levelBonus: 0.02 },
  R: { grade: 'R', rate: 0.25, abilityCount: { min: 1, max: 2 }, multiplierRange: { min: 1.2, max: 1.5 }, dupeCap: 4, levelBonus: 0.03 },
  U: { grade: 'U', rate: 0.12, abilityCount: { min: 2, max: 3 }, multiplierRange: { min: 1.4, max: 1.8 }, dupeCap: 3, levelBonus: 0.04 },
  L: { grade: 'L', rate: 0.03, abilityCount: { min: 3, max: 3 }, multiplierRange: { min: 1.6, max: 2.5 }, dupeCap: 2, levelBonus: 0.06 },
};

export const WORKER_RECYCLE_REWARDS: Record<WorkerGrade, number> = {
  N: 1,
  R: 5,
  U: 15,
  L: 50,
};

export const FAMILY_NAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍'] as const;

export const GIVEN_NAMES = [
  '철수',
  '영희',
  '민수',
  '지은',
  '동혁',
  '수진',
  '현우',
  '소연',
  '준호',
  '미래',
  '태양',
  '은하',
  '별',
  '하늘',
  '바다',
  '새벽',
  '솔',
  '담',
  '빛',
  '샘',
  '한울',
  '아름',
  '다솜',
  '가람',
  '나래',
  '누리',
  '온',
  '한',
  '슬',
  '찬',
] as const;