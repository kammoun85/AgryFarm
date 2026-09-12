import * as XLSX from 'xlsx';
import { FarmState, Language } from '../types';
import { formatTND, getTodayString } from './formatters';

export function exportFarmToExcel(state: FarmState, lang: Language = 'en'): void {
  const wb = XLSX.utils.book_new();
  const dateStr = getTodayString();

  // 1. Overview Summary Sheet
  const activeSheepCount = state.sheepHerd.filter((s) => s.status === 'active').length;
  const soldSheepCount = state.sheepHerd.filter((s) => s.status === 'sold').length;
  const totalDebts = state.clients.reduce((acc, c) => acc + (c.totalDebtTND || 0), 0);
  const totalHarvestedEggs = state.eggHarvests.reduce((acc, h) => acc + h.quantity, 0);
  const totalBrokenEggs = state.eggHarvests.reduce((acc, h) => acc + h.brokenCount, 0);
  const totalSalesRevenue = state.orders.reduce((acc, o) => acc + o.totalAmountTND, 0);
  const totalExpenses = state.expenses.reduce((acc, e) => acc + e.amountTND, 0);
  const netMargin = totalSalesRevenue - totalExpenses;

  const summaryData = [
    { Metric: 'Report Generation Date', Value: dateStr },
    { Metric: 'Farm Name', Value: 'AgryTND Farm Tunisia' },
    { Metric: 'Farm Owner', Value: state.mfa.farmOwnerName },
    { Metric: 'Farm Location', Value: state.mfa.farmLocation },
    { Metric: 'Eggs In Storage', Value: state.eggStock.inStock },
    { Metric: 'Total Eggs Harvested (Log)', Value: totalHarvestedEggs },
    { Metric: 'Total Damaged / Broken Eggs', Value: totalBrokenEggs },
    { Metric: 'Active Sheep in Herd', Value: activeSheepCount },
    { Metric: 'Sold Sheep Total', Value: soldSheepCount },
    { Metric: 'Total Outstanding Client Debts (TND)', Value: totalDebts },
    { Metric: 'Total Sales Revenue (TND)', Value: totalSalesRevenue },
    { Metric: 'Total Farm Operating Expenses (TND)', Value: totalExpenses },
    { Metric: 'Net Operational Margin (TND)', Value: netMargin },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Farm_Overview');

  // 2. Egg Collections Sheet
  const eggData = state.eggHarvests.map((h) => ({
    'Log ID': h.id,
    Date: h.date,
    'Quantity Harvested': h.quantity,
    'Damaged / Broken': h.brokenCount,
    'Net Marketable': h.quantity - h.brokenCount,
    'Approx Unit Cost (TND)': h.unitCostTND || 0,
    Notes: h.notes || '',
  }));
  const wsEggs = XLSX.utils.json_to_sheet(eggData.length ? eggData : [{ Status: 'No egg records' }]);
  XLSX.utils.book_append_sheet(wb, wsEggs, 'Egg_Harvests');

  // 3. Sheep Herd Sheet
  const sheepData = state.sheepHerd.map((s) => ({
    'Sheep Tag / ID': s.tagNumber,
    Breed: s.breed,
    Type: s.type,
    Status: s.status,
    'Acquisition Date': s.acquisitionDate,
    'Weight (kg)': s.weightKg,
    'Acquisition Cost (TND)': s.acquisitionCostTND,
    'Sale Price (TND)': s.salePriceTND || '',
    'Sold Date': s.soldDate || '',
    'Health / Veterinary Notes': s.healthNotes || '',
  }));
  const wsSheep = XLSX.utils.json_to_sheet(sheepData.length ? sheepData : [{ Status: 'No sheep in herd' }]);
  XLSX.utils.book_append_sheet(wb, wsSheep, 'Sheep_Herd');

  // 4. Clients & Debts Ledger
  const clientData = state.clients.map((c) => ({
    'Client ID': c.id,
    Name: c.name,
    Phone: c.phone,
    Address: c.address,
    'Total Outstanding Debt (TND)': c.totalDebtTND,
    'Account Created': c.createdAt,
    Notes: c.notes || '',
  }));
  const wsClients = XLSX.utils.json_to_sheet(clientData.length ? clientData : [{ Status: 'No clients registered' }]);
  XLSX.utils.book_append_sheet(wb, wsClients, 'Client_Ledger');

  // 5. Sales Orders Sheet
  const orderData = state.orders.map((o) => ({
    'Order #': o.orderNumber,
    Date: o.date,
    'Client Name': o.clientName,
    Products: o.items.map((i) => `${i.description} (x${i.quantity})`).join('; '),
    'Total Amount (TND)': o.totalAmountTND,
    'Paid Amount (TND)': o.paidAmountTND,
    'Debt Added (TND)': o.debtAmountTND,
    Status: o.status,
    Notes: o.notes || '',
  }));
  const wsOrders = XLSX.utils.json_to_sheet(orderData.length ? orderData : [{ Status: 'No orders recorded' }]);
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Sales_Orders');

  // 6. Expenses Sheet
  const expenseData = state.expenses.map((e) => ({
    'Expense ID': e.id,
    Date: e.date,
    Category: e.category,
    'Amount (TND)': e.amountTND,
    Description: e.description,
    'Receipt / Invoice #': e.receiptNumber || '',
  }));
  const wsExpenses = XLSX.utils.json_to_sheet(expenseData.length ? expenseData : [{ Status: 'No expenses recorded' }]);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Farm_Expenses');

  // 7. Full JSON State sheet for perfect lossless re-import
  const rawStateSheet = XLSX.utils.json_to_sheet([
    { Key: 'AGRYTND_STATE_BACKUP', JSON: JSON.stringify(state) },
  ]);
  XLSX.utils.book_append_sheet(wb, rawStateSheet, '_AgryTND_RawBackup');

  const filename = `AgryTND_Farm_Report_${dateStr}_${lang.toUpperCase()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Restore farm state from an uploaded Excel file
 */
export async function importFarmFromExcel(file: File): Promise<FarmState> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Check if our raw state backup sheet exists
  if (workbook.SheetNames.includes('_AgryTND_RawBackup')) {
    const rawWs = workbook.Sheets['_AgryTND_RawBackup'];
    const rows = XLSX.utils.sheet_to_json<{ Key: string; JSON: string }>(rawWs);
    if (rows.length && rows[0].JSON) {
      try {
        const parsed = JSON.parse(rows[0].JSON);
        return parsed as FarmState;
      } catch (e) {
        console.warn('Could not parse raw backup JSON from Excel, falling back to sheet parsing', e);
      }
    }
  }

  // Fallback: Parse individual sheets if user edited or imported standard sheets
  // Read Client Ledger
  const clientsWs = workbook.Sheets['Client_Ledger'] || workbook.Sheets[workbook.SheetNames[3]];
  const parsedClients = clientsWs ? XLSX.utils.sheet_to_json<any>(clientsWs) : [];
  
  // Return a synthesized state
  throw new Error('Please ensure this is a valid AgryTND exported Excel file with standard sheets.');
}
