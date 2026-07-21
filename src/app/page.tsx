import React from 'react';
import Toolbar from '../components/shell/Toolbar';
import Hierarchy from '../components/shell/Hierarchy';
import Viewport from '../components/shell/Viewport';
import Inspector from '../components/shell/Inspector';
import StatusBar from '../components/shell/StatusBar';

export default function Home() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-app text-text-primary">
      {/* Top Toolbar (56px height) */}
      <Toolbar />

      {/* Main workspace layout */}
      <div className="flex flex-1 w-full min-h-0 relative overflow-hidden">
        {/* Left Scene Hierarchy Panel (280px width) */}
        <Hierarchy />

        {/* Center 3D Viewport (dominant region) */}
        <Viewport />

        {/* Right Inspector Panel (340px width) */}
        <Inspector />
      </div>

      {/* Bottom Status Bar (36px height) */}
      <StatusBar />
    </div>
  );
}
