/**
 * Couche d'accès à la base de données.
 *
 * Utilise Neon (Postgres serverless) en production.
 * Bascule automatiquement vers une base locale (JSON) quand Neon n'est pas accessible
 * (sandbox, développement hors-ligne, etc.).
 *
 * L'interface publique (query, queryOne, transaction) reste identique dans les deux modes.
 */
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { config } from "./config";
import { mockQuery, mockQueryOne } from "./mockDb";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let useMockDb = false;

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════
export type SqlRunner = <T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
) => Promise<T[]>;

export type SqlRunnerOne = <T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
) => Promise<T | null>;

export interface SqlClient {
  query: SqlRunner;
  queryOne: SqlRunnerOne;
}

// ═══════════════════════════════════════════════════════════════
// Initialisation — détection automatique du mode
// ═══════════════════════════════════════════════════════════════
let initPromise: Promise<void> | null = null;

async function initDb(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      pool = new Pool({ connectionString: config.databaseUrl });
      // Tester la connexion
      const result = await pool.query("SELECT 1");
      if (result.rows.length > 0) {
        useMockDb = false;
        console.log("[db] ✅ Connecté à Neon (Postgres serverless)");
        return;
      }
    } catch (err) {
      console.warn(
        "[db] ⚠️  Neon non accessible — bascule vers la base locale (mock-data.json)",
      );
    }
    useMockDb = true;
    pool = null;
  })();

  return initPromise;
}

// Démarrer l'initialisation immédiatement
initDb();

// ═══════════════════════════════════════════════════════════════
// API publique
// ═══════════════════════════════════════════════════════════════

/**
 * Exécute une requête SQL paramétrée et renvoie les lignes.
 * Utilise Neon si accessible, sinon la base locale JSON.
 */
export const query: SqlRunner = async <T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> => {
  await initDb();

  if (useMockDb) {
    return mockQuery<T>(text, params);
  }

  const result = await pool!.query(text, params);
  return result.rows as T[];
};

/** Renvoie la première ligne, ou null si aucune. */
export const queryOne: SqlRunnerOne = async <T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> => {
  await initDb();

  if (useMockDb) {
    return mockQueryOne<T>(text, params);
  }

  const rows = await query<T>(text, params);
  return rows[0] ?? null;
};

/**
 * Exécute une série d'opérations dans une transaction atomique.
 * En mode mock, les opérations sont exécutées séquentiellement (pas de vraie transaction).
 */
export const transaction = async <T>(
  fn: (tx: SqlClient) => Promise<T>,
): Promise<T> => {
  await initDb();

  if (useMockDb) {
    // En mode mock, pas de vraie transaction — exécution séquentielle
    return fn({ query: mockQuery, queryOne: mockQueryOne });
  }

  const client = await pool!.connect();

  const txQuery: SqlRunner = async <R = Record<string, unknown>>(
    text: string,
    params: unknown[] = [],
  ): Promise<R[]> => {
    const result = await client.query(text, params);
    return result.rows as R[];
  };

  const txQueryOne: SqlRunnerOne = async <R = Record<string, unknown>>(
    text: string,
    params: unknown[] = [],
  ): Promise<R | null> => {
    const result = await client.query(text, params);
    return (result.rows[0] ?? null) as R | null;
  };

  try {
    await client.query("BEGIN");
    const result = await fn({ query: txQuery, queryOne: txQueryOne });
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export { pool };
