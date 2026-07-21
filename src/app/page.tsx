'use client';

import React, { useState, useEffect } from 'react';
import Toolbar from '../components/shell/Toolbar';
import Hierarchy from '../components/shell/Hierarchy';
import Viewport from '../components/shell/Viewport';
import Inspector from '../components/shell/Inspector';
import StatusBar from '../components/shell/StatusBar';
import { useStore } from '../state/store';
import { Layers, Sliders } from 'lucide-react';

export default function Home() {
  const [width, setWidth] = useState<number | null>(null);

  const hierarchyDrawerOpen     = useStore(s => s.hierarchyDrawerOpen);
  const inspectorDrawerOpen     = useStore(s => s.inspectorDrawerOpen);
  const activeMobileTab         = useStore(s => s.activeMobileTab);
  const setHierarchyDrawerOpen  = useStore(s => s.setHierarchyDrawerOpen);
  const setInspectorDrawerOpen  = useStore(s => s.setInspectorDrawerOpen);
  const setActiveMobileTab      = useStore(s => s.setActiveMobileTab);

  useEffect(() => {
    setWidth(window.innerWidth);
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const showMobileTabbed  = width !== null && width < 768;
  const showOverlayDrawers = width !== null && width >= 768 && width < 1024;
  const showDesktopInline = width === null || width >= 1024;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-app text-text-primary select-none">
      {/* Top Command Bar */}
      <Toolbar />

      {/* Main workspace */}
      <div className="flex flex-1 w-full min-h-0 relative overflow-hidden">

        {/* ── DESKTOP: panels inline ──────────────────────────────── */}
        {showDesktopInline && (
          <>
            <Hierarchy />
            <Viewport />
            <Inspector />
          </>
        )}

        {/* ── TABLET: overlay drawers ─────────────────────────────── */}
        {showOverlayDrawers && (
          <>
            <Viewport />

            {hierarchyDrawerOpen && (
              <>
                <div
                  onClick={() => setHierarchyDrawerOpen(false)}
                  className="absolute inset-0 bg-black/60 z-20 animate-fade-in cursor-pointer"
                />
                <div className="absolute left-0 top-0 h-full z-30 shadow-2xl animate-slide-in-left">
                  <Hierarchy />
                </div>
              </>
            )}

            {inspectorDrawerOpen && (
              <>
                <div
                  onClick={() => setInspectorDrawerOpen(false)}
                  className="absolute inset-0 bg-black/60 z-20 animate-fade-in cursor-pointer"
                />
                <div className="absolute right-0 top-0 h-full z-30 shadow-2xl animate-slide-in-right">
                  <Inspector />
                </div>
              </>
            )}
          </>
        )}

        {/* ── MOBILE: shared tabbed drawer ────────────────────────── */}
        {showMobileTabbed && (
          <>
            <Viewport />

            {(hierarchyDrawerOpen || inspectorDrawerOpen) && (
              <>
                <div
                  onClick={() => {
                    setHierarchyDrawerOpen(false);
                    setInspectorDrawerOpen(false);
                  }}
                  className="absolute inset-0 bg-black/60 z-20 animate-fade-in cursor-pointer"
                />
                <div className="absolute right-0 top-0 h-full w-[320px] bg-surface-1 z-30 shadow-2xl flex flex-col border-l border-border-subtle animate-slide-in-right">
                  {/* Tab switcher */}
                  <div className="h-10 bg-surface-0 border-b border-border-subtle flex items-center p-1 gap-1 shrink-0">
                    <button
                      onClick={() => setActiveMobileTab('hierarchy')}
                      className={`flex-1 h-full rounded text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        activeMobileTab === 'hierarchy'
                          ? 'bg-accent text-text-on-accent'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Scene
                    </button>
                    <button
                      onClick={() => setActiveMobileTab('inspector')}
                      className={`flex-1 h-full rounded text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        activeMobileTab === 'inspector'
                          ? 'bg-accent text-text-on-accent'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Inspector
                    </button>
                  </div>

                  <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
                    {activeMobileTab === 'hierarchy' ? <Hierarchy /> : <Inspector />}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}
