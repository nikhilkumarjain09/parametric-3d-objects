'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, RotateCcw, Check, Sparkles, Shuffle } from 'lucide-react';
import { useStore } from '../../state/store';
import { objectRegistry } from '../../objects';

// Helper function to map object types to Section 17 ordering
const getSectionOrder = (type: string) => {
  switch (type) {
    case 'table':
      return ['Dimensions', 'Tabletop', 'Legs', 'Appearance'];
    case 'chair':
      return ['Dimensions', 'Seat', 'Backrest', 'Legs', 'Armrests', 'Appearance'];
    case 'cup':
      return ['Dimensions', 'Body', 'Base', 'Rim', 'Appearance'];
    case 'mug':
      return ['Dimensions', 'Body', 'Handle', 'Base', 'Rim', 'Appearance'];
    default:
      return [];
  }
};

// Curated palette of professional colors (Section 12.4)
const CURATED_COLORS = [
  '#f8fafc', // Slate White
  '#1e293b', // Slate Dark
  '#8b5a2b', // Natural Wood
  '#5c4033', // Dark Walnut
  '#cbd5e1', // Cool Silver
  '#0d9488', // Teal accent
  '#e11d48', // Glossy Rose
  '#f59e0b', // Amber Gold
];

// Sphere gradient mappings to simulate material shaders (Section 12.5)
const MATERIAL_GRADIENTS: Record<string, string> = {
  Ceramic: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 60%, #94a3b8 100%)',
  Wood: 'radial-gradient(circle at 35% 35%, #d97706 0%, #92400e 65%, #451a03 100%)',
  Metal: 'radial-gradient(circle at 35% 35%, #f1f5f9 0%, #94a3b8 50%, #475569 100%)',
  Plastic: 'radial-gradient(circle at 35% 35%, #f87171 0%, #dc2626 60%, #7f1d1d 100%)',
  Glass: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.7) 0%, rgba(186, 230, 253, 0.3) 50%, rgba(56, 189, 248, 0.15) 100%)',
};

