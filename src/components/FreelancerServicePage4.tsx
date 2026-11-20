import React from 'react';
import { Plus, X } from 'lucide-react';
import { WhiteSelect } from './WhiteSelect';
import { TopicHeader } from './TopicHeader';
import {
  AgreementValiditySection,
  AgreementValidityValue,
  DEFAULT_AGREEMENT_VALIDITY
} from './AgreementValiditySection';
import {
  CircleIndicator,
  optionCardClass,
  TOPIC_DIVIDER_CLASS,
  SUBQUESTION_DIVIDER_CLASS
} from './OptionControl';

export interface FreelancerServiceDetails {
  // 1. Work to be Done
  workKind: string;
  workKindCustom: string;
  workTaskText: string;
  workDescription: string;
  finishNumber: string;
  finishUnit: string;

  // 2. Extra Changes
  extraChanges: string;

  // 3. Payment Method and Time
  paymentAmount: string;
  paymentHow: string;
  paymentWhenType: '' | 'before_start' | 'on_delivery' | 'within';
  paymentWhenNumber: string;
  paymentWhenUnit: string;
  taxesOption: string;

  // 4. Late Payment Fees
  hasLateFee: '' | 'Yes' | 'No';
  lateFeeGraceNumber: string;
  lateFeeGraceUnit: string;
  lateFeeType: '' | 'Fixed' | 'Percentage';
  lateFeeFixedAmount: string;
  lateFeePercentValue: string;
  lateFeePercentPeriod: string;

  // 5. Who Owns the Work
  workOwnership: string;

  // 6. Canceling the Work
  cancelNoticeType: '' | 'stop_immediately' | 'cannot_stop' | 'notice';
  cancelNoticeNumber: string;
  cancelNoticeUnit: string;
  cancelMoneyRule: string;

  // 7. Keep Things Private
  keepPrivate: string;

  // 8. Tools and Materials
  toolsAndMaterials: string;

  // 9. Extra Cost or Expenses
  extraCostExpenses: string;

  // 10. What Happens When Work is Done?
  workDoneConfirmation: string;

  // 11. Agreement Validity
  agreementValidity: AgreementValidityValue;

  // 13. Your Own Rules (rendered at very end of Page 4)
  hasOwnRules: '' | 'Yes' | 'No';
  ownRules: string[];
  ownRuleDraft: string;
}

export const DEFAULT_FREELANCER_SERVICE_DETAILS: FreelancerServiceDetails = {
  workKind: '',
  workKindCustom: '',
  workTaskText: '',
  workDescription: '',
  finishNumber: '',
  finishUnit: '',
  extraChanges: '',
  paymentAmount: '',
  paymentHow: '',
  paymentWhenType: '',
  paymentWhenNumber: '',
  paymentWhenUnit: '',
  taxesOption: '',
  hasLateFee: '',
  lateFeeGraceNumber: '',
  lateFeeGraceUnit: '',
  lateFeeType: '',
  lateFeeFixedAmount: '',
  lateFeePercentValue: '',
  lateFeePercentPeriod: '',
  workOwnership: '',
  cancelNoticeType: '',
  cancelNoticeNumber: '',
  cancelNoticeUnit: '',
  cancelMoneyRule: '',
  keepPrivate: '',
  toolsAndMaterials: '',
  extraCostExpenses: '',
  workDoneConfirmation: '',
  agreementValidity: DEFAULT_AGREEMENT_VALIDITY,
  hasOwnRules: '',
  ownRules: [],
  ownRuleDraft: ''
};

export const FREELANCER_WORK_KINDS = [
  'Video or Reels',
  'Photo or Design',
  'Writing or Script',
  'Website or App',
  'Marketing or Social Media',
  'Other Work'
];

export const FREELANCER_EXTRA_CHANGES_OPTIONS = [
  'Small changes up to two times are free, more changes cost extra.',
  'Small changes up to three times are free, more changes cost extra.',
  'No changes after work is delivered.',
  'Changes are allowed as agreed.'
];

export const FREELANCER_PAYMENT_HOW_OPTIONS = [
  'Full payment at once.',
  'Part by part as work moves forward.',
  'Every month.',
  'By the hour.'
];

