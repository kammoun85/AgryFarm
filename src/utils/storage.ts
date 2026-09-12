import { FarmState, AutoBackupSnapshot } from '../types';
import { getTodayString } from './formatters';

const STORAGE_KEY = 'agrytnd_farm_state_v1';

export const initialFarmState: FarmState = {
  eggStock: {
    inStock: 1420, // total eggs in storage
    defaultPricePerEggTND: 0.380, // ~380 millimes per egg
    defaultPricePerTrayTND: 11.400, // 30 eggs plateau = ~11.400 TND
  },
  sheepHerd: [
    {
      id: 'shp-1',
      tagNumber: 'TN-8041',
      breed: 'Barbarine',
      type: 'ram',
      status: 'active',
      acquisitionDate: '2026-03-15',
      weightKg: 78,
      healthNotes: 'Excellent health, vaccinated for enterotoxemia',
      acquisitionCostTND: 950.000,
    },
    {
      id: 'shp-2',
      tagNumber: 'TN-8042',
      breed: 'Barbarine',
      type: 'ewe',
      status: 'active',
      acquisitionDate: '2026-03-15',
      weightKg: 62,
      healthNotes: 'Healthy, expecting lamb in winter',
      acquisitionCostTND: 720.000,
    },
    {
      id: 'shp-3',
      tagNumber: 'TN-8043',
      breed: 'Noire de Thibar',
      type: 'ewe',
      status: 'active',
      acquisitionDate: '2026-04-10',
      weightKg: 58,
      healthNotes: 'Routine deworming completed',
      acquisitionCostTND: 680.000,
    },
    {
      id: 'shp-4',
      tagNumber: 'TN-8044',
      breed: 'Noire de Thibar',
      type: 'lamb',
      status: 'active',
      acquisitionDate: '2026-05-20',
      weightKg: 34,
      healthNotes: 'Good growth rate, active feed intake',
      acquisitionCostTND: 380.000,
    },
    {
      id: 'shp-5',
      tagNumber: 'TN-8045',
      breed: 'Queue Fine de l’Ouest',
      type: 'ewe',
      status: 'active',
      acquisitionDate: '2026-06-02',
      weightKg: 55,
      healthNotes: 'Sound condition, foot rot prevention done',
      acquisitionCostTND: 640.000,
    },
    {
      id: 'shp-6',
      tagNumber: 'TN-8046',
      breed: 'Barbarine',
      type: 'ram',
      status: 'active',
      acquisitionDate: '2026-06-18',
      weightKg: 72,
      healthNotes: 'Prime breeding ram',
      acquisitionCostTND: 900.000,
    },
    {
      id: 'shp-7',
      tagNumber: 'TN-8047',
      breed: 'Bergui',
      type: 'lamb',
      status: 'active',
      acquisitionDate: '2026-07-05',
      weightKg: 31,
      healthNotes: 'Normal development',
      acquisitionCostTND: 350.000,
    },
    {
      id: 'shp-8',
      tagNumber: 'TN-8048',
      breed: 'Barbarine',
      type: 'ram',
      status: 'sold',
      acquisitionDate: '2026-02-10',
      weightKg: 85,
      healthNotes: 'Sold for festive celebration',
      acquisitionCostTND: 880.000,
      salePriceTND: 1250.000,
      soldDate: '2026-08-15',
      soldToClientId: 'cli-1',
    },
  ],
  eggHarvests: [
    {
      id: 'hrv-1',
      date: '2026-09-12',
      quantity: 240,
      brokenCount: 6,
      notes: 'Morning & evening coop collection, regular grade',
      unitCostTND: 0.120,
    },
    {
      id: 'hrv-2',
      date: '2026-09-11',
      quantity: 260,
      brokenCount: 4,
      notes: 'Optimal laying peak after fresh feed distribution',
      unitCostTND: 0.115,
    },
    {
      id: 'hrv-3',
      date: '2026-09-10',
      quantity: 235,
      brokenCount: 5,
      notes: 'Clean bedding added to nest boxes',
      unitCostTND: 0.120,
    },
    {
      id: 'hrv-4',
      date: '2026-09-09',
      quantity: 250,
      brokenCount: 3,
      notes: 'Standard daily harvest',
      unitCostTND: 0.118,
    },
    {
      id: 'hrv-5',
      date: '2026-09-08',
      quantity: 245,
      brokenCount: 7,
      notes: 'Collected 8 full trays',
      unitCostTND: 0.120,
    },
    {
      id: 'hrv-6',
      date: '2026-08-28',
      quantity: 255,
      brokenCount: 4,
      notes: 'Late August batch collection',
      unitCostTND: 0.120,
    },
    {
      id: 'hrv-7',
      date: '2026-08-25',
      quantity: 270,
      brokenCount: 5,
      notes: 'Pre-sorted for wholesale distribution',
      unitCostTND: 0.115,
    },
  ],
  clients: [
    {
      id: 'cli-1',
      name: 'Tarak Ben Amor (Épicerie Al Baraka)',
      phone: '+216 98 421 890',
      address: 'Avenue Habib Bourguiba, Zaghouan',
      notes: 'Buys 10 to 15 trays of eggs weekly. Reliable payer, pays bi-weekly.',
      totalDebtTND: 180.000,
      createdAt: '2026-01-10',
    },
    {
      id: 'cli-2',
      name: 'Moncef Gharbi (Boucherie El Medina)',
      phone: '+216 22 715 304',
      address: 'Route de Tunis km 4, Béja',
      notes: 'Regular sheep client. Purchases prime Barbarine rams.',
      totalDebtTND: 450.000,
      createdAt: '2026-02-15',
    },
    {
      id: 'cli-3',
      name: 'Fatma Trabelsi (Pâtisserie La Rose)',
      phone: '+216 55 902 118',
      address: 'Centre Ville, Nabeul',
      notes: 'High volume fresh egg buyer for bakery production. Always requires fresh grade.',
      totalDebtTND: 340.500,
      createdAt: '2026-03-01',
    },
    {
      id: 'cli-4',
      name: 'Ridha Bouazizi (Marché de Gros)',
      phone: '+216 97 334 509',
      address: 'Zone Industrielle, Manouba',
      notes: 'Wholesale distributor. Immediate cash or 7-day payment.',
      totalDebtTND: 0.000,
      createdAt: '2026-04-12',
    },
    {
      id: 'cli-5',
      name: 'Samir Khemiri',
      phone: '+216 20 188 942',
      address: 'El Fahs, Zaghouan',
      notes: 'Local neighbor and farmer. Buys sheep and eggs intermittently.',
      totalDebtTND: 95.000,
      createdAt: '2026-05-18',
    },
  ],
  orders: [
    {
      id: 'ord-101',
      orderNumber: 'CMD-2026-0901',
      clientId: 'cli-1',
      clientName: 'Tarak Ben Amor (Épicerie Al Baraka)',
      date: '2026-09-10',
      items: [
        {
          produceType: 'eggs',
          description: '10 Trays of 30 Eggs (300 eggs)',
          quantity: 300,
          unitPriceTND: 0.380,
          totalTND: 114.000,
        },
      ],
      totalAmountTND: 114.000,
      paidAmountTND: 50.000,
      debtAmountTND: 64.000,
      status: 'partial',
      notes: '50 TND paid cash, balance carried over to ledger',
    },
    {
      id: 'ord-102',
      orderNumber: 'CMD-2026-0902',
      clientId: 'cli-3',
      clientName: 'Fatma Trabelsi (Pâtisserie La Rose)',
      date: '2026-09-08',
      items: [
        {
          produceType: 'eggs',
          description: '20 Trays of 30 Eggs (600 eggs)',
          quantity: 600,
          unitPriceTND: 0.380,
          totalTND: 228.000,
        },
      ],
      totalAmountTND: 228.000,
      paidAmountTND: 100.000,
      debtAmountTND: 128.000,
      status: 'partial',
      notes: 'Delivered directly to bakery',
    },
    {
      id: 'ord-103',
      orderNumber: 'CMD-2026-0815',
      clientId: 'cli-1',
      clientName: 'Tarak Ben Amor (Épicerie Al Baraka)',
      date: '2026-08-15',
      items: [
        {
          produceType: 'sheep',
          description: 'Prime Barbarine Ram (Tag: TN-8048, 85kg)',
          quantity: 1,
          unitPriceTND: 1250.000,
          totalTND: 1250.000,
          sheepId: 'shp-8',
          sheepTag: 'TN-8048',
        },
      ],
      totalAmountTND: 1250.000,
      paidAmountTND: 1250.000,
      debtAmountTND: 0.000,
      status: 'paid',
      notes: 'Paid fully in cash upon live delivery',
    },
    {
      id: 'ord-104',
      orderNumber: 'CMD-2026-0820',
      clientId: 'cli-4',
      clientName: 'Ridha Bouazizi (Marché de Gros)',
      date: '2026-08-20',
      items: [
        {
          produceType: 'eggs',
          description: '25 Trays of 30 Eggs (750 eggs)',
          quantity: 750,
          unitPriceTND: 0.370,
          totalTND: 277.500,
        },
      ],
      totalAmountTND: 277.500,
      paidAmountTND: 277.500,
      debtAmountTND: 0.000,
      status: 'paid',
      notes: 'Wholesale lot, settled immediately',
    },
  ],
  expenses: [
    {
      id: 'exp-1',
      date: '2026-09-05',
      category: 'feed',
      amountTND: 420.000,
      description: 'Sacks of concentrated feed (Aliment composé ovin & pondeuse) - 10 sacs',
      receiptNumber: 'FACT-AGR-4091',
    },
    {
      id: 'exp-2',
      date: '2026-09-07',
      category: 'vet_medical',
      amountTND: 135.000,
      description: 'Dr. Belhadj veterinary visit, vitamins, and dewormer for young lambs',
      receiptNumber: 'VET-882',
    },
    {
      id: 'exp-3',
      date: '2026-09-02',
      category: 'packaging',
      amountTND: 65.000,
      description: 'Bundle of 200 molded fiber egg trays (30-egg size)',
      receiptNumber: 'EMB-501',
    },
    {
      id: 'exp-4',
      date: '2026-08-29',
      category: 'feed',
      amountTND: 380.000,
      description: 'Bales of lucerne hay & barley grain (Foin de luzerne et orge)',
      receiptNumber: 'REC-771',
    },
    {
      id: 'exp-5',
      date: '2026-08-31',
      category: 'labor',
      amountTND: 350.000,
      description: 'Monthly farm hand compensation & helper assistance',
      receiptNumber: 'MO-08-26',
    },
    {
      id: 'exp-6',
      date: '2026-08-10',
      category: 'utilities',
      amountTND: 84.500,
      description: 'STEG electricity invoice for ventilation & barn lighting',
      receiptNumber: 'STEG-3391',
    },
  ],
  payments: [
    {
      id: 'pay-1',
      clientId: 'cli-1',
      clientName: 'Tarak Ben Amor (Épicerie Al Baraka)',
      date: '2026-09-06',
      amountTND: 70.000,
      paymentMethod: 'cash',
      notes: 'Partial settlement against previous egg deliveries',
    },
    {
      id: 'pay-2',
      clientId: 'cli-2',
      clientName: 'Moncef Gharbi (Boucherie El Medina)',
      date: '2026-08-22',
      amountTND: 200.000,
      paymentMethod: 'check',
      notes: 'Check deposited for sheep down-payment',
    },
  ],
  backups: [
    {
      id: 'bsp-2026-09',
      date: '2026-09-01',
      monthKey: '2026-09',
      recordCount: 22,
      summary: 'Automated 1st of month snapshot: 8 Sheep, 1,420 Eggs in stock, 5 Clients',
      dataJson: '',
    },
  ],
  mfa: {
    enabled: true,
    pin: '1234',
    verifiedThisSession: true, // initial state unlocked for preview ease, can be locked with 1 click
    farmOwnerName: 'Hichem Mahmoudi',
    farmLocation: 'Zaghouan / Pont du Fahs, Tunisie',
    phone: '+216 72 680 120',
  },
};

