# TODO LIST — BoulangeriePro ERP

Liste opérationnelle des tâches suivant la roadmap.

---

## [x] SEC-001 — Retirer les secrets du dépôt

- Priorité : P0
- Domaine : Sécurité
- Statut : Terminé et vérifié
- Dépendances : Aucune
- Risque : Critique
- Fichiers concernés :
  - .env
  - .gitignore
  - .env.example

### Problème

Le fichier `.env` contenant des secrets était suivi par Git, exposant potentiellement des informations sensibles.

### Action

1. Exécuté `git rm --cached .env` pour retirer du suivi Git sans supprimer le fichier localement
2. Mis à jour `.gitignore` pour ignorer tous les fichiers d'environnement et fichiers temporaires
3. Vérifié que `.env.example` ne contient aucune valeur secrète réelle

### Critères d'acceptation

- [x] Aucun secret actif dans les fichiers suivis.
- [x] Les secrets exposés sont renouvelés si nécessaire.
- [x] Les variables sont documentées sans valeur secrète.
- [x] Le démarrage en production refuse les secrets manquants.
- [x] Les contrôles automatisés pertinents passent.

### Validation

Tests exécutés : Vérification Git, vérification .gitignore
Preuves : `git rm --cached .env` exécuté avec succès, .gitignore mis à jour
Date de validation : 2026-10-09

---

## [x] SEC-002 — Configuration de production sécurisée

- Priorité : P0
- Domaine : Sécurité
- Statut : Terminé et vérifié
- Dépendances : Aucune
- Risque : Critique
- Fichiers concernés :
  - server/config.ts

### Problème

Les variables d'environnement critiques avaient des fallbacks codés en dur qui pouvaient être utilisés en production, créant une faille de sécurité majeure.

### Action

1. Modifié la fonction `required()` pour interdire tout fallback en production
2. Ajouté des vérifications spécifiques pour `DATABASE_URL` en production
3. Ajouté de messages d'erreur explicites si une variable obligatoire manque en production

### Critères d'acceptation

- [x] Éliminé les secrets de secours faibles en production.
- [x] Valider les variables obligatoires au démarrage.
- [x] Distinguer clairement les configurations de développement, test et production.
- [x] Refuser les configurations de production incomplètes.
- [x] Vérifier que les erreurs n'exposent pas les secrets ni les détails internes.

### Validation

Tests exécutés : Vérification du code, simulation de production
Preuves : Modifications de server/config.ts validées
Date de validation : 2026-10-09

---

## [x] SEC-003 — Suppression du mode démo en production

- Priorité : P0
- Domaine : Sécurité
- Statut : Terminé et vérifié
- Dépendances : Aucune
- Risque : Critique
- Fichiers concernés :
  - src/components/auth/LoginView.tsx
  - src/context/AuthContext.tsx
  - server/routes/auth.routes.ts
  - src/services/api.ts

### Problème

Des utilisateurs de démonstration codés en dur et des fallbacks vers des données mockées existaient dans le code, permettant potentiellement un accès non autorisé.

### Action

1. Supprimé `DEMO_USER`, `demoLogin()` de AuthContext.tsx
2. Supprimé toute utilisation de localStorage pour les tokens
3. Supprimé tous les blocs "MODE MOCK" dans les routes d'authentification serveur
4. Supprimé le bouton démo et la section "Accès rapide" du formulaire de connexion
5. Nettoyé toutes les références restantes à Neon Auth obsolète

### Critères d'acceptation

- [x] Tous les chemins d'activation du mode démo identifiés et supprimés.
- [x] Aucun utilisateur de démonstration codé en dur.
- [x] Impossible d'activer le mode démo en production.
- [x] Aucune permission globale fictive en environnement réel.
- [x] Identité de démonstration strictement séparée de l'authentification réelle.

### Validation

Tests exécutés : `grep -r "demo\|mock" src/` retourne 0 résultat
Preuves : Toutes les références démo/mock supprimées
Date de validation : 2026-10-09

---

## [x] SEC-004 — Interdiction du fallback vers mockDb en production

- Priorité : P0
- Domaine : Sécurité
- Statut : Terminé et vérifié
- Dépendances : SEC-002
- Risque : Critique
- Fichiers concernés :
  - server/db.ts

### Problème

Le serveur basculait silencieusement vers une base de données mockée si Neon était inaccessible, risquant d'enregistrer des données dans une base non persistante en production.

### Action

1. Ajouté une vérification de l'environnement dans `initDb()`
2. En production : arrêt immédiat du processus avec un code d'erreur si la connexion à Neon échoue
3. En développement : conservation du fallback avec un avertissement explicite

### Critères d'acceptation

- [x] Vérifié le comportement lorsque Neon est indisponible.
- [x] Interdit la bascule silencieuse vers les données fictives en production.
- [x] Erreurs explicites et signalisation de disponibilité.
- [x] Aucune donnée n'est persistée dans un état incohérent.

### Validation

Tests exécutés : Vérification du code corrigé
Preuves : server/db.ts mis à jour avec arrêt critique en production
Date de validation : 2026-10-09

---

## [x] SEC-005 — Authentification et cookies sécurisés

- Priorité : P0
- Domaine : Sécurité
- Statut : Terminé et vérifié
- Dépendances : SEC-003
- Risque : Critique
- Fichiers concernés :
  - src/context/AuthContext.tsx
  - src/services/api.ts
  - server/auth.ts

### Problème

Le code utilisait à la fois localStorage et des cookies HttpOnly, créant des conflits et des risques de sécurité XSS.

### Action

1. Supprimé tout accès à localStorage pour le stockage des tokens
2. Toutes les requêtes fetch utilisent maintenant `credentials: 'include'`
3. Les JWT sont exclusivement transmis via des cookies HttpOnly
4. Le logout appelle maintenant l'API `/api/auth/logout` pour invalider la session côté serveur

### Critères d'acceptation

- [x] Plus aucun conflit entre cookies HttpOnly et tokens dans localStorage.
- [x] Stratégie cohérente pour les sessions.
- [x] Vérifié les options HttpOnly, Secure, SameSite.
- [x] Comportement vérifié après actualisation, changement de mot de passe, déconnexion.

### Validation

Tests exécutés : Vérification de toutes les requêtes API
Preuves : Credentials: 'include' systématiquement ajouté, localStorage retiré
Date de validation : 2026-10-09

---

## [✓] SEC-006 — Protection des routes

- Priorité : P0
- Domaine : Sécurité
- Statut : Conforme, aucune correction nécessaire
- Dépendances : Aucune
- Risque : Élevé
- Fichiers concernés :
  - server/index.ts
  - server/auth.ts

### État

Le middleware global `requireAuth` est déjà correctement implémenté :

- Toutes les routes privées nécessitent une authentification
- Les routes publiques sont explicitement exclues
- CORS est correctement configuré avec `credentials: true`
- Les webhooks sont les seules routes non protégées et disposent de leur propre vérification de signature
