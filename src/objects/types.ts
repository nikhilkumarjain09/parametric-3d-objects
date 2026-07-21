/* Types and interfaces for the Object Definition Modules */

export type ParamType = 'number' | 'enum' | 'boolean' | 'color';

export interface ParamSchemaItem {
  id: string;
  label: string;
  type: ParamType;
  section: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  defaultValue: any;
  /**
   * Evaluates whether the parameter is active and should be visible
   * based on the current values of all parameters (satisfying REQ-INSP-004).
   */
  visible?: (params: Record<string, any>) => boolean;
}

export interface Preset {
  id: string;
  label: string;
  params: Record<string, any>;
}

export interface HierarchyNode {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  children?: HierarchyNode[];
  componentFamily?: string;
  componentRole?: string;
}

export interface GeneratedMesh {
  id: string;
  name: string;
  geometry: any; // We'll use Three.BufferGeometry or similar during execution
  material: any; // Three.Material or similar
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export interface ObjectDefinitionModule {
  id: string;
  label: string;
  icon: string; // Lucide icon name reference per design-and-settings.md Section 10
  defaultParams: Record<string, any>;
  paramSchema: ParamSchemaItem[];
  
  /**
   * Validates and clamps a parameter set, returning a clean valid set.
   * Enforces constraints proactively and reactively (REQ-VALID-001/002/003).
   */
  constraints: (params: Record<string, any>) => Record<string, any>;
  
  /**
   * Generates or derives the 3D meshes for the current parameters.
   * Strictly procedural, does not scale whole objects (REQ-PARAM-001, REQ-EXT-001).
   */
  deriveGeometry: (params: Record<string, any>) => GeneratedMesh[];
  
  /**
   * Builds the component hierarchy tree for the current parameters (REQ-HIER-001/003).
   */
  hierarchy: (params: Record<string, any>) => HierarchyNode;
  
  presets: Preset[];
}
