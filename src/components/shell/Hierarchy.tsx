'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Cylinder,
  Table2,
  Armchair,
  Coffee,
  CupSoda,
  Layers,
  ChevronDown,
  ChevronRight,
  Square,
  RectangleHorizontal,
  Columns2,
  PanelTop,
  CircleDot,
  Crosshair,
  PanelLeft,
} from 'lucide-react';
import { useStore } from '../../state/store';
import { objectRegistry } from '../../objects';
import { HierarchyNode } from '../../objects/types';

// Semantic icon mapping — human-friendly part icons
const iconMap: Record<string, React.ComponentType<any>> = {
  'box':          Box,
  'cylinder':     Cylinder,
  'table-2':      Table2,
  'armchair':     Armchair,
  'coffee':       Coffee,
  'cup-soda':     CupSoda,
  'list-tree':    Layers,
  // Part-type overrides (matched by componentFamily when present)
  'tabletop':     RectangleHorizontal,
  'table-leg':    Columns2,
  'legs_group':   Columns2,
  'seat':         Square,
  'backrest':     PanelTop,
  'backrest-slat': PanelTop,
  'backrest_group': PanelTop,
  'armrest':      Layers,
  'armrests_group': Layers,
  'support_column': Cylinder,
  'base_plate':   RectangleHorizontal,
  'mug_handle':   CircleDot,
  'rim':          CircleDot,
};

function getNodeIcon(node: HierarchyNode): React.ComponentType<any> {
  // Use componentFamily for semantic icon if available
  if (node.componentFamily && iconMap[node.componentFamily]) {
    return iconMap[node.componentFamily];
  }
  if (node.id && iconMap[node.id]) return iconMap[node.id];
  return iconMap[node.icon] || Box;
}

