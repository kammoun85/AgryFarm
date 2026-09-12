import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FarmState, 
  Language, 
  Client, 
  Order, 
  ClientPayment, 
  EggHarvest, 
  Expense, 
  SheepRecord,
  ProduceType
} from './types';
import { 
  loadFarmState, 
  saveFarmState, 
  resetToInitialFarmState, 
  clearAllExceptClients,
  getEmptyFarmState
} from './utils/storage';
import { getTodayString, getMonthKey } from './utils/formatters';
import { translations } from './i18n/translations';

// Firebase & Cloud Services
import { auth, signInWithGoogle, signOutUser, testConnection } from './services/firebase';
import { 
  syncStateToFirestore, 
  fetchFarmStateFromFirestore,
  saveSheepToFirestore, 
  deleteSheepFromFirestore, 
  saveHarvestToFirestore,
  deleteHarvestFromFirestore,
  saveClientToFirestore,
  saveOrderToFirestore,
  saveExpenseToFirestore,
  savePaymentToFirestore,
  updateEggStockInFirestore,
  updateFarmOwnerInFirestore
} from './services/firestoreSync';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './services/firebase';

// Navigation & Global Components
import { Navbar } from './components/Navbar';
import { MfaModal } from './components/MfaModal';
import { GlobalSearchFilter } from './components/GlobalSearchFilter';
import { FloatingExportButton } from './components/FloatingExportButton';
import { SellModal } from './components/SellModal';
import { LoginAuthView } from './components/LoginAuthView';

// Views
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { ClientsView } from './components/ClientsView';
import { OperationsView } from './components/OperationsView';
import { FinancialView } from './components/FinancialView';
import { BackupDataView } from './components/BackupDataView';

