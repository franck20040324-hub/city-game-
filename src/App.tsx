/**
 * MetroGenesis 3D - Main Application
 * 3D City-Building Simulation with Animated Infrastructure,
 * Day/Night Cycle, Seasons, Living Traffic, Terraforming, and Local Audio.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from './state/gameStore';
import { CityScene } from './engine/CityScene';
import { TopBar } from './components/HUD/TopBar';
import { BottomDock } from './components/HUD/BottomDock';
import { ActiveToolBanner } from './components/HUD/ActiveToolBanner';
import { Toast } from './components/HUD/Toast';
import { BuildModal } from './components/Modals/BuildModal';
import { TerraformModal } from './components/Modals/TerraformModal';
import { MissionsModal } from './components/Modals/MissionsModal';
import { CitizenEventsModal } from './components/Modals/CitizenEventsModal';
import { MusicPlayerModal } from './components/Modals/MusicPlayerModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { BuildingDetailModal } from './components/Modals/BuildingDetailModal';
import { BuildingCategory, StructureType } from './types/game';
import { saveGameState, FullGameState } from './storage/db';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CityScene | null>(null);

  const {
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
  } = useGameStore();

  // Modal dialog states
  const [activeModal, setActiveModal] = useState<
    'build' | 'roads' | 'terraform' | 'missions' | 'citizens' | 'music' | 'settings' | null
  >(null);
  const [buildCategory, setBuildCategory] = useState<BuildingCategory>('residential');

  // 1. Initialize 3D CityScene once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const scene = new CityScene(canvasMountRef.current, settings.graphicsQuality);
    sceneRef.current = scene;

    scene.buildTerrainGrid(tiles);
    scene.renderStructures(structures, season);
    scene.updateSeason(season);
    scene.updateDayNightCycle(dayTime, settings.brightness);

    // Click handler for 3D tiles
    scene.onTileClick = (gridX: number, gridZ: number) => {
      if (activeToolRef.current) {
        const tool = activeToolRef.current;
        if (tool.mode === 'build') {
          placeBuildingAtTile(gridX, gridZ, tool.structureType);
        } else if (tool.mode === 'terraform') {
          terraformTile(gridX, gridZ, tool.terraformType);
        } else if (tool.mode === 'demolish') {
          const struct = structuresRef.current.find((s) => s.x === gridX && s.z === gridZ);
          if (struct) {
            refundAndDemolishStructure(struct.instanceId);
          }
        }
      }
    };

    // Click handler for 3D structures
    scene.onStructureClick = (instanceId: string) => {
      if (activeToolRef.current?.mode === 'demolish') {
        refundAndDemolishStructure(instanceId);
      } else {
        setSelectedStructureId(instanceId);
      }
    };

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Sync latest references for stable Three.js scene event callbacks
  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;
  const structuresRef = useRef(structures);
  structuresRef.current = structures;

  // 2. Sync tiles when modified (e.g. terraforming)
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.buildTerrainGrid(tiles);
    }
  }, [tiles]);

  // 3. Sync structures and seasons
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.renderStructures(structures, season);
    }
  }, [structures, season]);

  // 4. Sync Season
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateSeason(season);
    }
  }, [season]);

  // 5. Sync Day/Night cycle
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateDayNightCycle(dayTime, settings.brightness);
    }
  }, [dayTime, settings.brightness]);

  // 6. Sync Graphics Quality
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setQuality(settings.graphicsQuality);
    }
  }, [settings.graphicsQuality]);

  // Navigation handlers from Bottom Dock
  const handleSelectTab = (tab: string) => {
    if (tab === 'build') {
      setBuildCategory('residential');
      setActiveModal('build');
    } else if (tab === 'roads') {
      setBuildCategory('transport');
      setActiveModal('build');
    } else if (tab === 'terraform') {
      setActiveModal('terraform');
    } else if (tab === 'missions') {
      setActiveModal('missions');
    } else if (tab === 'citizens') {
      setActiveModal('citizens');
    } else if (tab === 'music') {
      setActiveModal('music');
    } else if (tab === 'settings') {
      setActiveModal('settings');
    }
  };

  const handleManualSave = () => {
    const fullState: FullGameState = {
      version: 1,
      savedAt: Date.now(),
      stats,
      tiles,
      structures,
      missions,
      citizenEvents,
      settings,
      season,
      dayTime,
    };
    saveGameState(fullState);
  };

  const selectedStructure = structures.find((s) => s.instanceId === selectedStructureId) || null;

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none"
      dir={settings.language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Isolated Three.js WebGL Canvas Mount Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD: Economy, XP, Storage, Season, Taxes */}
      <TopBar
        stats={stats}
        settings={settings}
        season={season}
        dayTime={dayTime}
        taxAvailable={taxAvailable}
        onCollectTaxes={collectTaxes}
        onOpenSettings={() => setActiveModal('settings')}
      />

      {/* Active Tool Banner (Build, Terraform, Demolish mode) */}
      <ActiveToolBanner
        tool={activeTool}
        settings={settings}
        onCancel={() => setActiveTool(null)}
      />

      {/* Floating Notification Toast */}
      <Toast message={toastMessage} />

      {/* Sleek Collapsible Bottom Dock (Zero center-screen occlusion) */}
      <BottomDock
        settings={settings}
        activeTab={activeModal}
        onSelectTab={handleSelectTab}
        onEnterDemolishMode={() => {
          setActiveTool({ mode: 'demolish' });
          setActiveModal(null);
        }}
        onEnterTerraformMode={(tType) => {
          setActiveTool({ mode: 'terraform', terraformType: tType });
          setActiveModal(null);
        }}
      />

      {/* Modals & Dialogs */}
      <BuildModal
        isOpen={activeModal === 'build'}
        onClose={() => setActiveModal(null)}
        settings={settings}
        userLevel={stats.level}
        userCoins={stats.coins}
        userGems={stats.gems}
        defaultCategory={buildCategory}
        onSelectStructure={(sType) => {
          setActiveTool({ mode: 'build', structureType: sType });
          setActiveModal(null);
        }}
      />

      <TerraformModal
        isOpen={activeModal === 'terraform'}
        onClose={() => setActiveModal(null)}
        settings={settings}
        onSelectTerraform={(tType) => {
          setActiveTool({ mode: 'terraform', terraformType: tType });
          setActiveModal(null);
        }}
      />

      <MissionsModal
        isOpen={activeModal === 'missions'}
        onClose={() => setActiveModal(null)}
        settings={settings}
        missions={missions}
        onClaimReward={claimMissionReward}
      />

      <CitizenEventsModal
        isOpen={activeModal === 'citizens'}
        onClose={() => setActiveModal(null)}
        settings={settings}
        events={citizenEvents}
        onResolveEvent={resolveCitizenEvent}
      />

      <MusicPlayerModal
        isOpen={activeModal === 'music'}
        onClose={() => setActiveModal(null)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <SettingsModal
        isOpen={activeModal === 'settings'}
        onClose={() => setActiveModal(null)}
        settings={settings}
        onUpdateSettings={setSettings}
        onManualSave={handleManualSave}
        onResetCity={resetCity}
      />

      <BuildingDetailModal
        structure={selectedStructure}
        settings={settings}
        userCoins={stats.coins}
        userGems={stats.gems}
        onClose={() => setSelectedStructureId(null)}
        onUpgrade={upgradeStructure}
        onSpeedup={instantFinishConstruction}
        onRefundDemolish={refundAndDemolishStructure}
      />
    </div>
  );
}
