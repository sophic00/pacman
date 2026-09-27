export const ARCADE_WIDTH = 224;
export const ARCADE_HEIGHT = 288;
export const TILE_SIZE = 8;
export const GRID_COLS = 28;
export const GRID_ROWS = 36;
export const MAZE_TOP_ROW = 3;
export const MAZE_BOTTOM_ROW = 33;

// Base speeds (pixels per second at 60 FPS baseline)
export const PACMAN_SPEED = 75; // ~1.25 px/frame
export const PACMAN_FRIGHTENED_SPEED = 85;
export const PACMAN_DOT_EAT_SPEED = 68;

export const GHOST_SPEED = 70;
export const GHOST_TUNNEL_SPEED = 40;
export const GHOST_FRIGHTENED_SPEED = 45;
export const GHOST_EATEN_SPEED = 140;

// Blinky Cruise Elroy speeds
export const BLINKY_ELROY1_SPEED = 76;
export const BLINKY_ELROY2_SPEED = 82;

// Timings (in milliseconds)
export const FRIGHTENED_TIME = 7000;
export const FRIGHTENED_FLASH_TIME = 2000;
export const READY_TIME = 2500;
export const EAT_GHOST_PAUSE_TIME = 800;
export const PACMAN_DYING_TIME = 1800;
export const LEVEL_CLEARED_TIME = 2200;

// Scatter / Chase wave intervals (in seconds) for Level 1
export const WAVE_TIMES = [
  { mode: 'scatter', duration: 7 },
  { mode: 'chase', duration: 20 },
  { mode: 'scatter', duration: 7 },
  { mode: 'chase', duration: 20 },
  { mode: 'scatter', duration: 5 },
  { mode: 'chase', duration: 20 },
  { mode: 'scatter', duration: 5 },
  { mode: 'chase', duration: Infinity }
] as const;

// Points
export const POINTS_DOT = 10;
export const POINTS_ENERGIZER = 50;
export const GHOST_POINTS = [200, 400, 800, 1600];

// Colors
export const COLORS = {
  MAZE_BORDER: '#2121ff',
  MAZE_GATE: '#ffb8ff',
  DOT: '#ffb8ae',
  ENERGIZER: '#ffb8ae',
  PACMAN: '#ffff00',
  BLINKY: '#ff0000',
  PINKY: '#ffb8ff',
  INKY: '#00ffff',
  CLYDE: '#ffb852',
  FRIGHTENED: '#2121ff',
  FRIGHTENED_FLASH: '#ffffff',
  EYES: '#ffffff',
  PUPILS: '#2121ff',
  SCORE_TEXT: '#ffffff',
  READY_TEXT: '#ffff00',
  GAME_OVER_TEXT: '#ff0000'
} as const;
