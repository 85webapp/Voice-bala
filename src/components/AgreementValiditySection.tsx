import React from 'react';
import { WhiteSelect } from './WhiteSelect';
import { TopicHeader } from './TopicHeader';
import { CircleIndicator, optionCardClass } from './OptionControl';

export type AgreementValidityOption = 'until_finished' | 'forever' | 'custom';
export type AgreementValidityUnit = 'Days' | 'Week' | 'Month' | 'Year';

export interface AgreementValidityValue {
  option: AgreementValidityOption | '';
  customNumber: number;
  customUnit: AgreementValidityUnit;
}

export const DEFAULT_AGREEMENT_VALIDITY: AgreementValidityValue = {
  option: '',
  customNumber: 1,
  customUnit: 'Year'
};

export function isAgreementValidityValid(val: AgreementValidityValue): boolean {
  if (!val.option) return false;
  if (val.option === 'custom') {
    return val.customNumber >= 1 && Boolean(val.customUnit);
  }
  return true;
}

export const AGREEMENT_VALIDITY_OPTIONS_LABELS = [
  'Until the work/rights are finished',
  'Forever (until cancelled in writing)',
  'Custom Duration (1–31 Days / Week / Month / Year)'
];

export function formatAgreementValidity(val: AgreementValidityValue): string {
  if (!val.option) return '';
  if (val.option === 'until_finished') {
    return 'Until the work/rights are finished';
  }
  if (val.option === 'forever') {
    return 'Forever (until cancelled in writing)';
  }
  return `${val.customNumber} ${val.customUnit}`;
}

const NUMBERS_1_TO_31 = Array.from({ length: 31 }, (_, i) => String(i + 1));

interface AgreementValiditySectionProps {
  topicNumber?: number;
  value: AgreementValidityValue;
  onChange: (next: AgreementValidityValue) => void;
  isAffidavit?: boolean;
}

export const AgreementValiditySection: React.FC<AgreementValiditySectionProps> = ({
  topicNumber,
  value,
  onChange,
  isAffidavit = false
}) => {
  return (
    <div className="space-y-2.5">
      <TopicHeader
        number={topicNumber}
        title="Agreement Validity"
        question={
          isAffidavit
            ? 'How long will this agreement / affidavit stay valid?'
            : 'How long will the agreement stay valid?'
        }
        required
      />

      <div className="grid grid-cols-1 gap-2">
        <label className={optionCardClass(value.option === 'until_finished')}>
          <input
            type="radio"
            name="agreementValidityOption"
            checked={value.option === 'until_finished'}
            onChange={() => onChange({ ...value, option: 'until_finished' })}
            className="sr-only"
          />
          <CircleIndicator checked={value.option === 'until_finished'} />
          <span>Until the work/rights are finished</span>
        </label>

        <label className={optionCardClass(value.option === 'forever')}>
          <input
            type="radio"
            name="agreementValidityOption"
            checked={value.option === 'forever'}
            onChange={() => onChange({ ...value, option: 'forever' })}
            className="sr-only"
          />
          <CircleIndicator checked={value.option === 'forever'} />
          <span>Forever (until cancelled in writing)</span>
        </label>

        <label className={optionCardClass(value.option === 'custom', '', true)}>
          <input
            type="radio"
            name="agreementValidityOption"
            checked={value.option === 'custom'}
            onChange={() => onChange({ ...value, option: 'custom' })}
            className="sr-only"
          />
          <CircleIndicator checked={value.option === 'custom'} className="mt-0.5" />
          <span className="flex flex-wrap items-center gap-y-1">
            <span>Custom duration:</span>
            <WhiteSelect
              variant="inline"
              aria-label="Agreement validity duration number"
              value={String(value.customNumber)}
              options={NUMBERS_1_TO_31}
              onTriggerClick={() => onChange({ ...value, option: 'custom' })}
              onChange={(val) =>
                onChange({
                  ...value,
                  option: 'custom',
                  customNumber: Number(val)
                })
              }
            />
            <WhiteSelect
              variant="inline"
              aria-label="Agreement validity duration unit"
              value={value.customUnit}
              options={['Days', 'Week', 'Month', 'Year']}
              onTriggerClick={() => onChange({ ...value, option: 'custom' })}
              onChange={(val) =>
                onChange({
                  ...value,
                  option: 'custom',
                  customUnit: val as AgreementValidityUnit
                })
              }
            />
          </span>
        </label>
      </div>
    </div>
  );
};
