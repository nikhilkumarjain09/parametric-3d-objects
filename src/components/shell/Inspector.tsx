'use client';

import React from 'react';

export default function Inspector() {
  return (
    <aside className="w-[340px] h-full bg-surface-1 border-l border-border-subtle flex flex-col text-text-primary z-5">
      <div className="h-8 px-4 flex items-center border-b border-border-subtle bg-surface-0">
        <span className="text-size-micro font-bold tracking-wider text-text-tertiary uppercase">
          INSPECTOR
        </span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto font-mono text-size-secondary text-text-secondary">
        -- no parameters --
      </div>
    </aside>
  );
}
