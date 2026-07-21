'use client';

import React from 'react';

export default function StatusBar() {
  return (
    <footer className="h-[36px] w-full bg-surface-0 border-t border-border-subtle px-4 flex items-center justify-between text-size-secondary text-text-secondary select-none font-mono z-10">
      <div>
        <span>Object: Table</span>
      </div>
      <div>
        <span>Status: Scaffold Loaded</span>
      </div>
    </footer>
  );
}
