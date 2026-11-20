import React from 'react';
import { WhiteSelect } from './WhiteSelect';
import { TopicHeader } from './TopicHeader';
import {
  CircleIndicator,
  optionCardClass,
  SUBQUESTION_DIVIDER_CLASS
} from './OptionControl';

export interface LatePaymentFeesValue {
  hasLateFee: '' | 'Yes' | 'No';
  lateFeeGraceNumber: string; // '1'..'30' or ''
  lateFeeGraceUnit: '' | 'Day' | 'Month' | 'Year';
  lateFeeType: '' | 'Fixed' | 'Percentage';
  lateFeeFixedAmount: string;
  lateFeePercentValue: string;
  lateFeePercentPeriod: '' | 'Per Day' | 'Per Week' | 'Per Month' | 'Per Year';
}

export const DEFAULT_LATE_PAYMENT_FEES: LatePaymentFeesValue = {
  hasLateFee: '',
  lateFeeGraceNumber: '',
  lateFeeGraceUnit: '',
  lateFeeType: '',
  lateFeeFixedAmount: '',
  lateFeePercentValue: '',
  lateFeePercentPeriod: ''
};

const NUMBERS_1_TO_30 = Array.from({ length: 30 }, (_, i) => String(i + 1));

export function validateLatePaymentFees(
  value: LatePaymentFeesValue,
  required = true
): string | null {
  if (!value.hasLateFee) {
    if (required) {
      return 'Please select Yes or No under Late Payment Fees.';
    }
    return null;
  }
  if (value.hasLateFee === 'Yes') {
    if (!value.lateFeeGraceNumber || !value.lateFeeGraceUnit) {
      return 'Please select the grace period before late fees start.';
    }
    if (!value.lateFeeType) {
      return 'Please select Fixed or Percentage for late fee charge.';
    }
    if (value.lateFeeType === 'Fixed' && !value.lateFeeFixedAmount.trim()) {
      return 'Please enter the Fixed late fee amount in Rupees.';
    }
    if (
      value.lateFeeType === 'Percentage' &&
      (!value.lateFeePercentValue.trim() || !value.lateFeePercentPeriod)
    ) {
      return 'Please enter the late fee percentage and frequency.';
    }
  }
  return null;
}

export function formatLatePaymentSummary(value: LatePaymentFeesValue): string {
  if (!value.hasLateFee) return 'Not Applicable';
  if (value.hasLateFee === 'No') return 'No late payment fees';
  const grace =
    value.lateFeeGraceNumber && value.lateFeeGraceUnit
      ? `After ${value.lateFeeGraceNumber} ${value.lateFeeGraceUnit}`
      : '';
  const charge =
    value.lateFeeType === 'Fixed'
      ? `Fixed ₹${value.lateFeeFixedAmount}`
      : value.lateFeeType === 'Percentage'
      ? `${value.lateFeePercentValue}% ${value.lateFeePercentPeriod}`
      : '';
  return ['Yes', grace, charge].filter(Boolean).join(' — ');
}

interface LatePaymentFeesSectionProps {
  topicNumber?: number;
  title?: string;
  question?: string;
  required?: boolean;
  radioNamePrefix: string;
  value: LatePaymentFeesValue;
  onChange: (next: LatePaymentFeesValue) => void;
}

export const LatePaymentFeesSection: React.FC<LatePaymentFeesSectionProps> = ({
  topicNumber,
  title = 'Late Payment Fees',
  question = 'Will there be a late fee if payment is delayed?',
  required = true,
  radioNamePrefix,
  value,
  onChange
}) => {
  const update = <K extends keyof LatePaymentFeesValue>(
    key: K,
    val: LatePaymentFeesValue[K]
  ) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-3">
      <TopicHeader
        number={topicNumber}
        title={title}
        question={question}
        required={required}
      />

      <div className="grid grid-cols-2 gap-2.5">
        {(['Yes', 'No'] as const).map((opt) => {
          const isSelected = value.hasLateFee === opt;
          return (
            <label key={opt} className={optionCardClass(isSelected)}>
              <input
                type="radio"
                name={`${radioNamePrefix}_hasLateFee`}
                checked={isSelected}
                onChange={() => update('hasLateFee', opt)}
                className="sr-only"
              />
              <CircleIndicator checked={isSelected} />
              <span>{opt}</span>
            </label>
          );
        })}
      </div>

      {value.hasLateFee === 'Yes' && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-900">
              How many extra days before late fees start? <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-28">
                <WhiteSelect
                  variant="compact"
                  aria-label="Late fee grace duration number"
                  placeholder="Select"
                  value={value.lateFeeGraceNumber}
                  options={NUMBERS_1_TO_30}
                  onChange={(val) => update('lateFeeGraceNumber', val)}
                />
              </div>
              <div className="w-32">
                <WhiteSelect
                  variant="compact"
                  aria-label="Late fee grace duration unit"
                  placeholder="Unit"
                  value={value.lateFeeGraceUnit}
                  options={['Day', 'Month', 'Year']}
                  onChange={(val) =>
                    update('lateFeeGraceUnit', val as 'Day' | 'Month' | 'Year')
                  }
                />
              </div>
            </div>
          </div>

          <div className={`${SUBQUESTION_DIVIDER_CLASS} space-y-2`}>
            <label className="block text-xs sm:text-sm font-bold text-slate-900">
              How is late fee charged? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(['Fixed', 'Percentage'] as const).map((opt) => {
                const isSelected = value.lateFeeType === opt;
                return (
                  <label key={opt} className={optionCardClass(isSelected)}>
                    <input
                      type="radio"
                      name={`${radioNamePrefix}_lateFeeType`}
                      checked={isSelected}
                      onChange={() => update('lateFeeType', opt)}
                      className="sr-only"
                    />
                    <CircleIndicator checked={isSelected} />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>

            {value.lateFeeType === 'Fixed' && (
              <div className="pt-1">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-slate-500">
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={value.lateFeeFixedAmount}
                    onChange={(e) => update('lateFeeFixedAmount', e.target.value)}
                    placeholder="Enter fixed late fee amount in Rupees"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}

            {value.lateFeeType === 'Percentage' && (
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[140px]">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={value.lateFeePercentValue}
                    onChange={(e) => update('lateFeePercentValue', e.target.value)}
                    placeholder="Enter percentage"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-3.5 pr-8 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-slate-500">
                    %
                  </span>
                </div>
                <div className="w-40">
                  <WhiteSelect
                    variant="compact"
                    aria-label="Late fee percentage frequency"
                    placeholder="Select period"
                    value={value.lateFeePercentPeriod}
                    options={['Per Day', 'Per Week', 'Per Month', 'Per Year']}
                    onChange={(val) =>
                      update(
                        'lateFeePercentPeriod',
                        val as 'Per Day' | 'Per Week' | 'Per Month' | 'Per Year'
                      )
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
