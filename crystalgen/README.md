# Crystal Generator

A browser-based tool that procedurally generates fantasy-style crystal meshes for 3D printing.

## Features

- **Watertight meshes** ready for slicing in Cura/PrusaSlicer
- **Customizable crystal parameters**:
  - Symmetry (0-100%)
  - Proportions (length:width:thickness ratio)
  - Weathering (0-100%)
  - Seed (for deterministic generation)
- **Real-time 3D display** with:
  - Orbit controls with auto-rotate
  - Pan/zoom capabilities
  - "Reset View" button
- **Two shader modes**:
  - PBR (physically-based rendering)
  - Hand-drawn sketch style
- **Export as ZIP** containing:
  - STL file for 3D printing
  - JSON file with all parameters for reproducibility

## Technologies Used

- Next.js (React)
- Three.js with react-three-fiber
- Zustand for state management
- Custom GLSL shaders
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/crystalgen.git
   cd crystalgen
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run the development server
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Adjust crystal parameters using the control panel on the right
2. Switch between shader styles to visualize the crystal differently
3. Click "Regenerate" to create a new crystal with the current parameters
4. Click "Export" to download a ZIP file containing the STL for 3D printing

## License

MIT

## Acknowledgments

Based on the original specification written by [Magnus Carlssen](https://github.com/Magnus%20Carlssen).
