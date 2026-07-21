# Parametric 3D Object Generation Platform — `design-and-settings.md`

**Document status:** Source of truth for visual/interaction design
**Companion document:** `requirements.md`
**Reference quality bar:** Unreal Engine editors, CAD configurators, modern procedural 3D tools — for professionalism, density, and control quality only. No proprietary UI, iconography, or branding is copied.

---

## 1. Design Philosophy

This is a precision instrument, not a marketing surface. Every visual decision should answer: *does this help the user understand or control the generated geometry faster?* If a visual flourish doesn't answer yes, it's cut.

Guiding principles:
- **Density over whitespace.** Professional tools pack meaningful controls tightly, using alignment and consistent rhythm instead of empty space to communicate order.
- **Hierarchy through contrast, not decoration.** Panel/surface elevation is communicated with subtle background-luminance steps and 1px borders, never drop shadows or gradients.
- **Stability.** Nothing shifts layout unexpectedly. Panels don't resize themselves; the viewport doesn't rewarp; selection doesn't visually "jump."
- **One idea per control.** Sliders control one parameter. Sections group one component. Nothing is overloaded.

## 2. Application Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ TOP TOOLBAR (56px)                                                        │
├───────────────┬────────────────────────────────────────┬─────────────────┤
│               │                                          │                 │
│ LEFT PANEL    │              3D VIEWPORT                 │  RIGHT PANEL    │
│ Scene         │           (dominant region)               │  Inspector      │
│ Hierarchy     │                                          │                 │
│ (280px)       │                                          │  (340px)        │
│               │                                          │                 │
├───────────────┴────────────────────────────────────────┴─────────────────┤
│ BOTTOM STATUS BAR (36px)                                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

- Left and Right panel widths are fixed defaults but user-resizable via a thin drag handle (min 240px / max 440px), persisted in-session only.
- The Viewport always receives remaining space; it is never fixed-width.
- Panels never overlay the Viewport on desktop; on narrow breakpoints they become drawers (Section 16).

## 3. Top Toolbar

**Contents, left to right:**
1. Application mark (small wordmark/logotype, no illustrative logo graphic required — plain type is acceptable and preferred over a generic 3D-cube stock icon).
2. Divider.
3. **Select Object** dropdown — the single most prominent interactive element in the toolbar, given a distinct pill/segmented visual treatment so it reads as "the input that drives everything," not just another menu.
4. Divider.
5. Viewport tool cluster: Select (pointer), Frame Selection, Reset View, Grid toggle, Wireframe/Solid toggle, Bounding Box toggle.
6. Spacer (flex-grow).
7. Global actions: Reset Object, Randomize Object (icon + label buttons, not icon-only, since these are high-consequence actions).

**Behavior:**
- The toolbar never scrolls away; it is always visible (`REQ-SEL-001`).
- The Select Object control shows the current object's icon + label at rest, and expands into the full list (Table, Chair, Cup, Mug, then a visually separated, greyed "More objects — coming soon" row) on click.
- The greyed future-objects row uses `text-tertiary` color, no hover state, and `cursor: not-allowed`, with a tooltip: "Additional object types will be added in a future release."

## 4. Object Selector — Detailed Behavior

