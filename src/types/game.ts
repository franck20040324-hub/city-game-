export type Language = 'en' | 'ar';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type BuildingCategory =
  | 'residential'
  | 'commercial'
  | 'services'
  | 'industrial'
  | 'transport'
  | 'water_infra'
  | 'agriculture'
  | 'landmarks';

export type RoadType = 'road_2way' | 'road_4lane' | 'highway';

export type StructureType =
  // Residential
  | 'ground_house'
  | 'small_apartment'
  | 'large_apartment'
  | 'luxury_apartment'
  | 'skyscraper'
  // Services
  | 'fire_station'
  | 'hospital'
  | 'police_station'
  | 'school'
  | 'prison'
  // Commercial & Leisure
  | 'restaurant'
  | 'shop'
  | 'employment_office'
  | 'corporate_tower'
  | 'admin_palace'
  | 'land_amusement'
  | 'water_amusement'
  // Factories
  | 'factory_food'
  | 'factory_clothing'
  | 'factory_equipment'
  | 'factory_transport'
  | 'factory_medicine'
  | 'factory_recycling'
  // Transport & Roads
  | 'road_2way'
  | 'road_4lane'
  | 'highway'
  | 'fuel_station'
  | 'toll_booth'
  | 'bus_station'
  | 'train_station'
  | 'tram_station'
  | 'taxi_station'
  | 'metro_station'
  | 'airport'
  // Water Infrastructure
  | 'water_tower'
  | 'water_pump'
  | 'water_treatment'
  // Agriculture & Nature
  | 'farm_crops'
  | 'pasture_animals'
  | 'forest_park'
  // Famous Landmarks (Gems)
  | 'landmark_eiffel'
  | 'landmark_burj'
  | 'landmark_bigben'
  | 'landmark_pyramid'
  | 'landmark_opera'
  | 'landmark_colosseum'
  | 'landmark_empire';

export interface BuildingDef {
  id: StructureType;
  category: BuildingCategory;
  nameKey: string;
  descKey: string;
  costCoins: number;
  costGems: number;
  xpReward: number;
  constructionTimeSec: number; // 30s to 300s
  taxIncomeRate: number; // coins per tax cycle (every 30s)
  populationBonus: number;
  unlockedLevel: number;
  canUpgrade: boolean;
  maxLevel: number;
  upgradeCostMultiplier: number;
  dimensions: { width: number; depth: number }; // In grid tiles
  color: string;
  isRoad?: boolean;
}

export interface PlacedStructure {
  instanceId: string;
  type: StructureType;
  x: number;
  z: number;
  level: number; // 1 to 5
  rotation: number; // 0, 90, 180, 270 in degrees
  status: 'constructing' | 'upgrading' | 'active';
  constructionStartedAt: number;
  constructionDurationSec: number;
  originalCostCoins: number;
  originalCostGems: number;
  customName?: string;
  lastTaxCollectedAt: number;
}

export type TileTerrain = 'land' | 'water';

export interface GridTile {
  x: number;
  z: number;
  terrain: TileTerrain;
  elevation: number; // 0 for water, 1 for ground level
  structureId?: string; // links to PlacedStructure instanceId
  treeVariant?: number; // 0-3 for seasonal trees on grass
}

export interface Mission {
  id: string;
  type: 'daily' | 'weekly';
  titleKey: string;
  descKey: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  claimed: boolean;
  rewardCoins: number;
  rewardGems: number;
  rewardXP: number;
  actionType: 'build' | 'collect_tax' | 'terraform' | 'upgrade' | 'play_music';
}

export interface CitizenEvent {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
  choices: {
    id: string;
    textKey: string;
    coinCost?: number;
    gemCost?: number;
    rewardCoins?: number;
    rewardGems?: number;
    rewardXP: number;
    happinessImpact: number;
  }[];
  active: boolean;
  expiresAt: number;
}

export interface CustomTrack {
  id: string;
  title: string;
  artist: string;
  durationSec?: number;
  addedAt: number;
  dataBlob?: Blob; // Stored in IndexedDB
}

export interface GameSettings {
  language: Language;
  soundFxVolume: number; // 0 to 1
  musicVolume: number; // 0 to 1
  brightness: number; // 0.6 to 1.4
  graphicsQuality: 'low' | 'balanced' | 'high';
  dayNightSpeed: number; // 1 = normal (approx 3 min full cycle), 0 = paused, 2 = fast
  autoTaxCollection: boolean;
}

export interface Vehicle {
  id: string;
  type: 'car' | 'truck' | 'taxi' | 'bus' | 'police' | 'ambulance' | 'fire' | 'tram' | 'train' | 'airplane' | 'airship' | 'ship';
  position: [number, number, number];
  rotation: number;
  speed: number;
  lane: 'left' | 'right' | 'emergency' | 'air' | 'water' | 'rail';
  color: string;
  progress: number;
  pathId: string;
}

export interface CityStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  gems: number;
  population: number;
  happiness: number; // 0 to 100%
  storageCapacity: number; // 999,999 by default
  storageUsed: number;
}
