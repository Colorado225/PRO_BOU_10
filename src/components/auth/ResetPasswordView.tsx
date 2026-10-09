import React, { useState } from 'react';
import {
  Wheat,
  Lock,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface ResetPasswordViewProps {
  token: string | null;
  onResetComplete?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToForgot?: () => void;
}

/**
 * Page de réinitialisation de mot de passe (avec token dans l'URL).
 */
export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  token,
  onResetComplete,
  onNavigateToLogin,
  onNavigateToForgot,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isPasswordValid = password.length >= 8;
  const isMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = isPasswordValid && isMatch && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue.');
      }

      setSuccess(true);
      if (onResetComplete) {
        setTimeout(() => onResetComplete(), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-stone-900">Lien invalide</h2>
          <p className="text-stone-500 text-sm leading-relaxed">
            Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.
          </p>
          <button
            onClick={onNavigateToForgot}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all hover:from-amber-600 hover:to-amber-700"
          >
            Demander un nouveau lien
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center animate-in zoom-in duration-300">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-stone-900">
            Mot de passe réinitialisé !
          </h2>
          <p className="text-stone-500 text-sm leading-relaxed">
            Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers votre espace de gestion.
          </p>
          <button
            onClick={onNavigateToLogin}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all hover:from-amber-600 hover:to-amber-700"
          >
            Se connecter maintenant
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans">
      {/* Panneau marketing — Partie gauche */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <img
          src="/bakery-hero.jpg"
          alt="Boulangerie artisanale"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950/85 via-stone-900/75 to-stone-950/90" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Wheat className="w-6 h-6 text-white stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">
                Boulangerie<span className="text-amber-400">Pro</span>
              </h1>
              <p className="text-[10px] text-stone-300 font-medium tracking-wider uppercase">
                ERP Boulangerie
              </p>
            </div>
          </div>

          <div className="max-w-lg space-y-8">
            <div className="space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold uppercase tracking-widest">
                Nouveau mot de passe
              </span>
              <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight">
                Créez un mot de passe<br />
                <span className="text-amber-400">sécurisé.</span>
              </h2>
            </div>

            <p className="text-stone-200 text-[15px] leading-relaxed">
              Choisissez un mot de passe robuste pour protéger votre espace de gestion.
              Un bon mot de passe contient au moins 8 caractères et mélange lettres, chiffres et symboles.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <p className="text-sm text-stone-200 pt-1.5">
                  Minimum <strong className="text-white">8 caractères</strong> requis.
                </p>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <p className="text-sm text-stone-200 pt-1.5">
                  Toutes vos <strong className="text-white">sessions actives seront déconnectées</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/15">
            <p className="text-sm text-stone-300 italic">
              « La sécurité de votre compte est notre priorité. »
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire — Partie droite */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 sm:px-10 lg:px-16 bg-white">
        <div className="w-full max-w-[420px]">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Wheat className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <span className="text-lg font-black tracking-tight text-stone-900">
              Boulangerie<span className="text-amber-600">Pro</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              Nouveau mot de passe
            </h2>
            <p className="mt-2 text-sm text-stone-500 leading-relaxed">
              Choisissez un mot de passe sécurisé pour votre compte.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nouveau mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Créez un mot de passe sécurisé"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-11 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && !isPasswordValid && (
                <p className="mt-1.5 text-xs text-amber-600">
                  Le mot de passe doit contenir au moins 8 caractères.
                </p>
              )}
              {isPasswordValid && (
                <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Mot de passe valide
                </p>
              )}
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Saisissez à nouveau votre mot de passe"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-11 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !isMatch && (
                <p className="mt-1.5 text-xs text-red-500">
                  Les mots de passe ne correspondent pas.
                </p>
              )}
              {isMatch && (
                <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Les mots de passe correspondent
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
            >
              {isSubmitting ? 'Réinitialisation…' : 'Réinitialiser mon mot de passe'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Lien retour */}
          <div className="mt-8 text-center">
            <p className="text-sm text-stone-500">
              Vous vous souvenez de votre mot de passe ?{' '}
              <button
                onClick={onNavigateToLogin}
                className="font-bold text-amber-600 hover:text-amber-700 transition-colors"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
