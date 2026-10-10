/**
 * Point d'entrée du serveur API BoulangeriePro.
 *
 * Responsabilités :
 * - exposer l'API REST consommée par le front (React/Vite) ;
 * - authentifier les utilisateurs et appliquer les rôles ;
 * - servir la compilation statique du front en production.
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { config } from "./config";
import { query } from "./db";
import { requireAuth } from "./auth";
import { authRouter } from "./routes/auth.routes";
import { catalogRouter } from "./routes/catalog.routes";
import { operationsRouter } from "./routes/operations.routes";
import { adminRouter } from "./routes/admin.routes";
import { reportsRouter } from "./routes/reports.routes";

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
// Parser les cookies pour accéder à req.cookies (utilisé pour le token HttpOnly et CSRF)
app.use(cookieParser());

// 🔒 Rate limiting global (SEC-004) - Protection générale contre les attaques DDoS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limite chaque IP à 500 requêtes par 15min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes, réessayez plus tard." },
});

// 🔒 Rate limiting strict sur les routes d'authentification (contre brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Seulement 20 tentatives de connexion/inscription par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Trop de tentatives d'authentification, réessayez dans 15min.",
  },
});

// Appliquer le rate limiting global
app.use(globalLimiter);

// Protection CSRF : le middleware `csurf` (abandonné, et jamais installé —
// il empêchait tout démarrage du serveur) est remplacé par la stratégie
// SameSite=strict sur les cookies de session, déjà appliquée via
// `cookieSecurity()` dans routes/auth.routes.ts. L'API étant same-origin,
// SameSite=strict bloque les requêtes cross-site (CSRF). Les endpoints
// /api/csrf-token sont conservés en stub pour compatibilité front à venir.
app.get("/api/csrf-token", (_req, res) => {
  res.json({ csrfToken: null, mode: "samesite-strict" });
});

// Appliquer le rate limiting strict sur les routes d'authentification
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/verify-email", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

// Route webhook sans vérification d'authentification (requis par les APIs Mobile Money)
app.use(
  "/api/webhooks",
  express.raw({ type: "application/json", limit: "2mb" }),
);
// Autres routes avec parsing JSON standard
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/webhooks")) return next();
  express.json({ limit: "2mb" })(req, res, next);
});

// Clients SSE connectés
const sseClients = new Set<express.Response>();

// Route SSE pour recevoir les mises à jour en temps réel
app.get("/api/sse/mobilemoney", (req, res) => {
  // Configurer les headers SSE
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": config.corsOrigin,
  });

  // Ajouter le client à la liste
  sseClients.add(res);

  // Retirer le client quand il se déconnecte
  req.on("close", () => {
    sseClients.delete(res);
  });
});

/** Vérifie la signature du webhook selon les spécifications de chaque opérateur */
function verifyWebhookSignature(
  operator: string,
  payload: string,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader) return false;

  try {
    switch (operator) {
      case "WAVE": {
        const waveHmac = crypto.createHmac("sha256", secret);
        const waveSignature = waveHmac.update(payload).digest("hex");
        return crypto.timingSafeEqual(
          Buffer.from(waveSignature),
          Buffer.from(signatureHeader),
        );
      }
      case "ORANGE_MONEY": {
        const orangeHmac = crypto.createHmac("sha256", secret);
        const orangeSignature = orangeHmac.update(payload).digest("hex");
        return crypto.timingSafeEqual(
          Buffer.from(orangeSignature),
          Buffer.from(signatureHeader),
        );
      }
      case "MTN_MOMO": {
        const mtnHmac = crypto.createHmac("sha512", secret);
        const mtnSignature = mtnHmac.update(payload).digest("base64");
        return crypto.timingSafeEqual(
          Buffer.from(mtnSignature),
          Buffer.from(signatureHeader),
        );
      }
      default:
        return false;
    }
  } catch (error) {
    console.error("Erreur vérification signature:", error);
    return false;
  }
}

