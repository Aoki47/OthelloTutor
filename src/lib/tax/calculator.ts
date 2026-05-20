import type {
  WithholdingData,
  SupplementData,
  PayslipData,
  CheckStatus,
  CalculationStep,
  IncomeTaxResult,
  SocialInsuranceResult,
  ResidentTaxResult,
  FurusatoResult,
  PayslipConsistencyResult,
  CalculationResult,
} from './types';

import {
  PREFECTURE_HEALTH_RATES,
  NURSING_INSURANCE_RATE,
  PENSION_RATE_EMPLOYEE,
  EMPLOYMENT_INSURANCE_RATE,
  PENSION_GRADE_TABLE,
  HEALTH_GRADE_TABLE,
  INCOME_TAX_BRACKETS,
  SALARY_INCOME_DEDUCTION_TABLE,
} from './constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Round down to the nearest `unit`. Defaults to 1 (floor). */
function floorTo(value: number, unit = 1): number {
  return Math.floor(value / unit) * unit;
}

function absDiff(a: number, b: number): number {
  return Math.abs(a - b);
}

function diffPct(theoretical: number, actual: number): number {
  if (theoretical === 0) return actual === 0 ? 0 : Infinity;
  return ((actual - theoretical) / theoretical) * 100;
}

// ---------------------------------------------------------------------------
// 1. 給与所得控除の計算
// ---------------------------------------------------------------------------

/**
 * 給与所得控除額を計算する（令和2年分以降・2024年度速算表）。
 * @param income  給与の収入金額（円）
 * @returns       控除額（円）
 */
export function calcSalaryIncomeDeduction(income: number): number {
  for (const row of SALARY_INCOME_DEDUCTION_TABLE) {
    const inRange =
      income >= row.minIncome &&
      (row.maxIncome === null || income <= row.maxIncome);
    if (inRange) {
      const deduction = income * row.rate + row.fixed;
      if (row.cap !== null) return Math.min(deduction, row.cap);
      return deduction;
    }
  }
  // fallback: uppermost cap
  return 1950000;
}

// ---------------------------------------------------------------------------
// 2. 標準報酬月額の決定
// ---------------------------------------------------------------------------

/**
 * 等級表から標準報酬月額を返す。
 * @param monthlyAvg  月平均報酬（円）
 * @param table       PENSION_GRADE_TABLE または HEALTH_GRADE_TABLE
 */
export function getStandardMonthlyRemuneration(
  monthlyAvg: number,
  table: typeof PENSION_GRADE_TABLE,
): number {
  // 上限等級から探す（upperBound === null が最高等級）
  for (let i = table.length - 1; i >= 0; i--) {
    const row = table[i];
    if (monthlyAvg >= row.lowerBound) {
      return row.standard;
    }
  }
  return table[0].standard;
}

// ---------------------------------------------------------------------------
// 所得税速算表の適用
// ---------------------------------------------------------------------------

function applyIncomeTaxBracket(taxableIncome: number): {
  tax: number;
  rate: number;
  deduction: number;
} {
  for (let i = INCOME_TAX_BRACKETS.length - 1; i >= 0; i--) {
    const b = INCOME_TAX_BRACKETS[i];
    if (taxableIncome >= b.min) {
      const tax = taxableIncome * b.rate - b.deduction;
      return { tax: Math.max(0, tax), rate: b.rate, deduction: b.deduction };
    }
  }
  return { tax: 0, rate: 0.05, deduction: 0 };
}

// ---------------------------------------------------------------------------
// 3. 所得税の計算
// ---------------------------------------------------------------------------

/**
 * 配偶者控除・配偶者特別控除額を返す（所得税用）。
 * hasSpouse=true かつ spouseIncome 基準で判定。
 */
function calcSpouseDeductionIncomeTax(s: SupplementData): number {
  if (!s.hasSpouse) return 0;
  if (s.spouseIncome <= 1030000) {
    return 380000; // 配偶者控除
  }
  if (s.spouseIncome <= 2010000) {
    // 配偶者特別控除: 380000〜0 を線形補間（簡易）
    const ratio = (s.spouseIncome - 1030000) / (2010000 - 1030000);
    return Math.round(380000 * (1 - ratio));
  }
  return 0;
}

/**
 * 医療費控除額を計算する。
 * 控除額 = 医療費 - min(総所得金額等×5%, 100000)
 */
function calcMedicalDeduction(salaryIncome: number, medicalExpenses: number): number {
  if (medicalExpenses <= 0) return 0;
  const threshold = Math.min(salaryIncome * 0.05, 100000);
  return Math.max(0, medicalExpenses - threshold);
}

