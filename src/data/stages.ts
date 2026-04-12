import { recipes, type RecipeId } from "@/data/recipes";
import { resources, type ResourceId } from "@/data/resources";
import type { UpgradeId } from "@/data/upgrades";

export type StageRequirement =
  | { type: "resource"; resourceId: ResourceId; amount: number }
  | { type: "upgrade"; upgradeId: UpgradeId; level: number };

export type StageDefinition = {
  id: number;
  nameKo: string;
  unlocksResources: ResourceId[];
  unlocksRecipes: RecipeId[];
  requirements: StageRequirement[];
  requiredUpgrades?: UpgradeId[];
};

const getResourcesAtStage = (stage: number) => resources.filter((resource) => resource.unlockedAtStage === stage).map((resource) => resource.id) as ResourceId[];

const getRecipesAtStage = (stage: number) => recipes.filter((recipe) => recipe.unlockedAtStage === stage).map((recipe) => recipe.id) as RecipeId[];

export const stages = [
  {
    id: 1,
    nameKo: "맨손 개척",
    unlocksResources: getResourcesAtStage(1),
    unlocksRecipes: getRecipesAtStage(1),
    requirements: []
  },
  {
    id: 2,
    nameKo: "소규모 가공",
    unlocksResources: getResourcesAtStage(2),
    unlocksRecipes: getRecipesAtStage(2),
    requirements: [{ type: "resource", resourceId: "desk", amount: 1 }]
  },
  {
    id: 3,
    nameKo: "전기화",
    unlocksResources: [],
    unlocksRecipes: getRecipesAtStage(3),
    requirements: [{ type: "resource", resourceId: "composite_panel", amount: 1 }]
  },
  {
    id: 4,
    nameKo: "첨단 산업",
    unlocksResources: getResourcesAtStage(4),
    unlocksRecipes: getRecipesAtStage(4),
    requirements: [{ type: "upgrade", upgradeId: "research_lab", level: 1 }],
    requiredUpgrades: ["research_lab"]
  },
  {
    id: 5,
    nameKo: "산업단지",
    unlocksResources: getResourcesAtStage(5),
    unlocksRecipes: getRecipesAtStage(5),
    requirements: [
      { type: "resource", resourceId: "basic_circuit", amount: 1 },
      { type: "resource", resourceId: "adv_workbench", amount: 1 }
    ]
  },
  {
    id: 6,
    nameKo: "원자력 시대",
    unlocksResources: getResourcesAtStage(6),
    unlocksRecipes: getRecipesAtStage(6),
    requirements: [{ type: "upgrade", upgradeId: "research_lab", level: 2 }],
    requiredUpgrades: ["research_lab"]
  },
  {
    id: 7,
    nameKo: "AI 산업",
    unlocksResources: [],
    unlocksRecipes: getRecipesAtStage(7),
    requirements: [
      { type: "resource", resourceId: "reactor_module", amount: 1 },
      { type: "resource", resourceId: "generator_core", amount: 1 }
    ]
  },
  {
    id: 8,
    nameKo: "미래도시",
    unlocksResources: [],
    unlocksRecipes: getRecipesAtStage(8),
    requirements: [{ type: "resource", resourceId: "ai_computing", amount: 1 }]
  }
] as const satisfies readonly StageDefinition[];

export type StageId = (typeof stages)[number]["id"];

export const stageById = Object.fromEntries(stages.map((stage) => [stage.id, stage])) as Record<
  StageId,
  (typeof stages)[number]
>;

export const maxStage = stages[stages.length - 1]!.id;