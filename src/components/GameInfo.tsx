import React from 'react';
import { Player } from '@/lib/othello';

interface GameInfoProps {
    currentPlayer: Player;
    score: { black: number, white: number };
    winner: Player | 'draw' | null;
    aiEvaluation: number; // Positive = Black advantage, Negative = White
    advice: string | null;
    onReset: () => void;
}

export const GameInfo: React.FC<GameInfoProps> = ({ currentPlayer, score, winner, aiEvaluation, advice, onReset }) => {
    // Normalize evaluation for bar (-1000 to 1000 range approx)
    const evalPercent = Math.max(0, Math.min(100, 50 + (aiEvaluation / 20)));

    return (
        <div className="flex flex-col gap-6 w-full max-w-md p-6 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-md shadow-xl">

            {/* Turn Indicator & Winner */}
            <div className="text-center">
                {winner ? (
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse">
                        {winner === 'draw' ? 'Draw!' : `${winner === 'black' ? 'Black' : 'White'} Wins!`}
                    </h2>
                ) : (
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-xl text-gray-400">Current Turn:</span>
                        <div className={`
              px-4 py-1 rounded-full font-bold flex items-center gap-2
              ${currentPlayer === 'black' ? 'bg-black text-white border border-gray-700' : 'bg-white text-black'}
            `}>
                            <div className={`w-3 h-3 rounded-full ${currentPlayer === 'black' ? 'bg-white' : 'bg-black'}`} />
                            {currentPlayer === 'black' ? 'Black' : 'White'}
                        </div>
                    </div>
                )}
            </div>

            {/* Score */}
            <div className="flex justify-between items-center px-4">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-black border-2 border-gray-600 mb-2 shadow-lg" />
                    <span className="text-2xl font-bold font-mono">{score.black}</span>
                </div>
                <span className="text-3xl font-light text-gray-500">-</span>
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-white mb-2 shadow-lg" />
                    <span className="text-2xl font-bold font-mono">{score.white}</span>
                </div>
            </div>

            {/* Evaluation Bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                    <span>White Adv.</span>
                    <span>Balanced</span>
                    <span>Black Adv.</span>
                </div>
                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden relative">
                    <div
                        className="h-full absolute left-0 top-0 transition-all duration-1000 ease-out bg-gradient-to-r from-white via-gray-400 to-black"
                        style={{ width: '100%' }} // Background gradient
                    />
                    {/* Marker for current eval */}
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-blue-500 z-10 transition-all duration-1000 ease-in-out shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                        style={{ left: `${evalPercent}%` }}
                    />
                </div>
            </div>

            {/* AI Advice */}
            {advice && !winner && (
                <div className="bg-[rgba(0,0,0,0.3)] p-3 rounded-lg border-l-4 border-blue-500 text-sm text-blue-100 animate-fade-in">
                    <strong className="block text-blue-400 mb-1">AI Trainer:</strong>
                    {advice}
                </div>
            )}

            {/* Controls */}
            <button
                onClick={onReset}
                className="w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors border border-gray-700"
            >
                Reset Game
            </button>

        </div>
    );
};
