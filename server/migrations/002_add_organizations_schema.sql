-- Migration 002 : Ajout de l'isolation organisationnelle complète
-- Date: 2026-10-09
-- Description: Ajout de organization_id sur toutes les tables métier pour la gestion multi-sociétés

BEGIN;

-- ============================================================================
-- AJOUT DE organization_id SUR TOUTES LES TABLES MÉTIER
-- ============================================================================

-- Matières premières
ALTER TABLE raw_materials
  ADD COLUMN organization_id TEXT REFERENCES organizations(id) NOT NULL DEFAULT 'org-1';
CREATE INDEX idx_raw_materials_org ON raw_materials(organization_id);

-- Produits finis
ALTER TABLE products
  ADD COLUMN organization_id TEXT REFERENCES organizations(id) NOT NULL DEFAULT 'org-1';
CREATE INDEX idx_products_org ON products(organization_id);

-- Recettes
ALTER TABLE recipes
  ADD COLUMN organization_id TEXT REFERENCES organizations(id) NOT NULL DEFAULT 'org-1';
CREATE INDEX idx_recipes_org ON recipes(organization_id);

-- Ingrédients des recettes
ALTER TABLE recipe_ingredients
  ADD COLUMN organization_id TEXT REFERENCES organizations(id) NOT NULL DEFAULT 'org-1';
CREATE INDEX idx_recipe_ingredients_org ON recipe_ingredients(organization_id);

-- Clients
ALTER TABLE customers
  ADD COLUMN organization_id TEXT REFERENCES organizations(id) NOT NULL DEFAULT 'org-1';
CREATE INDEX idx_customers_org ON customers(organization_id);

-- Fournisseurs
ALTER TABLE suppliers
  ADD COLUMN organization_id TEXT REFERENCES organizations(id) NOT NULL DEFAULT 'org-1';
CREATE INDEX idx_suppliers_org ON suppliers(organization_id);

-- Commandes fournisseurs
ALTER TABLE purchase_orders
  ADD COLUMN organization_id TEXT REFERENCES organizations(id) NOT NULL DEFAULT 'org-1';
CREATE INDEX idx_purchase_orders_org ON purchase_orders(organization_id);

-- Mouvements de stock
ALTER TABLE stock_movements
  ADD COLUMN organization_id TEXT REFERENCES organizations(id) NOT NULL DEFAULT 'org-1';
CREATE INDEX idx_stock_movements_org ON stock_movements(organization_id);

-- Ordres de production
ALTER TABLE production_orders
  ADD COLUMN organization_id TEXT REFERENCES organizations(id) NOT NULL DEFAULT 'org-1';
CREATE INDEX idx_production_orders_org ON production_orders(organization_id);

-- Pertes de stock
ALTER TABLE losses
  ADD COLUMN organization_id TEXT REFERENCES organizations(id) NOT NULL DEFAULT 'org-1';
CREATE INDEX idx_losses_org ON losses(organization_id);

-- Ventes
ALTER TABLE sales
  ADD COLUMN organization_id TEXT REFERENCES organizations(id) NOT NULL DEFAULT 'org-1';
CREATE INDEX idx_sales_org ON sales(organization_id);

-- Articles de vente
ALTER TABLE sale_items
  ADD COLUMN organization_id TEXT REFERENCES organizations(id) NOT NULL DEFAULT 'org-1';
CREATE INDEX idx_sale_items_org ON sale_items(organization_id);

-- ============================================================================
-- RENDRE LES COLONNES organization_id OBLIGATOIRES SANS VALEUR PAR DÉFAUT
-- (Une fois les données existantes migrées)
-- ============================================================================
-- ALTER TABLE raw_materials ALTER COLUMN organization_id DROP DEFAULT;
-- ALTER TABLE products ALTER COLUMN organization_id DROP DEFAULT;
-- ... répéter pour toutes les tables

COMMIT;