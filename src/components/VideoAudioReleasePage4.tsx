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

export interface VideoAudioReleaseDetails {
  // 1. What video or audio is included?
  mediaTypes: string[];
  mediaDetails: string;

  // 2. How it can be used?
  usageTypes: string[];
  usageCustom: string;

  // 3. Where and how long it can be used?
  territoryType: string;
  territoryCustom: string;
  durationType: '' | 'forever' | 'custom';
  durationNumber: string; // '1'..'31'
  durationUnit: string; // 'Day' | 'Week' | 'Month' | 'Year'

  // 4. Payment or free release
  releasePaymentType: '' | 'paid' | 'free';
  paymentAmount: string;
  paymentWhen: string;
  paymentCountedHow: string;

  // 5. Editing and changes
  editingAllowed: string;

  // 6. Showing your name or identity
  identityDisplay: string;
  identityCustom: string;

  // 7. No claim or objection confirmation (both mandatory)
  rightsConfirmChecks: string[];

  // 8. Official notice and written rules only
  officialNoticeMethod: string;
  writtenRulesChecks: string[];

  // 9. Agreement Validity
  agreementValidity: AgreementValidityValue;

  // 11. Your Extra Rules (rendered at very end)
  hasOwnRules: '' | 'Yes' | 'No';
  ownRules: string[];
  ownRuleDraft: string;
}

export const VIDEO_AUDIO_MEDIA_TYPES = [
  'Video',
  'Audio / Voice',
  'Photo / Image',
  'Interview / Speech',
  'Performance / Reels / Clip'
];

export const VIDEO_AUDIO_USAGE_TYPES = [
  'YouTube',
  'Social Media',
  'Ads / Promotion / Marketing',
  'Website / App',
  'TV / OTT / Film / Event',
  'News / Education / Internal Use',
  'Other uses'
];

export const VIDEO_AUDIO_TERRITORY_OPTIONS = [
  'India only',
  'Worldwide (All countries)',
  'Specific country or region'
];

export const VIDEO_AUDIO_WHEN_PAID_OPTIONS = [
  'At signing / before release',
  'After shoot / recording',
  'Within 7 days',
  'Within 15 days',
  'Within 30 days'
];

export const VIDEO_AUDIO_HOW_COUNTED_OPTIONS = [
  'Online payment (UPI / NetBanking)',
  'Bank transfer (NEFT / IMPS)',
  'Cash',
  'Cheque',
  'Not sure / As agreed later'
];

export const VIDEO_AUDIO_EDITING_OPTIONS = [
  'Yes, cut, edit, dub, translate, or mix as needed',
  'Yes, but do not change the main meaning or message',
  'No, use only as recorded without changes'
];

export const VIDEO_AUDIO_IDENTITY_OPTIONS = [
  'Yes, show name and face/voice as recorded',
  'Show face/voice, but hide or skip the name',
  'Hide identity / blur / no name as agreed',
  'Other'
];

export const VIDEO_AUDIO_RIGHTS_CONFIRM_OPTIONS = [
  "Yes, I have the right to share this and it breaks no one's rules.",
  'Yes, I will not object or ask for more money later.'
];

export const VIDEO_AUDIO_NOTICE_OPTIONS = [
  'By email or address given above',
  'By email and post / speed / registered post',
  'Any clear written message (email / letter / signed notice)'
];

export const VIDEO_AUDIO_WRITTEN_RULES_OPTIONS = [
  'Only what is written in this form counts; old verbal talks do not count.',
  'Any changes later must be in writing, agreed by both sides.'
];

export const DEFAULT_VIDEO_AUDIO_DETAILS: VideoAudioReleaseDetails = {
  mediaTypes: [],
  mediaDetails: '',
  usageTypes: [],
  usageCustom: '',
  territoryType: '',
  territoryCustom: '',
  durationType: '',
  durationNumber: '',
  durationUnit: '',
  releasePaymentType: '',
  paymentAmount: '',
  paymentWhen: '',
  paymentCountedHow: '',
  editingAllowed: '',
  identityDisplay: '',
  identityCustom: '',
  rightsConfirmChecks: [],
  officialNoticeMethod: '',
  writtenRulesChecks: [...VIDEO_AUDIO_WRITTEN_RULES_OPTIONS],
  agreementValidity: DEFAULT_AGREEMENT_VALIDITY,
  hasOwnRules: '',
  ownRules: [],
  ownRuleDraft: ''
};

const NUMBERS_1_TO_31 = Array.from({ length: 31 }, (_, i) => String(i + 1));

export function getEffectiveVideoAudioOwnRules(details: VideoAudioReleaseDetails): string[] {
  const list = [...details.ownRules];
  if (details.ownRuleDraft.trim()) {
    list.push(details.ownRuleDraft.trim());
  }
  return list;
}