export const FREELANCER_TAXES_OPTIONS = [
  'All taxes included.',
  'Taxes extra.',
  'No tax.'
];

export const FREELANCER_OWNERSHIP_OPTIONS = [
  'Client gets full ownership after full payment.',
  'Client owns it from day one.',
  'I keep ownership, client can only use it.',
  'Decided per work item.'
];

export const FREELANCER_CANCEL_MONEY_OPTIONS = [
  'Pay for work already done, advance is not returned.',
  'Return unused advance money only.',
  'Return full money if no work started.',
  'Both sides will decide together.'
];

export const FREELANCER_CONFIDENTIALITY_OPTIONS = [
  'Yes, keep it private.',
  'No need.',
  'Only until the work goes live.'
];

export const FREELANCER_TOOLS_OPTIONS = [
  'I will use my own tools and materials.',
  'Client will give needed files, access, or materials.',
  'Both sides will give what is needed.'
];

export const FREELANCER_EXTRA_COST_OPTIONS = [
  'No extra cost, I cover my own expenses.',
  'Client pays only if approved in advance.',
  'Client pays actual expense with bill proof.'
];

export const FREELANCER_DONE_CONFIRMATION_OPTIONS = [
  'Client confirms by message or email.',
  'Auto accepted if no reply in a set time.',
  'Once final files are sent and payment is made.'
];

const NUMBERS_1_TO_30 = Array.from({ length: 30 }, (_, i) => String(i + 1));
const NUMBERS_1_TO_31 = Array.from({ length: 31 }, (_, i) => String(i + 1));

export function getEffectiveOwnRules(details: FreelancerServiceDetails): string[] {
  const list = [...details.ownRules];
  if (details.ownRuleDraft.trim()) {
    list.push(details.ownRuleDraft.trim());
  }
  return list;
}

export function validateFreelancerServicePage4(
  details: FreelancerServiceDetails
): string | null {
  if (!details.workKind) {
    return 'Please select "What kind of work is this?" under Work to be Done.';
  }
  if (details.workKind === 'Other Work' && !details.workKindCustom.trim()) {
    return 'Please specify the custom work type under Work to be Done.';
  }
  if (!details.workTaskText.trim()) {
    return 'Please write what work you will do.';
  }
  if (!details.finishNumber || !details.finishUnit) {
    return 'Please select when you will finish and give the work.';
  }
  if (!details.extraChanges) {
    return 'Please select an option under Extra Changes.';
  }
  if (!details.paymentHow) {
    return 'Please select how the client will pay you.';
  }
  if (!details.paymentWhenType) {
    return 'Please select when the payment should come.';
  }
  if (
    details.paymentWhenType === 'within' &&
    (!details.paymentWhenNumber || !details.paymentWhenUnit)
  ) {
    return 'Please select days/week/month/year for payment timing.';
  }
  if (!details.taxesOption) {
    return 'Please select whether taxes like GST are extra or included.';
  }
  if (!details.hasLateFee) {
    return 'Please select Yes or No under Late Payment Fees.';
  }
  if (details.hasLateFee === 'Yes') {
    if (!details.lateFeeGraceNumber || !details.lateFeeGraceUnit) {
      return 'Please select the grace period before late fees start.';
    }
    if (!details.lateFeeType) {
      return 'Please select Fixed or Percentage for late fee charge.';
    }
    if (details.lateFeeType === 'Fixed' && !details.lateFeeFixedAmount.trim()) {
      return 'Please enter the Fixed late fee amount in Rupees.';
    }
    if (
      details.lateFeeType === 'Percentage' &&
      (!details.lateFeePercentValue.trim() || !details.lateFeePercentPeriod)
    ) {
      return 'Please enter the late fee percentage and frequency.';
    }
  }
  if (!details.workOwnership) {
    return 'Please select who will own the work once it is done.';
  }
  if (!details.cancelNoticeType) {
    return 'Please select notice terms under Canceling the Work.';
  }
  if (
    details.cancelNoticeType === 'notice' &&
    (!details.cancelNoticeNumber || !details.cancelNoticeUnit)
  ) {
    return 'Please select notice duration under Canceling the Work.';
  }
  if (!details.cancelMoneyRule) {
    return 'Please select what happens to money if the work stops early.';
  }
  if (!details.keepPrivate) {
    return 'Please select an option under Keep Things Private.';
  }
  if (!details.toolsAndMaterials) {
    return 'Please select an option under Tools and Materials.';
  }
  if (!details.extraCostExpenses) {
    return 'Please select an option under Extra Cost or Expenses.';
  }
  if (!details.workDoneConfirmation) {
    return 'Please select an option under What Happens When Work is Done?.';
  }
  if (!details.agreementValidity.option) {
    return 'Please select Agreement Validity.';
  }
  if (!details.hasOwnRules) {
    return 'Please answer Yes or No under Your Own Rules.';
  }
  if (details.hasOwnRules === 'Yes' && getEffectiveOwnRules(details).length === 0) {
    return 'Please type at least one rule in Your Own Rules or select No.';
  }
  return null;
}

