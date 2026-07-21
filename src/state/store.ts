import { create } from 'zustand';
import { objectRegistry, ObjectDefinitionModule } from '../objects';

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

  // Actions
  setSelectedObjectType: (type: string) => void;
  updateParam: (paramId: string, value: any) => void;
  setSelection: (scope: SelectionScope) => void;
  applyPreset: (presetId: string) => void;
  resetObject: () => void;
  randomizeObject: () => void;
  clearWarning: (paramId: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  selectedObjectType: 'table',
  currentParams: {},
  selectionScope: { type: 'object', id: 'table' },
  activePresetId: null,
  warningMessages: {},

  setSelectedObjectType: (type) => {
    const module = objectRegistry[type];
    if (!module) return;

    // Reset selection scope to Object-level (REQ-SEL-003 step 6)
    set({
      selectedObjectType: type,
      currentParams: { ...module.defaultParams },
      selectionScope: { type: 'object', id: type },
      activePresetId: null,
      warningMessages: {},
    });
  },

  updateParam: (paramId, value) => {
    const { selectedObjectType, currentParams } = get();
    const module = objectRegistry[selectedObjectType];
    if (!module) return;

    // Merge new value and apply constraints (REQ-VALID-001/003)
    const newParams = { ...currentParams, [paramId]: value };
    const clampedParams = module.constraints(newParams);

    // Track any clamped/adjusted fields to show warnings if they changed from what was input (REQ-VALID-003/004)
    const warnings: Record<string, string> = { ...get().warningMessages };
    if (clampedParams[paramId] !== value) {
      warnings[paramId] = `Value clamped to ${clampedParams[paramId]} due to geometry constraints`;
    }

    set({
      currentParams: clampedParams,
      warningMessages: warnings,
    });
  },

  setSelection: (scope) => {
    set({ selectionScope: scope });
  },

  applyPreset: (presetId) => {
    const { selectedObjectType } = get();
    const module = objectRegistry[selectedObjectType];
    if (!module) return;

    const preset = module.presets.find((p) => p.id === presetId);
    if (!preset) return;

    set({
      currentParams: { ...preset.params },
      activePresetId: presetId,
      warningMessages: {},
    });
  },

  resetObject: () => {
    const { selectedObjectType, activePresetId } = get();
    const module = objectRegistry[selectedObjectType];
    if (!module) return;

    if (activePresetId) {
      // Restore to active preset's baseline (REQ-RESET-001)
      const preset = module.presets.find((p) => p.id === activePresetId);
      if (preset) {
        set({
          currentParams: { ...preset.params },
          warningMessages: {},
        });
        return;
      }
    }

    // Default factory reset
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

    // Call module's randomize logic (if implemented) or use default factory defaults.
    // For now, this is a placeholder randomize operation that maintains the object type (REQ-RAND-002)
    set({
      currentParams: { ...module.defaultParams },
      warningMessages: {},
    });
  },

  clearWarning: (paramId) => {
    const warnings = { ...get().warningMessages };
    delete warnings[paramId];
    set({ warningMessages: warnings });
  },
}));
