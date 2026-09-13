# SKETCH APOCALYPSE — ART DIRECTION BIBLE

> **Visual Target**: A genuinely detailed 3D world whose geometry is professionally modeled, rendered through a graphic novel / Moebius / Franco-Belgian comic aesthetic on top of a warm notebook parchment foundation.

---

## 1. Core Visual Philosophy

### Real 3D Assets First, Stylization Second
```text
REAL 3D ASSET
      ↓
PROFESSIONAL MODELING (Silhouette, Bevels, Architecture, Geological Structure)
      ↓
SEPARATED STYLIZED MATERIALS (Body, Rubber, Metal, Glass, Foliage, Stone, Stucco)
      ↓
NPR / TOON SHADING (Quantized lighting bands + core shadow hatching)
      ↓
DARK INK OUTLINES (Screen-space normal + depth edge detection in deep indigo)
      ↓
NOTEBOOK COMPOSITION (Warm parchment paper texture, subtle grain, faint ruled lines)
```

- **Not Wireframe**: The world is not debug geometry or random scribbles.
- **Not Primitive Boxes**: Trees are never cones + cylinders; buildings have architectural logic; cliffs have geological stratifications; vehicles have authentic proportions and suspension articulation.
- **Graphic Depth**: Depth is communicated through atmospheric perspective, scale, multi-plane vegetation layering, graphic cast shadows, and line weight attenuation.

---

## 2. Color Direction & Palette

The color language matches the warm golden-hour / dusk atmosphere observed in the reference:

| Element | Hex Color | Role |
| :--- | :--- | :--- |
| **Sky Zenith** | `#2d4b7a` | Deep twilight periwinkle blue |
| **Sky Horizon** | `#df9d6b` | Warm amber dusk glow |
| **Clouds Body** | `#e8ddc8` | Stylized warm cream with indigo underbelly |
| **Ink Lines** | `#121626` | Deep indigo/violet-black ink contour |
| **Road Asphalt** | `#b56238` | Warm ochre / terracotta sun-baked asphalt |
| **Road Markings** | `#f0ebd8` | Off-white painted dashed & solid lane lines |
| **Road Shoulder** | `#6e4736` | Crushed gravel & weathered dirt |
| **Terrain Grass** | `#3b5e32` | Muted sage & forest green with warm undertones |
| **Terrain Shadow** | `#1f3822` | Deep evergreen ink shadow |
| **Cliff Rock** | `#8c6239` | Stratified sedimentary ochre rock |
| **Cliff Fracture** | `#4a301a` | Dark umber crevice lines |
| **Tree Foliage (Pine)** | `#2c4f34` | Deep alpine conifer green |
| **Tree Foliage (Broadleaf)** | `#4a7838` | Vibrant meadow green with golden highlights |
| **Tree Blossom (Accent)** | `#a83d71` | Stylized magenta / cherry blossom clusters |
| **Vehicle Body** | `#c0362b` | Crimson rally red with `#d35400` amber stripes |
| **Vehicle Metal** | `#2c3e50` | Matte gunmetal & roll cage steel |
| **Vehicle Tires** | `#1e2229` | Deep charcoal matte rubber |
| **Paper Canvas** | `#fcf9f2` | Warm parchment base tone |

---

## 3. Ink Outline Rules & Hierarchy

The ink system utilizes a custom screen-space normal and depth edge-detection pass:

1. **Major Silhouette (Outer Edges)**:
   - Strongest line weight (2.5px to 3.0px).
   - Separates hero objects, vehicles, cliff crests, and tree canopies from the background sky/terrain.
2. **Important Internal Edges & Creases**:
   - Medium line weight (1.5px to 2.0px).
   - Highlights vehicle panel gaps, window frames, roof eaves, rock stratum ledges, and major tree forks.
3. **Minor Detail & Surface Features**:
   - Subtle line weight (0.8px to 1.0px).
   - Applied selectively to tire treads, door seams, and architectural moldings.
