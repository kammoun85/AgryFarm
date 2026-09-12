import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FarmState } from '../types';
import { formatTND, getTodayString } from './formatters';

export function generateMonthlyFacturePdf(
  state: FarmState, 
  monthKey: string,
  customOwnerName?: string,
  customFarmName?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const ownerDisplayName = (customOwnerName || state.mfa.farmOwnerName || 'Exploitant Agricole').trim();
  const farmDisplayName = (customFarmName || state.mfa.farmName || 'Exploitation Agricole & Élevage').trim();

  const [year, month] = monthKey.split('-');
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const monthLabel = `${monthNames[parseInt(month, 10) - 1] || month} ${year}`;
  const today = getTodayString();

  // Filter orders and expenses for this specific month
  const monthlyOrders = state.orders.filter((o) => o.date.startsWith(monthKey));
  const monthlyExpenses = state.expenses.filter((e) => e.date.startsWith(monthKey));
  const monthlyHarvests = state.eggHarvests.filter((h) => h.date.startsWith(monthKey));

  const totalSales = monthlyOrders.reduce((acc, o) => acc + o.totalAmountTND, 0);
  const totalPaid = monthlyOrders.reduce((acc, o) => acc + o.paidAmountTND, 0);
  const totalDebtCreated = monthlyOrders.reduce((acc, o) => acc + o.debtAmountTND, 0);
  const totalExpenses = monthlyExpenses.reduce((acc, e) => acc + e.amountTND, 0);
  const totalEggsHarvested = monthlyHarvests.reduce((acc, h) => acc + h.quantity, 0);
  const netMargin = totalSales - totalExpenses;

  // Header Banner & Branding
  doc.setFillColor(16, 185, 129); // Emerald 600
  doc.rect(0, 0, 210, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`AGRYTND - ${farmDisplayName.toUpperCase()} (${ownerDisplayName.toUpperCase()})`, 14, 12);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('SYSTEME DE SUIVI D\'INVENTAIRE & GESTION FINANCIERE - TUNISIE', 14, 18);

  // Metadata block
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`FACTURE & BILAN D'EXPLOITATION: ${monthLabel.toUpperCase()}`, 14, 32);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Référence: FACT-TN-${monthKey}`, 14, 38);
  doc.text(`Date d'émission: ${today}`, 14, 43);
  doc.text(`Propriétaire / Exploitant: ${ownerDisplayName}`, 14, 48);
  doc.text(`Exploitation: ${farmDisplayName}`, 14, 53);
  doc.text(`Localisation: ${state.mfa.farmLocation || 'Tunisie'} | Contact: ${state.mfa.phone || '+216 -- --- ---'}`, 14, 58);

  // Summary KPI Mini Cards
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(120, 28, 76, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RECAPITULATIF DU MOIS (TND)', 124, 34);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Ventes Totales:', 124, 40);
  doc.text(`${totalSales.toFixed(3)} DT`, 190, 40, { align: 'right' });

  doc.text('Charges Exploitation:', 124, 46);
  doc.text(`-${totalExpenses.toFixed(3)} DT`, 190, 46, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(netMargin >= 0 ? 5 : 220, netMargin >= 0 ? 150 : 38, netMargin >= 0 ? 105 : 38);
  doc.text('Marge Nette:', 124, 54);
  doc.text(`${netMargin.toFixed(3)} DT`, 190, 54, { align: 'right' });

  let currentY = 66;

  // Table 1: Monthly Sales / Orders
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. VENTES DE PRODUITS (OEUFS & OVINS)', 14, currentY);

  const salesTableRows = monthlyOrders.map((ord) => [
    ord.orderNumber,
    ord.date,
    ord.clientName,
    ord.items.map((i) => `${i.description} (x${i.quantity})`).join(', '),
    `${ord.totalAmountTND.toFixed(3)} DT`,
    `${ord.paidAmountTND.toFixed(3)} DT`,
    `${ord.debtAmountTND.toFixed(3)} DT`,
    ord.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['N° Commande', 'Date', 'Client', 'Désignation', 'Total', 'Encaissé', 'Créance', 'Statut']],
    body: salesTableRows.length
      ? salesTableRows
      : [['-', '-', 'Aucune vente enregistrée pour ce mois', '-', '0.000 DT', '0.000 DT', '0.000 DT', '-']],
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
  });

  // Get final Y after first table
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Table 2: Farm Operating Expenses
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. DEPENSES D\'EXPLOITATION (ALIMENTS, SOINS, CHARGES)', 14, currentY);

  const expenseTableRows = monthlyExpenses.map((exp) => [
    exp.date,
    exp.category.toUpperCase(),
    exp.description,
    exp.receiptNumber || '-',
    `${exp.amountTND.toFixed(3)} DT`,
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Date', 'Catégorie', 'Description / Objet', 'N° Justificatif', 'Montant']],
    body: expenseTableRows.length
      ? expenseTableRows
      : [['-', '-', 'Aucune charge enregistrée pour ce mois', '-', '0.000 DT']],
    theme: 'striped',
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  // Stamp & Verification Box
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, 85, 30, 1, 1);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('STATISTIQUES DE PRODUCTION DU MOIS', 17, currentY + 6);
  doc.setTextColor(15, 23, 42);
  doc.text(`• Total Oeufs Ramassés: ${totalEggsHarvested} unités`, 17, currentY + 12);
  doc.text(`• Ventes Encaissées Comptant: ${totalPaid.toFixed(3)} DT`, 17, currentY + 18);
  doc.text(`• Nouvelles Créances Clients: ${totalDebtCreated.toFixed(3)} DT`, 17, currentY + 24);

  // Legal Signature & Stamp
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(110, currentY, 86, 30, 1, 1);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('VISA & CACHET DE L\'EXPLOITATION AGRICOLE', 114, currentY + 6);
  doc.text('Certifié sincère et conforme aux écritures comptables', 114, currentY + 11);
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`Signature: ${ownerDisplayName}`, 114, currentY + 25);

  // Footer note
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Document officiel généré par AgryTND - Système de Gestion Agricole & Financière en Tunisie.', 105, 287, { align: 'center' });

  // Filename named after the farm owner and month
  const safeOwner = ownerDisplayName.replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'Exploitant';
  doc.save(`Facture_${safeOwner}_${monthKey}.pdf`);
}
