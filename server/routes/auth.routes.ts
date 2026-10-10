/**
 * Routes d'authentification avancées — compatibles Neon Auth.
 *
 * Flux d'authentification complet :
 * - POST /api/auth/register          — inscription + envoi OTP de vérification
 * - POST /api/auth/verify-email      — vérification de l'email par OTP
 * - POST /api/auth/resend-verification — renvoi du code OTP
 * - POST /api/auth/login             — connexion (avec protection brute-force)
 * - POST /api/auth/forgot-password   — demande de réinitialisation (envoi email)
 * - POST /api/auth/reset-password    — réinitialisation effective
 * - POST /api/auth/change-password   — changement de mot de passe (authentifié)
 * - GET  /api/auth/me                — profil de l'utilisateur courant
 * - POST /api/auth/logout            — déconnexion + révocation refresh token
 * - POST /api/auth/refresh           — renouvellement de l'access token
 * - GET  /api/auth/users             — liste des utilisateurs (gérant)
 */
import { Router } from "express";
import bcrypt from "bcryptjs";
import { query, queryOne } from "../db";
import {
  signToken,
  generateRefreshToken,
  requireAuth,
  hashPassword,
  PERMISSIONS,
  type AuthedRequest,
  type Role,
} from "../auth";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  generateOTP,
  generateSecureToken,
} from "../services/emailService";

export const authRouter = Router();

// ═══════════════════════════════════════════════════════════════
// MODE MOCK — Fallback quand la base de données n'est pas accessible
// ═══════════════════════════════════════════════════════════════
let dbAvailable: boolean | null = null;

/** Teste la connectivité à la base de données. */
async function checkDbAvailability(): Promise<boolean> {
  if (dbAvailable !== null) return dbAvailable;
  try {
    await query(`SELECT 1`);
    dbAvailable = true;
  } catch {
    console.warn(
      "[auth] ⚠️  Base de données indisponible — activation du mode mock (comptes de démo)",
    );
    dbAvailable = false;
  }
  return dbAvailable;
}

/** Comptes de démonstration en mémoire (utilisés quand la DB est inaccessible). */
const MOCK_USERS: Array<{
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  store_id: string;
  organization_id: string;
  email_verified_at: Date;
}> = [
  {
    id: "mock-gerant",
    name: "Aminata Koné",
    email: "gerant@boulangeriepro.ci",
    password: "gerant123",
    role: "gerant",
    store_id: "store-1",
    organization_id: "org-1",
    email_verified_at: new Date(),
  },
  {
    id: "mock-caissier",
    name: "Ibrahim Diallo",
    email: "caissier@boulangeriepro.ci",
    password: "caisse123",
    role: "caissier",
    store_id: "store-1",
    organization_id: "org-1",
    email_verified_at: new Date(),
  },
  {
    id: "mock-boulanger",
    name: "Moussa Traoré",
    email: "boulanger@boulangeriepro.ci",
    password: "fournil123",
    role: "boulanger",
    store_id: "store-1",
    organization_id: "org-1",
    email_verified_at: new Date(),
  },
  {
    id: "mock-magasinier",
    name: "Fatou Bamba",
    email: "magasinier@boulangeriepro.ci",
    password: "stock123",
    role: "magasinier",
    store_id: "store-1",
    organization_id: "org-1",
    email_verified_at: new Date(),
  },
];

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const OTP_DURATION_MINUTES = 15;
const RESET_TOKEN_DURATION_HOURS = 1;

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  store_id: string | null;
  organization_id: string | null;
  is_active: boolean;
  email_verified_at: Date | null;
  failed_login_attempts: number;
  locked_until: Date | null;
}

/** Construit la réponse utilisateur standard avec permissions. */
function buildUserResponse(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  store_id: string | null;
  organization_id: string | null;
  email_verified_at?: Date | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    storeId: user.store_id,
    organizationId: user.organization_id,
    emailVerified: Boolean(user.email_verified_at),
    permissions: Object.entries(PERMISSIONS)
      .filter(([, roles]) => (roles as readonly Role[]).includes(user.role))
      .map(([key]) => key),
  };
}

