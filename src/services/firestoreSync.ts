import { 
  doc, 
  collection, 
  setDoc, 
  deleteDoc, 
  getDoc,
  getDocs, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { FarmState, SheepRecord, EggHarvest, Client, Order, Expense, ClientPayment } from '../types';
import { getEmptyFarmState } from '../utils/storage';

/**
 * Returns the collection path for a specific farm
 */
export function getFarmDocRef(farmId: string) {
  return doc(db, 'farms', farmId);
}

/**
 * Fetch farm state from Firestore.
 * If user has no record in Firestore (new user), returns a clear historic with nothing in it!
 */
export async function fetchFarmStateFromFirestore(farmId: string, defaultOwnerName?: string): Promise<FarmState> {
  const farmRef = getFarmDocRef(farmId);
  const path = `farms/${farmId}`;

  try {
    const snap = await getDoc(farmRef);
    if (!snap.exists()) {
      // New user! Every new user must have a clear historic: nothing in it!
      const freshEmptyState = getEmptyFarmState(defaultOwnerName || 'Mon Exploitation');
      // Initialize doc in Firestore
      await setDoc(farmRef, {
        eggStock: freshEmptyState.eggStock,
        mfa: freshEmptyState.mfa,
        language: freshEmptyState.language || 'fr',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return freshEmptyState;
    }

    const farmData = snap.data() || {};

    // Fetch subcollections concurrently
    const [
      sheepSnap,
      harvestsSnap,
      clientsSnap,
      ordersSnap,
      expensesSnap,
      paymentsSnap
    ] = await Promise.all([
      getDocs(collection(db, `farms/${farmId}/sheep`)),
      getDocs(collection(db, `farms/${farmId}/harvests`)),
      getDocs(collection(db, `farms/${farmId}/clients`)),
      getDocs(collection(db, `farms/${farmId}/orders`)),
      getDocs(collection(db, `farms/${farmId}/expenses`)),
      getDocs(collection(db, `farms/${farmId}/payments`)),
    ]);

    const sheepHerd: SheepRecord[] = sheepSnap.docs.map(d => d.data() as SheepRecord);
    const eggHarvests: EggHarvest[] = harvestsSnap.docs.map(d => d.data() as EggHarvest);
    const clients: Client[] = clientsSnap.docs.map(d => d.data() as Client);
    const orders: Order[] = ordersSnap.docs.map(d => d.data() as Order);
    const expenses: Expense[] = expensesSnap.docs.map(d => d.data() as Expense);
    const payments: ClientPayment[] = paymentsSnap.docs.map(d => d.data() as ClientPayment);

    const fullState: FarmState = {
      eggStock: farmData.eggStock || {
        inStock: 0,
        totalHarvested: 0,
        defaultPricePerEggTND: 0.400,
        defaultPricePerTrayTND: 12.000,
      },
      sheepHerd,
      eggHarvests,
      clients,
      orders,
      expenses,
      payments,
      backups: [],
      mfa: farmData.mfa || {
        enabled: false,
        pin: '1234',
        verifiedThisSession: true,
        farmOwnerName: defaultOwnerName || 'Mon Exploitation',
        farmLocation: '',
        phone: '',
      },
      language: farmData.language || 'fr',
      farmId,
    };

    return fullState;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return getEmptyFarmState(defaultOwnerName || 'Mon Exploitation');
  }
}

/**
 * Sync entire local state into Firestore for a user's farm
 */
export async function syncStateToFirestore(farmId: string, state: FarmState): Promise<void> {
  const farmRef = getFarmDocRef(farmId);
  const path = `farms/${farmId}`;

  try {
    // 1. Save general config & egg stock
    await setDoc(farmRef, {
      eggStock: state.eggStock,
      mfa: state.mfa,
      language: state.language || 'fr',
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // 2. Batch write records
    const batch = writeBatch(db);

    // Sheep
    state.sheepHerd.forEach((sheep) => {
      const sRef = doc(db, `farms/${farmId}/sheep`, sheep.id);
      batch.set(sRef, sheep, { merge: true });
    });

    // Egg harvests
    state.eggHarvests.forEach((harvest) => {
      const hRef = doc(db, `farms/${farmId}/harvests`, harvest.id);
      batch.set(hRef, harvest, { merge: true });
    });

    // Clients
    state.clients.forEach((client) => {
      const cRef = doc(db, `farms/${farmId}/clients`, client.id);
      batch.set(cRef, client, { merge: true });
    });

    // Orders
    state.orders.forEach((order) => {
      const oRef = doc(db, `farms/${farmId}/orders`, order.id);
      batch.set(oRef, order, { merge: true });
    });

    // Expenses
    state.expenses.forEach((expense) => {
      const eRef = doc(db, `farms/${farmId}/expenses`, expense.id);
      batch.set(eRef, expense, { merge: true });
    });

    // Payments
    state.payments.forEach((payment) => {
      const pRef = doc(db, `farms/${farmId}/payments`, payment.id);
      batch.set(pRef, payment, { merge: true });
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Single item persistence helpers for instant real-time sync
 */
export async function saveSheepToFirestore(farmId: string, sheep: SheepRecord): Promise<void> {
  const path = `farms/${farmId}/sheep/${sheep.id}`;
  try {
    await setDoc(doc(db, `farms/${farmId}/sheep`, sheep.id), sheep, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSheepFromFirestore(farmId: string, sheepId: string): Promise<void> {
  const path = `farms/${farmId}/sheep/${sheepId}`;
  try {
    await deleteDoc(doc(db, `farms/${farmId}/sheep`, sheepId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveHarvestToFirestore(farmId: string, harvest: EggHarvest): Promise<void> {
  const path = `farms/${farmId}/harvests/${harvest.id}`;
  try {
    await setDoc(doc(db, `farms/${farmId}/harvests`, harvest.id), harvest, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteHarvestFromFirestore(farmId: string, harvestId: string): Promise<void> {
  const path = `farms/${farmId}/harvests/${harvestId}`;
  try {
    await deleteDoc(doc(db, `farms/${farmId}/harvests`, harvestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveClientToFirestore(farmId: string, client: Client): Promise<void> {
  const path = `farms/${farmId}/clients/${client.id}`;
  try {
    await setDoc(doc(db, `farms/${farmId}/clients`, client.id), client, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteClientFromFirestore(farmId: string, clientId: string): Promise<void> {
  const path = `farms/${farmId}/clients/${clientId}`;
  try {
    await deleteDoc(doc(db, `farms/${farmId}/clients`, clientId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveOrderToFirestore(farmId: string, order: Order): Promise<void> {
  const path = `farms/${farmId}/orders/${order.id}`;
  try {
    await setDoc(doc(db, `farms/${farmId}/orders`, order.id), order, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteOrderFromFirestore(farmId: string, orderId: string): Promise<void> {
  const path = `farms/${farmId}/orders/${orderId}`;
  try {
    await deleteDoc(doc(db, `farms/${farmId}/orders`, orderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveExpenseToFirestore(farmId: string, expense: Expense): Promise<void> {
  const path = `farms/${farmId}/expenses/${expense.id}`;
  try {
    await setDoc(doc(db, `farms/${farmId}/expenses`, expense.id), expense, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteExpenseFromFirestore(farmId: string, expenseId: string): Promise<void> {
  const path = `farms/${farmId}/expenses/${expenseId}`;
  try {
    await deleteDoc(doc(db, `farms/${farmId}/expenses`, expenseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function savePaymentToFirestore(farmId: string, payment: ClientPayment): Promise<void> {
  const path = `farms/${farmId}/payments/${payment.id}`;
  try {
    await setDoc(doc(db, `farms/${farmId}/payments`, payment.id), payment, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePaymentFromFirestore(farmId: string, paymentId: string): Promise<void> {
  const path = `farms/${farmId}/payments/${paymentId}`;
  try {
    await deleteDoc(doc(db, `farms/${farmId}/payments`, paymentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateEggStockInFirestore(farmId: string, eggStock: FarmState['eggStock']): Promise<void> {
  const path = `farms/${farmId}`;
  try {
    await setDoc(doc(db, 'farms', farmId), { eggStock }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateFarmOwnerInFirestore(farmId: string, mfa: FarmState['mfa']): Promise<void> {
  const path = `farms/${farmId}`;
  try {
    await setDoc(doc(db, 'farms', farmId), { mfa, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

