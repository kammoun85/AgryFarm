import React, { useState } from 'react';
import { FileSpreadsheet, Download, Check } from 'lucide-react';
import { FarmState, Language } from '../types';
import { exportFarmToExcel } from '../utils/excel';

interface FloatingExportButtonProps {
  state: FarmState;
  lang: Language;
}

export const FloatingExportButton: React.FC<FloatingExportButtonProps> = ({ state, lang }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleExport = () => {
    setDownloading(true);
    try {
      exportFarmToExcel(state, lang);
      setDownloaded(true);
      setTimeout(() => {
        setDownloaded(false);
        setDownloading(false);
      }, 2500);
    } catch (e) {
      setDownloading(false);
    }
  };

  return (
    <aside 
      aria-label="Export Actions"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2"
    >
      <button
        id="fab-excel-export-btn"
        type="button"
        onClick={handleExport}
        disabled={downloading}
        title="One-click Excel (.xlsx) export of farm summary reports"
        className="flex items-center gap-2 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer text-xs font-bold border border-emerald-500/40"
      >
        {downloaded ? (
          <>
            <Check className="w-4 h-4 text-emerald-200" />
            <span className="hidden sm:inline">Exported (.xlsx)!</span>
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span className="hidden sm:inline">Export Excel</span>
            <Download className="w-3.5 h-3.5 opacity-80" />
          </>
        )}
      </button>
    </aside>
  );
};
