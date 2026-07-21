import * as THREE from 'three';
import { ObjectDefinitionModule, GeneratedMesh, HierarchyNode } from '../types';

// Memoization cache variables (Section 25)
let lastTableParams: any = null;
let lastTableMeshes: GeneratedMesh[] = [];

// Helper function to resolve realistic PBR material properties (Section 6.2 / 12.5)
const getMaterialProps = (material: string, color: string) => {
  switch (material) {
    case 'Metal':
      return { color, roughness: 0.2, metalness: 0.9, transparent: false, opacity: 1.0 };
    case 'Plastic':
      return { color, roughness: 0.4, metalness: 0.0, transparent: false, opacity: 1.0 };
    case 'Glass':
      // Glass is translucent with high reflectivity (Section 6.2)
      return { color: '#cbd5e1', roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.4 };
    case 'Wood':
    default:
      return { color, roughness: 0.6, metalness: 0.0, transparent: false, opacity: 1.0 };
  }
};

export const tableModule: ObjectDefinitionModule = {
  id: 'table',
  label: 'Table',
  icon: 'table-2',
  
  defaultParams: {
    width: 1200,
    height: 750,
    depth: 800,
    shape: 'Rectangular',
    thickness: 30,
    cornerRadius: 50,
    edgeStyle: 'Square',
    configuration: 'Four-Leg',
    legShape: 'Square',
    legWidth: 70,
    inset: 50,
    taperRatio: 0.0,
    material: 'Wood',
    color: '#8b5a2b',
    finish: 'Matte',
  },

  paramSchema: [
    // Dimensions
    {
      id: 'width',
      label: 'Width',
      type: 'number',
      section: 'Dimensions',
      unit: 'mm',
      min: 600,
      max: 2400,
      step: 10,
      defaultValue: 1200,
    },
    {
      id: 'height',
      label: 'Height',
      type: 'number',
      section: 'Dimensions',
      unit: 'mm',
      min: 400,
      max: 1200,
      step: 10,
      defaultValue: 750,
    },
    {
      id: 'depth',
      label: 'Depth',
      type: 'number',
      section: 'Dimensions',
      unit: 'mm',
      min: 600,
      max: 1600,
      step: 10,
      defaultValue: 800,
      // Hidden if shape dictates width = depth (REQ-INSP-004 / ASM-013)
      visible: (params) => params.shape !== 'Square' && params.shape !== 'Round',
    },
    // Tabletop
    {
      id: 'shape',
      label: 'Tabletop Shape',
      type: 'enum',
      section: 'Tabletop',
      options: ['Rectangular', 'Square', 'Round', 'Oval'],
      defaultValue: 'Rectangular',
    },
    {
      id: 'thickness',
      label: 'Thickness',
      type: 'number',
      section: 'Tabletop',
      unit: 'mm',
      min: 8,
      max: 100,
      step: 1,
      defaultValue: 30,
    },
    {
      id: 'cornerRadius',
      label: 'Corner Radius',
      type: 'number',
      section: 'Tabletop',
      unit: 'mm',
      min: 0,
      max: 300,
      step: 5,
      defaultValue: 50,
      // Only applicable for rectangular/square tables (REQ-INSP-004)
      visible: (params) => params.shape === 'Rectangular' || params.shape === 'Square',
    },
    {
      id: 'edgeStyle',
      label: 'Edge Style',
      type: 'enum',
      section: 'Tabletop',
      options: ['Square', 'Beveled', 'Rounded'],
      defaultValue: 'Square',
    },
    // Legs
    {
      id: 'configuration',
      label: 'Leg Configuration',
      type: 'enum',
      section: 'Legs',
      options: ['Four-Leg', 'Six-Leg', 'Pedestal', 'Central Support'],
      defaultValue: 'Four-Leg',
    },
    {
      id: 'legShape',
      label: 'Leg Shape',
      type: 'enum',
      section: 'Legs',
      options: ['Square', 'Round', 'Tapered'],
      defaultValue: 'Square',
      visible: (params) => params.configuration !== 'Pedestal' && params.configuration !== 'Central Support',
    },
    {
      id: 'legWidth',
      label: 'Leg Width',
      type: 'number',
      section: 'Legs',
      unit: 'mm',
      min: 30,
      max: 150,
      step: 5,
      defaultValue: 70,
    },
    {
      id: 'inset',
      label: 'Inset',
      type: 'number',
      section: 'Legs',
      unit: 'mm',
      min: 0,
      max: 200,
      step: 5,
      defaultValue: 50,
      // Corner inset is hidden for pedestal/central support (REQ-INSP-004 / ASM-003)
      visible: (params) => params.configuration !== 'Pedestal' && params.configuration !== 'Central Support',
    },
    {
      id: 'taperRatio',
      label: 'Taper Ratio',
      type: 'number',
      section: 'Legs',
      min: 0.0,
      max: 0.8,
      step: 0.05,
      defaultValue: 0.0,
      // Only enabled for Tapered legs (REQ-INSP-004)
      visible: (params) => params.legShape === 'Tapered' && params.configuration !== 'Pedestal' && params.configuration !== 'Central Support',
    },
    // Appearance
    {
      id: 'material',
      label: 'Material',
      type: 'enum',
      section: 'Appearance',
      options: ['Wood', 'Metal', 'Plastic', 'Glass'],
      defaultValue: 'Wood',
    },
    {
      id: 'color',
      label: 'Color',
      type: 'color',
      section: 'Appearance',
      defaultValue: '#8b5a2b',
    },
    {
      id: 'finish',
      label: 'Finish',
      type: 'enum',
      section: 'Appearance',
      options: ['Matte', 'Satin', 'Glossy'],
      defaultValue: 'Matte',
    },
  ],

  constraints: (params) => {
    // 1. Clamp overall dimensions
    const width = Math.max(600, Math.min(2400, Number(params.width ?? 1200)));
    const height = Math.max(400, Math.min(1200, Number(params.height ?? 750)));
    let depth = Math.max(600, Math.min(1600, Number(params.depth ?? 800)));

    // Enforce width/depth coupling for Square and Round tables (ASM-008 equivalent for table)
    if (params.shape === 'Square' || params.shape === 'Round') {
      depth = width;
    }

    // 2. Tabletop thickness constraints: C02 [8mm, 25% of Height]
    const thickness = Math.max(8, Math.min(height * 0.25, Number(params.thickness ?? 30)));

    // 3. Corner radius constraint: C03 max min(width, depth) / 2
    const maxRadius = Math.min(width, depth) / 2;
    const cornerRadius = Math.max(0, Math.min(maxRadius, Number(params.cornerRadius ?? 50)));

    // 4. Six-Leg threshold validation (ASM-002: six legs only available if width >= 1400)
    let configuration = params.configuration ?? 'Four-Leg';
    if (configuration === 'Six-Leg' && width < 1400) {
      configuration = 'Four-Leg';
    }

    // 5. Leg width clamp
    const legWidth = Math.max(30, Math.min(150, Number(params.legWidth ?? 70)));

    // 6. Inset and clearance constraints (C01 & ASM-004: min 40mm spacing between inner leg edges)
    // Inner spacing span is Width - 2 * Inset - 2 * LegWidth >= 40mm
    // Therefore: Inset <= (Width - 2 * LegWidth - 40) / 2
    const maxInsetX = Math.max(0, (width - 2 * legWidth - 40) / 2);
    const maxInsetZ = Math.max(0, (depth - 2 * legWidth - 40) / 2);
    const maxInset = Math.min(200, Math.min(maxInsetX, maxInsetZ));
    const inset = Math.max(0, Math.min(maxInset, Number(params.inset ?? 50)));

    // 7. Taper bounds
    const taperRatio = Math.max(0.0, Math.min(0.8, Number(params.taperRatio ?? 0.0)));

    return {
      ...params,
      width,
      height,
      depth,
      thickness,
      cornerRadius,
      configuration,
      legWidth,
      inset,
      taperRatio,
    };
  },

  deriveGeometry: (params) => {
    // Memoize geometry recomputation (Section 25)
    const cacheKeys = [
      'width', 'height', 'depth', 'shape', 'thickness', 'cornerRadius',
      'edgeStyle', 'configuration', 'legShape', 'legWidth', 'inset',
      'taperRatio', 'material', 'color', 'finish'
    ];
    const hasChanged = !lastTableParams || cacheKeys.some(k => lastTableParams[k] !== params[k]);
    if (!hasChanged) {
      return lastTableMeshes;
    }

    // Convert mm dimensions to meters for standard WebGL/Three.js coordinates
    const w = (params.width ?? 1200) / 1000;
    const h = (params.height ?? 750) / 1000;
    const d = (params.depth ?? 800) / 1000;
    const thickness = (params.thickness ?? 30) / 1000;
    const cornerRadius = (params.cornerRadius ?? 50) / 1000;
    const legWidth = (params.legWidth ?? 70) / 1000;
    const inset = (params.inset ?? 50) / 1000;
    
    const matProps = getMaterialProps(params.material ?? 'Wood', params.color ?? '#8b5a2b');
    const meshes: GeneratedMesh[] = [];

    // --- 1. TABLETOP GEOMETRY ---
    const shape = new THREE.Shape();
    const halfW = w / 2;
    const halfD = d / 2;

    if (params.shape === 'Round') {
      shape.absarc(0, 0, w / 2, 0, Math.PI * 2, false);
    } else if (params.shape === 'Oval') {
      shape.absellipse(0, 0, w / 2, d / 2, 0, Math.PI * 2, false);
    } else {
      // Rectangular or Square with corner radius support
      const r = Math.min(cornerRadius, Math.min(halfW, halfD));
      if (r > 0) {
        shape.moveTo(-halfW + r, -halfD);
        shape.lineTo(halfW - r, -halfD);
        shape.absarc(halfW - r, -halfD + r, r, -Math.PI / 2, 0, false);
        shape.lineTo(halfW, halfD - r);
        shape.absarc(halfW - r, halfD - r, r, 0, Math.PI / 2, false);
        shape.lineTo(-halfW + r, halfD);
        shape.absarc(-halfW + r, halfD - r, r, Math.PI / 2, Math.PI, false);
        shape.lineTo(-halfW, -halfD + r);
        shape.absarc(-halfW + r, -halfD + r, r, Math.PI, Math.PI * 1.5, false);
      } else {
        shape.moveTo(-halfW, -halfD);
        shape.lineTo(halfW, -halfD);
        shape.lineTo(halfW, halfD);
        shape.lineTo(-halfW, halfD);
        shape.closePath();
      }
    }

    // Edge Style Beveling settings
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: thickness,
      steps: 1,
      bevelEnabled: false,
    };

    if (params.edgeStyle === 'Beveled') {
      const bevel = Math.min(0.005, thickness / 4); // 5mm max bevel or 25% thickness
      extrudeSettings.bevelEnabled = true;
      extrudeSettings.bevelThickness = bevel;
      extrudeSettings.bevelSize = bevel;
      extrudeSettings.bevelSegments = 1;
      extrudeSettings.bevelOffset = -bevel; // Keeps overall dimensions constrained
    } else if (params.edgeStyle === 'Rounded') {
      const bevel = Math.min(0.005, thickness / 4);
      extrudeSettings.bevelEnabled = true;
      extrudeSettings.bevelThickness = bevel;
      extrudeSettings.bevelSize = bevel;
      extrudeSettings.bevelSegments = 3; // Curved bevel profile
      extrudeSettings.bevelOffset = -bevel;
    }

    // Extrusion naturally grows positive-z. Rotating around X places top surface at y=h (REQ-TABLE-001)
    meshes.push({
      id: 'tabletop',
      name: 'Tabletop',
      geometry: {
        type: 'extrude',
        shape,
        options: extrudeSettings,
      },
      material: matProps,
      position: [0, h, 0],
      rotation: [-Math.PI / 2, 0, 0],
    });

    // --- 2. LEGS GEOMETRY ---
    const legH = h - thickness; // Derived leg height (REQ-TABLE-002)

    if (params.configuration === 'Pedestal') {
      // Circular column + base plate (ASM-003)
      meshes.push({
        id: 'support_column',
        name: 'Support Column',
        geometry: {
          type: 'cylinder',
          args: [legWidth * 0.75, legWidth * 0.75, legH, 24],
        },
        material: matProps,
        position: [0, legH / 2, 0],
      });
      meshes.push({
        id: 'base_plate',
        name: 'Base Plate',
        geometry: {
          type: 'box',
          args: [w * 0.5, 0.02, d * 0.5],
        },
        material: matProps,
        position: [0, 0.01, 0],
      });
    } else if (params.configuration === 'Central Support') {
      // Square column + base cross (ASM-003)
      meshes.push({
        id: 'support_column',
        name: 'Support Column',
        geometry: {
          type: 'box',
          args: [legWidth * 1.2, legH, legWidth * 1.2],
        },
        material: matProps,
        position: [0, legH / 2, 0],
      });
      // Base plate cross elements
      meshes.push({
        id: 'base_cross_x',
        name: 'Base Cross X',
        geometry: {
          type: 'box',
          args: [w * 0.6, 0.02, legWidth * 1.2],
        },
        material: matProps,
        position: [0, 0.01, 0],
      });
      meshes.push({
        id: 'base_cross_z',
        name: 'Base Cross Z',
        geometry: {
          type: 'box',
          args: [legWidth * 1.2, 0.02, d * 0.6],
        },
        material: matProps,
        position: [0, 0.01, 0],
      });
    } else {
      // Four-Leg or Six-Leg configuration
      const legHalfW = legWidth / 2;
      const posX = w / 2 - inset - legHalfW;
      const posZ = d / 2 - inset - legHalfW;

      // Leg positions list
      const legPositions: { id: string; name: string; pos: [number, number, number] }[] = [
        { id: 'leg_fl', name: 'Front Left Leg', pos: [-posX, legH / 2, -posZ] },
        { id: 'leg_fr', name: 'Front Right Leg', pos: [posX, legH / 2, -posZ] },
        { id: 'leg_rl', name: 'Rear Left Leg', pos: [-posX, legH / 2, posZ] },
        { id: 'leg_rr', name: 'Rear Right Leg', pos: [posX, legH / 2, posZ] },
      ];

      // Add middle legs if Six-Leg configuration active
      if (params.configuration === 'Six-Leg') {
        legPositions.push(
          { id: 'leg_ml', name: 'Mid Left Leg', pos: [-posX, legH / 2, 0] },
          { id: 'leg_mr', name: 'Mid Right Leg', pos: [posX, legH / 2, 0] }
        );
      }

      // Generate meshes based on Leg Shape
      legPositions.forEach((leg) => {
        if (params.legShape === 'Round') {
          meshes.push({
            id: leg.id,
            name: leg.name,
            geometry: {
              type: 'cylinder',
              args: [legHalfW, legHalfW, legH, 16],
            },
            material: matProps,
            position: leg.pos,
          });
        } else if (params.legShape === 'Tapered') {
          // Circumscribing radius conversion: diagonal divide by two, then taper (REQ-TABLE-006)
          const radiusTop = legWidth / Math.sqrt(2);
          const radiusBottom = (legWidth * (1 - (params.taperRatio ?? 0))) / Math.sqrt(2);
          
          meshes.push({
            id: leg.id,
            name: leg.name,
            geometry: {
              type: 'cylinder',
              // Top radius, bottom radius, height, radialSegments (4 makes square prism)
              args: [radiusTop, radiusBottom, legH, 4],
            },
            material: matProps,
            position: leg.pos,
            rotation: [0, Math.PI / 4, 0], // Rotate 45deg to align square faces with X/Z
          });
        } else {
          // Standard Square Leg
          meshes.push({
            id: leg.id,
            name: leg.name,
            geometry: {
              type: 'box',
              args: [legWidth, legH, legWidth],
            },
            material: matProps,
            position: leg.pos,
          });
        }
      });
    }

    lastTableParams = { ...params };
    lastTableMeshes = meshes;
    return meshes;
  },

  hierarchy: (params) => {
    const children: HierarchyNode[] = [
      { id: 'tabletop', label: 'Tabletop', icon: 'box' },
    ];

    if (params.configuration === 'Pedestal' || params.configuration === 'Central Support') {
      children.push({
        id: 'support_column',
        label: 'Support Column',
        icon: 'cylinder',
      });
      children.push({
        id: 'base_plate',
        label: 'Base Plate',
        icon: 'box',
      });
    } else {
      const legList: HierarchyNode[] = [
        { id: 'leg_fl', label: 'Front Left Leg', icon: 'cylinder' },
        { id: 'leg_fr', label: 'Front Right Leg', icon: 'cylinder' },
        { id: 'leg_rl', label: 'Rear Left Leg', icon: 'cylinder' },
        { id: 'leg_rr', label: 'Rear Right Leg', icon: 'cylinder' },
      ];

      if (params.configuration === 'Six-Leg') {
        legList.push(
          { id: 'leg_ml', label: 'Mid Left Leg', icon: 'cylinder' },
          { id: 'leg_mr', label: 'Mid Right Leg', icon: 'cylinder' }
        );
      }

      children.push({
        id: 'legs_group',
        label: 'Legs',
        icon: 'list-tree',
        children: legList,
      });
    }

    return {
      id: 'table',
      label: 'Table',
      icon: 'table-2',
      children,
    };
  },

  presets: [
    {
      id: 'standard_table',
      label: 'Standard Table',
      params: {
        width: 1200,
        height: 750,
        depth: 800,
        shape: 'Rectangular',
        thickness: 30,
        cornerRadius: 0,
        edgeStyle: 'Square',
        configuration: 'Four-Leg',
        legShape: 'Square',
        legWidth: 70,
        inset: 50,
        taperRatio: 0.0,
        material: 'Wood',
        color: '#8b5a2b',
        finish: 'Matte',
      },
    },
    {
      id: 'dining_table',
      label: 'Dining Table',
      params: {
        width: 1800,
        height: 750,
        depth: 900,
        shape: 'Rectangular',
        thickness: 40,
        cornerRadius: 20,
        edgeStyle: 'Beveled',
        configuration: 'Four-Leg',
        legShape: 'Square',
        legWidth: 85,
        inset: 60,
        taperRatio: 0.0,
        material: 'Wood',
        color: '#5c4033',
        finish: 'Satin',
      },
    },
    {
      id: 'coffee_table',
      label: 'Coffee Table',
      params: {
        width: 1000,
        height: 450,
        depth: 600,
        shape: 'Oval',
        thickness: 24,
        cornerRadius: 0,
        edgeStyle: 'Rounded',
        configuration: 'Four-Leg',
        legShape: 'Tapered',
        legWidth: 60,
        inset: 40,
        taperRatio: 0.4,
        color: '#1e293b',
        material: 'Wood',
        finish: 'Matte',
      },
    },
    {
      id: 'round_table',
      label: 'Round Table',
      params: {
        width: 1000,
        height: 750,
        depth: 1000,
        shape: 'Round',
        thickness: 20,
        cornerRadius: 0,
        edgeStyle: 'Rounded',
        configuration: 'Pedestal',
        legShape: 'Round',
        legWidth: 90,
        inset: 0,
        taperRatio: 0.0,
        color: '#f8fafc',
        material: 'Plastic',
        finish: 'Glossy',
      },
    },
  ],
};
