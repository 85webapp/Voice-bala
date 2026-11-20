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
  PAYMENT_MADE_HOW_OPTIONS,
  TAXES_OPTIONS,
  ORIGINALITY_CLAIM_OPTIONS,
  CONFIDENTIALITY_OPTIONS
} from './ContentRightsPage4';
import {
  CircleIndicator,
  optionCardClass,
  TOPIC_DIVIDER_CLASS,
  SUBQUESTION_DIVIDER_CLASS
} from './OptionControl';

export interface CopyrightTransferDetails {
  // 1. What work is being transferred?
  contentType: string;
  contentTypeCustom: string;
  workTitle: string;
  projectName: string;
  workDescription: string;
  contentLink: string;

  // 2. Transfer scope and type
  transferScope: '' | 'complete_forever' | 'specific_period' | 'specific_uses';
  transferPeriodNumber: number; // 1..31
  transferPeriodUnit: 'Day' | 'Week' | 'Month' | 'Year';
  transferSpecificUses: string;

  // 3. Past use / prior publication
  pastUseStatus: '' | 'new_unpublished' | 'published_earlier';
  pastUseDetails: string;

  // 4. When does transfer take effect?
  transferEffectTiming: string;

  // 5. Raw / Source file
  rawSourceFile: string;

  // 6. Editing, changes and re-transfer
  editingAndRetransfer: string;

  // 7. Name mention
  nameMention: string;

  // 8. Payment structure
  paymentAmount: string;
  paymentMadeHow: string;
  paymentClearedWhen: '' | 'immediate' | 'within' | 'custom';
  paymentClearedNumber: number; // 1..31
  paymentClearedUnit: 'Days' | 'Months' | 'Years';
  paymentClearedCustom: string;
  taxesIncluded: string;

  // 9. Late fees
  hasLateFee: '' | 'Yes' | 'No';
  lateFeeGraceNumber: number; // 1..30
  lateFeeGraceUnit: 'Day' | 'Month' | 'Year';
  lateFeeType: '' | 'Fixed' | 'Percentage';
  lateFeeFixedAmount: string;
  lateFeePercentValue: string;
  lateFeePercentPeriod: 'Per Day' | 'Per Week' | 'Per Month' | 'Per Year';

  // 10. Originality and responsibility for third party claim
  originalityClaim: string;

  // 11. AI generated content disclosure
  aiDisclosure: string;

  // 12. Existing commitments / conflict
  existingCommitments: string;

  // 13. Delivery proof / acceptance
  deliveryAcceptance: '' | 'on_delivery' | 'within_days' | 'written_confirmation';
  deliveryAcceptanceDays: number; // 1..30

  // 14. Refund / cancellation if work is not done
  refundCancellation: string;

  // 15. Moral / respectful use condition
  moralRespectfulUse: string;

  // 16. Confidentiality / project privacy
  confidentiality: string;

  // 17. Agreement validity (permanent)
  agreementValidity: AgreementValidityValue;
}

export const DEFAULT_COPYRIGHT_TRANSFER_DETAILS: CopyrightTransferDetails = {
  contentType: '',
  contentTypeCustom: '',
  workTitle: '',
  projectName: '',
  workDescription: '',
  contentLink: '',
  transferScope: '',
  transferPeriodNumber: 1,
  transferPeriodUnit: 'Year',
  transferSpecificUses: '',
  pastUseStatus: '',
  pastUseDetails: '',
  transferEffectTiming: '',
  rawSourceFile: '',
  editingAndRetransfer: '',
  nameMention: '',
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
  aiDisclosure: '',
  existingCommitments: '',
  deliveryAcceptance: '',
  deliveryAcceptanceDays: 7,
  refundCancellation: '',
  moralRespectfulUse: '',
  confidentiality: '',
  agreementValidity: DEFAULT_AGREEMENT_VALIDITY
};

