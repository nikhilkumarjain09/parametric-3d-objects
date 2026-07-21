# Parametric 3D Object Generation Platform

A web-based interactive application designed for generating, inspecting, and modifying procedural 3D models (Tables, Chairs, Cups, and Mugs) in real time. Built with React, Next.js, and Three.js, the platform offers a performance-optimized parametric CAD-like editor with full viewport manipulation, custom preset control, dependent parameter validation, and responsive mobile-ready interfaces.

## Technology Stack

- **Core Framework**: Next.js 16 (App Router) & React 19
- **3D Graphics Engine**: Three.js & React Three Fiber (R3F)
- **Viewport Helpers**: `@react-three/drei` (OrbitControls, Grid, Contact Shadows)
- **State Management**: Zustand 5
- **Styling**: Tailwind CSS 4 (Vanilla Custom CSS variables for theme and tokens)
- **Iconography**: Lucide React

## Key Features

1. **Object Definition Modules**:
   - **Table**: Procedural tabletop shape extrusion (Rectangular, Round, Square), edge styles (Beveled, Rounded, Flat), and splayed or pedestal leg support configurations.
   - **Chair**: Ergonomic seat profile extrusion, custom backrests (Slat, Panel, Spindle), splayed leg alignments, and side armrests.
   - **Cup**: Double-walled lathe geometry revolving around the Y-axis forming a hollow vessel with closed-rim profiles.
   - **Mug**: Hollow lathe vessel integrated with curve-swept tube handles (Rounded, D-shape, Angular) attached directly to the outer surface.

2. **Interactive Scene Viewport**:
   - Orbit controls with damped inertia and auto-framing animations on selection.
   - Shading modes (Solid shaded vs. Wireframe mesh view).
   - Render helpers (Grid layout lines, bounding box helpers, and soft contact ground shadows).

3. **Schema-driven Inspector & Hierarchy Panels**:
   - Nested tree structure displaying object/component selection scopes.
   - Fine-grained parameter sliders, enum selectors, color sheets, and material swatches.
   - Key-by-key undo/reset and parameter randomizers.

4. **Constraint Validation Engine**:
   - Live boundary checking restricting parameter inputs.
   - Reactive dependent clamping (e.g., modifying diameter re-clamps wall thickness to prevent self-intersection).
   - Dynamic warning prompts and status indicators.

5. **Accessibility & Responsive Shell**:
   - Full keyboard accessibility with focus indicator rings.
   - Tablet-responsive slide-in drawers and mobile tab-switcher drawers.
   - GPU resource disposal and selective rendering tree memoization.

## Getting Started

### Prerequisites

Ensure you have Node.js (v18 or higher) and npm installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nikhilkumarjain09/parametric-3d-objects.git
   cd parametric-3d-objects
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development Server

Start the local development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Building for Production

Compile and build the static pages optimized for production:
```bash
npm run build
npm run start
```
