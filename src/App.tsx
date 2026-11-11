import React, { lazy, Suspense, useState, useEffect } from 'react';
import { ArrowRight, FileText, Building2, ShieldCheck, FileCheck2, BellRing, Globe2, Landmark, Headphones, Phone, MessageCircle, X, ListChecks } from 'lucide-react';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { SearchBar } from './components/SearchBar';
import { DocumentRow } from './components/DocumentRow';
import { PoliciesSection } from './components/PoliciesSection';
import { PolicyPageView } from './components/PolicyPageView';
import { CheckStepsView } from './components/CheckStepsView';
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
import { FloatingActions } from './components/FloatingActions';
import { INITIAL_FRONT_DOCUMENTS, FEATURED_11_AGREEMENTS_ORDER } from './data/documentsData';
import { SERVICE_CATEGORIES, ServiceCategory } from './data/servicesData';
import { POLICIES_DATA } from './data/policiesData';
import { LegalDocument, OrderItem, PolicySection, UserProfile } from './types';
import { useDisplayLanguage } from './hooks/useDisplayLanguage';
import { playServiceVoice } from './services/googleVoiceGuidance';
import { CategoryBanner } from './components/CategoryBanner';
import { ToastContainer } from './components/ToastContainer';

const DocumentWizardView = lazy(() => import('./components/DocumentWizardView').then((module) => ({ default: module.DocumentWizardView })));
const RentLeaseWizardView = lazy(() => import('./components/RentLeaseWizardView').then((module) => ({ default: module.RentLeaseWizardView })));
const CommercialNocWizardView = lazy(() => import('./components/CommercialNocWizardView').then((module) => ({ default: module.CommercialNocWizardView })));
const GstNocWizardView = lazy(() => import('./components/GstNocWizardView').then((module) => ({ default: module.GstNocWizardView })));

type HomeCategory = 'agreements' | 'registrations' | 'insurance' | 'filings' | 'notices' | 'website' | 'bank-loans' | 'support';

const HOME_CATEGORIES: { id: HomeCategory; label: string; icon: typeof FileText }[] = [
  { id: 'agreements', label: 'Agreements', icon: FileText },
  { id: 'registrations', label: 'Registrations', icon: Building2 },
  { id: 'insurance', label: 'Insurance', icon: ShieldCheck },
  { id: 'filings', label: 'Filings', icon: FileCheck2 },
  { id: 'notices', label: 'Notices', icon: BellRing },
  { id: 'website', label: 'Website', icon: Globe2 },
  { id: 'bank-loans', label: 'Bank Loan', icon: Landmark },
  { id: 'support', label: 'Call & Support', icon: Headphones }
];

