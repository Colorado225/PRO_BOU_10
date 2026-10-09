/**
 * Requêtes de lecture pour les boutiques.
 */

import { query, queryOne } from "../db";
import type { Store } from "../types/bakery";

export const getStore = async (
  id: string,
  organizationId?: string,
): Promise<Store | null> => {
  if (organizationId) {
    return queryOne<Store>(
      `SELECT id, name, location, phone, manager_name AS "managerName", is_main AS "isMain"
         FROM stores WHERE organization_id = $1 AND id = $2`,
      [organizationId, id],
    );
  }
  return queryOne<Store>(
    `SELECT id, name, location, phone, manager_name AS "managerName", is_main AS "isMain"
       FROM stores WHERE id = $1`,
    [id],
  );
};

export const getStores = async (filters?: {
  clause: string;
  values: unknown[];
}): Promise<Store[]> => {
  const baseQuery = `SELECT id, name, location, phone, manager_name AS "managerName", is_main AS "isMain"
       FROM stores`;
  const fullQuery = filters
    ? `${baseQuery} WHERE ${filters.clause} ORDER BY is_main DESC, name`
    : `${baseQuery} ORDER BY is_main DESC, name`;
  return query<Store>(fullQuery, filters?.values || []);
};
