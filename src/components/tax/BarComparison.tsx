"use client";

import { CheckStatus } from '@/lib/tax/types';

interface Props {
  theoretical: number;
  actual: number | null;
  status: CheckStatus;
  label1?: string;
  label2?: string;
  unit?: string;
}

const fmt = (n: number) => n.toLocaleString('ja-JP');

function statusColor(status: CheckStatus): string {
  switch (status) {
    case 'ok':      return 'bg-emerald-500';
    case 'warning': return 'bg-amber-500';
    case 'error':   return 'bg-red-500';
    case 'info':    return 'bg-blue-500';
  }
}

function statusTextColor(status: CheckStatus): string {
  switch (status) {
    case 'ok':      return 'text-emerald-400';
    case 'warning': return 'text-amber-400';
    case 'error':   return 'text-red-400';
    case 'info':    return 'text-blue-400';
  }
}

export default function BarComparison({
  theoretical,
  actual,
  status,
  label1 = '理論値',
  label2 = 'あなたの額',
  unit = '円',
}: Props) {
  const maxVal = Math.max(theoretical, actual ?? 0, 1);

  const theoreticalPct = Math.min(100, (theoretical / maxVal) * 100);
  const actualPct = actual !== null ? Math.min(100, (actual / maxVal) * 100) : 0;

  const diff = actual !== null ? actual - theoretical : null;
  const diffPct = theoretical > 0 && diff !== null
    ? ((diff / theoretical) * 100)
    : null;

  const diffSign = diff !== null ? (diff >= 0 ? '+' : '') : '';

  return (
    <div className="space-y-3">
      {/* Row 1: Theoretical */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">{label1}</span>
          <span className="text-blue-300 font-mono font-medium">
            {fmt(theoretical)}{unit}
          </span>
        </div>
        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${theoreticalPct}%` }}
          />
        </div>
      </div>

      {/* Row 2: Actual */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">{label2}</span>
          {actual !== null ? (
            <span className={`font-mono font-medium ${statusTextColor(status)}`}>
              {fmt(actual)}{unit}
            </span>
          ) : (
            <span className="text-slate-500 italic text-xs">給料明細から取得</span>
          )}
        </div>
        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
          {actual !== null ? (
            <div
              className={`h-full rounded-full transition-all duration-500 ${statusColor(status)}`}
              style={{ width: `${actualPct}%` }}
            />
          ) : (
            <div className="h-full w-full bg-slate-600/30 rounded-full" />
          )}
        </div>
      </div>

      {/* Diff */}
      {diff !== null && (
        <div className={`flex items-center gap-2 text-xs ${statusTextColor(status)}`}>
          <span className="font-medium">
            差額: {diffSign}{fmt(diff)}{unit}
          </span>
          {diffPct !== null && (
            <span className="text-slate-500">
              ({diffSign}{diffPct.toFixed(1)}%)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
