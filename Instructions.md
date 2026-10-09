# TODO List - ERP Boulangerie (Phase 0/1/2)

## 📋 Phase 0 : Sécurité de base (Terminée)

- [x] Implémenter l'authentification sécurisée avec cookies HttpOnly/Secure/SameSite
- [x] Mettre en place le système de refresh tokens (génération, révocation)
- [x] Activer requireAuth global sur toutes les routes (sauf login/register)
- [x] Ajouter le middleware requireRole pour le contrôle d'accès RBAC
- [x] Corriger les erreurs TypeScript dans auth.ts et les middlewares

## 🚀 Phase 1 : P0 - Corrections critiques (Terminée)

- [x] Corriger les incohérences de schéma PostgreSQL :
  - [x] Uniformiser les clés primaires en TEXT (remplacer BIGSERIAL)
  - [x] Utiliser TIMESTAMPTZ pour toutes les dates
  - [x] Ajouter les clés étrangères manquantes
- [x] Mettre en place le système de migrations versionnées :
  - [x] Créer le dossier server/migrations
  - [x] Générer 001_init_schema.sql avec le schéma corrigé
  - [x] Réécrire migrate.ts pour supporter les migrations transactionnelles
  - [x] Ajouter un audit trail des migrations exécutées
- [x] Implémenter l'isolation multi-tenant (store_id) :
  - [x] Ajouter la colonne store_id (TEXT REFERENCES stores(id) NOT NULL) sur toutes les tables principales :
    - [x] recipes
    - [x] suppliers
    - [x] customers
    - [x] purchase_orders
    - [x] recipe_ingredients
  - [x] Vérifier toutes les lectures : ajouter le filtre WHERE store_id = $1 dans toutes les requêtes
  - [x] Vérifier toutes les écritures : systématiquement renseigner store_id lors des créations
  - [x] Corriger les routes de modification/suppression pour filtrer par store_id

## 📦 Phase 2 : Post-requêtes PostgreSQL (En cours)

### Isolation organisationnelle (Terminée)

- [x] Implémenter l'isolation organisationnelle supérieure (gestion multi-sociétés)
  - [x] Création de la migration 002_add_organizations_schema.sql
  - [x] Ajout de organization_id sur toutes les tables métier avec clés étrangères
  - [x] Ajout d'index sur organization_id pour les performances
  - [x] Mise à jour du seed.ts pour inclure organization_id dans toutes les insertions
- [x] Vérifier que les utilisateurs ne peuvent accéder qu'aux données de leur organisation
- [x] Ajouter des contrôles d'accès au niveau des organisations
  - [x] Implémentation du middleware requireOrganization
  - [x] Ajout des helpers getOrganizationFilter et getTenantFilters
  - [x] Intégration dans toutes les routes principales :
    - ✅ operations.routes.ts (ventes/production)
    - ✅ catalog.routes.ts (référentiel)
    - ✅ reports.routes.ts (rapports)
    - ✅ admin.routes.ts (administration)

### Vérifications complémentaires

- [x] Vérifier toutes les fonctions create\* pour s'assurer que store_id est systématiquement renseigné :
  - [x] createPurchaseOrder (purchaseService.ts) - corrigé
  - [x] createProductionOrder (productionService.ts) - corrigé (ajout organization_id)
  - [x] createStockMovement (inventoryService.ts) - corrigé (ajout organization_id)
  - [x] adjustMaterialStock (inventoryService.ts) - vérifié
  - [x] createLoss (inventoryService.ts) - corrigé (ajout organization_id)
  - [x] createRecipe (recipeService.ts) - corrigé (ajout store_id/organization_id)
- [x] Vérifier toutes les requêtes globales pour le filtrage store_id :
  - [x] getRecipesWithIngredients (recipeQueries.ts) - corrigé
  - [x] getPurchaseOrdersByStore (purchaseQueries.ts) - vérifié
  - [x] reportService.ts - corrigé
  - [x] Toutes les requêtes admin filtrées par organization_id
  - [x] Toutes les routes utilisateurs filtrées par store_id
- [x] Tester le système de migrations :
  - [x] Vérifier la fonctionnalité de rollback
  - [x] Vérifier l'audit trail des migrations
  - [x] Tester l'exécution des migrations sur une base vide

### Améliorations du schéma

- [x] Vérifier la cohérence entre le schéma SQL et les types TypeScript :
  - [x] Ajout de `organizationId` dans toutes les interfaces d'entrée
  - [x] Ajout des interfaces manquantes (`StockMovementInput`, `LossInput`)
  - [x] Mise à jour des types frontend avec les champs de traçabilité
- [x] Uniformiser les noms de colonnes (snake_case en base, camelCase en API) :
  - [x] Vérification complète du mapping existant (déjà conforme)
  - [x] Toutes les requêtes SQL utilisent déjà les alias corrects (`store_id AS "storeId"`)
- [x] Ajouter des index sur les colonnes fréquemment utilisées (store_id, date, etc.) :
  - [x] Index multi-tenant : `organization_id` et `store_id` sur toutes les tables appropriées
  - [x] Index de date/tri sur `scheduled_time`, `date`, `pickup_date`
  - [x] Index de jointure sur les clés étrangères (sale_id, order_id, recipe_id)
  - [x] Index composites optimisés pour les requêtes métier les plus courantes

### Normalisation des API

- [x] Uniformiser les formats de réponse API :
  - [x] Définition d'un schéma standard `{ success: boolean, data?: T, message?: string, error?: string }`
  - [x] Mise à jour des routes principales dans operations.routes.ts
  - [x] Standardisation des réponses d'erreur et de succès
