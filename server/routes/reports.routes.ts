/**
 * Routes de reporting : statistiques du tableau de bord.
 *
 * Lecture seule : aucune transaction requise, mais toutes les requêtes
 * sont des SELECT sûrs.
 */

import { Router } from "express";
import {
  getTodayStats,
  getRecentSales,
  getLowStockProducts,
  getRecentStockMovements,
} from "../services/reportService";
import { getStores } from "../services/storesQueries";
import { getSuppliers } from "../services/suppliersQueries";
import { getCustomersByStore } from "../services/customersQueries";
import { getRecipesWithIngredients } from "../services/recipeQueries";
import { getProductionOrdersByStore } from "../services/productionQueries";
import { getPurchaseOrdersByStore } from "../services/purchaseQueries";
import { getSalesForStore } from "../services/salesQueries";
import {
  requireAuth,
  requireOrganization,
  getTenantFilters,
  type AuthedRequest,
} from "../auth";

export const reportsRouter = Router();

// L'authentification est maintenant gérée par le middleware global dans server/index.ts

/** StoreId de la requête, vérification de l'association utilisateur */
const storeOf = (req: AuthedRequest): string => {
  if (!req.user?.storeId) {
    throw new Error("Utilisateur non associé à une boutique");
  }
  return req.user.storeId;
};

// ------------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------------

reportsRouter.get(
  "/dashboard/stats",
  requireOrganization,
  async (req: AuthedRequest, res) => {
    try {
      res.json(await getTodayStats(storeOf(req)));
    } catch (e) {
      res.status(403).json({ error: (e as Error).message });
    }
  },
);

reportsRouter.get(
  "/dashboard/recent-sales",
  requireOrganization,
  async (req: AuthedRequest, res) => {
    try {
      res.json(await getRecentSales(storeOf(req)));
    } catch (e) {
      res.status(403).json({ error: (e as Error).message });
    }
  },
);

reportsRouter.get(
  "/dashboard/low-stock-products",
  requireOrganization,
  async (req: AuthedRequest, res) => {
    try {
      res.json(await getLowStockProducts(storeOf(req)));
    } catch (e) {
      res.status(403).json({ error: (e as Error).message });
    }
  },
);

// ------------------------------------------------------------------
// Inventaire & mouvements
// ------------------------------------------------------------------

reportsRouter.get(
  "/inventory/materials/:id/movements",
  requireOrganization,
  async (req: AuthedRequest, res) => {
    try {
      res.json(await getRecentStockMovements(storeOf(req), req.params.id, 50));
    } catch (e) {
      res.status(403).json({ error: (e as Error).message });
    }
  },
);

reportsRouter.get(
  "/inventory/movements/:id",
  requireOrganization,
  async (req: AuthedRequest, res) => {
    try {
      res.json(await getRecentStockMovements(storeOf(req), req.params.id, 50));
    } catch (e) {
      res.status(403).json({ error: (e as Error).message });
    }
  },
);

// ------------------------------------------------------------------
// Références externes
// ------------------------------------------------------------------

reportsRouter.get(
  "/references/stores",
  requireOrganization,
  async (req: AuthedRequest, res) => {
    // On récupère les filtres pour ne retourner que les boutiques de l'organisation
    const filters = getTenantFilters(req.user);
    // Mise à jour de getStores pour supporter le filtrage (sera appliqué dans le service)
    res.json(await getStores(filters));
  },
);

reportsRouter.get("/references/suppliers", async (req: AuthedRequest, res) => {
  res.json(await getSuppliers(storeOf(req)));
});

reportsRouter.get("/references/customers", async (req: AuthedRequest, res) => {
  res.json(await getCustomersByStore(storeOf(req)));
});

reportsRouter.get("/references/recipes", async (req: AuthedRequest, res) => {
  res.json(await getRecipesWithIngredients(storeOf(req)));
});

reportsRouter.get(
  "/references/production-orders",
  async (req: AuthedRequest, res) => {
    res.json(await getProductionOrdersByStore(storeOf(req), 500));
  },
);

reportsRouter.get(
  "/references/purchase-orders",
  async (req: AuthedRequest, res) => {
    res.json(await getPurchaseOrdersByStore(storeOf(req), 500));
  },
);

// ------------------------------------------------------------------
// Ventes historiques (pour les graphiques)
// ------------------------------------------------------------------

reportsRouter.get("/sales/history", async (req: AuthedRequest, res) => {
  const storeId = storeOf(req);
  const { data: sales } = await getSalesForStore(storeId, 1, 200);
  // Agrégation mensuelle simplifiée pour le graphique, à défaut
  const monthly = sales.reduce<Record<string, number>>((acc, s) => {
    const month = new Date(s.date).toISOString().slice(0, 7);
    acc[month] = (acc[month] ?? 0) + s.total;
    return acc;
  }, {});
  res.json({ data: monthly, sales });
});
