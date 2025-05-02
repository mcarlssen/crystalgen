import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { useCrystalStore } from '../store/crystalStore';
import { generateCrystal } from '../lib/meshGen';
import { createShaderManager, ShaderManager } from '../lib/shaderManager';
import { exportZip } from '../lib/exporter';

// Progress overlay component
function ProgressOverlay() {
  const progress = useCrystalStore((state) => state.progress);
  const isGenerating = useCrystalStore((state) => state.isGenerating);
  
  if (!isGenerating || progress >= 100) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
      <div className="bg-surface p-4 rounded-lg w-64">
        <div className="text-center text-text mb-2">Generating crystal...</div>
        <div className="progress-bar w-full h-2 rounded-full overflow-hidden">
          <div 
            className="progress-bar-fill h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
    </div>
  );
}

// Crystal mesh component
function Crystal() {
  const params = useCrystalStore((state) => state.params);
  const selectedShader = useCrystalStore((state) => state.selectedShader);
  const setProgress = useCrystalStore((state) => state.setProgress);
  const setIsGenerating = useCrystalStore((state) => state.setIsGenerating);
  
  const meshRef = useRef<THREE.Mesh>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [shaderManager, setShaderManager] = useState<ShaderManager | null>(null);
  const [material, setMaterial] = useState<THREE.ShaderMaterial | null>(null);
  
  // Initialize shader manager
  useEffect(() => {
    const manager = createShaderManager();
    setShaderManager(manager);
    
    return () => {
      manager.dispose();
    };
  }, []);
  
  // Generate crystal geometry when params change
  useEffect(() => {
    if (!params) return;
    
    setIsGenerating(true);
    setProgress(0);
    
    const generate = async () => {
      try {
        const newGeometry = await generateCrystal(params, setProgress);
        setGeometry(newGeometry);
        
        // Small delay before finishing to ensure UI updates
        setTimeout(() => {
          setIsGenerating(false);
          setProgress(100);
        }, 300);
      } catch (error) {
        console.error('Error generating crystal:', error);
        setIsGenerating(false);
      }
    };
    
    generate();
  }, [params, setProgress, setIsGenerating]);
  
  // Update material when shader selection changes
  useEffect(() => {
    if (!shaderManager || !geometry) return;
    
    const updateMaterial = async () => {
      const newMaterial = await shaderManager.getMaterial(selectedShader);
      // Enable backface rendering
      newMaterial.side = THREE.DoubleSide;
      // Ensure proper depth testing
      newMaterial.depthWrite = true;
      newMaterial.depthTest = true;
      setMaterial(newMaterial);
    };
    
    updateMaterial();
  }, [selectedShader, shaderManager, geometry]);
  
  // Rotate the crystal
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });
  
  if (!geometry || !material) return null;
  
  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
}

// Control panel button for export
export function ExportButton() {
  const params = useCrystalStore((state) => state.params);
  const isGenerating = useCrystalStore((state) => state.isGenerating);
  const [exporting, setExporting] = useState(false);
  
  const handleExport = async () => {
    if (isGenerating || exporting) return;
    
    try {
      setExporting(true);
      
      // Use the current params to regenerate the geometry
      const geometry = await generateCrystal(params, () => {});
      
      // Export the geometry and params
      await exportZip(geometry, params);
    } catch (error) {
      console.error('Error exporting crystal:', error);
    } finally {
      setExporting(false);
    }
  };
  
  return (
    <button
      onClick={handleExport}
      disabled={isGenerating || exporting}
      className={`accent-button px-4 py-2 rounded-md ${(isGenerating || exporting) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {exporting ? 'Exporting...' : 'Export'}
    </button>
  );
}

// Main canvas component
export default function CrystalCanvas() {
  return (
    <div className="relative w-full h-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <hemisphereLight color={0xffffff} groundColor={0x888888} intensity={0.8} position={[0, 10, 0]} />
        <directionalLight intensity={0.4} position={[5, 10, 7]} castShadow={false} />
        <Crystal />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
      <ProgressOverlay />
      <button 
        className="absolute bottom-4 right-4 bg-surface px-3 py-1 rounded-md text-sm"
        onClick={() => {
          // Reset camera view
          const canvas = document.querySelector('canvas');
          if (canvas) {
            const event = new CustomEvent('reset-camera');
            canvas.dispatchEvent(event);
          }
        }}
      >
        Reset View
      </button>
    </div>
  );
} 