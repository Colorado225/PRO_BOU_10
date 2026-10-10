import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SignUp } from '@clerk/clerk-react';
import {
  Wheat,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  Phone,
  Building2,
  MapPin,
  Store,
  ChefHat,
  Calculator,
  Package,
  Wallet,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface SignUpViewProps {
  onNavigateToLogin?: () => void;
  onRegistered?: (email: string) => void;
}

/** Options de type d'établissement. */
const ETABLISSEMENT_TYPES = [
  'Boulangerie artisanale',
  'Boulangerie-pâtisserie',
  'Boulangerie industrielle',
  'Pâtisserie',
  'Autre établissement de production boulangère',
];

/** Options de nombre de points de vente. */
const POINTS_DE_VENTE = [
  '1 point de vente',
  '2 à 3 points de vente',
  '4 à 10 points de vente',
  'Plus de 10 points de vente',
];

/**
 * Page d'inscription — Design premium.
 *
 * Layout split-screen : panneau marketing à gauche, formulaire multi-étapes à droite.
 * Étape 1 : informations du compte (nom, email, téléphone, mot de passe).
 * Étape 2 : informations de l'établissement (nom, type, ville, points de vente).
 */
export const SignUpView: React.FC<SignUpViewProps> = ({ onNavigateToLogin, onRegistered }) => {
  const { isClerkEnabled } = useAuth();
  const [useClerkView, setUseClerkView] = useState<boolean>(isClerkEnabled);
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Étape 1 — Votre compte
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Étape 2 — Votre établissement
  const [bakeryName, setBakeryName] = useState('');
  const [establishmentType, setEstablishmentType] = useState('');
  const [city, setCity] = useState('');
  const [pointsOfSale, setPointsOfSale] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const isStep1Valid = fullName.trim() && email.trim() && phone.trim() && password.length >= 8 && password === confirmPassword;
  const isStep2Valid = bakeryName.trim() && establishmentType && city.trim() && pointsOfSale && acceptTerms;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep1Valid) return;
    setStep(2);
    setError(null);
  };

  const handlePrevStep = () => {
    setStep(1);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep2Valid) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: fullName,
          email,
          phone,
          password,
          bakeryName,
          establishmentType,
          city,
          pointsOfSale,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Erreur serveur.' }));
        throw new Error(data.error || `Erreur ${response.status}`);
      }

      // Rediriger vers la vérification d'email si le callback est fourni
      if (onRegistered) {
        onRegistered(email);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ═══════════════════════════════════════
  // ÉCRAN DE SUCCÈS
  // ═══════════════════════════════════════
  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-stone-900">Votre compte a été créé.</h2>
          <p className="text-stone-500 text-sm leading-relaxed">
            Suivez les prochaines étapes pour configurer votre espace de gestion.
          </p>
          <button
            onClick={onNavigateToLogin}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all hover:from-amber-600 hover:to-amber-700"
          >
            Se connecter à mon espace
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans">
      {/* ═══════════════════════════════════════════════════════════
          PANNEAU MARKETING — PARTIE GAUCHE
      ═══════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Image de fond — boulanger au travail */}
        <img
          src="/bakery-signup.jpg"
          alt="Boulanger artisanal au travail"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay dégradé sombre pour la lisibilité du texte */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950/85 via-stone-900/75 to-stone-950/90" />

        {/* Halo doré subtil */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-stone-950/50 to-transparent" />

        {/* Contenu marketing */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
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

          {/* Corps du texte marketing */}
          <div className="max-w-lg space-y-8">
            {/* Surtitre */}
            <div className="space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold uppercase tracking-widest">
                Passez à une gestion plus maîtrisée
              </span>
              <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight">
                Votre savoir-faire mérite<br />
                <span className="text-amber-400">une gestion à sa hauteur.</span>
              </h2>
            </div>

            <p className="text-stone-200 text-[15px] leading-relaxed">
              Une bonne boulangerie ne se résume pas à la qualité de son pain. Elle repose aussi sur
              des achats bien maîtrisés, une production organisée, des stocks suivis et des décisions
              financières éclairées.
            </p>
            <p className="text-stone-300 text-sm leading-relaxed">
              Centralisez les informations essentielles de votre établissement dans un seul espace et
              construisez une gestion plus structurée, plus lisible et mieux maîtrisée.
            </p>

            {/* Ce que vous pourrez piloter */}
            <div className="space-y-5">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <Calculator className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Vos coûts de production</h3>
                  <p className="text-sm text-stone-300 mt-0.5">
                    Comprenez le coût de vos recettes et évaluez la rentabilité de vos produits.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Vos stocks et approvisionnements</h3>
                  <p className="text-sm text-stone-300 mt-0.5">
                    Suivez vos matières premières, vos mouvements de stock et vos besoins d'achat.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Vos ventes et votre trésorerie</h3>
                  <p className="text-sm text-stone-300 mt-0.5">
                    Regroupez vos opérations pour mieux comprendre vos encaissements, vos dépenses et vos résultats.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="pt-6 border-t border-white/15">
            <p className="text-sm text-stone-300 italic">
              « Moins d'incertitude dans la gestion. Plus de visibilité dans vos décisions. »
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          FORMULAIRE D'INSCRIPTION — PARTIE DROITE
      ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 sm:px-10 lg:px-16 bg-white overflow-y-auto">
        <div className="w-full max-w-[480px]">
          {/* Logo mobile + retour */}
          <div className="lg:hidden flex items-center gap-2.5 mb-6 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Wheat className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <span className="text-lg font-black tracking-tight text-stone-900">
              Boulangerie<span className="text-amber-600">Pro</span>
            </span>
          </div>

          {isClerkEnabled && (
            <div className="mb-5">
              <button
                type="button"
                onClick={() => setUseClerkView(!useClerkView)}
                className="w-full py-2.5 px-4 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <span>{useClerkView ? 'Passer au formulaire classique' : '🔒 Créer un compte avec Clerk SSO / Email'}</span>
              </button>
            </div>
          )}

          {isClerkEnabled && useClerkView ? (
            <div className="flex justify-center my-4">
              <SignUp routing="hash" />
            </div>
          ) : (
            <>
              {/* Indicateur d'étapes */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-500'}`}>
                    {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                  </div>
                  <span className={`text-xs font-semibold ${step === 1 ? 'text-stone-900' : 'text-stone-400'}`}>Votre compte</span>
                </div>
                <div className={`flex-1 h-px ${step >= 2 ? 'bg-amber-400' : 'bg-stone-200'} transition-colors`} />
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-500'}`}>
                    2
                  </div>
                  <span className={`text-xs font-semibold ${step === 2 ? 'text-stone-900' : 'text-stone-400'}`}>Votre établissement</span>
                </div>
              </div>

              {/* Messages d'erreur */}
              {error && (
                <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* ════════════ ÉTAPE 1 : VOTRE COMPTE ════════════ */}
              {step === 1 && (
                <form onSubmit={handleNextStep} className="space-y-5">
              <div className="mb-2">
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  Créez votre espace professionnel.
                </h2>
                <p className="mt-2 text-sm text-stone-500 leading-relaxed">
                  Quelques informations suffisent pour commencer à configurer l'espace de gestion de votre boulangerie.
                </p>
              </div>

              {/* Nom complet */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Nom complet</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Votre nom et prénom"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Adresse e-mail */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Adresse e-mail professionnelle</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@votreboulangerie.com"
                    autoComplete="email"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Numéro de téléphone */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Numéro de téléphone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex. : +225 07 00 00 00 00"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Créez un mot de passe sécurisé"
                    autoComplete="new-password"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-11 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
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
                {password.length > 0 && password.length < 8 && (
                  <p className="mt-1.5 text-xs text-amber-600">Choisissez un mot de passe plus robuste pour mieux protéger votre compte.</p>
                )}
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Confirmation du mot de passe</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Saisissez à nouveau votre mot de passe"
                    autoComplete="new-password"
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
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-500">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              {/* Bouton suivant */}
              <button
                type="submit"
                disabled={!isStep1Valid}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
              >
                Continuer
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Texte sous le bouton */}
              <p className="text-center text-xs text-stone-400">
                Commencez par créer votre compte. Vous pourrez ensuite configurer les informations de votre établissement.
              </p>
            </form>
          )}

          {/* ════════════ ÉTAPE 2 : VOTRE ÉTABLISSEMENT ════════════ */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="mb-2">
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  Votre établissement
                </h2>
                <p className="mt-2 text-sm text-stone-500 leading-relaxed">
                  Ces informations permettent de personnaliser votre espace de gestion.
                </p>
              </div>

              {/* Nom de la boulangerie */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Nom de la boulangerie</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={bakeryName}
                    onChange={(e) => setBakeryName(e.target.value)}
                    placeholder="Ex. : Boulangerie Le Fournil"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Type d'établissement */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Type d'établissement</label>
                <div className="relative">
                  <ChefHat className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <select
                    value={establishmentType}
                    onChange={(e) => setEstablishmentType(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  >
                    <option value="">Sélectionnez le type d'établissement</option>
                    {ETABLISSEMENT_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ville */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Ville</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex. : Abidjan"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Nombre de points de vente */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Nombre de points de vente</label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <select
                    value={pointsOfSale}
                    onChange={(e) => setPointsOfSale(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  >
                    <option value="">Sélectionnez une option</option>
                    {POINTS_DE_VENTE.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Consentement */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500/30 cursor-pointer"
                />
                <span className="text-sm text-stone-500 leading-relaxed">
                  J'accepte les <button type="button" className="text-amber-600 font-semibold hover:underline">Conditions d'utilisation</button> et j'ai pris connaissance de la <button type="button" className="text-amber-600 font-semibold hover:underline">Politique de confidentialité</button>.
                </span>
              </label>

              {/* Boutons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-3.5 rounded-xl border-2 border-stone-200 hover:border-stone-300 text-stone-600 font-bold text-sm transition-all flex items-center gap-2 active:scale-[0.98]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={!isStep2Valid || isSubmitting}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
                >
                  {isSubmitting ? 'Création en cours…' : 'Créer mon espace professionnel'}
                </button>
              </div>

              {/* Mention de réassurance */}
              <div className="flex items-center justify-center gap-2 text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <p className="text-[11px] text-center">
                  Vos informations servent à configurer votre espace professionnel. Leur traitement est encadré par notre Politique de confidentialité.
                </p>
              </div>
            </form>
          )}
          </>
          )}

          {/* Lien secondaire */}
          <div className="mt-8 text-center">
            <p className="text-sm text-stone-500">
              Vous avez déjà un compte ?{' '}
              <button
                onClick={onNavigateToLogin}
                className="font-bold text-amber-600 hover:text-amber-700 transition-colors"
              >
                Se connecter
              </button>
            </p>
          </div>

          {/* Assistance */}
          <div className="mt-6 text-center">
            <p className="text-xs text-stone-400">
              Une question concernant votre accès ?{' '}
              <button className="text-amber-600 hover:underline font-medium">
                Contactez notre équipe d'assistance.
              </button>
            </p>
          </div>
        </div>

        {/* Pied de page */}
        <div className="mt-8 text-center">
          <p className="text-xs text-stone-400">
            © BoulangeriePro. Tous droits réservés.
          </p>
          <div className="flex items-center justify-center gap-3 mt-1.5 text-[11px] text-stone-400">
            <button className="hover:text-amber-600 transition-colors">Confidentialité</button>
            <span className="text-stone-300">·</span>
            <button className="hover:text-amber-600 transition-colors">Conditions d'utilisation</button>
            <span className="text-stone-300">·</span>
            <button className="hover:text-amber-600 transition-colors">Assistance</button>
          </div>
        </div>
      </div>
    </div>
  );
};
