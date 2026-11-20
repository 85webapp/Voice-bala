import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
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

export interface NdaDetails {
  // 1. Who Shares Secret Information?
  whoSharesSecret: string;

  // 2. What is Secret?
  secretCategories: string[];
  secretOtherDetail: string;
  secretTopicTitle: string;
  secretProjectDescription: string;

  // 3. Why Secret Information is Shared?
  sharePurposeType: string;
  sharePurposeOther: string;
  sharePurposeDetails: string;

  // 4. How Secret Information Must Be Handled?
  handlingRules: string[];
  handlingExtraRules: string;

  // 5. Share with Team or Staff
  shareWithTeam: string;

  // 6. What is Not Secret?
  notSecretExclusions: string[];

  // 7. How long to hide secret information
  secretDurationType: '' | 'forever' | 'custom';
  secretDurationNumber: string; // '1'..'31'
  secretDurationUnit: string; // 'Year' | 'Month' | 'Week' | 'Day'

  // 8. Return or delete secret files
  returnOrDeleteFiles: string;
  returnOrDeleteCustom: string;

  // 9. If NDA breaks
  breachConsequence: string;
  breachFixedPenaltyAmount: string;

  // 10. Official notice and proof
  officialNoticeMethod: string;
  specificNoticeAddress: string;

  // 11. Only written terms and changes (both ticked by default & both mandatory)
  writtenTermsRules: string[];

  // 12. Agreement Validity
  agreementValidity: AgreementValidityValue;

  // 14. Your Extra Rules (rendered at very end)
  hasOwnRules: '' | 'Yes' | 'No';
  ownRules: string[];
  ownRuleDraft: string;
}

export const NDA_WHO_SHARES_OPTIONS = [
  'Only First Party shares, Second Party keeps it secret',
  'Only Second Party shares, First Party keeps it secret',
  'Both parties share secret information and both keep it secret'
];

export const NDA_WHAT_IS_SECRET_OPTIONS = [
  'Business Plan & Ideas',
  'Client / Customer List',
  'Prices, Rates & Money Details',
  'Project, Design, Code & Formulas',
  'Documents, Videos & Data',
  'Other Secret Information'
];

export const NDA_WHY_SHARED_OPTIONS = [
  'Business deals or partnership talk',
  'Working together on a project / service',
  'Job, freelance work, or consulting',
  'Other reason'
];

export const NDA_HANDLING_RULES_OPTIONS = [
  'Do not share or leak it to anyone outside.',
  'Do not use it for any purpose other than what is agreed.',
  'Keep files, passwords, and data safely locked and protected.'
];

export const NDA_SHARE_WITH_TEAM_OPTIONS = [
  'Yes, only with team/staff who need it for this work and follow the same secrecy.',
  'No, do not share with anyone else.',
  'Only after getting written approval.'
];

export const NDA_NOT_SECRET_OPTIONS = [
  'Information already public or known to everyone.',
  'Information already known before this NDA started.',
  'Information received legally from someone else later.',
  'Information demanded by law, police, or court order.'
];

export const NDA_RETURN_DELETE_OPTIONS = [
  'Return all files and delete copies',
  'Delete or destroy all copies',
  'No need to return or delete',
  'Decide when work or deal ends',
  'Custom'
];

export const NDA_BREACH_OPTIONS = [
  'Stop right away and pay for the loss',
  'Pay for the loss caused',
  'Pay a fixed penalty amount',
  'Handle as per law'
];

export const NDA_NOTICE_OPTIONS = [
  'By email or address given above',
  'By email and post / speed / registered post',
  'Any clear written message (email / letter / signed notice)',
  'Specific email or address for notice'
];

export const NDA_WRITTEN_TERMS_OPTIONS = [
  'Only this written NDA counts; old talks before this do not count',
  'Any changes later must be in writing, agreed by both sides'
];

