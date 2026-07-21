'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Table2, Armchair, CupSoda, Coffee,
  ChevronDown, Crosshair, RefreshCcw, Grid3x3, BoxSelect,
  RotateCcw, Shuffle, HelpCircle, ListTree, Sliders,
  MousePointer2, Move, RotateCw, Maximize2, Box, Settings2,
} from 'lucide-react';
import { useStore } from '../../state/store';
import { objectList } from '../../objects';

const iconMap: Record<string, React.ComponentType<any>> = {
  'table-2':  Table2,
  'armchair': Armchair,
  'cup-soda': CupSoda,
  'coffee':   Coffee,
  'box':      Box,
};

interface ObjectItem {
  id: string; label: string; icon: string; description: string; disabled?: boolean;
}

/* ── Gradient active tool button ─────────────────────────── */
function ToolBtn({
  icon: Icon, label, active, onClick, kbd, danger, children,
}: {
  icon?: React.ComponentType<any>; label: string;
  active?: boolean; onClick?: () => void; kbd?: string;
  danger?: boolean; children?: React.ReactNode;
}) {
  const tooltip = kbd ? `${label} (${kbd})` : label;
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      data-tooltip={tooltip}
      className={[
        'h-7 px-2 rounded flex items-center justify-center gap-1.5 text-[12px] font-medium cursor-pointer transition-all select-none shrink-0',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-accent',
        active
          ? 'active-gradient text-white shadow-sm'
          : danger
            ? 'text-error hover:bg-error/10 hover:text-error'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-2',
      ].join(' ')}
      style={active ? { background: 'var(--grad-primary)', boxShadow: 'var(--shadow-btn)' } : undefined}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </button>
  );
}

/* ── Vertical divider ─────────────────────────────────────── */
function Divider() {
  return (
    <div
      className="w-px h-5 shrink-0"
      style={{ background: 'linear-gradient(180deg, transparent, var(--border-default), transparent)' }}
    />
  );
}

/* ── Tool group pill ──────────────────────────────────────── */
function ToolGroup({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-0.5 rounded px-0.5 h-8 shrink-0"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {children}
    </div>
  );
}

/* ── Gradient action button (Reset / Randomize) ───────────── */
function ActionBtn({
  onClick, label, tooltip, icon: Icon, variant = 'ghost',
}: {
  onClick: () => void; label: string; tooltip: string;
  icon: React.ComponentType<any>; variant?: 'ghost' | 'gradient';
}) {
  if (variant === 'gradient') {
    return (
      <button
        onClick={onClick}
        data-tooltip={tooltip}
        aria-label={label}
        className="flex items-center gap-1.5 px-3 h-7 rounded text-[12px] font-semibold cursor-pointer transition-all select-none btn-gradient"
      >
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      data-tooltip={tooltip}
      aria-label={label}
      className="flex items-center gap-1.5 px-2.5 h-7 rounded text-[12px] font-medium text-text-secondary hover:text-text-primary cursor-pointer transition-all select-none"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-default)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.borderColor = 'var(--border-accent)';
        el.style.boxShadow = '0 0 0 1px rgba(139,92,246,0.15)';
        el.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.borderColor = 'var(--border-default)';
        el.style.boxShadow = 'none';
        el.style.color = '';
      }}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </button>
  );
}

