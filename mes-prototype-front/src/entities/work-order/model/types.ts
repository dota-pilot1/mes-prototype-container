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
