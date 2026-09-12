import React, { useState } from 'react';
import { 
  ReceiptText, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  CreditCard,
  ShoppingBag,
  Eye
} from 'lucide-react';
import { FarmState, Language } from '../types';
import { translations } from '../i18n/translations';
import { formatTND, formatDate, getTodayString, getMonthKey } from '../utils/formatters';
import { generateMonthlyFacturePdf } from '../utils/pdfInvoice';

interface FinancialViewProps {
  state: FarmState;
  lang: Language;
  onUpdateOwnerInfo?: (ownerName: string, farmName?: string) => void;
}

export const FinancialView: React.FC<FinancialViewProps> = ({ state, lang, onUpdateOwnerInfo }) => {
  const t = translations[lang];

  // Month selector default to current month
  const currentMonthKey = getMonthKey(getTodayString());
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey);
  const [activeSubTab, setActiveSubTab] = useState<'sales' | 'expenses' | 'payments' | 'preview'>('sales');

  // Facture Owner & Farm Customization State
  const [ownerInput, setOwnerInput] = useState(state.mfa.farmOwnerName || '');
  const [farmInput, setFarmInput] = useState(state.mfa.farmName || '');
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [savedOwnerMsg, setSavedOwnerMsg] = useState(false);

  // Discover all months available in data
  const monthKeysSet = new Set<string>();
  monthKeysSet.add(currentMonthKey);
  state.orders.forEach((o) => monthKeysSet.add(getMonthKey(o.date)));
  state.expenses.forEach((e) => monthKeysSet.add(getMonthKey(e.date)));
  state.eggHarvests.forEach((h) => monthKeysSet.add(getMonthKey(h.date)));

  const availableMonths = Array.from(monthKeysSet).sort().reverse();

  // Filter records strictly isolated to the selected month
  const monthlyOrders = state.orders.filter((o) => o.date.startsWith(selectedMonthKey));
  const monthlyExpenses = state.expenses.filter((e) => e.date.startsWith(selectedMonthKey));
  const monthlyPayments = state.payments.filter((p) => p.date.startsWith(selectedMonthKey));
  const monthlyHarvests = state.eggHarvests.filter((h) => h.date.startsWith(selectedMonthKey));

  // Monthly Financial Calculations
  const grossSalesRevenue = monthlyOrders.reduce((acc, o) => acc + o.totalAmountTND, 0);
  const directCashCollected = monthlyOrders.reduce((acc, o) => acc + o.paidAmountTND, 0);
  const creditExtendedDebts = monthlyOrders.reduce((acc, o) => acc + o.debtAmountTND, 0);
  const totalFarmExpenses = monthlyExpenses.reduce((acc, e) => acc + e.amountTND, 0);
  const separateDebtRepayments = monthlyPayments.reduce((acc, p) => acc + p.amountTND, 0);
  const netOperatingMargin = grossSalesRevenue - totalFarmExpenses;
  const totalEggsCollectedInMonth = monthlyHarvests.reduce((acc, h) => acc + h.quantity, 0);

  const handleSaveOwnerInfo = () => {
    if (onUpdateOwnerInfo) {
      onUpdateOwnerInfo(ownerInput.trim() || state.mfa.farmOwnerName, farmInput.trim());
    }
    setIsEditingOwner(false);
    setSavedOwnerMsg(true);
    setTimeout(() => setSavedOwnerMsg(false), 2500);
  };

  const handleDownloadPdf = () => {
    generateMonthlyFacturePdf(
      state, 
      selectedMonthKey, 
      ownerInput.trim() || state.mfa.farmOwnerName, 
      farmInput.trim() || state.mfa.farmName
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Month Isolation Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-emerald-600" />
            <span>{t.financialTitle}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Month-by-month financial isolation with automated Tunisian Facture (Invoice) PDF generator.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Farm Owner Badge / Quick Edit */}
          <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-emerald-800 font-semibold">Exploitant (Facture):</span>
            {isEditingOwner ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={ownerInput}
                  onChange={(e) => setOwnerInput(e.target.value)}
                  placeholder="Nom Propriétaire"
                  className="px-2 py-0.5 bg-white border border-emerald-300 rounded text-xs text-slate-800 font-bold focus:outline-none w-36"
                />
                <button
                  type="button"
                  onClick={handleSaveOwnerInfo}
                  className="px-2 py-0.5 bg-emerald-700 text-white rounded text-xs font-bold hover:bg-emerald-800 cursor-pointer"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-emerald-950">
                  {state.mfa.farmOwnerName || 'Non défini'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOwnerInput(state.mfa.farmOwnerName || '');
                    setIsEditingOwner(true);
                  }}
                  className="text-emerald-700 underline text-[11px] font-semibold hover:text-emerald-900 cursor-pointer ml-1"
                >
                  Modifier
                </button>
              </div>
            )}
            {savedOwnerMsg && (
              <span className="text-emerald-700 font-bold text-[11px]">Enregistré !</span>
            )}
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-600 hidden sm:inline">{t.selectMonth}:</span>
            <select
              id="financial-month-selector"
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* PDF Facture Generator Button */}
          <button
            id="download-facture-pdf-btn"
            onClick={handleDownloadPdf}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-sm shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.generateFacture}</span>
          </button>
        </div>
      </div>

      {/* Monthly Financial Performance Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Gross Revenue */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            {t.grossRevenue}
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatTND(grossSalesRevenue, lang)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {monthlyOrders.length} orders billed
          </span>
        </div>

        {/* 2. Direct Cash Collected */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
            {t.paidSales}
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatTND(directCashCollected, lang)}
          </div>
          <span className="text-[11px] text-emerald-800/80 mt-1 block">
            Received upfront
          </span>
        </div>

        {/* 3. New Credit / Debts */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">
            {t.unpaidSales}
          </span>
          <div className="text-2xl font-black text-amber-800 mt-1">
            {formatTND(creditExtendedDebts, lang)}
          </div>
          <span className="text-[11px] text-amber-800/80 mt-1 block">
            Added to client ledgers
          </span>
        </div>

        {/* 4. Total Operating Expenses */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block">
            {t.totalFarmExpenses}
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            -{formatTND(totalFarmExpenses, lang)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {monthlyExpenses.length} expense vouchers
          </span>
        </div>

        {/* 5. Net Profit Margin */}
        <div className={`rounded-xl p-4 border shadow-xs ${
          netOperatingMargin >= 0 
            ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950' 
            : 'bg-rose-50/50 border-rose-300 text-rose-950'
        }`}>
          <span className="text-xs font-bold uppercase tracking-wider block">
            {t.netProfitLoss}
          </span>
          <div className={`text-2xl font-black mt-1 ${
            netOperatingMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {formatTND(netOperatingMargin, lang)}
          </div>
          <span className="text-[11px] font-semibold mt-1 block">
            Operating Net Margin
          </span>
        </div>
      </div>

      {/* Segregated Sub-Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 pt-3 overflow-x-auto gap-2">
          <div className="flex items-center gap-2">
            <button
              id="fin-tab-sales"
              onClick={() => setActiveSubTab('sales')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === 'sales'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Month Sales &amp; Invoices ({monthlyOrders.length})
            </button>

            <button
              id="fin-tab-expenses"
              onClick={() => setActiveSubTab('expenses')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === 'expenses'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Month Expenses ({monthlyExpenses.length})
            </button>

            <button
              id="fin-tab-payments"
              onClick={() => setActiveSubTab('payments')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === 'payments'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Debt Collections ({monthlyPayments.length})
            </button>

            <button
              id="fin-tab-preview"
              onClick={() => setActiveSubTab('preview')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === 'preview'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Facture Layout Preview
            </button>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 mb-2 shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>

        {/* Tab Content 1: Sales */}
        {activeSubTab === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">{t.date}</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Products</th>
                  <th className="p-3 text-right">{t.total}</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3 text-center">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{ord.orderNumber}</td>
                    <td className="p-3 text-slate-500">{formatDate(ord.date, lang)}</td>
                    <td className="p-3 font-semibold text-slate-800">{ord.clientName}</td>
                    <td className="p-3 text-slate-600 max-w-sm truncate">
                      {ord.items.map((i) => i.description).join('; ')}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900">
                      {formatTND(ord.totalAmountTND, lang)}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {formatTND(ord.paidAmountTND, lang)}
                    </td>
                    <td className="p-3 text-right font-bold text-amber-700">
                      {ord.debtAmountTND > 0 ? formatTND(ord.debtAmountTND, lang) : '-'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        ord.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {monthlyOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      No sales recorded for {selectedMonthKey}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content 2: Expenses */}
        {activeSubTab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">{t.date}</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Receipt / Ref #</th>
                  <th className="p-3 text-right">Amount (TND)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{formatDate(exp.date, lang)}</td>
                    <td className="p-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 capitalize">
                        {exp.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{exp.description}</td>
                    <td className="p-3 text-slate-500 font-mono">{exp.receiptNumber || '-'}</td>
                    <td className="p-3 text-right font-black text-rose-600">
                      -{formatTND(exp.amountTND, lang)}
                    </td>
                  </tr>
                ))}
                {monthlyExpenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No expenses logged for {selectedMonthKey}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content 3: Debt Payments */}
        {activeSubTab === 'payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">{t.date}</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">{t.paymentMethod}</th>
                  <th className="p-3">{t.notes}</th>
                  <th className="p-3 text-right">Amount Recovered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{formatDate(pay.date, lang)}</td>
                    <td className="p-3 font-bold text-slate-900">{pay.clientName}</td>
                    <td className="p-3 uppercase font-medium text-slate-600">{pay.paymentMethod}</td>
                    <td className="p-3 text-slate-500 italic">{pay.notes || '-'}</td>
                    <td className="p-3 text-right font-black text-emerald-700">
                      +{formatTND(pay.amountTND, lang)}
                    </td>
                  </tr>
                ))}
                {monthlyPayments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No debt settlements recorded for {selectedMonthKey}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content 4: Visual Facture Layout Preview */}
        {activeSubTab === 'preview' && (
          <div className="p-6 bg-slate-100 flex justify-center">
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg border border-slate-300 p-8 space-y-6 text-slate-900">
              {/* Facture Header */}
              <div className="flex items-start justify-between border-b-2 border-emerald-600 pb-4">
                <div>
                  <h3 className="text-xl font-black text-emerald-800 tracking-tight">
                    AGRYTND - {(farmInput || state.mfa.farmName || 'EXPLOITATION AGRICOLE').toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Système de Suivi d&apos;Inventaire &amp; Gestion Financière en Tunisie
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Exploitant / Propriétaire: <strong className="text-emerald-950">{ownerInput || state.mfa.farmOwnerName || 'Exploitant Agricole'}</strong> | {state.mfa.farmLocation || 'Tunisie'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Tél: {state.mfa.phone || '+216 -- --- ---'} | M.F: 1489201/A/M/000
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                    FACTURE &amp; BILAN MENSUEL
                  </span>
                  <div className="text-sm font-bold text-slate-800 mt-2">
                    Réf: FACT-TN-{selectedMonthKey}
                  </div>
                  <div className="text-xs text-slate-500">
                    Mois: {selectedMonthKey}
                  </div>
                </div>
              </div>

              {/* Facture Summary Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Ventes Totales:</span>
                  <strong className="text-base text-slate-900">{formatTND(grossSalesRevenue, 'fr')}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Charges d&apos;Exploitation:</span>
                  <strong className="text-base text-rose-600">-{formatTND(totalFarmExpenses, 'fr')}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Marge Nette du Mois:</span>
                  <strong className={`text-base ${netOperatingMargin >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {formatTND(netOperatingMargin, 'fr')}
                  </strong>
                </div>
              </div>

              {/* Legal Stamp & Signature Box */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
                <div className="p-3 border border-slate-200 rounded-lg">
                  <span className="font-bold block text-slate-700 mb-1">Production d&apos;Oeufs:</span>
                  <div>Total Ramassé: {totalEggsCollectedInMonth} unités</div>
                  <div>Encaissé Comptant: {formatTND(directCashCollected, 'fr')}</div>
                  <div>Créances en Cours: {formatTND(creditExtendedDebts, 'fr')}</div>
                </div>

                <div className="p-3 border border-slate-200 rounded-lg text-right flex flex-col justify-between">
                  <div>
                    <span className="font-bold block text-slate-700">Cachet &amp; Visa de l&apos;Exploitation</span>
                    <span className="text-[11px] text-slate-400 italic">Certifié conforme</span>
                  </div>
                  <div className="font-semibold text-slate-800 text-xs">
                    {ownerInput || state.mfa.farmOwnerName || 'Exploitant Agricole'}
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  id="preview-download-pdf-btn"
                  onClick={handleDownloadPdf}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official PDF Facture</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