export default function Inspector() {
  const selectedObjectType = useStore((state) => state.selectedObjectType);
  const currentParams = useStore((state) => state.currentParams);
  const updateParam = useStore((state) => state.updateParam);
  const applyPreset = useStore((state) => state.applyPreset);
  const activePresetId = useStore((state) => state.activePresetId);
  const warningMessages = useStore((state) => state.warningMessages);
  const clearWarning = useStore((state) => state.clearWarning);
  const resetObject = useStore((state) => state.resetObject);
  const randomizeObject = useStore((state) => state.randomizeObject);

  const activeModule = objectRegistry[selectedObjectType];

  // Local state for expanded sections (persists in current session per object type, Section 7.1)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Custom dropdown open track
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  // Color Picker Popover
  const [colorPickerParamId, setColorPickerParamId] = useState<string | null>(null);

  // Initialize and default all sections to expanded on first load of object type (Section 7.1)
  useEffect(() => {
    const sections = getSectionOrder(selectedObjectType);
    const initialExpanded: Record<string, boolean> = {};
    sections.forEach((sec) => {
      initialExpanded[sec] = true;
    });
    setExpandedSections(initialExpanded);
    setOpenDropdownId(null);
    setColorPickerParamId(null);
  }, [selectedObjectType]);

  if (!activeModule) return null;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const sectionsList = getSectionOrder(selectedObjectType);

  return (
    <aside className="w-[340px] h-full bg-surface-1 border-l border-border-subtle flex flex-col text-text-primary select-none z-10 relative">
      {/* Inspector Header */}
      <div className="h-8 px-4 flex items-center border-b border-border-subtle bg-surface-0 shrink-0">
        <span className="text-size-micro font-bold tracking-wider text-text-tertiary uppercase">
          INSPECTOR
        </span>
      </div>

      {/* Main Parameters Scroll List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 scrollbar">
        
        {/* --- A. PRESET SELECTOR (Section 7.1 & 15.5) --- */}
        {activeModule.presets && activeModule.presets.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-size-micro font-bold text-text-tertiary uppercase tracking-wider">
              Presets
            </span>
            <div className="relative">
              <button
                onClick={() => setOpenDropdownId(openDropdownId === 'presets' ? null : 'presets')}
                className="w-full h-8 px-3 rounded-sm bg-surface-2 border border-border-default hover:border-border-strong text-size-body flex items-center justify-between cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
              >
                <span className="font-medium text-text-primary">
                  {activePresetId 
                    ? activeModule.presets.find(p => p.id === activePresetId)?.label 
                    : 'Select a Preset...'}
                </span>
                <ChevronDown className="w-4 h-4 text-text-tertiary" />
              </button>

              {openDropdownId === 'presets' && (
                <div className="absolute top-9 left-0 w-full bg-surface-3 border border-border-strong rounded-md shadow-2xl py-1 z-30 max-h-[200px] overflow-y-auto">
                  {activeModule.presets.map((preset) => {
                    const isSelected = preset.id === activePresetId;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => {
                          applyPreset(preset.id);
                          setOpenDropdownId(null);
                        }}
                        className={`h-7 px-3 flex items-center justify-between text-size-secondary cursor-pointer hover:bg-surface-2 ${
                          isSelected ? 'text-text-accent font-medium' : 'text-text-secondary'
                        }`}
                      >
                        <span>{preset.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-text-accent" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="h-[1px] bg-border-subtle mt-2" />
          </div>
        )}

        {/* --- B. SCHEMA-DRIVEN COLLAPSIBLE SECTIONS (Section 7.1) --- */}
        {sectionsList.map((sectionName) => {
          const isExpanded = !!expandedSections[sectionName];
          
          // Filter schema parameters belonging to this section
          const sectionParams = activeModule.paramSchema.filter(
            (param) => param.section === sectionName
          );

          // Apply conditional field visibility filtering (hide, not disable - ASM-013)
          const visibleParams = sectionParams.filter((param) => {
            if (param.visible) {
              return param.visible(currentParams);
            }
            return true;
          });

          if (visibleParams.length === 0) return null;

          return (
            <div key={sectionName} className="flex flex-col">
              {/* Section Collapsible Header */}
              <button
                onClick={() => toggleSection(sectionName)}
                className="h-8 flex items-center justify-between bg-surface-1 border-b border-border-subtle hover:bg-surface-2 px-1 cursor-pointer transition-colors"
              >
                <span className="text-size-header font-bold text-text-secondary uppercase tracking-wide">
                  {sectionName}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-text-tertiary transition-transform duration-150 ${
                    isExpanded ? '' : '-rotate-90'
                  }`}
                />
              </button>

              {/* Section Body */}
              {isExpanded && (
                <div className="flex flex-col gap-4 py-3 pl-1 pr-1">
                  {visibleParams.map((param) => {
                    const value = currentParams[param.id] ?? param.defaultValue;
                    const hasWarning = !!warningMessages[param.id];

                    return (
                      <div key={param.id} className="flex flex-col gap-2 relative group/row">
                        {/* 1. NUMERIC FIELD (Section 12.1) */}
                        {param.type === 'number' && (
                          <NumericField 
                            param={param} 
                            value={value} 
                            hasWarning={hasWarning}
                            warningMessage={warningMessages[param.id]}
                            onClearWarning={() => clearWarning(param.id)}
                            onChange={(val) => updateParam(param.id, val)}
                          />
                        )}

                        {/* 2. DROPDOWN FIELD (Section 12.2) */}
                        {param.type === 'enum' && param.id !== 'material' && (
                          <DropdownField
                            param={param}
                            value={value}
                            isOpen={openDropdownId === param.id}
                            setOpen={(open) => setOpenDropdownId(open ? param.id : null)}
                            onChange={(val) => updateParam(param.id, val)}
                          />
                        )}

                        {/* 3. MATERIAL SELECTOR (Section 12.5) */}
                        {param.id === 'material' && (
                          <MaterialSelector
                            param={param}
                            value={value}
                            onChange={(val) => updateParam(param.id, val)}
                          />
                        )}

                        {/* 4. TOGGLE FIELD (Section 12.3) */}
                        {param.type === 'boolean' && (
                          <ToggleField
                            param={param}
                            value={value}
                            onChange={(val) => updateParam(param.id, val)}
                          />
                        )}

                        {/* 5. COLOR PICKER FIELD (Section 12.4) */}
                        {param.type === 'color' && (
                          <ColorField
                            param={param}
                            value={value}
                            isOpen={colorPickerParamId === param.id}
                            setOpen={(open) => setColorPickerParamId(open ? param.id : null)}
                            onChange={(val) => updateParam(param.id, val)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {/* HAIRLINE DIVIDER BETWEEN SECTIONS (Section 7.2) */}
              <div className="h-[1px] bg-border-subtle mt-2" />
            </div>
          );
        })}
      </div>

      {/* Sticky Reset/Randomize footer (Section 7.1 & 21-22) */}
      <div className="p-4 border-t border-border-subtle bg-surface-0 shrink-0 grid grid-cols-2 gap-2">
        <button
          onClick={resetObject}
          className="flex items-center justify-center gap-1.5 h-8 rounded-sm bg-surface-1 border border-border-default hover:bg-surface-2 text-size-secondary font-medium text-text-secondary hover:text-text-primary transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
        <button
          onClick={randomizeObject}
          className="flex items-center justify-center gap-1.5 h-8 rounded-sm bg-surface-1 border border-border-default hover:bg-surface-2 text-size-secondary font-medium text-text-secondary hover:text-text-primary transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>Randomize</span>
        </button>
      </div>
    </aside>
  );
}

// --- SUB-COMPONENTS FOR CONTROLS ---

// 1. Numeric Field Component (Slider + Input + Reset, Section 12.1)
interface NumericFieldProps {
  param: any;
  value: number;
  hasWarning: boolean;
  warningMessage?: string;
  onClearWarning: () => void;
  onChange: (val: number) => void;
}

function NumericField({ param, value, hasWarning, warningMessage, onClearWarning, onChange }: NumericFieldProps) {
  const [typedValue, setTypedValue] = useState(String(value));
  const [isFlashing, setIsFlashing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync typed value if external value changes (slider drag or preset)
  useEffect(() => {
    setTypedValue(String(value));
  }, [value]);

  // Flash warning effect
  useEffect(() => {
    if (hasWarning) {
      setIsFlashing(true);
      const timer = setTimeout(() => {
        setIsFlashing(false);
        onClearWarning(); // Clear warning message after timeout
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [hasWarning]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTypedValue(e.target.value);
  };

  const handleInputBlur = () => {
    let parsed = Number(typedValue);
    if (isNaN(parsed)) {
      setTypedValue(String(value));
      return;
    }

    // Clamp on blur (Section 12.1 / REQ-CTRL-002)
    const min = param.min ?? 0;
    const max = param.max ?? 1000;
    const clamped = Math.max(min, Math.min(max, parsed));

    if (clamped !== parsed) {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 800);
    }

    onChange(clamped);
    setTypedValue(String(clamped));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  const handleReset = () => {
    onChange(param.defaultValue);
    setTypedValue(String(param.defaultValue));
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Label and Input Row */}
      <div className="flex items-center justify-between text-size-secondary relative">
        <label className="text-text-secondary font-medium select-none" htmlFor={`num-input-${param.id}`}>
          {param.label}
        </label>
        
        <div className="flex items-center gap-1.5">
          {/* Numeric Entry Box */}
          <div className="flex items-center bg-surface-2 border border-border-default rounded-sm px-1 h-[24px]">
            <input
              ref={inputRef}
              id={`num-input-${param.id}`}
              type="text"
              value={typedValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              className={`w-12 text-right bg-transparent text-size-secondary outline-none font-mono text-text-primary ${
                isFlashing ? 'text-warning font-bold' : ''
              }`}
            />
            {param.unit && (
              <span className="text-size-micro text-text-tertiary ml-0.5 select-none">
                {param.unit}
              </span>
            )}
          </div>

          {/* Reset field button (visible on hover of control row, Section 12.1) */}
          <button
            onClick={handleReset}
            title="Reset field to default"
            className="w-[20px] h-[20px] flex items-center justify-center rounded-sm hover:bg-surface-3 border border-transparent hover:border-border-default text-text-tertiary hover:text-text-primary transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Slider Track (Section 12.1) */}
      <div className="flex items-center w-full h-[24px] px-1 relative">
        <input
          type="range"
          min={param.min ?? 0}
          max={param.max ?? 100}
          step={param.step ?? 1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1 bg-surface-3 rounded-full appearance-none cursor-pointer outline-none accent-accent hover:accent-accent-hover"
          style={{
            background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${
              ((value - (param.min ?? 0)) / ((param.max ?? 100) - (param.min ?? 0))) * 100
            }%, var(--surface-3) ${
              ((value - (param.min ?? 0)) / ((param.max ?? 100) - (param.min ?? 0))) * 100
            }%, var(--surface-3) 100%)`,
          }}
        />
      </div>

      {/* Transient Warning Tooltip (Section 14 & 20.4) */}
      {hasWarning && warningMessage && (
        <div className="absolute top-[-26px] right-2 bg-surface-3 border border-warning rounded-sm shadow-xl px-2 py-0.5 z-40 text-size-micro text-warning flex items-center gap-1.5 transition-opacity">
          <Sparkles className="w-3 h-3" />
          <span>{warningMessage}</span>
        </div>
      )}
    </div>
  );
}

// 2. Dropdown Component (Section 12.2)
interface DropdownFieldProps {
  param: any;
  value: string;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  onChange: (val: string) => void;
}

function DropdownField({ param, value, isOpen, setOpen, onChange }: DropdownFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const options = param.options ?? [];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      const currentIndex = options.indexOf(value);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
        break;
      case 'Enter':
        e.preventDefault();
        onChange(options[highlightedIndex]);
        setOpen(false);
        break;
      case 'Escape':
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div className="flex items-center justify-between w-full h-[32px]" ref={containerRef}>
      <span className="text-size-secondary text-text-secondary font-medium select-none w-[40%]">
        {param.label}
      </span>

      <div className="relative w-[60%]">
        <button
          onClick={() => setOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className="w-full h-8 px-3 rounded-sm bg-surface-2 border border-border-default hover:border-border-strong text-size-secondary flex items-center justify-between cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
        >
          <span className="text-text-primary truncate">{value}</span>
          <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
        </button>

        {isOpen && (
          <div className="absolute top-9 left-0 w-full bg-surface-3 border border-border-strong rounded-md shadow-2xl py-1 z-35 max-h-[160px] overflow-y-auto">
            {options.map((opt: string, index: number) => {
              const isSelected = opt === value;
              const isHighlighted = index === highlightedIndex;
              return (
                <div
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`h-7 px-3 flex items-center justify-between text-size-secondary cursor-pointer ${
                    isSelected ? 'text-text-accent font-medium' : 'text-text-secondary'
                  } ${isHighlighted && !isSelected ? 'bg-surface-2 text-text-primary' : ''}`}
                >
                  <span>{opt}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-text-accent" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// 3. Material Selector Component (Rendered swatches, Section 12.5)
interface MaterialSelectorProps {
  param: any;
  value: string;
  onChange: (val: string) => void;
}

function MaterialSelector({ param, value, onChange }: MaterialSelectorProps) {
  const options = param.options ?? [];

  return (
    <div className="flex flex-col gap-2 w-full mt-1">
      <span className="text-size-secondary text-text-secondary font-medium select-none">
        {param.label}
      </span>
      
      {/* Horizontal grid of swatches (Section 12.5) */}
      <div className="grid grid-cols-4 gap-2">
        {options.map((opt: string) => {
          const isSelected = opt === value;
          const bgStyle = MATERIAL_GRADIENTS[opt] || 'gray';
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className="flex flex-col items-center gap-1.5 focus:outline-none group/swatch cursor-pointer"
            >
              {/* Sphere Gradient Preview Container */}
              <div 
                className={`w-12 h-12 rounded-full transition-all duration-150 relative ${
                  isSelected 
                    ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-1 scale-105 shadow-lg' 
                    : 'border border-border-default hover:border-border-strong hover:scale-[1.02]'
                }`}
                style={{ background: bgStyle }}
              />
              
              {/* Material label */}
              <span className={`text-size-micro tracking-wide uppercase transition-colors duration-100 ${
                isSelected ? 'text-text-accent font-bold' : 'text-text-tertiary group-hover/swatch:text-text-secondary'
              }`}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 4. Toggle Switch Component (Section 12.3)
interface ToggleFieldProps {
  param: any;
  value: boolean;
  onChange: (val: boolean) => void;
}

function ToggleField({ param, value, onChange }: ToggleFieldProps) {
  const handleToggle = () => {
    onChange(!value);
  };

  return (
    <div 
      onClick={handleToggle}
      className="flex items-center justify-between w-full h-[32px] cursor-pointer hover:bg-surface-2/40 px-1 rounded-sm transition-colors"
    >
      <span className="text-size-secondary text-text-secondary font-medium select-none">
        {param.label}
      </span>

      {/* Switch Outer Track */}
      <div className="relative">
        <input
          type="checkbox"
          checked={value}
          onChange={handleToggle}
          className="sr-only"
          id={`toggle-${param.id}`}
        />
        <div 
          className={`w-9 h-5 rounded-full border transition-colors duration-150 relative ${
            value 
              ? 'bg-accent border-accent' 
              : 'bg-surface-3 border-border-default'
          }`}
        >
          {/* Switch Inner Thumb */}
          <div 
            className={`w-3.5 h-3.5 rounded-full absolute top-[2px] transition-all duration-150 ${
              value 
                ? 'right-[2px] bg-white translate-x-0' 
                : 'left-[2px] bg-text-secondary translate-x-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
}

// 5. Color Swatch + Curated Popover Picker Component (Section 12.4)
interface ColorFieldProps {
  param: any;
  value: string;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  onChange: (val: string) => void;
}

function ColorField({ param, value, isOpen, setOpen, onChange }: ColorFieldProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [hexInput, setHexInput] = useState(value);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleHexSubmit = () => {
    // Validate standard 6-digit hex codes (Section 12.4)
    if (/^#[0-9A-Fa-f]{6}$/.test(hexInput)) {
      onChange(hexInput);
    } else {
      setHexInput(value); // Reset on invalid
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleHexSubmit();
    }
  };

  return (
    <div className="flex items-center justify-between w-full h-[32px] relative">
      <span className="text-size-secondary text-text-secondary font-medium select-none">
        {param.label}
      </span>

      {/* Trigger Swatch Button */}
      <div className="flex items-center gap-2">
        <span className="text-size-secondary font-mono text-text-tertiary uppercase">
          {value}
        </span>
        <button
          onClick={() => setOpen(!isOpen)}
          className="w-6 h-6 rounded-sm border border-border-default hover:border-border-strong transition-all focus:ring-1 focus:ring-accent cursor-pointer shadow-inner"
          style={{ backgroundColor: value }}
          title="Open color swatches"
        />
      </div>

      {/* Floating Popover Palette (Section 12.4) */}
      {isOpen && (
        <div 
          ref={popoverRef}
          className="absolute right-0 top-9 w-[180px] bg-surface-3 border border-border-strong rounded-md shadow-2xl p-3 z-35 flex flex-col gap-3"
        >
          <span className="text-size-micro font-bold text-text-tertiary uppercase tracking-wider">
            Curated Swatches
          </span>

          {/* Curated color grid */}
          <div className="grid grid-cols-4 gap-2">
            {CURATED_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onChange(color);
                  setOpen(false);
                }}
                className={`w-6 h-6 rounded-sm border hover:scale-105 transition-transform cursor-pointer relative ${
                  color === value ? 'border-accent ring-1 ring-accent' : 'border-border-default hover:border-border-strong'
                }`}
                style={{ backgroundColor: color }}
              >
                {color === value && (
                  <Check className="w-3.5 h-3.5 absolute inset-0 m-auto text-text-on-accent drop-shadow" />
                )}
              </button>
            ))}
          </div>

          <div className="h-[1px] bg-border-subtle" />

          {/* Custom Hex input (Section 12.4) */}
          <div className="flex flex-col gap-1">
            <span className="text-size-micro text-text-secondary font-medium">Custom Hex</span>
            <div className="flex gap-1 h-[24px]">
              <input
                type="text"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                onBlur={handleHexSubmit}
                onKeyDown={handleKeyDown}
                className="flex-1 px-1 bg-surface-2 border border-border-default rounded-sm text-size-secondary font-mono text-text-primary outline-none focus:border-border-strong uppercase"
              />
              <button
                onClick={handleHexSubmit}
                className="px-2 bg-surface-1 border border-border-default hover:bg-surface-2 rounded-sm text-size-micro font-medium text-text-secondary cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
