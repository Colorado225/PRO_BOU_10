/**
 * Base de données locale persistante (mock) — fallback quand Neon n'est pas accessible.
 *
 * Stocke les données dans mock-data.json.
 * Parse les requêtes SQL basiques (SELECT, INSERT, UPDATE) utilisées par les routes auth.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "..", "mock-data.json");

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════
interface MockDatabase {
  users: Record<string, any>[];
  organizations: Record<string, any>[];
  stores: Record<string, any>[];
  refresh_tokens: Record<string, any>[];
  company_settings: Record<string, any>[];
  raw_materials: Record<string, any>[];
  products: Record<string, any>[];
  recipes: Record<string, any>[];
  recipe_ingredients: Record<string, any>[];
  customers: Record<string, any>[];
  suppliers: Record<string, any>[];
  production_orders: Record<string, any>[];
  sales: Record<string, any>[];
  sale_items: Record<string, any>[];
  purchase_orders: Record<string, any>[];
  purchase_order_items: Record<string, any>[];
  losses: Record<string, any>[];
  cash_transactions: Record<string, any>[];
  custom_orders: Record<string, any>[];
  stock_movements: Record<string, any>[];
}

function getDefaultData(): MockDatabase {
  const now = new Date().toISOString();
  return {
    organizations: [
      { id: "org-1", name: "BoulangeriePro Demo", slug: "boulangeriepro-demo", contact_email: "demo@boulangeriepro.ci", created_at: now, updated_at: now },
    ],
    stores: [
      { id: "store-1", name: "Boutique Principale", organization_id: "org-1", created_at: now },
    ],
    users: [
      { id: "usr-gerant", name: "Aminata Koné", email: "gerant@boulangeriepro.ci", password_hash: "$2b$10$gzWcLLrPcld9CNc5keCqpOyyq4gjfk5mgOLL5JcaW5g83QEOZzv/.", role: "gerant", store_id: "store-1", organization_id: "org-1", is_active: true, email_verified_at: now, failed_login_attempts: 0, locked_until: null, created_at: now, updated_at: now },
      { id: "usr-caissier", name: "Ibrahim Diallo", email: "caissier@boulangeriepro.ci", password_hash: "$2b$10$eRlUD95.7uiN/octFyJ3N.0uPy1yrsCl5BS1WBspyLU9mYRheTjg6", role: "caissier", store_id: "store-1", organization_id: "org-1", is_active: true, email_verified_at: now, failed_login_attempts: 0, locked_until: null, created_at: now, updated_at: now },
      { id: "usr-boulanger", name: "Moussa Traoré", email: "boulanger@boulangeriepro.ci", password_hash: "$2b$10$KMtTjt47XCkgMPDAaVR9TOSgRzlHQ0ipJhOjfP3nF2Q.doqaoYCKu", role: "boulanger", store_id: "store-1", organization_id: "org-1", is_active: true, email_verified_at: now, failed_login_attempts: 0, locked_until: null, created_at: now, updated_at: now },
      { id: "usr-magasinier", name: "Fatou Bamba", email: "magasinier@boulangeriepro.ci", password_hash: "$2b$10$Nh6MBtbEjS7S587DNscf/uo1K/IOH/sYPsxwRawJ/IXjslfVSGU8K", role: "magasinier", store_id: "store-1", organization_id: "org-1", is_active: true, email_verified_at: now, failed_login_attempts: 0, locked_until: null, created_at: now, updated_at: now },
    ],
    refresh_tokens: [],
    company_settings: [],
    raw_materials: [],
    products: [],
    recipes: [],
    recipe_ingredients: [],
    customers: [],
    suppliers: [],
    production_orders: [],
    sales: [],
    sale_items: [],
    purchase_orders: [],
    purchase_order_items: [],
    losses: [],
    cash_transactions: [],
    custom_orders: [],
    stock_movements: [],
  };
}

// ═══════════════════════════════════════════════════════════════
// Chargement / Sauvegarde
// ═══════════════════════════════════════════════════════════════
let _data: MockDatabase | null = null;

function getData(): MockDatabase {
  if (!_data) {
    try {
      if (existsSync(DATA_FILE)) {
        const parsed = JSON.parse(readFileSync(DATA_FILE, "utf-8")) as MockDatabase;
        _data = parsed;
        console.log(`[mockDb] 📦 Base locale chargée : ${parsed.users?.length ?? 0} utilisateurs`);
      }
    } catch { /* ignore */ }
    if (!_data) {
      _data = getDefaultData();
      saveData();
      console.log("[mockDb] 📦 Base locale initialisée avec les comptes de démo");
    }
  }
  return _data;
}

function saveData(): void {
  if (!_data) return;
  try {
    writeFileSync(DATA_FILE, JSON.stringify(_data, null, 2), "utf-8");
  } catch (err) {
    console.error("[mockDb] Erreur de sauvegarde:", err);
  }
}

