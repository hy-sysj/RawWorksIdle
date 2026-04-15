import type { ResourceId } from '@/data/resources';

export type RecipeKind = 'chain' | 'cross' | 'prestige';

export type RecipeIngredient = {
  resourceId: ResourceId;
  amount: number;
};

export type RecipeDefinition = {
  id: string;
  kind: RecipeKind;
  chain: string;
  unlockedAtStage: number;
  inputs: RecipeIngredient[];
  output: { resourceId: ResourceId; amount: number };
  baseDurationSec: number;
};

const CHAIN_RECIPE_DURATIONS = {
  rawToP1: 5,
  p1ToP2: 15,
  p2ToPart: 30,
  partToFinal: 60,
} as const;

const CROSS_RECIPE_DURATIONS = {
  basic: 90,
  mid: 180,
  final: 300,
} as const;

type ChainRecipeBalance = {
  rawToP1Input: number;
  p1ToP2Input: number;
  p2ToPartInputs: {
    p2: number;
    p1: number;
  };
  partToFinalInput: number;
};

const EARLY_CHAIN_BALANCE: ChainRecipeBalance = {
  rawToP1Input: 2,
  p1ToP2Input: 3,
  p2ToPartInputs: { p2: 2, p1: 1 },
  partToFinalInput: 3,
};

const MID_CHAIN_BALANCE: ChainRecipeBalance = {
  rawToP1Input: 3,
  p1ToP2Input: 4,
  p2ToPartInputs: { p2: 3, p1: 1 },
  partToFinalInput: 3,
};

const ADVANCED_CHAIN_BALANCE: ChainRecipeBalance = {
  rawToP1Input: 4,
  p1ToP2Input: 4,
  p2ToPartInputs: { p2: 3, p1: 1 },
  partToFinalInput: 3,
};

const RARE_CHAIN_BALANCE: ChainRecipeBalance = {
  rawToP1Input: 4,
  p1ToP2Input: 5,
  p2ToPartInputs: { p2: 3, p1: 1 },
  partToFinalInput: 3,
};

const ENDGAME_CHAIN_BALANCE: ChainRecipeBalance = {
  rawToP1Input: 5,
  p1ToP2Input: 6,
  p2ToPartInputs: { p2: 3, p1: 1 },
  partToFinalInput: 3,
};

function createChainRecipes(
  chain: string,
  unlockedAtStage: number,
  rawId: ResourceId,
  p1Id: ResourceId,
  p2Id: ResourceId,
  partId: ResourceId,
  finalId: ResourceId,
  balance: ChainRecipeBalance,
): RecipeDefinition[] {
  return [
    {
      id: `${p1Id}_recipe`,
      kind: 'chain',
      chain,
      unlockedAtStage,
      inputs: [{ resourceId: rawId, amount: balance.rawToP1Input }],
      output: { resourceId: p1Id, amount: 1 },
      baseDurationSec: CHAIN_RECIPE_DURATIONS.rawToP1,
    },
    {
      id: `${p2Id}_recipe`,
      kind: 'chain',
      chain,
      unlockedAtStage,
      inputs: [{ resourceId: p1Id, amount: balance.p1ToP2Input }],
      output: { resourceId: p2Id, amount: 1 },
      baseDurationSec: CHAIN_RECIPE_DURATIONS.p1ToP2,
    },
    {
      id: `${partId}_recipe`,
      kind: 'chain',
      chain,
      unlockedAtStage,
      inputs: [
        { resourceId: p2Id, amount: balance.p2ToPartInputs.p2 },
        { resourceId: p1Id, amount: balance.p2ToPartInputs.p1 },
      ],
      output: { resourceId: partId, amount: 1 },
      baseDurationSec: CHAIN_RECIPE_DURATIONS.p2ToPart,
    },
    {
      id: `${finalId}_recipe`,
      kind: 'chain',
      chain,
      unlockedAtStage,
      inputs: [{ resourceId: partId, amount: balance.partToFinalInput }],
      output: { resourceId: finalId, amount: 1 },
      baseDurationSec: CHAIN_RECIPE_DURATIONS.partToFinal,
    },
  ];
}

