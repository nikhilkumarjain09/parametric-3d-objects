import { ObjectDefinitionModule } from '../types';

export const mugModule: ObjectDefinitionModule = {
  id: 'mug',
  label: 'Mug',
  icon: 'coffee',
  defaultParams: {},
  paramSchema: [],
  constraints: (params) => params,
  deriveGeometry: () => [],
  hierarchy: () => ({
    id: 'mug',
    label: 'Mug',
    icon: 'coffee',
  }),
  presets: [],
};
