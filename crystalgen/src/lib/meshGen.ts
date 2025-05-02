import { BufferGeometry, Vector3, BufferAttribute, MathUtils } from 'three';
import type { CrystalParams } from '../store/crystalStore';
import { useCrystalStore } from '../store/crystalStore';

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
  
  // Pick base type based on seed for variety
  const baseTypes = ['cube', 'octahedron', 'rectangular', 'sphere'] as const;
  // Improve randomness: shuffle baseTypes and pick one
  const shuffled = baseTypes.slice().sort(() => randomFunction() - 0.5);
  const baseType = shuffled[0];
  
  // Update progress
  onProgress(10);
  
  // Create a base prism
  const { vertices: baseVertices, indices: baseIndices, normals: baseNormals } = generateBasePolyhedron(
    baseType,
    params.proportions,
    params.symmetry,
    randomFunction
  );
  
  // Update progress
  onProgress(30);
  
  // Subdivide mesh for weathering detail
  const subdivLevels = Math.floor(params.weatheringSize / 25); // 0-4 levels
  let { vertices: subdivVertices, indices: subdivIndices } = subdivideMesh(baseVertices, baseIndices, subdivLevels);
  
  // Apply realistic weathering
  applyRealisticWeathering(subdivVertices, subdivIndices, params.weatheringStrength, params.weatheringSize, randomFunction);
  
  // Update progress
  onProgress(60);
  
  // Apply deformations for more crystal-like appearance
  await applyCrystalDeformations(
    subdivVertices, 
    subdivIndices, 
    baseNormals, 
    params.proportions,
    params.symmetry / 100,
    randomFunction
  );
  
  // Recalculate normals for the new mesh
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(subdivVertices), 3));
  geometry.setIndex(subdivIndices);
  geometry.computeVertexNormals();
  
  // Check for NaN/invalid values
  const posArr = geometry.getAttribute('position').array;
  let hasNaN = false;
  for (let i = 0; i < posArr.length; i++) {
    if (!isFinite(posArr[i])) {
      hasNaN = true;
      break;
    }
  }
  if (hasNaN) {
    console.warn('Mesh contains NaN or invalid values after subdivision/weathering.');
  }
  
  // Ensure geometry is watertight
  ensureWatertight(geometry);
  
  // Complete progress
  onProgress(100);
  
  // Debug info
  const vertexCount = subdivVertices.length / 3;
  const faceCount = subdivIndices.length / 3;
  if (typeof window !== 'undefined') {
    // Only call store in browser
    const store = require('../store/crystalStore');
    if (store && store.useCrystalStore) {
      store.useCrystalStore.getState().setDebugInfo({
        baseType,
        seed: params.seed,
        vertexCount,
        faceCount,
      });
    }
  }
  
  return geometry;
}

/**
 * Generate a base polyhedron (cube, octahedron, rectangular prism, or sphere)
 */
