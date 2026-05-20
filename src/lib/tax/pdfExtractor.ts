/**
 * PDF Extractor — 源泉徴収票・給料明細のテキスト抽出とパース
 *
 * サーバー / クライアント共用ライブラリ（"use client" 不要）。
 * pdfjs-dist を動的 import することで、Next.js の SSR/SSG でも動作する。
 */

import type { WithholdingData, PayslipData } from './types';

// ---------------------------------------------------------------------------
// PDF テキスト抽出
// ---------------------------------------------------------------------------

/**
 * PDF ファイルからすべてのページのテキストを抽出して連結した文字列を返す。
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  // Dynamic import — SSR 環境では node-compatible build を使う
  const pdfjs = await import('pdfjs-dist');
  const { GlobalWorkerOptions, getDocument, version } = pdfjs;

  // Worker の設定（ブラウザ用 CDN）
  GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => {
        // TextItem には str プロパティがある
        if ('str' in item) return (item as { str: string }).str;
        return '';
      })
      .join(' ');
    pageTexts.push(pageText);
  }

  return pageTexts.join('\n');
}

// ---------------------------------------------------------------------------
// ユーティリティ
// ---------------------------------------------------------------------------

/**
 * テキストからキーワードの後に続く数値を抽出する。
 * 全角数字・カンマ区切りに対応。
 */
