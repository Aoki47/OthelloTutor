"use client";

import { WithholdingData, PayslipData } from '@/lib/tax/types';

interface Props {
  withholding: WithholdingData;
  onChange: (w: WithholdingData) => void;
  payslips: PayslipData[];
  isExtracting: boolean;
}

const fmt = (n: number) => n.toLocaleString('ja-JP');

interface FieldDef {
  key: keyof WithholdingData;
  label: string;
  type: 'number' | 'boolean' | 'integer';
}

const NUMBER_FIELDS: FieldDef[] = [
  { key: 'totalIncome', label: '支払金額（年収）', type: 'number' },
  { key: 'incomeAfterDeduction', label: '給与所得控除後の金額', type: 'number' },
  { key: 'totalDeductionsSum', label: '所得控除の額の合計額', type: 'number' },
  { key: 'withholdingTax', label: '源泉徴収税額', type: 'number' },
  { key: 'socialInsurance', label: '社会保険料等の金額', type: 'number' },
  { key: 'lifeInsuranceDeduction', label: '生命保険料の控除額', type: 'number' },
  { key: 'earthquakeInsuranceDeduction', label: '地震保険料の控除額', type: 'number' },
  { key: 'housingLoanDeduction', label: '住宅借入金等特別控除の額', type: 'number' },
  { key: 'donationDeduction', label: '寄附金控除の額', type: 'number' },
];

function NumberField({
  label,
  value,
  onChange,
  isExtracting,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  isExtracting: boolean;
}) {
  const isAutoFilled = value !== 0;

  return (
    <div className="grid grid-cols-2 gap-3 items-center py-3 border-b border-slate-700/40 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-300">{label}</span>
        {isAutoFilled && !isExtracting && (
          <span className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">自動</span>
        )}
      </div>
      <div className="relative">
        <input
          type="number"
          value={value === 0 ? '' : value}
          placeholder="0"
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value || '0', 10)))}
          className="w-full bg-slate-900/60 border border-slate-600/60 rounded-lg px-3 py-2 text-right text-sm text-slate-100 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-colors"
          disabled={isExtracting}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
          円
        </span>
      </div>
    </div>
  );
}

export default function DataReview({ withholding, onChange, payslips, isExtracting }: Props) {
  // Payslip aggregates
  const payslipSummary = payslips.length > 0
    ? payslips.reduce(
        (acc, p) => ({
          totalGross: acc.totalGross + p.totalGross,
          totalIncomeTax: acc.totalIncomeTax + p.incomeTax,
          totalSocialInsurance:
            acc.totalSocialInsurance +
            p.healthInsurance +
            p.nursingInsurance +
            p.pension +
            p.employmentInsurance,
          totalResidentTax: acc.totalResidentTax + p.residentTax,
        }),
        { totalGross: 0, totalIncomeTax: 0, totalSocialInsurance: 0, totalResidentTax: 0 }
      )
    : null;

  const update = (key: keyof WithholdingData, value: number | boolean) => {
    onChange({ ...withholding, [key]: value });
  };

  return (
    <div className="space-y-6">
      {isExtracting && (
        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-blue-300">PDFからデータを抽出中...</span>
        </div>
      )}

      {/* Withholding slip fields */}
      <div className="bg-slate-800/70 backdrop-blur border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <span className="text-blue-400">📄</span>
          源泉徴収票データ
        </h3>

        <div>
          {NUMBER_FIELDS.map((field) => (
            <NumberField
              key={field.key}
              label={field.label}
              value={withholding[field.key] as number}
              onChange={(v) => update(field.key, v)}
              isExtracting={isExtracting}
            />
          ))}

          {/* Spouse deduction checkbox */}
          <div className="flex items-center justify-between py-3 border-b border-slate-700/40">
            <span className="text-sm text-slate-300">配偶者控除</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={withholding.hasSpouseDeduction}
                onChange={(e) => update('hasSpouseDeduction', e.target.checked)}
                disabled={isExtracting}
                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500/20"
              />
              <span className="text-sm text-slate-400">あり</span>
            </label>
          </div>

          {/* Dependents count */}
          <div className="grid grid-cols-2 gap-3 items-center py-3">
            <span className="text-sm text-slate-300">扶養親族の数</span>
            <input
              type="number"
              min={0}
              max={20}
              value={withholding.dependentsCount}
              onChange={(e) => update('dependentsCount', Math.max(0, parseInt(e.target.value || '0', 10)))}
              disabled={isExtracting}
              className="w-full bg-slate-900/60 border border-slate-600/60 rounded-lg px-3 py-2 text-right text-sm text-slate-100 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Payslip summary table */}
      {payslipSummary && (
        <div className="bg-slate-800/70 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-emerald-400">📊</span>
            給料明細集計
            <span className="text-xs text-slate-500 font-normal ml-1">
              ({payslips.length}ヶ月分)
            </span>
          </h3>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40">
                <th className="text-left text-slate-400 font-medium pb-2">項目</th>
                <th className="text-right text-slate-400 font-medium pb-2">合計額</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              <tr>
                <td className="py-2.5 text-slate-300">総支給額（年間）</td>
                <td className="py-2.5 text-right text-slate-100 font-mono">
                  ¥{fmt(payslipSummary.totalGross)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 text-slate-300">源泉所得税（年間）</td>
                <td className="py-2.5 text-right text-slate-100 font-mono">
                  ¥{fmt(payslipSummary.totalIncomeTax)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 text-slate-300">社会保険料（年間）</td>
                <td className="py-2.5 text-right text-slate-100 font-mono">
                  ¥{fmt(payslipSummary.totalSocialInsurance)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 text-slate-300">住民税（年間）</td>
                <td className="py-2.5 text-right text-slate-100 font-mono">
                  ¥{fmt(payslipSummary.totalResidentTax)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-slate-500 text-center">
        ℹ️ 自動抽出された値は概算です。源泉徴収票の原本と照合してご確認ください。
      </p>
    </div>
  );
}
