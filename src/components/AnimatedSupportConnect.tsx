import React from 'react';
import { Phone, MessageCircle, ArrowUpRight } from 'lucide-react';

interface AnimatedSupportConnectProps {
  phoneNumber?: string;
}

export const AnimatedSupportConnect: React.FC<AnimatedSupportConnectProps> = ({
  phoneNumber = '+919286596391'
}) => {
  const cleanPhone = phoneNumber.replace(/\s+/g, '');
  const waNumber = cleanPhone.replace('+', '');
  const waMessage = encodeURIComponent(
    'Hello Harshit, I need assistance regarding Contracts, Tax & Compliance Group Legal Services.'
  );

  return (
    <section
      aria-label="Instant Support Connect"
      className="w-full rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/70 to-emerald-50/40 p-5 sm:p-6 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200/80">
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            Instant Support Connect
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tap either option below to start a call or WhatsApp chat right now
          </p>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 self-start sm:self-center">
          Available 24/7
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        {/* Direct Call Animated Tile */}
        <a
          href={`tel:${cleanPhone}`}
          aria-label="Direct Call"
          className="group relative flex items-center gap-4 rounded-2xl border border-emerald-200/90 bg-white p-4 shadow-2xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-emerald-400/25 animate-support-ripple"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-emerald-400/20 animate-support-ripple-delayed"
            />
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-700 text-white flex items-center justify-center shadow-sm animate-support-float group-hover:scale-105 transition-transform duration-200">
              <Phone className="w-5 h-5" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Direct Call
              </span>
              <ArrowUpRight className="w-4 h-4 text-emerald-600 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Instant phone connection
            </p>
          </div>
        </a>

        {/* WhatsApp Message Animated Tile */}
        <a
          href={`https://wa.me/${waNumber}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp Message"
          className="group relative flex items-center gap-4 rounded-2xl border border-emerald-200/90 bg-white p-4 shadow-2xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-[#25D366]/25 animate-support-ripple"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-[#25D366]/20 animate-support-ripple-delayed"
            />
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#25D366] to-emerald-600 text-white flex items-center justify-center shadow-sm animate-support-float group-hover:scale-105 transition-transform duration-200">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                WhatsApp Message
              </span>
              <ArrowUpRight className="w-4 h-4 text-emerald-600 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Quick chat with our desk
            </p>
          </div>
        </a>
      </div>
    </section>
  );
};
