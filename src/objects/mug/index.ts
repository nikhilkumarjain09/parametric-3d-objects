import { ObjectDefinitionModule } from '../types';

export const mugModule: ObjectDefinitionModule = {
  id: 'mug',
  label: 'Mug',
  icon: 'coffee',
  defaultParams: {
    width: 90,
    height: 95,
    depth: 90,
  },
  paramSchema: [
    {
      id: 'width',
      label: 'Width',
      type: 'number',
      section: 'Dimensions',
      unit: 'mm',
      min: 40,
      max: 180,
      step: 2,
      defaultValue: 90,
    },
    {
      id: 'height',
      label: 'Height',
      type: 'number',
      section: 'Dimensions',
      unit: 'mm',
      min: 60,
      max: 200,
      step: 5,
      defaultValue: 95,
    },
    {
      id: 'depth',
      label: 'Depth',
      type: 'number',
      section: 'Dimensions',
      unit: 'mm',
      min: 40,
      max: 180,
      step: 2,
      defaultValue: 90,
    },
  ],
  constraints: (params) => {
    return {
      width: Math.max(40, Math.min(180, Number(params.width ?? 90))),
      height: Math.max(60, Math.min(200, Number(params.height ?? 95))),
      depth: Math.max(40, Math.min(180, Number(params.depth ?? 90))),
    };
  },
  deriveGeometry: () => [],
  hierarchy: () => ({
    id: 'mug',
    label: 'Mug',
    icon: 'coffee',
  }),
  presets: [
    {
      id: 'coffee_mug',
      label: 'Coffee Mug',
      params: { width: 90, height: 95, depth: 90 },
    },
    {
      id: 'large_mug',
      label: 'Large Mug',
      params: { width: 110, height: 120, depth: 110 },
    },
    {
      id: 'small_mug',
      label: 'Small Mug',
      params: { width: 75, height: 80, depth: 75 },
    },
  ],
};
