import {
  GRID_COLS,
  GRID_ROWS,
  TILE_SIZE,
  COLORS
} from '../constants';
import { TileType } from '../types';
import { parseMazeLayout } from './mazeData';

export class Maze {
  private initialGrid: TileType[][];
  public grid: TileType[][];
  public totalDots: number;
  public remainingDots: number;

  constructor() {
    const { matrix, totalDots } = parseMazeLayout();
    this.initialGrid = matrix;
    this.grid = matrix.map((row) => [...row]);
    this.totalDots = totalDots;
    this.remainingDots = totalDots;
  }

  public reset(): void {
    this.grid = this.initialGrid.map((row) => [...row]);
    this.remainingDots = this.totalDots;
  }

  public getTile(col: number, row: number): TileType {
    if (row < 0 || row >= GRID_ROWS) return TileType.WALL;
    // Wrap around horizontally for tunnel
    if (col < 0 || col >= GRID_COLS) {
      if (row === 17) return TileType.EMPTY;
      return TileType.WALL;
    }
    return this.grid[row][col];
  }

  public isWall(col: number, row: number): boolean {
    const tile = this.getTile(col, row);
    return tile === TileType.WALL;
  }

  public isPassable(col: number, row: number, isGhost = false): boolean {
    // Warp tunnel row is always passable off-screen
    if (row === 17 && (col < 0 || col >= GRID_COLS)) {
      return true;
    }

    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
      return false;
    }

    const tile = this.grid[row][col];
    if (tile === TileType.WALL) return false;
    if (tile === TileType.GATE) {
      // Eaten ghosts can enter house; ghosts in house can exit; Pacman cannot
      return isGhost;
    }
    if (tile === TileType.GHOST_HOUSE) {
      return isGhost;
    }
    return true;
  }

  public isTunnel(col: number, row: number): boolean {
    return row === 17 && (col <= 5 || col >= 22);
  }

  public eatPellet(col: number, row: number): TileType.DOT | TileType.ENERGIZER | null {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
      return null;
    }

    const tile = this.grid[row][col];
    if (tile === TileType.DOT || tile === TileType.ENERGIZER) {
      this.grid[row][col] = TileType.EMPTY;
      this.remainingDots--;
      return tile;
    }
    return null;
  }

  public render(ctx: CanvasRenderingContext2D, flashWhite = false, energizerPhase = 0): void {
    const wallColor = flashWhite ? '#ffffff' : COLORS.MAZE_BORDER;

    // Render walls
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = wallColor;

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const tile = this.grid[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        if (tile === TileType.WALL) {
          // Check neighbors
          const up = this.isWall(c, r - 1);
          const down = this.isWall(c, r + 1);
          const left = this.isWall(c - 1, r);
          const right = this.isWall(c + 1, r);

          // Draw boundary strokes where adjacent to walkable space
          ctx.beginPath();
          if (!up) {
            ctx.moveTo(x, y + 0.5);
            ctx.lineTo(x + TILE_SIZE, y + 0.5);
          }
          if (!down) {
            ctx.moveTo(x, y + TILE_SIZE - 0.5);
            ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE - 0.5);
          }
          if (!left) {
            ctx.moveTo(x + 0.5, y);
            ctx.lineTo(x + 0.5, y + TILE_SIZE);
          }
          if (!right) {
            ctx.moveTo(x + TILE_SIZE - 0.5, y);
            ctx.lineTo(x + TILE_SIZE - 0.5, y + TILE_SIZE);
          }
          ctx.stroke();

          // Fill wall inner with dark subtle tint
          ctx.fillStyle = flashWhite ? '#ffffff' : '#090930';
          ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        } else if (tile === TileType.GATE) {
          // Ghost house gate
          ctx.fillStyle = COLORS.MAZE_GATE;
          ctx.fillRect(x, y + 3, TILE_SIZE, 2);
        } else if (tile === TileType.DOT) {
          // Standard pellet: small 2x2 square
          ctx.fillStyle = COLORS.DOT;
          ctx.fillRect(x + 3, y + 3, 2, 2);
        } else if (tile === TileType.ENERGIZER) {
          // Energizer: pulsing circle
          if (energizerPhase > 0.25) {
            ctx.fillStyle = COLORS.ENERGIZER;
            ctx.beginPath();
            const radius = 3.5;
            ctx.arc(x + 4, y + 4, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    ctx.restore();
  }
}