/**
 * 所得税の理論値計算。
 */
export function calcIncomeTax(w: WithholdingData, s: SupplementData): IncomeTaxResult {
  const steps: CalculationStep[] = [];

  // -----------------------------------------------------------------------
  // Step 1: 給与所得控除 → 給与所得（salaryIncome）
  // -----------------------------------------------------------------------
  const salaryIncomeDeduction = calcSalaryIncomeDeduction(w.totalIncome);
  const salaryIncome = w.totalIncome - salaryIncomeDeduction;

  steps.push({
    title: '給与所得控除',
    rule: '給与所得控除額の速算表（令和2年分以降）',
    formula: `${w.totalIncome.toLocaleString()} - ${salaryIncomeDeduction.toLocaleString()} = ${salaryIncome.toLocaleString()}`,
    theoreticalValue: salaryIncome,
    actualValue: w.incomeAfterDeduction > 0 ? w.incomeAfterDeduction : null,
    status: w.incomeAfterDeduction > 0
      ? absDiff(salaryIncome, w.incomeAfterDeduction) <= 5000 ? 'ok' : 'warning'
      : 'info',
  });

  // -----------------------------------------------------------------------
  // Step 2: 所得控除の積み上げ
  // -----------------------------------------------------------------------
  const basicDeduction = 480000; // 基礎控除（所得2400万以下）
  const socialInsuranceDeduction = w.socialInsurance; // 社会保険料控除（全額）
  const spouseDeduction = calcSpouseDeductionIncomeTax(s);
  // 扶養控除: 一般16〜18=38万, 特定19〜22=63万, 老人70+=48万
  const dependentDeduction =
    s.dependents16to18 * 380000 +
    s.dependents19to22 * 630000 +
    s.dependents70plus * 480000;
  const lifeInsDeduction = w.lifeInsuranceDeduction;
  const earthquakeInsDeduction = w.earthquakeInsuranceDeduction;
  const idecoDeduction = s.ideco;
  const medicalDeduction = calcMedicalDeduction(salaryIncome, s.medicalExpenses);

  const totalDeductions =
    basicDeduction +
    socialInsuranceDeduction +
    spouseDeduction +
    dependentDeduction +
    lifeInsDeduction +
    earthquakeInsDeduction +
    idecoDeduction +
    medicalDeduction;

  const subItems: CalculationStep['subItems'] = [
    {
      label: '基礎控除',
      rule: '所得2400万以下 → 48万円',
      theoretical: basicDeduction,
      actual: null,
    },
    {
      label: '社会保険料控除',
      rule: '支払額全額',
      theoretical: socialInsuranceDeduction,
      actual: w.socialInsurance,
    },
    {
      label: '配偶者控除・配偶者特別控除',
      rule: '配偶者収入103万以下→38万, 以上〜201万→線形補間',
      theoretical: spouseDeduction,
      actual: null,
    },
    {
      label: '扶養控除',
      rule: '16〜18歳×38万 + 19〜22歳×63万 + 70歳以上×48万',
      theoretical: dependentDeduction,
      actual: null,
    },
    {
      label: '生命保険料控除',
      rule: '源泉徴収票記載額',
      theoretical: lifeInsDeduction,
      actual: w.lifeInsuranceDeduction,
    },
    {
      label: '地震保険料控除',
      rule: '源泉徴収票記載額',
      theoretical: earthquakeInsDeduction,
      actual: w.earthquakeInsuranceDeduction,
    },
    {
      label: 'iDeCo（小規模企業共済等掛金控除）',
      rule: '掛金全額',
      theoretical: idecoDeduction,
      actual: null,
    },
    {
      label: '医療費控除',
      rule: '医療費 - min(所得×5%, 10万)',
      theoretical: medicalDeduction,
      actual: null,
    },
  ];

  steps.push({
    title: '所得控除の積み上げ',
    rule: '各控除を合計する',
    formula: `基礎控除${basicDeduction.toLocaleString()} + 社保${socialInsuranceDeduction.toLocaleString()} + 配偶者${spouseDeduction.toLocaleString()} + 扶養${dependentDeduction.toLocaleString()} + 生保${lifeInsDeduction.toLocaleString()} + 地震${earthquakeInsDeduction.toLocaleString()} + iDeCo${idecoDeduction.toLocaleString()} + 医療費${medicalDeduction.toLocaleString()} = ${totalDeductions.toLocaleString()}`,
    theoreticalValue: totalDeductions,
    actualValue: w.totalDeductionsSum > 0 ? w.totalDeductionsSum : null,
    status: 'info',
    subItems,
  });

  // -----------------------------------------------------------------------
  // Step 3: 課税所得（1000円未満切捨て）
  // -----------------------------------------------------------------------
  const taxableIncomeRaw = salaryIncome - totalDeductions;
  const taxableIncome = floorTo(Math.max(0, taxableIncomeRaw), 1000);

  steps.push({
    title: '課税所得の計算',
    rule: '給与所得 - 所得控除合計（1000円未満切捨て）',
    formula: `${salaryIncome.toLocaleString()} - ${totalDeductions.toLocaleString()} = ${taxableIncomeRaw.toLocaleString()} → 切捨て: ${taxableIncome.toLocaleString()}`,
    theoreticalValue: taxableIncome,
    actualValue: null,
    status: 'info',
  });

  // -----------------------------------------------------------------------
  // Step 4: 所得税率の適用（復興特別所得税 2.1% 込み）
  // -----------------------------------------------------------------------
  const { tax: baseTax, rate: taxBracketRate } = applyIncomeTaxBracket(taxableIncome);
  const incomeTaxWithReconstruction = Math.floor(baseTax * 1.021);

  steps.push({
    title: '所得税の計算（復興特別所得税込み）',
    rule: `速算表適用: 税率${(taxBracketRate * 100).toFixed(0)}%、復興特別所得税2.1%加算`,
    formula: `課税所得${taxableIncome.toLocaleString()} × ${taxBracketRate} - 控除 → 基本税額${baseTax.toLocaleString()} × 1.021 = ${incomeTaxWithReconstruction.toLocaleString()}`,
    theoreticalValue: incomeTaxWithReconstruction,
    actualValue: null,
    status: 'info',
  });

  // -----------------------------------------------------------------------
  // Step 5: 税額控除（住宅借入金等特別控除）
  // -----------------------------------------------------------------------
  const housingLoanCredit = w.housingLoanDeduction;
  const taxAfterHousingCredit = Math.max(0, incomeTaxWithReconstruction - housingLoanCredit);

  steps.push({
    title: '住宅借入金等特別控除',
    rule: '住宅ローン控除を税額から直接差し引く',
    formula: `${incomeTaxWithReconstruction.toLocaleString()} - ${housingLoanCredit.toLocaleString()} = ${taxAfterHousingCredit.toLocaleString()}`,
    theoreticalValue: taxAfterHousingCredit,
    actualValue: null,
    status: 'info',
  });

  // -----------------------------------------------------------------------
  // Step 6: 最終比較
  // -----------------------------------------------------------------------
  const theoreticalValue = taxAfterHousingCredit;
  const actualValue = w.withholdingTax;
  const diff = actualValue - theoreticalValue;
  const diffPctValue = diffPct(theoreticalValue, actualValue);

  let finalStatus: CheckStatus;
  if (absDiff(theoreticalValue, actualValue) <= 5000) {
    finalStatus = 'ok';
  } else if (absDiff(theoreticalValue, actualValue) <= 50000) {
    finalStatus = 'warning';
  } else {
    finalStatus = 'error';
  }

  steps.push({
    title: '最終比較（源泉徴収税額）',
    rule: '理論値と源泉徴収票の差異が±5000円以内であれば適正',
    formula: `理論値 ${theoreticalValue.toLocaleString()} vs 実際 ${actualValue.toLocaleString()} → 差額 ${diff.toLocaleString()}`,
    theoreticalValue,
    actualValue,
    status: finalStatus,
    note:
      finalStatus === 'ok'
        ? '理論値と一致しています'
        : finalStatus === 'warning'
        ? '若干の差異があります（年末調整の端数処理等による可能性）'
        : '大きな差異があります。内容を確認してください',
  });

  return {
    theoreticalValue,
    actualValue,
    diff,
    diffPct: diffPctValue,
    status: finalStatus,
    steps,
    salaryIncomeDeduction,
    salaryIncome,
    taxableIncome,
    taxBracketRate,
  };
}

