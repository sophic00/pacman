import { Direction } from '../types';

export class InputSystem {
  public currentDirection: Direction = 'NONE';
  public queuedDirection: Direction = 'NONE';
  public onPauseToggle?: () => void;
  public onMuteToggle?: () => void;
  public onStart?: () => void;

  private touchStartX = 0;
  private touchStartY = 0;
  private minSwipeDistance = 25; // pixels

  constructor() {
    this.initKeyboard();
    this.initTouch();
  }

  private initKeyboard(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Prevent scrolling with arrows/space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.setDirection('UP');
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.setDirection('RIGHT');
          break;
        case 'KeyP':
        case 'Space':
          this.onPauseToggle?.();
          break;
        case 'KeyM':
          this.onMuteToggle?.();
          break;
        case 'Enter':
          this.onStart?.();
          break;
      }
    });
  }

  private initTouch(): void {
    window.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        if (e.touches.length > 0) {
          this.touchStartX = e.touches[0].clientX;
          this.touchStartY = e.touches[0].clientY;
          this.onStart?.();
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'touchend',
      (e: TouchEvent) => {
        if (e.changedTouches.length > 0) {
          const deltaX = e.changedTouches[0].clientX - this.touchStartX;
          const deltaY = e.changedTouches[0].clientY - this.touchStartY;

          if (
            Math.abs(deltaX) > this.minSwipeDistance ||
            Math.abs(deltaY) > this.minSwipeDistance
          ) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              this.setDirection(deltaX > 0 ? 'RIGHT' : 'LEFT');
            } else {
              this.setDirection(deltaY > 0 ? 'DOWN' : 'UP');
            }
          }
        }
      },
      { passive: true }
    );
  }

  public setDirection(dir: Direction): void {
    this.queuedDirection = dir;
    this.onStart?.();
  }

  public reset(): void {
    this.currentDirection = 'NONE';
    this.queuedDirection = 'NONE';
  }
}
