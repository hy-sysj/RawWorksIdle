import type { ResourceId } from "@/data/resources";

export type RecipeKind = "chain" | "cross" | "prestige";

export type RecipeInput = {
  resourceId: ResourceId;
  amount: number;
};

export type RecipeDefinition = {
  id: string;
  kind: RecipeKind;
  chain: string;
  unlockedAtStage: number;
  inputs: RecipeInput[];
  output: { resourceId: ResourceId; amount: number };
  baseDurationSec: number;
};

const chainRecipe = (
  id: string,
  chain: string,
  unlockedAtStage: number,
  inputs: RecipeInput[],
  output: { resourceId: ResourceId; amount: number },
  baseDurationSec: number
): RecipeDefinition => ({
  id,
  kind: "chain",
  chain,
  unlockedAtStage,
  inputs,
  output,
  baseDurationSec
});

const crossRecipe = (
  id: string,
  unlockedAtStage: number,
  inputs: RecipeInput[],
  output: { resourceId: ResourceId; amount: number },
  baseDurationSec: number
): RecipeDefinition => ({
  id,
  kind: "cross",
  chain: "cross",
  unlockedAtStage,
  inputs,
  output,
  baseDurationSec
});

const prestigeRecipe = (
  id: string,
  unlockedAtStage: number,
  inputs: RecipeInput[],
  output: { resourceId: ResourceId; amount: number },
  baseDurationSec: number
): RecipeDefinition => ({
  id,
  kind: "prestige",
  chain: "prestige",
  unlockedAtStage,
  inputs,
  output,
  baseDurationSec
});

