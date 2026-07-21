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

### Tabletop Height & Placement

The tabletop is a `THREE.Shape` extruded along $+Z$ by $T_{\text{tabletop}}$, then rotated $-\pi/2$ on the X-axis so it grows vertically upward in world space.

To sit flush on top of the legs, the bottom face of the tabletop is positioned at:

$$Y_{\text{tabletop}} = H_{\text{table}} - T_{\text{tabletop}}$$

### Leg Height

The height of all legs is derived dynamically from overall table height and tabletop thickness:

$$H_{\text{leg}} = H_{\text{table}} - T_{\text{tabletop}}$$

### Leg Positions (Four-Leg / Six-Leg)

Each corner leg's X/Z center position is computed symmetrically from the table footprint:

$$x_{\text{pos}} = \pm \left( \frac{W_{\text{table}}}{2} - \text{inset} - \frac{W_{\text{leg}}}{2} \right)$$

$$z_{\text{pos}} = \pm \left( \frac{D_{\text{table}}}{2} - \text{inset} - \frac{W_{\text{leg}}}{2} \right)$$

For the **Six-Leg** configuration, the middle two legs are placed at:

$$p_{\text{mid}} = [\pm posX, \, \frac{H_{\text{leg}}}{2}, \, 0]^T$$

### Tapered Legs (Circumscribing Square Cylinder)

A `CylinderGeometry` with 4 radial segments forms a square prism. To align the side faces with the X/Z axes of the table, a rotation of $45^\circ$ ($\frac{\pi}{4}$ radians) is applied. 

The top and bottom radii are derived from `legWidth` and `taperRatio` to circumscribe the square footprint:

$$R_{\text{top}} = \frac{W_{\text{leg}}}{\sqrt{2}}$$

$$R_{\text{bottom}} = \frac{W_{\text{leg}} \times (1 - t_{\text{ratio}})}{\sqrt{2}}$$

### Clearance Constraint

To prevent leg overlapping, the inset is dynamically constrained relative to table size and leg width:

$$\text{inset} \le \min \left( \frac{W_{\text{table}} - 2 W_{\text{leg}} - 40}{2}, \, \frac{D_{\text{table}} - 2 W_{\text{leg}} - 40}{2} \right)$$

This guarantees at least a $40\text{ mm}$ inner span between opposing legs.

---

## 2. Chair

**Source:** `src/objects/chair/index.ts`

### Main Techniques

- Parametric seat-relative component positioning
- Trigonometric leg splay with level-ground compensation
- Pivot-based backrest rotation
- Back-solved overall height

### Trigonometric Leg Splay (Level-Ground Compensation)

Each leg is splayed outward by $\theta_{\text{splay}}$ on both X and Z axes. To keep the seat bottom at the exact target height $H_{\text{bottom}} = H_{\text{seat}} - T_{\text{seat}}$ without letting the splayed legs lift the chair, the leg length $L_{\text{leg}}$ is scaled up:

$$L_{\text{leg}} = \frac{H_{\text{bottom}}}{\cos^2(\theta_{\text{splay}})}$$

The world-space center of each splayed leg is computed by applying rotation matrices, pivoting the tilted leg vector $[0, -\frac{L_{\text{leg}}}{2}, 0]^T$ from the attachment corners:

$$x_{\text{world}} = x_{\text{attach}} - \frac{L_{\text{leg}}}{2} \sin(\theta_z) \cos(\theta_x)$$

$$y_{\text{world}} = H_{\text{bottom}} - \frac{L_{\text{leg}}}{2} \cos(\theta_z) \cos(\theta_x)$$

$$z_{\text{world}} = z_{\text{attach}} + \frac{L_{\text{leg}}}{2} \sin(\theta_x)$$

Where splay angles $\theta_x$ and $\theta_z$ are matched to the corner direction (e.g. front-left leg splay tilts in $-\theta_x$ and $+\theta_z$).

### Backrest Pivot Rotation

The backrest rotates by recline angle $\phi$ around a pivot line located at the rear seat top edge:

$$\vec{P}_{\text{pivot}} = \left[ 0, \, H_{\text{seat}}, \, \frac{D_{\text{seat}}}{2} \right]^T$$

To keep the front face of the backrest flush with the pivot line, the backrest center is shifted by local offset $(y_{\text{local}}, z_{\text{local}}) = (\frac{H_{\text{back}}}{2}, -\frac{T_{\text{back}}}{2})$ rotated by recline angle $\phi$ around the X-axis:

$$y_{\text{world}} = H_{\text{seat}} + \frac{H_{\text{back}}}{2} \cos(\phi) - \left(-\frac{T_{\text{back}}}{2}\right) \sin(\phi)$$

$$z_{\text{world}} = \frac{D_{\text{seat}}}{2} + \frac{H_{\text{back}}}{2} \sin(\phi) + \left(-\frac{T_{\text{back}}}{2}\right) \cos(\phi)$$

### Overall Height

The overall height is back-solved from the seat height and the vertical projection of the reclined backrest:

$$H_{\text{overall}} = H_{\text{seat}} + H_{\text{back}} \cos(\phi)$$

---

## 3. Cup

**Source:** `src/objects/cup/index.ts`

### Main Technique: Surface of Revolution (Lathe Geometry)

A 2D array of profile points $\vec{P}_i = (x_i, y_i)$ is revolved $360^\circ$ around the Y-axis to form the cup body. For any angle $\theta \in [0, 2\pi]$, a profile point $(R, y)$ maps to 3D space:

$$x(\theta, y) = R(y) \cos(\theta)$$

$$z(\theta, y) = R(y) \sin(\theta)$$

### Outer Profile Interpolation

The outer radius $R(y)$ at any height $y \in [0, H]$ is calculated by interpolating between the bottom radius $R_{\text{bot}}$ and top radius $R_{\text{top}}$:

