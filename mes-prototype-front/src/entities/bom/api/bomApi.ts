import { api } from "@/shared/api/axios";
import type { Bom, CreateBomBody } from "../model/types";

export const bomApi = {
  list: () => api.get<Bom[]>("/api/boms").then((r) => r.data),

  get: (id: number) => api.get<Bom>(`/api/boms/${id}`).then((r) => r.data),

  create: (body: CreateBomBody) =>
    api.post<Bom>("/api/boms", body).then((r) => r.data),
};
