-- Migration 003 : Ajout des champs pour l'inscription
-- Ajoute les informations de contact et d'établissement à la table users

-- Ajouter les colonnes pour les informations de registration
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS bakery_name TEXT,
  ADD COLUMN IF NOT EXISTS establishment_type TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS points_of_sale TEXT;

-- Ajouter une colonne is_active si elle n'existe pas (pour compatibilité)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Ajouter une colonne created_at si elle n'existe pas
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
