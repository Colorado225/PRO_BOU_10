/**
 * Seed script pour mockDb — peuple mock-data.json avec les données de initialData.ts
 * Usage: npx tsx server/seed-mock.ts
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  INITIAL_STORES,
  INITIAL_MATERIALS,
  INITIAL_PRODUCTS,
  INITIAL_RECIPES,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SALES,
  INITIAL_LOSSES,
  INITIAL_CASH_TRANSACTIONS,
  INITIAL_CUSTOM_ORDERS,
} from "../src/data/initialData.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "..", "mock-data.json");

const now = new Date().toISOString();
const ORG_ID = "org-1";
const STORE_ID = "store-1";

// Charger les données existantes (users, etc.)
let existing: any = {};
if (existsSync(DATA_FILE)) {
  existing = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
}

const data: any = {
  // Garder les données existantes
  organizations: existing.organizations || [
    { id: ORG_ID, name: "Maison du Pain & Pâtisserie d'Ivoire", slug: "maisondupain", contact_email: "contact@maisondupain.ci", contact_phone: "+2250123456789", address: "Abidjan, Côte d'Ivoire", created_at: now, updated_at: now },
  ],
  stores: (existing.stores || []).length > 0 ? existing.stores : INITIAL_STORES.map(s => ({
    id: s.id,
    name: s.name,
    location: s.location,
    phone: s.phone,
    manager_name: s.managerName,
    is_main: s.isMain,
    organization_id: ORG_ID,
    created_at: now,
  })),
  users: existing.users || [],
  refresh_tokens: existing.refresh_tokens || [],

  // Company settings
  company_settings: [
    { id: "default", establishment_name: "Maison du Pain & Pâtisserie d'Ivoire", rccm: "CI-ABJ-2024-B-14529", taxpayer_account: "2419082", default_vat_rate: 0, currency: "XOF", organization_id: ORG_ID },
  ],

  // Matières premières
  raw_materials: INITIAL_MATERIALS.map(m => ({
    id: m.id,
    code: m.code,
    name: m.name,
    category: m.category,
    current_stock: m.currentStock,
    unit: m.unit,
    min_stock_alert: m.minStockAlert,
    unit_cost: m.unitCost,
    supplier_id: m.supplierId || null,
    batch_number: m.batchNumber || null,
    expiry_date: m.expiryDate || null,
    location: m.location || null,
    organization_id: ORG_ID,
    store_id: STORE_ID,
    created_at: now,
    updated_at: now,
  })),

  // Produits
  products: INITIAL_PRODUCTS.map(p => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    price: p.price,
    cost_price: p.costPrice,
    vat_rate: p.vatRate,
    stock: p.stock,
    min_stock: p.minStock,
    unit: p.unit,
    barcode: p.barcode || null,
    image_icon: p.imageIcon || null,
    description: p.description || null,
    recipe_id: p.recipeId || null,
    store_id: p.storeId,
    is_active: p.isActive,
    organization_id: ORG_ID,
    created_at: now,
    updated_at: now,
  })),

  // Recettes
  recipes: INITIAL_RECIPES.map(r => ({
    id: r.id,
    name: r.name,
    product_id: r.productId || null,
    product_name: r.productName || null,
    output_yield: r.outputYield,
    output_unit: r.outputUnit || null,
    preparation_time_min: r.preparationTimeMin,
    proofing_time_min: r.proofingTimeMin,
    baking_time_min: r.bakingTimeMin,
    baking_temp_c: r.bakingTempC,
    instructions: JSON.stringify(r.instructions || []),
    total_cost: r.totalCost,
    cost_per_unit: r.costPerUnit,
    store_id: STORE_ID,
    organization_id: ORG_ID,
    created_at: now,
    updated_at: now,
  })),

  // Ingrédients de recettes
  recipe_ingredients: INITIAL_RECIPES.flatMap(r =>
    r.ingredients.map(ing => ({
      id: `ri-${r.id}-${ing.materialId}`,
      recipe_id: r.id,
      material_id: ing.materialId,
      material_name: ing.materialName,
      quantity: ing.quantity,
      unit: ing.unit,
      cost: ing.cost,
      store_id: STORE_ID,
      organization_id: ORG_ID,
    }))
  ),

  // Clients
  customers: INITIAL_CUSTOMERS.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email || null,
    type: c.type,
    address: c.address || null,
    loyalty_points: c.loyaltyPoints,
    credit_balance: c.creditBalance,
    credit_limit: c.creditLimit,
    notes: c.notes || null,
    store_id: STORE_ID,
    organization_id: ORG_ID,
    created_at: now,
    updated_at: now,
  })),

  // Fournisseurs
  suppliers: INITIAL_SUPPLIERS.map(s => ({
    id: s.id,
    name: s.name,
    contact_name: s.contactName,
    phone: s.phone,
    email: s.email,
    address: s.address,
    supplied_materials: JSON.stringify(s.suppliedMaterials || []),
    payment_terms: s.paymentTerms,
    pending_balance: s.pendingBalance,
    store_id: STORE_ID,
    organization_id: ORG_ID,
    created_at: now,
    updated_at: now,
  })),

  // Ordres de production
  production_orders: INITIAL_PRODUCTION_ORDERS.map(o => ({
    id: o.id,
    code: o.code,
    recipe_id: o.recipeId,
    recipe_name: o.recipeName,
    product_id: o.productId,
    product_name: o.productName,
    batch_multiplier: o.batchMultiplier,
    target_quantity: o.targetQuantity,
    actual_quantity: o.actualQuantity || null,
    status: o.status,
    scheduled_time: o.scheduledTime,
    completed_time: o.completedTime || null,
    baker_name: o.bakerName,
    shift: o.shift,
    store_id: o.storeId,
    notes: o.notes || null,
    organization_id: ORG_ID,
    created_at: now,
    updated_at: now,
  })),

  // Ventes
  sales: INITIAL_SALES.map(s => ({
    id: s.id,
    receipt_number: s.receiptNumber,
    date: s.date,
    subtotal: s.subtotal,
    discount_amount: s.discountAmount,
    vat_amount: s.vatAmount,
    total: s.total,
    payment_method: s.paymentMethod,
    amount_paid: s.amountPaid,
    change_returned: s.changeReturned,
    customer_id: s.customerId || null,
    customer_name: s.customerName || null,
    cashier_name: s.cashierName,
    store_id: s.storeId,
    status: s.status,
    organization_id: ORG_ID,
    created_at: now,
    updated_at: now,
  })),

  // Lignes de ventes
  sale_items: INITIAL_SALES.flatMap(s =>
    s.items.map((it: any, idx: number) => ({
      id: `si-${s.id}-${idx}`,
      sale_id: s.id,
      product_id: it.productId,
      name: it.name,
      unit_price: it.unitPrice,
      quantity: it.quantity,
      total: it.total,
      store_id: s.storeId,
      organization_id: ORG_ID,
    }))
  ),

  // Bons de commande
  purchase_orders: INITIAL_PURCHASE_ORDERS.map(po => ({
    id: po.id,
    order_number: po.orderNumber,
    supplier_id: po.supplierId,
    supplier_name: po.supplierName,
    date: po.date,
    status: po.status,
    total_amount: po.totalAmount,
    notes: po.notes || null,
    store_id: STORE_ID,
    organization_id: ORG_ID,
    created_at: now,
    updated_at: now,
  })),

  // Lignes de bons de commande
  purchase_order_items: INITIAL_PURCHASE_ORDERS.flatMap(po =>
    po.items.map((it: any, idx: number) => ({
      id: `poi-${po.id}-${idx}`,
      order_id: po.id,
      material_id: it.materialId,
      material_name: it.materialName,
      quantity: it.quantity,
      unit: it.unit,
      unit_price: it.unitPrice,
      total: it.total,
      store_id: STORE_ID,
      organization_id: ORG_ID,
    }))
  ),

  // Pertes
  losses: INITIAL_LOSSES.map(l => ({
    id: l.id,
    date: l.date,
    product_id: l.productId || null,
    product_name: l.productName,
    quantity: l.quantity,
    unit: l.unit,
    loss_value: l.lossValue,
    reason: l.reason,
    destination: l.destination,
    store_id: l.storeId,
    recorded_by: l.recordedBy,
    notes: l.notes || null,
    organization_id: ORG_ID,
    created_at: now,
  })),

  // Transactions de caisse
  cash_transactions: INITIAL_CASH_TRANSACTIONS.map(t => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    description: t.description,
    date: t.date,
    recorded_by: t.recordedBy,
    store_id: t.storeId,
    created_at: now,
  })),

  // Commandes personnalisées (gâteaux)
  custom_orders: INITIAL_CUSTOM_ORDERS.map(o => ({
    id: o.id,
    order_number: o.orderNumber,
    client_name: o.clientName,
    phone: o.phone,
    cake_type: o.cakeType,
    serving_count: o.servingCount,
    flavor: o.flavor,
    custom_inscription: o.customInscription,
    theme_color: o.themeColor,
    pickup_date: o.pickupDate,
    pickup_time: o.pickupTime,
    total_price: o.totalPrice,
    deposit_paid: o.depositPaid,
    status: o.status,
    store_id: o.storeId,
    notes: o.notes || null,
    created_at: now,
  })),

  // Mouvements de stock (vide au démarrage)
  stock_movements: [],
};

// Écriture
writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");

// Résumé
console.log("✅ mock-data.json seedé avec succès !");
console.log(`   organizations: ${data.organizations.length}`);
console.log(`   stores: ${data.stores.length}`);
console.log(`   users: ${data.users.length}`);
console.log(`   company_settings: ${data.company_settings.length}`);
console.log(`   raw_materials: ${data.raw_materials.length}`);
console.log(`   products: ${data.products.length}`);
console.log(`   recipes: ${data.recipes.length}`);
console.log(`   recipe_ingredients: ${data.recipe_ingredients.length}`);
console.log(`   customers: ${data.customers.length}`);
console.log(`   suppliers: ${data.suppliers.length}`);
console.log(`   production_orders: ${data.production_orders.length}`);
console.log(`   sales: ${data.sales.length}`);
console.log(`   sale_items: ${data.sale_items.length}`);
console.log(`   purchase_orders: ${data.purchase_orders.length}`);
console.log(`   purchase_order_items: ${data.purchase_order_items.length}`);
console.log(`   losses: ${data.losses.length}`);
console.log(`   cash_transactions: ${data.cash_transactions.length}`);
console.log(`   custom_orders: ${data.custom_orders.length}`);
console.log(`   stock_movements: ${data.stock_movements.length}`);
