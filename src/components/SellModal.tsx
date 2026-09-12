import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, User, Egg, Plus, AlertTriangle, Check, DollarSign } from 'lucide-react';
import { FarmState, Language, ProduceType, Client, Order, OrderItem } from '../types';
import { translations } from '../i18n/translations';
import { formatTND, formatNumber, getTodayString } from '../utils/formatters';

interface SellModalProps {
  state: FarmState;
  lang: Language;
  isOpen: boolean;
  preselectedClientId?: string;
  preselectedType?: ProduceType;
  preselectedSheepId?: string;
  onClose: () => void;
  onSubmitSale: (order: Order, paymentReceived: number, newDebt: number) => void;
  onQuickAddClient: (client: Omit<Client, 'id' | 'totalDebtTND' | 'createdAt'>) => string;
}

export const SellModal: React.FC<SellModalProps> = ({
  state,
  lang,
  isOpen,
  preselectedClientId,
  preselectedType = 'eggs',
  preselectedSheepId,
  onClose,
  onSubmitSale,
  onQuickAddClient,
}) => {
  const t = translations[lang];

  const [selectedClientId, setSelectedClientId] = useState<string>(preselectedClientId || '');
  const [produceType, setProduceType] = useState<ProduceType>(preselectedType);
  
  // Egg options
  const [eggUnitMode, setEggUnitMode] = useState<'trays' | 'eggs'>('trays');
  const [eggQuantity, setEggQuantity] = useState<number>(5); // e.g. 5 trays = 150 eggs
  const [eggUnitPriceTND, setEggUnitPriceTND] = useState<number>(state.eggStock.defaultPricePerTrayTND);

  // Sheep options
  const [selectedSheepId, setSelectedSheepId] = useState<string>(preselectedSheepId || '');
  const [sheepSalePriceTND, setSheepSalePriceTND] = useState<number>(1100);

  // Payment Breakdown
  const [paidNowAmount, setPaidNowAmount] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Inline Quick Add Client modal toggle
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientPhone, setQuickClientPhone] = useState('');
  const [quickClientAddress, setQuickClientAddress] = useState('');

  const activeSheep = state.sheepHerd.filter((s) => s.status === 'active');

  // Reset or initialize when modal opens or props change
  useEffect(() => {
    if (preselectedClientId) setSelectedClientId(preselectedClientId);
    if (preselectedType) setProduceType(preselectedType);
    if (preselectedSheepId) {
      setSelectedSheepId(preselectedSheepId);
      const targetSheep = state.sheepHerd.find((s) => s.id === preselectedSheepId);
      if (targetSheep) {
        setSheepSalePriceTND(targetSheep.acquisitionCostTND * 1.3); // suggested margin
      }
    } else if (activeSheep.length > 0 && !selectedSheepId) {
      setSelectedSheepId(activeSheep[0].id);
      setSheepSalePriceTND(activeSheep[0].acquisitionCostTND * 1.3);
    }
  }, [isOpen, preselectedClientId, preselectedType, preselectedSheepId]);

  // Adjust unit price default when egg unit mode changes
  useEffect(() => {
    if (eggUnitMode === 'trays') {
      setEggUnitPriceTND(state.eggStock.defaultPricePerTrayTND);
    } else {
      setEggUnitPriceTND(state.eggStock.defaultPricePerEggTND);
    }
  }, [eggUnitMode, state.eggStock]);

  if (!isOpen) return null;

  // Calculate actual egg units requested
  const totalEggsNeeded = eggUnitMode === 'trays' ? eggQuantity * 30 : eggQuantity;
  const isEggStockSufficient = totalEggsNeeded <= state.eggStock.inStock;

  // Total amount calculation
  let computedTotal = 0;
  if (produceType === 'eggs') {
    computedTotal = eggQuantity * eggUnitPriceTND;
  } else {
    computedTotal = Number(sheepSalePriceTND) || 0;
  }

  const remainingDebt = Math.max(0, computedTotal - paidNowAmount);

  const handleCreateQuickClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClientName.trim()) return;
    const newId = onQuickAddClient({
      name: quickClientName.trim(),
      phone: quickClientPhone.trim() || '+216 ',
      address: quickClientAddress.trim() || 'Tunisia',
    });
    setSelectedClientId(newId);
    setShowQuickAddClient(false);
    setQuickClientName('');
    setQuickClientPhone('');
    setQuickClientAddress('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedClientId) {
      setFormError('Veuillez sélectionner ou créer un client.');
      return;
    }

    const client = state.clients.find((c) => c.id === selectedClientId);
    if (!client) {
      setFormError('Client introuvable.');
      return;
    }

    if (produceType === 'eggs' && !isEggStockSufficient) {
      setFormError(t.insufficientStock);
      return;
    }

    const orderNumber = `CMD-${getTodayString().replace(/-/g, '').slice(2)}-${Math.floor(100 + Math.random() * 900)}`;

    const items: OrderItem[] = [];
    if (produceType === 'eggs') {
      items.push({
        produceType: 'eggs',
        description: `${eggQuantity} ${eggUnitMode === 'trays' ? 'Trays (30 eggs)' : 'Individual Eggs'} (${totalEggsNeeded} eggs total)`,
        quantity: totalEggsNeeded,
        unitPriceTND: eggUnitPriceTND,
        totalTND: computedTotal,
      });
    } else {
      const sheep = state.sheepHerd.find((s) => s.id === selectedSheepId);
      items.push({
        produceType: 'sheep',
        description: `Sheep (${sheep?.breed || 'Sheep'}, Tag: ${sheep?.tagNumber || 'Unknown'}, ${sheep?.weightKg || 0}kg)`,
        quantity: 1,
        unitPriceTND: computedTotal,
        totalTND: computedTotal,
        sheepId: selectedSheepId,
        sheepTag: sheep?.tagNumber,
      });
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      clientId: client.id,
      clientName: client.name,
      date: getTodayString(),
      items,
      totalAmountTND: computedTotal,
      paidAmountTND: paidNowAmount,
      debtAmountTND: remainingDebt,
      status: remainingDebt === 0 ? 'paid' : paidNowAmount > 0 ? 'partial' : 'unpaid',
      notes: saleNotes.trim() || undefined,
    };

    onSubmitSale(newOrder, paidNowAmount, remainingDebt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {t.sellModalTitle}
              </h3>
              <p className="text-xs text-slate-300">
                Decrements inventory &amp; updates client debt ledger in TND
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Client Selector with inline Add Client */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.selectClient} *</span>
              </label>
              <button
                type="button"
                id="quick-add-client-toggle-btn"
                onClick={() => setShowQuickAddClient(!showQuickAddClient)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Client</span>
              </button>
            </div>

            {showQuickAddClient ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 mb-3">
                <span className="text-xs font-bold text-emerald-900 block">Quick Register Client:</span>
                <input
                  type="text"
                  placeholder="Client / Company Name"
                  required
                  value={quickClientName}
                  onChange={(e) => setQuickClientName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Phone (e.g. +216 98 ...)"
                    value={quickClientPhone}
                    onChange={(e) => setQuickClientPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Address / Town"
                    value={quickClientAddress}
                    onChange={(e) => setQuickClientAddress(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddClient(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateQuickClient}
                    className="px-3 py-1 bg-emerald-700 text-white rounded-md text-xs font-bold"
                  >
                    Add &amp; Select
                  </button>
                </div>
              </div>
            ) : (
              <select
                id="sale-client-select"
                required
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-slate-50 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose Client --</option>
                {state.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Debt: {formatTND(c.totalDebtTND, lang, 0)}) - {c.phone}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Produce Selection (Eggs or Sheep) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t.produceToSell}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="select-produce-eggs"
                onClick={() => setProduceType('eggs')}
                className={`py-2.5 px-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  produceType === 'eggs'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Egg className="w-4 h-4 text-amber-500" />
                <span>{t.eggUnits} ({formatNumber(state.eggStock.inStock)} in stock)</span>
              </button>

              <button
                type="button"
                id="select-produce-sheep"
                onClick={() => setProduceType('sheep')}
                className={`py-2.5 px-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  produceType === 'sheep'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>🐑</span>
                <span>{t.sheepHerdTitle} ({activeSheep.length} active)</span>
              </button>
            </div>
          </div>

          {/* Configuration for Eggs */}
          {produceType === 'eggs' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Selling Unit</label>
                  <select
                    id="egg-unit-mode"
                    value={eggUnitMode}
                    onChange={(e) => setEggUnitMode(e.target.value as 'trays' | 'eggs')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="trays">{t.trays30}</option>
                    <option value="eggs">{t.eggUnits} (Individual)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t.quantity}</label>
                  <input
                    id="egg-sale-quantity"
                    type="number"
                    min="1"
                    value={eggQuantity}
                    onChange={(e) => setEggQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t.unitPrice} (TND)</label>
                  <input
                    id="egg-sale-unitprice"
                    type="number"
                    step="0.010"
                    value={eggUnitPriceTND}
                    onChange={(e) => setEggUnitPriceTND(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
                  />
                </div>
              </div>

              {/* Stock availability check */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">
                  Total eggs requested: <strong className="text-slate-800">{totalEggsNeeded}</strong>
                </span>
                {!isEggStockSufficient ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Exceeds storage ({state.eggStock.inStock} left)
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">
                    Stock available ({state.eggStock.inStock - totalEggsNeeded} remaining after sale)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Configuration for Sheep */}
          {produceType === 'sheep' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              {activeSheep.length === 0 ? (
                <div className="text-rose-600 text-xs font-semibold py-2">
                  No active sheep currently in herd to sell.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Select Sheep (Ear Tag)</label>
                    <select
                      id="select-sheep-to-sell"
                      value={selectedSheepId}
                      onChange={(e) => {
                        const sid = e.target.value;
                        setSelectedSheepId(sid);
                        const sh = state.sheepHerd.find((s) => s.id === sid);
                        if (sh) setSheepSalePriceTND(Number((sh.acquisitionCostTND * 1.3).toFixed(3)));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                    >
                      {activeSheep.map((s) => (
                        <option key={s.id} value={s.id}>
                          Tag: {s.tagNumber} - {s.breed} ({s.type}, {s.weightKg}kg)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Agreed Sale Price (TND)</label>
                    <input
                      id="sheep-sale-price"
                      type="number"
                      step="5"
                      value={sheepSalePriceTND}
                      onChange={(e) => setSheepSalePriceTND(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Financial Settlement & Debt Breakdown Card */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between text-slate-900 pb-2 border-b border-emerald-200">
              <span className="text-sm font-bold">Total Order Value:</span>
              <span className="text-lg font-black text-emerald-800">
                {formatTND(computedTotal, lang)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.amountPaidNow}
                </label>
                <div className="relative">
                  <input
                    id="sale-paid-amount"
                    type="number"
                    step="1"
                    min="0"
                    max={computedTotal}
                    value={paidNowAmount}
                    onChange={(e) => setPaidNowAmount(Math.min(computedTotal, Math.max(0, Number(e.target.value))))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setPaidNowAmount(computedTotal)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    Pay Full
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.remainingDebt}
                </label>
                <div className={`px-3 py-2 rounded-lg text-sm font-black border ${
                  remainingDebt > 0 
                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}>
                  {formatTND(remainingDebt, lang)}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.notes}</label>
              <input
                id="sale-notes-input"
                type="text"
                placeholder="Optional notes or delivery details..."
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              id="confirm-sale-submit-btn"
              type="submit"
              disabled={!selectedClientId || (produceType === 'eggs' && !isEggStockSufficient)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Sale &amp; Update Ledger</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
