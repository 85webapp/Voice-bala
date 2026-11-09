import React from 'react';
import { BellRing, Globe2, Landmark, Headphones, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

interface CategoryBannerProps {
  category: 'agreements' | 'registrations' | 'insurance' | 'filings' | 'notices' | 'website' | 'bank-loans' | 'support';
}

export const CategoryBanner: React.FC<CategoryBannerProps> = ({ category }) => {
  switch (category) {
    case 'agreements':
      return (
        <div className="my-6 max-w-sm sm:max-w-md mx-auto flex items-center justify-center">
          <img
            src="/assets/aistudio/1000152949-removebg-preview_487fda73.png"
            alt="Buy Now Pay Later - Easier and can pay later - Cotrix tcg"
            className="w-full max-w-[340px] sm:max-w-[380px] h-auto object-contain select-none transition-transform duration-300 hover:scale-[1.02]"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      );

    case 'registrations':
      return (
        <div className="my-6 max-w-sm sm:max-w-md mx-auto flex items-center justify-center">
          <img
            src="/assets/aistudio/1000152947-removebg-preview_3822696d.png"
            alt="Smart Legal Documentation - Handshake Registration - Cotrix tcg"
            className="w-full max-w-[340px] sm:max-w-[380px] h-auto object-contain select-none transition-transform duration-300 hover:scale-[1.02]"
            loading="eager"
            decoding="async"
          />
        </div>
      );

    case 'insurance':
      return (
        <div className="my-6 max-w-sm sm:max-w-md mx-auto overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm bg-white">
          <img
            src="/assets/aistudio/Online_Shopping_Facebook_Cover_in_Sage_Green_Brown_Minimalist_Style__1__6d85c5ee.png"
            alt="Home Delivery - Nationwide Delivery - Make Now - Cotrix tcg"
            className="w-full h-auto object-cover select-none transition-transform duration-300 hover:scale-[1.01]"
            loading="eager"
            decoding="async"
          />
        </div>
      );

    case 'filings':
      return (
        <div className="my-6 max-w-sm sm:max-w-md mx-auto flex items-center justify-center">
          <img
            src="/assets/aistudio/1000152955-removebg-preview_1c3b5609.png"
            alt="Fast Speed Agreement Affidavits - Make in 10 minutes - Cotrix tcg"
            className="w-full max-w-[340px] sm:max-w-[380px] h-auto object-contain select-none transition-transform duration-300 hover:scale-[1.02]"
            loading="eager"
            decoding="async"
          />
        </div>
      );

    case 'notices':
      return (
        <div className="my-6 max-w-sm sm:max-w-md mx-auto flex items-center justify-center">
          <img
            src="/assets/aistudio/1000152971-removebg-preview_d751f20e.png"
            alt="Got a Notice? Don't Panic, We Solve It - Thynk Unlimited"
            className="w-full max-w-[340px] sm:max-w-[380px] h-auto object-contain select-none transition-transform duration-300 hover:scale-[1.02]"
            loading="eager"
            decoding="async"
          />
        </div>
      );

    case 'website':
      return (
        <div className="my-6 max-w-sm sm:max-w-md mx-auto overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm bg-black">
          <img
            src="/assets/aistudio/Lifestyle_Website_in_Green_Black_Yellow_Reality_Warp_Style_0d5c4afa.png"
            alt="Lifestyle Website Online Store Retail"
            className="w-full h-auto object-cover select-none transition-transform duration-300 hover:scale-[1.01]"
            loading="eager"
            decoding="async"
          />
        </div>
      );

    case 'bank-loans':
      return (
        <div className="my-6 max-w-sm sm:max-w-md mx-auto overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm bg-white">
          <img
            src="/assets/aistudio/1794145074867_7db683d0.png"
            alt="Open Account, Make Reports - Bank Loan & Financial Documentation"
            className="w-full h-auto object-cover select-none transition-transform duration-300 hover:scale-[1.01]"
            loading="eager"
            decoding="async"
          />
        </div>
      );

    case 'support':
      return (
        <div className="my-6 max-w-sm sm:max-w-md mx-auto overflow-hidden rounded-2xl border border-slate-800 shadow-md bg-black flex items-center justify-center p-2">
          <img
            src="/assets/aistudio/1794135072474_14cc4ceb.png"
            alt="Contact Now - 24/7 Dedicated Support"
            className="w-full max-w-[360px] h-auto object-contain select-none transition-transform duration-300 hover:scale-[1.01]"
            loading="eager"
            decoding="async"
          />
        </div>
      );

    default:
      return null;
  }
};
