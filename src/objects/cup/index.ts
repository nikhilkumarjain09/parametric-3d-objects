import { ObjectDefinitionModule } from '../types';

export const cupModule: ObjectDefinitionModule = {
  id: 'cup',
  label: 'Cup',
  icon: 'cup-soda',
  defaultParams: {
    width: 80,
    height: 100,
    depth: 80,
  },
  paramSchema: [
    {
      id: 'width',
      label: 'Width',
      type: 'number',
      section: 'Dimensions',
      unit: 'mm',
      min: 30,
      max: 200,
      step: 2,
      defaultValue: 80,
    },
    {
      id: 'height',
      label: 'Height',
      type: 'number',
      section: 'Dimensions',
      unit: 'mm',
      min: 50,
      max: 250,
      step: 5,
      defaultValue: 100,
    },
    {
      id: 'depth',
      label: 'Depth',
      type: 'number',
      section: 'Dimensions',
      unit: 'mm',
      min: 30,
      max: 200,
      step: 2,
      defaultValue: 80,
    },
  ],
  constraints: (params) => {
    return {
      width: Math.max(30, Math.min(200, Number(params.width ?? 80))),
      height: Math.max(50, Math.min(250, Number(params.height ?? 100))),
      depth: Math.max(30, Math.min(200, Number(params.depth ?? 80))),
    };
  },
  deriveGeometry: (params) => {
    const w = (params.width ?? 80) / 1000;
    const h = (params.height ?? 100) / 1000;
    const d = (params.depth ?? 80) / 1000;
    return [
      {
        id: 'cup-placeholder',
        name: 'Cup Placeholder',
        geometry: { type: 'box', args: [w, h, d] },
        material: { color: '#10b981' },
        position: [0, h / 2, 0],
      },
    ];
  },
  hierarchy: () => ({
    id: 'cup',
    label: 'Cup',
    icon: 'cup-soda',
  }),
  presets: [
    {
      id: 'standard_cup',
      label: 'Standard Cup',
      params: { width: 80, height: 100, depth: 80 },
    },
    {
      id: 'tall_cup',
      label: 'Tall Cup',
      params: { width: 70, height: 150, depth: 70 },
    },
    {
      id: 'wide_cup',
      label: 'Wide Cup',
      params: { width: 100, height: 80, depth: 100 },
    },
  ],
};
