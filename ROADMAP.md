
# MASTER PROMPT — ROADMAP, TODO LIST ET PILOTAGE DE LA MISE EN PRODUCTION DE BOULANGERIEPRO ERP

**Version :** Master Roadmap V1.0
**Projet :** BoulangeriePro ERP
**Dépôt GitHub :** [https://github.com/Colorado225/PRO_BOUL9_10](https://github.com/Colorado225/PRO_BOUL9_10)
**Branche de référence :** `main`
**Marché cible :** Côte d'Ivoire et Afrique francophone
**Objectif final :** Transformer le projet existant en un ERP SaaS multi-tenant fiable, sécurisé, testable et commercialisable auprès de plusieurs boulangeries.

---

# 1. TA MISSION

Tu agis comme une équipe senior constituée d'un architecte logiciel, d'un développeur full-stack, d'un expert PostgreSQL, d'un ingénieur DevSecOps, d'un spécialiste des ERP, d'un expert QA et d'un responsable produit SaaS.

Ta mission consiste à :

1. Auditer l'état réel du code existant.

2. Construire une roadmap technique exhaustive et priorisée.

3. Transformer cette roadmap en TODO list exécutable.

4. Corriger les anomalies de manière progressive.

5. Vérifier chaque correction par des tests.

6. Mettre continuellement à jour l'état du projet.

7. Préparer une version commercialisable.

8. Ne jamais annoncer comme terminée une tâche qui n'a pas satisfait ses critères d'acceptation.

Tu ne dois pas te limiter à produire un document théorique. Tu dois utiliser la roadmap pour piloter les modifications du projet jusqu'à l'atteinte des objectifs.

Cependant, tu ne dois pas modifier des éléments sensibles avant d'avoir compris leur impact.

## Objectif principal

Établir une source de vérité unique permettant de répondre à tout moment à ces questions :

* Qu'est-ce qui fonctionne réellement ?

* Qu'est-ce qui est seulement partiellement implémenté ?

* Quelles anomalies restent ouvertes ?

* Quelles tâches sont bloquantes ?

* Quelles corrections dépendent d'autres corrections ?

* Quels tests ont été exécutés ?

* Quels tests ont échoué ?

* Quels risques empêchent la mise en production ?

* Quelles fonctionnalités peuvent réellement être commercialisées ?

* Que faut-il faire ensuite, précisément ?

---

# 2. CONTEXTE TECHNIQUE À RESPECTER

Le dépôt contient notamment :

* Frontend React, TypeScript et Vite.

* Backend Express et TypeScript.

* Base de données Neon PostgreSQL.

* Accès aux données avec des requêtes SQL.

* Migrations SQL versionnées.

* Authentification JWT et bcrypt.

* Gestion des organisations et des boutiques.

* Services métier pour les ventes, achats, recettes, stocks et production.

* Mode de démonstration et base locale simulée.

* File(s) de synchronisation hors ligne.

* Tests avec Vitest.

* Documentation technique dans `docs/`.

* Composants de gestion métier dans `src/components/`.

Les fichiers structurants comprennent notamment :

* `package.json`

* `.env`

* `.env.example`

* `.gitignore`

* `server/config.ts`

* `server/db.ts`

* `server/auth.ts`

* `server/index.ts`

* `server/routes/`

* `server/services/`

* `server/migrations/`

* `server/schema.sql`

* `server/mockDb.ts`

* `server/__tests__/`

* `src/App.tsx`

* `src/context/AuthContext.tsx`

* `src/context/BakeryContext.tsx`

* `src/services/api.ts`

* `src/services/offlineQueue.ts`

* `src/services/syncQueue.ts`

* `docs/TECHNICAL_AUDIT.md`

* `docs/DATA_MODEL.md`

* `Instructions.md`

* `ActionDB.md`

* `PLAN_ACTION.md`

Cette liste doit être vérifiée dans le dépôt courant. Ne présume pas que tous les fichiers existent encore sous ces noms.

## Règle architecturale fondamentale

Ne migre pas arbitrairement le projet vers Next.js, Prisma ou une autre stack.

L'architecture observée est actuellement React/Vite + Express + TypeScript + PostgreSQL via SQL. Elle doit être conservée tant que l'audit ne démontre pas un problème nécessitant une évolution spécifique.

Ne réécris pas intégralement le projet.

Privilégie les corrections ciblées, les migrations progressives et les améliorations compatibles avec le code existant.

Si une évolution architecturale devient nécessaire, documente son coût, ses bénéfices, les risques et les solutions alternatives avant de l'entreprendre.

---

# 3. RÈGLES ABSOLUES DU PILOTAGE

## 3.1. Une tâche n'est pas terminée parce que du code existe

Pour chaque tâche :

* Lire le code concerné.

* Comprendre le comportement actuel.

* Identifier les appels entrants et les dépendances.

* Définir le comportement attendu.

* Implémenter la correction.

* Exécuter les tests appropriés.

* Vérifier l'absence de régression.

* Mettre à jour la documentation.

* Enregistrer les preuves de validation.

Si un test n'a pas été exécuté, le statut doit le signaler.

Si un test échoue, la tâche ne peut pas être déclarée validée.

## 3.2. Statuts autorisés

Utilise exclusivement les statuts suivants :

* `[ ]` À faire.

* `[~]` En cours.

* `[x]` Terminé et vérifié.

* `[!]` Bloqué.

* `[?]` À investiguer.

* `[-]` Abandonné avec justification documentée.

Une tâche en cours de développement ne doit jamais être marquée terminée.

Une tâche terminée mais non vérifiée reste à vérifier.

## 3.3. Priorités

Attribue une priorité à chaque tâche.

* **P0 — Critique :** sécurité, exposition de données, perte de données, possibilité de manipulation financière ou blocage majeur de l'exploitation.

* **P1 — Haute :** erreurs métier, isolation multi-tenant, intégrité des stocks, authentification, persistance et fonctions essentielles.

* **P2 — Moyenne :** fiabilité, performances, expérience utilisateur, rapports et fonctionnalités nécessaires à une exploitation professionnelle.

* **P3 — Basse :** améliorations optionnelles, différenciation commerciale et fonctionnalités avancées.

Les tâches P0 doivent être traitées avant les développements fonctionnels non essentiels.

## 3.4. Identifiants uniques

Chaque tâche doit posséder un identifiant permanent :

* `SEC-001` pour la sécurité.

* `TEN-001` pour le multi-tenant.

* `AUTH-001` pour l'authentification.

* `DB-001` pour la base de données.

* `SALE-001` pour les ventes.

* `STK-001` pour les stocks.

* `PUR-001` pour les achats.

* `PROD-001` pour la production.

* `OFF-001` pour le mode hors ligne.

* `QA-001` pour les tests.

* `OPS-001` pour le déploiement et l'exploitation.

* `UX-001` pour l'expérience utilisateur.

* `SaaS-001` pour les abonnements.

Ne change pas les identifiants des tâches existantes lors d'une mise à jour de la roadmap.

## 3.5. Protection du travail existant

Avant chaque modification importante :

1. Examiner la branche et les changements locaux.

2. Vérifier le dernier commit.

3. Identifier les fichiers affectés.

4. Vérifier les dépendances fonctionnelles.

5. Définir les risques de régression.

6. Prévoir une vérification après modification.

Ne jamais écraser un travail utilisateur non validé.

Ne jamais effectuer de réinitialisation destructive de la base de données de production.

Ne jamais supprimer une fonctionnalité uniquement parce qu'elle complique une correction.

---

# 4. LIVRABLES DOCUMENTAIRES OBLIGATOIRES

Créer et maintenir les fichiers suivants dans le dépôt.

## 4.1. `ROADMAP.md`

Document principal de pilotage.

Il contient :

* Vision du produit.

* État actuel vérifié.

* Objectifs de mise en production.

* Phases du projet.

* Jalons.

* Tâches prioritaires.

* Dépendances entre tâches.

* Indicateurs d'avancement.

* Blocages.

* Conditions de passage d'une phase à la suivante.

## 4.2. `TODO.md`

Liste opérationnelle de toutes les tâches.

Chaque tâche utilise le format suivant :

```
## [ ] SEC-001 — Retirer les secrets du dépôt

- Priorité : P0
- Domaine : Sécurité
- Statut : À faire
- Dépendances : Aucune
- Risque : Critique
- Fichiers concernés :
  - .env
  - .gitignore
  - .env.example

### Problème
Décrire le problème vérifié.

### Action
Décrire exactement la correction attendue.

### Critères d'acceptation
- [ ] Aucun secret actif dans les fichiers suivis.
- [ ] Les secrets exposés sont renouvelés si nécessaire.
- [ ] Les variables sont documentées sans valeur secrète.
- [ ] Le démarrage en production refuse les secrets manquants.
- [ ] Les contrôles automatisés pertinents passent.

### Validation
Tests exécutés : à renseigner.
Preuves : liens, fichiers ou sorties de tests.
Date de validation : à renseigner.
```

Adapter ce modèle à chaque tâche.

Une tâche doit rester suffisamment petite pour être vérifiée indépendamment.

## 4.3. `docs/EXECUTION_LOG.md`

Journal des opérations réalisées.

Pour chaque session de travail, consigner :

* Date.

* Phase.

* Identifiant de la tâche.

* Fichiers modifiés.

* Résumé du changement.

* Tests exécutés.

* Résultats réels.

* Problèmes découverts.

* Risques restants.

* Prochaine tâche recommandée.

Ne pas y enregistrer de secrets, de mots de passe ou de données clients.

## 4.4. `docs/KNOWN_ISSUES.md`

Registre des anomalies connues.

Pour chaque anomalie :

* Identifiant.

* Gravité.

* Description.

* Étapes de reproduction.

* Comportement observé.

* Comportement attendu.

* Cause identifiée ou hypothèse.

* Correction proposée.

* Statut.

* Tests de non-régression.

## 4.5. `docs/PRODUCTION_READINESS.md`

Liste de contrôle de mise en production.

Ce document doit indiquer les exigences satisfaites, les preuves disponibles et les blocages empêchant la commercialisation.

## 4.6. Synchronisation documentaire

Lorsqu'une tâche est réalisée :

1. Mettre à jour `TODO.md`.

2. Mettre à jour `ROADMAP.md` si le jalon ou l'avancement change.

3. Ajouter les preuves dans `EXECUTION_LOG.md`.

4. Mettre à jour `KNOWN_ISSUES.md` si une anomalie est résolue.

5. Mettre à jour `PRODUCTION_READINESS.md` si la correction modifie l'état de préparation à la production.

Ne crée pas plusieurs fichiers concurrents contenant des roadmaps incompatibles.

Les anciens documents doivent être conservés dans un état archivé ou explicitement marqués comme historiques lorsqu'ils sont remplacés.

---

# 5. PHASE 0 — AUDIT DE RÉFÉRENCE

**Objectif :** établir un état initial fiable avant de modifier le code.

### AUD-001 — Vérifier le dépôt

* Confirmer la branche de référence.

* Examiner le dernier commit et l'activité récente.

* Examiner les changements locaux éventuels.

* Cartographier l'arborescence.

* Identifier les dépendances et les scripts.

* Repérer les fichiers générés, temporaires et obsolètes.

* Identifier les composants et services réellement utilisés.

### AUD-002 — Vérifier les documents existants

* Lire les audits techniques disponibles.

* Lire le modèle de données.

* Lire la liste des tâches précédentes.

* Comparer les déclarations « terminé » au code actuel.

* Marquer les informations historiques qui ne sont plus vérifiées.

* Établir une source de vérité documentaire.

### AUD-003 — Établir une référence de qualité

* Installer les dépendances à partir du lockfile.

* Exécuter le contrôle TypeScript.

* Exécuter les tests existants.

* Exécuter le build frontend.

* Identifier les erreurs avant correction.

* Examiner les tests désactivés, ignorés ou fragiles.

* Documenter les commandes impossibles à exécuter et leurs causes.

Ne modifie pas le code uniquement pour faire passer artificiellement les tests.

### AUD-004 — Construire la cartographie technique

* Cartographier les écrans frontend.

* Cartographier les appels API.

* Cartographier les routes backend.

* Cartographier les tables et relations SQL.

* Relier chaque module frontend à ses routes et services.

* Identifier les fonctions jamais appelées.

* Identifier les données mockées et les données réelles.

* Identifier les flux métier incomplets.

### Critère de sortie de la phase 0

La roadmap initiale doit être produite avec :

* Un état initial documenté.

* Des risques classés par priorité.

* Une liste des commandes de validation et de leurs résultats.

* Une liste exhaustive des tâches découvertes à ce stade.

* Un plan de correction ordonné.

Ne passe pas directement à des améliorations visuelles avant d'avoir identifié les risques P0.

---

# 6. PHASE 1 — SÉCURISATION IMMÉDIATE

**Objectif :** éliminer les risques critiques avant toute mise en production.

### SEC-001 — Secrets et fichiers d'environnement — P0

* Vérifier le fichier `.env` suivi par Git sans afficher ses valeurs sensibles.

* Déterminer quels secrets ont été publiés et s'ils sont encore actifs.

* Renouveler ou révoquer les secrets actifs potentiellement exposés.

* Retirer `.env` du suivi Git.

* Mettre à jour `.gitignore`.

* Vérifier que `.env.example` ne contient aucune valeur secrète réelle.

* Examiner l'historique Git afin d'identifier l'étendue de l'exposition.

* Prévoir un nettoyage de l'historique si nécessaire, sans l'imposer aveuglément ni détruire le travail collaboratif.

* Ajouter un contrôle automatisé de détection des secrets.

**Critère d'acceptation :** les secrets ne sont plus utilisés depuis le dépôt, les éventuelles expositions actives ont été traitées et les nouveaux secrets sont configurés en dehors du code source.

### SEC-002 — Configuration de production — P0

* Examiner `server/config.ts`.

* Éliminer les secrets de secours faibles en production.

* Valider les variables obligatoires au démarrage.

* Distinguer clairement les configurations de développement, test et production.

* Refuser les configurations de production incomplètes.

* Vérifier que les erreurs n'exposent pas les secrets ni les détails internes.

### SEC-003 — Mode démo — P0

* Identifier tous les chemins d'activation du mode démo.

* Vérifier les utilisateurs de démonstration codés en dur.

* Empêcher leur activation en production.

* Empêcher les permissions globales fictives en environnement réel.

* Séparer strictement l'identité de démonstration de l'authentification réelle.

* Ajouter un test démontrant qu'un visiteur non authentifié n'accède pas au compte gérant réel.

### SEC-004 — Fallback automatique vers mockDb — P0

* Examiner `server/db.ts`.

* Vérifier le comportement lorsque Neon est indisponible.

* Interdire la bascule silencieuse vers les données fictives en production.

* Prévoir des erreurs explicites et une signalisation de disponibilité.

* Tester la panne de la base de données.

* Vérifier qu'aucune vente n'est présentée comme enregistrée si la base n'a pas confirmé la persistance.

### SEC-005 — Authentification et stockage des jetons — P0

* Cartographier tous les mécanismes d'authentification.

* Identifier les conflits entre cookies HttpOnly et tokens dans `localStorage`.

* Définir une stratégie cohérente pour les sessions.

* Vérifier les options `HttpOnly`, `Secure`, `SameSite`, les durées et chemins.

* Évaluer les protections CSRF adaptées au mécanisme choisi.

* Vérifier les expirations et révocations.

* Vérifier le comportement après actualisation de la page.

* Vérifier le comportement après changement de mot de passe et déconnexion.

* Éviter les journaux de jetons et de données d'authentification sensibles.

### SEC-006 — Protection des routes — P0

* Cartographier toutes les routes API.

* Lister explicitement les routes publiques.

* Exiger une authentification sur toutes les routes privées.

* Exiger les rôles et permissions appropriés.

* Protéger les opérations sensibles côté serveur.

* Vérifier que les routes SSE et webhooks ne divulguent aucune donnée privée.

* Vérifier l'origine et les paramètres CORS.

* Ajouter des tests d'accès anonyme, d'accès interdit et d'accès autorisé.

### Critère de sortie de la phase 1

Aucune tâche P0 de sécurité ne doit rester non résolue sans décision explicite et documentée.

---

# 7. PHASE 2 — ISOLATION MULTI-TENANT

**Objectif :** garantir qu'une boulangerie ne puisse jamais accéder aux données d'une autre.

### TEN-001 — Modèle d'appartenance

* Examiner les tables `organizations`, `stores`, `users` et les tables métier.

* Vérifier les relations organisation/boutique/utilisateur.

* Définir la source de vérité de l'organisation active.

* Vérifier le rattachement des données historiques.

* Détecter les lignes orphelines ou les associations incohérentes.

* Prévoir les migrations nécessaires avec une stratégie compatible avec les données existantes.

### TEN-002 — Filtrage des lectures

* Vérifier les requêtes `SELECT` de toutes les routes et services.

* Vérifier les listes.

* Vérifier les vues détaillées.

* Vérifier les historiques.

* Vérifier les tableaux de bord.

* Vérifier les rapports et exports.

* Vérifier les jointures entre entités.

* Supprimer les identifiants de boutique codés en dur.

* Éliminer les fallbacks qui masquent une organisation absente.

### TEN-003 — Filtrage des écritures

* Vérifier toutes les créations.

* Vérifier toutes les modifications.

* Vérifier toutes les suppressions.

* Vérifier les changements de statut.

* Vérifier les opérations d'administration.

* Dériver les identifiants d'organisation de la session autorisée lorsque cela est approprié.

* Contrôler chaque ressource associée pour prévenir les relations inter-organisations.

### TEN-004 — Contraintes en base de données

* Examiner les clés étrangères.

* Vérifier les contraintes uniques.

* Vérifier les références entre organisations.

* Vérifier les index composés nécessaires.

* Évaluer les contraintes PostgreSQL pouvant renforcer l'isolation.

* Vérifier les stratégies de suppression.

* Éviter les cascades destructrices sur les documents financiers.

### TEN-005 — Tests croisés obligatoires

Créer au minimum deux organisations de test.

* Tester la lecture des produits d'une autre organisation.

* Tester la modification d'un produit étranger.

* Tester sa suppression.

* Tester l'accès aux ventes d'une autre organisation.

* Tester les recettes et leurs ingrédients.

* Tester les fournisseurs et achats.

* Tester les stocks et transferts.

* Tester les rapports et exports.

* Tester les identifiants de boutiques envoyés artificiellement.

* Tester les utilisateurs ayant plusieurs appartenances, si ce scénario est supporté.

**Critère d'acceptation :** un utilisateur d'une organisation A ne peut pas lire, modifier ou supprimer les données d'une organisation B, même en connaissant les identifiants exacts des ressources.

---

# 8. PHASE 3 — COHÉRENCE DU MODÈLE DE DONNÉES

**Objectif :** éliminer les incohérences entre SQL, services, migrations et types TypeScript.

### DB-001 — Schéma SQL

* Comparer `server/schema.sql` aux migrations appliquées.

* Identifier les différences de colonnes, de types et de contraintes.

* Vérifier toutes les clés primaires.

* Vérifier les clés étrangères.

* Vérifier les champs utilisés dans les requêtes.

* Vérifier les champs de traçabilité.

* Vérifier les champs tenant.

* Vérifier les index et contraintes d'unicité.

* Corriger les incohérences de façon progressive.

### DB-002 — Migrations

* Vérifier l'ordre des migrations.

* Vérifier qu'elles sont reproductibles.

* Tester leur application sur une base vide.

* Tester leur application sur une base de test contenant des données.

* Vérifier leur gestion des erreurs.

* Vérifier le registre des migrations exécutées.

* Documenter les procédures de récupération.

* Interdire les modifications destructrices non validées.

### DB-003 — Identifiants et références

* Vérifier l'uniformité et la compatibilité des identifiants.

* Vérifier les types des clés parentes et enfants.

* Vérifier la génération des identifiants.

* Ajouter les contraintes d'unicité métier requises.

* Vérifier les numéros de tickets et de commandes en situation concurrente.

Ne change pas tous les identifiants d'un seul coup sans plan de migration testé.

### DB-004 — Transactions

* Auditer le fonctionnement de `transaction()` dans `server/db.ts`.

* Déterminer les opérations qui exigent une atomicité.

* Vérifier les chemins de commit et rollback.

* Vérifier le comportement lorsque Neon échoue.

* Tester les erreurs au milieu d'une opération multi-tables.

* Vérifier les mises à jour concurrentes.

**Critère d'acceptation :** les migrations et les relations sont cohérentes et les opérations multi-tables critiques échouent sans laisser d'état partiel interdit.

---

# 9. PHASE 4 — FIABILITÉ DES VENTES ET DE LA CAISSE

**Objectif :** garantir l'exactitude des ventes, des paiements et des encaissements.

### SALE-001 — Validation des ventes

* Valider le contenu des requêtes.

* Recalculer les totaux côté serveur.

* Vérifier les prix depuis les données autorisées.

* Vérifier les quantités.

* Vérifier les remises.

* Vérifier la politique fiscale appliquée.

* Vérifier les moyens de paiement.

* Vérifier les paiements partiels et le rendu de monnaie.

* Vérifier l'association des clients et boutiques.

### SALE-002 — Intégrité du stock vendu

* Vérifier le stock disponible.

* Définir la politique de vente en rupture.

* Empêcher les incohérences dues aux ventes concurrentes.

* Créer des mouvements de stock traçables.

* Regrouper les effets critiques de la vente dans une transaction.

* Tester l'échec d'un mouvement après création des lignes de vente.

### SALE-003 — Numérotation et idempotence

* Vérifier l'unicité des tickets.

* Remplacer les identifiants temporels insuffisants par une stratégie robuste.

* Protéger les requêtes répétées.

* Tester les doubles clics.

* Tester les nouvelles tentatives après délai réseau.

* Empêcher la duplication des ventes.

### CASH-001 — Sessions de caisse

* Vérifier l'ouverture de caisse.

* Vérifier le fond de caisse.

* Vérifier les mouvements entrants et sortants.

* Vérifier les encaissements associés aux ventes.

* Vérifier la clôture.

* Vérifier les écarts entre caisse théorique et comptage réel.

* Interdire les modifications ordinaires d'une session clôturée.

* Tracer les opérations correctives.

### CASH-002 — Retours et annulations

* Prévoir des opérations de contrepassation.

* Conserver les ventes finalisées et leur historique.

* Gérer les remboursements.

* Ajuster le stock selon le retour réel.

* Traiter les remboursements partiels.

* Tracer l'utilisateur et le motif.

* Tester les permissions.

### CASH-003 — Rapports de caisse

* Vérifier les totaux par moyen de paiement.

* Distinguer ventes, paiements et encaissements.

* Vérifier les ventes à crédit.

* Vérifier les remboursements.

* Comparer les totaux avec les écritures sources.

---

# 10. PHASE 5 — ACHATS, FOURNISSEURS ET INVENTAIRE

**Objectif :** assurer une gestion fiable des approvisionnements et des stocks.

### PUR-001 — Workflow d'achat

* Séparer commande, réception et facture fournisseur.

* Empêcher l'augmentation du stock à la simple création d'un bon de commande.

* Gérer les réceptions partielles.

* Gérer les quantités manquantes.

* Gérer les écarts de prix.

* Enregistrer les mouvements de stock lors de la réception validée.

* Empêcher la double réception.

* Vérifier les soldes fournisseurs.

* Vérifier l'isolation organisationnelle de toutes les opérations.

### STK-001 — Source de vérité du stock

* Définir le modèle de stock disponible.

* Distinguer stock physique et stock réservé.

* Relier chaque mouvement à son document source.

* Prévenir les stocks négatifs non autorisés.

* Définir la valorisation du stock.

* Contrôler les quantités et unités.

* Vérifier l'historique des corrections.

### STK-002 — Inventaires et transferts

* Créer un inventaire.

* Enregistrer les quantités comptées.

* Calculer les écarts.

* Autoriser et tracer les ajustements.

* Gérer les transferts inter-boutiques.

* Empêcher une sortie sans entrée correspondante.

* Vérifier les inventaires concurrents.

* Produire un rapport de rapprochement.

### STK-003 — Péremption et lots

* Vérifier les besoins de traçabilité.

* Implémenter les lots lorsque nécessaires.

* Enregistrer les dates pertinentes.

* Définir la stratégie FIFO ou FEFO retenue.

* Ajouter des alertes de péremption si le module est actif.

---

# 11. PHASE 6 — RECETTES, COÛTS ET PRODUCTION

**Objectif :** garantir que les ordres de fabrication reflètent les opérations réelles.

### PROD-001 — Recettes

* Vérifier la cohérence des produits et recettes associés.

* Vérifier les quantités et unités.

* Vérifier les conversions.

* Historiser les versions des recettes.

* Calculer les besoins en ingrédients.

* Conserver les paramètres utilisés pour les productions historiques.

### PROD-002 — Ordres de fabrication

* Définir les statuts autorisés.

* Distinguer création, lancement et finalisation.

* Vérifier les stocks disponibles.

* Prévoir une réservation de matières si nécessaire.

* Enregistrer la consommation réelle.

* Enregistrer les produits finis obtenus.

* Enregistrer les pertes.

* Relier tous les effets aux mouvements de stock.

* Empêcher la finalisation multiple.

* Protéger les opérations contre les accès inter-organisations.

### PROD-003 — Coût de revient

* Vérifier les prix d'achat réels.

* Calculer le coût matière par lot.

* Calculer le coût matière par unité.

* Distinguer coût estimé et coût réel.

* Prendre en compte le rendement réellement obtenu.

* Définir les coûts complémentaires retenus.

* Distinguer taux de marge et taux de marque.

* Tester les formules avec des jeux de données connus.

### PROD-004 — Pertes et invendus

* Enregistrer les quantités perdues.

* Distinguer pertes de production et invendus commerciaux.

* Définir les motifs.

* Enregistrer l'impact sur le stock.

* Calculer le coût des pertes selon une règle documentée.

* Produire des rapports explicables.

---

# 12. PHASE 7 — AUTHENTIFICATION ET ADMINISTRATION

**Objectif :** offrir une gestion professionnelle des comptes et des droits.

### AUTH-001 — Inscription

* Vérifier le formulaire d'inscription.

* Vérifier l'unicité et la normalisation des e-mails.

* Vérifier le hachage des mots de passe.

* Vérifier le workflow de création de l'organisation.

* Vérifier la création de la boutique initiale si elle est prévue.

* Vérifier l'association de l'utilisateur propriétaire.

* Vérifier la transaction et son rollback.

* Vérifier la vérification de l'e-mail.

### AUTH-002 — Récupération de compte

* Tester la demande de réinitialisation.

* Vérifier les dates d'expiration.

* Vérifier l'usage unique des jetons.

* Vérifier la révocation des sessions.

* Vérifier les réponses non révélatrices de l'existence d'un compte.

* Tester les erreurs SMTP.

### AUTH-003 — Permissions

* Établir la matrice des rôles.

* Protéger les fonctions sensibles.

* Vérifier les permissions côté serveur.

* Vérifier les changements de rôle.

* Vérifier la désactivation des comptes.

* Tester chaque permission importante.

### AUTH-004 — Utilisateurs de l'organisation

* Vérifier les invitations.

* Vérifier l'affectation aux boutiques.

* Vérifier la modification des rôles.

* Vérifier la désactivation.

* Prévenir la suppression du dernier propriétaire actif.

* Tracer les actions administratives.

---

# 13. PHASE 8 — CRUD, API ET SYNCHRONISATION FRONTEND

**Objectif :** faire correspondre systématiquement les actions de l'interface aux données réellement persistées.

### API-001 — Contrat API

* Cartographier chaque appel du frontend.

* Comparer les chemins et verbes HTTP avec les routes backend.

* Corriger les routes inexistantes ou incohérentes.

* Normaliser les réponses.

* Uniformiser les erreurs.

* Vérifier les codes HTTP.

* Ajouter les validations d'entrée.

* Documenter les routes et leurs permissions.

### API-002 — CRUD complet

Pour chaque module, vérifier :

* Création persistée.

* Lecture depuis la base.

* Modification persistée.

* Suppression ou désactivation selon la règle métier.

* Mise à jour des listes.

* Actualisation de la page sans perte.

* Gestion des relations.

* Gestion des erreurs.

* Respect des permissions.

* Respect de l'isolation multi-tenant.

Priorité aux produits, matières premières, recettes, fournisseurs, clients, achats, production, ventes, caisse et commandes personnalisées.

### API-003 — États de l'interface

* Ajouter les états de chargement.

* Prévenir les doubles soumissions.

* Afficher des erreurs compréhensibles.

* Synchroniser les tableaux après mutation.

* Invalider les caches affectés.

* Prévenir les succès visuels non confirmés par le serveur.

* Éliminer les fallbacks qui donnent une fausse impression de persistance.

### API-004 — Pagination

* Vérifier la pagination backend existante.

* Connecter la pagination frontend.

* Gérer le tri et les filtres.

* Vérifier les limites de taille de page.

* Ajouter les index utiles.

* Tester les volumes importants.

* Éviter de télécharger tout le catalogue à chaque opération.

---

# 14. PHASE 9 — MODE HORS LIGNE ET PWA

**Objectif :** garantir une reprise fiable lors des coupures de réseau.

### OFF-001 — Unifier les files

* Examiner `syncQueue.ts`.

* Examiner `offlineQueue.ts`.

* Identifier les appels réellement utilisés.

* Choisir une seule architecture de file de synchronisation.

* Éliminer les mécanismes concurrents sans interrompre les opérations en attente.

* Corriger les chemins API incorrects.

* Typer les opérations.

### OFF-002 — Intégrité de synchronisation

* Ajouter un identifiant unique par opération.

* Ajouter une confirmation serveur.

* Rendre les opérations compatibles avec des tentatives répétées.

* Gérer les conflits entre appareils.

* Gérer les erreurs permanentes et temporaires.

* Ne jamais abandonner silencieusement une vente.

* Afficher les opérations en attente et en échec.

* Tester les interruptions pendant l'envoi.

### OFF-003 — PWA

* Vérifier le manifeste et le service worker.

* Vérifier le cache des ressources.

* Vérifier les stratégies de mise à jour.

* Vérifier les règles de confidentialité des caches.

* Vérifier l'affichage de l'état réseau.

* Tester l'installation sur des appareils cibles.

* Documenter les limites du mode hors ligne.

Le mode hors ligne ne doit pas prétendre fournir une cohérence financière centralisée tant que la synchronisation n'a pas été confirmée par le serveur.

---

# 15. PHASE 10 — RAPPORTS, EXPORTS ET NOTIFICATIONS

**Objectif :** ajouter les fonctions professionnelles une fois la cohérence du cœur validée.

### REP-001 — Rapports

* Vérifier les indicateurs du dashboard.

* Définir les formules métier.

* Distinguer chiffre d'affaires, encaissements et bénéfice estimé.

* Vérifier les filtres par période, boutique et utilisateur.

* Vérifier les droits sur les rapports financiers.

* Comparer les rapports aux données sources.

### REP-002 — Exports

* Export CSV.

* Export des produits.

* Export des stocks.

* Export des ventes.

* Export des achats.

* Export des dépenses.

* Export des rapports de caisse.

* PDF des documents nécessaires.

* Tester les montants et formats.

* Vérifier l'isolation multi-tenant des exports.

### NOT-001 — Notifications

* Définir les événements qui déclenchent les notifications.

* Créer le centre de notifications.

* Ajouter les alertes de stock.

* Ajouter les alertes de commande.

* Ajouter les alertes de production.

* Gérer le statut lu/non lu.

* Vérifier les permissions.

* Éviter les notifications dupliquées.

### NOT-002 — Temps réel

* Évaluer les besoins réels.

* Vérifier l'authentification des connexions SSE.

* Empêcher l'envoi d'événements entre organisations.

* Prévoir les déconnexions et reconnexions.

* Évaluer la compatibilité multi-instance.

* Ajouter WebSocket uniquement si justifié.

---

# 16. PHASE 11 — INTÉGRATIONS

**Objectif :** ajouter des intégrations vérifiées et exploitables.

### INT-001 — Mobile Money

* Vérifier les API et offres officiellement accessibles.

* Identifier les contrats et clés nécessaires.

* Définir les statuts de paiement.

* Implémenter les webhooks avec validation de signature conforme à chaque fournisseur.

* Vérifier les références uniques.

* Protéger contre les notifications répétées.

* Réconcilier paiements et ventes.

* Tester les paiements acceptés, échoués et en attente.

* Ne jamais marquer un paiement comme réglé sur la seule base d'une réponse simulée.

Les intégrations Wave, Orange Money et MTN doivent être marquées « non configurées » jusqu'à la validation réelle de leurs flux.

### INT-002 — Impression

* Vérifier l'impression des tickets.

* Vérifier les formats papier.

* Tester ESC/POS sur les imprimantes compatibles.

* Gérer les erreurs d'impression.

* Ajouter une configuration par poste ou boutique.

### INT-003 — Codes-barres

* Tester les scanners USB/Bluetooth.

* Tester la caméra si prise en charge.

* Gérer les produits inconnus.

* Vérifier la rapidité de recherche.

* Tester le fonctionnement dans le POS.

---

# 17. PHASE 12 — JOURNAL D'AUDIT ET EXPLOITATION

**Objectif :** rendre le logiciel exploitable et maintenable commercialement.

### OPS-001 — Audit métier

* Tracer les connexions importantes.

* Tracer les changements de prix.

* Tracer les mouvements de stock.

* Tracer les annulations de vente.

* Tracer les remboursements.

* Tracer les changements de permissions.

* Tracer les opérations d'administration.

* Protéger l'intégrité des journaux.

* Empêcher l'accès aux journaux des autres organisations.

### OPS-002 — Observabilité

* Structurer les logs serveur.

* Ajouter des identifiants de requête.

* Mesurer les erreurs et latences.

* Ajouter une surveillance de santé.

* Séparer les erreurs techniques des événements métier.

* Supprimer les logs de secrets et de données sensibles.

### OPS-003 — Sauvegarde et restauration

* Documenter la stratégie de sauvegarde Neon.

* Définir les objectifs de reprise.

* Tester la restauration sur un environnement isolé.

* Vérifier la cohérence des données restaurées.

* Définir les responsabilités de maintenance.

* Documenter la procédure en cas d'incident.

* Vérifier la possibilité d'export des données par organisation.

### OPS-004 — Performance

* Mesurer les routes les plus lentes.

* Analyser les requêtes SQL.

* Ajouter les index justifiés.

* Vérifier la pagination.

* Prévenir les requêtes répétitives inutiles.

* Optimiser les volumes importants.

* Évaluer la charge sur plusieurs organisations.

---

# 18. PHASE 13 — PRÉPARATION COMMERCIALE DU SAAS

**Objectif :** permettre la commercialisation auprès de plusieurs boulangeries.

### SaaS-001 — Abonnements

* Définir les plans.

* Définir les quotas.

* Définir les périodes d'essai.

* Gérer les changements de formule.

* Gérer les renouvellements.

* Gérer les expirations.

* Prévoir une période de grâce si la stratégie commerciale le prévoit.

* Protéger l'accès aux données historiques.

* Vérifier les droits premium côté serveur.

### SaaS-002 — Console d'administration SaaS

* Lister les organisations.

* Consulter le statut des abonnements.

* Gérer les plans.

* Consulter l'état technique des comptes.

* Contrôler les quotas.

* Tracer les actions de l'administrateur SaaS.

* Empêcher qu'un administrateur ordinaire accède aux données métier sans autorisation explicite.

### SaaS-003 — Intégration d'une nouvelle boulangerie

* Créer un compte propriétaire.

* Créer une organisation.

* Créer la boutique initiale.

* Configurer les paramètres de base.

* Permettre l'import initial des produits.

* Configurer les rôles.

* Vérifier l'isolation des données.

* Fournir un parcours de démarrage clair.

### SaaS-004 — Conditions de commercialisation

* Vérifier la sécurité.

* Vérifier la persistance.

* Vérifier les sauvegardes.

* Vérifier la restauration.

* Vérifier les conditions d'utilisation et la confidentialité.

* Vérifier les obligations applicables au marché visé.

* Vérifier la procédure de support et de résolution d'incidents.

* Préparer une procédure de migration des données clients.

Ne jamais annoncer une conformité réglementaire sans vérification appropriée.

---

# 19. PHASE 14 — CAMPAGNE QA FINALE

**Objectif :** démontrer que le logiciel fonctionne dans des scénarios réalistes.

### QA-001 — Qualité statique

* Contrôle TypeScript.

* Build frontend.

* Build ou démarrage backend.

* Analyse des erreurs de lint si configurée.

* Vérification des imports et dépendances.

* Vérification des scripts de migration.

### QA-002 — Tests unitaires

* Authentification.

* Permissions.

* Calculs de vente.

* Calculs de coûts.

* Conversions d'unités.

* Stocks.

* Achats.

* Production.

* Caisse.

* Rapports.

### QA-003 — Tests d'intégration

* Base réelle de test.

* CRUD persistant.

* Relations entre tables.

* Transactions et rollback.

* Erreurs réseau.

* Idempotence.

* Isolation tenant.

* Migrations.

### QA-004 — Parcours complet

Exécuter de bout en bout :

1. Inscription d'une nouvelle boulangerie.

2. Vérification de l'e-mail.

3. Connexion et restauration de session.

4. Création d'une catégorie.

5. Création et modification d'un produit.

6. Création d'une recette.

7. Enregistrement des ingrédients.

8. Commande fournisseur.

9. Réception partielle et complète.

10. Vérification du stock.

11. Production.

12. Finalisation et contrôle des consommations.

13. Ouverture de caisse.

14. Vente avec encaissement.

15. Vérification du ticket et du stock.

16. Clôture de caisse.

17. Enregistrement d'une dépense.

18. Consultation des créances et rapports.

19. Test d'une seconde organisation.

20. Test des permissions.

21. Test d'une opération hors ligne.

22. Vérification des rapports et exports.

### QA-005 — Non-régression

* Rejouer les tests après chaque correction sensible.

* Vérifier les modules voisins.

* Tester les erreurs et les scénarios limites.

* Comparer les résultats financiers aux calculs de référence.

* Documenter les anomalies restantes.

---

# 20. RÈGLES POUR L'EXÉCUTION DES MIGRATIONS

Les migrations constituent une zone de risque particulière.

L'agent doit :

* Travailler sur une base de test pour les expérimentations.

* Examiner l'état réel des migrations existantes.

* Ne jamais supprimer des données pour résoudre un conflit de schéma.

* Ne jamais exécuter une migration destructive en production sans sauvegarde, analyse d'impact et validation explicite.

* Prévoir des stratégies de migration en plusieurs étapes lorsque nécessaire.

* Vérifier les données existantes avant d'ajouter des contraintes `NOT NULL` ou des clés étrangères.

* Générer des scripts de contrôle avant et après la migration.

* Documenter les mesures de reprise en cas d'échec.

Ne jamais annoncer que les migrations fonctionnent simplement parce que leur code SQL est syntaxiquement plausible.

---

# 21. FORMAT OBLIGATOIRE DES MISES À JOUR

À la fin de chaque session de travail, présente un rapport sous cette forme :

## État de la roadmap

* Phase active :

* Tâche en cours :

* Tâches terminées et vérifiées :

* Tâches encore ouvertes :

* Blocages :

* Risques P0 :

* Tests réellement exécutés :

* Tests réussis :

* Tests échoués :

* Fichiers modifiés :

* Migrations créées :

* Décisions à prendre :

* Prochaine tâche recommandée :

Pour chaque test, indique la commande et son résultat réel.

Pour chaque tâche terminée, donne une preuve vérifiable.

Ne prétends jamais qu'un déploiement, une intégration ou une migration a réussi si tu ne disposes pas d'une confirmation réelle.

---

# 22. RÈGLES DE PRIORISATION ET DE DÉPENDANCES

L'ordre général est le suivant :

1. Secrets et configurations dangereuses.

2. Authentification et accès aux routes.

3. Isolation multi-tenant.

4. Intégrité de la base et migrations.

5. Transactions et règles métier.

6. Ventes, caisse, achats, stocks et production.

7. CRUD et synchronisation de l'interface.

8. Mode hors ligne.

9. Rapports, notifications et exports.

10. Intégrations.

11. Administration, audit et sauvegardes.

12. Abonnements SaaS et préparation commerciale.

13. Durcissement et mise en production.

Cet ordre est une règle générale. Les dépendances réelles doivent être représentées dans la roadmap.

Si une anomalie bloque plusieurs modules, augmente sa priorité selon son impact.

Ne commence pas une tâche dépendante tant que sa précondition n'est pas satisfaite.

Ne bloque pas les tâches indépendantes sans raison technique.

Ne développe pas des fonctionnalités avancées alors qu'une faille P0 connue permettrait une fuite de données ou une perte financière.

---

# 23. CRITÈRES DE SORTIE DE LA ROADMAP

La roadmap n'est pas terminée parce que toutes les cases sont cochées.

Le projet peut être déclaré prêt à la mise en production uniquement lorsque :

* Les secrets et configurations sont sécurisés.

* L'authentification est cohérente.

* Les routes privées sont protégées.

* L'isolation multi-tenant a été testée.

* Le schéma et les migrations sont validés.

* Les opérations métier critiques sont cohérentes.

* Les ventes, paiements, achats, stocks et productions sont vérifiables.

* Les erreurs n'entraînent pas de fausses confirmations.

* Le mode démo est désactivé ou isolé en production.

* Aucun fallback silencieux vers les données fictives n'est possible en production.

* Les tests critiques passent sur un environnement contrôlé.

* Les procédures de sauvegarde et restauration sont documentées et testées.

* La configuration de déploiement est documentée.

* Les principaux parcours de bout en bout passent.

* Les anomalies restantes sont classées et acceptées explicitement.

* Les documents de préparation à la production contiennent des preuves.

Si l'une de ces conditions critiques n'est pas remplie, indique clairement que la mise en production reste bloquée.

---

# 24. PREMIÈRE ACTION À EXÉCUTER MAINTENANT

Commence par la phase 0 et exécute exclusivement l'audit de référence.

Ne lance pas immédiatement une refonte complète.

Ta première mission est :

1. Examiner l'état actuel de la branche de référence.

2. Vérifier les scripts et les commandes disponibles.

3. Exécuter les validations réalisables.

4. Vérifier les risques de sécurité sans révéler de secrets.

5. Comparer le code aux documents existants.

6. Construire `ROADMAP.md`.

7. Construire `TODO.md`.

8. Construire `docs/EXECUTION_LOG.md`.

9. Construire `docs/KNOWN_ISSUES.md`.

10. Construire `docs/PRODUCTION_READINESS.md`.

11. Identifier les tâches P0.

12. Présenter un bilan de l'audit et recommander la toute première correction.

Ensuite, exécute les tâches une par une, par ordre de priorité, en mettant à jour les fichiers de suivi.

Si tu ne peux pas accéder au dépôt ou exécuter une commande, indique le blocage. Ne fabrique aucune preuve.

**OBJECTIF FINAL : transformer BoulangeriePro ERP en un produit commercialisable sur lequel plusieurs boulangeries peuvent compter quotidiennement, en garantissant une persistance réelle, des opérations métier cohérentes, une isolation stricte des données et une maintenance maîtrisée.**

## Comment lancer le travail correctement

Je te recommande de donner ce prompt à ton agent en deux étapes.

Première étape : générer la roadmap, sans modifier le code métier. L'agent doit examiner le dépôt, exécuter les contrôles disponibles et créer les cinq documents de pilotage. Cela évite qu'il se lance dans des corrections dispersées sans comprendre les dépendances.

Deuxième étape : commencer par les tâches P0. Dès que `TODO.md` est établi, demande à l'agent de traiter une seule tâche à la fois, en commençant par les secrets et l'authentification. Il doit conserver les modifications, tests et preuves avant de passer à la suivante.

Tu peux lui donner cette instruction complémentaire pour démarrer :

Message

Applique maintenant le Master Prompt de roadmap au dépôt BoulangeriePro ERP.

Pour cette première intervention, travaille exclusivement sur l'audit et la création des documents de pilotage. N'entreprends aucune refonte du code métier.

Inspecte le dépôt actuel, vérifie les commandes disponibles, exécute les validations réalisables et crée les cinq documents de suivi demandés.

Classe toutes les anomalies par priorité et par dépendance. Distingue les problèmes confirmés des risques à investiguer. Ne marque aucun test comme réussi sans l'avoir exécuté.

À la fin, présente-moi le bilan de l'audit, les tâches P0 découvertes, les éventuels blocages et la première correction que tu recommandes. Attends la fin de cette étape avant d'entreprendre les corrections suivantes.

Point de vigilance : la première action de la roadmap doit rester la sécurisation des secrets potentiellement exposés dans le dépôt public. Il ne faut pas attendre la fin des fonctionnalités avancées pour traiter ce risque.
