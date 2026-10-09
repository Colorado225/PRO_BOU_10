/**
 * Service métier des bons de commande fournisseurs — crée un bon + ses
 * lignes + mise à jour du stock des matières premières, dans une
 * transaction unique.
 */

import { query, queryOne, transaction } from "../db";
import { randomUUID as uuid } from "node:crypto";
import type { PurchaseOrder, PurchaseOrderItem } from "../types/bakery";

export interface PurchaseOrderInput {
  supplierId?: string;
  supplierName?: string;
  date?: string;
  items: {
    materialId: string;
    materialName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
  }[];
  notes?: string;
}

export const createPurchaseOrder = async (
  input: PurchaseOrderInput,
  storeId: string,
  recordedBy: string,
): Promise<PurchaseOrder> => {
  const id = uuid();
  const orderNumber = `PO-${Date.now().toString(36).toUpperCase()}`;

  return transaction(async (tx) => {
    const totalAmount = input.items.reduce(
      (sum, it) => sum + it.quantity * it.unitPrice,
      0,
    );

    const po = await tx.queryOne<PurchaseOrder>(
      `INSERT INTO purchase_orders
         (id, order_number, supplier_id, supplier_name, date, status, total_amount, notes, store_id)
       VALUES ($1,$2,$3,$4,$5,'commande',$6,$7,$8)
       RETURNING id, order_number AS "orderNumber", supplier_id AS "supplierId",
                 supplier_name AS "supplierName", date, status, total_amount AS "totalAmount", notes`,
      [
        id,
        orderNumber,
        input.supplierId ?? null,
        input.supplierName ?? null,
        input.date ?? null,
        totalAmount,
        input.notes ?? null,
        storeId,
      ],
    );

    if (!po) throw new Error("Impossible d'insérer le bon de commande.");

    // 2. Lignes + mise à jour du stock
    for (const item of input.items) {
      await tx.query(
        `INSERT INTO purchase_order_items
           (id, order_id, material_id, material_name, quantity, unit, unit_price, total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          uuid(),
          po.id,
          item.materialId,
          item.materialName,
          item.quantity,
          item.unit,
          item.unitPrice,
          item.quantity * item.unitPrice,
        ],
      );

      // Récupérer le stock actuel avant mise à jour pour l'historique
      const currentMaterial = await tx.queryOne<{ current_stock: number }>(
        `SELECT current_stock FROM raw_materials WHERE id = $1`,
        [item.materialId],
      );
      const newStock = (currentMaterial?.current_stock ?? 0) + item.quantity;

      await tx.query(
        `UPDATE raw_materials SET current_stock = $1 WHERE id = $2`,
        [newStock, item.materialId],
      );

      await tx.query(
        `INSERT INTO stock_movements
           (id, material_id, material_name, delta, resulting_stock, unit, source,
            reference, reason, recorded_by, store_id, date)
         VALUES ($1,$2,$3,$4,$5,$6,'reception_achat',$7,$8,$9,$10,now())`,
        [
          uuid(),
          item.materialId,
          item.materialName,
          item.quantity,
          newStock,
          item.unit,
          po.id,
          "Réception commande fournisseur",
          recordedBy,
          storeId,
        ],
      );
    }

    return po;
  });
};

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
  limit = 50,
): Promise<PurchaseOrder[]> => {
  return query<PurchaseOrder>(
    `SELECT id, order_number AS "orderNumber", supplier_id AS "supplierId",
            supplier_name AS "supplierName", date, status, total_amount AS "totalAmount", notes
       FROM purchase_orders ORDER BY date DESC LIMIT $1`,
    [limit],
  );
};

export const updatePurchaseOrderStatus = async (
  orderId: string,
  status: string,
): Promise<PurchaseOrder | null> => {
  const rows = await query<PurchaseOrder>(
    `UPDATE purchase_orders SET status = $2 WHERE id = $1 RETURNING id, order_number AS "orderNumber",
            supplier_id AS "supplierId", supplier_name AS "supplierName", date, status,
            total_amount AS "totalAmount", notes`,
    [orderId, status],
  );
  return rows[0] ?? null;
};
