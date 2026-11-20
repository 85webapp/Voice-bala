import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { WhiteSelect } from './WhiteSelect';
import { TopicHeader } from './TopicHeader';
import {
  CircleIndicator,
  optionCardClass,
  TOPIC_DIVIDER_CLASS
} from './OptionControl';
import {
  LatePaymentFeesSection,
  LatePaymentFeesValue,
  DEFAULT_LATE_PAYMENT_FEES,
  validateLatePaymentFees
} from './LatePaymentFeesSection';

export interface CreatorSponsorshipDetails {
  workType: string;
  workTypeCustom: string;
  workDescription: string;
  totalPayment: string;
  addExtraGst: boolean;
  gstRate: string;
  paymentReceive: string;
  paymentReceiveCustom: string;
  liveVideoValidity: string;
  liveVideoCustomNumber: number;
  liveVideoCustomUnit: 'Day' | 'Month' | 'Year';
  platforms: string[];
  platformCustom: string;
  territory: string;
  territorySpecific: string;
  cancellingAgreement: string;
  contentApproval: string;
  exclusivityOption: '' | 'yes' | 'no';
  exclusivityNumber: number;
  exclusivityUnit: 'Day' | 'Month' | 'Year';
  usageRightsPaidAds: string;
  videoModificationOption: '' | 'maximum' | 'unlimited';
  videoModificationCount: number;
  breachPenalty: string;
  legalCopyrightResponsibility: string;
  latePayment: LatePaymentFeesValue;
}

export const DEFAULT_CREATOR_SPONSORSHIP_DETAILS: CreatorSponsorshipDetails = {
  workType: '',
  workTypeCustom: '',
  workDescription: '',
  totalPayment: '',
  addExtraGst: false,
  gstRate: '18%',
  paymentReceive: '',
  paymentReceiveCustom: '',
  liveVideoValidity: '',
  liveVideoCustomNumber: 6,
  liveVideoCustomUnit: 'Month',
  platforms: [],
  platformCustom: '',
  territory: '',
  territorySpecific: '',
  cancellingAgreement: '',
  contentApproval: '',
  exclusivityOption: '',
  exclusivityNumber: 1,
  exclusivityUnit: 'Month',
  usageRightsPaidAds: '',
  videoModificationOption: '',
  videoModificationCount: 2,
  breachPenalty: '',
  legalCopyrightResponsibility: '',
  latePayment: DEFAULT_LATE_PAYMENT_FEES
};

export function validateCreatorSponsorshipPage4(
  details: CreatorSponsorshipDetails
): string | null {
  if (!details.workType) {
    return 'Please select an option under "What work need to be done?".';
  }
  if (details.workType === 'Custom / Other' && !details.workTypeCustom.trim()) {
    return 'Please specify custom work in "What work need to be done".';
  }
  if (!details.workDescription.trim()) {
    return 'Please describe your work or video.';
  }
  if (!details.totalPayment.trim()) {
    return 'Please enter the total payment amount.';
  }
  if (!details.paymentReceive) {
    return 'Please select Payment Schedule.';
  }
  if (details.paymentReceive === 'Custom' && !details.paymentReceiveCustom.trim()) {
    return 'Please specify custom payment receive terms.';
  }
  if (!details.liveVideoValidity) {
    return 'Please select Validity of Live Video.';
  }
  if (details.platforms.length === 0) {
    return 'Please select at least one Platform.';
  }
  if (details.platforms.includes('Custom / Other') && !details.platformCustom.trim()) {
    return 'Please enter the custom platform name.';
  }
  if (!details.territory) {
    return 'Please select Territory.';
  }
  if (details.territory === 'Specific State / City Only' && !details.territorySpecific.trim()) {
    return 'Please enter the specific State or City in Territory.';
  }
  if (!details.cancellingAgreement) {
    return 'Please select Cancelling the Agreement option.';
  }
  if (!details.contentApproval) {
    return 'Please select Content Approval option.';
  }
  if (!details.exclusivityOption) {
    return 'Please select Exclusivity / Competitor option.';
  }
  if (!details.usageRightsPaidAds) {
    return 'Please select Usage Rights / Paid Ads option.';
  }
  if (!details.videoModificationOption) {
    return 'Please select Video Modification option.';
  }
  if (!details.breachPenalty) {
    return 'Please select Breach of Contract and Penalties option.';
  }
  if (!details.legalCopyrightResponsibility) {
    return 'Please select Legal or Copyright Responsibility option.';
  }
  const lateErr = validateLatePaymentFees(details.latePayment, true);
  if (lateErr) {
    return lateErr;
  }
  return null;
}

