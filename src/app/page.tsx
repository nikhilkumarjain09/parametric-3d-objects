'use client';

import React, { useState, useEffect } from 'react';
import Toolbar from '../components/shell/Toolbar';
import Hierarchy from '../components/shell/Hierarchy';
import Viewport from '../components/shell/Viewport';
import Inspector from '../components/shell/Inspector';
import StatusBar from '../components/shell/StatusBar';
import { useStore } from '../state/store';
import { FolderTree, Sliders } from 'lucide-react';

export default function Home() {
  const [width, setWidth] = useState<number | null>(null);

  const hierarchyDrawerOpen = useStore((state) => state.hierarchyDrawerOpen);
  const inspectorDrawerOpen = useStore((state) => state.inspectorDrawerOpen);
  const activeMobileTab = useStore((state) => state.activeMobileTab);

  const setHierarchyDrawerOpen = useStore((state) => state.setHierarchyDrawerOpen);
  const setInspectorDrawerOpen = useStore((state) => state.setInspectorDrawerOpen);
  const setActiveMobileTab = useStore((state) => state.setActiveMobileTab);

  useEffect(() => {
    setWidth(window.innerWidth);
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showMobileTabbed = width !== null && width < 768;
  const showOverlayDrawers = width !== null && width >= 768 && width < 1024;
  const showDesktopInline = width === null || width >= 1024;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-app text-text-primary select-none">
      {/* Top Toolbar (56px height) */}
      <Toolbar />

      {/* Main workspace layout */}
      <div className="flex flex-1 w-full min-h-0 relative overflow-hidden">
        
        {/* 1. DESKTOP LAYOUT (Inline panels side-by-side) */}
        {showDesktopInline && (
          <>
            <Hierarchy />
            <Viewport />
            <Inspector />
          </>
        )}

        {/* 2. TABLET LAYOUT (Overlay Drawer layout) */}
        {showOverlayDrawers && (
          <>
            <Viewport />

            {/* Left Hierarchy Drawer Overlay */}
            {hierarchyDrawerOpen && (
              <>
                {/* Backdrop Scrim */}
                <div 
                  onClick={() => setHierarchyDrawerOpen(false)}
                  className="absolute inset-0 bg-black/60 z-20 transition-opacity animate-fade-in cursor-pointer"
                />
                {/* Left Panel Container */}
                <div className="absolute left-0 top-0 h-full w-[280px] z-30 shadow-2xl transition-transform animate-slide-in-left">
                  <Hierarchy />
                </div>
              </>
            )}

            {/* Right Inspector Drawer Overlay */}
            {inspectorDrawerOpen && (
              <>
                {/* Backdrop Scrim */}
                <div 
                  onClick={() => setInspectorDrawerOpen(false)}
                  className="absolute inset-0 bg-black/60 z-20 transition-opacity animate-fade-in cursor-pointer"
                />
                {/* Right Panel Container */}
                <div className="absolute right-0 top-0 h-full w-[340px] z-30 shadow-2xl transition-transform animate-slide-in-right">
                  <Inspector />
                </div>
              </>
            )}
          </>
        )}

        {/* 3. MOBILE LAYOUT (Shared Single Drawer with Tab Switcher) */}
        {showMobileTabbed && (
          <>
            <Viewport />

            {/* Combined Drawer Overlay */}
            {(hierarchyDrawerOpen || inspectorDrawerOpen) && (
              <>
                {/* Backdrop Scrim */}
                <div 
                  onClick={() => {
                    setHierarchyDrawerOpen(false);
                    setInspectorDrawerOpen(false);
                  }}
                  className="absolute inset-0 bg-black/60 z-20 transition-opacity animate-fade-in cursor-pointer"
                />
                
                {/* Tabbed Drawer Box */}
                <div className="absolute right-0 top-0 h-full w-[320px] bg-surface-1 z-30 shadow-2xl flex flex-col border-l border-border-subtle animate-slide-in-right">
                  
                  {/* Segmented Tab Switcher Header (Section 16) */}
                  <div className="h-12 bg-surface-0 border-b border-border-subtle flex items-center p-1.5 gap-1 shrink-0 select-none">
                    <button
                      onClick={() => setActiveMobileTab('hierarchy')}
                      className={`flex-1 h-full rounded-sm text-size-secondary font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeMobileTab === 'hierarchy'
                          ? 'bg-accent text-text-on-accent shadow-sm'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                      }`}
                    >
                      <FolderTree className="w-3.5 h-3.5" />
                      <span>Hierarchy</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveMobileTab('inspector')}
                      className={`flex-1 h-full rounded-sm text-size-secondary font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeMobileTab === 'inspector'
                          ? 'bg-accent text-text-on-accent shadow-sm'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Inspector</span>
                    </button>
                  </div>

                  {/* Drawer Content */}
                  <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
                    {activeMobileTab === 'hierarchy' ? (
                      <Hierarchy />
                    ) : (
                      <Inspector />
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom Status Bar (36px height) */}
      <StatusBar />
    </div>
  );
}
