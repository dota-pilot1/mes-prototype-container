export type PlanStatus = "PLANNED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED";

export type ProductionPlan = {
  id: number;
  code: string;
  itemId: number | null;
  itemCode: string | null;
  itemName: string;
  bomCode: string | null;
  quantity: number;
  startDate: string;
  endDate: string;
  status: PlanStatus;
};

export type CreateProductionPlanBody = {
  code: string;
  itemId?: number;
  itemCode?: string;
  itemName: string;
  bomCode?: string;
  quantity: number;
  startDate: string;
  endDate: string;
  status?: PlanStatus;
};

export type UpdateProductionPlanBody = {
  itemId?: number;
  itemCode?: string;
  itemName: string;
  bomCode?: string;
  quantity: number;
  startDate: string;
  endDate: string;
  status?: PlanStatus;
};
