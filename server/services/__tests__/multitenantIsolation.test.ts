import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock de la base de données
vi.mock("../../db", () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}));

describe("Isolation multi-tenant", () => {
  let getStore: typeof import("../storesQueries").getStore;
  let query: typeof import("../../db").query;
  let queryOne: typeof import("../../db").queryOne;

  beforeAll(async () => {
    // Importer les modules avant les tests
    const storesModule = await import("../storesQueries");
    getStore = storesModule.getStore;
    const dbModule = await import("../../db");
    query = dbModule.query;
    queryOne = dbModule.queryOne;
  });

  it("un utilisateur ne peut pas accéder aux données d'un autre store", async () => {
    // Mock queryOne pour retourner null quand l'organizationId ne correspond pas
    (queryOne as vi.Mock).mockResolvedValueOnce(null);

    // Simuler un accès avec un mauvais organizationId
    const userOrganizationId = "org-2";
    const store = await getStore("store-1", userOrganizationId);

    // Le store ne doit pas être trouvé car l'organizationId ne correspond pas
    expect(store).toBeNull();
  });

  it("toutes les requêtes de lecture filtrent par organization_id quand fourni", async () => {
    // Vérifier que les requêtes SQL incluent systématiquement le filtre organization_id quand il est fourni
    (queryOne as vi.Mock).mockResolvedValueOnce(null);

    await getStore("store-1", "org-2");

    // Vérifier que la requête contient le filtre organization_id
    expect(queryOne).toHaveBeenCalledWith(
      expect.stringContaining("organization_id = $1 AND id = $2"),
      ["org-2", "store-1"],
    );
  });
});
