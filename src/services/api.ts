/**
 * Client HTTP de l'API BoulangeriePro.
 *
 * Point d'entrée unique pour toutes les communications avec le backend :
 * - gère le jeton de session (injection de l'en-tête Authorization) ;
 * - normalise les erreurs (message exploitable par l'interface) ;
 * - centralise les types d'entrées/sorties.
 *
 * MIGRATION VERS NEON AUTH : l'authentification est désormais gérée par Neon
 * qui fournit les tokens et le JWKS pour la validation côté serveur.
 */

/** Base URL de l'API. Vide en dev → on s'appuie sur le proxy Vite `/api`. */
const API_BASE = import.meta.env.VITE_API_URL ?? "";

/** URL d'authentification locale (POST /api/auth/login). */
const NEON_AUTH_URL = "/api/auth/login";

// Stockage du token dans localStorage pour compatibilité avec tous les environnements
export const getToken = (): string | null => localStorage.getItem('auth_token');
export const setToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

/** Erreur API normalisée, porteuse d'un message lisible. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

import { enqueueOperation, type PendingOperation } from "./syncQueue";

/**
 * Effectue une requête vers l'API et renvoie le corps JSON typé.
 * Ajoute automatiquement le jeton de session s'il existe.
 * Hors-ligne : ajoute les requêtes d'écriture (POST/PUT/PATCH/DELETE) à la file de synchronisation
 */
export const apiFetch = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  let response: Response;
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(
    options.method || "",
  );

  try {
    // Credentials: include pour envoyer le cookie HttpOnly automatiquement
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    // Si c'est une mutation (écriture) et qu'on est hors-ligne, on ajoute à la file d'attente
    if (isMutation && !navigator.onLine) {
      // On détermine le type d'opération pour le suivi
      let opType: PendingOperation["type"] = "other";
      if (path.includes("/sales")) opType = "sale";
      else if (path.includes("/production")) opType = "production";
      else if (path.includes("/purchase")) opType = "purchase";
      else if (path.includes("/materials") || path.includes("/inventory"))
        opType = "adjustment";

      enqueueOperation(path, { ...options, headers }, opType);
      throw new ApiError(
        "Hors-ligne : l'opération sera synchronisée automatiquement lorsque le réseau sera rétabli.",
        0,
      );
    }
    throw new ApiError(
      "Réseau indisponible : impossible de joindre le serveur.",
      0,
    );
  }

  if (!response.ok) {
    let message = `Erreur ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* corps non JSON : on garde le message générique */
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};

/** Raccourcis HTTP. */
export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  del: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};

/* ------------------------------- TYPES AUTH -------------------------------- */

export type Role = "gerant" | "caissier" | "boulanger" | "magasinier";

export interface SessionUser {
  id: string;
  name: string;
  email?: string;
  role: Role;
  storeId: string | null;
  permissions: string[];
}

export interface LoginResponse {
  token: string;
  user: SessionUser;
}

/** Authentifie un utilisateur et retourne son profil. */
export const login = async (
  email: string,
  password: string,
): Promise<SessionUser> => {
  console.log("[api.login] Tentative de connexion:", email);
  
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  console.log("[api.login] Response status:", response.status);

  if (!response.ok) {
    let message = `Erreur ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* corps non JSON : on garde le message générique */
    }
    console.error("[api.login] Erreur:", message);
    throw new ApiError(message, response.status);
  }

  const body = await response.json();
  console.log("[api.login] Response body:", body);
  
  // Nouveau format : { success, data: { user } } ou ancien format : { user, token }
  const user: SessionUser = body.data?.user ?? body.user;
  if (!user) {
    console.error("[api.login] Pas d'utilisateur dans la réponse");
    throw new ApiError("Réponse de connexion invalide.", response.status);
  }
  
  console.log("[api.login] Connexion réussie:", user.name);
  return user;
};

/** Termine la session locale. */
export const logout = (): void => {
  setToken(null);
};

/** Récupère le profil de l'utilisateur courant. */
export const me = async (): Promise<SessionUser> => {
  const body = await api.get<any>("/api/auth/me");
  // Nouveau format : { success, data: { ... } } ou ancien format : { ... }
  const user: SessionUser = body.data ?? body;
  return user;
};