const CATEGORY_TITLES: Record<HomeCategory, string> = {
  agreements: 'Popular Agreements & Affidavits',
  registrations: 'Popular Registrations',
  insurance: 'Popular Insurance',
  filings: 'Popular Filings',
  notices: 'Notice Handling & Compliance',
  website: 'Website & Digital Branding',
  'bank-loans': 'Bank Loan & Finance Files',
  support: '24/7 Dedicated Contact Support'
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
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isCheckStepsOpen, setIsCheckStepsOpen] = useState(false);

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

  // Orders / Records - Clean by default, only populated when user files an application
  const [orders, setOrders] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem('ctc_user_orders_v2');
      if (saved) {
        const parsed: OrderItem[] = JSON.parse(saved);
        // Exclude old mock demo order IDs
        const filtered = parsed.filter(o => o.orderId !== 'CTC-849120' && o.orderId !== 'CTC-520194');
        return filtered;
      }
    } catch {}
    return [];
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
      // Strict 1 to 11 exact ordering specified by user
      const mapByTitle = new Map(INITIAL_FRONT_DOCUMENTS.map((d) => [d.title.toLowerCase().trim(), d]));
      const featured: LegalDocument[] = [];
      for (const title of FEATURED_11_AGREEMENTS_ORDER) {
        const found = mapByTitle.get(title.toLowerCase().trim());
        if (found) featured.push(found);
      }
      return featured.length > 0 ? featured : INITIAL_FRONT_DOCUMENTS.slice(0, 11);
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
      <ToastContainer />
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
        ) : isCheckStepsOpen ? (
          /* Check Steps (Cotrix Tcg) Dedicated View */
          <CheckStepsView
            onBack={() => setIsCheckStepsOpen(false)}
            onSelectAgreements={() => {
              setIsCheckStepsOpen(false);
              setHomeCategory('agreements');
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
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

              {/* Category Selection: Smooth horizontal scrollable slider */}
              <div className="flex items-center gap-2 sm:gap-2.5 my-4 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap py-1.5 px-0.5">
                {HOME_CATEGORIES.map((tab) => {
                  const isSelected = homeCategory === tab.id;
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={(e) => {
                        e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                        setHomeCategory(tab.id);
                        setActiveService(null);
                      }}
                      className={`inline-flex items-center gap-2 py-2 px-3.5 rounded-xl transition-all duration-150 cursor-pointer text-xs sm:text-sm select-none shrink-0 ${
                        isSelected
                          ? 'bg-white text-black font-extrabold border-2 border-black shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 font-medium'
                      }`}
                    >
                      <TabIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-black' : 'text-slate-500'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Clean Sub-header */}
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

                  {/* View All Button -> Matches Logo Royal Blue (#1e40af / hover #1e3a8a) */}
                  {!searchQuery.trim() && (
                    <div className="mt-5 mb-6 flex justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('agreements');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full sm:w-auto min-w-[280px] bg-[#1e40af] hover:bg-[#1e3a8a] active:bg-[#172554] text-white font-bold text-sm sm:text-base py-3.5 px-8 rounded-xl shadow-md shadow-blue-900/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
                      >
                        <span>View All Categories</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}
                </>
              ) : homeCategory === 'support' ? (
                /* Contact Support Section mirroring other categories */
                <div className="space-y-3 mb-8">
                  {/* 1. Contact Support Row */}
                  <div
                    onClick={() => setShowSupportModal(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setShowSupportModal(true);
                      }
                    }}
                    className="group w-full bg-white hover:bg-blue-50/40 active:bg-blue-100/50 border border-slate-200/90 hover:border-blue-300 rounded-xl px-4 py-3.5 shadow-2xs hover:shadow-xs transition-all duration-200 flex items-center justify-between cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-3">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors duration-200">
                        <Headphones className="w-5 h-5" />
                      </div>

                      <div className="flex flex-col text-left truncate">
                        <span className="text-sm sm:text-base font-semibold text-black group-hover:text-blue-700 transition-colors truncate">
                          24/7 Dedicated Support
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSupportModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#15803d] group-hover:bg-[#166534] hover:bg-[#166534] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <span>Make Call or Message</span>
                        <span className="font-extrabold text-sm">→</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Check Steps Row right below Contact Support per user request */}
                  <div
                    onClick={() => {
                      setIsCheckStepsOpen(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsCheckStepsOpen(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="group w-full bg-white hover:bg-blue-50/40 active:bg-blue-100/50 border border-slate-200/90 hover:border-blue-300 rounded-xl px-4 py-3.5 shadow-2xs hover:shadow-xs transition-all duration-200 flex items-center justify-between cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-3">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors duration-200">
                        <ListChecks className="w-5 h-5" />
                      </div>

                      <div className="flex flex-col text-left truncate">
                        <span className="text-sm sm:text-base font-semibold text-black group-hover:text-blue-700 transition-colors truncate">
                          Check Steps
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCheckStepsOpen(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#15803d] group-hover:bg-[#166534] hover:bg-[#166534] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <span>Check Steps</span>
                        <span className="font-extrabold text-sm">→</span>
                      </button>
                    </div>
                  </div>

                  {/* Below that: Green button labeled "Go" */}
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => setShowSupportModal(true)}
                      className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#15803d] hover:bg-[#166534] active:bg-[#14532d] text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
                    >
                      <span>Go</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                (() => {
                  const currentCat = SERVICE_CATEGORIES.find((c) => c.id === homeCategory);
                  if (!currentCat) return null;
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
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#15803d] group-hover:bg-[#166534] hover:bg-[#166534] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
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

              {/* Category-Specific Highlight Banner (Replaces video per user request) */}
              <CategoryBanner category={homeCategory} />

              {/* Section with Divider line & "Terms & Policies" in center and black bullet links */}
              <PoliciesSection
                onSelectPolicy={(policy) => {
                  if (policy.id === 'check-steps') {
                    setActiveWizardDoc(null);
                    setActivePolicyPage(null);
                    setIsCheckStepsOpen(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  setActiveWizardDoc(null);
                  setIsCheckStepsOpen(false);
                  setActivePolicyPage(policy);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )
        )}
        </Suspense>
      </main>

      {/* Floating Action Buttons: Direct Call & WhatsApp */}
      <FloatingActions
        isLoggedIn={!!profile.isLoggedIn}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

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
            setIsCheckStepsOpen(false);
            setActivePolicyPage(POLICIES_DATA[0]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenCheckSteps={() => {
            setActiveWizardDoc(null);
            setActivePolicyPage(null);
            setIsCheckStepsOpen(true);
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

      {/* Deciding Contact Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 relative animate-scaleUp"
            role="dialog"
            aria-modal="true"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3 pr-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#15803d] flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Deciding Contact Support</h3>
                <p className="text-xs text-slate-500 font-medium">Call or WhatsApp</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Connect directly with our senior executive for immediate assistance with agreements, registrations, notices, e-Stamp paper, and compliance filings.
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <a
                href="tel:+919286596391"
                onClick={() => setShowSupportModal(false)}
                className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#15803d] hover:bg-[#166534] active:bg-[#14532d] text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Direct Call</span>
              </a>

              <a
                href="https://wa.me/919286596391?text=Hello%20Harshit,%20I%20need%20assistance%20regarding%20CTC%20Legal%20Services."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowSupportModal(false)}
                className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da851] text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>WhatsApp Message</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
