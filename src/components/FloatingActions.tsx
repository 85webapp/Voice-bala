import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';

interface FloatingActionsProps {
  isLoggedIn?: boolean;
  onOpenAuth?: () => void;
  phoneNumber?: string;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  phoneNumber = '+919286596391'
}) => {
  const cleanPhone = phoneNumber.replace(/\s+/g, '');
  const waNumber = cleanPhone.replace('+', '');
  const waMessage = encodeURIComponent('Hello Harshit / CTC Legal, I need assistance with an Agreement, Filing or Legal Service.');

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2.5 pointer-events-auto">
      {/* Floating Call & WhatsApp Buttons Container */}
      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-xl border border-slate-200/90">
        {/* Direct Phone Call Button */}
        <a
          href={`tel:${cleanPhone}`}
          className="w-10 h-10 rounded-full bg-[#15803d] hover:bg-[#166534] active:scale-95 text-white flex items-center justify-center shadow-sm transition-all cursor-pointer group"
          title="Direct Phone Call"
          aria-label="Direct Phone Call"
        >
          <Phone className="w-4 h-4 group-hover:animate-bounce" />
        </a>

        {/* Direct WhatsApp Chat Button */}
        <a
          href={`https://wa.me/${waNumber}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3.5 h-10 rounded-full bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer group"
          title="Chat on WhatsApp"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      </div>
    </div>
  );
};
