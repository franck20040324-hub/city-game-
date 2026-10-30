/**
 * 3D Procedural Building Models for MetroGenesis 3D
 * Assembles composite 3-12 part procedural models for every building and landmark.
 * High visual fidelity, low polygon overhead, optimized for Snapdragon 662 / mobile GPUs.
 */

import * as THREE from 'three';
import { StructureType, Season } from '../types/game';

// Shared material cache to minimize draw calls and shader programs
const materials = {
  concrete: new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.85, metalness: 0.1 }),
  darkStone: new THREE.MeshStandardMaterial({ color: 0x424242, roughness: 0.9, metalness: 0.05 }),
  whiteWall: new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.7, metalness: 0.05 }),
  warmBrick: new THREE.MeshStandardMaterial({ color: 0xd9534f, roughness: 0.8, metalness: 0.1 }),
  terracottaRoof: new THREE.MeshStandardMaterial({ color: 0xb23a22, roughness: 0.7, metalness: 0.1 }),
  blueRoof: new THREE.MeshStandardMaterial({ color: 0x2b5b84, roughness: 0.6, metalness: 0.2 }),
  glassDay: new THREE.MeshStandardMaterial({ color: 0x81d4fa, roughness: 0.2, metalness: 0.8 }),
  glassNight: new THREE.MeshStandardMaterial({
    color: 0xffe082,
    roughness: 0.3,
    metalness: 0.2,
    emissive: 0xffb74d,
    emissiveIntensity: 0.8,
  }),
  steel: new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.4, metalness: 0.8 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xffca28, roughness: 0.3, metalness: 0.85 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8, metalness: 0.0 }),
  cropGold: new THREE.MeshStandardMaterial({ color: 0xe9c46a, roughness: 0.9, metalness: 0.0 }),
  cropSoil: new THREE.MeshStandardMaterial({ color: 0x582f0e, roughness: 0.95, metalness: 0.0 }),
  grassField: new THREE.MeshStandardMaterial({ color: 0x588157, roughness: 0.9, metalness: 0.0 }),
  waterSlide: new THREE.MeshStandardMaterial({ color: 0x00b4d8, roughness: 0.3, metalness: 0.3 }),
  asphalt: new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.9, metalness: 0.05 }),
  redPaint: new THREE.MeshStandardMaterial({ color: 0xd62828, roughness: 0.5, metalness: 0.2 }),
  yellowPaint: new THREE.MeshStandardMaterial({ color: 0xfca311, roughness: 0.5, metalness: 0.2 }),
  bluePaint: new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.5, metalness: 0.2 }),
  whitePaint: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.1 }),
};

// Seasonal tree leaf materials
export const foliageMaterials: Record<Season, THREE.MeshStandardMaterial> = {
  spring: new THREE.MeshStandardMaterial({ color: 0xffb7b2, roughness: 0.75, metalness: 0.05 }), // Sakura pink
  summer: new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8, metalness: 0.05 }), // Lush green
  autumn: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8, metalness: 0.05 }), // Golden amber
  winter: new THREE.MeshStandardMaterial({ color: 0x90e0ef, roughness: 0.9, metalness: 0.1 }), // Frosty pine / snow
};

export function updateWindowIllumination(isNight: boolean) {
  materials.glassNight.emissiveIntensity = isNight ? 0.95 : 0.05;
  materials.glassNight.color.setHex(isNight ? 0xffe082 : 0x81d4fa);
}

/**
 * Creates composite 3D models for all structure types
 */