function extractNumberAfterKeyword(text: string, keyword: string): number | undefined {
  // キーワードの直後、数十文字以内に出現する数字列を取得
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escaped}[^\\d０-９]*([０-９\\d][０-９\\d,，、 　]*)`, 'u');
  const match = text.match(pattern);
  if (!match) return undefined;

  const rawNum = match[1]
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)) // 全角→半角
    .replace(/[,，、 　]/g, ''); // 区切り文字を除去

  const value = parseInt(rawNum, 10);
  return isNaN(value) ? undefined : value;
}

/**
 * 複数のキーワード候補から最初にマッチした数値を返す。
 */
function extractFirst(text: string, keywords: string[]): number | undefined {
  for (const kw of keywords) {
    const val = extractNumberAfterKeyword(text, kw);
    if (val !== undefined) return val;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// 源泉徴収票のパース
// ---------------------------------------------------------------------------

/**
 * 源泉徴収票 PDF から抽出したテキストを解析して WithholdingData の部分オブジェクトを返す。
 * 見つからなかったフィールドは省略される（Partial）。
 */
export function parseWithholdingSlip(text: string): Partial<WithholdingData> {
  const result: Partial<WithholdingData> = {};

  // 支払金額（年収）
  const totalIncome = extractFirst(text, [
    '支払金額',
    '給与・賞与',
    '給与賞与',
    '支払い金額',
  ]);
  if (totalIncome !== undefined) result.totalIncome = totalIncome;

  // 給与所得控除後の金額
  const incomeAfterDeduction = extractFirst(text, [
    '給与所得控除後の金額',
    '控除後の金額',
    '所得控除後',
  ]);
  if (incomeAfterDeduction !== undefined) result.incomeAfterDeduction = incomeAfterDeduction;

  // 所得控除の合計
  const totalDeductionsSum = extractFirst(text, [
    '所得控除の合計額',
    '所得控除額の合計額',
    '控除の合計額',
  ]);
  if (totalDeductionsSum !== undefined) result.totalDeductionsSum = totalDeductionsSum;

  // 源泉徴収税額（所得税）
  const withholdingTax = extractFirst(text, [
    '源泉徴収税額',
    '徴収税額',
    '源泉所得税',
  ]);
  if (withholdingTax !== undefined) result.withholdingTax = withholdingTax;

  // 社会保険料等の金額
  const socialInsurance = extractFirst(text, [
    '社会保険料等の金額',
    '社会保険料の金額',
    '社会保険料等',
    '社会保険料合計',
  ]);
  if (socialInsurance !== undefined) result.socialInsurance = socialInsurance;

  // 生命保険料の控除額
  const lifeInsuranceDeduction = extractFirst(text, [
    '生命保険料の控除額',
    '生命保険料控除額',
    '生命保険料控除',
  ]);
  if (lifeInsuranceDeduction !== undefined) result.lifeInsuranceDeduction = lifeInsuranceDeduction;

  // 地震保険料の控除額
  const earthquakeInsuranceDeduction = extractFirst(text, [
    '地震保険料の控除額',
    '地震保険料控除額',
    '地震保険料控除',
    '損害保険料控除',
  ]);
  if (earthquakeInsuranceDeduction !== undefined)
    result.earthquakeInsuranceDeduction = earthquakeInsuranceDeduction;

  // 住宅借入金等特別控除の額
  const housingLoanDeduction = extractFirst(text, [
    '住宅借入金等特別控除の額',
    '住宅借入金等特別控除額',
    '住宅ローン控除',
    '住宅借入金控除',
  ]);
  if (housingLoanDeduction !== undefined) result.housingLoanDeduction = housingLoanDeduction;

  // 寄附金控除（ふるさと納税 確定申告）
  const donationDeduction = extractFirst(text, [
    '寄附金控除の額',
    '寄附金控除額',
    '寄附金控除',
    '寄付金控除',
  ]);
  if (donationDeduction !== undefined) result.donationDeduction = donationDeduction;

  // 配偶者控除の有無（キーワードの存在で判定）
  const hasSpouseDeduction =
    /配偶者（特別）?控除|配偶者控除/.test(text) &&
    !/配偶者控除[^\d]*[なし無０0]/.test(text);
  result.hasSpouseDeduction = hasSpouseDeduction;

  // 扶養親族の数
  const dependentsMatch = text.match(/扶養親族[のの数]?[^\d]*(\d+)\s*人/);
  if (dependentsMatch) {
    result.dependentsCount = parseInt(dependentsMatch[1], 10);
  }

  return result;
}

// ---------------------------------------------------------------------------
// 給料明細のパース
// ---------------------------------------------------------------------------

/**
 * 給料明細 PDF から抽出したテキストを解析して PayslipData の部分オブジェクトを返す。
 */
export function parsePayslip(text: string): Partial<PayslipData> {
  const result: Partial<PayslipData> = {};

  // -----------------------------------------------------------------------
  // 年月の検出
  // -----------------------------------------------------------------------
  // "2024年10月" / "2024/10" / "202410" 等のパターン
  const yearMonthPatterns = [
    /(\d{4})[年/](\d{1,2})[月/]?(?:分|度|給|明)?/,
    /(\d{4})[-－](\d{2})/,
    /令和(\d{1,2})年(\d{1,2})月/,
  ];

  for (const pattern of yearMonthPatterns) {
    const m = text.match(pattern);
    if (m) {
      let year: number;
      let month: number;

      if (pattern.source.startsWith('令和')) {
        // 令和 → 西暦変換（令和1年 = 2019年）
        year = 2018 + parseInt(m[1], 10);
        month = parseInt(m[2], 10);
      } else {
        year = parseInt(m[1], 10);
        month = parseInt(m[2], 10);
      }

      if (year >= 2000 && year <= 2099 && month >= 1 && month <= 12) {
        result.yearMonth = `${year}-${String(month).padStart(2, '0')}`;
        break;
      }
    }
  }

  // -----------------------------------------------------------------------
  // 支給額・控除額の抽出
  // -----------------------------------------------------------------------

  // 総支給額 / 総支給金額
  const totalGross = extractFirst(text, [
    '総支給額',
    '総支給金額',
    '支給合計',
    '支給総額',
    '総額',
  ]);
  if (totalGross !== undefined) result.totalGross = totalGross;

  // 健康保険料
  const healthInsurance = extractFirst(text, [
    '健康保険料',
    '健保料',
    '健康保険',
  ]);
  if (healthInsurance !== undefined) result.healthInsurance = healthInsurance;

  // 介護保険料
  const nursingInsurance = extractFirst(text, [
    '介護保険料',
    '介護保険',
    '介護料',
  ]);
  if (nursingInsurance !== undefined) result.nursingInsurance = nursingInsurance;

  // 厚生年金保険料
  const pension = extractFirst(text, [
    '厚生年金保険料',
    '厚生年金',
    '年金保険料',
  ]);
  if (pension !== undefined) result.pension = pension;

  // 雇用保険料
  const employmentInsurance = extractFirst(text, [
    '雇用保険料',
    '雇用保険',
    '失業保険',
  ]);
  if (employmentInsurance !== undefined) result.employmentInsurance = employmentInsurance;

  // 所得税 / 源泉所得税
  const incomeTax = extractFirst(text, [
    '所得税',
    '源泉所得税',
    '源泉徴収税',
    '徴収税額',
  ]);
  if (incomeTax !== undefined) result.incomeTax = incomeTax;

  // 住民税
  const residentTax = extractFirst(text, [
    '住民税',
    '市民税',
    '市区町村民税',
    '都民税',
    '道府県民税',
  ]);
  if (residentTax !== undefined) result.residentTax = residentTax;

  // 差引支給額 / 手取り額
  const netPay = extractFirst(text, [
    '差引支給額',
    '手取り額',
    '手取額',
    '振込金額',
    '差引額',
    '実支給額',
    '口座振込額',
  ]);
  if (netPay !== undefined) result.netPay = netPay;

  return result;
}

// ---------------------------------------------------------------------------
// ドキュメントタイプの判定
// ---------------------------------------------------------------------------

/**
 * テキストからドキュメントの種別を判定する。
 */
export function detectDocumentType(
  text: string,
): 'withholding' | 'payslip' | 'taxreturn' | 'unknown' {
  // 源泉徴収票の判定（優先度: 高）
  if (/給与所得の源泉徴収票|源泉徴収票/.test(text)) {
    return 'withholding';
  }

  // 確定申告書の判定
  if (/確定申告書|申告書[AB第]|所得税及び復興特別所得税の確定申告/.test(text)) {
    return 'taxreturn';
  }

  // 給料明細の判定（社会保険料の項目が複数あれば明細と判定）
  const payslipKeywords = [
    '給与明細',
    '支給明細',
    '給料明細',
    '厚生年金保険料',
    '雇用保険料',
    '控除合計',
    '総支給額',
    '差引支給額',
  ];
  const payslipMatchCount = payslipKeywords.filter((kw) => text.includes(kw)).length;
  if (payslipMatchCount >= 2) {
    return 'payslip';
  }

  return 'unknown';
}