export const DEFAULT_NDA_DETAILS: NdaDetails = {
  whoSharesSecret: '',
  secretCategories: [],
  secretOtherDetail: '',
  secretTopicTitle: '',
  secretProjectDescription: '',
  sharePurposeType: '',
  sharePurposeOther: '',
  sharePurposeDetails: '',
  handlingRules: [],
  handlingExtraRules: '',
  shareWithTeam: '',
  notSecretExclusions: [],
  secretDurationType: '',
  secretDurationNumber: '',
  secretDurationUnit: '',
  returnOrDeleteFiles: '',
  returnOrDeleteCustom: '',
  breachConsequence: '',
  breachFixedPenaltyAmount: '',
  officialNoticeMethod: '',
  specificNoticeAddress: '',
  writtenTermsRules: [...NDA_WRITTEN_TERMS_OPTIONS],
  agreementValidity: DEFAULT_AGREEMENT_VALIDITY,
  hasOwnRules: '',
  ownRules: [],
  ownRuleDraft: ''
};

const NUMBERS_1_TO_31 = Array.from({ length: 31 }, (_, i) => String(i + 1));

export function getEffectiveNdaOwnRules(details: NdaDetails): string[] {
  const list = [...details.ownRules];
  if (details.ownRuleDraft.trim()) {
    list.push(details.ownRuleDraft.trim());
  }
  return list;
}

export function formatNdaSecretDuration(details: NdaDetails): string {
  if (details.secretDurationType === 'forever') {
    return 'Forever (as long as it stays secret)';
  }
  if (details.secretDurationType === 'custom') {
    return `${details.secretDurationNumber} ${details.secretDurationUnit} — Hide this time secret information`;
  }
  return '';
}

export function validateNdaPage4(details: NdaDetails): string | null {
  if (!details.whoSharesSecret) {
    return 'Please select an option under Who Shares Secret Information?.';
  }
  if (details.secretCategories.length === 0) {
    return 'Please select at least one option under What is Secret?.';
  }
  if (
    details.secretCategories.includes('Other Secret Information') &&
    !details.secretOtherDetail.trim()
  ) {
    return 'Please specify the Other Secret Information.';
  }
  if (!details.secretTopicTitle.trim()) {
    return 'Please enter the Topic under Write full details of what is secret?.';
  }
  if (!details.secretProjectDescription.trim()) {
    return 'Please enter the Project Description under Write full details of what is secret?.';
  }
  if (!details.sharePurposeType) {
    return 'Please select a purpose under Why Secret Information is Shared?.';
  }
  if (details.sharePurposeType === 'Other reason' && !details.sharePurposeOther.trim()) {
    return 'Please specify the other reason under Why Secret Information is Shared?.';
  }
  if (!details.sharePurposeDetails.trim()) {
    return 'Please write the purpose clearly in simple words.';
  }
  if (details.handlingRules.length === 0) {
    return 'Please select at least one rule under How Secret Information Must Be Handled?.';
  }
  if (!details.shareWithTeam) {
    return 'Please select an option under Share with Team or Staff.';
  }
  if (details.notSecretExclusions.length === 0) {
    return 'Please select at least one option under What is Not Secret?.';
  }
  if (!details.secretDurationType) {
    return 'Please select an option under How long to hide secret information.';
  }
  if (
    details.secretDurationType === 'custom' &&
    (!details.secretDurationNumber || !details.secretDurationUnit)
  ) {
    return 'Please select number and unit under How long to hide secret information.';
  }
  if (!details.returnOrDeleteFiles) {
    return 'Please select an option under Return or delete secret files.';
  }
  if (details.returnOrDeleteFiles === 'Custom' && !details.returnOrDeleteCustom.trim()) {
    return 'Please enter custom terms under Return or delete secret files.';
  }
  if (!details.breachConsequence) {
    return 'Please select an option under If NDA breaks.';
  }
  if (
    details.breachConsequence === 'Pay a fixed penalty amount' &&
    !details.breachFixedPenaltyAmount.trim()
  ) {
    return 'Please enter the fixed penalty amount (₹) under If NDA breaks.';
  }
  if (!details.officialNoticeMethod) {
    return 'Please select an option under Official notice and proof.';
  }
  if (
    NDA_WRITTEN_TERMS_OPTIONS.some((opt) => !details.writtenTermsRules.includes(opt))
  ) {
    return 'Please tick both checkboxes under Only written terms and changes to proceed.';
  }
  if (!isAgreementValidityValid(details.agreementValidity)) {
    return 'Please select Agreement Validity.';
  }
  if (!details.hasOwnRules) {
    return 'Please answer Yes or No under Your Extra Rules.';
  }
  if (details.hasOwnRules === 'Yes' && getEffectiveNdaOwnRules(details).length === 0) {
    return 'Please write at least one rule under Your Extra Rules or select No.';
  }
  return null;
}

