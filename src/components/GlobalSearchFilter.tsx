import React, { useState } from 'react';
import { Search, Filter, X, ArrowRight, Boxes, Users, Receipt, Calendar } from 'lucide-react';
import { FarmState, Language } from '../types';
import { translations } from '../i18n/translations';
import { formatTND, formatDate } from '../utils/formatters';

interface GlobalSearchFilterProps {
  state: FarmState;
  lang: Language;
  onSelectClient?: (clientId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const GlobalSearchFilter: React.FC<GlobalSearchFilterProps> = ({
  state,
  lang,
  onSelectClient,
  onNavigateTab,
}) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'sheep' | 'eggs' | 'clients' | 'financial'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const cleanTerm = searchTerm.trim().toLowerCase();

  // Search Results
  const matchingSheep = cleanTerm
    ? state.sheepHerd.filter(
        (s) =>
          s.tagNumber.toLowerCase().includes(cleanTerm) ||
          s.breed.toLowerCase().includes(cleanTerm) ||
          s.type.toLowerCase().includes(cleanTerm) ||
          (s.healthNotes && s.healthNotes.toLowerCase().includes(cleanTerm))
      )
    : [];

  const matchingClients = cleanTerm
    ? state.clients.filter(
        (c) =>
          c.name.toLowerCase().includes(cleanTerm) ||
          c.phone.toLowerCase().includes(cleanTerm) ||
          c.address.toLowerCase().includes(cleanTerm)
      )
    : [];

  const matchingOrders = cleanTerm
    ? state.orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(cleanTerm) ||
          o.clientName.toLowerCase().includes(cleanTerm) ||
          o.items.some((i) => i.description.toLowerCase().includes(cleanTerm))
      )
    : [];

  const matchingExpenses = cleanTerm
    ? state.expenses.filter(
        (e) =>
          e.description.toLowerCase().includes(cleanTerm) ||
          e.category.toLowerCase().includes(cleanTerm) ||
          (e.receiptNumber && e.receiptNumber.toLowerCase().includes(cleanTerm))
      )
    : [];

  const totalResults =
    (categoryFilter === 'all' || categoryFilter === 'sheep' ? matchingSheep.length : 0) +
    (categoryFilter === 'all' || categoryFilter === 'clients' ? matchingClients.length : 0) +
    (categoryFilter === 'all' || categoryFilter === 'financial' ? matchingOrders.length + matchingExpenses.length : 0);

  return (
    <div className="relative mb-6">
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="global-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value.trim().length > 0) setIsExpanded(true);
              }}
              onFocus={() => {
                if (searchTerm.trim().length > 0) setIsExpanded(true);
              }}
              placeholder={`${t.search} (e.g. Barbarine, TN-8041, Fatma, Zaghouan, Céréales)`}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setIsExpanded(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              id="filter-chip-all"
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.all}
            </button>
            <button
              id="filter-chip-sheep"
              type="button"
              onClick={() => setCategoryFilter('sheep')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === 'sheep'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.sheepHerdTitle}
            </button>
            <button
              id="filter-chip-clients"
              type="button"
              onClick={() => setCategoryFilter('clients')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === 'clients'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.navClients}
            </button>
            <button
              id="filter-chip-financial"
              type="button"
              onClick={() => setCategoryFilter('financial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === 'financial'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.navFinancial}
            </button>
          </div>
        </div>

        {/* Live Search Results Popup / Expanded Area */}
        {isExpanded && cleanTerm.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 max-h-96 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
              <span>{totalResults} results found for &ldquo;{cleanTerm}&rdquo;</span>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                Hide
              </button>
            </div>

            {totalResults === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">
                No matching records found. Try adjusting your search keyword or filters.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Matching Clients */}
                {(categoryFilter === 'all' || categoryFilter === 'clients') && matchingClients.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Clients ({matchingClients.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {matchingClients.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => {
                            onNavigateTab('clients');
                            if (onSelectClient) onSelectClient(client.id);
                            setIsExpanded(false);
                          }}
                          className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-sm text-slate-900">{client.name}</div>
                            <div className="text-xs text-slate-500">{client.phone} • {client.address}</div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              client.totalDebtTND > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {formatTND(client.totalDebtTND, lang, 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matching Sheep */}
                {(categoryFilter === 'all' || categoryFilter === 'sheep') && matchingSheep.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5 flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5" /> Sheep Livestock ({matchingSheep.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {matchingSheep.map((sheep) => (
                        <div
                          key={sheep.id}
                          onClick={() => {
                            onNavigateTab('inventory');
                            setIsExpanded(false);
                          }}
                          className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-sm text-slate-900">Tag: {sheep.tagNumber}</div>
                            <div className="text-xs text-slate-500">{sheep.breed} • {sheep.type} • {sheep.weightKg} kg</div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              sheep.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {sheep.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matching Orders */}
                {(categoryFilter === 'all' || categoryFilter === 'financial') && matchingOrders.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5" /> Orders ({matchingOrders.length})
                    </h4>
                    <div className="space-y-1.5">
                      {matchingOrders.map((ord) => (
                        <div
                          key={ord.id}
                          onClick={() => {
                            onNavigateTab('financial');
                            setIsExpanded(false);
                          }}
                          className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{ord.orderNumber}</span> • {ord.clientName} ({formatDate(ord.date, lang)})
                            <div className="text-slate-500">{ord.items.map((i) => i.description).join(', ')}</div>
                          </div>
                          <div className="text-right font-bold text-emerald-700">
                            {formatTND(ord.totalAmountTND, lang)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matching Expenses */}
                {(categoryFilter === 'all' || categoryFilter === 'financial') && matchingExpenses.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5" /> Farm Expenses ({matchingExpenses.length})
                    </h4>
                    <div className="space-y-1.5">
                      {matchingExpenses.map((exp) => (
                        <div
                          key={exp.id}
                          onClick={() => {
                            onNavigateTab('operations');
                            setIsExpanded(false);
                          }}
                          className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-900">{exp.description}</span> ({formatDate(exp.date, lang)})
                            <div className="text-slate-500 capitalize">{exp.category}</div>
                          </div>
                          <div className="text-right font-bold text-rose-600">
                            -{formatTND(exp.amountTND, lang)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
