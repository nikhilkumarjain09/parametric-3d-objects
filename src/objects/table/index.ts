import { ObjectDefinitionModule } from '../types';

export const tableModule: ObjectDefinitionModule = {
  id: 'table',
  label: 'Table',
  icon: 'table-2',
  defaultParams: {
    width: 1200,
    height: 750,
    depth: 800,
  },
  paramSchema: [
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
    },
  ],
  constraints: (params) => {
    return {
      width: Math.max(600, Math.min(2400, Number(params.width ?? 1200))),
      height: Math.max(400, Math.min(1200, Number(params.height ?? 750))),
      depth: Math.max(600, Math.min(1600, Number(params.depth ?? 800))),
    };
  },
  deriveGeometry: (params) => {
    const w = (params.width ?? 1200) / 1000;
    const h = (params.height ?? 750) / 1000;
    const d = (params.depth ?? 800) / 1000;
    return [
      {
        id: 'table-placeholder',
        name: 'Table Placeholder',
        geometry: { type: 'box', args: [w, h, d] },
        material: { color: '#0d9488' },
        position: [0, h / 2, 0],
      },
    ];
  },
  hierarchy: () => ({
    id: 'table',
    label: 'Table',
    icon: 'table-2',
  }),
  presets: [
    {
      id: 'standard_table',
      label: 'Standard Table',
      params: { width: 1200, height: 750, depth: 800 },
    },
    {
      id: 'dining_table',
      label: 'Dining Table',
      params: { width: 1600, height: 750, depth: 900 },
    },
    {
      id: 'coffee_table',
      label: 'Coffee Table',
      params: { width: 1000, height: 450, depth: 600 },
    },
    {
      id: 'round_table',
      label: 'Round Table',
      params: { width: 1000, height: 750, depth: 1000 },
    },
  ],
};
