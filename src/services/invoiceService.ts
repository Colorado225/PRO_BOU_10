/**
 * Service de Génération et de Formatage de Factures B2B.
 * Conforme à la législation fiscale de la Direction Générale des Impôts (DGI) de Côte d'Ivoire.
 */

import { Sale, CompanySettings, Store, Customer } from '../types/bakery';

/**
 * Convertit un montant en FCFA en toutes lettres (Français)
 */
export const numberToWordsFCFA = (amount: number): string => {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];

  if (amount === 0) return 'Zéro franc CFA';

  const convertGroup = (n: number): string => {
    let result = '';
    const h = Math.floor(n / 100);
    const rest = n % 100;

    if (h > 0) {
      if (h === 1) result += 'cent ';
      else result += units[h] + ' cent ';
    }

    if (rest > 0) {
      if (rest < 10) {
        result += units[rest];
      } else if (rest >= 10 && rest < 20) {
        result += teens[rest - 10];
      } else {
        const t = Math.floor(rest / 10);
        const u = rest % 10;
        if (t === 7) {
          result += 'soixante-' + (u === 1 ? 'et-onze' : teens[u]);
        } else if (t === 9) {
          result += 'quatre-vingt-' + teens[u];
        } else {
          result += tens[t] + (u === 1 && t !== 8 ? ' et un' : u > 0 ? '-' + units[u] : '');
        }
      }
    }

    return result.trim();
  };

  const millions = Math.floor(amount / 1000000);
  const thousands = Math.floor((amount % 1000000) / 1000);
  const remaining = Math.floor(amount % 1000);

  const parts: string[] = [];

  if (millions > 0) {
    parts.push(millions === 1 ? 'un million' : `${convertGroup(millions)} millions`);
  }
  if (thousands > 0) {
    parts.push(thousands === 1 ? 'mille' : `${convertGroup(thousands)} mille`);
  }
  if (remaining > 0) {
    parts.push(convertGroup(remaining));
  }

  const result = parts.join(' ').trim();
  return (result.charAt(0).toUpperCase() + result.slice(1) + ' francs CFA').trim();
};

export interface InvoiceData {
  sale: Sale;
  company: CompanySettings;
  store: Store;
  customer?: Customer;
}

/**
 * Lance l'impression directe au format A4 via la boîte de dialogue système
 */
export const printInvoiceA4 = () => {
  window.print();
};
