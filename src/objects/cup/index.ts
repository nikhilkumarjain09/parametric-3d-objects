import * as THREE from 'three';
import { ObjectDefinitionModule, GeneratedMesh, HierarchyNode } from '../types';

// Memoization cache variables (Section 25)
let lastCupParams: any = null;
let lastCupMeshes: GeneratedMesh[] = [];

// Helper function to resolve realistic PBR material properties (Section 6.2)
const getMaterialProps = (material: string, color: string) => {
  switch (material) {
    case 'Metal':
      return { color, roughness: 0.2, metalness: 0.9, transparent: false, opacity: 1.0 };
    case 'Plastic':
      return { color, roughness: 0.4, metalness: 0.0, transparent: false, opacity: 1.0 };
    case 'Glass':
      return { color: '#e2e8f0', roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.35 };
    case 'Ceramic':
    default:
      // Ceramic is highly glossy and smooth with low metalness
      return { color, roughness: 0.2, metalness: 0.0, transparent: false, opacity: 1.0 };
  }
};

export const cupModule: ObjectDefinitionModule = {
  id: 'cup',
  label: 'Cup',
  icon: 'cup-soda',

  defaultParams: {
    height: 100,
    topDiameter: 80,
    bottomDiameter: 60,
    wallThickness: 6,
    shape: 'Straight',
    baseThickness: 10,
    rimSize: 3,
    rimStyle: 'Flat',
    material: 'Ceramic',
    color: '#f8fafc', // Clean white ceramic default
    finish: 'Glossy',
  },

  paramSchema: [
    // Dimensions
    {
      id: 'height',
      label: 'Height',
      type: 'number',
      section: 'Dimensions',
      unit: 'mm',
      min: 50,
      max: 250,
      step: 5,
      defaultValue: 100,
    },
    {
      id: 'topDiameter',
      label: 'Top Diameter',
      type: 'number',
      section: 'Dimensions',
      unit: 'mm',
      min: 30,
      max: 200,
      step: 5,
      defaultValue: 80,
    },
    {
      id: 'bottomDiameter',
      label: 'Bottom Diameter',
      type: 'number',
      section: 'Dimensions',
      unit: 'mm',
      min: 30,
      max: 200,
      step: 5,
      defaultValue: 60,
    },
    // Body
    {
      id: 'wallThickness',
      label: 'Wall Thickness',
      type: 'number',
      section: 'Body',
      unit: 'mm',
      min: 2,
      max: 20,
      step: 0.5,
      defaultValue: 6,
    },
    {
      id: 'shape',
      label: 'Body Shape',
      type: 'enum',
      section: 'Body',
      options: ['Straight', 'Tapered', 'Rounded'],
      defaultValue: 'Straight',
    },
    // Base
    {
      id: 'baseThickness',
      label: 'Base Thickness',
      type: 'number',
      section: 'Base',
      unit: 'mm',
      min: 2,
      max: 75, // Capped dynamically in constraints
      step: 1,
      defaultValue: 10,
    },
    // Rim
    {
      id: 'rimStyle',
      label: 'Rim Style',
      type: 'enum',
      section: 'Rim',
      options: ['Flat', 'Rounded', 'Flared'],
      defaultValue: 'Flat',
    },
    // Appearance
    {
      id: 'material',
      label: 'Material',
      type: 'enum',
      section: 'Appearance',
      options: ['Ceramic', 'Glass', 'Metal', 'Plastic'],
      defaultValue: 'Ceramic',
    },
    {
      id: 'color',
      label: 'Color',
      type: 'color',
      section: 'Appearance',
      defaultValue: '#f8fafc',
    },
    {
      id: 'finish',
      label: 'Finish',
      type: 'enum',
      section: 'Appearance',
      options: ['Matte', 'Satin', 'Glossy'],
      defaultValue: 'Glossy',
    },
  ],

  constraints: (params) => {
    // 1. Clamp height and diameters (ASM-008)
    const height = Math.max(50, Math.min(250, Number(params.height ?? 100)));
    const topDiameter = Math.max(30, Math.min(200, Number(params.topDiameter ?? 80)));
    const bottomDiameter = Math.max(30, Math.min(200, Number(params.bottomDiameter ?? 60)));

    // 2. Base thickness: REQ-CUP-C02 [2mm, Height * 0.3]
    const baseThickness = Math.max(2, Math.min(height * 0.3, Number(params.baseThickness ?? 10)));

    // 3. Wall thickness: REQ-CUP-C01 safety limit (less than min diameter / 2 - 2mm)
    const minDiameter = Math.min(topDiameter, bottomDiameter);
    const maxWall = Math.max(2, minDiameter / 2 - 2);
    const wallThickness = Math.max(2, Math.min(maxWall, Number(params.wallThickness ?? 6)));

    return {
      ...params,
      height,
      topDiameter,
      bottomDiameter,
      baseThickness,
      wallThickness,
    };
  },

  deriveGeometry: (params) => {
    // Memoize geometry recomputation (Section 25)
    const cacheKeys = [
      'height', 'topDiameter', 'bottomDiameter', 'wallThickness', 'shape',
      'baseThickness', 'rimStyle', 'material', 'color', 'finish'
    ];
    const hasChanged = !lastCupParams || cacheKeys.some(k => lastCupParams[k] !== params[k]);
    if (!hasChanged) {
      return lastCupMeshes;
    }

    // Convert mm to meters for WebGL coordinates
    const h = (params.height ?? 100) / 1000;
    const rTop = (params.topDiameter ?? 80) / 2000;
    const rBot = (params.bottomDiameter ?? 60) / 2000;
    const tWall = (params.wallThickness ?? 6) / 1000;
    const tBase = (params.baseThickness ?? 10) / 1000;

    const matProps = getMaterialProps(params.material ?? 'Ceramic', params.color ?? '#f8fafc');

    // Generate profile curve points for revolving a hollow vessel (REQ-CUP-001)
    const points: THREE.Vector2[] = [];

    // 1. Bottom outer base center
    points.push(new THREE.Vector2(0, 0));
    // 2. Bottom outer base edge
    points.push(new THREE.Vector2(rBot, 0));

    // Helper to evaluate outer radius at height y (REQ-CUP-003)
    const getOuterRadiusAt = (y: number) => {
      const pct = y / h;
      if (params.shape === 'Tapered') {
        // Accentuated curve taper
        return rBot + (rTop - rBot) * Math.pow(pct, 2);
      } else if (params.shape === 'Rounded') {
        // Bulging goblet profile
        return rBot + (rTop - rBot) * pct + 0.015 * Math.sin(pct * Math.PI);
      } else {
        // Straight linear taper
        return rBot + (rTop - rBot) * pct;
      }
    };

    // 3. Generate outer wall profile points
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const y = (i / steps) * h;
      const rx = getOuterRadiusAt(y);
      points.push(new THREE.Vector2(rx, y));
    }

    // 4. Closed Rim profile loop (REQ-CUP-004)
    const rInnerTop = Math.max(0.001, rTop - tWall); // REQ-CUP-005: wall thickness reduces inside only
    
    if (params.rimStyle === 'Rounded') {
      // Rounded lip semicircle capping
      const rimSegments = 6;
      const rimCenter = (rTop + rInnerTop) / 2;
      const rimRadius = (rTop - rInnerTop) / 2;
      
      for (let i = 1; i < rimSegments; i++) {
        const theta = (i / rimSegments) * Math.PI;
        const rx = rimCenter + rimRadius * Math.cos(theta);
        const ry = h + rimRadius * Math.sin(theta);
        points.push(new THREE.Vector2(rx, ry));
      }
    } else if (params.rimStyle === 'Flared') {
      // Outward flare point at top edge
      const flare = 0.003; // 3mm flare
      points.push(new THREE.Vector2(rTop + flare, h));
      points.push(new THREE.Vector2(rInnerTop, h));
    }

    // 5. Generate inner wall profile points (derived inward by wall thickness, REQ-CUP-002)
    for (let i = steps; i >= 0; i--) {
      const y = tBase + (i / steps) * (h - tBase);
      const rxOuter = getOuterRadiusAt(y);
      const rxInner = Math.max(0.001, rxOuter - tWall);
      points.push(new THREE.Vector2(rxInner, y));
    }

    // 6. Bottom inner cavity center
    points.push(new THREE.Vector2(0, tBase));

    const meshes: GeneratedMesh[] = [
      {
        id: 'cup_body',
        name: 'Cup Body',
        geometry: {
          type: 'lathe',
          points,
          segments: 36, // Revolutions segments for high rendering smoothness
        },
        material: matProps,
        position: [0, 0, 0],
      },
    ];

    lastCupParams = { ...params };
    lastCupMeshes = meshes;
    return meshes;
  },

  hierarchy: () => {
    return {
      id: 'cup',
      label: 'Cup',
      icon: 'cup-soda',
      children: [
        { id: 'outer_body', label: 'Outer Body', icon: 'cylinder' },
        { id: 'inner_wall', label: 'Inner Cavity', icon: 'cylinder' },
        { id: 'base', label: 'Base', icon: 'box' },
        { id: 'rim', label: 'Rim', icon: 'box' },
      ],
    };
  },

  presets: [
    {
      id: 'standard_cup',
      label: 'Standard Cup',
      params: {
        height: 100,
        topDiameter: 80,
        bottomDiameter: 60,
        wallThickness: 5,
        shape: 'Straight',
        baseThickness: 8,
        rimStyle: 'Flat',
        material: 'Ceramic',
        color: '#f8fafc',
        finish: 'Glossy',
      },
    },
    {
      id: 'tall_cup',
      label: 'Tall Cup',
      params: {
        height: 150,
        topDiameter: 70,
        bottomDiameter: 55,
        wallThickness: 4,
        shape: 'Tapered',
        baseThickness: 12,
        rimStyle: 'Rounded',
        material: 'Glass',
        color: '#e2e8f0',
        finish: 'Glossy',
      },
    },
    {
      id: 'wide_cup',
      label: 'Wide Cup',
      params: {
        height: 75,
        topDiameter: 100,
        bottomDiameter: 80,
        wallThickness: 6,
        shape: 'Rounded',
        baseThickness: 8,
        rimStyle: 'Flared',
        material: 'Ceramic',
        color: '#1e3a8a',
        finish: 'Satin',
      },
    },
  ],
};
