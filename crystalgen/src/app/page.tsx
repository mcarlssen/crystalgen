'use client';

import CrystalCanvas from '../components/CrystalCanvas';
import ControlPanel from '../components/ControlPanel';

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <div className="h-full w-full bg-bg">
        <CrystalCanvas />
        <ControlPanel />
      </div>
    </main>
  );
}
