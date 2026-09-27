import {
  WAVE_TIMES,
  FRIGHTENED_TIME,
  GHOST_POINTS
} from '../constants';
import { Ghost } from '../entities/Ghost';
import { Blinky } from '../entities/ghosts/Blinky';
import { Pinky } from '../entities/ghosts/Pinky';
import { Inky } from '../entities/ghosts/Inky';
import { Clyde } from '../entities/ghosts/Clyde';
import { Pacman } from '../entities/Pacman';
import { Maze } from '../map/Maze';
import { AudioManager } from './Audio';

export class GhostAISystem {
  public ghosts: Ghost[];
  public blinky: Blinky;
  public pinky: Pinky;
  public inky: Inky;
  public clyde: Clyde;

  public globalMode: 'chase' | 'scatter' = 'scatter';
  private currentWaveIndex = 0;
  private waveTimer = 0;

  public frightenedTimer = 0;
  public consecutiveGhostsEaten = 0;

  constructor() {
    this.blinky = new Blinky();
    this.pinky = new Pinky();
    this.inky = new Inky();
    this.clyde = new Clyde();
    this.ghosts = [this.blinky, this.pinky, this.inky, this.clyde];
  }

  public reset(): void {
    this.ghosts.forEach((ghost) => ghost.reset());
    this.globalMode = 'scatter';
    this.currentWaveIndex = 0;
    this.waveTimer = 0;
    this.frightenedTimer = 0;
    this.consecutiveGhostsEaten = 0;
  }

  public triggerEnergizer(audio: AudioManager): void {
    this.frightenedTimer = FRIGHTENED_TIME;
    this.consecutiveGhostsEaten = 0;

    this.ghosts.forEach((ghost) => {
      if (ghost.mode !== 'eaten' && !ghost.inHouse) {
        ghost.mode = 'frightened';
        ghost.reverseDirection();
      }
    });

    audio.startFrightenedSound();
  }

  public isFrightenedActive(): boolean {
    return this.frightenedTimer > 0;
  }

  public checkHouseReleases(dotsEaten: number): void {
    if (this.pinky.inHouse) {
      // Pinky released immediately
      this.pinky.inHouse = false;
    }
    if (this.inky.inHouse && dotsEaten >= this.inky.dotLimit) {
      this.inky.inHouse = false;
    }
    if (this.clyde.inHouse && dotsEaten >= this.clyde.dotLimit) {
      this.clyde.inHouse = false;
    }
  }

  public update(
    dt: number,
    pacman: Pacman,
    maze: Maze,
    dotsEaten: number,
    remainingDots: number,
    audio: AudioManager
  ): void {
    // Check ghost house release conditions
    this.checkHouseReleases(dotsEaten);

    // Update frightened timer
    if (this.frightenedTimer > 0) {
      this.frightenedTimer -= dt * 1000;
      if (this.frightenedTimer <= 0) {
        this.frightenedTimer = 0;
        this.consecutiveGhostsEaten = 0;
        this.ghosts.forEach((ghost) => {
          if (ghost.mode === 'frightened') {
            ghost.mode = this.globalMode;
          }
        });
        audio.stopFrightenedSound();
        audio.startSiren(remainingDots / 244);
      }
    } else {
      // Advance wave timer when not in frightened mode
      const currentWave = WAVE_TIMES[this.currentWaveIndex];
      if (currentWave && currentWave.duration !== Infinity) {
        this.waveTimer += dt;
        if (this.waveTimer >= currentWave.duration) {
          this.waveTimer = 0;
          this.currentWaveIndex = Math.min(
            this.currentWaveIndex + 1,
            WAVE_TIMES.length - 1
          );
          const nextWave = WAVE_TIMES[this.currentWaveIndex];
          if (this.globalMode !== nextWave.mode) {
            this.globalMode = nextWave.mode;
            // Ghosts reverse direction on wave transition
            this.ghosts.forEach((g) => g.reverseDirection());
          }
        }
      }
    }

    // Update each ghost
    this.ghosts.forEach((ghost) => {
      ghost.update(
        dt,
        pacman,
        maze,
        this.globalMode,
        this.blinky,
        remainingDots
      );
    });
  }

  /**
   * Check collision with Pac-Man.
   * Returns:
   *  - { type: 'ghost_eaten', ghost: Ghost, points: number }
   *  - { type: 'pacman_death' }
   *  - null (no collision)
   */
  public checkPacmanCollision(
    pacman: Pacman
  ): { type: 'ghost_eaten'; ghost: Ghost; points: number } | { type: 'pacman_death' } | null {
    const hitDistance = 7.5; // Collision radius

    for (const ghost of this.ghosts) {
      if (ghost.inHouse) continue;

      const dx = pacman.x - ghost.x;
      const dy = pacman.y - ghost.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < hitDistance) {
        if (ghost.mode === 'frightened') {
          // Pac-Man eats ghost
          const points =
            GHOST_POINTS[
              Math.min(this.consecutiveGhostsEaten, GHOST_POINTS.length - 1)
            ];
          this.consecutiveGhostsEaten++;
          ghost.mode = 'eaten';
          return { type: 'ghost_eaten', ghost, points };
        } else if (ghost.mode === 'eaten') {
          // Eyes pass harmlessly through Pac-Man
          continue;
        } else {
          // Pac-Man touched active ghost: death!
          return { type: 'pacman_death' };
        }
      }
    }

    return null;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    this.ghosts.forEach((ghost) => {
      ghost.render(ctx, this.frightenedTimer);
    });
  }
}