/**
 * Clean empty farm state for fresh users (Clear historic: nothing in it)
 */
export const getEmptyFarmState = (ownerName: string = 'Mon Exploitation'): FarmState => ({
  eggStock: {
    inStock: 0,
    defaultPricePerEggTND: 0.400,
    defaultPricePerTrayTND: 12.000,
  },
  sheepHerd: [],
  eggHarvests: [],
  clients: [],
  orders: [],
  expenses: [],
  payments: [],
  backups: [],
  mfa: {
    enabled: false,
    pin: '1234',
    verifiedThisSession: true,
    farmOwnerName: ownerName,
    farmLocation: '',
    phone: '',
  },
  language: 'fr',
});

/**
 * Get storage key for a user
 */
export function getStorageKey(userId?: string | null): string {
  return userId ? `agrytnd_farm_state_${userId}` : STORAGE_KEY;
}

/**
 * Load farm state from local storage or initialize with clean empty state for user
 */
export function loadFarmState(userId?: string | null, userName?: string): FarmState {
  const key = getStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      // If user is specified, they get a completely clean state (clear historic, nothing in it)
      const freshState = userId ? getEmptyFarmState(userName || 'Mon Exploitation') : getEmptyFarmState('Mon Exploitation');
      saveFarmState(freshState, userId);
      return freshState;
    }
    const parsed = JSON.parse(raw);
    const baseState = getEmptyFarmState(userName || 'Mon Exploitation');
    return { ...baseState, ...parsed };
  } catch (err) {
    console.error('Failed to parse farm state, returning clean empty state', err);
    return getEmptyFarmState(userName || 'Mon Exploitation');
  }
}

