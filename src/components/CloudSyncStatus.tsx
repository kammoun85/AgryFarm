import React, { useState } from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  User as UserIcon,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { User } from 'firebase/auth';
import { signInWithGoogle, signOutUser } from '../services/firebase';
import { Language } from '../types';

interface CloudSyncStatusProps {
  user: User | null;
  authLoading: boolean;
  syncing: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
  onManualSync: () => Promise<void>;
  lang: Language;
}

export const CloudSyncStatus: React.FC<CloudSyncStatusProps> = ({
  user,
  authLoading,
  syncing,
  lastSyncedAt,
  syncError,
  onManualSync,
  lang,
}) => {
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      setAuthError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setAuthError(err?.message || 'Failed to sign in with Google');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err: any) {
      console.error('Google sign out error:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: User status & Cloud database connection */}
        <div className="flex items-start sm:items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            user ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500'
          }`}>
            {user ? <Cloud className="w-6 h-6" /> : <CloudOff className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">
                Firebase Firestore Cloud Database
              </h3>
              {user ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Synced Across Devices
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Local Offline Only
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-0.5">
              {user ? (
                <span>
                  Connected as <strong className="text-slate-900">{user.displayName || user.email}</strong> • Real-time synchronization active
                </span>
              ) : (
                <span>
                  Sign in with Google to enable instant real-time sync across your phone, tablet, and PC.
                </span>
              )}
            </p>

            {lastSyncedAt && (
              <p className="text-[11px] text-slate-700 mt-1">
                Last synchronized: {lastSyncedAt.toLocaleTimeString()}
              </p>
            )}

            {syncError && (
              <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {syncError}
              </p>
            )}

            {authError && (
              <p className="text-xs text-rose-600 font-semibold mt-1">
                {authError}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <button
                type="button"
                id="manual-cloud-sync-btn"
                onClick={onManualSync}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync Cloud Now'}</span>
              </button>

              <button
                type="button"
                id="google-sign-out-btn"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              id="google-sign-in-btn"
              onClick={handleSignIn}
              disabled={signingIn || authLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs hover:shadow-md disabled:opacity-50 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{signingIn ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
