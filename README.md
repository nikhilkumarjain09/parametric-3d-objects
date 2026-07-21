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

## Algorithms & Geometry

Each object type generates geometry entirely from its parameters. Changing a dimension recalculates the affected components — no uniform object scaling is used.

### Table

Parametric dimension calculation with coordinate-based component placement.

- Leg height derived directly from overall height and tabletop thickness:
  $$H_{\text{leg}} = H_{\text{table}} - T_{\text{tabletop}}$$
- Corner leg positions calculated from width, depth, inset, and leg size:
  $$x_{\text{pos}} = \pm \left( \frac{\text{width}}{2} - \text{inset} - \frac{\text{legWidth}}{2} \right)$$
  $$z_{\text{pos}} = \pm \left( \frac{\text{depth}}{2} - \text{inset} - \frac{\text{legWidth}}{2} \right)$$
- Tapered legs use a circumscribed-radius cylinder with top and bottom radii:
  $$R_{\text{top}} = \frac{\text{legWidth}}{\sqrt{2}}, \quad R_{\text{bottom}} = \frac{\text{legWidth} \times (1 - \text{taperRatio})}{\sqrt{2}}$$
- Round and oval tabletops use `THREE.Shape.absarc` / `absellipse`; rectangular tops with corner radius use arc-connected line segments.
- Tabletop extruded on `+Z`, then rotated `−π/2` on X so it lies flat on the ground plane.

### Chair

Parametric component positioning with trigonometric splay and pivot-based backrest rotation.

- Leg length adjusted to keep the seat level regardless of splay angle:
  $$L_{\text{leg}} = \frac{H_{\text{bottom}}}{\cos^2(\theta_{\text{splay}})}$$
- Splay rotation is applied per-leg using rotation matrices, computing each leg's world-space center:
  $$x_{\text{world}} = x_{\text{attach}} - \frac{L_{\text{leg}}}{2} \sin(\theta_z) \cos(\theta_x)$$
  $$y_{\text{world}} = H_{\text{bottom}} - \frac{L_{\text{leg}}}{2} \cos(\theta_z) \cos(\theta_x)$$
  $$z_{\text{world}} = z_{\text{attach}} + \frac{L_{\text{leg}}}{2} \sin(\theta_x)$$
- Backrest rotation is around a pivot at the rear seat top edge $P_{\text{pivot}} = [0, H_{\text{seat}}, D_{\text{seat}} / 2]$, not around the world origin. World position is derived from the local offset rotated by $\phi_{\text{recline}}$:
  $$y_{\text{world}} = H_{\text{seat}} + \frac{H_{\text{back}}}{2} \cos(\phi) - \left(-\frac{T_{\text{back}}}{2}\right) \sin(\phi)$$
  $$z_{\text{world}} = \frac{D_{\text{seat}}}{2} + \frac{H_{\text{back}}}{2} \sin(\phi) + \left(-\frac{T_{\text{back}}}{2}\right) \cos(\phi)$$
- Overall height back-solved from seat height and the vertical projection of the backrest:
  $$H_{\text{overall}} = H_{\text{seat}} + H_{\text{back}} \cos(\phi_{\text{recline}})$$
- Waterfall seat uses a `quadraticCurveTo` profile extruded along the width axis.

### Cup

Surface of revolution (lathe geometry) for a hollow vessel.

- A 2D profile of `THREE.Vector2` points traces the outer wall, rim, and inner wall in one closed loop.
- `THREE.LatheGeometry` revolves this profile 360° around the Y-axis using 36 radial segments.
- Outer wall radius at any height $y$ is interpolated between bottom and top radii; body shape selects linear, power-curve, or sine-modulated interpolation.
- Inner wall radius derived by subtracting wall thickness from the outer radius at each sample:
  $$R_{\text{inner}}(y) = R_{\text{outer}}(y) - T_{\text{wall}}$$
- Profile closes at the base $(0, T_{\text{base}})$ and the rim, producing a genuinely hollow vessel with a solid base.

### Mug

Identical hollow-vessel lathe body as the Cup, plus a cubic Bézier curve-swept tube handle.

- Body uses the same `THREE.LatheGeometry` approach as the Cup.
- Handle anchor points are computed from the body radius at the vertical attach positions, so the handle stays flush with the surface when dimensions change.
- Handle bow distance is proportional to handle size to maintain clearance:
  $$\text{bow} = \max(15\text{mm}, H_{\text{size}} \times 0.6)$$
- Default and D-shape handles use a Cubic Bézier curve:
  $$B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3, \quad t \in [0, 1]$$
- Handle cross-section is a circle with radius $R = T_{\text{handle}} / 2$, swept along the path using `THREE.TubeGeometry` (40 path segments, 12 radial segments).
- Handle position can be shifted vertically with `handlePosition`; the center Y is clamped so both anchors remain within the mug height.

### Shared Techniques

- **Constraint clamping** — $$v_{\text{clamped}} = \max(\min(v, v_{\text{max}}), v_{\text{min}})$$ applied to all parameters in `constraints()` before geometry is generated.
- **Linear interpolation** — used for outer-wall profile sampling: $$R(y) = R_{\text{bot}} + (R_{\text{top}} - R_{\text{bot}}) \times t$$.
- **3D transformations** — each mesh specifies position and rotation in local space; the viewport applies component-level overrides on top.
- **Bounding box** — `THREE.Box3` used for camera framing on component selection.
- **Raycasting** — `THREE.Raycaster` used for clicking 3D components in the viewport.

> See [`ALGORITHMS.md`](./ALGORITHMS.md) for a concise reference of the geometry and mathematical techniques used by each object generator.

---

## Vercel CI/CD Deployment

The repository includes a GitHub Actions workflow under `.github/workflows/vercel.yml` to automatically trigger deployments to Vercel on pushes and pull requests.

### Configuration

To enable the pipeline, configure the following secrets inside your GitHub repository settings under **Settings > Secrets and variables > Actions**:

1. **`VERCEL_TOKEN`** — Your personal Vercel access token. Create one in your [Vercel account tokens page](https://vercel.com/account/tokens).
2. **`VERCEL_ORG_ID`** — Your Vercel Team or User ID. Can be retrieved by running `vercel login` and checking your organization profile.
3. **`VERCEL_PROJECT_ID`** — The ID of the Vercel project linked to this repository. Can be found in the project's dashboard settings.

