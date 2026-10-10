import React from 'react';
import { Sale, Customer } from '../../types/bakery';
import { useBakery } from '../../context/BakeryContext';
import { X, Printer, FileText, Building2, ShieldCheck, Download } from 'lucide-react';
import { numberToWordsFCFA } from '../../services/invoiceService';

interface B2BInvoiceModalProps {
  sale: Sale;
  customer?: Customer;
  onClose: () => void;
}

export const B2BInvoiceModal: React.FC<B2BInvoiceModalProps> = ({
  sale,
  customer,
  onClose,
}) => {
  const { company, stores, formatMoney } = useBakery();
  const currentStore = stores.find((s) => s.id === sale.storeId) || stores[0];

  const handlePrint = () => {
    window.print();
  };

  const netHT = sale.total - sale.vatAmount;
  const wordsAmount = numberToWordsFCFA(sale.total);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col my-8">
        {/* Top Header Controls (Hidden on Print) */}
        <div className="px-6 py-4 bg-stone-800 border-b border-stone-700 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100">Facture Proforma / Définitive B2B</h3>
              <p className="text-xs text-stone-400">Réf : {sale.receiptNumber} — Conforme DGI Côte d'Ivoire</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors shadow-lg"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / Exporter PDF (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-700/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable A4 Container */}
        <div className="p-8 bg-stone-950 flex justify-center overflow-x-auto print:p-0 print:bg-white">
          <div
            id="printable-b2b-invoice"
            className="w-full max-w-[210mm] bg-white text-stone-900 p-10 rounded-xl shadow-xl font-sans text-xs leading-relaxed print:shadow-none print:p-8 print:w-full print:max-w-none"
          >
            {/* Header: Company & DGI Identifiers */}
            <div className="flex justify-between items-start border-b-2 border-stone-900 pb-6 mb-6">
              <div className="space-y-1 max-w-[50%]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-amber-600 print:text-black" />
                  <h1 className="text-xl font-black text-stone-900 tracking-tight">
                    {company.establishmentName || "BOULANGERIE PRO SARL"}
                  </h1>
                </div>
                <p className="text-stone-600 font-medium">{currentStore?.name} — {currentStore?.location}</p>
                <p className="text-stone-600">Tél : {currentStore?.phone || "+225 07 00 00 00 00"}</p>
                <div className="pt-2 text-[11px] font-mono text-stone-700 space-y-0.5">
                  <p><span className="font-bold">RCCM :</span> {company.rccm || "CI-ABJ-2024-B-1234"}</p>
                  <p><span className="font-bold">N° CC (Compte Contribuable) :</span> {company.taxpayerAccount || "0001234567"}</p>
                  <p><span className="font-bold">Régime Fiscal :</span> Réel Normal — DGI Côte d'Ivoire</p>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-900 font-black text-sm uppercase rounded border border-amber-500/30">
                  FACTURE COMMERCIALE
                </span>
                <p className="font-mono text-sm font-bold text-stone-900 pt-1">
                  N° : {sale.receiptNumber}
                </p>
                <p className="text-stone-600">
                  <span className="font-semibold">Date d'émission :</span> {new Date(sale.date).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-stone-600">
                  <span className="font-semibold">Heure :</span> {new Date(sale.date).toLocaleTimeString('fr-FR')}
                </p>
                <p className="text-stone-600">
                  <span className="font-semibold">Règlement :</span> {sale.paymentMethod.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Client Information */}
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-6 flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">FACTURÉ À :</p>
                <p className="text-sm font-black text-stone-900">{customer?.name || sale.customerName || "CLIENT PROFESSIONNEL"}</p>
                <p className="text-stone-600">{customer?.address || "Abidjan, Côte d'Ivoire"}</p>
                <p className="text-stone-600">Contact : {customer?.phone || "Non renseigné"}</p>
              </div>
              {customer?.taxNumber && (
                <div className="text-right font-mono text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">IDENTIFICATION CLIENT :</p>
                  <p><span className="font-bold">N° CC Client :</span> {customer.taxNumber}</p>
                  <p><span className="font-bold">Type Client :</span> {customer.type.toUpperCase()}</p>
                </div>
              )}
            </div>

            {/* Table of Articles */}
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-stone-900 text-stone-100 text-[11px] font-bold text-left">
                  <th className="py-2.5 px-3 rounded-l">Désignation des Articles</th>
                  <th className="py-2.5 px-3 text-center">Quantité</th>
                  <th className="py-2.5 px-3 text-right">Prix Unitaire (TTC)</th>
                  <th className="py-2.5 px-3 text-right">Taux TVA</th>
                  <th className="py-2.5 px-3 text-right rounded-r">Total TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-stone-800 text-xs">
                {sale.items.map((it, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-stone-50/50"}>
                    <td className="py-2.5 px-3 font-semibold">{it.name}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{it.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{it.unitPrice.toLocaleString('fr-FR')} FCFA</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {it.name.toLowerCase().includes('baguette') || it.name.toLowerCase().includes('pain') ? '0% (Exo)' : '18%'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                      {it.total.toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals & Fiscal Breakdown */}
            <div className="flex justify-between items-start mb-6">
              <div className="max-w-[55%] space-y-2">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-950">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">ARRÊTÉ DE LA PRÉSENTE FACTURE :</p>
                  <p className="text-xs font-semibold italic mt-0.5">{wordsAmount}</p>
                </div>
                <div className="text-[10px] text-stone-500 flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
                  <span>Document certifié conforme et généré électroniquement par BoulangeriePro ERP.</span>
                </div>
              </div>

              <div className="w-[40%] bg-stone-50 border border-stone-200 rounded-lg p-3 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Montant Total HT :</span>
                  <span>{netHT.toLocaleString('fr-FR')} FCFA</span>
                </div>
                {sale.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Remise Commerciale :</span>
                    <span>-{sale.discountAmount.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Total TVA (DGI 18%) :</span>
                  <span>{sale.vatAmount.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between items-center text-sm font-black text-stone-900 border-t border-stone-300 pt-2">
                  <span>TOTAL TTC :</span>
                  <span className="text-base text-amber-700 print:text-black">
                    {sale.total.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures & Footer */}
            <div className="border-t border-stone-200 pt-6 mt-6 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-12">
                <p className="font-bold text-stone-700">Pour le Client (Mention « Bon pour Accord »)</p>
                <div className="border-b border-dashed border-stone-300 w-40 mx-auto"></div>
              </div>
              <div className="space-y-12">
                <p className="font-bold text-stone-700">Pour l'Établissement (Cachet & Signature)</p>
                <div className="border-b border-dashed border-stone-300 w-40 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