interface NdaPage4Props {
  value: NdaDetails;
  onChange: (next: NdaDetails) => void;
}

export const NdaPage4: React.FC<NdaPage4Props> = ({ value, onChange }) => {
  const update = <K extends keyof NdaDetails>(key: K, val: NdaDetails[K]) => {
    onChange({ ...value, [key]: val });
  };

  const toggleListItem = (
    key: 'secretCategories' | 'handlingRules' | 'notSecretExclusions' | 'writtenTermsRules',
    item: string
  ) => {
    const current = value[key];
    const next = current.includes(item)
      ? current.filter((x) => x !== item)
      : [...current, item];
    update(key, next);
  };

  return (
    <div className="space-y-6">
      {/* 1. Who Shares Secret Information? */}
      <div className="space-y-2.5">
        <TopicHeader
          number={1}
          title="Who Shares Secret Information?"
          question="Who is sharing secret information and who must keep it secret?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {NDA_WHO_SHARES_OPTIONS.map((option) => {
            const isSelected = value.whoSharesSecret === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="ndaWhoSharesSecret"
                  checked={isSelected}
                  onChange={() => update('whoSharesSecret', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 2. What is Secret? */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-3.5`}>
        <div className="flex items-start justify-between gap-2">
          <TopicHeader
            number={2}
            title="What is Secret?"
            question="What exact information, files, ideas, or details must be kept secret?"
            required
          />
          <span className="text-[11px] text-slate-500 font-medium shrink-0">
            Multiple selections allowed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {NDA_WHAT_IS_SECRET_OPTIONS.map((option) => {
            const isChecked = value.secretCategories.includes(option);
            return (
              <label key={option} className={optionCardClass(isChecked)}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleListItem('secretCategories', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isChecked} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>

        {value.secretCategories.includes('Other Secret Information') && (
          <input
            type="text"
            value={value.secretOtherDetail}
            onChange={(e) => update('secretOtherDetail', e.target.value)}
            placeholder="Specify other secret information..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        )}

        <div className={`${SUBQUESTION_DIVIDER_CLASS} space-y-3`}>
          <p className="text-xs sm:text-sm font-bold text-slate-900">
            Write full details of what is secret? <span className="text-red-500">*</span>
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Topic <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value.secretTopicTitle}
              onChange={(e) => update('secretTopicTitle', e.target.value)}
              placeholder="Enter topic or subject name..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={value.secretProjectDescription}
              onChange={(e) => update('secretProjectDescription', e.target.value)}
              placeholder="Describe the confidential project, files, ideas, or details..."
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Why Secret Information is Shared? */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-3.5`}>
        <TopicHeader
          number={3}
          title="Why Secret Information is Shared?"
          question="For what exact purpose is this secret information being shared?"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {NDA_WHY_SHARED_OPTIONS.map((option) => {
            const isSelected = value.sharePurposeType === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="ndaSharePurposeType"
                  checked={isSelected}
                  onChange={() => update('sharePurposeType', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>

        {value.sharePurposeType === 'Other reason' && (
          <input
            type="text"
            value={value.sharePurposeOther}
            onChange={(e) => update('sharePurposeOther', e.target.value)}
            placeholder="Specify other reason..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        )}

        <div className={SUBQUESTION_DIVIDER_CLASS}>
          <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
            Write the purpose clearly in simple words <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            value={value.sharePurposeDetails}
            onChange={(e) => update('sharePurposeDetails', e.target.value)}
            placeholder="Write why this confidential information is being shared..."
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
          />
        </div>
      </div>

      {/* 4. How Secret Information Must Be Handled? */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-3`}>
        <div className="flex items-start justify-between gap-2">
          <TopicHeader
            number={4}
            title="How Secret Information Must Be Handled?"
            question="How must the receiving party protect and handle the secret information?"
            required
          />
          <span className="text-[11px] text-slate-500 font-medium shrink-0">
            Multiple selections allowed
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {NDA_HANDLING_RULES_OPTIONS.map((option) => {
            const isChecked = value.handlingRules.includes(option);
            return (
              <label key={option} className={optionCardClass(isChecked)}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleListItem('handlingRules', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isChecked} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>

        <div className={SUBQUESTION_DIVIDER_CLASS}>
          <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
            Any extra care rules if needed{' '}
            <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            value={value.handlingExtraRules}
            onChange={(e) => update('handlingExtraRules', e.target.value)}
            placeholder="Add any extra care, password, or storage rules if needed..."
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
          />
        </div>
      </div>

      {/* 5. Share with Team or Staff */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <TopicHeader
          number={5}
          title="Share with Team or Staff"
          question="Can the receiving party share this secret information with their team, employees, or advisors?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {NDA_SHARE_WITH_TEAM_OPTIONS.map((option) => {
            const isSelected = value.shareWithTeam === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="ndaShareWithTeam"
                  checked={isSelected}
                  onChange={() => update('shareWithTeam', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 6. What is Not Secret? */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <div className="flex items-start justify-between gap-2">
          <TopicHeader
            number={6}
            title="What is Not Secret?"
            question="Which information will not be counted as secret under this NDA?"
            required
          />
          <span className="text-[11px] text-slate-500 font-medium shrink-0">
            Multiple selections allowed
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {NDA_NOT_SECRET_OPTIONS.map((option) => {
            const isChecked = value.notSecretExclusions.includes(option);
            return (
              <label key={option} className={optionCardClass(isChecked)}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleListItem('notSecretExclusions', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isChecked} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 7. How long to hide secret information */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <TopicHeader
          number={7}
          title="How long to hide secret information"
          question="How long do you need to hide this secret information?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          <label className={optionCardClass(value.secretDurationType === 'forever')}>
            <input
              type="radio"
              name="ndaSecretDuration"
              checked={value.secretDurationType === 'forever'}
              onChange={() => update('secretDurationType', 'forever')}
              className="sr-only"
            />
            <CircleIndicator checked={value.secretDurationType === 'forever'} />
            <span>Forever (as long as it stays secret)</span>
          </label>

          <label className={optionCardClass(value.secretDurationType === 'custom', '', true)}>
            <input
              type="radio"
              name="ndaSecretDuration"
              checked={value.secretDurationType === 'custom'}
              onChange={() => update('secretDurationType', 'custom')}
              className="sr-only"
            />
            <CircleIndicator checked={value.secretDurationType === 'custom'} className="mt-0.5" />
            <span className="leading-relaxed">
              <WhiteSelect
                variant="inline"
                aria-label="Hide secret information number"
                placeholder="Select"
                value={value.secretDurationNumber}
                options={NUMBERS_1_TO_31}
                onTriggerClick={() => update('secretDurationType', 'custom')}
                onChange={(val) =>
                  onChange({
                    ...value,
                    secretDurationType: 'custom',
                    secretDurationNumber: val
                  })
                }
              />
              <WhiteSelect
                variant="inline"
                aria-label="Hide secret information unit"
                placeholder="Unit"
                value={value.secretDurationUnit}
                options={['Year', 'Month', 'Week', 'Day']}
                onTriggerClick={() => update('secretDurationType', 'custom')}
                onChange={(val) =>
                  onChange({
                    ...value,
                    secretDurationType: 'custom',
                    secretDurationUnit: val
                  })
                }
              />
              Hide this time secret information
            </span>
          </label>
        </div>
      </div>

      {/* 8. Return or delete secret files */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <TopicHeader
          number={8}
          title="Return or delete secret files"
          question="When the deal or work ends, what should happen to secret files or documents?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {NDA_RETURN_DELETE_OPTIONS.map((option) => {
            const isSelected = value.returnOrDeleteFiles === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="ndaReturnDeleteFiles"
                  checked={isSelected}
                  onChange={() => update('returnOrDeleteFiles', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>

        {value.returnOrDeleteFiles === 'Custom' && (
          <input
            type="text"
            value={value.returnOrDeleteCustom}
            onChange={(e) => update('returnOrDeleteCustom', e.target.value)}
            placeholder="Write custom rule for returning or deleting secret files..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        )}
      </div>

      {/* 9. If NDA breaks */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <TopicHeader
          number={9}
          title="If NDA breaks"
          question="What should happen if someone breaks the NDA and leaks secret information?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {NDA_BREACH_OPTIONS.map((option) => {
            const isSelected = value.breachConsequence === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="ndaBreachConsequence"
                  checked={isSelected}
                  onChange={() => update('breachConsequence', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>

        {value.breachConsequence === 'Pay a fixed penalty amount' && (
          <div className="pt-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Fixed Penalty Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-slate-500">
                ₹
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={value.breachFixedPenaltyAmount}
                onChange={(e) => update('breachFixedPenaltyAmount', e.target.value)}
                placeholder="Enter fixed penalty amount (e.g. 1,00,000)"
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* 10. Official notice and proof */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <TopicHeader
          number={10}
          title="Official notice and proof"
          question="How should important warning or notice be sent and saved as proof?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {NDA_NOTICE_OPTIONS.map((option) => {
            const isSelected = value.officialNoticeMethod === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="ndaOfficialNoticeMethod"
                  checked={isSelected}
                  onChange={() => update('officialNoticeMethod', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>

        {value.officialNoticeMethod === 'Specific email or address for notice' && (
          <div className="pt-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Specific Email or Address for Notice{' '}
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={value.specificNoticeAddress}
              onChange={(e) => update('specificNoticeAddress', e.target.value)}
              placeholder="Enter specific email ID or postal address for official notices..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        )}
      </div>

      {/* 11. Only written terms and changes */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <div className="flex items-start justify-between gap-2">
          <TopicHeader
            number={11}
            title="Only written terms and changes"
            question="Will only what is written here count and how can changes be made later?"
            required
          />
          <span className="text-[11px] text-slate-500 font-medium shrink-0">
            Both required
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {NDA_WRITTEN_TERMS_OPTIONS.map((option) => {
            const isChecked = value.writtenTermsRules.includes(option);
            return (
              <label key={option} className={optionCardClass(isChecked)}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleListItem('writtenTermsRules', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isChecked} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 12. Agreement Validity */}
      <div className={TOPIC_DIVIDER_CLASS}>
        <AgreementValiditySection
          topicNumber={12}
          value={value.agreementValidity}
          onChange={(next) => update('agreementValidity', next)}
        />
      </div>
    </div>
  );
};

interface NdaOwnRulesSectionProps {
  topicNumber?: number;
  value: NdaDetails;
  onChange: (next: NdaDetails) => void;
}

export const NdaOwnRulesSection: React.FC<NdaOwnRulesSectionProps> = ({
  topicNumber = 14,
  value,
  onChange
}) => {
  const [savedNotice, setSavedNotice] = useState(false);

  const commitDraftRule = () => {
    const trimmed = value.ownRuleDraft.trim();
    if (!trimmed) return;
    onChange({
      ...value,
      ownRules: [...value.ownRules, trimmed],
      ownRuleDraft: ''
    });
    setSavedNotice(false);
  };

  const handleSaveRules = () => {
    const trimmed = value.ownRuleDraft.trim();
    if (trimmed) {
      onChange({
        ...value,
        ownRules: [...value.ownRules, trimmed],
        ownRuleDraft: ''
      });
    }
    setSavedNotice(true);
  };

  const removeRule = (index: number) => {
    onChange({
      ...value,
      ownRules: value.ownRules.filter((_, idx) => idx !== index)
    });
    setSavedNotice(false);
  };

  return (
    <div className={`${TOPIC_DIVIDER_CLASS} space-y-3`}>
      <TopicHeader
        number={topicNumber}
        title="Your Extra Rules"
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
                name="ndaHasOwnRules"
                checked={isSelected}
                onChange={() => {
                  onChange({ ...value, hasOwnRules: opt });
                  setSavedNotice(false);
                }}
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
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-900">
              Your own rules
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              Press <span className="font-bold text-slate-700">Enter</span> after each rule to add a point
            </span>
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
              onChange={(e) => {
                onChange({ ...value, ownRuleDraft: e.target.value });
                setSavedNotice(false);
              }}
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
                <span>Add Point</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            {savedNotice ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <Check className="w-3.5 h-3.5" />
                Saved {value.ownRules.length} {value.ownRules.length === 1 ? 'rule' : 'rules'}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                {value.ownRules.length > 0
                  ? `${value.ownRules.length} ${value.ownRules.length === 1 ? 'point' : 'points'} added`
                  : 'Add at least one rule above'}
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveRules}
              disabled={value.ownRules.length === 0 && !value.ownRuleDraft.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
