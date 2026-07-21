'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, TransformControls } from '@react-three/drei';
import { HierarchyNode, GeneratedMesh } from '../../objects/types';
import { useStore } from '../../state/store';
import { objectRegistry } from '../../objects';
import * as THREE from 'three';
import { Grid3x3, BoxSelect, RefreshCcw, Crosshair } from 'lucide-react';

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

// SceneExporter to expose the live Three.js scene object to other parts of the application
function SceneExporter() {
  const { scene } = useThree();
  useEffect(() => {
    (window as any).__three_scene = scene;
    return () => {
      delete (window as any).__three_scene;
    };
  }, [scene]);
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
      const progress = Math.min(1, elapsed / 250); // Snappy ease-out over 250ms (Section 19.2)

      // Cubic ease-out curve (confident, snappy feedback)
      const t = 1 - Math.pow(1 - progress, 3);

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

// --- Recursive Component Scene Graph Node (Section 2 & 3 & 4) ---
interface RecursiveComponentProps {
  node: HierarchyNode;
  meshes: GeneratedMesh[];
  shadingMode: string;
  selectedComponentIds: string[];
  hoveredMeshId: string | null;
  setHoveredMeshId: (id: string | null) => void;
  onClickMesh: (e: any, id: string) => void;
}

function RecursiveComponent({
  node,
  meshes,
  shadingMode,
  selectedComponentIds,
  hoveredMeshId,
  setHoveredMeshId,
  onClickMesh,
}: RecursiveComponentProps) {
  const selectedObjectType = useStore((state) => state.selectedObjectType);
  
  // Retrieve the component overrides for the active object
  const overrides = useStore((state) => state.componentOverrides[selectedObjectType]?.[node.id]);
  
  const position = overrides?.position ?? { x: 0, y: 0, z: 0 };
  const rotation = overrides?.rotation ?? { x: 0, y: 0, z: 0 }; // in degrees
  const scale = overrides?.scale ?? { x: 1, y: 1, z: 1 };

  // Convert position to meters, rotation to radians
  const posMeters: [number, number, number] = [position.x / 1000, position.y / 1000, position.z / 1000];
  const rotRad: [number, number, number] = [
    (rotation.x * Math.PI) / 180,
    (rotation.y * Math.PI) / 180,
    (rotation.z * Math.PI) / 180
  ];
  const sclVec: [number, number, number] = [scale.x, scale.y, scale.z];

  const hasChildren = node.children && node.children.length > 0;
  
  // Match generated meshes by exact ID or ID prefix
  const matchingMeshes = !hasChildren 
    ? meshes.filter(m => m.id === node.id || m.id.startsWith(node.id + '_') || m.id.startsWith(node.id + '-'))
    : [];

  return (
    <group
      name={node.id}
      position={posMeters}
      rotation={rotRad}
      scale={sclVec}
      userData={{
        componentId: node.id,
        componentLabel: node.label,
        componentFamily: node.componentFamily,
        componentRole: node.componentRole,
        selectable: true,
        editable: true,
      }}
    >
      {/* Recursively render child components */}
      {hasChildren && node.children!.map((child) => (
        <RecursiveComponent
          key={child.id}
          node={child}
          meshes={meshes}
          shadingMode={shadingMode}
          selectedComponentIds={selectedComponentIds}
          hoveredMeshId={hoveredMeshId}
          setHoveredMeshId={setHoveredMeshId}
          onClickMesh={onClickMesh}
        />
      ))}

      {/* Render procedural child meshes */}
      {!hasChildren && matchingMeshes.map((mesh) => {
        // Selection detection: highlight if itself is selected or any ancestor is selected
        const isCompSelected = selectedComponentIds.includes(node.id) || selectedComponentIds.some(selId => {
          if (selId === 'legs_group' && (node.id.startsWith('leg_') || node.id === 'support_column' || node.id === 'base_plate' || node.id.startsWith('base_cross_'))) return true;
          if (selId === 'backrest_group' && node.id.startsWith('backrest_slat_')) return true;
          if (selId === 'armrests_group' && (node.id.startsWith('armrest_bar_') || node.id.startsWith('armrest_support_'))) return true;
          if (selId === selectedObjectType) return true; // whole object selected
          return false;
        });

        const isHovered = hoveredMeshId === mesh.id;
        const isSelected = isCompSelected;

        return (
          <group key={mesh.id}>
            {/* Primary Mesh */}
            <mesh
              position={mesh.position || [0, 0, 0]}
              rotation={mesh.rotation || [0, 0, 0]}
              scale={mesh.scale || [1, 1, 1]}
              onClick={(e) => onClickMesh(e, mesh.id)}
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
                wireframe={shadingMode === 'wireframe' || (mesh.material.wireframe ?? false)}
                emissive={isSelected ? '#0d9488' : (isHovered ? '#0d9488' : '#000000')}
                emissiveIntensity={isSelected ? 0.25 : (isHovered ? 0.08 : 0)}
              />
            </mesh>

            {/* Silhouette Outline Overlay (Section 6.3 & 27) */}
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
                  <tubeGeometry args={[
                    mesh.geometry.path, 
                    mesh.geometry.segments ?? 64, 
                    mesh.geometry.radius ?? 0.006, 
                    mesh.geometry.radialSegments ?? 8, 
                    false
                  ]} />
                )}
                
                <meshBasicMaterial 
                  color={isSelected ? '#0d9488' : '#cbd5e1'} 
                  wireframe 
                  transparent
                  opacity={isSelected ? 0.8 : 0.4}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

// --- Viewport TransformControls Helper Component (Section 8 & 9) ---
function GizmoControls() {
  const { scene } = useThree();
  const activeReferenceComponentId = useStore((state) => state.activeReferenceComponentId);
  const editMode = useStore((state) => state.editMode);
  const transformMode = useStore((state) => state.transformMode);
  const transformSpace = useStore((state) => state.transformSpace);
  
  const translationSnap = useStore((state) => state.translationSnap);
  const rotationSnap = useStore((state) => state.rotationSnap);
  const scaleSnap = useStore((state) => state.scaleSnap);
  
  const setIsDraggingGizmo = useStore((state) => state.setIsDraggingGizmo);
  const updateTransformOverride = useStore((state) => state.updateTransformOverride);

  const [targetObj, setTargetObj] = useState<THREE.Object3D | null>(null);

  // Poll scene-graph to locate matching component group
  useEffect(() => {
    if (editMode === 'component' && activeReferenceComponentId) {
      const obj = scene.getObjectByName(activeReferenceComponentId);
      setTargetObj(obj || null);
    } else {
      setTargetObj(null);
    }
  }, [activeReferenceComponentId, editMode, scene]);

  if (editMode !== 'component' || !targetObj) return null;

  return (
    <TransformControls
      object={targetObj}
      mode={transformMode}
      space={transformSpace}
      translationSnap={translationSnap ? translationSnap / 1000 : undefined}
      rotationSnap={rotationSnap ? (rotationSnap * Math.PI) / 180 : undefined}
      scaleSnap={scaleSnap ? scaleSnap : undefined}
      onMouseDown={() => setIsDraggingGizmo(true)}
      onMouseUp={() => setIsDraggingGizmo(false)}
      onChange={() => {
        if (targetObj) {
          const pos = targetObj.position;
          const euler = new THREE.Euler().setFromQuaternion(targetObj.quaternion);
          const scl = targetObj.scale;

          updateTransformOverride(activeReferenceComponentId!, {
            position: { x: pos.x * 1000, y: pos.y * 1000, z: pos.z * 1000 },
            rotation: {
              x: (euler.x * 180) / Math.PI,
              y: (euler.y * 180) / Math.PI,
              z: (euler.z * 180) / Math.PI,
            },
            scale: { x: scl.x, y: scl.y, z: scl.z },
          });
        }
      }}
    />
  );
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

  // Transform and selection states (Section 4 & 8)
  const editMode = useStore((state) => state.editMode);
  const selectedComponentIds = useStore((state) => state.selectedComponentIds);
  const setSelectedComponentIds = useStore((state) => state.setSelectedComponentIds);
  const activeReferenceComponentId = useStore((state) => state.activeReferenceComponentId);
  const setActiveReferenceComponentId = useStore((state) => state.setActiveReferenceComponentId);
  const isDraggingGizmo = useStore((state) => state.isDraggingGizmo);

  const [hoveredMeshId, setHoveredMeshId] = useState<string | null>(null);

  const activeModule = objectRegistry[selectedObjectType];
  const meshes = activeModule ? activeModule.deriveGeometry(currentParams) : [];

  const controlsRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);

  const rootNode = activeModule ? activeModule.hierarchy(currentParams) : null;

  // Retrieve hierarchy node IDs recursively to identify unmatched meshes
  const getHierarchyNodeIds = (node: HierarchyNode): string[] => {
    const ids = [node.id];
    if (node.children) {
      node.children.forEach(c => ids.push(...getHierarchyNodeIds(c)));
    }
    return ids;
  };
  const hierarchyNodeIds = rootNode ? getHierarchyNodeIds(rootNode) : [];
  
  // Find meshes that don't match any node in the hierarchy
  const unmatchedMeshes = meshes.filter(m => !hierarchyNodeIds.some(hId => m.id === hId || m.id.startsWith(hId + '_') || m.id.startsWith(hId + '-')));

  const handleMeshClick = (e: any, meshId: string) => {
    e.stopPropagation(); // Stop event bubbling
    
    if (editMode !== 'component') {
      // Parametric mode: default select component behavior
      setSelection({ type: 'component', id: meshId });
      return;
    }

    // Component Edit mode: resolve nearest selectable component ID from Object3D userData
    let current: THREE.Object3D | null = e.object;
    let resolvedId = meshId;
    while (current) {
      if (current.userData && current.userData.selectable && current.userData.componentId) {
        resolvedId = current.userData.componentId;
        break;
      }
      current = current.parent;
    }

    const isMultiSelect = e.ctrlKey || e.metaKey;
    if (isMultiSelect) {
      let newSelection = [...selectedComponentIds];
      if (newSelection.includes(resolvedId)) {
        newSelection = newSelection.filter(id => id !== resolvedId);
      } else {
        newSelection.push(resolvedId);
      }
      setSelectedComponentIds(newSelection);
      setActiveReferenceComponentId(newSelection.length > 0 ? resolvedId : null);
    } else {
      setSelectedComponentIds([resolvedId]);
      setActiveReferenceComponentId(resolvedId);
    }
  };

  return (
    <main className="flex-1 h-full relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 30%, hsl(224,18%,7%) 0%, hsl(224,18%,3%) 70%)' }}>
      <Canvas 
        camera={{ position: [0, 1.2, 1.8], fov: 45 }}
        gl={{ 
          toneMapping: THREE.ACESFilmicToneMapping, // Filmic tone mapping (Section 6)
          toneMappingExposure: 1.15
        }}
        onPointerMissed={() => {
          if (editMode === 'component') {
            // Deselect in component mode
            setSelectedComponentIds([]);
            setActiveReferenceComponentId(null);
          } else {
            // Clear selection back to object-level (REQ-COMPSEL-003)
            setSelection({ type: 'object', id: selectedObjectType });
          }
        }}
      >
        {/* Transparent canvas background allows parent CSS multi-stop gradient to show through (Section 19.2) */}
        
        {/* Orbit Camera Controls with damped inertia (Section 6 & 9) */}
        <OrbitControls 
          ref={controlsRef}
          makeDefault 
          enableDamping 
          dampingFactor={0.05} 
          minDistance={0.15} 
          maxDistance={5} 
          enabled={!isDraggingGizmo} // prevent camera fight with transform gizmo
        />

        <CameraController controlsRef={controlsRef} />
        <SceneExporter />
        
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
        
        {/* Ground grid — major lines at 1m, minor at 0.25m */}
        {gridEnabled && (
          <>
            <gridHelper args={[10, 40, '#232840', '#1a1c28']} position={[0, 0, 0]} />
            <gridHelper args={[10, 160, '#1a1d2a', '#151720']} position={[0, 0.0005, 0]} />
          </>
        )}

        {/* Generically render meshes recursively matching hierarchy (Section 2 & 3) */}
        <group ref={groupRef}>
          {rootNode && (
            <RecursiveComponent
              node={rootNode}
              meshes={meshes}
              shadingMode={shadingMode}
              selectedComponentIds={selectedComponentIds}
              hoveredMeshId={hoveredMeshId}
              setHoveredMeshId={setHoveredMeshId}
              onClickMesh={handleMeshClick}
            />
          )}

          {/* Fallback unmatched meshes (Section 26) */}
          {unmatchedMeshes.map((mesh) => {
            const isSelected = selectionScope.type === 'component' && selectionScope.id === mesh.id;
            const isHovered = hoveredMeshId === mesh.id;
            
            return (
              <group key={mesh.id}>
                <mesh
                  position={mesh.position || [0, 0, 0]}
                  rotation={mesh.rotation || [0, 0, 0]}
                  scale={mesh.scale || [1, 1, 1]}
                  onClick={(e) => handleMeshClick(e, mesh.id)}
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
                    wireframe={shadingMode === 'wireframe' || (mesh.material.wireframe ?? false)}
                    emissive={isSelected ? '#0d9488' : (isHovered ? '#0d9488' : '#000000')}
                    emissiveIntensity={isSelected ? 0.25 : (isHovered ? 0.08 : 0)}
                  />
                </mesh>
              </group>
            );
          })}
        </group>

        {/* Real-time Bounding Box Helper (Section 6) */}
        <BoundingBoxRenderer groupRef={groupRef} enabled={boundingBoxEnabled} />

        {/* Soft ground contact shadow */}
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.65}
          scale={4}
          blur={2.2}
          far={2}
          color="#000000"
        />

        {/* Transform controls gizmo (Section 8) */}
        <GizmoControls />
      </Canvas>

      {/* First-run orbit hint — fades out after 6 seconds */}
      <FirstRunHint />

      {/* Floating viewport quick controls — bottom right */}
      <ViewportOverlayControls />
    </main>
  );
}

// ── First-run interaction hint ────────────────────────────────────────────────
function FirstRunHint() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 6000);
    const dismiss = () => setVisible(false);
    window.addEventListener('mousemove', dismiss, { once: true });
    window.addEventListener('wheel', dismiss, { once: true });
    return () => { clearTimeout(t); window.removeEventListener('mousemove', dismiss); window.removeEventListener('wheel', dismiss); };
  }, []);
  if (!visible) return null;
  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 pointer-events-none animate-hint-fade-out z-20">
      <div className="bg-surface-0/80 backdrop-blur-sm border border-border-subtle rounded px-4 py-2 text-[11px] text-text-tertiary text-center">
        Drag to orbit&nbsp;&nbsp;·&nbsp;&nbsp;Scroll to zoom&nbsp;&nbsp;·&nbsp;&nbsp;Click a part to select
      </div>
    </div>
  );
}

