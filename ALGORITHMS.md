# Algorithms & Mathematical Techniques

This document provides a concise overview of the primary algorithms and mathematical techniques used to generate and manipulate the platform's parametric 3D objects.

All geometry is produced by the `deriveGeometry` function inside each object's definition module. No object is resized by uniform scaling — every dimension change recomputes the affected geometry from scratch.

---

## 1. Table

**Source:** `src/objects/table/index.ts`

### Main Techniques

- Parametric dimension calculation
- Coordinate-based symmetric leg placement
- Extruded 2D shape for the tabletop
- Circumscribed-radius cylinder for tapered legs

### Tabletop

The tabletop is a `THREE.Shape` extruded along `+Z` by `thickness`, then rotated `−π/2` on X so it lies flat:

| Shape | Method |
|-------|--------|
| Rectangular / Square | `lineTo` + `absarc` for rounded corners |
| Round | `absarc(0, 0, radius, 0, 2π)` |
| Oval | `absellipse(0, 0, w/2, d/2, 0, 2π)` |

Tabletop bottom face positioned at:

```
position.y = tableHeight − tabletopThickness
```

### Leg Height

```
legHeight = tableHeight − tabletopThickness
```

The legs sit beneath the tabletop. Their height is always derived, never set independently.

### Leg Positions (Four-Leg / Six-Leg)

Each corner leg X/Z position is computed symmetrically from the table footprint:

```
posX = width / 2 − inset − legWidth / 2
posZ = depth / 2 − inset − legWidth / 2
```

Leg centers are placed at `±posX, ±posZ`. Changing table width or depth repositions legs — it does not scale them.

### Tapered Legs

A `CylinderGeometry` with 4 radial segments forms a square prism. Top and bottom radii are derived from `legWidth` and `taperRatio`:

```
radiusTop    = legWidth / √2
radiusBottom = legWidth × (1 − taperRatio) / √2
```

The `/ √2` converts the square leg half-diagonal into the cylinder's circumscribed radius so the faces align with the X/Z axes after a 45° Y rotation.

### Constraint Clamping

```
inset ≤ (width − 2 × legWidth − 40) / 2
```

This enforces a minimum 40 mm inner clearance between opposing leg faces.

---

## 2. Chair

**Source:** `src/objects/chair/index.ts`

### Main Techniques

- Parametric seat-relative component positioning
- Trigonometric leg splay with level-ground compensation
- Pivot-based backrest rotation
- Back-solved overall height

### Leg Splay

Each leg is tilted outward by `legAngle` degrees. To keep the seat bottom at the correct height despite the tilt, leg length is extended:

```
legLength = seatBottomHeight / (cos(legAngle) × cos(legAngle))
```

The world-space center of each tilted leg is then derived from the rotation:

```
worldX = attachX + (−legLength/2) × sin(rotZ) × cos(rotX)
worldY = attachY + (−legLength/2) × cos(rotZ) × cos(rotX)
worldZ = attachZ − (−legLength/2) × sin(rotX)
```

The top of each leg stays pinned to its seat corner; only the lower end swings outward.

### Backrest Pivot

The backrest rotates around a pivot at the rear top edge of the seat:

```
pivot = [0, seatHeight, seatDepth / 2]
```

Its world center is computed by rotating the local offset `(bh/2, −bt/2)` by `backrestAngle`:

```
worldY = pivotY + (bh/2) × cos(angle) − (−bt/2) × sin(angle)
worldZ = pivotZ + (bh/2) × sin(angle) + (−bt/2) × cos(angle)
```

This means the front face of the backrest always meets the pivot line regardless of angle.

### Overall Height

Back-solved from seat height and the Y-projection of the backrest:

```
height = seatHeight + backrestHeight × cos(backrestAngle)
```

### Waterfall Seat

A `quadraticCurveTo` 2D profile (in the YZ plane) is extruded along the X axis to produce the ergonomic front drop.

---

## 3. Cup

**Source:** `src/objects/cup/index.ts`

### Main Technique: Surface of Revolution (Lathe Geometry)

A 2D array of `THREE.Vector2(radius, y)` points describes the cup's cross-section profile. `THREE.LatheGeometry` revolves this profile 360° around the Y-axis with 36 radial segments, producing the cup body as a single mesh.

### Profile Construction

The profile is traced in one closed loop:

1. **Base outer edge** — `(rBottom, 0)` through `(0, 0)`
2. **Outer wall** — `steps = 30` sample points from `y = 0` to `y = height`
3. **Rim** — flat, rounded (semicircular arc), or flared depending on `rimStyle`
4. **Inner wall** — 30 sample points traced downward from `y = height` to `y = baseThickness`
5. **Base inner center** — `(0, baseThickness)`, closing the loop

### Outer Radius Interpolation

Outer radius at height `y` uses one of three profiles controlled by the `shape` parameter:

