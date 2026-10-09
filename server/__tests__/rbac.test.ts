/**
 * Tests des permissions RBAC (Role-Based Access Control)
 *
 * Vérifie :
 * - La hiérarchie des rôles (magasinier < caissier/boulanger < gérant)
 * - Le middleware requireRole
 * - Le middleware requireOrganization
 * - Les helpers getOrganizationFilter et getTenantFilters
 * - La matrice de permissions PERMISSIONS
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock de la config
vi.mock("../config", () => ({
  config: {
    jwtSecret: "test-secret-key-for-unit-tests-32chars!",
    jwtExpiresIn: "24h",
  },
}));

vi.mock("../db", () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}));

import {
  requireRole,
  requireOrganization,
  getOrganizationFilter,
  getTenantFilters,
  PERMISSIONS,
  type AuthedRequest,
  type Role,
} from "../auth";
import type { Response, NextFunction } from "express";

/** Crée un mock Express Request avec un utilisateur donné. */
function mockRequest(role: Role, storeId: string | null = "store-1", organizationId: string | null = "org-1"): AuthedRequest {
  return {
    user: {
      userId: `user-${role}`,
      name: `User ${role}`,
      role,
      storeId,
      organizationId,
    },
  } as unknown as AuthedRequest;
}

/** Crée un mock Express Response. */
function mockResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
}

describe("Permissions RBAC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 1 : Hiérarchie des rôles via requireRole
  // ═══════════════════════════════════════════════════════════════
  describe("requireRole — Hiérarchie des rôles", () => {
    it("un gérant peut accéder aux routes gérant", () => {
      const req = mockRequest("gerant");
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      requireRole("gerant")(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("un caissier ne peut PAS accéder aux routes gérant", () => {
      const req = mockRequest("caissier");
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      requireRole("gerant")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("un boulanger ne peut PAS accéder aux routes gérant", () => {
      const req = mockRequest("boulanger");
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      requireRole("gerant")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("un magasinier ne peut PAS accéder aux routes caissier", () => {
      const req = mockRequest("magasinier");
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      requireRole("caissier")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("un gérant peut accéder aux routes caissier (rang supérieur)", () => {
      const req = mockRequest("gerant");
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      requireRole("caissier")(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("un gérant peut accéder aux routes boulanger (rang supérieur)", () => {
      const req = mockRequest("gerant");
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      requireRole("boulanger")(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("un gérant peut accéder aux routes magasinier (rang supérieur)", () => {
      const req = mockRequest("gerant");
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      requireRole("magasinier")(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("un caissier peut accéder aux routes magasinier (même rang)", () => {
      const req = mockRequest("caissier");
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      requireRole("magasinier")(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("un boulanger peut accéder aux routes magasinier (même rang)", () => {
      const req = mockRequest("boulanger");
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      requireRole("magasinier")(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("un utilisateur non authentifié est rejeté (401)", () => {
      const req = { user: undefined } as unknown as AuthedRequest;
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      requireRole("magasinier")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 2 : requireOrganization
  // ═══════════════════════════════════════════════════════════════
  describe("requireOrganization", () => {
    it("autorise un utilisateur avec un organizationId", async () => {
      const req = mockRequest("gerant", "store-1", "org-1");
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      await requireOrganization(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("rejette un utilisateur sans organizationId (403)", async () => {
      const req = mockRequest("gerant", "store-1", null);
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      await requireOrganization(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("organisation"),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("rejette un utilisateur non authentifié (401)", async () => {
      const req = { user: undefined } as unknown as AuthedRequest;
      const res = mockResponse();
      const next = vi.fn() as NextFunction;

      await requireOrganization(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 3 : Helpers de filtrage
  // ═══════════════════════════════════════════════════════════════
  describe("getOrganizationFilter", () => {
    it("génère la clause SQL correcte pour l'isolation organisationnelle", () => {
      const user = {
        userId: "user-1",
        name: "Test",
        role: "gerant" as Role,
        storeId: "store-1",
        organizationId: "org-42",
      };

      const result = getOrganizationFilter(user);

      expect(result.clause).toBe("organization_id = $1");
      expect(result.value).toBe("org-42");
      expect(result.paramIndex).toBe(1);
    });

    it("lève une erreur si l'utilisateur n'a pas d'organizationId", () => {
      const user = {
        userId: "user-1",
        name: "Test",
        role: "gerant" as Role,
        storeId: "store-1",
        organizationId: null,
      };

      expect(() => getOrganizationFilter(user)).toThrow("sans organisation");
    });
  });

  describe("getTenantFilters", () => {
    it("filtre par organization_id ET store_id quand les deux sont présents", () => {
      const user = {
        userId: "user-1",
        name: "Test",
        role: "caissier" as Role,
        storeId: "store-5",
        organizationId: "org-10",
      };

      const result = getTenantFilters(user);

      expect(result.clause).toBe("organization_id = $1 AND store_id = $2");
      expect(result.values).toEqual(["org-10", "store-5"]);
    });

    it("filtre uniquement par organization_id si storeId est null", () => {
      const user = {
        userId: "user-1",
        name: "Test",
        role: "gerant" as Role,
        storeId: null,
        organizationId: "org-10",
      };

      const result = getTenantFilters(user);

      expect(result.clause).toBe("organization_id = $1");
      expect(result.values).toEqual(["org-10"]);
    });

    it("lève une erreur si organizationId est null", () => {
      const user = {
        userId: "user-1",
        name: "Test",
        role: "gerant" as Role,
        storeId: "store-1",
        organizationId: null,
      };

      expect(() => getTenantFilters(user)).toThrow("sans organisation");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 4 : Matrice de permissions PERMISSIONS
  // ═══════════════════════════════════════════════════════════════
  describe("Matrice PERMISSIONS", () => {
    it("la permission POS est accordée au gérant et au caissier", () => {
      expect(PERMISSIONS.pos).toContain("gerant");
      expect(PERMISSIONS.pos).toContain("caissier");
      expect(PERMISSIONS.pos).not.toContain("boulanger");
      expect(PERMISSIONS.pos).not.toContain("magasinier");
    });

    it("la permission catalog est réservée au gérant", () => {
      expect(PERMISSIONS.catalog).toContain("gerant");
      expect(PERMISSIONS.catalog).not.toContain("caissier");
      expect(PERMISSIONS.catalog).not.toContain("boulanger");
      expect(PERMISSIONS.catalog).not.toContain("magasinier");
    });

    it("la permission production est accordée au gérant et au boulanger", () => {
      expect(PERMISSIONS.production).toContain("gerant");
      expect(PERMISSIONS.production).toContain("boulanger");
      expect(PERMISSIONS.production).not.toContain("caissier");
      expect(PERMISSIONS.production).not.toContain("magasinier");
    });

    it("la permission receiving est accordée au gérant et au magasinier", () => {
      expect(PERMISSIONS.receiving).toContain("gerant");
      expect(PERMISSIONS.receiving).toContain("magasinier");
      expect(PERMISSIONS.receiving).not.toContain("caissier");
      expect(PERMISSIONS.receiving).not.toContain("boulanger");
    });

    it("la permission margins est réservée au gérant", () => {
      expect(PERMISSIONS.margins).toContain("gerant");
      expect(PERMISSIONS.margins).not.toContain("caissier");
      expect(PERMISSIONS.margins).not.toContain("boulanger");
      expect(PERMISSIONS.margins).not.toContain("magasinier");
    });

    it("le gérant a accès à TOUTES les permissions", () => {
      Object.values(PERMISSIONS).forEach((roles) => {
        expect(roles).toContain("gerant");
      });
    });
  });
});
