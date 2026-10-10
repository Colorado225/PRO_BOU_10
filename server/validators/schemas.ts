/**
 * Schémas de validation Zod pour l'API BoulangeriePro.
 * Assure la validation stricte des corps de requêtes (Body Validation).
 */
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

/**
 * Middleware générique de validation Zod.
 */
export const validateBody = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Données de requête invalides.",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
        return;
      }
      res.status(400).json({ success: false, error: "Validation échouée." });
    }
  };
};

/* -------------------------------------------------------------------------- */
/*                         CATALOGUE & RÉFÉRENTIEL                            */
/* -------------------------------------------------------------------------- */

export const storeSchema = z.object({
  name: z.string().min(1, "Le nom de la boutique est obligatoire"),
  location: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  managerName: z.string().optional().nullable(),
  isMain: z.boolean().optional().default(false),
});

export const productSchema = z.object({
  name: z.string().min(1, "Le nom du produit est obligatoire"),
  sku: z.string().optional().nullable(),
  category: z.string().min(1, "La catégorie est obligatoire"),
  price: z.coerce.number().min(0, "Le prix doit être positif ou nul"),
  costPrice: z.coerce.number().min(0).optional().default(0),
  vatRate: z.coerce.number().min(0).max(100).optional().default(0),
  stock: z.coerce.number().optional().default(0),
  minStock: z.coerce.number().optional().default(5),
  unit: z.string().optional().default("unite"),
  barcode: z.string().optional().nullable(),
  storeId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const rawMaterialSchema = z.object({
  name: z.string().min(1, "Le nom de la matière première est obligatoire"),
  code: z.string().optional().nullable(),
  category: z.string().optional().default("ingredient"),
  unit: z.string().min(1, "L'unité est obligatoire"),
  unitCost: z.coerce.number().min(0, "Le coût unitaire doit être positif ou nul"),
  currentStock: z.coerce.number().optional().default(0),
  minStockAlert: z.coerce.number().optional().default(10),
  supplierId: z.string().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});

export const recipeSchema = z.object({
  name: z.string().min(1, "Le nom de la recette est obligatoire"),
  productId: z.string().optional().nullable(),
  productName: z.string().optional().nullable(),
  outputYield: z.coerce.number().min(0).optional().default(1),
  outputUnit: z.string().optional().default("unite"),
  preparationTimeMin: z.coerce.number().min(0).optional().default(0),
  proofingTimeMin: z.coerce.number().min(0).optional().default(0),
  bakingTimeMin: z.coerce.number().min(0).optional().default(0),
  bakingTempC: z.coerce.number().min(0).optional().default(0),
  instructions: z.array(z.string()).optional().default([]),
  totalCost: z.coerce.number().min(0).optional().default(0),
  costPerUnit: z.coerce.number().min(0).optional().default(0),
  ingredients: z
    .array(
      z.object({
        id: z.string().optional(),
        materialId: z.string().min(1, "ID matière requis"),
        materialName: z.string().min(1, "Nom matière requis"),
        quantity: z.coerce.number().min(0, "Quantité positive requise"),
        unit: z.string().default("kg"),
        cost: z.coerce.number().min(0).optional().default(0),
      }),
    )
    .optional()
    .default([]),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Le nom du client est obligatoire"),
  phone: z.string().min(1, "Le numéro de téléphone est obligatoire"),
  email: z.string().email("Email invalide").optional().nullable(),
  type: z.enum(["particulier", "b2b_hotel", "b2b_restaurant", "b2b_revendeur"]).default("particulier"),
  address: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  creditLimit: z.coerce.number().min(0).optional().default(0),
  outstandingBalance: z.coerce.number().optional().default(0),
  loyaltyPoints: z.coerce.number().optional().default(0),
  notes: z.string().optional().nullable(),
});

export const supplierSchema = z.object({
  name: z.string().min(1, "Le nom du fournisseur est obligatoire"),
  contactName: z.string().optional().nullable(),
  phone: z.string().min(1, "Le téléphone est obligatoire"),
  email: z.string().email("Email invalide").optional().nullable(),
  address: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  leadTimeDays: z.coerce.number().min(0).optional().default(1),
  rating: z.coerce.number().min(0).max(5).optional().default(5),
  notes: z.string().optional().nullable(),
});

/* -------------------------------------------------------------------------- */
/*                                OPÉRATIONS                                  */
/* -------------------------------------------------------------------------- */

export const saleItemSchema = z.object({
  productId: z.string().min(1, "ID produit requis"),
  name: z.string().optional().default("Article"),
  unitPrice: z.coerce.number().min(0, "Prix unitaire positif"),
  quantity: z.coerce.number().min(1, "Quantité minimale 1"),
  total: z.coerce.number().min(0).optional(),
});

export const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "La vente doit contenir au moins un article"),
  subtotal: z.coerce.number().min(0).optional().default(0),
  discountAmount: z.coerce.number().min(0).optional().default(0),
  vatAmount: z.coerce.number().min(0).optional().default(0),
  total: z.coerce.number().min(0).optional().default(0),
  paymentMethod: z.enum([
    "especes",
    "wave",
    "orange_money",
    "mtn_money",
    "carte",
    "credit_b2b",
  ]),
  amountPaid: z.coerce.number().min(0).optional().default(0),
  changeReturned: z.coerce.number().min(0).optional().default(0),
  customerId: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  cashierName: z.string().optional(),
  storeId: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export const createProductionOrderSchema = z.object({
  recipeId: z.string().min(1, "ID de recette obligatoire"),
  recipeName: z.string().optional(),
  productId: z.string().optional().nullable(),
  productName: z.string().optional().nullable(),
  batchMultiplier: z.coerce.number().min(0.1).optional().default(1),
  targetQuantity: z.coerce.number().min(1, "Quantité cible minimale 1"),
  scheduledTime: z.string().optional().nullable(),
  completedTime: z.string().optional().nullable(),
  bakerName: z.string().optional().nullable(),
  shift: z.string().optional().nullable(),
  storeId: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export const purchaseOrderItemSchema = z.object({
  materialId: z.string().min(1, "ID matière requis"),
  materialName: z.string().optional().default("Matière"),
  quantity: z.coerce.number().min(0.01, "Quantité positive requise"),
  unit: z.string().default("kg"),
  unitPrice: z.coerce.number().min(0, "Prix positif requis"),
  total: z.coerce.number().min(0).optional(),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "ID fournisseur obligatoire"),
  supplierName: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, "Au moins une ligne d'achat requise"),
  expectedDeliveryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  storeId: z.string().optional(),
});

export const createLossSchema = z.object({
  productName: z.string().min(1, "Nom du produit obligatoire"),
  productId: z.string().optional().nullable(),
  quantity: z.coerce.number().min(0.01, "Quantité de perte requise"),
  unit: z.string().optional().default("unite"),
  lossValue: z.coerce.number().min(0).optional().default(0),
  reason: z.string().min(1, "Motif de la perte obligatoire"),
  destination: z.string().min(1, "Destination de la perte obligatoire"),
  recordedBy: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  storeId: z.string().optional(),
});

export const createCashTransactionSchema = z.object({
  type: z.enum(["in", "out", "entree", "sortie", "apport", "retrait", "depense"]),
  amount: z.coerce.number().min(1, "Montant supérieur à 0 obligatoire"),
  category: z.string().min(1, "Catégorie de mouvement obligatoire"),
  description: z.string().optional().nullable(),
  paymentMethod: z.string().optional().default("especes"),
  recordedBy: z.string().optional().nullable(),
  storeId: z.string().optional(),
});

export const companySettingsSchema = z.object({
  establishmentName: z.string().min(1, "Nom de l'établissement obligatoire"),
  rccm: z.string().optional().nullable(),
  taxpayerAccount: z.string().optional().nullable(),
  defaultVatRate: z.coerce.number().min(0).max(100).optional().default(18),
  currency: z.string().optional().default("XOF"),
});