// ---------------------------------------------------------------------------
// 4. 社会保険料の計算
// ---------------------------------------------------------------------------

export function calcSocialInsurance(
  w: WithholdingData,
  s: SupplementData,
): SocialInsuranceResult {
  const steps: CalculationStep[] = [];

  // -----------------------------------------------------------------------
  // Step 1: 標準報酬月額の決定
  // -----------------------------------------------------------------------
  const monthlyAvg = w.totalIncome / 12;
  const standardMonthlyRemuneration = getStandardMonthlyRemuneration(
    monthlyAvg,
    HEALTH_GRADE_TABLE,
  );
  const standardPension = getStandardMonthlyRemuneration(monthlyAvg, PENSION_GRADE_TABLE);

  steps.push({
    title: '標準報酬月額の決定',
    rule: '年収÷12を健康保険等級表に当てはめる',
    formula: `年収${w.totalIncome.toLocaleString()} ÷ 12 = ${Math.round(monthlyAvg).toLocaleString()} → 健保標準${standardMonthlyRemuneration.toLocaleString()} / 厚年標準${standardPension.toLocaleString()}`,
    theoreticalValue: standardMonthlyRemuneration,
    actualValue: null,
    status: 'info',
  });

  // -----------------------------------------------------------------------
  // Step 2: 健康保険料（+ 介護保険料）
  // -----------------------------------------------------------------------
  const healthRate = PREFECTURE_HEALTH_RATES[s.prefecture] ?? 9.98; // fallback: 東京
  const healthMonthly = Math.floor(standardMonthlyRemuneration * (healthRate / 100) / 2);
  let nursingMonthly = 0;
  if (s.isOver40) {
    nursingMonthly = Math.floor(
      standardMonthlyRemuneration * (NURSING_INSURANCE_RATE / 100) / 2,
    );
  }
  const healthAnnual = healthMonthly * 12;
  const nursingAnnual = nursingMonthly * 12;
  const healthTheoretical = healthAnnual + nursingAnnual;

  steps.push({
    title: '健康保険料（介護保険料含む）',
    rule: `${s.prefecture}の料率${healthRate}%（本人負担÷2）、40歳以上は介護保険${NURSING_INSURANCE_RATE}%加算`,
    formula: `標準${standardMonthlyRemuneration.toLocaleString()} × ${healthRate / 2}% × 12${s.isOver40 ? ` + 介護${nursingAnnual.toLocaleString()}` : ''} = ${healthTheoretical.toLocaleString()}`,
    theoreticalValue: healthTheoretical,
    actualValue: null,
    status: 'info',
  });

  // -----------------------------------------------------------------------
  // Step 3: 厚生年金保険料
  // -----------------------------------------------------------------------
  const pensionMonthly = Math.floor(standardPension * (PENSION_RATE_EMPLOYEE / 100));
  const pensionTheoretical = pensionMonthly * 12;

  steps.push({
    title: '厚生年金保険料',
    rule: `厚生年金等級表 × ${PENSION_RATE_EMPLOYEE}%（本人負担）× 12ヶ月`,
    formula: `標準${standardPension.toLocaleString()} × ${PENSION_RATE_EMPLOYEE}% × 12 = ${pensionTheoretical.toLocaleString()}`,
    theoreticalValue: pensionTheoretical,
    actualValue: null,
    status: 'info',
  });

  // -----------------------------------------------------------------------
  // Step 4: 雇用保険料
  // -----------------------------------------------------------------------
  const employmentTheoretical = Math.floor(w.totalIncome * (EMPLOYMENT_INSURANCE_RATE / 100));

  steps.push({
    title: '雇用保険料',
    rule: `年収 × ${EMPLOYMENT_INSURANCE_RATE}%（一般労働者本人負担）`,
    formula: `${w.totalIncome.toLocaleString()} × ${EMPLOYMENT_INSURANCE_RATE}% = ${employmentTheoretical.toLocaleString()}`,
    theoreticalValue: employmentTheoretical,
    actualValue: null,
    status: 'info',
  });

  // -----------------------------------------------------------------------
  // Step 5: 合計比較
  // -----------------------------------------------------------------------
  const theoreticalValue = healthTheoretical + pensionTheoretical + employmentTheoretical;
  const actualValue = w.socialInsurance;
  const diff = actualValue - theoreticalValue;
  const diffPctValue = diffPct(theoreticalValue, actualValue);

  let finalStatus: CheckStatus;
  const absDiffRatio = theoreticalValue > 0 ? absDiff(theoreticalValue, actualValue) / theoreticalValue : 0;
  if (absDiffRatio <= 0.10) {
    finalStatus = 'ok';
  } else if (absDiffRatio <= 0.20) {
    finalStatus = 'warning';
  } else {
    finalStatus = 'error';
  }

  steps.push({
    title: '社会保険料合計の比較',
    rule: '理論値と源泉徴収票の差異が±10%以内であれば適正',
    formula: `健保${healthTheoretical.toLocaleString()} + 厚年${pensionTheoretical.toLocaleString()} + 雇保${employmentTheoretical.toLocaleString()} = ${theoreticalValue.toLocaleString()} vs 実際${actualValue.toLocaleString()} → 差額${diff.toLocaleString()}`,
    theoreticalValue,
    actualValue,
    status: finalStatus,
    note:
      finalStatus === 'ok'
        ? '理論値と概ね一致しています'
        : finalStatus === 'warning'
        ? '若干の差異があります（標準報酬月額の改定時期等による可能性）'
        : '大きな差異があります。等級改定や月別変動を確認してください',
  });

  return {
    theoreticalValue,
    actualValue,
    diff,
    diffPct: diffPctValue,
    status: finalStatus,
    steps,
    standardMonthlyRemuneration,
    healthTheoretical,
    pensionTheoretical,
    employmentTheoretical,
  };
}

