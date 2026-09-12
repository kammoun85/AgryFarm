export type Language = 'en' | 'fr' | 'ar';

export type ProduceType = 'eggs' | 'sheep';

export interface EggHarvest {
  id: string;
  date: string; // YYYY-MM-DD
  quantity: number; // Number of eggs
  brokenCount: number;
  notes?: string;
  unitCostTND?: number;
}

export type SheepType = 'ewe' | 'ram' | 'lamb';
export type SheepStatus = 'active' | 'sold' | 'deceased' | 'medical';

export interface SheepRecord {
  id: string;
  tagNumber: string; // e.g., TN-7041
  breed: string; // Barbarine, Noire de Thibar, Queue Fine, Bergui
  type: SheepType;
  status: SheepStatus;
  acquisitionDate: string;
  weightKg: number;
  healthNotes?: string;
  acquisitionCostTND: number;
  salePriceTND?: number;
  soldDate?: string;
  soldToClientId?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  totalDebtTND: number;
  createdAt: string;
}

export interface OrderItem {
  produceType: ProduceType;
  description: string;
  quantity: number;
  unitPriceTND: number;
  totalTND: number;
  sheepId?: string; // If sheep sold
  sheepTag?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  items: OrderItem[];
  totalAmountTND: number;
  paidAmountTND: number;
  debtAmountTND: number;
  status: 'paid' | 'partial' | 'unpaid';
  notes?: string;
}

export type ExpenseCategory = 
  | 'feed' 
  | 'vet_medical' 
  | 'equipment_maintenance' 
  | 'labor' 
  | 'utilities' 
  | 'packaging' 
  | 'other';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amountTND: number;
  description: string;
  receiptNumber?: string;
}

export interface ClientPayment {
  id: string;
  clientId: string;
  clientName: string;
  orderId?: string;
  date: string;
  amountTND: number;
  paymentMethod: 'cash' | 'check' | 'bank_transfer';
  notes?: string;
}

export interface AutoBackupSnapshot {
  id: string;
  date: string;
  monthKey: string; // e.g. "2026-09"
  recordCount: number;
  summary: string;
  dataJson: string;
}

export interface MfaConfig {
  enabled: boolean;
  pin: string; // 4-digit PIN default '1234'
  verifiedThisSession: boolean;
  farmOwnerName: string;
  farmLocation: string;
  phone: string;
  farmName?: string;
}

export interface FarmState {
  eggStock: {
    inStock: number;
    defaultPricePerEggTND: number; // e.g. 0.350 TND
    defaultPricePerTrayTND: number; // e.g. 10.500 TND (30 eggs)
  };
  sheepHerd: SheepRecord[];
  eggHarvests: EggHarvest[];
  clients: Client[];
  orders: Order[];
  expenses: Expense[];
  payments: ClientPayment[];
  backups: AutoBackupSnapshot[];
  mfa: MfaConfig;
  language?: Language;
  farmId?: string;
}
