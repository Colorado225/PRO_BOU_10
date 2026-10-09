/**
 * Requêtes de lecture pour les ventes.
 */

import { query, queryOne } from "../db";
import type { Sale } from "../types/bakery";

export const getSale = async (
  id: string,
): Promise<(Sale & { organization_id: string }) | null> => {
  return queryOne<Sale & { organization_id: string }>(
    `SELECT id, receipt_number AS "receiptNumber", date, subtotal, discount_amount AS "discountAmount",
            vat_amount AS "vatAmount", total, payment_method AS "paymentMethod",
            amount_paid AS "amountPaid", change_returned AS "changeReturned",
            customer_id AS "customerId", customer_name AS "customerName",
            cashier_name AS "cashierName", store_id AS "storeId", organization_id, status, notes
       FROM sales WHERE id = $1`,
    [id],
  );
};

export const getSaleByReceipt = async (
  receiptNumber: string,
): Promise<Sale | null> => {
  return queryOne<Sale>(
    `SELECT id, receipt_number AS "receiptNumber", date, subtotal, discount_amount AS "discountAmount",
            vat_amount AS "vatAmount", total, payment_method AS "paymentMethod",
            amount_paid AS "amountPaid", change_returned AS "changeReturned",
            customer_id AS "customerId", customer_name AS "customerName",
            cashier_name AS "cashierName", store_id AS "storeId", status, notes
       FROM sales WHERE receipt_number = $1`,
    [receiptNumber],
  );
};

export const getSalesForStore = async (
  storeId: string,
  page = 1,
  limit = 20,
): Promise<{ data: Sale[]; total: number }> => {
  const offset = (page - 1) * limit;
  // Récupérer les ventes paginées
  const sales = await query<Sale>(
    `SELECT id, receipt_number AS "receiptNumber", date, subtotal, discount_amount AS "discountAmount",
            vat_amount AS "vatAmount", total, payment_method AS "paymentMethod",
            amount_paid AS "amountPaid", change_returned AS "changeReturned",
            customer_id AS "customerId", customer_name AS "customerName",
            cashier_name AS "cashierName", store_id AS "storeId", status, notes
       FROM sales WHERE store_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3`,
    [storeId, limit, offset],
  );
  // Récupérer le nombre total de ventes pour la pagination
  const totalResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM sales WHERE store_id = $1`,
    [storeId],
  );
  const total = parseInt(totalResult[0]?.count || "0", 10);
  return { data: sales, total };
};
