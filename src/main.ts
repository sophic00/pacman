import './styles/style.css';
import {
  ARCADE_WIDTH,
  ARCADE_HEIGHT,
  POINTS_DOT,
  POINTS_ENERGIZER,
  READY_TIME,
  PACMAN_DYING_TIME,
  EAT_GHOST_PAUSE_TIME,
  LEVEL_CLEARED_TIME
} from './constants';
import { GameState, TileType } from './types';
import { Maze } from './map/Maze';
import { Pacman } from './entities/Pacman';
import { GhostAISystem } from './systems/GhostAI';
import { InputSystem } from './systems/Input';
import { AudioManager } from './systems/Audio';
import { HUDSystem } from './systems/HUD';

class PacmanGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private maze: Maze;
  private pacman: Pacman;
  private ghostAI: GhostAISystem;
  private input: InputSystem;
  private audio: AudioManager;
  private hud: HUDSystem;

  private gameState: GameState = 'READY';
  private stateTimer = READY_TIME / 1000;
  private isPaused = false;

  private dotsEatenThisLevel = 0;
  private fruitSpawned70 = false;
  private fruitSpawned170 = false;

  // Visual effects
  private energizerPhase = 0;
  private flashMazeWhite = false;
  private flashCounter = 0;

  private lastTime = 0;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.canvas.width = ARCADE_WIDTH;
    this.canvas.height = ARCADE_HEIGHT;

    const ctx = this.canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;

    this.maze = new Maze();
    this.pacman = new Pacman();
    this.ghostAI = new GhostAISystem();
    this.input = new InputSystem();
    this.audio = new AudioManager();
    this.hud = new HUDSystem();

    this.bindEvents();
    this.startReadyState();

    requestAnimationFrame((t) => this.loop(t));
  }

  private bindEvents(): void {
    this.input.onPauseToggle = () => {
      if (this.gameState === 'PLAYING') {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
          this.audio.stopSiren();
          this.audio.stopFrightenedSound();
        } else {
          if (this.ghostAI.isFrightenedActive()) {
            this.audio.startFrightenedSound();
          } else {
            this.audio.startSiren(this.maze.remainingDots / this.maze.totalDots);
          }
        }
      }
    };

    this.input.onMuteToggle = () => {
      const muted = this.audio.toggleMute();
      const muteBtn = document.getElementById('mute-btn');
      if (muteBtn) {
        muteBtn.textContent = muted ? '🔇 Unmute' : '🔊 Mute';
      }
    };

    this.input.onStart = () => {
      if (this.gameState === 'READY') {
        // Can skip ready countdown on movement
        this.gameState = 'PLAYING';
        this.audio.startSiren(this.maze.remainingDots / this.maze.totalDots);
      } else if (this.gameState === 'GAME_OVER') {
        this.restartGame();
      }
    };

    // UI Buttons
    document.getElementById('mute-btn')?.addEventListener('click', () => {
      this.input.onMuteToggle?.();
    });

    document.getElementById('pause-btn')?.addEventListener('click', () => {
      this.input.onPauseToggle?.();
    });

    document.getElementById('reset-btn')?.addEventListener('click', () => {
      this.restartGame();
    });

    // Touch D-Pad buttons
    document.querySelectorAll('[data-dir]').forEach((btn) => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const dir = (btn as HTMLElement).dataset.dir as any;
        if (dir) this.input.setDirection(dir);
      });
      btn.addEventListener('click', () => {
        const dir = (btn as HTMLElement).dataset.dir as any;
        if (dir) this.input.setDirection(dir);
      });
    });
  }

  private startReadyState(): void {
    this.gameState = 'READY';
    this.stateTimer = READY_TIME / 1000;
    this.pacman.reset();
    this.ghostAI.reset();
    this.audio.stopSiren();
    this.audio.stopFrightenedSound();
    this.audio.playIntro();
  }

  private restartGame(): void {
    this.hud.score = 0;
    this.hud.lives = 3;
    this.hud.level = 1;
    this.dotsEatenThisLevel = 0;
    this.fruitSpawned70 = false;
    this.fruitSpawned170 = false;
    this.maze.reset();
    this.startReadyState();
  }

  private startNextLevel(): void {
    this.hud.level++;
    this.hud.addScore(1000); // Level clear bonus
    this.dotsEatenThisLevel = 0;
    this.fruitSpawned70 = false;
    this.fruitSpawned170 = false;
    this.maze.reset();
    this.startReadyState();
  }

  private loop(currentTime: number): void {
    if (!this.lastTime) this.lastTime = currentTime;
    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Cap delta-time to prevent large physics jumps after inactive tab
    if (dt > 0.1) dt = 0.1;

    if (!this.isPaused) {
      this.update(dt);
    }
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number): void {
    // Pulse phase for energizers
    this.energizerPhase = (this.energizerPhase + dt * 4) % 1;

    this.hud.update(dt);

    switch (this.gameState) {
      case 'READY':
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.gameState = 'PLAYING';
          this.audio.startSiren(this.maze.remainingDots / this.maze.totalDots);
        }
        break;

      case 'PLAYING':
        this.updatePlaying(dt);
        break;

      case 'GHOST_EATEN_PAUSE':
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.gameState = 'PLAYING';
          if (this.ghostAI.isFrightenedActive()) {
            this.audio.startFrightenedSound();
          } else {
            this.audio.startSiren(this.maze.remainingDots / this.maze.totalDots);
          }
        }
        break;

      case 'PACMAN_DYING':
        this.stateTimer -= dt;
        this.pacman.deathProgress = 1 - Math.max(0, this.stateTimer / (PACMAN_DYING_TIME / 1000));
        if (this.stateTimer <= 0) {
          this.hud.lives--;
          if (this.hud.lives > 0) {
            this.startReadyState();
          } else {
            this.gameState = 'GAME_OVER';
            this.hud.saveHighScore();
          }
        }
        break;

      case 'LEVEL_CLEARED':
        this.stateTimer -= dt;
        this.flashCounter += dt * 5;
        this.flashMazeWhite = Math.floor(this.flashCounter) % 2 === 0;
        if (this.stateTimer <= 0) {
          this.flashMazeWhite = false;
          this.startNextLevel();
        }
        break;

      case 'GAME_OVER':
        // Wait for player to restart
        break;
    }
  }

  private updatePlaying(dt: number): void {
    // 1. Pac-Man movement
    const isFrightened = this.ghostAI.isFrightenedActive();

    this.pacman.update(
      dt,
      this.input.queuedDirection,
      this.maze,
      false,
      isFrightened
    );

    // 2. Dot / Energizer consumption
    const currentTile = this.pacman.getTile();
    const eaten = this.maze.eatPellet(currentTile.col, currentTile.row);

    if (eaten !== null) {
      this.dotsEatenThisLevel++;
      if (eaten === TileType.DOT) {
        this.hud.addScore(POINTS_DOT);
        this.audio.playWaka();
      } else if (eaten === TileType.ENERGIZER) {
        this.hud.addScore(POINTS_ENERGIZER);
        this.ghostAI.triggerEnergizer(this.audio);
      }

      // Check fruit spawns at 70 and 170 dots
      if (this.dotsEatenThisLevel >= 70 && !this.fruitSpawned70) {
        this.fruitSpawned70 = true;
        this.hud.spawnFruit();
      } else if (this.dotsEatenThisLevel >= 170 && !this.fruitSpawned170) {
        this.fruitSpawned170 = true;
        this.hud.spawnFruit();
      }

      // Check level cleared
      if (this.maze.remainingDots <= 0) {
        this.gameState = 'LEVEL_CLEARED';
        this.stateTimer = LEVEL_CLEARED_TIME / 1000;
        this.flashCounter = 0;
        this.audio.stopSiren();
        this.audio.stopFrightenedSound();
        return;
      }
    }

    // 3. Fruit collision check
    if (this.hud.activeFruit) {
      const fLoc = this.hud.fruitLocation;
      const dx = this.pacman.x - fLoc.x;
      const dy = this.pacman.y - fLoc.y;
      if (Math.sqrt(dx * dx + dy * dy) < 8) {
        const pts = this.hud.activeFruit.points;
        this.hud.addScore(pts);
        this.hud.addPopup(pts.toString(), fLoc.x, fLoc.y);
        this.hud.activeFruit = null;
        this.audio.playEatFruit();
      }
    }

    // 4. Update Ghosts
    this.ghostAI.update(
      dt,
      this.pacman,
      this.maze,
      this.dotsEatenThisLevel,
      this.maze.remainingDots,
      this.audio
    );

    // 5. Collision with Ghosts
    const collision = this.ghostAI.checkPacmanCollision(this.pacman);
    if (collision) {
      if (collision.type === 'ghost_eaten') {
        this.hud.addScore(collision.points);
        this.hud.addPopup(
          collision.points.toString(),
          collision.ghost.x,
          collision.ghost.y
        );
        this.audio.playEatGhost();
        // Pause briefly on ghost eating
        this.gameState = 'GHOST_EATEN_PAUSE';
        this.stateTimer = EAT_GHOST_PAUSE_TIME / 1000;
      } else if (collision.type === 'pacman_death') {
        this.gameState = 'PACMAN_DYING';
        this.stateTimer = PACMAN_DYING_TIME / 1000;
        this.audio.playDeath();
      }
    }
  }

  private render(): void {
    // Clear screen with deep black
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, ARCADE_WIDTH, ARCADE_HEIGHT);

    // 1. Render Maze & Pellets
    this.maze.render(this.ctx, this.flashMazeWhite, this.energizerPhase);

    // 2. Render Pac-Man (unless dying animation finished or level cleared)
    if (this.gameState !== 'LEVEL_CLEARED') {
      this.pacman.render(this.ctx);
    }

    // 3. Render Ghosts (hide during pacman death sequence)
    if (this.gameState !== 'PACMAN_DYING' && this.gameState !== 'LEVEL_CLEARED') {
      this.ghostAI.render(this.ctx);
    }

    // 4. Render HUD & Overlays
    this.hud.render(
      this.ctx,
      this.gameState,
      this.isPaused,
      this.audio.getMuted()
    );
  }
}

// Boot game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new PacmanGame();
});
