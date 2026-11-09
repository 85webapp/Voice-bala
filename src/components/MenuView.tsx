import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Phone,
  MessageCircle
} from 'lucide-react';
import { ServiceCategory, SERVICE_CATEGORIES } from '../data/servicesData';
import { ServiceFormView } from './ServiceFormView';
import { GstRegistrationWizard } from './GstRegistrationWizard';
import { UdyamRegistrationWizard } from './UdyamRegistrationWizard';
import { playServiceVoice } from '../services/googleVoiceGuidance';

export const MenuView: React.FC = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<{ category: ServiceCategory; title: string } | null>(null);
  const [isSupportExpanded, setIsSupportExpanded] = useState<boolean>(false);

  const openService = (category: ServiceCategory, title: string) => {
    playServiceVoice(title);
    setSelectedService({ category, title });
  };

  const returnToMenu = () => {
    setSelectedService(null);
  };

  if (selectedService) {
    if (selectedService.title === 'GST Registration') {
      return <GstRegistrationWizard onBack={returnToMenu} />;
    }
    if (selectedService.title === 'MSME Udyam Registration') {
      return <UdyamRegistrationWizard onBack={returnToMenu} />;
    }
    return (
      <ServiceFormView
        category={selectedService.category}
        title={selectedService.title}
        onBack={returnToMenu}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-5 animate-fadeIn pb-24 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-black">Services</h1>
      </div>

      <div className="space-y-3">
        {SERVICE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isExpanded = expandedCategory === category.id;
          return (
            <section key={category.id} className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-slate-50 cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-900">{category.title}</span>
                    <span className="block text-xs text-slate-500">{category.services.length} services</span>
                  </span>
                </span>
                {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
              </button>
              {isExpanded && (
                <div className="border-t border-slate-200 divide-y divide-slate-100">
                  {category.services.map((service) => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => openService(category, service)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left text-sm text-slate-800 hover:bg-blue-50 cursor-pointer"
                    >
                      <span>{service}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {/* Call & Support Card at the bottom of the list */}
        <section className="bg-white border-2 border-blue-500/30 rounded-xl shadow-xs overflow-hidden">
          <button
            type="button"
            aria-expanded={isSupportExpanded}
            onClick={() => setIsSupportExpanded(!isSupportExpanded)}
            className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-blue-50/30 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-900">Call &amp; Support</span>
                <span className="block text-xs text-blue-600 font-semibold">24/7 Contact Support</span>
              </span>
            </span>
            {isSupportExpanded ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
          </button>

          {isSupportExpanded && (
            <div className="border-t border-slate-200 p-4 bg-slate-50/70 space-y-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dedicated Legal Representative</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    Online 24/7
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900">
                  Speak Directly with Harshit
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Connect directly with our dedicated senior executive for instant assistance with agreements, registrations, notices, e-Stamp paper, and compliance filings.
                </p>
              </div>

              {/* Direct Call & WhatsApp Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <a
                  href="tel:+919286596391"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
                >
                  <Phone className="w-4 h-4" />
                  <span>Direct Call</span>
                </a>

                <a
                  href="https://wa.me/919286596391?text=Hello%20Harshit,%20I%20need%20assistance%20regarding%20CTC%20Legal%20Services."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>WhatsApp Message</span>
                </a>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};