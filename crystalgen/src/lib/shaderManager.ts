import * as THREE from 'three';

interface ShaderMaterialOptions {
  color?: THREE.Color;
  envMap?: THREE.CubeTexture;
  noiseTexture?: THREE.Texture;
  roughness?: number;
  metalness?: number;
  transmission?: number;
  ior?: number;
  opacity?: number;
  outlineThickness?: number;
  strokeDensity?: number;
}

export interface ShaderManager {
  getPBRMaterial: (options?: ShaderMaterialOptions) => Promise<THREE.ShaderMaterial>;
  getHandDrawnMaterial: (options?: ShaderMaterialOptions) => Promise<THREE.ShaderMaterial>;
  getMaterial: (type: string, options?: ShaderMaterialOptions) => Promise<THREE.ShaderMaterial>;
  dispose: () => void;
}

// Create a noise texture for hand-drawn shader
function createNoiseTexture(): THREE.Texture {
  const size = 256;
  const data = new Uint8Array(size * size);
  
  for (let i = 0; i < size * size; i++) {
    data[i] = Math.floor(Math.random() * 256);
  }
  
  const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat);
  texture.needsUpdate = true;
  return texture;
}

// Create a procedural environment map
function createProceduralEnvMap(): THREE.CubeTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  // Define colors for each face
  const colors = [
    { top: '#88CCFF', bottom: '#003366' }, // px
    { top: '#88CCFF', bottom: '#003366' }, // nx
    { top: '#88CCFF', bottom: '#003366' }, // py
    { top: '#88CCFF', bottom: '#003366' }, // ny
    { top: '#88CCFF', bottom: '#003366' }, // pz
    { top: '#88CCFF', bottom: '#003366' }  // nz
  ];
  
  // Create gradient textures for each face
  const textures = colors.map(({ top, bottom }) => {
    ctx.clearRect(0, 0, size, size);
    
    // Create a gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, top);
    gradient.addColorStop(1, bottom);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Add some subtle noise
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas.cloneNode(true) as HTMLCanvasElement);
    texture.needsUpdate = true;
    return texture;
  });
  
  // Create cube texture
  const cubeTexture = new THREE.CubeTexture(textures);
  cubeTexture.needsUpdate = true;
  return cubeTexture;
}

const shaderFiles: { [key: string]: { vertex: string; fragment: string } } = {
  'pbr': {
    vertex: '/shaders/pbr.vertex.glsl',
    fragment: '/shaders/pbr.fragment.glsl',
  },
  'hand-drawn': {
    vertex: '/shaders/hand-drawn.vertex.glsl',
    fragment: '/shaders/hand-drawn.fragment.glsl',
  },
  'glow-crystal': {
    vertex: '/shaders/pbr.vertex.glsl', // reuse for now
    fragment: '/shaders/glow-crystal.fragment.glsl',
  },
  'translucent-gem': {
    vertex: '/shaders/pbr.vertex.glsl', // reuse for now
    fragment: '/shaders/translucent-gem.fragment.glsl',
  },
  // Add more shaders here
};

async function loadShaderPair(name: string): Promise<{ vertex: string, fragment: string }> {
  const files = shaderFiles[name];
  if (!files) throw new Error(`Shader ${name} not found.`);
  const [vertex, fragment] = await Promise.all([
    fetch(files.vertex).then(r => r.text()),
    fetch(files.fragment).then(r => r.text()),
  ]);
  return { vertex, fragment };
}

