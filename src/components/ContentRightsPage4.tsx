import React from 'react';
import { WhiteSelect } from './WhiteSelect';
import { TopicHeader } from './TopicHeader';
import {
  AgreementValiditySection,
  AgreementValidityValue,
  DEFAULT_AGREEMENT_VALIDITY,
  isAgreementValidityValid
} from './AgreementValiditySection';
import {
  CircleIndicator,
  optionCardClass,
  TOPIC_DIVIDER_CLASS,
  SUBQUESTION_DIVIDER_CLASS
} from './OptionControl';

export interface ContentRightsDetails {
  // 1. Nature of Content
  natureOfContent: string;
  natureOfContentCustom: string;
  contentTitle: string;
  contentDescription: string;

  // 2. Type of Rights Granted
  rightsGrantedType: '' | 'full_ownership' | 'exclusive_timed' | 'non_exclusive';
  exclusiveNumber: number; // 1..31
  exclusiveUnit: 'Day' | 'Month' | 'Year';

  // 3. Right to Modify
  rightToModify: string;

  // 4. Payment Structure
  paymentAmount: string;
  paymentMadeHow: string;
  paymentClearedWhen: '' | 'immediate' | 'within' | 'custom';
  paymentClearedNumber: number; // 1..31
  paymentClearedUnit: 'Days' | 'Months' | 'Years';
  paymentClearedCustom: string;
  taxesIncluded: string;

  // 5. Late Fees
  hasLateFee: '' | 'Yes' | 'No';
  lateFeeGraceNumber: number; // 1..30
  lateFeeGraceUnit: 'Day' | 'Month' | 'Year';
  lateFeeType: '' | 'Fixed' | 'Percentage';
  lateFeeFixedAmount: string;
  lateFeePercentValue: string;
  lateFeePercentPeriod: 'Per Day' | 'Per Week' | 'Per Month' | 'Per Year';

  // 6. Originality & Third Party Claim
  originalityClaim: string;

  // 7. Content Format and File Proof
  contentLink: string;

  // 8. Usage / Platform Limit (multi-select)
  usagePlatforms: string[];

  // 9. Time Period / Validity
  usageTimePeriod: string;
  usageTimePeriodCustom: string;

  // 10. Reuse / Release Restriction
  reuseRestriction: string;

  // 11. Take Down / Removal if Dispute Happens
  takeDownOnDispute: '' | 'Yes' | 'No';

  // 12. Creator Name
  creatorNameCredit: string;

  // 13. Confidentiality / Private Project Details
  confidentiality: string;

  // 14. Agreement Validity
  agreementValidity: AgreementValidityValue;

  // 15. Termination / Cancellation Notice
  terminationNoticeType: '' | 'immediate' | '7_days' | 'custom';
  terminationNoticeNumber: number; // 1..31
  terminationNoticeUnit: 'Days' | 'Week' | 'Month' | 'Year';
}

export const DEFAULT_CONTENT_RIGHTS_DETAILS: ContentRightsDetails = {
  natureOfContent: '',
  natureOfContentCustom: '',
  contentTitle: '',
  contentDescription: '',
  rightsGrantedType: '',
  exclusiveNumber: 1,
  exclusiveUnit: 'Year',
  rightToModify: '',
  paymentAmount: '',
  paymentMadeHow: '',
  paymentClearedWhen: '',
  paymentClearedNumber: 7,
  paymentClearedUnit: 'Days',
  paymentClearedCustom: '',
  taxesIncluded: '',
  hasLateFee: '',
  lateFeeGraceNumber: 1,
  lateFeeGraceUnit: 'Month',
  lateFeeType: '',
  lateFeeFixedAmount: '',
  lateFeePercentValue: '',
  lateFeePercentPeriod: 'Per Month',
  originalityClaim: '',
  contentLink: '',
  usagePlatforms: [],
  usageTimePeriod: '',
  usageTimePeriodCustom: '',
  reuseRestriction: '',
  takeDownOnDispute: '',
  creatorNameCredit: '',
  confidentiality: '',
  agreementValidity: DEFAULT_AGREEMENT_VALIDITY,
  terminationNoticeType: '',
  terminationNoticeNumber: 15,
  terminationNoticeUnit: 'Days'
};

