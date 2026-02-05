import React from 'react';
import { CellState, Move } from '@/lib/othello';

interface CellProps {
    row: number;
    col: number;
    state: CellState;
    isValid: boolean;
    isBestMove: boolean;
    onClick: () => void;
    onHover?: (isHovering: boolean) => void;
}

export const Cell: React.FC<CellProps> = ({ row, col, state, isValid, isBestMove, onClick, onHover }) => {
    return (
        <div
            onClick={isValid ? onClick : undefined}
            onMouseEnter={() => isValid && onHover?.(true)}
            onMouseLeave={() => isValid && onHover?.(false)}
            className={`
        relative w-full h-full border border-[var(--board-border)] flex items-center justify-center
        ${isValid ? 'cursor-pointer hover:bg-[var(--highlight-valid)]' : ''}
        transition-colors duration-200
      `}
        >
            {/* Grid marker for coordinate debugging (optional, keeping clean for now) */}

            {/* Valid Move Indicator (Small dot) */}
            {isValid && !state && (
                <div className={`w-3 h-3 rounded-full ${isBestMove ? 'bg-blue-400 animate-pulse ring-2 ring-blue-300' : 'bg-[var(--board-border)] opacity-50'}`} />
            )}

            {/* The Disc */}
            {state && (
                <div
                    className={`
            w-[80%] h-[80%] rounded-full shadow-lg
            transform transition-all duration-500 ease-in-out
            ${state === 'black'
                            ? 'bg-[var(--piece-black)] bg-gradient-to-br from-gray-700 to-black'
                            : 'bg-[var(--piece-white)] bg-gradient-to-br from-white to-gray-300'
                        }
          `}
                    style={{
                        boxShadow: state === 'black'
                            ? '2px 2px 5px rgba(0,0,0,0.5), inset 2px 2px 5px rgba(255,255,255,0.1)'
                            : '2px 2px 5px rgba(0,0,0,0.3), inset -2px -2px 5px rgba(0,0,0,0.1)'
                    }}
                />
            )}

            {/* Best Move Highlight (if empty) */}
            {isBestMove && !state && (
                <div className="absolute inset-0 border-2 border-blue-400 opacity-50 rounded-sm pointer-events-none" />
            )}
        </div>
    );
};
