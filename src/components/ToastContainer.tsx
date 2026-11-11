import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { subscribeToasts, dismissToast, ToastMessage } from '../services/toastService';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return subscribeToasts(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 inset-x-0 z-50 flex flex-col items-center pointer-events-none px-4 space-y-2"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto max-w-md w-full rounded-2xl p-4 shadow-xl border flex items-start gap-3 backdrop-blur-md animate-fadeIn transition-all ${
              isError
                ? 'bg-rose-50/95 border-rose-300 text-rose-900 ring-2 ring-rose-200'
                : isSuccess
                ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 ring-2 ring-emerald-200'
                : isWarning
                ? 'bg-amber-50/95 border-amber-300 text-amber-950 ring-2 ring-amber-200'
                : 'bg-white/95 border-slate-300 text-slate-900 ring-2 ring-slate-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isError ? (
                <AlertCircle className="w-5 h-5 text-rose-600" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-[#15803d]" />
              ) : isWarning ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <Info className="w-5 h-5 text-blue-600" />
              )}
            </div>

            <div className="flex-1 text-xs sm:text-sm font-semibold leading-relaxed">
              {toast.message}
            </div>

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
