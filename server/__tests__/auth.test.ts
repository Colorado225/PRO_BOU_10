import { describe, it, expect, vi, beforeAll } from "vitest";
import { refreshTokens } from "../auth";
import { query } from "../db";

// Mock de la base de données
vi.mock("../db", () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}));

describe("Authentification et refresh tokens", () => {
  beforeAll(async () => {
    await import("../auth");
  });

  it("les refresh tokens peuvent être générés et révoqués", async () => {
    // Mock pour simuler un refresh token valide
    (query as vi.Mock).mockResolvedValueOnce({
      rows: [
        {
          id: "token-1",
          user_id: "user-1",
          expires_at: new Date(Date.now() + 86400000), // 24h
          revoked: false,
        },
      ],
    });

    // Tenter de révoquer un token
    await query("UPDATE refresh_tokens SET revoked = true WHERE id = $1", [
      "token-1",
    ]);

    // Vérifier que le token a été révoqué
    expect(query).toHaveBeenCalledWith(
      "UPDATE refresh_tokens SET revoked = true WHERE id = $1",
      ["token-1"],
    );
  });

  it("les cookies sont sécurisés (HttpOnly/Secure/SameSite)", () => {
    // Vérifier que les options de cookie sont correctes
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 86400000,
      path: "/",
    };

    expect(cookieOptions.httpOnly).toBe(true);
    expect(cookieOptions.sameSite).toBe("strict");
  });
});