// Webhooks Mobile Money (recevoir les mises à jour de statut en temps réel)
app.post("/api/webhooks/mobilemoney/:operator", async (req, res) => {
  try {
    const rawPayload = req.body.toString();
    const payload = JSON.parse(rawPayload);
    const operator = req.params.operator.toUpperCase();

    console.log(`Webhook reçu de ${operator}:`, payload);

    const validOperators = ["WAVE", "ORANGE_MONEY", "MTN_MOMO"];
    if (!validOperators.includes(operator)) {
      return res.status(400).json({ error: "Opérateur invalide" });
    }

    const webhookSecrets: Record<string, string> = {
      WAVE: config.waveWebhookSecret,
      ORANGE_MONEY: config.orangeMoneyWebhookSecret,
      MTN_MOMO: config.mtnMomoWebhookSecret,
    };
    const secret = webhookSecrets[operator];

    const signatureHeader = req.headers[
      `x-${operator.toLowerCase()}-signature`
    ] as string;

    const isSignatureValid = verifyWebhookSignature(
      operator,
      rawPayload,
      signatureHeader,
      secret,
    );

    if (!isSignatureValid) {
      console.error(`Signature invalide reçue de ${operator}`);
      return res.status(403).json({ error: "Signature invalide" });
    }

    console.log(`✅ Signature webhook ${operator} vérifiée avec succès`);

    const transactionId = payload.externalId || payload.orderId;
    if (transactionId) {
      const update = {
        operator,
        transactionId,
        status: payload.status || payload.paymentStatus,
        reason: payload.reason,
        timestamp: new Date().toISOString(),
      };

      sseClients.forEach((client) => {
        client.write(`data: ${JSON.stringify(update)}\n\n`);
      });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Erreur traitement webhook:", error);
    res.status(500).json({ error: "Erreur interne serveur" });
  }
});

// Sonde de disponibilité (monitoring).
// P0-5 : le statut reflète l'état réel de la base — en cas d'indisponibilité,
// réponse 503 {status:"down"} pour que les orchestrateurs/monitoring réagissent.
app.get("/api/health", async (_req, res) => {
  try {
    await query("SELECT 1");
    res.status(200).json({ status: "ok", service: "boulangeriepro-api", db: "up" });
  } catch {
    res.status(503).json({
      status: "down",
      service: "boulangeriepro-api",
      db: "unreachable",
    });
  }
});

// Routes d'authentification : /login, /register, /verify-email, /resend-verification, /forgot-password, /reset-password, /refresh sont publiques
app.use("/api/auth", authRouter);

// Middleware global d'authentification : TOUTES les autres routes API nécessitent une authentification
app.use((req, res, next) => {
  // Exclusions : webhooks, et les routes d'auth déjà traitées
  if (
    req.path.startsWith("/api/webhooks") ||
    req.path.startsWith("/api/sse/") ||
    req.path === "/api/health" ||
    req.path === "/api/auth/login" ||
    req.path === "/api/auth/register" ||
    req.path === "/api/auth/verify-email" ||
    req.path === "/api/auth/resend-verification" ||
    req.path === "/api/auth/forgot-password" ||
    req.path === "/api/auth/reset-password" ||
    req.path === "/api/auth/refresh" ||
    req.path === "/api/csrf-token"
  ) {
    return next();
  }
  // Toutes les autres routes passent par requireAuth
  requireAuth(req as any, res, next);
});

// Monter les autres routes (elles seront protégées par le middleware global)
// Données de référentiel : produits, matières, recettes, clients, fournisseurs…
app.use("/api/catalog", catalogRouter);

// Opérations métier : ventes, production, achats, pertes, caisse…
app.use("/api/operations", operationsRouter);

// Administration : paramètres de l'entreprise, utilisateurs, sauvegarde.
app.use("/api", adminRouter);

// Reporting : statistiques du tableau de bord.
app.use("/api", reportsRouter);

// Gestionnaire d'erreurs centralisé.
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("[api] erreur non gérée :", err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  },
);

app.listen(config.port, () => {
  console.log(
    `[api] BoulangeriePro API à l'écoute sur http://localhost:${config.port} (${config.nodeEnv})`,
  );
});

export { app };
