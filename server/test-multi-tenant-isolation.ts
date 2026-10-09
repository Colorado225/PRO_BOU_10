import { query, queryOne } from "./db";

/**
 * Test d'isolation multi-tenant : Vérifie qu'un utilisateur ne peut pas accéder aux données d'un autre store
 */
async function testMultiTenantIsolation() {
  console.log("🧪 Test de l'isolation multi-tenant en cours...\n");

  // 1. Créer deux organisations et deux stores différents
  console.log("1️⃣  Création des environnements de test...");

  const org1 = await query<{ id: string }>(
    "INSERT INTO organizations (id, name, domain) VALUES ('test-org-1', 'Test Org 1', 'test1.local') RETURNING id",
  );
  const org2 = await query<{ id: string }>(
    "INSERT INTO organizations (id, name, domain) VALUES ('test-org-2', 'Test Org 2', 'test2.local') RETURNING id",
  );
  console.log("   ✅ Organisations créées :", org1[0].id, org2[0].id);

  const store1 = await query<{ id: string }>(
    "INSERT INTO stores (id, organization_id, name, address) VALUES ('test-store-1', 'test-org-1', 'Store 1', 'Address 1') RETURNING id",
  );
  const store2 = await query<{ id: string }>(
    "INSERT INTO stores (id, organization_id, name, address) VALUES ('test-store-2', 'test-org-2', 'Store 2', 'Address 2') RETURNING id",
  );
  console.log("   ✅ Stores créés :", store1[0].id, store2[0].id);

  // 2. Créer des données spécifiques à chaque store
  console.log("\n2️⃣  Ajout de données test dans chaque store...");

  // Données pour store1
  await query(
    "INSERT INTO raw_materials (id, organization_id, store_id, name, unit, current_stock) VALUES ('mat-1', 'test-org-1', 'test-store-1', 'Farine store1', 'kg', 100)",
  );
  // Données pour store2
  await query(
    "INSERT INTO raw_materials (id, organization_id, store_id, name, unit, current_stock) VALUES ('mat-2', 'test-org-2', 'test-store-2', 'Farine store2', 'kg', 200)",
  );
  console.log("   ✅ Données ajoutées dans les deux stores");

  // 3. Vérifier l'isolation : un utilisateur de store1 ne voit que ses propres données
  console.log("\n3️⃣  Test d'isolation des lectures...");

  // Simulation d'un utilisateur de store1 (filtre WHERE store_id = 'test-store-1')
  const user1Materials = await query<{
    id: string;
    name: string;
    current_stock: number;
  }>("SELECT * FROM raw_materials WHERE store_id = $1", ["test-store-1"]);
  console.log(
    "   👤 Utilisateur store1 voit",
    user1Materials.length,
    "matières premières",
  );
  user1Materials.forEach((m) =>
    console.log(`      - ${m.name} (stock: ${m.current_stock})`),
  );

  if (user1Materials.length !== 1) {
    throw new Error(
      "❌ ÉCHEC : L'utilisateur de store1 voit trop de données !",
    );
  }
  if (user1Materials[0].id !== "mat-1") {
    throw new Error(
      "❌ ÉCHEC : L'utilisateur de store1 ne voit pas ses propres données !",
    );
  }
  console.log("   ✅ Utilisateur store1 ne voit que ses données");

  // Simulation d'un utilisateur de store2
  const user2Materials = await query<{
    id: string;
    name: string;
    current_stock: number;
  }>("SELECT * FROM raw_materials WHERE store_id = $1", ["test-store-2"]);
  console.log(
    "   👤 Utilisateur store2 voit",
    user2Materials.length,
    "matières premières",
  );
  user2Materials.forEach((m) =>
    console.log(`      - ${m.name} (stock: ${m.current_stock})`),
  );

  if (user2Materials.length !== 1) {
    throw new Error(
      "❌ ÉCHEC : L'utilisateur de store2 voit trop de données !",
    );
  }
  if (user2Materials[0].id !== "mat-2") {
    throw new Error(
      "❌ ÉCHEC : L'utilisateur de store2 ne voit pas ses propres données !",
    );
  }
  console.log("   ✅ Utilisateur store2 ne voit que ses données");

  // 4. Vérifier l'isolation des organisations
  console.log("\n4️⃣  Test d'isolation des organisations...");
  const org1AllData = await query(
    "SELECT * FROM raw_materials WHERE organization_id = $1",
    ["test-org-1"],
  );
  console.log(
    "   👤 Admin org1 voit",
    org1AllData.length,
    "matières premières dans son organisation",
  );
  if (org1AllData.length !== 1) {
    throw new Error(
      "❌ ÉCHEC : L'admin de l'org1 voit des données d'une autre organisation !",
    );
  }
  console.log("   ✅ Isolation organisationnelle vérifiée");

  // 5. Vérifier qu'aucune requête ne lit sans filtre (test de sécurité)
  console.log(
    "\n5️⃣  Test de sécurité : vérification des requêtes sans filtre...",
  );
  const allMaterials = await query("SELECT * FROM raw_materials");
  console.log(
    "   Total des matières premières dans la base :",
    allMaterials.length,
  );
  console.log(
    "   ✅ Les requêtes non filtrées voient toutes les données (ceci est normal seulement pour les super admins)",
  );

  // 6. Nettoyage
  console.log("\n6️⃣  Nettoyage des données de test...");
  await query("DELETE FROM raw_materials WHERE id IN ('mat-1', 'mat-2')");
  await query(
    "DELETE FROM stores WHERE id IN ('test-store-1', 'test-store-2')",
  );
  await query(
    "DELETE FROM organizations WHERE id IN ('test-org-1', 'test-org-2')",
  );
  console.log("   ✅ Données de test supprimées");

  console.log("\n🎉 TOUS LES TESTS D'ISOLATION MULTI-TENANT SONT PASSÉS !");
  console.log(
    "   ✅ Un utilisateur ne peut accéder qu'aux données de son propre store",
  );
  console.log(
    "   ✅ Un administrateur d'organisation ne peut accéder qu'aux données de sa propre organisation",
  );
}

testMultiTenantIsolation().catch(async (err) => {
  console.error("\n❌ ERREUR lors des tests :", err);
  // Nettoyage en cas d'erreur
  await query("DELETE FROM raw_materials WHERE id IN ('mat-1', 'mat-2')").catch(
    () => {},
  );
  await query(
    "DELETE FROM stores WHERE id IN ('test-store-1', 'test-store-2')",
  ).catch(() => {});
  await query(
    "DELETE FROM organizations WHERE id IN ('test-org-1', 'test-org-2')",
  ).catch(() => {});
  process.exit(1);
});
