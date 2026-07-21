'use client';

import React from 'react';

export default function Toolbar() {
  return (
    <header className="h-[56px] w-full bg-surface-0 border-b border-border-strong px-4 flex items-center justify-between text-text-primary select-none z-10">
      <div className="flex items-center gap-3">
        <span className="font-mono font-bold text-size-title tracking-tight">PARAMETRIC_3D</span>
        <div className="h-4 w-[1px] bg-border-strong" />
        <span className="text-size-secondary text-text-secondary">scaffold</span>
      </div>
      <div className="text-size-secondary text-text-tertiary">
        Ready
      </div>
    </header>
  );
}