function generateBasePolyhedron(
  type: 'cube' | 'octahedron' | 'rectangular' | 'sphere',
  proportions: Vector3,
  symmetry: number,
  rng: () => number
): { vertices: number[]; indices: number[]; normals: number[] } {
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];

  if (type === 'cube' || type === 'rectangular') {
    // Cube or rectangular prism
    const w = proportions.x;
    const h = proportions.y;
    const d = proportions.z;
    // 8 vertices
    const v = [
      [-w, -h, -d], [w, -h, -d], [w, h, -d], [-w, h, -d],
      [-w, -h, d], [w, -h, d], [w, h, d], [-w, h, d],
    ];
    // Faces
    const f = [
      [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 3, 7, 4]
    ];
    for (const vert of v) vertices.push(...vert);
    for (const face of f) {
      indices.push(face[0], face[1], face[2], face[0], face[2], face[3]);
    }
    // Normals (approximate)
    for (let i = 0; i < 8; i++) normals.push(0, 0, 1);
  } else if (type === 'octahedron') {
    // Octahedron (diamond)
    const w = proportions.x;
    const h = proportions.y;
    const d = proportions.z;
    const v = [
      [0, h, 0], [0, -h, 0], [w, 0, 0], [0, 0, d], [-w, 0, 0], [0, 0, -d]
    ];
    const f = [
      [0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 2],
      [1, 2, 3], [1, 3, 4], [1, 4, 5], [1, 5, 2]
    ];
    for (const vert of v) vertices.push(...vert);
    for (const face of f) indices.push(face[0], face[1], face[2]);
    for (let i = 0; i < 6; i++) normals.push(0, 0, 1);
  } else if (type === 'sphere') {
    // Icosahedron as a sphere-like base
    const t = (1 + Math.sqrt(5)) / 2;
    const verts = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ];
    for (const v of verts) vertices.push(v[0] * proportions.x, v[1] * proportions.y, v[2] * proportions.z);
    const faces = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];
    for (const f of faces) indices.push(f[0], f[1], f[2]);
    for (let i = 0; i < verts.length; i++) normals.push(0, 0, 1);
  }

  // Apply symmetry/asymmetry: if symmetry < 100, randomly offset vertices
  if (symmetry < 100) {
    const asym = (1 - symmetry / 100) * 0.6; // up to 60% offset
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i] += (rng() - 0.5) * asym;
      vertices[i + 1] += (rng() - 0.5) * asym;
      vertices[i + 2] += (rng() - 0.5) * asym;
    }
  }

  return { vertices, indices, normals };
}

/**
 * Helper: subdivide mesh faces for higher detail
 */
function subdivideMesh(vertices: number[], indices: number[], levels: number): { vertices: number[], indices: number[] } {
  let v = [...vertices];
  let idx = [...indices];
  for (let l = 0; l < levels; l++) {
    const newIdx: number[] = [];
    const midpointCache = new Map<string, number>();
    function midpoint(i1: number, i2: number): number {
      const key = i1 < i2 ? `${i1}_${i2}` : `${i2}_${i1}`;
      if (midpointCache.has(key)) return midpointCache.get(key)!;
      const x = (v[i1 * 3] + v[i2 * 3]) / 2;
      const y = (v[i1 * 3 + 1] + v[i2 * 3 + 1]) / 2;
      const z = (v[i1 * 3 + 2] + v[i2 * 3 + 2]) / 2;
      v.push(x, y, z);
      const newIdxVal = v.length / 3 - 1;
      midpointCache.set(key, newIdxVal);
      return newIdxVal;
    }
    for (let i = 0; i < idx.length; i += 3) {
      const i0 = idx[i], i1 = idx[i+1], i2 = idx[i+2];
      const a = midpoint(i0, i1);
      const b = midpoint(i1, i2);
      const c = midpoint(i2, i0);
      newIdx.push(i0, a, c, i1, b, a, i2, c, b, a, b, c);
    }
    idx = newIdx;
  }
  return { vertices: v, indices: idx };
}

/**
 * Helper: apply realistic weathering (cuts, cracks, scratches)
 */
function applyRealisticWeathering(
  vertices: number[],
  indices: number[],
  strength: number,
  size: number,
  rng: () => number
) {
  // Number of features scales with size/detail
  const featureCount = Math.floor(3 + size * 0.2);
  const meshSize = Math.max(...vertices.map(Math.abs));
  for (let f = 0; f < featureCount; f++) {
    // Pick a random feature type
    const type = rng() < 0.5 ? 'cut' : (rng() < 0.7 ? 'crack' : 'scratch');
    // Pick a random plane or line
    const axis = Math.floor(rng() * 3);
    const pos = (rng() - 0.5) * meshSize * 1.5;
    const width = 0.05 + 0.1 * (1 - size / 100);
    const depth = 0.02 + 0.25 * (strength / 100);
    for (let i = 0; i < vertices.length; i += 3) {
      // Project vertex onto axis
      const p = vertices[i + axis];
      if (Math.abs(p - pos) < width) {
        if (type === 'cut') {
          vertices[i + axis] += (rng() - 0.5) * depth * 2;
        } else if (type === 'crack') {
          // Jagged displacement
          vertices[i + axis] += (Math.sin(vertices[i] * 10 + rng() * 5) * 0.5 + (rng() - 0.5)) * depth;
        } else if (type === 'scratch') {
          // Shallow, narrow groove
          vertices[i + axis] -= Math.abs(Math.sin(vertices[i] * 20 + rng() * 10)) * depth * 0.5;
        }
      }
    }
  }
}

