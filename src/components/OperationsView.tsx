import React, { useState, useEffect } from 'react';
import { 
  Egg, 
  Wallet, 
  Activity, 
  Plus, 
  Layers, 
  Calendar, 
  Filter, 
  FileText, 
  Check, 
  AlertCircle,
  Tag,
  Stethoscope
} from 'lucide-react';
import { FarmState, Language, EggHarvest, Expense, ExpenseCategory, SheepRecord } from '../types';
import { translations } from '../i18n/translations';
import { formatTND, formatNumber, formatDate, getTodayString } from '../utils/formatters';

interface OperationsViewProps {
  state: FarmState;
  lang: Language;
  onAddHarvest: (harvest: Omit<EggHarvest, 'id'>) => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onUpdateSheepHealth: (sheepId: string, updatedHealth: string, weightKg?: number) => void;
  initialModal?: 'harvest' | 'expense' | 'sheepHealth' | null;
  onClearInitialModal?: () => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  state,
  lang,
  onAddHarvest,
  onAddExpense,
  onUpdateSheepHealth,
  initialModal,
  onClearInitialModal,
}) => {
  const t = translations[lang];

  // Active Tab: eggs | sheepHealth | expenses
  const [activeTab, setActiveTab] = useState<'eggs' | 'sheepHealth' | 'expenses'>('eggs');

  // Egg Harvest Modal
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
  const [harvestDate, setHarvestDate] = useState(getTodayString());
  const [harvestQuantity, setHarvestQuantity] = useState<number>(240);
  const [brokenCount, setBrokenCount] = useState<number>(5);
  const [harvestNotes, setHarvestNotes] = useState('');
  const [unitCostTND, setUnitCostTND] = useState<number>(0.120);

  // Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDate, setExpenseDate] = useState(getTodayString());
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('feed');
  const [expenseAmountTND, setExpenseAmountTND] = useState<number>(150);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');

  // Sheep Vet/Health Modal
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [selectedSheepId, setSelectedSheepId] = useState(state.sheepHerd[0]?.id || '');
  const [newHealthNote, setNewHealthNote] = useState('');
  const [newWeight, setNewWeight] = useState<number>(60);

  useEffect(() => {
    if (initialModal === 'harvest') {
      setActiveTab('eggs');
      setIsHarvestModalOpen(true);
      onClearInitialModal?.();
    } else if (initialModal === 'expense') {
      setActiveTab('expenses');
      setIsExpenseModalOpen(true);
      onClearInitialModal?.();
    } else if (initialModal === 'sheepHealth') {
      setActiveTab('sheepHealth');
      setIsHealthModalOpen(true);
      onClearInitialModal?.();
    }
  }, [initialModal, onClearInitialModal]);

  // Category summary for expenses
  const totalExpensesTND = state.expenses.reduce((acc, e) => acc + e.amountTND, 0);

  const handleCreateHarvest = (e: React.FormEvent) => {
    e.preventDefault();
    if (harvestQuantity <= 0) return;

    onAddHarvest({
      date: harvestDate,
      quantity: Number(harvestQuantity),
      brokenCount: Number(brokenCount) || 0,
      notes: harvestNotes.trim() || undefined,
      unitCostTND: Number(unitCostTND) || 0.120,
    });

    setIsHarvestModalOpen(false);
    setHarvestNotes('');
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmountTND <= 0 || !expenseDescription.trim()) return;

    onAddExpense({
      date: expenseDate,
      category: expenseCategory,
      amountTND: Number(expenseAmountTND),
      description: expenseDescription.trim(),
      receiptNumber: receiptNumber.trim() || undefined,
    });

    setIsExpenseModalOpen(false);
    setExpenseDescription('');
    setReceiptNumber('');
  };

  const handleSaveHealth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSheepId) return;

    onUpdateSheepHealth(selectedSheepId, newHealthNote, newWeight);
    setIsHealthModalOpen(false);
    setNewHealthNote('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.operationsTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log daily egg harvests, track livestock veterinary health, and record day-to-day farm expenses.
          </p>
        </div>

        {/* Tab Navigation Chips */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            id="op-tab-eggs"
            onClick={() => setActiveTab('eggs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'eggs'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Egg className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.eggCollectionLog}</span>
          </button>

          <button
            id="op-tab-sheep"
            onClick={() => setActiveTab('sheepHealth')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sheepHealth'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
            <span>{t.sheepHealthLog}</span>
          </button>

          <button
            id="op-tab-expenses"
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-rose-600" />
            <span>{t.farmExpensesLog}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DAILY EGG HARVEST & COLLECTION */}
      {activeTab === 'eggs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">
              Egg Yields &amp; Breakage History
            </span>
            <button
              id="open-harvest-modal-btn"
              onClick={() => setIsHarvestModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.recordHarvest}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">{t.date}</th>
                    <th className="p-3">Total Collected</th>
                    <th className="p-3">Trays (30s)</th>
                    <th className="p-3 text-rose-600">{t.brokenEggs}</th>
                    <th className="p-3 font-bold text-emerald-800">{t.netYield}</th>
                    <th className="p-3">Est. Unit Cost</th>
                    <th className="p-3">{t.notes}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.eggHarvests.map((h) => {
                    const trays = Math.floor(h.quantity / 30);
                    const loose = h.quantity % 30;
                    const net = h.quantity - h.brokenCount;
                    return (
                      <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{formatDate(h.date, lang)}</td>
                        <td className="p-3 font-bold text-slate-800">{formatNumber(h.quantity)}</td>
                        <td className="p-3 text-slate-600">
                          {trays} trays {loose > 0 ? `+ ${loose}` : ''}
                        </td>
                        <td className="p-3 text-rose-600 font-semibold">
                          {h.brokenCount > 0 ? `${h.brokenCount} broken` : '0'}
                        </td>
                        <td className="p-3 font-extrabold text-emerald-700">
                          {formatNumber(net)}
                        </td>
                        <td className="p-3 text-slate-500">
                          {formatTND(h.unitCostTND || 0.12, lang)}
                        </td>
                        <td className="p-3 text-slate-500 max-w-sm truncate">{h.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHEEP HEALTH & VETERINARY */}
      {activeTab === 'sheepHealth' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">
              Livestock Medical, Deworming &amp; Weight Tracker
            </span>
            <button
              id="open-health-modal-btn"
              onClick={() => {
                if (state.sheepHerd.length > 0) {
                  setSelectedSheepId(state.sheepHerd[0].id);
                  setNewWeight(state.sheepHerd[0].weightKg);
                  setNewHealthNote(state.sheepHerd[0].healthNotes || '');
                }
                setIsHealthModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Health &amp; Weighing</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.sheepHerd.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-extrabold text-slate-900">
                      Tag: {s.tagNumber}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {s.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 mb-3">
                    <div><strong>Breed:</strong> {s.breed} ({s.type})</div>
                    <div><strong>Current Weight:</strong> {s.weightKg} kg</div>
                    <div><strong>Acquired:</strong> {formatDate(s.acquisitionDate, lang)}</div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700">
                    <span className="font-bold block text-slate-800 mb-0.5 flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                      Health &amp; Vet Record:
                    </span>
                    <p>{s.healthNotes || 'Regular maintenance, no pending medical issues.'}</p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSheepId(s.id);
                      setNewWeight(s.weightKg);
                      setNewHealthNote(s.healthNotes || '');
                      setIsHealthModalOpen(true);
                    }}
                    className="w-full py-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Update Condition
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DAILY FARM EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-800">
                Operating Expenses Ledger
              </span>
              <span className="text-xs text-slate-500 block">
                Total Expenses: <strong className="text-rose-600">{formatTND(totalExpensesTND, lang)}</strong>
              </span>
            </div>
            <button
              id="open-expense-modal-btn"
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addExpense}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">{t.date}</th>
                    <th className="p-3">{t.expenseCategory}</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">{t.receiptNo}</th>
                    <th className="p-3 text-right">{t.total} (TND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-semibold text-slate-800">{formatDate(exp.date, lang)}</td>
                      <td className="p-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 capitalize">
                          {exp.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{exp.description}</td>
                      <td className="p-3 text-slate-500 font-mono">{exp.receiptNumber || '-'}</td>
                      <td className="p-3 text-right font-bold text-rose-600">
                        -{formatTND(exp.amountTND, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record Egg Harvest */}
      {isHarvestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Egg className="w-5 h-5 text-amber-500" />
              <span>{t.recordHarvest}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter total daily eggs collected from the coops.
            </p>

            <form onSubmit={handleCreateHarvest} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.date}</label>
                <input
                  type="date"
                  required
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Eggs Collected *</label>
                  <input
                    id="harvest-qty-input"
                    type="number"
                    min="1"
                    required
                    value={harvestQuantity}
                    onChange={(e) => setHarvestQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    ~{(harvestQuantity / 30).toFixed(1)} trays
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.brokenEggs}</label>
                  <input
                    id="harvest-broken-input"
                    type="number"
                    min="0"
                    value={brokenCount}
                    onChange={(e) => setBrokenCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">
                    Net: {Math.max(0, harvestQuantity - brokenCount)} eggs
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.notes}</label>
                <input
                  type="text"
                  placeholder="e.g. Clean coop, morning harvest..."
                  value={harvestNotes}
                  onChange={(e) => setHarvestNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHarvestModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  id="submit-harvest-btn"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Expense */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-rose-600" />
              <span>{t.addExpense}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Record feeds, medications, equipment, or utility bills for cost accounting.
            </p>

            <form onSubmit={handleCreateExpense} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.date}</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (TND) *</label>
                  <input
                    id="expense-amount-input"
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={expenseAmountTND}
                    onChange={(e) => setExpenseAmountTND(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.expenseCategory}</label>
                <select
                  id="expense-cat-select"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="feed">{t.catFeed}</option>
                  <option value="vet_medical">{t.catVet}</option>
                  <option value="equipment_maintenance">{t.catEquipment}</option>
                  <option value="labor">{t.catLabor}</option>
                  <option value="utilities">{t.catUtilities}</option>
                  <option value="packaging">{t.catPackaging}</option>
                  <option value="other">{t.catOther}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <input
                  id="expense-desc-input"
                  type="text"
                  required
                  placeholder="e.g. 5 sacs d'aliments concentrés..."
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.receiptNo}</label>
                <input
                  type="text"
                  placeholder="Optional receipt or invoice number"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  id="submit-expense-btn"
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Sheep Health */}
      {isHealthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              <span>Update Livestock Condition</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Update veterinary notes, medication, and current live body weight.
            </p>

            <form onSubmit={handleSaveHealth} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Sheep</label>
                <select
                  value={selectedSheepId}
                  onChange={(e) => {
                    const sid = e.target.value;
                    setSelectedSheepId(sid);
                    const sh = state.sheepHerd.find((s) => s.id === sid);
                    if (sh) {
                      setNewWeight(sh.weightKg);
                      setNewHealthNote(sh.healthNotes || '');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {state.sheepHerd.map((s) => (
                    <option key={s.id} value={s.id}>
                      Tag: {s.tagNumber} - {s.breed} ({s.weightKg}kg)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Weight (kg)</label>
                <input
                  type="number"
                  min="5"
                  max="160"
                  value={newWeight}
                  onChange={(e) => setNewWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Veterinary &amp; Health Details</label>
                <textarea
                  rows={3}
                  placeholder="Vaccines given, vitamins, general condition..."
                  value={newHealthNote}
                  onChange={(e) => setNewHealthNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHealthModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
