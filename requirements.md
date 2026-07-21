# Parametric 3D Object Generation Platform — `requirements.md`

**Document status:** Source of truth for implementation
**Companion document:** `design-and-settings.md`
**Stack target:** Next.js, React, TypeScript, Three.js, React Three Fiber, @react-three/drei

---

## 0. How to Read This Document

This document translates the original product brief into implementation-ready requirements. Where the original brief was ambiguous or silent, an explicit **Assumption** is stated and numbered (`ASM-###`). Assumptions are not optional flavor text — they are binding unless a stakeholder overrides them. Requirements are tagged with stable IDs (`REQ-<AREA>-<NUM>`) so they can be referenced in code comments, PRs, and test names.

---

## 1. Project Overview

The Parametric 3D Object Generation Platform ("the Platform") is a single-page, professional-grade web application in which a user selects an object archetype (Table, Chair, Cup, Mug at launch), and the application procedurally generates a mathematically accurate 3D model of that object. The user then adjusts parameters (dimensions, structure, component counts, materials, appearance) through an inspector-style control panel, and the 3D model regenerates in real time to reflect those changes.

The application is not a generic 3D editor and not a modeling suite for arbitrary meshes. It is a **constrained, rules-based object generator**: every object type owns a formal parameter schema, a set of derivation rules, and a set of validity constraints. The user cannot produce invalid or freeform geometry — they can only move within the valid parameter space that the object definition allows.

The product is explicitly modeled as one continuous workspace, not a multi-page or multi-tab navigation experience. The object selector is a generation input, not a router.

## 2. Product Goals

- **REQ-GOAL-001**: Provide a single unified workspace where switching the selected object type immediately regenerates the scene, controls, and hierarchy without page navigation or route changes.
- **REQ-GOAL-002**: Provide mathematically correct, genuinely parametric geometry generation for Table, Chair, Cup, and Mug, where changing one parameter recalculates only the dependent geometry rather than uniformly scaling the whole mesh.
- **REQ-GOAL-003**: Present a professional, dark-mode, information-dense workspace comparable in tone to CAD configurators and game-engine editors (Unreal-style inspector/hierarchy/viewport layout used only as a quality bar, not as a literal design to copy).
- **REQ-GOAL-004**: Ensure the object definition system is extensible — adding a fifth object type (e.g., Stool, Bottle) should require adding a new object module, not modifying core application logic.
- **REQ-GOAL-005**: Keep parameter editing, geometry regeneration, and viewport rendering perceptibly instantaneous (see Section 24, Performance).
- **REQ-GOAL-006**: Prevent the user from ever reaching an invalid or visually broken geometric state through validation, clamping, and constraint-aware controls.

## 3. Non-Goals

- **NG-001**: No user accounts, authentication, or multi-user collaboration.
- **NG-002**: No persistent backend/database. State lives in-browser for the session (see `ASM-010` on optional local persistence).
- **NG-003**: No AI/LLM-based generation of geometry or parameters. All generation is deterministic, rule-based, procedural code.
- **NG-004**: No arbitrary freeform mesh editing (no sculpting, no vertex-level manipulation by the user).
- **NG-005**: No marketplace, sharing platform, or export monetization features.
- **NG-006**: No mobile-first redesign; mobile/tablet support is "reasonable degradation," not a primary target (Section 23).
- **NG-007**: No physics simulation, animation timeline, or rigging.

## 4. Target Users

- **Primary**: Product designers, furniture/houseware designers, and technical evaluators who want to rapidly explore parametric variations of common object categories.
- **Secondary**: Engineers/developers evaluating the platform as a technical demonstration of procedural 3D generation architecture.
- **Tertiary**: Internal stakeholders demoing the "select → generate → customize" concept to prospective customers.

**ASM-001**: Users are assumed to be using a desktop or large laptop with a mouse and a discrete GPU or capable integrated GPU (WebGL2-capable browser). Touch-only, low-power devices are explicitly out of the primary target (see Section 23).

## 5. Core User Journey

1. User opens the application. A default object (Table) is generated and shown immediately — the workspace is never empty (`REQ-STATE-001`).
2. User opens the **Select Object** dropdown in the top toolbar and chooses an object type.
3. The workspace updates in place:
   - The 3D viewport replaces the current object with a newly generated default (or last-used) configuration for the chosen type.
   - The Inspector panel swaps to the parameter set relevant to that object type.
   - The Scene Hierarchy panel repopulates with that object's component tree.
4. User adjusts parameters via sliders, numeric fields, dropdowns, and toggles in the Inspector.
5. Each change triggers: parameter validation → dependent-value recalculation → geometry regeneration → viewport update, all without disturbing camera position or unrelated UI state.
6. User optionally selects a component in the Scene Hierarchy (e.g., "Front Left Leg") to inspect/edit that component specifically; the corresponding mesh highlights in the viewport.
7. User optionally applies a Preset, uses Reset (return to default/preset baseline), or uses Randomize (generate a valid random variation).
8. User inspects final object visually in the viewport, using orbit/pan/zoom, wireframe toggle, and dimension readouts as needed.

## 6. Functional Requirements — Application Shell

