/**
 * Routes de référentiel : produits, matières premières, recettes, clients,
 * fournisseurs, boutiques.
 *
 * Convention : lire exige une session ; modifier exige un rôle suffisant.
 * Toutes les écritures sont paramétrées et toutes les opérations retournent
 * l'objet créé/modifié.
 */

import { Router } from "express";
import crypto from "crypto";
import { query, queryOne, transaction } from "../db";
import { getRecipesWithIngredients } from "../services/recipeQueries";
import { createRecipe } from "../services/recipeService";
import {
  requireAuth,
  requireRole,
  requireOrganization,
  getTenantFilters,
} from "../auth";
import type { AuthedRequest } from "../auth";

export const catalogRouter = Router();

// L'authentification est maintenant gérée par le middleware global dans server/index.ts

const MATERIAL_COLUMNS = `id, code, name, category, current_stock AS "currentStock", unit,
        min_stock_alert AS "minStockAlert", unit_cost AS "unitCost",
        supplier_id AS "supplierId", batch_number AS "batchNumber",
        expiry_date AS "expiryDate", location`;

const RECIPE_COLUMNS = `id, name, product_id AS "productId", product_name AS "productName",
        output_yield AS "outputYield", output_unit AS "outputUnit",
        preparation_time_min AS "preparationTimeMin",
        proofing_time_min AS "proofingTimeMin",
        baking_time_min AS "bakingTimeMin", baking_temp_c AS "bakingTempC",
        instructions, total_cost AS "totalCost", cost_per_unit AS "costPerUnit"`;

/** ------------------------------------------------------------------ */
/**  STORES                                                             */
/** ------------------------------------------------------------------ */

// Tous les utilisateurs authentifiés peuvent lire les boutiques
catalogRouter.get(
  "/stores",
  requireOrganization,
  async (req: AuthedRequest, res) => {
    const filters = getTenantFilters(req.user);
    res.json(
      await query(
        `SELECT id, name, location, phone, manager_name AS "managerName", is_main AS "isMain"
         FROM stores WHERE ${filters.clause} ORDER BY is_main DESC, name`,
        filters.values,
      ),
    );
  },
);

// Seul un gérant peut créer/modifier/supprimer des boutiques
// Gestion des boutiques : réservé au gérant uniquement
catalogRouter.post(
  "/stores",
  requireOrganization,
  requireRole("gerant"),
  async (req: AuthedRequest, res) => {
    const s = req.body as {
      id?: string;
      name: string;
      location: string;
      phone: string;
      managerName?: string;
      isMain?: boolean;
    };
    if (!s.name)
      return res.status(400).json({ error: "Le nom est obligatoire." });
    if (!req.user?.organizationId) {
      return res.status(403).json({ error: "Utilisateur sans organisation." });
    }
    const row = await queryOne(
      `INSERT INTO stores (id, name, location, phone, manager_name, is_main, organization_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, name, location, phone, manager_name AS "managerName", is_main AS "isMain"`,
      [
        s.id ?? crypto.randomUUID(),
        s.name,
        s.location ?? "",
        s.phone ?? "",
        s.managerName ?? null,
        s.isMain ?? false,
        req.user.organizationId,
      ],
    );
    if (!row) return res.status(500).json({ error: "Erreur interne." });
    res.status(201).json(row);
  },
);

catalogRouter.put(
  "/stores/:id",
  requireOrganization,
  requireRole("gerant"),
  async (req: AuthedRequest, res) => {
    if (!req.user?.organizationId) {
      return res.status(403).json({ error: "Utilisateur sans organisation." });
    }
    const s = req.body as {
      name?: string;
      location?: string;
      phone?: string;
      managerName?: string;
      isMain?: boolean;
    };
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (s.name !== undefined) {
      sets.push(`name = $${i++}`);
      params.push(s.name);
    }
    if (s.location !== undefined) {
      sets.push(`location = $${i++}`);
      params.push(s.location);
    }
    if (s.phone !== undefined) {
      sets.push(`phone = $${i++}`);
      params.push(s.phone);
    }
    if (s.managerName !== undefined) {
      sets.push(`manager_name = $${i++}`);
      params.push(s.managerName);
    }
    if (s.isMain !== undefined) {
      sets.push(`is_main = $${i++}`);
      params.push(s.isMain);
    }
    if (sets.length === 0)
      return res.status(400).json({ error: "Aucun champ à mettre à jour." });
    // Ajouter le filtre organisation pour ne modifier que les boutiques de sa propre org
    params.push(req.user.organizationId);
    params.push(req.params.id);
    const result = await query(
      `UPDATE stores SET ${sets.join(", ")} WHERE organization_id = $${i} AND id = $${i + 1}
     RETURNING id, name, location, phone, manager_name AS "managerName", is_main AS "isMain"`,
      params,
    );
    if (result.length === 0)
      return res.status(404).json({ error: "Boutique introuvable." });
    res.json(result[0]);
  },
);

