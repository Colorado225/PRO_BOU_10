import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

const CLERK_PUBLISHABLE_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY) || '';

/**
 * Vérifie si une clé Clerk valide est fournie dans l'environnement
 */
export const isClerkConfigured = (): boolean => {
  return (
    typeof CLERK_PUBLISHABLE_KEY === 'string' &&
    (CLERK_PUBLISHABLE_KEY.startsWith('pk_test_') || CLERK_PUBLISHABLE_KEY.startsWith('pk_live_'))
  );
};

export const getClerkPublishableKey = (): string => CLERK_PUBLISHABLE_KEY;

/**
 * Wrapper conditionnel pour ClerkProvider.
 * Si aucune clé valide n'est configurée, rend directement les enfants
 * sans lever d'erreur, permettant au mode ERP local / démo de fonctionner.
 */
export const ClerkProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isClerkConfigured()) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      {children}
    </ClerkProvider>
  );
};
