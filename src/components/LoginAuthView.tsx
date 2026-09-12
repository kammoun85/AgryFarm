import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Mail, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Cloud, 
  Smartphone, 
  Database, 
  ArrowRight,
  Sparkles,
  RefreshCw,
  FileText,
  Check
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  resetUserPassword, 
  signOutUser 
} from '../services/firebase';
import { Language } from '../types';

interface LoginAuthViewProps {
  user: User | null;
  authLoading: boolean;
  syncing: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
  farmOwnerName?: string;
  farmName?: string;
  farmLocation?: string;
  phone?: string;
  onUpdateFarmOwner?: (ownerName: string, farmName?: string, location?: string, phone?: string) => Promise<void>;
  onManualSync: () => Promise<void>;
  onGoToDashboard: () => void;
  onClearHistoric: () => void;
  lang: Language;
}

export const LoginAuthView: React.FC<LoginAuthViewProps> = ({
  user,
  authLoading,
  syncing,
  lastSyncedAt,
  syncError,
  farmOwnerName = '',
  farmName = '',
  farmLocation = '',
  phone = '',
  onUpdateFarmOwner,
  onManualSync,
  onGoToDashboard,
  onClearHistoric,
  lang,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Custom Farm Owner & Farm Name for first login / setup
  const [signUpOwnerName, setSignUpOwnerName] = useState('');
  const [signUpFarmName, setSignUpFarmName] = useState('');

  // Editable states for authenticated user
  const [authOwnerName, setAuthOwnerName] = useState(farmOwnerName);
  const [authFarmName, setAuthFarmName] = useState(farmName);
  const [authLocation, setAuthLocation] = useState(farmLocation);
  const [authPhone, setAuthPhone] = useState(phone);
  const [savingOwner, setSavingOwner] = useState(false);
  const [ownerSavedSuccess, setOwnerSavedSuccess] = useState(false);

  useEffect(() => {
    setAuthOwnerName(farmOwnerName);
    setAuthFarmName(farmName);
    setAuthLocation(farmLocation);
    setAuthPhone(phone);
  }, [farmOwnerName, farmName, farmLocation, phone]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSaveFarmOwnerDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateFarmOwner) return;
    try {
      setSavingOwner(true);
      await onUpdateFarmOwner(
        authOwnerName.trim() || 'Exploitant Agricole',
        authFarmName.trim() || 'Ferme Agricole',
        authLocation.trim(),
        authPhone.trim()
      );
      setOwnerSavedSuccess(true);
      setTimeout(() => setOwnerSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'enregistrement des coordonnées');
    } finally {
      setSavingOwner(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      setSuccessMessage('Connexion Google réussie !');
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setError(err?.message || 'Échec de la connexion avec Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !email.includes('@')) {
      setError('Veuillez saisir une adresse email valide.');
      return;
    }

    if (authMode === 'forgot') {
      try {
        setLoading(true);
        await resetUserPassword(email);
        setSuccessMessage('Un email de réinitialisation de mot de passe a été envoyé.');
      } catch (err: any) {
        setError(err?.message || 'Erreur lors de l\'envoi de l\'email.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      setLoading(true);
      if (authMode === 'signup') {
        const createdUser = await signUpWithEmail(email, password);
        const ownerToSave = signUpOwnerName.trim() || createdUser.displayName || email.split('@')[0];
        const farmToSave = signUpFarmName.trim() || 'Mon Exploitation';
        if (onUpdateFarmOwner) {
          await onUpdateFarmOwner(ownerToSave, farmToSave, 'Tunisie', '');
        }
        setSuccessMessage('Compte créé avec succès avec un historique vierge !');
      } else {
        await signInWithEmail(email, password);
        setSuccessMessage('Connexion réussie !');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password') {
        setError('Email ou mot de passe incorrect.');
      } else if (err?.code === 'auth/email-already-in-use') {
        setError('Cette adresse email est déjà enregistrée. Veuillez vous connecter.');
      } else {
        setError(err?.message || 'Une erreur est survenue lors de l\'authentification.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOutUser();
      setSuccessMessage('Déconnexion effectuée.');
    } catch (err: any) {
      setError('Erreur lors de la déconnexion.');
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated: show Account & Security management screen
  if (user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-14 h-14 rounded-2xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  user.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-7 h-7" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900">
                    {user.displayName || 'Gestionnaire de Ferme'}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Session Sécurisée &amp; En Ligne
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                id="btn-go-dashboard"
                onClick={onGoToDashboard}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>Accéder à la Ferme</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                id="btn-signout"
                onClick={handleSignOut}
                disabled={loading}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>

          {/* Security & Sync Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs mb-1">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Base Firestore Dédiée</span>
              </div>
              <p className="text-xs text-slate-500">
                Vos données sont isolées sous votre identifiant unique (UID). Aucun autre utilisateur ne peut y accéder.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs mb-1">
                <Cloud className="w-4 h-4 text-emerald-600" />
                <span>Synchronisation En Ligne</span>
              </div>
              <p className="text-xs text-slate-500">
                {lastSyncedAt 
                  ? `Dernière synchro réussie à ${lastSyncedAt.toLocaleTimeString()}`
                  : 'Connexion en direct avec le serveur'}
              </p>
              <button
                type="button"
                onClick={onManualSync}
                disabled={syncing}
                className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Synchronisation...' : 'Forcer la synchronisation'}
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs mb-1">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Multi-Appareils Actif</span>
              </div>
              <p className="text-xs text-slate-500">
                Connectez-vous sur votre smartphone ou tablette avec ce même compte pour retrouver vos chiffres en direct.
              </p>
            </div>
          </div>
        </div>

        {/* Farm Owner Information & PDF Facture Identity */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Identité de l&apos;Exploitant pour les Factures PDF
                </h3>
                <p className="text-xs text-slate-500">
                  Ce nom apparaîtra en entête et au niveau du cachet de signature sur chaque facture officielle générée.
                </p>
              </div>
            </div>
            {ownerSavedSuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                Enregistré avec succès !
              </span>
            )}
          </div>

          <form onSubmit={handleSaveFarmOwnerDetails} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom du Propriétaire / Exploitant *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={authOwnerName}
                    onChange={(e) => setAuthOwnerName(e.target.value)}
                    placeholder="Ex: Mohamed Ben Ali"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom de la Ferme / Domaine Agricole
                </label>
                <input
                  type="text"
                  value={authFarmName}
                  onChange={(e) => setAuthFarmName(e.target.value)}
                  placeholder="Ex: Ferme El Baraka"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Localisation / Ville
                </label>
                <input
                  type="text"
                  value={authLocation}
                  onChange={(e) => setAuthLocation(e.target.value)}
                  placeholder="Ex: Pont du Fahs, Zaghouan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Téléphone Professionnel (sur facture)
                </label>
                <input
                  type="text"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  placeholder="Ex: +216 98 123 456"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingOwner}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingOwner ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{savingOwner ? 'Enregistrement...' : 'Enregistrer pour les Factures PDF'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Clear Historic Notice & Reset Tool */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-emerald-950">
                Historique Initial Vierge Garanti
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Chaque nouvel utilisateur bénéficie d'une comptabilité et d'un cheptel neufs à 0. 
                Toutes les opérations saisies (ovins, récoltes d'œufs, clients, ventes, dettes) sont enregistrées de façon permanente et synchronisées dans votre espace cloud personnel.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated: Show Login & Sign-Up view
  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6">
      {/* Brand & Security Guarantee */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-md mx-auto mb-1">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Connexion Sécurisée AgryTND
        </h2>
        <p className="text-xs text-slate-600 max-w-sm mx-auto">
          Connectez-vous pour activer la sauvegarde en ligne, l'accès multi-appareils et votre historique personnel dédié.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        {/* Google 1-Click Login Button */}
        <div>
          <button
            type="button"
            id="google-login-main-btn"
            onClick={handleGoogleSignIn}
            disabled={loading || authLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-2xs hover:shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Connexion en cours...' : 'Continuer avec Google'}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            ou avec votre email
          </span>
        </div>

        {/* Tab Toggle: Sign In vs Sign Up */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => { setAuthMode('signin'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              authMode === 'signin' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Se Connecter
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('signup'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              authMode === 'signup' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Nouveau Compte
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adresse Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre-ferme@exemple.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {authMode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Mot de Passe
                </label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          )}

          {authMode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmer le Mot de Passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmer votre mot de passe"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Farm & Owner naming for official Factures PDF */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Identité de l&apos;Exploitant (pour Factures PDF)</span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                    Nom &amp; Prénom de l&apos;Exploitant / Propriétaire
                  </label>
                  <input
                    type="text"
                    value={signUpOwnerName}
                    onChange={(e) => setSignUpOwnerName(e.target.value)}
                    placeholder="Ex: Mohamed Ben Ali"
                    className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="text-[10px] text-emerald-700 mt-0.5 block">
                    Ce nom sera automatiquement imprimé en entête et signature de vos Factures PDF.
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                    Nom de la Ferme / Domaine
                  </label>
                  <input
                    type="text"
                    value={signUpFarmName}
                    onChange={(e) => setSignUpFarmName(e.target.value)}
                    placeholder="Ex: Ferme El Baraka"
                    className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>
              {authMode === 'signup' 
                ? 'Créer mon Compte Vierge' 
                : authMode === 'forgot'
                ? 'Envoyer le Lien de Réinitialisation'
                : 'Se Connecter'}
            </span>
          </button>
        </form>

        {authMode === 'forgot' && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setAuthMode('signin')}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              Retour à la connexion
            </button>
          </div>
        )}
      </div>

      {/* Clear Historic Commitment Note */}
      <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Garantie Compte Neuf</span>
        </div>
        <p className="leading-relaxed">
          Chaque nouvel utilisateur démarre avec une base de données complètement vierge (historique vide, 0 ovins, 0 œufs en stock, 0 clients). Vos opérations restent strictement privées et accessibles en ligne.
        </p>
      </div>
    </div>
  );
};