export default function Toolbar() {
  const selectedObjectType    = useStore(s => s.selectedObjectType);
  const setSelectedObjectType = useStore(s => s.setSelectedObjectType);
  const resetObject           = useStore(s => s.resetObject);
  const randomizeObject       = useStore(s => s.randomizeObject);

  const hierarchyDrawerOpen    = useStore(s => s.hierarchyDrawerOpen);
  const setHierarchyDrawerOpen = useStore(s => s.setHierarchyDrawerOpen);
  const inspectorDrawerOpen    = useStore(s => s.inspectorDrawerOpen);
  const setInspectorDrawerOpen = useStore(s => s.setInspectorDrawerOpen);
  const setActiveMobileTab     = useStore(s => s.setActiveMobileTab);

  const editMode             = useStore(s => s.editMode);
  const setEditMode          = useStore(s => s.setEditMode);
  const transformMode        = useStore(s => s.transformMode);
  const setTransformMode     = useStore(s => s.setTransformMode);
  const setSelectedComponentIds   = useStore(s => s.setSelectedComponentIds);
  const setActiveRefId            = useStore(s => s.setActiveReferenceComponentId);
  const gridEnabled               = useStore(s => s.gridEnabled);
  const shadingMode               = useStore(s => s.shadingMode);
  const boundingBoxEnabled        = useStore(s => s.boundingBoxEnabled);

  const [width, setWidth]           = useState<number | null>(null);
  const [dropOpen, setDropOpen]     = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef   = useRef<HTMLButtonElement>(null);
  const [sweepActive, setSweepActive] = useState(false);
  const prevTypeRef = useRef(selectedObjectType);

  useEffect(() => {
    if (prevTypeRef.current !== selectedObjectType) {
      prevTypeRef.current = selectedObjectType;
      setSweepActive(true);
      const t = setTimeout(() => setSweepActive(false), 700);
      return () => clearTimeout(t);
    }
  }, [selectedObjectType]);

  useEffect(() => {
    setWidth(window.innerWidth);
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (editMode === 'component') {
        if (k === 'w') setTransformMode('translate');
        else if (k === 'e') setTransformMode('rotate');
        else if (k === 'r') setTransformMode('scale');
      }
      if (k === 'escape') { setSelectedComponentIds([]); setActiveRefId(null); }
      if (k === 'f') useStore.getState().triggerFrameSelected();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editMode, setTransformMode, setSelectedComponentIds, setActiveRefId]);

  const items: ObjectItem[] = [
    { id: 'table',  label: 'Table',  icon: 'table-2',  description: 'Parametric tables and surfaces.' },
    { id: 'chair',  label: 'Chair',  icon: 'armchair', description: 'Chairs, stools, and armchairs.' },
    { id: 'cup',    label: 'Cup',    icon: 'cup-soda', description: 'Hollow glasses and tumblers.' },
    { id: 'mug',    label: 'Mug',    icon: 'coffee',   description: 'Mugs with curved handles.' },
    { id: 'coming-soon', label: 'More objects', icon: 'box', description: 'Coming soon.', disabled: true },
  ];

  const activeItem  = items.find(i => i.id === selectedObjectType) || items[0];
  const ActiveIcon  = iconMap[activeItem.icon] || Table2;
  const activeCount = items.filter(i => !i.disabled).length;

  const openDrop  = () => { setDropOpen(true); setHighlightIdx(items.findIndex(i => i.id === selectedObjectType) || 0); };
  const closeDrop = () => { setDropOpen(false); triggerRef.current?.focus(); };
  const handleSelect = (id: string) => { setSelectedObjectType(id); closeDrop(); };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const onTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!dropOpen) {
      if (['ArrowDown', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openDrop(); }
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setHighlightIdx(p => (p + 1) % activeCount); break;
      case 'ArrowUp':   e.preventDefault(); setHighlightIdx(p => (p - 1 + activeCount) % activeCount); break;
      case 'Enter':     e.preventDefault(); if (highlightIdx < activeCount) handleSelect(items[highlightIdx].id); break;
      case 'Escape': case 'Tab': closeDrop(); break;
    }
  };

  const isMobileOrTablet = width !== null && width < 1024;

  return (
    <header
      className="h-12 w-full flex items-center px-3 gap-2 z-50 relative shrink-0 select-none"
      style={{
        background: 'var(--surface-0)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: '0 1px 0 rgba(139,92,246,0.08)',
      }}
    >
      {/* Subtle top gradient accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 0%, var(--accent) 30%, var(--accent-cyan) 70%, transparent 100%)', opacity: 0.6 }}
      />

      {/* ── LEFT: Brand + Object picker ──────────────────────── */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-6 h-6 rounded flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: 'var(--grad-primary)', boxShadow: '0 0 10px rgba(139,92,246,0.4)' }}
          >
            <img src="/parametric-icon.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span
            className="text-[13px] font-bold tracking-tight hidden sm:block"
            style={{
              background: 'var(--text-grad)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Parametric Studio
          </span>
        </div>

        <Divider />

        {/* Object selector */}
        <div className="relative" ref={containerRef}>
          <div className="flex flex-col gap-0">
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest leading-none mb-0.5 pl-0.5">
              Object
            </span>
            <button
              ref={triggerRef}
              id="object-select-trigger"
              role="combobox"
              aria-expanded={dropOpen}
              aria-haspopup="listbox"
              aria-controls="object-select-listbox"
              onClick={() => dropOpen ? closeDrop() : openDrop()}
              onKeyDown={onTriggerKey}
              className="flex items-center gap-2 px-2.5 h-7 rounded text-[12px] font-medium text-text-primary cursor-pointer focus:outline-none relative overflow-hidden transition-all"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-default)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 0 0 1px rgba(139,92,246,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {sweepActive && (
                <span className="absolute inset-0 animate-sweep pointer-events-none"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.25) 50%, transparent 100%)' }}
                />
              )}
              <ActiveIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-accent)' }} />
              <span>{activeItem.label}</span>
              <ChevronDown
                className={`w-3 h-3 text-text-tertiary ml-0.5 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {/* Dropdown listbox */}
          {dropOpen && (
            <div
              id="object-select-listbox"
              role="listbox"
              aria-labelledby="object-select-trigger"
              className="absolute top-[calc(100%+6px)] left-0 w-72 py-1 z-50 animate-panel-in"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg), 0 0 30px rgba(139,92,246,0.12)',
              }}
            >
              {items.map((item, index) => {
                const ItemIcon   = iconMap[item.icon] || HelpCircle;
                const isSelected = item.id === selectedObjectType;
                const isHovered  = index === highlightIdx;

                if (item.disabled) {
                  return (
                    <div key={item.id} role="option" aria-disabled="true" aria-selected="false"
                      className="px-3 py-2 mt-1 flex items-start gap-2.5 opacity-30 cursor-not-allowed"
                      style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-text-tertiary" />
                      <div className="flex flex-col">
                        <span className="text-[12px] font-semibold text-text-tertiary">{item.label}</span>
                        <span className="text-[10px] text-text-tertiary">{item.description}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={item.id} role="option" aria-selected={isSelected}
                    onClick={() => handleSelect(item.id)}
                    onMouseEnter={() => setHighlightIdx(index)}
                    className="px-3 py-2 flex items-start gap-2.5 cursor-pointer select-none transition-all duration-75 relative overflow-hidden"
                    style={{
                      borderLeft: isSelected ? '2px solid transparent' : '2px solid transparent',
                      borderImage: isSelected ? 'var(--grad-primary) 1' : 'none',
                      background: isSelected
                        ? 'linear-gradient(90deg, rgba(139,92,246,0.12) 0%, rgba(6,182,212,0.06) 100%)'
                        : isHovered
                          ? 'var(--surface-3)'
                          : 'transparent',
                      color: isSelected ? 'var(--text-primary)' : isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
                        style={{ background: 'var(--grad-primary)' }}
                      />
                    )}
                    <ItemIcon
                      className="w-3.5 h-3.5 mt-0.5 shrink-0"
                      style={{ color: isSelected ? 'var(--text-accent)' : 'var(--text-tertiary)' }}
                    />
                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold">{item.label}</span>
                      <span className="text-[10px] text-text-tertiary leading-relaxed">{item.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile/Tablet hierarchy toggle */}
        {isMobileOrTablet && (
          <button
            onClick={() => {
              if (width! < 768) setActiveMobileTab('hierarchy');
              setHierarchyDrawerOpen(!hierarchyDrawerOpen);
            }}
            data-tooltip="Scene"
            aria-label="Toggle Scene Panel"
            className="w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-all"
            style={hierarchyDrawerOpen
              ? { background: 'var(--grad-primary)', boxShadow: 'var(--shadow-btn)', color: 'white' }
              : { color: 'var(--text-secondary)', background: 'transparent' }}
          >
            <ListTree className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── CENTER: Tool groups ───────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center gap-2">

        {/* Camera tools */}
        <ToolGroup>
          <ToolBtn icon={MousePointer2} label="Select"          active={editMode === 'parametric' && !dropOpen} onClick={() => {}} />
          <ToolBtn icon={Crosshair}    label="Frame Selection"  kbd="F" onClick={() => useStore.getState().triggerFrameSelected()} />
          <ToolBtn icon={RefreshCcw}   label="Reset View"              onClick={() => useStore.getState().triggerResetView()} />
        </ToolGroup>

        <Divider />

        {/* Edit mode toggle */}
        <ToolGroup>
          <ToolBtn label="Properties" active={editMode === 'parametric'} onClick={() => setEditMode('parametric')}>
            <Sliders className="w-3.5 h-3.5" />
            <span>Properties</span>
          </ToolBtn>
          <ToolBtn label="Parts" active={editMode === 'component'} onClick={() => setEditMode('component')}>
            <Settings2 className="w-3.5 h-3.5" />
            <span>Parts</span>
          </ToolBtn>
        </ToolGroup>

        {/* Transform tools — only in Parts mode */}
        {editMode === 'component' && (
          <>
            <Divider />
            <ToolGroup>
              <ToolBtn icon={Move}      label="Move"   kbd="W" active={transformMode === 'translate'} onClick={() => setTransformMode('translate')} />
              <ToolBtn icon={RotateCw}  label="Rotate" kbd="E" active={transformMode === 'rotate'}    onClick={() => setTransformMode('rotate')} />
              <ToolBtn icon={Maximize2} label="Scale"  kbd="R" active={transformMode === 'scale'}     onClick={() => setTransformMode('scale')} />
            </ToolGroup>
          </>
        )}

        <Divider />

        {/* Viewport display */}
        <ToolGroup>
          <ToolBtn icon={Grid3x3} label="Grid" active={gridEnabled}
            onClick={() => useStore.getState().toggleGrid()} />
          <div className="w-px h-4 bg-border-subtle" />
          {/* Solid / Wireframe */}
          <button
            onClick={() => useStore.getState().setShadingMode('solid')}
            data-tooltip="Solid"
            aria-label="Solid shading"
            className="h-7 px-2 rounded text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all"
            style={shadingMode === 'solid'
              ? { background: 'var(--grad-primary)', color: 'white', boxShadow: 'var(--shadow-btn)' }
              : { color: 'var(--text-secondary)', background: 'transparent' }}
          >
            Solid
          </button>
          <button
            onClick={() => useStore.getState().setShadingMode('wireframe')}
            data-tooltip="Wireframe"
            aria-label="Wireframe shading"
            className="h-7 px-2 rounded text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all"
            style={shadingMode === 'wireframe'
              ? { background: 'var(--grad-primary)', color: 'white', boxShadow: 'var(--shadow-btn)' }
              : { color: 'var(--text-secondary)', background: 'transparent' }}
          >
            Wire
          </button>
          <div className="w-px h-4 bg-border-subtle" />
          <ToolBtn icon={BoxSelect} label="Bounding Box" active={boundingBoxEnabled}
            onClick={() => useStore.getState().toggleBoundingBox()} />
        </ToolGroup>
      </div>

      {/* ── RIGHT: Actions + Inspector toggle ────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        {isMobileOrTablet && (
          <button
            onClick={() => {
              if (width! < 768) setActiveMobileTab('inspector');
              setInspectorDrawerOpen(!inspectorDrawerOpen);
            }}
            data-tooltip="Inspector"
            aria-label="Toggle Inspector"
            className="w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-all"
            style={inspectorDrawerOpen
              ? { background: 'var(--grad-primary)', boxShadow: 'var(--shadow-btn)', color: 'white' }
              : { color: 'var(--text-secondary)' }}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        )}

        <ActionBtn onClick={resetObject} label="Reset" tooltip="Restore to last preset" icon={RotateCcw} />
        <ActionBtn onClick={randomizeObject} label="Randomize" tooltip="Generate a random valid variation" icon={Shuffle} variant="gradient" />
      </div>
    </header>
  );
}