// ---------------------------------------------------------------------------
// 5. 住民税の計算
// ---------------------------------------------------------------------------

/**
 * 配偶者控除（住民税用）。
 * 住民税の配偶者控除は33万円（所得税の38万より少ない）。
 */
function calcSpouseDeductionResidentTax(s: SupplementData): number {
  if (!s.hasSpouse) return 0;
  if (s.spouseIncome <= 1030000) {
    return 330000; // 配偶者控除（住民税）
  }
  if (s.spouseIncome <= 2010000) {
    // 配偶者特別控除（住民税）: 330000〜0を線形補間（簡易）
    const ratio = (s.spouseIncome - 1030000) / (2010000 - 1030000);
    return Math.round(330000 * (1 - ratio));
  }
  return 0;
}

export function calcResidentTax(
  w: WithholdingData,
  s: SupplementData,
  payslips: PayslipData[],
): ResidentTaxResult {
  const steps: CalculationStep[] = [];

  // salaryIncome は所得税と同じ（給与所得控除後）
  const salaryIncomeDeduction = calcSalaryIncomeDeduction(w.totalIncome);
  const salaryIncome = w.totalIncome - salaryIncomeDeduction;

  // -----------------------------------------------------------------------
  // Step 1: 住民税用所得控除の計算
  // -----------------------------------------------------------------------
  const basicDeduction = 430000; // 住民税の基礎控除
  const socialInsuranceDeduction = w.socialInsurance;
  const spouseDeduction = calcSpouseDeductionResidentTax(s);

  // 扶養控除（住民税）: 一般330000, 特定450000, 老人380000
  const dependentDeduction =
    s.dependents16to18 * 330000 +
    s.dependents19to22 * 450000 +
    s.dependents70plus * 380000;

  const lifeInsDeduction = w.lifeInsuranceDeduction;
  const earthquakeInsDeduction = w.earthquakeInsuranceDeduction;
  const idecoDeduction = s.ideco;
  const medicalDeduction = calcMedicalDeduction(salaryIncome, s.medicalExpenses);

  const totalDeductions =
    basicDeduction +
    socialInsuranceDeduction +
    spouseDeduction +
    dependentDeduction +
    lifeInsDeduction +
    earthquakeInsDeduction +
    idecoDeduction +
    medicalDeduction;

  const taxableIncomeRaw = salaryIncome - totalDeductions;
  const taxableIncome = floorTo(Math.max(0, taxableIncomeRaw), 1000);

  steps.push({
    title: '住民税 課税所得の計算',
    rule: '住民税用控除（基礎控除43万等）を差し引く',
    formula: `給与所得${salaryIncome.toLocaleString()} - 控除合計${totalDeductions.toLocaleString()} = ${taxableIncome.toLocaleString()}`,
    theoreticalValue: taxableIncome,
    actualValue: null,
    status: 'info',
    subItems: [
      { label: '基礎控除（住民税）', rule: '43万円（所得税は48万円）', theoretical: basicDeduction, actual: null },
      { label: '社会保険料控除', rule: '支払額全額', theoretical: socialInsuranceDeduction, actual: w.socialInsurance },
      { label: '配偶者控除（住民税）', rule: '33万円（所得税は38万円）', theoretical: spouseDeduction, actual: null },
      { label: '扶養控除（住民税）', rule: '一般33万 / 特定45万 / 老人38万', theoretical: dependentDeduction, actual: null },
      { label: '生命保険料控除', rule: '源泉徴収票記載額', theoretical: lifeInsDeduction, actual: w.lifeInsuranceDeduction },
      { label: '地震保険料控除', rule: '源泉徴収票記載額', theoretical: earthquakeInsDeduction, actual: w.earthquakeInsuranceDeduction },
      { label: 'iDeCo', rule: '掛金全額', theoretical: idecoDeduction, actual: null },
      { label: '医療費控除', rule: '医療費 - min(所得×5%, 10万)', theoretical: medicalDeduction, actual: null },
    ],
  });

  // -----------------------------------------------------------------------
  // Step 2: 所得割 = 課税所得 × 10%
  // -----------------------------------------------------------------------
  const incomeLevy = Math.floor(taxableIncome * 0.10);

  steps.push({
    title: '所得割の計算',
    rule: '課税所得 × 10%（都道府県民税4% + 市区町村民税6%）',
    formula: `${taxableIncome.toLocaleString()} × 10% = ${incomeLevy.toLocaleString()}`,
    theoreticalValue: incomeLevy,
    actualValue: null,
    status: 'info',
  });

  // -----------------------------------------------------------------------
  // Step 3: 調整控除（人的控除差額 × 5%）
  // -----------------------------------------------------------------------
  // 人的控除差額の計算（簡易版）
  // 基礎控除差額: 48万 - 43万 = 5万
  // 配偶者控除差額: 38万 - 33万 = 5万
  // 扶養控除差額（一般）: 38万 - 33万 = 5万
  // 扶養控除差額（特定）: 63万 - 45万 = 18万
  // 扶養控除差額（老人）: 48万 - 38万 = 10万
  const basicDiff = 50000;
  const spouseDiff = s.hasSpouse && s.spouseIncome <= 1030000 ? 50000 : 0;
  const dependentDiff =
    s.dependents16to18 * 50000 +
    s.dependents19to22 * 180000 +
    s.dependents70plus * 100000;
  const totalPersonalDiff = basicDiff + spouseDiff + dependentDiff;
  const adjustmentCredit = Math.floor(totalPersonalDiff * 0.05);

  steps.push({
    title: '調整控除',
    rule: '人的控除差額（所得税と住民税の控除額の差）× 5%',
    formula: `人的控除差額${totalPersonalDiff.toLocaleString()} × 5% = ${adjustmentCredit.toLocaleString()}`,
    theoreticalValue: adjustmentCredit,
    actualValue: null,
    status: 'info',
  });

  // -----------------------------------------------------------------------
  // Step 4: 均等割 5000円
  // -----------------------------------------------------------------------
  const perCapitaLevy = 5000;

  steps.push({
    title: '均等割',
    rule: '市区町村民税3500円 + 都道府県民税1500円 = 5000円（標準税率）',
    formula: `均等割: ${perCapitaLevy.toLocaleString()}`,
    theoreticalValue: perCapitaLevy,
    actualValue: null,
    status: 'info',
  });

  // -----------------------------------------------------------------------
  // Step 5: 住民税推定合計 vs 給料明細実額
  // -----------------------------------------------------------------------
  const theoreticalValue = Math.max(0, incomeLevy - adjustmentCredit) + perCapitaLevy;

  // 給料明細から住民税を集計
  const sortedPayslips = [...payslips].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
  const monthlyBreakdown = sortedPayslips.map((p) => ({
    month: p.yearMonth,
    amount: p.residentTax,
  }));

  const actualResidentTaxFromPayslips =
    payslips.length > 0
      ? payslips.reduce((sum, p) => sum + p.residentTax, 0)
      : null;

  let finalStatus: CheckStatus;
  let diff: number | null = null;
  let diffPctValue: number | null = null;

  if (actualResidentTaxFromPayslips !== null) {
    diff = actualResidentTaxFromPayslips - theoreticalValue;
    diffPctValue = diffPct(theoreticalValue, actualResidentTaxFromPayslips);
    const absDiffRatio =
      theoreticalValue > 0
        ? absDiff(theoreticalValue, actualResidentTaxFromPayslips) / theoreticalValue
        : 0;
    finalStatus = absDiffRatio <= 0.15 ? 'ok' : 'warning';
  } else {
    finalStatus = 'info';
  }

  steps.push({
    title: '住民税推定合計',
    rule: '所得割 - 調整控除 + 均等割',
    formula: `${incomeLevy.toLocaleString()} - ${adjustmentCredit.toLocaleString()} + ${perCapitaLevy.toLocaleString()} = ${theoreticalValue.toLocaleString()}`,
    theoreticalValue,
    actualValue: actualResidentTaxFromPayslips,
    status: finalStatus,
    note:
      actualResidentTaxFromPayslips === null
        ? '給料明細がないため実際の住民税と比較できません（翌年6月〜翌々年5月分）'
        : finalStatus === 'ok'
        ? '推定値と実際の支払額が概ね一致しています'
        : '推定値と実際の支払額に差異があります。前年所得に基づく課税のため翌年に反映されます',
  });

  return {
    theoreticalValue,
    actualValue: actualResidentTaxFromPayslips,
    diff,
    diffPct: diffPctValue,
    status: finalStatus,
    steps,
    monthlyBreakdown,
    taxableIncome,
  };
}