- **REQ-APP-001**: The application is a single workspace/page. There must be no distinct routes, tabs, or navigable pages per object type.
- **REQ-APP-002**: The application must load with a valid, fully generated object visible within the initial render (no blank/empty first paint beyond a brief loading state, see Section 28).
- **REQ-APP-003**: Application layout consists of: Top Toolbar, Left Panel (Scene Hierarchy), Center (3D Viewport), Right Panel (Inspector), Bottom Status Bar (Section 15–19 define contents).
- **REQ-APP-004**: All panel regions must be independently scrollable where their content can exceed available height; the 3D viewport must never scroll internally (it resizes instead).

## 7. Object Selection Requirements

- **REQ-SEL-001**: A single "Select Object" dropdown control must be present in the Top Toolbar, always visible regardless of scroll position within side panels.
- **REQ-SEL-002**: The dropdown must list all currently implemented object types (Table, Chair, Cup, Mug at launch) plus a visually distinct, disabled/greyed "More objects coming soon" affordance representing future extensibility (Stool, Desk, Sofa, Cabinet, Bottle, Bowl, Plate, Bed, Shelf, Lamp, Door, Window, Custom Object). This affordance must not be selectable.
- **REQ-SEL-003**: Selecting a new object type must trigger, in order: (1) unload current object generator state, (2) load the target object's definition module, (3) instantiate default parameters (or last-session parameters for that type if `ASM-010` local persistence is enabled), (4) generate geometry, (5) populate Inspector and Hierarchy, (6) reset viewport component selection to "whole object," (7) preserve camera orbit/zoom/pan position (do not reframe automatically) unless the user has never interacted with the camera for that session, in which case auto-frame once.
- **REQ-SEL-004**: The object selector must never be rendered as a tab bar, top-level nav, or route-based menu. This is a hard product constraint from the source brief and must not be violated by any implementation shortcut (e.g., using Next.js dynamic routes per object).
- **REQ-SEL-005**: Object switching must complete its full pipeline (Section above) in under 150ms perceived latency on reference hardware (Section 24 defines reference hardware assumption).

## 8. Table Requirements

### 8.1 Parameter Schema

| Group | Parameter | Type | Notes |
|---|---|---|---|
| Overall | Width | number (mm) | Drives tabletop width and leg X-span |
| Overall | Depth | number (mm) | Drives tabletop depth and leg Z-span |
| Overall | Height | number (mm) | Total floor-to-tabletop-top height |
| Tabletop | Thickness | number (mm) | |
| Tabletop | Shape | enum (Rectangular, Square, Round, Oval) | |
| Tabletop | Corner Radius | number (mm) | Only enabled for Rectangular/Square |
| Tabletop | Edge Style | enum (Square, Beveled, Rounded) | |
| Legs | Configuration | enum (Four-Leg, Six-Leg, Pedestal, Central Support) | |
| Legs | Leg Width | number (mm) | X/Z cross-section width (square legs) or diameter (round legs) |
| Legs | Leg Shape | enum (Square, Round, Tapered) | |
| Legs | Inset | number (mm) | Distance from tabletop edge to leg center |
| Legs | Taper Ratio | number (0–1) | Only enabled when Leg Shape = Tapered |
| Appearance | Color | color picker | |
| Appearance | Material | enum (Wood, Metal, Plastic, Glass) | |
| Appearance | Finish | enum (Matte, Satin, Glossy) | |

**ASM-002**: "Six-Leg" configuration is only structurally meaningful when Width exceeds a defined threshold (default 1400mm); below threshold, Six-Leg is disabled in the UI with a tooltip explanation rather than silently ignored.

**ASM-003**: "Pedestal" and "Central Support" configurations use a single or small cluster of central column(s) plus a base plate/cross rather than 4/6 discrete corner legs; corner-leg-specific parameters (Inset, per-leg count) are hidden when these configurations are active (see `REQ-INSP-004` conditional field visibility).

### 8.2 Derivation & Dependency Rules