catalogRouter.delete(
  "/stores/:id",
  requireOrganization,
  requireRole("gerant"),
  async (req: AuthedRequest, res) => {
    if (!req.user?.organizationId) {
      return res.status(403).json({ error: "Utilisateur sans organisation." });
    }
    const result = await query(
      `DELETE FROM stores WHERE organization_id = $1 AND id=$2 RETURNING id`,
      [req.user.organizationId, req.params.id],
    );
    if (result.length === 0)
      return res.status(404).json({ error: "Boutique introuvable." });
    res.json({ deleted: true });
  },
);

/** ------------------------------------------------------------------ */
/**  PRODUCTS                                                           */
/** ------------------------------------------------------------------ */

// Tous les utilisateurs authentifiés peuvent lire les produits
catalogRouter.get("/products", requireAuth, async (_req, res) => {
  res.json(
    await query(
      `SELECT id, sku, name, category, price, cost_price AS "costPrice",
              vat_rate AS "vatRate", stock, min_stock AS "minStock", unit,
              barcode, image_icon AS "imageIcon", description,
              recipe_id AS "recipeId", store_id AS "storeId", is_active AS "isActive"
         FROM products ORDER BY name`,
    ),
  );
});

// Gestion des produits : réservé au gérant (catalogue)
catalogRouter.post("/products", requireRole("gerant"), async (req, res) => {
  const p = req.body as {
    id?: string;
    sku: string;
    name: string;
    category: string;
    price: number;
    costPrice?: number;
    vatRate?: number;
    stock?: number;
    minStock?: number;
    unit?: string;
    barcode?: string;
    imageIcon?: string;
    description?: string;
    recipeId?: string;
    storeId?: string;
    isActive?: boolean;
  };
  if (!p.name || !p.sku) {
    return res
      .status(400)
      .json({ error: "Le nom et le SKU sont obligatoires." });
  }
  const row = await queryOne(
    `INSERT INTO products
       (id, sku, name, category, price, cost_price, vat_rate, stock, min_stock,
        unit, barcode, image_icon, description, recipe_id, store_id, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING id, sku, name, category, price, cost_price AS "costPrice",
               vat_rate AS "vatRate", stock, min_stock AS "minStock", unit,
               barcode, image_icon AS "imageIcon", description,
               recipe_id AS "recipeId", store_id AS "storeId", is_active AS "isActive"`,
    [
      p.id ?? null,
      p.sku,
      p.name,
      p.category ?? "autre",
      p.price,
      p.costPrice ?? 0,
      p.vatRate ?? 0,
      p.stock ?? 0,
      p.minStock ?? 0,
      p.unit ?? "unite",
      p.barcode ?? null,
      p.imageIcon ?? null,
      p.description ?? null,
      p.recipeId ?? null,
      p.storeId ?? null,
      p.isActive ?? true,
    ],
  );
  if (!row) return res.status(500).json({ error: "Erreur interne." });
  res.status(201).json(row);
});

