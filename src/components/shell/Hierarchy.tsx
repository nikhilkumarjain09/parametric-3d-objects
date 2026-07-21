'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Cylinder, 
  Table2, 
  Armchair, 
  Coffee, 
  CupSoda, 
  ListTree, 
  ChevronDown, 
  ChevronRight 
} from 'lucide-react';
import { useStore } from '../../state/store';
import { objectRegistry } from '../../objects';
import { HierarchyNode } from '../../objects/types';

// Lucide icon mapping based on Section 10 and Section 13 node schema
const iconMap: Record<string, React.ComponentType<any>> = {
  'box': Box,
  'cylinder': Cylinder,
  'table-2': Table2,
  'armchair': Armchair,
  'coffee': Coffee,
  'cup-soda': CupSoda,
  'list-tree': ListTree,
};

export default function Hierarchy() {
  const selectedObjectType = useStore((state) => state.selectedObjectType);
  const currentParams = useStore((state) => state.currentParams);
  const selectionScope = useStore((state) => state.selectionScope);
  const setSelection = useStore((state) => state.setSelection);

  const activeModule = objectRegistry[selectedObjectType];

  // Track manual expand/collapse states (session scoped)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  
  const lastTypeRef = useRef(selectedObjectType);

  // Initialize and default all group nodes to expanded on first load (Section 5)
  // Auto-expands newly added parent folders (e.g. enabling Armrests adds Armrests group)
  useEffect(() => {
    if (lastTypeRef.current !== selectedObjectType) {
      lastTypeRef.current = selectedObjectType;
      const defaultExpanded: Record<string, boolean> = {};
      const traverse = (n: HierarchyNode) => {
        if (n.children && n.children.length > 0) {
          defaultExpanded[n.id] = true;
          n.children.forEach(traverse);
        }
      };
      if (activeModule) {
        const rootNode = activeModule.hierarchy(currentParams);
        traverse(rootNode);
      }
      setExpandedNodes(defaultExpanded);
    } else {
      // Auto expand new nodes added due to parameter edits (e.g., Six-Leg, Armrests) without reset
      setExpandedNodes((prev) => {
        const next = { ...prev };
        let changed = false;
        const traverse = (n: HierarchyNode) => {
          if (n.children && n.children.length > 0) {
            if (next[n.id] === undefined) {
              next[n.id] = true;
              changed = true;
            }
            n.children.forEach(traverse);
          }
        };
        if (activeModule) {
          const rootNode = activeModule.hierarchy(currentParams);
          traverse(rootNode);
        }
        return changed ? next : prev;
      });
    }
  }, [selectedObjectType, activeModule, currentParams]);

  if (!activeModule) return null;

  const rootNode = activeModule.hierarchy(currentParams);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const renderNode = (node: HierarchyNode, level: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedNodes[node.id];
    
    // Node is selected if selection scope ID matches this node ID
    const isSelected = selectionScope.id === node.id;
    const NodeIcon = iconMap[node.icon] || Box;

    return (
      <div key={node.id} className="flex flex-col select-none">
        {/* Row element (Section 5) */}
        <div
          onClick={() => {
            // Clicking the row body selects the node (Section 5 / REQ-COMPSEL-002)
            if (node.id === selectedObjectType) {
              setSelection({ type: 'object', id: node.id });
            } else {
              setSelection({ type: 'component', id: node.id });
            }
          }}
          className={`h-[28px] w-full flex items-center justify-between px-3 cursor-pointer group transition-colors duration-100 ${
            isSelected 
              ? 'bg-accent-muted border-l-2 border-border-accent text-text-primary' 
              : 'border-l-2 border-transparent text-text-secondary hover:bg-surface-2 hover:text-text-primary'
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }} // 16px indentation per level (Section 5)
        >
          <div className="flex items-center gap-2 truncate">
            {/* Expansion Target (chevron click, Section 5) */}
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Separate chevron click from selection click (Section 5)
                  toggleNode(node.id);
                }}
                className="w-4 h-4 flex items-center justify-center text-text-tertiary hover:text-text-primary focus:outline-none cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="w-4" /> // Spacing matching chevron width
            )}

            <NodeIcon className={`w-4 h-4 shrink-0 transition-colors ${
              isSelected ? 'text-text-accent' : 'text-text-tertiary group-hover:text-text-secondary'
            }`} />
            <span className="text-size-secondary font-medium truncate">{node.label}</span>
          </div>
        </div>

        {/* Child Group Nodes */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-[280px] h-full bg-surface-1 border-r border-border-subtle flex flex-col text-text-primary z-5">
      {/* Hierarchy Header */}
      <div className="h-8 px-4 flex items-center border-b border-border-subtle bg-surface-0 shrink-0">
        <span className="text-size-micro font-bold tracking-wider text-text-tertiary uppercase">
          SCENE HIERARCHY
        </span>
      </div>

      {/* Tree Row list container */}
      <div className="flex-1 py-3 overflow-y-auto scrollbar">
        {renderNode(rootNode)}
      </div>
    </aside>
  );
}