export function formatVideoAudioDuration(details: VideoAudioReleaseDetails): string {
  if (details.durationType === 'forever') {
    return 'Forever (Lifetime / Perpetual)';
  }
  if (details.durationType === 'custom') {
    return `${details.durationNumber} ${details.durationUnit}`;
  }
  return '';
}

export function validateVideoAudioReleasePage4(
  details: VideoAudioReleaseDetails
): string | null {
  if (details.mediaTypes.length === 0) {
    return 'Please select at least one item under What video or audio is included?.';
  }
  if (!details.mediaDetails.trim()) {
    return 'Please write recording details (date, place, topic, or title).';
  }
  if (details.usageTypes.length === 0) {
    return 'Please select at least one option under How it can be used?.';
  }
  if (details.usageTypes.includes('Other uses') && !details.usageCustom.trim()) {
    return 'Please specify other allowed uses under How it can be used?.';
  }
  if (!details.territoryType) {
    return 'Please select where it can be used.';
  }
  if (
    details.territoryType === 'Specific country or region' &&
    !details.territoryCustom.trim()
  ) {
    return 'Please specify the country or region.';
  }
  if (!details.durationType) {
    return 'Please select how long it can be used.';
  }
  if (
    details.durationType === 'custom' &&
    (!details.durationNumber || !details.durationUnit)
  ) {
    return 'Please select duration number and unit under How long can it be used?.';
  }
  if (!details.releasePaymentType) {
    return 'Please select Paid or Free under Payment or free release.';
  }
  if (details.releasePaymentType === 'paid') {
    if (!details.paymentAmount.trim()) {
      return 'Please enter the agreed payment amount (₹).';
    }
    if (!details.paymentWhen) {
      return 'Please select when payment will be made.';
    }
    if (!details.paymentCountedHow) {
      return 'Please select how payment will be counted as paid.';
    }
  }
  if (!details.editingAllowed) {
    return 'Please select an option under Editing and changes.';
  }
  if (!details.identityDisplay) {
    return 'Please select an option under Showing your name or identity.';
  }
  if (details.identityDisplay === 'Other' && !details.identityCustom.trim()) {
    return 'Please specify custom identity display rules.';
  }
  if (
    VIDEO_AUDIO_RIGHTS_CONFIRM_OPTIONS.some(
      (opt) => !details.rightsConfirmChecks.includes(opt)
    )
  ) {
    return 'Please tick both checkboxes confirming rights and no future objection.';
  }
  if (!details.officialNoticeMethod) {
    return 'Please select how official notices should be sent.';
  }
  if (
    VIDEO_AUDIO_WRITTEN_RULES_OPTIONS.some(
      (opt) => !details.writtenRulesChecks.includes(opt)
    )
  ) {
    return 'Please tick both written rules checkboxes to proceed.';
  }
  if (!isAgreementValidityValid(details.agreementValidity)) {
    return 'Please select Agreement Validity.';
  }
  if (!details.hasOwnRules) {
    return 'Please answer Yes or No under Your Extra Rules.';
  }
  if (details.hasOwnRules === 'Yes' && getEffectiveVideoAudioOwnRules(details).length === 0) {
    return 'Please write at least one rule under Your Extra Rules or select No.';
  }
  return null;
}

interface VideoAudioReleasePage4Props {
  value: VideoAudioReleaseDetails;
  onChange: (next: VideoAudioReleaseDetails) => void;
}