export function validateContentRightsPage4(details: ContentRightsDetails): string | null {
  if (!details.natureOfContent) {
    return 'Please select Nature of Content.';
  }
  if (details.natureOfContent === 'Others' && !details.natureOfContentCustom.trim()) {
    return 'Please specify the custom Nature of Content.';
  }
  if (!details.rightsGrantedType) {
    return 'Please select Type of Rights Granted.';
  }
  if (!details.rightToModify) {
    return 'Please select Right to Modify.';
  }
  if (!details.paymentMadeHow) {
    return 'Please select how the payment will be made.';
  }
  if (!details.paymentClearedWhen) {
    return 'Please select when the payment should be cleared.';
  }
  if (details.paymentClearedWhen === 'custom' && !details.paymentClearedCustom.trim()) {
    return 'Please specify the custom payment clearance timing.';
  }
  if (!details.taxesIncluded) {
    return 'Please select an option for Taxes / GST.';
  }
  if (!details.hasLateFee) {
    return 'Please select Yes or No for Late Fees.';
  }
  if (details.hasLateFee === 'Yes') {
    if (!details.lateFeeType) {
      return 'Please select Fixed or Percentage for Late Fees.';
    }
    if (details.lateFeeType === 'Fixed' && !details.lateFeeFixedAmount.trim()) {
      return 'Please enter the Fixed late fee amount in Rupees.';
    }
    if (details.lateFeeType === 'Percentage' && !details.lateFeePercentValue.trim()) {
      return 'Please enter the late fee Percentage value.';
    }
  }
  if (!details.originalityClaim) {
    return 'Please select an option under Originality and Third Party Claim.';
  }
  if (!details.contentLink.trim()) {
    return 'Please paste the Content Link / file proof location.';
  }
  if (details.usagePlatforms.length === 0) {
    return 'Please select at least one Usage / Platform Limit option.';
  }
  if (!details.usageTimePeriod) {
    return 'Please select Time Period / Validity.';
  }
  if (details.usageTimePeriod === 'Custom' && !details.usageTimePeriodCustom.trim()) {
    return 'Please specify the custom Time Period / Validity.';
  }
  if (!details.reuseRestriction) {
    return 'Please select Reuse / Release Restriction.';
  }
  if (!details.takeDownOnDispute) {
    return 'Please select Take Down / Removal if Dispute Happens.';
  }
  if (!details.creatorNameCredit) {
    return 'Please select Creator Name Credit preference.';
  }
  if (!details.confidentiality) {
    return 'Please select Confidentiality / Project Privacy preference.';
  }
  if (!isAgreementValidityValid(details.agreementValidity)) {
    return 'Please select Agreement Validity.';
  }
  if (!details.terminationNoticeType) {
    return 'Please select Termination / Cancellation Notice.';
  }
  return null;
}

export const CONTENT_NATURE_OPTIONS = [
  'Video / Film',
  'Music / Audio',
  'Written Article / Blog',
  'Graphic Design / Art',
  'Software / Code',
  'Photography',
  'Others'
];

export const RIGHT_TO_MODIFY_OPTIONS = [
  'Yes',
  'No',
  'Only with prior written approval'
];

export const PAYMENT_MADE_HOW_OPTIONS = [
  'One-time full payment',
  'Part by part / Milestone based',
  'Share in earnings / Royalty'
];

export const TAXES_OPTIONS = [
  'All taxes included',
  'Taxes extra as applicable',
  'No taxes applicable'
];

export const ORIGINALITY_CLAIM_OPTIONS = [
  '100% original — Creator takes full responsibility for any third-party claim',
  'Includes stock / third-party item — Item listed in deliverable',
  'Buyer provides raw materials — Buyer takes responsibility for raw files'
];

export const USAGE_PLATFORM_OPTIONS = [
  'YouTube',
  'Instagram',
  'Facebook',
  'Website',
  'Ads / Paid Promotion',
  'TV / OTT',
  'All Platforms'
];

export const TIME_PERIOD_OPTIONS = ['Perpetual', '1 Year', 'Custom'];

export const REUSE_RESTRICTION_OPTIONS = [
  'Yes',
  'No',
  'Only with written permission'
];