catalogRouter.put("/products/:id", requireRole("gerant"), async (req, res) => {
  const p = req.body as {
    name?: string;
    sku?: string;
    category?: string;
    price?: number;
    costPrice?: number;
    vatRate?: number;
    stock?: number;
    minStock?: number;
    unit?: string;
    barcode?: string;
    imageIcon?: string;
    description?: string;
    recipeId?: string;
    isActive?: boolean;
  };
  const sets: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  const push = (col: string, val: unknown) => {
    sets.push(`${col} = $${i++}`);
    params.push(val);
  };
  if (p.name !== undefined) push("name", p.name);
  if (p.sku !== undefined) push("sku", p.sku);
  if (p.category !== undefined) push("category", p.category);
  if (p.price !== undefined) push("price", p.price);
  if (p.costPrice !== undefined) push("cost_price", p.costPrice);
  if (p.vatRate !== undefined) push("vat_rate", p.vatRate);
  if (p.stock !== undefined) push("stock", p.stock);
  if (p.minStock !== undefined) push("min_stock", p.minStock);
  if (p.unit !== undefined) push("unit", p.unit);
  if (p.barcode !== undefined) push("barcode", p.barcode);
  if (p.imageIcon !== undefined) push("image_icon", p.imageIcon);
  if (p.description !== undefined) push("description", p.description);
  if (p.recipeId !== undefined) push("recipe_id", p.recipeId);
  if (p.isActive !== undefined) push("is_active", p.isActive);
  if (sets.length === 0)
    return res.status(400).json({ error: "Aucun champ à mettre à jour." });
  params.push(req.params.id);
  const result = await query(
    `UPDATE products SET ${sets.join(", ")} WHERE id = $${i}
     RETURNING id, sku, name, category, price, cost_price AS "costPrice",
               vat_rate AS "vatRate", stock, min_stock AS "minStock", unit,
               barcode, image_icon AS "imageIcon", description,
               recipe_id AS "recipeId", store_id AS "storeId", is_active AS "isActive"`,
    params,
  );
  if (result.length === 0)
    return res.status(404).json({ error: "Produit introuvable." });
  res.json(result[0]);
});

catalogRouter.delete(
  "/products/:id",
  requireRole("gerant"),
  async (req, res) => {
    const result = await query(
      `DELETE FROM products WHERE id=$1 RETURNING id`,
      [req.params.id],
    );
    if (result.length === 0)
      return res.status(404).json({ error: "Produit introuvable." });
    res.json({ deleted: true });
  },
);

/** ------------------------------------------------------------------ */
/**  RAW MATERIALS                                                      */
/** ------------------------------------------------------------------ */

// Tous les utilisateurs authentifiés peuvent lire les matières premières
catalogRouter.get("/materials", requireAuth, async (_req, res) => {
  res.json(
    await query(
      `SELECT ${MATERIAL_COLUMNS}
         FROM raw_materials ORDER BY name`,
    ),
  );
});

// Gestion des matières premières : réservé au magasinier minimum
catalogRouter.post(
  "/materials",
  requireRole("magasinier"), // ROLE_RANK: magasinier=1, caissier=2, boulanger=2, gerant=3 -> ok pour gerant aussi
  async (req, res) => {
    const m = req.body as {
      id?: string;
      code: string;
      name: string;
      category?: string;
      currentStock?: number;
      unit?: string;
      minStockAlert?: number;
      unitCost?: number;
      supplierId?: string;
      batchNumber?: string;
      expiryDate?: string;
      location?: string;
    };
    if (!m.name || !m.code) {
      return res
        .status(400)
        .json({ error: "Le nom et le code sont obligatoires." });
    }
    const row = await queryOne(
      `INSERT INTO raw_materials
       (id, code, name, category, current_stock, unit, min_stock_alert,
        unit_cost, supplier_id, batch_number, expiry_date, location)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING ${MATERIAL_COLUMNS}`,
      [
        m.id ?? null,
        m.code,
        m.name,
        m.category ?? "autre",
        m.currentStock ?? 0,
        m.unit ?? "kg",
        m.minStockAlert ?? 0,
        m.unitCost ?? 0,
        m.supplierId ?? null,
        m.batchNumber ?? null,
        m.expiryDate ?? null,
        m.location ?? null,
      ],
    );
    if (!row) return res.status(500).json({ error: "Erreur interne." });
    res.status(201).json(row);
  },
);

