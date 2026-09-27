export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

export interface Point {
  x: number;
  y: number;
}

export interface TileCoord {
  col: number;
  row: number;
}

export const enum TileType {
  EMPTY = 0,
  WALL = 1,
  DOT = 2,
  ENERGIZER = 3,
  GATE = 4,
  GHOST_HOUSE = 5
}

export type GhostName = 'blinky' | 'pinky' | 'inky' | 'clyde';

export type GhostMode = 'chase' | 'scatter' | 'frightened' | 'eaten' | 'house';

export type GameState =
  | 'READY'
  | 'PLAYING'
  | 'PACMAN_DYING'
  | 'GHOST_EATEN_PAUSE'
  | 'LEVEL_CLEARED'
  | 'GAME_OVER';

export interface FruitInfo {
  name: string;
  points: number;
  color: string;
}
