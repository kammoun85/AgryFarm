import React, { useState } from 'react';
import { 
  Users, 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Plus, 
  ShoppingBag, 
  CreditCard, 
  ChevronRight, 
  History, 
  X, 
  Check, 
  Receipt,
  FileText,
  Search
} from 'lucide-react';
import { FarmState, Language, Client, Order, ClientPayment } from '../types';
import { translations } from '../i18n/translations';
import { formatTND, formatDate, getTodayString } from '../utils/formatters';

interface ClientsViewProps {
  state: FarmState;
  lang: Language;
  selectedClientId?: string;
  onSelectClient: (clientId?: string) => void;
  onOpenNewOrderForClient: (clientId: string) => void;
  onRecordPayment: (payment: Omit<ClientPayment, 'id'>) => void;
  onAddClient: (client: Omit<Client, 'id' | 'totalDebtTND' | 'createdAt'>) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  state,
  lang,
  selectedClientId,
  onSelectClient,
  onOpenNewOrderForClient,
  onRecordPayment,
  onAddClient,
}) => {
  const t = translations[lang];

  const [searchTerm, setSearchTerm] = useState('');
  const [debtFilter, setDebtFilter] = useState<'all' | 'withDebt' | 'cleared'>('all');

  // Add Client Modal
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');

  // Record Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentClientId, setPaymentClientId] = useState<string>('');
  const [paymentAmountTND, setPaymentAmountTND] = useState<number>(50);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'check' | 'bank_transfer'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Total Outstanding Debt across all clients in TND
  const totalDebtsAcrossAllClients = state.clients.reduce((acc, c) => acc + (c.totalDebtTND || 0), 0);

  // Filter clients
  const filteredClients = state.clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (debtFilter === 'withDebt' && c.totalDebtTND <= 0) return false;
    if (debtFilter === 'cleared' && c.totalDebtTND > 0) return false;
    return true;
  });

  const selectedClient = state.clients.find((c) => c.id === selectedClientId);

  // Selected client's orders & payments history
  const clientOrders = selectedClient
    ? state.orders.filter((o) => o.clientId === selectedClient.id)
    : [];
  const clientPayments = selectedClient
    ? state.payments.filter((p) => p.clientId === selectedClient.id)
    : [];

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    onAddClient({
      name: newClientName.trim(),
      phone: newClientPhone.trim() || '+216 ',
      address: newClientAddress.trim() || 'Tunisia',
      notes: newClientNotes.trim() || undefined,
    });

    setIsAddClientOpen(false);
    setNewClientName('');
    setNewClientPhone('');
    setNewClientAddress('');
    setNewClientNotes('');
  };

  const handleOpenPayment = (clientId: string) => {
    const cl = state.clients.find((c) => c.id === clientId);
    if (!cl) return;
    setPaymentClientId(clientId);
    setPaymentAmountTND(cl.totalDebtTND > 0 ? cl.totalDebtTND : 50);
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const cl = state.clients.find((c) => c.id === paymentClientId);
    if (!cl || paymentAmountTND <= 0) return;

    onRecordPayment({
      clientId: cl.id,
      clientName: cl.name,
      date: getTodayString(),
      amountTND: paymentAmountTND,
      paymentMethod,
      notes: paymentNotes.trim() || undefined,
    });

    setIsPaymentModalOpen(false);
    setPaymentNotes('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Summary Banner Showing Total Outstanding Debts across all clients in TND */}
      <div 
        id="outstanding-debts-banner"
        className="rounded-2xl p-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-100">
              {t.totalOutstandingBanner}
            </span>
            <div className="text-3xl sm:text-4xl font-black tracking-tight">
              {formatTND(totalDebtsAcrossAllClients, lang)}
            </div>
            <p className="text-xs text-amber-100 mt-1">
              Live customer debt balance carried over from orders and credit deliveries.
            </p>
          </div>
        </div>

        <button
          id="add-new-client-main-btn"
          onClick={() => setIsAddClientOpen(true)}
          className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addNewClient}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="clients-search-input"
            type="text"
            placeholder={`${t.search} client name, phone, town...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDebtFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              debtFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Clients ({state.clients.length})
          </button>
          <button
            type="button"
            onClick={() => setDebtFilter('withDebt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              debtFilter === 'withDebt'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            With Debts ({state.clients.filter((c) => c.totalDebtTND > 0).length})
          </button>
          <button
            type="button"
            onClick={() => setDebtFilter('cleared')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              debtFilter === 'cleared'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Zero Debt ({state.clients.filter((c) => c.totalDebtTND <= 0).length})
          </button>
        </div>
      </div>

      {/* Main Layout: Client Cards Grid or Profile Detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const hasDebt = client.totalDebtTND > 0;
          return (
            <div
              key={client.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      {client.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <a 
                        href={`tel:${client.phone}`}
                        className="hover:underline font-medium text-slate-700"
                      >
                        {client.phone}
                      </a>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-black shrink-0 ${
                    hasDebt 
                      ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {hasDebt ? formatTND(client.totalDebtTND, lang, 0) : t.noDebt}
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{client.address}</span>
                </div>

                {client.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2 mt-2">
                    {client.notes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* Action inside Client Profile: New Order */}
                  <button
                    type="button"
                    id={`client-new-order-${client.id}`}
                    onClick={() => onOpenNewOrderForClient(client.id)}
                    className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{t.newOrder}</span>
                  </button>

                  {/* Record Payment */}
                  <button
                    type="button"
                    id={`client-pay-${client.id}`}
                    onClick={() => handleOpenPayment(client.id)}
                    className="py-2 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-xl text-xs border border-amber-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                    <span>{t.recordPayment}</span>
                  </button>
                </div>

                <button
                  type="button"
                  id={`view-client-profile-${client.id}`}
                  onClick={() => onSelectClient(client.id)}
                  className="w-full py-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>View Full Profile &amp; History</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAILED CLIENT PROFILE MODAL / DRAWER */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {t.clientProfile}
                </span>
                <h3 className="text-xl font-bold tracking-tight mt-0.5">
                  {selectedClient.name}
                </h3>
              </div>
              <button
                onClick={() => onSelectClient(undefined)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info Cards */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block">{t.phone}</span>
                  <a href={`tel:${selectedClient.phone}`} className="text-sm font-bold text-slate-900 hover:underline">
                    {selectedClient.phone}
                  </a>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block">{t.address}</span>
                  <span className="text-sm font-semibold text-slate-900">{selectedClient.address}</span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  selectedClient.totalDebtTND > 0 
                    ? 'bg-amber-50 border-amber-200 text-amber-900' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <span className="text-xs font-bold block">{t.totalDebtBalance}</span>
                  <span className="text-base font-black">
                    {formatTND(selectedClient.totalDebtTND, lang)}
                  </span>
                </div>
              </div>

              {/* Quick Profile Actions: New Order & Record Payment */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="profile-action-new-order"
                  onClick={() => {
                    const cid = selectedClient.id;
                    onSelectClient(undefined);
                    onOpenNewOrderForClient(cid);
                  }}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t.newOrder} (from Inventory)</span>
                </button>

                <button
                  type="button"
                  id="profile-action-record-pay"
                  onClick={() => handleOpenPayment(selectedClient.id)}
                  className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{t.recordPayment}</span>
                </button>
              </div>

              {/* Transaction History (Orders + Payments) */}
              <div className="pt-2">
                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>{t.paymentHistory}</span>
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="p-2.5">{t.date}</th>
                        <th className="p-2.5">Type / Ref</th>
                        <th className="p-2.5">{t.details}</th>
                        <th className="p-2.5 text-right">{t.total}</th>
                        <th className="p-2.5 text-right">Balance Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Interleaved or combined logs */}
                      {clientOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50">
                          <td className="p-2.5 text-slate-500">{formatDate(ord.date, lang)}</td>
                          <td className="p-2.5 font-bold text-slate-900">{ord.orderNumber}</td>
                          <td className="p-2.5 text-slate-600 max-w-xs truncate">
                            {ord.items.map((i) => i.description).join(', ')}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            {formatTND(ord.totalAmountTND, lang)}
                          </td>
                          <td className="p-2.5 text-right text-amber-700 font-bold">
                            +{formatTND(ord.debtAmountTND, lang)}
                          </td>
                        </tr>
                      ))}

                      {clientPayments.map((pay) => (
                        <tr key={pay.id} className="bg-emerald-50/30 hover:bg-emerald-50/60">
                          <td className="p-2.5 text-slate-500">{formatDate(pay.date, lang)}</td>
                          <td className="p-2.5 font-bold text-emerald-700">Payment ({pay.paymentMethod})</td>
                          <td className="p-2.5 text-slate-600 italic">{pay.notes || 'Settlement'}</td>
                          <td className="p-2.5 text-right font-semibold text-emerald-800">
                            {formatTND(pay.amountTND, lang)}
                          </td>
                          <td className="p-2.5 text-right text-emerald-700 font-black">
                            -{formatTND(pay.amountTND, lang)}
                          </td>
                        </tr>
                      ))}

                      {clientOrders.length === 0 && clientPayments.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">
                            No past transactions found for this client.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Client */}
      {isAddClientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>{t.addNewClient}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Create a new customer profile for produce sales and credit tracking.
            </p>

            <form onSubmit={handleCreateClient} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name / Store Name *</label>
                <input
                  id="add-client-name"
                  type="text"
                  required
                  placeholder="e.g. Samir Khemiri or Épicerie Al Baraka"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.phone} *</label>
                <input
                  id="add-client-phone"
                  type="text"
                  placeholder="+216 98 123 456"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.address}</label>
                <input
                  id="add-client-address"
                  type="text"
                  placeholder="e.g. Zaghouan, Béja, Tunis..."
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.notes}</label>
                <textarea
                  id="add-client-notes"
                  rows={2}
                  placeholder="Commercial terms, payment habits..."
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddClientOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  id="submit-add-client-btn"
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

      {/* Modal: Record Payment (Debt Settlement) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>{t.recordPayment}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Reduce outstanding debt by recording a client payment receipt.
            </p>

            <form onSubmit={handleSubmitPayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.selectClient}</label>
                <select
                  id="pay-client-select"
                  value={paymentClientId}
                  onChange={(e) => {
                    setPaymentClientId(e.target.value);
                    const cl = state.clients.find((c) => c.id === e.target.value);
                    if (cl) setPaymentAmountTND(cl.totalDebtTND > 0 ? cl.totalDebtTND : 50);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium"
                >
                  {state.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Debt: {formatTND(c.totalDebtTND, lang, 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.paymentAmount} *</label>
                  <input
                    id="pay-amount-input"
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={paymentAmountTND}
                    onChange={(e) => setPaymentAmountTND(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.paymentMethod}</label>
                  <select
                    id="pay-method-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="cash">{t.cash}</option>
                    <option value="check">{t.check}</option>
                    <option value="bank_transfer">{t.bankTransfer}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.notes}</label>
                <input
                  id="pay-notes-input"
                  type="text"
                  placeholder="Check #, receipt note or settlement context..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  id="submit-payment-receipt-btn"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Confirm &amp; Deduct Debt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
