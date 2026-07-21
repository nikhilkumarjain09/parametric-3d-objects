'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Table2, 
  Armchair, 
  CupSoda, 
  Coffee, 
  ChevronDown, 
  MousePointer2, 
  Scan, 
  RefreshCcw, 
  Grid3x3, 
  BoxSelect, 
  Box, 
  RotateCcw, 
  Shuffle,
  HelpCircle
} from 'lucide-react';
import { useStore } from '../../state/store';
import { objectList, ObjectDefinitionModule } from '../../objects';

// Icon mapping based on Section 10.1 of design-and-settings.md
const iconMap: Record<string, React.ComponentType<any>> = {
  'table-2': Table2,
  'armchair': Armchair,
  'cup-soda': CupSoda,
  'coffee': Coffee,
};

interface DropdownItem {
  id: string;
  label: string;
  icon: string;
  description: string;
  disabled?: boolean;
}

export default function Toolbar() {
  const selectedObjectType = useStore((state) => state.selectedObjectType);
  const setSelectedObjectType = useStore((state) => state.setSelectedObjectType);
  const resetObject = useStore((state) => state.resetObject);
  const randomizeObject = useStore((state) => state.randomizeObject);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activeModule = objectList.find(o => o.id === selectedObjectType) || objectList[0];
  const ActiveIcon = iconMap[activeModule.icon] || Table2;

  // The 4 registered objects plus the disabled future row (Section 4 & 7)
  const items: DropdownItem[] = [
    {
      id: 'table',
      label: 'Table',
      icon: 'table-2',
      description: 'Create and customize parametric tables, desks, and surfaces.',
    },
    {
      id: 'chair',
      label: 'Chair',
      icon: 'armchair',
      description: 'Generate customizable chairs, stools, and armchairs.',
    },
    {
      id: 'cup',
      label: 'Cup',
      icon: 'cup-soda',
      description: 'Procedurally model hollow glasses, cups, and tumblers.',
    },
    {
      id: 'mug',
      label: 'Mug',
      icon: 'coffee',
      description: 'Model hollow mugs with fully attached curved handles.',
    },
    {
      id: 'coming-soon',
      label: 'More objects',
      icon: 'settings-2',
      description: 'Coming soon — additional object types under development.',
      disabled: true,
    }
  ];

  // Number of active (selectable) items
  const activeItemsCount = items.filter(item => !item.disabled).length;

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Highlight current selected item index
      const currentIndex = items.findIndex(item => item.id === selectedObjectType);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedObjectType(id);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard navigation logic (Section 4 listbox mechanics)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        const currentIndex = items.findIndex(item => item.id === selectedObjectType);
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        // Cycle only through active items (0-3)
        setHighlightedIndex((prev) => (prev + 1) % activeItemsCount);
        break;
      case 'ArrowUp':
        e.preventDefault();
        // Cycle only through active items (0-3)
        setHighlightedIndex((prev) => (prev - 1 + activeItemsCount) % activeItemsCount);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < activeItemsCount) {
          handleSelect(items[highlightedIndex].id);
        }
        break;
      case 'Escape':
      case 'Tab':
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
    }
  };

  return (
    <header className="h-[56px] w-full bg-surface-0 border-b border-border-strong px-4 flex items-center justify-between text-text-primary select-none z-50 relative">
      {/* Left: Brand and Object Selection dropdown */}
      <div className="flex items-center gap-4 h-full">
        <span className="font-mono font-bold text-size-header tracking-wider text-text-primary">
          PARAMETRIC_3D
        </span>
        
        <div className="h-6 w-[1px] bg-border-strong" />

        {/* Combobox container (Section 4) */}
        <div className="relative" ref={containerRef}>
          <button
            ref={triggerRef}
            id="object-select-trigger"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls="object-select-listbox"
            onClick={toggleDropdown}
            onKeyDown={handleKeyDown}
            className="flex items-center gap-3 px-4 h-8 rounded-full bg-surface-2 border border-border-strong hover:bg-surface-3 transition-colors duration-150 text-size-body font-medium text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-0"
          >
            <ActiveIcon className="w-4 h-4 text-text-accent" />
            <span>{activeModule.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Floating dropdown listbox */}
          {isOpen && (
            <div
              id="object-select-listbox"
              role="listbox"
              aria-labelledby="object-select-trigger"
              className="absolute top-10 left-0 w-[340px] bg-surface-2 border border-border-default rounded-md shadow-xl py-1 z-50 focus:outline-none"
            >
              {items.map((item, index) => {
                const ItemIcon = iconMap[item.icon] || HelpCircle;
                const isSelected = item.id === selectedObjectType;
                const isHighlighted = index === highlightedIndex;

                if (item.disabled) {
                  return (
                    <div
                      key={item.id}
                      role="option"
                      aria-disabled="true"
                      aria-selected="false"
                      title="Additional object types will be added in a future release."
                      className="px-4 py-2 mt-1 border-t border-border-subtle flex items-start gap-3 opacity-40 text-text-tertiary cursor-not-allowed select-none"
                    >
                      <HelpCircle className="w-4 h-4 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-size-body font-bold">{item.label}</span>
                        <span className="text-size-micro text-text-tertiary">{item.description}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    id={`object-option-${item.id}`}
                    onClick={() => handleSelect(item.id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-4 py-2 flex items-start gap-3 cursor-pointer select-none transition-colors duration-100 ${
                      isSelected 
                        ? 'border-l-2 border-border-accent bg-accent-muted text-text-primary' 
                        : 'border-l-2 border-transparent text-text-secondary'
                    } ${
                      isHighlighted && !isSelected 
                        ? 'bg-surface-3 text-text-primary' 
                        : ''
                    }`}
                  >
                    <ItemIcon className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-text-accent' : 'text-text-tertiary'}`} />
                    <div className="flex flex-col">
                      <span className="text-size-body font-bold">{item.label}</span>
                      <span className="text-size-micro text-text-tertiary">{item.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Viewport controls (Section 3 placeholder) */}
      <div className="flex items-center gap-1.5">
        <button 
          aria-label="Pointer Tool"
          className="w-8 h-8 rounded-sm hover:bg-surface-2 flex items-center justify-center border border-transparent hover:border-border-default text-text-secondary cursor-pointer"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button 
          aria-label="Frame Selection"
          className="w-8 h-8 rounded-sm hover:bg-surface-2 flex items-center justify-center border border-transparent hover:border-border-default text-text-secondary cursor-pointer"
        >
          <Scan className="w-4 h-4" />
        </button>
        <button 
          aria-label="Reset View"
          className="w-8 h-8 rounded-sm hover:bg-surface-2 flex items-center justify-center border border-transparent hover:border-border-default text-text-secondary cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-border-subtle mx-1" />
        <button 
          aria-label="Grid Toggle"
          className="w-8 h-8 rounded-sm bg-surface-2 border border-border-strong flex items-center justify-center text-text-accent cursor-pointer"
        >
          <Grid3x3 className="w-4 h-4" />
        </button>
        <button 
          aria-label="Display Mode"
          className="w-8 h-8 rounded-sm hover:bg-surface-2 flex items-center justify-center border border-transparent hover:border-border-default text-text-secondary cursor-pointer"
        >
          <Box className="w-4 h-4" />
        </button>
        <button 
          aria-label="Bounding Box"
          className="w-8 h-8 rounded-sm hover:bg-surface-2 flex items-center justify-center border border-transparent hover:border-border-default text-text-secondary cursor-pointer"
        >
          <BoxSelect className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Reset & Randomize actions (Section 3) */}
      <div className="flex items-center gap-2">
        <button
          onClick={resetObject}
          className="flex items-center gap-1.5 px-3 h-8 rounded-sm bg-surface-1 border border-border-default hover:bg-surface-2 text-size-secondary font-medium text-text-secondary cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Object</span>
        </button>
        <button
          onClick={randomizeObject}
          className="flex items-center gap-1.5 px-3 h-8 rounded-sm bg-surface-1 border border-border-default hover:bg-surface-2 text-size-secondary font-medium text-text-secondary cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>Randomize</span>
        </button>
      </div>
    </header>
  );
}