/**
 * Persist farm state to local storage
 */
export function saveFarmState(state: FarmState, userId?: string | null): void {
  const key = getStorageKey(userId);
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save farm state', err);
  }
}

/**
 * Check if the 1st of the month has arrived and create an automatic backup if not yet created for this month
 */
export function checkAndCreateMonthlyAutoBackup(state: FarmState): FarmState {
  const today = getTodayString(); // e.g. "2026-09-12" or "2026-09-01"
  const currentMonthKey = today.substring(0, 7); // "2026-09"
  
  // Check if snapshot already exists for currentMonthKey
  const exists = state.backups.some((b) => b.monthKey === currentMonthKey);
  if (!exists) {
    const newSnapshot: AutoBackupSnapshot = {
      id: `bsp-${currentMonthKey}`,
      date: today,
      monthKey: currentMonthKey,
      recordCount: state.sheepHerd.length + state.eggHarvests.length + state.clients.length + state.orders.length,
      summary: `Auto-Backup: ${state.sheepHerd.filter(s => s.status === 'active').length} Active Sheep, ${state.eggStock.inStock} Eggs, ${state.clients.length} Clients`,
      dataJson: JSON.stringify(state),
    };
    
    const updated = {
      ...state,
      backups: [newSnapshot, ...state.backups],
    };
    saveFarmState(updated);
    return updated;
  }
  return state;
}

