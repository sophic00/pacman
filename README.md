# Classic Pac-Man Arcade (1980 Recreation)

A faithful, responsive, zero-dependency recreation of the iconic 1980 arcade classic **Pac-Man**, built from scratch with modern **TypeScript**, **HTML5 Canvas 2D**, and the **Web Audio API**.

---

## 🕹️ Live Controls
- **Movement**: Arrow Keys (`↑`, `↓`, `←`, `→`) or `W`, `A`, `S`, `D`
- **Mobile / Touch**: Touch swipe gestures or on-screen directional buttons
- **Pause / Resume**: `P` or `Spacebar`
- **Mute / Unmute**: `M` key or UI button
- **CRT Shader Effect**: Toggle CRT scanlines with the `CRT: ON/OFF` button

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open your browser to `http://localhost:3000/`.

### 3. Production Build
```bash
npm run build
```
The optimized bundle will be compiled to the `dist/` directory.

---

## 🧠 Architectural Overview & Systems

### 1. Canvas Vector & Procedural Rendering
- Native arcade resolution: **224 × 288** (28 columns × 36 rows of 8×8 px tiles).
- Scaled dynamically using CSS `aspect-ratio: 224 / 288` and `image-rendering: pixelated` for razor-sharp rendering on all screens.
- Completely self-contained procedural graphics for Pac-Man, ghosts, pupils, and maze walls. No external sprite sheet dependencies required.

### 2. Authentic Ghost AI Personalities
Each ghost follows its original 1980 Namco arcade targeting logic:
- **Blinky (Red / "Shadow")**: Relentlessly chases Pac-Man's exact tile. Features *Cruise Elroy* speed boosts when dots decrease below 20 and 10.
- **Pinky (Pink / "Speedy")**: Anticipates Pac-Man's path, targeting 4 tiles ahead (including the classic upward overflow quirk).
- **Inky (Cyan / "Bashful")**: Uses vector doubling between Blinky and Pac-Man's front tile to flank from unexpected angles.
- **Clyde (Orange / "Pokey")**: Pursues Pac-Man when farther than 8 tiles, but retreats to his scatter corner when getting too close.
- **Global Wave Schedule**: Alternates between *Scatter* and *Chase* periods, interrupted by *Frightened* mode when Pac-Man consumes an Energizer.

### 3. Web Audio API Synthesizer
- Fully synthesized retro sound effects using frequency-modulated oscillators:
  - Alternating two-tone *waka-waka* chomp.
  - Background siren with dynamic pitch shift.
  - Energizer pulsating warble.
  - Chromatic step-down death sequence.
  - Classic opening intro jingle.

### 4. Game Cycle & State Machine
- `READY` $\to$ `PLAYING` $\to$ `GHOST_EATEN_PAUSE` $\to$ `PACMAN_DYING` $\to$ `LEVEL_CLEARED` $\to$ `GAME_OVER`.
- Consecutive ghost eating bonus multiplier: $200 \to 400 \to 800 \to 1600$.
- High scores persisted locally via `localStorage`.
