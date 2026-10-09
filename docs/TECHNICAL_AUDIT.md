# TECHNICAL_AUDIT.md — Audit technique exhaustif ERP_BOULANGERIE_CI

Date de création : 09/10/2026
État : En cours d'audit

---

## 📊 CLASSEMENT DES DÉFAUTS PAR CRITICITÉ

### 🔴 P0 - CRITIQUE (Sécurité, perte de données)

#### 1. Système d'authentification double et incoherent

**Fichiers concernés :** `server/auth.ts`, `server/neon-auth.ts`, `src/services/api.ts`
**Description :** Le projet mélange un système d'authentification locale (bcryptjs + JWT propre) et un système Neon Auth non fonctionnel.

- Le fichier `server/auth.ts` réexporte `./neon-auth` mais conserve toujours les anciennes fonctions `signToken`, `verifyPassword` qui ne sont plus utilisées
- Le JWKS Neon est codé en dur dans `server/neon-auth.ts` avec une URL hardcodée qui pointe vers une instance Neon qui n'existe plus ou n'est pas configurée
- Il n'y a aucune gestion de cas d'erreur si le JWKS est inaccessible
- Les tokens JWT sont stockés dans `localStorage` (contraire aux bonnes pratiques) au lieu de cookies HttpOnly/Secure

