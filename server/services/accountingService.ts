/**
 * Service de Génération et d'Export des Journaux Comptables OHADA.
 * Conforme au Système Comptable OHADA révisé (SYSCOHADA) pour la Côte d'Ivoire & UEMOA.
 */

import { query } from "../db";

export interface AccountingPeriodFilter {
  organizationId: string;
  storeId?: string;
  startDate?: string;
  endDate?: string;
}

export interface OhadaJournalEntry {
  date: string;
  pieceNumber: string;
  accountCode: string;
  accountLabel: string;
  label: string;
  debit: number;
  credit: number;
  thirdPartyCode?: string;
  paymentMethod?: string;
}

/**
 * Génère le Journal des Ventes OHADA (Compte 701, 4431, 531, 571, 411)
 */
export const generateSalesJournal = async (
  filter: AccountingPeriodFilter,
): Promise<OhadaJournalEntry[]> => {
  const { organizationId, storeId, startDate, endDate } = filter;

  let sql = `
    SELECT s.id, s.receipt_number, s.date, s.subtotal, s.discount_amount,
           s.vat_amount, s.total, s.payment_method, s.customer_name, s.store_id
      FROM sales s
     WHERE s.organization_id = $1
  `;
  const params: unknown[] = [organizationId];

  if (storeId) {
    params.push(storeId);
    sql += ` AND s.store_id = $${params.length}`;
  }
  if (startDate) {
    params.push(startDate);
    sql += ` AND s.date >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    sql += ` AND s.date <= $${params.length}`;
  }

  sql += ` ORDER BY s.date ASC, s.receipt_number ASC`;

  const sales = await query<{
    id: string;
    receipt_number: string;
    date: string;
    subtotal: number;
    discount_amount: number;
    vat_amount: number;
    total: number;
    payment_method: string;
    customer_name: string | null;
  }>(sql, params);

  const entries: OhadaJournalEntry[] = [];

  for (const s of sales) {
    const dateFormatted = new Date(s.date).toISOString().slice(0, 10);
    const piece = s.receipt_number;
    const client = s.customer_name || "Client Comptant";
    const netHT = Number(s.total) - Number(s.vat_amount);
    const tva = Number(s.vat_amount);
    const totalTTC = Number(s.total);

    // 1. Débit du compte de trésorerie ou compte client
    let debitAccount = "531100"; // Caisse Centrale Espèces
    let debitLabel = "Caisse Espèces";

    if (s.payment_method === "wave") {
      debitAccount = "571110";
      debitLabel = "Compte Wave Business";
    } else if (s.payment_method === "orange_money") {
      debitAccount = "571120";
      debitLabel = "Compte Orange Money CI";
    } else if (s.payment_method === "mtn_money") {
      debitAccount = "571130";
      debitLabel = "Compte MTN MoMo CI";
    } else if (s.payment_method === "carte") {
      debitAccount = "521100";
      debitLabel = "Banque / Carte Bancaire";
    } else if (s.payment_method === "credit_b2b") {
      debitAccount = "411100";
      debitLabel = "Clients - Ventes à terme B2B";
    }

    entries.push({
      date: dateFormatted,
      pieceNumber: piece,
      accountCode: debitAccount,
      accountLabel: debitLabel,
      label: `Encaissement Vente - ${client}`,
      debit: totalTTC,
      credit: 0,
      paymentMethod: s.payment_method,
    });

    // 2. Crédit Compte 701 (Produits des activités ordinaires / Ventes)
    entries.push({
      date: dateFormatted,
      pieceNumber: piece,
      accountCode: "701100",
      accountLabel: "Ventes de Produits Finis de Boulangerie",
      label: `Vente Produits HT - ${piece}`,
      debit: 0,
      credit: netHT,
    });

    // 3. Crédit Compte 4431 (TVA Collectée / Facturée DGI 18%) si applicable
    if (tva > 0) {
      entries.push({
        date: dateFormatted,
        pieceNumber: piece,
        accountCode: "443100",
        accountLabel: "État, TVA facturée sur ventes",
        label: `TVA 18% DGI - ${piece}`,
        debit: 0,
        credit: tva,
      });
    }
  }

  return entries;
};

/**
 * Génère le Journal des Achats OHADA (Compte 601, 4452, 401)
 */
export const generatePurchasesJournal = async (
  filter: AccountingPeriodFilter,
): Promise<OhadaJournalEntry[]> => {
  const { organizationId, storeId, startDate, endDate } = filter;

  let sql = `
    SELECT po.id, po.code, po.date, po.total_amount, po.status,
           po.supplier_id, s.name AS supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON s.id = po.supplier_id
     WHERE po.organization_id = $1
  `;
  const params: unknown[] = [organizationId];

  if (storeId) {
    params.push(storeId);
    sql += ` AND po.store_id = $${params.length}`;
  }
  if (startDate) {
    params.push(startDate);
    sql += ` AND po.date >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    sql += ` AND po.date <= $${params.length}`;
  }

  sql += ` ORDER BY po.date ASC, po.code ASC`;

  const orders = await query<{
    id: string;
    code: string;
    date: string;
    total_amount: number;
    supplier_name: string | null;
  }>(sql, params);

  const entries: OhadaJournalEntry[] = [];

  for (const o of orders) {
    const dateFormatted = new Date(o.date).toISOString().slice(0, 10);
    const piece = o.code || `BC-${o.id.slice(0, 8)}`;
    const supplier = o.supplier_name || "Fournisseur Matières";
    const totalAmount = Number(o.total_amount || 0);

    if (totalAmount <= 0) continue;

    // 1. Débit Compte 6011 (Achats de Matières Premières)
    entries.push({
      date: dateFormatted,
      pieceNumber: piece,
      accountCode: "601100",
      accountLabel: "Achats de Matières Premières & Fournitures",
      label: `Achat Matières - ${supplier}`,
      debit: totalAmount,
      credit: 0,
      thirdPartyCode: supplier,
    });

    // 2. Crédit Compte 4011 (Fournisseurs Dettes d'Exploitation)
    entries.push({
      date: dateFormatted,
      pieceNumber: piece,
      accountCode: "401100",
      accountLabel: "Fournisseurs - Dettes d'exploitation",
      label: `Facture Fournisseur - ${supplier}`,
      debit: 0,
      credit: totalAmount,
      thirdPartyCode: supplier,
    });
  }

  return entries;
};

/**
 * Formate un journal comptable au format CSV universel (séparateur point-virgule)
 * Compatible avec Sage 100, Saari, Odoo et Microsoft Excel.
 */
export const formatJournalToCsv = (entries: OhadaJournalEntry[]): string => {
  const headers = [
    "Date",
    "Numéro Pièce",
    "Compte OHADA",
    "Intitulé Compte",
    "Libellé Écriture",
    "Débit (FCFA)",
    "Crédit (FCFA)",
    "Mode Règlement / Tiers",
  ];

  const rows = entries.map((e) => [
    e.date,
    `"${e.pieceNumber}"`,
    e.accountCode,
    `"${e.accountLabel}"`,
    `"${e.label}"`,
    e.debit.toFixed(0),
    e.credit.toFixed(0),
    `"${e.paymentMethod || e.thirdPartyCode || ""}"`,
  ]);

  return [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
};