export function createBuildingMesh(type: StructureType, level: number = 1, season: Season = 'summer'): THREE.Group {
  const group = new THREE.Group();
  group.name = `building_${type}`;

  const scaleMultiplier = 1 + (level - 1) * 0.15;

  switch (type) {
    // ==========================================
    // RESIDENTIAL
    // ==========================================
    case 'ground_house': {
      // 1. Plinth / Foundation
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      // 2. Main house walls
      const walls = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), materials.whiteWall);
      walls.position.y = 0.35;
      group.add(walls);

      // 3. Gable roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.35, 4), materials.terracottaRoof);
      roof.position.y = 0.75;
      roof.rotation.y = Math.PI / 4;
      group.add(roof);

      // 4. Chimney
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.08), materials.warmBrick);
      chimney.position.set(0.18, 0.8, 0.1);
      group.add(chimney);

      // 5. Windows (illuminated)
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), materials.glassNight);
      win.position.set(0.15, 0.35, 0.351);
      group.add(win);

      // 6. Door
      const door = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.22), materials.wood);
      door.position.set(-0.15, 0.22, 0.351);
      group.add(door);

      // 7. Garden tree
      const tree = createSmallTree(season);
      tree.position.set(-0.28, 0, -0.25);
      group.add(tree);
      break;
    }

    case 'small_apartment': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, 0.85), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.2, 0.75), materials.warmBrick);
      body.position.y = 0.7;
      group.add(body);

      // Balconies
      for (let i = 0; i < 2; i++) {
        const balcony = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.15), materials.steel);
        balcony.position.set(0, 0.45 + i * 0.4, 0.42);
        group.add(balcony);

        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.25), materials.glassNight);
        win.position.set(0, 0.55 + i * 0.4, 0.38);
        group.add(win);
      }

      // Roof water tank & AC
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8), materials.steel);
      tank.position.set(0.2, 1.4, 0.1);
      group.add(tank);
      break;
    }

    case 'large_apartment': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.9), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      const main = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 0.75), materials.whiteWall);
      main.position.y = 1.1;
      group.add(main);

      // Rows of windows
      for (let floor = 0; floor < 4; floor++) {
        for (let col = -2; col <= 2; col++) {
          const w = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.2), materials.glassNight);
          w.position.set(col * 0.3, 0.4 + floor * 0.42, 0.38);
          group.add(w);
        }
      }

      // Roof utility house
      const roofHouse = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), materials.darkStone);
      roofHouse.position.set(0, 2.2, 0);
      group.add(roofHouse);
      break;
    }

    case 'luxury_apartment': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.12, 1.85), materials.darkStone);
      base.position.y = 0.06;
      group.add(base);

      // Terraced luxury blocks
      const block1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), materials.whiteWall);
      block1.position.y = 0.8;
      group.add(block1);

      const block2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), materials.glassDay);
      block2.position.y = 2.1;
      group.add(block2);

      // Rooftop swimming pool / garden
      const pool = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), materials.waterSlide);
      pool.position.set(0.3, 1.54, 0.3);
      group.add(pool);

      const garden = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), foliageMaterials[season]);
      garden.position.set(-0.3, 1.53, -0.3);
      group.add(garden);

      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.6, 6), materials.steel);
      spire.position.set(0, 2.9, 0);
      group.add(spire);
      break;
    }

    case 'skyscraper': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 1.8), materials.darkStone);
      base.position.y = 0.075;
      group.add(base);

      const tower1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.5, 1.4), materials.glassDay);
      tower1.position.y = 1.4;
      group.add(tower1);

      const tower2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.8, 1.0), materials.glassNight);
      tower2.position.y = 3.4;
      group.add(tower2);

      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 4), materials.steel);
      crown.position.y = 4.7;
      crown.rotation.y = Math.PI / 4;
      group.add(crown);

      const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.8, 4), materials.gold);
      beacon.position.set(0, 5.4, 0);
      group.add(beacon);
      break;
    }

    // ==========================================
    // SERVICES
    // ==========================================
    case 'fire_station': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.85), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      const main = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.7), materials.redPaint);
      main.position.y = 0.5;
      group.add(main);

      // Garage doors
      for (let i = -1; i <= 1; i += 2) {
        const garage = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.45), materials.steel);
        garage.position.set(i * 0.45, 0.3, 0.355);
        group.add(garage);
      }

      // Fire drill tower
      const drillTower = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.4, 0.35), materials.warmBrick);
      drillTower.position.set(-0.55, 0.8, 0);
      group.add(drillTower);

      // Siren beacon
      const siren = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08), materials.redPaint);
      siren.position.set(-0.55, 1.55, 0);
      group.add(siren);
      break;
    }

    case 'hospital': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.8), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      // Cross shaped hospital main building
      const h1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.7), materials.whiteWall);
      h1.position.y = 0.7;
      group.add(h1);

      const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.2, 1.6), materials.whiteWall);
      h2.position.y = 0.7;
      group.add(h2);

      // Red Cross on facade
      const crossV = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.28), materials.redPaint);
      crossV.position.set(0, 0.9, 0.805);
      group.add(crossV);

      const crossH = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.08), materials.redPaint);
      crossH.position.set(0, 0.9, 0.806);
      group.add(crossH);

      // Rooftop Helipad
      const helipad = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16), materials.darkStone);
      helipad.position.set(0, 1.33, 0);
      group.add(helipad);
      break;
    }

    case 'police_station': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      const main = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.9, 0.75), materials.bluePaint);
      main.position.y = 0.55;
      group.add(main);

      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.05), materials.gold);
      badge.position.set(0, 0.7, 0.4);
      group.add(badge);

      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.02, 0.5), materials.steel);
      antenna.position.set(0.2, 1.2, 0.2);
      group.add(antenna);
      break;
    }

    case 'school': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.9), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.7), materials.warmBrick);
      wing.position.y = 0.45;
      group.add(wing);

      // Central clock tower
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.35), materials.whiteWall);
      tower.position.set(0, 0.7, 0);
      group.add(tower);

      const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), materials.gold);
      clockFace.position.set(0, 1.05, 0.18);
      group.add(clockFace);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.3, 4), materials.blueRoof);
      roof.position.y = 1.45;
      roof.rotation.y = Math.PI / 4;
      group.add(roof);
      break;
    }

    case 'prison': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.1, 1.85), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      // High security perimeter wall
      const wallMat = materials.darkStone;
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.1), wallMat);
      b1.position.set(0, 0.3, 0.75);
      group.add(b1);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.1), wallMat);
      b2.position.set(0, 0.3, -0.75);
      group.add(b2);

      // Cell block
      const cellBlock = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.0), materials.concrete);
      cellBlock.position.y = 0.5;
      group.add(cellBlock);

      // Watchtowers on corners
      const watchTower = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.0, 8), materials.steel);
      watchTower.position.set(0.75, 0.55, 0.75);
      group.add(watchTower);
      break;
    }

    // ==========================================
    // COMMERCIAL & LEISURE
    // ==========================================
    case 'restaurant': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      const building = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.6), materials.warmBrick);
      building.position.set(0, 0.4, -0.05);
      group.add(building);

      // Striped Awning
      const awning = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.25), materials.redPaint);
      awning.position.set(0, 0.45, 0.32);
      awning.rotation.x = 0.2;
      group.add(awning);

      // Patio table & umbrella
      const umbrella = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.1, 8), materials.yellowPaint);
      umbrella.position.set(0.2, 0.35, 0.3);
      group.add(umbrella);
      break;
    }

    case 'shop': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      const store = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.7, 0.75), materials.whiteWall);
      store.position.y = 0.45;
      group.add(store);

      const glassFront = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.4), materials.glassDay);
      glassFront.position.set(0, 0.32, 0.38);
      group.add(glassFront);

      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.05), materials.bluePaint);
      sign.position.set(0, 0.65, 0.4);
      group.add(sign);
      break;
    }

    case 'employment_office': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.9), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      const main = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 0.7), materials.concrete);
      main.position.y = 0.55;
      group.add(main);

      // Columns
      for (let i = -2; i <= 2; i++) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), materials.whiteWall);
        col.position.set(i * 0.28, 0.5, 0.38);
        group.add(col);
      }

      const pediment = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.25, 4), materials.whiteWall);
      pediment.position.set(0, 1.05, 0.35);
      pediment.rotation.y = Math.PI / 4;
      group.add(pediment);
      break;
    }

    case 'corporate_tower': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.8), materials.darkStone);
      base.position.y = 0.06;
      group.add(base);

      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.8, 3.2, 12), materials.glassDay);
      tower.position.y = 1.7;
      group.add(tower);

      const topCrown = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 8, 16), materials.gold);
      topCrown.position.y = 3.3;
      topCrown.rotation.x = Math.PI / 2;
      group.add(topCrown);
      break;
    }

    case 'admin_palace': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.15, 1.8), materials.whiteWall);
      base.position.y = 0.075;
      group.add(base);

      const palace = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.4), materials.whiteWall);
      palace.position.y = 0.75;
      group.add(palace);

      // Grand Golden Dome
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), materials.gold);
      dome.position.set(0, 1.35, 0);
      group.add(dome);

      // Courtyard Fountain
      const fountain = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 12), materials.waterSlide);
      fountain.position.set(0, 0.18, 0.65);
      group.add(fountain);
      break;
    }

    case 'land_amusement': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 2.8), materials.grassField);
      base.position.y = 0.05;
      group.add(base);

      // Ferris Wheel (animated rotation in TrafficSystem)
      const wheelHub = new THREE.Group();
      wheelHub.name = 'ferris_wheel_rotor';
      wheelHub.position.set(0, 1.3, 0);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.04, 8, 24), materials.steel);
      wheelHub.add(rim);

      for (let s = 0; s < 8; s++) {
        const angle = (s * Math.PI) / 4;
        const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.0), materials.steel);
        spoke.rotation.z = angle;
        wheelHub.add(spoke);

        // Gondolas
        const gondola = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.14), materials.yellowPaint);
        gondola.position.set(Math.cos(angle) * 1.0, Math.sin(angle) * 1.0, 0);
        wheelHub.add(gondola);
      }
      group.add(wheelHub);

      // Ferris Wheel Support A-Frames
      const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5), materials.steel);
      leg1.position.set(-0.35, 0.65, 0.2);
      leg1.rotation.z = 0.25;
      group.add(leg1);
      const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5), materials.steel);
      leg2.position.set(0.35, 0.65, 0.2);
      leg2.rotation.z = -0.25;
      group.add(leg2);
      break;
    }

    case 'water_amusement': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 2.8), materials.grassField);
      base.position.y = 0.05;
      group.add(base);

      // Pool Lagoon
      const pool = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.5), materials.waterSlide);
      pool.position.set(0, 0.1, -0.2);
      group.add(pool);

      // Tower for slide
      const slideTower = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.6), materials.whiteWall);
      slideTower.position.set(-0.9, 0.95, 0.7);
      group.add(slideTower);

      // Giant Spiral Slide (Torus spiral proxy)
      const slide1 = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.1, 8, 16, Math.PI * 1.5), materials.redPaint);
      slide1.position.set(-0.4, 1.1, 0.3);
      slide1.rotation.x = Math.PI / 2.3;
      group.add(slide1);

      const slide2 = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.1, 8, 16, Math.PI * 1.4), materials.yellowPaint);
      slide2.position.set(0.1, 0.6, 0.1);
      slide2.rotation.x = Math.PI / 2.2;
      group.add(slide2);
      break;
    }

    // ==========================================
    // INDUSTRIAL FACTORIES
    // ==========================================
    case 'factory_food': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.9), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      const warehouse = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.75), materials.whiteWall);
      warehouse.position.set(-0.25, 0.45, 0);
      group.add(warehouse);

      // Grain Silos
      for (let s = 0; s < 2; s++) {
        const silo = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.1, 12), materials.steel);
        silo.position.set(0.55 + s * 0.22, 0.6, 0);
        group.add(silo);
      }
      break;
    }

    case 'factory_clothing': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.9), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      // Sawtooth industrial roof
      const building = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.7), materials.warmBrick);
      building.position.y = 0.45;
      group.add(building);

      for (let r = -2; r <= 2; r++) {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.2, 3), materials.steel);
        tooth.position.set(r * 0.28, 0.9, 0);
        tooth.rotation.z = 0.4;
        group.add(tooth);
      }
      break;
    }

    case 'factory_equipment': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.8), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      const shop = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.3), materials.steel);
      shop.position.set(-0.1, 0.55, 0);
      group.add(shop);

      // Heavy Gantry Crane
      const gantry = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), materials.yellowPaint);
      gantry.position.set(0.7, 0.8, 0.5);
      group.add(gantry);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), materials.yellowPaint);
      arm.position.set(0.4, 1.5, 0.5);
      group.add(arm);
      break;
    }

    case 'factory_transport': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.8), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      // Hangar arch
      const hangar = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.5, 12, 1, false, 0, Math.PI), materials.steel);
      hangar.position.set(0, 0.75, 0);
      hangar.rotation.z = Math.PI / 2;
      group.add(hangar);

      const runwayMat = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.8), materials.asphalt);
      runwayMat.position.set(0, 0.11, 0.5);
      runwayMat.rotation.x = -Math.PI / 2;
      group.add(runwayMat);
      break;
    }

    case 'factory_medicine': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.8), materials.whiteWall);
      base.position.y = 0.05;
      group.add(base);

      const lab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.4), materials.glassDay);
      lab.position.y = 0.65;
      group.add(lab);

      // High-tech cooling dome
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), materials.steel);
      sphere.position.set(0.3, 1.4, 0.3);
      group.add(sphere);
      break;
    }

    case 'factory_recycling': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.8), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      // Sorting bins
      const bin1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.5), materials.redPaint);
      bin1.position.set(-0.5, 0.25, 0.4);
      group.add(bin1);

      const bin2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.5), materials.yellowPaint);
      bin2.position.set(0, 0.25, 0.4);
      group.add(bin2);

      const bin3 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.5), materials.bluePaint);
      bin3.position.set(0.5, 0.25, 0.4);
      group.add(bin3);

      // Smokestack with exhaust
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.6, 10), materials.warmBrick);
      stack.position.set(0.4, 0.85, -0.4);
      group.add(stack);
      break;
    }

    // ==========================================
    // STATIONS & TRANSPORT INFRASTRUCTURE
    // ==========================================
    case 'fuel_station': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.85), materials.asphalt);
      base.position.y = 0.05;
      group.add(base);

      // Gas canopy
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.65), materials.yellowPaint);
      canopy.position.set(-0.2, 0.7, 0);
      group.add(canopy);

      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65), materials.steel);
      p1.position.set(-0.6, 0.35, 0.2);
      group.add(p1);
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65), materials.steel);
      p2.position.set(0.2, 0.35, 0.2);
      group.add(p2);

      // Fuel Pumps
      const pump = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.12), materials.redPaint);
      pump.position.set(-0.2, 0.2, 0);
      group.add(pump);

      // Mini Mart
      const mart = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), materials.whiteWall);
      mart.position.set(0.6, 0.3, 0);
      group.add(mart);
      break;
    }

    case 'toll_booth': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.85), materials.asphalt);
      base.position.y = 0.04;
      group.add(base);

      // Toll Gantry spanning lanes
      const gantry = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.25), materials.yellowPaint);
      gantry.position.set(0, 0.8, 0);
      group.add(gantry);

      // Toll payment cabins
      for (let i = -1; i <= 1; i++) {
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.25), materials.glassDay);
        cabin.position.set(i * 0.5, 0.3, 0);
        group.add(cabin);

        // Barrier arm
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 0.03), materials.redPaint);
        arm.position.set(i * 0.5 + 0.18, 0.25, 0.15);
        arm.rotation.z = 0.4;
        group.add(arm);
      }
      break;
    }

    case 'bus_station': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.85), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      const shelter = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.4), materials.glassDay);
      shelter.position.set(0, 0.55, -0.15);
      group.add(shelter);

      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.12), materials.wood);
      bench.position.set(0, 0.15, -0.15);
      group.add(bench);

      const busSign = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03), materials.yellowPaint);
      busSign.position.set(-0.6, 0.45, 0.2);
      busSign.rotation.x = Math.PI / 2;
      group.add(busSign);
      break;
    }

    case 'tram_station': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.85), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      // Center tram rails
      const r1 = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.02, 0.04), materials.steel);
      r1.position.set(0, 0.11, 0.15);
      group.add(r1);
      const r2 = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.02, 0.04), materials.steel);
      r2.position.set(0, 0.11, -0.15);
      group.add(r2);

      // Overhead catenary mast
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.9), materials.steel);
      pole.position.set(0, 0.5, 0.35);
      group.add(pole);
      break;
    }

    case 'taxi_station': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), materials.asphalt);
      base.position.y = 0.05;
      group.add(base);

      const booth = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), materials.yellowPaint);
      booth.position.set(-0.2, 0.28, -0.2);
      group.add(booth);

      const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.06), materials.darkStone);
      taxiSign.position.set(-0.2, 0.55, -0.2);
      group.add(taxiSign);
      break;
    }

    case 'train_station': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 1.8), materials.concrete);
      base.position.y = 0.06;
      group.add(base);

      // Concourse hall
      const hall = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.9), materials.warmBrick);
      hall.position.set(0, 0.65, -0.35);
      group.add(hall);

      // Glass arched platform roof
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.4, 12, 1, false, 0, Math.PI), materials.glassDay);
      roof.position.set(0, 0.6, 0.35);
      roof.rotation.z = Math.PI / 2;
      group.add(roof);

      // Clock
      const clock = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), materials.gold);
      clock.position.set(0, 0.9, 0.11);
      group.add(clock);
      break;
    }

    case 'metro_station': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.85), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      // Subway entrance stairs well
      const well = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.5), materials.darkStone);
      well.position.set(0, 0.2, 0);
      group.add(well);

      // Curved canopy
      const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 8, 1, false, 0, Math.PI), materials.glassDay);
      canopy.position.set(0, 0.45, 0);
      canopy.rotation.z = Math.PI / 2;
      group.add(canopy);

      // Metro M Totem
      const totem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04), materials.redPaint);
      totem.position.set(0.6, 0.5, 0.2);
      totem.rotation.x = Math.PI / 2;
      group.add(totem);
      break;
    }

    case 'airport': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.15, 2.8), materials.concrete);
      base.position.y = 0.075;
      group.add(base);

      // Terminal building with glass concourse
      const terminal = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.0), materials.whiteWall);
      terminal.position.set(-0.4, 0.5, -0.6);
      group.add(terminal);

      // Aerobridge
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.8), materials.steel);
      bridge.position.set(0.4, 0.4, 0);
      group.add(bridge);

      // Air Traffic Control Tower
      const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 2.2, 8), materials.concrete);
      towerBase.position.set(1.4, 1.2, -0.6);
      group.add(towerBase);

      const radome = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.4, 12), materials.glassDay);
      radome.position.set(1.4, 2.4, -0.6);
      group.add(radome);

      // Runway strip
      const runway = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.8), materials.asphalt);
      runway.position.set(0, 0.16, 0.8);
      runway.rotation.x = -Math.PI / 2;
      group.add(runway);
      break;
    }

    // ==========================================
    // WATER INFRASTRUCTURE
    // ==========================================
    case 'water_tower': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, 0.85), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      // 4 metal legs
      for (let x of [-0.25, 0.25]) {
        for (let z of [-0.25, 0.25]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.4), materials.steel);
          leg.position.set(x, 0.75, z);
          group.add(leg);
        }
      }

      // Spherical tank
      const sphereTank = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), materials.waterSlide);
      sphereTank.position.set(0, 1.6, 0);
      group.add(sphereTank);
      break;
    }

    case 'water_pump': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.85), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      const house = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.6), materials.whiteWall);
      house.position.y = 0.4;
      group.add(house);

      // Intake pipe
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8), materials.steel);
      pipe.position.set(0.65, 0.2, 0);
      pipe.rotation.z = Math.PI / 2;
      group.add(pipe);
      break;
    }

    case 'water_treatment': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.8), materials.concrete);
      base.position.y = 0.05;
      group.add(base);

      // Circular clarifier pool
      const pool = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.25, 16), materials.waterSlide);
      pool.position.set(-0.1, 0.2, -0.1);
      group.add(pool);

      // Rotating sweeper arm
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.04), materials.steel);
      arm.position.set(-0.1, 0.35, -0.1);
      group.add(arm);
      break;
    }

    // ==========================================
    // AGRICULTURE & NATURE
    // ==========================================
    case 'farm_crops': {
      const field = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.06, 1.85), materials.cropSoil);
      field.position.y = 0.03;
      group.add(field);

      // Furrows of golden wheat
      for (let row = -3; row <= 3; row++) {
        const cropRow = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 0.12), materials.cropGold);
        cropRow.position.set(0, 0.12, row * 0.24);
        group.add(cropRow);
      }

      // Little barn shed
      const shed = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.35), materials.redPaint);
      shed.position.set(0.6, 0.22, 0.6);
      group.add(shed);
      break;
    }

    case 'pasture_animals': {
      const grass = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.06, 1.85), materials.grassField);
      grass.position.y = 0.03;
      group.add(grass);

      // Fence around perimeter
      for (let s of [-0.85, 0.85]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.03), materials.wood);
        rail.position.set(0, 0.12, s);
        group.add(rail);
      }

      // Sheep (fluffy white box + black head)
      const sheep = new THREE.Group();
      const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.14), materials.whiteWall);
      sBody.position.y = 0.12;
      sheep.add(sBody);
      const sHead = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), materials.darkStone);
      sHead.position.set(0.11, 0.15, 0);
      sheep.add(sHead);
      sheep.position.set(-0.3, 0.05, -0.2);
      group.add(sheep);

      // Cow (spotted black & white)
      const cow = new THREE.Group();
      const cBody = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.16), materials.whiteWall);
      cBody.position.y = 0.16;
      cow.add(cBody);
      const cHead = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), materials.darkStone);
      cHead.position.set(0.18, 0.2, 0);
      cow.add(cHead);
      cow.position.set(0.3, 0.05, 0.2);
      group.add(cow);
      break;
    }

    case 'forest_park': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.85), materials.grassField);
      base.position.y = 0.03;
      group.add(base);

      // Cluster of 3 seasonal trees
      const positions = [
        [-0.15, 0, -0.15],
        [0.2, 0, 0.1],
        [-0.1, 0, 0.22],
      ];
      positions.forEach(([tx, ty, tz]) => {
        const tree = createSmallTree(season);
        tree.position.set(tx, ty, tz);
        group.add(tree);
      });
      break;
    }

    // ==========================================
    // WORLD LANDMARKS (GEMS)
    // ==========================================
    case 'landmark_eiffel': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 2.8), materials.darkStone);
      base.position.y = 0.06;
      group.add(base);

      // 4 Inward Leaning Arch Legs
      for (let x of [-0.65, 0.65]) {
        for (let z of [-0.65, 0.65]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.2, 0.22), materials.steel);
          leg.position.set(x, 0.65, z);
          leg.rotation.x = z > 0 ? -0.25 : 0.25;
          leg.rotation.z = x > 0 ? -0.25 : 0.25;
          group.add(leg);
        }
      }

      // First Platform
      const plat1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.2), materials.steel);
      plat1.position.y = 1.25;
      group.add(plat1);

      // Middle Taper
      const mid = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.6, 4), materials.steel);
      mid.position.y = 2.1;
      mid.rotation.y = Math.PI / 4;
      group.add(mid);

      // Second Platform
      const plat2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), materials.gold);
      plat2.position.y = 2.95;
      group.add(plat2);

      // Upper Spire & Beacon
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.12, 1.8, 8), materials.steel);
      spire.position.y = 3.9;
      group.add(spire);

      const beaconLight = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), materials.gold);
      beaconLight.position.y = 4.85;
      group.add(beaconLight);
      break;
    }

    case 'landmark_burj': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.15, 2.8), materials.darkStone);
      base.position.y = 0.075;
      group.add(base);

      // Tiered hexagonal / cylinder shafts soaring high
      const tiers = [
        { r: 0.9, h: 1.5, y: 0.8 },
        { r: 0.7, h: 1.5, y: 2.3 },
        { r: 0.5, h: 1.4, y: 3.7 },
        { r: 0.35, h: 1.2, y: 5.0 },
        { r: 0.2, h: 1.0, y: 6.1 },
      ];

      tiers.forEach((t) => {
        const tier = new THREE.Mesh(new THREE.CylinderGeometry(t.r * 0.85, t.r, t.h, 6), materials.glassDay);
        tier.position.y = t.y;
        group.add(tier);
      });

      // Ultra spire needle
      const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.12, 1.8, 6), materials.steel);
      needle.position.y = 7.5;
      group.add(needle);
      break;
    }

    case 'landmark_bigben': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.12, 1.85), materials.darkStone);
      base.position.y = 0.06;
      group.add(base);

      // Stone Shaft
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.2, 0.9), materials.warmBrick);
      tower.position.y = 1.65;
      group.add(tower);

      // Belfry & 4 Golden Clock Faces
      const belfry = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 1.0), materials.concrete);
      belfry.position.y = 3.55;
      group.add(belfry);

      for (let rot of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
        const dial = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), materials.gold);
        dial.rotation.y = rot;
        dial.position.set(Math.sin(rot) * 0.51, 3.55, Math.cos(rot) * 0.51);
        group.add(dial);
      }

      // Peaked Spire
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.4, 4), materials.blueRoof);
      spire.position.y = 4.55;
      spire.rotation.y = Math.PI / 4;
      group.add(spire);
      break;
    }

    case 'landmark_pyramid': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.1, 2.85), materials.darkStone);
      base.position.y = 0.05;
      group.add(base);

      // Stepped Pyramid body
      const pyr = new THREE.Mesh(new THREE.ConeGeometry(1.7, 2.2, 4), materials.cropGold);
      pyr.position.y = 1.15;
      pyr.rotation.y = Math.PI / 4;
      group.add(pyr);

      // Golden Apex Capstone
      const apex = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.5, 4), materials.gold);
      apex.position.y = 2.2;
      apex.rotation.y = Math.PI / 4;
      group.add(apex);
      break;
    }

    case 'landmark_opera': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.15, 1.8), materials.darkStone);
      base.position.y = 0.075;
      group.add(base);

      // Arched Shell roofs
      for (let i = 0; i < 3; i++) {
        const shell = new THREE.Mesh(new THREE.SphereGeometry(0.5 + i * 0.15, 16, 12, 0, Math.PI, 0, Math.PI / 2), materials.whitePaint);
        shell.position.set(-0.7 + i * 0.65, 0.15, 0);
        shell.rotation.z = -0.3;
        group.add(shell);
      }
      break;
    }

    case 'landmark_colosseum': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 2.8), materials.darkStone);
      base.position.y = 0.05;
      group.add(base);

      // Outer Oval Tier
      const outerRing = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.9, 20, 1, true), materials.concrete);
      outerRing.position.y = 0.5;
      group.add(outerRing);

      const innerArena = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16), materials.cropSoil);
      innerArena.position.y = 0.25;
      group.add(innerArena);
      break;
    }

    case 'landmark_empire': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.12, 1.85), materials.darkStone);
      base.position.y = 0.06;
      group.add(base);

      // Stepped Art Deco tiers
      const t1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.8, 1.5), materials.concrete);
      t1.position.y = 0.95;
      group.add(t1);

      const t2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.8, 1.1), materials.concrete);
      t2.position.y = 2.75;
      group.add(t2);

      const t3 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.2, 0.7), materials.concrete);
      t3.position.y = 4.25;
      group.add(t3);

      // Mooring Mast & Antenna
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 1.2, 8), materials.steel);
      mast.position.y = 5.45;
      group.add(mast);

      const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.8), materials.gold);
      needle.position.y = 6.45;
      group.add(needle);
      break;
    }

    default: {
      const fallback = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), materials.whiteWall);
      fallback.position.y = 0.4;
      group.add(fallback);
      break;
    }
  }

  // Apply subtle scale multiplier for upgraded buildings
  if (scaleMultiplier !== 1) {
    group.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);
  }

  return group;
}

/**
 * Creates procedural tree with seasonal foliage
 */
export function createSmallTree(season: Season): THREE.Group {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.35, 6), materials.wood);
  trunk.position.y = 0.175;
  tree.add(trunk);

  const foliageMat = foliageMaterials[season] || foliageMaterials.summer;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.55, 6), foliageMat);
  crown.position.y = 0.55;
  tree.add(crown);

  return tree;
}
