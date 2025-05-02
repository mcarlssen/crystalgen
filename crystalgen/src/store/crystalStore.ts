import { create } from 'zustand';
import { Vector3 } from 'three';

export type ShaderType = 'pbr' | 'hand-drawn';

export interface CrystalParams {
  symmetry: number;
  proportions: Vector3;
  weathering: number;
  seed: number;
}

interface CrystalState {
  params: CrystalParams;
  shader: ShaderType;
  progress: number;
  isGenerating: boolean;
  setParams: (params: Partial<CrystalParams>) => void;
  setShader: (shader: ShaderType) => void;
  setProgress: (progress: number) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  regenerate: () => void;
}

const generateRandomSeed = () => Math.floor(Math.random() * 1000000);

export const useCrystalStore = create<CrystalState>((set) => ({
  params: {
    symmetry: 50,
    proportions: new Vector3(1, 1, 1),
    weathering: 30,
    seed: generateRandomSeed(),
  },
  shader: 'pbr',
  progress: 0,
  isGenerating: false,
  
  setParams: (newParams) => set((state) => ({
    params: { ...state.params, ...newParams }
  })),
  
  setShader: (shader) => set({ shader }),
  
  setProgress: (progress) => set({ progress }),
  
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  
  regenerate: () => set((state) => ({
    params: { 
      ...state.params, 
      seed: generateRandomSeed() 
    },
    isGenerating: true,
    progress: 0
  })),
})); 