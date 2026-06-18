export type WorkOrderStatus = "READY" | "IN_PROGRESS" | "COMPLETED" | "HOLD";

export type ProcessStatus = WorkOrderStatus;

export type SourcePlan = {
  id: number;
  code: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  startDate: string;
  endDate: string;
};

export type WorkOrder = {
  id: number;
  code: string;
  planCode: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  startDate: string;
  dueDate: string;
  workstation: string;
  assignee: string;
  status: WorkOrderStatus;
};

export type WorkOrderProcess = {
  id: number;
  orderId: number;
  sequence: number;
  processCode: string;
  processName: string;
  workstation: string;
  assignee: string;
  startDate: string;
  dueDate: string;
  progress: number;
  status: ProcessStatus;
};

// 백엔드 GET /api/work-orders 응답 — 작업지시 안에 공정이 중첩되어 옵니다.
export type WorkOrderDto = WorkOrder & { processes: WorkOrderProcess[] };

export type CreateWorkOrderBody = {
  code: string;
  planCode?: string;
  itemCode?: string;
  itemName: string;
  quantity: number;
  startDate: string;
  dueDate: string;
  workstation?: string;
  assignee?: string;
  status?: WorkOrderStatus;
};

export type UpdateWorkOrderBody = {
  planCode?: string;
  itemCode?: string;
  itemName: string;
  quantity: number;
  startDate: string;
  dueDate: string;
  workstation?: string;
  assignee?: string;
  status?: WorkOrderStatus;
};

export type WorkOrderProcessBody = {
  sequence?: number;
  processCode?: string;
  processName: string;
  workstation?: string;
  assignee?: string;
  startDate: string;
  dueDate: string;
  progress?: number;
  status?: WorkOrderStatus;
};
