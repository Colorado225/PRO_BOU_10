import React, { useState } from 'react';
import {
  Wheat,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

interface ForgotPasswordViewProps {
  onNavigateToLogin?: () => void;
  onNavigateToReset?: (email: string) => void;
}

/**
 * Page de demande de réinitialisation de mot de passe.
 * Design premium cohérent avec les pages Login/SignUp.
 */
export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({
  onNavigateToLogin,
  onNavigateToReset,
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue.');
      }

      setIsSubmitted(true);
      if (onNavigateToReset) {
        onNavigateToReset(email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-stone-950/50 to-transparent" />

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
                Récupération de compte
              </span>
              <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight">
                Pas d'inquiétude.<br />
                <span className="text-amber-400">Nous sommes là pour vous aider.</span>
              </h2>
            </div>

            <p className="text-stone-200 text-[15px] leading-relaxed">
              Indiquez l'adresse e-mail associée à votre compte pour recevoir les instructions
              de réinitialisation de votre mot de passe.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <p className="text-sm text-stone-200 pt-1.5">
                  Le lien de réinitialisation est valable <strong className="text-white">1 heure</strong>.
                </p>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <p className="text-sm text-stone-200 pt-1.5">
                  Vos données sont <strong className="text-white">chiffrées et protégées</strong> à chaque étape.
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

          {/* Retour */}
          <button
            onClick={onNavigateToLogin}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-amber-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </button>

          {isSubmitted ? (
            /* État : Email envoyé */
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  E-mail envoyé !
                </h2>
                <p className="mt-3 text-sm text-stone-500 leading-relaxed">
                  Si un compte correspond à l'adresse <strong className="text-stone-700">{email}</strong>,
                  vous recevrez un message contenant les instructions de réinitialisation.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-800">
                  <strong>💡 Conseil :</strong> Vérifiez votre dossier spam/courrier indésirable si vous
                  ne voyez pas l'e-mail dans les prochaines minutes.
                </p>
              </div>
              <button
                onClick={onNavigateToLogin}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98]"
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
            /* Formulaire */
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  Mot de passe oublié ?
                </h2>
                <p className="mt-2 text-sm text-stone-500 leading-relaxed">
                  Pas d'inquiétude. Indiquez l'adresse e-mail associée à votre compte pour recevoir
                  les instructions de réinitialisation.
                </p>
              </div>

              {error && (
                <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                    Adresse e-mail professionnelle
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@votreboulangerie.com"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
                >
                  {isSubmitting ? 'Envoi en cours…' : 'Envoyer les instructions'}
                </button>
              </form>
            </>
          )}

          {/* Assistance */}
          <div className="mt-8 text-center">
            <p className="text-xs text-stone-400">
              Une question concernant votre accès ?{' '}
              <button className="text-amber-600 hover:underline font-medium">
                Contactez notre équipe d'assistance.
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