export const recipes = [
  chainRecipe("wood_lumber", "wood", 1, [{ resourceId: "log", amount: 1 }], { resourceId: "lumber", amount: 1 }, 5),
  chainRecipe("wood_plywood", "wood", 1, [{ resourceId: "lumber", amount: 1 }], { resourceId: "plywood", amount: 1 }, 15),
  chainRecipe(
    "wood_furniture_part",
    "wood",
    1,
    [
      { resourceId: "plywood", amount: 1 },
      { resourceId: "lumber", amount: 1 }
    ],
    { resourceId: "furniture_part", amount: 1 },
    30
  ),
  chainRecipe("wood_desk", "wood", 1, [{ resourceId: "furniture_part", amount: 1 }], { resourceId: "desk", amount: 1 }, 60),

  chainRecipe("iron_pig_iron", "iron", 1, [{ resourceId: "iron_ore", amount: 1 }], { resourceId: "pig_iron", amount: 1 }, 5),
  chainRecipe("iron_steel_plate", "iron", 1, [{ resourceId: "pig_iron", amount: 1 }], { resourceId: "steel_plate", amount: 1 }, 15),
  chainRecipe(
    "iron_steel_frame",
    "iron",
    1,
    [
      { resourceId: "steel_plate", amount: 1 },
      { resourceId: "pig_iron", amount: 1 }
    ],
    { resourceId: "steel_frame", amount: 1 },
    30
  ),
  chainRecipe("iron_factory_unit", "iron", 1, [{ resourceId: "steel_frame", amount: 1 }], { resourceId: "factory_unit", amount: 1 }, 60),

  chainRecipe("oil_naphtha", "oil", 2, [{ resourceId: "crude_oil", amount: 1 }], { resourceId: "naphtha", amount: 1 }, 5),
  chainRecipe("oil_polymer", "oil", 2, [{ resourceId: "naphtha", amount: 1 }], { resourceId: "polymer", amount: 1 }, 15),
  chainRecipe(
    "oil_plastic",
    "oil",
    2,
    [
      { resourceId: "polymer", amount: 1 },
      { resourceId: "naphtha", amount: 1 }
    ],
    { resourceId: "plastic", amount: 1 },
    30
  ),
  chainRecipe("oil_case", "oil", 2, [{ resourceId: "plastic", amount: 1 }], { resourceId: "case", amount: 1 }, 60),

  chainRecipe("copper_ingot", "copper", 2, [{ resourceId: "copper_ore", amount: 1 }], { resourceId: "copper_ingot", amount: 1 }, 5),
  chainRecipe("copper_wire", "copper", 2, [{ resourceId: "copper_ingot", amount: 1 }], { resourceId: "copper_wire", amount: 1 }, 15),
  chainRecipe(
    "copper_bundle",
    "copper",
    2,
    [
      { resourceId: "copper_wire", amount: 1 },
      { resourceId: "copper_ingot", amount: 1 }
    ],
    { resourceId: "wire_bundle", amount: 1 },
    30
  ),
  chainRecipe(
    "copper_electric_unit",
    "copper",
    2,
    [{ resourceId: "wire_bundle", amount: 1 }],
    { resourceId: "electric_unit", amount: 1 },
    60
  ),

  chainRecipe("aluminum_alumina", "aluminum", 2, [{ resourceId: "bauxite", amount: 1 }], { resourceId: "alumina", amount: 1 }, 5),
  chainRecipe(
    "aluminum_plate",
    "aluminum",
    2,
    [{ resourceId: "alumina", amount: 1 }],
    { resourceId: "aluminum_plate", amount: 1 },
    15
  ),
  chainRecipe(
    "aluminum_light_frame",
    "aluminum",
    2,
    [
      { resourceId: "aluminum_plate", amount: 1 },
      { resourceId: "alumina", amount: 1 }
    ],
    { resourceId: "light_frame", amount: 1 },
    30
  ),
  chainRecipe(
    "aluminum_aviation_part",
    "aluminum",
    2,
    [{ resourceId: "light_frame", amount: 1 }],
    { resourceId: "aviation_part", amount: 1 },
    60
  ),

  chainRecipe("silicon_silicon", "silicon", 4, [{ resourceId: "quartz", amount: 1 }], { resourceId: "silicon", amount: 1 }, 5),
  chainRecipe("silicon_wafer", "silicon", 4, [{ resourceId: "silicon", amount: 1 }], { resourceId: "wafer", amount: 1 }, 15),
  chainRecipe(
    "silicon_semiconductor",
    "silicon",
    4,
    [
      { resourceId: "wafer", amount: 1 },
      { resourceId: "silicon", amount: 1 }
    ],
    { resourceId: "semiconductor", amount: 1 },
    30
  ),
  chainRecipe(
    "silicon_microprocessor",
    "silicon",
    4,
    [{ resourceId: "semiconductor", amount: 1 }],
    { resourceId: "microprocessor", amount: 1 },
    60
  ),

  chainRecipe(
    "lithium_compound_recipe",
    "lithium",
    4,
    [{ resourceId: "lithium_ore", amount: 1 }],
    { resourceId: "lithium_compound", amount: 1 },
    5
  ),
  chainRecipe(
    "lithium_cell",
    "lithium",
    4,
    [{ resourceId: "lithium_compound", amount: 1 }],
    { resourceId: "li_ion_cell", amount: 1 },
    15
  ),
  chainRecipe(
    "lithium_battery_pack",
    "lithium",
    4,
    [
      { resourceId: "li_ion_cell", amount: 1 },
      { resourceId: "lithium_compound", amount: 1 }
    ],
    { resourceId: "battery_pack", amount: 1 },
    30
  ),
  chainRecipe(
    "lithium_energy_storage",
    "lithium",
    4,
    [{ resourceId: "battery_pack", amount: 1 }],
    { resourceId: "energy_storage", amount: 1 },
    60
  ),

  chainRecipe("gold_ingot_recipe", "gold", 4, [{ resourceId: "gold_ore", amount: 1 }], { resourceId: "gold_ingot", amount: 1 }, 5),
  chainRecipe("gold_wire_recipe", "gold", 4, [{ resourceId: "gold_ingot", amount: 1 }], { resourceId: "gold_wire", amount: 1 }, 15),
  chainRecipe(
    "gold_precious_connector",
    "gold",
    4,
    [
      { resourceId: "gold_wire", amount: 1 },
      { resourceId: "gold_ingot", amount: 1 }
    ],
    { resourceId: "precious_connector", amount: 1 },
    30
  ),
  chainRecipe(
    "gold_precision_electronics",
    "gold",
    4,
    [{ resourceId: "precious_connector", amount: 1 }],
    { resourceId: "precision_electronics", amount: 1 },
    60
  ),

  chainRecipe(
    "rare_earth_oxide_recipe",
    "rare_earth",
    5,
    [{ resourceId: "rare_earth_ore", amount: 1 }],
    { resourceId: "rare_earth_oxide", amount: 1 },
    5
  ),
  chainRecipe(
    "rare_earth_magnet",
    "rare_earth",
    5,
    [{ resourceId: "rare_earth_oxide", amount: 1 }],
    { resourceId: "neodymium_magnet", amount: 1 },
    15
  ),
  chainRecipe(
    "rare_earth_motor_core",
    "rare_earth",
    5,
    [
      { resourceId: "neodymium_magnet", amount: 1 },
      { resourceId: "rare_earth_oxide", amount: 1 }
    ],
    { resourceId: "motor_core", amount: 1 },
    30
  ),
  chainRecipe(
    "rare_earth_motor",
    "rare_earth",
    5,
    [{ resourceId: "motor_core", amount: 1 }],
    { resourceId: "high_eff_motor", amount: 1 },
    60
  ),

  chainRecipe("uranium_yellowcake", "uranium", 6, [{ resourceId: "uranium_ore", amount: 1 }], { resourceId: "yellowcake", amount: 1 }, 5),
  chainRecipe(
    "uranium_enriched",
    "uranium",
    6,
    [{ resourceId: "yellowcake", amount: 1 }],
    { resourceId: "enriched_uranium", amount: 1 },
    15
  ),
  chainRecipe(
    "uranium_fuel_rod",
    "uranium",
    6,
    [
      { resourceId: "enriched_uranium", amount: 1 },
      { resourceId: "yellowcake", amount: 1 }
    ],
    { resourceId: "fuel_rod", amount: 1 },
    30
  ),
  chainRecipe(
    "uranium_nuclear_module",
    "uranium",
    6,
    [{ resourceId: "fuel_rod", amount: 1 }],
    { resourceId: "nuclear_module", amount: 1 },
    60
  ),

  crossRecipe(
    "cross_composite_panel",
    2,
    [
      { resourceId: "steel_plate", amount: 1 },
      { resourceId: "aluminum_plate", amount: 1 },
      { resourceId: "polymer", amount: 1 }
    ],
    { resourceId: "composite_panel", amount: 1 },
    90
  ),
  crossRecipe(
    "cross_smart_machine",
    3,
    [
      { resourceId: "steel_frame", amount: 1 },
      { resourceId: "wire_bundle", amount: 1 },
      { resourceId: "plastic", amount: 1 }
    ],
    { resourceId: "smart_machine", amount: 1 },
    90
  ),
  crossRecipe(
    "cross_adv_workbench",
    3,
    [
      { resourceId: "furniture_part", amount: 1 },
      { resourceId: "steel_frame", amount: 1 },
      { resourceId: "electric_unit", amount: 1 }
    ],
    { resourceId: "adv_workbench", amount: 1 },
    90
  ),
  crossRecipe(
    "cross_basic_circuit",
    4,
    [
      { resourceId: "copper_wire", amount: 1 },
      { resourceId: "silicon", amount: 1 },
      { resourceId: "plastic", amount: 1 }
    ],
    { resourceId: "basic_circuit", amount: 1 },
    90
  ),

  crossRecipe(
    "cross_adv_circuit",
    5,
    [
      { resourceId: "semiconductor", amount: 1 },
      { resourceId: "precious_connector", amount: 1 },
      { resourceId: "basic_circuit", amount: 1 }
    ],
    { resourceId: "adv_circuit", amount: 1 },
    180
  ),
  crossRecipe(
    "cross_ev_unit",
    5,
    [
      { resourceId: "battery_pack", amount: 1 },
      { resourceId: "high_eff_motor", amount: 1 },
      { resourceId: "light_frame", amount: 1 }
    ],
    { resourceId: "ev_unit", amount: 1 },
    180
  ),
  crossRecipe(
    "cross_reactor_module",
    6,
    [
      { resourceId: "fuel_rod", amount: 1 },
      { resourceId: "steel_plate", amount: 1 },
      { resourceId: "composite_panel", amount: 1 }
    ],
    { resourceId: "reactor_module", amount: 1 },
    180
  ),
  crossRecipe(
    "cross_generator_core",
    6,
    [
      { resourceId: "neodymium_magnet", amount: 1 },
      { resourceId: "copper_wire", amount: 1 },
      { resourceId: "steel_frame", amount: 1 }
    ],
    { resourceId: "generator_core", amount: 1 },
    180
  ),
  crossRecipe(
    "cross_iot_device",
    6,
    [
      { resourceId: "microprocessor", amount: 1 },
      { resourceId: "wire_bundle", amount: 1 },
      { resourceId: "plastic", amount: 1 }
    ],
    { resourceId: "iot_device", amount: 1 },
    180
  ),

  crossRecipe(
    "cross_ai_computing",
    7,
    [
      { resourceId: "adv_circuit", amount: 1 },
      { resourceId: "energy_storage", amount: 1 },
      { resourceId: "microprocessor", amount: 1 }
    ],
    { resourceId: "ai_computing", amount: 1 },
    300
  ),
  crossRecipe(
    "cross_smart_city",
    8,
    [
      { resourceId: "ev_unit", amount: 1 },
      { resourceId: "ai_computing", amount: 1 },
      { resourceId: "iot_device", amount: 1 }
    ],
    { resourceId: "smart_city", amount: 1 },
    300
  ),
  crossRecipe(
    "cross_infinite_energy",
    8,
    [
      { resourceId: "reactor_module", amount: 1 },
      { resourceId: "generator_core", amount: 1 },
      { resourceId: "energy_storage", amount: 1 }
    ],
    { resourceId: "infinite_energy", amount: 1 },
    300
  ),

  prestigeRecipe(
    "prestige_small_factory",
    3,
    [
      { resourceId: "factory_unit", amount: 1 },
      { resourceId: "electric_unit", amount: 1 },
      { resourceId: "case", amount: 1 }
    ],
    { resourceId: "small_factory", amount: 1 },
    300
  ),
  prestigeRecipe(
    "prestige_industrial_complex",
    5,
    [
      { resourceId: "smart_machine", amount: 1 },
      { resourceId: "adv_workbench", amount: 1 },
      { resourceId: "small_factory", amount: 1 }
    ],
    { resourceId: "industrial_complex", amount: 1 },
    300
  ),
  prestigeRecipe(
    "prestige_future_city",
    8,
    [
      { resourceId: "smart_city", amount: 1 },
      { resourceId: "infinite_energy", amount: 1 },
      { resourceId: "industrial_complex", amount: 1 }
    ],
    { resourceId: "future_city", amount: 1 },
    300
  )
] as const satisfies readonly RecipeDefinition[];

export type RecipeId = (typeof recipes)[number]["id"];

export const recipeById = Object.fromEntries(recipes.map((recipe) => [recipe.id, recipe])) as Record<
  RecipeId,
  RecipeDefinition
>;

export const chainRecipes = recipes.filter((recipe) => recipe.kind === "chain");
export const crossRecipes = recipes.filter((recipe) => recipe.kind === "cross");
export const prestigeRecipes = recipes.filter((recipe) => recipe.kind === "prestige");