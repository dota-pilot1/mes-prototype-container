import { api } from "@/shared/api/axios";
import type {
  CreateProductionPlanBody,
  ProductionPlan,
  UpdateProductionPlanBody,
} from "../model/types";

export const productionPlanApi = {
  list: () =>
    api.get<ProductionPlan[]>("/api/production-plans").then((r) => r.data),

  create: (body: CreateProductionPlanBody) =>
    api.post<ProductionPlan>("/api/production-plans", body).then((r) => r.data),

  update: (id: number, body: UpdateProductionPlanBody) =>
    api.put<ProductionPlan>(`/api/production-plans/${id}`, body).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/api/production-plans/${id}`).then(() => undefined),
};