function getTable(name: string): Record<string, any>[] {
  const data = getData();
  switch (name) {
    case "users": return data.users;
    case "organizations": return data.organizations;
    case "stores": return data.stores;
    case "refresh_tokens": return data.refresh_tokens;
    case "company_settings": return data.company_settings || [];
    case "raw_materials": return data.raw_materials || [];
    case "products": return data.products || [];
    case "recipes": return data.recipes || [];
    case "recipe_ingredients": return data.recipe_ingredients || [];
    case "customers": return data.customers || [];
    case "suppliers": return data.suppliers || [];
    case "production_orders": return data.production_orders || [];
    case "sales": return data.sales || [];
    case "sale_items": return data.sale_items || [];
    case "purchase_orders": return data.purchase_orders || [];
    case "purchase_order_items": return data.purchase_order_items || [];
    case "losses": return data.losses || [];
    case "cash_transactions": return data.cash_transactions || [];
    case "custom_orders": return data.custom_orders || [];
    case "stock_movements": return data.stock_movements || [];
    default: return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// Parser SQL simplifié
// ═══════════════════════════════════════════════════════════════

/** Extrait le nom de la table après un mot-clé (FROM, INTO, UPDATE). */
function extractTableName(sql: string, keyword: string): string | null {
  const re = new RegExp(`${keyword}\\s+(?:IF\\s+(?:NOT\\s+)?EXISTS\\s+)?(\\w+)`, "i");
  const m = sql.match(re);
  return m ? m[1] : null;
}

/** Extrait les colonnes d'un SELECT (entre SELECT et FROM). */
function extractSelectColumns(sql: string): string[] | null {
  const m = sql.match(/SELECT\s+(.+?)\s+FROM/i);
  if (!m) return null;
  const cols = m[1].trim();
  if (cols === "*") return null; // tout
  return cols.split(",").map((c) => {
    // Gérer les alias : "column AS alias"
    const aliasMatch = c.trim().match(/(\w+)\s+AS\s+"?(\w+)"?/i);
    if (aliasMatch) return aliasMatch[2];
    return c.trim();
  });
}

/** Extrait les conditions WHERE avec les paramètres $N. */
function extractWhereConditions(sql: string): Array<{ column: string; paramIndex: number }> {
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s*$)/i);
  if (!whereMatch) return [];

  const conditions: Array<{ column: string; paramIndex: number }> = [];
  const parts = whereMatch[1].split(/\s+AND\s+/i);

  for (const part of parts) {
    const m = part.trim().match(/(\w+)\s*=\s*\$(\d+)/);
    if (m) {
      conditions.push({ column: m[1], paramIndex: parseInt(m[2]) - 1 });
    }
  }
  return conditions;
}

/** Filtre les lignes selon les conditions WHERE. */
function applyWhere(rows: Record<string, any>[], sql: string, params: unknown[]): Record<string, any>[] {
  const conditions = extractWhereConditions(sql);
  if (conditions.length === 0) return rows;

  // Detect columns that don't exist in any row (table doesn't have this column)
  // and skip those conditions to avoid filtering out all rows
  if (rows.length > 0) {
    const sampleRow = rows[0];
    const validConditions = conditions.filter(c => c.column in sampleRow);
    if (validConditions.length === 0) return rows; // No valid conditions, return all rows
    return rows.filter((row) =>
      validConditions.every((c) => row[c.column] === params[c.paramIndex])
    );
  }

  return rows.filter((row) =>
    conditions.every((c) => row[c.column] === params[c.paramIndex])
  );
}

/** Applique la sélection de colonnes. */
function applySelectColumns(rows: Record<string, any>[], sql: string): Record<string, any>[] {
  const columns = extractSelectColumns(sql);
  if (!columns) return rows;

  return rows.map((row) => {
    const filtered: Record<string, any> = {};
    for (const col of columns) {
      filtered[col] = row[col];
    }
    return filtered;
  });
}

/** Extrait les colonnes et valeurs d'un INSERT, gère les littéraux et les $N. */
function parseInsert(sql: string, params: unknown[]): Record<string, any> {
  // Normaliser les espaces et retours à la ligne
  const normalized = sql.replace(/\s+/g, " ");
  
  const columnsMatch = normalized.match(/\(\s*([^)]+?)\s*\)\s*VALUES/i);
  if (!columnsMatch) return {};
  const columns = columnsMatch[1].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));

  // Extraire les valeurs après VALUES (gérer RETURNING après)
  const valuesMatch = normalized.match(/VALUES\s*\((.+?)\)\s*(?:RETURNING|ON\s+CONFLICT|$)/i);
  if (!valuesMatch) return {};
  
  // Parser les valeurs en gérant les $N, les strings littérales, les booléens et les fonctions
  const rawValues = splitValues(valuesMatch[1]);
  
  const row: Record<string, any> = {};
  columns.forEach((col, i) => {
    if (i >= rawValues.length) return;
    const val = rawValues[i].trim();
    
    if (val.match(/^\$\d+$/)) {
      // Paramètre $N
      const idx = parseInt(val.slice(1)) - 1;
      row[col] = idx < params.length ? params[idx] : null;
    } else if (/^now\(\)$/i.test(val)) {
      // Fonction now()
      row[col] = new Date().toISOString();
    } else if (/^true$/i.test(val)) {
      row[col] = true;
    } else if (/^false$/i.test(val)) {
      row[col] = false;
    } else if (/^null$/i.test(val)) {
      row[col] = null;
    } else if (/^'.*'$/.test(val)) {
      // String littérale
      row[col] = val.slice(1, -1);
    } else if (/^-?\d+(\.\d+)?$/.test(val)) {
      // Nombre
      row[col] = Number(val);
    } else {
      row[col] = val;
    }
  });

  return row;
}

