/**
 * Routes d'administration : paramètres légaux/fiscaux de l'entreprise,
 * gestion des utilisateurs, et instantané global (sauvegarde).
 */
import { Router } from "express";
import crypto from "crypto";
import { query, queryOne } from "../db";
import {
  requireAuth,
  requireRole,
  requireOrganization,
  hashPassword,
  getTenantFilters,
  type AuthedRequest,
  type Role,
} from "../auth";

export const adminRouter = Router();

// L'authentification est maintenant gérée par le middleware global dans server/index.ts

/* ----------------------------- COMPANY SETTINGS ---------------------------- */

adminRouter.get(
  "/company",
  requireOrganization,
  async (req: AuthedRequest, res) => {
    if (!req.user?.organizationId) {
      return res.status(403).json({ error: "Utilisateur sans organisation." });
    }
    const row = await queryOne(
      `SELECT establishment_name AS "establishmentName", rccm,
            taxpayer_account AS "taxpayerAccount",
            default_vat_rate AS "defaultVatRate", currency
       FROM company_settings WHERE id = 'default' AND organization_id = $1`,
      [req.user.organizationId],
    );
    res.json(row);
  },
);

adminRouter.put(
  "/company",
  requireOrganization,
  requireRole("gerant"),
  async (req: AuthedRequest, res) => {
    if (!req.user?.organizationId) {
      return res.status(403).json({ error: "Utilisateur sans organisation." });
    }
    const c = req.body;
    await query(
      `INSERT INTO company_settings
       (id, organization_id, establishment_name, rccm, taxpayer_account, default_vat_rate, currency, updated_at)
     VALUES ('default',$1,$2,$3,$4,$5,$6,now())
     ON CONFLICT (id, organization_id) DO UPDATE SET
       establishment_name = EXCLUDED.establishment_name,
       rccm = EXCLUDED.rccm,
       taxpayer_account = EXCLUDED.taxpayer_account,
       default_vat_rate = EXCLUDED.default_vat_rate,
       currency = EXCLUDED.currency,
       updated_at = now()`,
      [
        req.user.organizationId,
        c.establishmentName,
        c.rccm,
        c.taxpayerAccount,
        c.defaultVatRate ?? 0,
        c.currency ?? "XOF",
      ],
    );
    res.json({ updated: true });
  },
);

/* ---------------------------------- USERS ---------------------------------- */

/** Création d'un utilisateur (gérant uniquement). */
adminRouter.post(
  "/users",
  requireOrganization,
  requireRole("gerant"),
  async (req: AuthedRequest, res) => {
    if (!req.user?.organizationId) {
      return res.status(403).json({ error: "Utilisateur sans organisation." });
    }
    const u = req.body as {
      id: string;
      name: string;
      email: string;
      password: string;
      role: Role;
      storeId?: string;
    };

    if (!u.email || !u.password) {
      res.status(400).json({ error: "E-mail et mot de passe requis." });
      return;
    }

    await query(
      `INSERT INTO users (id, organization_id, name, email, password_hash, role, store_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        u.id ?? crypto.randomUUID(),
        req.user.organizationId,
        u.name,
        u.email.toLowerCase().trim(),
        hashPassword(u.password),
        u.role,
        u.storeId ?? null,
      ],
    );
    res.status(201).json({ created: true });
  },
);

/** Active/désactive un compte (gérant uniquement). */
adminRouter.patch(
  "/users/:id",
  requireOrganization,
  requireRole("gerant"),
  async (req: AuthedRequest, res) => {
    if (!req.user?.organizationId) {
      return res.status(403).json({ error: "Utilisateur sans organisation." });
    }
    const { isActive } = req.body as { isActive: boolean };
    await query(
      `UPDATE users SET is_active = $3 WHERE organization_id = $1 AND id = $2`,
      [req.user.organizationId, req.params.id, isActive],
    );
    res.json({ updated: true });
  },
);

/* --------------------------------- BACKUP ---------------------------------- */

/**
 * Instantané complet de la base : sert de sauvegarde JSON (la structure est
 * compatible avec la fonction d'export/import déjà présente côté front).
 */
adminRouter.get(
  "/backup",
  requireOrganization,
  requireRole("gerant"),
  async (req: AuthedRequest, res) => {
    if (!req.user?.organizationId) {
      return res.status(403).json({ error: "Utilisateur sans organisation." });
    }
    const orgId = req.user.organizationId;
    const [
      products,
      materials,
      recipes,
      productionOrders,
      sales,
      customers,
      suppliers,
      purchases,
      losses,
      cashTransactions,
      customOrders,
      company,
      stockMovements,
    ] = await Promise.all([
      query(`SELECT * FROM products WHERE organization_id = $1`, [orgId]),
      query(`SELECT * FROM raw_materials WHERE organization_id = $1`, [orgId]),
      query(`SELECT * FROM recipes WHERE organization_id = $1`, [orgId]),
      query(`SELECT * FROM production_orders WHERE organization_id = $1`, [
        orgId,
      ]),
      query(`SELECT * FROM sales WHERE organization_id = $1`, [orgId]),
      query(`SELECT * FROM customers WHERE organization_id = $1`, [orgId]),
      query(`SELECT * FROM suppliers WHERE organization_id = $1`, [orgId]),
      query(`SELECT * FROM purchase_orders WHERE organization_id = $1`, [
        orgId,
      ]),
      query(`SELECT * FROM losses WHERE organization_id = $1`, [orgId]),
      query(`SELECT * FROM cash_transactions WHERE organization_id = $1`, [
        orgId,
      ]),
      query(`SELECT * FROM custom_orders WHERE organization_id = $1`, [orgId]),
      query(
        `SELECT * FROM company_settings WHERE organization_id = $1 AND id = 'default'`,
        [orgId],
      ),
      query(`SELECT * FROM stock_movements WHERE organization_id = $1`, [
        orgId,
      ]),
    ]);

    res.json({
      products,
      materials,
      recipes,
      productionOrders,
      sales,
      customers,
      suppliers,
      purchases,
      losses,
      cashTransactions,
      customOrders,
      company: company[0] ?? null,
      stockMovements,
      exportedAt: new Date().toISOString(),
    });
  },
);

/** Profil courant enrichi (utilisé par le front pour connaître ses droits). */
adminRouter.get(
  "/session",
  requireOrganization,
  async (req: AuthedRequest, res) => {
    res.json(req.user);
  },
);
