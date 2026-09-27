import {
  TILE_SIZE,
  ARCADE_WIDTH,
  PACMAN_SPEED,
  PACMAN_DOT_EAT_SPEED,
  PACMAN_FRIGHTENED_SPEED,
  COLORS
} from '../constants';
import { Direction, TileCoord } from '../types';
import { Maze } from '../map/Maze';

export class Pacman {
  public x: number;
  public y: number;
  public direction: Direction = 'NONE';
  public nextDirection: Direction = 'NONE';
  public radius = 6.5;

  private mouthAngle = 0.2;
  private mouthSpeed = 8; // chomp cycles per second
  private mouthOpening = true;

  // Death animation progress (0.0 to 1.0)
  public deathProgress = 0;

  constructor() {
    // Start at row 26, between cols 13 and 14
    this.x = 13.5 * TILE_SIZE;
    this.y = 26 * TILE_SIZE + 4;
  }

  public reset(): void {
    this.x = 13.5 * TILE_SIZE;
    this.y = 26 * TILE_SIZE + 4;
    this.direction = 'NONE';
    this.nextDirection = 'NONE';
    this.mouthAngle = 0.2;
    this.deathProgress = 0;
  }

  public getTile(): TileCoord {
    return {
      col: Math.floor(this.x / TILE_SIZE),
      row: Math.floor(this.y / TILE_SIZE)
    };
  }

  public update(
    dt: number,
    queuedDirection: Direction,
    maze: Maze,
    isEating: boolean,
    isFrightenedActive: boolean
  ): void {
    if (queuedDirection !== 'NONE') {
      this.nextDirection = queuedDirection;
    }

    // Determine speed
    let speed = PACMAN_SPEED;
    if (isEating) {
      speed = PACMAN_DOT_EAT_SPEED;
    } else if (isFrightenedActive) {
      speed = PACMAN_FRIGHTENED_SPEED;
    }

    const moveDistance = speed * dt;

    // Check if we can switch to nextDirection
    if (this.nextDirection !== 'NONE' && this.nextDirection !== this.direction) {
      if (this.canReverse(this.direction, this.nextDirection)) {
        this.direction = this.nextDirection;
      } else if (this.canTurn(this.nextDirection, maze)) {
        this.snapToTurnAxis(this.nextDirection);
        this.direction = this.nextDirection;
      }
    }

    // Move in current direction if path is clear
    if (this.direction !== 'NONE') {
      const moved = this.moveInDirection(this.direction, moveDistance, maze);
      if (moved) {
        // Animate mouth
        const chompDelta = this.mouthSpeed * dt;
        if (this.mouthOpening) {
          this.mouthAngle += chompDelta;
          if (this.mouthAngle >= 0.28) {
            this.mouthAngle = 0.28;
            this.mouthOpening = false;
          }
        } else {
          this.mouthAngle -= chompDelta;
          if (this.mouthAngle <= 0.02) {
            this.mouthAngle = 0.02;
            this.mouthOpening = true;
          }
        }
      }
    }

    // Handle tunnel wrapping
    if (this.getTile().row === 17) {
      if (this.x < -TILE_SIZE) {
        this.x = ARCADE_WIDTH + TILE_SIZE;
      } else if (this.x > ARCADE_WIDTH + TILE_SIZE) {
        this.x = -TILE_SIZE;
      }
    }
  }

  private canReverse(current: Direction, next: Direction): boolean {
    return (
      (current === 'LEFT' && next === 'RIGHT') ||
      (current === 'RIGHT' && next === 'LEFT') ||
      (current === 'UP' && next === 'DOWN') ||
      (current === 'DOWN' && next === 'UP')
    );
  }

  private canTurn(next: Direction, maze: Maze): boolean {
    const col = Math.floor(this.x / TILE_SIZE);
    const row = Math.floor(this.y / TILE_SIZE);
    const tileCenterX = col * TILE_SIZE + 4;
    const tileCenterY = row * TILE_SIZE + 4;

    const threshold = 3.5; // pixel tolerance for pre-turning

    if (next === 'UP' || next === 'DOWN') {
      // Must be close to column center
      if (Math.abs(this.x - tileCenterX) > threshold) return false;
      const targetRow = next === 'UP' ? row - 1 : row + 1;
      return maze.isPassable(col, targetRow, false);
    } else if (next === 'LEFT' || next === 'RIGHT') {
      // Must be close to row center
      if (Math.abs(this.y - tileCenterY) > threshold) return false;
      const targetCol = next === 'LEFT' ? col - 1 : col + 1;
      return maze.isPassable(targetCol, row, false);
    }

    return false;
  }

  private snapToTurnAxis(next: Direction): void {
    const col = Math.floor(this.x / TILE_SIZE);
    const row = Math.floor(this.y / TILE_SIZE);
    if (next === 'UP' || next === 'DOWN') {
      this.x = col * TILE_SIZE + 4;
    } else {
      this.y = row * TILE_SIZE + 4;
    }
  }

  private moveInDirection(dir: Direction, distance: number, maze: Maze): boolean {
    let nextX = this.x;
    let nextY = this.y;

    if (dir === 'LEFT') nextX -= distance;
    else if (dir === 'RIGHT') nextX += distance;
    else if (dir === 'UP') nextY -= distance;
    else if (dir === 'DOWN') nextY += distance;

    // Check collision with walls
    const col = Math.floor(nextX / TILE_SIZE);
    const row = Math.floor(nextY / TILE_SIZE);

    // In tunnel row, bypass horizontal wall check
    if (row === 17 && (nextX < 0 || nextX >= ARCADE_WIDTH)) {
      this.x = nextX;
      this.y = nextY;
      return true;
    }

    // Check target tile
    let canMove = true;
    if (dir === 'LEFT') {
      const frontCol = Math.floor((nextX - 3.5) / TILE_SIZE);
      if (!maze.isPassable(frontCol, row, false)) canMove = false;
    } else if (dir === 'RIGHT') {
      const frontCol = Math.floor((nextX + 3.5) / TILE_SIZE);
      if (!maze.isPassable(frontCol, row, false)) canMove = false;
    } else if (dir === 'UP') {
      const frontRow = Math.floor((nextY - 3.5) / TILE_SIZE);
      if (!maze.isPassable(col, frontRow, false)) canMove = false;
    } else if (dir === 'DOWN') {
      const frontRow = Math.floor((nextY + 3.5) / TILE_SIZE);
      if (!maze.isPassable(col, frontRow, false)) canMove = false;
    }

    if (canMove) {
      this.x = nextX;
      this.y = nextY;
      return true;
    } else {
      // Snap to tile center
      if (dir === 'LEFT' || dir === 'RIGHT') {
        this.x = col * TILE_SIZE + 4;
      } else {
        this.y = row * TILE_SIZE + 4;
      }
      return false;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = COLORS.PACMAN;

    if (this.deathProgress > 0) {
      // Pac-Man death animation: mouth opens all the way to 360 degrees
      const startAngle = Math.PI * 1.5 - Math.PI * this.deathProgress;
      const endAngle = Math.PI * 1.5 + Math.PI * this.deathProgress;

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.arc(this.x, this.y, this.radius, startAngle, endAngle, true);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }

    // Normal rendering
    let rotation = 0;
    if (this.direction === 'LEFT') rotation = Math.PI;
    else if (this.direction === 'UP') rotation = Math.PI * 1.5;
    else if (this.direction === 'DOWN') rotation = Math.PI * 0.5;

    const startAngle = rotation + this.mouthAngle * Math.PI;
    const endAngle = rotation + (2 - this.mouthAngle) * Math.PI;

    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.arc(this.x, this.y, this.radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
