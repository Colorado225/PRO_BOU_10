import { describe, it, expect, vi } from "vitest";
import {
  createSaleSchema,
  productSchema,
  rawMaterialSchema,
  recipeSchema,
  createProductionOrderSchema,
  createPurchaseOrderSchema,
  createLossSchema,
  createCashTransactionSchema,
  validateBody,
} from "../validators/schemas";

describe("Validation Zod des Schémas API (Phase 2)", () => {
  describe("createSaleSchema", () => {
    it("valide une vente complète valide", () => {
      const validSale = {
        items: [
          {
            productId: "prod-1",
            name: "Baguette Tradition",
            unitPrice: 400,
            quantity: 3,
            total: 1200,
          },
        ],
        subtotal: 1200,
        discountAmount: 0,
        vatAmount: 0,
        total: 1200,
        paymentMethod: "wave",
        amountPaid: 1200,
      };

      const result = createSaleSchema.safeParse(validSale);
      expect(result.success).toBe(true);
    });

    it("rejette une vente sans articles", () => {
      const invalidSale = {
        items: [],
        total: 0,
        paymentMethod: "especes",
      };

      const result = createSaleSchema.safeParse(invalidSale);
      expect(result.success).toBe(false);
    });

    it("rejette une méthode de paiement non reconnue", () => {
      const invalidSale = {
        items: [{ productId: "p1", unitPrice: 500, quantity: 1 }],
        paymentMethod: "bitcoin",
      };

      const result = createSaleSchema.safeParse(invalidSale);
      expect(result.success).toBe(false);
    });
  });

  describe("productSchema", () => {
    it("valide un produit fini avec prix et catégorie", () => {
      const validProduct = {
        name: "Croissant au beurre",
        category: "viennoiserie",
        price: 650,
        costPrice: 350,
        vatRate: 18,
      };

      const result = productSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unit).toBe("unite");
        expect(result.data.isActive).toBe(true);
      }
    });

    it("rejette un produit sans nom ou avec prix négatif", () => {
      expect(productSchema.safeParse({ name: "", category: "pain", price: 100 }).success).toBe(false);
      expect(productSchema.safeParse({ name: "Pain", category: "pain", price: -50 }).success).toBe(false);
    });
  });

  describe("rawMaterialSchema", () => {
    it("valide une matière première avec coût unitaire", () => {
      const validMaterial = {
        name: "Farine T55",
        unit: "kg",
        unitCost: 450,
      };

      const result = rawMaterialSchema.safeParse(validMaterial);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe("ingredient");
        expect(result.data.minStockAlert).toBe(10);
      }
    });
  });

  describe("recipeSchema", () => {
    it("valide une recette avec ingrédients", () => {
      const validRecipe = {
        name: "Recette Pain Chocolat",
        outputYield: 50,
        outputUnit: "unite",
        ingredients: [
          {
            materialId: "mat-1",
            materialName: "Farine",
            quantity: 5,
            unit: "kg",
          },
        ],
      };

      const result = recipeSchema.safeParse(validRecipe);
      expect(result.success).toBe(true);
    });
  });

  describe("createProductionOrderSchema", () => {
    it("valide un ordre de fabrication", () => {
      const validOrder = {
        recipeId: "rec-123",
        targetQuantity: 100,
        batchMultiplier: 2,
        bakerName: "Kouassi",
      };

      const result = createProductionOrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("rejette un ordre avec quantité cible <= 0", () => {
      expect(createProductionOrderSchema.safeParse({ recipeId: "rec-1", targetQuantity: 0 }).success).toBe(false);
    });
  });

  describe("createLossSchema", () => {
    it("valide une déclaration de perte", () => {
      const validLoss = {
        productName: "Baguette Brûlée",
        quantity: 5,
        reason: "Surcuisson four 2",
        destination: "Poubelle / Rebut",
      };

      const result = createLossSchema.safeParse(validLoss);
      expect(result.success).toBe(true);
    });
  });

  describe("createCashTransactionSchema", () => {
    it("valide une entrée de caisse", () => {
      const validTx = {
        type: "entree",
        amount: 25000,
        category: "Fond de caisse",
      };

      const result = createCashTransactionSchema.safeParse(validTx);
      expect(result.success).toBe(true);
    });

    it("rejette un montant négatif ou nul", () => {
      expect(createCashTransactionSchema.safeParse({ type: "in", amount: 0, category: "Test" }).success).toBe(false);
    });
  });

  describe("validateBody middleware", () => {
    it("laisse passer la requête si le body est valide et injecte les données typées", async () => {
      const middleware = validateBody(rawMaterialSchema);
      const req: any = { body: { name: "Sucre", unit: "kg", unitCost: "600" } };
      const res: any = {};
      const next = vi.fn();

      await middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.body.unitCost).toBe(600);
    });

    it("répond 400 avec détails si le body est invalide", async () => {
      const middleware = validateBody(rawMaterialSchema);
      const req: any = { body: { name: "", unit: "kg", unitCost: -10 } };
      const statusFn = vi.fn().mockReturnThis();
      const jsonFn = vi.fn();
      const res: any = { status: statusFn, json: jsonFn };
      const next = vi.fn();

      await middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(statusFn).toHaveBeenCalledWith(400);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Données de requête invalides.",
        }),
      );
    });
  });
});
