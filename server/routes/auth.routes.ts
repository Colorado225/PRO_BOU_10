/**
 * Routes d'authentification (chantier 1.2).
 *
 * POST /api/auth/login  — connexion par e-mail + mot de passe
 * GET  /api/auth/me     — profil de l'utilisateur courant (jeton requis)
 */
import { Router } from "express";
import bcrypt from "bcryptjs";
import { query, queryOne } from "../db";
import {
  signToken,
  generateRefreshToken,
  requireAuth,
  PERMISSIONS,
  type AuthedRequest,
  type Role,
} from "../auth";

export const authRouter = Router();

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  store_id: string | null;
  organization_id: string | null;
  is_active: boolean;
}

/**
 * Connexion : vérifie les identifiants et renvoie un jeton de session.
 * Ne révèle jamais si c'est l'e-mail ou le mot de passe qui est erroné.
 */
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "E-mail et mot de passe requis." });
    return;
  }

  const user = await queryOne<UserRow>(
    `SELECT id, name, email, password_hash, role, store_id, organization_id, is_active
       FROM users WHERE email = $1`,
    [email.toLowerCase().trim()],
  );

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: "Identifiants invalides." });
    return;
  }

  if (!user.is_active) {
    res.status(403).json({ error: "Compte désactivé. Contactez le gérant." });
    return;
  }

  const token = signToken({
    userId: user.id,
    name: user.name,
    role: user.role,
    storeId: user.store_id,
    organizationId: user.organization_id,
  });

  // Générer et enregistrer un refresh token (7 jours)
  const refreshToken = generateRefreshToken();
  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 jours

  await query(
    `INSERT INTO refresh_tokens (token, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [refreshToken, user.id, refreshExpiresAt],
  );

  // Poser les cookies HttpOnly, Secure, SameSite: Strict (conforme à PLAN_ACTION.md)
  res.cookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 24h
    path: "/",
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    path: "/",
  });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      storeId: user.store_id,
      organizationId: user.organization_id,
      permissions: Object.entries(PERMISSIONS)
        .filter(([, roles]) => (roles as readonly Role[]).includes(user.role))
        .map(([key]) => key),
    },
  });
});

/** Profil de l'utilisateur courant, déduit du jeton. */
authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = req.user!;
  const row = await queryOne<{
    id: string;
    name: string;
    email: string;
    role: Role;
    store_id: string | null;
  }>(`SELECT id, name, email, role, store_id FROM users WHERE id = $1`, [
    user.userId,
  ]);

  if (!row) {
    res.status(404).json({ error: "Utilisateur introuvable." });
    return;
  }

  res.json({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    storeId: row.store_id,
    permissions: Object.entries(PERMISSIONS)
      .filter(([, roles]) => (roles as readonly Role[]).includes(row.role))
      .map(([key]) => key),
  });
});

/** Liste des utilisateurs (gérant uniquement) — pour l'écran d'administration. */
authRouter.get("/users", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user?.role !== "gerant") {
    res.status(403).json({ error: "Accès réservé au gérant." });
    return;
  }
  const rows = await query(
    `SELECT id, name, email, role, store_id, is_active, created_at
       FROM users ORDER BY created_at DESC`,
  );
  res.json(rows);
});

/** Déconnexion : révoque le refresh token et efface le cookie HttpOnly */
authRouter.post("/logout", requireAuth, async (req: AuthedRequest, res) => {
  // Récupérer le refresh token depuis un cookie séparé (refresh_token)
  const refreshToken = req.cookies?.refresh_token;

  if (refreshToken) {
    // Révoquer le refresh token dans la base de données
    await query(
      `UPDATE refresh_tokens SET revoked_at = now() WHERE token = $1`,
      [refreshToken],
    );
  }

  // Effacer les deux cookies (access_token et refresh_token)
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });

  res.json({ loggedOut: true });
});

/** Renouveler l'access token avec un refresh token valide */
authRouter.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    res.status(401).json({ error: "Refresh token manquant." });
    return;
  }

  // Vérifier que le refresh token existe, n'est pas révoqué et n'est pas expiré
  const tokenRow = await queryOne<{
    user_id: string;
    expires_at: Date;
    revoked_at: Date | null;
  }>(
    `SELECT user_id, expires_at, revoked_at FROM refresh_tokens WHERE token = $1`,
    [refreshToken],
  );

  if (!tokenRow || tokenRow.revoked_at || new Date() > tokenRow.expires_at) {
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/" });
    res
      .status(401)
      .json({ error: "Session expirée, veuillez vous reconnecter." });
    return;
  }

  // Récupérer les informations de l'utilisateur pour créer un nouveau access token
  const userRow = await queryOne<UserRow>(
    `SELECT id, name, email, role, store_id, organization_id, is_active FROM users WHERE id = $1`,
    [tokenRow.user_id],
  );

  if (!userRow || !userRow.is_active) {
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/" });
    res.status(403).json({ error: "Compte désactivé ou introuvable." });
    return;
  }

  // Créer un nouveau access token
  const newToken = signToken({
    userId: userRow.id,
    name: userRow.name,
    role: userRow.role,
    storeId: userRow.store_id,
    organizationId: userRow.organization_id,
  });

  // Poser le nouveau cookie access_token
  res.cookie("access_token", newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 24h
    path: "/",
  });

  res.json({ refreshed: true });
});