// ---------------------------------------------------------------------------
// 6. ふるさと納税 上限額の計算
// ---------------------------------------------------------------------------

export function calcFurusato(
  w: WithholdingData,
  s: SupplementData,
  residentTaxResult: ResidentTaxResult,
): FurusatoResult {
  const steps: CalculationStep[] = [];

  // -----------------------------------------------------------------------
  // Step 1: 住民税所得割
  // -----------------------------------------------------------------------
  // 所得割 = theoreticalValue - 均等割(5000) から逆算
  const perCapitaLevy = 5000;
  const incomeLevyEstimate = Math.max(0, residentTaxResult.theoreticalValue - perCapitaLevy);

  steps.push({
    title: '住民税所得割の確認',
    rule: '住民税推定額 - 均等割5000円',
    formula: `${residentTaxResult.theoreticalValue.toLocaleString()} - ${perCapitaLevy.toLocaleString()} = ${incomeLevyEstimate.toLocaleString()}`,
    theoreticalValue: incomeLevyEstimate,
    actualValue: null,
    status: 'info',
  });

  // -----------------------------------------------------------------------
  // Step 2: ふるさと納税の上限額
  // 上限 = 住民税所得割 × 20% ÷ (0.9 - 所得税率) + 2000
  // -----------------------------------------------------------------------
  // 所得税率は課税所得から取得（近似: 給与所得控除後の収入で推計）
  const salaryIncomeDeduction = calcSalaryIncomeDeduction(w.totalIncome);
  const salaryIncome = w.totalIncome - salaryIncomeDeduction;
  const approxTaxableIncome = Math.max(0, salaryIncome - residentTaxResult.taxableIncome + residentTaxResult.taxableIncome);
  const { rate: taxRate } = applyIncomeTaxBracket(residentTaxResult.taxableIncome);

  const denominator = 0.9 - taxRate;
  const limit =
    denominator > 0
      ? Math.floor((incomeLevyEstimate * 0.2) / denominator) + 2000
      : incomeLevyEstimate * 0.2 + 2000;

  steps.push({
    title: 'ふるさと納税 上限額の計算',
    rule: '住民税所得割×20% ÷ (0.9 - 所得税率) + 2000円',
    formula: `${incomeLevyEstimate.toLocaleString()} × 20% ÷ (0.9 - ${taxRate}) + 2000 = ${limit.toLocaleString()}`,
    theoreticalValue: limit,
    actualValue: s.furusatoTotal > 0 ? s.furusatoTotal : null,
    status: 'info',
  });

  // -----------------------------------------------------------------------
  // Step 3: 寄付額 vs 上限
  // -----------------------------------------------------------------------
  const donated = s.furusatoTotal;
  const remaining = limit - donated;
  const overLimit = donated > limit;

  let donationStatus: CheckStatus;
  if (overLimit) {
    donationStatus = 'error';
  } else if (remaining / limit > 0.5) {
    donationStatus = 'info';
  } else {
    donationStatus = 'ok';
  }

  steps.push({
    title: '寄付額と上限の比較',
    rule: '上限を超えると全額控除されない',
    formula: `寄付額${donated.toLocaleString()} vs 上限${limit.toLocaleString()} → 残枠${remaining.toLocaleString()}`,
    theoreticalValue: limit,
    actualValue: donated,
    status: donationStatus,
    note: overLimit
      ? `上限を${Math.abs(remaining).toLocaleString()}円超過しています。超過分は控除されません`
      : remaining / limit > 0.5
      ? `上限まで${remaining.toLocaleString()}円の余裕があります`
      : `適切な寄付額です（残枠${remaining.toLocaleString()}円）`,
  });

  // -----------------------------------------------------------------------
  // Step 4: 控除反映の確認
  // -----------------------------------------------------------------------
  let methodNote = '';
  if (s.furusatoMethod === 'onestop') {
    methodNote =
      'ワンストップ特例を利用の場合、源泉徴収票には記載されません（住民税で全額控除）';
  } else if (s.furusatoMethod === 'kakutei') {
    methodNote = '確定申告で控除する場合、所得税・住民税の両方から控除されます';
  } else {
    methodNote = '寄付方法が未設定です';
  }

  steps.push({
    title: '控除方法の確認',
    rule: 'ワンストップ特例は住民税のみ控除、確定申告は所得税+住民税両方',
    formula: methodNote,
    theoreticalValue: donated > 0 ? donated - 2000 : 0,
    actualValue: null,
    status: donated > 0 ? 'ok' : 'info',
    note: methodNote,
  });

  // 税の節約額（概算）: 自己負担2000円を除いた全額が節約
  const taxSavings = Math.max(0, Math.min(donated, limit) - 2000);

  return {
    limit,
    donated,
    remaining,
    status: donationStatus,
    steps,
    taxSavings,
  };

  // suppress unused variable warning
  void approxTaxableIncome;
}

