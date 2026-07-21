'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '../../state/store';
import { objectRegistry } from '../../objects';

export default function StatusBar() {
  const selectedObjectType = useStore(s => s.selectedObjectType);
  const currentParams      = useStore(s => s.currentParams);
  const selectionScope     = useStore(s => s.selectionScope);
  const activePresetId     = useStore(s => s.activePresetId);
  const warningMessages    = useStore(s => s.warningMessages);
  const editMode           = useStore(s => s.editMode);
  const transformMode      = useStore(s => s.transformMode);
  const selectedComponentIds = useStore(s => s.selectedComponentIds);

  const activeModule  = objectRegistry[selectedObjectType];
  const objectLabel   = activeModule?.label ?? 'Object';

  // Selected part label
  const getSelectionLabel = (): string => {
    if (editMode === 'component') {
      if (selectedComponentIds.length === 0) return 'Nothing selected';
      if (selectedComponentIds.length === 1) {
        // Find human label in hierarchy
        if (activeModule) {
          const find = (n: any): string | null => {
            if (n.id === selectedComponentIds[0]) return n.label;
            for (const c of n.children ?? []) { const r = find(c); if (r) return r; }
            return null;
          };
          const found = find(activeModule.hierarchy(currentParams));
          if (found) return found;
        }
        return selectedComponentIds[0];
      }
      return `${selectedComponentIds.length} parts selected`;
    }
    if (selectionScope.type === 'object') return objectLabel;
    if (activeModule) {
      const find = (n: any): string | null => {
        if (n.id === selectionScope.id) return n.label;
        for (const c of n.children ?? []) { const r = find(c); if (r) return r; }
        return null;
      };
      const found = find(activeModule.hierarchy(currentParams));
      if (found) return found;
    }
    return selectionScope.id;
  };

  // Preset label
  const presetLabel = (): string => {
    if (!activePresetId || !activeModule) return '';
    return activeModule.presets.find(p => p.id === activePresetId)?.label ?? '';
  };

  const warningsList = Object.values(warningMessages);
  const hasWarning   = warningsList.length > 0;
  const activeWarning = hasWarning ? warningsList[0] : null;

  const modeLabel = editMode === 'component'
    ? (transformMode === 'translate' ? 'Move' : transformMode === 'rotate' ? 'Rotate' : 'Scale')
    : 'Properties';

  return (
    <footer
      className="shrink-0 h-8 w-full bg-surface-0 border-t border-border-subtle px-3 flex items-center justify-between gap-4 select-none z-10 relative overflow-hidden"
      style={{
        fontFamily: 'var(--font-geist-mono, monospace)',
        fontSize: '11px',
        boxShadow: '0 -1px 0 rgba(139,92,246,0.05)'
      }}
    >
      {/* Top subtle border gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)', opacity: 0.2 }}
      />

      {/* Left: Object + selection */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-text-tertiary shrink-0">Object:</span>
        <span className="text-text-primary font-semibold truncate">{objectLabel}</span>
        {presetLabel() && (
          <span className="text-text-tertiary truncate hidden sm:inline">({presetLabel()})</span>
        )}
        <span className="text-border-strong shrink-0">·</span>
        <span className="text-text-tertiary shrink-0">Selected:</span>
        <span className="font-semibold truncate text-gradient">{getSelectionLabel()}</span>
      </div>

      {/* Center: warning or all-valid */}
      <div className="flex-1 flex items-center justify-center min-w-0 px-2">
        {hasWarning && activeWarning ? (
          <div className="flex items-center gap-1.5 text-warning animate-fade-in">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span className="truncate font-semibold">{activeWarning}</span>
          </div>
        ) : (
          <span className="text-text-tertiary">All values are valid</span>
        )}
      </div>

      {/* Right: mode chip + material swatch + state dot */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Active mode */}
        <div className="flex items-center gap-1">
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: editMode === 'component' ? 'var(--grad-primary)' : 'var(--text-tertiary)' }}
          />
          <span className="text-text-tertiary hidden md:inline">{modeLabel}</span>
        </div>

        <span className="text-border-strong">·</span>

        {/* Material swatch + label */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full border border-border-default shadow-inner shrink-0"
            style={{ backgroundColor: currentParams.color ?? '#888' }}
            title={`${currentParams.material ?? ''} (${currentParams.finish ?? ''})`}
          />
          <span className="text-text-secondary hidden md:inline">{currentParams.material}</span>
        </div>

        <span className="text-border-strong">·</span>

        {/* Validation indicator dot */}
        {hasWarning ? (
          <div
            key="warn"
            title="A value was automatically adjusted"
            className="w-2 h-2 rounded-full bg-warning animate-state-pulse"
            style={{ boxShadow: '0 0 8px var(--warning)' }}
          />
        ) : (
          <div
            key="ok"
            title="All parameters are valid"
            className="w-2 h-2 rounded-full bg-success animate-state-pulse"
            style={{ boxShadow: '0 0 8px var(--success)' }}
          />
        )}
      </div>
    </footer>
  );
}
