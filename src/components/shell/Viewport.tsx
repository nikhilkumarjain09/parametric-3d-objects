'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { useStore } from '../../state/store';
import { objectRegistry } from '../../objects';
import * as THREE from 'three';

// 1. Real-time Bounding Box Helper Renderer
function BoundingBoxRenderer({ groupRef, enabled }: { groupRef: React.RefObject<THREE.Group | null>; enabled: boolean }) {
  const { scene } = useThree();
  const boxHelperRef = useRef<THREE.BoxHelper | null>(null);

  useEffect(() => {
    if (enabled && groupRef.current) {
      // Bounding box color fits warning/orange theme (Section 6)
      const helper = new THREE.BoxHelper(groupRef.current, '#f59e0b');
      scene.add(helper);
      boxHelperRef.current = helper;
      return () => {
        scene.remove(helper);
        helper.dispose();
        boxHelperRef.current = null;
      };
    }
  }, [enabled, groupRef, scene]);

  useFrame(() => {
    if (boxHelperRef.current && groupRef.current) {
      boxHelperRef.current.update();
    }
  });

  return null;
}

// 2. Camera Controller for smooth frame selected / reset transitions (Section 6 & REQ-CAM-004)
function CameraController({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const { camera } = useThree();
  const selectedObjectType = useStore((state) => state.selectedObjectType);
  const selectionScope = useStore((state) => state.selectionScope);
  const cameraAction = useStore((state) => state.cameraAction);
  const cameraActionId = useStore((state) => state.cameraActionId);
  const clearCameraAction = useStore((state) => state.clearCameraAction);

  const activeModule = objectRegistry[selectedObjectType];
  const currentParams = useStore((state) => state.currentParams);

  const targetPos = useRef(new THREE.Vector3(0, 1.2, 1.8));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.45, 0));
  const isAnimating = useRef(false);
  const animStartTime = useRef(0);
  const startPos = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3());

  // Per-object-type default framing definitions (Section 6 / ASM-020 equivalent)
  const getObjectTypeFraming = (type: string) => {
    switch (type) {
      case 'table':
        return { pos: new THREE.Vector3(0, 1.2, 1.8), lookAt: new THREE.Vector3(0, 0.35, 0) };
      case 'chair':
        return { pos: new THREE.Vector3(0, 1.1, 1.5), lookAt: new THREE.Vector3(0, 0.45, 0) };
      case 'cup':
      case 'mug':
        return { pos: new THREE.Vector3(0, 0.26, 0.34), lookAt: new THREE.Vector3(0, 0.06, 0) };
      default:
        return { pos: new THREE.Vector3(0, 1.2, 1.8), lookAt: new THREE.Vector3(0, 0.4, 0) };
    }
  };

  useEffect(() => {
    if (cameraAction === 'none') return;

    const controls = controlsRef.current;
    if (!controls) return;

    if (cameraAction === 'reset-view') {
      const framing = getObjectTypeFraming(selectedObjectType);
      targetPos.current.copy(framing.pos);
      targetLookAt.current.copy(framing.lookAt);
    } else if (cameraAction === 'frame-selected') {
      if (selectionScope.type === 'component' && activeModule) {
        const meshes = activeModule.deriveGeometry(currentParams);
        const matchedMeshes = meshes.filter((m) => 
          m.id === selectionScope.id ||
          (selectionScope.id === 'legs_group' && (
            m.id.startsWith('leg_') || 
            m.id === 'support_column' || 
            m.id === 'base_plate' || 
            m.id.startsWith('base_cross_')
          )) ||
          (selectionScope.id === 'backrest_group' && m.id.startsWith('backrest_slat_')) ||
          (selectionScope.id === 'armrests_group' && (
            m.id.startsWith('armrest_bar_') || 
            m.id.startsWith('armrest_support_')
          ))
        );

        if (matchedMeshes.length > 0) {
          const sum = new THREE.Vector3();
          matchedMeshes.forEach((m) => {
            if (m.position) {
              sum.add(new THREE.Vector3(...m.position));
            }
          });
          const avgCenter = sum.divideScalar(matchedMeshes.length);
          targetLookAt.current.copy(avgCenter);
          // Set frame camera closer to highlight component detail
          targetPos.current.copy(avgCenter).add(new THREE.Vector3(0, 0.18, 0.24));
        } else {
          const framing = getObjectTypeFraming(selectedObjectType);
          targetPos.current.copy(framing.pos);
          targetLookAt.current.copy(framing.lookAt);
        }
      } else {
        const framing = getObjectTypeFraming(selectedObjectType);
        targetPos.current.copy(framing.pos);
        targetLookAt.current.copy(framing.lookAt);
      }
    }

    startPos.current.copy(camera.position);
    startLookAt.current.copy(controls.target);
    animStartTime.current = performance.now();
    isAnimating.current = true;

    clearCameraAction();
  }, [cameraActionId]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (isAnimating.current) {
      const elapsed = performance.now() - animStartTime.current;
      const progress = Math.min(1, elapsed / 350); // Easing over 350ms (Section 6)

      // Cubic ease-in-out
      const t = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      camera.position.lerpVectors(startPos.current, targetPos.current, t);
      controls.target.lerpVectors(startLookAt.current, targetLookAt.current, t);
      controls.update();

      if (progress >= 1) {
        isAnimating.current = false;
      }
    }
  });

  // Run camera auto-framing on initial load of object type (Section 6 / REQ-CAM-004)
  const lastObjectType = useRef(selectedObjectType);
  useEffect(() => {
    const controls = controlsRef.current;
    if (controls) {
      const framing = getObjectTypeFraming(selectedObjectType);
      camera.position.copy(framing.pos);
      controls.target.copy(framing.lookAt);
      controls.update();
    }
    lastObjectType.current = selectedObjectType;
  }, [selectedObjectType, controlsRef.current]);

  return null;
}

