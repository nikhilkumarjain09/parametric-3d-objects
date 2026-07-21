import { create } from 'zustand';
import { objectRegistry } from '../objects';

export interface SelectionScope {
  type: 'object' | 'component';
  id: string; // The ID of the object or component
}

interface AppState {
  selectedObjectType: string;
  currentParams: Record<string, any>;
  selectionScope: SelectionScope;
  activePresetId: string | null;
  warningMessages: Record<string, string>;

  // Viewport Settings (Section 4 & 6)
  gridEnabled: boolean;
  boundingBoxEnabled: boolean;
  shadingMode: 'solid' | 'wireframe';
  cameraAction: 'none' | 'frame-selected' | 'reset-view';
  cameraActionId: number; // Incremented to notify canvas ref changes

  // Responsive Drawer States (Section 16)
  hierarchyDrawerOpen: boolean;
  inspectorDrawerOpen: boolean;
  activeMobileTab: 'hierarchy' | 'inspector';

  // Transform & Alignment states (Section 5, 8, 11)
  editMode: 'parametric' | 'component';
  selectedComponentIds: string[];
  activeReferenceComponentId: string | null;
  transformMode: 'translate' | 'rotate' | 'scale';
  transformSpace: 'local' | 'world';
  translationSnap: number;
  rotationSnap: number;
  scaleSnap: number;
  isDraggingGizmo: boolean;
  componentOverrides: Record<string, Record<string, {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
  }>>;

  // Actions
  setSelectedObjectType: (type: string) => void;
  updateParam: (paramId: string, value: any) => void;
  setSelection: (scope: SelectionScope) => void;
  applyPreset: (presetId: string) => void;
  resetObject: () => void;
  randomizeObject: () => void;
  clearWarning: (paramId: string) => void;

  // Viewport Actions
  toggleGrid: () => void;
  toggleBoundingBox: () => void;
  setShadingMode: (mode: 'solid' | 'wireframe') => void;
  triggerFrameSelected: () => void;
  triggerResetView: () => void;
  clearCameraAction: () => void;

  // Drawer Actions
  setHierarchyDrawerOpen: (open: boolean) => void;
  setInspectorDrawerOpen: (open: boolean) => void;
  setActiveMobileTab: (tab: 'hierarchy' | 'inspector') => void;

