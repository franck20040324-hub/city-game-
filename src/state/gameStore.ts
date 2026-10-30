/**
 * MetroGenesis 3D - Central Game State Store
 * Manages player progression, level XP, taxes, terraforming,
 * refund/bulldoze, missions, citizen events, auto-saving, and auto-resume.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CityStats,
  GridTile,
  PlacedStructure,
  Mission,
  CitizenEvent,
  GameSettings,
  Season,
  StructureType,
  BuildingDef,
} from '../types/game';
import {
  BUILDING_DEFINITIONS,
  INITIAL_MISSIONS,
  INITIAL_CITIZEN_EVENTS,
  CITY_STORAGE_MAX,
} from '../constants/gameData';
import { saveGameState, loadGameState, FullGameState } from '../storage/db';
import { AudioEngine } from '../audio/AudioEngine';

const MAP_SIZE = 22;

export function createDefaultMap(): GridTile[] {
  const tiles: GridTile[] = [];
  for (let x = -Math.floor(MAP_SIZE / 2); x <= Math.floor(MAP_SIZE / 2); x++) {
    for (let z = -Math.floor(MAP_SIZE / 2); z <= Math.floor(MAP_SIZE / 2); z++) {
      // Natural organic river passing through x = -4 to -2
      const isRiver = Math.sin(z * 0.35) * 1.5 - 3.5 === Math.round(x);
      tiles.push({
        x,
        z,
        terrain: isRiver ? 'water' : 'land',
        elevation: isRiver ? 0 : 1,
      });
    }
  }
  return tiles;
}

export function createDefaultStructures(): PlacedStructure[] {
  const now = Date.now();
  const list: PlacedStructure[] = [];

  // 1. Outside Highway running along x = -8 with on/off ramps
  for (let z = -9; z <= 9; z++) {
    list.push({
      instanceId: `hw_${z}`,
      type: 'highway',
      x: -8,
      z,
      level: 1,
      rotation: 0,
      status: 'active',
      constructionStartedAt: now,
      constructionDurationSec: 0,
      originalCostCoins: 300,
      originalCostGems: 0,
      lastTaxCollectedAt: now,
    });
  }

  // Toll booth on highway
  list.push({
    instanceId: 'toll_hw_1',
    type: 'toll_booth',
    x: -8,
    z: 2,
    level: 1,
    rotation: 0,
    status: 'active',
    constructionStartedAt: now,
    constructionDurationSec: 0,
    originalCostCoins: 2600,
    originalCostGems: 0,
    lastTaxCollectedAt: now,
  });

  // Highway Fuel station
  list.push({
    instanceId: 'fuel_hw_1',
    type: 'fuel_station',
    x: -7,
    z: -3,
    level: 1,
    rotation: 90,
    status: 'active',
    constructionStartedAt: now,
    constructionDurationSec: 0,
    originalCostCoins: 1400,
    originalCostGems: 0,
    lastTaxCollectedAt: now,
  });

  // 2. City Road Grid
  for (let x = -5; x <= 5; x++) {
    list.push({
      instanceId: `rd_main_${x}`,
      type: 'road_4lane',
      x,
      z: 0,
      level: 1,
      rotation: 90,
      status: 'active',
      constructionStartedAt: now,
      constructionDurationSec: 0,
      originalCostCoins: 120,
      originalCostGems: 0,
      lastTaxCollectedAt: now,
    });
  }

  for (let z = -4; z <= 4; z++) {
    if (z === 0) continue;
    list.push({
      instanceId: `rd_cross_${z}`,
      type: 'road_2way',
      x: 0,
      z,
      level: 1,
      rotation: 0,
      status: 'active',
      constructionStartedAt: now,
      constructionDurationSec: 0,
      originalCostCoins: 50,
      originalCostGems: 0,
      lastTaxCollectedAt: now,
    });
  }

  // 3. Initial cozy town starters
  list.push({
    instanceId: 'house_init_1',
    type: 'ground_house',
    x: 2,
    z: 2,
    level: 1,
    rotation: 0,
    status: 'active',
    constructionStartedAt: now,
    constructionDurationSec: 0,
    originalCostCoins: 350,
    originalCostGems: 0,
    lastTaxCollectedAt: now,
  });

  list.push({
    instanceId: 'house_init_2',
    type: 'ground_house',
    x: 3,
    z: 2,
    level: 1,
    rotation: 0,
    status: 'active',
    constructionStartedAt: now,
    constructionDurationSec: 0,
    originalCostCoins: 350,
    originalCostGems: 0,
    lastTaxCollectedAt: now,
  });

  list.push({
    instanceId: 'apt_init_1',
    type: 'small_apartment',
    x: 2,
    z: -2,
    level: 1,
    rotation: 180,
    status: 'active',
    constructionStartedAt: now,
    constructionDurationSec: 0,
    originalCostCoins: 900,
    originalCostGems: 0,
    lastTaxCollectedAt: now,
  });

  list.push({
    instanceId: 'shop_init_1',
    type: 'shop',
    x: -2,
    z: 2,
    level: 1,
    rotation: 0,
    status: 'active',
    constructionStartedAt: now,
    constructionDurationSec: 0,
    originalCostCoins: 1600,
    originalCostGems: 0,
    lastTaxCollectedAt: now,
  });

  // Transit & Agricultural starter
  list.push({
    instanceId: 'bus_init_1',
    type: 'bus_station',
    x: -2,
    z: -2,
    level: 1,
    rotation: 180,
    status: 'active',
    constructionStartedAt: now,
    constructionDurationSec: 0,
    originalCostCoins: 1800,
    originalCostGems: 0,
    lastTaxCollectedAt: now,
  });

  list.push({
    instanceId: 'farm_init_1',
    type: 'farm_crops',
    x: 5,
    z: -3,
    level: 1,
    rotation: 0,
    status: 'active',
    constructionStartedAt: now,
    constructionDurationSec: 0,
    originalCostCoins: 600,
    originalCostGems: 0,
    lastTaxCollectedAt: now,
  });

  list.push({
    instanceId: 'pasture_init_1',
    type: 'pasture_animals',
    x: 5,
    z: 3,
    level: 1,
    rotation: 0,
    status: 'active',
    constructionStartedAt: now,
    constructionDurationSec: 0,
    originalCostCoins: 850,
    originalCostGems: 0,
    lastTaxCollectedAt: now,
  });

  return list;
}

export function useGameStore() {
  const [stats, setStats] = useState<CityStats>({
    level: 1,
    xp: 0,
    xpToNextLevel: 300,
    coins: 10000, // Generous starting balance
    gems: 50,
    population: 36,
    happiness: 90,
    storageCapacity: CITY_STORAGE_MAX, // 999,999
    storageUsed: 120,
  });

  const [tiles, setTiles] = useState<GridTile[]>(createDefaultMap);
  const [structures, setStructures] = useState<PlacedStructure[]>(createDefaultStructures);
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [citizenEvents, setCitizenEvents] = useState<CitizenEvent[]>(INITIAL_CITIZEN_EVENTS);

  const [season, setSeason] = useState<Season>('spring');
  const [dayTime, setDayTime] = useState<number>(10.0); // 10:00 AM

  const [settings, setSettings] = useState<GameSettings>({
    language: 'en',
    soundFxVolume: 0.8,
    musicVolume: 0.6,
    brightness: 1.0,
    graphicsQuality: 'balanced',
    dayNightSpeed: 1,
    autoTaxCollection: false,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<
    | { mode: 'build'; structureType: StructureType }
    | { mode: 'terraform'; terraformType: 'lower' | 'raise' }
    | { mode: 'demolish' }
    | null
  >(null);

  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [taxAvailable, setTaxAvailable] = useState<number>(350);

  // Reference for stable autosave loop
  const stateRef = useRef({ stats, tiles, structures, missions, citizenEvents, settings, season, dayTime });
  stateRef.current = { stats, tiles, structures, missions, citizenEvents, settings, season, dayTime };

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  // --- AUTOMATIC RESUME ON PHONE/BROWSER BOOT ---
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const saved = await loadGameState();
      if (saved && isMounted) {
        setStats(saved.stats);
        if (saved.tiles && saved.tiles.length > 0) setTiles(saved.tiles);
        if (saved.structures) setStructures(saved.structures);
        if (saved.missions) setMissions(saved.missions);
        if (saved.citizenEvents) setCitizenEvents(saved.citizenEvents);
        if (saved.settings) setSettings(saved.settings);
        if (saved.season) setSeason(saved.season);
        if (saved.dayTime !== undefined) setDayTime(saved.dayTime);

        AudioEngine.setVolumes(saved.settings.soundFxVolume, saved.settings.musicVolume);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // --- AUTOMATIC SAVING EVERY 4 SECONDS ---
  useEffect(() => {
    const timer = setInterval(() => {
      const cur = stateRef.current;
      const fullState: FullGameState = {
        version: 1,
        savedAt: Date.now(),
        stats: cur.stats,
        tiles: cur.tiles,
        structures: cur.structures,
        missions: cur.missions,
        citizenEvents: cur.citizenEvents,
        settings: cur.settings,
        season: cur.season,
        dayTime: cur.dayTime,
      };
      saveGameState(fullState);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // --- DAY / NIGHT & SEASON TIMER TICKER ---
  useEffect(() => {
    const ticker = setInterval(() => {
      // Day/Night progression
      if (settings.dayNightSpeed > 0) {
        const speed = settings.dayNightSpeed === 2 ? 0.08 : 0.035;
        setDayTime((prev) => (prev + speed) % 24.0);
      }

      // Check ongoing building construction
      const now = Date.now();
      let hasCompleted = false;

      setStructures((prev) =>
        prev.map((s) => {
          if (s.status === 'constructing' || s.status === 'upgrading') {
            const elapsedSec = (now - s.constructionStartedAt) / 1000;
            if (elapsedSec >= s.constructionDurationSec) {
              hasCompleted = true;
              return { ...s, status: 'active' };
            }
          }
          return s;
        })
      );

      if (hasCompleted) {
        AudioEngine.playPlaceSound();
      }

      // Accumulate tax revenues
      setTaxAvailable((prev) => {
        let rate = 15;
        structures.forEach((st) => {
          const def = BUILDING_DEFINITIONS[st.type];
          if (def && st.status === 'active') {
            rate += Math.round(def.taxIncomeRate * 0.15 * st.level);
          }
        });
        return prev + rate;
      });

      // If auto tax collection is turned on
      if (settings.autoTaxCollection) {
        setTaxAvailable((currTax) => {
          if (currTax > 50) {
            setStats((s) => ({ ...s, coins: s.coins + currTax }));
            return 0;
          }
          return currTax;
        });
      }
    }, 1500);

    return () => clearInterval(ticker);
  }, [settings.dayNightSpeed, settings.autoTaxCollection, structures]);

  // --- SEASONS TICKER (every 90s cycles Spring -> Summer -> Autumn -> Winter) ---
  useEffect(() => {
    const seasonTimer = setInterval(() => {
      setSeason((prev) => {
        if (prev === 'spring') return 'summer';
        if (prev === 'summer') return 'autumn';
        if (prev === 'autumn') return 'winter';
        return 'spring';
      });
    }, 90000);
    return () => clearInterval(seasonTimer);
  }, []);

  // --- RECALCULATE POPULATION ---
  useEffect(() => {
    let pop = 0;
    structures.forEach((st) => {
      const def = BUILDING_DEFINITIONS[st.type];
      if (def && st.status === 'active') {
        pop += def.populationBonus * st.level;
      }
    });
    setStats((prev) => ({ ...prev, population: Math.max(pop, 10) }));
  }, [structures]);

  // --- PROGRESSION & XP SYSTEM ---
  const addXP = useCallback((amount: number) => {
    setStats((prev) => {
      let newXP = prev.xp + amount;
      let newLevel = prev.level;
      let newXPReq = prev.xpToNextLevel;
      let bonusCoins = 0;
      let bonusGems = 0;

      while (newXP >= newXPReq) {
        newXP -= newXPReq;
        newLevel += 1;
        newXPReq = Math.round(newXPReq * 1.45);
        bonusCoins += newLevel * 500;
        bonusGems += 5;
      }

      if (newLevel > prev.level) {
        AudioEngine.playLevelUpSound();
        showToast(`LEVEL UP! Welcome to Level ${newLevel}! +${bonusCoins} Coins & +${bonusGems} Gems`);
      }

      return {
        ...prev,
        level: newLevel,
        xp: newXP,
        xpToNextLevel: newXPReq,
        coins: prev.coins + bonusCoins,
        gems: prev.gems + bonusGems,
      };
    });
  }, [showToast]);

  // --- TAX COLLECTION ACTION ---
  const collectTaxes = useCallback(() => {
    if (taxAvailable <= 0) return;
    const collected = taxAvailable;
    setTaxAvailable(0);
    setStats((prev) => ({ ...prev, coins: prev.coins + collected }));
    AudioEngine.playCoinSound();
    addXP(Math.round(collected * 0.1));

    // Progress mission
    setMissions((prev) =>
      prev.map((m) => {
        if (m.actionType === 'collect_tax' && !m.completed) {
          const next = m.currentCount + 1;
          return { ...m, currentCount: next, completed: next >= m.targetCount };
        }
        return m;
      })
    );
  }, [taxAvailable, addXP]);

  // --- BUILDING & ROAD CONSTRUCTION ---
  const placeBuildingAtTile = useCallback(
    (tileX: number, tileZ: number, type: StructureType): boolean => {
      const def = BUILDING_DEFINITIONS[type];
      if (!def) return false;

      // Check costs
      if (stats.coins < def.costCoins || stats.gems < def.costGems) {
        showToast('Not enough coins or gems!');
        return false;
      }

      // Check if tile is occupied
      const existing = structures.find(
        (s) => Math.abs(s.x - tileX) < def.dimensions.width && Math.abs(s.z - tileZ) < def.dimensions.depth
      );
      if (existing) {
        showToast('This tile is already occupied!');
        return false;
      }

      // Deduct resources
      setStats((prev) => ({
        ...prev,
        coins: prev.coins - def.costCoins,
        gems: prev.gems - def.costGems,
      }));

      // Create new placed structure
      const newStruct: PlacedStructure = {
        instanceId: `bld_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type,
        x: tileX,
        z: tileZ,
        level: 1,
        rotation: 0,
        status: def.constructionTimeSec > 5 ? 'constructing' : 'active',
        constructionStartedAt: Date.now(),
        constructionDurationSec: def.constructionTimeSec,
        originalCostCoins: def.costCoins,
        originalCostGems: def.costGems,
        lastTaxCollectedAt: Date.now(),
      };

      setStructures((prev) => [...prev, newStruct]);
      AudioEngine.playPlaceSound();
      addXP(def.xpReward);

      // Track mission progress
      setMissions((prev) =>
        prev.map((m) => {
          if (m.actionType === 'build' && !m.completed) {
            const next = m.currentCount + 1;
            return { ...m, currentCount: next, completed: next >= m.targetCount };
          }
          return m;
        })
      );

      return true;
    },
    [stats.coins, stats.gems, structures, addXP, showToast]
  );

  // --- TERRAFORMING (Lower Ground to make Water, Raise Ground to make Land) ---
  const terraformTile = useCallback(
    (tileX: number, tileZ: number, mode: 'lower' | 'raise') => {
      // Cannot terraform tile with an active building
      const hasStructure = structures.some((s) => s.x === tileX && s.z === tileZ);
      if (hasStructure) {
        showToast('Demolish or refund the structure on this tile first!');
        return;
      }

      const cost = 80;
      if (stats.coins < cost) {
        showToast('Not enough coins for terraforming!');
        return;
      }

      setStats((s) => ({ ...s, coins: s.coins - cost }));
      AudioEngine.playWaterSplashSound();
      addXP(25);

      setTiles((prev) =>
        prev.map((t) => {
          if (t.x === tileX && t.z === tileZ) {
            return {
              ...t,
              terrain: mode === 'lower' ? 'water' : 'land',
              elevation: mode === 'lower' ? 0 : 1,
            };
          }
          return t;
        })
      );

      // Progress mission
      setMissions((prev) =>
        prev.map((m) => {
          if (m.actionType === 'terraform' && !m.completed) {
            const next = m.currentCount + 1;
            return { ...m, currentCount: next, completed: next >= m.targetCount };
          }
          return m;
        })
      );
    },
    [structures, stats.coins, addXP, showToast]
  );

  // --- REFUND & BULLDOZE / CANCEL PURCHASE (100% REFUND) ---
  const refundAndDemolishStructure = useCallback(
    (instanceId: string) => {
      const struct = structures.find((s) => s.instanceId === instanceId);
      if (!struct) return;

      // 100% money refund recovered!
      const refundCoins = struct.originalCostCoins;
      const refundGems = struct.originalCostGems;

      setStats((prev) => ({
        ...prev,
        coins: prev.coins + refundCoins,
        gems: prev.gems + refundGems,
      }));

      setStructures((prev) => prev.filter((s) => s.instanceId !== instanceId));
      AudioEngine.playDemolishSound();
      showToast(`Refunded +${refundCoins} Coins${refundGems > 0 ? ` and +${refundGems} Gems` : ''}!`);

      if (selectedStructureId === instanceId) {
        setSelectedStructureId(null);
      }
    },
    [structures, selectedStructureId, showToast]
  );

  // --- UPGRADE BUILDING ---
  const upgradeStructure = useCallback(
    (instanceId: string) => {
      const struct = structures.find((s) => s.instanceId === instanceId);
      if (!struct) return;

      const def = BUILDING_DEFINITIONS[struct.type];
      if (!def || !def.canUpgrade || struct.level >= def.maxLevel) return;

      const upgradeCost = Math.round(def.costCoins * def.upgradeCostMultiplier * struct.level * 0.7);
      if (stats.coins < upgradeCost) {
        showToast('Not enough coins to upgrade!');
        return;
      }

      setStats((s) => ({ ...s, coins: s.coins - upgradeCost }));
      AudioEngine.playPlaceSound();
      addXP(Math.round(def.xpReward * 0.8));

      setStructures((prev) =>
        prev.map((s) => {
          if (s.instanceId === instanceId) {
            return {
              ...s,
              level: s.level + 1,
              status: 'upgrading',
              constructionStartedAt: Date.now(),
              constructionDurationSec: 35, // Quick upgrade timer
            };
          }
          return s;
        })
      );

      // Track mission
      setMissions((prev) =>
        prev.map((m) => {
          if (m.actionType === 'upgrade' && !m.completed) {
            const next = m.currentCount + 1;
            return { ...m, currentCount: next, completed: next >= m.targetCount };
          }
          return m;
        })
      );
    },
    [structures, stats.coins, addXP, showToast]
  );

  // --- INSTANT SPEEDUP WITH GEMS ---
  const instantFinishConstruction = useCallback(
    (instanceId: string) => {
      const gemCost = 2;
      if (stats.gems < gemCost) {
        showToast('Need 2 gems to speed up!');
        return;
      }

      setStats((s) => ({ ...s, gems: s.gems - gemCost }));
      AudioEngine.playPlaceSound();

      setStructures((prev) =>
        prev.map((s) => {
          if (s.instanceId === instanceId) {
            return { ...s, status: 'active' };
          }
          return s;
        })
      );
    },
    [stats.gems, showToast]
  );

  // --- CLAIM MISSION REWARD ---
  const claimMissionReward = useCallback(
    (missionId: string) => {
      const m = missions.find((item) => item.id === missionId);
      if (!m || !m.completed || m.claimed) return;

      setStats((s) => ({
        ...s,
        coins: s.coins + m.rewardCoins,
        gems: s.gems + m.rewardGems,
      }));

      AudioEngine.playCoinSound();
      addXP(m.rewardXP);

      setMissions((prev) =>
        prev.map((item) => (item.id === missionId ? { ...item, claimed: true } : item))
      );
      showToast(`Claimed +${m.rewardCoins} Coins & +${m.rewardGems} Gems!`);
    },
    [missions, addXP, showToast]
  );

  // --- RESOLVE CITIZEN EVENT ---
  const resolveCitizenEvent = useCallback(
    (eventId: string, choiceId: string) => {
      const ev = citizenEvents.find((e) => e.id === eventId);
      if (!ev) return;

      const choice = ev.choices.find((c) => c.id === choiceId);
      if (!choice) return;

      if (choice.coinCost && stats.coins < choice.coinCost) {
        showToast('Not enough coins for this citizen project!');
        return;
      }

      setStats((s) => ({
        ...s,
        coins: s.coins - (choice.coinCost || 0) + (choice.rewardCoins || 0),
        gems: s.gems + (choice.rewardGems || 0),
        happiness: Math.min(100, s.happiness + choice.happinessImpact),
      }));

      AudioEngine.playCoinSound();
      addXP(choice.rewardXP);

      setCitizenEvents((prev) => prev.filter((e) => e.id !== eventId));
      showToast('Citizen event resolved! Your residents are thrilled.');
    },
    [citizenEvents, stats.coins, addXP, showToast]
  );

  // --- RESET CITY ---
  const resetCity = useCallback(() => {
    setStats({
      level: 1,
      xp: 0,
      xpToNextLevel: 300,
      coins: 10000,
      gems: 50,
      population: 36,
      happiness: 90,
      storageCapacity: CITY_STORAGE_MAX,
      storageUsed: 120,
    });
    setTiles(createDefaultMap());
    setStructures(createDefaultStructures());
    setMissions(INITIAL_MISSIONS);
    setCitizenEvents(INITIAL_CITIZEN_EVENTS);
    setSelectedStructureId(null);
    showToast('Started fresh new city!');
  }, [showToast]);

  return {
    stats,
    tiles,
    structures,
    missions,
    citizenEvents,
    season,
    dayTime,
    settings,
    setSettings,
    toastMessage,
    activeTool,
    setActiveTool,
    selectedStructureId,
    setSelectedStructureId,
    taxAvailable,
    collectTaxes,
    placeBuildingAtTile,
    terraformTile,
    refundAndDemolishStructure,
    upgradeStructure,
    instantFinishConstruction,
    claimMissionReward,
    resolveCitizenEvent,
    resetCity,
    setSeason,
    setDayTime,
  };
}
