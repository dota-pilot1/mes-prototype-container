import { api } from "@/shared/api/axios";
import type {
  CreateWorkOrderBody,
  UpdateWorkOrderBody,
  WorkOrder,
  WorkOrderDto,
  WorkOrderProcess,
  WorkOrderProcessBody,
} from "../model/types";

export const workOrderApi = {
  list: () =>
    api.get<WorkOrderDto[]>("/api/work-orders").then((r) => r.data),

  create: (body: CreateWorkOrderBody) =>
    api.post<WorkOrderDto>("/api/work-orders", body).then((r) => r.data),

  update: (id: number, body: UpdateWorkOrderBody) =>
    api.put<WorkOrderDto>(`/api/work-orders/${id}`, body).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/api/work-orders/${id}`).then(() => undefined),

  addProcess: (orderId: number, body: WorkOrderProcessBody) =>
    api
      .post<WorkOrderDto>(`/api/work-orders/${orderId}/processes`, body)
      .then((r) => r.data),

  updateProcess: (orderId: number, processId: number, body: WorkOrderProcessBody) =>
    api
      .put<WorkOrderDto>(`/api/work-orders/${orderId}/processes/${processId}`, body)
      .then((r) => r.data),

  removeProcess: (orderId: number, processId: number) =>
    api
      .delete<WorkOrderDto>(`/api/work-orders/${orderId}/processes/${processId}`)
      .then((r) => r.data),
};

// 중첩 응답을 화면이 쓰는 평면 구조({orders, processes})로 분리합니다.
export function splitWorkOrders(dtos: WorkOrderDto[]): {
  orders: WorkOrder[];
  processes: WorkOrderProcess[];
} {
  const orders: WorkOrder[] = [];
  const processes: WorkOrderProcess[] = [];
  for (const dto of dtos) {
    const { processes: dtoProcesses, ...order } = dto;
    orders.push(order);
    processes.push(...dtoProcesses);
  }
  return { orders, processes };
}
