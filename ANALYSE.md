# ANALYSE.md — Point de référence pour les implémentations

> **Projet :** ERP_BOULANGERIE_CI (React 19 + Vite + Express + Neon/Postgres + PWA)
> **Date d'analyse :** 10/10/2026
> **Objet :** Regrouper le diagnostic technique et les suggestions d'amélioration priorisées.
> **Usage :** Ce fichier sert de référence pour piloter les implémentations. Chaque item est
> traçable (fichier/ligne constatés) et accompagné de critères d'acceptation.
> Documents complémentaires : `docs/TECHNICAL_AUDIT.md`, `ROADMAP.md`, `TODO.md`, `TODOLIST.md`.

---

## 📋 Synthèse de l'état actuel

| Area | Constat | Sévérité |
|---|---|---|
| Authentification | JWT en `localStorage`, double stack (`jose` + `jsonwebtoken`), fallbacks démo | 🔴 Critique |
| Multi-tenant | Vérif `organization_id` partielle sur les routes sensibles | 🔴 Critique |
| Base de données | Bascule silencieuse vers un mock si Neon est inaccessible | 🔴 Critique |
| Repo Git | `dist/` versionné, `.gitignore` incomplet (`node_modules` uniquement) | 🔴 Critique |
| Outillage | `lint` = `tsc --noEmit` seulement ; pas d'ESLint/Prettier ; pas de CI | 🟠 Élevé |
| Tests | Fichiers `.bak`, tests épars, couverture des chemins d'erreur faible | 🟠 Élevé |
| Architecture | Routes monolithiques (jusqu'à 1230 lignes) | 🟠 Élevé |
| Observabilité | 86 `console.log` côté serveur ; `/api/health` existe mais basique | 🟡 Moyen |
| Produit | Synchronisation offline à finaliser ; audit log incomplet | 🟡 Moyen |

Preuves vérifiées dans le dépôt (10/10/2026) :
- `server/auth.ts:13` et `server/routes/auth.routes.ts:1138` importent `jsonwebtoken` alors que `jose` est aussi présent dans `package.json` (`jsonwebtoken` et `jwks-rsa` sont candidats à la suppression).
- `localStorage` utilisé dans : `src/context/AuthContext.tsx`, `src/context/BakeryContext.tsx`, `src/services/api.ts`, `src/services/offlineQueue.ts`, `src/services/syncQueue.ts`, `src/components/ErrorBoundary.tsx`.
- Fichier obsolète : `server/services/__tests__/salesService.test.ts.bak`.
- `dist/` est présent dans le repo ; `.gitignore` ne contient que `node_modules`.
- Aucune configuration CI (pas de dossier `.github/workflows`).
- Config DB avec fallback silencieux : `server/config.ts:20` (`DATABASE_URL || "postgres://localhost:5432/mock"`) et `server/db.ts:58` (bascule mock si Neon inaccessible).
- Lignes des plus gros fichiers de routes : `auth.routes.ts` 1230, `catalog.routes.ts` 914, `operations.routes.ts` 864, `admin.routes.ts` 217.
- `scripts.lint` = `tsc --noEmit` dans `package.json`.

---

## 🔴 P0 — Sécurité & Fiabilité (Bloquant avant toute mise en production)

### 1. Sécuriser le stockage et le cycle de vie des tokens
**Problème :** Les JWT sont stockés dans `localStorage` (exposable au XSS) et gérés côté client.
**Cibles :** `src/services/api.ts`, `src/context/AuthContext.tsx`, `server/routes/auth.routes.ts`, `server/index.ts`.
**Actions :**
- Migrer vers des cookies `httpOnly` + `Secure` + `SameSite=strict` (le middleware `cookie-parser` est déjà installé).
- Implémenter refresh token rotation + logout qui révoque le cookie.
- Ajouter une protection CSRF (double-submit cookie ou `SameSite=strict` suffisant si API same-origin).
**Critères d'acceptation :**
- [ ] Aucun token JWT lisible depuis `localStorage`/`sessionStorage`.
- [ ] Tests E2E login/refresh/expiration passent.

### 2. Supprimer les contournements de démonstration en production
**Problème :** `AuthContext.tsx` connecte automatiquement en `gerant` sans authentification si aucun token, et retombe sur des comptes démo en cas d'échec API (voir `docs/TECHNICAL_AUDIT.md` §P0-2).
**Cibles :** `src/context/AuthContext.tsx`.
**Actions :**
- Encadrer tout fallback démo par `import.meta.env.DEV` (ou flag `VITE_DEMO_MODE` explicite, désactivée par défaut).
- En production : échec d'auth = déconnexion stricte, aucun auto-login.
**Critères d'acceptation :**
- [ ] `grep` du code de prod ne trouve aucun chemin d'auto-login hors mode démo.
- [ ] Test : build de prod sans backend → aucune session créée.

### 3. Isolation multi-tenant systématique
**Problème :** La vérification `organization_id` est présente sur certains endpoints (ex. `operations.routes.ts:99`) mais pas généralisée (caisse, pertes, rapports, catalogues).
**Cibles :** `server/routes/*.ts`, middlewares d'auth dans `server/index.ts`.
**Actions :**
- Ajouter un filtre `organization_id = req.user.organizationId` au niveau requête/middleware pour TOUTES les lectures et écritures métier.
- Refuser (403) tout accès cross-tenant, y compris en update/delete par id.
- Brancher `server/test-multi-tenant-isolation.ts` dans la suite `vitest` (test automatisé, pas script manuel).
**Critères d'acceptation :**
- [ ] Suite de tests isolation multi-tenant verte en CI.
- [ ] Revue manuelle : aucune route métier sans contrôle tenant tracée dans ce document.

### 4. Unifier la bibliothèque JWT et supprimer les dépendances mortes
**Problème :** Coexistence `jose` + `jsonwebtoken` (+ `jwks-rsa` inutilisé). Double stack = surface d'attaque et incohérence de validation.
**Cibles :** `server/auth.ts`, `server/routes/auth.routes.ts:1138`, `server/__tests__/auth.test.ts`, `package.json`.
**Actions :**
- Choisir `jose` comme unique implémentation ; migrer tous les usages.
- Retirer `jsonwebtoken`, `@types/jsonwebtoken`, `jwks-rsa` de `package.json`.
- Supprimer le JWKS/les URLs Neon codés en dur (décrit dans `TECHNICAL_AUDIT.md` §P0-1) ; config via variables d'environnement avec fail-fast.
**Critères d'acceptation :**
- [ ] `npm ls jsonwebtoken jwks-rsa` → absent.
- [ ] Tous les tests auth passent avec `jose`.

### 5. Fail-fast sur la configuration base de données (interdire le mock silencieux en prod)
**Problème :** `server/config.ts:20` fournit un fallback mock et `server/db.ts:58` bascule silencieusement sur `mock-data.json` si Neon est inaccessible → risque de perte de données financières en production.
**Cibles :** `server/config.ts`, `server/db.ts`.
**Actions :**
- Exiger `DATABASE_URL` valide quand `NODE_ENV=production` ; sinon refus du démarrage (process.exit(1) avec message explicite).
- Réserver le mode mock à `NODE_ENV=development` avec avertissement visible à chaque requête.
- Journaliser clairement le mode actif au boot (`db mode: postgres | mock(dev)`).
**Critères d'acceptation :**
- [ ] Démarrage en prod sans `DATABASE_URL` → échec immédiat documenté.
- [ ] Test unitaire du comportement de `config.ts` selon `NODE_ENV`.

### 6. Assainir le dépôt Git
**Problème :** `dist/` est versionné ; `.gitignore` ne contient que `node_modules`.
**Actions :**
- Étendre `.gitignore` : `dist/`, `.env`, `*.log`, `*.bak`, `.vite/`.
- `git rm -r --cached dist` puis commit ; vérifier qu'aucun secret n'est committé (`.env` est présent à la racine — contrôler son contenu et le sortir de l'historique si sensible).
**Critères d'acceptation :**
- [ ] `git status` propre après build.
- [ ] `dist/` et `.env` absents de HEAD.

---

## 🟠 P1 — Qualité, Outillage & Architecture

### 7. Vrai linting : ESLint + Prettier
**Problème :** `"lint": "tsc --noEmit"` ne détecte ni code mort, ni règles React, ni sécurité (ex. `dangerouslySetInnerHTML`), ni styles.
**Actions :**
- Introduire ESLint (flat config) avec plugins `typescript-eslint`, `react-hooks`, et une règle interdisant `localStorage` pour les tokens.
- Prettier pour le formatage ; script `format` + `lint:fix`.
- Corriger progressivement les erreurs remontées (pragmatique : warnings au départ, errors sur les règles critiques).
**Critères d'acceptation :**
- [ ] `npm run lint` ≠ `tsc --noEmit` uniquement ; CI bloque sur les erreurs.

### 8. Pipeline CI/CD (GitHub Actions)
**Problème :** Aucun `.github/workflows` — zéro automatisation qualité.
**Actions :** Workflow `ci.yml` déclenché sur push/PR :
1. `npm ci` (cache npm)
2. `npx tsc --noEmit` (typecheck server + client)
3. `npm run lint`
4. `npm run test` (vitest, y compris tests d'isolation multi-tenant)
5. `npm run build`
**Critères d'acceptation :**
- [ ] Badge CI vert sur la branche principale ; PR non mergable si rouge.

### 9. Nettoyage & structuration des tests
**Problèmes constatés :**
- `server/services/__tests__/salesService.test.ts.bak` (fichier mort).
- Tests épars : `server/__tests__/`, `server/services/__tests__/`, script manuel `server/test-multi-tenant-isolation.ts`.
**Actions :**
- Supprimer les `.bak` ; normaliser une convention `**/*.test.ts`.
- Couvrir en priorité : chemins d'erreur des routes financières (caisse, pertes), expiration/refresh JWT, cross-tenant, comportement db.ts en mode prod.
- Objectif intermédiaire : 60 % de couverture sur `server/services` (rapport `vitest --coverage`).
**Critères d'acceptation :**
- [ ] Aucun fichier `.bak` dans le repo ; rapport de couverture généré en CI.

### 10. Décomposition des routes monolithiques (architecture en couches)
**Problème :** `auth.routes.ts` (1230 l.), `catalog.routes.ts` (914 l.), `operations.routes.ts` (864 l.) mélangent HTTP, logique métier et SQL. Les services existent déjà (`server/services/*`) mais ne couvrent pas tout.
**Actions :**
- Pattern cible : `routes/*.routes.ts` (validation + appel service + réponse) → `services/*Service.ts` (logique) → `*Queries.ts` (SQL).
- Extraire la logique de `auth.routes.ts` vers `services/authService.ts` (register/login/refresh/RBAC).
- Idem pour caisse/pertes dans `operations.routes.ts` → `cashService.ts` / `lossService.ts`.
- Ne pas refactorer d'un coup : module par module, tests d'abord.
**Critères d'acceptation :**
- [ ] Aucune route > 400 lignes ; chaque extraction accompagnée de tests.

### 11. Standardisation des réponses API & validation des entrées
**Problème :** Formats de réponse hétérogènes entre routes ; peu de validation runtime des payloads.
**Actions :**
- Contrat unique `{ success: boolean, data?: T, error?: { code, message, details? } }` via un helper `sendOk/sendFail`.
- Validation des body/query/params avec Zod (à ajouter en dépendance) dans chaque route ; schémas partagés front/back dans un dossier commun.
- Codes d'erreur stables (ex. `AUTH_INVALID_CREDENTIALS`, `TENANT_MISMATCH`).
**Critères d'acceptation :**
- [ ] Toutes les routes répondent au contrat ; requêtes invalides → 400 + détails structurés (testé).

---

## 🟡 P2 — Observabilité & Produit

### 12. Logging structuré
**Problème :** 86 occurrences de `console.log` dans `server/`.
**Actions :** Remplacer par `pino` (+ `pino-http` sur Express) ; logs JSON avec `requestId`, `userId`, `organizationId` ; supprimer les logs de données sensibles (tokens, mots de passe).
**Critères d'acceptation :**
- [ ] `grep -rn "console.log" server/` → 0 résultat hors scripts de seed/dev.

### 13. Santé & monitoring
**Existant :** `/api/health` (`server/index.ts:234`) mais minimal.
**Actions :** Enrichir : version applicative, état réel de la connexion DB (ping), mode db (postgres/mock), uptime. Ajouter un endpoint `/readyz` distinct pour les sondes d'infra.
**Critères d'acceptation :**
- [ ] `/api/health` renvoie `degraded/down` si DB injoignable (et jamais `ok` en mode mock silencieux — lié au P0-5).

### 14. Audit log étendu aux tables financières
**Existant :** `server/services/securityLogger.ts` (journalisation partielle).
**Actions :** Triggers Postgres (ou middleware de service) sur `sales`, `cash_sessions`, `losses`, `inventory_movements` : qui, quoi, avant/après, timestamp, IP. Rétention et consultation admin.
**Critères d'acceptation :**
- [ ] Toute écriture financière traçable ; page admin de consultation.

### 15. Fiabiliser le offline-first / PWA
**Existant :** `src/services/offlineQueue.ts`, `syncQueue.ts`.
**Actions :**
- Idempotence des opérations synchronisées (clé UUID d'opération générée côté client, déduplication serveur).
- Politique de résolution de conflits explicite (stock/inventaire : last-write-wins unacceptable → fusion ou file d'attente manuelle).
- Test de reprise réseau (network emulation) + limites de taille de file avec UI d'avertissement.
**Critères d'acceptation :**
- [ ] Aucune double-écriture après coupure/reconnexion (test E2E).

### 16. Divers
- Renommer le package (`name: "react-example"` → `erp-boulangerie`).
- Consigner les décisions d'architecture dans `docs/ADR/NNN-titre.md` (une ADR par choix majeur issu de ce document).
- Mettre à jour `docs/EXECUTION_LOG.md` à chaque item P0/P1 terminé.

---

## 🗺️ Ordre d'exécution recommandé

```
Semaine 1 : P0-6 (git) → P0-4 (unifier jose) → P0-2 (fallbacks démo)
Semaine 2 : P0-1 (cookies httpOnly) → P0-5 (fail-fast DB)
Semaine 3 : P0-3 (isolation multi-tenant + tests CI)
Semaine 4 : P1-7/8 (ESLint + CI) → P1-9 (nettoyage tests)
Semaines 5-7 : P1-10 (décomposition routes) + P1-11 (contrat API/Zod)
En continu : P2-12..15
```

**Règle de travail :** chaque item P0 se fait en 1 PR = 1 item, avec tests à l'appui,
et coche les critères d'acceptation correspondants dans ce fichier (ajouter la date + SHA du commit).

---

## 📝 Journal de suivi (à compléter au fil des implémentations)

| Item | Statut | Date | Commit/PR | Notes |
|---|---|---|---|---|
| P0-1 Cookies httpOnly | ⬜ À faire | | | |
| P0-2 Fallbacks démo | ⬜ À faire | | | |
| P0-3 Isolation multi-tenant | ⬜ À faire | | | |
| P0-4 Unifier JWT (jose) | ⬜ À faire | | | |
| P0-5 Fail-fast DB | ⬜ À faire | | | |
| P0-6 Assainir Git | ⬜ À faire | | | |
| P1-7 ESLint/Prettier | ⬜ À faire | | | |
| P1-8 CI GitHub Actions | ⬜ À faire | | | |
| P1-9 Tests | ⬜ À faire | | | |
| P1-10 Décomposition routes | ⬜ À faire | | | |
| P1-11 Contrat API + Zod | ⬜ À faire | | | |
| P2-12 Pino | ⬜ À faire | | | |
| P2-13 Health enrichi | ⬜ À faire | | | |
| P2-14 Audit log financier | ⬜ À faire | | | |
| P2-15 Offline idempotent | ⬜ À faire | | | |