export const CREATOR_NAME_OPTIONS = [
  'Yes, mention my name/page is required',
  'No need to mention my name/page',
  'Up to the hirer (optional)'
];

export const CONFIDENTIALITY_OPTIONS = [
  'Yes, keep private details secret',
  'No, not needed',
  'Only until the content is published'
];

const NUMBERS_1_TO_30 = Array.from({ length: 30 }, (_, i) => String(i + 1));
const NUMBERS_1_TO_31 = Array.from({ length: 31 }, (_, i) => String(i + 1));

interface ContentRightsPage4Props {
  value: ContentRightsDetails;
  onChange: (next: ContentRightsDetails) => void;
}

export const ContentRightsPage4: React.FC<ContentRightsPage4Props> = ({
  value,
  onChange
}) => {
  const update = <K extends keyof ContentRightsDetails>(
    key: K,
    val: ContentRightsDetails[K]
  ) => {
    onChange({ ...value, [key]: val });
  };

  const toggleUsagePlatform = (platform: string) => {
    const exists = value.usagePlatforms.includes(platform);
    const next = exists
      ? value.usagePlatforms.filter((p) => p !== platform)
      : [...value.usagePlatforms, platform];
    update('usagePlatforms', next);
  };

  return (
    <div className="space-y-6">
      {/* 1. Nature of Content + Title + Description */}
      <div className="space-y-3">
        <TopicHeader
          number={1}
          title="Nature of Content"
          question="What type of content is covered under this agreement?"
          required
        />
        <div>
          <WhiteSelect
            value={value.natureOfContent}
            onChange={(val) => update('natureOfContent', val)}
            placeholder="Select nature of content"
            options={CONTENT_NATURE_OPTIONS}
            aria-label="Nature of Content"
          />
        </div>

        {value.natureOfContent === 'Others' && (
          <input
            type="text"
            value={value.natureOfContentCustom}
            onChange={(e) => update('natureOfContentCustom', e.target.value)}
            placeholder="Specify nature of content..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        )}

        <div className={SUBQUESTION_DIVIDER_CLASS}>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={value.contentTitle}
            onChange={(e) => update('contentTitle', e.target.value)}
            placeholder="Enter title of the content / work"
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className={SUBQUESTION_DIVIDER_CLASS}>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={value.contentDescription}
            onChange={(e) => update('contentDescription', e.target.value)}
            placeholder="Describe the content briefly..."
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
          />
        </div>
      </div>

      {/* 2. Type of Rights Granted */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={2}
          title="Type of Rights Granted"
          question="What rights are you giving to the buyer?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          <label className={optionCardClass(value.rightsGrantedType === 'full_ownership')}>
            <input
              type="radio"
              name="rightsGrantedType"
              checked={value.rightsGrantedType === 'full_ownership'}
              onChange={() => update('rightsGrantedType', 'full_ownership')}
              className="sr-only"
            />
            <CircleIndicator checked={value.rightsGrantedType === 'full_ownership'} />
            <span>Full ownership forever (Buyer becomes the owner)</span>
          </label>

          <label className={optionCardClass(value.rightsGrantedType === 'exclusive_timed', '', true)}>
            <input
              type="radio"
              name="rightsGrantedType"
              checked={value.rightsGrantedType === 'exclusive_timed'}
              onChange={() => update('rightsGrantedType', 'exclusive_timed')}
              className="sr-only"
            />
            <CircleIndicator checked={value.rightsGrantedType === 'exclusive_timed'} className="mt-0.5" />
            <span className="leading-relaxed">
              Only buyer can use it for
              <WhiteSelect
                variant="inline"
                aria-label="Exclusive rights duration number"
                value={String(value.exclusiveNumber)}
                options={NUMBERS_1_TO_31}
                onTriggerClick={() => update('rightsGrantedType', 'exclusive_timed')}
                onChange={(val) =>
                  onChange({
                    ...value,
                    rightsGrantedType: 'exclusive_timed',
                    exclusiveNumber: Number(val)
                  })
                }
              />
              <WhiteSelect
                variant="inline"
                aria-label="Exclusive rights duration unit"
                value={value.exclusiveUnit}
                options={['Day', 'Month', 'Year']}
                onTriggerClick={() => update('rightsGrantedType', 'exclusive_timed')}
                onChange={(val) =>
                  onChange({
                    ...value,
                    rightsGrantedType: 'exclusive_timed',
                    exclusiveUnit: val as 'Day' | 'Month' | 'Year'
                  })
                }
              />
              time (Exclusive)
            </span>
          </label>

          <label className={optionCardClass(value.rightsGrantedType === 'non_exclusive')}>
            <input
              type="radio"
              name="rightsGrantedType"
              checked={value.rightsGrantedType === 'non_exclusive'}
              onChange={() => update('rightsGrantedType', 'non_exclusive')}
              className="sr-only"
            />
            <CircleIndicator checked={value.rightsGrantedType === 'non_exclusive'} />
            <span>Buyer and other people can also use it (Non-Exclusive)</span>
          </label>
        </div>
      </div>

      {/* 3. Right to Modify */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={3}
          title="Right to Modify"
          question="Can the buyer edit, remix, translate, etc., or make changes to the content?"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {RIGHT_TO_MODIFY_OPTIONS.map((option) => {
            const isSelected = value.rightToModify === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="rightToModify"
                  checked={isSelected}
                  onChange={() => update('rightToModify', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Payment Structure */}
      <div className={TOPIC_DIVIDER_CLASS}>
        <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4">
          <TopicHeader
            number={4}
            title="Payment Structure"
            question="Total Payment / Fee Amount & Schedule"
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Total Payment / Fee Amount (₹) <span className="text-slate-400 font-normal">(Optional)</span>
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
                placeholder="Enter agreed amount (e.g. 25,000)"
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Q1 */}
          <div className={`${SUBQUESTION_DIVIDER_CLASS} space-y-2`}>
            <label className="block text-xs sm:text-sm font-bold text-slate-900">
              How will the payment be made? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PAYMENT_MADE_HOW_OPTIONS.map((option) => {
                const isSelected = value.paymentMadeHow === option;
                return (
                  <label key={option} className={optionCardClass(isSelected)}>
                    <input
                      type="radio"
                      name="paymentMadeHow"
                      checked={isSelected}
                      onChange={() => update('paymentMadeHow', option)}
                      className="sr-only"
                    />
                    <CircleIndicator checked={isSelected} />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Q2 */}
          <div className={`${SUBQUESTION_DIVIDER_CLASS} space-y-2`}>
            <label className="block text-xs sm:text-sm font-bold text-slate-900">
              When should the payment be cleared? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              <label className={optionCardClass(value.paymentClearedWhen === 'immediate')}>
                <input
                  type="radio"
                  name="paymentClearedWhen"
                  checked={value.paymentClearedWhen === 'immediate'}
                  onChange={() => update('paymentClearedWhen', 'immediate')}
                  className="sr-only"
                />
                <CircleIndicator checked={value.paymentClearedWhen === 'immediate'} />
                <span>Immediately on delivery</span>
              </label>

              <label className={optionCardClass(value.paymentClearedWhen === 'within', '', true)}>
                <input
                  type="radio"
                  name="paymentClearedWhen"
                  checked={value.paymentClearedWhen === 'within'}
                  onChange={() => update('paymentClearedWhen', 'within')}
                  className="sr-only"
                />
                <CircleIndicator checked={value.paymentClearedWhen === 'within'} className="mt-0.5" />
                <span className="leading-relaxed">
                  Within
                  <WhiteSelect
                    variant="inline"
                    aria-label="Payment clearance duration number"
                    value={String(value.paymentClearedNumber)}
                    options={NUMBERS_1_TO_31}
                    onTriggerClick={() => update('paymentClearedWhen', 'within')}
                    onChange={(val) =>
                      onChange({
                        ...value,
                        paymentClearedWhen: 'within',
                        paymentClearedNumber: Number(val)
                      })
                    }
                  />
                  <WhiteSelect
                    variant="inline"
                    aria-label="Payment clearance duration unit"
                    value={value.paymentClearedUnit}
                    options={['Days', 'Months', 'Years']}
                    onTriggerClick={() => update('paymentClearedWhen', 'within')}
                    onChange={(val) =>
                      onChange({
                        ...value,
                        paymentClearedWhen: 'within',
                        paymentClearedUnit: val as 'Days' | 'Months' | 'Years'
                      })
                    }
                  />
                  of delivery
                </span>
              </label>

              <label className={optionCardClass(value.paymentClearedWhen === 'custom')}>
                <input
                  type="radio"
                  name="paymentClearedWhen"
                  checked={value.paymentClearedWhen === 'custom'}
                  onChange={() => update('paymentClearedWhen', 'custom')}
                  className="sr-only"
                />
                <CircleIndicator checked={value.paymentClearedWhen === 'custom'} />
                <span>Custom</span>
              </label>
            </div>
            {value.paymentClearedWhen === 'custom' && (
              <input
                type="text"
                value={value.paymentClearedCustom}
                onChange={(e) => update('paymentClearedCustom', e.target.value)}
                placeholder="Specify custom payment clearance schedule..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            )}
          </div>

          {/* Q3 */}
          <div className={`${SUBQUESTION_DIVIDER_CLASS} space-y-2`}>
            <label className="block text-xs sm:text-sm font-bold text-slate-900">
              Are taxes (like GST) included in this amount or extra? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TAXES_OPTIONS.map((option) => {
                const isSelected = value.taxesIncluded === option;
                return (
                  <label key={option} className={optionCardClass(isSelected)}>
                    <input
                      type="radio"
                      name="taxesIncluded"
                      checked={isSelected}
                      onChange={() => update('taxesIncluded', option)}
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
      </div>

      {/* 5. Late Fees */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-3`}>
        <TopicHeader
          number={5}
          title="Late Fees"
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
                  name="hasLateFee"
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
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-800">
                <WhiteSelect
                  variant="inline"
                  aria-label="Late fee grace duration number"
                  value={String(value.lateFeeGraceNumber)}
                  options={NUMBERS_1_TO_30}
                  onChange={(val) => update('lateFeeGraceNumber', Number(val))}
                />
                <WhiteSelect
                  variant="inline"
                  aria-label="Late fee grace duration unit"
                  value={value.lateFeeGraceUnit}
                  options={['Day', 'Month', 'Year']}
                  onChange={(val) =>
                    update('lateFeeGraceUnit', val as 'Day' | 'Month' | 'Year')
                  }
                />
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
                        name="lateFeeType"
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
                  <span className="block text-[11px] font-bold text-slate-600 mb-1">
                    Fixed
                  </span>
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

      {/* 6. Originality and Third Party Claim */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={6}
          title="Originality and Third Party Claim"
          question="Is this content 100% original, and who takes responsibility if someone else claims rights over it?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {ORIGINALITY_CLAIM_OPTIONS.map((option) => {
            const isSelected = value.originalityClaim === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="originalityClaim"
                  checked={isSelected}
                  onChange={() => update('originalityClaim', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 7. Content Link */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={7}
          title="Content Link"
          question="Paste the content link or file proof location"
          required
        />
        <input
          type="text"
          value={value.contentLink}
          onChange={(e) => update('contentLink', e.target.value)}
          placeholder="Paste content link (Google Drive, YouTube, etc.)"
          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* 8. Usage / Platform Limit (Multi-select) */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <div className="flex items-start justify-between gap-2">
          <TopicHeader
            number={8}
            title="Usage / Platform Limit"
            question="Where can this content be used?"
            required
          />
          <span className="text-[11px] text-slate-500 font-medium shrink-0">
            Multiple selections allowed
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {USAGE_PLATFORM_OPTIONS.map((platform) => {
            const isChecked = value.usagePlatforms.includes(platform);
            return (
              <label key={platform} className={optionCardClass(isChecked)}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleUsagePlatform(platform)}
                  className="sr-only"
                />
                <CircleIndicator checked={isChecked} />
                <span>{platform}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 9. Time Period / Validity */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={9}
          title="Time Period / Validity"
          question="How long can the buyer use this content?"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TIME_PERIOD_OPTIONS.map((option) => {
            const isSelected = value.usageTimePeriod === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="usageTimePeriod"
                  checked={isSelected}
                  onChange={() => update('usageTimePeriod', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
        {value.usageTimePeriod === 'Custom' && (
          <input
            type="text"
            value={value.usageTimePeriodCustom}
            onChange={(e) => update('usageTimePeriodCustom', e.target.value)}
            placeholder="Specify custom usage time period..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        )}
      </div>

      {/* 10. Reuse / Release Restriction */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={10}
          title="Reuse / Release Restriction"
          question="Can the buyer sell / transfer this right to another party?"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {REUSE_RESTRICTION_OPTIONS.map((option) => {
            const isSelected = value.reuseRestriction === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="reuseRestriction"
                  checked={isSelected}
                  onChange={() => update('reuseRestriction', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 11. Take Down / Removal if Dispute Happens */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={11}
          title="Take Down / Removal if Dispute Happens"
          question="If payment is not made or agreement is broken, should content be taken down?"
          required
        />
        <div className="grid grid-cols-2 gap-2.5">
          {(['Yes', 'No'] as const).map((option) => {
            const isSelected = value.takeDownOnDispute === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="takeDownOnDispute"
                  checked={isSelected}
                  onChange={() => update('takeDownOnDispute', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 12. Creator Name */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={12}
          title="Creator Name"
          question="Should the hirer mention your name or channel/page when posting this content?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {CREATOR_NAME_OPTIONS.map((option) => {
            const isSelected = value.creatorNameCredit === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="creatorNameCredit"
                  checked={isSelected}
                  onChange={() => update('creatorNameCredit', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 13. Confidentiality / Private Project Details */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={13}
          title="Confidentiality / Project Privacy"
          question="Should both sides keep private project details and unpublished content script secret?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {CONFIDENTIALITY_OPTIONS.map((option) => {
            const isSelected = value.confidentiality === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="confidentiality"
                  checked={isSelected}
                  onChange={() => update('confidentiality', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 14. Agreement Validity */}
      <div className={TOPIC_DIVIDER_CLASS}>
        <AgreementValiditySection
          topicNumber={14}
          value={value.agreementValidity}
          onChange={(next) => update('agreementValidity', next)}
        />
      </div>

      {/* 15. Termination / Cancellation Notice */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={15}
          title="Termination / Cancellation Notice"
          question="How many days notice is needed to cancel/end this agreement early?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          <label className={optionCardClass(value.terminationNoticeType === 'immediate')}>
            <input
              type="radio"
              name="terminationNoticeType"
              checked={value.terminationNoticeType === 'immediate'}
              onChange={() => update('terminationNoticeType', 'immediate')}
              className="sr-only"
            />
            <CircleIndicator checked={value.terminationNoticeType === 'immediate'} />
            <span>Immediate</span>
          </label>

          <label className={optionCardClass(value.terminationNoticeType === '7_days')}>
            <input
              type="radio"
              name="terminationNoticeType"
              checked={value.terminationNoticeType === '7_days'}
              onChange={() => update('terminationNoticeType', '7_days')}
              className="sr-only"
            />
            <CircleIndicator checked={value.terminationNoticeType === '7_days'} />
            <span>7 days notice</span>
          </label>

          <label className={optionCardClass(value.terminationNoticeType === 'custom', '', true)}>
            <input
              type="radio"
              name="terminationNoticeType"
              checked={value.terminationNoticeType === 'custom'}
              onChange={() => update('terminationNoticeType', 'custom')}
              className="sr-only"
            />
            <CircleIndicator checked={value.terminationNoticeType === 'custom'} className="mt-0.5" />
            <span className="leading-relaxed">
              <WhiteSelect
                variant="inline"
                aria-label="Termination notice duration number"
                value={String(value.terminationNoticeNumber)}
                options={NUMBERS_1_TO_31}
                onTriggerClick={() => update('terminationNoticeType', 'custom')}
                onChange={(val) =>
                  onChange({
                    ...value,
                    terminationNoticeType: 'custom',
                    terminationNoticeNumber: Number(val)
                  })
                }
              />
              <WhiteSelect
                variant="inline"
                aria-label="Termination notice duration unit"
                value={value.terminationNoticeUnit}
                options={['Days', 'Week', 'Month', 'Year']}
                onTriggerClick={() => update('terminationNoticeType', 'custom')}
                onChange={(val) =>
                  onChange({
                    ...value,
                    terminationNoticeType: 'custom',
                    terminationNoticeUnit: val as 'Days' | 'Week' | 'Month' | 'Year'
                  })
                }
              />
              notice
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
