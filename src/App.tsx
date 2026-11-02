import React, { lazy, Suspense, useState, useEffect } from 'react';
import { ArrowRight, FileText, Building2, ShieldCheck, FileCheck2 } from 'lucide-react';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { SearchBar } from './components/SearchBar';
import { DocumentRow } from './components/DocumentRow';
import { PoliciesSection } from './components/PoliciesSection';
import { PolicyPageView } from './components/PolicyPageView';
import { BottomNav, TabType } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { AgreementsView } from './components/AgreementsView';
import { MenuView } from './components/MenuView';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { ServiceFormView } from './components/ServiceFormView';
import { GstRegistrationWizard } from './components/GstRegistrationWizard';
import { UdyamRegistrationWizard } from './components/UdyamRegistrationWizard';
import { INITIAL_FRONT_DOCUMENTS } from './data/documentsData';
import { SERVICE_CATEGORIES, ServiceCategory } from './data/servicesData';
import { POLICIES_DATA } from './data/policiesData';
import { LegalDocument, OrderItem, PolicySection, UserProfile } from './types';
import { useDisplayLanguage } from './hooks/useDisplayLanguage';
import { playServiceVoice } from './services/googleVoiceGuidance';

const DocumentWizardView = lazy(() => import('./components/DocumentWizardView').then((module) => ({ default: module.DocumentWizardView })));
const RentLeaseWizardView = lazy(() => import('./components/RentLeaseWizardView').then((module) => ({ default: module.RentLeaseWizardView })));
const CommercialNocWizardView = lazy(() => import('./components/CommercialNocWizardView').then((module) => ({ default: module.CommercialNocWizardView })));
const GstNocWizardView = lazy(() => import('./components/GstNocWizardView').then((module) => ({ default: module.GstNocWizardView })));

type HomeCategory = 'agreements' | 'registrations' | 'insurance' | 'filings';

const HOME_CATEGORIES: { id: HomeCategory; label: string; icon: typeof FileText }[] = [
  { id: 'agreements', label: 'Agreements', icon: FileText },
  { id: 'registrations', label: 'Registrations', icon: Building2 },
  { id: 'insurance', label: 'Insurance', icon: ShieldCheck },
  { id: 'filings', label: 'Filings', icon: FileCheck2 }
];

const CATEGORY_TITLES: Record<HomeCategory, string> = {
  agreements: 'Popular Agreements & Affidavits',
  registrations: 'Popular Registrations',
  insurance: 'Popular Insurance',
  filings: 'Popular Filings'
};