- Trigger control: rectangular button, current object icon (left) + label (center) + chevron-down (right).
- Open state: floating panel anchored below trigger, listing each object as a row with icon + label + short one-line description (matching source brief's descriptions, e.g., "Used to create and customize different types of tables.").
- Selected object row has a persistent selected-state treatment (accent-colored left border + subtle background tint) even while the menu is closed-then-reopened, so the user always sees what's active.
- Keyboard: Arrow Up/Down moves the highlighted row, Enter selects, Escape closes without change.
- This control must never be implemented as a `<nav>` element or rendered as tabs; it is a `<button>` + listbox pattern (`role="combobox"`/`role="listbox"`), reinforcing the "input, not navigation" semantic from the source brief.

## 5. Scene Hierarchy (Left Panel)

- Header row: "SCENE HIERARCHY" label (uppercase, small, letter-spaced, `text-tertiary`), no icon needed.
- Tree rows: 28px height, indentation 16px per level, disclosure triangle (chevron) for expandable groups, component icon, label.
- Selected row: accent-tinted background (full row width), accent-colored left border (2px), text color shifts to `text-primary` (brighter) even if not currently hovered.
- Hover row (non-selected): subtle background lift (`surface-2` from resting `surface-1`), no border.
- Group nodes (e.g., "Legs") are themselves selectable (selects the whole group in the viewport) in addition to being expandable — expand/collapse (chevron click) and select (row click) are separate hit targets so clicking the row body always selects, and only the small chevron toggles expansion.
- Empty/degenerate states (e.g., a Pedestal table with no discrete "Legs" group) simply omit that node — never show a greyed placeholder node.

## 6. 3D Viewport

### 6.1 Background & Environment
- Background: a smooth, restrained dark radial or flat neutral (Section 9 tokens, `bg-viewport`), distinctly darker/cooler than UI panel backgrounds so the object reads as clearly "in a different space" from the chrome.
- Ground: a subtle circular or square ground plane at true floor level (y=0), matte, low-contrast, receiving soft contact shadow from the object — not a stark checkerboard or bright white infinite plane.
- Grid: thin, low-opacity lines (major lines every 100mm-equivalent, minor every 10mm-equivalent, using the object's real-world scale), toggleable, off by default is not recommended — default **on** for a precision tool, per `ASM-019` (documented below).

**ASM-019**: Grid defaults to visible-on, since this is a precision/measurement-oriented tool per Section 17 of the source brief; user can toggle off.

### 6.2 Lighting
- Three-point-inspired setup: a soft key light (upper-front-side), a dim fill (opposite side, lower intensity), and an environment/ambient contribution (drei `Environment` with a neutral studio HDRI or procedurally generated soft-gradient environment) for believable reflections on Metal/Glass materials.
- Shadows: soft, contact-only (not hard-edged), cast from the object onto the ground plane. Shadow map resolution should be tuned for crispness under the object without visible banding.
- Tone mapping: ACES Filmic (or equivalent balanced filmic tone map) to avoid blown highlights on Glossy/Metal finishes.

### 6.3 Selection Visualization
- **Object-level selection**: a thin accent-colored outline (post-process outline or edge-highlight shader) around the silhouette of the entire generated object group.
- **Component-level selection**: the same outline treatment scoped only to the selected component's mesh(es), plus a very subtle emissive/tint overlay on that component so it's identifiable even from angles where the outline is thin.
- **Hover** (pre-selection): a much fainter version of the outline (roughly 40% opacity of the selection outline color) to indicate "this is clickable" without competing with actual selection.
- Selection outline color must be the single accent color used everywhere else in the UI for "active/selected" (Section 9), for a consistent selection language between 2D panels and the 3D scene.

### 6.4 Display Modes
- **Solid** (default): full-shaded materials as configured.
- **Wireframe**: replaces material with a flat, low-opacity line rendering over a faint solid-shaded underlay (pure wireframe-on-black is avoided — retaining a faint solid pass keeps depth legible).
- **Bounding Box**: draws a thin box outline around the object or selected component's AABB, togglable independent of Solid/Wireframe.

### 6.5 Camera Controls
- Left-drag: orbit. Right-drag (or two-finger drag on trackpad): pan. Scroll/pinch: zoom.
- Damped/eased orbit inertia (short, subtle) for a polished feel — not floaty, not instant-stop.
- On "Frame Selected," animate the camera transition over ~300–400ms rather than snapping instantly.

## 7. Inspector (Right Panel)

### 7.1 Structure
- Header row: "INSPECTOR" label, matching Hierarchy panel's header treatment for consistency.
- Immediately below: **Preset** selector (dropdown), full width.
- Below that: a vertical stack of **collapsible sections**, one per parameter group (order defined in `requirements.md` REQ-INSP-002).
- Each section header: uppercase label, chevron (expand/collapse), all sections default to **expanded** on first load of an object type; user's collapse/expand state persists only for the current session per object type.
- Bottom of Inspector (sticky, always visible even if the section list scrolls): **Reset** and **Randomize** buttons, side by side, secondary/tertiary button styling (not a big red/blue CTA — this is a routine, low-risk action toolset in the context of a generation tool, not a destructive one).

### 7.2 Control Density
- Each control row: label (left, ~40% width) + control (right, ~60% width) for sliders/dropdowns/toggles.
- Vertical rhythm: 8px internal padding per row, 1px hairline divider only between sections (not between every single row — rows within a section are separated by whitespace only, keeping the section visually as one grouped unit).

## 8. Status Bar (Bottom)

**Contents, left to right:**
1. Object name + current preset name (e.g., "Table — Dining Table").
2. Component count (e.g., "5 components").
3. Selected item readout (e.g., "Selected: Front Left Leg" or "Selected: Table (whole object)").
4. Bounding dimensions of current selection (W × D × H in the active unit, Section 12).
5. Right-aligned: validation status indicator (a small dot: neutral/green = valid, amber = "auto-adjusted" with tooltip explaining what was clamped).

This bar has a clear, singular purpose: give a persistent, glanceable answer to "what am I looking at and is it valid," without requiring the user to open the Inspector.

## 9. Design Tokens

Tokens are defined as a layered scale, not arbitrary hex values, so the system stays coherent as it's implemented (e.g., as CSS variables or a Tailwind theme extension).

### 9.1 Background / Surface Hierarchy (dark-mode-first)
| Token | Purpose | Relative Luminance Direction |
|---|---|---|
| `bg-app` | Outermost app background (behind all panels) | Darkest |
| `surface-0` | Toolbar / Status Bar base | Darkest + 1 step |
| `surface-1` | Panel resting background (Hierarchy, Inspector) | +1 step from `bg-app` |
| `surface-2` | Hover / raised row / input background | +1 step from `surface-1` |
| `surface-3` | Active / pressed / popover surface | +1 step from `surface-2` |
| `bg-viewport` | 3D viewport background | Distinct cool-neutral, separate scale from UI surfaces |

Each step should be a modest luminance increase (roughly 3–5% perceptual steps) — professional tools avoid harsh jumps between adjacent surfaces.

### 9.2 Borders
| Token | Purpose |
|---|---|
| `border-subtle` | Default panel/section dividers (near-invisible, just enough to separate) |
| `border-default` | Input borders at rest |
| `border-strong` | Input borders on focus/hover, or emphasized dividers (e.g., Toolbar bottom edge) |
| `border-accent` | Selected state borders (Hierarchy row, active tab) |

All borders are 1px; no double borders, no heavy 2px borders except the intentional accent-selection left-border treatment (Section 5).

### 9.3 Text Hierarchy
| Token | Purpose |
|---|---|
| `text-primary` | Primary labels, values, headings |
| `text-secondary` | Section labels, helper text, units |
| `text-tertiary` | Disabled text, placeholder text, panel header labels |
| `text-accent` | Links/active-state text, selected hierarchy row label |
| `text-on-accent` | Text sitting on top of accent-colored backgrounds (e.g., primary button label) |

### 9.4 Accent & Semantic Colors
- **Accent** (single, consistent hue): used for the Select Object trigger emphasis, selection outlines (2D and 3D), focus rings, active toggle state, primary action affordances. Exactly one accent hue across the whole app — no secondary "brand color."
- **Success**: used sparingly — validation-OK status dot, confirmation toasts if any.
- **Warning**: used for auto-clamped/adjusted values (Section 20 of `requirements.md`), status bar amber dot, inline field warnings.
- **Error**: reserved for hard failures (Section 27 error states — WebGL unavailable, geometry-generation exception boundary). Should almost never appear during normal use, since validation is proactive.

**ASM-020**: Exact hex values are intentionally not fixed in this document; implementation should pick a single accent hue (e.g., a restrained blue or teal, avoiding neon saturation) and derive the surface scale from a single dark neutral base (near-black, slightly cool or slightly warm — pick one and stay consistent) so the system stays internally coherent. A designer/engineer may finalize literal values during implementation as long as the token *relationships* above are honored.

### 9.5 Spacing Scale
A single 4px-based scale: `4, 8, 12, 16, 24, 32, 48`. No arbitrary one-off spacing values (e.g., no 13px or 22px paddings). Panel internal padding: 16px. Section internal row spacing: 8px. Between sections: 24px equivalent (achieved via section header top-margin, not extra dividers).

### 9.6 Border Radius Philosophy
- Controls (inputs, dropdowns, buttons): small radius (`radius-sm`, ~4px) — precise, not pill-shaped, except the Select Object trigger which may use a slightly larger radius (`radius-md`, ~6px) to visually distinguish it as the "primary input."
- Panels: minimal or no radius on outer panel edges (they meet other panels edge-to-edge); small radius only on floating elements (popovers, dropdown menus, tooltips, dialogs).
- Avoid large/oversized rounded corners anywhere — this is an explicit anti-pattern per the source brief ("Excessive... oversized rounded cards").

### 9.7 Control Sizing
| Control | Height |
|---|---|
| Toolbar | 56px |
| Status Bar | 36px |
| Standard input / dropdown / button | 32px |
| Compact input (inline inspector numeric field) | 28px |
| Hierarchy tree row | 28px |
| Section header row | 32px |

### 9.8 Typography Hierarchy
- Single sans-serif, technical-leaning typeface (e.g., a neutral grotesque such as Inter, IBM Plex Sans, or system UI font) for all UI text.
- Optional monospace (e.g., JetBrains Mono) reserved specifically for numeric values/units in the Inspector and Status Bar, reinforcing a "precision instrument" feel through tabular alignment of numbers.
- Scale: `11px` (micro labels/units), `12px` (secondary/body-small, most control labels), `13px` (body default), `15px` (section headers), `18px` (rare — panel titles if ever needed). No heading larger than 18px anywhere in the app; this is a workspace, not a marketing page.

## 10. Icon System

- **Library**: Lucide (consistent stroke-based icon set, MIT-licensed, widely used in professional tool UIs) as specified in the source brief's preferred list.
- **Style rules**: 1.5px–2px stroke weight, no filled icons except for small status/selection dots, consistent 16px or 20px sizing per context (Toolbar icons 20px, Inspector/Hierarchy icons 16px).
- **No emoji, no mixed icon sets, no custom illustrative icons** for functional UI chrome.

### 10.1 Icon Mapping

| Action / Concept | Icon (Lucide name reference) |
|---|---|
| Select (pointer tool) | `mouse-pointer-2` |
| Move | `move` |
| Rotate | `rotate-cw` |
| Scale | `maximize` |
| Frame Selection | `scan` or `focus` |
| Reset Camera | `refresh-ccw` |
| Grid toggle | `grid-3x3` |
| Wireframe view | `box-select` or `frame` |
| Solid view | `box` |
| Visibility (show/hide) | `eye` / `eye-off` |
| Lock | `lock` / `lock-open` |
| Expand (tree/section) | `chevron-right` (rotates to `chevron-down` when expanded) |
| Collapse | same control, rotated state |
| Settings | `settings-2` |
| Reset (object/parameter) | `rotate-ccw` |
| Randomize | `shuffle` or `dice-5` |
| Duplicate | `copy` |
| Delete | `trash-2` (not used at MVP since objects aren't deletable, reserved for Phase 2 multi-object scenes) |
| Object Hierarchy panel | `list-tree` |
| Dimensions | `ruler` |
| Material | `swatch-book` |
| Appearance | `palette` |
| Transform | `move-3d` |
| Table (object type) | `table-2` |
| Chair (object type) | `armchair` |
| Cup (object type) | `cup-soda` (or a closer generic cup glyph if available) |
| Mug (object type) | `coffee` |
| Bounding box toggle | `box-select` |

Every icon-only button carries a tooltip with the plain-language label (Section 14), satisfying the "icon + tooltip" accessibility requirement.

## 11. Interaction States

| State | Treatment |
|---|---|
| Default | `surface` token per context, `border-default`, `text-primary`/`text-secondary` per element |
| Hover | Background steps up one surface level (e.g., `surface-1` → `surface-2`); border may shift to `border-strong`; cursor `pointer` for actionable elements |
| Active (pressed) | Background steps to `surface-3`; slight inset visual (e.g., 1px translateY or reduced brightness), not a heavy shadow |
| Selected | `border-accent` + accent-tinted background wash; persists independent of hover |
| Focused (keyboard) | 2px accent-colored focus ring with a small offset, visible on every interactive element, never suppressed |
| Disabled | Reduced opacity (~40%), `text-tertiary`, `cursor: not-allowed`, no hover/active response |
| Error | `border` and small accompanying icon/text in the Error token color; used only for hard-fail states |
| Warning | `border` and small accompanying icon/text in the Warning token color; used for auto-clamped values |
| Success | Small status dot / checkmark in Success token color; used minimally (validation-OK indicator) |

## 12. Inspector Control Patterns

### 12.1 Numeric Field (Slider + Input combo)
- Layout: label row (name + current value + unit, e.g., "Width  1200 mm") above a horizontal slider track. Track fill uses the accent color from left up to the current value's position.
- A small numeric input is embedded at the right end of the label row (or directly editable by clicking the numeric readout itself) for precise keyboard entry.
- Small reset icon (`rotate-ccw`, 12px) appears at the far right on hover, resetting just that field.
- Min/max are respected by the slider track bounds; keyboard entry beyond bounds clamps on blur with a brief warning-colored flash on the field border.

### 12.2 Dropdown (Enum select — Shape, Material, Configuration, etc.)
- Custom-styled trigger (not native `<select>` chrome): label left, current value + chevron right, 32px height, `border-default`.
- Open state: floating list, each option as a 28px row, selected option shown with a checkmark (`check` icon) and accent text color.
- Supports keyboard navigation identical to the Object Selector (Section 4).

### 12.3 Toggle (Boolean — e.g., Armrests Enabled)
- Standard switch control: track + thumb, thumb slides right and track fills with accent color when enabled.
- Label sits to the left of the switch, full row remains clickable (not just the switch hit-target) for usability.

### 12.4 Color Input
- Swatch button (small rounded square, ~24px) showing current color, opens a popover with: a curated palette grid (material-appropriate preset swatches) + a hex input field for custom entry.
- No full HSB color wheel needed at MVP — keep it fast and purposeful (`ASM-021`).

**ASM-021**: A full color-wheel/HSB picker is deferred; curated swatches + hex entry are sufficient for MVP since materials are the primary appearance driver, color is a secondary tint.

### 12.5 Material Selector
- Presented as a small horizontal set of swatch thumbnails (Wood, Metal, Plastic, Glass / Ceramic per object type) with the material name below each thumbnail, selected state = accent border ring around the active thumbnail.
- Each thumbnail is a tiny rendered sphere preview (ideally an actual mini-R3F render or a precomputed static preview image) showing the material's roughness/metalness character, not just a flat color chip — this materially helps the user predict how the material will look on the generated object.

### 12.6 Collapsible Section
- Header: chevron + uppercase label, full-width click target, 32px height, `surface-1` background (matches panel, not elevated) to keep sections feeling like part of one continuous panel rather than separate cards.
- Expand/collapse animates height over ~150ms ease-out; no abrupt snapping.

## 13. 3D Selection (Cross-Reference to Section 6.3)

Restated for design-token clarity:
- Selected: `border-accent`-equivalent outline shader, ~2px screen-space width.
- Hover (unselected): same outline at ~40% opacity, no fill tint.
- Component vs. Object selection use the identical outline treatment; the only difference is scope (single mesh vs. full group), so the visual language stays a single consistent rule the user learns once.

## 14. Tooltips

- Appear after a short hover delay (~400ms) on: every icon-only control, every disabled control (explaining *why* it's disabled/hidden logic if relevant), every auto-clamped field (explaining what was adjusted and why).
- Do not appear on: standard labeled buttons with visible text, or on hover of inert display text (Status Bar readouts don't need tooltips since they're already plain language).
- Visual style: `surface-3` background, `border-subtle`, small `radius-sm`, `text-primary`, max-width ~240px, small arrow/caret pointing to the trigger element.

## 15. Dialogs / Menus

- **Dropdown menus / Object Selector / Inspector dropdowns**: floating panel, `surface-2` background, `border-default`, `radius-md`, subtle drop shadow reserved *only* for floating/overlay elements (panels themselves never use shadow, but floating menus, popovers, and dialogs may use a soft, low-opacity shadow since they visually float above the flat workspace).
- **Confirmation dialogs** (used sparingly — e.g., if a destructive Phase 2 action like "Delete Object" is ever added): centered modal, `surface-2` background, dimmed `bg-app`-colored backdrop at ~60% opacity, primary action uses accent styling, secondary/cancel uses a neutral outline button.
- **Context menus** (if implemented, e.g., right-click on a Hierarchy node): identical visual language to dropdown menus (Section 12.2) for consistency — same row height, same selected/hover treatment.

## 16. Responsive Layout

| Breakpoint | Behavior |
|---|---|
| ≥1280px (primary) | Full 4-region layout: Toolbar, Left Hierarchy panel, Viewport, Right Inspector panel, Status Bar — all simultaneously visible. |
| 1024–1279px | Same layout, panels shrink toward their minimum width (240px) before any collapsing begins. |
| 768–1023px | Left and Right panels convert to slide-in drawers, triggered by two icon buttons added to the Toolbar (Hierarchy icon, Inspector icon); Viewport takes full remaining width; only one drawer open at a time to avoid covering the viewport entirely. |
| <768px | Hierarchy and Inspector share a single drawer with an internal tab switcher ("Hierarchy" / "Inspector"); Status Bar content condenses to the single most important readout (selected item name) with the rest available via a tap-to-expand affordance. |

Drawers overlay the viewport with a dimmed scrim behind them (not a push/reflow of the viewport) so the 3D content's aspect ratio and camera framing don't jitter as drawers open/close.

## 17. Object-Specific Inspector Settings (Consolidated Reference)

This section exists so implementation can build the Inspector schema-driven renderer (per `requirements.md` REQ-EXT-004) directly from a single table per object, without re-deriving groupings from the narrative requirements text.

### 17.1 Table
```
Preset
Dimensions
  Width, Depth, Height
Tabletop
  Shape, Corner Radius (conditional: Rect/Square only), Thickness, Edge Style
Legs
  Configuration, Leg Shape, Leg Width, Inset, Taper Ratio (conditional: Tapered only)
Appearance
  Color, Material, Finish
```

### 17.2 Chair
```
Preset
Dimensions
  Width, Depth, Height (derived read-only)
Seat
  Width, Depth, Thickness, Height, Shape, Corner Radius (conditional)
Backrest
  Width, Height, Thickness, Angle, Shape
Legs
  Thickness, Shape, Angle
Armrests
  Enabled (toggle) → reveals: Height, Length, Thickness
Appearance
  Color, Material, Finish
```

### 17.3 Cup
```
Preset
Dimensions
  Height, Top Diameter, Bottom Diameter
Body
  Wall Thickness, Shape
Base
  Base Size, Base Thickness
Rim
  Rim Size, Rim Style
Appearance
  Color, Material, Finish
```

### 17.4 Mug
```
Preset
Dimensions
  Height, Diameter
Body
  Wall Thickness, Shape
Handle
  Size, Thickness, Shape, Position
Base
  Base Size, Base Thickness
Rim
  Rim Size, Rim Style
Appearance
  Color, Material, Finish
```

## 18. UI/UX Consistency Checklist

Use this checklist to review any implementation pass against this design system.

- [ ] Exactly one accent color is used across all "active/selected/focused" states in both 2D UI and the 3D viewport outline shader.
- [ ] No panel, card, or control uses a drop shadow except floating/overlay elements (menus, popovers, tooltips, modals).
- [ ] No border-radius exceeds `radius-md` anywhere in the app; no "pill" or oversized rounded cards appear.
- [ ] All icon-only buttons have a visible tooltip and an `aria-label`.
- [ ] The Select Object control is visually distinct from a standard dropdown (per Section 4) and is never rendered as tabs or a nav bar.
- [ ] The Scene Hierarchy tree and the 3D Viewport selection are always in sync — selecting one always updates the other, with no lag beyond a single frame.
- [ ] Every numeric Inspector field shows its unit inline, supports keyboard entry, and clamps out-of-range values visibly on blur.
- [ ] Conditionally irrelevant fields are hidden, not merely disabled (per `ASM-013`), across all four object types.
- [ ] Section collapse/expand state and camera position both survive every parameter edit; only explicit object-type switches or "Reset View" alter camera state.
- [ ] Grid, Wireframe, Solid, and Bounding Box toggles are all independently controllable (no toggle silently forces another off, unless explicitly documented, e.g., Wireframe and Solid being mutually exclusive view *modes* rather than independent toggles — confirm this exclusivity is intentional and reflected in the UI, e.g., as a segmented control rather than two independent switches).
- [ ] Typography never exceeds the defined scale (Section 9.8); no ad hoc font sizes appear in the implementation.
- [ ] Spacing values are drawn only from the defined 4px-based scale (Section 9.5); no arbitrary one-off paddings/margins.
- [ ] All four object types' Inspector section orders match Section 17 exactly.
- [ ] Material selector thumbnails visually communicate material character (not flat color chips only).
- [ ] Status Bar always reflects the current selection scope, object/preset name, component count, and bounding dimensions — verified for both Object-level and Component-level selection.
- [ ] Responsive drawer behavior (Section 16) verified at each breakpoint; drawers overlay rather than reflow the viewport.
- [ ] Dark-mode contrast ratios meet the accessibility minimums stated in `requirements.md` Section 25 across text, icons, and control borders.
- [ ] No emoji, mixed icon libraries, or decorative illustrative icons appear anywhere in functional UI chrome.

---

## 19. Amendment — Energetic & Comprehensive UI Direction

**Status:** Visual-direction amendment, applied after initial implementation. This section extends, and where noted overrides, the restrained baseline in Sections 1–18. It does **not** change layout structure, control types, or any functional behavior (`requirements.md` REQ-VISUAL-UPD-001/002) — it changes how rich, alive, and information-dense the existing structure feels.

### 19.1 Intent

The baseline system in Sections 1–18 intentionally erred toward flat and restrained, to avoid "SaaS dashboard" and "cyberpunk" pitfalls named in the source brief. In practice this can read as inert or under-designed. This amendment keeps every structural rule (surface hierarchy, panel layout, control types, one-accent-color rule, no oversized radii) but asks for more visual energy and more visible information within that same structure — think "flagship CAD/creative-tool marketing page" energy applied to a working tool, not "toy app" energy.

### 19.2 What "Energetic" Means Here

- **Accent usage is expanded, not multiplied.** Still exactly one accent hue (per Section 9.4), but it is allowed to appear more often and more confidently: a soft accent-tinted glow/gradient wash behind the Select Object control, an animated accent-colored progress sweep on the slider fill (not just a static fill), a gentle pulse on the validation-OK status dot when it changes state.
- **Motion is a first-class design element, not an afterthought.** Section transitions (Section 12.6), camera framing (Section 6.5), selection outline changes (Section 6.3/13), and preset application should all use deliberate, snappy easing (150–300ms, ease-out) rather than instant state changes. Motion should feel confident and quick, never slow or decorative-for-its-own-sake.
- **Depth through layered gradients, used sparingly and only on large background regions.** The Viewport background (Section 6.1) and the Toolbar may use a very subtle multi-stop dark gradient (e.g., a soft radial vignette or a top-to-bottom luminance gradient) instead of a flat fill, to add depth without violating the "avoid excessive gradients" rule — the rule against gradients in the original brief was aimed at card/button chrome, not large ambient background fields; this amendment scopes it accordingly.
- **Micro-interactions on every primary control:** buttons get a subtle scale/brightness response on press; sliders get a soft accent glow around the thumb while dragging; the Object Selector's trigger gets a brief accent-colored highlight sweep when an object type is switched, so the switch feels like an event, not a silent state mutation.

### 19.3 What "Comprehensive" Means Here

- **Richer Status Bar.** Beyond the MVP contents (Section 8), add: a live parameter-count readout ("14 parameters"), a small inline sparkline or bar showing how far current dimensions sit within their valid range (per parameter group, on hover), and a compact material/finish chip showing the active material's swatch inline, not just as text.
- **Richer material selector (Section 12.5).** Each material thumbnail becomes a small live-rendered preview sphere (already required in baseline) plus a one-line descriptor ("Warm, low-gloss hardwood") beneath it, so the panel reads as a genuine material library rather than a plain dropdown replacement.
- **A compact "Object Summary" card** docked at the top of the Inspector, above the Preset selector: object icon, name, a tiny live-updating thumbnail or bounding-box diagram, and 2–3 key headline dimensions (e.g., "1200 × 750 × 720 mm") in monospace, giving an at-a-glance comprehensive summary before the user scrolls into individual sections.
- **Hierarchy row density with light metadata.** Each Hierarchy row (Section 5) may show a small trailing dimension or count badge where relevant (e.g., "Legs (4)"), so the tree communicates more than just names.
- **Toolbar viewport-tool cluster gains grouped visual framing** (a subtly bordered/segmented group container per cluster — Select/Frame/Reset in one group, Grid/Wireframe/BBox in another) rather than a flat row of icons, making the toolbar read as organized and comprehensive rather than a simple icon strip.

### 19.4 Guardrails (do not regress the baseline)

- Still exactly one accent hue; "energetic" must not become "add more colors."
- Still no oversized rounded corners, no drop shadows on panels themselves (only floating elements, plus the newly permitted large-region background gradients).
- Still no emoji, no decorative illustrative icons — richness comes from real data (thumbnails, live previews, metadata), not ornamentation.
- Motion must never block interaction — all animations are visual polish layered on top of already-responsive controls, never a delay gating the user's next action.
- All new elements (Object Summary card, richer Status Bar, material descriptors) must degrade gracefully at the responsive breakpoints in Section 16 (e.g., the Object Summary card's thumbnail can be dropped first on narrow layouts, before removing the headline dimensions).

### 19.5 Additional Consistency Checklist Items (append to Section 18)

- [ ] The accent hue still appears exactly once as a hue across the app (no second brand color introduced under the guise of "energy").
- [ ] All new motion (slider drag glow, section transitions, object-switch highlight sweep, camera framing) uses the 150–300ms ease-out convention and never delays the user's next input.
- [ ] The Viewport and Toolbar background gradients (if implemented) remain subtle enough that text/icon contrast ratios (Section 25 of `requirements.md`) still pass.
- [ ] The Object Summary card, richer Status Bar, and material descriptors all degrade gracefully rather than breaking layout at 1024px and 768px breakpoints.
- [ ] No card, button, or input anywhere uses a gradient — gradients are confined to large ambient background regions only (Viewport, Toolbar), per Section 19.2.
