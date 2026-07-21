'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useStore } from '../../state/store';
import { objectRegistry } from '../../objects';

export default function StatusBar() {
  const selectedObjectType = useStore((state) => state.selectedObjectType);
  const selectionScope = useStore((state) => state.selectionScope);
  const warningMessages = useStore((state) => state.warningMessages);

  const activeModule = objectRegistry[selectedObjectType];
  const objectLabel = activeModule ? activeModule.label : 'Object';

  // Format selection scope representation (Section 8)
  const getSelectionText = () => {
    if (selectionScope.type === 'object') {
      return 'Object Root';
    }
    // Return formatted label if selection matches a known subcomponent
    if (activeModule) {
      // Find matching node label in hierarchy
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
      // We pass in dummy params to search hierarchical structure
      const hierarchyRoot = activeModule.hierarchy({});
      const matchedLabel = findLabel(hierarchyRoot);
      if (matchedLabel) return matchedLabel;
    }
    return selectionScope.id;
  };

  // Extract first active warning text (Section 8)
  const warningsList = Object.values(warningMessages);
  const hasWarning = warningsList.length > 0;
  const activeWarning = hasWarning ? warningsList[0] : null;

  return (
    <footer className="h-[36px] w-full bg-surface-0 border-t border-border-subtle px-4 flex items-center justify-between text-size-secondary text-text-secondary select-none font-mono z-10 shrink-0">
      {/* Left side: Object Type & Selection Context (Section 8) */}
      <div className="flex items-center gap-1.5 truncate max-w-[30%]">
        <span className="text-text-tertiary">Object:</span>
        <span className="text-text-primary font-bold">{objectLabel}</span>
        <span className="text-text-tertiary mx-1.5">|</span>
        <span className="text-text-tertiary">Selection:</span>
        <span className="text-text-accent font-medium truncate">{getSelectionText()}</span>
      </div>

      {/* Center: Dynamic validation warning message (Section 8) */}
      <div className="flex-1 flex items-center justify-center px-4 max-w-[50%]">
        {hasWarning && activeWarning ? (
          <div className="flex items-center gap-1.5 text-warning animate-fade-in text-size-secondary">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate font-semibold tracking-tight">{activeWarning}</span>
          </div>
        ) : (
          <span className="text-text-tertiary font-light">Parameters conform to constraints</span>
        )}
      </div>

      {/* Right side: Pulse Indicator Dot (Section 8) */}
      <div className="flex items-center gap-2 max-w-[20%] shrink-0">
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
