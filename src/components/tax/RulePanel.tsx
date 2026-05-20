"use client";

import { useState } from 'react';
import { CalculationStep, CheckStatus } from '@/lib/tax/types';
import BarComparison from './BarComparison';

interface Props {
  title: string;
  theoreticalValue: number;
  actualValue: number | null;
  status: CheckStatus;
  steps: CalculationStep[];
  defaultOpen?: boolean;
}

const fmt = (n: number) => n.toLocaleString('ja-JP');

function statusIcon(status: CheckStatus): string {
  switch (status) {
    case 'ok':      return '✅';
    case 'warning': return '⚠️';
    case 'error':   return '❌';
    case 'info':    return 'ℹ️';
  }
}

function statusBadgeClass(status: CheckStatus): string {
  switch (status) {
    case 'ok':      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    case 'warning': return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
    case 'error':   return 'bg-red-500/15 text-red-400 border border-red-500/30';
    case 'info':    return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
  }
}

function statusLabel(status: CheckStatus): string {
  switch (status) {
    case 'ok':      return '適正';
    case 'warning': return '要確認';
    case 'error':   return '差異あり';
    case 'info':    return '参考';
  }
}

export default function RulePanel({
  title,
  theoreticalValue,
  actualValue,
  status,
  steps,
  defaultOpen = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const diff = actualValue !== null ? actualValue - theoreticalValue : null;
  const diffSign = diff !== null ? (diff >= 0 ? '+' : '') : '';

  return (
    <div className="bg-slate-800/70 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-start sm:items-center justify-between px-5 py-4 text-left hover:bg-slate-700/30 transition-colors gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-slate-100">{title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeClass(status)}`}>
              {statusIcon(status)} {statusLabel(status)}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-400 font-mono">
            <span>理論値 ¥{fmt(theoreticalValue)}</span>
            {actualValue !== null && <span>実額 ¥{fmt(actualValue)}</span>}
            {diff !== null && (
              <span className={diff === 0 ? 'text-emerald-400' : Math.abs(diff) < 5000 ? 'text-emerald-400' : 'text-amber-400'}>
                差額 {diffSign}¥{fmt(diff)}
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <div
          className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable body */}
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[9999px]' : 'max-h-0'}`}
      >
        <div className="px-5 pb-5 space-y-6 border-t border-slate-700/40 pt-4">
          {steps.map((step, idx) => (
            <div key={idx} className="space-y-3">
              {/* Step header */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-400">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-200">{step.title}</h4>
                  {step.rule && (
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.rule}</p>
                  )}
                  {step.formula && (
                    <p className="text-xs text-slate-400 font-mono bg-slate-900/50 rounded px-2 py-1.5 mt-1.5 break-all leading-relaxed">
                      {step.formula}
                    </p>
                  )}
                </div>
              </div>

              {/* Sub-items table */}
              {step.subItems && step.subItems.length > 0 && (
                <div className="ml-9">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700/40">
                        <th className="text-left text-slate-500 font-medium pb-1.5 pr-3">項目</th>
                        <th className="text-left text-slate-500 font-medium pb-1.5 pr-3">根拠</th>
                        <th className="text-right text-slate-500 font-medium pb-1.5 pr-3">理論値</th>
                        <th className="text-right text-slate-500 font-medium pb-1.5">実額</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/20">
                      {step.subItems.map((sub, si) => (
                        <tr key={si}>
                          <td className="py-1.5 pr-3 text-slate-300">{sub.label}</td>
                          <td className="py-1.5 pr-3 text-slate-500 leading-relaxed">{sub.rule}</td>
                          <td className="py-1.5 pr-3 text-right text-slate-200 font-mono">
                            ¥{fmt(sub.theoretical)}
                          </td>
                          <td className="py-1.5 text-right font-mono">
                            {sub.actual !== null ? (
                              <span className="text-slate-200">¥{fmt(sub.actual)}</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bar comparison — only if step has both theoretical and meaningful status */}
              {(step.theoreticalValue > 0 || step.actualValue !== null) && (
                <div className="ml-9 bg-slate-900/40 rounded-lg p-3">
                  <BarComparison
                    theoretical={step.theoreticalValue}
                    actual={step.actualValue}
                    status={step.status}
                  />
                </div>
              )}

              {/* Note */}
              {step.note && (
                <div className="ml-9 flex items-start gap-2 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2">
                  <span className="text-amber-400 text-xs mt-0.5 flex-shrink-0">⚠️</span>
                  <p className="text-xs text-amber-300 leading-relaxed">{step.note}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