**Code défectueux (server/neon-auth.ts#L27-L32) :**

```typescript
const JWKS_URL = new URL(
  "https://ep-patient-salad-b4ndwcsm.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json",
);
const ISSUER =
  "https://ep-patient-salad-b4ndwcsm.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth";
const AUDIENCE = "neondb";
```

#### 2. Contournements de démonstration dans l'auth front-end

**Fichier concerné :** `src/context/AuthContext.tsx`
**Description :** Des fallbacks automatiques connectent l'utilisateur en mode démo sans aucune authentification réelle.

- Si aucun token n'existe, le code connecte automatiquement l'utilisateur en tant que `gerant` (ligne 95-104)
- En cas d'échec de connexion API, le code vérifie si l'email correspond à un utilisateur de démo et se connecte quand même (ligne 121-130)
- Ces contournements persistent dans le code source et seront présents en production si non corrigés

**Code défectueux (AuthContext.tsx#L75-L85) :**

```typescript
if (!getToken()) {
  const demoUser: SessionUser = {
    id: "demo-gerant-001",
    name: "Gérant Boulangerie",
    email: "demo@boulangerie.ci",
    role: "gerant",
    storeId: "store-001",
    permissions: ["*"],
  };
  setUser(demoUser);
  return;
}
```

#### 3. Absence d'isolation multi-tenant (SaaS)

**Fichier concerné :** `server/schema.sql`
**Description :** Aucune colonne `organization_id` n'existe pour isoler les données des différentes boulangeries.

- Toutes les tables métier (`sales`, `products`, `raw_materials`, `stock_movements`, etc.) n'ont que `store_id` ou pas de champ d'appartenance à une entreprise
- Un utilisateur d'une entreprise pourrait accéder aux données d'une autre entreprise si les IDs sont connus
- Aucun contrôle côté serveur ne vérifie que l'utilisateur courant a le droit d'accéder aux ressources qu'il demande

#### 4. Colonne manquante référencée dans les services

**Fichier concerné :** `server/schema.sql`
**Description :** La colonne `sales.notes` mentionnée dans le PLAN_ACTION.md n'existe pas dans le schéma SQL, même si les services tentent de l'utiliser.

- D'autres incohérences existent entre le schéma SQL et les services qui utilisent des colonnes non définies
- La table `raw_materials` n'a pas de `store_id` foreign key vers `stores`, contrairement à `products`

### 🟠 P1 - BLOQUANT MÉTIER

#### 1. Mélange de types d'identifiants incompatibles

**Fichier concerné :** `server/schema.sql`
**Description :** Les tables principales utilisent des clés primaires `TEXT` (ex: `sales.id TEXT PRIMARY KEY`) mais les tables de lignes utilisent `BIGSERIAL` (ex: `sale_items.id BIGSERIAL PRIMARY KEY`).

- Ce mélange crée des incohérences quand les services tentent de générer des IDs pour les lignes de vente/commande
- Certains services envoient des IDs texte vers des colonnes qui attendent des entiers, causant des erreurs SQL

**Exemple d'incohérence :**

```sql
-- Table parente : clé TEXT
CREATE TABLE IF NOT EXISTS sales (
  id               TEXT PRIMARY KEY,
  ...
);

-- Table enfant : clé BIGSERIAL (incompatible si le code génère des IDs texte)
CREATE TABLE IF NOT EXISTS sale_items (
  id          BIGSERIAL PRIMARY KEY,
  sale_id     TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  ...
);
```

#### 2. Absence de middlewares de protection sur la plupart des routes (P0)

**Fichiers concernés :** `server/routes/catalog.routes.ts`, `server/routes/operations.routes.ts`, `server/routes/reports.routes.ts`
**Description :** LA PLUPART DES ROUTES API NE SONT PROTÉGÉES PAR AUCUN MIDDLEWARE ! N'importe qui peut appeler l'API sans être authentifié.

- Seules quelques routes dans `auth.routes.ts` utilisent `requireAuth`
- Dans `catalog.routes.ts`, TOUTES les routes de création/modification/suppression de boutiques, produits, matières premières sont accessibles sans authentification
- Un attaquant peut supprimer toutes les données du catalogue sans être connecté
- Aucun middleware `requireAuth` n'est appliqué globalement
- Les rôles et permissions ne sont jamais vérifiés sur les routes métier

**Exemple critique (catalog.routes.ts) :**

```typescript
// N'importe qui peut supprimer une boutique !
catalogRouter.delete("/stores/:id", async (req, res) => {
  const result = await query(`DELETE FROM stores WHERE id=$1 RETURNING id`, [req.params.id]);
  ...
});

// N'importe qui peut ajouter/modifier/supprimer des produits !
catalogRouter.post("/products", async (req, res) => { ... });
catalogRouter.put("/products/:id", async (req, res) => { ... });
catalogRouter.delete("/products/:id", async (req, res) => { ... });
```

#### 3. Les stocks sont mis à jour côté client

**Description :** Plusieurs composants React mettent à jour les stocks localement dans l'état React au lieu d'attendre la réponse du serveur.

- Les ventes décrémentent les stocks dans le state React avant même que l'API ne confirme l'enregistrement
- En cas d'échec de l'API, les données affichées sont incohérentes avec la base de données
- Aucune transaction atomique ne garantit que la vente ET la mise à jour de stock sont bien enregistrées ensemble

### 🟡 P2 - IMPORTANT

#### 1. Deux mécanismes de synchronisation hors-ligne concurrents

**Fichiers concernés :** `src/services/offlineQueue.ts`, `src/services/syncQueue.ts`
**Description :** Le projet possède deux systèmes de file d'attente pour la synchronisation hors ligne, non coordonnés.

- `syncQueue.ts` est utilisé dans `api.ts` pour les mutations hors ligne
- `offlineQueue.ts` propose une fonctionnalité similaire mais non intégrée
- Création de doublons potentiels et de conflits de synchronisation

#### 2. Absence de contraintes d'intégrité référentielle sur plusieurs clés étrangères

**Fichier concerné :** `server/schema.sql`
**Exemples :**

- `raw_materials.supplier_id` n'a pas de contrainte `REFERENCES suppliers(id)`
- `stock_movements` n'a pas de foreign key vers `raw_materials.id`
- `production_orders.recipe_id` n'a pas de contrainte `ON DELETE` cohérente

#### 3. La numérotation des tickets n'est pas gérée par la base de données

**Description :** Les numéros de reçus (`receipt_number`) sont générés côté client ou avec `Date.now()`, ce qui crée des risques de doublons en cas de requêtes concurrentes.

- Aucune séquence PostgreSQL n'est utilisée pour générer les numéros de ticket
- Pas de verrouillage des lignes pour éviter les doublons en environnement multi-utilisateurs

### 🟢 P3 - AMÉLIORATION

#### 1. Manque d'index sur plusieurs colonnes fréquemment interrogées

**Fichier concerné :** `server/schema.sql`
**Description :** Des index sont présents mais il manque des index sur :

- `users.store_id` (fréquement utilisé pour filtrer les utilisateurs d'une boutique)
- `raw_materials.supplier_id`
- `sales.customer_id`
- `purchase_orders.supplier_id`

#### 2. Journalisation insuffisante

**Description :** Les erreurs serveur sont logguées dans la console mais pas dans un système de journalisation structuré.

- Aucun log des actions sensibles (connexion, suppression de vente, modification de stock)
- Aucun journal d'audit des modifications importantes

---

## 📝 PROCHAINES ÉTAPES DE L'AUDIT

- [ ] Lire toutes les routes dans `server/routes/` pour vérifier la protection
- [ ] Auditer les services métier dans `server/services/`
- [ ] Vérifier les seeds de démonstration pour les doublons d'IDs
- [ ] Tester l'exécution du schéma SQL sur une base de développement
- [ ] Vérifier les composants React qui mettent à jour les stocks localement
