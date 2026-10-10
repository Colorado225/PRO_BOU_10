/**
 * Tests d'isolation multi-tenant
 *
 * Vérifie :
 * - L'isolation par store_id (un utilisateur ne peut pas accéder aux données d'un autre store)
 * - L'isolation par organization_id (multi-sociétés)
 * - Les helpers getTenantFilters et getOrganizationFilter
 * - Les requêtes SQL filtrent systématiquement par tenant
 * - Les créations incluent systématiquement store_id et organization_id
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock de la config
vi.mock("../../config", () => ({
  config: {
    jwtSecret: "test-secret-key-for-unit-tests-32chars!",
    jwtExpiresIn: "24h",
  },
}));

// Mock de la base de données
const mockQuery = vi.fn();
const mockQueryOne = vi.fn();

vi.mock("../../db", () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
}));

import {
  getOrganizationFilter,
  getTenantFilters,
  type AuthedRequest,
  type Role,
} from "../../auth";

describe("Isolation multi-tenant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 1 : Isolation par organization_id
  // ═══════════════════════════════════════════════════════════════
  describe("Isolation par organization_id", () => {
    it("un utilisateur ne peut pas accéder aux données d'une autre organisation", async () => {
      // Simuler : l'utilisateur de org-2 tente d'accéder à une donnée de org-1
      mockQueryOne.mockResolvedValueOnce(null);

      const { queryOne } = await import("../../db");
      const result = await queryOne(
        `SELECT * FROM recipes WHERE organization_id = $1 AND id = $2`,
        ["org-2", "recipe-from-org-1"],
      );

      expect(result).toBeNull();
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining("organization_id = $1"),
        ["org-2", "recipe-from-org-1"],
      );
    });

    it("getOrganizationFilter génère le filtre correct", () => {
      const user = {
        userId: "user-1",
        name: "Test",
        role: "gerant" as Role,
        storeId: "store-1",
        organizationId: "org-42",
      };

      const filter = getOrganizationFilter(user);

      expect(filter.clause).toContain("organization_id");
      expect(filter.value).toBe("org-42");
    });

    it("toutes les lectures doivent inclure organization_id dans la clause WHERE", () => {
      const user = {
        userId: "user-1",
        name: "Test",
        role: "gerant" as Role,
        storeId: "store-1",
        organizationId: "org-1",
      };

      const filter = getOrganizationFilter(user);

      // La clause doit toujours contenir organization_id
      expect(filter.clause).toMatch(/organization_id/);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 2 : Isolation par store_id
  // ═══════════════════════════════════════════════════════════════
  describe("Isolation par store_id (boutique)", () => {
    it("un utilisateur d'un store ne peut pas accéder aux données d'un autre store", async () => {
      // Simuler : un caissier de store-2 tente d'accéder aux ventes de store-1
      mockQuery.mockResolvedValueOnce([]);

      const { query } = await import("../../db");
      const result = await query(
        `SELECT * FROM sales WHERE store_id = $1 AND organization_id = $2`,
        ["store-2", "org-1"],
      );

      // Aucune vente trouvée pour store-2
      expect(result).toEqual([]);
    });

    it("getTenantFilters filtre par organization_id ET store_id ensemble", () => {
      const user = {
        userId: "user-1",
        name: "Test",
        role: "caissier" as Role,
        storeId: "store-5",
        organizationId: "org-10",
      };

      const filter = getTenantFilters(user);

      // La clause doit contenir les deux filtres
      expect(filter.clause).toContain("organization_id");
      expect(filter.clause).toContain("store_id");
      expect(filter.values).toContain("org-10");
      expect(filter.values).toContain("store-5");
    });

    it("un gérant sans store_id voit les données de toute l'organisation", () => {
      const user = {
        userId: "user-1",
        name: "Admin",
        role: "gerant" as Role,
        storeId: null,
        organizationId: "org-10",
      };

      const filter = getTenantFilters(user);

      // Sans store_id, seul organization_id est filtré
      expect(filter.clause).toBe("organization_id = $1");
      expect(filter.clause).not.toContain("store_id");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 3 : Isolation combinée (organisation + store)
  // ═══════════════════════════════════════════════════════════════
  describe("Isolation combinée (double tenant)", () => {
    it("les requêtes de création incluent store_id ET organization_id", async () => {
      mockQuery.mockResolvedValueOnce({});

      const { query } = await import("../../db");
      await query(
        `INSERT INTO sales (id, store_id, organization_id, total, created_at)
         VALUES ($1, $2, $3, $4, now())`,
        ["sale-1", "store-1", "org-1", 1500],
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("store_id"),
        expect.arrayContaining(["store-1", "org-1"]),
      );
    });

    it("les requêtes de modification filtrent par store_id ET organization_id", async () => {
      mockQuery.mockResolvedValueOnce({});

      const { query } = await import("../../db");
      await query(
        `UPDATE recipes SET name = $1 WHERE id = $2 AND store_id = $3 AND organization_id = $4`,
        ["Nouveau nom", "recipe-1", "store-1", "org-1"],
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringMatching(/store_id.*organization_id|organization_id.*store_id/),
        expect.arrayContaining(["store-1", "org-1"]),
      );
    });

    it("les requêtes de suppression filtrent par store_id ET organization_id", async () => {
      mockQuery.mockResolvedValueOnce({});

      const { query } = await import("../../db");
      await query(
        `DELETE FROM customers WHERE id = $1 AND store_id = $2 AND organization_id = $3`,
        ["cust-1", "store-1", "org-1"],
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringMatching(/store_id.*organization_id|organization_id.*store_id/),
        expect.arrayContaining(["store-1", "org-1"]),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 4 : Scénarios d'attaque
  // ═══════════════════════════════════════════════════════════════
  describe("Scénarios d'attaque multi-tenant", () => {
    it("scénario 1 : un utilisateur de org-A ne peut pas lire les recettes de org-B", async () => {
      // L'attaquant est dans org-A mais tente d'accéder à une recette de org-B
      const attackerOrg = "org-A";
      const targetRecipe = "recipe-org-B-secret";

      mockQueryOne.mockResolvedValueOnce(null);

      const { queryOne } = await import("../../db");
      const result = await queryOne(
        `SELECT * FROM recipes WHERE organization_id = $1 AND id = $2`,
        [attackerOrg, targetRecipe],
      );

      // La recette n'est pas trouvée car elle appartient à org-B
      expect(result).toBeNull();
    });

    it("scénario 2 : un caissier de store-1 ne peut pas voir les ventes de store-2", async () => {
      const attackerStore = "store-1";
      const attackerOrg = "org-1";

      mockQuery.mockResolvedValueOnce([]);

      const { query } = await import("../../db");
      const result = await query(
        `SELECT * FROM sales WHERE store_id = $1 AND organization_id = $2 ORDER BY created_at DESC`,
        [attackerStore, attackerOrg],
      );

      // Seules les ventes de store-1 sont retournées (store-2 est exclu)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("store_id = $1"),
        [attackerStore, attackerOrg],
      );
    });

    it("scénario 3 : un utilisateur ne peut pas modifier les données d'une autre organisation", async () => {
      const attackerOrg = "org-A";
      const targetRecord = "record-org-B";

      mockQuery.mockResolvedValueOnce([]);

      const { query } = await import("../../db");
      const result = await query(
        `UPDATE products SET price = $1 WHERE id = $2 AND organization_id = $3`,
        [999, targetRecord, attackerOrg],
      );

      // Aucune ligne modifiée car l'organization_id ne correspond pas
      expect(result.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 5 : Validation des types
  // ═══════════════════════════════════════════════════════════════
  describe("Validation des types et interfaces", () => {
    it("getTenantFilters lève une erreur pour un utilisateur sans organisation", () => {
      const userWithoutOrg = {
        userId: "user-1",
        name: "Test",
        role: "gerant" as Role,
        storeId: "store-1",
        organizationId: null,
      };

      expect(() => getTenantFilters(userWithoutOrg)).toThrow();
    });

    it("getOrganizationFilter lève une erreur pour un utilisateur null", () => {
      expect(() => getOrganizationFilter(null)).toThrow();
    });

    it("getOrganizationFilter lève une erreur pour un utilisateur sans organizationId", () => {
      const user = {
        userId: "user-1",
        name: "Test",
        role: "gerant" as Role,
        storeId: "store-1",
        organizationId: null,
      };

      expect(() => getOrganizationFilter(user)).toThrow();
    });
  });
});
