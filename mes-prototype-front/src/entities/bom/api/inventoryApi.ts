import { api } from "@/shared/api/axios";
import type { CreateInventoryBody, Inventory } from "../model/types";

export const inventoryApi = {
  list: () => api.get<Inventory[]>("/api/inventories").then((r) => r.data),

  upsert: (body: CreateInventoryBody) =>
    api.post<Inventory>("/api/inventories", body).then((r) => r.data),
};
