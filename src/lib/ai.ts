import { Board, Player, Move, getAllValidMoves, applyMove, getOpponent, getScore, BOARD_SIZE } from './othello';

// Position weights (Corners are high value, X-squares are bad)
const POSITION_WEIGHTS = [
    [120, -20, 20, 5, 5, 20, -20, 120],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [20, -5, 15, 3, 3, 15, -5, 20],
    [5, -5, 3, 3, 3, 3, -5, 5],
    [5, -5, 3, 3, 3, 3, -5, 5],
    [20, -5, 15, 3, 3, 15, -5, 20],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [120, -20, 20, 5, 5, 20, -20, 120]
];

function evaluateBoard(board: Board, player: Player): number {
    let score = 0;
    const opponent = getOpponent(player);

    // 1. Position Weights
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === player) {
                score += POSITION_WEIGHTS[r][c];
            } else if (board[r][c] === opponent) {
                score -= POSITION_WEIGHTS[r][c];
            }
        }
    }

    // 2. Mobility (Number of valid moves)
    const playerMoves = getAllValidMoves(board, player).length;
    const opponentMoves = getAllValidMoves(board, opponent).length;
    score += (playerMoves - opponentMoves) * 5;

    // 3. Game phase check (optional: optimize later)
    // Late game might prefer absolute disc count, but position usually holds true.

    return score;
}

export function findBestMove(
    board: Board,
    player: Player,
    depth: number = 4
): { move: Move | null, score: number } {
    const validMoves = getAllValidMoves(board, player);

    if (validMoves.length === 0) {
        // If no moves, check if game is over or opponent can move
        const opponentMoves = getAllValidMoves(board, getOpponent(player));
        if (opponentMoves.length === 0) {
            // Game Over: Return exact disc difference as finding
            const { black, white } = getScore(board);
            const finalScore = player === 'black' ? (black - white) * 1000 : (white - black) * 1000;
            return { move: null, score: finalScore };
        }
        // Pass - recurse for opponent
        const result = minimax(board, depth - 1, -Infinity, Infinity, false, player); // Pass implies opponent plays next, but we treat it as searching from current state
        // Actually simplicity: if pass, just return null move with evaluated score of next state
        // For simplicity in this helper, if no moves, return null.
        // The calling loop should handle passing.
        return { move: null, score: -evaluateBoard(board, getOpponent(player)) };
    }

    let bestMove: Move | null = null;
    let bestScore = -Infinity;

    // Move ordering could happen here (e.g. check corners first)

    for (const move of validMoves) {
        const { newBoard } = applyMove(board, move, player);
        const score = minimax(newBoard, depth - 1, -Infinity, Infinity, false, player);

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return { move: bestMove, score: bestScore };
}

function minimax(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    rootPlayer: Player
): number {
    if (depth === 0) {
        return evaluateBoard(board, rootPlayer);
    }

    const currentPlayer = isMaximizing ? rootPlayer : getOpponent(rootPlayer);
    const validMoves = getAllValidMoves(board, currentPlayer);

    if (validMoves.length === 0) {
        const opponentMoves = getAllValidMoves(board, getOpponent(currentPlayer));
        if (opponentMoves.length === 0) {
            // Game over
            const { black, white } = getScore(board);
            // High magnitude for win
            const diff = rootPlayer === 'black' ? black - white : white - black;
            return diff * 10000;
        }
        // Pass: Switch turn, keep depth? Or reduce depth? Standard is switch without depth reduction or just recurse.
        return minimax(board, depth, alpha, beta, !isMaximizing, rootPlayer);
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of validMoves) {
            const { newBoard } = applyMove(board, move, currentPlayer);
            const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, rootPlayer);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break; // Prune
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of validMoves) {
            const { newBoard } = applyMove(board, move, currentPlayer);
            const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, rootPlayer);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break; // Prune
        }
    return minEval;
  }
}

export function analyzeMove(board: Board, player: Player, move: Move): { score: number, reason: string } {
  const { newBoard } = applyMove(board, move, player);
  // Shallow search for immediate impact
  const score = minimax(newBoard, 0, -Infinity, Infinity, false, player);
  
  // Weights for reasoning
  const r = move.row;
  const c = move.col;
  const posWeight = POSITION_WEIGHTS[r][c];
  
  let reason = "";
  
  if (posWeight >= 100) {
    reason = "角を取れる絶好の手です！勝利に大きく近づきます。";
  } else if (posWeight <= -20) {
    reason = "危険な位置です。相手に角を取られるリスクがあります。";
  } else if ((r === 0 || r === 7 || c === 0 || c === 7) && posWeight > 0) {
    reason = "辺を確保できる良い手です。盤面を安定させましょう。";
  } else {
    // Check mobility (simplified)
    const opponent = getOpponent(player);
    const opponentMoves = getAllValidMoves(newBoard, opponent).length;
    if (opponentMoves === 0) {
        reason = "相手の打つ手を無くす強力な手です！";
    } else if (opponentMoves <= 2) {
        reason = "相手の選択肢を狭めるナイスな手です。";
    } else {
        if (score > 20) reason = "盤面を有利に進められる手です。";
        else if (score < -20) reason = "少し形勢が悪くなる可能性があります。";
        else reason = "バランスの取れた普通の手です。";
    }
  }

  return { score, reason };
}
