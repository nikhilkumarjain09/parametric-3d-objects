'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Check,
  Shuffle,
  Table2, Armchair, CupSoda, Coffee,
  Move, RotateCw, Maximize2,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  Copy, X, Layers, Lock, Unlock, PanelRight,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../state/store';
import { objectRegistry } from '../../objects';

// ─── Section ordering per object type ────────────────────────────────────────
const getSectionOrder = (type: string): string[] => {
  switch (type) {
    case 'table':  return ['Dimensions', 'Tabletop', 'Legs', 'Appearance'];
    case 'chair':  return ['Dimensions', 'Seat', 'Backrest', 'Legs', 'Armrests', 'Appearance'];
    case 'cup':    return ['Dimensions', 'Body', 'Base', 'Rim', 'Appearance'];
    case 'mug':    return ['Dimensions', 'Body', 'Handle', 'Base', 'Rim', 'Appearance'];
    default:       return [];
  }
};

// ─── Curated swatches ─────────────────────────────────────────────────────────
const CURATED_COLORS = [
  '#f8fafc', '#1e293b', '#8b5a2b', '#5c4033',
  '#cbd5e1', '#0d9488', '#e11d48', '#f59e0b',
];

// ─── Material sphere gradients ────────────────────────────────────────────────
const MATERIAL_GRADIENTS: Record<string, string> = {
  Ceramic: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 60%, #94a3b8 100%)',
  Wood:    'radial-gradient(circle at 35% 35%, #d97706 0%, #92400e 65%, #451a03 100%)',
  Metal:   'radial-gradient(circle at 35% 35%, #f1f5f9 0%, #94a3b8 50%, #475569 100%)',
  Plastic: 'radial-gradient(circle at 35% 35%, #f87171 0%, #dc2626 60%, #7f1d1d 100%)',
  Glass:   'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.7) 0%, rgba(186,230,253,0.3) 50%, rgba(56,189,248,0.15) 100%)',
};
const MATERIAL_LABELS: Record<string, string> = {
  Ceramic: 'Glazed clay', Wood: 'Hardwood', Metal: 'Steel',
  Plastic: 'Polymer', Glass: 'Silica',
};

// ─── Object icon mapping ──────────────────────────────────────────────────────
const OBJ_ICON: Record<string, React.ComponentType<any>> = {
  table: Table2, chair: Armchair, cup: CupSoda, mug: Coffee,
};

// ─── Axis dot component ───────────────────────────────────────────────────────
const AXIS_COLOR = { x: 'var(--axis-x)', y: 'var(--axis-y)', z: 'var(--axis-z)' };
function AxisDot({ axis }: { axis: 'x' | 'y' | 'z' }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
      style={{ backgroundColor: AXIS_COLOR[axis] }}
    />
  );
}

// ─── Axis numeric input ───────────────────────────────────────────────────────
interface AxisInputProps {
  axis: 'x' | 'y' | 'z';
  value: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}
function AxisInput({ axis, value, step = 1, unit, onChange }: AxisInputProps) {
  const [local, setLocal] = useState(String(Math.round(value * 1000) / 1000));
  useEffect(() => { setLocal(String(Math.round(value * 1000) / 1000)); }, [value]);

  const commit = () => {
    const n = parseFloat(local);
    if (!isNaN(n)) onChange(n);
    else setLocal(String(Math.round(value * 1000) / 1000));
  };

  return (
    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
      <div className="flex items-center gap-1">
        <AxisDot axis={axis} />
        <span className="text-[9px] font-bold uppercase text-text-tertiary tracking-wider">{axis.toUpperCase()}</span>
      </div>
      <div className="relative flex items-center">
        <input
          type="number"
          value={local}
          step={step}
          onChange={e => setLocal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); }}
          className="w-full h-[26px] bg-surface-0 border border-border-default rounded px-1.5 pr-5 font-mono text-[11px] text-text-primary outline-none focus:border-border-accent transition-all"
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.boxShadow = '0 0 0 1px rgba(139,92,246,0.15)';
          }}
          onBlur={e => {
            commit();
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        {unit && (
          <span className="absolute right-1 text-[9px] text-text-tertiary font-mono pointer-events-none">{unit}</span>
        )}
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ label, expanded, onToggle }: { label: string; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full h-7 flex items-center justify-between px-3 cursor-pointer hover:bg-surface-2 transition-colors group"
      aria-expanded={expanded}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary group-hover:text-text-secondary transition-colors">
        {label}
      </span>
      <ChevronDown className={`w-3 h-3 text-text-tertiary transition-transform duration-150 ${expanded ? '' : '-rotate-90'}`} />
    </button>
  );
}

