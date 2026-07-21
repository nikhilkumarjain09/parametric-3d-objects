import { ObjectDefinitionModule } from '../types';

export const chairModule: ObjectDefinitionModule = {
  id: 'chair',
  label: 'Chair',
  icon: 'armchair',
  defaultParams: {},
  paramSchema: [],
  constraints: (params) => params,
  deriveGeometry: () => [],
  hierarchy: () => ({
    id: 'chair',
    label: 'Chair',
    icon: 'armchair',
  }),
  presets: [],
};
