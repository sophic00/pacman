import {
  TILE_SIZE,
  ARCADE_WIDTH,
  GHOST_SPEED,
  GHOST_TUNNEL_SPEED,
  GHOST_FRIGHTENED_SPEED,
  GHOST_EATEN_SPEED,
  BLINKY_ELROY1_SPEED,
  BLINKY_ELROY2_SPEED,
  COLORS
} from '../constants';
import { Direction, GhostMode, GhostName, TileCoord } from '../types';
import { Maze } from '../map/Maze';
import { Pacman } from './Pacman';

export abstract class Ghost {
  public abstract readonly name: GhostName;
  public abstract readonly color: string;
  public abstract readonly scatterCorner: TileCoord;

  public x = 0;
  public y = 0;
  public direction: Direction = 'UP';
  public mode: GhostMode = 'house';
  public target: TileCoord = { col: 0, row: 0 };

  public inHouse = true;
  public dotLimit = 0; // Dot count threshold to release from house

  protected baseSpeed = GHOST_SPEED;
  private skirtFrame = 0;
  private skirtTimer = 0;

  constructor(public homeTile: TileCoord) {
    this.reset();
  }

  public reset(): void {
    this.x = this.homeTile.col * TILE_SIZE + 4;
    this.y = this.homeTile.row * TILE_SIZE + 4;
    this.direction = 'UP';
    this.mode = 'house';
    this.inHouse = true;
  }

  public abstract calculateTarget(
    pacman: Pacman,
    blinky?: Ghost,
    globalMode?: 'chase' | 'scatter'
  ): TileCoord;

  public getTile(): TileCoord {
    return {
      col: Math.floor(this.x / TILE_SIZE),
      row: Math.floor(this.y / TILE_SIZE)
    };
  }