export const RECIPES = [
  ...createChainRecipes('wood', 1, 'log', 'lumber', 'plywood', 'furniture_part', 'desk', EARLY_CHAIN_BALANCE),
  ...createChainRecipes(
    'copper',
    1,
    'copper_ore',
    'copper_ingot',
    'copper_wire',
    'wire_bundle',
    'electric_unit',
    EARLY_CHAIN_BALANCE,
  ),
  ...createChainRecipes('iron', 2, 'iron_ore', 'pig_iron', 'steel_plate', 'steel_frame', 'factory_unit', MID_CHAIN_BALANCE),
  ...createChainRecipes('oil', 2, 'crude_oil', 'naphtha', 'polymer', 'plastic', 'case', MID_CHAIN_BALANCE),
  ...createChainRecipes(
    'aluminum',
    2,
    'bauxite',
    'alumina',
    'aluminum_plate',
    'light_frame',
    'aviation_part',
    MID_CHAIN_BALANCE,
  ),
  ...createChainRecipes(
    'silicon',
    4,
    'quartz',
    'silicon',
    'wafer',
    'semiconductor',
    'microprocessor',
    ADVANCED_CHAIN_BALANCE,
  ),
  ...createChainRecipes(
    'lithium',
    4,
    'lithium_ore',
    'lithium_compound',
    'li_ion_cell',
    'battery_pack',
    'energy_storage',
    ADVANCED_CHAIN_BALANCE,
  ),
  ...createChainRecipes(
    'gold',
    4,
    'gold_ore',
    'gold_ingot',
    'gold_wire',
    'precious_connector',
    'precision_electronics',
    ADVANCED_CHAIN_BALANCE,
  ),
  ...createChainRecipes(
    'rare_earth',
    5,
    'rare_earth_ore',
    'rare_earth_oxide',
    'neodymium_magnet',
    'motor_core',
    'high_eff_motor',
    RARE_CHAIN_BALANCE,
  ),
  ...createChainRecipes(
    'uranium',
    6,
    'uranium_ore',
    'yellowcake',
    'enriched_uranium',
    'fuel_rod',
    'nuclear_module',
    ENDGAME_CHAIN_BALANCE,
  ),

  {
    id: 'composite_panel_recipe',
    kind: 'cross',
    chain: 'cross_basic',
    unlockedAtStage: 2,
    inputs: [
      { resourceId: 'steel_plate', amount: 3 },
      { resourceId: 'aluminum_plate', amount: 3 },
      { resourceId: 'polymer', amount: 2 },
    ],
    output: { resourceId: 'composite_panel', amount: 1 },
    baseDurationSec: CROSS_RECIPE_DURATIONS.basic,
  },
  {
    id: 'smart_machine_recipe',
    kind: 'cross',
    chain: 'cross_basic',
    unlockedAtStage: 3,
    inputs: [
      { resourceId: 'steel_frame', amount: 1 },
      { resourceId: 'wire_bundle', amount: 2 },
      { resourceId: 'plastic', amount: 2 },
    ],
    output: { resourceId: 'smart_machine', amount: 1 },
    baseDurationSec: CROSS_RECIPE_DURATIONS.basic,
  },
  {
    id: 'adv_workbench_recipe',
    kind: 'cross',
    chain: 'cross_basic',
    unlockedAtStage: 3,
    inputs: [
      { resourceId: 'furniture_part', amount: 2 },
      { resourceId: 'steel_frame', amount: 1 },
      { resourceId: 'electric_unit', amount: 1 },
    ],
    output: { resourceId: 'adv_workbench', amount: 1 },
    baseDurationSec: CROSS_RECIPE_DURATIONS.basic,
  },
  {
    id: 'basic_circuit_recipe',
    kind: 'cross',
    chain: 'cross_basic',
    unlockedAtStage: 4,
    inputs: [
      { resourceId: 'copper_wire', amount: 2 },
      { resourceId: 'silicon', amount: 2 },
      { resourceId: 'plastic', amount: 1 },
    ],
    output: { resourceId: 'basic_circuit', amount: 1 },
    baseDurationSec: CROSS_RECIPE_DURATIONS.basic,
  },

  {
    id: 'adv_circuit_recipe',
    kind: 'cross',
    chain: 'cross_mid',
    unlockedAtStage: 5,
    inputs: [
      { resourceId: 'semiconductor', amount: 2 },
      { resourceId: 'precious_connector', amount: 1 },
      { resourceId: 'basic_circuit', amount: 2 },
    ],
    output: { resourceId: 'adv_circuit', amount: 1 },
    baseDurationSec: CROSS_RECIPE_DURATIONS.mid,
  },
  {
    id: 'ev_unit_recipe',
    kind: 'cross',
    chain: 'cross_mid',
    unlockedAtStage: 5,
    inputs: [
      { resourceId: 'battery_pack', amount: 2 },
      { resourceId: 'high_eff_motor', amount: 1 },
      { resourceId: 'light_frame', amount: 2 },
    ],
    output: { resourceId: 'ev_unit', amount: 1 },
    baseDurationSec: CROSS_RECIPE_DURATIONS.mid,
  },
  {
    id: 'reactor_module_recipe',
    kind: 'cross',
    chain: 'cross_mid',
    unlockedAtStage: 6,
    inputs: [
      { resourceId: 'fuel_rod', amount: 2 },
      { resourceId: 'steel_plate', amount: 2 },
      { resourceId: 'composite_panel', amount: 1 },
    ],
    output: { resourceId: 'reactor_module', amount: 1 },
    baseDurationSec: CROSS_RECIPE_DURATIONS.mid,
  },
  {
    id: 'generator_core_recipe',
    kind: 'cross',
    chain: 'cross_mid',
    unlockedAtStage: 6,
    inputs: [
      { resourceId: 'neodymium_magnet', amount: 2 },
      { resourceId: 'copper_wire', amount: 2 },
      { resourceId: 'steel_frame', amount: 1 },
    ],
    output: { resourceId: 'generator_core', amount: 1 },
    baseDurationSec: CROSS_RECIPE_DURATIONS.mid,
  },
  {
    id: 'iot_device_recipe',
    kind: 'cross',
    chain: 'cross_mid',
    unlockedAtStage: 7,
    inputs: [
      { resourceId: 'microprocessor', amount: 1 },
      { resourceId: 'wire_bundle', amount: 2 },
      { resourceId: 'plastic', amount: 2 },
    ],
    output: { resourceId: 'iot_device', amount: 1 },
    baseDurationSec: CROSS_RECIPE_DURATIONS.mid,
  },

  {
    id: 'ai_computing_recipe',
    kind: 'cross',
    chain: 'cross_final',
    unlockedAtStage: 7,
    inputs: [
      { resourceId: 'adv_circuit', amount: 2 },
      { resourceId: 'energy_storage', amount: 1 },
      { resourceId: 'microprocessor', amount: 1 },
    ],
    output: { resourceId: 'ai_computing', amount: 1 },
    baseDurationSec: CROSS_RECIPE_DURATIONS.final,
  },
  {
    id: 'smart_city_recipe',
    kind: 'cross',
    chain: 'cross_final',
    unlockedAtStage: 8,
    inputs: [
      { resourceId: 'ev_unit', amount: 2 },
      { resourceId: 'ai_computing', amount: 1 },
      { resourceId: 'iot_device', amount: 2 },
    ],
    output: { resourceId: 'smart_city', amount: 1 },
    baseDurationSec: CROSS_RECIPE_DURATIONS.final,
  },
  {
    id: 'infinite_energy_recipe',
    kind: 'cross',
    chain: 'cross_final',
    unlockedAtStage: 8,
    inputs: [
      { resourceId: 'reactor_module', amount: 2 },
      { resourceId: 'generator_core', amount: 1 },
      { resourceId: 'energy_storage', amount: 2 },
    ],
    output: { resourceId: 'infinite_energy', amount: 1 },
    baseDurationSec: CROSS_RECIPE_DURATIONS.final,
  },

  {
    id: 'small_factory_recipe',
    kind: 'prestige',
    chain: 'prestige',
    unlockedAtStage: 3,
    inputs: [
      { resourceId: 'factory_unit', amount: 4 },
      { resourceId: 'electric_unit', amount: 4 },
      { resourceId: 'case', amount: 4 },
    ],
    output: { resourceId: 'small_factory', amount: 1 },
    baseDurationSec: CROSS_RECIPE_DURATIONS.final,
  },
  {
    id: 'industrial_complex_recipe',
    kind: 'prestige',
    chain: 'prestige',
    unlockedAtStage: 5,
    inputs: [
      { resourceId: 'smart_machine', amount: 3 },
      { resourceId: 'adv_workbench', amount: 3 },
      { resourceId: 'small_factory', amount: 1 },
    ],
    output: { resourceId: 'industrial_complex', amount: 1 },
    baseDurationSec: CROSS_RECIPE_DURATIONS.final,
  },
  {
    id: 'future_city_recipe',
    kind: 'prestige',
    chain: 'prestige',
    unlockedAtStage: 8,
    inputs: [
      { resourceId: 'smart_city', amount: 3 },
      { resourceId: 'infinite_energy', amount: 3 },
      { resourceId: 'industrial_complex', amount: 1 },
    ],
    output: { resourceId: 'future_city', amount: 1 },
    baseDurationSec: CROSS_RECIPE_DURATIONS.final,
  },
] as const satisfies readonly RecipeDefinition[];

export type RecipeId = (typeof RECIPES)[number]['id'];

export const recipeById: Record<RecipeId, RecipeDefinition> = Object.fromEntries(
  RECIPES.map((recipe) => [recipe.id, recipe]),
) as Record<RecipeId, RecipeDefinition>;

export function getRecipesAtStage(stage: number): RecipeDefinition[] {
  return RECIPES.filter((recipe) => recipe.unlockedAtStage <= stage);
}
