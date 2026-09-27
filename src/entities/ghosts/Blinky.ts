import { COLORS } from '../../constants';
import { GhostName, TileCoord } from '../../types';
import { Ghost } from '../Ghost';
import { Pacman } from '../Pacman';

export class Blinky extends Ghost {
  public readonly name: GhostName = 'blinky';
  public readonly color = COLORS.BLINKY;
  public readonly scatterCorner: TileCoord = { col: 25, row: 0 };

  constructor() {
    // Blinky starts outside the house above gate
    super({ col: 13, row: 14 });
    this.inHouse = false;
    this.direction = 'LEFT';
  }

  public override reset(): void {
    super.reset();
    // Blinky starts already released
    this.inHouse = false;
    this.direction = 'LEFT';
  }

  public calculateTarget(pacman: Pacman): TileCoord {
    // Blinky directly targets Pac-Man's current tile
    return pacman.getTile();
  }
}
