/**
 * Système de migrations versionnées pour la base Neon.
 *
 * Usage : npm run db:migrate
 * Nécessite DATABASE_URL dans .env
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool, query } from "./db";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "migrations");

interface Migration {
  id: string;
  name: string;
  path: string;
  sql: string;
}

/**
 * Charge toutes les migrations du dossier /migrations
 * Triées par ordre numérique (001_, 002_, ...)
 */
function loadMigrations(): Migration[] {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  return files.map((filename) => {
    const id = filename.split("_")[0];
    const name = filename.replace(".sql", "").split("_").slice(1).join("_");
    const path = join(migrationsDir, filename);
    const sql = readFileSync(path, "utf8");

    return { id, name, path, sql };
  });
}

/**
 * Récupère les migrations déjà appliquées en base
 */
async function getAppliedMigrations(): Promise<string[]> {
  try {
    const result = await query<{ id: string; success: boolean }>(
      "SELECT id, success FROM migrations ORDER BY id ASC",
    );
    // @ts-ignore - query retourne toujours { rows: ... } comme dans tout le codebase
    return result.rows
      .filter((r: { id: string; success: boolean }) => r.success)
      .map((r: { id: string }) => r.id);
  } catch (err) {
    // La table migrations n'existe pas encore
    return [];
  }
}

/**
 * Enregistre l'application d'une migration
 */
async function recordMigration(
  migrationId: string,
  migrationName: string,
  success: boolean,
): Promise<void> {
  await query(
    `INSERT INTO migrations (id, name, success) VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET success = $3, applied_at = now()`,
    [migrationId, migrationName, success],
  );
}

const run = async () => {
  console.log("[db] 🚀 Démarrage du système de migrations versionnées");

  const migrations = loadMigrations();
  const appliedIds = await getAppliedMigrations();

  console.log(`[db] ${migrations.length} migration(s) trouvée(s)`);
  console.log(`[db] ${appliedIds.length} migration(s) déjà appliquée(s)`);

  // Appliquer les migrations non encore appliquées
  for (const migration of migrations) {
    if (appliedIds.includes(migration.id)) {
      console.log(
        `[db] ⏭️  Migration ${migration.id}_${migration.name} déjà appliquée`,
      );
      continue;
    }

    console.log(`[db] ▶️  Application de ${migration.id}_${migration.name}...`);

    try {
      // Exécuter la migration dans une transaction
      await pool.query("BEGIN");
      await pool.query(migration.sql);
      await recordMigration(migration.id, migration.name, true);
      await pool.query("COMMIT");

      console.log(
        `[db] ✅ Migration ${migration.id}_${migration.name} appliquée avec succès`,
      );
    } catch (err) {
      await pool.query("ROLLBACK");
      await recordMigration(migration.id, migration.name, false);
      console.error(
        `[db] ❌ Échec de la migration ${migration.id}_${migration.name} :`,
        err,
      );
      process.exit(1);
    }
  }

  await pool.end();
  console.log("[db] 🎉 Toutes les migrations ont été traitées !");
};

run().catch((err) => {
  console.error("[db] 💥 Erreur fatale du système de migrations :", err);
  process.exit(1);
});
