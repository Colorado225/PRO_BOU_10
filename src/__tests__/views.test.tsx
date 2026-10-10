import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../App';
import { LoginView } from '../components/auth/LoginView';
import { SignUpView } from '../components/auth/SignUpView';
import { VerifyEmailView } from '../components/auth/VerifyEmailView';
import { ForgotPasswordView } from '../components/auth/ForgotPasswordView';
import { ResetPasswordView } from '../components/auth/ResetPasswordView';
import { DashboardView } from '../components/dashboard/DashboardView';
import { PosView } from '../components/pos/PosView';
import { ProductionView } from '../components/production/ProductionView';
import { RecipesView } from '../components/recipes/RecipesView';
import { ProductsView } from '../components/products/ProductsView';
import { InventoryView } from '../components/inventory/InventoryView';
import { StockMovementsView } from '../components/inventory/StockMovementsView';
import { PurchasesView } from '../components/purchases/PurchasesView';
import { CustomersView } from '../components/customers/CustomersView';
import { LossesView } from '../components/losses/LossesView';
import { CashView } from '../components/cash/CashView';
import { CustomOrdersView } from '../components/orders/CustomOrdersView';
import { AiBakeryAssistant } from '../components/ai/AiBakeryAssistant';
import { SettingsView } from '../components/settings/SettingsView';
import { BakeryProvider } from '../context/BakeryContext';
import { AuthProvider } from '../context/AuthContext';

describe('Frontend Views and Components Rendering', () => {
  it('renders LoginView without throwing', () => {
    const html = renderToString(<AuthProvider><LoginView /></AuthProvider>);
    expect(html).toContain('Boulangerie');
  });

  it('renders SignUpView without throwing', () => {
    const html = renderToString(<AuthProvider><SignUpView /></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders VerifyEmailView without throwing', () => {
    const html = renderToString(<AuthProvider><VerifyEmailView email="test@test.ci" /></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders ForgotPasswordView without throwing', () => {
    const html = renderToString(<AuthProvider><ForgotPasswordView /></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders ResetPasswordView without throwing', () => {
    const html = renderToString(<AuthProvider><ResetPasswordView token="123" /></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders DashboardView without throwing', () => {
    const html = renderToString(<AuthProvider><BakeryProvider><DashboardView /></BakeryProvider></AuthProvider>);
    expect(html).toContain('Tableau de Bord');
  });

  it('renders PosView without throwing', () => {
    const html = renderToString(<AuthProvider><BakeryProvider><PosView /></BakeryProvider></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders ProductionView without throwing', () => {
    const html = renderToString(<AuthProvider><BakeryProvider><ProductionView /></BakeryProvider></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders RecipesView without throwing', () => {
    const html = renderToString(<AuthProvider><BakeryProvider><RecipesView /></BakeryProvider></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders ProductsView without throwing', () => {
    const html = renderToString(<AuthProvider><BakeryProvider><ProductsView /></BakeryProvider></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders InventoryView without throwing', () => {
    const html = renderToString(<AuthProvider><BakeryProvider><InventoryView /></BakeryProvider></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders StockMovementsView without throwing', () => {
    const html = renderToString(<AuthProvider><BakeryProvider><StockMovementsView /></BakeryProvider></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders PurchasesView without throwing', () => {
    const html = renderToString(<AuthProvider><BakeryProvider><PurchasesView /></BakeryProvider></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders CustomersView without throwing', () => {
    const html = renderToString(<AuthProvider><BakeryProvider><CustomersView /></BakeryProvider></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders LossesView without throwing', () => {
    const html = renderToString(<AuthProvider><BakeryProvider><LossesView /></BakeryProvider></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders CashView without throwing', () => {
    const html = renderToString(<AuthProvider><BakeryProvider><CashView /></BakeryProvider></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders CustomOrdersView without throwing', () => {
    const html = renderToString(<AuthProvider><BakeryProvider><CustomOrdersView /></BakeryProvider></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders AiBakeryAssistant without throwing', () => {
    const html = renderToString(<AuthProvider><BakeryProvider><AiBakeryAssistant /></BakeryProvider></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders SettingsView without throwing', () => {
    const html = renderToString(<AuthProvider><BakeryProvider><SettingsView /></BakeryProvider></AuthProvider>);
    expect(html).toBeDefined();
  });

  it('renders Full App root without throwing', () => {
    const html = renderToString(<App />);
    expect(html).toBeDefined();
  });
});
