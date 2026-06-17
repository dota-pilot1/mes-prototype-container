import { api } from "@/shared/api/axios";
import type { CreateItemBody, Item } from "../model/types";

export const itemApi = {
  list: () => api.get<Item[]>("/api/items").then((r) => r.data),

  create: (body: CreateItemBody) =>
    api.post<Item>("/api/items", body).then((r) => r.data),
};
