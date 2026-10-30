/**
 * Animated Traffic & Living Infrastructure System
 * Simulates:
 * - High-flying airplanes & airships (zeppelins) in the sky
 * - Cruise & cargo ships sailing in water channels
 * - Highway vehicles where TRUCKS STRICTLY STAY IN THE RIGHTMOST LANE!
 * - City buses, trams, passenger trains, yellow taxis, tourist cars
 * - Police, ambulance, and fire trucks with flashing emergency beacons
 * - Traffic light cycle enforcement
 */

import * as THREE from 'three';
import { Season } from '../types/game';

interface SimVehicle {
  mesh: THREE.Group;
  type: 'airplane' | 'airship' | 'ship' | 'truck' | 'car' | 'taxi' | 'bus' | 'tram' | 'train' | 'police' | 'ambulance' | 'fire';
  x: number;
  y: number;
  z: number;
  speed: number;
  heading: number; // in radians
  laneOffset: number;
  isHighway: boolean;
  beaconLight?: THREE.PointLight;
  beaconTime?: number;
}

export class TrafficSystem {
  public scene: THREE.Scene;
  private vehicles: SimVehicle[] = [];
  private trafficLightState: 'red' | 'yellow' | 'green' = 'green';
  private trafficLightTimer: number = 0;
  public onTrafficLightChange?: (state: 'red' | 'yellow' | 'green') => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.spawnInitialFleet();
  }

  private spawnInitialFleet() {
    // 1. Sky: Airplanes & Airship
    this.spawnAirplane();
    this.spawnAirplane();
    this.spawnAirship();

    // 2. Water: Cargo barge & yacht
    this.spawnShip(-12, -4);
    this.spawnShip(-12, 6);

    // 3. Highway traffic (Trucks in right lane, fast cars in center/left)
    for (let i = 0; i < 4; i++) {
      this.spawnHighwayTruck(-14 + i * 7);
    }
    for (let i = 0; i < 5; i++) {
      this.spawnHighwayCar(-15 + i * 6);
    }

    // 4. Urban transit: Buses, trams, trains, taxis, emergency
    this.spawnCityBus(0, 0);
    this.spawnCityTram(0, 2);
    this.spawnCityTrain(0, -6);
    this.spawnPoliceCar(2, 0);
    this.spawnAmbulance(-3, 0);
    this.spawnFireTruck(1, 4);

    for (let i = 0; i < 6; i++) {
      this.spawnCityCar(-6 + i * 2.5, 0);
    }
  }

  // --- VEHICLE SPAWNERS ---

  private spawnAirplane() {
    const group = new THREE.Group();
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.2 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x0077b6, roughness: 0.4, metalness: 0.2 });

    // Fuselage
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.8, 10), whiteMat);
    body.rotation.z = Math.PI / 2;
    group.add(body);

    // Wings
    const wings = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 2.2), blueMat);
    wings.position.set(0.1, 0, 0);
    group.add(wings);

    // Tail fin
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.04), blueMat);
    fin.position.set(-0.7, 0.25, 0);
    group.add(fin);

    const startX = (Math.random() - 0.5) * 30;
    const startZ = (Math.random() - 0.5) * 30;
    const plane: SimVehicle = {
      mesh: group,
      type: 'airplane',
      x: startX,
      y: 9.5 + Math.random() * 2,
      z: startZ,
      speed: 0.12 + Math.random() * 0.04,
      heading: Math.random() * Math.PI * 2,
      laneOffset: 0,
      isHighway: false,
    };

    group.position.set(plane.x, plane.y, plane.z);
    this.scene.add(group);
    this.vehicles.push(plane);
  }

  private spawnAirship() {
    const group = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.5, metalness: 0.2 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.7, metalness: 0.1 });

    // Zeppelin Hull
    const hull = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 10), goldMat);
    hull.scale.set(2.8, 1.0, 1.0);
    group.add(hull);

    // Gondola passenger cabin
    const gondola = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.3), darkMat);
    gondola.position.set(0, -0.65, 0);
    group.add(gondola);

    const zeppelin: SimVehicle = {
      mesh: group,
      type: 'airship',
      x: 10,
      y: 8.0,
      z: -8,
      speed: 0.03,
      heading: -Math.PI / 3,
      laneOffset: 0,
      isHighway: false,
    };

    group.position.set(zeppelin.x, zeppelin.y, zeppelin.z);
    this.scene.add(group);
    this.vehicles.push(zeppelin);
  }

  private spawnShip(x: number, z: number) {
    const group = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x3a5a40, roughness: 0.7, metalness: 0.2 });
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xf5ebe0, roughness: 0.6, metalness: 0.1 });

    // Hull
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.6), hullMat);
    hull.position.y = 0.08;
    group.add(hull);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.45), cabinMat);
    cabin.position.set(-0.35, 0.32, 0);
    group.add(cabin);

    // Cargo containers
    const cargo1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.35), new THREE.MeshStandardMaterial({ color: 0xd62828 }));
    cargo1.position.set(0.25, 0.28, 0);
    group.add(cargo1);

    const ship: SimVehicle = {
      mesh: group,
      type: 'ship',
      x,
      y: 0.05,
      z,
      speed: 0.02,
      heading: 0,
      laneOffset: 0,
      isHighway: false,
    };

    group.position.set(ship.x, ship.y, ship.z);
    this.scene.add(group);
    this.vehicles.push(ship);
  }

  /**
   * Highway Truck: Strictly confined to rightmost lane (laneOffset = 0.32)
   */
  private spawnHighwayTruck(z: number) {
    const group = new THREE.Group();
    const cabMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.6, metalness: 0.2 });
    const cargoMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, metalness: 0.1 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.1 });

    // Cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.26), cabMat);
    cab.position.set(0.32, 0.22, 0);
    group.add(cab);

    // Cargo Container
    const container = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.38, 0.26), cargoMat);
    container.position.set(-0.25, 0.26, 0);
    group.add(container);

    // Wheels
    for (let xPos of [-0.45, -0.1, 0.3]) {
      for (let zPos of [-0.14, 0.14]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8), wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(xPos, 0.06, zPos);
        group.add(wheel);
      }
    }

    // Rightmost lane on highway (e.g. x = -8 + 0.32)
    const truck: SimVehicle = {
      mesh: group,
      type: 'truck',
      x: -8 + 0.32, // Strictly lane 1 (right lane)!
      y: 0.04,
      z,
      speed: 0.045,
      heading: -Math.PI / 2, // Heading along Z
      laneOffset: 0.32,
      isHighway: true,
    };

    group.position.set(truck.x, truck.y, truck.z);
    group.rotation.y = truck.heading;
    this.scene.add(group);
    this.vehicles.push(truck);
  }

  private spawnHighwayCar(z: number) {
    const group = new THREE.Group();
    const colors = [0x0077b6, 0xffb703, 0x2b9348, 0xffffff, 0x333333];
    const carMat = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      roughness: 0.5,
      metalness: 0.3,
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.24), carMat);
    body.position.set(0, 0.12, 0);
    group.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.2), new THREE.MeshStandardMaterial({ color: 0x81d4fa }));
    cabin.position.set(-0.02, 0.25, 0);
    group.add(cabin);

    // Middle or Left lane (laneOffset = 0.14 or -0.1)
    const laneOffset = Math.random() > 0.5 ? 0.14 : -0.1;

    const car: SimVehicle = {
      mesh: group,
      type: 'car',
      x: -8 + laneOffset,
      y: 0.04,
      z,
      speed: 0.075 + Math.random() * 0.02,
      heading: -Math.PI / 2,
      laneOffset,
      isHighway: true,
    };

    group.position.set(car.x, car.y, car.z);
    group.rotation.y = car.heading;
    this.scene.add(group);
    this.vehicles.push(car);
  }

  private spawnCityBus(x: number, z: number) {
    const group = new THREE.Group();
    const busMat = new THREE.MeshStandardMaterial({ color: 0x2a9d8f, roughness: 0.6, metalness: 0.1 });
    const winMat = new THREE.MeshStandardMaterial({ color: 0x81d4fa, roughness: 0.3, metalness: 0.5 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.3, 0.26), busMat);
    body.position.y = 0.2;
    group.add(body);

    const winBand = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.265), winMat);
    winBand.position.y = 0.24;
    group.add(winBand);

    const bus: SimVehicle = {
      mesh: group,
      type: 'bus',
      x,
      y: 0.04,
      z,
      speed: 0.04,
      heading: 0,
      laneOffset: 0.18,
      isHighway: false,
    };
    group.position.set(x, 0.04, z);
    this.scene.add(group);
    this.vehicles.push(bus);
  }

  private spawnCityTram(x: number, z: number) {
    const group = new THREE.Group();
    const tramMat = new THREE.MeshStandardMaterial({ color: 0x0077b6, roughness: 0.5, metalness: 0.2 });

    const car1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 0.24), tramMat);
    car1.position.set(-0.35, 0.18, 0);
    group.add(car1);

    const car2 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 0.24), tramMat);
    car2.position.set(0.35, 0.18, 0);
    group.add(car2);

    const tram: SimVehicle = {
      mesh: group,
      type: 'tram',
      x,
      y: 0.04,
      z,
      speed: 0.045,
      heading: Math.PI / 2,
      laneOffset: 0,
      isHighway: false,
    };
    group.position.set(x, 0.04, z);
    this.scene.add(group);
    this.vehicles.push(tram);
  }

  private spawnCityTrain(x: number, z: number) {
    const group = new THREE.Group();
    const trainMat = new THREE.MeshStandardMaterial({ color: 0x6a040f, roughness: 0.5, metalness: 0.4 });

    for (let c = -1; c <= 1; c++) {
      const carriage = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.32, 0.28), trainMat);
      carriage.position.set(c * 0.95, 0.22, 0);
      group.add(carriage);
    }

    const train: SimVehicle = {
      mesh: group,
      type: 'train',
      x,
      y: 0.04,
      z,
      speed: 0.065,
      heading: 0,
      laneOffset: 0,
      isHighway: false,
    };
    group.position.set(x, 0.04, z);
    this.scene.add(group);
    this.vehicles.push(train);
  }

  private spawnPoliceCar(x: number, z: number) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.3 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.1 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.24), bodyMat);
    body.position.y = 0.12;
    group.add(body);

    const doorWhite = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.245), whiteMat);
    doorWhite.position.y = 0.12;
    group.add(doorWhite);

    // Flashing siren light
    const beaconLight = new THREE.PointLight(0x0000ff, 1.5, 3);
    beaconLight.position.set(0, 0.35, 0);
    group.add(beaconLight);

    const police: SimVehicle = {
      mesh: group,
      type: 'police',
      x,
      y: 0.04,
      z,
      speed: 0.07,
      heading: Math.PI / 2,
      laneOffset: 0.18,
      isHighway: false,
      beaconLight,
      beaconTime: 0,
    };
    group.position.set(x, 0.04, z);
    this.scene.add(group);
    this.vehicles.push(police);
  }

  private spawnAmbulance(x: number, z: number) {
    const group = new THREE.Group();
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.1 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.5, metalness: 0.1 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 0.26), whiteMat);
    body.position.y = 0.18;
    group.add(body);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.265), redMat);
    stripe.position.y = 0.18;
    group.add(stripe);

    const amb: SimVehicle = {
      mesh: group,
      type: 'ambulance',
      x,
      y: 0.04,
      z,
      speed: 0.065,
      heading: 0,
      laneOffset: -0.18,
      isHighway: false,
    };
    group.position.set(x, 0.04, z);
    this.scene.add(group);
    this.vehicles.push(amb);
  }

  private spawnFireTruck(x: number, z: number) {
    const group = new THREE.Group();
    const redMat = new THREE.MeshStandardMaterial({ color: 0xd62828, roughness: 0.5, metalness: 0.2 });
    const ladderMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.4, metalness: 0.6 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.28), redMat);
    body.position.y = 0.18;
    group.add(body);

    const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.16), ladderMat);
    ladder.position.set(-0.05, 0.36, 0);
    group.add(ladder);

    const fire: SimVehicle = {
      mesh: group,
      type: 'fire',
      x,
      y: 0.04,
      z,
      speed: 0.06,
      heading: Math.PI,
      laneOffset: 0.18,
      isHighway: false,
    };
    group.position.set(x, 0.04, z);
    this.scene.add(group);
    this.vehicles.push(fire);
  }

  private spawnCityCar(x: number, z: number) {
    const group = new THREE.Group();
    const isTaxi = Math.random() > 0.7;
    const carMat = new THREE.MeshStandardMaterial({
      color: isTaxi ? 0xfec810 : [0xd90429, 0x118ab2, 0x06d6a0, 0x8338ec, 0xffffff][Math.floor(Math.random() * 5)],
      roughness: 0.5,
      metalness: 0.2,
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.22), carMat);
    body.position.y = 0.11;
    group.add(body);

    const car: SimVehicle = {
      mesh: group,
      type: isTaxi ? 'taxi' : 'car',
      x,
      y: 0.04,
      z,
      speed: 0.045 + Math.random() * 0.015,
      heading: Math.random() > 0.5 ? 0 : Math.PI,
      laneOffset: 0.18,
      isHighway: false,
    };
    group.position.set(x, 0.04, z);
    this.scene.add(group);
    this.vehicles.push(car);
  }

  // --- ANIMATION UPDATE LOOP ---

  public update(delta: number) {
    // 1. Traffic Light Cycle (Green 10s, Yellow 2.5s, Red 7s)
    this.trafficLightTimer += delta;
    if (this.trafficLightState === 'green' && this.trafficLightTimer > 10.0) {
      this.trafficLightState = 'yellow';
      this.trafficLightTimer = 0;
      this.onTrafficLightChange?.('yellow');
    } else if (this.trafficLightState === 'yellow' && this.trafficLightTimer > 2.5) {
      this.trafficLightState = 'red';
      this.trafficLightTimer = 0;
      this.onTrafficLightChange?.('red');
    } else if (this.trafficLightState === 'red' && this.trafficLightTimer > 7.0) {
      this.trafficLightState = 'green';
      this.trafficLightTimer = 0;
      this.onTrafficLightChange?.('green');
    }

    // 2. Vehicles Position Update
    for (const v of this.vehicles) {
      // Emergency strobe animation
      if (v.beaconLight) {
        v.beaconTime = (v.beaconTime || 0) + delta * 12;
        v.beaconLight.color.setHex(Math.sin(v.beaconTime) > 0 ? 0xff0000 : 0x0044ff);
      }

      // Check traffic light stop for urban cars
      if (!v.isHighway && v.type !== 'airplane' && v.type !== 'airship' && v.type !== 'ship') {
        if (this.trafficLightState === 'red' && Math.abs(v.x) < 1.0 && Math.abs(v.z) < 1.0) {
          // Stop at intersection while light is red
          continue;
        }
      }

      // Advance vehicle
      if (v.type === 'airplane') {
        v.x += Math.cos(v.heading) * v.speed;
        v.z += Math.sin(v.heading) * v.speed;
        v.mesh.rotation.y = -v.heading + Math.PI / 2;

        // Wrap around sky boundaries
        if (v.x > 25) v.x = -25;
        if (v.x < -25) v.x = 25;
        if (v.z > 25) v.z = -25;
        if (v.z < -25) v.z = 25;
      } else if (v.type === 'airship') {
        v.heading += 0.002;
        v.x += Math.cos(v.heading) * v.speed;
        v.z += Math.sin(v.heading) * v.speed;
        v.mesh.rotation.y = -v.heading;
      } else if (v.type === 'ship') {
        v.z += v.speed;
        if (v.z > 14) v.z = -14;
      } else if (v.isHighway) {
        // Highway travel along Z axis
        v.z += v.speed * (v.type === 'truck' ? 1.0 : 1.3);
        if (v.z > 16) v.z = -16;

        // CRITICAL REQUIREMENT: Trucks do not leave the first lane on the right!
        if (v.type === 'truck') {
          v.x = -8 + 0.32; // Kept strictly on the right lane
        }
      } else {
        // City streets
        if (v.heading === 0 || v.heading === Math.PI) {
          v.x += (v.heading === 0 ? 1 : -1) * v.speed;
          if (v.x > 14) v.x = -14;
          if (v.x < -14) v.x = 14;
        } else {
          v.z += (v.heading > 0 ? 1 : -1) * v.speed;
          if (v.z > 14) v.z = -14;
          if (v.z < -14) v.z = 14;
        }
      }

      v.mesh.position.set(v.x, v.y, v.z);
    }
  }

  public dispose() {
    for (const v of this.vehicles) {
      this.scene.remove(v.mesh);
    }
    this.vehicles = [];
  }
}
