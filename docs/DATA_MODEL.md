# DATA_MODEL.md — Modèle de données ERP_BOULANGERIE_CI

État du schéma actuel et modifications prévues pour la version production.

---

## 📋 SCHÉMA ACTUEL (server/schema.sql)

### Tables principales

| Table                  | Clé primaire   | Description                                                      |
| ---------------------- | -------------- | ---------------------------------------------------------------- |
| `company_settings`     | `id TEXT`      | Paramètres légaux de l'entreprise (une seule ligne)              |
| `stores`               | `id TEXT`      | Boutiques / points de vente                                      |
| `users`                | `id TEXT`      | Utilisateurs avec rôle (gerant, caissier, boulanger, magasinier) |
| `products`             | `id TEXT`      | Produits finis vendus en boutique                                |
| `raw_materials`        | `id TEXT`      | Matières premières pour la production                            |
| `recipes`              | `id TEXT`      | Fiches recettes pour les produits                                |
| `recipe_ingredients`   | `id BIGSERIAL` | Lignes d'ingrédients d'une recette                               |
| `production_orders`    | `id TEXT`      | Ordres de fabrication / fournées                                 |
| `sales`                | `id TEXT`      | Ventes / tickets de caisse                                       |
| `sale_items`           | `id BIGSERIAL` | Lignes de produit d'une vente                                    |
| `customers`            | `id TEXT`      | Clients (particuliers & B2B)                                     |
| `suppliers`            | `id TEXT`      | Fournisseurs de matières premières                               |
| `purchase_orders`      | `id TEXT`      | Bons de commande fournisseurs                                    |
| `purchase_order_items` | `id BIGSERIAL` | Lignes d'une commande fournisseur                                |
| `losses`               | `id TEXT`      | Pertes et invendus                                               |
| `cash_transactions`    | `id TEXT`      | Mouvements de caisse                                             |
| `custom_orders`        | `id TEXT`      | Commandes de gâteaux sur-mesure                                  |
| `stock_movements`      | `id TEXT`      | Journal des mouvements de stock                                  |

---

## 🚨 PROBLÈMES IDENTIFIÉS DANS LE SCHÉMA ACTUEL

### 1. Incohérence des types d'identifiants

- Tables principales : `TEXT PRIMARY KEY` (identifiants applicatifs type `prod-1712345678`)
- Tables de lignes : `BIGSERIAL PRIMARY KEY` (IDs auto-incrémentés PostgreSQL)
- **Problème :** Le code frontend/gateway génère des IDs texte pour toutes les entités, ce qui cause des erreurs sur les tables qui attendent des BIGSERIAL

### 2. Clés étrangères manquantes

```sql
-- Manque dans raw_materials
supplier_id       TEXT REFERENCES suppliers(id), -- Actuellement seulement TEXT
store_id          TEXT REFERENCES stores(id),    -- Manquant complètement

-- Manque dans stock_movements
material_id       TEXT NOT NULL REFERENCES raw_materials(id), -- Actuellement seulement TEXT
```

### 3. Colonnes manquantes

- `sales.notes` : référencée dans les services mais absente du schéma
- `organization_id` : sur TOUTES les tables pour l'isolation multi-tenant
- `created_at`/`updated_at` : sur la plupart des tables pour la traçabilité

### 4. Absence d'isolation multi-tenant

Aucune table ne possède de `organization_id` pour rattacher les données à une entreprise cliente du SaaS.

---

## ✅ SCHÉMA CORRIGÉ PRÉVU (PRODUCTION)

### 1. Uniformisation des identifiants

Toutes les tables utiliseront `UUID PRIMARY KEY DEFAULT gen_random_uuid()` pour les IDs générés par PostgreSQL :

```sql
-- Exemple pour sales
CREATE TABLE IF NOT EXISTS sales (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number   TEXT NOT NULL UNIQUE, -- Séquence générée par PostgreSQL
  ...
);

-- Exemple pour sale_items
CREATE TABLE IF NOT EXISTS sale_items (
  id          BIGSERIAL PRIMARY KEY, -- Les lignes peuvent rester en BIGSERIAL
  sale_id     UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  ...
);
```

### 2. Ajout de l'organisation (multi-tenant)

Nouvelle table `organizations` :

```sql
CREATE TABLE IF NOT EXISTS organizations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  subscription_id  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Ajout de `organization_id` sur TOUTES les tables avec contrainte de clé étrangère :

```sql
organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
```

### 3. Séquences pour les numéros de tickets

Création de séquences PostgreSQL pour éviter les doublons :

```sql
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq;
CREATE SEQUENCE IF NOT EXISTS purchase_order_number_seq;
```

### 4. Colonnes de traçabilité systématiques

Ajout sur toutes les tables :

```sql
created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
created_by        UUID NOT NULL REFERENCES users(id),
updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_by        UUID REFERENCES users(id),
```

### 5. Toutes les clés étrangères ajoutées

- `raw_materials.supplier_id` → `suppliers.id`
- `raw_materials.store_id` → `stores.id`
- `stock_movements.material_id` → `raw_materials.id`
- `stock_movements.store_id` → `stores.id`
- Toutes les relations existantes sont préservées et renforcées

---

## 🔄 MIGRATIONS PRÉVUES

1. **Migration 001 :** Ajouter la table `organizations` et la colonne `organization_id` sur toutes les tables
2. **Migration 002 :** Corriger les types d'ID et ajouter les clés étrangères manquantes
3. **Migration 003 :** Créer les séquences pour les numéros de tickets/commandes
4. **Migration 004 :** Ajouter les colonnes `created_at`, `created_by`, `updated_at`, `updated_by`
5. **Migration 005 :** Ajouter les index manquants pour les performances

---

## 📊 INDEX OBLIGATOIRES À AJOUTER

```sql
-- Multitenancy : toujours filtré par organization_id
CREATE INDEX idx_sales_org_date ON sales (organization_id, date DESC);
CREATE INDEX idx_products_org_store ON products (organization_id, store_id);
CREATE INDEX idx_users_org ON users (organization_id);

-- Autres index critiques
CREATE INDEX idx_raw_materials_supplier ON raw_materials (supplier_id);
CREATE INDEX idx_stock_movements_material_date ON stock_movements (material_id, date DESC);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders (supplier_id, date DESC);
```
