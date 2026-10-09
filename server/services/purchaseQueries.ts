/**
 * Requêtes de lecture pour les bons de commande.
 */

import { query, queryOne } from "../db";
import type { PurchaseOrder } from "../types/bakery";

export const getPurchaseOrder = async (
  id: string,
): Promise<PurchaseOrder | null> => {
  return queryOne<PurchaseOrder>(
    `SELECT id, order_number AS "orderNumber", supplier_id AS "supplierId",
            supplier_name AS "supplierName", date, status, total_amount AS "totalAmount", notes
       FROM purchase_orders WHERE id = $1`,
    [id],
  );
};

export const getPurchaseOrdersByStore = async (
  storeId: string,
  page = 1,
  limit = 20,
): Promise<{ data: PurchaseOrder[]; total: number }> => {
  const offset = (page - 1) * limit;
  // Récupérer les bons de commande paginés
  const orders = await query<PurchaseOrder>(
    `SELECT id, order_number AS "orderNumber", supplier_id AS "supplierId",
            supplier_name AS "supplierName", date, status, total_amount AS "totalAmount", notes
       FROM purchase_orders WHERE store_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3`,
    [storeId, limit, offset],
  );
  // Récupérer le nombre total
  const totalResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM purchase_orders WHERE store_id = $1`,
    [storeId],
  );
  const total = parseInt(totalResult[0]?.count || "0", 10);
  return { data: orders, total };
};
