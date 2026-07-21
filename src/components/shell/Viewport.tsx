'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { useStore } from '../../state/store';
import { objectRegistry } from '../../objects';

export default function Viewport() {
  const selectedObjectType = useStore((state) => state.selectedObjectType);
  const currentParams = useStore((state) => state.currentParams);

  const activeModule = objectRegistry[selectedObjectType];
  // Generically derive meshes based on the active Object Module (REQ-EXT-002)
  const meshes = activeModule ? activeModule.deriveGeometry(currentParams) : [];

  return (
    <main className="flex-1 h-full bg-viewport relative overflow-hidden flex items-center justify-center">
      <Canvas camera={{ position: [0, 2, 3], fov: 45 }}>
        <color attach="background" args={['#08090c']} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <gridHelper args={[10, 10, '#2d3450', '#1f2438']} />
        
        {/* Generically render meshes defined by the active Object Module */}
        {meshes.map((mesh) => (
          <mesh
            key={mesh.id}
            position={mesh.position || [0, 0, 0]}
            rotation={mesh.rotation || [0, 0, 0]}
            scale={mesh.scale || [1, 1, 1]}
          >
            {mesh.geometry.type === 'box' && (
              <boxGeometry args={mesh.geometry.args} />
            )}
            <meshStandardMaterial color={mesh.material.color || '#ffffff'} />
          </mesh>
        ))}
      </Canvas>
    </main>
  );
}
