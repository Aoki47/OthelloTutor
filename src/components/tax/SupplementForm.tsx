"use client";

import { useState } from 'react';
import { SupplementData, FurusatoMethod } from '@/lib/tax/types';
import { PREFECTURES } from '@/lib/tax/constants';

interface Props {
  data: SupplementData;
  onChange: (d: SupplementData) => void;
}

const TABS = [
  { id: 'basic',    label: '基本情報' },
  { id: 'family',   label: '家族構成' },
  { id: 'furusato', label: 'ふるさと納税' },
  { id: 'other',    label: 'その他控除' },
] as const;

type TabId = typeof TABS[number]['id'];

function NumberInput({
  label,
  value,
  onChange,
  unit = '円',
  min = 0,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  min?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm text-slate-300">{label}</label>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      <div className="relative">
        <input
          type="number"
          min={min}
          value={value === 0 ? '' : value}
          placeholder="0"
          onChange={(e) => onChange(Math.max(min, parseInt(e.target.value || '0', 10)))}
          className="w-full bg-slate-900/60 border border-slate-600/60 rounded-lg px-3 py-2 text-right text-sm text-slate-100 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-colors pr-8"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
          {unit}
        </span>
      </div>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group py-2">
      <div>
        <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">{label}</span>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </div>
      <div className="relative flex-shrink-0 ml-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={[
            'w-10 h-6 rounded-full transition-colors duration-200',
            checked ? 'bg-blue-500' : 'bg-slate-600',
          ].join(' ')}
        />
        <div
          className={[
            'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-1',
          ].join(' ')}
        />
      </div>
    </label>
  );
}

export default function SupplementForm({ data, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('basic');

  const update = <K extends keyof SupplementData>(key: K, value: SupplementData[K]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="bg-slate-800/70 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-700/50 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              'flex-1 min-w-[80px] px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5 space-y-5">

        {/* === Tab 1: 基本情報 === */}
        {activeTab === 'basic' && (
          <div className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm text-slate-300">都道府県</label>
              <p className="text-xs text-slate-500">健康保険料率の計算に使用します</p>
              <select
                value={data.prefecture}
                onChange={(e) => update('prefecture', e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              >
                {PREFECTURES.map((pref) => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-slate-700/40 pt-4">
              <CheckRow
                label="40歳以上65歳未満"
                checked={data.isOver40}
                onChange={(v) => update('isOver40', v)}
                hint="介護保険料が健康保険料に加算されます"
              />
            </div>
          </div>
        )}

        {/* === Tab 2: 家族構成 === */}
        {activeTab === 'family' && (
          <div className="space-y-5">
            <CheckRow
              label="配偶者あり"
              checked={data.hasSpouse}
              onChange={(v) => update('hasSpouse', v)}
            />

            {data.hasSpouse && (
              <div className="pl-4 border-l-2 border-blue-500/30">
                <NumberInput
                  label="配偶者の年収"
                  value={data.spouseIncome}
                  onChange={(v) => update('spouseIncome', v)}
                  hint="103万円以下で配偶者控除の対象"
                />
              </div>
            )}

            <div className="border-t border-slate-700/40 pt-4 space-y-4">
              <p className="text-sm font-medium text-slate-300">扶養親族の年齢別人数</p>

              <NumberInput
                label="16歳未満"
                value={data.dependentsUnder16}
                onChange={(v) => update('dependentsUnder16', v)}
                unit="人"
                hint="控除対象外（参考）"
              />
              <NumberInput
                label="16〜18歳（一般扶養）"
                value={data.dependents16to18}
                onChange={(v) => update('dependents16to18', v)}
                unit="人"
                hint="所得税38万円/住民税33万円"
              />
              <NumberInput
                label="19〜22歳（特定扶養）"
                value={data.dependents19to22}
                onChange={(v) => update('dependents19to22', v)}
                unit="人"
                hint="所得税63万円/住民税45万円"
              />
              <NumberInput
                label="70歳以上（老人扶養）"
                value={data.dependents70plus}
                onChange={(v) => update('dependents70plus', v)}
                unit="人"
                hint="所得税48万円/住民税38万円"
              />
            </div>
          </div>
        )}

        {/* === Tab 3: ふるさと納税 === */}
        {activeTab === 'furusato' && (
          <div className="space-y-5">
            <NumberInput
              label="ふるさと納税 合計寄付額"
              value={data.furusatoTotal}
              onChange={(v) => update('furusatoTotal', v)}
              hint="自己負担2,000円を含む総額"
            />
            <NumberInput
              label="寄付先の自治体数"
              value={data.furusatoCount}
              onChange={(v) => update('furusatoCount', v)}
              unit="件"
              hint="ワンストップ特例は5自治体まで"
            />

            <div className="space-y-2">
              <label className="text-sm text-slate-300">控除の申請方法</label>
              <div className="space-y-2">
                {(
                  [
                    { value: 'onestop', label: 'ワンストップ特例', desc: '確定申告不要（5自治体以内・給与収入のみ）' },
                    { value: 'kakutei', label: '確定申告', desc: '所得税・住民税の両方から控除' },
                    { value: 'none',    label: '未申請',   desc: 'まだ決めていない / 申請しない' },
                  ] as { value: FurusatoMethod; label: string; desc: string }[]
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className={[
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      data.furusatoMethod === opt.value
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-slate-600/40 bg-slate-900/30 hover:border-slate-500/60',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="furusatoMethod"
                      value={opt.value}
                      checked={data.furusatoMethod === opt.value}
                      onChange={() => update('furusatoMethod', opt.value)}
                      className="mt-0.5 text-blue-500 focus:ring-blue-500/20"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-200">{opt.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {data.furusatoMethod === 'onestop' && data.furusatoCount > 5 && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <span className="text-amber-400 flex-shrink-0">⚠️</span>
                <p className="text-xs text-amber-300">
                  ワンストップ特例は寄付先が5自治体以内の場合のみ利用可能です。
                  6自治体以上の場合は確定申告が必要です。
                </p>
              </div>
            )}
          </div>
        )}

        {/* === Tab 4: その他控除 === */}
        {activeTab === 'other' && (
          <div className="space-y-5">
            <NumberInput
              label="医療費（年間合計）"
              value={data.medicalExpenses}
              onChange={(v) => update('medicalExpenses', v)}
              hint="10万円超過分が控除対象"
            />
            <NumberInput
              label="iDeCo（個人型確定拠出年金）年間掛金"
              value={data.ideco}
              onChange={(v) => update('ideco', v)}
              hint="全額所得控除の対象"
            />
            <NumberInput
              label="住宅ローン年末残高"
              value={data.housingLoanBalance}
              onChange={(v) => update('housingLoanBalance', v)}
              hint="住宅借入金等特別控除の計算基準"
            />

            <div className="bg-blue-500/8 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-blue-300 leading-relaxed">
                ℹ️ 医療費控除・iDeCoによる控除は確定申告が必要な場合があります。
                住宅ローン控除は源泉徴収票に記載の金額を「内容確認」画面で入力してください。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
