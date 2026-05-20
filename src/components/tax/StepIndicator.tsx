"use client";

interface Props {
  currentStep: 1 | 2 | 3 | 4;
}

const STEPS = [
  { number: 1, label: 'PDF読込' },
  { number: 2, label: '内容確認' },
  { number: 3, label: '補足入力' },
  { number: 4, label: '解析レポート' },
] as const;

export default function StepIndicator({ currentStep }: Props) {
  return (
    <div className="w-full px-4 py-6">
      <div className="flex items-center justify-center max-w-2xl mx-auto">
        {STEPS.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const isFuture = step.number > currentStep;

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={[
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300',
                    isCompleted
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : isActive
                      ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/40'
                      : 'bg-slate-800 border-slate-600 text-slate-400',
                  ].join(' ')}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={[
                    'mt-2 text-xs font-medium whitespace-nowrap',
                    isActive ? 'text-blue-400' : isCompleted ? 'text-blue-300' : 'text-slate-500',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (not after last step) */}
              {index < STEPS.length - 1 && (
                <div
                  className={[
                    'flex-1 h-0.5 mx-2 mb-5 transition-all duration-300',
                    isCompleted ? 'bg-blue-500' : 'bg-slate-700',
                  ].join(' ')}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