// ── Floating quick controls overlay (bottom-right) ────────────────────────────
function ViewportOverlayControls() {
  const gridEnabled       = useStore(s => s.gridEnabled);
  const shadingMode       = useStore(s => s.shadingMode);
  const boundingBoxEnabled = useStore(s => s.boundingBoxEnabled);

  const btnBase = 'w-7 h-7 flex items-center justify-center rounded cursor-pointer transition-colors';
  const btnOn   = `${btnBase} bg-accent-muted text-text-accent border border-accent/30`;
  const btnOff  = `${btnBase} text-text-tertiary hover:text-text-primary hover:bg-surface-2 border border-transparent`;

  return (
    <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-20">
      <button
        onClick={() => useStore.getState().triggerFrameSelected()}
        data-tooltip="Frame Selection (F)"
        aria-label="Frame Selection"
        className={btnOff}
      >
        <Crosshair className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => useStore.getState().triggerResetView()}
        data-tooltip="Reset View"
        aria-label="Reset View"
        className={btnOff}
      >
        <RefreshCcw className="w-3.5 h-3.5" />
      </button>
      <div className="w-full h-px bg-border-subtle my-0.5" />
      <button
        onClick={() => useStore.getState().toggleGrid()}
        data-tooltip="Grid"
        aria-label="Toggle grid"
        className={gridEnabled ? btnOn : btnOff}
      >
        <Grid3x3 className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => useStore.getState().setShadingMode(shadingMode === 'wireframe' ? 'solid' : 'wireframe')}
        data-tooltip="Wireframe"
        aria-label="Toggle wireframe"
        className={shadingMode === 'wireframe' ? btnOn : btnOff}
      >
        <span className="text-[9px] font-bold uppercase">W</span>
      </button>
      <button
        onClick={() => useStore.getState().toggleBoundingBox()}
        data-tooltip="Bounding Box"
        aria-label="Toggle bounding box"
        className={boundingBoxEnabled ? btnOn : btnOff}
      >
        <BoxSelect className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
