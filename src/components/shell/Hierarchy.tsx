'use client';

import React from 'react';

export default function Hierarchy() {
  return (
    <aside className="w-[280px] h-full bg-surface-1 border-r border-border-subtle flex flex-col text-text-primary z-5">
      <div className="h-8 px-4 flex items-center border-b border-border-subtle bg-surface-0">
        <span className="text-size-micro font-bold tracking-wider text-text-tertiary uppercase">
          SCENE HIERARCHY
        </span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto font-mono text-size-secondary text-text-secondary">
        -- empty tree --
      </div>
    </aside>
  );
}
