/**
 * Master Three.js Scene Engine for MetroGenesis 3D
 * Handles terrain grid, day/night lighting, seasonal shifts,
 * building models, terraforming (lowering/raising ground for water/land),
 * raycasting, and touch/mouse camera controls.
 */

import * as THREE from 'three';
import { Season, StructureType, PlacedStructure, GridTile } from '../types/game';
import { createBuildingMesh, updateWindowIllumination, foliageMaterials } from './BuildingModels';
import { createRoadMesh, createTrafficLight } from './RoadNetwork';
import { TrafficSystem } from './TrafficSystem';

export class CityScene {
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public trafficSystem: TrafficSystem;

  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private ambientLight: THREE.AmbientLight;

  private tileMeshes: Map<string, THREE.Mesh> = new Map();
  private structureMeshes: Map<string, THREE.Group> = new Map();
  private roadMeshes: Map<string, THREE.Group> = new Map();
  private trafficLightControllers: Array<{ setState: (state: 'red' | 'yellow' | 'green') => void }> = [];

  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private touchStartDist = 0;
  private cameraTarget = new THREE.Vector3(0, 0, 0);
  private cameraRadius = 24;
  private cameraTheta = Math.PI / 4;
  private cameraPhi = Math.PI / 3;

  private raycaster = new THREE.Raycaster();
  private mouseVec = new THREE.Vector2();

  private isSoftwareGl = false;
  private animFrameId: number = 0;
  private lastTime: number = performance.now();

  // Water and grass shared materials
  private waterMaterial: THREE.MeshStandardMaterial;
  private landMaterial: THREE.MeshStandardMaterial;
  private cliffMaterial: THREE.MeshStandardMaterial;

  public onTileClick?: (gridX: number, gridZ: number) => void;
  public onStructureClick?: (instanceId: string) => void;

  constructor(container: HTMLElement, quality: 'low' | 'balanced' | 'high' = 'balanced') {
    this.container = container;

    // 1. Detect software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize Renderer optimized for mobile & Snapdragon 662
    this.renderer = new THREE.WebGLRenderer({
      antialias: quality !== 'low' && !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    const maxPixelRatio = quality === 'low' ? 1.0 : quality === 'balanced' ? 1.5 : 2.0;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, maxPixelRatio));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = quality !== 'low' && !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa0d8ef);
    this.scene.fog = new THREE.FogExp2(0xa0d8ef, 0.015);

