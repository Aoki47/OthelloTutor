/**
 * 都道府県別 協会けんぽ 令和6年度 健康保険料率（全体料率 %）
 * 本人負担分は ÷ 2 で算出する。
 */
export const PREFECTURE_HEALTH_RATES: Record<string, number> = {
  北海道: 10.21,
  青森: 9.70,
  岩手: 9.76,
  宮城: 10.02,
  秋田: 10.02,
  山形: 10.04,
  福島: 9.65,
  茨城: 9.74,
  栃木: 9.81,
  群馬: 9.76,
  埼玉: 9.78,
  千葉: 9.77,
  東京: 9.98,
  神奈川: 10.02,
  新潟: 9.35,
  富山: 9.57,
  石川: 10.07,
  福井: 9.87,
  山梨: 9.96,
  長野: 9.49,
  岐阜: 9.85,
  静岡: 9.80,
  愛知: 10.01,
  三重: 9.81,
  滋賀: 9.80,
  京都: 10.16,
  大阪: 10.29,
  兵庫: 10.18,
  奈良: 9.90,
  和歌山: 10.05,
  鳥取: 9.93,
  島根: 10.22,
  岡山: 10.17,
  広島: 10.01,
  山口: 10.17,
  徳島: 10.18,
  香川: 10.23,
  愛媛: 10.03,
  高知: 10.06,
  福岡: 10.36,
  佐賀: 10.68,
  長崎: 10.21,
  熊本: 10.30,
  大分: 10.24,
  宮崎: 9.85,
  鹿児島: 10.28,
  沖縄: 9.89,
};

/** 介護保険料率（全国一律、全体 %）。本人負担は ÷ 2。40歳以上65歳未満に適用。 */
export const NURSING_INSURANCE_RATE = 1.60;

/** 厚生年金保険料率 — 本人負担分 (%) */
export const PENSION_RATE_EMPLOYEE = 9.15;

/** 雇用保険料率 — 一般労働者の本人負担分 (%) */
export const EMPLOYMENT_INSURANCE_RATE = 0.6;

// ---------------------------------------------------------------------------
// 厚生年金 標準報酬月額等級表（令和2年9月〜）32等級
// ---------------------------------------------------------------------------
export const PENSION_GRADE_TABLE: Array<{
  grade: number;
  standard: number;
  lowerBound: number;
  upperBound: number | null;
}> = [
  { grade: 1,  standard:  88000, lowerBound:       0, upperBound:  93000 },
  { grade: 2,  standard:  98000, lowerBound:  93000, upperBound: 101000 },
  { grade: 3,  standard: 104000, lowerBound: 101000, upperBound: 107000 },
  { grade: 4,  standard: 110000, lowerBound: 107000, upperBound: 114000 },
  { grade: 5,  standard: 118000, lowerBound: 114000, upperBound: 122000 },
  { grade: 6,  standard: 126000, lowerBound: 122000, upperBound: 130000 },
  { grade: 7,  standard: 134000, lowerBound: 130000, upperBound: 138000 },
  { grade: 8,  standard: 142000, lowerBound: 138000, upperBound: 146000 },
  { grade: 9,  standard: 150000, lowerBound: 146000, upperBound: 155000 },
  { grade: 10, standard: 160000, lowerBound: 155000, upperBound: 165000 },
  { grade: 11, standard: 170000, lowerBound: 165000, upperBound: 175000 },
  { grade: 12, standard: 180000, lowerBound: 175000, upperBound: 185000 },
  { grade: 13, standard: 190000, lowerBound: 185000, upperBound: 195000 },
  { grade: 14, standard: 200000, lowerBound: 195000, upperBound: 210000 },
  { grade: 15, standard: 220000, lowerBound: 210000, upperBound: 230000 },
  { grade: 16, standard: 240000, lowerBound: 230000, upperBound: 250000 },
  { grade: 17, standard: 260000, lowerBound: 250000, upperBound: 270000 },
  { grade: 18, standard: 280000, lowerBound: 270000, upperBound: 290000 },
  { grade: 19, standard: 300000, lowerBound: 290000, upperBound: 310000 },
  { grade: 20, standard: 320000, lowerBound: 310000, upperBound: 330000 },
  { grade: 21, standard: 340000, lowerBound: 330000, upperBound: 350000 },
  { grade: 22, standard: 360000, lowerBound: 350000, upperBound: 370000 },
  { grade: 23, standard: 380000, lowerBound: 370000, upperBound: 395000 },
  { grade: 24, standard: 410000, lowerBound: 395000, upperBound: 425000 },
  { grade: 25, standard: 440000, lowerBound: 425000, upperBound: 455000 },
  { grade: 26, standard: 470000, lowerBound: 455000, upperBound: 485000 },
  { grade: 27, standard: 500000, lowerBound: 485000, upperBound: 515000 },
  { grade: 28, standard: 530000, lowerBound: 515000, upperBound: 545000 },
  { grade: 29, standard: 560000, lowerBound: 545000, upperBound: 575000 },
  { grade: 30, standard: 590000, lowerBound: 575000, upperBound: 605000 },
  { grade: 31, standard: 620000, lowerBound: 605000, upperBound: 635000 },
  { grade: 32, standard: 650000, lowerBound: 635000, upperBound: null },
];

