import React, { useState, useRef } from 'react';
import { useBakery } from '../../context/BakeryContext';
import {
  Settings,
  Store,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Building,
  CheckCircle,
  Wheat,
  Coins,
  FileSpreadsheet,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { api } from '../../services/api';

export const SettingsView: React.FC = () => {
  const {
    stores,
    currentStoreId,
    setCurrentStoreId,
    currency,
    setCurrency,
    company,
    updateCompany,
    resetToDemoData,
    exportBackupJson,
    importBackupJson,
    setNotification,
  } = useBakery();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Champs édités localement puis enregistrés via updateCompany
  const [establishmentName, setEstablishmentName] = useState<string>(company.establishmentName);
  const [legalId, setLegalId] = useState<string>(company.rccm);
  const [taxpayerAccount, setTaxpayerAccount] = useState<string>(company.taxpayerAccount);
  const [defaultVatRate, setDefaultVatRate] = useState<number>(company.defaultVatRate);

  // Dates pour exports comptables
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(false);

  const handleSaveCompany = () => {
    updateCompany({
      establishmentName,
      rccm: legalId,
      taxpayerAccount,
      defaultVatRate,
      currency,
    });
  };

  const handleExportSalesOhada = async () => {
    setIsExporting(true);
    try {
      const url = `/api/reports/accounting/sales-journal?format=csv&startDate=${startDate}&endDate=${endDate}`;
      window.open(url, '_blank');
      setNotification('Journal des ventes OHADA téléchargé avec succès');
    } catch (e) {
      console.error('Erreur export ventes OHADA:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPurchasesOhada = async () => {
    setIsExporting(true);
    try {
      const url = `/api/reports/accounting/purchases-journal?format=csv&startDate=${startDate}&endDate=${endDate}`;
      window.open(url, '_blank');
      setNotification('Journal des achats OHADA téléchargé avec succès');
    } catch (e) {
      console.error('Erreur export achats OHADA:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBootstrapOrganization = async () => {
    if (!confirm('Voulez-vous initialiser le catalogue type de boulangerie (matières premières, produits et fiches recettes DGI) ?')) {
      return;
    }

    setIsBootstrapping(true);
    try {
      await api.post('/api/onboarding/bootstrap', {
        establishmentName: company.establishmentName || 'Boulangerie Artisanale',
      });
      setNotification('Pack de démarrage initialisé avec succès !');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error('Erreur bootstrap:', e);
      setNotification('Échec de l’initialisation du catalogue');
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importBackupJson(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 p-5 md:p-8 space-y-6 overflow-y-auto bg-stone-950 text-stone-100">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-6 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-stone-800 text-stone-300 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-stone-100">Paramètres Généraux & Multi-Boutiques</h1>
            <p className="text-xs text-stone-400">Identité de l'entreprise, devises, points de vente et sauvegardes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Establishment Profile */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
            <Wheat className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm text-stone-100">Identité & Coordonnées Légales</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-stone-300">Enseigne Commerciale :</label>
              <input
                type="text"
                value={establishmentName}
                onChange={(e) => setEstablishmentName(e.target.value)}
                className="w-full mt-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-300">Registre du Commerce (RCCM) :</label>
              <input
                type="text"
                value={legalId}
                onChange={(e) => setLegalId(e.target.value)}
                className="w-full mt-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-300">Compte Contribuable (CC / DGI) :</label>
              <input
                type="text"
                value={taxpayerAccount}
                onChange={(e) => setTaxpayerAccount(e.target.value)}
                className="w-full mt-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-stone-300">Devise Principale :</label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setCurrency('XOF')}
                    className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                      currency === 'XOF'
                        ? 'bg-amber-500 text-stone-950 border-amber-400'
                        : 'bg-stone-950 text-stone-300 border-stone-800'
                    }`}
                  >
                    FCFA (XOF)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('EUR')}
                    className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                      currency === 'EUR'
                        ? 'bg-amber-500 text-stone-950 border-amber-400'
                        : 'bg-stone-950 text-stone-300 border-stone-800'
                    }`}
                  >
                    EUR (€)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-300">Taux TVA Pains/Farines :</label>
                <input
                  type="number"
                  value={defaultVatRate}
                  onChange={(e) => setDefaultVatRate(Number(e.target.value))}
                  className="w-full mt-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold"
                />
                <span className="text-[10px] text-stone-500">Exonération habituelle sur pain brut</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveCompany}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Enregistrer l'identité & les paramètres fiscaux</span>
            </button>
          </div>
        </div>

        {/* Multi-Store Points de Vente */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm text-stone-100">Réseau Multi-Boutiques</h3>
            </div>
            <span className="text-xs text-stone-400 font-bold">{stores.length} points de vente</span>
          </div>

          <div className="space-y-2.5">
            {stores.map((st) => {
              const isSelected = currentStoreId === st.id;

              return (
                <div
                  key={st.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-950/20 border-amber-500/50 shadow-md'
                      : 'bg-stone-950 border-stone-850'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-xs text-stone-100">{st.name}</h4>
                      {st.isMain && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Fournil Principal
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">{st.location}</p>
                    <p className="text-[10px] text-stone-500">Gérant : {st.managerName} • {st.phone}</p>
                  </div>

                  <button
                    onClick={() => setCurrentStoreId(st.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 border-amber-400'
                        : 'bg-stone-800 hover:bg-stone-750 text-stone-300 border-stone-700'
                    }`}
                  >
                    {isSelected ? 'Actif ✓' : 'Sélectionner'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Roles & Permissions Reference */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-sm text-stone-100">Rôles & Permissions de l'Atelier</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950 text-stone-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Fonction</th>
                  <th className="py-2 px-2 text-center">Gérant</th>
                  <th className="py-2 px-2 text-center">Caissier</th>
                  <th className="py-2 px-2 text-center">Boulanger</th>
                  <th className="py-2 px-2 text-center">Magasinier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                <tr>
                  <td className="py-2 px-3 font-semibold text-stone-300">Vente / Caisse POS</td>
                  <td className="text-center text-emerald-400">✅</td>
                  <td className="text-center text-emerald-400">✅</td>
                  <td className="text-center text-stone-600">❌</td>
                  <td className="text-center text-stone-600">❌</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-stone-300">Modifier Prix / Catalogue</td>
                  <td className="text-center text-emerald-400">✅</td>
                  <td className="text-center text-stone-600">❌</td>
                  <td className="text-center text-stone-600">❌</td>
                  <td className="text-center text-stone-600">❌</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-stone-300">Lancer Fournées / Production</td>
                  <td className="text-center text-emerald-400">✅</td>
                  <td className="text-center text-stone-600">❌</td>
                  <td className="text-center text-emerald-400">✅</td>
                  <td className="text-center text-stone-600">❌</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-stone-300">Réception Matières Premières</td>
                  <td className="text-center text-emerald-400">✅</td>
                  <td className="text-center text-stone-600">❌</td>
                  <td className="text-center text-stone-600">❌</td>
                  <td className="text-center text-emerald-400">✅</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-stone-300">Voir Bénéfices & Marges</td>
                  <td className="text-center text-emerald-400">✅</td>
                  <td className="text-center text-stone-600">❌</td>
                  <td className="text-center text-stone-600">❌</td>
                  <td className="text-center text-stone-600">❌</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* OHADA Accounting Exports */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-sm text-stone-100">Exports Comptables OHADA (SYSCOHADA)</h3>
          </div>

          <p className="text-xs text-stone-400 leading-relaxed">
            Générez les journaux normalisés pour votre expert-comptable ou logiciel de comptabilité (Sage 100, Saari, Odoo, Excel).
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-stone-400">Date Début :</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full mt-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-200"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-stone-400">Date Fin :</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full mt-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-200"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleExportSalesOhada}
              disabled={isExporting}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exporter Journal des Ventes (Comptes 701, 4431, 531)</span>
            </button>

            <button
              onClick={handleExportPurchasesOhada}
              disabled={isExporting}
              className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-200 font-bold text-xs flex items-center justify-center gap-2 border border-stone-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Exporter Journal des Achats (Comptes 601, 401)</span>
            </button>
          </div>
        </div>

        {/* Onboarding & Starter Pack */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm text-stone-100">Pack de Démarrage & Initialisation</h3>
            </div>

            <p className="text-xs text-stone-400 mt-3 leading-relaxed">
              Initialisez automatiquement le catalogue de démarrage avec les fiches recettes artisanales (baguettes, croissants, pains au chocolat), les seuils d'alertes de matières premières et les taux de TVA DGI.
            </p>
          </div>

          <button
            onClick={handleBootstrapOrganization}
            disabled={isBootstrapping}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors mt-4"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isBootstrapping ? 'Initialisation en cours...' : 'Initialiser le Catalogue & Recettes Types'}</span>
          </button>
        </div>

        {/* Backup & System Operations */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
              <Download className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm text-stone-100">Sauvegarde & Restauration des Données</h3>
            </div>

            <p className="text-xs text-stone-400 mt-3 leading-relaxed">
              Exportez à tout moment l'ensemble des données de votre boulangerie (produits, fiches recettes, stocks, ventes, créances clients et ordres de fabrication) dans un fichier JSON sécurisé.
            </p>
          </div>

          <div className="space-y-2.5 pt-4">
            <button
              onClick={exportBackupJson}
              className="w-full py-2.5 rounded-xl bg-stone-850 hover:bg-stone-800 border border-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Télécharger Sauvegarde JSON (.json)</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl bg-stone-850 hover:bg-stone-800 border border-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Upload className="w-4 h-4 text-sky-400" />
              <span>Importer / Restaurer depuis Fichier</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Voulez-vous vraiment réinitialiser toutes les données de démonstration ?')) {
                  resetToDemoData();
                }
              }}
              className="w-full py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/60 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Réinitialiser Données Démo Complètes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