export const WORK_TYPE_OPTIONS = [
  'Instagram Reels',
  'Instagram Story',
  'YouTube Dedicated Video',
  'YouTube Shorts',
  'Facebook Reels',
  'Facebook Video',
  'Custom / Other'
];

export const PAYMENT_RECEIVE_OPTIONS = [
  '100% advance before posting',
  '50% advance and 50% after posting',
  '100% after posting (within 7 days)',
  'Custom'
];

export const LIVE_VIDEO_VALIDITY_OPTIONS = [
  'Must stay live for 30 days',
  'Must stay live for 90 days',
  'Must stay live for permanent',
  'Custom'
];

export const PLATFORM_OPTIONS = [
  { id: 'Instagram', label: 'Instagram' },
  { id: 'Facebook', label: 'Facebook' },
  { id: 'YouTube', label: 'YouTube' },
  { id: 'TikTok', label: 'TikTok' },
  { id: 'Snapchat', label: 'Snapchat' },
  { id: 'WhatsApp', label: 'WhatsApp' },
  {
    id: 'Any Platform (Allowed on all platforms)',
    label: 'Any Platform (Allowed on all platforms)',
    hint: 'Can be published on any platform — I allow all platforms'
  },
  { id: 'Custom / Other', label: 'Custom / Other' }
];

export const TERRITORY_OPTIONS = [
  'Pan India',
  'Worldwide (Global)',
  'Specific State / City Only'
];

export const CANCELLING_AGREEMENT_OPTIONS = [
  'No cancellation allowed after signing',
  'Allowed within 7 days prior notice',
  'Allowed within 15 days prior notice'
];

export const CONTENT_APPROVAL_OPTIONS = [
  'Yes, brand approval is required before posting',
  'No, the creator can post directly without brand approval'
];

export const USAGE_RIGHTS_OPTIONS = [
  'Yes, brand can run paid ads',
  'No, only organic posting on creator profile is allowed'
];

export const BREACH_PENALTY_OPTIONS = [
  'Creator must return all advance money',
  'Creator must pay for the loss',
  'No penalty, we will sort it out by talking'
];

export const LEGAL_COPYRIGHT_OPTIONS = [
  'Only Creator',
  'Only Brand',
  'If brand gives the script',
  'Both Creator and Brand share the responsibility'
];

const NUMBERS_1_TO_31 = Array.from({ length: 31 }, (_, i) => String(i + 1));
const NUMBERS_1_TO_81 = Array.from({ length: 81 }, (_, i) => String(i + 1));
const NUMBERS_1_TO_100 = Array.from({ length: 100 }, (_, i) => String(i + 1));

interface CreatorSponsorshipPage4Props {
  value: CreatorSponsorshipDetails;
  onChange: (next: CreatorSponsorshipDetails) => void;
}

