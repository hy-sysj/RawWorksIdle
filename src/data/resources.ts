export type ResourceTier = 'raw' | 'p1' | 'p2' | 'part' | 'final' | 'cross' | 'prestige';

export type ResourceDefinition = {
  id: string;
  nameKo: string;
  emoji: string;
  tier: ResourceTier;
  chain: string;
  unlockedAtStage: number;
  isRaw: boolean;
  isPrestigeItem?: boolean;
};

export const RESOURCES = [
  { id: 'log', nameKo: '원목', emoji: '🪵', tier: 'raw', chain: 'wood', unlockedAtStage: 1, isRaw: true },
  { id: 'lumber', nameKo: '목재', emoji: '🪚', tier: 'p1', chain: 'wood', unlockedAtStage: 1, isRaw: false },
  { id: 'plywood', nameKo: '합판', emoji: '🟫', tier: 'p2', chain: 'wood', unlockedAtStage: 1, isRaw: false },
  { id: 'furniture_part', nameKo: '가구부품', emoji: '🪑', tier: 'part', chain: 'wood', unlockedAtStage: 1, isRaw: false },
  { id: 'desk', nameKo: '책상', emoji: '🛋️', tier: 'final', chain: 'wood', unlockedAtStage: 1, isRaw: false },

  { id: 'copper_ore', nameKo: '구리광석', emoji: '🟠', tier: 'raw', chain: 'copper', unlockedAtStage: 1, isRaw: true },
  { id: 'copper_ingot', nameKo: '동괴', emoji: '🧱', tier: 'p1', chain: 'copper', unlockedAtStage: 1, isRaw: false },
  { id: 'copper_wire', nameKo: '구리선', emoji: '🧵', tier: 'p2', chain: 'copper', unlockedAtStage: 1, isRaw: false },
  { id: 'wire_bundle', nameKo: '전선다발', emoji: '🪢', tier: 'part', chain: 'copper', unlockedAtStage: 1, isRaw: false },
  { id: 'electric_unit', nameKo: '전기장치', emoji: '🔌', tier: 'final', chain: 'copper', unlockedAtStage: 1, isRaw: false },

  { id: 'iron_ore', nameKo: '철광석', emoji: '⛏️', tier: 'raw', chain: 'iron', unlockedAtStage: 2, isRaw: true },
  { id: 'pig_iron', nameKo: '선철', emoji: '⚙️', tier: 'p1', chain: 'iron', unlockedAtStage: 2, isRaw: false },
  { id: 'steel_plate', nameKo: '강철판', emoji: '⬛', tier: 'p2', chain: 'iron', unlockedAtStage: 2, isRaw: false },
  { id: 'steel_frame', nameKo: '철골프레임', emoji: '🏗️', tier: 'part', chain: 'iron', unlockedAtStage: 2, isRaw: false },
  { id: 'factory_unit', nameKo: '공장설비', emoji: '🏭', tier: 'final', chain: 'iron', unlockedAtStage: 2, isRaw: false },

  { id: 'crude_oil', nameKo: '원유', emoji: '🛢️', tier: 'raw', chain: 'oil', unlockedAtStage: 2, isRaw: true },
  { id: 'naphtha', nameKo: '나프타', emoji: '🧪', tier: 'p1', chain: 'oil', unlockedAtStage: 2, isRaw: false },
  { id: 'polymer', nameKo: '폴리머', emoji: '🧫', tier: 'p2', chain: 'oil', unlockedAtStage: 2, isRaw: false },
  { id: 'plastic', nameKo: '플라스틱소재', emoji: '🥡', tier: 'part', chain: 'oil', unlockedAtStage: 2, isRaw: false },
  { id: 'case', nameKo: '케이스', emoji: '📦', tier: 'final', chain: 'oil', unlockedAtStage: 2, isRaw: false },

  { id: 'bauxite', nameKo: '보크사이트', emoji: '🪨', tier: 'raw', chain: 'aluminum', unlockedAtStage: 2, isRaw: true },
  { id: 'alumina', nameKo: '알루미나', emoji: '⚪', tier: 'p1', chain: 'aluminum', unlockedAtStage: 2, isRaw: false },
  { id: 'aluminum_plate', nameKo: '알루미늄판재', emoji: '🔳', tier: 'p2', chain: 'aluminum', unlockedAtStage: 2, isRaw: false },
  { id: 'light_frame', nameKo: '경량프레임', emoji: '🪶', tier: 'part', chain: 'aluminum', unlockedAtStage: 2, isRaw: false },
  { id: 'aviation_part', nameKo: '항공부품', emoji: '✈️', tier: 'final', chain: 'aluminum', unlockedAtStage: 2, isRaw: false },

  { id: 'quartz', nameKo: '석영', emoji: '💎', tier: 'raw', chain: 'silicon', unlockedAtStage: 4, isRaw: true },
  { id: 'silicon', nameKo: '실리콘', emoji: '🔷', tier: 'p1', chain: 'silicon', unlockedAtStage: 4, isRaw: false },
  { id: 'wafer', nameKo: '웨이퍼', emoji: '📀', tier: 'p2', chain: 'silicon', unlockedAtStage: 4, isRaw: false },
  { id: 'semiconductor', nameKo: '반도체칩', emoji: '🧠', tier: 'part', chain: 'silicon', unlockedAtStage: 4, isRaw: false },
  { id: 'microprocessor', nameKo: '마이크로프로세서', emoji: '💻', tier: 'final', chain: 'silicon', unlockedAtStage: 4, isRaw: false },

  { id: 'lithium_ore', nameKo: '리튬광석', emoji: '🔋', tier: 'raw', chain: 'lithium', unlockedAtStage: 4, isRaw: true },
  { id: 'lithium_compound', nameKo: '리튬화합물', emoji: '🧂', tier: 'p1', chain: 'lithium', unlockedAtStage: 4, isRaw: false },
  { id: 'li_ion_cell', nameKo: '리튬이온셀', emoji: '🔌', tier: 'p2', chain: 'lithium', unlockedAtStage: 4, isRaw: false },
  { id: 'battery_pack', nameKo: '배터리팩', emoji: '🔋', tier: 'part', chain: 'lithium', unlockedAtStage: 4, isRaw: false },
  { id: 'energy_storage', nameKo: '에너지저장장치', emoji: '🔋', tier: 'final', chain: 'lithium', unlockedAtStage: 4, isRaw: false },

  { id: 'gold_ore', nameKo: '금광석', emoji: '🟡', tier: 'raw', chain: 'gold', unlockedAtStage: 4, isRaw: true },
  { id: 'gold_ingot', nameKo: '금괴', emoji: '🪙', tier: 'p1', chain: 'gold', unlockedAtStage: 4, isRaw: false },
  { id: 'gold_wire', nameKo: '금선', emoji: '🧶', tier: 'p2', chain: 'gold', unlockedAtStage: 4, isRaw: false },
  { id: 'precious_connector', nameKo: '귀금속커넥터', emoji: '🔗', tier: 'part', chain: 'gold', unlockedAtStage: 4, isRaw: false },
  { id: 'precision_electronics', nameKo: '정밀전자장치', emoji: '📡', tier: 'final', chain: 'gold', unlockedAtStage: 4, isRaw: false },

  {
    id: 'rare_earth_ore',
    nameKo: '희토류광석',
    emoji: '🧿',
    tier: 'raw',
    chain: 'rare_earth',
    unlockedAtStage: 5,
    isRaw: true,
  },
  {
    id: 'rare_earth_oxide',
    nameKo: '희토류산화물',
    emoji: '🧴',
    tier: 'p1',
    chain: 'rare_earth',
    unlockedAtStage: 5,
    isRaw: false,
  },
  {
    id: 'neodymium_magnet',
    nameKo: '네오디뮴자석',
    emoji: '🧲',
    tier: 'p2',
    chain: 'rare_earth',
    unlockedAtStage: 5,
    isRaw: false,
  },
  { id: 'motor_core', nameKo: '모터코어', emoji: '🛞', tier: 'part', chain: 'rare_earth', unlockedAtStage: 5, isRaw: false },
  { id: 'high_eff_motor', nameKo: '고효율모터', emoji: '⚡', tier: 'final', chain: 'rare_earth', unlockedAtStage: 5, isRaw: false },

  { id: 'uranium_ore', nameKo: '우라늄광석', emoji: '☢️', tier: 'raw', chain: 'uranium', unlockedAtStage: 6, isRaw: true },
  { id: 'yellowcake', nameKo: '옐로케이크', emoji: '🟨', tier: 'p1', chain: 'uranium', unlockedAtStage: 6, isRaw: false },
  {
    id: 'enriched_uranium',
    nameKo: '농축우라늄',
    emoji: '🟩',
    tier: 'p2',
    chain: 'uranium',
    unlockedAtStage: 6,
    isRaw: false,
  },
  { id: 'fuel_rod', nameKo: '핵연료봉', emoji: '🪫', tier: 'part', chain: 'uranium', unlockedAtStage: 6, isRaw: false },
  { id: 'nuclear_module', nameKo: '원자력모듈', emoji: '⚛️', tier: 'final', chain: 'uranium', unlockedAtStage: 6, isRaw: false },

  { id: 'composite_panel', nameKo: '복합소재패널', emoji: '🧱', tier: 'cross', chain: 'cross', unlockedAtStage: 2, isRaw: false },
  { id: 'basic_circuit', nameKo: '기초회로보드', emoji: '🟢', tier: 'cross', chain: 'cross', unlockedAtStage: 4, isRaw: false },
  { id: 'smart_machine', nameKo: '스마트기계', emoji: '🤖', tier: 'cross', chain: 'cross', unlockedAtStage: 3, isRaw: false },
  { id: 'adv_workbench', nameKo: '첨단작업대', emoji: '🛠️', tier: 'cross', chain: 'cross', unlockedAtStage: 3, isRaw: false },
  { id: 'adv_circuit', nameKo: '고급회로보드', emoji: '🟣', tier: 'cross', chain: 'cross', unlockedAtStage: 5, isRaw: false },
  { id: 'ev_unit', nameKo: '전기차유닛', emoji: '🚗', tier: 'cross', chain: 'cross', unlockedAtStage: 5, isRaw: false },
  { id: 'reactor_module', nameKo: '원자로모듈', emoji: '☢️', tier: 'cross', chain: 'cross', unlockedAtStage: 6, isRaw: false },
  { id: 'generator_core', nameKo: '발전기코어', emoji: '🔋', tier: 'cross', chain: 'cross', unlockedAtStage: 6, isRaw: false },
  { id: 'iot_device', nameKo: 'IoT디바이스', emoji: '📱', tier: 'cross', chain: 'cross', unlockedAtStage: 7, isRaw: false },
  { id: 'ai_computing', nameKo: 'AI컴퓨팅유닛', emoji: '🧠', tier: 'cross', chain: 'cross', unlockedAtStage: 7, isRaw: false },
  { id: 'smart_city', nameKo: '스마트시티모듈', emoji: '🏙️', tier: 'cross', chain: 'cross', unlockedAtStage: 8, isRaw: false },
  { id: 'infinite_energy', nameKo: '무한에너지코어', emoji: '♾️', tier: 'cross', chain: 'cross', unlockedAtStage: 8, isRaw: false },

  {
    id: 'small_factory',
    nameKo: '소규모공장',
    emoji: '🏭',
    tier: 'prestige',
    chain: 'prestige',
    unlockedAtStage: 3,
    isRaw: false,
    isPrestigeItem: true,
  },
  {
    id: 'industrial_complex',
    nameKo: '산업단지',
    emoji: '🏢',
    tier: 'prestige',
    chain: 'prestige',
    unlockedAtStage: 5,
    isRaw: false,
    isPrestigeItem: true,
  },
  {
    id: 'future_city',
    nameKo: '미래도시',
    emoji: '🌆',
    tier: 'prestige',
    chain: 'prestige',
    unlockedAtStage: 8,
    isRaw: false,
    isPrestigeItem: true,
  },
] as const satisfies readonly ResourceDefinition[];

export type ResourceId = (typeof RESOURCES)[number]['id'];

export const resourceById: Record<ResourceId, ResourceDefinition> = Object.fromEntries(
  RESOURCES.map((resource) => [resource.id, resource]),
) as Record<ResourceId, ResourceDefinition>;

export const RAW_RESOURCE_IDS = RESOURCES.filter((resource) => resource.isRaw).map(
  (resource) => resource.id,
) as ResourceId[];

export const PRESTIGE_RESOURCE_IDS = RESOURCES.filter(
  (resource) => (resource as ResourceDefinition).isPrestigeItem === true,
).map((resource) => resource.id) as ResourceId[];

export function getResourcesAtStage(stage: number): ResourceDefinition[] {
  return RESOURCES.filter((resource) => resource.unlockedAtStage <= stage);
}
