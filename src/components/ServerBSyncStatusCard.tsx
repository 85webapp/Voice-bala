import React from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck, ExternalLink, WifiOff } from 'lucide-react';
import { ServerBSyncResult } from '../services/encryptionService';

interface ServerBSyncStatusCardProps {
  syncResult: ServerBSyncResult | null;
  isRetrying?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const ServerBSyncStatusCard: React.FC<ServerBSyncStatusCardProps> = ({
  syncResult,
  isRetrying = false,
  onRetry,
  className = ''
}) => {
  if (!syncResult) {
    return (
      <div className={`p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 animate-pulse flex items-center gap-3 ${className}`}>
        <RefreshCw className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">Server B Connection</p>
          <p className="text-sm font-medium">Encrypting payload & syncing to Server B...</p>
        </div>
      </div>
    );
  }

  const isSuccess = syncResult.status === 'synced';

  if (isSuccess) {
    return (
      <div className={`p-4 rounded-2xl border-2 border-emerald-500/50 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-sm transition-all ${className}`}>
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white rounded-md shadow-xs">
                Sync Success
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Zero-Knowledge Encrypted
              </span>
            </div>
            <h4 className="mt-1 text-sm font-bold text-emerald-900 dark:text-emerald-100">
              Data synced to Server B successfully!
            </h4>
            <p className="mt-0.5 text-xs text-emerald-700/90 dark:text-emerald-300/80 leading-relaxed">
              Target endpoint <code className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 font-mono text-[11px] text-emerald-800 dark:text-emerald-200">{syncResult.endpoint}</code> acknowledged verified HMAC receipt.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  const errorName = syncResult.error || 'Server B Unreachable';
  const isCorsOrOffline = errorName.toLowerCase().includes('refused') || errorName.toLowerCase().includes('fetch') || errorName.toLowerCase().includes('network');

  return (
    <div className={`p-4 rounded-2xl border-2 border-rose-500/60 bg-rose-50/95 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 shadow-md transition-all ${className}`}>
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
          {isCorsOrOffline ? <WifiOff className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white rounded-md shadow-xs">
              Direct Sync Failed
            </span>
            <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Payload Safe & Preserved
            </span>
          </div>

          <h4 className="mt-1.5 text-sm font-bold text-rose-900 dark:text-rose-100">
            Sync Failed: <span className="font-mono text-xs underline decoration-rose-400 decoration-wavy">[{errorName}]</span>
          </h4>

          {/* Detailed clear explanation */}
          <div className="mt-2 p-2.5 rounded-xl bg-white/70 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-200 space-y-1 leading-relaxed">
            <p>
              <strong>Exact Error:</strong>{' '}
              <span className="font-mono bg-rose-100 dark:bg-rose-900/40 px-1 py-0.5 rounded text-rose-900 dark:text-rose-100">
                {errorName}
              </span>
            </p>
            <p>
              <strong>Reason:</strong>{' '}
              {isCorsOrOffline
                ? `Website A attempted to deliver the encrypted payload silently via fetch() to ${syncResult.endpoint}, but the destination server is either offline, not accepting external browser CORS preflights, or still using placeholder credentials.`
                : `Website B returned an HTTP failure status while processing the encrypted payload.`}
            </p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 pt-0.5">
              ✓ <strong>Zero-Knowledge Safety:</strong> No unencrypted data was lost. The encrypted docket is stored in your local session and automatically relayed via backend buffer.
            </p>
          </div>

          {onRetry && (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying sync...' : 'Retry Sync to Server B'}
              </button>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-mono truncate max-w-[200px]">
                {syncResult.endpoint}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
