/**
 * Service d'Onboarding SaaS & Bootstrap d'Organisation.
 * Initialise automatiquement une nouvelle boulangerie avec :
 * - Sa boutique principale
 * - Ses paramètres légaux d'entreprise (conformité DGI)
 * - Son catalogue de démarrage (matières premières, produits finis et recettes types).
 */

import { query, queryOne, transaction } from "../db";
import { randomUUID } from "node:crypto";

export interface OnboardingParams {
  organizationId: string;
  establishmentName: string;
  storeName?: string;
  phone?: string;
  city?: string;
}

export const bootstrapOrganization = async (params: OnboardingParams) => {
  const { organizationId, establishmentName, phone, city } = params;
  const storeName = params.storeName || `${establishmentName} - Boutique Principale`;
  const storeId = `store-${organizationId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}-1`;

  return transaction(async (tx) => {
    // 1. Créer ou mettre à jour les paramètres de l'entreprise (DGI Côte d'Ivoire)
    await tx.query(
      `INSERT INTO company_settings
       (id, establishment_name, rccm, taxpayer_account, default_vat_rate, currency, organization_id)
       VALUES ($1, $2, $3, $4, 18, 'XOF', $5)
       ON CONFLICT (id) DO UPDATE SET
         establishment_name = EXCLUDED.establishment_name,
         organization_id = EXCLUDED.organization_id`,
      [
        `company-${organizationId}`,
        establishmentName,
        `CI-ABJ-${new Date().getFullYear()}-B-${Math.floor(1000 + Math.random() * 9000)}`,
        `CC-${Math.floor(1000000 + Math.random() * 9000000)}`,
        organizationId,
      ],
    );

    // 2. Créer la boutique principale
    const store = await tx.queryOne<{ id: string; name: string }>(
      `INSERT INTO stores (id, name, location, phone, manager_name, is_main, organization_id)
       VALUES ($1, $2, $3, $4, $5, true, $6)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name`,
      [
        storeId,
        storeName,
        city || "Abidjan, Côte d'Ivoire",
        phone || "+225 07 00 00 00 00",
        establishmentName,
        organizationId,
      ],
    );

    // 3. Mettre à jour les utilisateurs de l'organisation pour leur assigner cette boutique
    await tx.query(
      `UPDATE users SET store_id = $1 WHERE organization_id = $2 AND (store_id IS NULL OR store_id = '')`,
      [storeId, organizationId],
    );

    // 4. Initialiser le catalogue de matières premières de démarrage
    const rawMaterials = [
      { name: "Farine de blé T55", code: "MAT-FAR-T55", unit: "kg", unitCost: 400, stock: 500, alert: 100 },
      { name: "Beurre de tourage 82%", code: "MAT-BEU-82", unit: "kg", unitCost: 2200, stock: 50, alert: 15 },
      { name: "Levure fraîche de boulangerie", code: "MAT-LEV-01", unit: "kg", unitCost: 2500, stock: 20, alert: 5 },
      { name: "Sucre fin cristallisé", code: "MAT-SUC-01", unit: "kg", unitCost: 600, stock: 100, alert: 20 },
      { name: "Sel de mer fin", code: "MAT-SEL-01", unit: "kg", unitCost: 300, stock: 50, alert: 10 },
      { name: "Chocolat bâtons 44%", code: "MAT-CHO-44", unit: "kg", unitCost: 3500, stock: 30, alert: 10 },
      { name: "Eau filtrée", code: "MAT-EAU-01", unit: "L", unitCost: 50, stock: 1000, alert: 200 },
      { name: "Sacs Baguettes Kraft", code: "MAT-EMB-BAG", unit: "unite", unitCost: 25, stock: 1000, alert: 200 },
    ];

    const matMap = new Map<string, string>();
    for (const rm of rawMaterials) {
      const matId = `mat-${organizationId.slice(0, 6)}-${rm.code.toLowerCase()}`;
      matMap.set(rm.name, matId);
      await tx.query(
        `INSERT INTO raw_materials
         (id, code, name, category, unit, unit_cost, current_stock, min_stock_alert, location, organization_id)
         VALUES ($1, $2, $3, 'ingredient', $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [matId, rm.code, rm.name, rm.unit, rm.unitCost, rm.stock, rm.alert, "Fournil Principal", organizationId],
      );
    }

    // 5. Initialiser les produits finis de démarrage (TVA 0% sur le pain, 18% sur viennoiseries/boissons)
    const products = [
      { name: "Baguette Tradition Artisanale", sku: "PRD-BAG-TRAD", category: "pains", price: 300, cost: 120, vat: 0, stock: 200, barcode: "200000000001" },
      { name: "Pain de Campagne au Levain", sku: "PRD-PAI-CAMP", category: "pains", price: 1000, cost: 450, vat: 0, stock: 40, barcode: "200000000002" },
      { name: "Croissant Pur Beurre", sku: "PRD-CRO-BEUR", category: "viennoiseries", price: 500, cost: 220, vat: 18, stock: 80, barcode: "200000000003" },
      { name: "Pain au Chocolat Feuilleté", sku: "PRD-PAC-FEUIL", category: "viennoiseries", price: 600, cost: 280, vat: 18, stock: 80, barcode: "200000000004" },
      { name: "Pain de Mie Toast", sku: "PRD-PDM-TOAST", category: "pains", price: 1200, cost: 500, vat: 0, stock: 30, barcode: "200000000005" },
      { name: "Café Espresso Arabica", sku: "PRD-BOI-CAFE", category: "boissons", price: 500, cost: 100, vat: 18, stock: 150, barcode: "200000000006" },
    ];

    const prodMap = new Map<string, string>();
    for (const p of products) {
      const prodId = `prod-${organizationId.slice(0, 6)}-${p.sku.toLowerCase()}`;
      prodMap.set(p.name, prodId);
      await tx.query(
        `INSERT INTO products
         (id, sku, name, category, price, cost_price, vat_rate, stock, min_stock, unit, barcode, store_id, organization_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 10, 'unite', $9, $10, $11, true)
         ON CONFLICT (id) DO NOTHING`,
        [prodId, p.sku, p.name, p.category, p.price, p.cost, p.vat, p.stock, p.barcode, storeId, organizationId],
      );
    }

    // 6. Initialiser les recettes de base
    const recipes = [
      {
        name: "Recette Baguette Tradition (100 pcs)",
        productName: "Baguette Tradition Artisanale",
        outputYield: 100,
        outputUnit: "baguettes",
        prepMin: 30,
        proofMin: 90,
        bakeMin: 22,
        bakeTemp: 240,
        instructions: ["Pétrissage lent 8 min", "Autolyse 30 min", "Pointage en bac 1h", "Façonnage manuel", "Cuisson sole avec buée"],
        totalCost: 12000,
        costPerUnit: 120,
        ingredients: [
          { name: "Farine de blé T55", qty: 25, unit: "kg", cost: 10000 },
          { name: "Eau filtrée", qty: 17.5, unit: "L", cost: 875 },
          { name: "Sel de mer fin", qty: 0.45, unit: "kg", cost: 135 },
          { name: "Levure fraîche de boulangerie", qty: 0.15, unit: "kg", cost: 375 },
          { name: "Sacs Baguettes Kraft", qty: 100, unit: "unite", cost: 2500 },
        ],
      },
      {
        name: "Recette Croissant Pur Beurre (80 pcs)",
        productName: "Croissant Pur Beurre",
        outputYield: 80,
        outputUnit: "croissants",
        prepMin: 45,
        proofMin: 120,
        bakeMin: 18,
        bakeTemp: 190,
        instructions: ["Pétrissage détrempe", "Repos au froid 2h", "Tourage 3 tours simples", "Détaillage triangles 70g", "Pousse 26°C et dorure"],
        totalCost: 17600,
        costPerUnit: 220,
        ingredients: [
          { name: "Farine de blé T55", qty: 5, unit: "kg", cost: 2000 },
          { name: "Beurre de tourage 82%", qty: 1.5, unit: "kg", cost: 3300 },
          { name: "Sucre fin cristallisé", qty: 0.6, unit: "kg", cost: 360 },
          { name: "Levure fraîche de boulangerie", qty: 0.2, unit: "kg", cost: 500 },
          { name: "Sel de mer fin", qty: 0.1, unit: "kg", cost: 30 },
          { name: "Eau filtrée", qty: 2.5, unit: "L", cost: 125 },
        ],
      },
    ];

    for (const r of recipes) {
      const recId = `rec-${organizationId.slice(0, 6)}-${Math.random().toString(36).slice(2, 7)}`;
      const productId = prodMap.get(r.productName) || null;

      await tx.query(
        `INSERT INTO recipes
         (id, name, product_id, product_name, output_yield, output_unit, preparation_time_min,
          proofing_time_min, baking_time_min, baking_temp_c, instructions, total_cost, cost_per_unit, store_id, organization_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (id) DO NOTHING`,
        [recId, r.name, productId, r.productName, r.outputYield, r.outputUnit, r.prepMin, r.proofMin, r.bakeMin, r.bakeTemp, r.instructions, r.totalCost, r.costPerUnit, storeId, organizationId],
      );

      for (const ing of r.ingredients) {
        const matId = matMap.get(ing.name);
        if (matId) {
          await tx.query(
            `INSERT INTO recipe_ingredients (recipe_id, material_id, material_name, quantity, unit, organization_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [recId, matId, ing.name, ing.qty, ing.unit, organizationId],
          );
        }
      }
    }

    return {
      organizationId,
      storeId,
      storeName,
      status: "initialized",
      materialsCreated: rawMaterials.length,
      productsCreated: products.length,
      recipesCreated: recipes.length,
    };
  });
};
