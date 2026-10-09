Voici le Master Prompt de production de ERP_BOULANGERIE_CI, conçu pour être donné directement à ton agent IA de développement avec accès au dépôt GitHub.

Il impose à l’agent de corriger le code existant, sécuriser l’application, fiabiliser Neon, implémenter les opérations métier manquantes et tester les résultats plutôt que de te fournir uniquement un audit ou de reconstruire une interface qui paraît fonctionnelle sans l’être réellement.

Le volet sécurité reprend notamment les recommandations d’Express et d’OWASP sur la protection des API, les sessions et la lutte contre les tentatives de connexion abusives.

![](https://www.google.com/s2/favicons?domain=https://github.com&sz=32)

GitHub

+1

MASTER PROMPT — ERP_BOULANGERIE_CI

# MASTER PROMPT — ERP_BOULANGERIE_CI

## Stabilisation technique, correction métier et préparation à la production d’un ERP SaaS pour boulangeries ivoiriennes

---

# 1. TON RÔLE ET TA MISSION

Tu interviens en tant qu’équipe senior réunissant les compétences suivantes :

- Software Architect spécialisé en applications SaaS B2B multi-entreprises.

- Senior Full-Stack Engineer React, TypeScript, Node.js et Express.

- Expert PostgreSQL, Neon Serverless et conception de transactions SQL.

- Expert en cybersécurité applicative, authentification, autorisation et isolation des données.

- Expert en systèmes de caisse, gestion des stocks, achats et production.

- Expert en comptabilité de gestion, calcul des coûts de revient, marges et trésorerie.

- QA Engineer spécialisé dans les tests automatisés et les systèmes transactionnels.

- Product Engineer chargé de transformer une application existante en logiciel commercialisable.

Tu travailles sur le dépôt :

**GitHub :** `Colorado225/ERP_BOULANGERIE_CI`

**URL :** [https://github.com/Colorado225/ERP_BOULANGERIE_CI](https://github.com/Colorado225/ERP_BOULANGERIE_CI)

## Mission principale

Transformer le projet existant en une application de gestion professionnelle, fiable, sécurisée, testable et commercialisable auprès des boulangeries en Côte d’Ivoire.

Tu dois :

1. Examiner l’intégralité du projet existant.

2. Identifier les écarts entre l’interface, le backend, la base de données et les règles métier.

3. Corriger les défauts de sécurité et les erreurs bloquantes.

4. Implémenter les fonctionnalités annoncées mais partiellement ou incorrectement fonctionnelles.

5. Garantir la persistance réelle des données dans PostgreSQL via Neon.

6. Fiabiliser les opérations financières, les stocks et les calculs de production.

7. Ajouter des tests automatiques pertinents.

8. Préparer l’application à un déploiement de production maîtrisé.

**Tu dois modifier et implémenter le code. Un rapport, une liste de recommandations ou des maquettes ne constituent pas une livraison suffisante.**

Ne prétends jamais qu’une fonctionnalité est opérationnelle tant que son parcours complet n’a pas été vérifié.

---

# 2. CONTEXTE TECHNIQUE EXISTANT

Le projet utilise actuellement les technologies suivantes :

- React 19

- TypeScript

- Vite

- Tailwind CSS

- Node.js

- Express

- PostgreSQL sur Neon

- `@neondatabase/serverless`

- Recharts pour les graphiques

- Une interface de caisse, un tableau de bord et plusieurs modules métier

- Une application PWA et des mécanismes de synchronisation hors ligne

Le code contient notamment :

- `src/App.tsx`

- `src/context/AuthContext.tsx`

- `src/context/BakeryContext.tsx`

- `src/services/api.ts`

- `src/services/offlineQueue.ts`

- `src/services/syncQueue.ts`

- `server/index.ts`

- `server/auth.ts`

- `server/neon-auth.ts`

- `server/db.ts`

- `server/schema.sql`

- `server/routes/auth.routes.ts`

- `server/routes/catalog.routes.ts`

- `server/routes/operations.routes.ts`

- `server/routes/admin.routes.ts`

- `server/routes/reports.routes.ts`

- `server/services/`

Cette liste constitue un point de départ et non un inventaire exhaustif. Examine également les autres fichiers, les configurations, les éventuelles migrations, les composants de chaque module et les dépendances.

## Règles concernant l’architecture

Conserve React, Vite, TypeScript, Express et Neon pendant la phase de stabilisation, sauf si tu démontres qu’un changement est indispensable.

Ne réécris pas inutilement le projet avec un nouveau framework.

Ne supprime aucun écran, module, modèle ou comportement existant sans avoir étudié son utilité et défini une stratégie de remplacement.

Préserve autant que possible le design actuel, la navigation, les composants métier et les fonctionnalités déjà correctes.

Si une évolution de l’architecture est nécessaire, réalise-la progressivement et documente ses conséquences.

---

# 3. RÈGLES DE TRAVAIL NON NÉGOCIABLES

## 3.1. Lire et comprendre avant de modifier

Commence par examiner :

- La structure complète du dépôt.

- Les scripts et dépendances.

- Les types TypeScript.

- Les écrans et composants.

- Les appels API du front-end.

- Toutes les routes Express.

- Les services métier.

- Le schéma PostgreSQL.

- Les migrations existantes.

- Les fichiers d’environnement.

- Les seeds de démonstration.

- Les mécanismes d’authentification et de synchronisation.

- Les configurations de build et de déploiement.

Trace, pour chaque fonctionnalité, le parcours :

**Interface → validation → appel API → authentification → autorisation → service métier → transaction SQL → réponse serveur → actualisation de l’interface.**

Identifie les divergences entre ces couches.

## 3.2. Ne jamais fabriquer un résultat positif

Interdictions absolues :

- Afficher un succès si le serveur a échoué.

- Présenter une donnée en mémoire comme une donnée sauvegardée.

- Ajouter une vente à l’écran sans persistance durable.

- Décrémenter un stock sans opération backend fiable.

- Simuler une intégration Mobile Money en production.

- Avaler une erreur et continuer comme si rien ne s’était passé.

- Ajouter des boutons sans implémenter leur action.

- Déclarer les tests réussis sans les avoir exécutés.

Chaque opération doit produire un résultat explicite : réussi, en attente, échoué ou à vérifier.

## 3.3. Protéger les données existantes

Ne supprime pas les données et ne lance pas de migration destructive sur une base de production.

Avant toute migration :

1. Comprends le schéma actuel et les données qu’il contient.

2. Prépare une migration versionnée.

3. Prévois une stratégie de sauvegarde et de retour arrière lorsque cela est possible.

4. Vérifie la migration sur une base de développement ou de test.

5. Documente les éventuelles opérations manuelles nécessaires.

Si tu ne disposes pas de `DATABASE_URL` ou d’un environnement de test, n’invente pas de résultat. Crée les tests et indique clairement ce qui reste à valider.

## 3.4. Travailler par étapes vérifiables

Avance par lots cohérents, dans l’ordre défini dans ce prompt.

Après chaque lot, exécute les vérifications disponibles et corrige les régressions avant de poursuivre.

Si Git est disponible, utilise une branche dédiée, par exemple :

`fix/erp-boulangerie-production-ready`

Ne pousse pas de modifications sur une branche protégée et ne déploie pas en production sans autorisation explicite.

---

# 4. PHASE 0 — AUDIT TECHNIQUE EXHAUSTIF

Commence par créer ou mettre à jour :

- `docs/TECHNICAL_AUDIT.md`

- `docs/IMPLEMENTATION_PLAN.md`

- `docs/DATA_MODEL.md`

L’audit doit distinguer :

- Défaut confirmé par inspection du code.

- Défaut confirmé par test d’exécution.

- Risque à vérifier dans l’environnement réel.

- Fonctionnalité absente.

- Fonctionnalité partiellement implémentée.

- Fonctionnalité fonctionnelle.

Classe les défauts :

- **P0 — Critique :** sécurité, perte ou corruption de données, ventes incohérentes.

- **P1 — Bloquant métier :** une fonctionnalité essentielle ne peut pas être utilisée correctement.

- **P2 — Important :** qualité, expérience utilisateur, fiabilité ou gestion opérationnelle.

- **P3 — Amélioration :** optimisation ou évolution non indispensable au lancement.

Reprends notamment les zones déjà identifiées pendant l’audit initial.

### Authentification

- Session de démonstration automatiquement attribuée avec le rôle gérant.

- Acceptation possible de comptes de démonstration lorsque la connexion échoue.

- Incohérence entre la génération de JWT locaux et leur validation via Neon Auth JWKS.

- Jeton enregistré dans `localStorage`.

- Routes de données qui ne possèdent pas de protection générale cohérente.

### Schéma SQL

Vérifie les incompatibilités constatées entre `server/schema.sql` et les services :

- Colonne `sales.notes` utilisée par un service sans être présente dans le schéma examiné.

- Identifiants texte fournis aux colonnes `BIGSERIAL` de tables de lignes.

- Requêtes du service d’achat utilisant des paramètres SQL incohérents.

- Colonnes `store_id` utilisées pour les clients et fournisseurs sans correspondance dans les définitions examinées.

- Autres clés étrangères, colonnes, contraintes et index incompatibles.

### Logique métier

- Recettes enregistrées localement malgré l’échec possible de l’API.

- Ventes et production modifiées dans l’état React sans persistance backend systématique.

- Stocks mis à jour côté client au lieu de l’être exclusivement par des opérations backend fiables.

- Réception et commande fournisseur qui ne distinguent pas correctement leurs effets sur les stocks.

- Calcul des quantités consommées en production à vérifier.

- Utilisation de plusieurs mécanismes de synchronisation hors ligne.

- Seeds susceptibles de créer des identifiants de boutique incompatibles ou des doublons.

Poursuis l’audit au-delà de ces exemples. Recherche toutes les incohérences comparables.

Ne considère jamais cette liste comme la totalité des problèmes.

---

# 5. PHASE 1 — AUTHENTIFICATION ET SÉCURITÉ P0

Aucune donnée métier ne doit être accessible ou modifiable sans autorisation appropriée.

## 5.1. Choisir un seul système d’authentification

Étudie précisément les implémentations existantes et documente le choix.

Le modèle de données contient déjà une table `users` avec des empreintes de mots de passe et un endpoint de connexion local.

Par défaut, privilégie cette architecture existante si aucun déploiement Neon Auth cohérent et fonctionnel n’est établi :

- Vérification des mots de passe avec `bcryptjs`.

- Émission du jeton côté serveur.

- Validation du jeton par le même système de confiance.

- Identité et rôle dérivés de la session vérifiée.

- Durée de session contrôlée côté serveur.

- Mécanisme de déconnexion et d’expiration cohérent.

Si tu conserves Neon Auth, termine réellement cette intégration et supprime les mécanismes de connexion concurrents.

Ne mélange jamais deux systèmes incompatibles.

Ne conserve aucun émetteur, identifiant de projet ou JWKS codé en dur qui ne correspond pas à la configuration vérifiée.

## 5.2. Gestion de session

Pour un déploiement web de même origine, privilégie une session protégée par un cookie `HttpOnly`, `Secure` en production et `SameSite` explicitement configuré, avec une protection CSRF adaptée.

Si l’architecture de déploiement impose un autre mécanisme, documente le choix et ses protections.

N’enregistre pas de jetons d’authentification dans `localStorage` ou `sessionStorage`.

La déconnexion doit invalider la session selon le mécanisme retenu ; supprimer simplement une valeur dans le navigateur ne doit pas être présenté comme une révocation côté serveur.

N’expose aucun secret dans le code client.

## 5.3. Supprimer les contournements de démonstration

Corrige `src/context/AuthContext.tsx`.

En l’absence de session valide, l’utilisateur doit rester déconnecté.

Une erreur réseau ou une erreur d’authentification ne doit jamais permettre d’accéder au compte gérant.

Les comptes de démonstration doivent être explicitement réservés à un environnement de développement isolé, et ne doivent jamais être acceptés comme solution de secours en production.

## 5.4. Contrôle des accès

Définis une matrice de permissions explicite :

- `gerant` : administration et accès selon les responsabilités du propriétaire.

- `caissier` : opérations de caisse autorisées et ventes.

- `boulanger` : recettes, fournées et opérations de production autorisées.

- `magasinier` : stocks, achats et réceptions autorisés.

Évite une hiérarchie numérique où un rôle supérieur hériterait automatiquement de tous les droits d’un rôle inférieur sans justification métier.

Crée des middlewares explicites, par exemple :

- `requireAuth`

- `requirePermission`

- `requireRole`

Applique la vérification côté serveur sur chaque route.

L’interface peut masquer une action interdite, mais cela ne remplace jamais l’autorisation backend.

## 5.5. Sécurisation complémentaire

Implémente, selon la configuration réelle :

- Limitation des tentatives de connexion.

- Protection contre le brute force.

- Validation des entrées.

- Limitation de la taille des requêtes.

- Politique CORS restrictive.

- En-têtes HTTP de sécurité.

- Gestion centralisée des erreurs.

- TLS en production.

- Journalisation sans mots de passe, jetons ni données sensibles.

- Secrets injectés par variables d’environnement ou gestionnaire de secrets.

- Vérification des dépendances vulnérables.

Crée `docs/SECURITY.md`, décrivant les protections effectives et les procédures de configuration.

---

# 6. PHASE 2 — POSTGRESQL / NEON ET INTÉGRITÉ DES DONNÉES

## 6.1. Établir un schéma cohérent

Compare systématiquement :

- `server/schema.sql`

- Les types TypeScript.

- Les services SQL.

- Les réponses API.

- Les relations réellement utilisées par le front-end.

Chaque nom de colonne, type d’identifiant, type numérique et contrainte doit être cohérent dans toutes ces couches.

Corrige notamment les problèmes confirmés dans les ventes, les lignes de vente, les recettes, les ingrédients, les achats et les requêtes clients/fournisseurs.

Pour chaque table de lignes, choisis une stratégie d’identifiants cohérente : soit une clé générée par PostgreSQL sans identifiant transmis par l’application, soit un identifiant applicatif correspondant exactement au type SQL choisi.

Élimine les insertions mélangeant UUID, identifiants texte et colonnes `BIGSERIAL`.

Vérifie les relations :

- Produit et boutique.

- Matière première et fournisseur.

- Recette et ingrédients.

- Ordre de fabrication et recette.

- Vente et lignes de vente.

- Achat et lignes d’achat.

- Mouvement de stock et matière première.

- Client et opérations sur crédit.

- Entreprise, boutiques et utilisateurs.

Ajoute les clés étrangères, contraintes et index réellement nécessaires.

Utilise des requêtes paramétrées.

## 6.2. Adopter un système de migrations versionnées

Ne fais pas de `schema.sql` l’unique mécanisme d’évolution de la base.

Mets en place un système de migrations ordonnées, avec historique des migrations appliquées, transaction lorsque la migration le permet et mécanisme d’échec explicite.

Les migrations doivent être reproductibles dans un environnement neuf et contrôlées avant application sur des données existantes.

Maintiens une méthode fiable d’initialisation de la base.

Documente :

- La création d’une base de développement Neon.

- Les variables d’environnement nécessaires.

- L’application des migrations.

- L’initialisation des données de démonstration.

- Les sauvegardes et restaurations.

- Les opérations requérant une intervention manuelle.

Ne partage jamais les vraies variables d’environnement.

## 6.3. Isoler les entreprises clientes

L’objectif commercial est un SaaS destiné à plusieurs boulangeries indépendantes.

Prévois une entité `organizations` ou un modèle équivalent.

Chaque organisation doit posséder ses paramètres et ses données. Ses boutiques et utilisateurs doivent être correctement rattachés.

Définis le périmètre de chaque table métier et ajoute les relations nécessaires pour empêcher tout accès transversal entre entreprises.

La session vérifiée doit déterminer l’organisation et les boutiques autorisées.

Ne fais jamais confiance à un `organizationId` fourni librement par le navigateur.

Chaque requête métier doit appliquer le périmètre d’accès approprié.

Évalue l’intérêt de PostgreSQL Row-Level Security en complément des contrôles de l’application, en tenant compte du mode de connexion Neon et du rôle PostgreSQL utilisé.

## 6.4. Normalisation des réponses API

Expose des réponses stables et prévisibles.

Les noms de propriétés JSON doivent correspondre aux contrats TypeScript attendus par le front-end.

Gère correctement les valeurs nulles, les nombres PostgreSQL et les dates.

Utilise des schémas de validation pour vérifier les requêtes entrantes.

Ne te contente pas de caster `req.body` en TypeScript : ce cast ne valide pas les données reçues à l’exécution.

---

# 7. PHASE 3 — TRANSACTIONS MÉTIER ET SERVICES BACKEND

Les opérations qui modifient simultanément plusieurs tables doivent être atomiques lorsque cela est nécessaire.

Une vente ne doit pas exister sans ses lignes si celles-ci sont obligatoires. Une réception ne doit pas augmenter les stocks sans enregistrer son mouvement. Une dépense ne doit pas être enregistrée à moitié.

Utilise les services métier pour centraliser les règles de gestion.

Ne duplique pas la logique critique dans React.

## 7.1. Caisse et ventes

Implémente un parcours complet :

1. Sélection des produits.

2. Validation des quantités.

3. Contrôle des prix et des remises.

4. Calcul serveur des montants.

5. Vérification du mode de paiement.

6. Vérification du stock disponible.

7. Enregistrement du ticket et des lignes.

8. Décrémentation cohérente des stocks.

9. Enregistrement des mouvements de stock correspondants.

10. Enregistrement des règlements et mouvements de caisse nécessaires.

11. Mise à jour du crédit client et de la fidélité si applicable.

12. Retour d’un ticket confirmé à l’interface.

Le serveur doit recalculer les totaux et ne pas accepter aveuglément les montants envoyés par le navigateur.

Les prix personnalisés et les remises exceptionnelles doivent être autorisés par rôle et journalisés.

Verrouille les lignes de stock pertinentes pendant les transactions concurrentes et refuse une vente qui conduirait à un stock négatif.

Ne masque pas une insuffisance de stock en ramenant artificiellement le résultat à zéro.

## 7.2. Numérotation des tickets

Ne génère pas les numéros de tickets uniquement à partir de `Date.now()` ou du nombre de ventes chargé dans le navigateur.

Utilise un mécanisme fiable côté base de données, compatible avec les opérations concurrentes, accompagné des contraintes d’unicité nécessaires.

Prévoyez une traçabilité des tickets annulés et des corrections.

Ne supprime pas silencieusement une vente validée : implémente une procédure d’annulation ou de remboursement avec motif, autorisation et journal d’audit.

La conformité réglementaire du système de facturation devra être validée séparément avant de la revendiquer.

## 7.3. Gestion de caisse

Prévois :

- Ouverture de caisse avec fonds initial.

- Encaissements par mode de paiement.

- Dépenses et sorties autorisées.

- Règlements clients.

- Paiements fournisseurs.

- Clôture par caissier.

- Solde théorique.

- Solde compté.

- Écart de caisse.

- Justification des écarts.

- Historique non destructif des opérations.

Les mouvements comptables et financiers doivent pouvoir être rapprochés des opérations sources.

La clôture ne doit pas dépendre uniquement d’une somme calculée dans l’interface.

## 7.4. Achats fournisseurs et réceptions

Implémente un cycle métier cohérent :

- Brouillon.

- Commandé.

- Partiellement reçu.

- Reçu.

- Annulé selon les règles applicables.

La création d’un bon de commande ne doit pas augmenter le stock.

Lors de la réception, le backend doit vérifier les quantités réellement reçues puis enregistrer, dans une transaction adaptée :

- Les lignes de réception.

- Les mouvements entrants.

- L’actualisation des stocks.

- Le coût d’achat constaté.

- La dette fournisseur correspondante.

- L’état du bon de commande.

Une même réception ne doit jamais être comptabilisée deux fois.

Prévois les réceptions partielles et les paiements partiels des factures fournisseurs.

## 7.5. Gestion du crédit client

Les clients professionnels peuvent représenter des hôtels, restaurants, revendeurs et autres acheteurs en gros.

Implémente :

- Plafond de crédit.

- Solde dû.

- Historique des ventes à crédit.

- Historique des règlements.

- Échéances et relances éventuelles.

- Autorisation des dépassements.

- Traçabilité des corrections.

Un règlement doit être enregistré de manière atomique avec la diminution de la créance et le mouvement de trésorerie correspondant.

N’effectue pas deux mises à jour indépendantes qui pourraient laisser les comptes incohérents.

---

# 8. PHASE 4 — STOCKS, RECETTES ET COÛTS DE REVIENT

Cette phase est essentielle à la valeur commerciale du produit.

L’ERP doit aider le boulanger à comprendre ses coûts réels et à déterminer la rentabilité de ses produits.

## 8.1. Fiches matières premières

Chaque matière doit posséder, selon le besoin :

- Code unique.

- Libellé.

- Catégorie.

- Unité de stockage.

- Stock disponible.

- Seuil d’alerte.

- Coût d’achat.

- Fournisseur.

- Lot.

- Date de péremption.

- Emplacement.

- Historique des mouvements.

La modification directe du stock via un CRUD générique ne doit pas permettre de contourner la traçabilité.

Tout ajustement doit passer par un service contrôlant le stock, enregistrant le mouvement et préservant l’historique.

## 8.2. Unités et conversions

Définis une convention explicite pour les unités de recette et de stockage.

Exemples :

- kg et g.

- L et ml.

- Unités individuelles.

- Sacs de farine, avec conversion explicite vers l’unité de stock.

Évite les calculs mélangeant directement grammes et kilogrammes.

Les conversions doivent être centralisées, testées et appliquées de façon cohérente.

## 8.3. Calcul réel du coût des recettes

Chaque recette doit enregistrer :

- Produit fabriqué.

- Rendement réel attendu par lot de recette.

- Ingrédients.

- Quantité de chaque ingrédient.

- Unité.

- Coût unitaire utilisé.

- Coût des ingrédients.

- Coût total de la recette.

- Coût par unité produite.

Définis clairement si les quantités des ingrédients sont exprimées pour un lot complet ou pour une unité de produit.

Le calcul doit tenir compte du rendement de la recette.

Par exemple, si une recette utilise 5 kg de farine pour produire 100 pains, la consommation pour 20 pains doit être proportionnelle au rendement, après prise en compte des éventuelles règles de conversion et de pertes.

Ne multiplie pas indistinctement les quantités d’ingrédients par le nombre de produits si le rendement de la recette n’a pas été pris en compte.

## 8.4. Coûts indirects et rentabilité

Prépare une architecture permettant d’ajouter des coûts configurables :

- Électricité ou combustible.

- Main-d’œuvre.

- Emballages.

- Pertes de production.

- Autres charges de fabrication.

Ne prétends pas calculer un coût de revient complet si seules les matières premières sont prises en compte.

Distingue explicitement :

- Coût matière.

- Coût de fabrication.

- Coût de revient estimé.

- Prix de vente.

- Marge brute.

- Marge après charges retenues.

- Résultat estimé.

Le résultat affiché doit correspondre aux données réellement disponibles et à une formule documentée.

Conserve les coûts historiques nécessaires pour comprendre la marge d’une vente passée même lorsque le prix d’achat des matières augmente.

## 8.5. Production

Implémente le flux :

**Planifiée → Préparation → En cours → Contrôle → Terminée**, avec les transitions réellement utiles et des annulations contrôlées.

À chaque transition :

- Vérifie les droits de l’utilisateur.

- Contrôle les quantités.

- Vérifie les matières nécessaires.

- Empêche les doubles consommations.

- Enregistre les mouvements de stock.

- Conserve les quantités prévues et réelles.

- Enregistre les pertes.

- Met à jour le stock de produits finis une seule fois au moment métier approprié.

Choisis explicitement le moment où les matières sont réservées puis consommées, par exemple au démarrage effectif de la production. Une simple création d’ordre ne doit pas provoquer une consommation incontrôlée.

Le calcul des matières consommées doit être proportionnel au rendement de la recette et à la quantité réellement produite, selon une politique documentée.

## 8.6. Lots et péremption

Vérifie les lots de matières premières avant leur consommation et applique une politique de rotation documentée, par exemple FEFO lorsque la date de péremption est connue.

Conserve la traçabilité des lots et prévois un blocage des lots périmés ou non conformes selon les règles retenues.

Toute alerte doit s’appuyer sur les données réellement enregistrées.

---

# 9. PHASE 5 — COMMANDES, PERTES ET AUTRES MODULES

Finalise les fonctionnalités déjà annoncées par l’application.

### Produits finis

CRUD complet, catégories, prix, coût, code-barres, statut actif, seuil de stock et rattachement aux recettes.

### Fournisseurs

CRUD complet, coordonnées, conditions de règlement, matières fournies, historique des achats, factures et solde fournisseur.

### Clients

CRUD complet, coordonnées, catégories, historique, fidélité et crédit.

### Pertes et invendus

Une perte doit :

- Avoir un motif.

- Posséder une quantité et une valorisation.

- Être liée au bon produit ou à la bonne matière.

- Déclencher le mouvement de stock approprié.

- Être enregistrée avec l’utilisateur et la boutique.

- Être modifiable uniquement selon des règles contrôlées.

- Rester traçable après correction.

Évite de diminuer un stock dans une route et d’enregistrer la perte dans une autre opération indépendante.

### Commandes spéciales et gâteaux

Implémente un cycle de commande, acompte, solde restant, date de retrait, statut de fabrication et livraison ou retrait.

Le calcul du solde doit être cohérent et validé côté serveur.

### Tableau de bord

Les indicateurs doivent provenir de données réellement persistées et correspondre à des périodes explicites.

Prévois des états de chargement, des états vides et des erreurs lisibles.

Ne remplace pas une statistique manquante par une valeur de démonstration.

---

# 10. PHASE 6 — INTERFACE REACT ET EXPÉRIENCE UTILISATEUR

Conserve l’identité visuelle existante et concentre la refonte sur la fiabilité fonctionnelle.

N’engage pas une migration générale vers Next.js, Shadcn/ui ou ReUI durant ce chantier sans justification concrète. Une évolution du design system est distincte de la correction du socle métier.

Pour chaque module :

- Connecter les actions à la véritable API.

- Valider les formulaires avant envoi.

- Afficher les états de chargement.

- Désactiver les actions pendant les soumissions appropriées.

- Afficher les erreurs du serveur.

- Présenter des confirmations pour les actions sensibles.

- Empêcher les doubles soumissions.

- Actualiser les données après succès confirmé.

- Préserver le contexte de navigation.

- Respecter les permissions.

- Prévoir un affichage responsive et des zones tactiles adaptées aux terminaux de caisse.

Utilise `BakeryContext` de façon transitoire si nécessaire, mais évite que le même état métier existe durablement dans plusieurs endroits sans stratégie de synchronisation claire.

Centralise les appels réseau.

Tu peux adopter une bibliothèque de gestion de l’état serveur, telle que TanStack Query, si cela simplifie de manière démontrable le cache, le chargement et l’invalidation des données. Évite cependant une migration massive sans valeur mesurable.

## Source de vérité

Pour les données métier, PostgreSQL via l’API est la source de vérité.

Le stockage local ne doit pas permettre à l’application de prétendre qu’une donnée est enregistrée en base alors qu’elle ne l’est pas.

Les données de démonstration et le stockage local doivent être clairement séparés des données réelles.

---

# 11. PHASE 7 — MODE HORS LIGNE ET PWA

Examine et unifie `offlineQueue.ts` et `syncQueue.ts`.

Ne maintiens pas deux mécanismes concurrents sans besoin clairement documenté.

Pour le mode hors ligne :

- Choisis une file de synchronisation unique.

- Persiste les opérations en attente dans un stockage adapté.

- Attribue une clé d’idempotence à chaque opération qui peut être rejouée.

- Préserve l’ordre lorsque cela est nécessaire.

- Évite de stocker des jetons et secrets dans les opérations.

- Affiche les états en attente, synchronisé et en échec.

- Ne supprime pas silencieusement une opération échouée.

- Prévois une inspection et une reprise contrôlée des opérations en échec.

- Assure la traçabilité des conflits.

Ne mets pas en cache les réponses privées de l’API de manière générale.

Limite le cache PWA aux ressources statiques, sauf politique explicite démontrée sûre.

Le mode hors ligne de la caisse ne doit être déclaré fiable qu’après des tests de persistance, de reprise, d’idempotence et de conflit entre appareils.

Si les écritures financières hors ligne ne peuvent pas être garanties, désactive-les proprement ou indique clairement leur limitation au lieu de simuler une synchronisation réussie.

---

# 12. PHASE 8 — SPÉCIFICITÉS DU MARCHÉ IVOIRIEN

L’application doit fonctionner dans un contexte d’exploitation ivoirien sans imposer des hypothèses fiscales ou économiques non vérifiées.

Prévois :

- Devise XOF / FCFA.

- Interface francophone.

- Formats locaux de dates et montants.

- Quantités décimales appropriées pour les matières premières.

- Suivi des prix d’achat en FCFA.

- Modes de paiement pertinents : espèces, Wave, Orange Money et MTN Mobile Money.

- Gestion des ventes au comptant et à crédit.

- Gestion de plusieurs boutiques.

- Fonctionnement adapté aux appareils mobiles utilisés en caisse et en magasin.

Les taux de taxe, règles de facturation, numérotations réglementaires et paramètres fiscaux doivent être configurables et datés lorsque nécessaire.

N’inscris pas un taux fiscal supposé en dur dans le code.

Ne déclare pas l’ERP conforme aux obligations fiscales ivoiriennes sans vérification documentée des règles en vigueur et validation appropriée.

## Intégrations Mobile Money

Distingue clairement :

- Paiement manuel enregistré par un utilisateur autorisé.

- Paiement initié par une véritable API de paiement.

- Paiement en attente.

- Paiement confirmé.

- Paiement échoué.

- Paiement annulé ou remboursé.

Ne marque pas un paiement comme confirmé sur la seule base d’un retour du navigateur.

Pour les webhooks, vérifie la signature suivant la documentation officielle du fournisseur retenu. N’invente pas un algorithme de signature.

Ne considère pas une configuration fictive ou une clé absente comme une intégration de production fonctionnelle.

---

# 13. PHASE 9 — STRATÉGIE DE TESTS

Ajoute des tests automatisés adaptés à l’architecture existante.

Choisis des versions compatibles avec le projet et limite les nouvelles dépendances au strict nécessaire.

Prévois :

- Tests unitaires.

- Tests de services métier.

- Tests d’intégration API.

- Tests SQL sur une base de test.

- Tests de permissions.

- Tests des transactions.

- Tests de régression sur les opérations corrigées.

Ajoute les scripts nécessaires dans `package.json`, notamment pour les tests et le contrôle TypeScript, en conservant les scripts existants utiles.

## Scénarios obligatoires

### Authentification

- Connexion valide.

- Mot de passe incorrect.

- Session expirée.

- Absence de session.

- Compte désactivé.

- Accès interdit par rôle.

- Aucun accès automatique à la démo après erreur.

### Isolation multi-entreprises

- Une entreprise ne voit pas les clients d’une autre.

- Une entreprise ne peut pas modifier ses stocks en utilisant l’identifiant d’une autre.

- Un utilisateur ne peut pas changer son rôle en modifiant le payload.

- Une boutique non autorisée ne peut pas être utilisée par simple modification de requête.

### Ventes

- Vente valide.

- Vente de plusieurs produits.

- Quantité invalide.

- Produit inactif.

- Stock insuffisant.

- Prix modifié frauduleusement dans le navigateur.

- Remise non autorisée.

- Échec SQL avec rollback complet.

- Deux ventes concurrentes portant sur un stock limité.

- Idempotence d’une opération rejouée.

- Numéros de tickets uniques.

### Achats et stocks

- Création d’une commande sans entrée immédiate en stock.

- Réception complète.

- Réception partielle.

- Double réception.

- Achat annulé.

- Paiement fournisseur partiel.

- Ajustement de stock journalisé.

- Impossibilité d’obtenir un stock négatif par une opération normale.

### Recettes et production

- Création d’une recette avec ingrédients.

- Modification et suppression contrôlées.

- Calcul du coût matière.

- Conversion des unités.

- Rendement et quantité produite.

- Consommation réelle des ingrédients.

- Stock insuffisant.

- Prévention des consommations doubles.

- Pertes et stock de produits finis cohérents.

### Persistance

Pour chaque CRUD critique, vérifie :

1. L’opération réussit.

2. La donnée est présente dans PostgreSQL.

3. La page actualisée retrouve cette donnée depuis l’API.

4. Une erreur backend ne produit pas de succès fictif.

5. Un second utilisateur autorisé voit les mêmes données persistées.

Exécute les tests, le contrôle TypeScript et le build de production.

Corrige les échecs introduits ou révélés par les modifications.

Ne masque pas un échec de test pour faire apparaître un résultat positif.

Si un test exige un service externe ou une base indisponible, distingue explicitement le test non exécuté du test réussi.

---

# 14. PHASE 10 — CONFIGURATION ET DÉPLOIEMENT

Vérifie l’intégralité du parcours de démarrage et de déploiement.

Prépare ou corrige :

- `.env.example`, sans secrets réels.

- Les scripts de migration.

- Les scripts de seed.

- Les scripts de test.

- Le build frontend.

- Le démarrage backend.

- Le service de santé.

- La configuration CORS.

- Les variables de production.

- La configuration PWA.

- Les éventuelles tâches de sauvegarde.

Rends les seeds reproductibles : plusieurs exécutions ne doivent pas créer de nouvelles copies des mêmes boutiques, produits, utilisateurs ou recettes.

Assure-toi que les identifiants du seed correspondent aux identifiants utilisés dans les relations métier.

Le démarrage doit échouer clairement si une configuration essentielle manque, plutôt que de se connecter accidentellement à une base de remplacement ou de présenter des données fictives comme des données réelles.

Vérifie l’exposition accidentelle de secrets dans les fichiers suivis par Git.

Si un véritable secret a été exposé, signale la nécessité de sa rotation. Ne le reproduis pas dans les rapports.

---

# 15. CRITÈRES D'ACCEPTATION DE LA VERSION

Le chantier ne peut être considéré comme terminé que si les conditions applicables suivantes sont satisfaites.

## Sécurité

- Aucune session gérant automatique en production.

- Aucun contournement de connexion en production.

- Un système d’authentification cohérent.

- Toutes les routes privées correctement protégées.

- Permissions contrôlées côté serveur.

- Données isolées entre entreprises et boutiques.

- Aucune fuite de secret identifiée dans les fichiers livrés.

## Données et backend

- Les migrations de la base sont documentées.

- Les incompatibilités SQL identifiées sont corrigées.

- Les opérations multi-tables utilisent les transactions appropriées.

- Les données métier sont réellement persistées.

- Les stocks et les mouvements restent cohérents.

- Les opérations échouées ne modifient pas partiellement les données.

- Les seeds sont reproductibles.

## Métier

- Une vente est calculée et confirmée côté serveur.

- Les achats et les réceptions ont des effets distincts.

- La production applique le rendement des recettes.

- Les coûts de revient reposent sur des unités cohérentes.

- Les opérations de trésorerie sont traçables.

- Les dettes clients et fournisseurs sont rapprochables.

- Les annulations et corrections sensibles restent auditables.

## Qualité logicielle

- Les tests pertinents existent et ont été exécutés.

- Le contrôle TypeScript passe.

- Le build de production passe.

- Les régressions découvertes sont corrigées.

- Les erreurs restantes sont listées et expliquées.

- Les étapes de configuration et de lancement sont documentées.

Ne confonds pas la réussite du build avec la preuve que toutes les fonctionnalités métier fonctionnent.

---

# 16. LIVRABLES ATTENDUS

Au terme du chantier, fournis :

1. Le code réellement corrigé et implémenté.

2. Les migrations SQL nécessaires.

3. Les tests ajoutés.

4. Les fichiers de configuration et scripts corrigés.

5. `docs/TECHNICAL_AUDIT.md`.

6. `docs/IMPLEMENTATION_PLAN.md`, actualisé avec l’état réel d’avancement.

7. `docs/DATA_MODEL.md`.

8. `docs/SECURITY.md`.

9. Une documentation de lancement local et de déploiement.

10. Un compte rendu final des corrections.

Le compte rendu doit inclure :

- Fichiers principaux modifiés.

- Défauts critiques corrigés.

- Fonctionnalités implémentées.

- Migrations à appliquer.

- Tests exécutés et résultats réels.

- Résultat du build.

- Variables d’environnement encore nécessaires.

- Limitations restantes.

- Fonctionnalités qui exigent un service externe ou une validation métier.

- Procédure exacte pour démarrer et vérifier l’application.

Utilise les statuts :

- **Terminé et testé**.

- **Implémenté, mais non testé dans l’environnement réel**.

- **Partiellement terminé**.

- **Bloqué**.

- **Non implémenté**.

Ne déclare jamais une fonctionnalité terminée sur la seule base de son existence dans le code.

---

# 17. ORDRE D’EXÉCUTION IMPÉRATIF

Respecte cet ordre :

**Lot 0 — Audit et état initial**

Inventaire, dépendances, état Git, exécution initiale des contrôles et documentation des problèmes.

**Lot 1 — Sécurité P0**

Authentification unique, sessions, permissions et protection des routes.

**Lot 2 — Schéma PostgreSQL**

Migrations, identifiants, colonnes, relations et isolation multi-entreprises.

**Lot 3 — Transactions métier**

Ventes, caisse, achats, réceptions, stocks, recettes, production, crédits et pertes.

**Lot 4 — Fiabilisation du front-end**

Reconnexion des écrans, suppression des succès fictifs, états de chargement et de synchronisation.

**Lot 5 — Fiabilité des coûts et rapports**

Coûts de revient, marges, indicateurs du tableau de bord et cohérence financière.

**Lot 6 — Tests, PWA et préparation de production**

Tests automatisés, seeds, scripts, documentation et contrôles finaux.

À chaque lot :

1. Inspecte le code concerné.

2. Définis les modifications nécessaires.

3. Implémente les changements.

4. Exécute les tests et contrôles disponibles.

5. Corrige les problèmes.

6. Mets à jour le compte rendu.

7. Passe au lot suivant lorsque les critères du lot sont satisfaits ou que les blocages sont précisément documentés.

Ne t’arrête pas après la production du plan.

Ne demande pas systématiquement une confirmation pour les corrections normales et réversibles du code.

Ne lance toutefois aucune migration destructive, opération irréversible sur une base réelle ou mise en production sans autorisation explicite.

---

# INSTRUCTION FINALE

Ton objectif n’est pas de produire une application qui semble terminée lors d’une démonstration.

Ton objectif est de construire un ERP qui supporte les opérations réelles d’une boulangerie :

- Acheter les matières premières.

- Contrôler les prix d’achat.

- Recevoir les marchandises.

- Gérer les stocks.

- Calculer les recettes et les coûts de fabrication.

- Planifier et suivre les fournées.

- Vendre et encaisser.

- Contrôler la trésorerie.

- Gérer les clients professionnels et leurs crédits.

- Mesurer les pertes.

- Analyser les marges.

- Retrouver les opérations passées.

- Protéger les données de chaque entreprise.

Chaque modification doit améliorer de façon vérifiable la sécurité, la fiabilité, la cohérence des données ou l’utilité métier.

**Commence maintenant par le Lot 0, examine réellement le dépôt, puis exécute les lots dans l’ordre. Le plan est le point de départ du travail, pas son résultat final.**

## Comment utiliser ce prompt avec ton agent IA

Je te recommande de le donner à ton agent en étant connecté au dépôt GitHub et en lui laissant modifier les fichiers du projet, plutôt que de lui demander de simplement générer du code dans une conversation.

Consigne pratique à ajouter juste après le Master Prompt :

Message

Tu as accès au dépôt ERP_BOULANGERIE_CI. Travaille directement dans les fichiers existants. Commence par le Lot 0, vérifie les problèmes dans le code et l'état initial du projet, puis implémente réellement les corrections. Continue les lots dans l'ordre sans réécrire inutilement l'application. Exécute les tests disponibles après chaque lot. Ne simule aucun succès, ne touche pas aux données de production sans autorisation et indique précisément les éventuels blocages. À la fin, fournis le bilan des fichiers modifiés, des tests exécutés, du build et des tâches qui restent à faire.

Mon conseil : commence par les lots 0 à 3 avant de consacrer du temps aux animations, à une refonte graphique ou à une migration de framework. Une fois la sécurité, la base Neon et les transactions métier fiabilisées, tu pourras travailler sur l’expérience premium et la commercialisation de l’ERP avec beaucoup moins de risques.