export function validateCopyrightTransferPage4(
  details: CopyrightTransferDetails
): string | null {
  if (!details.contentType) {
    return 'Please select Content Type.';
  }
  if (details.contentType === 'Other' && !details.contentTypeCustom.trim()) {
    return 'Please specify the custom Content Type.';
  }
  if (!details.transferScope) {
    return 'Please select Transfer Scope and Type.';
  }
  if (details.transferScope === 'specific_uses' && !details.transferSpecificUses.trim()) {
    return 'Please specify the allowed uses or platforms under Transfer Scope.';
  }
  if (!details.pastUseStatus) {
    return 'Please select Past Use / Prior Publication status.';
  }
  if (details.pastUseStatus === 'published_earlier' && !details.pastUseDetails.trim()) {
    return 'Please specify where and when the work was published earlier.';
  }
  if (!details.transferEffectTiming) {
    return 'Please select when this copyright transfer takes effect.';
  }
  if (!details.rawSourceFile) {
    return 'Please select an option for Raw / Source File.';
  }
  if (!details.editingAndRetransfer) {
    return 'Please select an option for Editing, Changes and Re-transfer.';
  }
  if (!details.nameMention) {
    return 'Please select a Name Mention preference.';
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
  if (!details.aiDisclosure) {
    return 'Please select AI Generated Content Disclosure.';
  }
  if (!details.existingCommitments) {
    return 'Please select Existing Commitments / Conflict.';
  }
  if (!details.deliveryAcceptance) {
    return 'Please select Delivery Proof / Acceptance.';
  }
  if (!details.refundCancellation) {
    return 'Please select Refund / Cancellation terms.';
  }
  if (!details.moralRespectfulUse) {
    return 'Please select Moral / Respectful Use Condition.';
  }
  if (!details.confidentiality) {
    return 'Please select Confidentiality / Project Privacy preference.';
  }
  if (!isAgreementValidityValid(details.agreementValidity)) {
    return 'Please select Agreement Validity.';
  }
  return null;
}

export const COPYRIGHT_CONTENT_TYPES = [
  'Video',
  'Reels',
  'Film',
  'Music / Audio / Beat',
  'Article / Script / Book',
  'Logo / Design / Artwork',
  'Photo / Image',
  'Software / Code / App',
  'Other'
];

export const TRANSFER_EFFECT_OPTIONS = [
  'Only after full payment is received',
  'From the date this agreement is signed',
  'After final work is delivered and accepted'
];

export const RAW_SOURCE_FILE_OPTIONS = [
  'Yes, give both final and raw/source file',
  'No, only final file',
  'Not applicable'
];

export const EDITING_RETRANSFER_OPTIONS = [
  'Yes, both editing and transferring to others are allowed',
  'Editing is allowed, but cannot transfer/sell to others',
  'Only with written permission'
];

export const NAME_MENTION_OPTIONS = [
  'Yes, mention by name is required',
  'No need to mention my name',
  'Optional (up to the new owner)'
];

export const AI_DISCLOSURE_OPTIONS = [
  'No, made fully by human effort',
  'Yes, partially created / assisted with AI',
  'Yes, mostly AI generated'
];

export const EXISTING_COMMITMENTS_OPTIONS = [
  'No, no rights given to anyone else',
  'Yes, some rights were given earlier'
];

export const REFUND_CANCELLATION_OPTIONS = [
  'Paid amount is non-refundable',
  'Refund for unfinished part only',
  'Full refund if work is not delivered',
  'Decide mutually at that time'
];

export const MORAL_RESPECTFUL_USE_OPTIONS = [
  'Yes, strictly lawful and not defamatory/harmful',
  'Standard terms apply'
];

const NUMBERS_1_TO_30 = Array.from({ length: 30 }, (_, i) => String(i + 1));
const NUMBERS_1_TO_31 = Array.from({ length: 31 }, (_, i) => String(i + 1));

interface CopyrightTransferPage4Props {
  value: CopyrightTransferDetails;
  onChange: (next: CopyrightTransferDetails) => void;
}

export const CopyrightTransferPage4: React.FC<CopyrightTransferPage4Props> = ({
  value,
  onChange
}) => {
  const update = <K extends keyof CopyrightTransferDetails>(
    key: K,
    val: CopyrightTransferDetails[K]
  ) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-6">
      {/* 1. What work is being transferred? */}
      <div className="space-y-3">
        <TopicHeader
          number={1}
          title="What work is being transferred?"
          question="Which work or content are you transferring copyright for?"
          required
        />

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Content Type <span className="text-red-500">*</span>
          </label>
          <WhiteSelect
            value={value.contentType}
            onChange={(val) => update('contentType', val)}
            placeholder="Select content type"
            options={COPYRIGHT_CONTENT_TYPES}
            aria-label="Content Type"
          />
        </div>

        {value.contentType === 'Other' && (
          <input
            type="text"
            value={value.contentTypeCustom}
            onChange={(e) => update('contentTypeCustom', e.target.value)}
            placeholder="Specify custom content type..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        )}

        <div className={`${SUBQUESTION_DIVIDER_CLASS} grid grid-cols-1 sm:grid-cols-2 gap-3`}>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Work Title
            </label>
            <input
              type="text"
              value={value.workTitle}
              onChange={(e) => update('workTitle', e.target.value)}
              placeholder="Enter work title"
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={value.projectName}
              onChange={(e) => update('projectName', e.target.value)}
              placeholder="Enter project name"
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className={SUBQUESTION_DIVIDER_CLASS}>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={value.workDescription}
            onChange={(e) => update('workDescription', e.target.value)}
            placeholder="Short summary"
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
          />
        </div>

        <div className={SUBQUESTION_DIVIDER_CLASS}>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Content Link
          </label>
          <input
            type="text"
            value={value.contentLink}
            onChange={(e) => update('contentLink', e.target.value)}
            placeholder="Paste content link (e.g. Google Drive, YouTube, Figma, GitHub link)"
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* 2. Transfer scope and type */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={2}
          title="Transfer Scope and Type"
          question="How are you transferring the copyright for this work?"
          required
        />

        <div className="grid grid-cols-1 gap-2">
          <label className={optionCardClass(value.transferScope === 'complete_forever')}>
            <input
              type="radio"
              name="transferScope"
              checked={value.transferScope === 'complete_forever'}
              onChange={() => update('transferScope', 'complete_forever')}
              className="sr-only"
            />
            <CircleIndicator checked={value.transferScope === 'complete_forever'} />
            <span>Complete transfer forever (Full rights move to the buyer)</span>
          </label>

          <label className={optionCardClass(value.transferScope === 'specific_period', '', true)}>
            <input
              type="radio"
              name="transferScope"
              checked={value.transferScope === 'specific_period'}
              onChange={() => update('transferScope', 'specific_period')}
              className="sr-only"
            />
            <CircleIndicator checked={value.transferScope === 'specific_period'} className="mt-0.5" />
            <span className="leading-relaxed">
              Transfer for a specific time period:
              <WhiteSelect
                variant="inline"
                aria-label="Transfer time period number"
                value={String(value.transferPeriodNumber)}
                options={NUMBERS_1_TO_31}
                onTriggerClick={() => update('transferScope', 'specific_period')}
                onChange={(val) =>
                  onChange({
                    ...value,
                    transferScope: 'specific_period',
                    transferPeriodNumber: Number(val)
                  })
                }
              />
              <WhiteSelect
                variant="inline"
                aria-label="Transfer time period unit"
                value={value.transferPeriodUnit}
                options={['Day', 'Week', 'Month', 'Year']}
                onTriggerClick={() => update('transferScope', 'specific_period')}
                onChange={(val) =>
                  onChange({
                    ...value,
                    transferScope: 'specific_period',
                    transferPeriodUnit: val as 'Day' | 'Week' | 'Month' | 'Year'
                  })
                }
              />
            </span>
          </label>

          <label className={optionCardClass(value.transferScope === 'specific_uses')}>
            <input
              type="radio"
              name="transferScope"
              checked={value.transferScope === 'specific_uses'}
              onChange={() => update('transferScope', 'specific_uses')}
              className="sr-only"
            />
            <CircleIndicator checked={value.transferScope === 'specific_uses'} />
            <span>Transfer only for specific uses or platform</span>
          </label>
        </div>

        {value.transferScope === 'specific_uses' && (
          <input
            type="text"
            value={value.transferSpecificUses}
            onChange={(e) => update('transferSpecificUses', e.target.value)}
            placeholder="Specify allowed uses or platforms (e.g. YouTube & Paid Ads only)..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        )}
      </div>

      {/* 3. Past use / prior publication */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={3}
          title="Past Use / Prior Publication"
          question="Has this work already been published or used anywhere before?"
          required
        />

        <div className="grid grid-cols-1 gap-2">
          <label className={optionCardClass(value.pastUseStatus === 'new_unpublished')}>
            <input
              type="radio"
              name="pastUseStatus"
              checked={value.pastUseStatus === 'new_unpublished'}
              onChange={() => update('pastUseStatus', 'new_unpublished')}
              className="sr-only"
            />
            <CircleIndicator checked={value.pastUseStatus === 'new_unpublished'} />
            <span>No, it is completely new and unpublished</span>
          </label>

          <label className={optionCardClass(value.pastUseStatus === 'published_earlier')}>
            <input
              type="radio"
              name="pastUseStatus"
              checked={value.pastUseStatus === 'published_earlier'}
              onChange={() => update('pastUseStatus', 'published_earlier')}
              className="sr-only"
            />
            <CircleIndicator checked={value.pastUseStatus === 'published_earlier'} />
            <span>Yes, it was published earlier</span>
          </label>
        </div>

        {value.pastUseStatus === 'published_earlier' && (
          <div className="pt-1">
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Where and when was it published? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value.pastUseDetails}
              onChange={(e) => update('pastUseDetails', e.target.value)}
              placeholder="Enter platform / website and publication date..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        )}
      </div>

      {/* 4. When does transfer take effect? */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={4}
          title="When Does Transfer Take Effect?"
          question="When will this copyright transfer officially happen?"
          required
        />

        <div className="grid grid-cols-1 gap-2">
          {TRANSFER_EFFECT_OPTIONS.map((option) => {
            const isSelected = value.transferEffectTiming === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="transferEffectTiming"
                  checked={isSelected}
                  onChange={() => update('transferEffectTiming', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 5. Raw / Source File */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={5}
          title="Raw / Source File"
          question="Do you also need to give raw or source file? (like project file, unedited clips, layered files)"
          required
        />

        <div className="grid grid-cols-1 gap-2">
          {RAW_SOURCE_FILE_OPTIONS.map((option) => {
            const isSelected = value.rawSourceFile === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="rawSourceFile"
                  checked={isSelected}
                  onChange={() => update('rawSourceFile', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 6. Editing, Changes and Re-transfer */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={6}
          title="Editing, Changes and Re-transfer"
          question="Can the new owner edit/change this work or transfer/sell it to someone else later?"
          required
        />

        <div className="grid grid-cols-1 gap-2">
          {EDITING_RETRANSFER_OPTIONS.map((option) => {
            const isSelected = value.editingAndRetransfer === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="editingAndRetransfer"
                  checked={isSelected}
                  onChange={() => update('editingAndRetransfer', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 7. Name Mention */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={7}
          title="Name Mention"
          question="Should my name or page/channel be mentioned when this work is used?"
          required
        />

        <div className="grid grid-cols-1 gap-2">
          {NAME_MENTION_OPTIONS.map((option) => {
            const isSelected = value.nameMention === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="nameMention"
                  checked={isSelected}
                  onChange={() => update('nameMention', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 8. Payment Structure */}
      <div className={TOPIC_DIVIDER_CLASS}>
        <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4">
          <TopicHeader
            number={8}
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
                      name="ctPaymentMadeHow"
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
                  name="ctPaymentClearedWhen"
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
                  name="ctPaymentClearedWhen"
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
                  name="ctPaymentClearedWhen"
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
                      name="ctTaxesIncluded"
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

      {/* 9. Late Fees */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-3`}>
        <TopicHeader
          number={9}
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
                  name="ctHasLateFee"
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
                        name="ctLateFeeType"
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
                  <span className="block text-[11px] font-bold text-slate-700 mb-1">
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

      {/* 10. Originality and Responsibility for Third Party Claim */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={10}
          title="Originality and Responsibility for Third Party Claim"
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
                  name="ctOriginalityClaim"
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

      {/* 11. AI Generated Content Disclosure */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={11}
          title="AI Generated Content Disclosure"
          question="Was any part of this content made using AI tools?"
          required
        />

        <div className="grid grid-cols-1 gap-2">
          {AI_DISCLOSURE_OPTIONS.map((option) => {
            const isSelected = value.aiDisclosure === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="ctAiDisclosure"
                  checked={isSelected}
                  onChange={() => update('aiDisclosure', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 12. Existing Commitments / Conflict */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={12}
          title="Existing Commitments / Conflict"
          question="Have you already promised, licensed, or given rights to this work to anyone else?"
          required
        />

        <div className="grid grid-cols-1 gap-2">
          {EXISTING_COMMITMENTS_OPTIONS.map((option) => {
            const isSelected = value.existingCommitments === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="ctExistingCommitments"
                  checked={isSelected}
                  onChange={() => update('existingCommitments', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 13. Delivery Proof / Acceptance */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={13}
          title="Delivery Proof / Acceptance"
          question="When will the work be considered finally accepted?"
          required
        />

        <div className="grid grid-cols-1 gap-2">
          <label className={optionCardClass(value.deliveryAcceptance === 'on_delivery')}>
            <input
              type="radio"
              name="ctDeliveryAcceptance"
              checked={value.deliveryAcceptance === 'on_delivery'}
              onChange={() => update('deliveryAcceptance', 'on_delivery')}
              className="sr-only"
            />
            <CircleIndicator checked={value.deliveryAcceptance === 'on_delivery'} />
            <span>As soon as files are delivered</span>
          </label>

          <label className={optionCardClass(value.deliveryAcceptance === 'within_days', '', true)}>
            <input
              type="radio"
              name="ctDeliveryAcceptance"
              checked={value.deliveryAcceptance === 'within_days'}
              onChange={() => update('deliveryAcceptance', 'within_days')}
              className="sr-only"
            />
            <CircleIndicator checked={value.deliveryAcceptance === 'within_days'} className="mt-0.5" />
            <span className="leading-relaxed">
              Within
              <WhiteSelect
                variant="inline"
                aria-label="Acceptance days limit"
                value={String(value.deliveryAcceptanceDays)}
                options={NUMBERS_1_TO_30}
                onTriggerClick={() => update('deliveryAcceptance', 'within_days')}
                onChange={(val) =>
                  onChange({
                    ...value,
                    deliveryAcceptance: 'within_days',
                    deliveryAcceptanceDays: Number(val)
                  })
                }
              />
              days unless objected
            </span>
          </label>

          <label className={optionCardClass(value.deliveryAcceptance === 'written_confirmation')}>
            <input
              type="radio"
              name="ctDeliveryAcceptance"
              checked={value.deliveryAcceptance === 'written_confirmation'}
              onChange={() => update('deliveryAcceptance', 'written_confirmation')}
              className="sr-only"
            />
            <CircleIndicator checked={value.deliveryAcceptance === 'written_confirmation'} />
            <span>Only after written confirmation from the buyer</span>
          </label>
        </div>
      </div>

      {/* 14. Refund / Cancellation if work is not done */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={14}
          title="Refund / Cancellation if Work is Not Done"
          question="What happens if the work is cancelled or not completed on time?"
          required
        />

        <div className="grid grid-cols-1 gap-2">
          {REFUND_CANCELLATION_OPTIONS.map((option) => {
            const isSelected = value.refundCancellation === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="ctRefundCancellation"
                  checked={isSelected}
                  onChange={() => update('refundCancellation', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 15. Moral / Respectful Use Condition */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={15}
          title="Moral / Respectful Use Condition"
          question="Should the work be used only in a lawful and non-harmful way?"
          required
        />

        <div className="grid grid-cols-1 gap-2">
          {MORAL_RESPECTFUL_USE_OPTIONS.map((option) => {
            const isSelected = value.moralRespectfulUse === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="ctMoralRespectfulUse"
                  checked={isSelected}
                  onChange={() => update('moralRespectfulUse', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 16. Confidentiality / Project Privacy */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={16}
          title="Confidentiality / Project Privacy"
          question="Should both sides keep private project details and unpublished work secret?"
          required
        />

        <div className="grid grid-cols-1 gap-2">
          {CONFIDENTIALITY_OPTIONS.map((option) => {
            const isSelected = value.confidentiality === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="ctConfidentiality"
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

      {/* 17. Agreement Validity (Permanent) */}
      <div className={TOPIC_DIVIDER_CLASS}>
        <AgreementValiditySection
          topicNumber={17}
          value={value.agreementValidity}
          onChange={(next) => update('agreementValidity', next)}
        />
      </div>
    </div>
  );
};
