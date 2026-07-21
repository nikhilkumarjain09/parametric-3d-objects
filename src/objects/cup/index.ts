import { ObjectDefinitionModule } from '../types';

export const cupModule: ObjectDefinitionModule = {
  id: 'cup',
  label: 'Cup',
  icon: 'cup-soda',
  defaultParams: {},
  paramSchema: [],
  constraints: (params) => params,
  deriveGeometry: () => [],
  hierarchy: () => ({
    id: 'cup',
    label: 'Cup',
    icon: 'cup-soda',
  }),
  presets: [],
};