/**
 * Apply crystal-specific deformations with more geometric, faceted patterns
 */
async function applyCrystalDeformations(
  vertices: number[],
  indices: number[],
  normals: number[],
  proportions: Vector3,
  symmetryFactor: number,
  rng: () => number
): Promise<void> {
  const vertexCount = vertices.length / 3;
  
  // Add geometric facets with intentional asymmetry
  const facetCount = Math.floor(8 + rng() * 8); // Fewer but more significant facets
  
  for (let i = 0; i < facetCount; i++) {
    // Choose a face to add a facet to, with preference for upward-facing faces
    const faceIndex = Math.floor(rng() * (indices.length / 3));
    const v1 = indices[faceIndex * 3];
    const v2 = indices[faceIndex * 3 + 1];
    const v3 = indices[faceIndex * 3 + 2];
    
    // Calculate face center and normal
    const centerX = (vertices[v1 * 3] + vertices[v2 * 3] + vertices[v3 * 3]) / 3;
    const centerY = (vertices[v1 * 3 + 1] + vertices[v2 * 3 + 1] + vertices[v3 * 3 + 1]) / 3;
    const centerZ = (vertices[v1 * 3 + 2] + vertices[v2 * 3 + 2] + vertices[v3 * 3 + 2]) / 3;
    
    // Calculate face normal
    const edge1 = new Vector3(
      vertices[v2 * 3] - vertices[v1 * 3],
      vertices[v2 * 3 + 1] - vertices[v1 * 3 + 1],
      vertices[v2 * 3 + 2] - vertices[v1 * 3 + 2]
    );
    const edge2 = new Vector3(
      vertices[v3 * 3] - vertices[v1 * 3],
      vertices[v3 * 3 + 1] - vertices[v1 * 3 + 1],
      vertices[v3 * 3 + 2] - vertices[v1 * 3 + 2]
    );
    const faceNormal = new Vector3().crossVectors(edge1, edge2).normalize();
    
    // Add facet with more geometric growth pattern
    const growthFactor = 0.2 + rng() * 0.4; // 20-60% growth for more dramatic facets
    const newX = centerX + faceNormal.x * growthFactor;
    const newY = centerY + faceNormal.y * growthFactor;
    const newZ = centerZ + faceNormal.z * growthFactor;
    
    // Add intentional asymmetry to the facet
    const asymmetryX = (rng() - 0.5) * growthFactor * 0.3;
    const asymmetryY = (rng() - 0.5) * growthFactor * 0.3;
    const asymmetryZ = (rng() - 0.5) * growthFactor * 0.3;
    
    // Add new vertex with asymmetry
    vertices.push(newX + asymmetryX, newY + asymmetryY, newZ + asymmetryZ);
    normals.push(faceNormal.x, faceNormal.y, faceNormal.z);
    
    const newVertexIndex = vertexCount + i;
    
    // Replace original triangle with three new triangles
    indices[faceIndex * 3 + 2] = newVertexIndex;
    indices.push(v2, v3, newVertexIndex);
    indices.push(v3, v1, newVertexIndex);
  }
  
  // Add geometric points for more faceted appearance
  const pointCount = Math.floor(3 + rng() * 3); // Fewer but more significant points
  
  for (let i = 0; i < pointCount; i++) {
    // Create points with more geometric distribution
    const theta = rng() * Math.PI * 2;
    const phi = (rng() - 0.5) * Math.PI;
    
    // The higher the symmetry, the more regular the shape should be
    const radiusVariation = 1 - (symmetryFactor * 0.3); // Reduced symmetry influence
    const radius = 1 + (rng() - 0.5) * radiusVariation;
    
    // Add more geometric variation
    const x = radius * proportions.x * Math.cos(phi) * Math.cos(theta);
    const y = radius * proportions.y * Math.sin(phi);
    const z = radius * proportions.z * Math.cos(phi) * Math.sin(theta);
    
    // Add slight asymmetry
    const asymmetry = 0.1 + rng() * 0.2; // 10-30% asymmetry
    vertices.push(
      x + (rng() - 0.5) * asymmetry,
      y + (rng() - 0.5) * asymmetry,
      z + (rng() - 0.5) * asymmetry
    );
    normals.push(x, y, z);
  }
}