export default function App() {
  useDisplayLanguage({ translateDom: true });
  // Active Bottom Tab: 'home' | 'dashboard' | 'agreements' | 'menu'
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [searchQuery, setSearchQuery] = useState('');

  // Dedicated Policy Full Page state
  const [activePolicyPage, setActivePolicyPage] = useState<PolicySection | null>(null);

  // Dedicated 5-Page Document Wizard Full Page state
  const [activeWizardDoc, setActiveWizardDoc] = useState<LegalDocument | null>(null);

  // Home Category Tabs: 'agreements' | 'registrations' | 'insurance' | 'filings'
  const [homeCategory, setHomeCategory] = useState<HomeCategory>('agreements');
  const [activeService, setActiveService] = useState<{ category: ServiceCategory; title: string } | null>(null);

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // User Profile
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('ctc_user_profile_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.isLoggedIn === 'boolean') {
          return parsed;
        }
      }
    } catch {}
    return {
      name: '',
      phone: '',
      email: '',
      city: '',
      state: '',
      isLoggedIn: false
    };
  });

  // Orders / Records
  const [orders, setOrders] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem('ctc_user_orders_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        orderId: 'CTC-849120',
        docTitle: '11th Month Rent Agreement',
        createdAt: '10:30 AM',
        date: '2026-10-24',
        deliveryHours: 24,
        deliveryFee: 0,
        baseFee: 299,
        totalFee: 299,
        paymentStatus: 'Paid',
        status: 'Delivered',
        pendingHours: 0,
        applicantName: 'Admin',
        applicantPhone: '2109141007',
        state: 'Uttar Pradesh',
        stampDenomination: '₹100',
        isPhysicalCourier: false
      },
      {
        orderId: 'CTC-520194',
        docTitle: 'Landlord NOC for GST',
        createdAt: '02:15 PM',
        date: '2026-10-25',
        deliveryHours: 12,
        deliveryFee: 60,
        baseFee: 199,
        totalFee: 259,
        paymentStatus: 'Unpaid',
        status: 'Processing',
        pendingHours: 3,
        applicantName: 'Admin',
        applicantPhone: '2109141007',
        state: 'Uttar Pradesh',
        stampDenomination: '₹50',
        isPhysicalCourier: false
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('ctc_user_profile_v2', JSON.stringify(profile));
    } catch {}
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem('ctc_user_orders_v2', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  const handleOrderCreated = (newOrder: OrderItem) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleUpdateOrder = (updatedOrder: OrderItem) => {
    setOrders((prev) =>
      prev.map((o) => (o.orderId === updatedOrder.orderId ? updatedOrder : o))
    );
  };

  const handleLogout = () => {
    setProfile((prev) => ({
      ...prev,
      isLoggedIn: false
    }));
  };

  const handleLoginSuccess = (loginData: Partial<UserProfile>) => {
    setProfile((prev) => ({
      ...prev,
      ...loginData,
      isLoggedIn: true
    }));
  };

  // Filtered documents on Home
  const filteredHomeDocs = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return INITIAL_FRONT_DOCUMENTS;
    }
    const q = searchQuery.toLowerCase().trim();
    return INITIAL_FRONT_DOCUMENTS.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-blue-600 selection:text-white pb-16">
      {/* 1. Pure White Header */}
      <Header
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        orderCount={orders.length}
        onNavigateHome={() => {
          setActiveWizardDoc(null);
          setActivePolicyPage(null);
          setActiveService(null);
          setActiveTab('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8 text-sm text-slate-500" role="status">Loading document form...</div>}>
        {/* If dedicated full page document wizard is active */}
        {activeWizardDoc ? (
          (() => {
            const lowerTitle = activeWizardDoc.title.toLowerCase();
            const commonProps = {
              document: activeWizardDoc,
              onBack: () => setActiveWizardDoc(null),
              onOrderCreated: handleOrderCreated,
              onNavigateToDashboard: () => {
                setActiveWizardDoc(null);
                setActiveTab('dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            };

            // 1. Landlord NOC for GST (GST REG-01 Compliant)
            if (lowerTitle.includes('gst') || lowerTitle.includes('reg-01')) {
              return <GstNocWizardView {...commonProps} />;
            }

            // 2. Landlord NOC for Business (Commercial NOC Architecture)
            if (
              lowerTitle.includes('noc for business') ||
              (lowerTitle.includes('noc') && lowerTitle.includes('business')) ||
              lowerTitle.includes('commercial no-objection')
            ) {
              return <CommercialNocWizardView {...commonProps} />;
            }

            // 3. Rent & Lease Agreements (11th Month, Commercial Lease, Sub-Lease - MTA Compliant)
            if (
              lowerTitle.includes('rent') ||
              lowerTitle.includes('lease') ||
              lowerTitle.includes('tenancy') ||
              lowerTitle.includes('sub-lease')
            ) {
              return <RentLeaseWizardView {...commonProps} />;
            }

            // 4. All Other Master Agreements & Affidavits
            return <DocumentWizardView {...commonProps} />;
          })()
        ) : activePolicyPage ? (
          /* If dedicated full page policy is active */
          <PolicyPageView
            policy={activePolicyPage}
            onBack={() => setActivePolicyPage(null)}
          />
        ) : activeTab === 'dashboard' ? (
          /* TAB 2: Dashboard */
          <DashboardView
            orders={orders}
            onUpdateOrder={handleUpdateOrder}
          />
        ) : activeTab === 'agreements' ? (
          /* TAB 3: Agreements (Clean page with 7 categories and Make → buttons) */
          <AgreementsView
            onSelectDocument={(doc) => {
              setActiveWizardDoc(doc);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : activeTab === 'menu' ? (
          /* TAB 4: Menu */
          <MenuView />
        ) : (
          /* TAB 1: Home */
          activeService ? (
            activeService.title === 'GST Registration' ? (
              <GstRegistrationWizard onBack={() => setActiveService(null)} />
            ) : activeService.title === 'MSME Udyam Registration' ? (
              <UdyamRegistrationWizard onBack={() => setActiveService(null)} />
            ) : (
              <ServiceFormView
                category={activeService.category}
                title={activeService.title}
                onBack={() => setActiveService(null)}
              />
            )
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-5 sm:py-6">
              {/* Banner */}
              <HeroBanner />

              {/* Search Bar */}
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSelectDocument={(doc) => {
                  setActiveWizardDoc(doc);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />

              {/* Category Selection: As-is text with curved outline, blue outline when selected */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 my-4">
                {HOME_CATEGORIES.map((tab) => {
                  const isSelected = homeCategory === tab.id;
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setHomeCategory(tab.id);
                        setActiveService(null);
                      }}
                      className={`inline-flex items-center gap-2 py-2 px-4 rounded-full transition-all duration-150 cursor-pointer text-xs sm:text-sm select-none ${
                        isSelected
                          ? 'border-2 border-blue-600 text-blue-600 font-bold bg-transparent'
                          : 'border border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900 font-medium bg-transparent'
                      }`}
                    >
                      <TabIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Clean Sub-header (Only Title: Popular Agreements & Affidavits / Registrations / Insurance / Filings) */}
              <div className="mb-3 px-1">
                <h2 className="text-base sm:text-lg font-bold text-black">
                  {CATEGORY_TITLES[homeCategory]}
                </h2>
              </div>

              {/* Category-Specific Items */}
              {homeCategory === 'agreements' ? (
                <>
                  {/* The Rectangular Document Rows with Make → */}
                  <div className="space-y-1">
                    {filteredHomeDocs.map((doc) => (
                      <DocumentRow
                        key={doc.id}
                        document={doc}
                        onClick={(d) => {
                          playServiceVoice(d.title);
                          setActiveWizardDoc(d);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                    ))}
                  </div>

                  {/* View All Button -> Switches to Agreements Tab */}
                  {!searchQuery.trim() && (
                    <div className="mt-5 mb-8 flex justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('agreements');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full sm:w-auto min-w-[280px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm sm:text-base py-3.5 px-8 rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
                      >
                        <span>View All Categories</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                (() => {
                  const currentCat = SERVICE_CATEGORIES.find((c) => c.id === homeCategory)!;
                  const q = searchQuery.toLowerCase().trim();
                  const filteredServices = currentCat.services.filter(
                    (s) => !q || s.toLowerCase().includes(q)
                  );

                  return (
                    <div className="space-y-1 mb-8">
                      {filteredServices.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                          No matching services found for &ldquo;{searchQuery}&rdquo;.
                        </div>
                      ) : (
                        filteredServices.map((serviceName) => {
                          const CategoryIcon = currentCat.icon;
                          return (
                            <div
                              key={serviceName}
                              onClick={() => {
                                playServiceVoice(serviceName);
                                setActiveService({ category: currentCat, title: serviceName });
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  playServiceVoice(serviceName);
                                  setActiveService({ category: currentCat, title: serviceName });
                                }
                              }}
                              className="group w-full bg-white hover:bg-blue-50/40 active:bg-blue-100/50 border border-slate-200/90 hover:border-blue-300 rounded-xl px-4 py-3.5 mb-2.5 shadow-2xs hover:shadow-xs transition-all duration-200 flex items-center justify-between cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                            >
                              <div className="flex items-center gap-3.5 min-w-0 pr-3">
                                <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors duration-200">
                                  <CategoryIcon className="w-5 h-5" />
                                </div>

                                <div className="flex flex-col text-left truncate">
                                  <span className="text-sm sm:text-base font-semibold text-black group-hover:text-blue-700 transition-colors truncate">
                                    {serviceName}
                                  </span>
                                  <span className="text-xs text-slate-400 font-normal truncate">
                                    {currentCat.title} · Fast Service Filing
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playServiceVoice(serviceName);
                                    setActiveService({ category: currentCat, title: serviceName });
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 group-hover:bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                                >
                                  <span>{homeCategory === 'filings' ? 'File' : 'Apply'}</span>
                                  <span className="font-extrabold text-sm">→</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })()
              )}

              {/* Section with Divider line & "Terms & Policies" in center and blue bullet links */}
              <PoliciesSection
                onSelectPolicy={(policy) => {
                  setActiveWizardDoc(null);
                  setActivePolicyPage(policy);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )
        )}
        </Suspense>
      </main>

      {/* 4 Bottom Navigation Bar: Home | Dashboard | Agreements | Menu */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveWizardDoc(null);
          setActivePolicyPage(null);
          setActiveService(null);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Profile Modal */}
      {isProfileOpen && (
        <ProfileModal
          profile={profile}
          onSaveProfile={(updated) => setProfile(updated)}
          onClose={() => setIsProfileOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          profile={profile}
          onClose={() => setIsSettingsOpen(false)}
          onOpenPolicies={() => {
            setActiveWizardDoc(null);
            setActivePolicyPage(POLICIES_DATA[0]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* Auth Modal */}
      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