// 3. Viewport Primary Component
export default function Viewport() {
  const selectedObjectType = useStore((state) => state.selectedObjectType);
  const currentParams = useStore((state) => state.currentParams);
  const selectionScope = useStore((state) => state.selectionScope);
  const setSelection = useStore((state) => state.setSelection);

  // Viewport display settings (Section 4 & 6)
  const gridEnabled = useStore((state) => state.gridEnabled);
  const boundingBoxEnabled = useStore((state) => state.boundingBoxEnabled);
  const shadingMode = useStore((state) => state.shadingMode);

  const [hoveredMeshId, setHoveredMeshId] = useState<string | null>(null);

  const activeModule = objectRegistry[selectedObjectType];
  const meshes = activeModule ? activeModule.deriveGeometry(currentParams) : [];

  const controlsRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);

  return (
    <main className="flex-1 h-full bg-viewport relative overflow-hidden flex items-center justify-center">
      <Canvas 
        camera={{ position: [0, 1.2, 1.8], fov: 45 }}
        gl={{ 
          toneMapping: THREE.ACESFilmicToneMapping, // Filmic tone mapping (Section 6)
          toneMappingExposure: 1.15
        }}
        onPointerMissed={() => {
          // Clear selection back to object-level (REQ-COMPSEL-003)
          setSelection({ type: 'object', id: selectedObjectType });
        }}
      >
        <color attach="background" args={['#08090c']} />
        
        {/* Orbit Camera Controls with damped inertia (Section 6) */}
        <OrbitControls 
          ref={controlsRef}
          makeDefault 
          enableDamping 
          dampingFactor={0.05} 
          minDistance={0.15} 
          maxDistance={5} 
        />

        <CameraController controlsRef={controlsRef} />
        
        {/* Soft three-point studio lighting setup per design settings Section 6.2 */}
        <ambientLight intensity={0.55} />
        <pointLight position={[-6, -6, -6]} intensity={0.15} />
        <directionalLight 
          position={[5, 8, 4]} 
          intensity={1.3} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024}
        />
        
        {/* Ground spatial grid helper (ASM-019) */}
        {gridEnabled && (
          <gridHelper args={[10, 100, '#2d3450', '#181b29']} position={[0, 0, 0]} />
        )}

        {/* Generically render meshes defined by the active Object Module */}
        <group ref={groupRef}>
          {meshes.map((mesh) => {
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
                    // Wireframe shading override (Section 6)
                    wireframe={shadingMode === 'wireframe' || (mesh.material.wireframe ?? false)}
                    // Subtly emissive overlay when selected/hovered at component level (Section 6.3)
                    emissive={isComponentSelected ? '#0d9488' : (isHovered ? '#0d9488' : '#000000')}
                    emissiveIntensity={isComponentSelected ? 0.25 : (isHovered ? 0.08 : 0)}
                  />
                </mesh>

                {/* Selection Silhouette Outline Overlay (Section 6.3) */}
                {shadingMode === 'solid' && (isSelected || isHovered) && (
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
                      opacity={isComponentSelected ? 0.8 : (isObjectSelected ? 0.35 : 0.25)} 
                    />
                  </mesh>
                )}
              </group>
            );
          })}
        </group>

        {/* Real-time Bounding Box Helper (Section 6) */}
        <BoundingBoxRenderer groupRef={groupRef} enabled={boundingBoxEnabled} />

        {/* Soft ground contact shadow (Section 6) */}
        <ContactShadows 
          position={[0, 0, 0]} 
          opacity={0.5} 
          scale={3.5} 
          blur={1.5} 
          far={1.5} 
        />
      </Canvas>
    </main>
  );
}
