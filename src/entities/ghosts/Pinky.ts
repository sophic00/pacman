import { COLORS } from '../../constants';
import { GhostName, TileCoord } from '../../types';
import { Ghost } from '../Ghost';
import { Pacman } from '../Pacman';

export class Pinky extends Ghost {
  public readonly name: GhostName = 'pinky';
  public readonly color = COLORS.PINKY;
  public readonly scatterCorner: TileCoord = { col: 2, row: 0 };

  constructor() {
    // Pinky starts in center of house
    super({ col: 13, row: 17 });
    this.dotLimit = 0; // Exits right away
  }

  public calculateTarget(pacman: Pacman): TileCoord {
    const pacTile = pacman.getTile();
    let col = pacTile.col;
    let row = pacTile.row;

    // Pinky targets 4 tiles ahead of Pac-Man's facing direction
    if (pacman.direction === 'LEFT') {
      col -= 4;
    } else if (pacman.direction === 'RIGHT') {
      col += 4;
    } else if (pacman.direction === 'DOWN') {
      row += 4;
    } else if (pacman.direction === 'UP') {
      // Authentic arcade overflow quirk: 4 tiles UP and 4 tiles LEFT
      row -= 4;
      col -= 4;
    }

    return { col, row };
  }
}
