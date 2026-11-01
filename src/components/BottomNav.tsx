import React from 'react';
import { Home, LayoutDashboard, FileText, Menu } from 'lucide-react';
import { useDisplayLanguage } from '../hooks/useDisplayLanguage';

export type TabType = 'home' | 'dashboard' | 'agreements' | 'menu';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const { t } = useDisplayLanguage();
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agreements' as TabType, label: 'Agreements', icon: FileText },
    { id: 'menu' as TabType, label: 'Menu', icon: Menu }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-lg py-1.5 px-3">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-colors cursor-pointer select-none min-h-[48px] ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[11px] mt-1 tracking-tight leading-none">
                {t(tab.label)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
