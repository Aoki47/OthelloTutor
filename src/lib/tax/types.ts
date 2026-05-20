export interface WithholdingData {
  totalIncome: number;
  incomeAfterDeduction: number;
  totalDeductionsSum: number;
  withholdingTax: number;
  socialInsurance: number;
  lifeInsuranceDeduction: number;
  earthquakeInsuranceDeduction: number;
  housingLoanDeduction: number;
  donationDeduction: number;
  hasSpouseDeduction: boolean;
  dependentsCount: number;
}

export interface PayslipData {
  yearMonth: string; // "YYYY-MM"
  totalGross: number;
  healthInsurance: number;
  nursingInsurance: number;
  pension: number;
  employmentInsurance: number;
  incomeTax: number;
  residentTax: number;
  netPay: number;
}

export type FurusatoMethod = 'onestop' | 'kakutei' | 'none';

export interface SupplementData {
  prefecture: string;
  isOver40: boolean;
  hasSpouse: boolean;
  spouseIncome: number;
  dependentsUnder16: number;
  dependents16to18: number;
  dependents19to22: number;
  dependents70plus: number;
  furusatoTotal: number;
  furusatoCount: number;
  furusatoMethod: FurusatoMethod;
  medicalExpenses: number;
  ideco: number;
  housingLoanBalance: number;
}

export type CheckStatus = 'ok' | 'warning' | 'error' | 'info';

export interface CalculationStep {
  title: string;
  rule: string;
  formula: string;
  theoreticalValue: number;
  actualValue: number | null;
  status: CheckStatus;
  note?: string;
  subItems?: Array<{ label: string; rule: string; theoretical: number; actual: number | null }>;
}

export interface IncomeTaxResult {
  theoreticalValue: number;
  actualValue: number;
  diff: number;
  diffPct: number;
  status: CheckStatus;
  steps: CalculationStep[];
  salaryIncomeDeduction: number;
  salaryIncome: number;
  taxableIncome: number;
  taxBracketRate: number;
}

export interface SocialInsuranceResult {
  theoreticalValue: number;
  actualValue: number;
  diff: number;
  diffPct: number;
  status: CheckStatus;
  steps: CalculationStep[];
  standardMonthlyRemuneration: number;
  healthTheoretical: number;
  pensionTheoretical: number;
  employmentTheoretical: number;
}

export interface ResidentTaxResult {
  theoreticalValue: number;
  actualValue: number | null;
  diff: number | null;
  diffPct: number | null;
  status: CheckStatus;
  steps: CalculationStep[];
  monthlyBreakdown: Array<{ month: string; amount: number }>;
  taxableIncome: number;
}

export interface FurusatoResult {
  limit: number;
  donated: number;
  remaining: number;
  status: CheckStatus;
  steps: CalculationStep[];
  taxSavings: number;
}

export interface PayslipConsistencyResult {
  totalGross: number;
  totalIncomeTax: number;
  totalSocialInsurance: number;
  totalResidentTax: number;
  grossDiff: number;
  incomeTaxDiff: number;
  socialInsuranceDiff: number;
  status: CheckStatus;
  note: string;
}

export interface CalculationResult {
  incomeTax: IncomeTaxResult;
  socialInsurance: SocialInsuranceResult;
  residentTax: ResidentTaxResult;
  furusato: FurusatoResult;
  payslipConsistency: PayslipConsistencyResult | null;
  summary: {
    annualIncome: number;
    totalBurden: number;
    burdenRate: number;
    netIncome: number;
    furusatoSavings: number;
    residentTaxMonthly: number | null;
  };
}
