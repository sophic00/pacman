import { GRID_COLS, GRID_ROWS } from '../constants';
import { TileType } from '../types';

/**
 * Raw 28x36 string representation of classic arcade Pac-Man maze.
 * Rows 0..2: Score/HUD
 * Rows 3..33: Playable Maze (240 dots, 4 energizers)
 * Rows 34..35: Lives & Fruit HUD
 * 
 * Legend:
 * '#' : Wall
 * '.' : Dot (10 pts)
 * 'o' : Energizer (50 pts)
 * '-' : Ghost house gate
 * 'h' : Ghost house interior
 * ' ' : Empty walkable path / Tunnel
 */
export const RAW_MAZE_LAYOUT = [
  // Rows 0-2: Top HUD
  '                            ',
  '                            ',
  '                            ',
  // Rows 3-33: Maze
  '############################', // Row 3
  '#............##............#', // Row 4
  '#.####.#####.##.#####.####.#', // Row 5
  '#o####.#####.##.#####.####o#', // Row 6 (energizers)
  '#.####.#####.##.#####.####.#', // Row 7
  '#..........................#', // Row 8
  '#.####.##.########.##.####.#', // Row 9
  '#.####.##.########.##.####.#', // Row 10
  '#......##....##....##......#', // Row 11
  '######.##### ## #####.######', // Row 12
  '     #.##### ## #####.#     ', // Row 13
  '     #.##          ##.#     ', // Row 14
  '     #.## ###--### ##.#     ', // Row 15 (gate: cols 13, 14)
  '######.## #hhhhhh# ##.######', // Row 16
  '      .   #hhhhhh#   .      ', // Row 17 (tunnel)
  '######.## #hhhhhh# ##.######', // Row 18
  '     #.## ######## ##.#     ', // Row 19
  '     #.##          ##.#     ', // Row 20
  '     #.## ######## ##.#     ', // Row 21
  '######.## ######## ##.######', // Row 22
  '#............##............#', // Row 23
  '#.####.#####.##.#####.####.#', // Row 24
  '#.####.#####.##.#####.####.#', // Row 25
  '#o..##................##..o#', // Row 26 (energizers)
  '###.##.##.########.##.##.###', // Row 27
  '###.##.##.########.##.##.###', // Row 28
  '#......##....##....##......#', // Row 29
  '#.##########.##.##########.#', // Row 30
  '#.##########.##.##########.#', // Row 31
  '#..........................#', // Row 32
  '############################', // Row 33
  // Rows 34-35: Bottom HUD
  '                            ',
  '                            '
];

export function parseMazeLayout(): {
  matrix: TileType[][];
  totalDots: number;
} {
  const matrix: TileType[][] = [];
  let totalDots = 0;

  for (let r = 0; r < GRID_ROWS; r++) {
    const rowStr = RAW_MAZE_LAYOUT[r] || ' '.repeat(GRID_COLS);
    const row: TileType[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      const char = rowStr[c] || ' ';
      switch (char) {
        case '#':
          row.push(TileType.WALL);
          break;
        case '.':
          row.push(TileType.DOT);
          totalDots++;
          break;
        case 'o':
          row.push(TileType.ENERGIZER);
          totalDots++;
          break;
        case '-':
          row.push(TileType.GATE);
          break;
        case 'h':
          row.push(TileType.GHOST_HOUSE);
          break;
        default:
          row.push(TileType.EMPTY);
          break;
      }
    }
    matrix.push(row);
  }

  return { matrix, totalDots };
}
