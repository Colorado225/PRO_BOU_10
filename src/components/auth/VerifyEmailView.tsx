import React, { useState, useRef, useEffect } from 'react';
import {
  Wheat,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Mail,
} from 'lucide-react';

interface VerifyEmailViewProps {
  email: string;
  onVerified?: () => void;
  onNavigateToLogin?: () => void;
}

/**
 * Page de vérification d'email par code OTP (6 chiffres).
 */
export const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({
  email,
  onVerified,
  onNavigateToLogin,
}) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown pour le renvoi
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Focus sur le premier champ au chargement
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Uniquement des chiffres

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);

    // Auto-focus sur le champ suivant
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Veuillez saisir le code complet à 6 chiffres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Code de vérification incorrect.');
      }

      setSuccess(true);
      if (onVerified) {
        setTimeout(() => onVerified(), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    setResendMessage(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setResendMessage(data.message);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      setResendMessage('Erreur lors du renvoi du code.');
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center animate-in zoom-in duration-300">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-stone-900">E-mail vérifié !</h2>
          <p className="text-stone-500 text-sm leading-relaxed">
            Votre adresse e-mail a été vérifiée avec succès. Vous allez être redirigé vers votre espace de gestion.
          </p>
          <div className="flex items-center justify-center gap-2 text-amber-600 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Redirection en cours…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans">
      {/* Panneau marketing — Partie gauche */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <img
          src="/bakery-signup.jpg"
          alt="Boulanger artisanal"
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
                Dernière étape
              </span>
              <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight">
                Vérifiez votre<br />
                <span className="text-amber-400">adresse e-mail.</span>
              </h2>
            </div>

            <p className="text-stone-200 text-[15px] leading-relaxed">
              Nous avons envoyé un code de vérification à 6 chiffres à votre adresse e-mail.
              Saisissez-le ci-contre pour activer votre compte professionnel.
            </p>

            <div className="p-5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-white">Code envoyé à :</p>
                  <p className="text-sm text-amber-300">{email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/15">
            <p className="text-sm text-stone-300 italic">
              « La maîtrise au quotidien. La performance dans la durée. »
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
              Saisissez votre code de vérification.
            </h2>
            <p className="mt-2 text-sm text-stone-500 leading-relaxed">
              Un code à 6 chiffres a été envoyé à{' '}
              <strong className="text-stone-700">{email}</strong>
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resendMessage && (
            <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resendMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Champ OTP */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold bg-stone-50 border-2 border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.join('').length !== 6}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
            >
              {isSubmitting ? 'Vérification…' : 'Vérifier mon adresse'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Renvoi du code */}
          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-stone-500">
              Vous n'avez pas reçu le code ?
            </p>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className="text-sm font-bold text-amber-600 hover:text-amber-700 disabled:text-stone-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 mx-auto"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Envoi en cours…
                </>
              ) : countdown > 0 ? (
                `Renvoyer dans ${countdown}s`
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Renvoyer un nouveau code
                </>
              )}
            </button>
          </div>

          {/* Lien retour */}
          <div className="mt-8 text-center">
            <p className="text-sm text-stone-500">
              Ce n'est pas la bonne adresse ?{' '}
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
