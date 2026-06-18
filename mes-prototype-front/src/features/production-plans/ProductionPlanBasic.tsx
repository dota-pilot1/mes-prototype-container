"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  HelpCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { bomApi } from "@/entities/bom/api/bomApi";
import { productionPlanApi } from "@/entities/production-plan/api/productionPlanApi";
import type {
  CreateProductionPlanBody,
  PlanStatus,
  ProductionPlan,
  UpdateProductionPlanBody,
} from "@/entities/production-plan/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { InfoDialog } from "@/shared/ui/InfoDialog";
import { Select } from "@/shared/ui/Select";

type ProductOption = {
  itemId: number;
  itemCode: string;
  itemName: string;
  bomCode: string;
};

type FormState = {
  itemId: string;
  quantity: string;
  startDate: string;
  endDate: string;
  status: PlanStatus;
};

const today = new Date();

const emptyForm: FormState = {
  itemId: "",
  quantity: "100",
  startDate: toDateInput(today),
  endDate: toDateInput(addDays(today, 3)),
  status: "PLANNED",
};

export function ProductionPlanBasic() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ["production-plans"],
    queryFn: productionPlanApi.list,
  });

  const {
    data: boms = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["boms"],
    queryFn: bomApi.list,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["production-plans"] });

  const createPlanMutation = useMutation({
    mutationFn: productionPlanApi.create,
    onSuccess: invalidate,
    onError: (e) => toastError(e, "생산계획 등록에 실패했습니다."),
  });
  const updatePlanMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateProductionPlanBody }) =>
      productionPlanApi.update(id, body),
    onSuccess: invalidate,
    onError: (e) => toastError(e, "생산계획 수정에 실패했습니다."),
  });
  const deletePlanMutation = useMutation({
    mutationFn: (id: number) => productionPlanApi.remove(id),
    onSuccess: invalidate,
    onError: (e) => toastError(e, "생산계획 삭제에 실패했습니다."),
  });

  const productOptions = useMemo<ProductOption[]>(
    () =>
      boms
        .filter((bom) => bom.status === "APPROVED")
        .map((bom) => ({
          itemId: bom.productItem.id,
          itemCode: bom.productItem.itemCode,
          itemName: bom.productItem.itemName,
          bomCode: bom.bomCode,
        })),
    [boms]
  );

  const selectableProducts = productOptions.length > 0 ? productOptions : fallbackProducts;
  const selectedProduct =
    selectableProducts.find((product) => String(product.itemId) === form.itemId) ?? null;

  const chartDays = useMemo(() => makeChartDays(plans), [plans]);
  const totalQuantity = plans.reduce((sum, plan) => sum + plan.quantity, 0);
  const confirmedCount = plans.filter((plan) => plan.status !== "PLANNED").length;
  const activeCount = plans.filter((plan) => plan.status === "IN_PROGRESS").length;

  const resetForm = () => {
    setForm(emptyForm);
    setEditingPlanId(null);
  };

  const editPlan = (plan: ProductionPlan) => {
    setForm({
      itemId: String(plan.itemId),
      quantity: String(plan.quantity),
      startDate: plan.startDate,
      endDate: plan.endDate,
      status: plan.status,
    });
    setEditingPlanId(plan.id);
  };

  const deletePlan = (planId: number) => {
    deletePlanMutation.mutate(planId, {
      onSuccess: () => {
        if (editingPlanId === planId) {
          resetForm();
        }
        toast.success("생산계획이 삭제되었습니다.");
      },
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      toast.error("생산 품목을 선택하세요.");
      return;
    }

    const quantity = Number(form.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("계획 수량은 0보다 커야 합니다.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      toast.error("시작일과 종료일을 입력하세요.");
      return;
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error("종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }

    const planBody: UpdateProductionPlanBody = {
      itemId: selectedProduct.itemId,
      itemCode: selectedProduct.itemCode,
      itemName: selectedProduct.itemName,
      bomCode: selectedProduct.bomCode,
      quantity,
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
    };

    if (editingPlanId) {
      updatePlanMutation.mutate(
        { id: editingPlanId, body: planBody },
        {
          onSuccess: () => {
            resetForm();
            toast.success("생산계획이 수정되었습니다.");
          },
        }
      );
      return;
    }

    const nextNumber =
      Math.max(
        0,
        ...plans.map((plan) => Number(plan.code.replace(/\D/g, "")) || 0)
      ) + 1;
    const createBody: CreateProductionPlanBody = {
      code: `PP-${String(nextNumber).padStart(3, "0")}`,
      ...planBody,
    };
    createPlanMutation.mutate(createBody, {
      onSuccess: () => {
        setForm((value) => ({ ...emptyForm, itemId: value.itemId }));
        toast.success("생산계획이 등록되었습니다.");
      },
    });
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-6 py-5">
      <section className="mx-auto min-w-0 max-w-[1600px]">
        <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            생산계획 기본
          </h1>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
            >
              <HelpCircle className="h-4 w-4" />
              용어 설명
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              BOM 새로고침
            </button>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm"
        >
          <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(320px,1fr)_140px_150px_150px_140px_auto] lg:items-end">
            <Field label="생산 품목">
              <Select
                value={form.itemId}
                onValueChange={(itemId) => setForm((value) => ({ ...value, itemId }))}
                options={[
                  {
                    value: "",
                    label: isLoading ? "BOM 로딩 중" : "승인된 BOM 품목 선택",
                  },
                  ...selectableProducts.map((product) => ({
                    value: String(product.itemId),
                    label: `${product.itemCode} ${product.itemName} (${product.bomCode})`,
                  })),
                ]}
                disabled={isLoading}
                ariaLabel="생산 품목"
              />
            </Field>
            <Field label="계획 수량">
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
            <Field label="종료일">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((value) => ({ ...value, endDate: e.target.value }))
                }
                className={inputClassName}
              />
            </Field>
            <Field label="상태">
              <Select<PlanStatus>
                value={form.status}
                onValueChange={(status) => setForm((value) => ({ ...value, status }))}
                options={[
                  { value: "PLANNED", label: "계획" },
                  { value: "CONFIRMED", label: "확정" },
                  { value: "IN_PROGRESS", label: "진행" },
                  { value: "COMPLETED", label: "완료" },
                ]}
                ariaLabel="생산계획 상태"
              />
            </Field>
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex h-9 min-w-24 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                {editingPlanId ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editingPlanId ? "수정 저장" : "등록"}
              </button>
              {editingPlanId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                  취소
                </button>
              ) : null}
            </div>
          </div>
        </form>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <SummaryCard label="총 계획 수량" value={totalQuantity.toLocaleString()} />
          <SummaryCard label="확정/진행 계획" value={`${confirmedCount}건`} />
          <SummaryCard label="진행 중" value={`${activeCount}건`} />
        </div>

        <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(560px,0.9fr)_minmax(720px,1.1fr)]">
          <section className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">생산계획 목록</h2>
                <p className="text-sm text-muted-foreground">총 {plans.length}건</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-muted/70 text-left text-muted-foreground">
                  <tr>
                    <Th>계획 코드</Th>
                    <Th>품목</Th>
                    <Th align="right">수량</Th>
                    <Th>기간</Th>
                    <Th>상태</Th>
                    <Th align="right" className="sticky right-0 bg-muted/70">
                      관리
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr
                      key={plan.id}
                      className={`border-t border-border ${editingPlanId === plan.id ? "bg-blue-50/70" : ""}`}
                    >
                      <Td className="font-medium">{plan.code}</Td>
                      <Td>
                        <div className="font-medium text-foreground">{plan.itemName}</div>
                        <div className="text-xs text-muted-foreground">
                          {plan.itemCode} / {plan.bomCode}
                        </div>
                      </Td>
                      <Td align="right">{plan.quantity.toLocaleString()}</Td>
                      <Td>{formatPeriod(plan.startDate, plan.endDate)}</Td>
                      <Td>
                        <StatusBadge status={plan.status} />
                      </Td>
                      <Td align="right" className="sticky right-0 bg-card shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.35)]">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => editPlan(plan)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent"
                            aria-label={`${plan.code} 수정`}
                            title="수정"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePlan(plan.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-red-600 hover:bg-red-50"
                            aria-label={`${plan.code} 삭제`}
                            title="삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">생산 일정 간트</h2>
                <p className="text-sm text-muted-foreground">품목 단위 생산 기간</p>
              </div>
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
              <div
                className="grid min-w-[880px]"
                style={{
                  gridTemplateColumns: `180px repeat(${chartDays.length}, minmax(34px, 1fr))`,
                }}
              >
                <div className="border-b border-r border-border bg-muted/70 px-3 py-2 text-sm font-semibold">
                  생산계획
                </div>
                {chartDays.map((day) => (
                  <div
                    key={day}
                    className="border-b border-r border-border bg-muted/70 px-1 py-2 text-center text-xs text-muted-foreground"
                  >
                    <div>{formatDay(day)}</div>
                    <div className="mt-0.5">{formatWeekday(day)}</div>
                  </div>
                ))}

                {plans.map((plan) => (
                  <GanttRow key={plan.id} plan={plan} days={chartDays} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>

      <InfoDialog
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        title="생산계획 용어"
      >
        <dl className="grid gap-4 text-sm">
          <Term
            title="생산계획 기본"
            description="완제품 또는 반제품을 언제 몇 개 생산할지 등록하는 품목 단위 계획입니다."
          />
          <Term
            title="간트"
            description="계획 기간을 날짜 축에 막대로 표시해 생산 일정 겹침과 흐름을 빠르게 보는 차트입니다."
          />
          <Term
            title="WBS"
            description="작업을 공정, 담당자, 선후행 관계 단위로 더 잘게 쪼갠 일정 구조입니다. 작업지시 이후 단계에 적합합니다."
          />
        </dl>
      </InfoDialog>
    </main>
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

function GanttRow({ plan, days }: { plan: ProductionPlan; days: string[] }) {
  return (
    <>
      <div className="border-b border-r border-border px-3 py-3">
        <div className="truncate text-sm font-semibold text-foreground">{plan.itemName}</div>
        <div className="truncate text-xs text-muted-foreground">
          {plan.code} / {plan.quantity.toLocaleString()}개
        </div>
      </div>
      {days.map((day) => {
        const active = day >= plan.startDate && day <= plan.endDate;
        return (
          <div
            key={`${plan.id}-${day}`}
            className="flex min-h-14 items-center border-b border-r border-border px-0.5"
          >
            {active ? (
              <div
                className={`h-6 w-full rounded-sm ${statusBarClassName[plan.status]}`}
                title={`${plan.itemName} ${formatPeriod(plan.startDate, plan.endDate)}`}
              />
            ) : null}
          </div>
        );
      })}
    </>
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

function StatusBadge({ status }: { status: PlanStatus }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-2.5 text-xs font-semibold ${statusBadgeClassName[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}

function makeChartDays(plans: ProductionPlan[]) {
  if (plans.length === 0) return [toDateInput(today)];

  const start = new Date(
    Math.min(...plans.map((plan) => new Date(plan.startDate).getTime()))
  );
  const end = new Date(Math.max(...plans.map((plan) => new Date(plan.endDate).getTime())));
  const days: string[] = [];
  let cursor = start;

  while (cursor <= end) {
    days.push(toDateInput(cursor));
    cursor = addDays(cursor, 1);
  }

  return days;
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

function formatDay(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function formatWeekday(value: string) {
  return ["일", "월", "화", "수", "목", "금", "토"][new Date(value).getDay()];
}

const fallbackProducts: ProductOption[] = [
  { itemId: 1, itemCode: "ITM-001", itemName: "태스크 체어", bomCode: "BOM-001" },
  { itemId: 2, itemCode: "ITM-002", itemName: "회의 테이블", bomCode: "BOM-002" },
];

const statusLabel: Record<PlanStatus, string> = {
  PLANNED: "계획",
  CONFIRMED: "확정",
  IN_PROGRESS: "진행",
  COMPLETED: "완료",
};

const statusBadgeClassName: Record<PlanStatus, string> = {
  PLANNED: "bg-slate-100 text-slate-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

const statusBarClassName: Record<PlanStatus, string> = {
  PLANNED: "bg-slate-400",
  CONFIRMED: "bg-blue-500",
  IN_PROGRESS: "bg-amber-500",
  COMPLETED: "bg-emerald-500",
};

const inputClassName =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none transition-colors hover:bg-accent/35 focus:border-ring focus:ring-2 focus:ring-ring";