- **REQ-TABLE-001**: Tabletop mesh dimensions are derived directly from Width, Depth, Thickness, Shape, Corner Radius, and Edge Style. Tabletop position is always centered at world-space (0, Height, 0) at its top surface.
- **REQ-TABLE-002**: Leg height is derived as `Height − Tabletop Thickness`, never set directly by the user. This preserves the invariant that tabletop-top-surface height always equals the Height parameter.
- **REQ-TABLE-003**: Leg X/Z positions are derived from Width, Depth, and Inset: for Four-Leg, leg centers sit at `(±(Width/2 − Inset − legHalfWidth), ±(Depth/2 − Inset − legHalfWidth))`.
- **REQ-TABLE-004**: Changing Width or Depth must reposition legs (per REQ-TABLE-003) without changing leg thickness, taper, or height. Legs must never be non-uniformly scaled to "stretch" with the tabletop — they are repositioned, not deformed (this directly encodes the brief's "do not scale the whole object" instruction).
- **REQ-TABLE-005**: Changing Tabletop Thickness must adjust leg height via REQ-TABLE-002 so the overall Height invariant holds, and must not move the tabletop's top surface.
- **REQ-TABLE-006**: For Tapered legs, the taper reduces cross-section from top (leg width) to bottom (leg width × (1 − Taper Ratio)), never producing a negative or zero cross-section (clamped, `REQ-VALID-003`).

### 8.3 Component Hierarchy

```
Table
├── Tabletop
└── Legs
    ├── Front Left Leg
    ├── Front Right Leg
    ├── Rear Left Leg
    └── Rear Right Leg
```
(Six-Leg adds Mid Left / Mid Right; Pedestal/Central Support replace the Legs group with a single "Support Column" node, optionally "Base Plate.")

### 8.4 Constraints

- **REQ-TABLE-C01**: Leg Inset must be clamped so legs never fall outside tabletop bounds and never overlap each other or the tabletop center beyond a minimum spacing (`ASM-004`: minimum 40mm clearance between adjacent leg edges).
- **REQ-TABLE-C02**: Tabletop Thickness must remain within `[8mm, 25% of Height]`.
- **REQ-TABLE-C03**: Corner Radius must not exceed `min(Width, Depth) / 2`.

## 9. Chair Requirements

### 9.1 Parameter Schema

| Group | Parameter | Type | Notes |
|---|---|---|---|
| Overall | Width | number (mm) | |
| Overall | Height | number (mm) | Total floor-to-top-of-backrest height |
| Overall | Depth | number (mm) | |
| Seat | Width | number (mm) | |
| Seat | Depth | number (mm) | |
| Seat | Thickness | number (mm) | |
| Seat | Height | number (mm) | Floor to top of seat |
| Seat | Shape | enum (Square, Rounded, Waterfall) | |
| Seat | Corner Radius | number (mm) | |
| Backrest | Width | number (mm) | |
| Backrest | Height | number (mm) | Measured from seat top |
| Backrest | Thickness | number (mm) | |
| Backrest | Angle | number (degrees, −5 to 25) | Recline angle from vertical |
| Backrest | Shape | enum (Flat, Curved, Slatted) | |
| Legs | Thickness | number (mm) | |
| Legs | Shape | enum (Square, Round, Tapered) | |
| Legs | Angle | number (degrees, 0–12) | Splay angle outward from vertical |
| Armrests | Enabled | boolean | |
| Armrests | Height | number (mm) | Above seat top |
| Armrests | Length | number (mm) | |
| Armrests | Thickness | number (mm) | |
| Appearance | Color / Material / Finish | as Table | |

### 9.2 Derivation & Dependency Rules

- **REQ-CHAIR-001**: Front-leg height is derived as `Seat Height`; rear-leg height derived as `Seat Height` as well, adjusted for Legs Angle splay so the seat plane remains level regardless of splay (legs pivot from their floor contact point, not from the seat, preserving seat levelness — `ASM-005`).
- **REQ-CHAIR-002**: Backrest is attached at the rear edge of the seat and rotates around a pivot at the seat-rear-top edge, controlled by Backrest Angle. Rotating the backrest must never detach it visually from the seat (`REQ-CHAIR-VIS-001`).
- **REQ-CHAIR-003**: Overall Height is a derived/informational read-out equal to `Seat Height + Backrest Height (projected onto vertical axis given Angle)`, not an independently editable raw value; if the UI exposes an "Overall Height" field, editing it must proportionally back-solve Backrest Height (`ASM-006`).
- **REQ-CHAIR-004**: Armrests, when enabled, attach to the seat sides at Armrest Height above seat top and run front-to-back for Armrest Length, connecting down to a support that meets either the seat side or a front leg extension — this connection rule must be explicit in the geometry strategy (Section 29) to avoid floating armrests.
- **REQ-CHAIR-005**: Changing Seat Width/Depth must reposition all four legs and both armrests (if enabled) relative to the new seat bounds; it must not scale leg thickness or armrest thickness.

### 9.3 Component Hierarchy

```
Chair
├── Seat
├── Backrest
├── Legs
│   ├── Front Left Leg
│   ├── Front Right Leg
│   ├── Rear Left Leg
│   └── Rear Right Leg
└── Armrests (present only if enabled)
    ├── Left Armrest
    └── Right Armrest
```

### 9.4 Constraints

- **REQ-CHAIR-C01**: Backrest Angle clamped to `[−5°, 25°]`; negative angle (forward lean) must be clamped tighter (`ASM-007`: min −5° to avoid visually absurd forward-leaning backrests).
- **REQ-CHAIR-C02**: Armrest Height must remain below Backrest Height's lower engagement point and above Seat Height, i.e. `Seat Height < ArmrestHeightAboveSeat + SeatHeight < (Seat Height + Backrest Height)`.
- **REQ-CHAIR-C03**: Leg Angle (splay) clamped `[0°, 12°]` to avoid structurally absurd or self-intersecting geometry near the seat frame.

## 10. Cup Requirements

### 10.1 Parameter Schema

| Group | Parameter | Type | Notes |
|---|---|---|---|
| Dimensions | Height | number (mm) | |
| Dimensions | Top Diameter | number (mm) | |
| Dimensions | Bottom Diameter | number (mm) | |
| Body | Wall Thickness | number (mm) | |
| Body | Shape | enum (Straight, Tapered, Rounded) | Profile curve family |
| Base | Base Size (diameter) | number (mm) | |
| Base | Base Thickness | number (mm) | |
| Rim | Rim Size (thickness) | number (mm) | |
| Rim | Rim Style | enum (Flat, Rounded, Flared) | |
| Appearance | Color / Material / Finish | as Table | Ceramic/Glass/Metal/Plastic per Section 16 |

### 10.2 Derivation & Dependency Rules — Hollow Vessel Requirement

- **REQ-CUP-001 (critical)**: The Cup must be modeled as a genuinely hollow vessel with distinct outer wall, inner wall, and a solid base — **not** a solid cylinder and **not** a cylinder with a flat cap giving a false sense of hollowness. This is a hard requirement carried over verbatim in intent from the source brief.
- **REQ-CUP-002**: Interior cavity depth is derived as `Height − Base Thickness`, and interior diameter at any height is derived as `outer diameter at that height − 2 × Wall Thickness`.
- **REQ-CUP-003**: The outer profile is generated via a lathe/revolution technique (Section 29) driven by Shape: Straight (linear taper from Bottom Diameter to Top Diameter), Tapered (accentuated linear/exponential taper), Rounded (bulging profile via a spline/bezier control curve).
- **REQ-CUP-004**: Rim geometry terminates the top edge of both outer and inner wall surfaces with a small closing loop so no back-face/inside-out gap is visible when viewed from above at any camera angle.
- **REQ-CUP-005**: Changing Wall Thickness must not change outer diameter; it only changes inner cavity diameter (outer profile is the authority; inner is derived inward).

### 10.3 Component Hierarchy

```
Cup
├── Outer Body
├── Inner Wall (cavity surface)
├── Base
└── Rim
```

### 10.4 Constraints

- **REQ-CUP-C01**: Wall Thickness must be clamped to less than `min(Top Diameter, Bottom Diameter) / 2 − 2mm` safety margin, to guarantee a valid hollow interior always exists.
- **REQ-CUP-C02**: Base Thickness clamped to `[2mm, Height × 0.3]`.
- **REQ-CUP-C03**: Top Diameter and Bottom Diameter individually clamped to sane min/max (`ASM-008`: 30mm–200mm) to prevent degenerate lathe geometry.

## 11. Mug Requirements

### 11.1 Parameter Schema

All Cup dimensions/body/base/rim parameters apply (Section 10.1, using Diameter instead of separate Top/Bottom Diameter — **ASM-009**: Mug body is assumed primarily cylindrical/slightly tapered with a single nominal Diameter parameter plus Body Shape controlling subtle taper, rather than exposing both top and bottom diameters as with Cup, matching the source brief's Mug parameter list exactly), plus:

| Group | Parameter | Type | Notes |
|---|---|---|---|
| Handle | Size (length/span) | number (mm) | Vertical span of handle attachment |
| Handle | Thickness | number (mm) | Cross-section diameter of handle "tube" |
| Handle | Shape | enum (Rounded Loop, Angular, D-Shape) | |
| Handle | Position | number (degrees or vertical offset) | Rotational or vertical placement of handle center relative to body |

### 11.2 Derivation & Dependency Rules

- **REQ-MUG-001**: The Mug body reuses the Cup hollow-vessel generation strategy (REQ-CUP-001 through REQ-CUP-005) in full.
- **REQ-MUG-002**: The Handle is generated via a curve-based sweep (Section 29): a 3D curve (two anchor points on the body surface plus one or two control points bowing outward) is defined, and a circular cross-section of diameter = Handle Thickness is swept (tube/pipe geometry) along that curve.
- **REQ-MUG-003 (critical)**: Handle anchor points must be computed as points lying exactly on the outer body surface at the current body radius for the given height, recalculated whenever Diameter, Body Shape, or Height changes, so the handle never floats away from or clips through the body regardless of body parameter changes.
- **REQ-MUG-004**: Handle Thickness scales independently of body Diameter; the brief explicitly warns against "incorrectly distort[ing] handle thickness" when diameter changes — handle cross-section is only affected by its own Thickness parameter.
- **REQ-MUG-005**: Handle Position (vertical offset / rotational placement) must keep both anchor points within the vertical span of the body wall (never above the rim or below the base).

### 11.3 Component Hierarchy

```
Mug
├── Body
├── Inner Wall
├── Base
├── Rim
└── Handle
```

### 11.4 Constraints

- **REQ-MUG-C01**: Handle Size (span) clamped so both anchors remain within `[Base Thickness + 10mm, Height − Rim Size − 10mm]`.
- **REQ-MUG-C02**: Handle Thickness clamped to `[4mm, 25mm]` and additionally to less than 40% of Handle Size to avoid a stub-like handle.
- **REQ-MUG-C03**: Handle must not intersect the body — enforced by keeping the curve's minimum clearance from the body surface at or above a fixed offset (`ASM-011`: 2mm clearance at the curve's closest approach excluding the anchor points themselves).

## 12. Parametric Behavior Requirements (Cross-Object)

- **REQ-PARAM-001**: No object type may implement a parameter change by uniformly scaling the entire generated mesh/group. Every dimensional change must go through the object's derivation rules (Sections 8–11) recalculating only the affected component(s).
- **REQ-PARAM-002**: Every parameter has a documented dependency direction: it either (a) is a root/independent input, (b) derives one or more dependent values, or (c) is itself derived and read-only in the UI (e.g., Table leg height, Chair overall height read-out). Section 8–11 tables mark which parameters are root vs. derived.
- **REQ-PARAM-003**: Parameter edits are applied through a pure function `deriveGeometryState(objectType, params) -> GeometryState`, ensuring the same parameter set always yields the same geometry (determinism required for Reset/Undo correctness).
- **REQ-PARAM-004**: Parameter changes must not require a full object re-instantiation (no full unmount/remount of the R3F scene graph) — only the affected meshes update, preserving camera and selection state.

## 13. Object Hierarchy Requirements

- **REQ-HIER-001**: The Scene Hierarchy panel must reflect the exact component tree defined per object type (Sections 8.3, 9.3, 10.3, 11.3).
- **REQ-HIER-002**: Hierarchy nodes must be collapsible/expandable (e.g., collapsing "Legs" hides individual leg nodes but the group node remains selectable, selecting the whole group).
- **REQ-HIER-003**: Hierarchy must update immediately when a structural parameter changes the number of nodes (e.g., Table Legs Configuration switching Four-Leg → Six-Leg must add "Mid Left Leg"/"Mid Right Leg" nodes; switching to Pedestal must collapse the Legs group into a single "Support Column" node).
- **REQ-HIER-004**: Selecting a node in the hierarchy must select the same target in the viewport and vice versa (bidirectional binding, `REQ-VIEW-SEL-001`).

## 14. Component-Selection Requirements

- **REQ-COMPSEL-001**: Two selection scopes exist: **Object-level** (whole generated object; default state) and **Component-level** (a specific node, e.g., "Front Left Leg").
- **REQ-COMPSEL-002**: Selecting a component in the viewport (click) or hierarchy (click) sets Component-level selection and updates: (a) visual highlight in viewport (Section 15's selection outline spec), (b) Hierarchy tree highlight, (c) Inspector content to show that component's own editable sub-parameters where applicable (e.g., a single leg's inset override is out of scope for MVP — see `ASM-012`: MVP inspector edits apply at the group/object level even when a single component is selected for inspection; per-instance overrides are a Phase 2 feature, Section 31).
- **REQ-COMPSEL-003**: Clicking empty viewport space (background/grid) clears Component-level selection back to Object-level.
- **REQ-COMPSEL-004**: Switching the selected object type always resets to Object-level selection (`REQ-SEL-003` step 6).

## 15. Inspector Requirements

- **REQ-INSP-001**: The Inspector is divided into collapsible sections matching each object's parameter groups (Dimensions/Overall, Structure/Legs/Backrest/Handle, Component-specific, Appearance/Material).
- **REQ-INSP-002**: Section order per object type:
  - Table: Preset → Dimensions → Tabletop → Legs → Appearance
  - Chair: Preset → Dimensions → Seat → Backrest → Legs → Armrests → Appearance
  - Cup: Preset → Dimensions → Body → Base → Rim → Appearance
  - Mug: Preset → Dimensions → Body → Handle → Base → Rim → Appearance
- **REQ-INSP-003**: Every numeric parameter is presented as a combined slider + numeric field (Section 18) with unit suffix, min/max enforcement, and a reset-to-default affordance (small reset icon adjacent to the field) restoring only that single field to its preset/default value.
- **REQ-INSP-004**: Conditionally-relevant fields (e.g., Corner Radius only for Rectangular/Square tabletop; Taper Ratio only for Tapered legs; Armrest sub-fields only when Armrests Enabled) must hide, not merely disable, when not applicable. Disabling communicates "temporarily unavailable"; hiding communicates "not applicable" — the correct semantics here is hide (`ASM-013`).
- **REQ-INSP-005**: Preset selector sits at the top of the Inspector, is object-type-specific (Table presets never show while Mug is selected, etc.), and applying a preset overwrites all current parameters for that object type only.
- **REQ-INSP-006**: Reset and Randomize actions are globally available at the bottom of the Inspector (not per-section) and act on the entire current object's parameter set.

## 16. 3D Viewport Requirements

- **REQ-VIEWPORT-001**: The viewport is the dominant visual region of the layout (never less than ~55% of workspace width on desktop, Section on Responsive Layout in `design-and-settings.md`).
- **REQ-VIEWPORT-002**: Renderer: WebGL2 via Three.js/React Three Fiber, with a fallback message if WebGL2 is unavailable (`REQ-ERR-004`).
- **REQ-VIEWPORT-003**: Must support: orbit, pan, zoom (via drei `OrbitControls` or equivalent), click-to-select, hover highlight (subtle), frame-selected, reset-view.
- **REQ-VIEWPORT-004**: Must render a ground plane/grid for spatial reference (toggleable) and must not clip objects at default camera distances for any valid parameter combination within defined min/max ranges.
- **REQ-VIEWPORT-005**: Must support Solid and Wireframe display modes, toggleable independently of Grid and Bounding Box toggles.
- **REQ-VIEWPORT-006**: Selection must render a distinct outline/highlight around the selected object or component (Section on 3D Selection in `design-and-settings.md` defines exact visual treatment) without altering the underlying material.
- **REQ-VIEWPORT-007**: Viewport must remain interactive (orbit/pan/zoom responsive) while parameter edits are being made elsewhere in the UI — no blocking recalculation on the main thread beyond the target frame budget (Section 24).

## 17. Camera Requirements

- **REQ-CAM-001**: Perspective camera with a sensible default FOV (`ASM-014`: 45°) and default framing that fits the default object with ~20% margin on all sides.
- **REQ-CAM-002**: "Frame Selected" recenters and zooms to fit the current Component-level or Object-level selection's bounding box.
- **REQ-CAM-003**: "Reset View" restores the default camera position/target/FOV for the currently selected object type (not a hardcoded global position, since object bounding boxes differ, e.g., Table vs Mug scale).
- **REQ-CAM-004**: Camera state (position/target/zoom) persists across parameter edits and across component selection changes; it only resets on explicit user action (Reset View) or first-time object type selection in a session (`REQ-SEL-003`).

## 18. Parameter Controls (Interaction Spec)

- **REQ-CTRL-001**: Numeric fields support: direct keyboard entry, up/down stepper, and click-drag horizontal scrubbing on the numeric label (professional-tool convention) as a **Phase 2** enhancement (`ASM-015`: MVP requires keyboard entry + slider; drag-scrub is nice-to-have, not MVP-blocking).
- **REQ-CTRL-002**: All numeric fields enforce min/max at both the slider and the keyboard-entry level; out-of-range keyboard entry is clamped on blur/enter, not rejected silently — the field must visibly snap to the clamped value.
- **REQ-CTRL-003**: Dropdowns (Shape, Material, Configuration, etc.) are native-feeling custom components (not raw `<select>` styling) consistent with the design system (`design-and-settings.md`).
- **REQ-CTRL-004**: Toggles (e.g., Armrests Enabled) use a switch control, not a checkbox, for consistency with professional tool conventions.
- **REQ-CTRL-005**: Color control uses a swatch + popover color picker with a small curated palette plus custom hex entry.

## 19. Real-Time Update Experience

- **REQ-RT-001**: Slider drag updates geometry continuously during drag (live preview), not only on release.
- **REQ-RT-002**: Numeric keyboard entry updates geometry on blur or Enter key, not on every keystroke (avoids invalid intermediate states while typing, e.g., typing "1" then "12" then "120").
- **REQ-RT-003**: No full-page reloads, no visible flicker, no camera reset, and no loss of current Hierarchy/Component selection during any parameter update.
- **REQ-RT-004**: If a derived recalculation would take longer than one frame budget (Section 24), the update may be deferred to the next animation frame (batched), but must never silently drop the latest user input.

## 20. Constraints and Validation

- **REQ-VALID-001**: Each object module defines a constraint set (Sections 8.4, 9.4, 10.4, 11.4) expressed as pure functions: `clamp(param, allParams) -> validValue`.
- **REQ-VALID-002**: Constraints are enforced proactively (sliders/inputs cannot be dragged/typed past valid bounds relative to current sibling parameter values) rather than reactively rejecting an already-applied invalid state, wherever the constraint is a simple static min/max.
- **REQ-VALID-003**: Constraints that depend on other live parameter values (e.g., Cup Wall Thickness vs. Top/Bottom Diameter) are enforced reactively: changing Diameter downward must re-clamp Wall Thickness immediately, and the Inspector must reflect the new clamped value visibly (not silently diverge from the underlying state).
- **REQ-VALID-004**: A non-blocking inline warning (Section on Warning states in `design-and-settings.md`) is shown adjacent to any field that was auto-clamped as a result of a dependent change, for at least 2 seconds or until dismissed.
- **REQ-VALID-005**: It must be impossible, through any combination of UI actions, to produce self-intersecting legs/armrests, a non-hollow Cup/Mug, or a floating/detached Handle.

## 21. Presets

- **REQ-PRESET-001**: Each object type ships with at least 3 presets at MVP:
  - Table: Standard Table, Dining Table, Coffee Table, Round Table (4 total, exceeds minimum)
  - Chair: Basic Chair, Dining Chair, Stool, Armchair (4 total)
  - Cup: Standard Cup, Tall Cup, Wide Cup (3 total)
  - Mug: Coffee Mug, Large Mug, Small Mug (3 total)
- **REQ-PRESET-002**: Applying a preset sets every parameter for that object type to the preset's stored values; it does not merge partial state.
- **REQ-PRESET-003**: All parameters remain fully editable after a preset is applied (presets are starting points, not locked modes).

## 22. Reset and Randomize

- **REQ-RESET-001**: **Reset** restores the current object to its active preset's baseline if a preset was last applied this session for that object type; otherwise restores to the object type's factory default.
- **REQ-RAND-001**: **Randomize** generates a new valid parameter set by sampling each root parameter within its valid range (respecting Section 20 constraints) and recomputing all derived values — the result must always pass the same validation the manual UI enforces (i.e., Randomize calls the same `clamp`/validation functions, never bypasses them).
- **REQ-RAND-002**: Randomize must not alter the currently selected object type.

## 23. Responsive Behavior

- **REQ-RESP-001**: Primary target breakpoint is desktop/large laptop (≥1280px width); the three-panel + toolbar + status bar layout is the reference layout.
- **REQ-RESP-002**: Below ~1024px, Left and Right panels convert to collapsible drawers/overlays triggered from the Top Toolbar, with the Viewport taking full remaining width.
- **REQ-RESP-003**: Below ~768px, the Scene Hierarchy and Inspector share a single drawer with a tab switch between "Hierarchy" and "Inspector" rather than two simultaneous drawers.
- **REQ-RESP-004**: The application does not need to support phone-portrait as a fully optimized experience; a functional-but-compact fallback is acceptable (`ASM-016`).

## 24. Performance Requirements

- **REQ-PERF-001**: Reference hardware assumption (`ASM-017`): mid-range 2021+ laptop, integrated GPU, WebGL2, 60Hz display. Target frame budget: 16.6ms/frame during idle orbit; up to 33ms/frame acceptable transiently during live slider-drag geometry regeneration.
- **REQ-PERF-002**: Geometry regeneration must dispose of previous `BufferGeometry` and `Material` instances that are being replaced (explicit `.dispose()` calls) to avoid GPU memory leaks across repeated parameter edits and object-type switches.
- **REQ-PERF-003**: React re-renders must be scoped so that a parameter change in the Inspector does not re-render the entire component tree (e.g., Hierarchy panel) unless that panel's data actually changed — enforced via state colocation/selectors (see recommended state library in the technical section).
- **REQ-PERF-004**: Expensive geometry recomputation (e.g., re-lathing a Cup profile) may be memoized keyed by the relevant parameter subset, so unrelated parameter changes (e.g., Material color) never trigger geometry regeneration.
- **REQ-PERF-005**: No unbounded material/texture cache growth — reused presets/materials must be referenced from a shared cache keyed by material configuration, not re-instantiated per object.

## 25. Accessibility and Usability

- **REQ-A11Y-001**: Every icon-only control must have an accompanying tooltip (Section on Tooltips in `design-and-settings.md`) and an `aria-label`.
- **REQ-A11Y-002**: All interactive controls must be reachable and operable via keyboard (Tab order, Enter/Space activation, Arrow-key increment on numeric fields and sliders).
- **REQ-A11Y-003**: Focus states must be visibly distinct (Section on Interaction States) and never removed via `outline: none` without a replacement focus treatment.
- **REQ-A11Y-004**: Numeric fields display units adjacent to the value at all times (not only in a tooltip).
- **REQ-A11Y-005**: Validation/clamping messages use plain language (e.g., "Wall thickness reduced to fit cup diameter") rather than raw parameter IDs or code-level error text.
- **REQ-A11Y-006**: Minimum contrast ratio of 4.5:1 for body text and 3:1 for large text/icons against their background, per the token system in `design-and-settings.md`.

## 26. Extensibility Requirements

- **REQ-EXT-001**: Each object type is implemented as a self-contained "Object Definition Module" exposing: `{ id, label, icon, defaultParams, paramSchema, constraints, deriveGeometry(params), hierarchy(params), presets[] }`.
- **REQ-EXT-002**: The application shell (Toolbar, Hierarchy panel, Inspector panel, Viewport) must consume Object Definition Modules generically — no object-type-specific `if/else` branching is permitted in shell-level components; all per-type behavior lives inside the module.
- **REQ-EXT-003**: Adding a new object type requires: (a) creating a new module satisfying the interface in REQ-EXT-001, (b) registering it in a single object registry array/map, and (c) nothing else. No shell component may require modification.
- **REQ-EXT-004**: The paramSchema format must be declarative enough that the Inspector can render the correct control type (slider/dropdown/toggle/color) purely from schema metadata, without per-object custom Inspector components (with an documented escape hatch for genuinely bespoke controls if a future object needs one, `ASM-018`).

## 27. Error / Empty / Loading States

- **REQ-STATE-001**: On first load, a default Table (factory defaults) must be visible; no blank viewport state should ever be reachable in normal operation.
- **REQ-STATE-002**: If geometry generation throws (a defensive/should-never-happen case), the viewport shows a contained error panel with a "Reset to default" action, not a blank canvas or a crashed React tree (implies an error boundary scoped to the viewport, Section on Dialogs in `design-and-settings.md`).
- **REQ-STATE-003**: While the initial 3D assets (environment map, fonts for on-canvas labels, etc.) load, a brief branded loading state is shown in the viewport region only — the rest of the shell (toolbar, disabled inspector skeleton) may render immediately.
- **REQ-ERR-004**: If WebGL2 is unavailable in the user's browser, show a clear full-viewport message explaining the requirement, with no attempt to silently fall back to WebGL1 with degraded features.

## 28. Acceptance Criteria (Representative Samples)

- **AC-SEL-01**: Given the app is displaying a Table, when the user selects "Mug" from the Select Object dropdown, then within 150ms the viewport shows a default Mug, the Inspector shows Mug sections in the order specified in REQ-INSP-002, and the Hierarchy shows the Mug tree from Section 11.3.
- **AC-TABLE-01**: Given a Table with Width = 1200mm, when the user increases Width to 1600mm, then the tabletop widens, all four legs reposition outward per REQ-TABLE-003, and leg thickness/height remain unchanged.
- **AC-CUP-01**: Given any valid Cup parameter set, when the model is rendered and sectioned/viewed from above, the interior must show a visibly hollow cavity with a distinct base — never a solid disc.
- **AC-MUG-01**: Given a Mug with Diameter = 80mm and Handle Thickness = 10mm, when Diameter is changed to 100mm, then the handle anchor points move outward to stay on the new body surface, but Handle Thickness remains 10mm.
- **AC-VALID-01**: Given a Cup with Top Diameter = 60mm, when the user attempts to set Wall Thickness above the clamp threshold (per REQ-CUP-C01), then the value is clamped and a transient inline warning is shown.
- **AC-RESET-01**: Given a user has applied the "Dining Table" preset and then modified Width manually, when the user clicks Reset, then all parameters return to the Dining Table preset's stored values (not factory defaults).

## 29. MVP Definition

MVP includes, in priority order (matches Section 30 of the source brief):

1. Full professional workspace shell (Toolbar, Hierarchy, Viewport, Inspector, Status Bar).
2. Accurate procedural geometry generation for Table, Chair, Cup, Mug per Sections 8–11.
3. Reliable parameter editing (slider + numeric field + dropdown + toggle + color), with validation/clamping.
4. Strong 3D viewport: orbit/pan/zoom, solid/wireframe, grid toggle, selection outline, frame/reset camera.
5. Object hierarchy with bidirectional selection.
6. Inspector with collapsible sections and conditional field visibility.
7. Presets (minimum counts per Section 21).
8. Reset and Randomize.
9. Basic responsive degradation (Section 23) — not fully mobile-optimized.
10. Object Definition Module architecture (Section 26) proven out across all four launch object types (this is the extensibility proof-of-concept, not merely a "nice to have").

## 30. Phase 2 Features

- Drag-to-scrub numeric fields (REQ-CTRL-001 deferred piece).
- Per-instance component overrides (e.g., one leg thicker than the others) — `ASM-012`.
- Additional object types: Stool, Bottle, Bowl, Plate, Desk, Shelf.
- Export to GLTF/OBJ/STEP.
- Local persistence of last session's parameters per object type (`ASM-010`).
- Undo/redo history stack beyond single-field reset.
- Dimension overlay lines directly in the 3D viewport (measurement annotations), beyond the Status Bar numeric readout.
- Saved custom presets (user-created, not just factory presets).
- Multi-object scenes (placing more than one generated object simultaneously) — explicitly out of scope for MVP per the "single object at a time" framing of the source brief.

## 31. Explicitly Out of Scope

- Authentication, user accounts, backend database (per Non-Goals, Section 3).
- LLM-based or AI-assisted parameter/geometry generation.
- Real-time multiplayer/collaborative editing.
- Arbitrary freeform mesh sculpting/editing.
- Physics or animation.
- E-commerce/marketplace/checkout flows.

## 32. Assumptions Register (Consolidated)

| ID | Assumption |
|---|---|
| ASM-001 | Desktop/laptop, WebGL2-capable browser is the primary target device class. |
| ASM-002 | Six-Leg table config only available above a width threshold (default 1400mm). |
| ASM-003 | Pedestal/Central Support configs hide corner-leg-specific fields. |
| ASM-004 | Minimum 40mm clearance enforced between adjacent table legs. |
| ASM-005 | Chair legs pivot from floor contact point when splayed, preserving seat levelness. |
| ASM-006 | Chair "Overall Height" is a derived read-out; editing it back-solves Backrest Height. |
| ASM-007 | Chair Backrest Angle clamped to [−5°, 25°]. |
| ASM-008 | Cup Top/Bottom Diameter clamped to [30mm, 200mm]. |
| ASM-009 | Mug uses a single nominal Diameter (not separate top/bottom) per source brief's parameter list. |
| ASM-010 | No backend persistence at MVP; local persistence of last params is a Phase 2 candidate. |
| ASM-011 | Mug handle enforces min 2mm clearance from body surface outside anchor points. |
| ASM-012 | Per-instance component overrides (e.g., one leg different from others) are Phase 2, not MVP. |
| ASM-013 | Conditionally-irrelevant Inspector fields are hidden, not disabled. |
| ASM-014 | Default camera FOV is 45°. |
| ASM-015 | Drag-scrub numeric input is Phase 2; MVP requires slider + keyboard entry only. |
| ASM-016 | Phone-portrait is "functional fallback," not a fully optimized target. |
| ASM-017 | Reference hardware is a mid-range 2021+ laptop, integrated GPU, 60Hz display. |
| ASM-018 | Bespoke per-object Inspector controls are allowed as a documented escape hatch if schema-driven rendering cannot express a control, but must remain the exception. |

## 33. Definition of Done Checklist

- [ ] All four launch object types (Table, Chair, Cup, Mug) generate geometry strictly through their Object Definition Module's `deriveGeometry(params)` function — no shell-level conditional geometry code.
- [ ] Switching object types never triggers a full page/route navigation; URL does not change per object type (unless a non-navigational query param is used purely for shareable state, which is optional and non-blocking).
- [ ] Every parameter in Sections 8.1/9.1/10.1/11.1 is represented in the Inspector with the correct control type and correct min/max/unit.
- [ ] No parameter change ever results in a uniform whole-object scale operation (REQ-PARAM-001 verified by code review, not just visual spot check).
- [ ] Cup and Mug are verified to be genuinely hollow (visual cross-section or camera-inside-cavity check) — REQ-CUP-001.
- [ ] Mug handle recalculates anchor points correctly across the full valid Diameter range with no clipping or floating at any tested value — REQ-MUG-003.
- [ ] All constraints in Sections 8.4/9.4/10.4/11.4 are enforced both proactively (control-level clamping) and reactively (dependent-value re-clamping) — REQ-VALID-002/003.
- [ ] Reset and Randomize both route through the same validation/derivation pipeline as manual editing — REQ-RAND-001.
- [ ] All four object types have the minimum required preset count (Section 21) and each preset is fully re-editable after being applied.
- [ ] Scene Hierarchy and Viewport selection remain bidirectionally synced for every object type and every structural configuration (e.g., Six-Leg Table, Armrests-enabled Chair).
- [ ] Camera state persists across parameter edits and object switches (except first-load auto-frame) — REQ-CAM-004.
- [ ] Geometry/material disposal is verified via a memory profile showing no unbounded growth after 50+ consecutive parameter edits and 10+ object-type switches.
- [ ] Adding a hypothetical fifth object type (internal spike/prototype, not necessarily shipped) requires touching only a new module file plus one registry entry — proves REQ-EXT-003.
- [ ] Keyboard-only navigation can reach and operate every control in the Inspector and Toolbar.
- [ ] WebGL2-unavailable fallback message verified in a WebGL1-only or WebGL-disabled browser context.
- [ ] No console errors/warnings during a full manual pass through all four object types, all presets, Reset, and Randomize.
- [ ] Responsive breakpoints (Section 23) verified at ≥1280px, ~1024px, and ~768px.
