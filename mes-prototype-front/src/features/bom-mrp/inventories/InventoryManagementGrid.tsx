"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
} from "ag-grid-community";
import { HelpCircle, Plus, RefreshCw } from "lucide-react";
import { inventoryApi } from "@/entities/bom/api/inventoryApi";
import { itemApi } from "@/entities/bom/api/itemApi";
import type { CreateInventoryBody, Inventory } from "@/entities/bom/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { InfoDialog } from "@/shared/ui/InfoDialog";
import { Select } from "@/shared/ui/Select";

ModuleRegistry.registerModules([AllCommunityModule]);

type InventoryForm = {
  itemId: string;
  onHandQty: string;
  reservedQty: string;
};

const emptyForm: InventoryForm = {
  itemId: "",
  onHandQty: "0",
  reservedQty: "0",
};

export function InventoryManagementGrid() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InventoryForm>(emptyForm);
  const [quickFilter, setQuickFilter] = useState("");
  const [termsOpen, setTermsOpen] = useState(false);

  const {
    data: inventories = [],
    isLoading: inventoriesLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["bom-inventories"],
    queryFn: inventoryApi.list,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["bom-items"],
    queryFn: itemApi.list,
  });

  const materialItems = useMemo(
    () => items.filter((item) => item.itemType === "MATERIAL"),
    [items]
  );

  const itemOptions = useMemo(
    () =>
      materialItems.map((item) => ({
        value: String(item.id),
        label: `${item.itemCode} ${item.itemName}`,
      })),
    [materialItems]
  );

  const upsertMutation = useMutation({
    mutationFn: inventoryApi.upsert,
    onSuccess: () => {
      toast.success("재고가 저장되었습니다.");
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["bom-inventories"] });
    },
    onError: (e) => toastError(e, "재고 저장에 실패했습니다."),
  });

  const columnDefs = useMemo<ColDef<Inventory>[]>(
    () => [
      { field: "id", headerName: "ID", width: 70, pinned: "left" },
      {
        field: "item.itemCode",
        headerName: "품목 코드",
        width: 130,
        pinned: "left",
      },
      {
        field: "item.itemName",
        headerName: "품목명",
        minWidth: 140,
        flex: 1,
      },
      { field: "item.unit", headerName: "단위", width: 80 },
      {
        field: "onHandQty",
        headerName: "현재고",
        width: 110,
        type: "numericColumn",
      },
      {
        field: "reservedQty",
        headerName: "예약수량",
        width: 110,
        type: "numericColumn",
      },
      {
        field: "availableQty",
        headerName: "가용수량",
        width: 110,
        type: "numericColumn",
      },
      {
        field: "item.safetyStock",
        headerName: "안전재고",
        width: 110,
        type: "numericColumn",
      },
      {
        field: "updatedAt",
        headerName: "수정일",
        minWidth: 160,
        valueFormatter: ({ value }) => formatDateTime(value),
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef<Inventory>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemId = Number(form.itemId);
    if (!itemId) {
      toast.error("품목을 선택하세요.");
      return;
    }
    const onHandQty = Number(form.onHandQty || 0);
    const reservedQty = Number(form.reservedQty || 0);
    if (reservedQty > onHandQty) {
      toast.error("예약수량은 현재고보다 클 수 없습니다.");
      return;
    }

    const body: CreateInventoryBody = {
      itemId,
      onHandQty,
      reservedQty,
    };
    upsertMutation.mutate(body);
  };

  const availableQty = Math.max(
    Number(form.onHandQty || 0) - Number(form.reservedQty || 0),
    0
  );

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-6 py-5">
      <section className="mx-auto min-w-0 max-w-[1600px]">
        <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            재고 관리
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
              새로고침
            </button>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="mt-4 grid min-w-0 gap-3 rounded-lg border border-border bg-card p-4 lg:grid-cols-[520px_140px_140px_140px_auto]"
        >
          <Field label="자재 품목">
            <Select
              value={form.itemId}
              onValueChange={(itemId) => setForm((v) => ({ ...v, itemId }))}
              options={[{ value: "", label: itemsLoading ? "품목 로딩 중" : "품목 선택" }, ...itemOptions]}
              ariaLabel="자재 품목"
              disabled={itemsLoading}
            />
          </Field>
          <Field label="현재고">
            <input
              type="number"
              min="0"
              value={form.onHandQty}
              onChange={(e) =>
                setForm((v) => ({ ...v, onHandQty: e.target.value }))
              }
              className={inputClassName}
            />
          </Field>
          <Field label="예약수량">
            <input
              type="number"
              min="0"
              value={form.reservedQty}
              onChange={(e) =>
                setForm((v) => ({ ...v, reservedQty: e.target.value }))
              }
              className={inputClassName}
            />
          </Field>
          <Field label="가용수량">
            <div className="flex h-9 items-center rounded-md border border-border bg-muted px-3 text-sm font-medium">
              {availableQty.toLocaleString()}
            </div>
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={upsertMutation.isPending || itemsLoading}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              저장
            </button>
          </div>
        </form>

        <section className="mt-4 min-w-0 overflow-hidden rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold">재고 목록</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                총 {inventories.length.toLocaleString()}개 품목 재고
              </p>
            </div>
            <input
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              placeholder="빠른 검색"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring md:w-64"
            />
          </div>

          {isError ? (
            <div className="flex h-[420px] items-center justify-center rounded-md border border-border text-sm text-destructive">
              재고 데이터를 불러오지 못했습니다.
            </div>
          ) : (
            <div className="ag-theme-quartz h-[clamp(340px,calc(100vh-24rem),520px)] min-w-0 w-full">
              <AgGridReact<Inventory>
                theme="legacy"
                rowData={inventories}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                quickFilterText={quickFilter}
                loading={inventoriesLoading}
                pagination
                paginationPageSize={20}
                paginationPageSizeSelector={[20, 50, 100]}
                animateRows
              />
            </div>
          )}
        </section>
      </section>

      <InfoDialog
        open={termsOpen}
        title="재고 관리 용어 설명"
        onClose={() => setTermsOpen(false)}
      >
        <div className="grid gap-3 text-sm text-muted-foreground">
          <Term
            name="현재고"
            description="창고나 현장에 실제로 보유한 품목 수량입니다."
            example="나무 500EA"
          />
          <Term
            name="예약수량"
            description="이미 생산계획이나 작업지시에 배정되어 다른 용도로 쓰기 어려운 수량입니다."
            example="볼트 200EA 예약"
          />
          <Term
            name="가용수량"
            description="현재고에서 예약수량을 뺀 수량입니다. MRP 계산에서 실제 사용 가능한 재고로 봅니다."
            example="500 - 100 = 400EA"
          />
          <Term
            name="안전재고"
            description="부족 위험을 줄이기 위해 남겨두는 최소 재고입니다. 품목 관리에서 설정합니다."
            example="접착제 안전재고 10EA"
          />
        </div>
      </InfoDialog>
    </main>
  );
}

const inputClassName =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Term({
  name,
  description,
  example,
}: {
  name: string;
  description: string;
  example: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h3 className="text-sm font-semibold text-foreground">{name}</h3>
        <code className="text-xs text-muted-foreground">{example}</code>
      </div>
      <p className="mt-2 leading-6">{description}</p>
    </div>
  );
}

function formatDateTime(value: string | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
