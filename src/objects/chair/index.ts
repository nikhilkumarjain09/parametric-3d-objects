import * as THREE from 'three';
import { ObjectDefinitionModule, GeneratedMesh, HierarchyNode } from '../types';

// Memoization cache variables (Section 25)
let lastChairParams: any = null;
let lastChairMeshes: GeneratedMesh[] = [];

// Helper function to resolve realistic PBR material properties (Section 6.2)
const getMaterialProps = (material: string, color: string) => {
  switch (material) {
    case 'Metal':
      return { color, roughness: 0.2, metalness: 0.9, transparent: false, opacity: 1.0 };
    case 'Plastic':
      return { color, roughness: 0.4, metalness: 0.0, transparent: false, opacity: 1.0 };
    case 'Glass':
      return { color: '#cbd5e1', roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.4 };
    case 'Wood':
    default:
      return { color, roughness: 0.6, metalness: 0.0, transparent: false, opacity: 1.0 };
  }
};

export const chairModule: ObjectDefinitionModule = {
  id: 'chair',
  label: 'Chair',
  icon: 'armchair',

  defaultParams: {
    width: 450,
    height: 900, // Derived overall height (ASM-006)
    depth: 450,
    seatWidth: 450,
    seatDepth: 450,
    seatThickness: 40,
    seatHeight: 450,
    seatShape: 'Square',
    seatCornerRadius: 20,
    backrestWidth: 400,
    backrestHeight: 450,
    backrestThickness: 30,
    backrestAngle: 5,
    backrestShape: 'Flat',
    legThickness: 35,
    legShape: 'Square',
    legAngle: 4, // Splay angle in degrees (REQ-CHAIR-C03)
    legInset: 15,
    armrestsEnabled: false,
    armrestHeight: 200,
    armrestLength: 350,
    armrestThickness: 25,
    material: 'Wood',
    color: '#8b5a2b',
    finish: 'Matte',
  },

  paramSchema: [
    // Dimensions
    {
      id: 'seatWidth',
      label: 'Seat Width',
      type: 'number',
      section: 'Seat',
      unit: 'mm',
      min: 350,
      max: 600,
      step: 5,
      defaultValue: 450,
    },
    {
      id: 'seatDepth',
      label: 'Seat Depth',
      type: 'number',
      section: 'Seat',
      unit: 'mm',
      min: 350,
      max: 600,
      step: 5,
      defaultValue: 450,
    },
    {
      id: 'seatThickness',
      label: 'Seat Thickness',
      type: 'number',
      section: 'Seat',
      unit: 'mm',
      min: 15,
      max: 80,
      step: 5,
      defaultValue: 40,
    },
    {
      id: 'seatHeight',
      label: 'Seat Height',
      type: 'number',
      section: 'Seat',
      unit: 'mm',
      min: 350,
      max: 600,
      step: 5,
      defaultValue: 450,
    },
    {
      id: 'seatShape',
      label: 'Seat Shape',
      type: 'enum',
      section: 'Seat',
      options: ['Square', 'Rounded', 'Waterfall'],
      defaultValue: 'Square',
    },
    {
      id: 'seatCornerRadius',
      label: 'Corner Radius',
      type: 'number',
      section: 'Seat',
      unit: 'mm',
      min: 0,
      max: 100,
      step: 5,
      defaultValue: 20,
      visible: (params) => params.seatShape === 'Square' || params.seatShape === 'Rounded',
    },
    // Backrest
    {
      id: 'backrestWidth',
      label: 'Backrest Width',
      type: 'number',
      section: 'Backrest',
      unit: 'mm',
      min: 300,
      max: 600,
      step: 5,
      defaultValue: 400,
    },
    {
      id: 'backrestHeight',
      label: 'Backrest Height',
      type: 'number',
      section: 'Backrest',
      unit: 'mm',
      min: 300,
      max: 800,
      step: 10,
      defaultValue: 450,
    },
    {
      id: 'backrestThickness',
      label: 'Backrest Thickness',
      type: 'number',
      section: 'Backrest',
      unit: 'mm',
      min: 15,
      max: 60,
      step: 5,
      defaultValue: 30,
    },
    {
      id: 'backrestAngle',
      label: 'Recline Angle',
      type: 'number',
      section: 'Backrest',
      unit: 'deg',
      min: -5,
      max: 25,
      step: 1,
      defaultValue: 5,
    },
    {
      id: 'backrestShape',
      label: 'Backrest Shape',
      type: 'enum',
      section: 'Backrest',
      options: ['Flat', 'Curved', 'Slatted'],
      defaultValue: 'Flat',
    },
    // Legs
    {
      id: 'legThickness',
      label: 'Leg Thickness',
      type: 'number',
      section: 'Legs',
      unit: 'mm',
      min: 20,
      max: 80,
      step: 5,
      defaultValue: 35,
    },
    {
      id: 'legShape',
      label: 'Leg Shape',
      type: 'enum',
      section: 'Legs',
      options: ['Square', 'Round', 'Tapered'],
      defaultValue: 'Square',
    },
    {
      id: 'legAngle',
      label: 'Splay Angle',
      type: 'number',
      section: 'Legs',
      unit: 'deg',
      min: 0,
      max: 12,
      step: 0.5,
      defaultValue: 4,
    },
    {
      id: 'legInset',
      label: 'Leg Inset',
      type: 'number',
      section: 'Legs',
      unit: 'mm',
      min: 5,
      max: 60,
      step: 1,
      defaultValue: 15,
    },
    // Armrests
    {
      id: 'armrestsEnabled',
      label: 'Armrests Enabled',
      type: 'boolean',
      section: 'Armrests',
      defaultValue: false,
    },
    {
      id: 'armrestHeight',
      label: 'Armrest Height',
      type: 'number',
      section: 'Armrests',
      unit: 'mm',
      min: 150,
      max: 300,
      step: 5,
      defaultValue: 200,
      visible: (params) => !!params.armrestsEnabled,
    },
    {
      id: 'armrestLength',
      label: 'Armrest Length',
      type: 'number',
      section: 'Armrests',
      unit: 'mm',
      min: 200,
      max: 500,
      step: 10,
      defaultValue: 350,
      visible: (params) => !!params.armrestsEnabled,
    },
    {
      id: 'armrestThickness',
      label: 'Armrest Thickness',
      type: 'number',
      section: 'Armrests',
      unit: 'mm',
      min: 15,
      max: 50,
      step: 5,
      defaultValue: 25,
      visible: (params) => !!params.armrestsEnabled,
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
    // 1. Clamp seat dimensions
    const seatWidth = Math.max(350, Math.min(600, Number(params.seatWidth ?? 450)));
    const seatDepth = Math.max(350, Math.min(600, Number(params.seatDepth ?? 450)));
    const seatThickness = Math.max(15, Math.min(80, Number(params.seatThickness ?? 40)));
    const seatHeight = Math.max(350, Math.min(600, Number(params.seatHeight ?? 450)));
    const seatCornerRadius = Math.max(0, Math.min(100, Number(params.seatCornerRadius ?? 20)));

    // 2. Clamp backrest dimensions (Backrest width capped at seat width to avoid visual clipping)
    const backrestWidth = Math.max(300, Math.min(seatWidth, Number(params.backrestWidth ?? 400)));
    const backrestHeight = Math.max(300, Math.min(800, Number(params.backrestHeight ?? 450)));
    const backrestThickness = Math.max(15, Math.min(60, Number(params.backrestThickness ?? 30)));
    const backrestAngle = Math.max(-5, Math.min(25, Number(params.backrestAngle ?? 5))); // REQ-CHAIR-C01 / ASM-007

    // 3. Clamp legs splay and thickness
    const legThickness = Math.max(20, Math.min(80, Number(params.legThickness ?? 35)));
    const legAngle = Math.max(0, Math.min(12, Number(params.legAngle ?? 4))); // REQ-CHAIR-C03
    const maxLegInset = 0.35 * Math.min(seatWidth / 2, seatDepth / 2);
    const legInset = Math.max(5, Math.min(Math.min(60, maxLegInset), Number(params.legInset ?? 15)));

    // 4. Clamp armrest parameters (armrest length capped at seat depth)
    const armrestsEnabled = !!params.armrestsEnabled;
    const armrestHeight = Math.max(150, Math.min(300, Number(params.armrestHeight ?? 200)));
    const armrestLength = Math.max(200, Math.min(seatDepth, Number(params.armrestLength ?? 350)));
    const armrestThickness = Math.max(15, Math.min(50, Number(params.armrestThickness ?? 25)));

    // 5. Back-solve overall height (ASM-006): Seat Height + Backrest Height projected onto Y axis
    const height = seatHeight + backrestHeight * Math.cos(backrestAngle * Math.PI / 180);

    return {
      ...params,
      width: seatWidth,
      height,
      depth: seatDepth,
      seatWidth,
      seatDepth,
      seatThickness,
      seatHeight,
      seatCornerRadius,
      backrestWidth,
      backrestHeight,
      backrestThickness,
      backrestAngle,
      legThickness,
      legAngle,
      legInset,
      armrestsEnabled,
      armrestHeight,
      armrestLength,
      armrestThickness,
    };
  },

  deriveGeometry: (params) => {
    // Memoize geometry recomputation (Section 25)
    const cacheKeys = [
      'seatWidth', 'seatDepth', 'seatThickness', 'seatHeight', 'seatShape',
      'seatCornerRadius', 'backrestWidth', 'backrestHeight', 'backrestThickness',
      'backrestAngle', 'backrestShape', 'legThickness', 'legShape', 'legAngle',
      'legInset',
      'armrestsEnabled', 'armrestHeight', 'armrestLength', 'armrestThickness',
      'material', 'color', 'finish'
    ];
    const hasChanged = !lastChairParams || cacheKeys.some(k => lastChairParams[k] !== params[k]);
    if (!hasChanged) {
      return lastChairMeshes;
    }

    // Conversions to meters
    const sw = (params.seatWidth ?? 450) / 1000;
    const sd = (params.seatDepth ?? 450) / 1000;
    const st = (params.seatThickness ?? 40) / 1000;
    const sh = (params.seatHeight ?? 450) / 1000;
    const legInsetM = (params.legInset ?? 15) / 1000;
    const scr = (params.seatCornerRadius ?? 20) / 1000;

    const bw = (params.backrestWidth ?? 400) / 1000;
    const bh = (params.backrestHeight ?? 450) / 1000;
    const bt = (params.backrestThickness ?? 30) / 1000;
    const bAngleRad = (params.backrestAngle ?? 5) * Math.PI / 180;

    const lt = (params.legThickness ?? 35) / 1000;
    const lAngleRad = (params.legAngle ?? 4) * Math.PI / 180;

    const aw = (params.armrestThickness ?? 25) / 1000;
    const ah = (params.armrestHeight ?? 200) / 1000;
    const al = (params.armrestLength ?? 350) / 1000;

    const matProps = getMaterialProps(params.material ?? 'Wood', params.color ?? '#8b5a2b');
    const meshes: GeneratedMesh[] = [];

    // --- 1. SEAT GEOMETRY ---
    if (params.seatShape === 'Waterfall') {
      // Side profile in YZ plane extruded along X (width) to get an ergonomic drop
      const profile = new THREE.Shape();
      // Back-top
      profile.moveTo(0, st);
      // Back-bottom
      profile.lineTo(0, 0);
      // Bottom flat section
      profile.lineTo(sd - st, 0);
      // Curve downward (waterfall drop)
      profile.quadraticCurveTo(sd, 0, sd, -st * 0.8);
      // Front face
      profile.lineTo(sd, -st * 0.4);
      // Top curve transition
      profile.quadraticCurveTo(sd, st, sd - st, st);
      // Back to start
      profile.lineTo(0, st);

      meshes.push({
        id: 'seat',
        name: 'Seat',
        geometry: {
          type: 'extrude',
          shape: profile,
          options: { depth: sw, bevelEnabled: false },
        },
        material: matProps,
        position: [-sw / 2, sh - st, -sd / 2],
        rotation: [0, Math.PI / 2, 0], // Align extrusion direction (Z) with X axis
      });
    } else {
      // Square or Rounded shape: extrude a 2D path in XZ vertically
      const seatShape = new THREE.Shape();
      const halfW = sw / 2;
      const halfD = sd / 2;
      const r = params.seatShape === 'Rounded' ? Math.min(scr, Math.min(halfW, halfD)) : 0;

      if (r > 0) {
        seatShape.moveTo(-halfW + r, -halfD);
        seatShape.lineTo(halfW - r, -halfD);
        seatShape.absarc(halfW - r, -halfD + r, r, -Math.PI / 2, 0, false);
        seatShape.lineTo(halfW, halfD - r);
        seatShape.absarc(halfW - r, halfD - r, r, 0, Math.PI / 2, false);
        seatShape.lineTo(-halfW + r, halfD);
        seatShape.absarc(-halfW + r, halfD - r, r, Math.PI / 2, Math.PI, false);
        seatShape.lineTo(-halfW, -halfD + r);
        seatShape.absarc(-halfW + r, -halfD + r, r, Math.PI, Math.PI * 1.5, false);
      } else {
        seatShape.moveTo(-halfW, -halfD);
        seatShape.lineTo(halfW, -halfD);
        seatShape.lineTo(halfW, halfD);
        seatShape.lineTo(-halfW, halfD);
        seatShape.closePath();
      }

      meshes.push({
        id: 'seat',
        name: 'Seat',
        geometry: {
          type: 'extrude',
          shape: seatShape,
          options: { depth: st, bevelEnabled: false },
        },
        material: matProps,
        position: [0, sh - st, 0], // Recompute Y position to seat underside (REQ-CHAIR-FIX-001)
        rotation: [-Math.PI / 2, 0, 0],
      });
    }

    // --- 2. LEGS GEOMETRY (SPLAY + LEVELNESS per ASM-005) ---
    const seatBottomH = sh - st;
    // Calculate leg length adjusted for splay tilt to preserve seat bottom height
    const legLength = seatBottomH / (Math.cos(lAngleRad) * Math.cos(lAngleRad));
    const legHalfThickness = lt / 2;
    const legHalfW = legHalfThickness;
    const posX = sw / 2 - legInsetM - legHalfThickness; // Recompute attachment point using Leg Inset (REQ-CHAIR-FIX-002)
    const posZ = sd / 2 - legInsetM - legHalfThickness; // Recompute attachment point using Leg Inset (REQ-CHAIR-FIX-002)

    // We define leg mesh details, using parent rotations to pivot from connection points (seat corners)
    const legPlacements: { id: string; name: string; pos: [number, number, number]; rot: [number, number, number] }[] = [
      { id: 'leg_fl', name: 'Front Left Leg', pos: [-posX, seatBottomH, -posZ], rot: [-lAngleRad, 0, lAngleRad] },
      { id: 'leg_fr', name: 'Front Right Leg', pos: [posX, seatBottomH, -posZ], rot: [-lAngleRad, 0, -lAngleRad] },
      { id: 'leg_rl', name: 'Rear Left Leg', pos: [-posX, seatBottomH, posZ], rot: [lAngleRad, 0, lAngleRad] },
      { id: 'leg_rr', name: 'Rear Right Leg', pos: [posX, seatBottomH, posZ], rot: [lAngleRad, 0, -lAngleRad] },
    ];

    legPlacements.forEach((leg) => {
      // In Three.js pivot group rotation shifts the tilted leg mesh downward (pivoted at top)
      const meshRot: [number, number, number] = leg.rot;
      const legOffset: [number, number, number] = [0, -legLength / 2, 0];

      // Leg positions are tilted, let's derive coordinates dynamically
      // For this scaffolding step, we'll compose the splayed mesh directly
      // Math details: rotation matrix tilts leg and shifts center offset
      const cosX = Math.cos(meshRot[0]);
      const sinX = Math.sin(meshRot[0]);
      const cosZ = Math.cos(meshRot[2]);
      const sinZ = Math.sin(meshRot[2]);

      // Calculate the splayed leg center in world coordinates
      const worldX = leg.pos[0] + (legOffset[1] * sinZ * cosX);
      const worldY = leg.pos[1] + (legOffset[1] * cosZ * cosX);
      const worldZ = leg.pos[2] - (legOffset[1] * sinX);

      if (params.legShape === 'Round') {
        meshes.push({
          id: leg.id,
          name: leg.name,
          geometry: {
            type: 'cylinder',
            args: [legHalfW, legHalfW, legLength, 16],
          },
          material: matProps,
          position: [worldX, worldY, worldZ],
          rotation: [meshRot[0], 0, meshRot[2]],
        });
      } else if (params.legShape === 'Tapered') {
        const radiusTop = lt / Math.sqrt(2);
        const radiusBottom = (lt * (1 - (params.taperRatio ?? 0))) / Math.sqrt(2);
        
        meshes.push({
          id: leg.id,
          name: leg.name,
          geometry: {
            type: 'cylinder',
            args: [radiusTop, radiusBottom, legLength, 4],
          },
          material: matProps,
          position: [worldX, worldY, worldZ],
          rotation: [meshRot[0], Math.PI / 4, meshRot[2]],
        });
      } else {
        // Square leg
        meshes.push({
          id: leg.id,
          name: leg.name,
          geometry: {
            type: 'box',
            args: [lt, legLength, lt],
          },
          material: matProps,
          position: [worldX, worldY, worldZ],
          rotation: [meshRot[0], 0, meshRot[2]],
        });
      }
    });

    // --- 3. BACKREST GEOMETRY (ROTATION AROUND PIVOT per REQ-CHAIR-002) ---
    // Pivot sits at [0, sh, sd / 2] (rear seat top edge).
    // Recline angle pivots the mesh back.
    const pivotY = sh;
    const pivotZ = sd / 2;

    // Apply rotation around pivot to find backrest mesh center
    const localOffsetY = bh / 2;
    const localOffsetZ = -bt / 2; // Position slightly back so front face meets the pivot line

    const backrestWorldY = pivotY + (localOffsetY * Math.cos(bAngleRad)) - (localOffsetZ * Math.sin(bAngleRad));
    const backrestWorldZ = pivotZ + (localOffsetY * Math.sin(bAngleRad)) + (localOffsetZ * Math.cos(bAngleRad));

    if (params.backrestShape === 'Slatted') {
      // Generate 5 vertical slats spaced evenly across backrestWidth
      const slatsCount = 5;
      const slatW = bw / (slatsCount * 2 - 1);
      const startX = -bw / 2 + slatW / 2;
      const spacingX = slatW * 2;

      for (let i = 0; i < slatsCount; i++) {
        const localX = startX + i * spacingX;
        meshes.push({
          id: `backrest_slat_${i}`,
          name: `Backrest Slat ${i + 1}`,
          geometry: {
            type: 'box',
            args: [slatW, bh, bt],
          },
          material: matProps,
          position: [localX, backrestWorldY, backrestWorldZ],
          rotation: [bAngleRad, 0, 0],
        });
      }
    } else if (params.backrestShape === 'Curved') {
      // Horizontal plywood profile (curved XZ) extruded vertically by backrestHeight
      const curveShape = new THREE.Shape();
      const halfBW = bw / 2;
      
      // Draw a curved profile representing ergonomic lumbar hug (depth 20mm)
      curveShape.moveTo(-halfBW, 0);
      curveShape.quadraticCurveTo(0, -0.02, halfBW, 0);
      curveShape.lineTo(halfBW, -bt);
      curveShape.quadraticCurveTo(0, -0.02 - bt, -halfBW, -bt);
      curveShape.closePath();

      meshes.push({
        id: 'backrest',
        name: 'Backrest',
        geometry: {
          type: 'extrude',
          shape: curveShape,
          options: { depth: bh, bevelEnabled: false },
        },
        material: matProps,
        // Since we extrude vertically, we rotate and translate accordingly
        position: [0, backrestWorldY, backrestWorldZ],
        rotation: [-Math.PI / 2 + bAngleRad, 0, 0],
      });
    } else {
      // Standard Flat Backrest
      meshes.push({
        id: 'backrest',
        name: 'Backrest',
        geometry: {
          type: 'box',
          args: [bw, bh, bt],
        },
        material: matProps,
        position: [0, backrestWorldY, backrestWorldZ],
        rotation: [bAngleRad, 0, 0],
      });
    }

    // --- 4. ARMREST GEOMETRY (REQ-CHAIR-004) ---
    if (params.armrestsEnabled) {
      const armPlacements = [
        { id: 'left', posX: -sw / 2 + aw / 2 },
        { id: 'right', posX: sw / 2 - aw / 2 },
      ];

      armPlacements.forEach((arm) => {
        // Horizontal top bar running front-to-back starting at the rear edge (sd/2)
        const barY = sh + ah;
        const barZ = sd / 2 - al / 2;
        
        meshes.push({
          id: `armrest_bar_${arm.id}`,
          name: `${arm.id === 'left' ? 'Left' : 'Right'} Armrest Bar`,
          geometry: {
            type: 'box',
            args: [aw, aw, al],
          },
          material: matProps,
          position: [arm.posX, barY, barZ],
        });

        // Vertical support legs to prevent floating armrests (REQ-CHAIR-004)
        // Rear support connects seat top back to armrest back
        meshes.push({
          id: `armrest_support_rear_${arm.id}`,
          name: `${arm.id === 'left' ? 'Left' : 'Right'} Rear Armrest Support`,
          geometry: {
            type: 'box',
            args: [aw, ah, aw],
          },
          material: matProps,
          position: [arm.posX, sh + ah / 2, sd / 2 - aw / 2],
        });

        // Front support connects seat top front to armrest front
        meshes.push({
          id: `armrest_support_front_${arm.id}`,
          name: `${arm.id === 'left' ? 'Left' : 'Right'} Front Armrest Support`,
          geometry: {
            type: 'box',
            args: [aw, ah, aw],
          },
          material: matProps,
          position: [arm.posX, sh + ah / 2, sd / 2 - al + aw / 2],
        });
      });
    }

    lastChairParams = { ...params };
    lastChairMeshes = meshes;
    return meshes;
  },

  hierarchy: (params) => {
    const children: HierarchyNode[] = [
      { id: 'seat', label: 'Seat', icon: 'box', componentFamily: 'seat' },
    ];

    // Slat back vs Single backrest node
    if (params.backrestShape === 'Slatted') {
      const slatNodes: HierarchyNode[] = [];
      for (let i = 0; i < 5; i++) {
        slatNodes.push({ 
          id: `backrest_slat_${i}`, 
          label: `Backrest Slat ${i + 1}`, 
          icon: 'box',
          componentFamily: 'backrest-slat',
          componentRole: `slat-${i}`
        });
      }
      children.push({
        id: 'backrest_group',
        label: 'Backrest (Slatted)',
        icon: 'list-tree',
        children: slatNodes,
        componentFamily: 'backrest_group',
      });
    } else {
      children.push({
        id: 'backrest',
        label: 'Backrest',
        icon: 'box',
        componentFamily: 'backrest',
      });
    }

    // Legs group
    const legNodes: HierarchyNode[] = [
      { id: 'leg_fl', label: 'Front Left Leg', icon: 'cylinder', componentFamily: 'chair-leg', componentRole: 'front-left' },
      { id: 'leg_fr', label: 'Front Right Leg', icon: 'cylinder', componentFamily: 'chair-leg', componentRole: 'front-right' },
      { id: 'leg_rl', label: 'Rear Left Leg', icon: 'cylinder', componentFamily: 'chair-leg', componentRole: 'rear-left' },
      { id: 'leg_rr', label: 'Rear Right Leg', icon: 'cylinder', componentFamily: 'chair-leg', componentRole: 'rear-right' },
    ];

    children.push({
      id: 'legs_group',
      label: 'Legs',
      icon: 'list-tree',
      children: legNodes,
      componentFamily: 'legs_group',
    });

    // Armrests (present only if enabled) (REQ-CHAIR-004)
    if (params.armrestsEnabled) {
      const armNodes: HierarchyNode[] = [
        { id: 'armrest_bar_left', label: 'Left Armrest Bar', icon: 'box', componentFamily: 'armrest-bar', componentRole: 'left' },
        { id: 'armrest_support_rear_left', label: 'Left Rear Support', icon: 'box', componentFamily: 'armrest-support-rear', componentRole: 'left' },
        { id: 'armrest_support_front_left', label: 'Left Front Support', icon: 'box', componentFamily: 'armrest-support-front', componentRole: 'left' },
        { id: 'armrest_bar_right', label: 'Right Armrest Bar', icon: 'box', componentFamily: 'armrest-bar', componentRole: 'right' },
        { id: 'armrest_support_rear_right', label: 'Right Rear Support', icon: 'box', componentFamily: 'armrest-support-rear', componentRole: 'right' },
        { id: 'armrest_support_front_right', label: 'Right Front Support', icon: 'box', componentFamily: 'armrest-support-front', componentRole: 'right' },
      ];
      children.push({
        id: 'armrests_group',
        label: 'Armrests',
        icon: 'list-tree',
        children: armNodes,
        componentFamily: 'armrests_group',
      });
    }

    return {
      id: 'chair',
      label: 'Chair',
      icon: 'armchair',
      children,
    };
  },

  presets: [
    {
      id: 'basic_chair',
      label: 'Basic Chair',
      params: {
        seatWidth: 420,
        seatDepth: 420,
        seatThickness: 35,
        seatHeight: 450,
        seatShape: 'Square',
        seatCornerRadius: 0,
        backrestWidth: 380,
        backrestHeight: 400,
        backrestThickness: 25,
        backrestAngle: 5,
        backrestShape: 'Flat',
        legThickness: 30,
        legShape: 'Square',
        legAngle: 2,
        legInset: 15,
        armrestsEnabled: false,
        armrestHeight: 200,
        armrestLength: 320,
        armrestThickness: 20,
        material: 'Wood',
        color: '#8b5a2b',
        finish: 'Matte',
      },
    },
    {
      id: 'dining_chair',
      label: 'Dining Chair',
      params: {
        seatWidth: 450,
        seatDepth: 440,
        seatThickness: 40,
        seatHeight: 460,
        seatShape: 'Rounded',
        seatCornerRadius: 20,
        backrestWidth: 400,
        backrestHeight: 480,
        backrestThickness: 25,
        backrestAngle: 7,
        backrestShape: 'Slatted',
        legThickness: 35,
        legShape: 'Tapered',
        legAngle: 3,
        legInset: 15,
        armrestsEnabled: false,
        armrestHeight: 200,
        armrestLength: 350,
        armrestThickness: 25,
        material: 'Wood',
        color: '#5c4033',
        finish: 'Satin',
      },
    },
    {
      id: 'stool',
      label: 'Stool',
      params: {
        seatWidth: 380,
        seatDepth: 380,
        seatThickness: 30,
        seatHeight: 650, // Tall bar stool
        seatShape: 'Rounded',
        seatCornerRadius: 40,
        backrestWidth: 300,
        backrestHeight: 150, // Low back rest
        backrestThickness: 20,
        backrestAngle: 0,
        backrestShape: 'Flat',
        legThickness: 30,
        legShape: 'Round',
        legAngle: 6, // High splay for stool stability
        legInset: 10,
        armrestsEnabled: false,
        armrestHeight: 200,
        armrestLength: 300,
        armrestThickness: 20,
        material: 'Metal',
        color: '#1e293b',
        finish: 'Matte',
      },
    },
    {
      id: 'armchair',
      label: 'Armchair',
      params: {
        seatWidth: 550,
        seatDepth: 520,
        seatThickness: 60,
        seatHeight: 400, // Low lounge style
        seatShape: 'Rounded',
        seatCornerRadius: 30,
        backrestWidth: 500,
        backrestHeight: 520,
        backrestThickness: 40,
        backrestAngle: 12, // High recline
        backrestShape: 'Curved',
        legThickness: 45,
        legShape: 'Round',
        legAngle: 5,
        legInset: 20,
        armrestsEnabled: true,
        armrestHeight: 220,
        armrestLength: 460,
        armrestThickness: 35,
        material: 'Plastic',
        color: '#e11d48', // Vibrant red plastic lounge chair
        finish: 'Glossy',
      },
    },
  ],
};
