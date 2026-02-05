"use client";

import React, { useEffect, useState } from 'react';
import { Board } from '@/components/Board';
import { GameInfo } from '@/components/GameInfo';
import { useOthello } from '@/hooks/useOthello';
import { findBestMove, analyzeMove } from '@/lib/ai';
import { Move } from '@/lib/othello';

export default function Home() {
  const {
    board,
    currentPlayer,
    status,
    winner,
    score,
    validMoves,
    placeStone,
    resetGame
  } = useOthello();

  const [bestMoveHint, setBestMoveHint] = useState<Move | null>(null);
  const [aiEval, setAiEval] = useState<number>(0);
  const [advice, setAdvice] = useState<string | null>(null);
  const [hoverAdvice, setHoverAdvice] = useState<{ score: number, reason: string } | null>(null);

  const handleHoverMove = (move: Move | null) => {
    if (!move || currentPlayer !== 'black') {
      setHoverAdvice(null);
      return;
    }
    // Instant analysis
    const analysis = analyzeMove(board, 'black', move);
    setHoverAdvice(analysis);
  };

  // AI Turn & Advice Logic
  useEffect(() => {
    if (status !== 'playing') return;

    if (currentPlayer === 'white') {
      // AI Logic (Opponent)
      const timer = setTimeout(() => {
        const { move } = findBestMove(board, 'white', 4); // Depth 4
        if (move) {
          placeStone(move.row, move.col);
        }
      }, 800); // Slight delay for realism
      return () => clearTimeout(timer);
    } else {
      // Player Logic (Black) - Analysis
      const timer = setTimeout(() => {
        const { move, score } = findBestMove(board, 'black', 4);
        setBestMoveHint(move);
        setAiEval(score);

        // Generate simple advice text
        if (move) {
          const isCorner = (move.row === 0 || move.row === 7) && (move.col === 0 || move.col === 7);
          const isEdge = (move.row === 0 || move.row === 7 || move.col === 0 || move.col === 7) && !isCorner;

          if (isCorner) {
            setAdvice("角を取る絶好のチャンスです！確実に取りましょう。");
          } else if (isEdge) {
            setAdvice("辺を確保して盤面を安定させましょう。");
          } else {
            setAdvice("相手の選択肢を狭めるように打ちましょう。");
          }
        } else {
          setAdvice(null);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [board, currentPlayer, status, placeStone]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 gap-8">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      <header className="z-10 text-center mb-4">
        <h1 className="text-5xl font-extrabold pb-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500 tracking-tight">
          Othello Tutor
        </h1>
        <p className="text-gray-400">リアルタイムAI指導で、打ちながら強くなる</p>
      </header>

      <div className="z-10 flex flex-col lg:flex-row items-start gap-12 w-full max-w-6xl justify-center">
        {/* Board Section */}
        <div className="flex-shrink-0 flex flex-col items-center gap-4">

          {/* Hover Advice Panel (Top of board) */}
          <div className={`
            h-24 w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-4
            flex flex-col items-center justify-center text-center transition-all duration-300 backdrop-blur-md shadow-lg
            ${hoverAdvice ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
          `}>
            {hoverAdvice && (
              <>
                <div className="text-xs text-blue-300 mb-1 font-bold tracking-wider uppercase">AI Instant Analysis</div>
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-sm">
                  評価値: {hoverAdvice.score > 0 ? '+' : ''}{hoverAdvice.score}
                </div>
                <div className="text-gray-100 text-sm mt-1 font-medium">{hoverAdvice.reason}</div>
              </>
            )}
          </div>

          <Board
            board={board}
            validMoves={validMoves}
            bestMove={bestMoveHint}
            onPlaceStone={placeStone}
            onHoverMove={handleHoverMove}
          />
        </div>

        {/* HUD Section */}
        <div className="flex-grow w-full max-w-md">
          <GameInfo
            currentPlayer={currentPlayer}
            score={score}
            winner={winner}
            aiEvaluation={aiEval}
            advice={advice}
            onReset={resetGame}
          />

          {/* Instructions / Footer */}
          <div className="mt-8 text-sm text-gray-500 bg-[rgba(0,0,0,0.2)] p-4 rounded-xl border border-gray-800">
            <h3 className="font-bold text-gray-400 mb-2">学習のヒント:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>青い点滅枠はAIの推奨手です。</li>
              <li>置ける場所にマウスを乗せると、リアルタイムで評価理由が表示されます。</li>
              <li>右側の評価バーで、現在の有利・不利を確認できます。</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
