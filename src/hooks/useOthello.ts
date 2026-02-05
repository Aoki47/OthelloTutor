import { useState, useCallback, useEffect } from 'react';
import {
    Board,
    Player,
    createInitialBoard,
    applyMove,
    getOpponent,
    getAllValidMoves,
    getScore,
    Move
} from '@/lib/othello';

export type GameStatus = 'playing' | 'finished';

export interface UseOthelloReturn {
    board: Board;
    currentPlayer: Player;
    status: GameStatus;
    winner: Player | 'draw' | null;
    score: { black: number, white: number };
    validMoves: Move[];
    placeStone: (row: number, col: number) => void;
    resetGame: () => void;
}

export function useOthello(): UseOthelloReturn {
    const [board, setBoard] = useState<Board>(createInitialBoard());
    const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
    const [status, setStatus] = useState<GameStatus>('playing');
    const [winner, setWinner] = useState<Player | 'draw' | null>(null);

    const getValidMovesForCurrent = useCallback((currentBoard: Board, player: Player) => {
        return getAllValidMoves(currentBoard, player);
    }, []);

    const [validMoves, setValidMoves] = useState<Move[]>([]);

    // Update valid moves whenever board or player changes
    useEffect(() => {
        if (status === 'finished') {
            setValidMoves([]);
            return;
        }
        setValidMoves(getValidMovesForCurrent(board, currentPlayer));
    }, [board, currentPlayer, status, getValidMovesForCurrent]);

    const checkTurn = useCallback((currentBoard: Board, nextPlayer: Player) => {
        const nextValidMoves = getAllValidMoves(currentBoard, nextPlayer);

        if (nextValidMoves.length > 0) {
            setCurrentPlayer(nextPlayer);
        } else {
            // Pass? Check if opponent can move
            const opponent = getOpponent(nextPlayer);
            const opponentMoves = getAllValidMoves(currentBoard, opponent);

            if (opponentMoves.length > 0) {
                // Player must pass, opponent continues
                // In a real UI, we might want to show a "Pass" message here
                setCurrentPlayer(opponent);
            } else {
                // No one can move -> Game Over
                setStatus('finished');
                const { black, white } = getScore(currentBoard);
                if (black > white) setWinner('black');
                else if (white > black) setWinner('white');
                else setWinner('draw');
            }
        }
    }, []);

    const placeStone = useCallback((row: number, col: number) => {
        if (status !== 'playing') return;

        try {
            const { newBoard } = applyMove(board, { row, col }, currentPlayer);
            setBoard(newBoard);
            checkTurn(newBoard, getOpponent(currentPlayer));
        } catch (e) {
            console.error("Invalid move attempted", e);
        }
    }, [board, currentPlayer, status, checkTurn]);

    const resetGame = useCallback(() => {
        setBoard(createInitialBoard());
        setCurrentPlayer('black');
        setStatus('playing');
        setWinner(null);
    }, []);

    const score = getScore(board);

    return {
        board,
        currentPlayer,
        status,
        winner,
        score,
        validMoves,
        placeStone,
        resetGame
    };
}
