-- Migration 004 : Authentification avancée (compatible Neon Auth)
-- Ajoute la vérification d'email, la réinitialisation de mot de passe,
-- et les tokens de session sécurisés

-- Colonne de vérification d'email
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Tokens de réinitialisation de mot de passe
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;

-- Tokens de vérification d'email (OTP)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ;

-- Dernière connexion (pour audit)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Compteur de tentatives de connexion échouées (protection brute-force)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Colonne updated_at
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Index pour les recherches par token (réinitialisation, vérification)
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token
  ON users (password_reset_token) WHERE password_reset_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_email_verification_token
  ON users (email_verification_token) WHERE email_verification_token IS NOT NULL;

-- Index pour la recherche par email (connexion)
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Index pour l'audit (dernière connexion)
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users (last_login_at DESC);