catalogRouter.put(
  "/materials/:id",
  requireAuth,
  requireRole("magasinier"),
  async (req, res) => {
    const m = req.body as {
      name?: string;
      code?: string;
      category?: string;
      currentStock?: number;
      unit?: string;
      minStockAlert?: number;
      unitCost?: number;
      batchNumber?: string;
      expiryDate?: string;
      location?: string;
      supplierId?: string;
    };
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const push = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (m.name !== undefined) push("name", m.name);
    if (m.code !== undefined) push("code", m.code);
    if (m.category !== undefined) push("category", m.category);
    if (m.currentStock !== undefined) push("current_stock", m.currentStock);
    if (m.unit !== undefined) push("unit", m.unit);
    if (m.minStockAlert !== undefined) push("min_stock_alert", m.minStockAlert);
    if (m.unitCost !== undefined) push("unit_cost", m.unitCost);
    if (m.supplierId !== undefined) push("supplier_id", m.supplierId);
    if (m.batchNumber !== undefined) push("batch_number", m.batchNumber);
    if (m.expiryDate !== undefined) push("expiry_date", m.expiryDate);
    if (m.location !== undefined) push("location", m.location);
    if (sets.length === 0)
      return res.status(400).json({ error: "Aucun champ à mettre à jour." });
    params.push(req.params.id);
    const result = await query(
      `UPDATE raw_materials SET ${sets.join(", ")} WHERE id = $${i}
     RETURNING ${MATERIAL_COLUMNS}`,
      params,
    );
    if (result.length === 0)
      return res.status(404).json({ error: "Matière introuvable." });
    res.json(result[0]);
  },
);

catalogRouter.delete(
  "/materials/:id",
  requireAuth,
  requireRole("magasinier"),
  async (req, res) => {
    const result = await query(
      `DELETE FROM raw_materials WHERE id=$1 RETURNING id`,
      [req.params.id],
    );
    if (result.length === 0)
      return res.status(404).json({ error: "Matière introuvable." });
    res.json({ deleted: true });
  },
);

/** ------------------------------------------------------------------ */
/**  RECIPES — écritures atomiques (fiche + ingrédients)               */
/** ------------------------------------------------------------------ */

const INGREDIENT_COLUMNS = `id, recipe_id AS "recipeId", material_id AS "materialId",
        material_name AS "materialName", quantity, unit, cost`;

// Tous les utilisateurs authentifiés peuvent lire les recettes
catalogRouter.get("/recipes", requireAuth, async (req: AuthedRequest, res) => {
  res.json(await getRecipesWithIngredients(req.user?.storeId ?? "store-1"));
});

// Seul un boulanger ou gérant peut créer/modifier/supprimer des recettes
catalogRouter.post(
  "/recipes",
  requireOrganization,
  requireRole("boulanger"),
  async (req: AuthedRequest, res) => {
    const r = req.body as {
      id?: string;
      name: string;
      productId?: string;
      productName?: string;
      outputYield?: number;
      outputUnit?: string;
      preparationTimeMin?: number;
      proofingTimeMin?: number;
      bakingTimeMin?: number;
      bakingTempC?: number;
      instructions?: string[];
      totalCost?: number;
      costPerUnit?: number;
      ingredients?: {
        materialId: string;
        materialName: string;
        quantity: number;
        unit: string;
        cost: number;
      }[];
    };
    if (!r.name)
      return res
        .status(400)
        .json({ error: "Le nom de la recette est obligatoire." });

    try {
      // La recette ET ses ingrédients sont écrits dans une seule transaction.
      const storeId = req.user?.storeId ?? "store-1";
      const organizationId = req.user?.organizationId;
      if (!organizationId) throw new Error("Utilisateur sans organisation.");

      const id = r.id ?? `rec-${Date.now()}`;
      // createRecipe gère sa propre transaction
      const recipe = await createRecipe(
        {
          id,
          name: r.name,
          productId: r.productId,
          productName: r.productName,
          outputYield: r.outputYield ?? 0,
          outputUnit: r.outputUnit,
          preparationTimeMin: r.preparationTimeMin ?? 0,
          proofingTimeMin: r.proofingTimeMin ?? 0,
          bakingTimeMin: r.bakingTimeMin ?? 0,
          bakingTempC: r.bakingTempC ?? 0,
          instructions: r.instructions ?? [],
          totalCost: r.totalCost ?? 0,
          costPerUnit: r.costPerUnit ?? 0,
          ingredients: r.ingredients ?? [],
          storeId,
          organizationId,
        },
        storeId,
        organizationId,
      );

      const saved = await getRecipesWithIngredients(
        req.user?.storeId ?? "store-1",
      );
      res.status(201).json(saved.find((x) => x.id === recipe.id) ?? recipe);
    } catch (err) {
      console.error("[api] échec recette :", err);
      res
        .status(500)
        .json({ error: "Échec de l'enregistrement de la recette." });
    }
  },
);

