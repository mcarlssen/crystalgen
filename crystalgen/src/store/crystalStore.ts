import { create } from 'zustand';
import { Vector3 } from 'three';

export type ShaderType = 'pbr' | 'hand-drawn';

export interface CrystalParams {
  symmetry: number;
  proportions: Vector3;
  weathering: number;
  seed: number;
  weatheringSize: number;
  weatheringStrength: number;
}

interface DebugInfo {
  baseType: string;
  seed: number;
  vertexCount: number;
  faceCount: number;
}

interface CrystalState {
  params: CrystalParams;
  shader: ShaderType;
  selectedShader: string;
  availableShaders: string[];
  progress: number;
  isGenerating: boolean;
  debugInfo?: DebugInfo;
  setParams: (params: Partial<CrystalParams>) => void;
  setShader: (shader: string) => void;
  setProgress: (progress: number) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setDebugInfo: (info: DebugInfo) => void;
  setAvailableShaders: (shaders: string[]) => void;
  regenerate: () => void;
}

const generateRandomSeed = () => Math.floor(Math.random() * 1000000);

export const useCrystalStore = create<CrystalState>((set) => ({
  params: {
    symmetry: 50,
    proportions: new Vector3(1, 1, 1),
    weathering: 30,
    seed: generateRandomSeed(),
    weatheringSize: 50,
    weatheringStrength: 30,
  },
  shader: 'pbr',
  selectedShader: 'pbr',
  availableShaders: ['pbr', 'hand-drawn', 'glow-crystal', 'translucent-gem'],
  progress: 0,
  isGenerating: false,
  debugInfo: undefined,
  
  setParams: (newParams) => set((state) => ({
    params: { ...state.params, ...newParams }
  })),
  
  setShader: (shader) => set({ selectedShader: shader }),
  
  setProgress: (progress) => set({ progress }),
  
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  
  setDebugInfo: (info) => set({ debugInfo: info }),
  
  setAvailableShaders: (shaders) => set({ availableShaders: shaders }),
  
  regenerate: () => set((state) => ({
    params: { 
      ...state.params, 
      seed: generateRandomSeed(),
    },
    isGenerating: true,
    progress: 0
  })),
})); 