| Shape Mode | Interpolation Equation |
| :--- | :--- |
| **Straight** | $R_{\text{outer}}(y) = R_{\text{bot}} + (R_{\text{top}} - R_{\text{bot}}) \times \left(\frac{y}{H}\right)$ |
| **Tapered** | $R_{\text{outer}}(y) = R_{\text{bot}} + (R_{\text{top}} - R_{\text{bot}}) \times \left(\frac{y}{H}\right)^2$ |
| **Rounded** | $R_{\text{outer}}(y) = R_{\text{bot}} + (R_{\text{top}} - R_{\text{bot}}) \times \left(\frac{y}{H}\right) + 0.015 \sin\left(\frac{y}{H} \pi\right)$ |

### Inner Wall Cavity

The inner profile is shifted inward by the wall thickness parameter $T_{\text{wall}}$ relative to the outer profile:

$$R_{\text{inner}}(y) = R_{\text{outer}}(y) - T_{\text{wall}}$$

Tracing this inner profile from $y = H$ down to the base thickness $y = T_{\text{base}}$ creates a double-walled hollow cavity with a solid base.

---

## 4. Mug

**Source:** `src/objects/mug/index.ts`

### Main Techniques

- Surface of revolution for the hollow body (reusing Cup's Lathe logic)
- Cubic Bézier curve for the handle path
- Tube geometry swept along the handle curve

### Handle Anchor Heights

The vertical heights of the top and bottom handle attachments are centered on the mug wall and shifted by `handlePosition` offset:

$$Y_{\text{center}} = T_{\text{base}} + \frac{H - T_{\text{base}}}{2} + \text{position}_{\text{handle}}$$

$$y_{\text{top}} = Y_{\text{center}} + \frac{H_{\text{handle}}}{2}$$

$$y_{\text{bottom}} = Y_{\text{center}} - \frac{H_{\text{handle}}}{2}$$

The radial anchor points $\vec{a}_{\text{top}}$ and $\vec{a}_{\text{bottom}}$ sit on the outer surface (offset inward by $1.5\text{ mm}$ to ensure a clean connection overlap):

$$\vec{a}_{\text{top}} = \left[ R_{\text{outer}}(y_{\text{top}}) - 0.0015, \quad y_{\text{top}}, \quad 0 \right]^T$$

$$\vec{a}_{\text{bottom}} = \left[ R_{\text{outer}}(y_{\text{bottom}}) - 0.0015, \quad y_{\text{bottom}}, \quad 0 \right]^T$$

### Cubic Bézier Handle Curve

For standard rounded handles, a `CubicBezierCurve3` is constructed with two control points extended outward by the handle bulge distance $d_{\text{bow}}$:

$$d_{\text{bow}} = \max\left( 0.015\text{ m}, \quad H_{\text{handle}} \times 0.6 \right)$$

$$\vec{c}_{\text{top}} = \left[ R_{\text{outer}}(y_{\text{top}}) + d_{\text{bow}}, \quad y_{\text{top}}, \quad 0 \right]^T$$

$$\vec{c}_{\text{bottom}} = \left[ R_{\text{outer}}(y_{\text{bottom}}) + d_{\text{bow}}, \quad y_{\text{bottom}}, \quad 0 \right]^T$$

The curve path $\vec{B}(t)$ for $t \in [0, 1]$ is:

$$\vec{B}(t) = (1-t)^3 \vec{a}_{\text{top}} + 3(1-t)^2 t \, \vec{c}_{\text{top}} + 3(1-t) t^2 \, \vec{c}_{\text{bottom}} + t^3 \vec{a}_{\text{bottom}}$$

A tube of radius $R = T_{\text{handle}} / 2$ is swept along $\vec{B}(t)$ to generate the 3D handle geometry.

---

## 5. Shared Algorithms

### Parametric Function

$$\text{Geometry} = f(\text{parameters})$$

All geometry is regenerated procedurally. Changes do not scale existing meshes; they recalculate vertex coordinates.

### Constraint Clamping

$$v_{\text{clamped}} = \max\left( v_{\text{min}}, \, \min(v_{\text{max}}, \, v) \right)$$

Every parameter input is validated through clamping. Dependent parameters are resolved sequentially (e.g., $T_{\text{wall}}$ clamps to less than half the top/bottom diameter).

### Linear Interpolation (LERP)

Used to transition radii and shapes across profiles:

$$\text{lerp}(a, b, t) = a + (b - a) \times t, \quad t \in [0, 1]$$

### 3D Spatial Transforms

Local coordinates map to world space using standard translation ($T$), rotation ($R$), and scaling ($S$) matrices:

$$\vec{P}_{\text{world}} = M_{\text{object}} \vec{P}_{\text{local}} = T(x,y,z) \cdot R(\theta_x, \theta_y, \theta_z) \cdot S(s_x, s_y, s_z) \vec{P}_{\text{local}}$$

---

## 6. Algorithm Summary

| Object | Primary Algorithms | Mathematical Representation |
| :--- | :--- | :--- |
| **Table** | Symmetric placement, circumscribed taper | $$x = \pm (W/2 - \text{inset} - W_{\text{leg}}/2)$$ |
| **Chair** | Splay correction, pivot rotation | $$L_{\text{leg}} = H_{\text{bottom}} / \cos^2(\theta)$$ |
| **Cup** | Surface of revolution, profile offsetting | $$R_{\text{inner}}(y) = R_{\text{outer}}(y) - T_{\text{wall}}$$ |
| **Mug** | Lathe profile, cubic Bézier sweep | $$B(t) = (1-t)^3 A + 3(1-t)^2 t C_1 + 3(1-t)t^2 C_2 + t^3 B$$ |
