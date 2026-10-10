import React, { useEffect } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

export interface MappedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  storeId: string | null;
  organizationId: string | null;
  permissions: string[];
}

interface ClerkBridgeProps {
  onClerkStateChange: (
    user: MappedUser | null,
    token: string | null,
    isLoaded: boolean
  ) => void;
}

export const ClerkBridge: React.FC<ClerkBridgeProps> = ({ onClerkStateChange }) => {
  const { user: clerkUser, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { getToken, isLoaded: isAuthLoaded } = useClerkAuth();

  useEffect(() => {
    if (!isUserLoaded || !isAuthLoaded) {
      onClerkStateChange(null, null, false);
      return;
    }

    if (!isSignedIn || !clerkUser) {
      onClerkStateChange(null, null, true);
      return;
    }

    let isMounted = true;

    const syncUser = async () => {
      try {
        const token = await getToken();
        if (!isMounted) return;

        const role = (clerkUser.publicMetadata?.role as string) || 'gerant';
        const storeId = (clerkUser.publicMetadata?.storeId as string) || 'store-1';
        const organizationId = (clerkUser.publicMetadata?.organizationId as string) || 'org-1';

        const mappedUser: MappedUser = {
          id: clerkUser.id,
          name: clerkUser.fullName || clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress || 'Utilisateur',
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          role,
          storeId,
          organizationId,
          permissions: ['*'],
        };

        onClerkStateChange(mappedUser, token, true);
      } catch (err) {
        console.error('[ClerkBridge] Erreur récupération token Clerk:', err);
        if (isMounted) onClerkStateChange(null, null, true);
      }
    };

    syncUser();

    return () => {
      isMounted = false;
    };
  }, [clerkUser, isUserLoaded, isAuthLoaded, isSignedIn, getToken, onClerkStateChange]);

  return null;
};
