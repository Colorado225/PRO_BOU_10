import { describe, it, expect, vi } from "vitest";
import {
  generateSalesJournal,
  generatePurchasesJournal,
  formatJournalToCsv,
} from "../services/accountingService";
import { numberToWordsFCFA } from "../../src/services/invoiceService";

// Mock de db.ts
vi.mock("../db", () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
  transaction: vi.fn((cb) =>
    cb({
      query: vi.fn().mockResolvedValue([]),
      queryOne: vi.fn().mockResolvedValue({ id: "mock-id", name: "Mock" }),
    }),
  ),
}));

describe("Services Comptables OHADA & Facturation B2B (Phase 3)", () => {
  describe("numberToWordsFCFA", () => {
    it("convertit correctement les montants en FCFA en toutes lettres", () => {
      expect(numberToWordsFCFA(0)).toBe("Zéro franc CFA");
      expect(numberToWordsFCFA(1200)).toBe("Mille deux cent francs CFA");
      expect(numberToWordsFCFA(55000)).toBe("Cinquante-cinq mille francs CFA");
      expect(numberToWordsFCFA(1500000)).toBe("Un million cinq cent mille francs CFA");
    });
  });

  describe("generateSalesJournal", () => {
    it("génère les écritures conformes au SYSCOHADA (Débit 531/571, Crédit 701, Crédit 4431)", async () => {
      const { query } = await import("../db");
      (query as any).mockResolvedValueOnce([
        {
          id: "sale-1",
          receipt_number: "CI-20261010-0001",
          date: "2026-10-10T10:00:00.000Z",
          subtotal: 10000,
          discount_amount: 0,
          vat_amount: 1800,
          total: 10000,
          payment_method: "wave",
          customer_name: "Hôtel Ivoire",
        },
      ]);

      const entries = await generateSalesJournal({
        organizationId: "org-1",
      });

      expect(entries.length).toBe(3);

      // 1. Débit Compte Wave
      expect(entries[0].accountCode).toBe("571110");
      expect(entries[0].debit).toBe(10000);
      expect(entries[0].credit).toBe(0);

      // 2. Crédit Ventes HT
      expect(entries[1].accountCode).toBe("701100");
      expect(entries[1].debit).toBe(0);
      expect(entries[1].credit).toBe(8200);

      // 3. Crédit TVA Collectée DGI
      expect(entries[2].accountCode).toBe("443100");
      expect(entries[2].debit).toBe(0);
      expect(entries[2].credit).toBe(1800);
    });
  });

  describe("generatePurchasesJournal", () => {
    it("génère les écritures d'achats (Débit 601, Crédit 401)", async () => {
      const { query } = await import("../db");
      (query as any).mockResolvedValueOnce([
        {
          id: "po-1",
          code: "BC-FARINE-01",
          date: "2026-10-10T08:00:00.000Z",
          total_amount: 250000,
          supplier_name: "Grands Moulins d'Abidjan",
        },
      ]);

      const entries = await generatePurchasesJournal({
        organizationId: "org-1",
      });

      expect(entries.length).toBe(2);

      // Débit Compte 6011
      expect(entries[0].accountCode).toBe("601100");
      expect(entries[0].debit).toBe(250000);

      // Crédit Compte 4011
      expect(entries[1].accountCode).toBe("401100");
      expect(entries[1].credit).toBe(250000);
    });
  });

  describe("formatJournalToCsv", () => {
    it("génère un CSV propre avec point-virgule et entêtes OHADA", () => {
      const csv = formatJournalToCsv([
        {
          date: "2026-10-10",
          pieceNumber: "CI-001",
          accountCode: "531100",
          accountLabel: "Caisse",
          label: "Vente comptoir",
          debit: 5000,
          credit: 0,
        },
      ]);

      expect(csv).toContain("Date;Numéro Pièce;Compte OHADA;Intitulé Compte;Libellé Écriture;Débit (FCFA);Crédit (FCFA);Mode Règlement / Tiers");
      expect(csv).toContain("2026-10-10;\"CI-001\";531100;\"Caisse\";\"Vente comptoir\";5000;0;\"\"");
    });
  });
});
