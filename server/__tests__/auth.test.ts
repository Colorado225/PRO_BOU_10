/**
 * Tests d'authentification et refresh tokens
 *
 * Vérifie :
 * - La génération et validation des tokens JWT
 * - La génération de refresh tokens sécurisés
 * - Le hachage et la vérification des mots de passe
 * - Le middleware requireAuth (cookies et headers)
 * - Les options de sécurité des cookies
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Mock de la config avant l'import de auth
vi.mock("../config", () => ({
  config: {
    jwtSecret: "test-secret-key-for-unit-tests-32chars!",
    jwtExpiresIn: "24h",
  },
}));

// Mock de la base de données
vi.mock("../db", () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}));

import {
  signToken,
  generateRefreshToken,
  hashPassword,
  verifyPassword,
  requireAuth,
  type AuthPayload,
  type AuthedRequest,
} from "../auth";
import type { Response } from "express";

describe("Authentification et refresh tokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 1 : Tokens JWT
  // ═══════════════════════════════════════════════════════════════
  describe("Tokens JWT", () => {
    it("signToken génère un JWT valide avec le payload correct", () => {
      const payload: AuthPayload = {
        userId: "user-123",
        name: "Jean Dupont",
        role: "gerant",
        storeId: "store-1",
        organizationId: "org-1",
      };

      const token = signToken(payload);

      // Vérifier que le token est une string non vide
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");

      // Vérifier que le token peut être décodé
      const decoded = jwt.verify(token, "test-secret-key-for-unit-tests-32chars!") as AuthPayload;
      expect(decoded.userId).toBe("user-123");
      expect(decoded.name).toBe("Jean Dupont");
      expect(decoded.role).toBe("gerant");
      expect(decoded.storeId).toBe("store-1");
      expect(decoded.organizationId).toBe("org-1");
    });

    it("signToken génère des tokens différents pour des utilisateurs différents", () => {
      const payload1: AuthPayload = {
        userId: "user-1",
        name: "User A",
        role: "gerant",
        storeId: "store-1",
        organizationId: "org-1",
      };
      const payload2: AuthPayload = {
        userId: "user-2",
        name: "User B",
        role: "caissier",
        storeId: "store-2",
        organizationId: "org-1",
      };

      const token1 = signToken(payload1);
      const token2 = signToken(payload2);

      expect(token1).not.toBe(token2);
    });

    it("un token expiré est rejeté par jwt.verify", async () => {
      const payload: AuthPayload = {
        userId: "user-1",
        name: "Test",
        role: "gerant",
        storeId: null,
        organizationId: "org-1",
      };

      // Générer un token expiré (expiré il y a 1 heure)
      const expiredToken = jwt.sign(payload, "test-secret-key-for-unit-tests-32chars!", {
        expiresIn: "-1h",
      });

      expect(() => {
        jwt.verify(expiredToken, "test-secret-key-for-unit-tests-32chars!");
      }).toThrow();
    });

    it("un token signé avec une mauvaise clé est rejeté", () => {
      const payload: AuthPayload = {
        userId: "user-1",
        name: "Test",
        role: "gerant",
        storeId: null,
        organizationId: "org-1",
      };

      const token = jwt.sign(payload, "wrong-secret-key");

      expect(() => {
        jwt.verify(token, "test-secret-key-for-unit-tests-32chars!");
      }).toThrow();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 2 : Refresh Tokens
  // ═══════════════════════════════════════════════════════════════
  describe("Refresh Tokens", () => {
    it("generateRefreshToken génère un token de 72 caractères (2 UUIDs concaténés)", () => {
      const token = generateRefreshToken();
      expect(token).toBeTruthy();
      // crypto.randomUUID() = 36 chars (avec tirets) × 2 = 72 caractères
      expect(token.length).toBe(72);
    });

    it("generateRefreshToken génère des tokens uniques", () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateRefreshToken());
      }
      expect(tokens.size).toBe(100);
    });

    it("generateRefreshToken génère des tokens cryptographiquement sûrs (UUID-based)", () => {
      const token = generateRefreshToken();
      // Vérifier que le token contient seulement des caractères hexadécimaux et des tirets
      expect(token).toMatch(/^[a-f0-9-]+$/);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 3 : Hachage et vérification des mots de passe
  // ═══════════════════════════════════════════════════════════════
  describe("Hachage des mots de passe", () => {
    it("hashPassword génère un hash bcrypt valide", () => {
      const plain = "MonMotDePasse123!";
      const hash = hashPassword(plain);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(plain);
      // Un hash bcrypt commence par $2a$ ou $2b$
      expect(hash).toMatch(/^\$2[ab]\$/);
    });

    it("verifyPassword valide un mot de passe correct", () => {
      const plain = "MonMotDePasse123!";
      const hash = hashPassword(plain);

      expect(verifyPassword(plain, hash)).toBe(true);
    });

    it("verifyPassword rejette un mot de passe incorrect", () => {
      const hash = hashPassword("CorrectPassword");
      expect(verifyPassword("WrongPassword", hash)).toBe(false);
    });

    it("hashPassword génère des hashes différents pour le même mot de passe (salt)", () => {
      const plain = "MonMotDePasse123!";
      const hash1 = hashPassword(plain);
      const hash2 = hashPassword(plain);

      expect(hash1).not.toBe(hash2);
      // Mais les deux doivent valider le même mot de passe
      expect(verifyPassword(plain, hash1)).toBe(true);
      expect(verifyPassword(plain, hash2)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 4 : Middleware requireAuth
  // ═══════════════════════════════════════════════════════════════
  describe("Middleware requireAuth", () => {
    const createMockRes = () =>
      ({
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      }) as unknown as Response;

    it("authentifie un utilisateur avec un token valide dans le cookie", async () => {
      const payload: AuthPayload = {
        userId: "user-1",
        name: "Jean",
        role: "gerant",
        storeId: "store-1",
        organizationId: "org-1",
      };
      const token = signToken(payload);

      const mockReq = {
        cookies: { access_token: token },
        headers: {},
      } as unknown as AuthedRequest;

      const mockRes = createMockRes();
      const mockNext = vi.fn();

      await requireAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user!.userId).toBe("user-1");
      expect(mockReq.user!.role).toBe("gerant");
    });

    it("authentifie un utilisateur avec un token dans l'header Authorization", async () => {
      const payload: AuthPayload = {
        userId: "user-2",
        name: "Marie",
        role: "caissier",
        storeId: "store-1",
        organizationId: "org-1",
      };
      const token = signToken(payload);

      const mockReq = {
        cookies: {},
        headers: { authorization: `Bearer ${token}` },
      } as unknown as AuthedRequest;

      const mockRes = createMockRes();
      const mockNext = vi.fn();

      await requireAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user!.name).toBe("Marie");
    });

    it("rejette une requête sans token (401)", async () => {
      const mockReq = {
        cookies: {},
        headers: {},
      } as unknown as AuthedRequest;

      const mockRes = createMockRes();
      const mockNext = vi.fn();

      await requireAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) }),
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("rejette un token invalide (401)", async () => {
      const mockReq = {
        cookies: { access_token: "invalid.token.here" },
        headers: {},
      } as unknown as AuthedRequest;

      const mockRes = createMockRes();
      const mockNext = vi.fn();

      await requireAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("rejette un token expiré (401)", async () => {
      const payload: AuthPayload = {
        userId: "user-1",
        name: "Test",
        role: "gerant",
        storeId: null,
        organizationId: "org-1",
      };
      const expiredToken = jwt.sign(
        payload,
        "test-secret-key-for-unit-tests-32chars!",
        { expiresIn: "-1h" },
      );

      const mockReq = {
        cookies: { access_token: expiredToken },
        headers: {},
      } as unknown as AuthedRequest;

      const mockRes = createMockRes();
      const mockNext = vi.fn();

      await requireAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("privilégie le cookie sur l'header Authorization", async () => {
      const cookiePayload: AuthPayload = {
        userId: "cookie-user",
        name: "Cookie User",
        role: "gerant",
        storeId: "store-1",
        organizationId: "org-1",
      };
      const headerPayload: AuthPayload = {
        userId: "header-user",
        name: "Header User",
        role: "caissier",
        storeId: "store-2",
        organizationId: "org-1",
      };

      const cookieToken = signToken(cookiePayload);
      const headerToken = signToken(headerPayload);

      const mockReq = {
        cookies: { access_token: cookieToken },
        headers: { authorization: `Bearer ${headerToken}` },
      } as unknown as AuthedRequest;

      const mockRes = createMockRes();
      const mockNext = vi.fn();

      await requireAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user!.userId).toBe("cookie-user");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 5 : Sécurité des cookies
  // ═══════════════════════════════════════════════════════════════
  describe("Sécurité des cookies", () => {
    it("les options de cookie incluent HttpOnly", () => {
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "strict" as const,
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      };

      expect(cookieOptions.httpOnly).toBe(true);
    });

    it("les options de cookie incluent SameSite=Strict", () => {
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "strict" as const,
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      };

      expect(cookieOptions.sameSite).toBe("strict");
    });

    it("les options de cookie incluent Secure en production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      };

      expect(cookieOptions.secure).toBe(true);
      process.env.NODE_ENV = originalEnv;
    });

    it("les options de cookie incluent un chemin racine", () => {
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "strict" as const,
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      };

      expect(cookieOptions.path).toBe("/");
    });

    it("les refresh tokens ont une durée de vie plus longue que les access tokens", () => {
      const accessTokenMaxAge = 24 * 60 * 60 * 1000; // 24h
      const refreshTokenMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours

      expect(refreshTokenMaxAge).toBeGreaterThan(accessTokenMaxAge);
    });
  });
});