  public reverseDirection(): void {
    if (this.mode === 'eaten' || this.inHouse) return;
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
      NONE: 'NONE'
    };
    this.direction = opposites[this.direction];
  }

  public update(
    dt: number,
    pacman: Pacman,
    maze: Maze,
    globalMode: 'chase' | 'scatter',
    blinky?: Ghost,
    remainingDots = 244
  ): void {
    // Animate bottom skirt
    this.skirtTimer += dt;
    if (this.skirtTimer >= 0.12) {
      this.skirtTimer = 0;
      this.skirtFrame = 1 - this.skirtFrame;
    }

    // House bouncing or exiting
    if (this.inHouse) {
      this.updateHouseMovement(dt);
      return;
    }

    // Determine current target
    if (this.mode === 'eaten') {
      // Eaten ghosts head straight to ghost house entrance tile (13.5, 14)
      this.target = { col: 14, row: 14 };
      const currentTile = this.getTile();
      if (
        (currentTile.row === 14 || currentTile.row === 15) &&
        (currentTile.col === 13 || currentTile.col === 14)
      ) {
        // Reached house gate, enter house and revive!
        this.mode = globalMode;
        this.y = 17 * TILE_SIZE + 4;
        this.inHouse = false;
      }
    } else if (this.mode === 'frightened') {
      // Target is random or pseudo-random
      this.target = {
        col: Math.floor(Math.random() * 28),
        row: Math.floor(Math.random() * 36)
      };
    } else {
      this.mode = globalMode;
      if (globalMode === 'scatter') {
        this.target = this.scatterCorner;
      } else {
        this.target = this.calculateTarget(pacman, blinky, globalMode);
      }
    }

    // Determine speed
    let currentSpeed = this.baseSpeed;
    if (this.mode === 'eaten') {
      currentSpeed = GHOST_EATEN_SPEED;
    } else if (this.mode === 'frightened') {
      currentSpeed = GHOST_FRIGHTENED_SPEED;
    } else if (maze.isTunnel(this.getTile().col, this.getTile().row)) {
      currentSpeed = GHOST_TUNNEL_SPEED;
    } else if (this.name === 'blinky') {
      // Cruise Elroy speed boost
      if (remainingDots <= 10) {
        currentSpeed = BLINKY_ELROY2_SPEED;
      } else if (remainingDots <= 20) {
        currentSpeed = BLINKY_ELROY1_SPEED;
      }
    }

    const moveDist = currentSpeed * dt;

    // Ghost movement and intersection decision
    this.move(moveDist, maze);

    // Tunnel wrap
    if (this.getTile().row === 17) {
      if (this.x < -TILE_SIZE) {
        this.x = ARCADE_WIDTH + TILE_SIZE;
      } else if (this.x > ARCADE_WIDTH + TILE_SIZE) {
        this.x = -TILE_SIZE;
      }
    }
  }

  private updateHouseMovement(dt: number): void {
    // If ready to exit, move towards door at col 13.5, row 14
    const doorX = 13.5 * TILE_SIZE;
    const doorY = 14 * TILE_SIZE + 4;

    if (Math.abs(this.x - doorX) > 1) {
      this.x += (doorX > this.x ? 1 : -1) * 35 * dt;
    } else {
      this.x = doorX;
      if (this.y > doorY) {
        this.y -= 35 * dt;
      } else {
        // Exited house!
        this.inHouse = false;
        this.direction = 'LEFT';
      }
    }
  }

  private move(distance: number, maze: Maze): void {
    const tile = this.getTile();
    const tileCenterX = tile.col * TILE_SIZE + 4;
    const tileCenterY = tile.row * TILE_SIZE + 4;

    // Check if crossing the center of the current tile
    let crossedCenter = false;
    let newX = this.x;
    let newY = this.y;

    if (this.direction === 'LEFT') {
      newX -= distance;
      if (this.x >= tileCenterX && newX < tileCenterX) crossedCenter = true;
    } else if (this.direction === 'RIGHT') {
      newX += distance;
      if (this.x <= tileCenterX && newX > tileCenterX) crossedCenter = true;
    } else if (this.direction === 'UP') {
      newY -= distance;
      if (this.y >= tileCenterY && newY < tileCenterY) crossedCenter = true;
    } else if (this.direction === 'DOWN') {
      newY += distance;
      if (this.y <= tileCenterY && newY > tileCenterY) crossedCenter = true;
    }

    if (crossedCenter) {
      // Snap to tile center to make the turn decision cleanly
      this.x = tileCenterX;
      this.y = tileCenterY;
      this.direction = this.pickNextDirection(tile, maze);

      // Remaining movement after turning
      const remainingDist = distance;
      if (this.direction === 'LEFT') this.x -= remainingDist;
      else if (this.direction === 'RIGHT') this.x += remainingDist;
      else if (this.direction === 'UP') this.y -= remainingDist;
      else if (this.direction === 'DOWN') this.y += remainingDist;
    } else {
      this.x = newX;
      this.y = newY;
    }
  }

  private pickNextDirection(tile: TileCoord, maze: Maze): Direction {
    // In arcade Pac-Man, priority order for ties: UP, LEFT, DOWN, RIGHT
    const candidateDirs: Direction[] = ['UP', 'LEFT', 'DOWN', 'RIGHT'];
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
      NONE: 'NONE'
    };

    const opposite = opposites[this.direction];

    // Filter legal turns (cannot reverse direction)
    const validMoves: { dir: Direction; distSq: number }[] = [];

    for (const dir of candidateDirs) {
      if (dir === opposite) continue;

      let nextCol = tile.col;
      let nextRow = tile.row;
      if (dir === 'UP') nextRow--;
      else if (dir === 'DOWN') nextRow++;
      else if (dir === 'LEFT') nextCol--;
      else if (dir === 'RIGHT') nextCol++;

      // Authentic restriction: ghosts cannot turn UP at these specific intersections above house
      if (
        dir === 'UP' &&
        this.mode !== 'eaten' &&
        ((tile.col === 12 && tile.row === 14) ||
          (tile.col === 15 && tile.row === 14) ||
          (tile.col === 12 && tile.row === 26) ||
          (tile.col === 15 && tile.row === 26))
      ) {
        continue;
      }

      if (maze.isPassable(nextCol, nextRow, true)) {
        const dx = nextCol - this.target.col;
        const dy = nextRow - this.target.row;
        const distSq = dx * dx + dy * dy;
        validMoves.push({ dir, distSq });
      }
    }

    if (validMoves.length === 0) {
      // Reversal fallback
      return opposite;
    }

    if (this.mode === 'frightened') {
      // Random choice among legal moves
      const pick = validMoves[Math.floor(Math.random() * validMoves.length)];
      return pick.dir;
    }

    // Pick move with smallest distance squared to target
    validMoves.sort((a, b) => a.distSq - b.distSq);
    return validMoves[0].dir;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    frightenedTimeRemaining = 0
  ): void {
    ctx.save();

    const isFrightened = this.mode === 'frightened';
    const isEaten = this.mode === 'eaten';

    // Body color
    let bodyColor = this.color;
    let isFlashingWhite = false;

    if (isFrightened) {
      // Flash white when <= 2 seconds remain
      if (frightenedTimeRemaining <= 2000) {
        const flashPhase = Math.floor(frightenedTimeRemaining / 200) % 2 === 0;
        isFlashingWhite = flashPhase;
        bodyColor = isFlashingWhite ? COLORS.FRIGHTENED_FLASH : COLORS.FRIGHTENED;
      } else {
        bodyColor = COLORS.FRIGHTENED;
      }
    }

    const radius = 6.5;

    // Render body if not eaten
    if (!isEaten) {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      // Dome
      ctx.arc(this.x, this.y - 1, radius, Math.PI, 0, false);
      // Sides down
      ctx.lineTo(this.x + radius, this.y + 6);

      // Wavy bottom skirt tentacles
      const step = (radius * 2) / 3;
      if (this.skirtFrame === 0) {
        ctx.lineTo(this.x + radius - step * 0.5, this.y + 4);
        ctx.lineTo(this.x + radius - step, this.y + 6);
        ctx.lineTo(this.x + radius - step * 1.5, this.y + 4);
        ctx.lineTo(this.x + radius - step * 2, this.y + 6);
        ctx.lineTo(this.x + radius - step * 2.5, this.y + 4);
        ctx.lineTo(this.x - radius, this.y + 6);
      } else {
        ctx.lineTo(this.x + radius - step * 0.5, this.y + 6);
        ctx.lineTo(this.x + radius - step, this.y + 4);
        ctx.lineTo(this.x + radius - step * 1.5, this.y + 6);
        ctx.lineTo(this.x + radius - step * 2, this.y + 4);
        ctx.lineTo(this.x + radius - step * 2.5, this.y + 6);
        ctx.lineTo(this.x - radius, this.y + 4);
      }

      ctx.closePath();
      ctx.fill();
    }

    // Eyes rendering
    if (isFrightened && !isEaten) {
      // Frightened face (small eyes + wavy mouth)
      ctx.fillStyle = isFlashingWhite ? '#ff0000' : '#ffb8ae';
      // Small dots for eyes
      ctx.fillRect(this.x - 3.5, this.y - 3, 2, 2);
      ctx.fillRect(this.x + 1.5, this.y - 3, 2, 2);

      // Wavy mouth
      ctx.strokeStyle = isFlashingWhite ? '#ff0000' : '#ffb8ae';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.x - 4, this.y + 2);
      ctx.lineTo(this.x - 2, this.y + 1);
      ctx.lineTo(this.x, this.y + 2);
      ctx.lineTo(this.x + 2, this.y + 1);
      ctx.lineTo(this.x + 4, this.y + 2);
      ctx.stroke();
    } else {
      // Normal eyes or Eaten eyes
      let pupilOffsetX = 0;
      let pupilOffsetY = 0;
      if (this.direction === 'LEFT') pupilOffsetX = -1.5;
      else if (this.direction === 'RIGHT') pupilOffsetX = 1.5;
      else if (this.direction === 'UP') pupilOffsetY = -1.5;
      else if (this.direction === 'DOWN') pupilOffsetY = 1.5;

      // White sclera
      ctx.fillStyle = COLORS.EYES;
      ctx.beginPath();
      ctx.arc(this.x - 2.5, this.y - 2, 2.5, 0, Math.PI * 2);
      ctx.arc(this.x + 2.5, this.y - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = COLORS.PUPILS;
      ctx.beginPath();
      ctx.arc(
        this.x - 2.5 + pupilOffsetX,
        this.y - 2 + pupilOffsetY,
        1.3,
        0,
        Math.PI * 2
      );
      ctx.arc(
        this.x + 2.5 + pupilOffsetX,
        this.y - 2 + pupilOffsetY,
        1.3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.restore();
  }
}