/** Sépare les valeurs d'un VALUES en gérant les parenthèses et les virgules dans les strings. */
function splitValues(str: string): string[] {
  const values: string[] = [];
  let current = "";
  let depth = 0;
  let inString = false;

  for (const ch of str) {
    if (ch === "'" && depth === 0) {
      inString = !inString;
      current += ch;
    } else if (ch === "(" && !inString) {
      depth++;
      current += ch;
    } else if (ch === ")" && !inString) {
      depth--;
      current += ch;
    } else if (ch === "," && depth === 0 && !inString) {
      values.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) values.push(current.trim());
  return values;
}

/** Extrait les clauses SET d'un UPDATE. */
function extractSetClauses(sql: string): Array<{ column: string; isParam: boolean; paramIndex?: number; isNow?: boolean; isNull?: boolean }> {
  // Normaliser les espaces
  const normalized = sql.replace(/\s+/g, " ");
  const setMatch = normalized.match(/SET\s+(.+?)\s+WHERE/i);
  if (!setMatch) return [];

  return setMatch[1].split(",").map((clause) => {
    const eqIdx = clause.indexOf("=");
    if (eqIdx === -1) return { column: "", isParam: false };
    const col = clause.slice(0, eqIdx).trim().replace(/^["']|["']$/g, "");
    const val = clause.slice(eqIdx + 1).trim();
    const paramMatch = val?.match(/\$(\d+)/);

    return {
      column: col,
      isParam: !!paramMatch,
      paramIndex: paramMatch ? parseInt(paramMatch[1]) - 1 : undefined,
      isNow: /now\(\)/i.test(val || ""),
      isNull: /^NULL$/i.test(val || ""),
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// API publique — compatible avec server/db.ts
// ═══════════════════════════════════════════════════════════════

export async function mockQuery<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const upper = sql.trim().toUpperCase();

  // ─── SELECT ─────────────────────────────────
  if (upper.startsWith("SELECT")) {
    const table = extractTableName(sql, "FROM");
    if (!table) return [];
    let rows = [...getTable(table)];
    rows = applyWhere(rows, sql, params);
    rows = applySelectColumns(rows, sql);

    // ORDER BY
    if (/ORDER\s+BY/i.test(sql)) {
      const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
      if (orderMatch) {
        const col = orderMatch[1];
        const desc = orderMatch[2]?.toUpperCase() === "DESC";
        rows.sort((a, b) => {
          const va = a[col] ?? "";
          const vb = b[col] ?? "";
          return desc ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1);
        });
      }
    }

    return rows as T[];
  }

  // ─── INSERT ─────────────────────────────────
  if (upper.startsWith("INSERT")) {
    const table = extractTableName(sql, "INTO");
    if (!table) return [];
    const row = parseInsert(sql, params);
    if (!row.id) row.id = `${table.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (!row.created_at) row.created_at = new Date().toISOString();
    
    // Handle ON CONFLICT DO NOTHING
    if (/ON\s+CONFLICT.*DO\s+NOTHING/i.test(sql)) {
      const existing = getTable(table).find((r) => r.id === row.id);
      if (existing) return [existing] as T[];
    }
    
    getTable(table).push(row);
    saveData();
    
    // Handle RETURNING clause
    if (/RETURNING/i.test(sql)) {
      return [row] as T[];
    }
    return [];
  }

  // ─── UPDATE ─────────────────────────────────
  if (upper.startsWith("UPDATE")) {
    const table = extractTableName(sql, "UPDATE");
    if (!table) return [];
    const rows = getTable(table);
    const setClauses = extractSetClauses(sql);
    const whereConditions = extractWhereConditions(sql);

    let count = 0;
    for (const row of rows) {
      const matches = whereConditions.every((c) => row[c.column] === params[c.paramIndex]);
      if (matches) {
        for (const clause of setClauses) {
          if (clause.isParam && clause.paramIndex !== undefined) {
            row[clause.column] = params[clause.paramIndex];
          } else if (clause.isNow) {
            row[clause.column] = new Date().toISOString();
          } else if (clause.isNull) {
            row[clause.column] = null;
          }
        }
        row.updated_at = new Date().toISOString();
        count++;
      }
    }
    saveData();
    return [{ rowCount: count }] as any;
  }

  // ─── SELECT 1 (test de connexion) ──────────
  if (upper.includes("SELECT 1")) {
    return [{ "1": 1 }] as any;
  }

  return [];
}

export async function mockQueryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await mockQuery<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}
