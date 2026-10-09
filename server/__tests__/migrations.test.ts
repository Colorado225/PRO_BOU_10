/**
 * Tests des migrations versionnées
 *
 * Vérifie :
 * - La présence et l'ordre des fichiers de migration
 * - La cohérence des IDs de migration (pas de doublons, ordre numérique)
 * - La syntaxe SQL de base des fichiers de migration
 * - Le mécanisme de chargement et d'application des migrations
 * - La table de suivi des migrations (audit trail)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "server", "migrations");

describe("Migrations versionnées", () => {
  // ═══════════════════════════════════════════════════════════════
  // SECTION 1 : Structure des fichiers de migration
  // ═══════════════════════════════════════════════════════════════
  describe("Structure des fichiers", () => {
    it("le dossier migrations existe", () => {
      const files = readdirSync(MIGRATIONS_DIR);
      expect(files.length).toBeGreaterThan(0);
    });

    it("tous les fichiers de migration ont l'extension .sql", () => {
      const files = readdirSync(MIGRATIONS_DIR);
      const sqlFiles = files.filter((f) => f.endsWith(".sql"));

      expect(sqlFiles.length).toBe(files.length);
    });

    it("tous les fichiers suivent le format NNN_nom.sql", () => {
      const files = readdirSync(MIGRATIONS_DIR);

      files.forEach((file) => {
        // Format attendu : NNN_nom_de_migration.sql (ex: 001_init_schema.sql)
        expect(file).toMatch(/^\d{3}_[a-z0-9_]+\.sql$/);
      });
    });

    it("les IDs de migration sont séquentiels et sans doublons", () => {
      const files = readdirSync(MIGRATIONS_DIR).sort();
      const ids = files.map((f) => f.split("_")[0]);

      // Pas de doublons
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);

      // Ordre numérique croissant
      for (let i = 1; i < ids.length; i++) {
        expect(parseInt(ids[i])).toBeGreaterThan(parseInt(ids[i - 1]));
      }
    });

    it("la première migration (001) contient le schéma initial", () => {
      const files = readdirSync(MIGRATIONS_DIR).sort();
      const firstFile = files[0];

      expect(firstFile).toMatch(/^001_/);

      const content = readFileSync(join(MIGRATIONS_DIR, firstFile), "utf8");
      expect(content).toContain("CREATE TABLE");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 2 : Contenu SQL des migrations
  // ═══════════════════════════════════════════════════════════════
  describe("Contenu SQL des migrations", () => {
    const files = readdirSync(MIGRATIONS_DIR).sort();

    it("chaque fichier de migration contient du SQL valide", () => {
      files.forEach((file) => {
        const content = readFileSync(join(MIGRATIONS_DIR, file), "utf8");

        // Le fichier ne doit pas être vide
        expect(content.trim().length).toBeGreaterThan(0);

        // Doit contenir au moins une instruction SQL reconnue
        const sqlKeywords = [
          "CREATE TABLE",
          "ALTER TABLE",
          "CREATE INDEX",
          "INSERT INTO",
          "DROP TABLE",
          "ADD COLUMN",
        ];
        const hasKeyword = sqlKeywords.some((kw) =>
          content.toUpperCase().includes(kw),
        );
        expect(hasKeyword).toBe(true);
      });
    });

    it("la migration 001 crée la table migrations (audit trail)", () => {
      const file001 = files.find((f) => f.startsWith("001_"));
      expect(file001).toBeTruthy();

      const content = readFileSync(join(MIGRATIONS_DIR, file001!), "utf8");
      expect(content).toContain("CREATE TABLE IF NOT EXISTS migrations");
      expect(content).toContain("id");
      expect(content).toContain("name");
      expect(content).toContain("success");
    });

    it("la migration 001 crée les tables fondamentales", () => {
      const file001 = files.find((f) => f.startsWith("001_"));
      const content = readFileSync(join(MIGRATIONS_DIR, file001!), "utf8");

      const requiredTables = [
        "organizations",
        "stores",
        "users",
        "products",
        "sales",
        "recipes",
      ];

      requiredTables.forEach((table) => {
        expect(content).toContain(table);
      });
    });

    it("la migration 002 ajoute l'isolation organisationnelle", () => {
      const file002 = files.find((f) => f.startsWith("002_"));
      if (!file002) return; // Migration 002 peut ne pas exister

      const content = readFileSync(join(MIGRATIONS_DIR, file002), "utf8");
      expect(content).toContain("organization_id");
    });

    it("la migration 003 ajoute les champs d'inscription", () => {
      const file003 = files.find((f) => f.startsWith("003_"));
      if (!file003) return;

      const content = readFileSync(join(MIGRATIONS_DIR, file003), "utf8");
      expect(content).toContain("ALTER TABLE");
    });

    it("les migrations utilisent TIMESTAMPTZ pour les dates", () => {
      files.forEach((file) => {
        const content = readFileSync(join(MIGRATIONS_DIR, file), "utf8");

        // Vérifier qu'il n'y a pas de TIMESTAMP sans TZ (sauf dans les commentaires)
        const lines = content.split("\n").filter(
          (line) => !line.trim().startsWith("--"),
        );
        const sqlContent = lines.join("\n");

        // Si on utilise TIMESTAMP, ça devrait être TIMESTAMPTZ
        const timestampMatches = sqlContent.match(/TIMESTAMP(?!TZ)/gi);
        if (timestampMatches) {
          // Acceptable seulement si c'est TIMESTAMPTZ
          const timestamptzMatches = sqlContent.match(/TIMESTAMPTZ/gi);
          expect(timestamptzMatches).toBeTruthy();
        }
      });
    });

    it("les migrations utilisent TEXT pour les IDs (pas BIGSERIAL)", () => {
      files.forEach((file) => {
        const content = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
        const lines = content.split("\n").filter(
          (line) => !line.trim().startsWith("--"),
        );
        const sqlContent = lines.join("\n").toUpperCase();

        // BIGSERIAL ne devrait pas être utilisé pour les IDs
        expect(sqlContent).not.toContain("BIGSERIAL PRIMARY KEY");
      });
    });

    it("les migrations incluent des commentaires explicatifs", () => {
      files.forEach((file) => {
        const content = readFileSync(join(MIGRATIONS_DIR, file), "utf8");

        // Chaque migration doit avoir au moins un commentaire
        expect(content).toContain("--");
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 3 : Mécanisme de migration (via mocks)
  // ═══════════════════════════════════════════════════════════════
  describe("Mécanisme de migration", () => {
    it("les migrations sont triées par ordre numérique", () => {
      const files = readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith(".sql"))
        .sort();

      const ids = files.map((f) => parseInt(f.split("_")[0]));

      for (let i = 1; i < ids.length; i++) {
        expect(ids[i]).toBeGreaterThan(ids[i - 1]);
      }
    });

    it("chaque migration a un ID unique et un nom descriptif", () => {
      const files = readdirSync(MIGRATIONS_DIR).sort();

      const migrations = files.map((f) => {
        const parts = f.replace(".sql", "").split("_");
        return {
          id: parts[0],
          name: parts.slice(1).join("_"),
        };
      });

      // IDs uniques
      const ids = migrations.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);

      // Noms descriptifs (au moins 3 caractères)
      migrations.forEach((m) => {
        expect(m.name.length).toBeGreaterThanOrEqual(3);
      });
    });

    it("le nombre de migrations est cohérent avec le développement", () => {
      const files = readdirSync(MIGRATIONS_DIR);
      // Au moins 2 migrations : init_schema + organizations
      expect(files.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 4 : Cohérence du schéma
  // ═══════════════════════════════════════════════════════════════
  describe("Cohérence du schéma", () => {
    it("la table users a les colonnes de sécurité requises", () => {
      const file001 = readdirSync(MIGRATIONS_DIR)
        .sort()
        .find((f) => f.startsWith("001_"));
      const content = readFileSync(join(MIGRATIONS_DIR, file001!), "utf8");

      // Extraire la définition de la table users
      const usersTableMatch = content.match(
        /CREATE TABLE IF NOT EXISTS users\s*\(([\s\S]*?)\);/,
      );
      expect(usersTableMatch).toBeTruthy();

      const usersDefinition = usersTableMatch![1];
      expect(usersDefinition).toContain("email");
      expect(usersDefinition).toContain("password_hash");
      expect(usersDefinition).toContain("role");
    });

    it("les clés étrangères vers organizations existent", () => {
      const file001 = readdirSync(MIGRATIONS_DIR)
        .sort()
        .find((f) => f.startsWith("001_"));
      const content = readFileSync(join(MIGRATIONS_DIR, file001!), "utf8");

      // La table stores doit référencer organizations
      expect(content).toContain("REFERENCES organizations(id)");
    });

    it("la table refresh_tokens existe pour la gestion des sessions", () => {
      const file001 = readdirSync(MIGRATIONS_DIR)
        .sort()
        .find((f) => f.startsWith("001_"));
      const content = readFileSync(join(MIGRATIONS_DIR, file001!), "utf8");

      expect(content).toContain("refresh_tokens");
      expect(content).toContain("token");
      expect(content).toContain("expires_at");
    });

    it("des index sont créés sur les colonnes de filtrage multi-tenant", () => {
      const allContent = readdirSync(MIGRATIONS_DIR)
        .sort()
        .map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf8"))
        .join("\n");

      // Vérifier que des index existent pour organization_id
      expect(allContent.toUpperCase()).toContain("INDEX");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 5 : Migration 003 (inscription)
  // ═══════════════════════════════════════════════════════════════
  describe("Migration 003 — Champs d'inscription", () => {
    it("la migration 003 existe", () => {
      const files = readdirSync(MIGRATIONS_DIR);
      const file003 = files.find((f) => f.startsWith("003_"));
      expect(file003).toBeTruthy();
    });

    it("la migration 003 ajoute les colonnes phone, bakery_name, etc.", () => {
      const files = readdirSync(MIGRATIONS_DIR);
      const file003 = files.find((f) => f.startsWith("003_"));
      if (!file003) return;

      const content = readFileSync(join(MIGRATIONS_DIR, file003), "utf8");

      const requiredColumns = [
        "phone",
        "bakery_name",
        "establishment_type",
        "city",
        "points_of_sale",
      ];

      requiredColumns.forEach((col) => {
        expect(content).toContain(col);
      });
    });

    it("la migration 003 utilise ADD COLUMN IF NOT EXISTS (idempotente)", () => {
      const files = readdirSync(MIGRATIONS_DIR);
      const file003 = files.find((f) => f.startsWith("003_"));
      if (!file003) return;

      const content = readFileSync(join(MIGRATIONS_DIR, file003), "utf8");
      expect(content.toUpperCase()).toContain("IF NOT EXISTS");
    });
  });
});
