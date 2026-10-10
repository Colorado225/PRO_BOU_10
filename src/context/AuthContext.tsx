import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { safeStorage } from '../utils/safeStorage';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  storeId: string | null;
  organizationId: string | null;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isRestoring: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: () => void;
  logout: () => void;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Utilisateur démo par défaut */
const DEMO_USER: User = {
  id: 'demo-gerant',
  name: 'Aminata Koné',
  email: 'gerant@boulangeriepro.ci',
  role: 'gerant',
  storeId: 'store-1',
  organizationId: 'org-1',
  permissions: ['*'],
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const restoredRef = useRef(false);

  // Restaurer la session au démarrage (une seule fois)
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const mode = safeStorage.getItem('auth_mode');
    
    if (mode === 'demo') {
      setUser(DEMO_USER);
      setIsRestoring(false);
      return;
    }

    // La session principale est portée par le cookie HttpOnly posé par l'API.
    // Il faut donc restaurer /me même quand aucun token n'est présent dans le storage
    // (notamment après la vérification d'un nouvel e-mail).
    const token = safeStorage.getItem('auth_token');
    const headers: HeadersInit = token
      ? { 'Authorization': `Bearer ${token}` }
      : {};

    fetch('/api/auth/me', {
      headers,
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) {
          safeStorage.removeItem('auth_token');
          throw new Error('Session invalide');
        }
        return res.json();
      })
      .then(data => {
        const userData = data.data?.user ?? data.data ?? data.user ?? null;
        setUser(userData);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsRestoring(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Échec de la connexion');
    }

    const token = data.data?.token || data.token;
    const userData = data.data?.user || data.user;

    if (!token || !userData) {
      throw new Error('Réponse invalide du serveur');
    }

    safeStorage.setItem('auth_token', token);
    safeStorage.removeItem('auth_mode');
    setUser(userData);
  }, []);

  /** Connexion démo instantanée — pas d'appel API */
  const demoLogin = useCallback(() => {
    safeStorage.setItem('auth_mode', 'demo');
    safeStorage.removeItem('auth_token');
    setUser(DEMO_USER);
  }, []);

  const logout = useCallback(() => {
    safeStorage.removeItem('auth_token');
    safeStorage.removeItem('auth_mode');
    setUser(null);
  }, []);

  const can = useCallback(
    (permission: string) => {
      if (!user?.permissions) return false;
      return user.permissions.includes('*') || user.permissions.includes(permission);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isRestoring, login, demoLogin, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
