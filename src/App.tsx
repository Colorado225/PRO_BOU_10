/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BakeryProvider, useBakery } from './context/BakeryContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginView } from './components/auth/LoginView';
import { SignUpView } from './components/auth/SignUpView';
import { VerifyEmailView } from './components/auth/VerifyEmailView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { ResetPasswordView } from './components/auth/ResetPasswordView';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { PosView } from './components/pos/PosView';
import { ProductionView } from './components/production/ProductionView';
import { RecipesView } from './components/recipes/RecipesView';
import { ProductsView } from './components/products/ProductsView';
import { InventoryView } from './components/inventory/InventoryView';
import { StockMovementsView } from './components/inventory/StockMovementsView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { CustomersView } from './components/customers/CustomersView';
import { LossesView } from './components/losses/LossesView';
import { CashView } from './components/cash/CashView';
import { CustomOrdersView } from './components/orders/CustomOrdersView';
import { AiBakeryAssistant } from './components/ai/AiBakeryAssistant';
import { SettingsView } from './components/settings/SettingsView';
import { CheckCircle2 } from 'lucide-react';

/**
 * Layout principal de l'application (après connexion)
 */
const MainLayout: React.FC = () => {
  const { activeTab, notification } = useBakery();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'pos': return <PosView />;
      case 'production': return <ProductionView />;
      case 'recipes': return <RecipesView />;
      case 'products': return <ProductsView />;
      case 'inventory': return <InventoryView />;
      case 'stock_movements': return <StockMovementsView />;
      case 'purchases': return <PurchasesView />;
      case 'customers': return <CustomersView />;
      case 'losses': return <LossesView />;
      case 'cash': return <CashView />;
      case 'custom_orders': return <CustomOrdersView />;
      case 'ai_assistant': return <AiBakeryAssistant />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex overflow-y-auto overflow-x-hidden">
          {renderActiveView()}
        </main>
      </div>

      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-stone-900 border border-amber-500/50 text-amber-200 px-4 py-3 rounded-2xl shadow-2xl">
          <CheckCircle2 className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Error Boundary spécifique pour le dashboard.
 * Si le dashboard crashe, on affiche un message d'erreur mais on NE touche PAS au token.
 */
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[DashboardErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans p-6">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔧</span>
            </div>
            <h1 className="text-xl font-bold text-stone-900 mb-2">Erreur du dashboard</h1>
            <p className="text-sm text-stone-500 mb-4">
              Le tableau de bord a rencontré une erreur. Vos données sont sauvegardées.
            </p>
            <pre className="text-xs text-left bg-stone-50 p-3 rounded-lg overflow-auto max-h-24 mb-4 text-red-600">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Contenu principal de l'application
 */
const AppContent: React.FC = () => {
  const { user, isRestoring, logout } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup' | 'verify-email' | 'forgot-password' | 'reset-password'>('login');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setAuthView('reset-password');
    }
  }, []);

  // Debug: tracker les changements de user
  useEffect(() => {
    console.log("[AppContent] 🔄 user:", user?.name ?? "null", "| isRestoring:", isRestoring);
  }, [user, isRestoring]);

  // Écran de chargement
  if (isRestoring) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-stone-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Utilisateur connecté → afficher l'application
  if (user) {
    return (
      <DashboardErrorBoundary>
        <BakeryProvider>
          <MainLayout />
        </BakeryProvider>
      </DashboardErrorBoundary>
    );
  }

  // Utilisateur non connecté → afficher les pages d'auth
  switch (authView) {
    case 'signup':
      return <SignUpView onNavigateToLogin={() => setAuthView('login')} onRegistered={(email) => { setVerifyEmail(email); setAuthView('verify-email'); }} />;
    case 'verify-email':
      return <VerifyEmailView email={verifyEmail} onVerified={() => { setAuthView('login'); window.location.reload(); }} onNavigateToLogin={() => setAuthView('login')} />;
    case 'forgot-password':
      return <ForgotPasswordView onNavigateToLogin={() => setAuthView('login')} />;
    case 'reset-password':
      return <ResetPasswordView token={resetToken} onResetComplete={() => { window.history.replaceState({}, '', window.location.pathname); window.location.reload(); }} onNavigateToLogin={() => setAuthView('login')} onNavigateToForgot={() => setAuthView('forgot-password')} />;
    default:
      return <LoginView onNavigateToSignUp={() => setAuthView('signup')} onNavigateToForgotPassword={() => setAuthView('forgot-password')} />;
  }
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
