import type { ResourceId } from "@/data/resources";

export type UpgradeCategory = "mining" | "smelting" | "automation" | "facility" | "research";

export type UpgradeCost = {
  resourceId: ResourceId;
  amount: number;
};

export type UpgradeTier = {
  level: number;
  nameKo: string;
  cost: UpgradeCost[];
  effect: string;
  requiredStage: number;
  requiredUpgrades?: string[];
};

export type UpgradeDefinition = {
  id: string;
  nameKo: string;
  category: UpgradeCategory;
  tiers: UpgradeTier[];
};

export const upgrades = [
  {
    id: "mining",
    nameKo: "채굴도구",
    category: "mining",
    tiers: [
      { level: 1, nameKo: "곡괭이", cost: [{ resourceId: "steel_plate", amount: 5 }], effect: "채취량/속도 ×1.5", requiredStage: 1 },
      {
        level: 2,
        nameKo: "착암기",
        cost: [{ resourceId: "steel_frame", amount: 3 }],
        effect: "채취량/속도 ×1.5",
        requiredStage: 2
      },
      {
        level: 3,
        nameKo: "굴착기",
        cost: [{ resourceId: "composite_panel", amount: 2 }],
        effect: "채취량/속도 ×1.5",
        requiredStage: 3
      },
      {
        level: 4,
        nameKo: "양자드릴",
        cost: [{ resourceId: "ai_computing", amount: 1 }],
        effect: "채취량/속도 ×1.5",
        requiredStage: 7
      }
    ]
  },
  {
    id: "smelting",
    nameKo: "제련설비",
    category: "smelting",
    tiers: [
      { level: 1, nameKo: "용광로", cost: [{ resourceId: "pig_iron", amount: 10 }], effect: "가공 시간 ×0.7", requiredStage: 1 },
      {
        level: 2,
        nameKo: "전기로",
        cost: [{ resourceId: "wire_bundle", amount: 5 }],
        effect: "가공 시간 ×0.7",
        requiredStage: 3
      },
      {
        level: 3,
        nameKo: "아크로",
        cost: [{ resourceId: "generator_core", amount: 2 }],
        effect: "가공 시간 ×0.7",
        requiredStage: 6
      },
      {
        level: 4,
        nameKo: "플라즈마로",
        cost: [{ resourceId: "reactor_module", amount: 1 }],
        effect: "가공 시간 ×0.7",
        requiredStage: 6
      }
    ]
  },
  {
    id: "automation",
    nameKo: "자동화",
    category: "automation",
    tiers: [
      {
        level: 1,
        nameKo: "컨베이어",
        cost: [{ resourceId: "smart_machine", amount: 1 }],
        effect: "오프라인 최대 +2시간, 체인 자동 반복",
        requiredStage: 3
      },
      {
        level: 2,
        nameKo: "로봇팔",
        cost: [{ resourceId: "plastic", amount: 10 }],
        effect: "오프라인 최대 +2시간, 체인 자동 반복",
        requiredStage: 3
      },
      {
        level: 3,
        nameKo: "AI라인",
        cost: [{ resourceId: "adv_circuit", amount: 2 }],
        effect: "오프라인 최대 +2시간, 체인 자동 반복",
        requiredStage: 7
      }
    ]
  },
  {
    id: "workbench",
    nameKo: "작업대",
    category: "facility",
    tiers: [
      { level: 1, nameKo: "목재 작업대", cost: [{ resourceId: "furniture_part", amount: 5 }], effect: "생산 슬롯 +1", requiredStage: 1 },
      {
        level: 2,
        nameKo: "철제 작업대",
        cost: [{ resourceId: "electric_unit", amount: 3 }],
        effect: "생산 슬롯 +1",
        requiredStage: 3
      },
      {
        level: 3,
        nameKo: "첨단 작업대",
        cost: [{ resourceId: "adv_circuit", amount: 1 }],
        effect: "생산 슬롯 +1",
        requiredStage: 5
      },
      {
        level: 4,
        nameKo: "나노 작업대",
        cost: [{ resourceId: "microprocessor", amount: 2 }],
        effect: "생산 슬롯 +1",
        requiredStage: 7
      }
    ]
  },
  {
    id: "facility_scale",
    nameKo: "시설규모",
    category: "facility",
    tiers: [
      { level: 1, nameKo: "소규모", cost: [{ resourceId: "factory_unit", amount: 1 }], effect: "채취 지점 +1", requiredStage: 3 },
      {
        level: 2,
        nameKo: "공장",
        cost: [{ resourceId: "composite_panel", amount: 5 }],
        effect: "채취 지점 +1",
        requiredStage: 4
      },
      {
        level: 3,
        nameKo: "산업단지",
        cost: [{ resourceId: "smart_city", amount: 1 }],
        effect: "채취 지점 +1",
        requiredStage: 8
      },
      {
        level: 4,
        nameKo: "미래도시",
        cost: [{ resourceId: "future_city", amount: 1 }],
        effect: "채취 지점 +1",
        requiredStage: 8
      }
    ]
  },
  {
    id: "research_lab",
    nameKo: "연구소",
    category: "research",
    tiers: [
      {
        level: 1,
        nameKo: "연구소 건설",
        cost: [
          { resourceId: "smart_machine", amount: 1 },
          { resourceId: "desk", amount: 1 }
        ],
        effect: "4단계 진입 및 4단계 자원/레시피 해금",
        requiredStage: 3
      },
      {
        level: 2,
        nameKo: "첨단 연구소",
        cost: [
          { resourceId: "adv_circuit", amount: 1 },
          { resourceId: "precision_electronics", amount: 1 }
        ],
        effect: "6단계 진입 및 6단계 자원/레시피 해금",
        requiredStage: 5,
        requiredUpgrades: ["research_lab"]
      }
    ]
  },
  {
    id: "energy_grid",
    nameKo: "에너지그리드",
    category: "research",
    tiers: [
      {
        level: 1,
        nameKo: "에너지 그리드",
        cost: [
          { resourceId: "generator_core", amount: 1 },
          { resourceId: "energy_storage", amount: 1 }
        ],
        effect: "전체 생산 속도 ×1.5",
        requiredStage: 6
      }
    ]
  }
] as const satisfies readonly UpgradeDefinition[];

export type UpgradeId = (typeof upgrades)[number]["id"];

export const upgradeById = upgrades.reduce(
  (accumulator, upgrade) => {
    accumulator[upgrade.id] = upgrade;
    return accumulator;
  },
  {} as Record<UpgradeId, UpgradeDefinition>
);

export const upgradeIds = upgrades.map((upgrade) => upgrade.id) as UpgradeId[];