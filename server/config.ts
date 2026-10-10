/**
 * Configuration serveur — chargement des variables d'environnement
 * et constantes de sécurité.
 */
import "dotenv/config";

const required = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. ` +
        `Renseignez-la dans le fichier .env (voir .env.example).`,
    );
  }
  return value;
};

const nodeEnv = process.env.NODE_ENV || "development";

/**
 * P0-5 : en production, DATABASE_URL est OBLIGATOIRE — aucun fallback
 * vers une base mock silencieuse n'est toléré (fail-fast au chargement).
 */
const databaseUrl = (() => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (nodeEnv === "production") {
      throw new Error(
        "[config] ❌ Variable d'environnement manquante : DATABASE_URL. " +
          "En production, la connexion Neon est obligatoire (aucun fallback mock).",
      );
    }
    return "postgres://localhost:5432/mock";
  }
  return url;
})();

export const config = {
  /** URL de connexion Neon (Postgres serverless). */
  databaseUrl,
  /** Secret de signature des JWT. En production, doit être long et aléatoire. */
  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  /** Durée de validité d'un jeton de session. */
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  /** Port d'écoute du serveur API. */
  port: Number(process.env.PORT || 4000),
  /** Origines autorisées pour le front (CORS). */
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  nodeEnv,
  // Secrets webhooks Mobile Money pour vérification des signatures
  waveWebhookSecret: required("WAVE_WEBHOOK_SECRET", "dev-wave-webhook-secret"),
  orangeMoneyWebhookSecret: required(
    "ORANGE_MONEY_WEBHOOK_SECRET",
    "dev-om-webhook-secret",
  ),
  mtnMomoWebhookSecret: required(
    "MTN_MOMO_WEBHOOK_SECRET",
    "dev-mtn-webhook-secret",
  ),
} as const;

export const isProduction = config.nodeEnv === "production";