// ---------------------------------------------------------------------------
// 7. 給料明細との整合性チェック
// ---------------------------------------------------------------------------

export function calcPayslipConsistency(
  w: WithholdingData,
  payslips: PayslipData[],
): PayslipConsistencyResult | null {
  if (payslips.length === 0) return null;

  const totalGross = payslips.reduce((sum, p) => sum + p.totalGross, 0);
  const totalIncomeTax = payslips.reduce((sum, p) => sum + p.incomeTax, 0);
  const totalSocialInsurance = payslips.reduce(
    (sum, p) =>
      sum + p.healthInsurance + p.nursingInsurance + p.pension + p.employmentInsurance,
    0,
  );
  const totalResidentTax = payslips.reduce((sum, p) => sum + p.residentTax, 0);

  const grossDiff = totalGross - w.totalIncome;
  const incomeTaxDiff = totalIncomeTax - w.withholdingTax;
  const socialInsuranceDiff = totalSocialInsurance - w.socialInsurance;

  const grossDiffRatio = w.totalIncome > 0 ? Math.abs(grossDiff) / w.totalIncome : 0;
  const incomeTaxDiffRatio =
    w.withholdingTax > 0 ? Math.abs(incomeTaxDiff) / w.withholdingTax : 0;
  const socialInsuranceDiffRatio =
    w.socialInsurance > 0 ? Math.abs(socialInsuranceDiff) / w.socialInsurance : 0;

  let status: CheckStatus;
  let note: string;

  if (grossDiffRatio <= 0.01 && incomeTaxDiffRatio <= 0.05 && socialInsuranceDiffRatio <= 0.05) {
    status = 'ok';
    note = '給料明細と源泉徴収票の合計額が概ね一致しています';
  } else if (grossDiffRatio <= 0.05) {
    status = 'warning';
    note = '給料明細と源泉徴収票の間に若干の差異があります。賞与や年末調整の還付を確認してください';
  } else {
    status = 'error';
    note = '給料明細と源泉徴収票の差異が大きいです。月数の不足や金額の入力誤りを確認してください';
  }

  return {
    totalGross,
    totalIncomeTax,
    totalSocialInsurance,
    totalResidentTax,
    grossDiff,
    incomeTaxDiff,
    socialInsuranceDiff,
    status,
    note,
  };
}