export const CreatorSponsorshipPage4: React.FC<CreatorSponsorshipPage4Props> = ({
  value,
  onChange
}) => {
  const [workDropdownOpen, setWorkDropdownOpen] = useState(false);
  const workDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workDropdownRef.current && !workDropdownRef.current.contains(event.target as Node)) {
        setWorkDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const update = <K extends keyof CreatorSponsorshipDetails>(
    key: K,
    val: CreatorSponsorshipDetails[K]
  ) => {
    onChange({ ...value, [key]: val });
  };

  const togglePlatform = (platformId: string) => {
    const exists = value.platforms.includes(platformId);
    const next = exists
      ? value.platforms.filter((p) => p !== platformId)
      : [...value.platforms, platformId];
    update('platforms', next);
  };

  return (
    <div className="space-y-5">
      {/* 1. What work need to be done (White Dropdown) */}
      <div className="space-y-2">
        <TopicHeader
          number={1}
          title="Deliverable Type"
          question="What work need to be done?"
          required
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="relative flex-1" ref={workDropdownRef}>
            <button
              type="button"
              onClick={() => setWorkDropdownOpen((prev) => !prev)}
              aria-expanded={workDropdownOpen}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <span className={`truncate ${!value.workType ? 'text-slate-400 font-normal' : ''}`}>
                {value.workType || 'Select work type'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                  workDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {workDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 max-h-64 overflow-y-auto">
                {WORK_TYPE_OPTIONS.map((option) => {
                  const isSelected = value.workType === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        update('workType', option);
                        setWorkDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm flex items-center justify-between bg-white hover:bg-slate-50 transition-colors cursor-pointer ${
                        isSelected ? 'font-bold text-blue-700' : 'font-medium text-slate-900'
                      }`}
                    >
                      <span>{option}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {value.workType === 'Custom / Other' && (
          <input
            type="text"
            value={value.workTypeCustom}
            onChange={(e) => update('workTypeCustom', e.target.value)}
            placeholder="Specify custom work deliverable..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        )}
      </div>

      {/* 2. Describe your work or video */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={2}
          title="Work Description"
          question="Describe your work or video"
          required
        />
        <textarea
          rows={2}
          value={value.workDescription}
          onChange={(e) => update('workDescription', e.target.value)}
          placeholder="Describe your work or video story in short form"
          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
        />
      </div>

      {/* 3. How much is the total payment? + Add extra GST */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={3}
          title="Total Payment"
          question="How much is the total payment?"
          required
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-slate-500">
              ₹
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={value.totalPayment}
              onChange={(e) => update('totalPayment', e.target.value)}
              placeholder="Enter total payment amount (e.g. 25,000)"
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <label className={optionCardClass(value.addExtraGst, 'inline-flex shrink-0')}>
            <input
              type="checkbox"
              checked={value.addExtraGst}
              onChange={(e) => update('addExtraGst', e.target.checked)}
              className="sr-only"
            />
            <CircleIndicator checked={value.addExtraGst} />
            <span>Add extra GST</span>
            {value.addExtraGst && (
              <WhiteSelect
                variant="inline"
                aria-label="Extra GST percentage"
                value={value.gstRate}
                options={['18%', '12%', '5%', '28%']}
                onChange={(val) => update('gstRate', val)}
              />
            )}
          </label>
        </div>
      </div>

      {/* 4. Payment receive */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={4}
          title="Payment Schedule"
          question="When will the payment be received?"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PAYMENT_RECEIVE_OPTIONS.map((option) => {
            const isSelected = value.paymentReceive === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="paymentReceive"
                  checked={isSelected}
                  onChange={() => update('paymentReceive', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
        {value.paymentReceive === 'Custom' && (
          <input
            type="text"
            value={value.paymentReceiveCustom}
            onChange={(e) => update('paymentReceiveCustom', e.target.value)}
            placeholder="Specify custom payment receive terms..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        )}
      </div>

      {/* 5. Validity of live video */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={5}
          title="Validity of Live Video"
          question="How long must the live video stay published?"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {LIVE_VIDEO_VALIDITY_OPTIONS.map((option) => {
            const isSelected = value.liveVideoValidity === option;
            const isCustom = option === 'Custom';
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="liveVideoValidity"
                  checked={isSelected}
                  onChange={() => update('liveVideoValidity', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                {isCustom ? (
                  <span className="flex flex-wrap items-center gap-y-1">
                    <span>Custom:</span>
                    <WhiteSelect
                      variant="inline"
                      aria-label="Custom live video validity duration number"
                      value={String(value.liveVideoCustomNumber)}
                      options={NUMBERS_1_TO_31}
                      onTriggerClick={() => update('liveVideoValidity', 'Custom')}
                      onChange={(val) =>
                        onChange({
                          ...value,
                          liveVideoValidity: 'Custom',
                          liveVideoCustomNumber: Number(val)
                        })
                      }
                    />
                    <WhiteSelect
                      variant="inline"
                      aria-label="Custom live video validity duration unit"
                      value={value.liveVideoCustomUnit}
                      options={['Month', 'Year', 'Day']}
                      onTriggerClick={() => update('liveVideoValidity', 'Custom')}
                      onChange={(val) =>
                        onChange({
                          ...value,
                          liveVideoValidity: 'Custom',
                          liveVideoCustomUnit: val as 'Day' | 'Month' | 'Year'
                        })
                      }
                    />
                  </span>
                ) : (
                  <span>{option}</span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* 6. Platform (Multi-select) */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <div className="flex items-start justify-between gap-2">
          <TopicHeader
            number={6}
            title="Platform"
            question="Which platforms can this content be posted on?"
            required
          />
          <span className="text-[11px] text-slate-500 font-medium shrink-0">
            Multiple selections allowed
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PLATFORM_OPTIONS.map((platform) => {
            const isChecked = value.platforms.includes(platform.id);
            const isWide = platform.id === 'Any Platform (Allowed on all platforms)';
            return (
              <label
                key={platform.id}
                className={optionCardClass(
                  isChecked,
                  isWide ? 'sm:col-span-2' : '',
                  true
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => togglePlatform(platform.id)}
                  className="sr-only"
                />
                <CircleIndicator checked={isChecked} className="mt-0.5" />
                <div className="flex flex-col">
                  <span>{platform.label}</span>
                  {platform.hint && (
                    <span className="text-[11px] font-normal text-slate-500 mt-0.5">
                      {platform.hint}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
        {value.platforms.includes('Custom / Other') && (
          <input
            type="text"
            value={value.platformCustom}
            onChange={(e) => update('platformCustom', e.target.value)}
            placeholder="Enter custom platform name(s)..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        )}
      </div>

      {/* 7. Territory */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={7}
          title="Territory"
          question="In which territory will this agreement apply?"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TERRITORY_OPTIONS.map((option) => {
            const isSelected = value.territory === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="territory"
                  checked={isSelected}
                  onChange={() => update('territory', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
        {value.territory === 'Specific State / City Only' && (
          <input
            type="text"
            value={value.territorySpecific}
            onChange={(e) => update('territorySpecific', e.target.value)}
            placeholder="Enter specific State or City name..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        )}
      </div>

      {/* 8. Cancelling the Agreement */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={8}
          title="Cancelling the Agreement"
          question="How can this agreement be cancelled?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {CANCELLING_AGREEMENT_OPTIONS.map((option) => {
            const isSelected = value.cancellingAgreement === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="cancellingAgreement"
                  checked={isSelected}
                  onChange={() => update('cancellingAgreement', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 9. Content Approval */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={9}
          title="Content Approval"
          question="Does the brand need to approve the video before it goes live?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {CONTENT_APPROVAL_OPTIONS.map((option) => {
            const isSelected = value.contentApproval === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="contentApproval"
                  checked={isSelected}
                  onChange={() => update('contentApproval', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 10. Exclusivity / Competitor */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={10}
          title="Exclusivity / Competitor"
          question="Can the creator work with rival / competing brands?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          <label className={optionCardClass(value.exclusivityOption === 'yes')}>
            <input
              type="radio"
              name="exclusivityOption"
              checked={value.exclusivityOption === 'yes'}
              onChange={() => update('exclusivityOption', 'yes')}
              className="sr-only"
            />
            <CircleIndicator checked={value.exclusivityOption === 'yes'} />
            <span>Yes, creator can work with anyone anytime</span>
          </label>

          <label className={optionCardClass(value.exclusivityOption === 'no', '', true)}>
            <input
              type="radio"
              name="exclusivityOption"
              checked={value.exclusivityOption === 'no'}
              onChange={() => update('exclusivityOption', 'no')}
              className="sr-only"
            />
            <CircleIndicator checked={value.exclusivityOption === 'no'} className="mt-0.5" />
            <span className="leading-relaxed">
              No, creator cannot promote competing brand during
              <WhiteSelect
                variant="inline"
                aria-label="Exclusivity duration number"
                value={String(value.exclusivityNumber)}
                options={NUMBERS_1_TO_81}
                onTriggerClick={() => update('exclusivityOption', 'no')}
                onChange={(val) =>
                  onChange({
                    ...value,
                    exclusivityOption: 'no',
                    exclusivityNumber: Number(val)
                  })
                }
              />
              <WhiteSelect
                variant="inline"
                aria-label="Exclusivity duration unit"
                value={value.exclusivityUnit}
                options={['Day', 'Month', 'Year']}
                onTriggerClick={() => update('exclusivityOption', 'no')}
                onChange={(val) =>
                  onChange({
                    ...value,
                    exclusivityOption: 'no',
                    exclusivityUnit: val as 'Day' | 'Month' | 'Year'
                  })
                }
              />
              and after the campaign
            </span>
          </label>
        </div>
      </div>

      {/* 11. Usage Rights / Paid Ads */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={11}
          title="Usage Rights / Paid Ads"
          question="Can the brand use this video to run paid ads?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {USAGE_RIGHTS_OPTIONS.map((option) => {
            const isSelected = value.usageRightsPaidAds === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="usageRightsPaidAds"
                  checked={isSelected}
                  onChange={() => update('usageRightsPaidAds', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 12. Video Modification */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={12}
          title="Video Modification"
          question="How many changes or edits can brand ask for after seeing the video?"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className={optionCardClass(value.videoModificationOption === 'maximum')}>
            <input
              type="radio"
              name="videoModificationOption"
              checked={value.videoModificationOption === 'maximum'}
              onChange={() => update('videoModificationOption', 'maximum')}
              className="sr-only"
            />
            <CircleIndicator checked={value.videoModificationOption === 'maximum'} />
            <span className="leading-relaxed">
              Maximum
              <WhiteSelect
                variant="inline"
                aria-label="Maximum video edits allowed"
                value={String(value.videoModificationCount)}
                options={NUMBERS_1_TO_100}
                onTriggerClick={() => update('videoModificationOption', 'maximum')}
                onChange={(val) =>
                  onChange({
                    ...value,
                    videoModificationOption: 'maximum',
                    videoModificationCount: Number(val)
                  })
                }
              />
              edits
            </span>
          </label>

          <label className={optionCardClass(value.videoModificationOption === 'unlimited')}>
            <input
              type="radio"
              name="videoModificationOption"
              checked={value.videoModificationOption === 'unlimited'}
              onChange={() => update('videoModificationOption', 'unlimited')}
              className="sr-only"
            />
            <CircleIndicator checked={value.videoModificationOption === 'unlimited'} />
            <span>Unlimited</span>
          </label>
        </div>
      </div>

      {/* 13. Breach of Contract and Penalties */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={13}
          title="Breach of Contract and Penalties"
          question="What happens if either party breaks the contract?"
          required
        />
        <div className="grid grid-cols-1 gap-2">
          {BREACH_PENALTY_OPTIONS.map((option) => {
            const isSelected = value.breachPenalty === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="breachPenalty"
                  checked={isSelected}
                  onChange={() => update('breachPenalty', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 14. Legal Problems or Copyright Problem */}
      <div className={`${TOPIC_DIVIDER_CLASS} space-y-2`}>
        <TopicHeader
          number={14}
          title="Legal or Copyright Responsibility"
          question="Legal Problems or Copyright Problem — Who is Responsible?"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {LEGAL_COPYRIGHT_OPTIONS.map((option) => {
            const isSelected = value.legalCopyrightResponsibility === option;
            return (
              <label key={option} className={optionCardClass(isSelected)}>
                <input
                  type="radio"
                  name="legalCopyrightResponsibility"
                  checked={isSelected}
                  onChange={() => update('legalCopyrightResponsibility', option)}
                  className="sr-only"
                />
                <CircleIndicator checked={isSelected} />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 15. Late Payment Fees */}
      <div className={TOPIC_DIVIDER_CLASS}>
        <LatePaymentFeesSection
          topicNumber={15}
          radioNamePrefix="cs"
          value={value.latePayment}
          onChange={(next) => update('latePayment', next)}
        />
      </div>
    </div>
  );
};
