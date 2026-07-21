'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useStore } from '../../state/store';
import { objectRegistry } from '../../objects';

export default function StatusBar() {
  const selectedObjectType = useStore((state) => state.selectedObjectType);
  const currentParams = useStore((state) => state.currentParams);
  const selectionScope = useStore((state) => state.selectionScope);
  const activePresetId = useStore((state) => state.activePresetId);
  const warningMessages = useStore((state) => state.warningMessages);

  const activeModule = objectRegistry[selectedObjectType];
  const objectLabel = activeModule ? activeModule.label : 'Object';

  // Format selection scope representation (Section 8)
  const getSelectionText = () => {
    if (selectionScope.type === 'object') {
      return 'Object Root';
    }
    if (activeModule) {
      const findLabel = (node: any): string | null => {
        if (node.id === selectionScope.id) return node.label;
        if (node.children) {
          for (const child of node.children) {
            const result = findLabel(child);
            if (result) return result;
          }
        }
        return null;
      };
      const hierarchyRoot = activeModule.hierarchy(currentParams);
      const matchedLabel = findLabel(hierarchyRoot);
      if (matchedLabel) return matchedLabel;
    }
    return selectionScope.id;
  };

  // Preset name formatting (Section 8)
  const getPresetSuffix = () => {
    if (!activePresetId || !activeModule) return '';
    const preset = activeModule.presets.find(p => p.id === activePresetId);
    return preset ? ` (${preset.label})` : '';
  };

  // Bounding dimensions calculation (Section 8)
  const getBoundingDimensionsText = () => {
    if (!activeModule) return '';
    const params = currentParams;
    let w = 0;
    let h = 0;
    let d = 0;

    switch (selectedObjectType) {
      case 'table':
        w = params.width ?? 1200;
        h = params.height ?? 750;
        d = (params.shape === 'Square' || params.shape === 'Round') ? w : (params.depth ?? 800);
        break;
      case 'chair':
        w = params.seatWidth ?? 450;
        h = Math.round(params.height ?? 900);
        d = params.seatDepth ?? 450;
        break;
      case 'cup':
        w = Math.max(params.topDiameter ?? 80, params.bottomDiameter ?? 60);
        h = params.height ?? 100;
        d = w;
        break;
      case 'mug':
        w = params.diameter ?? 90;
        h = params.height ?? 95;
        d = w;
        break;
    }
    return `${w} x ${h} x ${d} mm`;
  };

  // Component meshes count (Section 8)
  const meshes = activeModule ? activeModule.deriveGeometry(currentParams) : [];
  const componentCount = meshes.length;

  const warningsList = Object.values(warningMessages);
  const hasWarning = warningsList.length > 0;
  const activeWarning = hasWarning ? warningsList[0] : null;

  return (
    <footer className="h-[36px] w-full bg-surface-0 border-t border-border-subtle px-4 flex items-center justify-between text-size-secondary text-text-secondary select-none font-mono z-10 shrink-0">
      {/* Left side: Object Type (with Preset) & Selection Context (Section 8) */}
      <div className="flex items-center gap-1.5 truncate max-w-[35%]">
        <span className="text-text-tertiary">Object:</span>
        <span className="text-text-primary font-bold">{objectLabel}{getPresetSuffix()}</span>
        <span className="text-text-tertiary mx-1">|</span>
        <span className="text-text-tertiary">Selection:</span>
        <span className="text-text-accent font-medium truncate">{getSelectionText()}</span>
      </div>

      {/* Center: Dynamic warning text (Section 8) */}
      <div className="flex-1 flex items-center justify-center px-4 max-w-[35%]">
        {hasWarning && activeWarning ? (
          <div className="flex items-center gap-1.5 text-warning animate-fade-in text-size-secondary">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate font-semibold tracking-tight">{activeWarning}</span>
          </div>
        ) : (
          <span className="text-text-tertiary font-light">Parameters conform to constraints</span>
        )}
      </div>

      {/* Right side: Bounding Dimensions, Component Count, and Indicator Dot (Section 8) */}
      <div className="flex items-center gap-2 max-w-[30%] shrink-0">
        <span className="text-text-secondary">{getBoundingDimensionsText()}</span>
        <span className="text-text-tertiary">|</span>
        <span className="text-text-secondary">Components: {componentCount}</span>
        <span className="text-text-tertiary">|</span>
        <span className="text-text-tertiary text-size-micro uppercase tracking-wider font-bold">
          {hasWarning ? 'Clamped' : 'Valid'}
        </span>
        {hasWarning ? (
          <div 
            title="Active validation warning: parameter auto-clamped to satisfy limits"
            className="w-2.5 h-2.5 rounded-full bg-warning animate-pulse shadow-[0_0_8px_var(--warning)]"
          />
        ) : (
          <div 
            title="System state valid: all inputs satisfy geometry rules"
            className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          />
        )}
      </div>
    </footer>
  );
}