// ---------------------------------------------------------------------------
// 健康保険 標準報酬月額等級表（令和6年度）50等級
// ---------------------------------------------------------------------------
export const HEALTH_GRADE_TABLE: Array<{
  grade: number;
  standard: number;
  lowerBound: number;
  upperBound: number | null;
}> = [
  { grade: 1,  standard:   58000, lowerBound:       0, upperBound:   63000 },
  { grade: 2,  standard:   68000, lowerBound:   63000, upperBound:   73000 },
  { grade: 3,  standard:   78000, lowerBound:   73000, upperBound:   83000 },
  { grade: 4,  standard:   88000, lowerBound:   83000, upperBound:   93000 },
  { grade: 5,  standard:   98000, lowerBound:   93000, upperBound:  101000 },
  { grade: 6,  standard:  104000, lowerBound:  101000, upperBound:  107000 },
  { grade: 7,  standard:  110000, lowerBound:  107000, upperBound:  114000 },
  { grade: 8,  standard:  118000, lowerBound:  114000, upperBound:  122000 },
  { grade: 9,  standard:  126000, lowerBound:  122000, upperBound:  130000 },
  { grade: 10, standard:  134000, lowerBound:  130000, upperBound:  138000 },
  { grade: 11, standard:  142000, lowerBound:  138000, upperBound:  146000 },
  { grade: 12, standard:  150000, lowerBound:  146000, upperBound:  155000 },
  { grade: 13, standard:  160000, lowerBound:  155000, upperBound:  165000 },
  { grade: 14, standard:  170000, lowerBound:  165000, upperBound:  175000 },
  { grade: 15, standard:  180000, lowerBound:  175000, upperBound:  185000 },
  { grade: 16, standard:  190000, lowerBound:  185000, upperBound:  195000 },
  { grade: 17, standard:  200000, lowerBound:  195000, upperBound:  210000 },
  { grade: 18, standard:  220000, lowerBound:  210000, upperBound:  230000 },
  { grade: 19, standard:  240000, lowerBound:  230000, upperBound:  250000 },
  { grade: 20, standard:  260000, lowerBound:  250000, upperBound:  270000 },
  { grade: 21, standard:  280000, lowerBound:  270000, upperBound:  290000 },
  { grade: 22, standard:  300000, lowerBound:  290000, upperBound:  310000 },
  { grade: 23, standard:  320000, lowerBound:  310000, upperBound:  330000 },
  { grade: 24, standard:  340000, lowerBound:  330000, upperBound:  350000 },
  { grade: 25, standard:  360000, lowerBound:  350000, upperBound:  370000 },
  { grade: 26, standard:  380000, lowerBound:  370000, upperBound:  395000 },
  { grade: 27, standard:  410000, lowerBound:  395000, upperBound:  425000 },
  { grade: 28, standard:  440000, lowerBound:  425000, upperBound:  455000 },
  { grade: 29, standard:  470000, lowerBound:  455000, upperBound:  485000 },
  { grade: 30, standard:  500000, lowerBound:  485000, upperBound:  515000 },
  { grade: 31, standard:  530000, lowerBound:  515000, upperBound:  545000 },
  { grade: 32, standard:  560000, lowerBound:  545000, upperBound:  575000 },
  { grade: 33, standard:  590000, lowerBound:  575000, upperBound:  605000 },
  { grade: 34, standard:  620000, lowerBound:  605000, upperBound:  635000 },
  { grade: 35, standard:  650000, lowerBound:  635000, upperBound:  665000 },
  { grade: 36, standard:  680000, lowerBound:  665000, upperBound:  695000 },
  { grade: 37, standard:  710000, lowerBound:  695000, upperBound:  730000 },
  { grade: 38, standard:  750000, lowerBound:  730000, upperBound:  770000 },
  { grade: 39, standard:  790000, lowerBound:  770000, upperBound:  810000 },
  { grade: 40, standard:  830000, lowerBound:  810000, upperBound:  855000 },
  { grade: 41, standard:  880000, lowerBound:  855000, upperBound:  905000 },
  { grade: 42, standard:  930000, lowerBound:  905000, upperBound:  955000 },
  { grade: 43, standard:  980000, lowerBound:  955000, upperBound: 1005000 },
  { grade: 44, standard: 1040000, lowerBound: 1005000, upperBound: 1055000 },
  { grade: 45, standard: 1090000, lowerBound: 1055000, upperBound: 1115000 },
  { grade: 46, standard: 1150000, lowerBound: 1115000, upperBound: 1175000 },
  { grade: 47, standard: 1210000, lowerBound: 1175000, upperBound: 1235000 },
  { grade: 48, standard: 1270000, lowerBound: 1235000, upperBound: 1295000 },
  { grade: 49, standard: 1330000, lowerBound: 1295000, upperBound: 1355000 },
  { grade: 50, standard: 1390000, lowerBound: 1355000, upperBound: null },
];

