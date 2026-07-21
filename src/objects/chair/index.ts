import { ObjectDefinitionModule } from '../types';

export const chairModule: ObjectDefinitionModule = {
  id: 'chair',
  label: 'Chair',
  icon: 'armchair',
  defaultParams: {
    width: 500,
    height: 900,
    depth: 500,
  },
  paramSchema: [
    {
      id: 'width',
      label: 'Width',
      type: 'number',
      section: 'Dimensions',
      unit: 'mm',
      min: 400,
      max: 800,
      step: 5,
      defaultValue: 500,
    },
    {
      id: 'height',
      label: 'Height',
      type: 'number',
      section: 'Dimensions',
      unit: 'mm',
      min: 700,
      max: 1200,
      step: 10,
      defaultValue: 900,
    },
    {
      id: 'depth',
      label: 'Depth',
      type: 'number',
      section: 'Dimensions',
      unit: 'mm',
      min: 400,
      max: 800,
      step: 5,
      defaultValue: 500,
    },
  ],
  constraints: (params) => {
    return {
      width: Math.max(400, Math.min(800, Number(params.width ?? 500))),
      height: Math.max(700, Math.min(1200, Number(params.height ?? 900))),
      depth: Math.max(400, Math.min(800, Number(params.depth ?? 500))),
    };
  },
  deriveGeometry: (params) => {
    const w = (params.width ?? 500) / 1000;
    const h = (params.height ?? 900) / 1000;
    const d = (params.depth ?? 500) / 1000;
    return [
      {
        id: 'chair-placeholder',
        name: 'Chair Placeholder',
        geometry: { type: 'box', args: [w, h, d] },
        material: { color: '#f59e0b' },
        position: [0, h / 2, 0],
      },
    ];
  },
  hierarchy: () => ({
    id: 'chair',
    label: 'Chair',
    icon: 'armchair',
  }),
  presets: [
    {
      id: 'basic_chair',
      label: 'Basic Chair',
      params: { width: 500, height: 900, depth: 500 },
    },
    {
      id: 'dining_chair',
      label: 'Dining Chair',
      params: { width: 450, height: 950, depth: 455 },
    },
    {
      id: 'stool',
      label: 'Stool',
      params: { width: 400, height: 700, depth: 400 },
    },
    {
      id: 'armchair',
      label: 'Armchair',
      params: { width: 650, height: 850, depth: 600 },
    },
  ],
};
