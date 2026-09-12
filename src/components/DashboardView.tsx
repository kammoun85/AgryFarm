import React from 'react';
import { 
  Egg, 
  CircleDollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ArrowUpRight, 
  ShoppingBag, 
  PlusCircle, 
  ChevronRight,
  Sparkles,
  Calendar,
  Wallet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { FarmState, Language } from '../types';
import { translations } from '../i18n/translations';
import { formatTND, formatNumber, formatDate, getMonthKey, getTodayString } from '../utils/formatters';

interface DashboardViewProps {
  state: FarmState;
  lang: Language;
  onNavigateTab: (tab: string) => void;
  onOpenSellModal: () => void;
  onOpenHarvestModal: () => void;
  onOpenExpenseModal: () => void;
  onSelectClient: (clientId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  lang,
  onNavigateTab,
  onOpenSellModal,
  onOpenHarvestModal,
  onOpenExpenseModal,
  onSelectClient,
}) => {
  const t = translations[lang];
  const currentMonthKey = getMonthKey(getTodayString()); // e.g. "2026-09"

  // 1. Total Eggs in Stock
  const eggsInStock = state.eggStock.inStock;
  const eggTrays = Math.floor(eggsInStock / 30);
  const eggRemainder = eggsInStock % 30;

  // 2. Total Eggs Harvested / Acquired
  const totalEggsHarvested = state.eggHarvests.reduce((acc, h) => acc + h.quantity, 0);

  // 3. Total Eggs Sold
  const totalEggsSold = state.orders.reduce((acc, o) => {
    const eggItems = o.items.filter((i) => i.produceType === 'eggs');
    return acc + eggItems.reduce((sum, item) => sum + item.quantity, 0);
  }, 0);

  // 4. Total Sheep Count (Active Herd)
  const activeSheepCount = state.sheepHerd.filter((s) => s.status === 'active').length;
  const soldSheepCount = state.sheepHerd.filter((s) => s.status === 'sold').length;

  // 5. Outstanding Client Debts in TND
  const totalDebtsTND = state.clients.reduce((acc, c) => acc + (c.totalDebtTND || 0), 0);

  // 6. Monthly Net Profit (for current month)
  const monthlyOrders = state.orders.filter((o) => o.date.startsWith(currentMonthKey));
  const monthlyExpenses = state.expenses.filter((e) => e.date.startsWith(currentMonthKey));
  const monthlyRevenue = monthlyOrders.reduce((acc, o) => acc + o.totalAmountTND, 0);
  const monthlyExpenseTotal = monthlyExpenses.reduce((acc, e) => acc + e.amountTND, 0);
  const monthlyNetProfit = monthlyRevenue - monthlyExpenseTotal;

  // Build 6-Month Income vs. Expense data for Recharts
  const buildSixMonthChartData = () => {
    const months: { [key: string]: { month: string; income: number; expenses: number } } = {};
    const d = new Date();
    
    // Generate past 6 months
    for (let i = 5; i >= 0; i--) {
      const past = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const year = past.getFullYear();
      const monthNum = String(past.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${monthNum}`;
      
      const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthLabel = `${monthNamesShort[past.getMonth()]} ${String(year).slice(-2)}`;
      
      months[key] = {
        month: monthLabel,
        income: 0,
        expenses: 0,
      };
    }

    // Populate income from orders
    state.orders.forEach((o) => {
      const mKey = o.date.substring(0, 7);
      if (months[mKey]) {
        months[mKey].income += o.totalAmountTND;
      }
    });

    // Populate expenses
    state.expenses.forEach((e) => {
      const mKey = e.date.substring(0, 7);
      if (months[mKey]) {
        months[mKey].expenses += e.amountTND;
      }
    });

    return Object.values(months);
  };

  const chartData = buildSixMonthChartData();

  // Urgent Debts: clients with highest debt
  const clientsWithDebt = [...state.clients]
    .filter((c) => c.totalDebtTND > 0)
    .sort((a, b) => b.totalDebtTND - a.totalDebtTND)
    .slice(0, 4);

  // Recent Orders
  const recentOrders = [...state.orders]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                {state.mfa.farmLocation}
              </span>
              <span className="text-xs text-emerald-200">
                {formatDate(getTodayString(), lang)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t.appName} - {t.appSubtitle}
            </h1>
            <p className="text-sm text-emerald-100 mt-1 max-w-xl">
              Livestock (Sheep) &amp; Produce (Eggs) inventory with client debts ledger &amp; financial tracking in Tunisian Dinar (TND).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="dash-sell-btn"
              onClick={onOpenSellModal}
              className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 font-bold rounded-xl text-sm shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>{t.sellProduce}</span>
            </button>
            <button
              id="dash-harvest-btn"
              onClick={onOpenHarvestModal}
              className="px-3.5 py-2.5 bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm border border-emerald-400/40 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.recordHarvest}</span>
            </button>
            <button
              id="dash-expense-btn"
              onClick={onOpenExpenseModal}
              className="px-3.5 py-2.5 bg-emerald-900/60 hover:bg-emerald-900/80 text-white font-semibold rounded-xl text-sm border border-emerald-400/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>{t.addExpense}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Core Monthly & Daily KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Eggs in Stock */}
        <div 
          id="kpi-eggs-stock"
          onClick={() => onNavigateTab('inventory')}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.kpiEggsInStock}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Egg className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatNumber(eggsInStock)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-emerald-700">{eggTrays}</span> {t.trays30}
            {eggRemainder > 0 && <span>+ {eggRemainder} {t.eggUnits}</span>}
          </div>
        </div>

        {/* 2. Total Eggs Harvested */}
        <div 
          id="kpi-eggs-harvested"
          onClick={() => onNavigateTab('operations')}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.kpiEggsHarvested}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatNumber(totalEggsHarvested)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {t.eggUnits} recorded in log
          </div>
        </div>

        {/* 3. Total Eggs Sold */}
        <div 
          id="kpi-eggs-sold"
          onClick={() => onNavigateTab('inventory')}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.kpiEggsSold}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatNumber(totalEggsSold)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            ~{Math.round(totalEggsSold / 30)} {t.trays30} delivered
          </div>
        </div>

        {/* 4. Active Sheep Herd */}
        <div 
          id="kpi-sheep-herd"
          onClick={() => onNavigateTab('inventory')}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.kpiSheepHerd}</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-sm font-bold">🐑</span>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatNumber(activeSheepCount)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            +{soldSheepCount} {t.soldLivestock.toLowerCase()}
          </div>
        </div>

        {/* 5. Outstanding Client Debts (TND) */}
        <div 
          id="kpi-client-debts"
          onClick={() => onNavigateTab('clients')}
          className="bg-white rounded-xl p-4 border border-amber-200 shadow-xs hover:border-amber-400 bg-amber-50/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.kpiTotalDebt}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-900">
            {formatTND(totalDebtsTND, lang, 0)}
          </div>
          <div className="text-xs text-amber-700 mt-1 font-medium">
            {clientsWithDebt.length} clients with balance
          </div>
        </div>

        {/* 6. Monthly Net Profit */}
        <div 
          id="kpi-monthly-profit"
          onClick={() => onNavigateTab('financial')}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.kpiMonthlyNetProfit}</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${
              monthlyNetProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold ${monthlyNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {formatTND(monthlyNetProfit, lang, 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>Rev: {formatTND(monthlyRevenue, lang, 0)}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: 6-Month Income vs Expense Bar Chart & Client Debts Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6-Month Chart using Recharts in TND */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>{t.sixMonthOverview}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Financial performance trends comparing gross revenue vs operational costs
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('financial')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>{t.details}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip 
                  formatter={(val: any) => [formatTND(Number(val), lang, 0), '']}
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderRadius: '8px', 
                    color: '#fff', 
                    fontSize: '12px',
                    border: 'none',
                    padding: '8px 12px'
                  }}
                  itemStyle={{ color: '#F8FAFC' }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
                />
                <Bar 
                  dataKey="income" 
                  name={t.income} 
                  fill="#059669" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                />
                <Bar 
                  dataKey="expenses" 
                  name={t.expenses} 
                  fill="#E11D48" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Client Debts Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{t.urgentDebts}</span>
              </h3>
              <button
                id="view-all-clients-btn"
                onClick={() => onNavigateTab('clients')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {t.viewAllClients}
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Unsettled balances requiring follow-up collection calls.
            </p>

            <div className="space-y-2.5">
              {clientsWithDebt.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs text-center">
                  {t.noDebt}
                </div>
              ) : (
                clientsWithDebt.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => {
                      onNavigateTab('clients');
                      onSelectClient(client.id);
                    }}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-semibold text-sm text-slate-900 truncate">
                        {client.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {client.phone}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        {formatTND(client.totalDebtTND, lang, 0)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>{t.totalOutstandingBanner}:</span>
              <span className="font-extrabold text-amber-800 text-sm">
                {formatTND(totalDebtsTND, lang, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions & Orders */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span>{t.recentTransactions}</span>
          </h3>
          <button
            onClick={() => onNavigateTab('financial')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>{t.details}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="pb-2.5">Order #</th>
                <th className="pb-2.5">{t.date}</th>
                <th className="pb-2.5">Client</th>
                <th className="pb-2.5">Products</th>
                <th className="pb-2.5 text-right">{t.total}</th>
                <th className="pb-2.5 text-right">Paid</th>
                <th className="pb-2.5 text-right">Debt</th>
                <th className="pb-2.5 text-center">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 font-bold text-slate-900">{ord.orderNumber}</td>
                  <td className="py-3 text-slate-500">{formatDate(ord.date, lang)}</td>
                  <td className="py-3 font-medium text-slate-800">{ord.clientName}</td>
                  <td className="py-3 text-slate-600 max-w-xs truncate">
                    {ord.items.map((i) => `${i.description}`).join('; ')}
                  </td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    {formatTND(ord.totalAmountTND, lang)}
                  </td>
                  <td className="py-3 text-right text-emerald-700 font-semibold">
                    {formatTND(ord.paidAmountTND, lang)}
                  </td>
                  <td className="py-3 text-right text-amber-700 font-semibold">
                    {ord.debtAmountTND > 0 ? formatTND(ord.debtAmountTND, lang) : '-'}
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      ord.status === 'paid' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : ord.status === 'partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {ord.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