| Shape | Formula |
|-------|---------|
| Straight | `r(y) = rBot + (rTop − rBot) × (y / h)` |
| Tapered | `r(y) = rBot + (rTop − rBot) × (y / h)²` |
| Rounded | `r(y) = rBot + (rTop − rBot) × (y / h) + 0.015 × sin((y / h) × π)` |

### Inner Wall

The inner radius at each sample is derived by subtracting `wallThickness` from the outer radius at the same height:

```
innerRadius(y) = outerRadius(y) − wallThickness
```

This ensures the wall thickness is real geometry, not a visual approximation.

### Hollow Vessel Result

Because the profile includes both the outer wall (ascending) and the inner wall (descending), the single `LatheGeometry` produces a mesh with a genuine cavity and a solid base of `baseThickness`.

---

## 4. Mug

**Source:** `src/objects/mug/index.ts`

### Main Techniques

- Surface of revolution for the hollow body (identical to Cup)
- Cubic Bézier curve for the handle path
- Tube geometry swept along the handle curve

### Mug Body

Reuses the same closed-profile lathe approach as the Cup. The outer profile for the mug body is a cylinder with optional shape variants:

| Shape | Formula |
|-------|---------|
| Straight | `r(y) = rOuter` (constant) |
| Tapered | `r(y) = rOuter + rOuter × 0.15 × (y / h)²` |
| Rounded | `r(y) = rOuter + 0.008 × sin((y / h) × π)` |

### Handle Anchor Positions

Top and bottom handle attachment heights are computed from the handle center and size:

```
wallCenter = baseThickness + (height − baseThickness) / 2
yCenter    = wallCenter + handlePosition
yTop       = yCenter + handleSize / 2
yBot       = yCenter − handleSize / 2
```

The body surface radius at each anchor height is evaluated using `getOuterRadiusAt(y)`, so the handle origin sits exactly on the body surface even when dimensions change.

### Handle Path

The bow distance sets how far the handle extends from the body:

```
bow = max(0.015 m, handleSize × 0.6)
```

| Handle Shape | Curve Type |
|---|---|
| Rounded (default) | `THREE.CubicBezierCurve3(aTop, cTop, cBot, aBot)` |
| D-Shape | `THREE.CubicBezierCurve3(aTop, p2, p3, aBot)` with tighter control points |
| Angular | `THREE.CurvePath` of three `LineCurve3` segments |

### Handle Tube Sweep

`THREE.TubeGeometry` sweeps a circular cross-section along the handle curve:

```
radius = handleThickness / 2
segments = 40 (path), radialSegments = 12 (cross-section)
```

---

## 5. Shared Algorithms

### Parametric Geometry Generation

Geometry is a pure function of parameters. No component is repositioned by scaling an existing mesh:

```
Geometry = f(parameters)
```

All six `deriveGeometry` functions use a flat parameter-comparison memoization cache to avoid redundant recalculation on unchanged inputs.

### Constraint Clamping

Every parameter is clamped before geometry is computed:

```
clamp(value, min, max) = Math.max(min, Math.min(max, value))
```

Dependent constraints are applied in sequence — for example, `wallThickness` is re-clamped after `diameter` changes to prevent self-intersection.

### Linear Interpolation

Used in outer-wall profile sampling and tapered geometry:

```
value = start + (end − start) × t,   t ∈ [0, 1]
```

### 3D Transformations

Each generated mesh carries `position: [x, y, z]` and `rotation: [rx, ry, rz]` in local object space. The viewport renders these directly, and component-mode overrides are added on top of them by the Zustand store.

### Bounding Boxes

`THREE.Box3` is used by the camera controller to frame a selected component after the user presses **F** (frame selection). The box is computed from the live scene group.

### Raycasting

`THREE.Raycaster` (via React Three Fiber pointer events) resolves which mesh the user clicked, maps it to a component ID in the hierarchy, and updates the Zustand selection state.

---

## 6. Algorithm Summary

| Object | Primary Algorithms |
|--------|-------------------|
| Table  | Parametric dimensions, extruded 2D shape, coordinate leg placement, circumscribed-radius taper |
| Chair  | Trigonometric splay, rotation-matrix leg positioning, pivot-based backrest rotation, back-solved height |
| Cup    | Surface of revolution (lathe), closed outer+inner profile, interpolated wall radius |
| Mug    | Surface of revolution (lathe), cubic Bézier handle path, tube sweep |

| Shared System | Technique |
|---|---|
| Validation    | Constraint clamping (`Math.max` / `Math.min`) |
| Memoization   | Shallow parameter-key comparison cache |
| Profiles      | Linear and power-curve interpolation |
| Selection     | Raycasting via R3F pointer events |
| Alignment     | `THREE.Box3` bounding boxes |
| Editing       | Local-space position + rotation per mesh, Zustand override layer |