interface FreelancerServicePage4Props {
  value: FreelancerServiceDetails;
  onChange: (next: FreelancerServiceDetails) => void;
}

export const FreelancerServicePage4: React.FC<FreelancerServicePage4Props> = ({
  value,
  onChange
}) => {
  const update = <K extends keyof FreelancerServiceDetails>(
    key: K,
    val: FreelancerServiceDetails[K]
  ) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-6">
      {/* 1. Work to be Done */}
      <div className="space-y-3.5">
        <TopicHeader
          number={1}
          title="Work to be Done"
          question="What work will you do and when will you get it?"
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs sm:text-sm font-bold text-slate-900">
            What kind of work is this? <span className="text-red-500">*</span>
          </label>
          <WhiteSelect
            value={value.workKind}
            onChange={(val) => update('workKind', val)}
            placeholder="Select work type"
            options={FREELANCER_WORK_KINDS}
            aria-label="What kind of work is this"
          />
          {value.workKind === 'Other Work' && (
            <input
              type="text"
              value={value.workKindCustom}
              onChange={(e) => update('workKindCustom', e.target.value)}
              placeholder="Specify custom work type..."
              className="mt-2 w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          )}
        </div>

        <div className={SUBQUESTION_DIVIDER_CLASS}>
          <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
            Write what work you will do <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={value.workTaskText}
            onChange={(e) => update('workTaskText', e.target.value)}
            placeholder="e.g. Edit 4 promotional reels and deliver final HD exports"
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className={SUBQUESTION_DIVIDER_CLASS}>
          <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
            Description <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            value={value.workDescription}
            onChange={(e) => update('workDescription', e.target.value)}
            placeholder="Add brief project details or specifications..."
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
          />
        </div>

        <div className={SUBQUESTION_DIVIDER_CLASS}>
          <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
            When will you finish and give the work? <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-28">
              <WhiteSelect
                variant="compact"
                aria-label="Finish duration number"
                placeholder="Select"
                value={value.finishNumber}
                options={NUMBERS_1_TO_31}
                onChange={(val) => update('finishNumber', val)}
              />
            </div>
            <div className="w-36">
              <WhiteSelect
                variant="compact"
                aria-label="Finish duration unit"
                placeholder="Select unit"
                value={value.finishUnit}
                options={['Day', 'Week', 'Month', 'Year']}
                onChange={(val) => update('finishUnit', val)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Extra Changes */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <TopicHeader
          number={2}
          title="Extra Changes"
          question="If the client asks for changes after the work is done, what will happen?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {FREELANCER_EXTRA_CHANGES_OPTIONS.map((option) => {
            const isSelected = value.extraChanges === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="flExtraChanges"
                  checked={isSelected}
                  onChange={() => update('extraChanges', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Payment Method and Time */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-4`}>
        <TopicHeader
          number={3}
          title="Payment Method and Time"
          question="How and when will payment be made?"
          required
        />

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Total Agreed Fee / Amount (₹) <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-slate-500">
              ₹
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={value.paymentAmount}
              onChange={(e) => update('paymentAmount', e.target.value)}
              placeholder="Enter total agreed amount (e.g. 15,000)"
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className={`${SUBQUESTION_DIVIDER_CLASS} space-y-2`}>
          <label className="block text-xs sm:text-sm font-bold text-slate-900">
            How will the client pay you? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FREELANCER_PAYMENT_HOW_OPTIONS.map((option) => {
              const isSelected = value.paymentHow === option;
              return (
                <label key={option} className={optionCardClass(isSelected)}>
                  <input
                    type="radio"
                    name="flPaymentHow"
                    checked={isSelected}
                    onChange={() => update('paymentHow', option)}
                    className="sr-only"
                  />
                  <CircleIndicator checked={isSelected} />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className={`${SUBQUESTION_DIVIDER_CLASS} space-y-2`}>
          <label className="block text-xs sm:text-sm font-bold text-slate-900">
            When should the payment come? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-2">
            <label className={optionCardClass(value.paymentWhenType === 'before_start')}>
              <input
                type="radio"
                name="flPaymentWhen"
                checked={value.paymentWhenType === 'before_start'}
                onChange={() => update('paymentWhenType', 'before_start')}
                className="sr-only"
              />
              <CircleIndicator checked={value.paymentWhenType === 'before_start'} />
              <span>Before starting / at the start.</span>
            </label>

            <label className={optionCardClass(value.paymentWhenType === 'on_delivery')}>
              <input
                type="radio"
                name="flPaymentWhen"
                checked={value.paymentWhenType === 'on_delivery'}
                onChange={() => update('paymentWhenType', 'on_delivery')}
                className="sr-only"
              />
              <CircleIndicator checked={value.paymentWhenType === 'on_delivery'} />
              <span>When work is delivered.</span>
            </label>

            <label className={optionCardClass(value.paymentWhenType === 'within', '', true)}>
              <input
                type="radio"
                name="flPaymentWhen"
                checked={value.paymentWhenType === 'within'}
                onChange={() => update('paymentWhenType', 'within')}
                className="sr-only"
              />
              <CircleIndicator checked={value.paymentWhenType === 'within'} className="mt-0.5" />
              <span className="leading-relaxed">
                Within
                <WhiteSelect
                  variant="inline"
                  aria-label="Payment due number"
                  placeholder="Select"
                  value={value.paymentWhenNumber}
                  options={NUMBERS_1_TO_31}
                  onTriggerClick={() => update('paymentWhenType', 'within')}
                  onChange={(val) =>
                    onChange({
                      ...value,
                      paymentWhenType: 'within',
                      paymentWhenNumber: val
                    })
                  }
                />
                <WhiteSelect
                  variant="inline"
                  aria-label="Payment due unit"
                  placeholder="Unit"
                  value={value.paymentWhenUnit}
                  options={['Days', 'Week', 'Month', 'Year']}
                  onTriggerClick={() => update('paymentWhenType', 'within')}
                  onChange={(val) =>
                    onChange({
                      ...value,
                      paymentWhenType: 'within',
                      paymentWhenUnit: val
                    })
                  }
                />
                of getting the bill.
              </span>
            </label>
          </div>
        </div>

        <div className={`${SUBQUESTION_DIVIDER_CLASS} space-y-2`}>
          <label className="block text-xs sm:text-sm font-bold text-slate-900">
            Are taxes like GST extra or included? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {FREELANCER_TAXES_OPTIONS.map((option) => {
              const isSelected = value.taxesOption === option;
              return (
                <label key={option} className={optionCardClass(isSelected)}>
                  <input
                    type="radio"
                    name="flTaxesOption"
                    checked={isSelected}
                    onChange={() => update('taxesOption', option)}
                    className="sr-only"
                  />
                  <CircleIndicator checked={isSelected} />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Late Payment Fees */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-3`}>
        <TopicHeader
          number={4}
          title="Late Payment Fees"
          question="Will there be a late fee if payment is delayed?"
          required
        />
        <div className="grid grid-cols-2 gap-2.5">
          {(['Yes', 'No'] as const).map((opt) => {
            const isSelected = value.hasLateFee === opt;
            return (
              <label key={opt} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="flHasLateFee"
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
                Grace period before late fees start <span className="text-red-500">*</span>
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
                    onChange={(val) => update('lateFeeGraceUnit', val)}
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
                        name="flLateFeeType"
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
                      onChange={(val) => update('lateFeePercentPeriod', val)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Who Owns the Work */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <TopicHeader
          number={5}
          title="Who Owns the Work"
          question="Who will own the work once it is done?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {FREELANCER_OWNERSHIP_OPTIONS.map((option) => {
            const isSelected = value.workOwnership === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="flWorkOwnership"
                  checked={isSelected}
                  onChange={() => update('workOwnership', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 6. Canceling the Work */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-4`}>
        <TopicHeader
          number={6}
          title="Canceling the Work"
          question="Notice period and payment terms if work is stopped early"
          required
        />

        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-bold text-slate-900">
            How many days notice is needed to stop or cancel this work early?{' '}
            <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-2">
            <label className={optionCardClass(value.cancelNoticeType === 'stop_immediately')}>
              <input
                type="radio"
                name="flCancelNotice"
                checked={value.cancelNoticeType === 'stop_immediately'}
                onChange={() => update('cancelNoticeType', 'stop_immediately')}
                className="sr-only"
              />
              <CircleIndicator checked={value.cancelNoticeType === 'stop_immediately'} />
              <span>Stop right away.</span>
            </label>

            <label className={optionCardClass(value.cancelNoticeType === 'cannot_stop')}>
              <input
                type="radio"
                name="flCancelNotice"
                checked={value.cancelNoticeType === 'cannot_stop'}
                onChange={() => update('cancelNoticeType', 'cannot_stop')}
                className="sr-only"
              />
              <CircleIndicator checked={value.cancelNoticeType === 'cannot_stop'} />
              <span>Cannot stop early.</span>
            </label>

            <label className={optionCardClass(value.cancelNoticeType === 'notice', '', true)}>
              <input
                type="radio"
                name="flCancelNotice"
                checked={value.cancelNoticeType === 'notice'}
                onChange={() => update('cancelNoticeType', 'notice')}
                className="sr-only"
              />
              <CircleIndicator checked={value.cancelNoticeType === 'notice'} className="mt-0.5" />
              <span className="leading-relaxed">
                <WhiteSelect
                  variant="inline"
                  aria-label="Cancellation notice number"
                  placeholder="Select"
                  value={value.cancelNoticeNumber}
                  options={NUMBERS_1_TO_31}
                  onTriggerClick={() => update('cancelNoticeType', 'notice')}
                  onChange={(val) =>
                    onChange({
                      ...value,
                      cancelNoticeType: 'notice',
                      cancelNoticeNumber: val
                    })
                  }
                />
                <WhiteSelect
                  variant="inline"
                  aria-label="Cancellation notice unit"
                  placeholder="Unit"
                  value={value.cancelNoticeUnit}
                  options={['Day', 'Week', 'Month', 'Year']}
                  onTriggerClick={() => update('cancelNoticeType', 'notice')}
                  onChange={(val) =>
                    onChange({
                      ...value,
                      cancelNoticeType: 'notice',
                      cancelNoticeUnit: val
                    })
                  }
                />
                notice.
              </span>
            </label>
          </div>
        </div>

        <div className={`${SUBQUESTION_DIVIDER_CLASS} space-y-2`}>
          <label className="block text-xs sm:text-sm font-bold text-slate-900">
            If the work stops early, what about the money? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-2">
            {FREELANCER_CANCEL_MONEY_OPTIONS.map((option) => {
              const isSelected = value.cancelMoneyRule === option;
              return (
                <label key={option} className={optionCardClass(isSelected)}>
                  <input
                    type="radio"
                    name="flCancelMoney"
                    checked={isSelected}
                    onChange={() => update('cancelMoneyRule', option)}
                    className="sr-only"
                  />
                  <CircleIndicator checked={isSelected} />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* 7. Keep Things Private */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <TopicHeader
          number={7}
          title="Keep Things Private"
          question="Should both sides keep private work details and scripts confidential?"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {FREELANCER_CONFIDENTIALITY_OPTIONS.map((option) => {
            const isSelected = value.keepPrivate === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="flKeepPrivate"
                  checked={isSelected}
                  onChange={() => update('keepPrivate', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 8. Tools and Materials */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <TopicHeader
          number={8}
          title="Tools and Materials"
          question="Who will provide tools, software, or materials needed for the work?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {FREELANCER_TOOLS_OPTIONS.map((option) => {
            const isSelected = value.toolsAndMaterials === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="flTools"
                  checked={isSelected}
                  onChange={() => update('toolsAndMaterials', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 9. Extra Cost or Expenses */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <TopicHeader
          number={9}
          title="Extra Cost or Expenses"
          question="If any extra cost comes up while doing the work like paid stock, travel, or tools, who pays?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {FREELANCER_EXTRA_COST_OPTIONS.map((option) => {
            const isSelected = value.extraCostExpenses === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="flExtraCost"
                  checked={isSelected}
                  onChange={() => update('extraCostExpenses', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 10. What Happens When Work is Done? */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <TopicHeader
          number={10}
          title="What Happens When Work is Done?"
          question="When the work is finished, how do both sides say done?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {FREELANCER_DONE_CONFIRMATION_OPTIONS.map((option) => {
            const isSelected = value.workDoneConfirmation === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="flDoneConfirm"
                  checked={isSelected}
                  onChange={() => update('workDoneConfirmation', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 11. Agreement Validity */}
      <div className={TOPIC_DIVIDER_CLASS}>
        <AgreementValiditySection
          topicNumber={11}
          value={value.agreementValidity}
          onChange={(next) => update('agreementValidity', next)}
        />
      </div>
    </div>
  );
};

interface FreelancerOwnRulesSectionProps {
  topicNumber?: number;
  value: FreelancerServiceDetails;
  onChange: (next: FreelancerServiceDetails) => void;
}

export const FreelancerOwnRulesSection: React.FC<FreelancerOwnRulesSectionProps> = ({
  topicNumber = 13,
  value,
  onChange
}) => {
  const commitDraftRule = () => {
    const trimmed = value.ownRuleDraft.trim();
    if (!trimmed) return;
    onChange({
      ...value,
      ownRules: [...value.ownRules, trimmed],
      ownRuleDraft: ''
    });
  };

  const removeRule = (index: number) => {
    onChange({
      ...value,
      ownRules: value.ownRules.filter((_, idx) => idx !== index)
    });
  };

  return (
    <div className={`${TOPIC_DIVIDER_CLASS} space-y-3`}>
      <TopicHeader
        number={topicNumber}
        title="Your Own Rules"
        question="Do you want to add any other rules of your own?"
        required
      />

      <div className="grid grid-cols-2 gap-2.5">
        {(['Yes', 'No'] as const).map((opt) => {
          const isSelected = value.hasOwnRules === opt;
          return (
            <label key={opt} className={optionCardClass(isSelected)}>
              <input
                type="radio"
                name="flHasOwnRules"
                checked={isSelected}
                onChange={() => onChange({ ...value, hasOwnRules: opt })}
                className="sr-only"
              />
              <CircleIndicator checked={isSelected} />
              <span>{opt}</span>
            </label>
          );
        })}
      </div>

      {value.hasOwnRules === 'Yes' && (
        <div className="rounded-xl border border-slate-300 bg-white p-3.5 space-y-2.5 animate-fadeIn">
          <div className="text-[11px] font-semibold text-slate-500">
            Type a rule below and press <span className="font-bold text-slate-700">Enter</span> to add a new bullet point:
          </div>

          {value.ownRules.length > 0 && (
            <ul className="space-y-1.5">
              {value.ownRules.map((rule, idx) => (
                <li
                  key={`${idx}-${rule.slice(0, 12)}`}
                  className="flex items-start justify-between gap-2 bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-900"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="font-bold text-blue-600 shrink-0">&bull;</span>
                    <span className="break-words">{rule}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRule(idx)}
                    className="p-0.5 text-slate-400 hover:text-rose-600 shrink-0 cursor-pointer"
                    aria-label="Remove rule"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-600">
            <span className="font-bold text-blue-600 text-sm shrink-0">&bull;</span>
            <input
              type="text"
              enterKeyHint="done"
              value={value.ownRuleDraft}
              onChange={(e) => onChange({ ...value, ownRuleDraft: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitDraftRule();
                }
              }}
              placeholder="Write your rule and press Enter..."
              className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 focus:outline-none"
            />
            {value.ownRuleDraft.trim() && (
              <button
                type="button"
                onClick={commitDraftRule}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold shrink-0 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
