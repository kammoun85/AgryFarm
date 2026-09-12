import React, { useState } from 'react';
import { 
  Egg, 
  ShoppingBag, 
  Plus, 
  Filter, 
  Tag, 
  Check, 
  AlertCircle, 
  Scale, 
  Activity, 
  Coins, 
  Layers,
  ChevronDown
} from 'lucide-react';
import { FarmState, Language, SheepRecord, SheepType, SheepStatus, ProduceType } from '../types';
import { translations } from '../i18n/translations';
import { formatTND, formatNumber, formatDate, getTodayString } from '../utils/formatters';

interface InventoryViewProps {
  state: FarmState;
  lang: Language;
  onOpenSellModal: (preselectedType?: ProduceType, preselectedSheepId?: string) => void;
  onOpenHarvestModal: () => void;
  onAddSheep: (newSheep: Omit<SheepRecord, 'id'>) => void;
  onUpdateEggStock: (newStock: number, pricePerEgg: number, pricePerTray: number) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  state,
  lang,
  onOpenSellModal,
  onOpenHarvestModal,
  onAddSheep,
  onUpdateEggStock,
}) => {
  const t = translations[lang];

  // Tab between Eggs and Sheep
  const [activeSubTab, setActiveSubTab] = useState<'eggs' | 'sheep'>('eggs');

  // Sheep filters
  const [sheepStatusFilter, setSheepStatusFilter] = useState<'all' | 'active' | 'sold'>('active');
  const [sheepBreedFilter, setSheepBreedFilter] = useState<string>('all');

  // Add Sheep Modal State
  const [isAddSheepOpen, setIsAddSheepOpen] = useState(false);
  const [tagNumber, setTagNumber] = useState('');
  const [breed, setBreed] = useState('Barbarine');
  const [sheepType, setSheepType] = useState<SheepType>('ram');
  const [weightKg, setWeightKg] = useState<number>(65);
  const [costTND, setCostTND] = useState<number>(750);
  const [healthNotes, setHealthNotes] = useState('');

  // Egg stock adjustment modal
  const [isAdjustEggsOpen, setIsAdjustEggsOpen] = useState(false);
  const [adjInStock, setAdjInStock] = useState(state.eggStock.inStock);
  const [adjPriceEgg, setAdjPriceEgg] = useState(state.eggStock.defaultPricePerEggTND);
  const [adjPriceTray, setAdjPriceTray] = useState(state.eggStock.defaultPricePerTrayTND);

  // Calculations for Eggs
  const totalEggsInStorage = state.eggStock.inStock;
  const totalEggTrays = Math.floor(totalEggsInStorage / 30);
  const eggsRemainder = totalEggsInStorage % 30;
  const totalEggsHarvested = state.eggHarvests.reduce((acc, h) => acc + h.quantity, 0);
  const totalEggsSold = state.orders.reduce((acc, o) => {
    return acc + o.items
      .filter((i) => i.produceType === 'eggs')
      .reduce((sum, it) => sum + it.quantity, 0);
  }, 0);

  // Calculations for Sheep
  const activeSheep = state.sheepHerd.filter((s) => s.status === 'active');
  const soldSheep = state.sheepHerd.filter((s) => s.status === 'sold');
  const totalAcquiredSheep = state.sheepHerd.length;

  const breeds = Array.from(new Set(state.sheepHerd.map((s) => s.breed)));

  const filteredSheep = state.sheepHerd.filter((s) => {
    if (sheepStatusFilter !== 'all' && s.status !== sheepStatusFilter) return false;
    if (sheepBreedFilter !== 'all' && s.breed !== sheepBreedFilter) return false;
    return true;
  });

  const handleCreateSheep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagNumber.trim()) return;

    onAddSheep({
      tagNumber: tagNumber.trim().toUpperCase(),
      breed,
      type: sheepType,
      status: 'active',
      acquisitionDate: getTodayString(),
      weightKg: Number(weightKg) || 50,
      acquisitionCostTND: Number(costTND) || 600,
      healthNotes: healthNotes.trim() || 'Good health upon acquisition',
    });

    setIsAddSheepOpen(false);
    setTagNumber('');
    setHealthNotes('');
  };

  const handleSaveEggSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEggStock(Number(adjInStock) || 0, Number(adjPriceEgg) || 0.38, Number(adjPriceTray) || 11.4);
    setIsAdjustEggsOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub Tab Switcher & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <button
            id="subtab-eggs-btn"
            onClick={() => setActiveSubTab('eggs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeSubTab === 'eggs'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Egg className="w-4 h-4" />
            <span>{t.eggStockTitle}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeSubTab === 'eggs' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {formatNumber(totalEggsInStorage)}
            </span>
          </button>

          <button
            id="subtab-sheep-btn"
            onClick={() => setActiveSubTab('sheep')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeSubTab === 'sheep'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span className="text-base">🐑</span>
            <span>{t.sheepHerdTitle}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeSubTab === 'sheep' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {activeSheep.length}
            </span>
          </button>
        </div>

        {/* Action Button: Core Sell Action */}
        <div className="flex items-center gap-2.5">
          <button
            id="inventory-sell-produce-btn"
            onClick={() => onOpenSellModal(activeSubTab === 'eggs' ? 'eggs' : 'sheep')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-sm shadow-emerald-600/20 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.sellProduce}</span>
          </button>
          {activeSubTab === 'eggs' ? (
            <button
              id="inventory-harvest-eggs-btn"
              onClick={onOpenHarvestModal}
              className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold rounded-xl text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>{t.recordHarvest}</span>
            </button>
          ) : (
            <button
              id="inventory-add-sheep-btn"
              onClick={() => setIsAddSheepOpen(true)}
              className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold rounded-xl text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>{t.addSheep}</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: EGGS INVENTORY */}
      {activeSubTab === 'eggs' && (
        <div className="space-y-6">
          {/* Egg Live Stock Trackers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  {t.kpiEggsInStock} (Live Storage)
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Egg className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {formatNumber(totalEggsInStorage)} <span className="text-sm font-normal text-slate-500">{t.eggUnits}</span>
              </div>
              <div className="mt-2 text-xs font-medium text-slate-600 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold">
                  {totalEggTrays} {t.trays30}
                </span>
                {eggsRemainder > 0 && <span>+ {eggsRemainder} loose eggs</span>}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Unit: ~{formatTND(state.eggStock.defaultPricePerEggTND, lang)}</span>
                <button
                  type="button"
                  id="adjust-egg-stock-btn"
                  onClick={() => {
                    setAdjInStock(state.eggStock.inStock);
                    setAdjPriceEgg(state.eggStock.defaultPricePerEggTND);
                    setAdjPriceTray(state.eggStock.defaultPricePerTrayTND);
                    setIsAdjustEggsOpen(true);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  Adjust Stock &amp; Prices
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {t.kpiEggsHarvested}
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {formatNumber(totalEggsHarvested)} <span className="text-sm font-normal text-slate-500">{t.eggUnits}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Recorded across {state.eggHarvests.length} collection logs in farm records.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {t.kpiEggsSold}
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {formatNumber(totalEggsSold)} <span className="text-sm font-normal text-slate-500">{t.eggUnits}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                ~{Math.round(totalEggsSold / 30)} trays delivered to grocers, bakeries &amp; clients.
              </p>
            </div>
          </div>

          {/* Recent Egg Collections table */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t.eggCollectionLog}
                </h3>
                <p className="text-xs text-slate-500">
                  Daily logs of collected eggs with damaged / broken breakdown.
                </p>
              </div>
              <button
                id="record-collection-quick-btn"
                onClick={onOpenHarvestModal}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.recordHarvest}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="pb-2.5">{t.date}</th>
                    <th className="pb-2.5">{t.quantity} ({t.eggUnits})</th>
                    <th className="pb-2.5">Trays (30)</th>
                    <th className="pb-2.5">{t.brokenEggs}</th>
                    <th className="pb-2.5">{t.netYield}</th>
                    <th className="pb-2.5">{t.notes}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.eggHarvests.map((h) => {
                    const trays = Math.floor(h.quantity / 30);
                    const loose = h.quantity % 30;
                    return (
                      <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 font-semibold text-slate-900">{formatDate(h.date, lang)}</td>
                        <td className="py-3 font-bold text-slate-900">{formatNumber(h.quantity)}</td>
                        <td className="py-3 text-slate-700">
                          {trays} trays {loose > 0 ? `+ ${loose}` : ''}
                        </td>
                        <td className="py-3 text-rose-600 font-medium">
                          {h.brokenCount > 0 ? `${h.brokenCount} eggs` : 'None'}
                        </td>
                        <td className="py-3 font-bold text-emerald-700">
                          {formatNumber(h.quantity - h.brokenCount)}
                        </td>
                        <td className="py-3 text-slate-500 max-w-sm truncate">{h.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SHEEP HERD (LIVESTOCK) */}
      {activeSubTab === 'sheep' && (
        <div className="space-y-6">
          {/* Sheep Live Trackers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Active Herd Count
                </span>
                <span className="text-lg">🐑</span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-700">
                {activeSheep.length}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {activeSheep.filter((s) => s.type === 'ram').length} Rams,{' '}
                {activeSheep.filter((s) => s.type === 'ewe').length} Ewes,{' '}
                {activeSheep.filter((s) => s.type === 'lamb').length} Lambs
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Total Acquired / Born
                </span>
                <Coins className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {totalAcquiredSheep}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Lifetime livestock register
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Total Sold
                </span>
                <ShoppingBag className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-3xl font-extrabold text-blue-700">
                {soldSheep.length}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Marketed to clients &amp; butchers
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-xl p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 mr-2">
                <Filter className="w-3.5 h-3.5" />
                <span>{t.filter}:</span>
              </div>
              <button
                type="button"
                onClick={() => setSheepStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  sheepStatusFilter === 'active'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.activeLivestock} ({activeSheep.length})
              </button>
              <button
                type="button"
                onClick={() => setSheepStatusFilter('sold')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  sheepStatusFilter === 'sold'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.soldLivestock} ({soldSheep.length})
              </button>
              <button
                type="button"
                onClick={() => setSheepStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  sheepStatusFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.all} ({state.sheepHerd.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{t.breed}:</span>
              <select
                value={sheepBreedFilter}
                onChange={(e) => setSheepBreedFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
              >
                <option value="all">All Breeds</option>
                {breeds.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sheep Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSheep.map((sheep) => (
              <div
                key={sheep.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-base font-extrabold text-slate-900 tracking-tight">
                          {sheep.tagNumber}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 mt-0.5 block">
                        {sheep.breed} • <span className="capitalize">{sheep.type}</span>
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      sheep.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sheep.status === 'sold'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {sheep.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-slate-400" /> Weight:
                      </span>
                      <span className="font-bold text-slate-900">{sheep.weightKg} kg</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Acquisition Date:</span>
                      <span className="font-medium text-slate-800">{formatDate(sheep.acquisitionDate, lang)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Acquisition Cost:</span>
                      <span className="font-semibold text-slate-900">{formatTND(sheep.acquisitionCostTND, lang)}</span>
                    </div>
                    {sheep.status === 'sold' && (
                      <div className="flex items-center justify-between text-blue-700 font-semibold pt-1 border-t border-slate-200">
                        <span>Sold Price:</span>
                        <span>{formatTND(sheep.salePriceTND || 0, lang)}</span>
                      </div>
                    )}
                  </div>

                  {sheep.healthNotes && (
                    <div className="mt-3 text-xs text-slate-600 flex items-start gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{sheep.healthNotes}</span>
                    </div>
                  )}
                </div>

                {sheep.status === 'active' && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      id={`sell-sheep-${sheep.id}`}
                      onClick={() => onOpenSellModal('sheep', sheep.id)}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Sell This Sheep</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Sheep */}
      {isAddSheepOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              <span>{t.addSheep}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter official ear tag ID, breed, type, and live weight for the farm register.
            </p>

            <form onSubmit={handleCreateSheep} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.tagNumber} *</label>
                  <input
                    id="new-sheep-tag"
                    type="text"
                    required
                    placeholder="e.g. TN-8055"
                    value={tagNumber}
                    onChange={(e) => setTagNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.breed}</label>
                  <select
                    id="new-sheep-breed"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Barbarine">Barbarine (Gras / Queue large)</option>
                    <option value="Noire de Thibar">Noire de Thibar</option>
                    <option value="Queue Fine de l’Ouest">Queue Fine de l’Ouest</option>
                    <option value="Bergui">Bergui</option>
                    <option value="Autre / Croisé">Autre / Croisé</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.sheepType}</label>
                  <select
                    id="new-sheep-type"
                    value={sheepType}
                    onChange={(e) => setSheepType(e.target.value as SheepType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="ram">{t.ram}</option>
                    <option value="ewe">{t.ewe}</option>
                    <option value="lamb">{t.lamb}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.weight}</label>
                  <input
                    id="new-sheep-weight"
                    type="number"
                    min="5"
                    max="160"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Acquisition (TND)</label>
                  <input
                    id="new-sheep-cost"
                    type="number"
                    step="5"
                    value={costTND}
                    onChange={(e) => setCostTND(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.healthStatus} &amp; Notes</label>
                <textarea
                  id="new-sheep-health"
                  rows={2}
                  placeholder="Vaccination, origin, condition..."
                  value={healthNotes}
                  onChange={(e) => setHealthNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSheepOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  id="submit-create-sheep-btn"
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

      {/* Modal: Adjust Egg Stock & Prices */}
      {isAdjustEggsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Adjust Egg Stock &amp; Pricing
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Calibrate physical inventory count in storage and default selling prices.
            </p>

            <form onSubmit={handleSaveEggSettings} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Eggs in Storage</label>
                <input
                  id="adj-egg-count"
                  type="number"
                  min="0"
                  value={adjInStock}
                  onChange={(e) => setAdjInStock(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  ~{Math.floor(adjInStock / 30)} full trays of 30
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price / Egg (TND)</label>
                  <input
                    id="adj-price-egg"
                    type="number"
                    step="0.010"
                    value={adjPriceEgg}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setAdjPriceEgg(v);
                      setAdjPriceTray(Number((v * 30).toFixed(3)));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price / Tray 30 (TND)</label>
                  <input
                    id="adj-price-tray"
                    type="number"
                    step="0.100"
                    value={adjPriceTray}
                    onChange={(e) => setAdjPriceTray(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustEggsOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  id="save-egg-settings-btn"
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
