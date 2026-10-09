import { describe, it, expect, vi, beforeAll } from "vitest";
import { requireRole } from "../auth";
import { Request, Response, NextFunction } from "express";

describe("Permissions RBAC", () => {
  beforeAll(async () => {
    await import("../auth");
  });

  it("un utilisateur sans le rôle requis ne peut pas accéder à une route admin", async () => {
    // Simuler une requête avec un utilisateur qui n'a pas le rôle requis
    const mockReq = {
      user: {
        userId: "user-1",
        role: "caissier", // Rôle insuffisant (caissier a rang 2 < gerant 3)
      },
    } as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const mockNext = vi.fn() as NextFunction;

    // Tenter d'appliquer le middleware requireRole('gerant') qui est le rôle le plus élevé
    const middleware = requireRole("gerant");
    middleware(mockReq, mockRes, mockNext);

    // Vérifier que l'accès est refusé
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining("Accès refusé"),
      }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("un utilisateur avec le rôle correct peut accéder à la route", async () => {
    // Simuler une requête avec un utilisateur gerant (rôle suffisant)
    const mockReq = {
      user: {
        userId: "user-1",
        role: "gerant", // Rôle suffisant
      },
    } as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const mockNext = vi.fn() as NextFunction;

    // Appliquer le middleware
    const middleware = requireRole("gerant");
    middleware(mockReq, mockRes, mockNext);

    // Vérifier que l'accès est autorisé
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalledWith(403);
  });
});
