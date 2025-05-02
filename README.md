# Crystal Generator Web App

**Goal:**  
Browser‑based tool that procedurally generates guaranteed‑watertight, fantasy‑style “crystal” meshes, displays them with configurable PBR or hand‑drawn shaders, and exports a single ZIP (STL + parameters JSON) for direct 3D printing.

---

## 1. Functional Requirements

### 1.1 Shape Generation
- **Watertight meshes** only, slice‑ready for Cura/PrusaSlicer.  
- **Geometry style:** Prism‑ and cluster‑style facets with organic, random “weathering.”  
- **User parameters:**
  - **Symmetry (0–100%)**
  - **Proportions** (length:width:thickness ratio)
  - **Weathering (0–100%)**
  - **Seed** (numeric for determinism)
- **Mesh density:** App‑controlled (no manual density slider).

### 1.2 Real‑time 3D Display
- **Canvas:** Three.js via React‑Three‑Fiber  
- **Controls:** Orbit + turntable auto‑rotate, pan/zoom, “Reset View”  
- **Shaders (standalone GLSL):**
  - **PBR** (transmission/IOR/roughness/color)
  - **Hand‑drawn** (outline/brush‑stroke)
- **Lighting:** HDRI or three‑point configurable  
- **Progress UI:** Full progress bar (0–100%) during up to ~5 s generation

### 1.3 Controls Panel
- **Inputs:** sliders/text‑fields for all parameters  
- **Shader selector:** PBR or Hand‑drawn  
- **Buttons:**
  - **Regenerate** (with current seed)
  - **Export** → downloads ZIP

### 1.4 Export & Sidecar JSON
- **ZIP naming:**  
  ```text
  crystal-generator_<6-char-ID>_<ISO-timestamp>.zip
  ```
  - **ID:** lightweight 5–6 char random alphanumeric  
  - **Timestamp:** ISO 8601 (e.g. `2025-05-02T15:45:30Z`)
- **Contents:**
  1. `crystal.stl` (binary, via Three.js `STLExporter`)
  2. `crystal.json` (full parameter set)
- **Auto‑archive hook:** `onAutoArchive(params: object)` → raw JSON only

---

## 2. Non‑Functional Requirements
- **Client‑heavy WebGL**, degrades gracefully on CPU‑only machines.  
- **Responsive desktop‑first UI**, with collapsible panel on narrow screens.  
- **Precision:** resin‑printer quality; manifold geometry, no holes.  
- **Extensibility:**
  - Drop‑in GLSL shaders (`/public/shaders/*.glsl`)
  - CSS‑variable theming (Gold‑Dust palette)
  - Hooks for future “Save” and auto‑archive

---

## 3. UI Theming & Color Scheme

Use the provided **Gold‑Dust** OKLCH palette in CSS variables:

```css
/* light mode */
:root {
  --bg:        oklch(100% 0   83);
  --surface:   oklch(98%  0.02 83);
  --text:      oklch(12%  0.02 83);
  --accent:    oklch(61.8% 0.145 83);
  --on-accent: oklch(100% 0   0);
  /* …other levels… */
}

/* dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --bg:        oklch(24%  0   83);
    --surface:   oklch(28%  0.02 83);
    --text:      oklch(100% 0   0);
    --accent:    oklch(61.8% 0.145 83);
    --on-accent: oklch(0%   0   0);
    /* … */
  }
}
```

Map these variables into your utility classes (Tailwind or CSS modules) for backgrounds, text, borders, buttons, sliders, and progress bar.

---

## 4. Technology Stack

| Layer         | Technology                         |
|---------------|------------------------------------|
| Framework     | Next.js (React)                    |
| 3D Engine     | Three.js + `@react-three/fiber`    |
| GUI Controls  | Leva (or Drei Controls)            |
| State         | Zustand                            |
| Shaders       | GLSL modules loaded dynamically    |
| Export & ZIP  | Three.js `STLExporter` + JSZip     |
| Download      | `file-saver` or native downloads   |
| Styling       | Tailwind CSS w/ CSS‑vars           |
| Loader UI     | React progress bar component       |
| Deployment    | Vercel                             |

---

## 5. High‑Level Architecture

1. **`<CrystalCanvas>`**  
   - Renders `geometry` + dynamic `material`  
   - Orbit + auto‑rotate; applies lighting & postprocessing  

2. **`meshGen.ts`**  
   ```ts
   async function generateCrystal(
     params: CrystalParams,
     onProgress: (pct: number) => void
   ): Promise<THREE.BufferGeometry> { … }
   ```
   - Ensures manifold, watertight mesh  
   - Reports `onProgress(0–100)`  

3. **`<ControlPanel>`**  
   - Binds UI controls to Zustand store  
   - Calls `generateCrystal` on “Regenerate”  
   - Shader dropdown switches GLSL files  
   - “Export” → `exportZip()`  

4. **`exporter.ts`**  
   ```ts
   async function exportZip(
     geom: THREE.BufferGeometry,
     params: CrystalParams
   ): Promise<void> { … }
   // Builds STL, JSON; packs ZIP via JSZip;
   // Names file crystal-generator_<ID>_<ISO>.zip; triggers download.
   ```
   - **Hooks:**
     - `onUserSave(params: object)` // future “Save” UI
     - `onAutoArchive(params: object)` // raw JSON only  

5. **Shaders Folder**  
   - `/public/shaders/*.glsl` (vertex + fragment)  
   - Dynamically discovered for dropdown  

6. **Styling & Theming**  
   - Global CSS‑vars from palette  
   - Components styled via Tailwind utilities using those vars  

---

## 6. Cloud‑Save & Auto‑Archive Hooks

- **`onUserSave(params: object): Promise<void>`**  
  Placeholder for a future “Save to Cloud” feature. Example stub:
  ```ts
  async function onUserSave(params) {
    // e.g. await fetch('/api/save', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(params),
    // });
  }
  ```
- **`onAutoArchive(params: object): void`**  
  Automatically called after each export to pass raw JSON for archival. Does not upload ZIP.
