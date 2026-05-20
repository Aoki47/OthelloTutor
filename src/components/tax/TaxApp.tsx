"use client";

import { useState } from 'react';
import { extractTextFromPdf, parseWithholdingSlip, parsePayslip } from '@/lib/tax/pdfExtractor';
import { calculate } from '@/lib/tax/calculator';
import type { WithholdingData, PayslipData, SupplementData, CalculationResult } from '@/lib/tax/types';
import StepIndicator from './StepIndicator';
import PDFDropZone from './PDFDropZone';
import DataReview from './DataReview';
import SupplementForm from './SupplementForm';
import ReportPage from './ReportPage';

// ── Defaults ──────────────────────────────────────────────────────────────────

const defaultWithholding: WithholdingData = {
  totalIncome: 0,
  incomeAfterDeduction: 0,
  totalDeductionsSum: 0,
  withholdingTax: 0,
  socialInsurance: 0,
  lifeInsuranceDeduction: 0,
  earthquakeInsuranceDeduction: 0,
  housingLoanDeduction: 0,
  donationDeduction: 0,
  hasSpouseDeduction: false,
  dependentsCount: 0,
};

const defaultSupplement: SupplementData = {
  prefecture: '東京都',
  isOver40: false,
  hasSpouse: false,
  spouseIncome: 0,
  dependentsUnder16: 0,
  dependents16to18: 0,
  dependents19to22: 0,
  dependents70plus: 0,
  furusatoTotal: 0,
  furusatoCount: 0,
  furusatoMethod: 'onestop',
  medicalExpenses: 0,
  ideco: 0,
  housingLoanBalance: 0,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function TaxApp() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [withholdingFiles, setWithholdingFiles] = useState<File[]>([]);
  const [payslipFiles, setPayslipFiles] = useState<File[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [withholding, setWithholding] = useState<WithholdingData>(defaultWithholding);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [supplement, setSupplement] = useState<SupplementData>(defaultSupplement);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // ── Step 1 → 2: PDF extraction ──────────────────────────────────────────

  const handleExtract = async () => {
    if (withholdingFiles.length === 0) return;

    setIsExtracting(true);
    setExtractError(null);

    try {
      // Extract withholding slip
      const withholdingText = await extractTextFromPdf(withholdingFiles[0]);
      const parsedWithholding = parseWithholdingSlip(withholdingText);
      setWithholding({ ...defaultWithholding, ...parsedWithholding });

      // Extract payslips (if any)
      const parsedPayslips: PayslipData[] = [];
      for (const file of payslipFiles) {
        try {
          const text = await extractTextFromPdf(file);
          const parsed = parsePayslip(text);
          // Only include if we got at least some data
          if (parsed.yearMonth || parsed.totalGross) {
            parsedPayslips.push({
              yearMonth: parsed.yearMonth ?? '',
              totalGross: parsed.totalGross ?? 0,
              healthInsurance: parsed.healthInsurance ?? 0,
              nursingInsurance: parsed.nursingInsurance ?? 0,
              pension: parsed.pension ?? 0,
              employmentInsurance: parsed.employmentInsurance ?? 0,
              incomeTax: parsed.incomeTax ?? 0,
              residentTax: parsed.residentTax ?? 0,
              netPay: parsed.netPay ?? 0,
            });
          }
        } catch {
          // Skip failed payslip files silently
        }
      }
      setPayslips(parsedPayslips);

      setStep(2);
    } catch (err) {
      setExtractError(
        err instanceof Error
          ? `PDF読み込みエラー: ${err.message}`
          : 'PDFの読み込みに失敗しました。ファイルを確認してください。'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  // ── Step 3 → 4: Calculate ───────────────────────────────────────────────

  const handleCalculate = () => {
    const calculationResult = calculate(withholding, supplement, payslips);
    setResult(calculationResult);
    setStep(4);
  };

  // ── Reset ──────────────────────────────────────────────────────────────

  const handleReset = () => {
    setStep(1);
    setWithholdingFiles([]);
    setPayslipFiles([]);
    setIsExtracting(false);
    setWithholding(defaultWithholding);
    setPayslips([]);
    setSupplement(defaultSupplement);
    setResult(null);
    setExtractError(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white">
      {/* Header */}
      <header className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-start sm:items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              年調チェック 📋
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              年末調整PDF解析ツール（概算・参考値）
            </p>
          </div>
          {step !== 1 && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-colors flex-shrink-0"
            >
              最初からやり直す
            </button>
          )}
        </div>
      </header>

      {/* Step indicator */}
      <div className="max-w-3xl mx-auto">
        <StepIndicator currentStep={step} />
      </div>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 pb-16 space-y-6">

        {/* ── Step 1: PDF Upload ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-slate-800/70 backdrop-blur border border-slate-700/50 rounded-xl p-5 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-slate-100 mb-1">PDFファイルを読み込む</h2>
                <p className="text-xs text-slate-500">
                  源泉徴収票PDFは必須です。給料明細PDFは複数枚アップロードできます（任意）。
                </p>
              </div>

              <PDFDropZone
                label="源泉徴収票 PDF"
                accept="application/pdf"
                multiple={false}
                files={withholdingFiles}
                onFiles={setWithholdingFiles}
                optional={false}
              />

              <PDFDropZone
                label="給料明細 PDF（複数可）"
                accept="application/pdf"
                multiple={true}
                files={payslipFiles}
                onFiles={setPayslipFiles}
                optional={true}
              />
            </div>

            {/* Error message */}
            {extractError && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <span className="text-red-400 flex-shrink-0 mt-0.5">❌</span>
                <p className="text-sm text-red-300">{extractError}</p>
              </div>
            )}

            {/* Next button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleExtract}
                disabled={withholdingFiles.length === 0 || isExtracting}
                className={[
                  'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200',
                  withholdingFiles.length > 0 && !isExtracting
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed',
                ].join(' ')}
              >
                {isExtracting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    抽出中...
                  </>
                ) : (
                  <>
                    次へ
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Data Review ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-slate-100 mb-1">抽出データを確認</h2>
              <p className="text-xs text-slate-500">
                自動抽出された値を確認・修正してください。源泉徴収票の原本と照合してください。
              </p>
            </div>

            <DataReview
              withholding={withholding}
              onChange={setWithholding}
              payslips={payslips}
              isExtracting={isExtracting}
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                戻る
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200"
              >
                次へ
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Supplement Form ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-slate-100 mb-1">補足情報を入力</h2>
              <p className="text-xs text-slate-500">
                社会保険料・住民税・ふるさと納税の計算に必要な情報を入力してください。
              </p>
            </div>

            <SupplementForm data={supplement} onChange={setSupplement} />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                戻る
              </button>
              <button
                type="button"
                onClick={handleCalculate}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200"
              >
                解析する
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Report ── */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-100 mb-1">解析レポート</h2>
                <p className="text-xs text-slate-500">
                  年末調整の内容を多角的にチェックしました。
                </p>
              </div>
            </div>

            {result ? (
              <ReportPage
                result={result}
                withholding={withholding}
                supplement={supplement}
                payslips={payslips}
              />
            ) : (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-400">計算中...</p>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                最初からやり直す
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
