import {
  ARCADE_WIDTH,
  TILE_SIZE,
  COLORS
} from '../constants';
import { FruitInfo, Point } from '../types';

export const FRUIT_TABLE: FruitInfo[] = [
  { name: 'Cherry', points: 100, color: '#ff0000' },
  { name: 'Strawberry', points: 300, color: '#ff5555' },
  { name: 'Orange', points: 500, color: '#ffaa00' },
  { name: 'Apple', points: 700, color: '#00dd00' },
  { name: 'Melon', points: 1000, color: '#55ff55' },
  { name: 'Galaxian', points: 2000, color: '#ffff00' },
  { name: 'Bell', points: 3000, color: '#ffff55' },
  { name: 'Key', points: 5000, color: '#00ffff' }
];

export class HUDSystem {
  public score = 0;
  public highScore = 0;
  public lives = 3;
  public level = 1;

  // Fruit state
  public activeFruit: FruitInfo | null = null;
  public fruitTimer = 0;
  public fruitLocation: Point = { x: 13.5 * TILE_SIZE, y: 20 * TILE_SIZE + 4 };

  // Floating score popups (e.g. eaten ghost score 200, 400, etc.)
  public popups: { text: string; x: number; y: number; timer: number }[] = [];

  constructor() {
    this.loadHighScore();
  }

  private loadHighScore(): void {
    try {
      const saved = localStorage.getItem('pacman_high_score');
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0;
      }
    } catch {
      this.highScore = 0;
    }
  }

  public saveHighScore(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('pacman_high_score', this.highScore.toString());
      } catch {
        // Ignore localStorage restrictions
      }
    }
  }

  public addScore(points: number): void {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }

  public addPopup(text: string, x: number, y: number, duration = 0.8): void {
    this.popups.push({ text, x, y, timer: duration });
  }

  public spawnFruit(): void {
    const fruitIndex = Math.min(this.level - 1, FRUIT_TABLE.length - 1);
    this.activeFruit = FRUIT_TABLE[fruitIndex];
    this.fruitTimer = 9.5; // Stays for 9.5 seconds
  }

  public update(dt: number): void {
    if (this.activeFruit) {
      this.fruitTimer -= dt;
      if (this.fruitTimer <= 0) {
        this.activeFruit = null;
      }
    }

    for (let i = this.popups.length - 1; i >= 0; i--) {
      this.popups[i].timer -= dt;
      if (this.popups[i].timer <= 0) {
        this.popups.splice(i, 1);
      }
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    gameState: string,
    isPaused: boolean,
    isMuted: boolean
  ): void {
    ctx.save();
    ctx.font = '8px "Press Start 2P", monospace, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // 1UP & Score
    ctx.fillStyle = '#ffffff';
    ctx.fillText('1UP', 24, 6);
    const scoreStr = this.score.toString().padStart(2, '0');
    ctx.fillText(scoreStr, 24, 16);

    // HIGH SCORE & High Score
    ctx.fillText('HIGH SCORE', 104, 6);
    const hiScoreStr = this.highScore.toString().padStart(2, '0');
    ctx.fillText(hiScoreStr, 136, 16);

    // Render Remaining Lives as Pac-Man icons at bottom left (row 34)
    for (let i = 0; i < this.lives - 1; i++) {
      const lx = 16 + i * 16;
      const ly = 34 * TILE_SIZE + 4;
      ctx.fillStyle = COLORS.PACMAN;
      ctx.beginPath();
      ctx.arc(lx, ly, 6, Math.PI * 1.2, Math.PI * 0.8);
      ctx.lineTo(lx, ly);
      ctx.closePath();
      ctx.fill();
    }

    // Render Fruit indicator at bottom right (row 34)
    const currentFruit = FRUIT_TABLE[Math.min(this.level - 1, FRUIT_TABLE.length - 1)];
    const fx = ARCADE_WIDTH - 24;
    const fy = 34 * TILE_SIZE + 4;
    this.renderFruitIcon(ctx, currentFruit, fx, fy);

    // Render active bonus fruit on the board
    if (this.activeFruit) {
      this.renderFruitIcon(
        ctx,
        this.activeFruit,
        this.fruitLocation.x,
        this.fruitLocation.y
      );
    }

    // Render floating popups
    this.popups.forEach((popup) => {
      ctx.fillStyle = '#00ffff';
      ctx.font = '7px "Press Start 2P", monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(popup.text, popup.x, popup.y - 2);
    });

    // Center game state messages
    ctx.textAlign = 'center';
    if (gameState === 'READY') {
      ctx.fillStyle = COLORS.READY_TEXT;
      ctx.fillText('READY!', ARCADE_WIDTH / 2, 20 * TILE_SIZE);
    } else if (gameState === 'GAME_OVER') {
      ctx.fillStyle = COLORS.GAME_OVER_TEXT;
      ctx.fillText('GAME  OVER', ARCADE_WIDTH / 2, 20 * TILE_SIZE);
    } else if (isPaused) {
      ctx.fillStyle = '#ffff00';
      ctx.fillText('PAUSED', ARCADE_WIDTH / 2, 20 * TILE_SIZE);
    }

    // Audio status indicator (top right corner)
    if (isMuted) {
      ctx.fillStyle = '#888888';
      ctx.font = '6px "Press Start 2P", monospace, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('MUTED', ARCADE_WIDTH - 4, 6);
    }

    ctx.restore();
  }

  private renderFruitIcon(
    ctx: CanvasRenderingContext2D,
    fruit: FruitInfo,
    x: number,
    y: number
  ): void {
    ctx.save();
    // Render cherry / fruit icon procedurally
    ctx.fillStyle = fruit.color;
    ctx.beginPath();
    ctx.arc(x - 2, y + 1, 3, 0, Math.PI * 2);
    ctx.arc(x + 3, y + 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Stems
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 2, y - 1);
    ctx.quadraticCurveTo(x, y - 5, x + 2, y - 5);
    ctx.moveTo(x + 3, y);
    ctx.quadraticCurveTo(x + 1, y - 5, x + 2, y - 5);
    ctx.stroke();

    ctx.restore();
  }
}
