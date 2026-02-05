import React from 'react';
import { Cell } from './Cell';
import { Board as BoardType, Move } from '@/lib/othello';

interface BoardProps {
    board: BoardType;
    validMoves: Move[];
    bestMove: Move | null;
    onPlaceStone: (row: number, col: number) => void;
    onHoverMove?: (move: Move | null) => void;
}

export const Board: React.FC<BoardProps> = ({ board, validMoves, bestMove, onPlaceStone, onHoverMove }) => {
    return (
        <div className="relative p-2 bg-[var(--board-border)] rounded-lg shadow-2xl">
            <div
                className="grid grid-cols-8 grid-rows-8 gap-[1px] bg-[var(--board-border)] border-[2px] border-[var(--board-border)]"
                style={{
                    width: 'min(90vw, 600px)',
                    height: 'min(90vw, 600px)',
                    backgroundColor: 'var(--board-green)'
                }}
            >
                {board.map((row, r) => (
                    row.map((cellState, c) => {
                        const isValid = validMoves.some(m => m.row === r && m.col === c);
                        const isBest = bestMove ? (bestMove.row === r && bestMove.col === c) : false;

                        return (
                            <Cell
                                key={`${r}-${c}`}
                                row={r}
                                col={c}
                                state={cellState}
                                isValid={isValid}
                                isBestMove={isBest}
                                onClick={() => onPlaceStone(r, c)}
                                onHover={(isHovering) => onHoverMove?.(isHovering ? { row: r, col: c } : null)}
                            />
                        );
                    })
                ))}
            </div>
        </div>
    );
};
