import React, { useState } from 'react';
import { ShieldCheck, Lock, Unlock, KeyRound, Check, AlertCircle, Phone, MapPin, User, X } from 'lucide-react';
import { FarmState, Language } from '../types';
import { translations } from '../i18n/translations';

interface MfaModalProps {
  state: FarmState;
  lang: Language;
  isOpen: boolean;
  onClose?: () => void;
  onSuccessUnlock: () => void;
  onUpdateMfaConfig: (updatedMfa: FarmState['mfa']) => void;
}

export const MfaModal: React.FC<MfaModalProps> = ({
  state,
  lang,
  isOpen,
  onClose,
  onSuccessUnlock,
  onUpdateMfaConfig,
}) => {
  const t = translations[lang];
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isConfigMode, setIsConfigMode] = useState(false);
  
  // Config form state
  const [newPin, setNewPin] = useState(state.mfa.pin);
  const [ownerName, setOwnerName] = useState(state.mfa.farmOwnerName);
  const [farmName, setFarmName] = useState(state.mfa.farmName || '');
  const [location, setLocation] = useState(state.mfa.farmLocation);
  const [phone, setPhone] = useState(state.mfa.phone);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === state.mfa.pin) {
      setErrorMsg('');
      setPinInput('');
      onSuccessUnlock();
    } else {
      setErrorMsg(t.mfaWrongPin);
    }
  };

  const handleQuickBypass = () => {
    setPinInput(state.mfa.pin);
    setErrorMsg('');
    setTimeout(() => {
      onSuccessUnlock();
    }, 150);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMfaConfig({
      ...state.mfa,
      pin: newPin || '1234',
      farmOwnerName: ownerName,
      farmName: farmName,
      farmLocation: location,
      phone: phone,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsConfigMode(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
      <div 
        id="mfa-auth-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 text-center relative">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-3">
            <Lock className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">AgryTND Farm Security</h2>
          <p className="text-xs text-slate-300 mt-1">
            {t.mfaUnlockPrompt}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {!isConfigMode ? (
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Security PIN (4 Digits)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="mfa-pin-input"
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="••••"
                    autoFocus
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-2xl font-bold tracking-widest text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
                {errorMsg && (
                  <p className="mt-2 text-xs text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errorMsg}
                  </p>
                )}
              </div>

              {/* Demo Helper Pill */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t.mfaBypassHint}</span>
                </div>
                <button
                  type="button"
                  id="mfa-autofill-btn"
                  onClick={handleQuickBypass}
                  className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                >
                  Quick Unlock
                </button>
              </div>

              <button
                id="mfa-submit-unlock"
                type="submit"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>{t.mfaUnlockBtn}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  id="mfa-open-config-btn"
                  onClick={() => setIsConfigMode(true)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Farm Details &amp; Change PIN
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="text-sm font-bold text-slate-900">Farm Information &amp; PIN</span>
                <button
                  type="button"
                  onClick={() => setIsConfigMode(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Back to Unlock
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New 4-Digit PIN</label>
                <input
                  id="mfa-new-pin-input"
                  type="text"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nom du Propriétaire / Exploitant (Facture)</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="mfa-owner-name-input"
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Ex: Mohamed Ben Ali"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nom de l'Exploitation / Ferme</label>
                <input
                  id="mfa-farm-name-input"
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="Ex: Ferme El Baraka"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Farm Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="mfa-location-input"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="mfa-phone-input"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  id="mfa-save-config-btn"
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>{savedSuccess ? 'Saved!' : 'Save & Update'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfigMode(false)}
                  className="py-2 px-4 border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
