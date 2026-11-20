import React from 'react';
import { TopicHeader } from './TopicHeader';
import { CircleIndicator, optionCardClass } from './OptionControl';

interface SignatoryAuthoritySectionProps {
  topicNumber?: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
  showError?: boolean;
}

export const SignatoryAuthoritySection: React.FC<SignatoryAuthoritySectionProps> = ({
  topicNumber,
  checked,
  onChange,
  showError = false
}) => {
  return (
    <div
      className={`p-4 rounded-2xl border space-y-2.5 transition-colors ${
        showError && !checked
          ? 'bg-rose-50/70 border-rose-400'
          : 'bg-slate-50/80 border-slate-200'
      }`}
    >
      <TopicHeader
        number={topicNumber}
        title="Signatory Authority Confirmation"
        question="Do you have fully authorized to sign and agree to this terms?"
        required
      />

      <label
        className={optionCardClass(
          checked,
          showError && !checked ? 'border-rose-400' : ''
        )}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <CircleIndicator checked={checked} />
        <span>Yes, I am authorized to enter this agreement.</span>
      </label>

      {showError && !checked && (
        <p className="text-xs font-bold text-rose-600">
          Please tick &ldquo;Yes, I am authorized to enter this agreement.&rdquo; before continuing.
        </p>
      )}
    </div>
  );
};