/**
 * Dedicated reset button requirement: "Clear All Except Clients"
 * Clears egg harvests, orders, expenses, payments, and resets stock, while preserving all clients and contact information!
 */
export function clearAllExceptClients(currentState: FarmState): FarmState {
  const clearedState: FarmState = {
    ...currentState,
    eggStock: {
      inStock: 0,
      defaultPricePerEggTND: currentState.eggStock.defaultPricePerEggTND,
      defaultPricePerTrayTND: currentState.eggStock.defaultPricePerTrayTND,
    },
    sheepHerd: [],
    eggHarvests: [],
    // Keep clients! (Reset debt balances to 0 or keep them? Keeping clients profiles with zeroed new transactions)
    clients: currentState.clients.map((c) => ({
      ...c,
      totalDebtTND: 0, // Debts cleared with transactions reset
    })),
    orders: [],
    expenses: [],
    payments: [],
    backups: [
      {
        id: `bsp-clear-${Date.now()}`,
        date: getTodayString(),
        monthKey: getTodayString().substring(0, 7),
        recordCount: currentState.clients.length,
        summary: `Reset: Cleared all inventory & finances, preserved ${currentState.clients.length} clients`,
        dataJson: '',
      },
      ...currentState.backups,
    ],
  };

  saveFarmState(clearedState);
  return clearedState;
}

/**
 * Reset state to default Tunisian sample farm data
 */
export function resetToInitialFarmState(): FarmState {
  const fresh: FarmState = JSON.parse(JSON.stringify(initialFarmState));
  saveFarmState(fresh);
  return fresh;
}
