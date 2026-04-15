import type { RecipeId } from '@/data/recipes';
import type { ResourceId } from '@/data/resources';
import type { UpgradeId } from '@/data/upgrades';

export type StageTransitionCondition =
  | {
      type: 'upgrade_levels';
      upgrades: Partial<Record<UpgradeId, number>>;
    }
  | {
      type: 'resource_counts';
      resources: Partial<Record<ResourceId, number>>;
    };

export type StageDefinition = {
  id: number;
  nameKo: string;
  unlocksResources: ResourceId[];
  unlocksRecipes: RecipeId[];
  transitionToNext?: StageTransitionCondition;
};

export const STAGES: StageDefinition[] = [
  {
    id: 1,
    nameKo: '맨손 개척',
    unlocksResources: ['log', 'copper_ore'],
    unlocksRecipes: ['lumber_recipe', 'copper_ingot_recipe'],
    transitionToNext: {
      type: 'upgrade_levels',
      upgrades: { transport: 1, mining_tool: 1 },
    },
  },
  {
    id: 2,
    nameKo: '소규모 가공',
    unlocksResources: ['iron_ore', 'crude_oil', 'bauxite'],
    unlocksRecipes: [
      'pig_iron_recipe',
      'steel_plate_recipe',
      'steel_frame_recipe',
      'factory_unit_recipe',
      'naphtha_recipe',
      'polymer_recipe',
      'plastic_recipe',
      'case_recipe',
      'alumina_recipe',
      'aluminum_plate_recipe',
      'light_frame_recipe',
      'aviation_part_recipe',
      'composite_panel_recipe',
    ],
    transitionToNext: {
      type: 'resource_counts',
      resources: { composite_panel: 1 },
    },
  },
  {
    id: 3,
    nameKo: '전기화',
    unlocksResources: [],
    unlocksRecipes: ['copper_wire_recipe', 'wire_bundle_recipe', 'electric_unit_recipe', 'smart_machine_recipe', 'adv_workbench_recipe'],
    transitionToNext: {
      type: 'upgrade_levels',
      upgrades: { research: 1 },
    },
  },
  {
    id: 4,
    nameKo: '첨단 산업',
    unlocksResources: ['quartz', 'lithium_ore', 'gold_ore'],
    unlocksRecipes: [
      'silicon_recipe',
      'wafer_recipe',
      'semiconductor_recipe',
      'microprocessor_recipe',
      'lithium_compound_recipe',
      'li_ion_cell_recipe',
      'battery_pack_recipe',
      'energy_storage_recipe',
      'gold_ingot_recipe',
      'gold_wire_recipe',
      'precious_connector_recipe',
      'precision_electronics_recipe',
      'basic_circuit_recipe',
    ],
    transitionToNext: {
      type: 'resource_counts',
      resources: { basic_circuit: 1, adv_workbench: 1 },
    },
  },
  {
    id: 5,
    nameKo: '산업단지',
    unlocksResources: ['rare_earth_ore'],
    unlocksRecipes: ['rare_earth_oxide_recipe', 'neodymium_magnet_recipe', 'motor_core_recipe', 'high_eff_motor_recipe', 'adv_circuit_recipe', 'ev_unit_recipe'],
    transitionToNext: {
      type: 'upgrade_levels',
      upgrades: { research: 2 },
    },
  },
  {
    id: 6,
    nameKo: '원자력 시대',
    unlocksResources: ['uranium_ore'],
    unlocksRecipes: ['yellowcake_recipe', 'enriched_uranium_recipe', 'fuel_rod_recipe', 'nuclear_module_recipe', 'reactor_module_recipe', 'generator_core_recipe'],
    transitionToNext: {
      type: 'resource_counts',
      resources: { reactor_module: 1, generator_core: 1 },
    },
  },
  {
    id: 7,
    nameKo: 'AI 산업',
    unlocksResources: [],
    unlocksRecipes: ['iot_device_recipe', 'ai_computing_recipe'],
    transitionToNext: {
      type: 'resource_counts',
      resources: { ai_computing: 1 },
    },
  },
  {
    id: 8,
    nameKo: '미래도시',
    unlocksResources: [],
    unlocksRecipes: ['smart_city_recipe', 'infinite_energy_recipe', 'future_city_recipe'],
  },
] as const;

export const stageById: Record<number, StageDefinition> = Object.fromEntries(
  STAGES.map((stage) => [stage.id, stage]),
) as Record<number, StageDefinition>;