- [x] Ajouter des messages d'erreur cohérents :
  - [x] Toutes les routes d'operations utilisent désormais le schéma standard `{ success: false, error: "..." }`
  - [x] Suppression des réponses d'erreur non conformes
  - [x] Ajout des vérifications de storeId pour les requêtes de liste
- [x] Tester l'isolation multi-tenant : un utilisateur ne peut pas accéder aux données d'un autre store
  - [x] Audit complet de toutes les requêtes SQL : toutes ont un filtre `store_id`
  - [x] Toutes les créations de données renseignent systématiquement `store_id` et `organization_id`
  - [x] Les routes vérifient systématiquement l'appartenance de l'utilisateur à un store avant toute opération
- [x] Implémenter la pagination pour les listes importantes :
  - [x] Routes des ventes (`/sales`) avec paramètres `page` et `limit`
  - [x] Routes des ordres de production (`/production-orders`)
  - [x] Routes des bons de commande (`/purchase-orders`)
  - [x] Schéma de réponse standard avec objet `pagination` : `{ total, page, limit, totalPages }`

## 🔐 Authentification avancée (Terminée)

- [x] Implémenter le système complet d'authentification compatible Neon Auth
- [x] Créer la migration 004 pour les champs d'authentification avancés
  - [x] email_verified_at (vérification d'email)
  - [x] password_reset_token et password_reset_expires_at (réinitialisation)
  - [x] email_verification_token et email_verification_expires_at (OTP)
  - [x] last_login_at (audit)
  - [x] failed_login_attempts et locked_until (protection brute-force)
- [x] Créer le service d'envoi d'emails (server/services/emailService.ts)
  - [x] Templates HTML professionnels pour tous les emails
  - [x] Email de vérification avec code OTP (6 chiffres)
  - [x] Email de réinitialisation de mot de passe
  - [x] Email de bienvenue après vérification
  - [x] Mode développement (logs console) et production (SMTP)
- [x] Implémenter les routes d'authentification avancées
  - [x] POST /api/auth/register (avec envoi OTP automatique)
  - [x] POST /api/auth/verify-email (vérification par OTP)
  - [x] POST /api/auth/resend-verification (renvoi du code)
  - [x] POST /api/auth/login (avec protection brute-force 5 tentatives/15 min)
  - [x] POST /api/auth/forgot-password (demande de réinitialisation)
  - [x] POST /api/auth/reset-password (réinitialisation effective)
  - [x] POST /api/auth/change-password (changement authentifié)
- [x] Créer les composants frontend
  - [x] ForgotPasswordView.tsx (demande de réinitialisation)
  - [x] VerifyEmailView.tsx (vérification OTP avec countdown)
  - [x] ResetPasswordView.tsx (nouveau mot de passe)
  - [x] Intégration dans App.tsx avec navigation entre toutes les vues
- [x] Mettre à jour SignUpView pour rediriger vers vérification email
- [x] Mettre à jour LoginView avec lien "Mot de passe oublié"
- [x] Toutes les réponses API utilisent le format standard `{ success, data, message, error }`
- [x] Protection contre les attaques brute-force (verrouillage après 5 tentatives)
- [x] Auto-login après vérification d'email et réinitialisation de mot de passe
- [x] Révocation des sessions lors du changement de mot de passe

## 🧪 Tests (Terminés)

- [x] Tester l'isolation multi-tenant : un utilisateur ne peut pas accéder aux données d'un autre store (15 tests)
- [x] Tester les migrations versionnées (23 tests)
- [x] Tester l'authentification et les refresh tokens (22 tests)
- [x] Tester les permissions RBAC (24 tests)

## 🔧 Phase 3 : Mode local fonctionnel (Terminée)

- [x] Corriger le bug ESM dans emailService.ts (`require("crypto")` → `import { randomBytes }`)
- [x] Étendre mockDb pour supporter toutes les tables métier (20 tables)
  - [x] products, raw_materials, recipes, recipe_ingredients
  - [x] customers, suppliers
  - [x] production_orders, sales, sale_items
  - [x] purchase_orders, purchase_order_items
  - [x] losses, cash_transactions, custom_orders
  - [x] company_settings, stock_movements
- [x] Améliorer le parser SQL du mockDb
  - [x] Support de la clause RETURNING pour les INSERT
  - [x] Support de ON CONFLICT DO NOTHING
  - [x] Gestion des colonnes manquantes dans WHERE (filtres ignorés)
  - [x] Gestion des paramètres double-chiffre ($10, $11)
- [x] Seeder mock-data.json avec les données de démonstration
  - [x] Script `server/seed-mock.ts` pour régénérer les données
  - [x] 12 produits, 11 matières premières, 3 recettes
  - [x] 4 clients, 5 fournisseurs
  - [x] 5 ordres de production, 11 ventes, 2 bons de commande
  - [x] 3 pertes, 2 transactions caisse, 2 commandes gâteaux
- [x] Ajouter le mode démo (connexion instantanée sans API)
  - [x] `demoLogin()` dans AuthContext — bypass complet de l'API
  - [x] Persistance via `localStorage.auth_mode = "demo"`
  - [x] Bouton « 🚀 Accéder au dashboard (démo) » dans LoginView
- [x] DashboardErrorBoundary pour isolation des crashs du dashboard
- [x] Corriger le BakeryContext pour conserver les données par défaut si API vide
- [x] Vérifier les routes dashboard (stats, recent-sales, low-stock)
- [x] CRUD opérationnel en mode mock (INSERT/SELECT/UPDATE/DELETE)
