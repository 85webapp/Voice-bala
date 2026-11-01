import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { SERVICE_CATEGORIES, ServiceCategory } from '../data/servicesData';
import { ServiceFormView } from './ServiceFormView';
import { GstRegistrationWizard } from './GstRegistrationWizard';
import { UdyamRegistrationWizard } from './UdyamRegistrationWizard';

export const MenuView: React.FC = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<{ category: ServiceCategory; title: string } | null>(null);

  const openService = (category: ServiceCategory, title: string) => {
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
      </div>
    </div>
  );
};