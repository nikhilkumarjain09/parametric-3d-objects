'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { useStore } from '../../state/store';
import { objectRegistry } from '../../objects';

export default function Viewport() {
  const selectedObjectType = useStore((state) => state.selectedObjectType);
  const currentParams = useStore((state) => state.currentParams);

  const activeModule = objectRegistry[selectedObjectType];
  const meshes = activeModule ? activeModule.deriveGeometry(currentParams) : [];

  return (
    <main className="flex-1 h-full bg-viewport relative overflow-hidden flex items-center justify-center">
      <Canvas camera={{ position: [0, 1.5, 2.5], fov: 45 }}>
        <color attach="background" args={['#08090c']} />
        
        {/* Soft three-point lighting setup per design settings Section 6.2 */}
        <ambientLight intensity={0.4} />
        <pointLight position={[-10, -10, -10]} intensity={0.2} />
        <directionalLight 
          position={[5, 8, 5]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024}
        />
        
        {/* Ground spatial grid helper */}
        <gridHelper args={[10, 100, '#2d3450', '#1f2438']} position={[0, 0, 0]} />

        {/* Generically render meshes defined by the active Object Module */}
        {meshes.map((mesh) => (
          <mesh
            key={mesh.id}
            position={mesh.position || [0, 0, 0]}
            rotation={mesh.rotation || [0, 0, 0]}
            scale={mesh.scale || [1, 1, 1]}
          >
            {mesh.geometry.type === 'box' && (
              <boxGeometry 
                key={mesh.id + '-' + JSON.stringify(mesh.geometry.args)} 
                args={mesh.geometry.args} 
              />
            )}
            
            {mesh.geometry.type === 'cylinder' && (
              <cylinderGeometry 
                key={mesh.id + '-' + JSON.stringify(mesh.geometry.args)} 
                args={mesh.geometry.args} 
              />
            )}
            
            {mesh.geometry.type === 'extrude' && (
              <extrudeGeometry 
                key={mesh.id + '-' + JSON.stringify(mesh.geometry.options)} 
                args={[mesh.geometry.shape, mesh.geometry.options]} 
              />
            )}
            
            {mesh.geometry.type === 'lathe' && (
              <latheGeometry 
                key={mesh.id + '-' + JSON.stringify(mesh.geometry.points)} 
                args={[mesh.geometry.points, mesh.geometry.segments ?? 32]} 
              />
            )}
            
            {mesh.geometry.type === 'tube' && (
              <tubeGeometry 
                key={mesh.id + '-' + (mesh.geometry.pathId ?? 'tube-path')} 
                args={[
                  mesh.geometry.path, 
                  mesh.geometry.segments ?? 64, 
                  mesh.geometry.radius ?? 0.006, 
                  mesh.geometry.radialSegments ?? 8, 
                  false
                ]} 
              />
            )}
            
            <meshStandardMaterial
              color={mesh.material.color || '#ffffff'}
              roughness={mesh.material.roughness ?? 0.5}
              metalness={mesh.material.metalness ?? 0.0}
              transparent={mesh.material.transparent ?? false}
              opacity={mesh.material.opacity ?? 1.0}
              wireframe={mesh.material.wireframe ?? false}
            />
          </mesh>
        ))}
      </Canvas>
    </main>
  );
}
