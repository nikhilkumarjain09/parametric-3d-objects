'use client';

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useStore } from '../../state/store';
import { objectRegistry } from '../../objects';

export default function Viewport() {
  const selectedObjectType = useStore((state) => state.selectedObjectType);
  const currentParams = useStore((state) => state.currentParams);
  const selectionScope = useStore((state) => state.selectionScope);
  const setSelection = useStore((state) => state.setSelection);

  const [hoveredMeshId, setHoveredMeshId] = useState<string | null>(null);

  const activeModule = objectRegistry[selectedObjectType];
  const meshes = activeModule ? activeModule.deriveGeometry(currentParams) : [];

  return (
    <main className="flex-1 h-full bg-viewport relative overflow-hidden flex items-center justify-center">
      <Canvas 
        camera={{ position: [0, 1.2, 1.8], fov: 45 }}
        onPointerMissed={() => {
          // Clear selection back to object-level (REQ-COMPSEL-003)
          setSelection({ type: 'object', id: selectedObjectType });
        }}
      >
        <color attach="background" args={['#08090c']} />
        
        {/* Soft three-point lighting setup per design settings Section 6.2 */}
        <ambientLight intensity={0.45} />
        <pointLight position={[-10, -10, -10]} intensity={0.15} />
        <directionalLight 
          position={[5, 8, 5]} 
          intensity={1.1} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024}
        />
        
        {/* Ground spatial grid helper */}
        <gridHelper args={[10, 100, '#2d3450', '#1f2438']} position={[0, 0, 0]} />

        {/* Generically render meshes defined by the active Object Module */}
        {meshes.map((mesh) => {
          // Verify component selection scope (Section 14)
          const isComponentSelected = 
            selectionScope.type === 'component' && (
              selectionScope.id === mesh.id ||
              (selectionScope.id === 'legs_group' && (
                mesh.id.startsWith('leg_') || 
                mesh.id === 'support_column' || 
                mesh.id === 'base_plate' || 
                mesh.id.startsWith('base_cross_')
              )) ||
              (selectionScope.id === 'backrest_group' && mesh.id.startsWith('backrest_slat_')) ||
              (selectionScope.id === 'armrests_group' && (
                mesh.id.startsWith('armrest_bar_') || 
                mesh.id.startsWith('armrest_support_')
              ))
            );

          const isObjectSelected = selectionScope.type === 'object';
          const isSelected = isObjectSelected || isComponentSelected;
          const isHovered = hoveredMeshId === mesh.id;

          return (
            <group key={mesh.id}>
              {/* Primary Mesh */}
              <mesh
                position={mesh.position || [0, 0, 0]}
                rotation={mesh.rotation || [0, 0, 0]}
                scale={mesh.scale || [1, 1, 1]}
                onClick={(e) => {
                  e.stopPropagation(); // Stop click bubble (REQ-COMPSEL-002)
                  setSelection({ type: 'component', id: mesh.id });
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredMeshId(mesh.id);
                }}
                onPointerOut={(e) => {
                  setHoveredMeshId(null);
                }}
              >
                {mesh.geometry.type === 'box' && (
                  <boxGeometry 
                    key={mesh.id + '-box-' + JSON.stringify(mesh.geometry.args)} 
                    args={mesh.geometry.args} 
                  />
                )}
                
                {mesh.geometry.type === 'cylinder' && (
                  <cylinderGeometry 
                    key={mesh.id + '-cyl-' + JSON.stringify(mesh.geometry.args)} 
                    args={mesh.geometry.args} 
                  />
                )}
                
                {mesh.geometry.type === 'extrude' && (
                  <extrudeGeometry 
                    key={mesh.id + '-ext-' + JSON.stringify(mesh.geometry.options)} 
                    args={[mesh.geometry.shape, mesh.geometry.options]} 
                  />
                )}
                
                {mesh.geometry.type === 'lathe' && (
                  <latheGeometry 
                    key={mesh.id + '-lath-' + JSON.stringify(mesh.geometry.points)} 
                    args={[mesh.geometry.points, mesh.geometry.segments ?? 32]} 
                  />
                )}
                
                {mesh.geometry.type === 'tube' && (
                  <tubeGeometry 
                    key={mesh.id + '-tube-' + (mesh.geometry.pathId ?? 'tube-path')} 
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
                  // Subtly emissive overlay when selected/hovered at component level (Section 6.3)
                  emissive={isComponentSelected ? '#0d9488' : (isHovered ? '#0d9488' : '#000000')}
                  emissiveIntensity={isComponentSelected ? 0.25 : (isHovered ? 0.08 : 0)}
                />
              </mesh>

              {/* Selection Silhouette Outline Clone (Section 6.3) */}
              {(isSelected || isHovered) && (
                <mesh
                  position={mesh.position || [0, 0, 0]}
                  rotation={mesh.rotation || [0, 0, 0]}
                  scale={(mesh.scale || [1, 1, 1]).map(s => s * 1.015) as [number, number, number]}
                >
                  {mesh.geometry.type === 'box' && (
                    <boxGeometry args={mesh.geometry.args} />
                  )}
                  
                  {mesh.geometry.type === 'cylinder' && (
                    <cylinderGeometry args={mesh.geometry.args} />
                  )}
                  
                  {mesh.geometry.type === 'extrude' && (
                    <extrudeGeometry args={[mesh.geometry.shape, mesh.geometry.options]} />
                  )}
                  
                  {mesh.geometry.type === 'lathe' && (
                    <latheGeometry args={[mesh.geometry.points, mesh.geometry.segments ?? 32]} />
                  )}
                  
                  {mesh.geometry.type === 'tube' && (
                    <tubeGeometry 
                      args={[
                        mesh.geometry.path, 
                        mesh.geometry.segments ?? 64, 
                        mesh.geometry.radius ?? 0.006, 
                        mesh.geometry.radialSegments ?? 8, 
                        false
                      ]} 
                    />
                  )}
                  
                  <meshBasicMaterial 
                    color="#0d9488" 
                    wireframe={true} 
                    transparent={true} 
                    // Fainter outline for pre-selection hover state or general object outlines
                    opacity={isComponentSelected ? 0.8 : (isObjectSelected ? 0.35 : 0.25)} 
                  />
                </mesh>
              )}
            </group>
          );
        })}
      </Canvas>
    </main>
  );
}