4. **Distance Attenuation**:
   - Line weight scales inversely with depth, fading subtly into atmospheric haze to prevent high-frequency noise in distant vistas.
5. **Ink Palette**:
   - Never pitch pure `#000000` or electric blue. Always deep indigo `#121626` or midnight blue `#151b2e` that interacts harmoniously with the scene lighting.

---

## 4. Shading & Lighting Rules

- **Quantized Toon Bands**:
  - **Band 1 (Highlight / Direct Sun)**: 100% lit color with warm golden tint.
  - **Band 2 (Midtone)**: 65% lit color preserving saturation.
  - **Band 3 (Core Shadow)**: 35% lit color shifted toward cool indigo.
- **Graphic Shadows**: Sharp, high-contrast shadow maps without blurry PCF filtering to maintain the illustrated comic book look.
- **Shadow Hatching**: Deep shadow regions incorporate subtle directional procedural hatching lines that emulate hand-inked cross-hatching.

---

## 5. 3D Asset Guidelines

### A. Hero Survival Vehicle
- **Proportions**: Wide track, long wheelbase, high ground clearance, aggressive stance.
- **Key Details**:
  - Welded tubular roll cage and front bull-bar bumper with tow shackles.
  - Exposed front and rear double-wishbone suspension linkages and coilover dampers.
  - Roof rack carrying a full-size knobby spare wheel and rugged survival crates.
  - Angular hood with dual amber racing stripes, protective wire mesh front grille, and dual rally pod headlights.
  - Chunky all-terrain tires with prominent side-lugs and deep rim offsets.
- **Separated Materials**: Car paint, roll cage metal, tinted glass, tire rubber, rim metal, headlight lenses, cargo canvas.

### B. Pine Tree
- Tapered trunk with bark fracture planes and buttress roots.
- 5 distinct ascending tiers of foliage, each sculpted with irregular jagged clump silhouettes.
- Secondary branch timber visible between foliage layers.

### C. Broadleaf Tree
- Organic winding trunk that splits into 2-3 primary scaffold branches.
- 6-8 sculpted irregular foliage masses forming an asymmetric, voluminous canopy.
- Foliage shaded with two-tone green to accent cluster curvature.

### D. Cliff & Rock Formations
- Layered horizontal strata showing sedimentary compression.
- Stepped rock shelves, fractured angular facets, and planar cleavage faces.
- Talus / scree boulders scattered around the cliff base.

### E. Rural / Mountain Building
- Steep pitched gabled roof with overhanging eaves and ridge cap.
- Stone masonry foundation with stucco upper facade.
- Recessed framed double-hung windows with warm amber interior glow.
- Heavy timber door with iron hinge accents, stone doorstep, and brick chimney stack.

### F. Road & Terrain
- 3D road with subtle crown/camber, textured asphalt, crisp dashed white center line, and solid edge markings.
- Cobblestone/curb transition to gravel shoulder.
- Terrain features natural rolling topography, road cutaways, and sloping grass banks.

---

## 6. Notebook Layer Integration

- Warm textured parchment background (`#fcf9f2`).
- Subtle horizontal ruled notebook lines spaced at 32px intervals with faint blue/gray ink (`rgba(50, 80, 140, 0.04)`).
- Very subtle organic paper fiber noise applied at composite time.
- 3D rendering blends into the paper with a customized multiply/soft-light balance so the colors remain saturated, punchy, and legible.

---

## 7. Camera & Vehicle Feel

- **Camera**: Smooth third-person chase camera positioned 6.5m behind and 2.4m above the vehicle, with velocity-based look-ahead, subtle field of view expansion during boost, and stable pitch horizon.
- **Arcade Vehicle Physics**:
  - Independent 4-wheel raycast suspension with authentic spring compression and damping.
  - Body chassis rolls into corners and pitches under hard acceleration and braking.
  - Front steering wheels articulate up to ±32 degrees.
  - All 4 wheels spin realistically based on ground speed, with tire smoke particles on hard drifts.
