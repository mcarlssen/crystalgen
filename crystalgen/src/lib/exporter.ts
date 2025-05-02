import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { CrystalParams } from '../store/crystalStore';

/**
 * Export a geometry to a ZIP file containing an STL and parameters JSON
 */
export async function exportZip(
  geometry: THREE.BufferGeometry,
  params: CrystalParams
): Promise<void> {
  // Generate unique ID and timestamp
  const id = generateId(6);
  const timestamp = new Date().toISOString();
  const filename = `crystal-generator_${id}_${timestamp}.zip`;

  // Create a mesh from the geometry
  const material = new THREE.MeshStandardMaterial();
  const mesh = new THREE.Mesh(geometry, material);

  // Create STL data - use ASCII format to avoid binary buffer issues
  const exporter = new STLExporter();
  const stlString = exporter.parse(mesh, { binary: false });

  // Create JSON data
  const jsonData = createJsonData(params);

  // Create ZIP file
  const zip = new JSZip();
  zip.file('crystal.stl', stlString);
  zip.file('crystal.json', JSON.stringify(jsonData, null, 2));

  // Generate ZIP blob and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, filename);

  // Call hooks
  onAutoArchive(jsonData);
}

/**
 * Generate a random alphanumeric ID
 */
function generateId(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars.charAt(randomIndex);
  }
  
  return result;
}

/**
 * Create JSON data for export
 */
function createJsonData(params: CrystalParams): any {
  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    params: {
      symmetry: params.symmetry,
      proportions: {
        x: params.proportions.x,
        y: params.proportions.y,
        z: params.proportions.z
      },
      weathering: params.weathering,
      seed: params.seed
    }
  };
}

/**
 * Hook for auto-archiving the parameters
 */
export function onAutoArchive(params: any): void {
  // This is a stub that would be connected to a future API endpoint
  // For now, we'll just log the parameters
  console.log('Auto-archiving parameters:', params);
}

/**
 * Hook for user-initiated save
 */
export async function onUserSave(params: any): Promise<void> {
  // This is a stub for a future "Save to Cloud" feature
  // For now, we'll just log the parameters
  console.log('User saving parameters:', params);
  // In a real implementation, this would POST to an API endpoint
  // Example:
  // await fetch('/api/save', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(params),
  // });
} 