catalogRouter.put(
  "/recipes/:id",
  requireAuth,
  requireRole("boulanger"),
  async (req: AuthedRequest, res) => {
    const r = req.body as {
      name?: string;
      productId?: string | null;
      productName?: string | null;
      outputYield?: number;
      outputUnit?: string | null;
      preparationTimeMin?: number;
      proofingTimeMin?: number;
      bakingTimeMin?: number;
      bakingTempC?: number;
      instructions?: string[];
      totalCost?: number;
      costPerUnit?: number;
      ingredients?: {
        materialId: string;
        materialName: string;
        quantity: number;
        unit: string;
        cost: number;
      }[];
    };
    const id = req.params.id;

    try {
      // Mise à jour de la fiche ET remplacement des ingrédients : atomique.
      await transaction(async (tx) => {
        const sets: string[] = [];
        const params: unknown[] = [];
        let i = 1;
        const push = (col: string, val: unknown) => {
          sets.push(`${col} = $${i++}`);
          params.push(val);
        };
        if (r.name !== undefined) push("name", r.name);
        if (r.productId !== undefined) push("product_id", r.productId);
        if (r.productName !== undefined) push("product_name", r.productName);
        if (r.outputYield !== undefined) push("output_yield", r.outputYield);
        if (r.outputUnit !== undefined) push("output_unit", r.outputUnit);
        if (r.preparationTimeMin !== undefined)
          push("preparation_time_min", r.preparationTimeMin);
        if (r.proofingTimeMin !== undefined)
          push("proofing_time_min", r.proofingTimeMin);
        if (r.bakingTimeMin !== undefined)
          push("baking_time_min", r.bakingTimeMin);
        if (r.bakingTempC !== undefined) push("baking_temp_c", r.bakingTempC);
        if (r.instructions !== undefined)
          push("instructions", JSON.stringify(r.instructions));
        if (r.totalCost !== undefined) push("total_cost", r.totalCost);
        if (r.costPerUnit !== undefined) push("cost_per_unit", r.costPerUnit);

        const storeId = req.user?.storeId ?? "store-1";
        if (sets.length > 0) {
          params.push(id);
          params.push(storeId);
          const updated = await tx.query(
            `UPDATE recipes SET ${sets.join(", ")} WHERE id = $${i - 1} AND store_id = $${i} RETURNING id`,
            params,
          );
          if (updated.length === 0) throw new Error("RECIPES_NOT_FOUND");
        }

        if (r.ingredients !== undefined) {
          await tx.query(
            `DELETE FROM recipe_ingredients WHERE recipe_id = $1 AND store_id = $2`,
            [id, storeId],
          );
          for (const ing of r.ingredients) {
            await tx.query(
              `INSERT INTO recipe_ingredients
               (id, recipe_id, material_id, material_name, quantity, unit, cost)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
              [
                `ing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                id,
                ing.materialId,
                ing.materialName,
                ing.quantity,
                ing.unit ?? null,
                ing.cost ?? 0,
              ],
            );
          }
        }
      });

      const saved = await getRecipesWithIngredients(
        req.user?.storeId ?? "store-1",
      );
      const recipe = saved.find((x) => x.id === id);
      if (!recipe)
        return res.status(404).json({ error: "Recette introuvable." });
      res.json(recipe);
    } catch (err) {
      if (err instanceof Error && err.message === "RECIPES_NOT_FOUND") {
        return res.status(404).json({ error: "Recette introuvable." });
      }
      console.error("[api] échec mise à jour recette :", err);
      res.status(500).json({ error: "Échec de la mise à jour de la recette." });
    }
  },
);

