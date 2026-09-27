import { COLORS } from '../../constants';
import { GhostName, TileCoord } from '../../types';
import { Ghost } from '../Ghost';
import { Pacman } from '../Pacman';

export class Inky extends Ghost {
  public readonly name: GhostName = 'inky';
  public readonly color = COLORS.INKY;
  public readonly scatterCorner: TileCoord = { col: 27, row: 34 };

  constructor() {
    // Inky starts in left side of house
    super({ col: 11, row: 17 });
    this.dotLimit = 30; // Released after 30 dots eaten
  }

  public calculateTarget(pacman: Pacman, blinky?: Ghost): TileCoord {
    const pacTile = pacman.getTile();
    let intermediateCol = pacTile.col;
    let intermediateRow = pacTile.row;

    // Intermediate point: 2 tiles ahead of Pac-Man
    if (pacman.direction === 'LEFT') intermediateCol -= 2;
    else if (pacman.direction === 'RIGHT') intermediateCol += 2;
    else if (pacman.direction === 'DOWN') intermediateRow += 2;
    else if (pacman.direction === 'UP') {
      intermediateRow -= 2;
      intermediateCol -= 2;
    }

    // Double the vector from Blinky to intermediate point
    const blinkyTile = blinky ? blinky.getTile() : { col: 13, row: 14 };
    const dx = intermediateCol - blinkyTile.col;
    const dy = intermediateRow - blinkyTile.row;

    return {
      col: intermediateCol + dx,
      row: intermediateRow + dy
    };
  }
}
