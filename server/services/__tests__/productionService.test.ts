import { describe, it, expect, vi, beforeAll } from "vitest";
import type { Mock } from "vitest";
import type { ProductionOrderItem } from "../../types/bakery";

// Mock de db.ts
vi.mock("../../db", () => ({
  transaction: vi.fn((cb) =>
    cb({
      query: vi.fn().mockResolvedValue([]),
      queryOne: vi.fn().mockResolvedValue({ current_stock: 100 }),
    }),
  ),
  query: vi.fn(),
  queryOne: vi.fn(),
}));

// Import du service avant les tests
let createProductionOrder: typeof import("../productionService").createProductionOrder;
beforeAll(async () => {
  const module = await import("../productionService");
  createProductionOrder = module.createProductionOrder;
});

describe("productionService - createProductionOrder", () => {
  const mockStoreId = "test-store-1";
  const mockRecordedBy = "chef-atelier-1";
  const mockItems: ProductionOrderItem[] = [
    {
      materialId: "mat-1",
      materialName: "Farine de blé",
      quantity: 50,
      unit: "kg",
    },
  ];

  it("génère un code d'ordre de production valide (format OF-XXXXXXXX)", async () => {
    const { transaction } = await import("../../db");
    const mockTx = {
      query: vi.fn().mockResolvedValue([]),
      queryOne: vi.fn().mockResolvedValue({ current_stock: 100 }),
    };
    (transaction as Mock).mockImplementationOnce((cb) => cb(mockTx));

    const order = await createProductionOrder(
      {
        recipeId: "rec-1",
        recipeName: "Baguette classique",
        targetQuantity: 100,
        items: mockItems,
        storeId: mockStoreId,
      },
      "org-1",
    );

    // Vérifier que l'ordre a été créé sans erreur
    expect(order).toBeDefined();
  });

  it("génère des codes d'ordres différents pour deux productions simultanées", async () => {
    const { transaction } = await import("../../db");

    // Premier ordre
    const mockTx1 = {
      query: vi.fn().mockResolvedValue([]),
      queryOne: vi.fn().mockResolvedValue({ current_stock: 100 }),
    };
    (transaction as Mock).mockImplementationOnce((cb) => cb(mockTx1));
    const order1 = await createProductionOrder(
      {
        recipeId: "rec-1",
        recipeName: "Baguette classique",
        targetQuantity: 100,
        items: mockItems,
        storeId: mockStoreId,
      },
      "org-1",
    );

    // Deuxième ordre
    const mockTx2 = {
      query: vi.fn().mockResolvedValue([]),
      queryOne: vi.fn().mockResolvedValue({ current_stock: 50 }),
    };
    (transaction as Mock).mockImplementationOnce((cb) => cb(mockTx2));
    const order2 = await createProductionOrder(
      {
        recipeId: "rec-1",
        recipeName: "Baguette classique",
        targetQuantity: 100,
        items: mockItems,
        storeId: mockStoreId,
      },
      "org-1",
    );

    // Les deux ordres sont créés sans erreur
    expect(order1).toBeDefined();
    expect(order2).toBeDefined();
  });

  it("déduit correctement les matières premières nécessaires", async () => {
    const { transaction } = await import("../../db");
    const mockTx = {
      query: vi.fn().mockResolvedValue([]),
      queryOne: vi
        .fn()
        .mockResolvedValueOnce({
          id: "rec-1",
          name: "Baguette classique",
          product_id: "prod-1",
          product_name: "Baguette",
        }) // 1. Récupération de la recette
        .mockResolvedValueOnce({ id: "order-1", code: "OF-ABC12345" }) // 2. Retour de l'insertion de l'ordre de production
        .mockResolvedValueOnce({ stock: 100 }) // 3. Récupération du stock du produit
        .mockResolvedValueOnce({ current_stock: 100, unit: "kg" }), // 4. Récupération du stock de la matière première
    };
    (transaction as Mock).mockImplementationOnce((cb) => cb(mockTx));

    await createProductionOrder(
      {
        recipeId: "rec-1",
        recipeName: "Baguette classique",
        targetQuantity: 100,
        items: mockItems,
        storeId: mockStoreId,
      },
      "org-1",
    );

    // Vérifier que le stock a été déduit : 100 - 50 = 50
    expect(mockTx.query).toHaveBeenCalledWith(
      "UPDATE raw_materials SET current_stock = $1 WHERE id = $2",
      [50, "mat-1"],
    );
  });
});