// ─── Section collapse wrapper ─────────────────────────────────────────────────
function CollapsibleSection({ label, expanded, onToggle, children }: {
  label: string; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="h-px bg-border-subtle" />
      <SectionHeader label={label} expanded={expanded} onToggle={onToggle} />
      <div className={`grid transition-[grid-template-rows] duration-200 ease-out overflow-hidden ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="min-h-0">
          <div className="flex flex-col gap-3 px-3 py-2.5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Numeric parameter field (label + slider + input row) ─────────────────────
interface NumericFieldProps {
  param: any; value: number; hasWarning: boolean;
  warningMessage?: string; onClearWarning: () => void; onChange: (v: number) => void;
}
function NumericField({ param, value, hasWarning, warningMessage, onClearWarning, onChange }: NumericFieldProps) {
  const [typedVal, setTypedVal] = useState(String(value));
  const [flashing, setFlashing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTypedVal(String(value)); }, [value]);

  useEffect(() => {
    if (hasWarning) {
      setFlashing(true);
      const t = setTimeout(() => { setFlashing(false); onClearWarning(); }, 2500);
      return () => clearTimeout(t);
    }
  }, [hasWarning]);

  const commit = () => {
    const parsed = Number(typedVal);
    if (isNaN(parsed)) { setTypedVal(String(value)); return; }
    const min = param.min ?? 0;
    const max = param.max ?? 10000;
    const clamped = Math.max(min, Math.min(max, parsed));
    if (clamped !== parsed) { setFlashing(true); setTimeout(() => setFlashing(false), 600); }
    onChange(clamped);
    setTypedVal(String(clamped));
  };

  const pct = ((value - (param.min ?? 0)) / ((param.max ?? 100) - (param.min ?? 0))) * 100;

  return (
    <div className="flex flex-col gap-1 relative">
      {/* Top row: label + numeric box */}
      <div className="flex items-center justify-between">
        <label htmlFor={`num-${param.id}`} className="text-[12px] text-text-secondary font-medium select-none">
          {param.label}
        </label>
        <div className="flex items-center gap-1">
          {/* Warning tooltip */}
          {hasWarning && warningMessage && (
            <span className="text-[10px] text-warning flex items-center gap-0.5 animate-fade-in">
              <Sparkles className="w-2.5 h-2.5" />
              {warningMessage}
            </span>
          )}
          <div
            className="flex items-center bg-surface-0 border border-border-default rounded h-[24px] px-1.5 gap-0.5 transition-all input-gradient-focus"
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = '0 0 0 1px rgba(139,92,246,0.15)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <input
              ref={inputRef}
              id={`num-${param.id}`}
              type="text"
              value={typedVal}
              onChange={e => setTypedVal(e.target.value)}
              onBlur={commit}
              onKeyDown={e => { if (e.key === 'Enter') inputRef.current?.blur(); }}
              className={`w-12 text-right bg-transparent text-[11px] font-mono outline-none ${flashing ? 'text-warning font-bold' : 'text-text-primary'}`}
            />
            {param.unit && (
              <span className="text-[9px] text-text-tertiary font-mono">{param.unit}</span>
            )}
          </div>
          {/* Field reset */}
          <button
            onClick={() => { onChange(param.defaultValue); setTypedVal(String(param.defaultValue)); }}
            data-tooltip="Reset to default"
            aria-label="Reset field"
            className="w-5 h-5 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-2 rounded cursor-pointer transition-colors opacity-0 group-hover/row:opacity-100"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
      {/* Slider — utilizes a dynamic gradient filled track */}
      <input
        type="range"
        min={param.min ?? 0}
        max={param.max ?? 100}
        step={param.step ?? 1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--accent) 0%, var(--accent-cyan) ${pct}%, var(--surface-3) ${pct}%, var(--surface-3) 100%)`,
        }}
        aria-label={param.label}
      />
    </div>
  );
}