  // Transform Actions
  setEditMode: (mode: 'parametric' | 'component') => void;
  setSelectedComponentIds: (ids: string[]) => void;
  setActiveReferenceComponentId: (id: string | null) => void;
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
  setTransformSpace: (space: 'local' | 'world') => void;
  setTranslationSnap: (snap: number) => void;
  setRotationSnap: (snap: number) => void;
  setScaleSnap: (snap: number) => void;
  setIsDraggingGizmo: (dragging: boolean) => void;
  updateTransformOverride: (componentId: string, transform: {
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z: number };
  }) => void;
  updateTransformOverridesBatch: (batch: Record<string, {
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z: number };
  }>) => void;
  resetComponentTransform: (componentId: string) => void;
  resetAllComponentTransforms: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  selectedObjectType: 'table',
  currentParams: { ...objectRegistry['table'].defaultParams },
  selectionScope: { type: 'object', id: 'table' },
  activePresetId: null,
  warningMessages: {},

  // Default Viewport Settings (ASM-019)
  gridEnabled: true,
  boundingBoxEnabled: false,
  shadingMode: 'solid',
  cameraAction: 'none',
  cameraActionId: 0,

  // Responsive Drawer States Defaults
  hierarchyDrawerOpen: false,
  inspectorDrawerOpen: false,
  activeMobileTab: 'hierarchy',

  // Default Transform & Alignment states
  editMode: 'parametric',
  selectedComponentIds: [],
  activeReferenceComponentId: null,
  transformMode: 'translate',
  transformSpace: 'local',
  translationSnap: 0,
  rotationSnap: 0,
  scaleSnap: 0,
  isDraggingGizmo: false,
  componentOverrides: {},

  setSelectedObjectType: (type) => {
    const module = objectRegistry[type];
    if (!module) return;

    // Reset selection scope to Object-level, reset warnings, trigger default auto-frame on first load
    set({
      selectedObjectType: type,
      currentParams: { ...module.defaultParams },
      selectionScope: { type: 'object', id: type },
      activePresetId: null,
      warningMessages: {},
      cameraAction: 'reset-view',
      cameraActionId: get().cameraActionId + 1,
      // Auto close drawers on object change for better usability
      hierarchyDrawerOpen: false,
      inspectorDrawerOpen: false,
      editMode: 'parametric',
      selectedComponentIds: [],
      activeReferenceComponentId: null,
    });
  },

  updateParam: (paramId, value) => {
    const { selectedObjectType, currentParams } = get();
    const module = objectRegistry[selectedObjectType];
    if (!module) return;

    // Merge new value and apply constraints
    const newParams = { ...currentParams, [paramId]: value };
    const clampedParams = module.constraints(newParams);

    // Track clamped/adjusted fields to show warnings (Section 20 / REQ-VALID-003)
    const warnings: Record<string, string> = {};
    
    // Check all keys in the schema to identify both direct clamping and reactive/dependent clamping
    module.paramSchema.forEach((param) => {
      const id = param.id;
      const prevVal = currentParams[id];
      const clampedVal = clampedParams[id];

      if (id === paramId) {
        // Direct clamping on the edited field
        if (clampedVal !== value) {
          warnings[id] = `Clamped to ${clampedVal}${param.unit ? ' ' + param.unit : ''} (limit reached)`;
        }
      } else {
        // Reactive/dependent clamping on other fields
        if (clampedVal !== prevVal) {
          warnings[id] = `Auto-adjusted to ${clampedVal}${param.unit ? ' ' + param.unit : ''} by constraint`;
        }
      }
    });

    set({
      currentParams: clampedParams,
      warningMessages: warnings,
    });
  },

  setSelection: (scope) => {
    set({ selectionScope: scope });
  },

  applyPreset: (presetId) => {
    const { selectedObjectType, componentOverrides } = get();
    const module = objectRegistry[selectedObjectType];
    if (!module) return;

    const preset = module.presets.find((p) => p.id === presetId);
    if (!preset) return;

    set({
      currentParams: { ...preset.params },
      activePresetId: presetId,
      warningMessages: {},
      selectedComponentIds: [],
      activeReferenceComponentId: null,
      componentOverrides: {
        ...componentOverrides,
        [selectedObjectType]: {},
      },
    });
  },

  resetObject: () => {
    const { selectedObjectType, activePresetId } = get();
    const module = objectRegistry[selectedObjectType];
    if (!module) return;

    if (activePresetId) {
      const preset = module.presets.find((p) => p.id === activePresetId);
      if (preset) {
        set({
          currentParams: { ...preset.params },
          warningMessages: {},
        });
        return;
      }
    }

    set({
      currentParams: { ...module.defaultParams },
      activePresetId: null,
      warningMessages: {},
    });
  },

  randomizeObject: () => {
    const { selectedObjectType } = get();
    const module = objectRegistry[selectedObjectType];
    if (!module) return;

    const randomized: Record<string, any> = {};
    module.paramSchema.forEach((param) => {
      if (param.type === 'number') {
        const min = param.min ?? 0;
        const max = param.max ?? 100;
        const step = param.step ?? 1;
        const range = max - min;
        const raw = min + Math.random() * range;
        const stepped = Math.round(raw / step) * step;
        randomized[param.id] = Math.max(min, Math.min(max, stepped));
      } else if (param.type === 'enum') {
        const options = param.options ?? [];
        if (options.length > 0) {
          const idx = Math.floor(Math.random() * options.length);
          randomized[param.id] = options[idx];
        }
      } else if (param.type === 'boolean') {
        randomized[param.id] = Math.random() > 0.5;
      } else if (param.type === 'color') {
        const colors = ['#f8fafc', '#1e293b', '#8b5a2b', '#5c4033', '#cbd5e1', '#0d9488', '#e11d48', '#f59e0b'];
        const idx = Math.floor(Math.random() * colors.length);
        randomized[param.id] = colors[idx];
      }
    });

    const clamped = module.constraints(randomized);

    set({
      currentParams: clamped,
      activePresetId: null,
      warningMessages: {},
    });
  },

  clearWarning: (paramId) => {
    const warnings = { ...get().warningMessages };
    delete warnings[paramId];
    set({ warningMessages: warnings });
  },

  // Viewport Settings actions
  toggleGrid: () => {
    set((state) => ({ gridEnabled: !state.gridEnabled }));
  },

  toggleBoundingBox: () => {
    set((state) => ({ boundingBoxEnabled: !state.boundingBoxEnabled }));
  },

  setShadingMode: (mode) => {
    set({ shadingMode: mode });
  },

  triggerFrameSelected: () => {
    set((state) => ({
      cameraAction: 'frame-selected',
      cameraActionId: state.cameraActionId + 1,
    }));
  },

  triggerResetView: () => {
    set((state) => ({
      cameraAction: 'reset-view',
      cameraActionId: state.cameraActionId + 1,
    }));
  },

  clearCameraAction: () => {
    set({ cameraAction: 'none' });
  },

  // Responsive Drawer Actions
  setHierarchyDrawerOpen: (open) => {
    set({ 
      hierarchyDrawerOpen: open,
      // Exclusive drawer focus: close inspector if hierarchy opens
      inspectorDrawerOpen: open ? false : get().inspectorDrawerOpen
    });
  },

  setInspectorDrawerOpen: (open) => {
    set({ 
      inspectorDrawerOpen: open,
      // Exclusive drawer focus: close hierarchy if inspector opens
      hierarchyDrawerOpen: open ? false : get().hierarchyDrawerOpen
    });
  },

  setActiveMobileTab: (tab) => {
    set({ activeMobileTab: tab });
  },

  // Transform Actions implementation
  setEditMode: (mode) => set({ editMode: mode }),
  setSelectedComponentIds: (ids) => set({ selectedComponentIds: ids }),
  setActiveReferenceComponentId: (id) => set({ activeReferenceComponentId: id }),
  setTransformMode: (mode) => set({ transformMode: mode }),
  setTransformSpace: (space) => set({ transformSpace: space }),
  setTranslationSnap: (snap) => set({ translationSnap: snap }),
  setRotationSnap: (snap) => set({ rotationSnap: snap }),
  setScaleSnap: (snap) => set({ scaleSnap: snap }),
  setIsDraggingGizmo: (dragging) => set({ isDraggingGizmo: dragging }),
  updateTransformOverride: (componentId, transform) => {
    const { selectedObjectType, componentOverrides } = get();
    const currentObjOverrides = componentOverrides[selectedObjectType] || {};
    const currentOverride = currentObjOverrides[componentId] || {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    };

    const newOverride = {
      position: {
        x: transform.position?.x !== undefined ? transform.position.x : currentOverride.position.x,
        y: transform.position?.y !== undefined ? transform.position.y : currentOverride.position.y,
        z: transform.position?.z !== undefined ? transform.position.z : currentOverride.position.z,
      },
      rotation: {
        x: transform.rotation?.x !== undefined ? transform.rotation.x : currentOverride.rotation.x,
        y: transform.rotation?.y !== undefined ? transform.rotation.y : currentOverride.rotation.y,
        z: transform.rotation?.z !== undefined ? transform.rotation.z : currentOverride.rotation.z,
      },
      scale: {
        x: transform.scale?.x !== undefined ? transform.scale.x : currentOverride.scale.x,
        y: transform.scale?.y !== undefined ? transform.scale.y : currentOverride.scale.y,
        z: transform.scale?.z !== undefined ? transform.scale.z : currentOverride.scale.z,
      },
    };

    set({
      componentOverrides: {
        ...componentOverrides,
        [selectedObjectType]: {
          ...currentObjOverrides,
          [componentId]: newOverride,
        },
      },
    });
  },
  updateTransformOverridesBatch: (batch) => {
    const { selectedObjectType, componentOverrides } = get();
    const currentObjOverrides = { ...(componentOverrides[selectedObjectType] || {}) };
    
    Object.entries(batch).forEach(([componentId, transform]) => {
      const currentOverride = currentObjOverrides[componentId] || {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      };
      currentObjOverrides[componentId] = {
        position: {
          x: transform.position?.x !== undefined ? transform.position.x : currentOverride.position.x,
          y: transform.position?.y !== undefined ? transform.position.y : currentOverride.position.y,
          z: transform.position?.z !== undefined ? transform.position.z : currentOverride.position.z,
        },
        rotation: {
          x: transform.rotation?.x !== undefined ? transform.rotation.x : currentOverride.rotation.x,
          y: transform.rotation?.y !== undefined ? transform.rotation.y : currentOverride.rotation.y,
          z: transform.rotation?.z !== undefined ? transform.rotation.z : currentOverride.rotation.z,
        },
        scale: {
          x: transform.scale?.x !== undefined ? transform.scale.x : currentOverride.scale.x,
          y: transform.scale?.y !== undefined ? transform.scale.y : currentOverride.scale.y,
          z: transform.scale?.z !== undefined ? transform.scale.z : currentOverride.scale.z,
        },
      };
    });

    set({
      componentOverrides: {
        ...componentOverrides,
        [selectedObjectType]: currentObjOverrides,
      },
    });
  },
  resetComponentTransform: (componentId) => {
    const { selectedObjectType, componentOverrides } = get();
    const currentObjOverrides = { ...(componentOverrides[selectedObjectType] || {}) };
    delete currentObjOverrides[componentId];
    set({
      componentOverrides: {
        ...componentOverrides,
        [selectedObjectType]: currentObjOverrides,
      },
    });
  },
  resetAllComponentTransforms: () => {
    const { selectedObjectType, componentOverrides } = get();
    set({
      componentOverrides: {
        ...componentOverrides,
        [selectedObjectType]: {},
      },
    });
  },
}));