catalogRouter.delete(
  "/recipes/:id",
  requireAuth,
  requireRole("boulanger"),
  async (req: AuthedRequest, res) => {
    // recipe_ingredients est supprimé en cascade (ON DELETE CASCADE).
    const storeId = req.user?.storeId ?? "store-1";
    const result = await query(
      `DELETE FROM recipes WHERE id=$1 AND store_id=$2 RETURNING id`,
      [req.params.id, storeId],
    );
    if (result.length === 0)
      return res.status(404).json({ error: "Recette introuvable." });
    res.json({ deleted: true });
  },
);

/** ------------------------------------------------------------------ */
/**  CUSTOMERS                                                          */
/** ------------------------------------------------------------------ */

const CUSTOMER_COLUMNS = `id, name, phone, email, type, address,
        loyalty_points AS "loyaltyPoints", credit_balance AS "creditBalance",
        credit_limit AS "creditLimit", notes`;

// Tous les utilisateurs authentifiés peuvent lire les clients
catalogRouter.get(
  "/customers",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const storeId = req.user?.storeId ?? "store-1";
    res.json(
      await query(
        `SELECT ${CUSTOMER_COLUMNS} FROM customers WHERE store_id = $1 ORDER BY name`,
        [storeId],
      ),
    );
  },
);

// Un caissier, magasinier ou gérant peut gérer les clients
catalogRouter.post(
  "/customers",
  requireAuth,
  requireRole("caissier"),
  async (req: AuthedRequest, res) => {
    const c = req.body as {
      id?: string;
      name: string;
      phone?: string;
      email?: string;
      type?: string;
      address?: string;
      loyaltyPoints?: number;
      creditBalance?: number;
      creditLimit?: number;
      notes?: string;
    };
    if (!c.name)
      return res
        .status(400)
        .json({ error: "Le nom du client est obligatoire." });
    const storeId = req.user?.storeId ?? "store-1";
    const row = await queryOne(
      `INSERT INTO customers
       (id, name, phone, email, type, address, loyalty_points, credit_balance, credit_limit, notes, store_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING ${CUSTOMER_COLUMNS}`,
      [
        c.id ?? null,
        c.name,
        c.phone ?? null,
        c.email ?? null,
        c.type ?? "particulier",
        c.address ?? null,
        c.loyaltyPoints ?? 0,
        c.creditBalance ?? 0,
        c.creditLimit ?? 0,
        c.notes ?? null,
        storeId,
      ],
    );
    if (!row) return res.status(500).json({ error: "Erreur interne." });
    res.status(201).json(row);
  },
);

catalogRouter.put(
  "/customers/:id",
  requireAuth,
  requireRole("caissier"),
  async (req: AuthedRequest, res) => {
    const c = req.body as {
      name?: string;
      phone?: string;
      email?: string;
      type?: string;
      address?: string;
      loyaltyPoints?: number;
      creditBalance?: number;
      creditLimit?: number;
      notes?: string;
    };
    const storeId = req.user?.storeId ?? "store-1";
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const push = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (c.name !== undefined) push("name", c.name);
    if (c.phone !== undefined) push("phone", c.phone);
    if (c.email !== undefined) push("email", c.email);
    if (c.type !== undefined) push("type", c.type);
    if (c.address !== undefined) push("address", c.address);
    if (c.loyaltyPoints !== undefined) push("loyalty_points", c.loyaltyPoints);
    if (c.creditBalance !== undefined) push("credit_balance", c.creditBalance);
    if (c.creditLimit !== undefined) push("credit_limit", c.creditLimit);
    if (c.notes !== undefined) push("notes", c.notes);
    if (sets.length === 0)
      return res.status(400).json({ error: "Aucun champ à mettre à jour." });
    params.push(req.params.id);
    params.push(storeId);
    const result = await query(
      `UPDATE customers SET ${sets.join(", ")} WHERE id = $${i - 1} AND store_id = $${i} RETURNING ${CUSTOMER_COLUMNS}`,
      params,
    );
    if (result.length === 0)
      return res.status(404).json({ error: "Client introuvable." });
    res.json(result[0]);
  },
);

catalogRouter.delete(
  "/customers/:id",
  requireAuth,
  requireRole("gerant"),
  async (req: AuthedRequest, res) => {
    const storeId = req.user?.storeId ?? "store-1";
    const result = await query(
      `DELETE FROM customers WHERE id=$1 AND store_id=$2 RETURNING id`,
      [req.params.id, storeId],
    );
    if (result.length === 0)
      return res.status(404).json({ error: "Client introuvable." });
    res.json({ deleted: true });
  },
);