// ---------------------------------------------------------------------------
// 所得税の速算表（2024年度）
// ---------------------------------------------------------------------------
export const INCOME_TAX_BRACKETS: Array<{
  min: number;
  max: number | null;
  rate: number;
  deduction: number;
}> = [
  { min:       0, max:  1950000, rate: 0.05, deduction:       0 },
  { min: 1950000, max:  3300000, rate: 0.10, deduction:   97500 },
  { min: 3300000, max:  6950000, rate: 0.20, deduction:  427500 },
  { min: 6950000, max:  9000000, rate: 0.23, deduction:  636000 },
  { min: 9000000, max: 18000000, rate: 0.33, deduction: 1536000 },
  { min:18000000, max: 40000000, rate: 0.40, deduction: 2796000 },
  { min:40000000, max:      null, rate: 0.45, deduction: 4796000 },
];

// ---------------------------------------------------------------------------
// 給与所得控除額の速算表（令和2年分以降・2024年度）
// ---------------------------------------------------------------------------
export const SALARY_INCOME_DEDUCTION_TABLE: Array<{
  minIncome: number;
  maxIncome: number | null;
  rate: number;
  fixed: number;
  cap: number | null;
}> = [
  // 収入金額 <= 1,625,000 → 550,000円（最低保障）
  { minIncome:        0, maxIncome:  1625000, rate: 0,    fixed: 550000, cap: null },
  // 1,625,001 〜 1,800,000 → 収入 × 40% - 100,000
  { minIncome:  1625001, maxIncome:  1800000, rate: 0.40, fixed: -100000, cap: null },
  // 1,800,001 〜 3,600,000 → 収入 × 30% + 80,000
  { minIncome:  1800001, maxIncome:  3600000, rate: 0.30, fixed:   80000, cap: null },
  // 3,600,001 〜 6,600,000 → 収入 × 20% + 440,000
  { minIncome:  3600001, maxIncome:  6600000, rate: 0.20, fixed:  440000, cap: null },
  // 6,600,001 〜 8,500,000 → 収入 × 10% + 1,100,000
  { minIncome:  6600001, maxIncome:  8500000, rate: 0.10, fixed: 1100000, cap: null },
  // 8,500,001 〜        → 1,950,000円（上限）
  { minIncome:  8500001, maxIncome:      null, rate: 0,    fixed: 1950000, cap: 1950000 },
];

// ---------------------------------------------------------------------------
// 47都道府県名リスト（北海道〜沖縄）
// ---------------------------------------------------------------------------
export const PREFECTURES: string[] = [
  '北海道',
  '青森', '岩手', '宮城', '秋田', '山形', '福島',
  '茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川',
  '新潟', '富山', '石川', '福井', '山梨', '長野',
  '岐阜', '静岡', '愛知', '三重',
  '滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山',
  '鳥取', '島根', '岡山', '広島', '山口',
  '徳島', '香川', '愛媛', '高知',
  '福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島',
  '沖縄',
];
