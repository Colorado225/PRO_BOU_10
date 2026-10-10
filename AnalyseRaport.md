# 📊 RAPPORT D'ANALYSE TECHNIQUE, AUDIT COMPLET & ROADMAP DE PRODUCTION
## Projet : BoulangeriePro ERP (PRO_BOU_10)

> **Document de Référence & Point de Contrôle Principal**  
> **Date d'émission :** 10 Octobre 2026  
> **Statut :** Document Actif de Pilotage  
> **Cible de Déploiement :** SaaS Multi-Tenant pour Boulangeries & Pâtisseries (Côte d'Ivoire & Afrique Francophone)

---

## 📑 TABLE DES MATIÈRES

1. [Synthèse Exécutive & Fiche d'Identité du Projet](#1-synthèse-exécutive--fiche-didentité-du-projet)
2. [Cartographie de l'Architecture & Stack Technique](#2-cartographie-de-larchitecture--stack-technique)
3. [Modèle de Données & État de l'Isolation Multi-Tenant](#3-modèle-de-données--état-de-lisolation-multi-tenant)
4. [Inventaire Fonctionnel & Matrice des Modules](#4-inventaire-fonctionnel--matrice-des-modules)
5. [Registre Exhaustif des Défauts, Erreurs & Dette Technique](#5-registre-exhaustif-des-défauts-erreurs--dette-technique)
6. [Roadmap Opérationnelle d'Implémentation & de Correction](#6-roadmap-opérationnelle-dimplémentation--de-correction)
7. [Points de Contrôle, Critères d'Acceptation & Protocoles de Test](#7-points-de-contrôle-critères-dacceptation--protocoles-de-test)
8. [Matrice de Conformité Fiscale (DGI / OHADA) & Sécurité](#8-matrice-de-conformité-fiscale-dgi--ohada--sécurité)
9. [Checklist de Mise en Production (Production-Ready)](#9-checklist-de-mise-en-production-production-ready)

---

## 1. 🎯 SYNTHÈSE EXÉCUTIVE & FICHE D'IDENTITÉ DU PROJET

### 1.1 Présentation Générale
**BoulangeriePro ERP** est une solution intégrée de gestion et de point de vente tactile (POS) spécialisée pour les établissements de boulangerie-pâtisserie artisanale et industrielle. Le système a été pensé dès sa conception pour répondre aux contraintes opérationnelles locales :
* Gestion des brigades de production (shifts matin, midi, soir) et pétrins multiples.
* Suivi des fiches recettes avec déduction atomique des matières premières.
* Conformité fiscale DGI Côte d'Ivoire (TVA 18% sur pâtisseries/boissons et exonération 0% sur le pain).
* Paiements locaux intégrés : Espèces avec rendu de monnaie, **Wave**, **Orange Money**, **MTN MoMo**, Carte Bancaire, Crédit B2B.
* Résilience hors-ligne (Offline-First) face aux coupures réseau fréquentes.
* Impression thermique ESC/POS (Bluetooth / USB 58mm & 80mm).
* Assistant intelligent piloté par Google Gemini pour la prévision des fournées et la réduction des invendus.

### 1.2 Métriques du Répertoire
* **Volume de Code :** ~27 000 lignes de code (TypeScript, TSX, SQL).
* **Stack :** React 19 + Vite 8 + Tailwind CSS v4 / Node.js 22 + Express 4 / PostgreSQL Neon Serverless.
* **Nombre de tables :** 20 tables relationnelles multi-tenants.
* **Rôles applicatifs (RBAC) :** 4 rôles (`gerant`, `caissier`, `boulanger`, `magasinier`).
* **Suite de tests actuelle :** 93 tests Vitest (92 passants, 1 échec à corriger).

---

## 2. 🏗️ CARTOGRAPHIE DE L'ARCHITECTURE & STACK TECHNIQUE

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (PWA - Client)                         │
│  React 19 | TypeScript | Tailwind CSS v4 | Recharts | Lucide | PWA     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (API REST + SSE)
                                    │ Cookies HttpOnly (Access Token)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (API Express.js)                          │
│  Node.js v22 | Express 4 | JWT | Rate Limiting | CSRF | Security Logs  │
├──────────────────┬──────────────────┬─────────────────┬────────────────┤
│ /api/auth        │ /api/catalog     │ /api/operations │ /api/reports   │
│ Inscription/Auth │ Produits/Recettes│ Ventes/Fournées │ Stats/Rapport Z│
└──────────────────┴─────────┬────────┴─────────────────┴────────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
   ┌────────────────────────┐  ┌────────────────────────┐
   │ PostgreSQL Serverless  │  │   Mock DB Locale       │
   │ (Neon Cloud Prod/Stag) │  │   (mock-data.json Dev) │
   └────────────────────────┘  └────────────────────────┘
```

### 2.1 Front-End (`src/`)
* **Framework :** React 19.0.1, TypeScript 7.0.2, Vite 8.3.0.
* **Gestion d'état :** `BakeryContext.tsx` (état métier global) et `AuthContext.tsx` (session utilisateur).
* **Design & UI :** Tailwind CSS v4.3.3, `@tailwindcss/vite`, icônes `lucide-react`, graphiques `recharts`.
* **Services matériels & intégrations :**
  * `escposPrinter.ts` : Pilote d'impression thermique Web Bluetooth / ESC/POS.
  * `barcodeScanner.ts` : Moteur de décodage caméra et douchette via `@zxing/library`.
  * `mobileMoney.ts` : Module de paiement Wave / Orange Money / MTN MoMo.
  * `offlineQueue.ts` & `syncQueue.ts` : File d'attente hors-ligne et réconciliation réseau.

### 2.2 Back-End (`server/`)
* **Serveur HTTP :** Express 4.21.2 sur Node.js 22.
* **Sécurité & Sessions :** JWT (`jsonwebtoken`), hachage de mots de passe (`bcryptjs`), cookies sécurisés (`cookie-parser`), protection DDoS (`express-rate-limit`), CSRF (`csurf`).
* **Couche de Persistance :** `@neondatabase/serverless` avec WebSocket `ws`, support natif des transactions atomiques (`BEGIN ... COMMIT / ROLLBACK`).
* **Modularité :**
  * `server/routes/` : Routage REST (`auth.routes.ts`, `catalog.routes.ts`, `operations.routes.ts`, `admin.routes.ts`, `reports.routes.ts`).
  * `server/services/` : Logique transactionnelle (`salesService`, `productionService`, `purchaseService`, `inventoryService`, `reportService`, `securityLogger`).
  * `server/migrations/` : Scripts SQL versionnés (001 à 004).

---

## 3. 🗄️ MODÈLE DE DONNÉES & ÉTAT DE L'ISOLATION MULTI-TENANT

### 3.1 Registre des Tables SQL

| Table | Clé Primaire | Clé Étrangère Multi-Tenant | Rôle & Fonction |
| :--- | :--- | :--- | :--- |
| `organizations` | `id TEXT` | *(Entité Racine)* | Entreprises clientes du SaaS (abonnement, statut, slug). |
| `company_settings` | `id TEXT` | `organization_id` | Paramètres légaux (RCCM, NCC, devise, taux de TVA). |
| `stores` | `id TEXT` | `organization_id` | Boutiques et points de vente physiques. |
| `users` | `id TEXT` | `organization_id`, `store_id` | Comptes employés avec rôle RBAC. |
| `refresh_tokens` | `id TEXT` | `user_id` | Tokens cryptographiques avec rotation et révocation. |
| `products` | `id TEXT` | `organization_id` | Produits finis vendus en caisse. |
| `raw_materials` | `id TEXT` | `organization_id` | Matières premières (farines, levures, emballages). |
| `recipes` | `id TEXT` | `organization_id`, `store_id` | Fiches techniques de fabrication artisanale. |
| `recipe_ingredients` | `id BIGSERIAL` | `organization_id`, `recipe_id` | Dosage des ingrédients d'une recette. |
| `production_orders` | `id TEXT` | `organization_id`, `store_id` | Ordres de fabrication (fournées, pétrins, shifts). |
| `sales` | `id TEXT` | `organization_id`, `store_id` | Tickets de caisse et factures clients. |
| `sale_items` | `id BIGSERIAL` | `organization_id`, `sale_id` | Lignes de produits vendus par ticket. |
| `customers` | `id TEXT` | `organization_id`, `store_id` | Clients particuliers et comptes professionnels B2B. |
| `suppliers` | `id TEXT` | `organization_id` | Fournisseurs de matières premières. |
| `purchase_orders` | `id TEXT` | `organization_id`, `store_id` | Bons de commande et approvisionnements. |
| `purchase_order_items` | `id BIGSERIAL` | `purchase_order_id` | Détail des articles commandés. |
| `losses` | `id TEXT` | `organization_id`, `store_id` | Déclarations de pertes, invendus et avaries. |
| `cash_transactions` | `id TEXT` | `organization_id`, `store_id` | Mouvements du tiroir-caisse (entrées/sorties). |
| `custom_orders` | `id TEXT` | `organization_id`, `store_id` | Commandes de gâteaux d'événements sur-mesure. |
| `stock_movements` | `id TEXT` | `organization_id`, `store_id` | Journal d'audit de toutes les variations de stock. |
| `migrations` | `id TEXT` | *(Système)* | Journal des migrations SQL exécutées. |

### 3.2 Règles d'Or de l'Isolation Multi-Tenant
1. **Zéro Requête sans Filtre :** Tout `SELECT`, `UPDATE`, `DELETE` doit obligatoirement inclure `WHERE organization_id = $1` (ou via les helpers `getOrganizationFilter` / `getTenantFilters`).
2. **Double Filtrage sur Opérations Boutique :** Pour les caisses et le fournil, filtrer conjointement sur `organization_id = $1 AND store_id = $2`.
3. **Immutabilité de l'Organisation :** Un utilisateur ne peut jamais modifier ou injecter un `organization_id` arbitraire ; l'identifiant est extrait uniquement du token JWT vérifié côté serveur.

---

## 4. 🧩 INVENTAIRE FONCTIONNEL & MATRICE DES MODULES

| Module | Statut | Composants Clés | Couverture Fonctionnelle |
| :--- | :---: | :--- | :--- |
| **Authentification & Profils** | 🟢 Complet | `LoginView`, `SignUpView`, `VerifyEmailView`, `ResetPasswordView` | Inscription SaaS, vérification OTP, réinitialisation mot de passe, JWT HttpOnly, rotation refresh tokens. |
| **Caisse POS & Ventes** | 🟢 Complet | `PosView`, `ReceiptModal`, `escposPrinter`, `barcodeScanner` | Catalogue visuel, scan code-barres, remises, multi-paiements (Wave, OM, MTN, Cash), tickets DGI, impression thermique. |
| **Fournil & Production** | 🟢 Complet | `ProductionView`, `batchManager`, `productionService` | Fiches recettes, multiplicateur de pétrins, déduction atomique des stocks, suivi des shifts et étapes de cuisson. |
| **Fiches Recettes** | 🟢 Complet | `RecipesView`, `recipeService`, `recipeQueries` | Rendement, calcul automatique du coût unitaire de revient, instructions de pétrissage, pointage et cuisson. |
| **Matières Premières & Stocks** | 🟢 Complet | `InventoryView`, `StockMovementsView`, `inventoryService` | Suivi des stocks réels, alertes seuil bas, gestion des lots/DLUO, grand livre des mouvements de stock. |
| **Achats & Fournisseurs** | 🟢 Complet | `PurchasesView`, `purchaseService`, `purchaseQueries` | Bons de commande fournisseurs, réception partielle/totale, mise à jour instantanée du stock et du PUMP. |
| **Pertes & Invendus** | 🟢 Complet | `LossesView`, `inventoryService` | Déclaration par type (fin de journée, brûlé, chute), calcul du coût de perte financière. |
| **Caisse & Clôture Z** | 🟢 Complet | `CashView`, `ZReportModal`, `fiscalite.ts` | Fond de caisse, mouvements manuels, génération du rapport Z quotidien, ventilation TVA DGI 18%/0%. |
| **Commandes Sur-Mesure** | 🟢 Complet | `CustomOrdersView`, `operations.routes.ts` | Gâteaux événementiels, gestion des acomptes, solde à la livraison, statut de fabrication. |
| **Assistant IA Copilot** | 🟢 Complet | `AiBakeryAssistant.tsx`, `@google/genai` | Prévisions de vente selon météo/jour, détection de gaspillage, suggestions de fournées intelligentes. |
| **Administration & Paramètres** | 🟢 Complet | `SettingsView`, `admin.routes.ts` | Coordonnées légales (RCCM, NCC), gestion des utilisateurs/rôles, configuration imprimantes et boutiques. |

---

## 5. 🔍 REGISTRE EXHAUSTIF DES DÉFAUTS, ERREURS & DETTE TECHNIQUE

### 5.1 Anomalies Bloquantes (P0)

#### 🔴 DEF-001 : Dépendances manquantes dans `package.json`
* **Localisation :** `server/index.ts` (lignes 13-14, 244)
* **Description :** Le serveur importe `csurf` et `express-rate-limit`, ainsi que leurs méthodes associées, mais ces paquets ne sont pas déclarés dans `package.json`.
* **Erreurs TS :** TS2307 (`Cannot find module 'csurf'`), TS2307 (`Cannot find module 'express-rate-limit'`).
* **Correction requise :** Ajouter `express-rate-limit`, `csurf` et `@types/csurf` au fichier `package.json` et exécuter l'installation.

#### 🔴 DEF-002 : Erreurs de compilation TypeScript strictes sur `pool` (Null Safety)
* **Localisation :** `server/migrate.ts`, `server/seeds.ts`, `server/seed.ts`, `server/mockDb.ts`
* **Description :** La variable `pool` est déclarée `let pool: Pool | null = null`. Les appels directs `pool.query(...)` sans vérification préalable génèrent des erreurs `TS18047: 'pool' is possibly 'null'`.
* **Correction requise :** Utiliser des assertions sécurisées (`if (!pool) throw new Error(...)` ou `pool!.query(...)`).

#### 🔴 DEF-003 : Échec de test unitaire dans `productionService.test.ts`
* **Localisation :** `server/services/__tests__/productionService.test.ts` (ligne 131)
* **Description :** L'assertion du test `déduit correctement les matières premières nécessaires` attend que le premier appel à `mockTx.query` soit la mise à jour de stock `UPDATE raw_materials`, or le service exécute en réalité d'abord la sélection des ingrédients `SELECT ri.quantity ... FROM recipe_ingredients`.
* **Correction requise :** Corriger le mock et vérifier les appels dans l'ordre réel d'exécution de la transaction.

#### 🔴 DEF-004 : Propriétés manquantes sur les types de données Front-End
* **Localisation :** `src/data/initialData.ts`, `src/context/BakeryContext.tsx`, `src/components/recipes/RecipesView.tsx`
* **Description :** Les objets `Recipe` et `ProductionOrder` instanciés ne contiennent pas les champs multi-tenants `storeId`, `organizationId`, `createdAt`, `updatedAt` imposés par la nouvelle définition TypeScript.
* **Correction requise :** Compléter les objets d'initialisation avec les champs obligatoires par défaut.

---

### 5.2 Anomalies Majeures (P1)

#### 🟡 DEF-005 : Configuration `server.allowedHosts` dans `vite.config.ts`
* **Localisation :** `vite.config.ts` (ligne 7)
* **Description :** Le paramètre `server.allowedHosts` est défini avec un booléen incompatible (`true` ou tableau attendu en TypeScript strict).
* **Correction requise :** Ajuster le typage ou passer `allowedHosts: true`.

#### 🟡 DEF-006 : Double système de synchronisation hors-ligne
* **Localisation :** `src/services/offlineQueue.ts` vs `src/services/syncQueue.ts`
* **Description :** Deux implémentations concurrentes gèrent le stockage hors-ligne (l'une via LocalStorage dans `apiFetch`, l'autre via IndexedDB). Les routes de `offlineQueue.ts` comportent des chemins obsolètes (`/sales` au lieu de `/api/operations/sales`).
* **Correction requise :** Déprécier `offlineQueue.ts` et centraliser toute la gestion hors-ligne sur `syncQueue.ts` branché nativement sur `apiFetch`.

#### 🟡 DEF-007 : Typage du cookie `secure` dans `auth.routes.ts`
* **Localisation :** `server/routes/auth.routes.ts` (lignes 283, 430, 672, 1151)
* **Description :** L'expression `secure: config.isProduction || undefined` peut renvoyer `""` ou une valeur non booléenne qui rejette la signature de surcharge de `res.cookie()`.
* **Correction requise :** Remplacer par `secure: Boolean(config.isProduction)`.

---

## 6. 🗺️ ROADMAP OPÉRATIONNELLE D'IMPLÉMENTATION & DE CORRECTION

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASAGE DES TRAVAUX                             │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ PHASE 1 (P0)      │ PHASE 2 (P1)      │ PHASE 3 (P2 / P3)              │
│ 1-2 Jours         │ 3-5 Jours         │ 1-2 Semaines                   │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Fix dépendances │ • Unifier Offline │ • Onboarding SaaS automatique  │
│ • Fix TypeScript  │ • Validation Zod  │ • Passerelle CinetPay / MoMo   │
│ • Fix Vitest      │ • Audit SQL Multi │ • Factures PDF certifiées      │
│ • Build vert      │ • Refonte Sync    │ • Export comptable OHADA       │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

### 🔴 PHASE 1 : STABILISATION TECHNIQUE & BUILD VERT (Priorité Immédiate)
- [x] **T-101** : Mettre à jour `package.json` avec `express-rate-limit`, `csurf`, `@types/csurf` et exécuter `npm install --legacy-peer-deps`. ✅ *(Exécuté le 10/10/2026)*
- [x] **T-102** : Corriger les erreurs de typage dans `server/index.ts`, `server/migrate.ts`, `server/seeds.ts`, `server/seed.ts`, `server/mockDb.ts`, `server/routes/auth.routes.ts` et `server/routes/catalog.routes.ts`. ✅ *(Exécuté le 10/10/2026)*
- [x] **T-103** : Corriger le typage des modèles de données dans `src/data/initialData.ts`, `src/types/bakery.ts` et `src/context/BakeryContext.tsx`. ✅ *(Exécuté le 10/10/2026)*
- [x] **T-104** : Corriger le test unitaire `server/services/__tests__/productionService.test.ts` et les assertions de `multitenantIsolation.test.ts`. ✅ *(Exécuté le 10/10/2026)*
- [x] **T-105** : Valider que `npm run lint` (tsc) et `npm test` s'exécutent avec **100% de succès**. ✅ *(93/93 tests réussis)*

### 🟡 PHASE 2 : ROBUSTESSE MULTI-TENANT & UNIFICATION OFFLINE (Semaine 1)
- [x] **T-201** : Consolider `src/services/syncQueue.ts` et réaligner `offlineQueue.ts` avec support complet des transactions offline et résolution de conflits. ✅ *(Exécuté le 10/10/2026)*
- [x] **T-202** : Ajouter des validateurs de schéma stricts avec `zod` (`server/validators/schemas.ts`) sur tous les endpoints d'écriture (`POST /sales`, `POST /products`, `POST /materials`, `POST /recipes`, `POST /production-orders`, `POST /purchase-orders`, `POST /losses`, `POST /cash-transactions`). ✅ *(Exécuté le 10/10/2026)*
- [x] **T-203** : Audit de sécurité systématique sur toutes les requêtes SQL de `server/services/*Queries.ts` pour garantir l'application du filtre `organization_id`. ✅ *(Exécuté le 10/10/2026)*
- [x] **T-204** : Implémenter le mécanisme de heartbeat (ping 25s), comparaison à temps constant sécurisée (`safeTimingSafeEqual`) et reconnexion automatique sur le flux SSE `/api/sse/mobilemoney`. ✅ *(Exécuté le 10/10/2026)*

### 🟢 PHASE 3 : EXPANSION SAAS & COMMERCIALISATION (Semaine 2-3)
- [x] **T-301** : Initialisation automatique SaaS & bootstrap d'organisation (`server/services/onboardingService.ts` et route `/api/onboarding/bootstrap` pour initialiser boutique principale, matières premières, produits finis et recettes types DGI). ✅ *(Exécuté le 10/10/2026)*
- [ ] **T-302** : Intégration de la passerelle de paiement d'abonnements SaaS (CinetPay / Wave Business).
- [x] **T-303** : Module de génération de factures B2B au format PDF certifié A4 (`src/components/receipt/B2BInvoiceModal.tsx` et `src/services/invoiceService.ts` avec montants en lettres, mentions DGI, ventilation HT/TVA/TTC et coordonnées client). ✅ *(Exécuté le 10/10/2026)*
- [x] **T-304** : Export normalisé des journaux comptables OHADA (Journal des Ventes Comptes 701/4431/531 et Journal des Achats Comptes 601/401 au format CSV universel via `server/services/accountingService.ts`). ✅ *(Exécuté le 10/10/2026)*

---

## 7. 🧪 POINTS DE CONTRÔLE, CRITÈRES D'ACCEPTATION & PROTOCOLES DE TEST

### 7.1 Commandes de Contrôle Obligatoires
Chaque étape franchie doit être validée par les commandes suivantes dans l'environnement :

```bash
# Point de Contrôle 1 : Vérification Statique TypeScript (Zéro Erreur)
npx tsc --noEmit

# Point de Contrôle 2 : Exécution Intégrale de la Suite de Tests
npx vitest run

# Point de Contrôle 3 : Compilation de Production Frontend
npm run build

# Point de Contrôle 4 : Audit de Cohérence des Routes Front vs Back
grep -rhoE "'/api/[^']+'" src --include='*.ts' --include='*.tsx' | sort -u
```

### 7.2 Critères d'Acceptation par Module

| ID Contrôle | Module | Critère d'Acceptation Requis |
| :--- | :--- | :--- |
| **AC-AUTH** | Authentification | Rejet systématique (401/403) si token absent/expiré ou si rôle insuffisant. Pas de session sans `organization_id`. |
| **AC-POS** | Caisse Tactile | Génération séquentielle du ticket DGI sans doublon. Calcul exact de la TVA (18% / 0%). Déstockage en temps réel. |
| **AC-PROD** | Fournil | Transaction atomique : création de l'OF + déduction proportionnelle des matières premières ou rollback total en cas de rupture critique. |
| **AC-ISOL** | Multi-Tenant | Une requête émise par un utilisateur de l'Organisation A ne peut en aucun cas lire ou altérer les données de l'Organisation B. |
| **AC-OFFLINE**| Mode Déconnecté| Enregistrement local des ventes en cas de rupture Internet et synchronisation ordonnée dès le retour de la connexion réseau. |

---

## 8. ⚖️ MATRICE DE CONFORMITÉ FISCALE (DGI / OHADA) & SÉCURITÉ

### 8.1 Réglementation Fiscale Ivoirienne (DGI)
* **Taux de TVA Normal (18%) :** Appliqué sur les viennoiseries, pâtisseries fines, sandwichs, boissons et prestations traiteur.
* **Taux Exonéré (0%) :** Appliqué sur le pain standard et les farines panifiables non transformées (produits de première nécessité).
* **Mentions Obligatoires sur Factures/Tickets :**
  1. Dénomination commerciale et Raison sociale.
  2. Numéro du Registre du Commerce et du Crédit Mobilier (**RCCM**).
  3. Numéro de Compte Contribuable (**NCC**).
  4. Numérotation continue et chronologique infalsifiable (`CI-AAAAMMJJ-NNNN`).
  5. Ventilation distincte des bases HT, montants de TVA et totaux TTC.

### 8.2 Sécurité Applicative (OWASP Top 10)
* **XSS / Injection de Script :** Immunisation via React JSX et transport de token d'accès via **Cookies HttpOnly, Secure, SameSite=Strict**.
* **Injections SQL :** Requêtes paramétrées PostgreSQL strictes (`$1, $2, ...`) sans aucune concaténation directe de chaînes.
* **Brute-Force & Déni de Service :** Limitation de débit stricte (20 requêtes / 15 min sur l'authentification, 500 requêtes / 15 min en global).
* **Traçabilité :** Journal d'audit de sécurité des connexions et des opérations sensibles (`securityLogger.ts`).

---

## 9. 🚀 CHECKLIST DE MISE EN PRODUCTION (PRODUCTION-READY)

- [ ] **Base de Données Neon :** Connexion SSL active, migrations SQL 001 à 004 appliquées avec succès.
- [ ] **Variables d'Environnement :** `JWT_SECRET`, `DATABASE_URL`, `CORS_ORIGIN`, `WAVE_WEBHOOK_SECRET` définies sans valeurs de test.
- [ ] **Mode Mock Désactivé :** Refus strict de démarrage si la connexion à PostgreSQL échoue en environnement `NODE_ENV=production`.
- [ ] **Tests Automatisés :** 100% des tests unitaires et d'isolation multi-tenant au vert.
- [ ] **Compilation Frontend :** Build Vite optimisé avec PWA et Service Worker actifs.
- [ ] **Certificat SSL / HTTPS :** Obligatoire pour le Web Bluetooth, le Service Worker et les cookies sécurisés.

---

> **Document maintenu par l'équipe d'ingénierie BoulangeriePro ERP.**  
> *Toute modification architecturale ou ajout de table doit être consigné dans ce registre.*
