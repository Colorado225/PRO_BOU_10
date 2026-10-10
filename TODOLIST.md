# TODO LIST - BOULANGERIEPRO ERP

**Dernière mise à jour :** 10 Octobre 2026  
**Version :** 1.4  
**Auteur :** Équipe de développement  
**Projet :** Transformation en SaaS multi-tenant pour mise en production

---

## 📊 TABLEAU DE BORD GLOBAL

| Statut       | Nombre de tâches |
| ------------ | ---------------- |
| ✅ Terminées | 21               |
| ⏳ En cours  | 0                |
| ❌ À faire   | 11               |
| **Total**    | **32**           |

---

## 🔴 P0 - TÂCHES CRITIQUES (À faire avant toute mise en production)

### Sécurité (SEC)

- [x] **SEC-001** - Retirer les secrets du dépôt et sécuriser les .env ✅  
       _Terminé le : 10/10/2026_
- [ ] **SEC-002** - Corriger les failles XSS et injection SQL potentielles  
       _Fichiers concernés : server/routes/_, frontend/src/components/\*
- [x] **SEC-003** - Activer CORS avec origines autorisées uniquement ✅  
       _Terminé le : 10/10/2026 - CORS déjà fonctionnel, configuré via config.corsOrigin (variable d'env CORS_ORIGIN)_
- [x] **SEC-004** - Mettre en place rate limiting sur toutes les routes API ✅  
       _Terminé le : 10/10/2026 - Global limiter (500req/15min) + auth limiter (20req/15min) implémentés_
- [x] **SEC-005** - Finaliser authentification : rotation refresh tokens, révocation ✅  
       _Terminé le : 10/10/2026 - Rotation implémentée, ancien token révoqué, nettoyage automatique des tokens expirés_
- [x] **SEC-006** - Toutes les routes privées protégées par requireAuth ✅  
       _Terminé le : 10/10/2026 - Middleware global d'authentification, toutes les routes non-publiques nécessitent une session valide_
- [x] **SEC-007** - Journalisation de sécurité des connexions ✅  
       _Terminé le : 10/10/2026_

### Authentification & Base de données (AUTH/DB)

- [x] **AUTH-001** - Authentification fonctionnelle + connexion à Neon ✅  
       _Terminé le : 10/10/2026 - Corrections : is_active, email_verified_at, cookies sécurisés_
- [x] **AUTH-002** - Résoudre toutes les erreurs TypeScript restantes ✅  
       _Terminé le : 10/10/2026 - 0 erreur TS (server/index.ts, migrate.ts, seeds.ts, initialData.ts, tests)_
- [x] **DB-001** - Migrations Neon fiabilisées ✅  
       _Terminé le : 10/10/2026 - Erreurs TypeScript résolues, système de migration stable_
- [x] **DB-002** - Vérifier que toutes les migrations s'exécutent correctement sur Neon ✅  
       _Terminé le : 10/10/2026 - Connexion Neon fonctionnelle, migration 001 appliquée, base déjà partiellement initialisée_

### Multi-tenant & Production (TEN/PROD)

- [~] **TEN-001** - Isolation multi-tenant complète (toutes requêtes SQL filtrent par organization*id)  
  \_En cours : audit des 18 fichiers de routes*
- [ ] **TEN-002** - Tester l'isolation multi-tenant avec des tests E2E  
       _Dépendance : TEN-001 terminé_
- [ ] **PROD-001** - Désactiver définitivement le mode démo/BaseMock en production  
       _Fichiers concernés : server/db.ts, toutes les routes avec fallbacks_

---

## 🟠 P1 - HAUTE PRIORITÉ (À faire immédiatement après les P0)

### Modules métier

- [x] **SALE-001** - Fiabiliser module de vente/caisse : validation requêtes Zod, recalcul totaux ✅  
       _Terminé le : 10/10/2026 - createSaleSchema et validation stricte_
- [x] **STOCK-001** - Corriger processus d'achat et réception de stock ✅  
       _Terminé le : 10/10/2026 - validation purchase orders & raw materials_
- [x] **PROD-002** - Finaliser module de production et recettes ✅  
       _Terminé le : 10/10/2026 - validation recipes & production orders_

### API & Tests

- [x] **API-001** - Standardiser tous les endpoints API (validation Zod, format cohérent) ✅  
       _Terminé le : 10/10/2026_
- [x] **TEST-001** - Corriger tous les tests et enrichir la suite ✅  
       _Terminé le : 10/10/2026 - 107/107 tests passés (100%)_

---

## 🟡 P2 - MOYENNE PRIORITÉ (À faire avant commercialisation)

### Fonctionnalités avancées

- [x] **PWA-001** - Activer fonctionnalités Progressive Web App ✅  
       _Frontend : configuration Vite PWA, manifest, offline caching_
- [x] **SYNC-001** - Mettre en place synchronisation hors ligne et réconciliation ✅  
       _Fichiers : src/services/syncQueue.ts, src/services/offlineQueue.ts_
- [x] **OHADA-001** - Exports comptables normalisés OHADA (ventes, achats) ✅  
       _Fichiers : server/services/accountingService.ts, server/routes/reports.routes.ts_
- [x] **FACT-001** - Factures commerciales B2B au format PDF A4 certifié DGI ✅  
       _Fichiers : src/components/receipt/B2BInvoiceModal.tsx, src/services/invoiceService.ts_
- [x] **ONBOARD-001** - Initialisation automatique & pack de démarrage organisation ✅  
       _Fichiers : server/services/onboardingService.ts, server/routes/admin.routes.ts_
- [ ] **AUDIT-001** - Journalisation complète des modifications des données  
       _Trigger SQL à créer sur toutes les tables_
- [x] **DASH-001** - Finaliser tableaux de bord et statistiques ✅  
       _Frontend : src/components/dashboard/_

---

## 🟢 P3 - BASSE PRIORITÉ (Fonctionnalités SaaS futures)

### Commercialisation & SaaS

- [ ] **SAAS-001** - Mettre en place facturation et abonnements  
       _Solution : Stripe ou équivalent_
- [ ] **SAAS-002** - Portail administrateur SaaS centralisé  
       _Séparé du frontend client_
- [ ] **SAAS-003** - Surveillance et alerting (Datadog/New Relic)
- [ ] **SAAS-004** - Documentation utilisateur finale (FR)  
       _Support client inclus_

---

## 🚧 CRITÈRES DE SORTIE - PRET POUR LA MISE EN PRODUCTION

| Critère                                            | Statut  | Date prévisionnelle |
| -------------------------------------------------- | ------- | ------------------- |
| Secrets et configurations sécurisés                | ✅ Fait | -                   |
| Authentification cohérente et sécurisée            | ✅ Fait | 10/10/2026          |
| Toutes les routes privées protégées                | ✅ Fait | 10/10/2026          |
| Isolation multi-tenant 100% testée                 | ❌      | 18/10/2026          |
| Schéma et migrations Neon validés                  | ❌      | 13/10/2026          |
| Opérations métier critiques cohérentes             | ❌      | 20/10/2026          |
| Mode démo complètement désactivé en production     | ❌      | 14/10/2026          |
| Aucun fallback silencieux vers données fictives    | ❌      | 14/10/2026          |
| Tests critiques passent sur environnement contrôlé | ❌      | 22/10/2026          |

---

## 🎯 PROCHAINES ACTIONS IMMÉDIATES (CE SEMAINE)

1. ✅ **10 Octobre** - Exécuter `npm run db:migrate` et tester le flux complet d'inscription → connexion  
   _Réalisé : Connexion Neon OK, migration 001 appliquée_
2. ✅ **10 Octobre** - Corriger les erreurs TypeScript dans server/migrate.ts et server/seed.ts  
   _Réalisé : Erreurs TS18047 résolues, migrations fonctionnelles_
3. ✅ **10 Octobre** - Implémenter CORS et rate limiting (SEC-003 / SEC-004)  
   _Réalisé : CORS vérifié, rate limiting installé et configuré sur toutes les routes_
4. ✅ **10 Octobre** - Finaliser l'authentification : rotation refresh tokens (SEC-005)  
   _Réalisé : Rotation implémentée, révocation de l'ancien token, nettoyage automatique_
5. **11 Octobre** - Tester le flux complet d'inscription/OTP/connexion
6. **14 Octobre** - Désactiver le mode démo en production (PROD-001)

---

## 📝 HISTORIQUE DES MISES À JOUR

| Date       | Version | Modifications                                                                                                       |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| 10/10/2026 | 1.0     | Création de la TODOLIST, marquage des tâches terminées (SEC-001, SEC-007, AUTH-001), définition des P0 prioritaires |
| 10/10/2026 | 1.1     | Première mise à jour : DB-002 terminé, connexion Neon vérifiée, migration 001 appliquée avec succès                 |
| 10/10/2026 | 1.2     | DB-001 terminé, corrections TypeScript sur migrate.ts et seed.ts (TS18047 résolues)                                 |
| 10/10/2026 | 1.3     | SEC-003 + SEC-004 terminés : CORS confirmé fonctionnel, rate limiting express-rate-limit implémenté                 |
| 10/10/2026 | 1.4     | SEC-005 terminé : Rotation des refresh tokens implémentée, révocation automatique, nettoyage des tokens expirés     |