    // 4. Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.5,
      120
    );
    this.updateCameraPosition();

    // 5. Lighting
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.85);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    this.dirLight.position.set(16, 25, 12);
    this.dirLight.castShadow = quality !== 'low' && !this.isSoftwareGl;
    if (this.dirLight.castShadow) {
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
      this.dirLight.shadow.camera.near = 0.5;
      this.dirLight.shadow.camera.far = 60;
      const d = 16;
      this.dirLight.shadow.camera.left = -d;
      this.dirLight.shadow.camera.right = d;
      this.dirLight.shadow.camera.top = d;
      this.dirLight.shadow.camera.bottom = -d;
      this.dirLight.shadow.bias = -0.0005;
    }
    this.scene.add(this.dirLight);

    // 6. Terrain materials
    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x0096c7,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.88,
    });
    this.landMaterial = new THREE.MeshStandardMaterial({
      color: 0x588157,
      roughness: 0.85,
      metalness: 0.05,
    });
    this.cliffMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d405b,
      roughness: 0.9,
      metalness: 0.05,
    });

    // 7. Traffic System
    this.trafficSystem = new TrafficSystem(this.scene);
    this.trafficSystem.onTrafficLightChange = (state) => {
      this.trafficLightControllers.forEach((c) => c.setState(state));
    };

    // 8. Event listeners
    this.setupControls();
    window.addEventListener('resize', this.onResize);

    // 9. Start Loop
    this.lastTime = performance.now();
    this.animate();
  }

  // --- GRID & TERRAFORMING RENDERER ---

  public buildTerrainGrid(tiles: GridTile[]) {
    // Clear old tile meshes
    this.tileMeshes.forEach((mesh) => this.scene.remove(mesh));
    this.tileMeshes.clear();

    const boxGeom = new THREE.BoxGeometry(0.98, 0.4, 0.98);

    tiles.forEach((tile) => {
      const isWater = tile.terrain === 'water' || tile.elevation <= 0;
      const mat = isWater ? this.waterMaterial : this.landMaterial;

      const mesh = new THREE.Mesh(boxGeom, mat);
      mesh.position.set(tile.x, isWater ? -0.1 : 0.0, tile.z);
      mesh.receiveShadow = true;
      mesh.userData = { gridX: tile.x, gridZ: tile.z, isWater };

      this.scene.add(mesh);
      this.tileMeshes.set(`${tile.x},${tile.z}`, mesh);
    });
  }

  public updateTileTerrain(x: number, z: number, terrain: 'land' | 'water') {
    const key = `${x},${z}`;
    const mesh = this.tileMeshes.get(key);
    if (!mesh) return;

    const isWater = terrain === 'water';
    mesh.material = isWater ? this.waterMaterial : this.landMaterial;
    mesh.position.y = isWater ? -0.1 : 0.0;
    mesh.userData.isWater = isWater;
  }

  // --- STRUCTURES & ROADS ---

  public renderStructures(structures: PlacedStructure[], season: Season) {
    // Clean old structures
    this.structureMeshes.forEach((grp) => this.scene.remove(grp));
    this.structureMeshes.clear();
    this.roadMeshes.forEach((grp) => this.scene.remove(grp));
    this.roadMeshes.clear();
    this.trafficLightControllers = [];

    structures.forEach((struct) => {
      if (struct.type === 'road_2way' || struct.type === 'road_4lane' || struct.type === 'highway') {
        const roadGroup = createRoadMesh(struct.type, season);
        roadGroup.position.set(struct.x, 0.2, struct.z);
        roadGroup.rotation.y = (struct.rotation * Math.PI) / 180;
        roadGroup.userData = { instanceId: struct.instanceId, isRoad: true };

        // Attach traffic light at key intersections
        if (struct.x % 4 === 0 && struct.z % 4 === 0) {
          const tLight = createTrafficLight();
          tLight.group.position.set(0.4, 0, 0.4);
          roadGroup.add(tLight.group);
          this.trafficLightControllers.push(tLight);
        }

        this.scene.add(roadGroup);
        this.roadMeshes.set(struct.instanceId, roadGroup);
      } else {
        const building = createBuildingMesh(struct.type, struct.level, season);
        building.position.set(struct.x, 0.2, struct.z);
        building.rotation.y = (struct.rotation * Math.PI) / 180;
        building.userData = { instanceId: struct.instanceId, isStructure: true };

        // If under construction or upgrading, add holographic scaffolding marker
        if (struct.status === 'constructing' || struct.status === 'upgrading') {
          const scaffold = new THREE.Mesh(
            new THREE.BoxGeometry(0.9, 1.2, 0.9),
            new THREE.MeshBasicMaterial({ color: 0xffb703, wireframe: true, transparent: true, opacity: 0.6 })
          );
          scaffold.position.y = 0.6;
          building.add(scaffold);
        }

        this.scene.add(building);
        this.structureMeshes.set(struct.instanceId, building);
      }
    });
  }

  // --- DAY / NIGHT & SEASONS ---

  public updateDayNightCycle(dayTime: number, brightness: number = 1.0) {
    // dayTime: 0.0 - 24.0. Sunrise at 6.0, Noon at 12.0, Sunset at 18.0, Midnight at 24.0/0.0
    const angle = ((dayTime - 6.0) / 24.0) * Math.PI * 2;
    const sunHeight = Math.sin(angle);
    const sunX = Math.cos(angle) * 25;
    const sunY = Math.max(sunHeight * 25, -25);
    const sunZ = 12;

    this.dirLight.position.set(sunX, Math.abs(sunY) + 5, sunZ);

    const isNight = sunHeight < 0.1;
    updateWindowIllumination(isNight);

    if (isNight) {
      // Midnight / Starry Twilight
      const nightFactor = Math.min(1.0, Math.abs(sunHeight));
      const skyColor = new THREE.Color(0x0a1128).lerp(new THREE.Color(0x000814), nightFactor);
      this.scene.background = skyColor;
      this.scene.fog?.color.copy(skyColor);

      this.dirLight.color.setHex(0x7090b0); // Cool moonlight
      this.dirLight.intensity = 0.35 * brightness;
      this.hemiLight.color.setHex(0x3a4b68);
      this.hemiLight.groundColor.setHex(0x1a2434);
      this.hemiLight.intensity = 0.4 * brightness;
    } else {
      // Daytime / Golden hour
      const dayFactor = sunHeight;
      const skyColor = new THREE.Color(0xfdcb6e).lerp(new THREE.Color(0x70c1e8), Math.min(1.0, dayFactor * 1.5));
      this.scene.background = skyColor;
      this.scene.fog?.color.copy(skyColor);

      this.dirLight.color.setHex(0xfff7e6);
      this.dirLight.intensity = 1.35 * brightness;
      this.hemiLight.color.setHex(0xffffff);
      this.hemiLight.groundColor.setHex(0x444444);
      this.hemiLight.intensity = 0.85 * brightness;
    }
  }

  public updateSeason(season: Season) {
    // Update ground tint subtly
    if (season === 'winter') {
      this.landMaterial.color.setHex(0xd8e2dc); // Snowy frost
    } else if (season === 'autumn') {
      this.landMaterial.color.setHex(0x6b705c); // Earthy olive
    } else if (season === 'spring') {
      this.landMaterial.color.setHex(0x70e000); // Fresh spring lime
    } else {
      this.landMaterial.color.setHex(0x588157); // Lush summer green
    }
  }

  // --- CAMERA & TOUCH CONTROLS ---

  private updateCameraPosition() {
    this.cameraPhi = Math.max(0.2, Math.min(Math.PI / 2.15, this.cameraPhi));
    const x = this.cameraTarget.x + this.cameraRadius * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    const y = this.cameraTarget.y + this.cameraRadius * Math.cos(this.cameraPhi);
    const z = this.cameraTarget.z + this.cameraRadius * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
  }

  private setupControls() {
    const el = this.renderer.domElement;

    // Mouse Controls
    el.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      if (e.buttons === 2 || e.shiftKey) {
        // Pan
        const panSpeed = 0.025 * (this.cameraRadius / 20);
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        this.cameraTarget.addScaledVector(right, -deltaX * panSpeed);
        this.cameraTarget.addScaledVector(forward, deltaY * panSpeed);
      } else {
        // Orbit
        this.cameraTheta -= deltaX * 0.006;
        this.cameraPhi -= deltaY * 0.006;
      }

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
      this.updateCameraPosition();
    });

    window.addEventListener('mouseup', (e) => {
      if (this.isDragging) {
        const dx = Math.abs(e.clientX - this.previousMousePosition.x);
        const dy = Math.abs(e.clientY - this.previousMousePosition.y);
        if (dx < 4 && dy < 4) {
          this.handleClick(e.clientX, e.clientY);
        }
      }
      this.isDragging = false;
    });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraRadius = Math.max(6, Math.min(48, this.cameraRadius + e.deltaY * 0.025));
      this.updateCameraPosition();
    }, { passive: false });

    // Touch controls for mobile / Android (compatible with Snapdragon 662)
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.touchStartDist = Math.hypot(dx, dy);
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
        const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

        this.cameraTheta -= deltaX * 0.007;
        this.cameraPhi -= deltaY * 0.007;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this.updateCameraPosition();
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const diff = this.touchStartDist - dist;

        this.cameraRadius = Math.max(6, Math.min(48, this.cameraRadius + diff * 0.05));
        this.touchStartDist = dist;
        this.updateCameraPosition();
      }
    }, { passive: true });

    el.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        this.handleClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
      this.isDragging = false;
    });

    // Disable context menu so right click can be used for panning
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleClick(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseVec, this.camera);

    // 1. Check if clicking an existing structure or road
    const structureObjects: THREE.Object3D[] = [];
    this.structureMeshes.forEach((g) => structureObjects.push(g));
    this.roadMeshes.forEach((g) => structureObjects.push(g));

    const structHits = this.raycaster.intersectObjects(structureObjects, true);
    if (structHits.length > 0) {
      let topObj: THREE.Object3D | null = structHits[0].object;
      while (topObj && !topObj.userData.instanceId && topObj.parent) {
        topObj = topObj.parent;
      }
      if (topObj && topObj.userData.instanceId) {
        this.onStructureClick?.(topObj.userData.instanceId);
        return;
      }
    }

    // 2. Check if clicking a ground tile (for building placement or terraforming)
    const tileObjects = Array.from(this.tileMeshes.values());
    const tileHits = this.raycaster.intersectObjects(tileObjects, false);
    if (tileHits.length > 0) {
      const tileMesh = tileHits[0].object as THREE.Mesh;
      if (tileMesh.userData) {
        this.onTileClick?.(tileMesh.userData.gridX, tileMesh.userData.gridZ);
      }
    }
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  // --- ANIMATION LOOP ---

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Rotate Ferris Wheel rotors in amusement parks
    this.structureMeshes.forEach((group) => {
      const rotor = group.getObjectByName('ferris_wheel_rotor');
      if (rotor) {
        rotor.rotation.z += delta * 0.4;
      }
    });

    // Update animated vehicles
    this.trafficSystem.update(delta);

    this.renderer.render(this.scene, this.camera);
  };

  public setQuality(quality: 'low' | 'balanced' | 'high') {
    const maxPixelRatio = quality === 'low' ? 1.0 : quality === 'balanced' ? 1.5 : 2.0;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, maxPixelRatio));
    this.renderer.shadowMap.enabled = quality !== 'low' && !this.isSoftwareGl;
    this.dirLight.castShadow = quality !== 'low' && !this.isSoftwareGl;
  }

  public dispose() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    this.trafficSystem.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