// ---------------------------------------------------------------------------
// 8. メインのまとめ計算
// ---------------------------------------------------------------------------

export function calculate(
  w: WithholdingData,
  s: SupplementData,
  payslips: PayslipData[],
): CalculationResult {
  const incomeTax = calcIncomeTax(w, s);
  const socialInsurance = calcSocialInsurance(w, s);
  const residentTax = calcResidentTax(w, s, payslips);
  const furusato = calcFurusato(w, s, residentTax);
  const payslipConsistency = calcPayslipConsistency(w, payslips);

  const annualIncome = w.totalIncome;
  const totalBurden =
    incomeTax.theoreticalValue +
    socialInsurance.theoreticalValue +
    residentTax.theoreticalValue;
  const burdenRate = annualIncome > 0 ? (totalBurden / annualIncome) * 100 : 0;
  const netIncome = annualIncome - totalBurden;

  // 月次住民税（給料明細から算出、なければ理論値÷12）
  let residentTaxMonthly: number | null = null;
  if (payslips.length > 0 && residentTax.actualValue !== null) {
    residentTaxMonthly = Math.round(residentTax.actualValue / payslips.length);
  } else if (residentTax.theoreticalValue > 0) {
    residentTaxMonthly = Math.round(residentTax.theoreticalValue / 12);
  }

  const furusatoSavings = furusato.taxSavings;

  return {
    incomeTax,
    socialInsurance,
    residentTax,
    furusato,
    payslipConsistency,
    summary: {
      annualIncome,
      totalBurden,
      burdenRate,
      netIncome,
      furusatoSavings,
      residentTaxMonthly,
    },
  };
}
