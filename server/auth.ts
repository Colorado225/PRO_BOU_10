/**
 * Authentification locale avec JWT - SYSTÈME PRINCIPAL
 *
 * Système d'authentification unifié pour l'ERP :
 * - Gestion manuelle des secrets JWT sécurisés
 * - bcryptjs pour le hachage des mots de passe
 * - Middlewares `requireAuth` et `requireRole` pour la protection des routes
 * - Compatible avec toutes les routes existantes
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { config } from "./config";

/** Rôles disponibles dans l'ERP */
export type Role = "gerant" | "caissier" | "boulanger" | "magasinier";

/** Charge utile transportée dans le jeton JWT */
export interface AuthPayload {
  userId: string;
  name: string;
  role: Role;
  storeId: string | null;
  organizationId: string | null;
  email?: string;
}

/** Étend la requête Express pour y attacher l'utilisateur authentifié */
export interface AuthedRequest extends Request {
  user?: {
    userId: string;
    name: string;
    role: Role;
    storeId: string | null;
    organizationId: string | null;
    email?: string;
  };
}

/** Fonctions de hachage et vérification des mots de passe */
export const hashPassword = (plain: string): string =>
  bcrypt.hashSync(plain, 10);
export const verifyPassword = (plain: string, hash: string): boolean =>
  bcrypt.compareSync(plain, hash);

/** Créer un jeton JWT signé pour un utilisateur (access token - 24h) */
export const signToken = (payload: AuthPayload): string =>
  jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);

/** Créer un refresh token aléatoire cryptographiquement sécurisé */
export const generateRefreshToken = (): string => {
  return crypto.randomUUID() + crypto.randomUUID(); // 2 UUIDs (36 chars × 2 = 72 caractères sécurisés)
};

/**
 * Middleware : exige un token JWT valide et attache l'utilisateur à la requête.
 * Répond 401 si le token est absent, invalide ou expiré.
 */
export const requireAuth = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Récupérer le token depuis le cookie HttpOnly (nouvelle méthode) OU depuis l'header (ancienne méthode - transition)
  let token: string | undefined;

  // D'abord essayer de récupérer depuis le cookie (standard de sécurité)
  if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }
  // Fallback sur l'header Authorization pour la transition
  else {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authentification requise." });
      return;
    }
    token = header.slice("Bearer ".length);
  }

  if (!token) {
    res.status(401).json({ error: "Authentification requise." });
    return;
  }

  try {
    // Vérifier la signature et l'expiration du token
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;

    // Attacher l'utilisateur à la requête
    req.user = {
      userId: payload.userId,
      name: payload.name,
      role: payload.role,
      storeId: payload.storeId,
      organizationId: payload.organizationId,
    };

    next();
  } catch (error) {
    console.error("Erreur de validation JWT:", error);
    res.status(401).json({ error: "Session expirée ou invalide." });
  }
};

/**
 * Hiérarchie des rôles
 */
const ROLE_RANK: Record<Role, number> = {
  magasinier: 1,
  caissier: 2,
  boulanger: 2,
  gerant: 3,
};

/**
 * Middleware : exige un rôle minimum.
 */
export const requireRole =
  (minimum: Role) =>
  (req: AuthedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Authentification requise." });
      return;
    }
    if (ROLE_RANK[user.role] < ROLE_RANK[minimum]) {
      res.status(403).json({
        error: `Accès refusé : rôle « ${minimum} » ou supérieur requis.`,
      });
      return;
    }
    next();
  };

/**
 * Matrice des permissions
 */
/**
 * Middleware : exige que l'utilisateur appartienne à une organisation.
 * Vérifie que l'organization_id est présent et non null.
 */
export const requireOrganization = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentification requise." });
    return;
  }
  if (!user.organizationId) {
    res.status(403).json({
      error: "Accès refusé : utilisateur non associé à une organisation.",
    });
    return;
  }
  next();
};

/**
 * Helper : génère la clause SQL WHERE pour filtrer par organization_id.
 * À utiliser dans toutes les requêtes pour garantir l'isolation.
 */
export const getOrganizationFilter = (user?: AuthedRequest["user"] | null) => {
  if (!user?.organizationId) {
    throw new Error("Impossible de filtrer : utilisateur sans organisation");
  }
  return {
    clause: "organization_id = $1",
    value: user.organizationId,
    paramIndex: 1,
  };
};

/**
 * Helper : génère la clause SQL WHERE pour filtrer par organization_id ET store_id.
 * Combine les deux niveaux d'isolation (organisation + boutique).
 */
export const getTenantFilters = (user?: AuthedRequest["user"] | null) => {
  if (!user?.organizationId) {
    throw new Error("Impossible de filtrer : utilisateur sans organisation");
  }
  const filters = [`organization_id = $1`];
  const values = [user.organizationId];

  if (user.storeId) {
    filters.push(`store_id = $2`);
    values.push(user.storeId);
  }

  return {
    clause: filters.join(" AND "),
    values,
  };
};

export const PERMISSIONS = {
  /** Vente / caisse POS. */
  pos: ["gerant", "caissier"] as Role[],
  /** Modifier prix / catalogue. */
  catalog: ["gerant"] as Role[],
  /** Lancer fournées / production. */
  production: ["gerant", "boulanger"] as Role[],
  /** Réception matières premières. */
  receiving: ["gerant", "magasinier"] as Role[],
  /** Voir bénéfices & marges. */
  margins: ["gerant"] as Role[],
} as const;
