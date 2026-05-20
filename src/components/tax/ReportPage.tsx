"use client";

import { useRef } from 'react';
import {
  CalculationResult,
  WithholdingData,
  SupplementData,
  PayslipData,
  CheckStatus,
} from '@/lib/tax/types';
import RulePanel from './RulePanel';

interface Props {
  result: CalculationResult;
  withholding: WithholdingData;
  supplement: SupplementData;
  payslips: PayslipData[];
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

function statusTextColor(status: CheckStatus): string {
  switch (status) {
    case 'ok':      return 'text-emerald-400';
    case 'warning': return 'text-amber-400';
    case 'error':   return 'text-red-400';
    case 'info':    return 'text-blue-400';
  }
}

export default function ReportPage({ result, withholding, supplement, payslips }: Props) {
  const { summary, incomeTax, socialInsurance, residentTax, furusato, payslipConsistency } = result;

  const detailRef = useRef<HTMLDivElement>(null);

  const scrollToDetail = () => {
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const currentYear = new Date().getFullYear() - 1; // 前年分が年末調整対象

  const checkRows: Array<{
    id: string;
    label: string;
    status: CheckStatus;
    theoretical: number;
    actual: number | null;
  }> = [
    {
      id: 'income-tax',
      label: '所得税',
      status: incomeTax.status,
      theoretical: incomeTax.theoreticalValue,
      actual: incomeTax.actualValue,
    },
    {
      id: 'social',
      label: '社会保険料',
      status: socialInsurance.status,
      theoretical: socialInsurance.theoreticalValue,
      actual: socialInsurance.actualValue,
    },
    {
      id: 'resident',
      label: '住民税',
      status: residentTax.status,
      theoretical: residentTax.theoreticalValue,
      actual: residentTax.actualValue,
    },
    {
      id: 'furusato',
      label: 'ふるさと納税',
      status: furusato.status,
      theoretical: furusato.limit,
      actual: furusato.donated > 0 ? furusato.donated : null,
    },
    ...(payslipConsistency
      ? [
          {
            id: 'payslip',
            label: '給料明細整合',
            status: payslipConsistency.status,
            theoretical: withholding.totalIncome,
            actual: payslipConsistency.totalGross,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* ── サマリーカード ── */}
      <div className="bg-slate-800/70 backdrop-blur border border-slate-700/50 rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-bold text-slate-100">
            {currentYear}年分 年末調整レポート
          </h2>
          <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
            概算・参考値
          </span>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900/50 rounded-lg p-3 space-y-0.5">
            <p className="text-xs text-slate-500">年収（支払金額）</p>
            <p className="text-xl font-bold text-slate-100 font-mono">
              ¥{fmt(summary.annualIncome)}
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 space-y-0.5">
            <p className="text-xs text-slate-500">推定手取り</p>
            <p className="text-xl font-bold text-emerald-400 font-mono">
              ¥{fmt(summary.netIncome)}
            </p>
            <p className="text-xs text-slate-500">
              手取り率 {summary.burdenRate > 0 ? (100 - summary.burdenRate).toFixed(1) : '—'}%
            </p>
          </div>
          {summary.furusatoSavings > 0 && (
            <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-lg p-3 space-y-0.5">
              <p className="text-xs text-emerald-400/70">ふるさと納税節税効果</p>
              <p className="text-xl font-bold text-emerald-400 font-mono">
                ¥{fmt(summary.furusatoSavings)}
              </p>
            </div>
          )}
        </div>

        {/* Breakdown table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/40">
              <th className="text-left text-slate-500 font-medium pb-2">項目</th>
              <th className="text-right text-slate-500 font-medium pb-2">理論値</th>
              <th className="text-right text-slate-500 font-medium pb-2">負担率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/20">
            <tr>
              <td className="py-2.5 text-slate-300">所得税（復興特別所得税込）</td>
              <td className="py-2.5 text-right font-mono text-slate-200">¥{fmt(incomeTax.theoreticalValue)}</td>
              <td className="py-2.5 text-right text-slate-400 text-xs">
                {summary.annualIncome > 0 ? ((incomeTax.theoreticalValue / summary.annualIncome) * 100).toFixed(1) : '—'}%
              </td>
            </tr>
            <tr>
              <td className="py-2.5 text-slate-300">住民税</td>
              <td className="py-2.5 text-right font-mono text-slate-200">¥{fmt(residentTax.theoreticalValue)}</td>
              <td className="py-2.5 text-right text-slate-400 text-xs">
                {summary.annualIncome > 0 ? ((residentTax.theoreticalValue / summary.annualIncome) * 100).toFixed(1) : '—'}%
              </td>
            </tr>
            <tr>
              <td className="py-2.5 text-slate-300">社会保険料</td>
              <td className="py-2.5 text-right font-mono text-slate-200">¥{fmt(socialInsurance.theoreticalValue)}</td>
              <td className="py-2.5 text-right text-slate-400 text-xs">
                {summary.annualIncome > 0 ? ((socialInsurance.theoreticalValue / summary.annualIncome) * 100).toFixed(1) : '—'}%
              </td>
            </tr>
            <tr className="border-t-2 border-slate-600/50">
              <td className="py-2.5 font-semibold text-slate-200">合計負担</td>
              <td className="py-2.5 text-right font-mono font-bold text-slate-100">¥{fmt(summary.totalBurden)}</td>
              <td className="py-2.5 text-right text-slate-300 text-xs font-medium">
                {summary.burdenRate.toFixed(1)}%
              </td>
            </tr>
          </tbody>
        </table>

        {summary.residentTaxMonthly !== null && (
          <p className="text-xs text-slate-500">
            ℹ️ 住民税の月額目安: ¥{fmt(summary.residentTaxMonthly)} / 月（翌年6月から）
          </p>
        )}
      </div>

      {/* ── チェックサマリー表 ── */}
      <div className="bg-slate-800/70 backdrop-blur border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-100">チェックサマリー</h2>
          <button
            type="button"
            onClick={scrollToDetail}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            詳細へ ↓
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-slate-700/40">
                <th className="text-left text-slate-500 font-medium pb-2 pr-3">カテゴリ</th>
                <th className="text-left text-slate-500 font-medium pb-2 pr-3">ステータス</th>
                <th className="text-right text-slate-500 font-medium pb-2 pr-3">理論値</th>
                <th className="text-right text-slate-500 font-medium pb-2 pr-3">実額</th>
                <th className="text-right text-slate-500 font-medium pb-2">差額</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20">
              {checkRows.map((row) => {
                const diff = row.actual !== null ? row.actual - row.theoretical : null;
                return (
                  <tr key={row.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 pr-3 font-medium text-slate-200">{row.label}</td>
                    <td className="py-3 pr-3">
                      <span className={`text-sm ${statusTextColor(row.status)}`}>
                        {statusIcon(row.status)}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-right font-mono text-slate-300">
                      ¥{fmt(row.theoretical)}
                    </td>
                    <td className="py-3 pr-3 text-right font-mono">
                      {row.actual !== null ? (
                        <span className="text-slate-300">¥{fmt(row.actual)}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right font-mono">
                      {diff !== null ? (
                        <span className={statusTextColor(row.status)}>
                          {diff >= 0 ? '+' : ''}¥{fmt(diff)}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ルール対照パネル ── */}
      <div ref={detailRef} className="space-y-4">
        <h2 className="text-base font-bold text-slate-100 px-1">詳細計算レポート</h2>

        <RulePanel
          title="所得税チェック"
          theoreticalValue={incomeTax.theoreticalValue}
          actualValue={incomeTax.actualValue}
          status={incomeTax.status}
          steps={incomeTax.steps}
          defaultOpen={incomeTax.status !== 'ok'}
        />

        <RulePanel
          title="社会保険料チェック"
          theoreticalValue={socialInsurance.theoreticalValue}
          actualValue={socialInsurance.actualValue}
          status={socialInsurance.status}
          steps={socialInsurance.steps}
          defaultOpen={socialInsurance.status !== 'ok'}
        />

        <RulePanel
          title="住民税チェック"
          theoreticalValue={residentTax.theoreticalValue}
          actualValue={residentTax.actualValue}
          status={residentTax.status}
          steps={residentTax.steps}
          defaultOpen={residentTax.status !== 'ok' && residentTax.status !== 'info'}
        />

        <RulePanel
          title="ふるさと納税 上限チェック"
          theoreticalValue={furusato.limit}
          actualValue={furusato.donated > 0 ? furusato.donated : null}
          status={furusato.status}
          steps={furusato.steps}
          defaultOpen={furusato.status !== 'ok' && furusato.status !== 'info'}
        />

        {payslipConsistency && (
          <div className="bg-slate-800/70 backdrop-blur border border-slate-700/50 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-base font-semibold text-slate-100">給料明細整合チェック</h3>
              <span className={`text-sm ${statusTextColor(payslipConsistency.status)}`}>
                {statusIcon(payslipConsistency.status)}
              </span>
            </div>

            <p className="text-sm text-slate-400">{payslipConsistency.note}</p>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/40">
                  <th className="text-left text-slate-500 font-medium pb-2">項目</th>
                  <th className="text-right text-slate-500 font-medium pb-2">明細合計</th>
                  <th className="text-right text-slate-500 font-medium pb-2">源泉徴収票</th>
                  <th className="text-right text-slate-500 font-medium pb-2">差額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                <tr>
                  <td className="py-2.5 text-slate-300">総支給額</td>
                  <td className="py-2.5 text-right font-mono text-slate-200">¥{fmt(payslipConsistency.totalGross)}</td>
                  <td className="py-2.5 text-right font-mono text-slate-200">¥{fmt(withholding.totalIncome)}</td>
                  <td className={`py-2.5 text-right font-mono ${Math.abs(payslipConsistency.grossDiff) < 50000 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {payslipConsistency.grossDiff >= 0 ? '+' : ''}¥{fmt(payslipConsistency.grossDiff)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-300">源泉所得税</td>
                  <td className="py-2.5 text-right font-mono text-slate-200">¥{fmt(payslipConsistency.totalIncomeTax)}</td>
                  <td className="py-2.5 text-right font-mono text-slate-200">¥{fmt(withholding.withholdingTax)}</td>
                  <td className={`py-2.5 text-right font-mono ${Math.abs(payslipConsistency.incomeTaxDiff) < 10000 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {payslipConsistency.incomeTaxDiff >= 0 ? '+' : ''}¥{fmt(payslipConsistency.incomeTaxDiff)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-300">社会保険料</td>
                  <td className="py-2.5 text-right font-mono text-slate-200">¥{fmt(payslipConsistency.totalSocialInsurance)}</td>
                  <td className="py-2.5 text-right font-mono text-slate-200">¥{fmt(withholding.socialInsurance)}</td>
                  <td className={`py-2.5 text-right font-mono ${Math.abs(payslipConsistency.socialInsuranceDiff) < 10000 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {payslipConsistency.socialInsuranceDiff >= 0 ? '+' : ''}¥{fmt(payslipConsistency.socialInsuranceDiff)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-300">住民税（給料明細合計）</td>
                  <td className="py-2.5 text-right font-mono text-slate-200">¥{fmt(payslipConsistency.totalResidentTax)}</td>
                  <td className="py-2.5 text-right text-slate-600">—</td>
                  <td className="py-2.5 text-right text-slate-600">—</td>
                </tr>
              </tbody>
            </table>

            <p className="text-xs text-slate-500">
              * {payslips.length}ヶ月分の給料明細を集計しました。賞与や年末調整還付金が含まれる場合は差異が生じることがあります。
            </p>
          </div>
        )}
      </div>

      {/* ── 免責事項 ── */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          ⚠️ 本レポートは概算・参考値です。実際の税額は給与形態・各種控除の詳細・端数処理等により異なる場合があります。
          正確な税額は税務署または税理士にご相談ください。
        </p>
      </div>
    </div>
  );
}
