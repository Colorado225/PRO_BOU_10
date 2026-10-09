import { describe, it, expect, vi, beforeAll } from "vitest";
import type { Mock } from "vitest";
import type { PurchaseOrderItem } from "../../types/bakery";

// Mock de la fonction transaction et query de db.ts
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

// Importons le service avant les tests
let createPurchaseOrder: typeof import("../purchaseService").createPurchaseOrder;
beforeAll(async () => {
  const module = await import("../purchaseService");
  createPurchaseOrder = module.createPurchaseOrder;
});

describe("purchaseService - createPurchaseOrder", () => {
  const mockStoreId = "test-store-1";
  const mockRecordedBy = "test-user-1";
  const mockItems: PurchaseOrderItem[] = [
    {
      materialId: "mat-1",
      materialName: "Farine de blé",
      quantity: 50,
      unit: "kg",
      unitPrice: 500,
      total: 25000,
    },
  ];

  it("calcule correctement le nouveau stock après réception de commande", async () => {
    // Récupérons la transaction mockée pour vérifier les appels
    const { transaction } = await import("../../db");
    const mockTx = {
      query: vi.fn().mockResolvedValue([]),
      queryOne: vi.fn().mockResolvedValue({ current_stock: 100 }),
    };
    (transaction as Mock).mockImplementationOnce((cb) => cb(mockTx));

    await createPurchaseOrder(
      {
        supplierId: "sup-1",
        supplierName: "Fournisseur Farine",
        date: new Date().toISOString(),
        items: mockItems,
      },
      mockStoreId,
      mockRecordedBy,
    );

    // Vérifier que queryOne a bien récupéré le stock actuel
    expect(mockTx.queryOne).toHaveBeenCalledWith(
      "SELECT current_stock FROM raw_materials WHERE id = $1",
      ["mat-1"],
    );

    // Vérifier que la mise à jour du stock est correcte : 100 + 50 = 150
    expect(mockTx.query).toHaveBeenCalledWith(
      "UPDATE raw_materials SET current_stock = $1 WHERE id = $2",
      [150, "mat-1"],
    );
  });

  it("gère correctement un stock initial à zéro", async () => {
    const { transaction } = await import("../../db");
    const mockTx = {
      query: vi.fn().mockResolvedValue([]),
      queryOne: vi.fn().mockResolvedValue({ current_stock: 0 }),
    };
    (transaction as Mock).mockImplementationOnce((cb) => cb(mockTx));

    await createPurchaseOrder(
      {
        supplierId: "sup-1",
        supplierName: "Fournisseur Farine",
        date: new Date().toISOString(),
        items: mockItems,
      },
      mockStoreId,
      mockRecordedBy,
    );

    // Nouveau stock : 0 + 50 = 50
    expect(mockTx.query).toHaveBeenCalledWith(
      "UPDATE raw_materials SET current_stock = $1 WHERE id = $2",
      [50, "mat-1"],
    );
  });

  it("gère correctement un matériau inexistant (current_stock null)", async () => {
    const { transaction } = await import("../../db");
    let poCallCount = 0;
    const mockTx = {
      query: vi.fn().mockResolvedValue([]),
      queryOne: vi.fn(() => {
        poCallCount++;
        // Premier appel : INSERT retourne un po, deuxième appel : SELECT raw_materials retourne null
        return Promise.resolve(poCallCount === 1 ? { id: "po-1" } : null);
      }),
    };
    (transaction as Mock).mockImplementationOnce((cb) => cb(mockTx));

    await createPurchaseOrder(
      {
        supplierId: "sup-1",
        supplierName: "Fournisseur Farine",
        date: new Date().toISOString(),
        items: mockItems,
      },
      mockStoreId,
      mockRecordedBy,
    );

    // Si currentMaterial est null, on utilise 0 + 50 = 50
    expect(mockTx.query).toHaveBeenCalledWith(
      "UPDATE raw_materials SET current_stock = $1 WHERE id = $2",
      [50, "mat-1"],
    );
  });
});
