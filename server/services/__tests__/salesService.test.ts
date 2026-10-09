import { describe, it, expect, vi, beforeAll } from "vitest";
import type { Mock } from "vitest";
import type { SaleItem } from "../../types/bakery";

// Mock de db.ts
vi.mock("../../db", () => ({
  transaction: vi.fn((cb: (tx: { query: any; queryOne: any }) => any) =>
    cb({
      query: vi.fn().mockResolvedValue([]),
      queryOne: vi.fn().mockResolvedValue({ stock: 50, is_active: true }),
    }),
  ),
  query: vi.fn(),
  queryOne: vi.fn(),
}));

// Import du service avant les tests
let createSale: typeof import("../salesService").createSale;
beforeAll(async () => {
  const module = await import("../salesService");
  createSale = module.createSale;
});

describe("salesService - createSale", () => {
  const mockStoreId = "test-store-1";
  const mockRecordedBy = "caissier-1";
  const mockItems: SaleItem[] = [
    {
      productId: "prod-1",
      name: "Baguette",
      unitPrice: 500,
      quantity: 2,
      total: 1000,
    },
  ];

  it("déduit correctement le stock après une vente", async () => {
    const { transaction } = await import("../../db");
    const mockTx = {
      query: vi.fn().mockResolvedValue([]),
      queryOne: vi
        .fn()
        .mockResolvedValue({ stock: 50, is_active: true, price: 500 }), // Stock initial de 50 baguettes + prix
    };
    (transaction as Mock).mockImplementationOnce((cb: (tx: { query: any; queryOne: any }) => any) => cb(mockTx));

    await createSale({
      subtotal: 1000,
      discountAmount: 0,
      vatAmount: 0,
      total: 1000,
      paymentMethod: "especes",
      amountPaid: 1000,
      changeReturned: 0,
      items: mockItems,
      storeId: mockStoreId,
      cashierName: mockRecordedBy,
    });

    // Vérifier que le stock est bien déduit : 50 - 2 = 48
    expect(mockTx.query).toHaveBeenCalledWith(
      "UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2",
      [2, "prod-1"],
    );
  });

  it("gère correctement un stock exactement égal à la quantité vendue", async () => {
    const { transaction } = await import("../../db");
    const mockTx = {
      query: vi.fn().mockResolvedValue([]),
      queryOne: vi
        .fn()
        .mockResolvedValue({ stock: 2, is_active: true, price: 500 }), // Seulement 2 baguettes en stock + prix
    };
    (transaction as Mock).mockImplementationOnce((cb: (tx: { query: any; queryOne: any }) => any) => cb(mockTx));

    await createSale({
      subtotal: 1000,
      discountAmount: 0,
      vatAmount: 0,
      total: 1000,
      paymentMethod: "especes",
      amountPaid: 1000,
      changeReturned: 0,
      items: mockItems,
      storeId: mockStoreId,
      cashierName: mockRecordedBy,
    });

    // Stock final à 0
    expect(mockTx.query).toHaveBeenCalledWith(
      "UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2",
      [2, "prod-1"],
    );
  });

  it("gère plusieurs produits dans une même vente", async () => {
    const multiItems: SaleItem[] = [
      {
        productId: "prod-1",
        name: "Baguette",
        unitPrice: 500,
        quantity: 2,
        total: 1000,
      },
      {
        productId: "prod-2",
        name: "Croissant",
        unitPrice: 700,
        quantity: 3,
        total: 2100,
      },
    ];

    const { transaction } = await import("../../db");
    let callCount = 0;
    const mockTx = {
      query: vi.fn().mockResolvedValue([]),
      queryOne: vi.fn(() => {
        // Premier appel : prod-1 a 50 en stock, deuxième appel : prod-2 a 30
        callCount++;
        return Promise.resolve({
          stock: callCount === 1 ? 50 : 30,
          is_active: true,
          price: callCount === 1 ? 500 : 700,
        });
      }),
    };
    (transaction as Mock).mockImplementationOnce((cb: (tx: { query: any; queryOne: any }) => any) => cb(mockTx));

    await createSale({
      subtotal: 3100,
      discountAmount: 0,
      vatAmount: 0,
      total: 3100,
      paymentMethod: "especes",
      amountPaid: 3100,
      changeReturned: 0,
      items: multiItems,
      storeId: mockStoreId,
      cashierName: mockRecordedBy,
    });

    // Vérifier les deux mises à jour de stock (il y a aussi 2 INSERT INTO sale_items, donc 4 appels total)
    expect(mockTx.query).toHaveBeenCalledTimes(4);
    expect(mockTx.query).toHaveBeenCalledWith(
      "UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2",
      [2, "prod-1"],
    );
    expect(mockTx.query).toHaveBeenCalledWith(
      "UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2",
      [3, "prod-2"],
    );
  });
});
