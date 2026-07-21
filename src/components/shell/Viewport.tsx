'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';

export default function Viewport() {
  return (
    <main className="flex-1 h-full bg-bg-viewport relative overflow-hidden flex items-center justify-center">
      <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
        <color attach="background" args={['#050609']} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <gridHelper args={[10, 10, '#2d3450', '#1f2438']} />
      </Canvas>
    </main>
  );
}