// ─── Dropdown field ───────────────────────────────────────────────────────────
interface DropdownFieldProps {
  param: any; value: string; isOpen: boolean; setOpen: (o: boolean) => void; onChange: (v: string) => void;
}
function DropdownField({ param, value, isOpen, setOpen, onChange }: DropdownFieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hi, setHi] = useState(0);
  const opts = param.options ?? [];

  useEffect(() => {
    if (!isOpen) return;
    const idx = opts.indexOf(value);
    setHi(idx >= 0 ? idx : 0);
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [isOpen]);

  return (
    <div className="flex items-center justify-between gap-2" ref={ref}>
      <span className="text-[12px] text-text-secondary font-medium select-none shrink-0 w-[45%] truncate">{param.label}</span>
      <div className="relative flex-1">
        <button
          onClick={() => setOpen(!isOpen)}
          onKeyDown={e => {
            if (!isOpen) {
              if (['ArrowDown', 'Enter', ' '].includes(e.key)) { e.preventDefault(); setOpen(true); }
              return;
            }
            switch (e.key) {
              case 'ArrowDown': e.preventDefault(); setHi(p => (p + 1) % opts.length); break;
              case 'ArrowUp':   e.preventDefault(); setHi(p => (p - 1 + opts.length) % opts.length); break;
              case 'Enter':     e.preventDefault(); onChange(opts[hi]); setOpen(false); break;
              case 'Escape':    setOpen(false); break;
            }
          }}
          className="w-full h-7 px-2.5 rounded bg-surface-2 border border-border-default hover:border-border-strong text-[12px] flex items-center justify-between cursor-pointer focus:outline-none transition-colors"
          style={isOpen ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px rgba(139,92,246,0.15)' } : undefined}
          aria-haspopup="listbox" aria-expanded={isOpen}
        >
          <span className="text-text-primary truncate">{value}</span>
          <ChevronDown className="w-3 h-3 text-text-tertiary shrink-0 ml-1" />
        </button>
        {isOpen && (
          <div
            className="absolute top-8 left-0 w-full rounded shadow-lg py-0.5 z-40 max-h-[160px] overflow-y-auto animate-panel-in"
            style={{
              background: 'var(--surface-3)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-lg), 0 0 25px rgba(139,92,246,0.1)'
            }}
          >
            {opts.map((opt: string, i: number) => (
              <div
                key={opt} role="option" aria-selected={opt === value}
                onClick={() => { onChange(opt); setOpen(false); }}
                onMouseEnter={() => setHi(i)}
                className="h-7 px-2.5 flex items-center justify-between text-[12px] cursor-pointer transition-colors relative"
                style={{
                  background: opt === value
                    ? 'linear-gradient(90deg, rgba(139,92,246,0.12) 0%, rgba(6,182,212,0.05) 100%)'
                    : i === hi
                      ? 'var(--surface-2)'
                      : 'transparent',
                  color: opt === value ? 'var(--text-accent)' : 'var(--text-secondary)'
                }}
              >
                {opt === value && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: 'var(--grad-primary)' }} />
                )}
                <span>{opt}</span>
                {opt === value && <Check className="w-3 h-3 text-accent-cyan shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Material selector ────────────────────────────────────────────────────────
function MaterialSelector({ param, value, onChange }: { param: any; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12px] text-text-secondary font-medium">{param.label}</span>
      <div className="grid grid-cols-5 gap-1.5">
        {(param.options ?? []).map((opt: string) => {
          const sel = opt === value;
          return (
            <button key={opt} onClick={() => onChange(opt)}
              className="flex flex-col items-center gap-1 cursor-pointer group/sw focus:outline-none"
              aria-label={opt} aria-pressed={sel}
            >
              <div
                className={`w-10 h-10 rounded-full transition-all relative ${sel ? 'scale-105 shadow-md' : 'border border-border-default hover:border-border-strong hover:scale-[1.04]'}`}
                style={{
                  background: MATERIAL_GRADIENTS[opt] || '#888',
                  padding: '2px'
                }}
              >
                {sel && (
                  <div className="absolute inset-0 -m-[2px] rounded-full"
                    style={{ background: 'var(--grad-primary)', zIndex: -1 }}
                  />
                )}
              </div>
              <span className={`text-[9px] uppercase tracking-wider font-semibold transition-colors ${sel ? 'text-gradient' : 'text-text-tertiary group-hover/sw:text-text-secondary'}`}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Toggle field ─────────────────────────────────────────────────────────────
function ToggleField({ param, value, onChange }: { param: any; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(!value); } }}
      tabIndex={0}
      role="switch" aria-checked={value}
      className="flex items-center justify-between h-7 cursor-pointer hover:bg-surface-2 px-1 rounded transition-colors focus:outline-none"
    >
      <span className="text-[12px] text-text-secondary font-medium select-none">{param.label}</span>
      <div
        className="w-8 h-4 rounded-full relative transition-all"
        style={{
          background: value ? 'var(--grad-primary)' : 'var(--surface-3)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div
          className="w-2.5 h-2.5 rounded-full absolute top-[2px] transition-all shadow-sm"
          style={{
            left: value ? '17px' : '3px',
            background: value ? 'white' : 'var(--text-tertiary)',
          }}
        />
      </div>
    </div>
  );
}

// ─── Color field ──────────────────────────────────────────────────────────────
function ColorField({ param, value, isOpen, setOpen, onChange }: {
  param: any; value: string; isOpen: boolean; setOpen: (o: boolean) => void; onChange: (v: string) => void;
}) {
  const popRef = useRef<HTMLDivElement>(null);
  const [hex, setHex] = useState(value);
  useEffect(() => { setHex(value); }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [isOpen]);

  const submit = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) onChange(hex);
    else setHex(value);
  };

  return (
    <div className="flex items-center justify-between relative">
      <span className="text-[12px] text-text-secondary font-medium">{param.label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-text-tertiary uppercase">{value}</span>
        <button
          onClick={() => setOpen(!isOpen)}
          className="w-6 h-6 rounded cursor-pointer shadow-inner transition-all focus:outline-none"
          style={{
            backgroundColor: value,
            border: isOpen ? '1.5px solid var(--accent)' : '1px solid var(--border-default)',
            boxShadow: isOpen ? '0 0 8px rgba(139,92,246,0.3)' : 'none'
          }}
          aria-label="Pick colour"
        />
      </div>
      {isOpen && (
        <div ref={popRef} className="absolute right-0 top-9 w-44 p-3 z-40 flex flex-col gap-3 animate-panel-in"
          style={{
            background: 'var(--surface-3)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg), 0 0 25px rgba(139,92,246,0.1)'
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary">Swatches</span>
          <div className="grid grid-cols-4 gap-1.5">
            {CURATED_COLORS.map(c => (
              <button key={c} onClick={() => { onChange(c); setOpen(false); }}
                className={`w-6 h-6 rounded border cursor-pointer hover:scale-110 transition-transform relative ${c === value ? 'border-accent ring-1 ring-accent' : 'border-border-default'}`}
                style={{ backgroundColor: c }}
                aria-label={c}
              >
                {c === value && <Check className="w-3 h-3 absolute inset-0 m-auto text-white drop-shadow" />}
              </button>
            ))}
          </div>
          <div className="h-px bg-border-subtle" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-text-secondary font-medium">Custom hex</span>
            <div className="flex gap-1">
              <input
                type="text" value={hex}
                onChange={e => setHex(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                className="flex-1 h-6 px-1.5 bg-surface-2 border border-border-default rounded text-[11px] font-mono text-text-primary outline-none uppercase"
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e => { submit(); e.currentTarget.style.borderColor = 'var(--border-default)'; }}
              />
              <button onClick={submit} className="px-2 h-6 bg-surface-1 border border-border-default hover:bg-surface-2 rounded text-[10px] font-semibold text-text-secondary cursor-pointer transition-colors">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Component Transform Panel (Parts mode) ───────────────────────────────────
interface CTProps {
  selectedObjectType: string;
  selectedComponentIds: string[];
  activeReferenceComponentId: string | null;
  componentOverrides: Record<string, Record<string, any>>;
  updateTransformOverride: (id: string, t: any) => void;
  updateTransformOverridesBatch: (batch: Record<string, any>) => void;
  resetComponentTransform: (id: string) => void;
  resetAllComponentTransforms: () => void;
  transformSpace: 'local' | 'world';
  setTransformSpace: (s: 'local' | 'world') => void;
  translationSnap: number; setTranslationSnap: (v: number) => void;
  rotationSnap: number;    setRotationSnap: (v: number) => void;
  scaleSnap: number;       setScaleSnap: (v: number) => void;
}
function ComponentTransformPanel(p: CTProps) {
  const [uniformScale, setUniformScale] = useState(false);
  const [snapOpen, setSnapOpen] = useState(false);

  const objOvr = p.componentOverrides[p.selectedObjectType] || {};
  const refId  = p.activeReferenceComponentId;
  const refOvr = refId ? (objOvr[refId] ?? null) : null;

  const pos = refOvr?.position ?? { x: 0, y: 0, z: 0 };
  const rot = refOvr?.rotation ?? { x: 0, y: 0, z: 0 };
  const scl = refOvr?.scale    ?? { x: 1, y: 1, z: 1 };

  const setPos = (axis: 'x' | 'y' | 'z', v: number) => {
    if (!refId) return;
    p.updateTransformOverride(refId, { position: { ...pos, [axis]: v } });
  };
  const setRot = (axis: 'x' | 'y' | 'z', v: number) => {
    if (!refId) return;
    p.updateTransformOverride(refId, { rotation: { ...rot, [axis]: v } });
  };
  const setScl = (axis: 'x' | 'y' | 'z', v: number) => {
    if (!refId) return;
    if (uniformScale) {
      const ratio = scl[axis] !== 0 ? v / scl[axis] : 1;
      p.updateTransformOverride(refId, { scale: { x: scl.x * ratio, y: scl.y * ratio, z: scl.z * ratio } });
    } else {
      p.updateTransformOverride(refId, { scale: { ...scl, [axis]: v } });
    }
  };

  const alignComponents = (axis: 'x' | 'y' | 'z', side: 'min' | 'center' | 'max') => {
    if (!refId || p.selectedComponentIds.length < 2) return;
    const refVal = (refOvr?.position ?? { x: 0, y: 0, z: 0 })[axis];
    const batch: Record<string, any> = {};
    p.selectedComponentIds.forEach(id => {
      if (id === refId) return;
      const cur = objOvr[id]?.position ?? { x: 0, y: 0, z: 0 };
      batch[id] = { position: { ...cur, [axis]: refVal } };
    });
    p.updateTransformOverridesBatch(batch);
  };

  const mirrorComponent = (axis: 'x' | 'y' | 'z') => {
    if (!refId) return;
    const newPos = { ...pos, [axis]: -pos[axis] };
    const newRot = { ...rot };
    if (axis === 'x') { newRot.y = -rot.y; newRot.z = -rot.z; }
    if (axis === 'y') { newRot.x = -rot.x; newRot.z = -rot.z; }
    if (axis === 'z') { newRot.x = -rot.x; newRot.y = -rot.y; }
    p.updateTransformOverride(refId, { position: newPos, rotation: newRot });
  };

  const applyToSiblings = () => {
    if (!refId || p.selectedComponentIds.length < 2) return;
    const batch: Record<string, any> = {};
    p.selectedComponentIds.forEach(id => {
      if (id === refId) return;
      batch[id] = { position: { ...pos }, rotation: { ...rot }, scale: { ...scl } };
    });
    p.updateTransformOverridesBatch(batch);
  };

  const hasSelection = p.selectedComponentIds.length > 0;
  const hasRef = !!refId;
  const isMulti = p.selectedComponentIds.length > 1;

  const SubLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary block mb-1.5">{children}</span>
  );

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      {/* Parts mode header */}
      <div className="px-3 py-2.5 border-b border-border-subtle bg-surface-0 shrink-0 panel-header-accent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-text-accent" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-gradient">Parts</span>
          </div>
          {hasSelection && (
            <span className="text-[9px] font-bold text-white px-2 py-0.5 rounded shadow-sm" style={{ background: 'var(--grad-primary)' }}>
              {p.selectedComponentIds.length} Selected
            </span>
          )}
        </div>
        {!hasSelection && (
          <p className="text-[11px] text-text-tertiary mt-2 leading-relaxed">
            Click a part in the viewport or Scene panel to select it.
          </p>
        )}
      </div>

      {hasRef && (
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Selected part identity */}
          <div className="px-3 py-2 border-b border-border-subtle shrink-0 relative overflow-hidden"
            style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.06) 0%, transparent 100%)' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: 'var(--grad-primary)' }} />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold truncate text-gradient">{refId}</span>
              <button
                onClick={() => p.resetComponentTransform(refId)}
                data-tooltip="Reset this part's transform"
                aria-label="Reset transform"
                className="flex items-center gap-1 px-1.5 h-5 text-[10px] text-text-tertiary hover:text-text-primary hover:bg-surface-2 rounded border border-transparent hover:border-border-default cursor-pointer transition-all"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-0 overflow-y-auto">
            {/* Position */}
            <div className="flex flex-col gap-2 px-3 py-2.5 border-b border-border-subtle">
              <div className="flex items-center justify-between">
                <SubLabel>Position</SubLabel>
                <div className="flex rounded overflow-hidden p-[1px]" style={{ background: 'var(--border-default)' }}>
                  {(['local', 'world'] as const).map(s => (
                    <button key={s} onClick={() => p.setTransformSpace(s)}
                      className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                      style={p.transformSpace === s
                        ? { background: 'var(--grad-primary)', color: 'white', borderRadius: '2px' }
                        : { color: 'var(--text-tertiary)' }}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-1.5">
                <AxisInput axis="x" value={pos.x} step={1} unit="mm" onChange={v => setPos('x', v)} />
                <AxisInput axis="y" value={pos.y} step={1} unit="mm" onChange={v => setPos('y', v)} />
                <AxisInput axis="z" value={pos.z} step={1} unit="mm" onChange={v => setPos('z', v)} />
              </div>
            </div>

            {/* Rotation */}
            <div className="flex flex-col gap-2 px-3 py-2.5 border-b border-border-subtle">
              <SubLabel>Rotation</SubLabel>
              <div className="flex gap-1.5">
                <AxisInput axis="x" value={rot.x} step={0.5} unit="°" onChange={v => setRot('x', v)} />
                <AxisInput axis="y" value={rot.y} step={0.5} unit="°" onChange={v => setRot('y', v)} />
                <AxisInput axis="z" value={rot.z} step={0.5} unit="°" onChange={v => setRot('z', v)} />
              </div>
            </div>

            {/* Scale */}
            <div className="flex flex-col gap-2 px-3 py-2.5 border-b border-border-subtle">
              <div className="flex items-center justify-between">
                <SubLabel>Scale</SubLabel>
                <button
                  onClick={() => setUniformScale(v => !v)}
                  data-tooltip={uniformScale ? 'Uniform scale on' : 'Uniform scale off'}
                  aria-label="Lock uniform scale"
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase cursor-pointer transition-all"
                  style={uniformScale
                    ? { background: 'var(--accent-muted)', borderColor: 'var(--accent)', color: 'var(--text-accent)' }
                    : { borderColor: 'var(--border-default)', color: 'var(--text-tertiary)' }}
                >
                  {uniformScale ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                  Uniform
                </button>
              </div>
              <div className="flex gap-1.5">
                <AxisInput axis="x" value={scl.x} step={0.01} onChange={v => setScl('x', v)} />
                <AxisInput axis="y" value={scl.y} step={0.01} onChange={v => setScl('y', v)} />
                <AxisInput axis="z" value={scl.z} step={0.01} onChange={v => setScl('z', v)} />
              </div>
            </div>

            {/* Mirror */}
            <div className="flex flex-col gap-2 px-3 py-2.5 border-b border-border-subtle">
              <SubLabel>Mirror</SubLabel>
              <div className="flex gap-1.5">
                {(['x', 'y', 'z'] as const).map(axis => (
                  <button key={axis} onClick={() => mirrorComponent(axis)}
                    data-tooltip={`Mirror on ${axis.toUpperCase()}`}
                    className="flex-1 h-7 flex items-center justify-center gap-1 rounded text-text-secondary hover:text-text-primary text-[10px] font-bold uppercase cursor-pointer transition-all"
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-default)'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(139,92,246,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <AxisDot axis={axis} />
                    {axis.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-select alignment */}
            {isMulti && (
              <div className="flex flex-col gap-2 px-3 py-2.5 border-b border-border-subtle">
                <SubLabel>Align to Reference</SubLabel>
                <div className="flex gap-1">
                  <button title="Align Left (X)"    onClick={() => alignComponents('x', 'min')}    className="flex-1 h-7 rounded bg-surface-2 border border-border-default hover:bg-surface-3 text-text-secondary hover:text-text-primary text-[9px] font-bold cursor-pointer transition-colors flex items-center justify-center gap-0.5"><AlignStartHorizontal    className="w-3 h-3" /><span>L</span></button>
                  <button title="Center X"          onClick={() => alignComponents('x', 'center')} className="flex-1 h-7 rounded bg-surface-2 border border-border-default hover:bg-surface-3 text-text-secondary hover:text-text-primary text-[9px] font-bold cursor-pointer transition-colors flex items-center justify-center gap-0.5"><AlignCenterHorizontal   className="w-3 h-3" /><span>CX</span></button>
                  <button title="Align Right (X)"   onClick={() => alignComponents('x', 'max')}    className="flex-1 h-7 rounded bg-surface-2 border border-border-default hover:bg-surface-3 text-text-secondary hover:text-text-primary text-[9px] font-bold cursor-pointer transition-colors flex items-center justify-center gap-0.5"><AlignEndHorizontal      className="w-3 h-3" /><span>R</span></button>
                  <button title="Top (Y)"           onClick={() => alignComponents('y', 'max')}    className="flex-1 h-7 rounded bg-surface-2 border border-border-default hover:bg-surface-3 text-text-secondary hover:text-text-primary text-[9px] font-bold cursor-pointer transition-colors flex items-center justify-center gap-0.5"><AlignVerticalJustifyEnd    className="w-3 h-3" /><span>Top</span></button>
                  <button title="Center Y"          onClick={() => alignComponents('y', 'center')} className="flex-1 h-7 rounded bg-surface-2 border border-border-default hover:bg-surface-3 text-text-secondary hover:text-text-primary text-[9px] font-bold cursor-pointer transition-colors flex items-center justify-center gap-0.5"><AlignVerticalJustifyCenter className="w-3 h-3" /><span>CY</span></button>
                </div>
                <button
                  onClick={applyToSiblings}
                  className="w-full h-7 rounded border flex items-center justify-center gap-1.5 text-[11px] font-semibold text-text-secondary hover:text-text-primary cursor-pointer transition-all"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(139,92,246,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <Copy className="w-3 h-3 text-text-accent" />
                  Apply transform to all selected
                </button>
              </div>
            )}

            {/* Snap settings (collapsible) */}
            <div className="flex flex-col px-3 py-2.5 border-b border-border-subtle">
              <button
                onClick={() => setSnapOpen(v => !v)}
                className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-text-tertiary cursor-pointer hover:text-text-secondary transition-colors"
              >
                Snap Settings
                <ChevronDown className={`w-3 h-3 transition-transform ${snapOpen ? '' : '-rotate-90'}`} />
              </button>
              {snapOpen && (
                <div className="flex gap-1.5 mt-2 animate-panel-in">
                  <AxisInput axis="x" value={p.translationSnap} step={1} unit="mm" onChange={p.setTranslationSnap} />
                  <AxisInput axis="y" value={p.rotationSnap}    step={0.5} unit="°" onChange={p.setRotationSnap} />
                  <AxisInput axis="z" value={p.scaleSnap}       step={0.01}         onChange={p.setScaleSnap} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset all transforms */}
      {hasSelection && (
        <div className="px-3 py-2 border-t border-border-subtle shrink-0 mt-auto">
          <button
            onClick={p.resetAllComponentTransforms}
            className="w-full h-7 rounded border text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--error)';
              e.currentTarget.style.color = 'var(--error)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(239,68,68,0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <RotateCcw className="w-3 h-3" />
            Reset All Transforms
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Inspector component ─────────────────────────────────────────────────
export default function Inspector() {
  const selectedObjectType = useStore(s => s.selectedObjectType);
  const currentParams      = useStore(s => s.currentParams);
  const updateParam        = useStore(s => s.updateParam);
  const applyPreset        = useStore(s => s.applyPreset);
  const activePresetId     = useStore(s => s.activePresetId);
  const warningMessages    = useStore(s => s.warningMessages);
  const clearWarning       = useStore(s => s.clearWarning);
  const resetObject        = useStore(s => s.resetObject);
  const randomizeObject    = useStore(s => s.randomizeObject);

  const editMode                   = useStore(s => s.editMode);
  const selectedComponentIds       = useStore(s => s.selectedComponentIds);
  const activeReferenceComponentId = useStore(s => s.activeReferenceComponentId);
  const componentOverrides         = useStore(s => s.componentOverrides);
  const updateTransformOverride    = useStore(s => s.updateTransformOverride);
  const updateTransformOverridesBatch = useStore(s => s.updateTransformOverridesBatch);
  const resetComponentTransform    = useStore(s => s.resetComponentTransform);
  const resetAllComponentTransforms = useStore(s => s.resetAllComponentTransforms);
  const transformSpace             = useStore(s => s.transformSpace);
  const setTransformSpace          = useStore(s => s.setTransformSpace);
  const translationSnap            = useStore(s => s.translationSnap);
  const setTranslationSnap         = useStore(s => s.setTranslationSnap);
  const rotationSnap               = useStore(s => s.rotationSnap);
  const setRotationSnap            = useStore(s => s.setRotationSnap);
  const scaleSnap                  = useStore(s => s.scaleSnap);
  const setScaleSnap               = useStore(s => s.setScaleSnap);

  const activeModule   = objectRegistry[selectedObjectType];
  const ObjIcon        = OBJ_ICON[selectedObjectType] || Table2;

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [openDropdownId, setOpenDropdownId]     = useState<string | null>(null);
  const [colorPickerParamId, setColorPickerParamId] = useState<string | null>(null);
  const [collapsed, setCollapsed]               = useState(false);

  useEffect(() => {
    const secs = getSectionOrder(selectedObjectType);
    const init: Record<string, boolean> = {};
    secs.forEach(s => { init[s] = true; });
    setExpandedSections(init);
    setOpenDropdownId(null);
    setColorPickerParamId(null);
  }, [selectedObjectType]);

  if (!activeModule) return null;

  const toggleSection = (s: string) =>
    setExpandedSections(p => ({ ...p, [s]: !p[s] }));

  const sectionsList = getSectionOrder(selectedObjectType);

  // Bounding box for summary
  const getBB = () => {
    let w = 0, h = 0, d = 0;
    const p = currentParams;
    switch (selectedObjectType) {
      case 'table': w = p.width ?? 1200; h = p.height ?? 750; d = (p.shape === 'Square' || p.shape === 'Round') ? w : (p.depth ?? 800); break;
      case 'chair': w = p.seatWidth ?? 450; h = Math.round(p.height ?? 900); d = p.seatDepth ?? 450; break;
      case 'cup':   w = Math.max(p.topDiameter ?? 80, p.bottomDiameter ?? 60); h = p.height ?? 100; d = w; break;
      case 'mug':   w = p.diameter ?? 90; h = p.height ?? 95; d = w; break;
    }
    return { w, h, d };
  };
  const bb = getBB();

  // Collapsed state — thin strip
  if (collapsed) {
    return (
      <aside className="w-8 h-full bg-surface-1 border-l border-border-subtle flex flex-col items-center py-2 z-10 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          data-tooltip="Open Inspector"
          aria-label="Open Inspector"
          className="w-6 h-6 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-2 rounded cursor-pointer transition-colors"
        >
          <PanelRight className="w-3.5 h-3.5" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="flex flex-col h-full bg-surface-1 border-l border-border-subtle z-10 shrink-0"
      style={{ width: 'var(--width-right-panel)' }}
    >
      {/* ── Panel header ─────────────────────────────────────────── */}
      <div className="h-8 px-3 flex items-center justify-between border-b border-border-subtle bg-surface-0 shrink-0 panel-header-accent">
        <div className="flex items-center gap-2">
          <ObjIcon className="w-3.5 h-3.5 text-text-accent" />
          <span className="text-[12px] font-semibold text-text-primary">{activeModule.label}</span>
          <span className="text-[10px] text-text-tertiary font-mono">{bb.w}×{bb.h}×{bb.d}mm</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gradient">
            {editMode === 'component' ? 'Parts' : 'Properties'}
          </span>
          <button
            onClick={() => setCollapsed(true)}
            data-tooltip="Collapse panel"
            aria-label="Collapse Inspector"
            className="w-5 h-5 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-2 rounded cursor-pointer transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── PARTS MODE: show ComponentTransformPanel only ─────────── */}
      {editMode === 'component' ? (
        <ComponentTransformPanel
          selectedObjectType={selectedObjectType}
          selectedComponentIds={selectedComponentIds}
          activeReferenceComponentId={activeReferenceComponentId}
          componentOverrides={componentOverrides}
          updateTransformOverride={updateTransformOverride}
          updateTransformOverridesBatch={updateTransformOverridesBatch}
          resetComponentTransform={resetComponentTransform}
          resetAllComponentTransforms={resetAllComponentTransforms}
          transformSpace={transformSpace}
          setTransformSpace={setTransformSpace}
          translationSnap={translationSnap}
          setTranslationSnap={setTranslationSnap}
          rotationSnap={rotationSnap}
          setRotationSnap={setRotationSnap}
          scaleSnap={scaleSnap}
          setScaleSnap={setScaleSnap}
        />
      ) : (
        /* ── PROPERTIES MODE ──────────────────────────────────────── */
        <>
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto flex flex-col">

            {/* Presets row */}
            {activeModule.presets?.length > 0 && (
              <div className="px-3 py-2.5 border-b border-border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Quick Start</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeModule.presets.map(preset => {
                    const sel = preset.id === activePresetId;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => applyPreset(preset.id)}
                        className="px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition-all select-none"
                        style={sel
                          ? { background: 'var(--grad-primary)', color: 'white', boxShadow: 'var(--shadow-btn)' }
                          : { background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
                        onMouseEnter={e => {
                          if (!sel) {
                            e.currentTarget.style.borderColor = 'var(--accent)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!sel) {
                            e.currentTarget.style.borderColor = 'var(--border-default)';
                            e.currentTarget.style.color = '';
                          }
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Schema-driven collapsible sections */}
            {sectionsList.map(sectionName => {
              const isExpanded = !!expandedSections[sectionName];
              const sectionParams = activeModule.paramSchema.filter(p => p.section === sectionName);
              const visibleParams = sectionParams.filter(p => (p.visible ? p.visible(currentParams) : true));
              if (visibleParams.length === 0) return null;

              return (
                <CollapsibleSection
                  key={sectionName}
                  label={sectionName}
                  expanded={isExpanded}
                  onToggle={() => toggleSection(sectionName)}
                >
                  {visibleParams.map(param => {
                    const value      = currentParams[param.id] ?? param.defaultValue;
                    const hasWarning = !!warningMessages[param.id];

                    return (
                      <div key={param.id} className="group/row">
                        {param.type === 'number' && (
                          <NumericField
                            param={param} value={value} hasWarning={hasWarning}
                            warningMessage={warningMessages[param.id]}
                            onClearWarning={() => clearWarning(param.id)}
                            onChange={val => updateParam(param.id, val)}
                          />
                        )}
                        {param.type === 'enum' && param.id !== 'material' && (
                          <DropdownField
                            param={param} value={value}
                            isOpen={openDropdownId === param.id}
                            setOpen={o => setOpenDropdownId(o ? param.id : null)}
                            onChange={val => updateParam(param.id, val)}
                          />
                        )}
                        {param.id === 'material' && (
                          <MaterialSelector
                            param={param} value={value}
                            onChange={val => updateParam(param.id, val)}
                          />
                        )}
                        {param.type === 'boolean' && (
                          <ToggleField
                            param={param} value={value}
                            onChange={val => updateParam(param.id, val)}
                          />
                        )}
                        {param.type === 'color' && (
                          <ColorField
                            param={param} value={value}
                            isOpen={colorPickerParamId === param.id}
                            setOpen={o => setColorPickerParamId(o ? param.id : null)}
                            onChange={val => updateParam(param.id, val)}
                          />
                        )}
                      </div>
                    );
                  })}
                </CollapsibleSection>
              );
            })}

            {/* Bottom spacer */}
            <div className="h-4 shrink-0" />
          </div>

          {/* Sticky footer */}
          <div className="px-3 py-2 border-t border-border-subtle bg-surface-0 shrink-0 flex gap-2">
            <button
              onClick={resetObject}
              className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded text-[12px] font-semibold text-text-secondary hover:text-text-primary cursor-pointer transition-all"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(139,92,246,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <RotateCcw className="w-3 h-3 text-text-tertiary" />
              Reset Changes
            </button>
            <button
              onClick={randomizeObject}
              className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded text-[12px] font-semibold text-white cursor-pointer transition-all btn-gradient"
            >
              <Shuffle className="w-3 h-3" />
              Randomize
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
