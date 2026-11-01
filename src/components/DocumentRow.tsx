import React from 'react';
import {
  ChevronRight,
  FileText,
  Building,
  Key,
  Video,
  Users,
  Briefcase,
  Layers,
  Wrench,
  UserCheck,
  Calendar,
  Car,
  FileQuestion,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { LegalDocument } from '../types';

interface DocumentRowProps {
  document: LegalDocument;
  onClick: (doc: LegalDocument) => void;
}

const getDocumentIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes('rent') || lower.includes('lease') || lower.includes('sub-lease')) {
    return Key;
  }
  if (lower.includes('noc')) {
    return Building;
  }
  if (lower.includes('brand') || lower.includes('influencer') || lower.includes('collab')) {
    return Sparkles;
  }
  if (lower.includes('video') || lower.includes('audio')) {
    return Video;
  }
  if (lower.includes('partnership') || lower.includes('founder') || lower.includes('shareholder')) {
    return Users;
  }
  if (lower.includes('proprietorship') || lower.includes('business')) {
    return Briefcase;
  }
  if (lower.includes('vendor') || lower.includes('supplier') || lower.includes('contract')) {
    return Layers;
  }
  if (lower.includes('equipment') || lower.includes('machinery')) {
    return Wrench;
  }
  if (lower.includes('name change') || lower.includes('address')) {
    return UserCheck;
  }
  if (lower.includes('birth') || lower.includes('age')) {
    return Calendar;
  }
  if (lower.includes('vehicle')) {
    return Car;
  }
  if (lower.includes('loss of document')) {
    return FileQuestion;
  }
  if (lower.includes('ragging') || lower.includes('gap year') || lower.includes('child')) {
    return GraduationCap;
  }
  return FileText;
};

export const DocumentRow: React.FC<DocumentRowProps> = ({ document, onClick }) => {
  const IconComponent = getDocumentIcon(document.title);

  return (
    <div
      onClick={() => onClick(document)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(document);
        }
      }}
      className="group w-full bg-white hover:bg-blue-50/40 active:bg-blue-100/50 border border-slate-200/90 hover:border-blue-300 rounded-xl px-4 py-3.5 mb-2.5 shadow-2xs hover:shadow-xs transition-all duration-200 flex items-center justify-between cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      {/* Left Section: Blue Icon & Document Label */}
      <div className="flex items-center gap-3.5 min-w-0 pr-3">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors duration-200">
          <IconComponent className="w-5 h-5" />
        </div>

        <div className="flex flex-col text-left truncate">
          <span className="text-sm sm:text-base font-semibold text-black group-hover:text-blue-700 transition-colors truncate">
            {document.title}
          </span>
          <span className="text-xs text-slate-400 font-normal truncate">
            {document.category} · Drafting template
          </span>
        </div>
      </div>

      {/* Right Section: Make → Action Button */}
      <div className="shrink-0 flex items-center">
        <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 group-hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all">
          <span>Make</span>
          <span className="font-extrabold text-sm">→</span>
        </div>
      </div>
    </div>
  );
};
