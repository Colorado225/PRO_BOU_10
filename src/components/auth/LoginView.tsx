import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Wheat,
  Lock,
  Mail,
  AlertCircle,
  LogIn,
  Eye,
  EyeOff,
  ShieldCheck,
  BarChart3,
  Package,
  TrendingUp,
} from 'lucide-react';

interface LoginViewProps {
  onNavigateToSignUp?: () => void;
  onNavigateToForgotPassword?: () => void;
}

/**
 * Page de connexion — utilise AuthContext.login() qui met à jour l'état user directement.
 */
export const LoginView: React.FC<LoginViewProps> = ({ onNavigateToSignUp, onNavigateToForgotPassword }) => {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await login(loginEmail, loginPassword);
      // AuthContext.login() sets user state → AppContent re-renders → shows dashboard
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    doLogin(email, password);
  };

  const demoAccounts = [
    { role: 'Gérant', email: 'gerant@boulangeriepro.ci', password: 'gerant123', color: 'bg-amber-100 text-amber-800' },
    { role: 'Caissier', email: 'caissier@boulangeriepro.ci', password: 'caisse123', color: 'bg-emerald-100 text-emerald-800' },
    { role: 'Boulanger', email: 'boulanger@boulangeriepro.ci', password: 'fournil123', color: 'bg-orange-100 text-orange-800' },
    { role: 'Magasinier', email: 'magasinier@boulangeriepro.ci', password: 'stock123', color: 'bg-sky-100 text-sky-800' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans">
      {/* PANNEAU MARKETING — GAUCHE */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950" />
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
              <p className="text-[10px] text-stone-300 font-medium tracking-wider uppercase">ERP Boulangerie</p>
            </div>
          </div>

          <div className="max-w-lg space-y-8">
            <div className="space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold uppercase tracking-widest">
                Votre boulangerie. Votre performance.
              </span>
              <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight">
                Pilotez votre activité.<br />
                <span className="text-amber-400">Maîtrisez vos résultats.</span>
              </h2>
            </div>
            <p className="text-stone-200 text-[15px] leading-relaxed">
              Centralisez vos ventes, surveillez vos stocks, maîtrisez vos coûts de production et prenez vos décisions sur la base de données fiables.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-sm text-stone-200 pt-1.5">Vision claire de vos <strong className="text-white">ventes</strong> et <strong className="text-white">encaissements</strong>.</p>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-sm text-stone-200 pt-1.5">Contrôle de vos <strong className="text-white">stocks</strong> et <strong className="text-white">matières premières</strong>.</p>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-sm text-stone-200 pt-1.5">Maîtrise des <strong className="text-white">coûts de production</strong> et des <strong className="text-white">marges</strong>.</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/15">
            <p className="text-sm text-stone-300 italic">« La maîtrise au quotidien. La performance dans la durée. »</p>
          </div>
        </div>
      </div>

      {/* FORMULAIRE — DROITE */}
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
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">Ravi de vous retrouver.</h2>
            <p className="mt-2 text-sm text-stone-500 leading-relaxed">Connectez-vous pour reprendre le contrôle de votre activité.</p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ═══ BOUTON DÉMO — ACCÈS DIRECT ═══ */}
          <button
            type="button"
            onClick={demoLogin}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] mb-5"
          >
            🚀 Accéder au dashboard (démo)
          </button>

          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400 font-medium">ou connectez-vous</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Adresse e-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@votreboulangerie.com"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Saisissez votre mot de passe"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-11 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div></div>
              <button type="button" onClick={onNavigateToForgotPassword} className="text-sm font-semibold text-amber-600 hover:text-amber-700">
                Mot de passe oublié ?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Connexion en cours…' : 'Se connecter'}</span>
            </button>
          </form>

          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400 font-medium">Vous découvrez notre solution ?</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <button
            type="button"
            onClick={onNavigateToSignUp}
            className="w-full py-3 rounded-xl border-2 border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 text-stone-700 font-bold text-sm tracking-wide transition-all active:scale-[0.98]"
          >
            Créer mon compte
          </button>

          {/* Accès rapide démo */}
          <div className="mt-8 p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">Accès rapide — démonstration</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => doLogin(acc.email, acc.password)}
                  disabled={isLoading}
                  className="px-3 py-2.5 rounded-xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-sm text-left transition-all disabled:opacity-50"
                >
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${acc.color} mb-1`}>
                    {acc.role}
                  </span>
                  <span className="block text-[10px] text-stone-400 truncate">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <p className="text-[11px] text-center">Vos accès sont personnels. La protection de vos données est au cœur de notre démarche.</p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs text-stone-400">© BoulangeriePro. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
};
