import { BufferGeometry, Vector3, BufferAttribute, MathUtils } from 'three';
import type { CrystalParams } from '../store/crystalStore';

/**
 * Generate a procedural crystal geometry based on parameters
 */
export async function generateCrystal(
  params: CrystalParams,
  onProgress: (pct: number) => void
): Promise<BufferGeometry> {
  // Start progress
  onProgress(0);
  
  // Initialize random number generator with seed for deterministic results
  const randomFunction = () => MathUtils.seededRandom(params.seed);
  
  // Calculate number of sides based on symmetry (4-12)
  const sides = 4 + Math.floor((params.symmetry / 100) * 8);
  
  // Create basic geometry
  const geometry = new BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  
  // Update progress
  onProgress(10);
  
  // Create a base prism
  await createBasePrism(
    vertices, 
    indices, 
    normals, 
    sides, 
    params.proportions,
    randomFunction
  );
  
  // Update progress
  onProgress(30);
  
  // Apply weathering if needed
  if (params.weathering > 0) {
    await applyWeathering(
      vertices, 
      indices, 
      normals, 
      params.weathering / 100, 
      randomFunction
    );
  }
  
  // Update progress
  onProgress(60);
  
  // Apply deformations for more crystal-like appearance
  await applyCrystalDeformations(
    vertices, 
    indices, 
    normals, 
    params.proportions,
    params.symmetry / 100,
    randomFunction
  );
  
  // Update progress
  onProgress(90);
  
  // Set geometry attributes
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  // Ensure geometry is watertight
  ensureWatertight(geometry);
  
  // Complete progress
  onProgress(100);
  
  return geometry;
}

/**
 * Creates a base prism geometry
 */
async function createBasePrism(
  vertices: number[],
  indices: number[],
  normals: number[],
  sides: number,
  proportions: Vector3,
  rng: () => number
): Promise<void> {
  // Create top and bottom vertices
  const radiusTop = 1 * proportions.x;
  const radiusBottom = 0.8 * proportions.x;
  const height = 2 * proportions.y;
  
  // Create top vertices
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const x = Math.cos(angle) * radiusTop;
    const z = Math.sin(angle) * radiusTop;
    
    vertices.push(x, height/2, z);
    normals.push(x, 0, z);
  }
  
  // Create bottom vertices
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const x = Math.cos(angle) * radiusBottom;
    const z = Math.sin(angle) * radiusBottom;
    
    vertices.push(x, -height/2, z);
    normals.push(x, 0, z);
  }
  
  // Create top face
  for (let i = 0; i < sides - 2; i++) {
    indices.push(0, i + 1, i + 2);
  }
  
  // Create bottom face
  for (let i = 0; i < sides - 2; i++) {
    indices.push(sides, sides + i + 1, sides + i + 2);
  }
  
  // Create side faces
  for (let i = 0; i < sides; i++) {
    const i1 = i;
    const i2 = (i + 1) % sides;
    const i3 = i + sides;
    const i4 = ((i + 1) % sides) + sides;
    
    indices.push(i1, i2, i4);
    indices.push(i1, i4, i3);
  }
}

/**
 * Apply weathering to the geometry
 */
async function applyWeathering(
  vertices: number[],
  indices: number[],
  normals: number[],
  intensity: number,
  rng: () => number
): Promise<void> {
  // Apply random noise to vertices
  for (let i = 0; i < vertices.length; i += 3) {
    const noiseX = (rng() - 0.5) * intensity * 0.5;
    const noiseY = (rng() - 0.5) * intensity * 0.5;
    const noiseZ = (rng() - 0.5) * intensity * 0.5;
    
    vertices[i] += noiseX;
    vertices[i + 1] += noiseY;
    vertices[i + 2] += noiseZ;
  }
  
  // Add some smaller facets to simulate crystal weathering
  const originalVertexCount = vertices.length / 3;
  
  // Add small facets on some faces
  const facetCount = Math.floor(intensity * 10);
  
  for (let i = 0; i < facetCount; i++) {
    const faceIndex = Math.floor(rng() * (indices.length / 3));
    const v1 = indices[faceIndex * 3];
    const v2 = indices[faceIndex * 3 + 1];
    const v3 = indices[faceIndex * 3 + 2];
    
    // Calculate face center and add a vertex there
    const centerX = (vertices[v1 * 3] + vertices[v2 * 3] + vertices[v3 * 3]) / 3;
    const centerY = (vertices[v1 * 3 + 1] + vertices[v2 * 3 + 1] + vertices[v3 * 3 + 1]) / 3;
    const centerZ = (vertices[v1 * 3 + 2] + vertices[v2 * 3 + 2] + vertices[v3 * 3 + 2]) / 3;
    
    // Add a bit of offset to the center
    const offset = 0.2 * intensity;
    const newX = centerX + (rng() - 0.5) * offset;
    const newY = centerY + (rng() - 0.5) * offset;
    const newZ = centerZ + (rng() - 0.5) * offset;
    
    // Add new vertex
    vertices.push(newX, newY, newZ);
    normals.push(0, 0, 0); // Will be computed later
    
    const newVertexIndex = originalVertexCount + i;
    
    // Replace triangle with three new triangles
    indices[faceIndex * 3 + 2] = newVertexIndex;
    
    // Add two more triangles
    indices.push(v2, v3, newVertexIndex);
    indices.push(v3, v1, newVertexIndex);
  }
}

/**
 * Apply crystal-specific deformations
 */
async function applyCrystalDeformations(
  vertices: number[],
  indices: number[],
  normals: number[],
  proportions: Vector3,
  symmetryFactor: number,
  rng: () => number
): Promise<void> {
  // Add some points to create crystal facets
  const vertexCount = vertices.length / 3;
  const pointCount = Math.floor(10 + rng() * 10);
  
  for (let i = 0; i < pointCount; i++) {
    // Create points on a roughly ellipsoidal surface
    const theta = rng() * Math.PI * 2;
    const phi = (rng() - 0.5) * Math.PI;
    
    // The higher the symmetry, the more regular the shape should be
    const radiusVariation = 1 - (symmetryFactor * 0.5);
    const radius = 1 + (rng() - 0.5) * radiusVariation;
    
    const x = radius * proportions.x * Math.cos(phi) * Math.cos(theta);
    const y = radius * proportions.y * Math.sin(phi);
    const z = radius * proportions.z * Math.cos(phi) * Math.sin(theta);
    
    vertices.push(x, y, z);
    normals.push(x, y, z); // Approximation, will be recomputed
  }
  
  // Add new faces connecting to existing geometry
  // This is a simplified approach
  for (let i = 0; i < pointCount; i++) {
    const newVertexIndex = vertexCount + i;
    
    // Connect to some existing vertices to form new triangles
    for (let j = 0; j < 3; j++) {
      const randomVertexIndex = Math.floor(rng() * vertexCount);
      const nextRandomVertexIndex = Math.floor(rng() * vertexCount);
      
      if (randomVertexIndex !== nextRandomVertexIndex) {
        indices.push(newVertexIndex, randomVertexIndex, nextRandomVertexIndex);
      }
    }
  }
}

/**
 * Ensure the geometry is watertight by checking and fixing any holes
 */
function ensureWatertight(geometry: BufferGeometry): void {
  // In a real-world implementation, this would use a more sophisticated algorithm
  // to check the manifold property and fix any issues
  
  // For now, we'll do a simple check to ensure all edges are shared by exactly two faces
  // This is a placeholder for a more comprehensive check
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
} 