import { ObjectDefinitionModule } from '../types';

export const tableModule: ObjectDefinitionModule = {
  id: 'table',
  label: 'Table',
  icon: 'table-2',
  defaultParams: {},
  paramSchema: [],
  constraints: (params) => params,
  deriveGeometry: () => [],
  hierarchy: () => ({
    id: 'table',
    label: 'Table',
    icon: 'table-2',
  }),
  presets: [],
};