/** ------------------------------------------------------------------ */
/**  SUPPLIERS                                                          */
/** ------------------------------------------------------------------ */

const SUPPLIER_COLUMNS = `id, name, contact_name AS "contactName", phone, email, address,
        supplied_materials AS "suppliedMaterials", payment_terms AS "paymentTerms",
        pending_balance AS "pendingBalance"`;

// Tous les utilisateurs authentifiés peuvent lire les fournisseurs
catalogRouter.get(
  "/suppliers",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const storeId = req.user?.storeId ?? "store-1";
    res.json(
      await query(
        `SELECT ${SUPPLIER_COLUMNS} FROM suppliers WHERE store_id = $1 ORDER BY name`,
        [storeId],
      ),
    );
  },
);

// Seul un magasinier ou gérant peut gérer les fournisseurs
catalogRouter.post(
  "/suppliers",
  requireAuth,
  requireRole("magasinier"),
  async (req: AuthedRequest, res) => {
    const s = req.body as {
      id?: string;
      name: string;
      contactName?: string;
      phone?: string;
      email?: string;
      address?: string;
      suppliedMaterials?: string[];
      paymentTerms?: string;
      pendingBalance?: number;
    };
    if (!s.name)
      return res
        .status(400)
        .json({ error: "Le nom du fournisseur est obligatoire." });
    const storeId = req.user?.storeId ?? "store-1";
    const row = await queryOne(
      `INSERT INTO suppliers
       (id, name, contact_name, phone, email, address, supplied_materials, payment_terms, pending_balance, store_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING ${SUPPLIER_COLUMNS}`,
      [
        s.id ?? null,
        s.name,
        s.contactName ?? null,
        s.phone ?? null,
        s.email ?? null,
        s.address ?? null,
        JSON.stringify(s.suppliedMaterials ?? []),
        s.paymentTerms ?? null,
        s.pendingBalance ?? 0,
        storeId,
      ],
    );
    if (!row) return res.status(500).json({ error: "Erreur interne." });
    res.status(201).json(row);
  },
);

catalogRouter.put(
  "/suppliers/:id",
  requireAuth,
  requireRole("magasinier"),
  async (req: AuthedRequest, res) => {
    const s = req.body as {
      name?: string;
      contactName?: string;
      phone?: string;
      email?: string;
      address?: string;
      suppliedMaterials?: string[];
      paymentTerms?: string;
      pendingBalance?: number;
    };
    const storeId = req.user?.storeId ?? "store-1";
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const push = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (s.name !== undefined) push("name", s.name);
    if (s.contactName !== undefined) push("contact_name", s.contactName);
    if (s.phone !== undefined) push("phone", s.phone);
    if (s.email !== undefined) push("email", s.email);
    if (s.address !== undefined) push("address", s.address);
    if (s.suppliedMaterials !== undefined)
      push("supplied_materials", JSON.stringify(s.suppliedMaterials));
    if (s.paymentTerms !== undefined) push("payment_terms", s.paymentTerms);
    if (s.pendingBalance !== undefined)
      push("pending_balance", s.pendingBalance);
    if (sets.length === 0)
      return res.status(400).json({ error: "Aucun champ à mettre à jour." });
    params.push(req.params.id);
    params.push(storeId);
    const result = await query(
      `UPDATE suppliers SET ${sets.join(", ")} WHERE id = $${i - 1} AND store_id = $${i} RETURNING ${SUPPLIER_COLUMNS}`,
      params,
    );
    if (result.length === 0)
      return res.status(404).json({ error: "Fournisseur introuvable." });
    res.json(result[0]);
  },
);

catalogRouter.delete(
  "/suppliers/:id",
  requireAuth,
  requireRole("gerant"),
  async (req: AuthedRequest, res) => {
    const storeId = req.user?.storeId ?? "store-1";
    const result = await query(
      `DELETE FROM suppliers WHERE id=$1 AND store_id=$2 RETURNING id`,
      [req.params.id, storeId],
    );
    if (result.length === 0)
      return res.status(404).json({ error: "Fournisseur introuvable." });
    res.json({ deleted: true });
  },
);
