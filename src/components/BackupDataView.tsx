import React, { useState, useRef } from 'react';
import { 
  Database, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  RotateCcw, 
  Trash2, 
  AlertTriangle, 
  Check, 
  HardDrive, 
  ShieldCheck, 
  Calendar,
  Layers,
  FileCheck
} from 'lucide-react';
import { FarmState, Language } from '../types';
import { translations } from '../i18n/translations';
import { formatDate, getTodayString } from '../utils/formatters';
import { exportFarmToExcel, importFarmFromExcel } from '../utils/excel';
import { CloudSyncStatus } from './CloudSyncStatus';
import { User } from 'firebase/auth';

interface BackupDataViewProps {
  state: FarmState;
  lang: Language;
  onClearAllExceptClients: () => void;
  onRestoreState: (newState: FarmState) => void;
  onResetToDemo: () => void;
  onCreateManualSnapshot: () => void;
  user?: User | null;
  authLoading?: boolean;
  syncing?: boolean;
  lastSyncedAt?: Date | null;
  syncError?: string | null;
  onManualSync?: () => Promise<void>;
}

export const BackupDataView: React.FC<BackupDataViewProps> = ({
  state,
  lang,
  onClearAllExceptClients,
  onRestoreState,
  onResetToDemo,
  onCreateManualSnapshot,
  user = null,
  authLoading = false,
  syncing = false,
  lastSyncedAt = null,
  syncError = null,
  onManualSync = async () => {},
}) => {
  const t = translations[lang];

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleExportExcel = () => {
    try {
      exportFarmToExcel(state, lang);
      setSuccessMessage(t.successExport);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to export Excel file');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const restored = await importFarmFromExcel(file);
      onRestoreState(restored);
      setSuccessMessage(t.successImport);
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not import Excel file. Please ensure it is an AgryTND backup.');
      setTimeout(() => setErrorMessage(''), 4000);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AgryTND_Backup_${getTodayString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.eggStock && parsed.clients) {
          onRestoreState(parsed);
          setSuccessMessage(t.successImport);
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          throw new Error('Invalid JSON structure');
        }
      } catch (err) {
        setErrorMessage('Invalid JSON backup file.');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Database className="w-6 h-6 text-emerald-600" />
          <span>{t.backupTitle}</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t.offlineStatus}
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Cloud Firestore Multi-Device Sync Card */}
      <CloudSyncStatus
        user={user}
        authLoading={authLoading}
        syncing={syncing}
        lastSyncedAt={lastSyncedAt}
        syncError={syncError}
        onManualSync={onManualSync}
        lang={lang}
      />

      {/* Offline First & Auto Backup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Offline First Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Local Offline Persistence
              </h3>
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active &amp; Synced Locally
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All livestock records, daily egg harvests, customer ledgers, and financial transactions are securely saved locally on this device. You can use AgryTND seamlessly even without an internet connection in the field.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Clients: {state.clients.length}</span>
            <span>Sheep: {state.sheepHerd.length}</span>
            <span>Orders: {state.orders.length}</span>
          </div>
        </div>

        {/* Monthly Auto-Backup Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Monthly Automated Snapshot
              </h3>
              <span className="text-xs text-blue-700 font-semibold">
                Scheduled on 1st of Every Month
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t.autoBackupNotice} An isolated snapshot of the farm state is preserved at the beginning of each accounting cycle so you never lose historical continuity.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {state.backups.length} snapshot(s) archived
            </span>
            <button
              type="button"
              id="create-manual-snapshot-btn"
              onClick={onCreateManualSnapshot}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              Take Snapshot Now
            </button>
          </div>
        </div>
      </div>

      {/* Excel (.xlsx) Export & Import Module */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Excel (.xlsx) Multi-Sheet Export &amp; Restore
            </h3>
            <p className="text-xs text-slate-500">
              Seamless data portability. Generates multi-tab workbooks containing Overview, Egg Harvests, Sheep Herd, Clients Ledger, Orders, and Expenses.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                {t.exportExcel}
              </span>
              <p className="text-xs text-slate-500 mb-3">
                Download a complete spreadsheet formatted with numbers, metrics, and ledgers in {lang.toUpperCase()}.
              </p>
            </div>
            <button
              id="export-excel-main-btn"
              type="button"
              onClick={handleExportExcel}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t.exportExcelFull}</span>
            </button>
          </div>

          {/* Import Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                {t.importExcel}
              </span>
              <p className="text-xs text-slate-500 mb-3">
                {t.importExcelNotice}
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-upload-input"
              />
              <button
                type="button"
                id="trigger-excel-import-btn"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Upload &amp; Restore from Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* JSON Raw backup option */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <span>Raw JSON Backup Options:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="text-slate-600 hover:text-slate-900 font-semibold underline cursor-pointer"
            >
              Download JSON
            </button>
            <span>•</span>
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              onChange={handleJsonUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => jsonInputRef.current?.click()}
              className="text-slate-600 hover:text-slate-900 font-semibold underline cursor-pointer"
            >
              Restore JSON
            </button>
          </div>
        </div>
      </div>

      {/* Snapshot History Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Automated &amp; Manual Snapshots History</span>
        </h3>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-2.5">{t.date}</th>
                <th className="p-2.5">Month Cycle</th>
                <th className="p-2.5">Records</th>
                <th className="p-2.5">Summary / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.backups.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">{formatDate(b.date, lang)}</td>
                  <td className="p-2.5 font-mono text-slate-600">{b.monthKey}</td>
                  <td className="p-2.5 text-slate-700">{b.recordCount} items</td>
                  <td className="p-2.5 text-slate-600">{b.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DANGER ZONE & DEDICATED BUTTON: "Clear All Except Clients" */}
      <div className="bg-rose-50/60 rounded-2xl p-6 border border-rose-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <h3 className="text-base font-bold tracking-tight">
            {t.dangerZone}
          </h3>
        </div>
        <p className="text-xs text-rose-800/90 leading-relaxed">
          Reset inventory and transactional data while protecting client profiles, or reload the initial Tunisian sample farm dataset.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Mandated Dedicated Button: Clear All Except Clients */}
          <button
            id="clear-all-except-clients-btn"
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t.clearAllExceptClients}</span>
          </button>

          {/* Reset to Demo Data */}
          <button
            id="reset-to-demo-btn"
            type="button"
            onClick={onResetToDemo}
            className="px-4 py-2.5 bg-white border border-rose-300 hover:bg-rose-50 text-rose-800 font-semibold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Default Tunisian Farm Data</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal: Clear All Except Clients */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {t.clearAllExceptClients}?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {t.clearExceptClientsConfirm}
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mb-4 font-medium">
              ✓ All {state.clients.length} clients and phone numbers will be safely preserved.
              <br />
              ✗ Sheep herd, egg collections, and orders will be cleared.
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                id="confirm-clear-clients-submit"
                type="button"
                onClick={() => {
                  onClearAllExceptClients();
                  setConfirmClearOpen(false);
                  setSuccessMessage('Inventory & transactions cleared! Clients preserved.');
                  setTimeout(() => setSuccessMessage(''), 3500);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Yes, Clear Except Clients
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