export function createShaderManager(): ShaderManager {
  let pbrVertShader: string | null = null;
  let pbrFragShader: string | null = null;
  let handDrawnVertShader: string | null = null;
  let handDrawnFragShader: string | null = null;
  let noiseTexture: THREE.Texture | null = null;
  let envMap: THREE.CubeTexture | null = null;
  
  // Materials cache
  let pbrMaterial: THREE.ShaderMaterial | null = null;
  let handDrawnMaterial: THREE.ShaderMaterial | null = null;
  
  async function loadShader(url: string): Promise<string> {
    const response = await fetch(url);
    return response.text();
  }
  
  async function loadShaders(): Promise<void> {
    if (!pbrVertShader) {
      pbrVertShader = await loadShader('/shaders/pbr.vertex.glsl');
    }
    
    if (!pbrFragShader) {
      pbrFragShader = await loadShader('/shaders/pbr.fragment.glsl');
    }
    
    if (!handDrawnVertShader) {
      handDrawnVertShader = await loadShader('/shaders/hand-drawn.vertex.glsl');
    }
    
    if (!handDrawnFragShader) {
      handDrawnFragShader = await loadShader('/shaders/hand-drawn.fragment.glsl');
    }
  }
  
  async function initTextures(): Promise<void> {
    if (!noiseTexture) {
      noiseTexture = createNoiseTexture();
    }
    
    if (!envMap) {
      // Create procedural env map instead of loading external files
      envMap = createProceduralEnvMap();
    }
  }
  
  async function getPBRMaterial(options: ShaderMaterialOptions = {}): Promise<THREE.ShaderMaterial> {
    await loadShaders();
    await initTextures();
    
    if (!pbrMaterial) {
      pbrMaterial = new THREE.ShaderMaterial({
        vertexShader: pbrVertShader!,
        fragmentShader: pbrFragShader!,
        uniforms: {
          color: { value: new THREE.Color(0x80a0ff) },
          roughness: { value: 0.2 },
          metalness: { value: 0.0 },
          transmission: { value: 0.9 },
          ior: { value: 1.5 },
          opacity: { value: 1.0 },
          envMap: { value: envMap }
        },
        transparent: true
      });
    }
    
    // Update uniforms with options
    if (options.color) pbrMaterial.uniforms.color.value = options.color;
    if (options.roughness !== undefined) pbrMaterial.uniforms.roughness.value = options.roughness;
    if (options.metalness !== undefined) pbrMaterial.uniforms.metalness.value = options.metalness;
    if (options.transmission !== undefined) pbrMaterial.uniforms.transmission.value = options.transmission;
    if (options.ior !== undefined) pbrMaterial.uniforms.ior.value = options.ior;
    if (options.opacity !== undefined) pbrMaterial.uniforms.opacity.value = options.opacity;
    if (options.envMap) pbrMaterial.uniforms.envMap.value = options.envMap;
    
    return pbrMaterial;
  }
  
  async function getHandDrawnMaterial(options: ShaderMaterialOptions = {}): Promise<THREE.ShaderMaterial> {
    await loadShaders();
    await initTextures();
    
    if (!handDrawnMaterial) {
      handDrawnMaterial = new THREE.ShaderMaterial({
        vertexShader: handDrawnVertShader!,
        fragmentShader: handDrawnFragShader!,
        uniforms: {
          color: { value: new THREE.Color(0xffffff) },
          outlineThickness: { value: 0.3 },
          strokeDensity: { value: 5.0 },
          noiseTexture: { value: noiseTexture },
          time: { value: 0.0 }
        }
      });
    }
    
    // Update uniforms with options
    if (options.color) handDrawnMaterial.uniforms.color.value = options.color;
    if (options.outlineThickness !== undefined) handDrawnMaterial.uniforms.outlineThickness.value = options.outlineThickness;
    if (options.strokeDensity !== undefined) handDrawnMaterial.uniforms.strokeDensity.value = options.strokeDensity;
    if (options.noiseTexture) handDrawnMaterial.uniforms.noiseTexture.value = options.noiseTexture;
    
    // Animate time value
    const animate = () => {
      if (handDrawnMaterial) {
        handDrawnMaterial.uniforms.time.value += 0.01;
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
    
    return handDrawnMaterial;
  }
  
  async function getMaterial(type: string, options: ShaderMaterialOptions = {}): Promise<THREE.ShaderMaterial> {
    // Dynamically load shader by name
    const { vertex, fragment } = await loadShaderPair(type);
    await initTextures();
    const uniforms: any = {
      color: { value: new THREE.Color(0x80a0ff) },
      roughness: { value: 0.2 },
      metalness: { value: 0.0 },
      transmission: { value: 0.9 },
      ior: { value: 1.5 },
      opacity: { value: 1.0 },
      envMap: { value: envMap },
      noiseTexture: { value: noiseTexture },
      outlineThickness: { value: 0.3 },
      strokeDensity: { value: 5.0 },
      time: { value: 0.0 },
    };
    // Override with options
    if (options.color) uniforms.color.value = options.color;
    if (options.roughness !== undefined) uniforms.roughness.value = options.roughness;
    if (options.metalness !== undefined) uniforms.metalness.value = options.metalness;
    if (options.transmission !== undefined) uniforms.transmission.value = options.transmission;
    if (options.ior !== undefined) uniforms.ior.value = options.ior;
    if (options.opacity !== undefined) uniforms.opacity.value = options.opacity;
    if (options.envMap) uniforms.envMap.value = options.envMap;
    if (options.noiseTexture) uniforms.noiseTexture.value = options.noiseTexture;
    if (options.outlineThickness !== undefined) uniforms.outlineThickness.value = options.outlineThickness;
    if (options.strokeDensity !== undefined) uniforms.strokeDensity.value = options.strokeDensity;
    // Animate time for hand-drawn
    if (type === 'hand-drawn') {
      const animate = () => {
        if (material) {
          material.uniforms.time.value += 0.01;
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms,
      transparent: true,
    });
    return material;
  }
  
  function dispose(): void {
    if (pbrMaterial) {
      pbrMaterial.dispose();
      pbrMaterial = null;
    }
    
    if (handDrawnMaterial) {
      handDrawnMaterial.dispose();
      handDrawnMaterial = null;
    }
    
    if (noiseTexture) {
      noiseTexture.dispose();
      noiseTexture = null;
    }
    
    if (envMap) {
      envMap.dispose();
      envMap = null;
    }
  }
  
  return {
    getPBRMaterial,
    getHandDrawnMaterial,
    getMaterial,
    dispose
  };
} 