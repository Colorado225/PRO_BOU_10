-- Migration 001 : Initialisation complète du schéma
-- Date: 2026-10-09
-- Description: Création de toutes les tables, contraintes et index de base

-- Table de suivi des migrations
CREATE TABLE IF NOT EXISTS migrations (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  success         BOOLEAN NOT NULL
);

-- ---- Schéma complet intégré ------------------------------------------------
-- (Contenu intégral du schema.sql actuel, version corrigée)

-- ============================================================================
-- SCHEMA COMPLET ERP BOULANGERIE CI
-- ============================================================================

-- Organisations (sociétés clientes du SaaS)
CREATE TABLE IF NOT EXISTS organizations (
  id                   TEXT PRIMARY KEY,
  name                 TEXT NOT NULL,
  slug                 TEXT UNIQUE NOT NULL,
  contact_email        TEXT NOT NULL,
  contact_phone        TEXT,
  address              TEXT,
  subscription_status  TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'trial', 'suspended')),
  subscription_plan    TEXT NOT NULL DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
  trial_ends_at        TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Paramètres de l'entreprise (coordonnées, TVA, devise).
CREATE TABLE IF NOT EXISTS company_settings (
  id                   TEXT PRIMARY KEY,
  establishment_name   TEXT NOT NULL,
  rccm                 TEXT,
  taxpayer_account     TEXT,
  default_vat_rate     NUMERIC(5,2) NOT NULL DEFAULT 0,
  currency             TEXT NOT NULL DEFAULT 'XOF',
  organization_id     TEXT REFERENCES organizations(id)
);

-- Boutiques / points de vente.
CREATE TABLE IF NOT EXISTS stores (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  location     TEXT,
  phone        TEXT,
  manager_name TEXT,
  is_main      BOOLEAN NOT NULL DEFAULT false,
  organization_id TEXT REFERENCES organizations(id)
);

-- Utilisateurs de l'application (employés).
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('gerant','caissier','boulanger','magasinier')),
  store_id        TEXT REFERENCES stores(id),
  organization_id TEXT REFERENCES organizations(id)
);

-- Refresh tokens pour renouvellement de session
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Matières premières (farine, eau, levure...).
CREATE TABLE IF NOT EXISTS raw_materials (
  id              TEXT PRIMARY KEY,
  code            TEXT,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'autre',
  current_stock   NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit            TEXT,
  min_stock_alert NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit_cost       NUMERIC(12,2) NOT NULL DEFAULT 0,
  supplier_id     TEXT,
  batch_number    TEXT,
  expiry_date     DATE,
  location        TEXT
);

-- Produits finis (baguettes, croissants...).
CREATE TABLE IF NOT EXISTS products (
  id              TEXT PRIMARY KEY,
  sku             TEXT,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'pain',
  current_stock   NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit            TEXT,
  min_stock_alert NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_price      NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- Recettes de fabrication.
CREATE TABLE IF NOT EXISTS recipes (
  id                   TEXT PRIMARY KEY,
  name                 TEXT NOT NULL,
  product_id           TEXT REFERENCES products(id),
  product_name         TEXT,
  output_yield         NUMERIC(10,2) NOT NULL DEFAULT 1,
  output_unit          TEXT,
  preparation_time_min INTEGER NOT NULL DEFAULT 0,
  proofing_time_min    INTEGER NOT NULL DEFAULT 0,
  baking_time_min      INTEGER NOT NULL DEFAULT 0,
  baking_temp_c        INTEGER,
  instructions         JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_cost           NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_per_unit        NUMERIC(12,4) NOT NULL DEFAULT 0,
  store_id             TEXT REFERENCES stores(id) NOT NULL
);

-- Ingrédients d'une recette (lignes de la fiche).
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id           TEXT PRIMARY KEY,
  recipe_id    TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  material_id  TEXT NOT NULL REFERENCES raw_materials(id),
  material_name TEXT NOT NULL,
  quantity     NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit         TEXT,
  cost         NUMERIC(12,2) NOT NULL DEFAULT 0,
  store_id     TEXT REFERENCES stores(id) NOT NULL
);

-- Ventes / tickets de caisse.
CREATE TABLE IF NOT EXISTS sales (
  id               TEXT PRIMARY KEY,
  receipt_number   TEXT NOT NULL UNIQUE,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal         NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total            NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method   TEXT NOT NULL DEFAULT 'especes',
  amount_paid      NUMERIC(12,2) NOT NULL DEFAULT 0,
  change_returned  NUMERIC(12,2) NOT NULL DEFAULT 0,
  customer_id      TEXT,
  customer_name    TEXT,
  cashier_name     TEXT,
  store_id         TEXT REFERENCES stores(id),
  status           TEXT NOT NULL DEFAULT 'paye'
);

