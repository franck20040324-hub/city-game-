/**
 * Road Network & Transit Infrastructure 3D Rendering
 * Handles 2-way roads, dual 4-lane avenues, 3-lane expressways with emergency shoulders,
 * and working traffic light fixtures.
 */

import * as THREE from 'three';
import { RoadType, Season } from '../types/game';
import { createSmallTree } from './BuildingModels';

const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.9, metalness: 0.05 });
const highwayAsphalt = new THREE.MeshStandardMaterial({ color: 0x1f2427, roughness: 0.85, metalness: 0.08 });
const emergencyLaneMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.9, metalness: 0.05 });
const curbMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, roughness: 0.8, metalness: 0.1 });
const lineWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.1 });
const lineYellow = new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.5, metalness: 0.1 });
const guardrailMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, roughness: 0.3, metalness: 0.7 });

export function createRoadMesh(type: RoadType, season: Season = 'summer'): THREE.Group {
  const group = new THREE.Group();
  group.name = `road_${type}`;

  switch (type) {
    case 'road_2way': {
      // Base road slab
      const road = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 1.0), asphaltMat);
      road.position.y = 0.02;
      group.add(road);

      // Curbs on left and right
      const curbL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 1.0), curbMat);
      curbL.position.set(-0.46, 0.03, 0);
      group.add(curbL);

      const curbR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 1.0), curbMat);
      curbR.position.set(0.46, 0.03, 0);
      group.add(curbR);

      // Dashed white center line
      for (let z of [-0.3, 0.0, 0.3]) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.2), lineWhite);
        stripe.position.set(0, 0.042, z);
        stripe.rotation.x = -Math.PI / 2;
        group.add(stripe);
      }

      // Roadside tree decorating edge
      const roadsideTree = createSmallTree(season);
      roadsideTree.scale.set(0.65, 0.65, 0.65);
      roadsideTree.position.set(0.44, 0, 0.3);
      group.add(roadsideTree);
      break;
    }

    case 'road_4lane': {
      // 4-lane avenue (2 lanes going, 2 returning)
      const road = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 1.0), asphaltMat);
      road.position.y = 0.02;
      group.add(road);

      // Curbs
      const curbL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.0), curbMat);
      curbL.position.set(-0.47, 0.03, 0);
      group.add(curbL);
      const curbR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.0), curbMat);
      curbR.position.set(0.47, 0.03, 0);
      group.add(curbR);

      // Double yellow divider in center
      const yellowL = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 1.0), lineYellow);
      yellowL.position.set(-0.02, 0.042, 0);
      yellowL.rotation.x = -Math.PI / 2;
      group.add(yellowL);

      const yellowR = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 1.0), lineYellow);
      yellowR.position.set(0.02, 0.042, 0);
      yellowR.rotation.x = -Math.PI / 2;
      group.add(yellowR);

      // White lane dividing dashes
      for (let z of [-0.3, 0.0, 0.3]) {
        const stripeL = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.18), lineWhite);
        stripeL.position.set(-0.24, 0.042, z);
        stripeL.rotation.x = -Math.PI / 2;
        group.add(stripeL);

        const stripeR = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.18), lineWhite);
        stripeR.position.set(0.24, 0.042, z);
        stripeR.rotation.x = -Math.PI / 2;
        group.add(stripeR);
      }
      break;
    }

    case 'highway': {
      // 3 Lanes going, 3 lanes returning + emergency shoulder lanes!
      const road = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 1.0), highwayAsphalt);
      road.position.y = 0.025;
      group.add(road);

      // Emergency lanes on both outer margins (textured differently with red/white hash)
      const emergL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.051, 1.0), emergencyLaneMat);
      emergL.position.set(-0.43, 0.026, 0);
      group.add(emergL);

      const emergR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.051, 1.0), emergencyLaneMat);
      emergR.position.set(0.43, 0.026, 0);
      group.add(emergR);

      // Center concrete barrier / guardrail
      const divider = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 1.0), guardrailMat);
      divider.position.set(0, 0.08, 0);
      group.add(divider);

      // Solid yellow shoulder demarcations
      const shLineL = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 1.0), lineYellow);
      shLineL.position.set(-0.36, 0.053, 0);
      shLineL.rotation.x = -Math.PI / 2;
      group.add(shLineL);

      const shLineR = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 1.0), lineYellow);
      shLineR.position.set(0.36, 0.053, 0);
      shLineR.rotation.x = -Math.PI / 2;
      group.add(shLineR);

      // Dashed lane lines for the 3 lanes
      for (let z of [-0.3, 0.0, 0.3]) {
        [-0.24, -0.12, 0.12, 0.24].forEach((xPos) => {
          const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.16), lineWhite);
          dash.position.set(xPos, 0.053, z);
          dash.rotation.x = -Math.PI / 2;
          group.add(dash);
        });
      }
      break;
    }
  }

  return group;
}

/**
 * Creates 3D Traffic Light fixture with state control
 */
export function createTrafficLight(): { group: THREE.Group; setState: (state: 'red' | 'yellow' | 'green') => void } {
  const group = new THREE.Group();
  group.name = 'traffic_light';

  // Metal pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.8, 8), guardrailMat);
  pole.position.y = 0.4;
  group.add(pole);

  // Arm extending over road
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.03, 0.03), guardrailMat);
  arm.position.set(0.12, 0.78, 0);
  group.add(arm);

  // Black signal housing
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.06), curbMat);
  box.position.set(0.24, 0.72, 0);
  group.add(box);

  // Red, Yellow, Green bulbs
  const redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.0 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0x443300, emissive: 0x443300, emissiveIntensity: 0.1 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x003300, emissive: 0x003300, emissiveIntensity: 0.1 });

  const redBulb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), redMat);
  redBulb.position.set(0.24, 0.78, 0.032);
  group.add(redBulb);

  const yellowBulb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), yellowMat);
  yellowBulb.position.set(0.24, 0.72, 0.032);
  group.add(yellowBulb);

  const greenBulb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), greenMat);
  greenBulb.position.set(0.24, 0.66, 0.032);
  group.add(greenBulb);

  const setState = (state: 'red' | 'yellow' | 'green') => {
    redMat.emissiveIntensity = state === 'red' ? 1.0 : 0.05;
    redMat.color.setHex(state === 'red' ? 0xff0000 : 0x440000);

    yellowMat.emissiveIntensity = state === 'yellow' ? 1.0 : 0.05;
    yellowMat.color.setHex(state === 'yellow' ? 0xffbb00 : 0x332200);

    greenMat.emissiveIntensity = state === 'green' ? 1.0 : 0.05;
    greenMat.color.setHex(state === 'green' ? 0x00ff44 : 0x003311);
  };

  return { group, setState };
}