export default function Hierarchy() {
  const selectedObjectType         = useStore(s => s.selectedObjectType);
  const selectionScope             = useStore(s => s.selectionScope);
  const setSelection               = useStore(s => s.setSelection);
  const editMode                   = useStore(s => s.editMode);
  const selectedComponentIds       = useStore(s => s.selectedComponentIds);
  const setSelectedComponentIds    = useStore(s => s.setSelectedComponentIds);
  const activeReferenceComponentId = useStore(s => s.activeReferenceComponentId);
  const setActiveReferenceComponentId = useStore(s => s.setActiveReferenceComponentId);

  // Only subscribe to structural params (avoids re-render on slider edits)
  const configuration   = useStore(s => s.currentParams.configuration);
  const backrestShape   = useStore(s => s.currentParams.backrestShape);
  const armrestsEnabled = useStore(s => s.currentParams.armrestsEnabled);
  const seatShape       = useStore(s => s.currentParams.seatShape);

  const currentParams = { configuration, backrestShape, armrestsEnabled, seatShape };
  const activeModule  = objectRegistry[selectedObjectType];

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed]         = useState(false);
  const lastTypeRef = useRef(selectedObjectType);

  // Auto-expand all group nodes when switching object type
  useEffect(() => {
    const changed = lastTypeRef.current !== selectedObjectType;
    lastTypeRef.current = selectedObjectType;
    // Read current structural params inline — avoids object-reference instability in deps
    const structParams = { configuration, backrestShape, armrestsEnabled, seatShape };

    setExpandedNodes(prev => {
      const next = changed ? {} : { ...prev };
      const traverse = (n: HierarchyNode) => {
        if (n.children?.length) {
          if (changed || next[n.id] === undefined) next[n.id] = true;
          n.children.forEach(traverse);
        }
      };
      if (activeModule) traverse(activeModule.hierarchy(structParams));
      return next;
    });
  // Use the five primitive values as deps, not the derived object
  }, [selectedObjectType, activeModule, configuration, backrestShape, armrestsEnabled, seatShape]);

  if (!activeModule) return null;

  const rootNode = activeModule.hierarchy(currentParams);

  const toggleNode = (id: string) =>
    setExpandedNodes(p => ({ ...p, [id]: !p[id] }));

  // Breadcrumb: selected part label for sub-header
  const getSelectedLabel = (): string | null => {
    if (editMode === 'component' && activeReferenceComponentId) {
      const find = (n: HierarchyNode): string | null => {
        if (n.id === activeReferenceComponentId) return n.label;
        for (const c of n.children ?? []) {
          const r = find(c);
          if (r) return r;
        }
        return null;
      };
      return find(rootNode);
    }
    if (selectionScope.type === 'component') {
      const find = (n: HierarchyNode): string | null => {
        if (n.id === selectionScope.id) return n.label;
        for (const c of n.children ?? []) {
          const r = find(c);
          if (r) return r;
        }
        return null;
      };
      return find(rootNode);
    }
    return null;
  };

  const selectedLabel = getSelectedLabel();

  const renderNode = (node: HierarchyNode, level: number = 0): React.ReactNode => {
    const hasChildren = (node.children?.length ?? 0) > 0;
    const isExpanded  = !!expandedNodes[node.id];

    const isSelected = editMode === 'component'
      ? selectedComponentIds.includes(node.id)
      : (node.id === selectedObjectType
          ? selectionScope.type === 'object'
          : selectionScope.type === 'component' && selectionScope.id === node.id);

    const isRef = editMode === 'component' && activeReferenceComponentId === node.id;
    const NodeIcon = getNodeIcon(node);

    // Leg-count badge value
    let countBadge: string | null = null;
    if (node.id === 'legs_group' || node.id === 'legs') {
      countBadge = selectedObjectType === 'table'
        ? (configuration === 'Six-Leg' ? '6' : (['Pedestal', 'Central Support'].includes(configuration ?? '') ? '1' : '4'))
        : '4';
    } else if (node.id === 'backrest_group' && selectedObjectType === 'chair' && backrestShape === 'Slatted') {
      countBadge = '5';
    } else if (node.id === 'armrests_group') {
      countBadge = '2';
    }

    return (
      <div key={node.id} className="flex flex-col">
        <div
          onClick={(e) => {
            if (editMode === 'component') {
              const isMulti = e.ctrlKey || e.metaKey;
              if (isMulti) {
                const next = selectedComponentIds.includes(node.id)
                  ? selectedComponentIds.filter(id => id !== node.id)
                  : [...selectedComponentIds, node.id];
                setSelectedComponentIds(next);
                setActiveReferenceComponentId(next.length > 0 ? node.id : null);
              } else {
                setSelectedComponentIds([node.id]);
                setActiveReferenceComponentId(node.id);
              }
            } else {
              setSelection({ type: node.id === selectedObjectType ? 'object' : 'component', id: node.id });
            }
          }}
          onDoubleClick={(e) => { if (hasChildren) { e.stopPropagation(); toggleNode(node.id); } }}
          role="treeitem"
          aria-selected={isSelected}
          aria-expanded={hasChildren ? isExpanded : undefined}
          style={{
            paddingLeft: `${8 + level * 14}px`,
            background: isSelected
              ? 'linear-gradient(90deg, rgba(139,92,246,0.15) 0%, rgba(6,182,212,0.05) 100%)'
              : undefined,
          }}
          className={[
            'group h-7 w-full flex items-center justify-between pr-2 cursor-pointer select-none transition-all duration-75 relative overflow-hidden',
            isSelected
              ? 'selected-row-bar text-text-primary'
              : 'border-transparent text-text-secondary hover:bg-surface-2 hover:text-text-primary',
          ].join(' ')}
        >
          {isSelected && (
            <div
              className="absolute left-0 top-[15%] bottom-[15%] w-[2px] rounded-full"
              style={{ background: 'var(--grad-primary)' }}
            />
          )}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
            {/* Chevron or spacer */}
            {hasChildren ? (
              <button
                onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
                className="w-4 h-4 flex items-center justify-center text-text-tertiary hover:text-text-primary cursor-pointer shrink-0 rounded"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded
                  ? <ChevronDown className="w-3 h-3" />
                  : <ChevronRight className="w-3 h-3" />}
              </button>
            ) : (
              <div className="w-4 shrink-0" />
            )}

            <NodeIcon className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              isSelected ? 'text-accent-cyan' : 'text-text-tertiary group-hover:text-text-secondary'
            }`} />

            <span className="text-[12px] font-medium truncate leading-none">{node.label}</span>
          </div>

          {/* Right badges */}
          <div className="flex items-center gap-1 shrink-0">
            {isRef && (
              <span
                className="text-[9px] font-bold text-white px-1 py-0.5 rounded uppercase tracking-wider shadow-sm"
                style={{ background: 'var(--grad-primary)' }}
              >
                Ref
              </span>
            )}
            {countBadge && (
              <span className="text-[9px] font-bold text-text-tertiary bg-surface-3 px-1 py-0.5 rounded">
                {countBadge}
              </span>
            )}
            {/* Frame action — revealed on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Select and frame
                setSelection({ type: 'component', id: node.id });
                useStore.getState().triggerFrameSelected();
              }}
              data-tooltip="Frame (F)"
              aria-label="Frame this part"
              className="w-5 h-5 opacity-0 group-hover:opacity-100 flex items-center justify-center text-text-tertiary hover:text-text-accent transition-opacity cursor-pointer rounded"
            >
              <Crosshair className="w-3 h-3" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Collapsed state — just a thin strip with expand button
  if (collapsed) {
    return (
      <aside className="w-8 h-full bg-surface-1 border-r border-border-subtle flex flex-col items-center py-2 z-10 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          data-tooltip="Open Scene panel"
          aria-label="Open Scene"
          className="w-6 h-6 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-2 rounded cursor-pointer transition-colors"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col h-full bg-surface-1 border-r border-border-subtle z-10 shrink-0" style={{ width: 'var(--width-left-panel)' }}>
      {/* Panel header */}
      <div className="h-8 px-3 flex items-center justify-between border-b border-border-subtle bg-surface-0 shrink-0 panel-header-accent">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-widest text-text-tertiary uppercase leading-none">
            Scene
          </span>
          {selectedLabel && (
            <span className="text-[10px] font-semibold leading-none mt-0.5 truncate max-w-[180px] text-gradient">
              {activeModule.label} › {selectedLabel}
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(true)}
          data-tooltip="Collapse panel"
          aria-label="Collapse Scene panel"
          className="w-5 h-5 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-2 rounded cursor-pointer transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tree */}
      <div
        role="tree"
        aria-label="Object parts"
        className="flex-1 py-1.5 overflow-y-auto"
      >
        {renderNode(rootNode)}
      </div>

      {/* Footer hint in component mode */}
      {editMode === 'component' && (
        <div className="border-t border-border-subtle px-3 py-2 shrink-0">
          <p className="text-[10px] text-text-tertiary leading-relaxed">
            Ctrl+click to multi-select parts
          </p>
        </div>
      )}
    </aside>
  );
}