export default function App() {
  // Start with clean empty state for secure initial state
  const [state, setState] = useState<FarmState>(() => getEmptyFarmState('Mon Exploitation'));
  const [lang, setLang] = useState<Language>(() => state.language || 'fr');

  // Firebase Auth & Cloud Sync States
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Routing / View Tabs: Start on 'login' to make it secure
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'clients' | 'operations' | 'financial' | 'backup' | 'login'>('login');

  // Modals
  const [isMfaOpen, setIsMfaOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellModalConfig, setSellModalConfig] = useState<{
    preselectedClientId?: string;
    preselectedType?: ProduceType;
    preselectedSheepId?: string;
  }>({});

  // Client view deep-link
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);

  // Operations initial modal trigger for seamless button routing
  const [operationsInitialModal, setOperationsInitialModal] = useState<'harvest' | 'expense' | 'sheepHealth' | null>(null);

  const handleOpenHarvestModal = () => {
    setOperationsInitialModal('harvest');
    setActiveTab('operations');
  };

  const handleOpenExpenseModal = () => {
    setOperationsInitialModal('expense');
    setActiveTab('operations');
  };

  const handleUpdateFarmOwner = async (ownerName: string, farmName?: string, location?: string, phone?: string) => {
    const updatedMfa = {
      ...state.mfa,
      farmOwnerName: ownerName,
      farmName: farmName !== undefined ? farmName : state.mfa.farmName,
      farmLocation: location !== undefined ? location : state.mfa.farmLocation,
      phone: phone !== undefined ? phone : state.mfa.phone,
    };
    const newState = { ...state, mfa: updatedMfa };
    setState(newState);
    saveFarmState(newState, user?.uid);

    if (user) {
      await updateFarmOwnerInFirestore(user.uid, updatedMfa);
    }
  };

  // Test connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
        // User is logged in: fetch their personal online Firestore farm data
        try {
          setSyncing(true);
          setSyncError(null);
          const farmData = await fetchFarmStateFromFirestore(
            currentUser.uid, 
            currentUser.displayName || currentUser.email?.split('@')[0] || 'Mon Exploitation'
          );
          // New user starts with a completely clear historic: nothing in it!
          setState(farmData);
          saveFarmState(farmData, currentUser.uid);
          setLastSyncedAt(new Date());
          // Automatically navigate to dashboard once logged in
          setActiveTab('dashboard');
        } catch (err: any) {
          console.error('Error fetching online user farm:', err);
          const empty = getEmptyFarmState(currentUser.displayName || currentUser.email?.split('@')[0] || 'Mon Exploitation');
          setState(empty);
        } finally {
          setSyncing(false);
        }
      } else {
        // Unauthenticated: clean empty slate, navigate to login tab for security
        const emptyGuest = getEmptyFarmState('Mon Exploitation');
        setState(emptyGuest);
        setActiveTab('login');
      }
    });
    return () => unsubscribe();
  }, []);

  // Synchronize language and text direction
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    setState((prev) => ({ ...prev, language: lang }));
  }, [lang]);

  // Persist State Changes locally per user
  useEffect(() => {
    saveFarmState(state, user?.uid);
  }, [state, user]);

  const t = translations[lang];

  // Cloud Sync Handler
  const triggerCloudSync = useCallback(async (uid?: string, stateToSync?: FarmState) => {
    const targetUid = uid || user?.uid;
    if (!targetUid) return;

    try {
      setSyncing(true);
      setSyncError(null);
      await syncStateToFirestore(targetUid, stateToSync || state);
      setLastSyncedAt(new Date());
    } catch (err: any) {
      console.error('Cloud synchronization error:', err);
      setSyncError(err?.message || 'Failed to sync with Firestore');
    } finally {
      setSyncing(false);
    }
  }, [user, state]);

  // -------------------------------------------------------------
  // HANDLERS FOR SALES & INVENTORY (Cross-module integration)
  // -------------------------------------------------------------

  const handleOpenSellModal = (type: ProduceType = 'eggs', sheepId?: string, clientId?: string) => {
    setSellModalConfig({
      preselectedType: type,
      preselectedSheepId: sheepId,
      preselectedClientId: clientId,
    });
    setIsSellModalOpen(true);
  };

  const handleCompleteSale = (order: Order, paymentReceived: number, newDebt: number) => {
    setState((prev) => {
      // 1. Inventory deductions
      let updatedEggStock = { ...prev.eggStock };
      let updatedSheepHerd = [...prev.sheepHerd];

      order.items.forEach((item) => {
        if (item.produceType === 'eggs') {
          updatedEggStock.inStock = Math.max(0, updatedEggStock.inStock - item.quantity);
          updatedEggStock.totalSold = (updatedEggStock.totalSold || 0) + item.quantity;
        } else if (item.produceType === 'sheep' && item.sheepId) {
          updatedSheepHerd = updatedSheepHerd.map((s) =>
            s.id === item.sheepId
              ? {
                  ...s,
                  status: 'sold',
                  soldDate: order.date,
                  salePriceTND: item.totalTND,
                  soldToClientId: order.clientId,
                }
              : s
          );
        }
      });

      // 2. Client Debt Update
      const updatedClients = prev.clients.map((c) =>
        c.id === order.clientId
          ? { ...c, totalDebtTND: Math.max(0, (c.totalDebtTND || 0) + newDebt) }
          : c
      );

      // 3. Payments Record if upfront cash paid
      const updatedPayments = [...prev.payments];
      if (paymentReceived > 0) {
        const newPayment: ClientPayment = {
          id: `pay-${Date.now()}`,
          clientId: order.clientId,
          clientName: order.clientName,
          orderId: order.id,
          date: order.date,
          amountTND: paymentReceived,
          paymentMethod: 'cash',
          notes: `Upfront payment on Order ${order.orderNumber}`,
        };
        updatedPayments.push(newPayment);

        if (user) {
          savePaymentToFirestore(user.uid, newPayment).catch(console.error);
        }
      }

      // Sync updated items to Firestore
      if (user) {
        saveOrderToFirestore(user.uid, order).catch(console.error);
        updateEggStockInFirestore(user.uid, updatedEggStock).catch(console.error);
        const updatedClient = updatedClients.find(c => c.id === order.clientId);
        if (updatedClient) {
          saveClientToFirestore(user.uid, updatedClient).catch(console.error);
        }
      }

      return {
        ...prev,
        eggStock: updatedEggStock,
        sheepHerd: updatedSheepHerd,
        clients: updatedClients,
        orders: [order, ...prev.orders],
        payments: updatedPayments,
      };
    });
  };

  // -------------------------------------------------------------
  // HANDLERS FOR CLIENT MANAGEMENT
  // -------------------------------------------------------------

  const handleAddClient = (clientData: Omit<Client, 'id' | 'totalDebtTND' | 'createdAt'>): string => {
    const newId = `cli-${Date.now()}`;
    const newClient: Client = {
      ...clientData,
      id: newId,
      totalDebtTND: 0,
      createdAt: getTodayString(),
    };

    if (user) {
      saveClientToFirestore(user.uid, newClient).catch(console.error);
    }

    setState((prev) => ({
      ...prev,
      clients: [newClient, ...prev.clients],
    }));
    return newId;
  };

  const handleRecordPayment = (paymentData: Omit<ClientPayment, 'id'>) => {
    const newPayment: ClientPayment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
    };

    if (user) {
      savePaymentToFirestore(user.uid, newPayment).catch(console.error);
    }

    setState((prev) => {
      // Decrement client's debt ledger
      const updatedClients = prev.clients.map((c) => {
        if (c.id === paymentData.clientId) {
          const updated = { ...c, totalDebtTND: Math.max(0, c.totalDebtTND - paymentData.amountTND) };
          if (user) {
            saveClientToFirestore(user.uid, updated).catch(console.error);
          }
          return updated;
        }
        return c;
      });

      return {
        ...prev,
        payments: [newPayment, ...prev.payments],
        clients: updatedClients,
      };
    });
  };

  // -------------------------------------------------------------
  // HANDLERS FOR OPERATIONS (Harvests, Expenses, Livestock Care)
  // -------------------------------------------------------------

  const handleAddHarvest = (harvestData: Omit<EggHarvest, 'id'>) => {
    const newHarvest: EggHarvest = {
      ...harvestData,
      id: `hrv-${Date.now()}`,
    };

    const netYield = Math.max(0, harvestData.quantity - harvestData.brokenCount);

    if (user) {
      saveHarvestToFirestore(user.uid, newHarvest).catch(console.error);
    }

    setState((prev) => {
      const updatedEggStock = {
        ...prev.eggStock,
        inStock: prev.eggStock.inStock + netYield,
        totalHarvested: (prev.eggStock.totalHarvested || 0) + harvestData.quantity,
      };

      if (user) {
        updateEggStockInFirestore(user.uid, updatedEggStock).catch(console.error);
      }

      return {
        ...prev,
        eggHarvests: [newHarvest, ...prev.eggHarvests],
        eggStock: updatedEggStock,
      };
    });
  };

  const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };

    if (user) {
      saveExpenseToFirestore(user.uid, newExpense).catch(console.error);
    }

    setState((prev) => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
    }));
  };

  const handleUpdateSheepHealth = (sheepId: string, updatedHealth: string, weightKg?: number) => {
    setState((prev) => {
      const updatedSheepHerd = prev.sheepHerd.map((s) => {
        if (s.id === sheepId) {
          const updated = {
            ...s,
            healthNotes: updatedHealth,
            weightKg: weightKg !== undefined ? weightKg : s.weightKg,
          };
          if (user) {
            saveSheepToFirestore(user.uid, updated).catch(console.error);
          }
          return updated;
        }
        return s;
      });

      return {
        ...prev,
        sheepHerd: updatedSheepHerd,
      };
    });
  };

  // -------------------------------------------------------------
  // HANDLERS FOR INVENTORY MANAGEMENT
  // -------------------------------------------------------------

  const handleAddSheep = (sheepData: Omit<SheepRecord, 'id' | 'status'>) => {
    const newSheep: SheepRecord = {
      ...sheepData,
      id: `shp-${Date.now()}`,
      status: 'active',
    };

    if (user) {
      saveSheepToFirestore(user.uid, newSheep).catch(console.error);
    }

    setState((prev) => ({
      ...prev,
      sheepHerd: [newSheep, ...prev.sheepHerd],
    }));
  };

  const handleUpdateEggSettings = (inStock: number, pricePerTray: number, pricePerEgg: number) => {
    const updatedEggStock = {
      ...state.eggStock,
      inStock,
      defaultPricePerTrayTND: pricePerTray,
      defaultPricePerEggTND: pricePerEgg,
    };

    if (user) {
      updateEggStockInFirestore(user.uid, updatedEggStock).catch(console.error);
    }

    setState((prev) => ({
      ...prev,
      eggStock: updatedEggStock,
    }));
  };

  // -------------------------------------------------------------
  // HANDLERS FOR BACKUP, RESTORE & DATA RESET
  // -------------------------------------------------------------

  const handleClearAllExceptClients = () => {
    const cleared = clearAllExceptClients(state);
    setState(cleared);
    if (user) {
      triggerCloudSync(user.uid, cleared);
    }
  };

  const handleRestoreState = (newState: FarmState) => {
    setState(newState);
    if (user) {
      triggerCloudSync(user.uid, newState);
    }
  };

  const handleResetToDemo = () => {
    const demo = resetToInitialFarmState();
    setState(demo);
    if (user) {
      triggerCloudSync(user.uid, demo);
    }
  };

  const handleCreateManualSnapshot = () => {
    const today = getTodayString();
    const count = state.orders.length + state.sheepHerd.length + state.eggHarvests.length + state.expenses.length;
    setState((prev) => ({
      ...prev,
      backups: [
        {
          id: `snap-${Date.now()}`,
          date: today,
          monthKey: getMonthKey(today),
          recordCount: count,
          summary: `Manual User Backup (${count} active farm records)`,
          stateSnapshot: prev,
        },
        ...prev.backups,
      ],
    }));
  };

  // Global Search Navigation Action
  const handleSelectSearchResult = (result: any) => {
    if (result.type === 'client') {
      setActiveTab('clients');
      setSelectedClientId(result.id);
    } else if (result.type === 'sheep') {
      setActiveTab('inventory');
    } else if (result.type === 'order') {
      setActiveTab('financial');
    } else if (result.type === 'harvest' || result.type === 'expense') {
      setActiveTab('operations');
    }
  };

  const totalOutstandingDebts = useMemo(() => {
    return state.clients.reduce((acc, c) => acc + (c.totalDebtTND || 0), 0);
  }, [state.clients]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white font-sans antialiased">
      {/* 1. Header Navigation & Security Status */}
      <Navbar
        currentTab={activeTab}
        setCurrentTab={(tab) => setActiveTab(tab as any)}
        lang={lang}
        setLang={setLang}
        totalDebtsTND={totalOutstandingDebts}
        isMfaLocked={!state.mfa.verifiedThisSession}
        onToggleLock={() => {
          if (!state.mfa.verifiedThisSession) {
            setIsMfaOpen(true);
          } else {
            setState((prev) => ({
              ...prev,
              mfa: { ...prev.mfa, verifiedThisSession: false },
            }));
          }
        }}
        user={user}
        syncing={syncing}
        onSignIn={async () => {
          try {
            await signInWithGoogle();
          } catch (e) {
            console.error(e);
          }
        }}
        onSignOut={async () => {
          try {
            await signOutUser();
          } catch (e) {
            console.error(e);
          }
        }}
        onSync={() => triggerCloudSync()}
      />

      {/* 2. Global Search & Filter Bar (Cross-module fast access) */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 pb-20 flex-1 space-y-5">
        <GlobalSearchFilter
          state={state}
          lang={lang}
          onSelectResult={handleSelectSearchResult}
        />

        {/* Guest Security Notice when exploring without login */}
        {!user && activeTab !== 'login' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>Session Locale Non-Sécurisée : Connectez-vous sur l'onglet Connexion pour activer la sauvegarde cloud et l'accès multi-appareils.</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Se Connecter en Ligne
            </button>
          </div>
        )}

        {/* 3. Render Active Tab View */}
        {activeTab === 'login' && (
          <LoginAuthView
            user={user}
            authLoading={authLoading}
            syncing={syncing}
            lastSyncedAt={lastSyncedAt}
            syncError={syncError}
            farmOwnerName={state.mfa.farmOwnerName}
            farmName={state.mfa.farmName}
            farmLocation={state.mfa.farmLocation}
            phone={state.mfa.phone}
            onUpdateFarmOwner={handleUpdateFarmOwner}
            onManualSync={() => triggerCloudSync()}
            onGoToDashboard={() => setActiveTab('dashboard')}
            onClearHistoric={() => {
              const empty = getEmptyFarmState(user?.displayName || user?.email?.split('@')[0] || 'Mon Exploitation');
              setState(empty);
              if (user) {
                triggerCloudSync(user.uid, empty);
              }
            }}
            lang={lang}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            state={state}
            lang={lang}
            onOpenSellModal={() => handleOpenSellModal()}
            onOpenHarvestModal={handleOpenHarvestModal}
            onOpenExpenseModal={handleOpenExpenseModal}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            onSelectClient={(cid) => {
              setSelectedClientId(cid);
              setActiveTab('clients');
            }}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            state={state}
            lang={lang}
            onOpenSellModal={handleOpenSellModal}
            onOpenHarvestModal={handleOpenHarvestModal}
            onAddSheep={handleAddSheep}
            onUpdateEggStock={handleUpdateEggSettings}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsView
            state={state}
            lang={lang}
            selectedClientId={selectedClientId}
            onSelectClient={setSelectedClientId}
            onOpenNewOrderForClient={(cid) => handleOpenSellModal('eggs', undefined, cid)}
            onRecordPayment={handleRecordPayment}
            onAddClient={handleAddClient}
          />
        )}

        {activeTab === 'operations' && (
          <OperationsView
            state={state}
            lang={lang}
            onAddHarvest={handleAddHarvest}
            onAddExpense={handleAddExpense}
            onUpdateSheepHealth={handleUpdateSheepHealth}
            initialModal={operationsInitialModal}
            onClearInitialModal={() => setOperationsInitialModal(null)}
          />
        )}

        {activeTab === 'financial' && (
          <FinancialView
            state={state}
            lang={lang}
            onUpdateOwnerInfo={(owner, farm) => handleUpdateFarmOwner(owner, farm)}
          />
        )}

        {activeTab === 'backup' && (
          <BackupDataView
            state={state}
            lang={lang}
            onClearAllExceptClients={handleClearAllExceptClients}
            onRestoreState={handleRestoreState}
            onResetToDemo={handleResetToDemo}
            onCreateManualSnapshot={handleCreateManualSnapshot}
            user={user}
            authLoading={authLoading}
            syncing={syncing}
            lastSyncedAt={lastSyncedAt}
            syncError={syncError}
            onManualSync={() => triggerCloudSync()}
          />
        )}
      </main>

      {/* 4. Bottom Security & Offline Info Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>
              AgryTND v1.0 • {user ? `Cloud Synchronized (${user.email})` : 'Offline-First Local Storage'}
            </span>
          </div>
          <div>
            Devise: <strong>TND (Dinar Tunisien)</strong> • Western Arabic Numerals Mode Enforced
          </div>
        </div>
      </footer>

      {/* 5. Floating Action Button (FAB) for One-Click Excel Export */}
      <FloatingExportButton state={state} lang={lang} />

      {/* 6. Universal Sell & Order Processing Modal */}
      <SellModal
        state={state}
        lang={lang}
        isOpen={isSellModalOpen}
        preselectedClientId={sellModalConfig.preselectedClientId}
        preselectedType={sellModalConfig.preselectedType}
        preselectedSheepId={sellModalConfig.preselectedSheepId}
        onClose={() => setIsSellModalOpen(false)}
        onSubmitSale={handleCompleteSale}
        onQuickAddClient={handleAddClient}
      />

      {/* 7. Simulated MFA Security Modal */}
      <MfaModal
        state={state}
        lang={lang}
        isOpen={isMfaOpen}
        onClose={() => setIsMfaOpen(false)}
        onUpdateMfa={(mfaData) =>
          setState((prev) => ({
            ...prev,
            mfa: { ...prev.mfa, ...mfaData },
          }))
        }
      />
    </div>
  );
}