export const VideoAudioReleasePage4: React.FC<VideoAudioReleasePage4Props> = ({
  value,
  onChange
}) => {
  const update = <K extends keyof VideoAudioReleaseDetails>(
    key: K,
    val: VideoAudioReleaseDetails[K]
  ) => {
    onChange({ ...value, [key]: val });
  };

  const toggleListItem = (
    key: 'mediaTypes' | 'usageTypes' | 'rightsConfirmChecks' | 'writtenRulesChecks',
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
      {/* 1. What video or audio is included? */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <TopicHeader
            number={1}
            title="What video or audio is included?"
            question="Which video, audio, photo, or recording is covered in this release?"
            required
          />
          <span className="text-[11px] text-slate-500 font-medium shrink-0">
            Multiple selections allowed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VIDEO_AUDIO_MEDIA_TYPES.map((option) => {
            const isChecked = value.mediaTypes.includes(option);
            return (
              <label key={option} className={optionCardClass(isChecked)}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleListItem('mediaTypes', option)}
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
            Write details (shoot / recording date, place, topic, or title){' '}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            value={value.mediaDetails}
            onChange={(e) => update('mediaDetails', e.target.value)}
            placeholder="e.g. Recorded on 20 Nov 2026 at Studio Mumbai — Product Interview & Reels"
            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
          />
        </div>
      </div>

      {/* 2. How it can be used? */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <div className="flex items-start justify-between gap-2">
          <TopicHeader
            number={2}
            title="How it can be used?"
            question="Who and where can this video or audio be used?"
            required
          />
          <span className="text-[11px] text-slate-500 font-medium shrink-0">
            Multiple selections allowed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VIDEO_AUDIO_USAGE_TYPES.map((option) => {
            const isChecked = value.usageTypes.includes(option);
            return (
              <label key={option} className={optionCardClass(isChecked)}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleListItem('usageTypes', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isChecked} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>

        {value.usageTypes.includes('Other uses') && (
          <input
            type="text"
            value={value.usageCustom}
            onChange={(e) => update('usageCustom', e.target.value)}
            placeholder="Specify other allowed uses..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        )}
      </div>

      {/* 3. Where and how long it can be used? */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-4`}>
        <TopicHeader
          number={3}
          title="Where and how long it can be used?"
          question="In which place and for how long can it be used?"
          required
        />

        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-bold text-slate-900">
            Which place can it be used? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {VIDEO_AUDIO_TERRITORY_OPTIONS.map((option) => {
              const isSelected = value.territoryType === option;
              return (
                <label key={option} className={optionCardClass(isSelected)}>
                  <input
                    type="radio"
                    name="vaTerritoryType"
                    checked={isSelected}
                    onChange={() => update('territoryType', option)}
                    className="sr-only"
                  />
                  <CircleIndicator checked={isSelected} />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
          {value.territoryType === 'Specific country or region' && (
            <input
              type="text"
              value={value.territoryCustom}
              onChange={(e) => update('territoryCustom', e.target.value)}
              placeholder="Enter specific country, state, or region..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          )}
        </div>

        <div className={`${SUBQUESTION_DIVIDER_CLASS} space-y-2`}>
          <label className="block text-xs sm:text-sm font-bold text-slate-900">
            How long can it be used? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-2">
            <label className={optionCardClass(value.durationType === 'forever')}>
              <input
                type="radio"
                name="vaDurationType"
                checked={value.durationType === 'forever'}
                onChange={() => update('durationType', 'forever')}
                className="sr-only"
              />
              <CircleIndicator checked={value.durationType === 'forever'} />
              <span>Forever (Lifetime / Perpetual)</span>
            </label>

            <label className={optionCardClass(value.durationType === 'custom', '', true)}>
              <input
                type="radio"
                name="vaDurationType"
                checked={value.durationType === 'custom'}
                onChange={() => update('durationType', 'custom')}
                className="sr-only"
              />
              <CircleIndicator checked={value.durationType === 'custom'} className="mt-0.5" />
              <span className="leading-relaxed">
                For
                <WhiteSelect
                  variant="inline"
                  aria-label="Usage duration number"
                  placeholder="Select"
                  value={value.durationNumber}
                  options={NUMBERS_1_TO_31}
                  onTriggerClick={() => update('durationType', 'custom')}
                  onChange={(val) =>
                    onChange({
                      ...value,
                      durationType: 'custom',
                      durationNumber: val
                    })
                  }
                />
                <WhiteSelect
                  variant="inline"
                  aria-label="Usage duration unit"
                  placeholder="Unit"
                  value={value.durationUnit}
                  options={['Day', 'Week', 'Month', 'Year']}
                  onTriggerClick={() => update('durationType', 'custom')}
                  onChange={(val) =>
                    onChange({
                      ...value,
                      durationType: 'custom',
                      durationUnit: val
                    })
                  }
                />
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 4. Payment or free release */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-3`}>
        <TopicHeader
          number={4}
          title="Payment or free release"
          question="Is money being paid for this release or is it free?"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label className={optionCardClass(value.releasePaymentType === 'paid')}>
            <input
              type="radio"
              name="vaReleasePaymentType"
              checked={value.releasePaymentType === 'paid'}
              onChange={() => update('releasePaymentType', 'paid')}
              className="sr-only"
            />
            <CircleIndicator checked={value.releasePaymentType === 'paid'} />
            <span>Paid (Money will be given)</span>
          </label>

          <label className={optionCardClass(value.releasePaymentType === 'free')}>
            <input
              type="radio"
              name="vaReleasePaymentType"
              checked={value.releasePaymentType === 'free'}
              onChange={() => update('releasePaymentType', 'free')}
              className="sr-only"
            />
            <CircleIndicator checked={value.releasePaymentType === 'free'} />
            <span>Free (No money to be paid)</span>
          </label>
        </div>

        {value.releasePaymentType === 'paid' && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                Agreed Payment Amount (₹) <span className="text-red-500">*</span>
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
                  placeholder="Enter agreed amount (e.g. 10,000)"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className={`${SUBQUESTION_DIVIDER_CLASS} space-y-2`}>
              <label className="block text-xs sm:text-sm font-bold text-slate-900">
                When paid? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {VIDEO_AUDIO_WHEN_PAID_OPTIONS.map((option) => {
                  const isSelected = value.paymentWhen === option;
                  return (
                    <label key={option} className={optionCardClass(isSelected)}>
                      <input
                        type="radio"
                        name="vaPaymentWhen"
                        checked={isSelected}
                        onChange={() => update('paymentWhen', option)}
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
                How counted as paid? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {VIDEO_AUDIO_HOW_COUNTED_OPTIONS.map((option) => {
                  const isSelected = value.paymentCountedHow === option;
                  return (
                    <label key={option} className={optionCardClass(isSelected)}>
                      <input
                        type="radio"
                        name="vaPaymentCountedHow"
                        checked={isSelected}
                        onChange={() => update('paymentCountedHow', option)}
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
        )}
      </div>

      {/* 5. Editing and changes */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <TopicHeader
          number={5}
          title="Editing and changes"
          question="Can the video or audio be edited, cut, dubbed, or changed?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {VIDEO_AUDIO_EDITING_OPTIONS.map((option) => {
            const isSelected = value.editingAllowed === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="vaEditingAllowed"
                  checked={isSelected}
                  onChange={() => update('editingAllowed', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 6. Showing your name or identity */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <TopicHeader
          number={6}
          title="Showing your name or identity"
          question="Should the person's name, face, or identity be shown when used?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {VIDEO_AUDIO_IDENTITY_OPTIONS.map((option) => {
            const isSelected = value.identityDisplay === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="vaIdentityDisplay"
                  checked={isSelected}
                  onChange={() => update('identityDisplay', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>

        {value.identityDisplay === 'Other' && (
          <input
            type="text"
            value={value.identityCustom}
            onChange={(e) => update('identityCustom', e.target.value)}
            placeholder="Specify how name, face, or voice should be credited or hidden..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        )}
      </div>

      {/* 7. No Claim or Objection Confirmation */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
        <div className="flex items-start justify-between gap-2">
          <TopicHeader
            number={7}
            title="No Claim or Objection Confirmation"
            question="Do you confirm this video or audio is yours to share and you will not object or ask for extra money later?"
            required
          />
          <span className="text-[11px] text-slate-500 font-medium shrink-0">
            Both required
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {VIDEO_AUDIO_RIGHTS_CONFIRM_OPTIONS.map((option) => {
            const isChecked = value.rightsConfirmChecks.includes(option);
            return (
              <label key={option} className={optionCardClass(isChecked)}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleListItem('rightsConfirmChecks', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isChecked} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 8. Official Notice and Written Rules Only */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-3.5`}>
        <TopicHeader
          number={8}
          title="Official Notice and Written Rules Only"
          question="How should notices be sent, and will only written rules here count?"
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs sm:text-sm font-bold text-slate-900">
            Official Notice Method <span className="text-red-500">*</span>
          </label>
          <WhiteSelect
            value={value.officialNoticeMethod}
            onChange={(val) => update('officialNoticeMethod', val)}
            placeholder="Select how notices should be sent"
            options={VIDEO_AUDIO_NOTICE_OPTIONS}
            aria-label="Official Notice Method"
          />
        </div>

        <div className={`${SUBQUESTION_DIVIDER_CLASS} space-y-2`}>
          <div className="flex items-center justify-between gap-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-900">
              Only Written Rules &amp; Changes Confirmation{' '}
              <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500 font-medium shrink-0">
              Both required
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {VIDEO_AUDIO_WRITTEN_RULES_OPTIONS.map((option) => {
              const isChecked = value.writtenRulesChecks.includes(option);
              return (
                <label key={option} className={optionCardClass(isChecked)}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleListItem('writtenRulesChecks', option)}
                    className="sr-only"
                  />
                  <CircleIndicator checked={isChecked} />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* 9. Agreement Validity */}
      <div className={TOPIC_DIVIDER_CLASS}>
        <AgreementValiditySection
          topicNumber={9}
          value={value.agreementValidity}
          onChange={(next) => update('agreementValidity', next)}
        />
      </div>
    </div>
  );
};

interface VideoAudioOwnRulesSectionProps {
  topicNumber?: number;
  value: VideoAudioReleaseDetails;
  onChange: (next: VideoAudioReleaseDetails) => void;
}

export const VideoAudioOwnRulesSection: React.FC<VideoAudioOwnRulesSectionProps> = ({
  topicNumber = 11,
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
                name="vaHasOwnRules"
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
