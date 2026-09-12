import React from 'react';
import { 
  Sprout, 
  LayoutDashboard, 
  Boxes, 
  Users, 
  ClipboardList, 
  ReceiptText, 
  Database, 
  ShieldCheck, 
  Lock, 
  Globe,
  AlertCircle,
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { formatTND } from '../utils/formatters';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lang: Language;
  setLang: (l: Language) => void;
  totalDebtsTND: number;
  isMfaLocked: boolean;
  onToggleLock: () => void;
  user: User | null;
  syncing: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onSync: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  totalDebtsTND,
  isMfaLocked,
  onToggleLock,
  user,
  syncing,
  onSignIn,
  onSignOut,
  onSync,
}) => {
  const t = translations[lang];

  const navItems = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'inventory', label: t.navInventory, icon: Boxes },
    { 
      id: 'clients', 
      label: t.navClients, 
      icon: Users,
      badge: totalDebtsTND > 0 ? formatTND(totalDebtsTND, lang, 0) : undefined 
    },
    { id: 'operations', label: t.navOperations, icon: ClipboardList },
    { id: 'financial', label: t.navFinancial, icon: ReceiptText },
    { id: 'backup', label: t.navBackups, icon: Database },
    { 
      id: 'login', 
      label: user ? (lang === 'ar' ? 'حسابي' : 'Mon Compte') : (lang === 'ar' ? 'دخول' : 'Connexion'), 
      icon: user ? ShieldCheck : LogIn,
      badge: user ? (lang === 'ar' ? 'سحابي' : 'Cloud') : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Farm Identity */}
          <div className="flex items-center gap-3">
            <button
              id="brand-home-btn"
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30 group-hover:bg-emerald-700 transition-colors">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-slate-900 font-sans">
                    Agry<span className="text-emerald-600">TND</span>
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    TN
                  </span>
                </div>
                <p className="text-xs text-slate-700 hidden sm:block">
                  {t.appSubtitle}
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-600'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Utilities: Language Switcher, Debt Alert, MFA Lock */}
          <div className="flex items-center gap-2">
            {/* Total Debt quick indicator on tablets/desktop */}
            {totalDebtsTND > 0 && (
              <div 
                onClick={() => setCurrentTab('clients')}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold cursor-pointer hover:bg-amber-100 transition-colors"
                title={t.totalOutstandingBanner}
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.totalDebtBalance}: {formatTND(totalDebtsTND, lang, 0)}</span>
              </div>
            )}

            {/* Language Selector */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                id="lang-btn-en"
                onClick={() => setLang('en')}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                  lang === 'en' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                EN
              </button>
              <button
                id="lang-btn-fr"
                onClick={() => setLang('fr')}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                  lang === 'fr' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                FR
              </button>
              <button
                id="lang-btn-ar"
                onClick={() => setLang('ar')}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                  lang === 'ar' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                عربي
              </button>
            </div>

            {/* Simulated MFA Lock/Unlock Button */}
            <button
              id="mfa-lock-btn"
              onClick={onToggleLock}
              title={isMfaLocked ? t.mfaLocked : t.lockApp}
              className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-medium ${
                isMfaLocked
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {isMfaLocked ? (
                <>
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span className="hidden sm:inline">{t.mfaLocked}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">MFA</span>
                </>
              )}
            </button>

            {/* Google Cloud Account / Sync Button */}
            {user ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="navbar-sync-btn"
                  onClick={onSync}
                  disabled={syncing}
                  title="Synchroniser avec le cloud Firestore"
                  className="p-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
                <div 
                  onClick={() => setCurrentTab('login')}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                  title={`Compte: ${user.email} (Cliquer pour gérer)`}
                >
                  <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="hidden xl:inline max-w-[110px] truncate font-medium">{user.displayName || user.email?.split('@')[0]}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSignOut();
                    }}
                    title="Déconnexion"
                    className="p-0.5 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                id="navbar-login-btn"
                onClick={() => setCurrentTab('login')}
                title="Connectez-vous pour sécuriser vos données en ligne"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connexion / Compte</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-between overflow-x-auto py-2 border-t border-slate-100 gap-1 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
