import * as THREE from 'three';
import { ObjectDefinitionModule, GeneratedMesh, HierarchyNode } from '../types';

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
      return { color, roughness: 0.2, metalness: 0.0, transparent: false, opacity: 1.0 };
  }
};

export const mugModule: ObjectDefinitionModule = {
  id: 'mug',
  label: 'Mug',
  icon: 'coffee',

  defaultParams: {
    height: 95,
    diameter: 90, // Single nominal diameter per ASM-009
    wallThickness: 6,
    shape: 'Straight',
    baseThickness: 10,
    rimStyle: 'Flat',
    handleSize: 60, // Vertical span of handle attachment
    handleThickness: 12, // Tube diameter
    handleShape: 'Rounded Loop',
    handlePosition: 0, // Vertical offset relative to wall center
    material: 'Ceramic',
    color: '#f8fafc',
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
      min: 60,
      max: 200,
      step: 5,
      defaultValue: 95,
    },
    {
      id: 'diameter',
      label: 'Diameter',
      type: 'number',
      section: 'Dimensions',
      unit: 'mm',
      min: 40,
      max: 180,
      step: 5,
      defaultValue: 90,
    },
    // Body
    {
      id: 'wallThickness',
      label: 'Wall Thickness',
      type: 'number',
      section: 'Body',
      unit: 'mm',
      min: 2,
      max: 15,
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
    // Handle
    {
      id: 'handleShape',
      label: 'Handle Shape',
      type: 'enum',
      section: 'Handle',
      options: ['Rounded Loop', 'Angular', 'D-Shape'],
      defaultValue: 'Rounded Loop',
    },
    {
      id: 'handleSize',
      label: 'Handle Size',
      type: 'number',
      section: 'Handle',
      unit: 'mm',
      min: 30,
      max: 120,
      step: 5,
      defaultValue: 60,
    },
    {
      id: 'handleThickness',
      label: 'Handle Thickness',
      type: 'number',
      section: 'Handle',
      unit: 'mm',
      min: 4,
      max: 25,
      step: 1,
      defaultValue: 12,
    },
    {
      id: 'handlePosition',
      label: 'Handle Position',
      type: 'number',
      section: 'Handle',
      unit: 'mm',
      min: -30,
      max: 30,
      step: 1,
      defaultValue: 0,
    },
    // Base
    {
      id: 'baseThickness',
      label: 'Base Thickness',
      type: 'number',
      section: 'Base',
      unit: 'mm',
      min: 2,
      max: 50,
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
    // 1. Clamp basic dimensions
    const height = Math.max(60, Math.min(200, Number(params.height ?? 95)));
    const diameter = Math.max(40, Math.min(180, Number(params.diameter ?? 90)));
    const baseThickness = Math.max(2, Math.min(height * 0.3, Number(params.baseThickness ?? 10)));
    
    const maxWall = Math.max(2, diameter / 2 - 2);
    const wallThickness = Math.max(2, Math.min(maxWall, Number(params.wallThickness ?? 6)));

    // 2. Clamp handle size (REQ-MUG-C01: both anchors within [baseThickness + 10, height - 10])
    const maxHandleSize = Math.max(30, height - baseThickness - 20);
    const handleSize = Math.max(30, Math.min(maxHandleSize, Number(params.handleSize ?? 60)));

    // Clamp handle center position to keep anchors within the mug height (REQ-MUG-C01 / REQ-MUG-005)
    const wallCenter = baseThickness + (height - baseThickness) / 2;
    const minYCenter = baseThickness + handleSize / 2 + 10;
    const maxYCenter = height - 10 - handleSize / 2;
    
    const targetYCenter = wallCenter + Number(params.handlePosition ?? 0);
    const clampedYCenter = Math.max(minYCenter, Math.min(maxYCenter, targetYCenter));
    const handlePosition = clampedYCenter - wallCenter; // Back-solve final position

    // 3. Clamp handle thickness: REQ-MUG-C02 [4mm, 25mm] and additionally < 40% of handleSize
    const maxThickness = Math.min(25, handleSize * 0.4);
    const handleThickness = Math.max(4, Math.min(maxThickness, Number(params.handleThickness ?? 12)));

    return {
      ...params,
      height,
      diameter,
      wallThickness,
      baseThickness,
      handleSize,
      handlePosition,
      handleThickness,
    };
  },

  deriveGeometry: (params) => {
    // mm to meters conversion
    const h = (params.height ?? 95) / 1000;
    const rOuter = (params.diameter ?? 90) / 2000;
    const tWall = (params.wallThickness ?? 6) / 1000;
    const tBase = (params.baseThickness ?? 10) / 1000;

    const hSize = (params.handleSize ?? 60) / 1000;
    const hThickness = (params.handleThickness ?? 12) / 1000;
    const hPosOffset = (params.handlePosition ?? 0) / 1000;

    const matProps = getMaterialProps(params.material ?? 'Ceramic', params.color ?? '#f8fafc');
    const meshes: GeneratedMesh[] = [];

    // --- 1. MUG BODY (Lathe-based, reuse Cup vessel geometry REQ-MUG-001) ---
    const points: THREE.Vector2[] = [];
    points.push(new THREE.Vector2(0, 0)); // Bottom outer center
    points.push(new THREE.Vector2(rOuter, 0)); // Bottom outer base edge

    // Outer profile helper for circular body mapping at height y
    const getOuterRadiusAt = (y: number) => {
      const pct = y / h;
      if (params.shape === 'Tapered') {
        return rOuter + (rOuter * 0.15) * Math.pow(pct, 2); // Tapers slightly outward at top
      } else if (params.shape === 'Rounded') {
        return rOuter + 0.008 * Math.sin(pct * Math.PI); // Subtle barrel bulge
      } else {
        return rOuter; // Perfect cylinder
      }
    };

    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const y = (i / steps) * h;
      const rx = getOuterRadiusAt(y);
      points.push(new THREE.Vector2(rx, y));
    }

    const rInnerTop = Math.max(0.001, rOuter - tWall);
    if (params.rimStyle === 'Rounded') {
      const rimSegments = 6;
      const rimCenter = (getOuterRadiusAt(h) + rInnerTop) / 2;
      const rimRadius = (getOuterRadiusAt(h) - rInnerTop) / 2;
      
      for (let i = 1; i < rimSegments; i++) {
        const theta = (i / rimSegments) * Math.PI;
        const rx = rimCenter + rimRadius * Math.cos(theta);
        const ry = h + rimRadius * Math.sin(theta);
        points.push(new THREE.Vector2(rx, ry));
      }
    } else if (params.rimStyle === 'Flared') {
      const flare = 0.003;
      points.push(new THREE.Vector2(getOuterRadiusAt(h) + flare, h));
      points.push(new THREE.Vector2(rInnerTop, h));
    } else {
      points.push(new THREE.Vector2(rInnerTop, h)); // Flat rim
    }

    // Inner wall profile
    for (let i = steps; i >= 0; i--) {
      const y = tBase + (i / steps) * (h - tBase);
      const rxOuter = getOuterRadiusAt(y);
      const rxInner = Math.max(0.001, rxOuter - tWall);
      points.push(new THREE.Vector2(rxInner, y));
    }
    points.push(new THREE.Vector2(0, tBase)); // Bottom inner center

    meshes.push({
      id: 'mug_body',
      name: 'Mug Body',
      geometry: {
        type: 'lathe',
        points,
        segments: 36,
      },
      material: matProps,
      position: [0, 0, 0],
    });

    // --- 2. HANDLE GEOMETRY (Curve-swept Tube REQ-MUG-002) ---
    // Compute Y anchor heights centered with vertical offset
    const wallCenter = tBase + (h - tBase) / 2;
    const yCenter = wallCenter + hPosOffset;
    const yTop = yCenter + hSize / 2;
    const yBot = yCenter - hSize / 2;

    // Fetch body radius at anchor heights to anchor exactly on body surface (REQ-MUG-003)
    const rTop = getOuterRadiusAt(yTop);
    const rBot = getOuterRadiusAt(yBot);

    // Anchor points (placing handle extending outwards along +X direction)
    // Shift slightly inward by 1.5mm to ensure clean solid connection with no gaps
    const connOffset = 0.0015;
    const aTop = new THREE.Vector3(rTop - connOffset, yTop, 0);
    const aBot = new THREE.Vector3(rBot - connOffset, yBot, 0);

    // Compute loop bulge (bow) distance (satisfying ASM-011 clearance check)
    // Bow is proportional to size but guarantees min clearance
    const bow = Math.max(0.015, hSize * 0.6);

    let handlePath: THREE.Curve<THREE.Vector3>;

    if (params.handleShape === 'D-Shape') {
      // D-shape loop: bends sharply outwards, runs straight vertical, and bends sharply back
      const curvePath = new THREE.CurvePath<THREE.Vector3>();
      const p1 = aTop;
      const p2 = new THREE.Vector3(rTop + bow, yTop - 0.004, 0);
      const p3 = new THREE.Vector3(rBot + bow, yBot + 0.004, 0);
      const p4 = aBot;
      
      // We use smooth cubic Bezier to form a rounded-corner D
      handlePath = new THREE.CubicBezierCurve3(p1, p2, p3, p4);
    } else if (params.handleShape === 'Angular') {
      // Piecewise linear path
      const curvePath = new THREE.CurvePath<THREE.Vector3>();
      const p1 = aTop;
      const p2 = new THREE.Vector3(rTop + bow, yTop - 0.008, 0);
      const p3 = new THREE.Vector3(rBot + bow, yBot + 0.008, 0);
      const p4 = aBot;
      
      curvePath.add(new THREE.LineCurve3(p1, p2));
      curvePath.add(new THREE.LineCurve3(p2, p3));
      curvePath.add(new THREE.LineCurve3(p3, p4));
      handlePath = curvePath as any; // Cast as Curve for R3F tubeGeometry consumption
    } else {
      // Standard Rounded Loop: smooth bezier curve bowing outwards
      const cTop = new THREE.Vector3(rTop + bow, yTop, 0);
      const cBot = new THREE.Vector3(rBot + bow, yBot, 0);
      handlePath = new THREE.CubicBezierCurve3(aTop, cTop, cBot, aBot);
    }

    // Unique path ID to force Viewport geometry cache refresh on path recalculation
    const pathId = `${params.handleShape}-${yTop.toFixed(4)}-${yBot.toFixed(4)}-${rTop.toFixed(4)}-${rBot.toFixed(4)}-${bow.toFixed(4)}`;

    meshes.push({
      id: 'mug_handle',
      name: 'Handle',
      geometry: {
        type: 'tube',
        path: handlePath,
        pathId,
        segments: 40,
        radius: hThickness / 2, // Thickness scales independently (REQ-MUG-004)
        radialSegments: 12,
      },
      material: matProps,
      position: [0, 0, 0],
    });

    return meshes;
  },

  hierarchy: () => {
    return {
      id: 'mug',
      label: 'Mug',
      icon: 'coffee',
      children: [
        { id: 'mug_body', label: 'Body', icon: 'cylinder' },
        { id: 'inner_wall', label: 'Inner Cavity', icon: 'cylinder' },
        { id: 'base', label: 'Base', icon: 'box' },
        { id: 'rim', label: 'Rim', icon: 'box' },
        { id: 'mug_handle', label: 'Handle', icon: 'coffee' },
      ],
    };
  },

  presets: [
    {
      id: 'coffee_mug',
      label: 'Coffee Mug',
      params: {
        height: 95,
        diameter: 90,
        wallThickness: 6,
        shape: 'Straight',
        baseThickness: 10,
        rimStyle: 'Flat',
        handleSize: 60,
        handleThickness: 12,
        handleShape: 'Rounded Loop',
        handlePosition: 0,
        material: 'Ceramic',
        color: '#f8fafc',
        finish: 'Glossy',
      },
    },
    {
      id: 'large_mug',
      label: 'Large Mug',
      params: {
        height: 120,
        diameter: 100,
        wallThickness: 7,
        shape: 'Rounded',
        baseThickness: 12,
        rimStyle: 'Rounded',
        handleSize: 80,
        handleThickness: 16,
        handleShape: 'D-Shape',
        handlePosition: 5,
        material: 'Ceramic',
        color: '#1e3a8a',
        finish: 'Satin',
      },
    },
    {
      id: 'small_mug',
      label: 'Small Mug',
      params: {
        height: 75,
        diameter: 75,
        wallThickness: 5,
        shape: 'Straight',
        baseThickness: 8,
        rimStyle: 'Flared',
        handleSize: 45,
        handleThickness: 9,
        handleShape: 'Angular',
        handlePosition: -2,
        material: 'Metal',
        color: '#cbd5e1',
        finish: 'Matte',
      },
    },
  ],
};
