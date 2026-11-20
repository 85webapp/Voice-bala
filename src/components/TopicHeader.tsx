import React from 'react';

interface TopicHeaderProps {
  number?: number;
  title: string;
  question?: string;
  required?: boolean;
}

export const TopicHeader: React.FC<TopicHeaderProps> = ({
  number,
  title,
  question,
  required = true
}) => {
  return (
    <div>
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          {number !== undefined ? `${number}. ` : ''}
          {title}
        </span>
        {required && <span className="text-red-500 font-bold text-xs">*</span>}
      </div>
      {question && (
        <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 leading-snug">
          {question}
        </p>
      )}
    </div>
  );
};
