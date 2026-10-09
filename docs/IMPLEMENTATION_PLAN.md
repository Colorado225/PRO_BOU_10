# IMPLEMENTATION_PLAN.md — Planning de mise en production ERP_BOULANGERIE_CI

Durée estimée totale : 4 semaines

---

## 🗓️ SEMAINE 1 — PHASE 1 : SÉCURITÉ ET AUTHENTIFICATION (P0)

Objectif : Rendre l'application sécurisée avec un système d'auth fonctionnel

### Jour 1-2 : Unifier l'authentification

- [ ] Supprimer Neon Auth complètement, conserver uniquement l'auth locale (bcryptjs + JWT)
- [ ] Corriger `server/auth.ts` : ne garder que le système d'auth local fonctionnel
- [ ] Supprimer l'URL JWKS codée en dure et toutes les fonctions Neon Auth
- [ ] Tester la connexion avec les utilisateurs existants dans la base

### Jour 3-4 : Sécuriser les sessions

- [ ] Remplacer localStorage par des cookies `HttpOnly`, `Secure`, `SameSite: Strict`
- [ ] Mettre en place la expiration des tokens (24h) avec refresh token
- [ ] Implémenter la déconnexion côté serveur (invalidation du token)
- [ ] Supprimer TOUS les fallbacks de démonstration dans `src/context/AuthContext.tsx`

### Jour 5 : Protéger TOUTES les routes

- [ ] Créer un middleware global qui applique `requireAuth` sur toutes les routes sauf `/api/auth/login`
- [ ] Ajouter les vérifications de rôle (`requireRole`) sur les routes sensibles
- [ ] Tester l'accès non authentifié : toutes les routes métier doivent retourner 401
- [ ] Tester les permissions : un caissier ne peut pas créer d'utilisateurs

---

## 🗓️ SEMAINE 2 — PHASE 2 : BASE DE DONNÉES ET INTÉGRITÉ (P0/P1)

Objectif : Fiabiliser Neon, corriger le schéma et mettre en place les migrations

### Jour 6-7 : Mettre en place le système de migrations

- [ ] Initialiser `node-pg-migrate` pour gérer les migrations versionnées
- [ ] Créer la migration 001 : ajouter la table `organizations`
- [ ] Ajouter `organization_id` sur toutes les tables métier
- [ ] Tester l'application des migrations sur une base vide

### Jour 8-9 : Corriger le schéma SQL

- [ ] Migration 002 : corriger les types d'ID et ajouter les clés étrangères manquantes
- [ ] Migration 003 : créer les séquences pour les numéros de tickets/commandes
- [ ] Migration 004 : ajouter les colonnes de traçabilité (`created_at`, `created_by`, etc.)
- [ ] Vérifier que toutes les colonnes utilisées par les services existent bien

### Jour 10 : Isoler les données des organisations

- [ ] Modifier tous les services pour ajouter automatiquement le filtre `organization_id`
- [ ] Ne plus jamais faire confiance aux `organizationId`/`storeId` envoyés par le client
- [ ] Vérifier qu'un utilisateur ne peut accéder qu'aux données de son organisation
- [ ] Tester l'isolation : deux organisations ne voient pas leurs données mutuellement

---

## 🗓️ SEMAINE 3 — PHASE 3 : TRANSACTIONS MÉTIER (P1)

Objectif : Fiabiliser les parcours métier critiques (ventes, caisse, achats)

### Jour 11-12 : Parcours de vente complet et atomique

- [ ] Déplacer TOUS les calculs de vente côté serveur (totaux, remises, taxes)
- [ ] Implémenter la transaction atomique : vente + lignes + stock + stock_movements
- [ ] Ajouter le verrouillage des lignes de stock pour éviter les ventes concurrentes
- [ ] Refuser toute vente qui conduirait à un stock négatif
- [ ] Tester le parcours complet d'une vente : stock bien décrémenté, mouvement enregistré

### Jour 13-14 : Gestion de caisse et numérotation des tickets

- [ ] Implémenter la séquence PostgreSQL pour les `receipt_number`
- [ ] Ajouter le parcours d'annulation de vente avec journal d'audit
- [ ] Développer l'ouverture et la clôture de caisse avec calcul des écarts
- [ ] Enregistrer tous les mouvements de caisse dans `cash_transactions`
- [ ] Tester la clôture : les totaux correspondent aux encaissements réels

### Jour 15 : Cycle achats/réceptions

- [ ] Implémenter les états de commande : brouillon → commandé → reçu → annulé
- [ ] Corriger les mouvements de stock : seul la réception augmente le stock
- [ ] Séparer complètement la commande (qui n'affecte pas le stock) de la réception
- [ ] Tester le cycle complet : commande → réception partielle → réception finale

---

## 🗓️ SEMAINE 4 — PHASE 4 : FIABILISATION ET TESTS (P2/P3)

Objectif : Stabiliser l'application et préparer au déploiement

### Jour 16-17 : Synchronisation hors-ligne

- [ ] Unifier `offlineQueue.ts` et `syncQueue.ts` en un seul système
- [ ] Tester la synchronisation des opérations effectuées hors-ligne
- [ ] Résoudre les conflits potentielled de synchronisation
- [ ] Vérifier qu'aucune donnée n'est perdue en cas de coupure réseau

### Jour 18-19 : Production et stocks

- [ ] Corriger le calcul des quantités consommées lors d'une fournée
- [ ] Vérifier que la production décrémente bien les matières premières
- [ ] Tester le calcul des coûts de revient et des marges
- [ ] S'assurer que tous les états de stock sont cohérents

### Jour 20 : Tests et documentation

- [ ] Écrire les tests automatisés sur les transactions critiques
- [ ] Créer `docs/SECURITY.md` avec toutes les protections mises en place
- [ ] Rédiger la documentation de déploiement en production
- [ ] Procéder à un audit final de toutes les tâches P0/P1 complétées
- [ ] Préparer le déploiement sur l'environnement de staging

---

## ✅ CRITÈRES DE VALIDATION PRODUCTION

- [ ] Toutes les tâches P0 sont complétées
- [ ] Toutes les tâches P1 sont complétées
- [ ] Les tests automatisés passent à 100%
- [ ] L'isolation multi-tenant est fonctionnelle
- [ ] Toutes les routes sont protégées par l'authentification
- [ ] Aucun fallback de démonstration n'est présent dans le code
- [ ] Les transactions sont atomiques et ne causent pas de corruption de données
- [ ] Les stocks sont toujours cohérents après vente/production/réception
- [ ] La synchronisation hors-ligne fonctionne
- [ ] La documentation est complète et à jour

---

## 📝 SUIVI DES TÂCHES

Les cases cochées ci-dessus sont mises à jour au fur et à mesure de l'avancement. Toute tâche bloquée est signalée immédiatement avec les raisons.
