export type Player = 'black' | 'white';
export type CellState = Player | null;
export type Board = CellState[][];

export const BOARD_SIZE = 8;

export interface Move {
  row: number;
  col: number;
}

export const INITIAL_BOARD: Board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

// Standard Othello starting position
INITIAL_BOARD[3][3] = 'white';
INITIAL_BOARD[3][4] = 'black';
INITIAL_BOARD[4][3] = 'black';
INITIAL_BOARD[4][4] = 'white';

export function createInitialBoard(): Board {
  return INITIAL_BOARD.map(row => [...row]); // Deep copy for safety
}

export function getOpponent(player: Player): Player {
  return player === 'black' ? 'white' : 'black';
}

/**
 * Checks if a move is valid for the given player.
 * Returns the list of captured discs (flipped positions) if valid, or null.
 */
export function getFlippableDiscs(
  board: Board,
  move: Move,
  player: Player
): Move[] {
  if (board[move.row][move.col] !== null) return [];

  const opponent = getOpponent(player);
  const flippable: Move[] = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  for (const [dr, dc] of directions) {
    let r = move.row + dr;
    let c = move.col + dc;
    const potentialFlips: Move[] = [];

    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === opponent) {
      potentialFlips.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player && potentialFlips.length > 0) {
      flippable.push(...potentialFlips);
    }
  }

  return flippable;
}

export function isValidMove(board: Board, move: Move, player: Player): boolean {
  return getFlippableDiscs(board, move, player).length > 0;
}

export function getAllValidMoves(board: Board, player: Player): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isValidMove(board, { row: r, col: c }, player)) {
        moves.push({ row: r, col: c });
      }
    }
  }
  return moves;
}

export function applyMove(board: Board, move: Move, player: Player): { newBoard: Board, flipped: Move[] } {
  const flipped = getFlippableDiscs(board, move, player);
  if (flipped.length === 0) {
    throw new Error("Invalid move");
  }

  const newBoard = board.map(row => [...row]);
  newBoard[move.row][move.col] = player;
  flipped.forEach(({ row, col }) => {
    newBoard[row][col] = player;
  });

  return { newBoard, flipped };
}

export function getScore(board: Board): { black: number, white: number } {
  let black = 0;
  let white = 0;
  board.forEach(row => {
    row.forEach(cell => {
      if (cell === 'black') black++;
      if (cell === 'white') white++;
    });
  });
  return { black, white };
}