function getCookieSecurity(res: any) {
  const forwardedProto = res.req?.headers?.["x-forwarded-proto"];
  const host = res.req?.headers?.host || "";
  const isHttps = forwardedProto === "https" || res.req?.protocol === "https";
  const isProd = process.env.NODE_ENV === "production";
  const isNonLocal = Boolean(host && !host.startsWith("localhost"));
  const isSecure = Boolean(isHttps || isProd || isNonLocal);
  return {
    secure: isSecure,
    sameSite: isSecure ? ("none" as const) : ("lax" as const),
  };
}

/** Pose les cookies de session (access + refresh tokens). */
function setSessionCookies(res: any, accessToken: string, refreshToken: string) {
  const { secure, sameSite } = getCookieSecurity(res);
  
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 24 * 60 * 60 * 1000, // 24h
    path: "/",
  });
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    path: "/",
  });
}

/** Enregistre un refresh token en base. */
async function createRefreshToken(userId: string): Promise<string> {
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await query(
    `INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [refreshToken, userId, expiresAt],
  );
  return refreshToken;
}

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/register — Inscription
// ═══════════════════════════════════════════════════════════════
authRouter.post("/register", async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    bakeryName,
    establishmentType,
    city,
    pointsOfSale,
  } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    bakeryName?: string;
    establishmentType?: string;
    city?: string;
    pointsOfSale?: string;
  };

  // Validation
  if (!name || !email || !password) {
    res.status(400).json({
      success: false,
      error: "Nom, e-mail et mot de passe requis.",
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({
      success: false,
      error: "Le mot de passe doit contenir au moins 8 caractères.",
    });
    return;
  }

  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    res.status(400).json({
      success: false,
      error: "Adresse e-mail invalide.",
    });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // ─── MODE MOCK ─────────────────────────────────────────
  const isDbUp = await checkDbAvailability();
  if (!isDbUp) {
    // Vérifier si l'email est déjà utilisé dans les mocks
    const existingMock = MOCK_USERS.find((u) => u.email === normalizedEmail);
    if (existingMock) {
      res.status(409).json({
        success: false,
        error: "Un compte existe déjà avec cette adresse.",
      });
      return;
    }
    // Créer un utilisateur mock en mémoire
    const mockId = `mock-${Date.now()}`;
    const newMockUser = {
      id: mockId,
      name,
      email: normalizedEmail,
      password,
      role: "gerant" as Role,
      store_id: "store-1",
      organization_id: `org-${Date.now()}`,
      email_verified_at: new Date(),
    };
    MOCK_USERS.push(newMockUser);

    // Auto-login
    const token = signToken({
      userId: mockId,
      name,
      role: "gerant",
      storeId: "store-1",
      organizationId: newMockUser.organization_id,
    });
    const cookieSec = getCookieSecurity(res);
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: cookieSec.secure,
      sameSite: cookieSec.sameSite,
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });
    console.log(`[mock] 📧 Email de vérification OTP envoyé à ${normalizedEmail} (mode mock)`);
    res.status(201).json({
      success: true,
      message: "Votre compte a été créé. Un code de vérification a été envoyé à votre adresse e-mail.",
      data: {
        userId: mockId,
        email: normalizedEmail,
        emailVerified: false,
      },
    });
    return;
  }
  // ─── FIN MODE MOCK ─────────────────────────────────────

  // Vérifier l'unicité de l'email
  const existingUser = await queryOne<{ id: string }>(
    `SELECT id FROM users WHERE email = $1`,
    [normalizedEmail],
  );

  if (existingUser) {
    res.status(409).json({
      success: false,
      error:
        "Un compte existe déjà avec cette adresse. Connectez-vous ou utilisez la procédure de récupération de compte.",
    });
    return;
  }

  try {
    const passwordHash = hashPassword(password);
    const orgId = `org-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const userId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Générer le code OTP de vérification
    const otp = generateOTP();
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + OTP_DURATION_MINUTES);

    // Créer l'organisation
    await query(
      `INSERT INTO organizations (id, name, slug, contact_email, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())`,
      [
        orgId,
        bakeryName || name,
        `org-${Date.now()}`,
        normalizedEmail,
      ],
    );

    // Créer l'utilisateur (non vérifié)
    await query(
      `INSERT INTO users (
        id, name, email, password_hash, role, phone, bakery_name,
        establishment_type, city, points_of_sale, organization_id,
        is_active, email_verification_token, email_verification_expires_at,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, 'gerant', $5, $6, $7, $8, $9, $10,
                true, $11, $12, now(), now())`,
      [
        userId,
        name,
        normalizedEmail,
        passwordHash,
        phone || null,
        bakeryName || null,
        establishmentType || null,
        city || null,
        pointsOfSale || null,
        orgId,
        otp,
        otpExpiresAt,
      ],
    );

    // Envoyer l'email de vérification
    await sendVerificationEmail(normalizedEmail, otp, name);

    res.status(201).json({
      success: true,
      message:
        "Votre compte a été créé. Un code de vérification a été envoyé à votre adresse e-mail.",
      data: {
        userId,
        email: normalizedEmail,
        emailVerified: false,
      },
    });
  } catch (err) {
    console.error("Erreur lors de l'inscription :", err);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la création du compte. Veuillez réessayer.",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/verify-email — Vérification par OTP
// ═══════════════════════════════════════════════════════════════
authRouter.post("/verify-email", async (req, res) => {
  const { email, otp } = req.body as { email?: string; otp?: string };

  if (!email || !otp) {
    res.status(400).json({
      success: false,
      error: "Adresse e-mail et code de vérification requis.",
    });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // ─── MODE MOCK ─────────────────────────────────────────
  const isDbUp = await checkDbAvailability();
  if (!isDbUp) {
    const mockUser = MOCK_USERS.find((u) => u.email === normalizedEmail);
    if (!mockUser) {
      res.status(404).json({ success: false, error: "Utilisateur introuvable." });
      return;
    }
    // En mode mock, accepter n'importe quel OTP à 6 chiffres
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      res.status(400).json({ success: false, error: "Code de vérification incorrect." });
      return;
    }
    const token = signToken({
      userId: mockUser.id,
      name: mockUser.name,
      role: mockUser.role,
      storeId: mockUser.store_id,
      organizationId: mockUser.organization_id,
    });
    const cookieSec = getCookieSecurity(res);
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: cookieSec.secure,
      sameSite: cookieSec.sameSite,
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });
    res.json({
      success: true,
      message: "Adresse e-mail vérifiée avec succès. Bienvenue !",
      data: {
        user: buildUserResponse({
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          store_id: mockUser.store_id,
          organization_id: mockUser.organization_id,
          email_verified_at: new Date(),
        }),
      },
    });
    return;
  }
  // ─── FIN MODE MOCK ─────────────────────────────────────

  const user = await queryOne<{
    id: string;
    name: string;
    email: string;
    role: Role;
    store_id: string | null;
    organization_id: string | null;
    email_verification_token: string | null;
    email_verification_expires_at: Date | null;
    email_verified_at: Date | null;
  }>(
    `SELECT id, name, email, role, store_id, organization_id,
            email_verification_token, email_verification_expires_at, email_verified_at
     FROM users WHERE email = $1`,
    [normalizedEmail],
  );

  if (!user) {
    res.status(404).json({ success: false, error: "Utilisateur introuvable." });
    return;
  }

  if (user.email_verified_at) {
    res.status(400).json({
      success: false,
      error: "Cette adresse e-mail est déjà vérifiée.",
    });
    return;
  }

  if (
    !user.email_verification_token ||
    user.email_verification_token !== otp
  ) {
    res.status(400).json({
      success: false,
      error: "Code de vérification incorrect.",
    });
    return;
  }

  if (
    !user.email_verification_expires_at ||
    new Date() > user.email_verification_expires_at
  ) {
    res.status(400).json({
      success: false,
      error:
        "Le code de vérification a expiré. Veuillez demander un nouveau code.",
    });
    return;
  }

  // Vérification réussie
  await query(
    `UPDATE users SET
      email_verified_at = now(),
      email_verification_token = NULL,
      email_verification_expires_at = NULL,
      updated_at = now()
    WHERE id = $1`,
    [user.id],
  );

  // Créer une session (auto-login après vérification)
  const token = signToken({
    userId: user.id,
    name: user.name,
    role: user.role,
    storeId: user.store_id,
    organizationId: user.organization_id,
  });
  const refreshToken = await createRefreshToken(user.id);
  setSessionCookies(res, token, refreshToken);

  // Envoyer l'email de bienvenue (asynchrone)
  sendWelcomeEmail(user.email, user.name).catch(console.error);

  res.json({
    success: true,
    message: "Adresse e-mail vérifiée avec succès. Bienvenue !",
    data: {
      user: buildUserResponse({
        ...user,
        email_verified_at: new Date(),
      }),
    },
  });
});

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/resend-verification — Renvoi du code OTP
// ═══════════════════════════════════════════════════════════════
authRouter.post("/resend-verification", async (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email) {
    res.status(400).json({ success: false, error: "Adresse e-mail requise." });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // ─── MODE MOCK ─────────────────────────────────────────
  const isDbUp = await checkDbAvailability();
  if (!isDbUp) {
    const mockUser = MOCK_USERS.find((u) => u.email === normalizedEmail);
    if (mockUser) {
      console.log(`[mock] 📧 Code OTP de vérification renvoyé à ${normalizedEmail}`);
    }
    res.json({
      success: true,
      message: "Si un compte correspond à cette adresse, un nouveau code de vérification a été envoyé.",
    });
    return;
  }
  // ─── FIN MODE MOCK ─────────────────────────────────────

  const user = await queryOne<{
    id: string;
    name: string;
    email: string;
    email_verified_at: Date | null;
  }>(
    `SELECT id, name, email, email_verified_at FROM users WHERE email = $1`,
    [normalizedEmail],
  );

  if (!user) {
    // Ne pas révéler si l'email existe ou non (sécurité)
    res.json({
      success: true,
      message:
        "Si un compte correspond à cette adresse, un nouveau code de vérification a été envoyé.",
    });
    return;
  }

  if (user.email_verified_at) {
    res.json({
      success: true,
      message: "Cette adresse e-mail est déjà vérifiée.",
    });
    return;
  }

  // Générer un nouveau OTP
  const otp = generateOTP();
  const otpExpiresAt = new Date();
  otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + OTP_DURATION_MINUTES);

  await query(
    `UPDATE users SET
      email_verification_token = $1,
      email_verification_expires_at = $2,
      updated_at = now()
    WHERE id = $3`,
    [otp, otpExpiresAt, user.id],
  );

  await sendVerificationEmail(user.email, otp, user.name);

  res.json({
    success: true,
    message:
      "Si un compte correspond à cette adresse, un nouveau code de vérification a été envoyé.",
  });
});

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/login — Connexion avec protection brute-force
// ═══════════════════════════════════════════════════════════════
authRouter.post("/login", async (req, res) => {
  console.log("[auth] POST /login - email:", req.body?.email);
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: "E-mail et mot de passe requis.",
    });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // ─── MODE MOCK ─────────────────────────────────────────
  const isDbUp = await checkDbAvailability();
  if (!isDbUp) {
    const mockUser = MOCK_USERS.find(
      (u) => u.email === normalizedEmail && u.password === password,
    );
    if (!mockUser) {
      res.status(401).json({
        success: false,
        error: "Adresse e-mail ou mot de passe incorrect.",
      });
      return;
    }
    const token = signToken({
      userId: mockUser.id,
      name: mockUser.name,
      role: mockUser.role,
      storeId: mockUser.store_id,
      organizationId: mockUser.organization_id,
    });
    // En mode mock, on pose juste l'access token (pas de refresh token en DB)
    const cookieSec = getCookieSecurity(res);
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: cookieSec.secure,
      sameSite: cookieSec.sameSite,
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });
    res.json({
      success: true,
      message: "Connexion réussie. Bienvenue dans votre espace professionnel.",
      data: {
        token,
        user: buildUserResponse({
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          store_id: mockUser.store_id,
          organization_id: mockUser.organization_id,
          email_verified_at: mockUser.email_verified_at,
        }),
      },
    });
    return;
  }
  // ─── FIN MODE MOCK ─────────────────────────────────────

  const user = await queryOne<UserRow>(
    `SELECT id, name, email, password_hash, role, store_id, organization_id,
            is_active, email_verified_at, failed_login_attempts, locked_until
     FROM users WHERE email = $1`,
    [normalizedEmail],
  );
  console.log("[auth] User found:", !!user, "active:", user?.is_active, "locked:", user?.locked_until);

  // Vérifier si le compte est verrouillé (protection brute-force)
  if (user?.locked_until && new Date() < user.locked_until) {
    const remainingMinutes = Math.ceil(
      (user.locked_until.getTime() - Date.now()) / 60000,
    );
    res.status(429).json({
      success: false,
      error: `Trop de tentatives de connexion. Réessayez dans ${remainingMinutes} minute(s).`,
    });
    return;
  }

  // Vérifier les identifiants
  const passwordMatch = user ? bcrypt.compareSync(password, user.password_hash) : false;
  console.log("[auth] Password match:", passwordMatch);
  if (!user || !passwordMatch) {
    // Incrémenter le compteur de tentatives échouées
    if (user) {
      const newAttempts = (user.failed_login_attempts || 0) + 1;

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        // Verrouiller le compte
        const lockedUntil = new Date();
        lockedUntil.setMinutes(
          lockedUntil.getMinutes() + LOCK_DURATION_MINUTES,
        );
        await query(
          `UPDATE users SET failed_login_attempts = $1, locked_until = $2, updated_at = now() WHERE id = $3`,
          [newAttempts, lockedUntil, user.id],
        );
        res.status(429).json({
          success: false,
          error: `Trop de tentatives échouées. Votre compte est verrouillé pendant ${LOCK_DURATION_MINUTES} minutes.`,
        });
        return;
      }

      await query(
        `UPDATE users SET failed_login_attempts = $1, updated_at = now() WHERE id = $2`,
        [newAttempts, user.id],
      );
    }

    res.status(401).json({
      success: false,
      error: "Adresse e-mail ou mot de passe incorrect.",
    });
    return;
  }

  if (!user.is_active) {
    res.status(403).json({
      success: false,
      error: "Compte désactivé. Contactez le gérant.",
    });
    return;
  }

  // Connexion réussie : réinitialiser les tentatives et mettre à jour last_login
  await query(
    `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = now(), updated_at = now() WHERE id = $1`,
    [user.id],
  );

  // Créer la session
  const token = signToken({
    userId: user.id,
    name: user.name,
    role: user.role,
    storeId: user.store_id,
    organizationId: user.organization_id,
  });
  const refreshToken = await createRefreshToken(user.id);
  setSessionCookies(res, token, refreshToken);

  console.log("[auth] ✅ Login réussi:", user.name);
  res.json({
    success: true,
    message: "Connexion réussie. Bienvenue dans votre espace professionnel.",
    data: {
      token,
      user: buildUserResponse(user),
    },
  });
});

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/forgot-password — Demande de réinitialisation
// ═══════════════════════════════════════════════════════════════
authRouter.post("/forgot-password", async (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email) {
    res.status(400).json({ success: false, error: "Adresse e-mail requise." });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // ─── MODE MOCK ─────────────────────────────────────────
  const isDbUp = await checkDbAvailability();
  if (!isDbUp) {
    console.log(`[mock] 📧 Email de réinitialisation demandé pour ${normalizedEmail}`);
    res.json({
      success: true,
      message: "Si un compte correspond à cette adresse, vous recevrez un message contenant les instructions nécessaires.",
    });
    return;
  }
  // ─── FIN MODE MOCK ─────────────────────────────────────

  const user = await queryOne<{ id: string; name: string; email: string }>(
    `SELECT id, name, email FROM users WHERE email = $1`,
    [normalizedEmail],
  );

  // Toujours répondre avec succès (ne pas révéler si l'email existe)
  if (user) {
    const resetToken = generateSecureToken();
    const resetExpiresAt = new Date();
    resetExpiresAt.setHours(
      resetExpiresAt.getHours() + RESET_TOKEN_DURATION_HOURS,
    );

    await query(
      `UPDATE users SET password_reset_token = $1, password_reset_expires_at = $2, updated_at = now() WHERE id = $3`,
      [resetToken, resetExpiresAt, user.id],
    );

    await sendPasswordResetEmail(user.email, resetToken, user.name);
  }

  res.json({
    success: true,
    message:
      "Si un compte correspond à cette adresse, vous recevrez un message contenant les instructions nécessaires.",
  });
});

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/reset-password — Réinitialisation effective
// ═══════════════════════════════════════════════════════════════
authRouter.post("/reset-password", async (req, res) => {
  const { token, password } = req.body as {
    token?: string;
    password?: string;
  };

  if (!token || !password) {
    res.status(400).json({
      success: false,
      error: "Token de réinitialisation et nouveau mot de passe requis.",
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({
      success: false,
      error: "Le mot de passe doit contenir au moins 8 caractères.",
    });
    return;
  }

  const user = await queryOne<{
    id: string;
    name: string;
    email: string;
    role: Role;
    store_id: string | null;
    organization_id: string | null;
    password_reset_token: string | null;
    password_reset_expires_at: Date | null;
  }>(
    `SELECT id, name, email, role, store_id, organization_id,
            password_reset_token, password_reset_expires_at
     FROM users WHERE password_reset_token = $1`,
    [token],
  );

  if (!user) {
    res.status(400).json({
      success: false,
      error: "Lien de réinitialisation invalide ou expiré.",
    });
    return;
  }

  if (
    !user.password_reset_expires_at ||
    new Date() > user.password_reset_expires_at
  ) {
    res.status(400).json({
      success: false,
      error: "Le lien de réinitialisation a expiré. Veuillez en demander un nouveau.",
    });
    return;
  }

  // Mettre à jour le mot de passe
  const passwordHash = hashPassword(password);
  await query(
    `UPDATE users SET
      password_hash = $1,
      password_reset_token = NULL,
      password_reset_expires_at = NULL,
      failed_login_attempts = 0,
      locked_until = NULL,
      updated_at = now()
    WHERE id = $2`,
    [passwordHash, user.id],
  );

  // Révoquer tous les refresh tokens existants (sécurité)
  await query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
    [user.id],
  );

  // Auto-login après réinitialisation
  const accessToken = signToken({
    userId: user.id,
    name: user.name,
    role: user.role,
    storeId: user.store_id,
    organizationId: user.organization_id,
  });
  const refreshToken = await createRefreshToken(user.id);
  setSessionCookies(res, accessToken, refreshToken);

  res.json({
    success: true,
    message: "Mot de passe réinitialisé avec succès.",
    data: {
      user: buildUserResponse(user),
    },
  });
});

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/change-password — Changement de mot de passe
// ═══════════════════════════════════════════════════════════════
authRouter.post(
  "/change-password",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: "Mot de passe actuel et nouveau mot de passe requis.",
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      });
      return;
    }

    const user = await queryOne<{ id: string; password_hash: string }>(
      `SELECT id, password_hash FROM users WHERE id = $1`,
      [req.user!.userId],
    );

    if (!user) {
      res.status(404).json({
        success: false,
        error: "Utilisateur introuvable.",
      });
      return;
    }

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      res.status(400).json({
        success: false,
        error: "Mot de passe actuel incorrect.",
      });
      return;
    }

    const newPasswordHash = hashPassword(newPassword);
    await query(
      `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
      [newPasswordHash, user.id],
    );

    // Révoquer tous les autres refresh tokens (garder la session courante)
    const currentRefreshToken = req.cookies?.refresh_token;
    if (currentRefreshToken) {
      await query(
        `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND token != $2 AND revoked_at IS NULL`,
        [user.id, currentRefreshToken],
      );
    }

    res.json({
      success: true,
      message: "Mot de passe modifié avec succès.",
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// GET /api/auth/me — Profil de l'utilisateur courant
// ═══════════════════════════════════════════════════════════════
authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = req.user!;

  // ─── MODE MOCK ─────────────────────────────────────────
  const isDbUp = await checkDbAvailability();
  if (!isDbUp) {
    const mockUser = MOCK_USERS.find((u) => u.id === user.userId);
    if (!mockUser) {
      res.status(404).json({ success: false, error: "Utilisateur introuvable." });
      return;
    }
    res.json({
      success: true,
      data: buildUserResponse({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        store_id: mockUser.store_id,
        organization_id: mockUser.organization_id,
        email_verified_at: mockUser.email_verified_at,
      }),
    });
    return;
  }
  // ─── FIN MODE MOCK ─────────────────────────────────────

  const row = await queryOne<{
    id: string;
    name: string;
    email: string;
    role: Role;
    store_id: string | null;
    organization_id: string | null;
    email_verified_at: Date | null;
  }>(
    `SELECT id, name, email, role, store_id, organization_id, email_verified_at
     FROM users WHERE id = $1`,
    [user.userId],
  );

  if (!row) {
    res.status(404).json({ success: false, error: "Utilisateur introuvable." });
    return;
  }

  res.json({
    success: true,
    data: buildUserResponse(row),
  });
});

// ═══════════════════════════════════════════════════════════════
// GET /api/auth/users — Liste des utilisateurs (gérant)
// ═══════════════════════════════════════════════════════════════
authRouter.get("/users", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user?.role !== "gerant") {
    res.status(403).json({ success: false, error: "Accès réservé au gérant." });
    return;
  }
  const rows = await query(
    `SELECT id, name, email, role, store_id, is_active, email_verified_at,
            last_login_at, created_at
     FROM users
     WHERE organization_id = $1
     ORDER BY created_at DESC`,
    [req.user.organizationId],
  );
  res.json({ success: true, data: rows });
});

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/logout — Déconnexion
// ═══════════════════════════════════════════════════════════════
authRouter.post("/logout", requireAuth, async (req: AuthedRequest, res) => {
  // ─── MODE MOCK ─────────────────────────────────────────
  const isDbUp = await checkDbAvailability();
  if (!isDbUp) {
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/" });
    res.json({ success: true, message: "Déconnexion réussie." });
    return;
  }
  // ─── FIN MODE MOCK ─────────────────────────────────────

  const refreshToken = req.cookies?.refresh_token;

  if (refreshToken) {
    await query(
      `UPDATE refresh_tokens SET revoked_at = now() WHERE token = $1`,
      [refreshToken],
    );
  }

  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });

  res.json({ success: true, message: "Déconnexion réussie." });
});

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/refresh — Renouvellement de l'access token
// ═══════════════════════════════════════════════════════════════
authRouter.post("/refresh", async (req, res) => {
  // ─── MODE MOCK ─────────────────────────────────────────
  const isDbUp = await checkDbAvailability();
  if (!isDbUp) {
    // En mode mock, vérifier l'access token existant
    const token = req.cookies?.access_token;
    if (!token) {
      res.status(401).json({ success: false, error: "Session expirée." });
      return;
    }
    try {
      const jwt = await import("jsonwebtoken");
      const { config } = await import("../config");
      const payload = jwt.default.verify(token, config.jwtSecret) as any;
      // Renouveler le token
      const newToken = signToken({
        userId: payload.userId,
        name: payload.name,
        role: payload.role,
        storeId: payload.storeId,
        organizationId: payload.organizationId,
      });
      const cookieSec = getCookieSecurity(res);
      res.cookie("access_token", newToken, {
        httpOnly: true,
        secure: cookieSec.secure,
        sameSite: cookieSec.sameSite,
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      });
      res.json({ success: true, refreshed: true });
    } catch {
      res.status(401).json({ success: false, error: "Session expirée, veuillez vous reconnecter." });
    }
    return;
  }
  // ─── FIN MODE MOCK ─────────────────────────────────────

  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    res.status(401).json({ success: false, error: "Refresh token manquant." });
    return;
  }

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
    res.status(401).json({
      success: false,
      error: "Session expirée, veuillez vous reconnecter.",
    });
    return;
  }

  const userRow = await queryOne<UserRow>(
    `SELECT id, name, email, role, store_id, organization_id, is_active,
            email_verified_at, failed_login_attempts, locked_until
    FROM users WHERE id = $1`,
    [tokenRow.user_id],
  );

  if (!userRow || !userRow.is_active) {
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/" });
    res.status(403).json({
      success: false,
      error: "Compte désactivé ou introuvable.",
    });
    return;
  }

  const newToken = signToken({
    userId: userRow.id,
    name: userRow.name,
    role: userRow.role,
    storeId: userRow.store_id,
    organizationId: userRow.organization_id,
  });

  res.cookie("access_token", newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });

  res.json({ success: true, refreshed: true });
});