-- Lignes de vente.
CREATE TABLE IF NOT EXISTS sale_items (
  id          TEXT PRIMARY KEY,
  sale_id     TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id  TEXT REFERENCES products(id),
  name        TEXT NOT NULL,
  unit_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity    NUMERIC(12,2) NOT NULL DEFAULT 0,
  total       NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- Ordres de fabrication (fournées).
CREATE TABLE IF NOT EXISTS production_orders (
  id                  TEXT PRIMARY KEY,
  code                TEXT NOT NULL,
  recipe_id           TEXT REFERENCES recipes(id),
  recipe_name         TEXT,
  product_id          TEXT REFERENCES products(id),
  product_name        TEXT,
  batch_multiplier    NUMERIC(10,2) NOT NULL DEFAULT 1,
  target_quantity     NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_quantity     NUMERIC(12,2),
  status              TEXT NOT NULL CHECK (status IN ('planifie', 'petrissage', 'au_four', 'pret_en_rayon', 'annule')),
  scheduled_time      TIMESTAMPTZ,
  completed_time      TIMESTAMPTZ,
  baker_name          TEXT,
  shift               TEXT,
  store_id            TEXT REFERENCES stores(id) NOT NULL,
  notes               TEXT
);

-- Fournisseurs de matières premières.
CREATE TABLE IF NOT EXISTS suppliers (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  contact_name   TEXT,
  phone          TEXT,
  email          TEXT,
  address        TEXT,
  supplied_materials  JSONB NOT NULL DEFAULT '[]'::jsonb,
  payment_terms       TEXT,
  pending_balance     NUMERIC(12,2) NOT NULL DEFAULT 0,
  store_id             TEXT REFERENCES stores(id) NOT NULL
);

-- Bons de commande fournisseurs.
CREATE TABLE IF NOT EXISTS purchase_orders (
  id             TEXT PRIMARY KEY,
  order_number   TEXT NOT NULL UNIQUE,
  supplier_id    TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name  TEXT,
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  status         TEXT NOT NULL DEFAULT 'commande',
  total_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes          TEXT,
  store_id       TEXT REFERENCES stores(id) NOT NULL
);

-- Lignes d'un bon de commande.
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id           TEXT PRIMARY KEY,
  order_id     TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  material_id  TEXT NOT NULL REFERENCES raw_materials(id),
  material_name TEXT NOT NULL,
  quantity     NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit         TEXT,
  unit_price   NUMERIC(12,2) NOT NULL DEFAULT 0,
  total        NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- Pertes & invendus (anti-gaspillage).
CREATE TABLE IF NOT EXISTS losses (
  id             TEXT PRIMARY KEY,
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  product_id     TEXT,
  product_name   TEXT NOT NULL,
  quantity       NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit           TEXT,
  loss_value     NUMERIC(12,2) NOT NULL DEFAULT 0,
  reason         TEXT NOT NULL,
  destination    TEXT NOT NULL,
  store_id       TEXT REFERENCES stores(id),
  recorded_by    TEXT,
  notes          TEXT
);

-- Mouvements de caisse (fond, encaissements, dépenses, clôture Z).
CREATE TABLE IF NOT EXISTS cash_transactions (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  description  TEXT,
  date         TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by  TEXT,
  store_id     TEXT REFERENCES stores(id)
);

-- Commandes de gâteaux sur-mesure.
CREATE TABLE IF NOT EXISTS custom_orders (
  id                 TEXT PRIMARY KEY,
  order_number       TEXT NOT NULL UNIQUE,
  client_name        TEXT NOT NULL,
  phone              TEXT,
  cake_type          TEXT,
  serving_count      INTEGER DEFAULT 0,
  flavor             TEXT,
  custom_inscription TEXT,
  theme_color        TEXT,
  pickup_date        DATE,
  pickup_time        TEXT,
  total_price        NUMERIC(12,2) NOT NULL DEFAULT 0,
  deposit_paid       NUMERIC(12,2) NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'commande',
  store_id           TEXT REFERENCES stores(id),
  notes              TEXT
);

-- Journal des mouvements de stock (chantier 2.1).
CREATE TABLE IF NOT EXISTS stock_movements (
  id                TEXT PRIMARY KEY,
  material_id       TEXT NOT NULL REFERENCES raw_materials(id),
  material_name     TEXT NOT NULL,
  delta             NUMERIC(12,3) NOT NULL,
  resulting_stock   NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit              TEXT,
  source            TEXT NOT NULL,
  reference         TEXT,
  reason            TEXT,
  recorded_by       TEXT,
  store_id          TEXT REFERENCES stores(id),
  date              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clients (particuliers & B2B).
CREATE TABLE IF NOT EXISTS customers (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  phone          TEXT,
  email          TEXT,
  type           TEXT NOT NULL DEFAULT 'particulier',
  address        TEXT,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  credit_balance  NUMERIC(12,2) NOT NULL DEFAULT 0,
  credit_limit   NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes          TEXT,
  store_id             TEXT REFERENCES stores(id) NOT NULL
);

-- ---- Index utiles ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_org_store     ON users (organization_id, store_id);
CREATE INDEX IF NOT EXISTS idx_stores_org          ON stores (organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_store_date    ON sales (store_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale     ON sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_prod_orders_store   ON production_orders (store_id, status, scheduled_time DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_store       ON recipes (store_id);
CREATE INDEX IF NOT EXISTS idx_recipes_product     ON recipes (product_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients (recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_store ON recipe_ingredients (store_id);
CREATE INDEX IF NOT EXISTS idx_stock_mv_store_material ON stock_movements (store_id, material_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_store_date     ON cash_transactions (store_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_losses_store_date   ON losses (store_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_po_store_date       ON purchase_orders (store_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_po_items_order      ON purchase_order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_store     ON suppliers (store_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_store_pickup ON custom_orders (store_id, pickup_date DESC);
CREATE INDEX IF NOT EXISTS idx_customers_store     ON customers (store_id);