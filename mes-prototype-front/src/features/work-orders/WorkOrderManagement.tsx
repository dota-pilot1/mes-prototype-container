"use client";

import { useMemo, useState } from "react";
import {
  ClipboardList,
  HelpCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "@/shared/lib/toast";
import { InfoDialog } from "@/shared/ui/InfoDialog";
import { Select } from "@/shared/ui/Select";

type WorkOrderStatus = "READY" | "IN_PROGRESS" | "COMPLETED" | "HOLD";
type ProcessStatus = WorkOrderStatus;

type SourcePlan = {
  id: number;
  code: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  startDate: string;
  endDate: string;
};

type WorkOrder = {
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

type WorkOrderProcess = {
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

type FormState = {
  planId: string;
  quantity: string;
  startDate: string;
  dueDate: string;
  workstation: string;
  assignee: string;
  status: WorkOrderStatus;
};

type ProcessFormState = {
  processName: string;
  workstation: string;
  assignee: string;
  startDate: string;
  dueDate: string;
  progress: string;
  status: ProcessStatus;
};

const today = new Date();

const sourcePlans: SourcePlan[] = [
  {
    id: 1,
    code: "PP-001",
    itemCode: "ITM-001",
    itemName: "의자",
    quantity: 200,
    startDate: toDateInput(addDays(today, 1)),
    endDate: toDateInput(addDays(today, 4)),
  },
  {
    id: 2,
    code: "PP-002",
    itemCode: "ITM-002",
    itemName: "책상",
    quantity: 120,
    startDate: toDateInput(addDays(today, 3)),
    endDate: toDateInput(addDays(today, 8)),
  },
  {
    id: 3,
    code: "PP-003",
    itemCode: "ITM-001",
    itemName: "의자",
    quantity: 80,
    startDate: toDateInput(addDays(today, 9)),
    endDate: toDateInput(addDays(today, 11)),
  },
];

const initialOrders: WorkOrder[] = [
  {
    id: 1,
    code: "WO-001",
    planCode: "PP-001",
    itemCode: "ITM-001",
    itemName: "의자",
    quantity: 200,
    startDate: toDateInput(addDays(today, 1)),
    dueDate: toDateInput(addDays(today, 4)),
    workstation: "조립 1라인",
    assignee: "김작업",
    status: "READY",
  },
  {
    id: 2,
    code: "WO-002",
    planCode: "PP-002",
    itemCode: "ITM-002",
    itemName: "책상",
    quantity: 120,
    startDate: toDateInput(addDays(today, 3)),
    dueDate: toDateInput(addDays(today, 8)),
    workstation: "조립 2라인",
    assignee: "박작업",
    status: "IN_PROGRESS",
  },
  {
    id: 3,
    code: "WO-003",
    planCode: "PP-003",
    itemCode: "ITM-001",
    itemName: "의자",
    quantity: 80,
    startDate: toDateInput(addDays(today, 9)),
    dueDate: toDateInput(addDays(today, 11)),
    workstation: "조립 1라인",
    assignee: "이작업",
    status: "HOLD",
  },
];

const initialProcesses: WorkOrderProcess[] = [
  {
    id: 1,
    orderId: 1,
    sequence: 1,
    processCode: "PROC-001",
    processName: "자재 준비",
    workstation: "자재 창고",
    assignee: "김작업",
    startDate: toDateInput(addDays(today, 1)),
    dueDate: toDateInput(addDays(today, 1)),
    progress: 100,
    status: "COMPLETED",
  },
  {
    id: 2,
    orderId: 1,
    sequence: 2,
    processCode: "PROC-002",
    processName: "조립",
    workstation: "조립 1라인",
    assignee: "김작업",
    startDate: toDateInput(addDays(today, 2)),
    dueDate: toDateInput(addDays(today, 3)),
    progress: 60,
    status: "IN_PROGRESS",
  },
  {
    id: 3,
    orderId: 1,
    sequence: 3,
    processCode: "PROC-003",
    processName: "검사",
    workstation: "검사실",
    assignee: "최검사",
    startDate: toDateInput(addDays(today, 4)),
    dueDate: toDateInput(addDays(today, 4)),
    progress: 0,
    status: "READY",
  },
  {
    id: 4,
    orderId: 2,
    sequence: 1,
    processCode: "PROC-004",
    processName: "자재 준비",
    workstation: "자재 창고",
    assignee: "박작업",
    startDate: toDateInput(addDays(today, 3)),
    dueDate: toDateInput(addDays(today, 3)),
    progress: 100,
    status: "COMPLETED",
  },
  {
    id: 5,
    orderId: 2,
    sequence: 2,
    processCode: "PROC-005",
    processName: "상판 조립",
    workstation: "조립 2라인",
    assignee: "박작업",
    startDate: toDateInput(addDays(today, 4)),
    dueDate: toDateInput(addDays(today, 6)),
    progress: 45,
    status: "IN_PROGRESS",
  },
  {
    id: 6,
    orderId: 2,
    sequence: 3,
    processCode: "PROC-006",
    processName: "검사",
    workstation: "검사실",
    assignee: "최검사",
    startDate: toDateInput(addDays(today, 7)),
    dueDate: toDateInput(addDays(today, 8)),
    progress: 0,
    status: "READY",
  },
  {
    id: 7,
    orderId: 3,
    sequence: 1,
    processCode: "PROC-007",
    processName: "자재 대기",
    workstation: "자재 창고",
    assignee: "이작업",
    startDate: toDateInput(addDays(today, 9)),
    dueDate: toDateInput(addDays(today, 9)),
    progress: 0,
    status: "HOLD",
  },
  {
    id: 8,
    orderId: 3,
    sequence: 2,
    processCode: "PROC-008",
    processName: "조립",
    workstation: "조립 1라인",
    assignee: "이작업",
    startDate: toDateInput(addDays(today, 10)),
    dueDate: toDateInput(addDays(today, 11)),
    progress: 0,
    status: "READY",
  },
];

const emptyForm: FormState = {
  planId: "",
  quantity: "100",
  startDate: toDateInput(today),
  dueDate: toDateInput(addDays(today, 3)),
  workstation: "조립 1라인",
  assignee: "",
  status: "READY",
};

const emptyProcessForm: ProcessFormState = {
  processName: "",
  workstation: "조립 1라인",
  assignee: "",
  startDate: toDateInput(today),
  dueDate: toDateInput(addDays(today, 1)),
  progress: "0",
  status: "READY",
};

export function WorkOrderManagement() {
  const [orders, setOrders] = useState<WorkOrder[]>(initialOrders);
  const [processes, setProcesses] = useState<WorkOrderProcess[]>(initialProcesses);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [processForm, setProcessForm] = useState<ProcessFormState>(emptyProcessForm);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [editingProcessId, setEditingProcessId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(initialOrders[0]?.id ?? null);
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [processFormOpen, setProcessFormOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const selectedPlan = sourcePlans.find((plan) => String(plan.id) === form.planId) ?? null;
  const readyCount = orders.filter((order) => order.status === "READY").length;
  const progressCount = orders.filter((order) => order.status === "IN_PROGRESS").length;
  const completedCount = orders.filter((order) => order.status === "COMPLETED").length;
  const holdCount = orders.filter((order) => order.status === "HOLD").length;
  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null;
  const selectedProcesses = useMemo(
    () =>
      selectedOrder
        ? processes
            .filter((process) => process.orderId === selectedOrder.id)
            .sort((a, b) => a.sequence - b.sequence)
        : [],
    [processes, selectedOrder]
  );

  const planOptions = useMemo(
    () =>
      sourcePlans.map((plan) => ({
        value: String(plan.id),
        label: `${plan.code} ${plan.itemName} ${plan.quantity.toLocaleString()}개`,
      })),
    []
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingOrderId(null);
  };

  const resetProcessForm = () => {
    setProcessForm({
      ...emptyProcessForm,
      startDate: selectedOrder?.startDate ?? emptyProcessForm.startDate,
      dueDate: selectedOrder?.dueDate ?? emptyProcessForm.dueDate,
      workstation: selectedOrder?.workstation ?? emptyProcessForm.workstation,
      assignee: selectedOrder?.assignee === "미지정" ? "" : selectedOrder?.assignee ?? "",
    });
    setEditingProcessId(null);
  };

  const selectPlan = (planId: string) => {
    const plan = sourcePlans.find((value) => String(value.id) === planId);
    setForm((value) => ({
      ...value,
      planId,
      quantity: plan ? String(plan.quantity) : value.quantity,
      startDate: plan?.startDate ?? value.startDate,
      dueDate: plan?.endDate ?? value.dueDate,
    }));
  };

  const editOrder = (order: WorkOrder) => {
    const plan = sourcePlans.find((value) => value.code === order.planCode);
    setForm({
      planId: plan ? String(plan.id) : "",
      quantity: String(order.quantity),
      startDate: order.startDate,
      dueDate: order.dueDate,
      workstation: order.workstation,
      assignee: order.assignee,
      status: order.status,
    });
    setEditingOrderId(order.id);
    setOrderFormOpen(true);
  };

  const deleteOrder = (orderId: number) => {
    const nextSelectedOrder = orders.find((order) => order.id !== orderId) ?? null;
    setOrders((value) => value.filter((order) => order.id !== orderId));
    setProcesses((value) => value.filter((process) => process.orderId !== orderId));
    if (editingOrderId === orderId) resetForm();
    if (selectedOrderId === orderId) {
      setSelectedOrderId(nextSelectedOrder?.id ?? null);
      setEditingProcessId(null);
      setProcessFormOpen(false);
    }
    toast.success("작업지시가 삭제되었습니다.");
  };

  const setOrderStatus = (orderId: number, status: WorkOrderStatus) => {
    setOrders((value) =>
      value.map((order) => (order.id === orderId ? { ...order, status } : order))
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan) {
      toast.error("생산계획을 선택하세요.");
      return;
    }

    const quantity = Number(form.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("지시 수량은 0보다 커야 합니다.");
      return;
    }

    if (new Date(form.dueDate) < new Date(form.startDate)) {
      toast.error("완료예정일은 시작일보다 빠를 수 없습니다.");
      return;
    }

    const nextOrder = {
      planCode: selectedPlan.code,
      itemCode: selectedPlan.itemCode,
      itemName: selectedPlan.itemName,
      quantity,
      startDate: form.startDate,
      dueDate: form.dueDate,
      workstation: form.workstation.trim() || "미지정",
      assignee: form.assignee.trim() || "미지정",
      status: form.status,
    };

    if (editingOrderId) {
      setOrders((value) =>
        value.map((order) =>
          order.id === editingOrderId ? { ...order, ...nextOrder } : order
        )
      );
      resetForm();
      setOrderFormOpen(false);
      toast.success("작업지시가 수정되었습니다.");
      return;
    }

    const id = Math.max(0, ...orders.map((order) => order.id)) + 1;
    const createdOrder = {
      id,
      code: `WO-${String(id).padStart(3, "0")}`,
      ...nextOrder,
    };
    setOrders((value) => [
      createdOrder,
      ...value,
    ]);
    setProcesses((value) => [
      ...value,
      ...makeDefaultProcesses({
        orderId: id,
        startDate: createdOrder.startDate,
        dueDate: createdOrder.dueDate,
        workstation: createdOrder.workstation,
        assignee: createdOrder.assignee,
        nextProcessId: Math.max(0, ...value.map((process) => process.id)) + 1,
      }),
    ]);
    setSelectedOrderId(id);
    setProcessFormOpen(false);
    resetForm();
    setOrderFormOpen(false);
    toast.success("작업지시가 생성되었습니다.");
  };

  const editProcess = (process: WorkOrderProcess) => {
    setProcessForm({
      processName: process.processName,
      workstation: process.workstation,
      assignee: process.assignee === "미지정" ? "" : process.assignee,
      startDate: process.startDate,
      dueDate: process.dueDate,
      progress: String(process.progress),
      status: process.status,
    });
    setEditingProcessId(process.id);
    setProcessFormOpen(true);
  };

  const deleteProcess = (processId: number) => {
    setProcesses((value) => value.filter((process) => process.id !== processId));
    if (editingProcessId === processId) {
      resetProcessForm();
      setProcessFormOpen(false);
    }
    toast.success("공정이 삭제되었습니다.");
  };

  const setProcessStatus = (processId: number, status: ProcessStatus) => {
    setProcesses((value) =>
      value.map((process) =>
        process.id === processId
          ? {
              ...process,
              status,
              progress:
                status === "COMPLETED"
                  ? 100
                  : status === "READY" || status === "HOLD"
                    ? 0
                    : process.progress,
            }
          : process
      )
    );
  };

  const submitProcess = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrder) {
      toast.error("공정을 추가할 작업지시를 선택하세요.");
      return;
    }

    const progress = Number(processForm.progress || 0);
    if (!processForm.processName.trim()) {
      toast.error("공정명을 입력하세요.");
      return;
    }
    if (new Date(processForm.dueDate) < new Date(processForm.startDate)) {
      toast.error("완료예정일은 시작일보다 빠를 수 없습니다.");
      return;
    }
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      toast.error("진행률은 0부터 100 사이여야 합니다.");
      return;
    }

    if (editingProcessId) {
      setProcesses((value) =>
        value.map((process) =>
          process.id === editingProcessId
            ? {
                ...process,
                processName: processForm.processName.trim(),
                workstation: processForm.workstation.trim() || "미지정",
                assignee: processForm.assignee.trim() || "미지정",
                startDate: processForm.startDate,
                dueDate: processForm.dueDate,
                progress,
                status: processForm.status,
              }
            : process
        )
      );
      resetProcessForm();
      setProcessFormOpen(false);
      toast.success("공정이 수정되었습니다.");
      return;
    }

    const id = Math.max(0, ...processes.map((process) => process.id)) + 1;
    const sequence = Math.max(0, ...selectedProcesses.map((process) => process.sequence)) + 1;
    setProcesses((value) => [
      ...value,
      {
        id,
        orderId: selectedOrder.id,
        sequence,
        processCode: `PROC-${String(id).padStart(3, "0")}`,
        processName: processForm.processName.trim(),
        workstation: processForm.workstation.trim() || "미지정",
        assignee: processForm.assignee.trim() || "미지정",
        startDate: processForm.startDate,
        dueDate: processForm.dueDate,
        progress,
        status: processForm.status,
      },
    ]);
    resetProcessForm();
    setProcessFormOpen(false);
    toast.success("공정이 추가되었습니다.");
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-6 py-5">
      <section className="mx-auto min-w-0 max-w-[1600px]">
        <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            작업지시 관리
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (orderFormOpen) {
                  resetForm();
                  setOrderFormOpen(false);
                  return;
                }
                resetForm();
                setOrderFormOpen(true);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {orderFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {orderFormOpen ? "폼 닫기" : "작업지시 추가"}
            </button>
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
            >
              <HelpCircle className="h-4 w-4" />
              용어 설명
            </button>
          </div>
        </div>

        {orderFormOpen ? (
          <form
            onSubmit={submit}
            className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {editingOrderId ? "작업지시 수정" : "작업지시 추가"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  확정 생산계획을 선택해 현장 실행 지시로 전환합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setOrderFormOpen(false);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent"
                aria-label="작업지시 폼 닫기"
                title="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(300px,1fr)_120px_150px_150px_160px_140px_130px_auto] lg:items-end">
            <Field label="생산계획">
              <Select
                value={form.planId}
                onValueChange={selectPlan}
                options={[
                  { value: "", label: "확정 생산계획 선택" },
                  ...planOptions,
                ]}
                ariaLabel="생산계획"
              />
            </Field>
            <Field label="지시 수량">
              <input
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={(e) =>
                  setForm((value) => ({ ...value, quantity: e.target.value }))
                }
                className={inputClassName}
              />
            </Field>
            <Field label="시작일">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((value) => ({ ...value, startDate: e.target.value }))
                }
                className={inputClassName}
              />
            </Field>
            <Field label="완료예정일">
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((value) => ({ ...value, dueDate: e.target.value }))
                }
                className={inputClassName}
              />
            </Field>
            <Field label="작업장">
              <input
                value={form.workstation}
                onChange={(e) =>
                  setForm((value) => ({ ...value, workstation: e.target.value }))
                }
                className={inputClassName}
              />
            </Field>
            <Field label="담당자">
              <input
                value={form.assignee}
                onChange={(e) =>
                  setForm((value) => ({ ...value, assignee: e.target.value }))
                }
                placeholder="담당자"
                className={inputClassName}
              />
            </Field>
            <Field label="상태">
              <Select<WorkOrderStatus>
                value={form.status}
                onValueChange={(status) => setForm((value) => ({ ...value, status }))}
                options={[
                  { value: "READY", label: "대기" },
                  { value: "IN_PROGRESS", label: "진행" },
                  { value: "COMPLETED", label: "완료" },
                  { value: "HOLD", label: "보류" },
                ]}
                ariaLabel="작업지시 상태"
              />
            </Field>
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex h-9 min-w-24 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                {editingOrderId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingOrderId ? "수정 저장" : "생성"}
              </button>
              {editingOrderId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
          </form>
        ) : null}

        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <SummaryCard label="대기" value={`${readyCount}건`} />
          <SummaryCard label="진행 중" value={`${progressCount}건`} />
          <SummaryCard label="완료" value={`${completedCount}건`} />
          <SummaryCard label="보류" value={`${holdCount}건`} />
        </div>

        <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.65fr)]">
          <section className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">작업지시 목록</h2>
                <p className="text-sm text-muted-foreground">총 {orders.length}건</p>
              </div>
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[1040px] text-sm">
                <thead className="bg-muted/70 text-left text-muted-foreground">
                  <tr>
                    <Th>작업지시</Th>
                    <Th>생산계획</Th>
                    <Th>품목</Th>
                    <Th align="right">수량</Th>
                    <Th>기간</Th>
                    <Th>작업장</Th>
                    <Th>담당자</Th>
                    <Th>상태</Th>
                    <Th align="right" className="sticky right-0 bg-muted/70">
                      관리
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const isSelected = selectedOrder?.id === order.id;
                    const isEditing = editingOrderId === order.id;
                    const rowBackground = isEditing
                      ? "bg-blue-100/80"
                      : isSelected
                        ? "bg-blue-50/80"
                        : "bg-card";

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`cursor-pointer border-t border-border ${rowBackground}`}
                      >
                        <Td className="font-semibold">{order.code}</Td>
                        <Td>{order.planCode}</Td>
                        <Td>
                          <div className="font-medium text-foreground">{order.itemName}</div>
                          <div className="text-xs text-muted-foreground">{order.itemCode}</div>
                        </Td>
                        <Td align="right">{order.quantity.toLocaleString()}</Td>
                        <Td>{formatPeriod(order.startDate, order.dueDate)}</Td>
                        <Td>{order.workstation}</Td>
                        <Td>{order.assignee}</Td>
                        <Td className="min-w-64">
                          <StatusToggle
                            value={order.status}
                            onValueChange={(status) => setOrderStatus(order.id, status)}
                          />
                        </Td>
                        <Td
                          align="right"
                          className={`sticky right-0 ${rowBackground} shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.35)]`}
                        >
                          <div className="inline-flex items-center gap-1">
                            <IconButton
                              label={`${order.code} 수정`}
                              title="수정"
                              onClick={() => editOrder(order)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </IconButton>
                            <IconButton
                              label={`${order.code} 삭제`}
                              title="삭제"
                              onClick={() => deleteOrder(order.id)}
                              danger
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </IconButton>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-foreground">선택 작업지시 상세 공정</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedOrder
                    ? `${selectedOrder.code} / ${selectedOrder.itemName} / ${selectedProcesses.length}개 공정`
                    : "작업지시를 선택하세요."}
                </p>
              </div>
              <button
                type="button"
                disabled={!selectedOrder}
                onClick={() => {
                  if (processFormOpen) {
                    resetProcessForm();
                    setProcessFormOpen(false);
                    return;
                  }
                  resetProcessForm();
                  setProcessFormOpen(true);
                }}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {processFormOpen ? "폼 닫기" : "공정 추가"}
              </button>
            </div>

            {processFormOpen ? (
            <form
              onSubmit={submitProcess}
              className="grid min-w-0 gap-3 rounded-md border border-border bg-muted/25 p-3 sm:grid-cols-2"
            >
              <Field label="공정명">
                <input
                  value={processForm.processName}
                  onChange={(e) =>
                    setProcessForm((value) => ({ ...value, processName: e.target.value }))
                  }
                  placeholder="예: 조립"
                  className={inputClassName}
                />
              </Field>
              <Field label="작업장">
                <input
                  value={processForm.workstation}
                  onChange={(e) =>
                    setProcessForm((value) => ({ ...value, workstation: e.target.value }))
                  }
                  className={inputClassName}
                />
              </Field>
              <Field label="담당자">
                <input
                  value={processForm.assignee}
                  onChange={(e) =>
                    setProcessForm((value) => ({ ...value, assignee: e.target.value }))
                  }
                  placeholder="담당자"
                  className={inputClassName}
                />
              </Field>
              <Field label="진행률">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={processForm.progress}
                  onChange={(e) =>
                    setProcessForm((value) => ({ ...value, progress: e.target.value }))
                  }
                  className={inputClassName}
                />
              </Field>
              <Field label="시작일">
                <input
                  type="date"
                  value={processForm.startDate}
                  onChange={(e) =>
                    setProcessForm((value) => ({ ...value, startDate: e.target.value }))
                  }
                  className={inputClassName}
                />
              </Field>
              <Field label="완료예정일">
                <input
                  type="date"
                  value={processForm.dueDate}
                  onChange={(e) =>
                    setProcessForm((value) => ({ ...value, dueDate: e.target.value }))
                  }
                  className={inputClassName}
                />
              </Field>
              <Field label="상태">
                <Select<ProcessStatus>
                  value={processForm.status}
                  onValueChange={(status) =>
                    setProcessForm((value) => ({ ...value, status }))
                  }
                  options={statusOrder.map((status) => ({
                    value: status,
                    label: statusLabel[status],
                  }))}
                  ariaLabel="공정 상태"
                />
              </Field>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={!selectedOrder}
                  className="inline-flex h-9 min-w-24 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editingProcessId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingProcessId ? "수정 저장" : "공정 추가"}
                </button>
                {editingProcessId ? (
                  <button
                    type="button"
                    onClick={() => {
                      resetProcessForm();
                      setProcessFormOpen(false);
                    }}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </form>
            ) : null}

            <div className="mt-3 grid gap-2">
              {selectedProcesses.map((process) => (
                <article
                  key={process.id}
                  className={`rounded-md border border-border bg-background p-3 ${
                    editingProcessId === process.id ? "ring-2 ring-blue-200" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">
                          #{process.sequence}
                        </span>
                        <h3 className="truncate font-semibold text-foreground">
                          {process.processName}
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {process.processCode} / {process.workstation} / {process.assignee}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <IconButton
                        label={`${process.processCode} 수정`}
                        title="수정"
                        onClick={() => editProcess(process)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton
                        label={`${process.processCode} 삭제`}
                        title="삭제"
                        onClick={() => deleteProcess(process.id)}
                        danger
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconButton>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {formatPeriod(process.startDate, process.dueDate)}
                    </span>
                    <div className="flex min-w-36 flex-1 items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${process.progress}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-xs text-muted-foreground">
                        {process.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <StatusToggle
                      value={process.status}
                      onValueChange={(status) => setProcessStatus(process.id, status)}
                    />
                  </div>
                </article>
              ))}
              {selectedProcesses.length === 0 ? (
                <div className="rounded-md border border-dashed border-border px-3 py-10 text-center text-sm text-muted-foreground">
                  등록된 상세 공정이 없습니다.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </section>

      <InfoDialog open={termsOpen} onClose={() => setTermsOpen(false)} title="작업지시 용어">
        <dl className="grid gap-4 text-sm">
          <Term
            title="작업지시"
            description="확정된 생산계획을 현장 작업자가 실행할 수 있도록 작업장, 담당자, 기간, 수량을 지정한 실행 지시입니다."
          />
          <Term
            title="생산계획과 차이"
            description="생산계획은 무엇을 언제 만들지 정하는 계획이고, 작업지시는 그 계획을 실제 현장 작업으로 내리는 실행 단위입니다."
          />
          <Term
            title="상태"
            description="대기, 진행, 완료, 보류 상태로 작업 흐름을 관리합니다."
          />
          <Term
            title="상세 공정"
            description="작업지시를 자재 준비, 조립, 검사 같은 세부 실행 단계로 나눈 라인입니다. WBS 간트의 기반 데이터가 됩니다."
          />
        </dl>
      </InfoDialog>
    </main>
  );
}

function IconButton({
  label,
  title,
  danger = false,
  onClick,
  children,
}: {
  label: string;
  title: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent ${
        danger ? "text-red-600 hover:bg-red-50" : ""
      }`}
    >
      {children}
    </button>
  );
}

function StatusToggle({
  value,
  onValueChange,
}: {
  value: WorkOrderStatus;
  onValueChange: (status: WorkOrderStatus) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-muted/50 p-0.5">
      {statusOrder.map((status) => {
        const active = status === value;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onValueChange(status)}
            className={`h-7 min-w-12 rounded px-2 text-xs font-semibold transition-colors ${
              active
                ? statusToggleActiveClassName[status]
                : "text-muted-foreground hover:bg-background hover:text-foreground"
            }`}
            aria-pressed={active}
          >
            {statusLabel[status]}
          </button>
        );
      })}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

function Term({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <dt className="font-semibold text-foreground">{title}</dt>
      <dd className="mt-1 leading-6 text-muted-foreground">{description}</dd>
    </div>
  );
}

function Th({
  align = "left",
  className = "",
  children,
}: {
  align?: "left" | "right";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <th
      className={`px-3 py-2 font-semibold ${align === "right" ? "text-right" : ""} ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  align = "left",
  className = "",
  children,
}: {
  align?: "left" | "right";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <td
      className={`px-3 py-3 text-foreground ${align === "right" ? "text-right" : ""} ${className}`}
    >
      {children}
    </td>
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatPeriod(start: string, end: string) {
  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}

function formatShortDate(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

const statusLabel: Record<WorkOrderStatus, string> = {
  READY: "대기",
  IN_PROGRESS: "진행",
  COMPLETED: "완료",
  HOLD: "보류",
};

const statusOrder: WorkOrderStatus[] = ["READY", "IN_PROGRESS", "COMPLETED", "HOLD"];

const statusToggleActiveClassName: Record<WorkOrderStatus, string> = {
  READY: "bg-slate-700 text-white",
  IN_PROGRESS: "bg-amber-500 text-white",
  COMPLETED: "bg-emerald-600 text-white",
  HOLD: "bg-red-600 text-white",
};

const inputClassName =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none transition-colors hover:bg-accent/35 focus:border-ring focus:ring-2 focus:ring-ring";

function makeDefaultProcesses({
  orderId,
  startDate,
  dueDate,
  workstation,
  assignee,
  nextProcessId,
}: {
  orderId: number;
  startDate: string;
  dueDate: string;
  workstation: string;
  assignee: string;
  nextProcessId: number;
}): WorkOrderProcess[] {
  return [
    {
      id: nextProcessId,
      orderId,
      sequence: 1,
      processCode: `PROC-${String(nextProcessId).padStart(3, "0")}`,
      processName: "자재 준비",
      workstation: "자재 창고",
      assignee,
      startDate,
      dueDate: startDate,
      progress: 0,
      status: "READY",
    },
    {
      id: nextProcessId + 1,
      orderId,
      sequence: 2,
      processCode: `PROC-${String(nextProcessId + 1).padStart(3, "0")}`,
      processName: "조립",
      workstation,
      assignee,
      startDate,
      dueDate,
      progress: 0,
      status: "READY",
    },
    {
      id: nextProcessId + 2,
      orderId,
      sequence: 3,
      processCode: `PROC-${String(nextProcessId + 2).padStart(3, "0")}`,
      processName: "검사",
      workstation: "검사실",
      assignee: "미지정",
      startDate: dueDate,
      dueDate,
      progress: 0,
      status: "READY",
    },
  ];
}
