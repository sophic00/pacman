import { COLORS } from '../../constants';
import { GhostName, TileCoord } from '../../types';
import { Ghost } from '../Ghost';
import { Pacman } from '../Pacman';

export class Clyde extends Ghost {
  public readonly name: GhostName = 'clyde';
  public readonly color = COLORS.CLYDE;
  public readonly scatterCorner: TileCoord = { col: 0, row: 34 };

  constructor() {
    // Clyde starts in right side of house
    super({ col: 15, row: 17 });
    this.dotLimit = 60; // Released after 60 dots eaten
  }

  public calculateTarget(pacman: Pacman): TileCoord {
    const pacTile = pacman.getTile();
    const clydeTile = this.getTile();

    const dx = pacTile.col - clydeTile.col;
    const dy = pacTile.row - clydeTile.row;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If more than 8 tiles away, chase Pac-Man; if closer, retreat to scatter corner
    if (distance >= 8) {
      return pacTile;
    } else {
      return this.scatterCorner;
    }
  }
}