/**
 * Ensure the geometry is watertight by checking and fixing any holes
 */
function ensureWatertight(geometry: BufferGeometry): void {
  // First ensure all faces are properly oriented
  geometry.computeVertexNormals();
  
  // Create a map of edges to track face connections
  const edgeMap = new Map<string, number>();
  
  // Track all edges
  const indices = geometry.getIndex()?.array;
  if (!indices) return;
  
  for (let i = 0; i < indices.length; i += 3) {
    const v1 = indices[i];
    const v2 = indices[i + 1];
    const v3 = indices[i + 2];
    
    // Add edges in both directions
    const edge1 = `${Math.min(v1, v2)}-${Math.max(v1, v2)}`;
    const edge2 = `${Math.min(v2, v3)}-${Math.max(v2, v3)}`;
    const edge3 = `${Math.min(v3, v1)}-${Math.max(v3, v1)}`;
    
    edgeMap.set(edge1, (edgeMap.get(edge1) || 0) + 1);
    edgeMap.set(edge2, (edgeMap.get(edge2) || 0) + 1);
    edgeMap.set(edge3, (edgeMap.get(edge3) || 0) + 1);
  }
  
  // Check for edges that are only used once (indicating a hole)
  const holes: string[] = [];
  edgeMap.forEach((count, edge) => {
    if (count === 1) {
      holes.push(edge);
    }
  });
  
  // If we found holes, add faces to close them
  if (holes.length > 0) {
    const vertices = geometry.getAttribute('position').array;
    const newIndices: number[] = [];
    
    // Add the existing indices
    for (let i = 0; i < indices.length; i++) {
      newIndices.push(indices[i]);
    }
    
    // Add faces to close holes
    for (const hole of holes) {
      const [v1, v2] = hole.split('-').map(Number);
      
      // Find a third vertex to form a triangle
      for (let i = 0; i < vertices.length / 3; i++) {
        if (i !== v1 && i !== v2) {
          // Check if this would form a valid triangle
          const p1 = new Vector3(vertices[v1 * 3], vertices[v1 * 3 + 1], vertices[v1 * 3 + 2]);
          const p2 = new Vector3(vertices[v2 * 3], vertices[v2 * 3 + 1], vertices[v2 * 3 + 2]);
          const p3 = new Vector3(vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2]);
          
          const edge1 = p2.clone().sub(p1);
          const edge2 = p3.clone().sub(p1);
          const normal = edge1.cross(edge2);
          
          if (normal.length() > 0.0001) { // Ensure non-degenerate triangle
            newIndices.push(v1, v2, i);
            break;
          }
        }
      }
    }
    
    // Update the geometry with new indices
    geometry.setIndex(newIndices);
  }
  
  // Ensure proper face orientation
  geometry.computeVertexNormals();
} 