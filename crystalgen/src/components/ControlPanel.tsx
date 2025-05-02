import React, { useState } from 'react';
import { Vector3 } from 'three';
import { useCrystalStore, ShaderType } from '../store/crystalStore';
import { ExportButton } from './CrystalCanvas';

// Slider component with label and value
function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm">{label}</label>
        <span className="text-xs bg-surface-2 px-2 py-1 rounded-md">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider w-full h-2 rounded-full appearance-none bg-surface-2 focus:outline-none"
      />
    </div>
  );
}

// Vector3 input for proportions
function ProportionsInput() {
  const proportions = useCrystalStore((state) => state.params.proportions);
  const setParams = useCrystalStore((state) => state.setParams);
  
  const updateProportion = (axis: 'x' | 'y' | 'z', value: number) => {
    const newProportions = new Vector3().copy(proportions);
    newProportions[axis] = value;
    setParams({ proportions: newProportions });
  };
  
  return (
    <div className="mb-4">
      <label className="text-sm block mb-1">Proportions</label>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs block mb-1">X</label>
          <input
            type="number"
            min={0.1}
            max={5}
            step={0.1}
            value={proportions.x}
            onChange={(e) => updateProportion('x', parseFloat(e.target.value))}
            className="w-full bg-surface p-2 rounded-md text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs block mb-1">Y</label>
          <input
            type="number"
            min={0.1}
            max={5}
            step={0.1}
            value={proportions.y}
            onChange={(e) => updateProportion('y', parseFloat(e.target.value))}
            className="w-full bg-surface p-2 rounded-md text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs block mb-1">Z</label>
          <input
            type="number"
            min={0.1}
            max={5}
            step={0.1}
            value={proportions.z}
            onChange={(e) => updateProportion('z', parseFloat(e.target.value))}
            className="w-full bg-surface p-2 rounded-md text-sm"
          />
        </div>
      </div>
    </div>
  );
}

// Shader selector dropdown
function ShaderSelector() {
  const shader = useCrystalStore((state) => state.shader);
  const setShader = useCrystalStore((state) => state.setShader);
  
  return (
    <div className="mb-4">
      <label className="text-sm block mb-1">Shader Style</label>
      <select
        value={shader}
        onChange={(e) => setShader(e.target.value as ShaderType)}
        className="w-full bg-surface p-2 rounded-md text-sm"
      >
        <option value="pbr">PBR (Physically Based)</option>
        <option value="hand-drawn">Hand-Drawn</option>
      </select>
    </div>
  );
}

// Seed input with random button
function SeedInput() {
  const seed = useCrystalStore((state) => state.params.seed);
  const setParams = useCrystalStore((state) => state.setParams);
  
  const randomizeSeed = () => {
    setParams({ seed: Math.floor(Math.random() * 1000000) });
  };
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm">Seed</label>
        <button
          onClick={randomizeSeed}
          className="text-xs bg-surface-2 px-2 py-1 rounded-md hover:bg-surface-3"
        >
          Random
        </button>
      </div>
      <input
        type="number"
        value={seed}
        onChange={(e) => setParams({ seed: parseInt(e.target.value) })}
        className="w-full bg-surface p-2 rounded-md text-sm"
      />
    </div>
  );
}

// Main control panel component
export default function ControlPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const params = useCrystalStore((state) => state.params);
  const setParams = useCrystalStore((state) => state.setParams);
  const regenerate = useCrystalStore((state) => state.regenerate);
  const isGenerating = useCrystalStore((state) => state.isGenerating);
  
  return (
    <div className={`control-panel fixed top-0 right-0 h-full bg-surface shadow-lg transition-all duration-300 z-20 ${isOpen ? 'w-72' : 'w-8'}`}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 left-0 transform -translate-x-full bg-surface px-3 py-2 rounded-l-md"
      >
        {isOpen ? '»' : '«'}
      </button>
      
      {/* Panel content */}
      {isOpen && (
        <div className="p-4 h-full overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Crystal Generator</h2>
          
          <Slider
            label="Symmetry"
            value={params.symmetry}
            min={0}
            max={100}
            step={1}
            onChange={(value) => setParams({ symmetry: value })}
          />
          
          <ProportionsInput />
          
          <Slider
            label="Weathering"
            value={params.weathering}
            min={0}
            max={100}
            step={1}
            onChange={(value) => setParams({ weathering: value })}
          />
          
          <SeedInput />
          
          <ShaderSelector />
          
          <div className="flex gap-2 mt-6">
            <button
              onClick={regenerate}
              disabled={isGenerating}
              className={`flex-1 px-4 py-2 rounded-md bg-surface-2 hover:bg-surface-3 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Regenerate
            </button>
            
            <ExportButton />
          </div>
        </div>
      )}
    </div>
  );
} 