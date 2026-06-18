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
import { itemApi } from "@/entities/bom/api/itemApi";
import type { CreateItemBody, Item, ItemType } from "@/entities/bom/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { InfoDialog } from "@/shared/ui/InfoDialog";
import { Select } from "@/shared/ui/Select";

ModuleRegistry.registerModules([AllCommunityModule]);

type ItemForm = Omit<CreateItemBody, "safetyStock"> & {
  safetyStock: string;
};

const emptyForm: ItemForm = {
  itemCode: "",
  itemName: "",
  itemType: "MATERIAL",
  unit: "EA",
  safetyStock: "0",
  description: "",
};

export function ItemManagementGrid() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [quickFilter, setQuickFilter] = useState("");
  const [termsOpen, setTermsOpen] = useState(false);

  const { data: items = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["bom-items"],
    queryFn: itemApi.list,
  });

  const createMutation = useMutation({
    mutationFn: itemApi.create,
    onSuccess: () => {
      toast.success("품목이 등록되었습니다.");
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["bom-items"] });
    },
    onError: (e) => toastError(e, "품목 등록에 실패했습니다."),
  });

  const columnDefs = useMemo<ColDef<Item>[]>(
    () => [
      { field: "id", headerName: "ID", width: 90, pinned: "left" },
      { field: "itemCode", headerName: "품목 코드", minWidth: 140, pinned: "left" },
      { field: "itemName", headerName: "품목명", minWidth: 160, flex: 1 },
      {
        field: "itemType",
        headerName: "구분",
        width: 120,
        valueFormatter: ({ value }) => itemTypeLabel(value),
      },
      { field: "unit", headerName: "단위", width: 100 },
      {
        field: "safetyStock",
        headerName: "안전재고",
        width: 130,
        type: "numericColumn",
      },
      { field: "description", headerName: "설명", minWidth: 220, flex: 1 },
      {
        field: "updatedAt",
        headerName: "수정일",
        minWidth: 180,
        valueFormatter: ({ value }) => formatDateTime(value),
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef<Item>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: CreateItemBody = {
      itemCode: form.itemCode.trim(),
      itemName: form.itemName.trim(),
      itemType: form.itemType,
      unit: form.unit.trim(),
      safetyStock: Number(form.safetyStock || 0),
      description: form.description?.trim() || undefined,
    };

    if (!body.itemCode || !body.itemName || !body.unit) {
      toast.error("품목 코드, 품목명, 단위를 입력하세요.");
      return;
    }

    createMutation.mutate(body);
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-6 py-5">
      <section className="mx-auto min-w-0 max-w-[1600px]">
        <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            품목 관리
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
          className="mt-4 grid min-w-0 gap-3 rounded-lg border border-border bg-card p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px_120px_140px_minmax(0,1.5fr)_auto]"
        >
          <Field label="품목 코드">
            <input
              value={form.itemCode}
              onChange={(e) => setForm((v) => ({ ...v, itemCode: e.target.value }))}
              placeholder="ITM-001"
              className={inputClassName}
            />
          </Field>
          <Field label="품목명">
            <input
              value={form.itemName}
              onChange={(e) => setForm((v) => ({ ...v, itemName: e.target.value }))}
              placeholder="의자"
              className={inputClassName}
            />
          </Field>
          <Field label="구분">
            <Select<ItemType>
              value={form.itemType}
              onValueChange={(itemType) => setForm((v) => ({ ...v, itemType }))}
              options={[
                { value: "PRODUCT", label: "제품" },
                { value: "MATERIAL", label: "자재" },
              ]}
              ariaLabel="품목 구분"
            />
          </Field>
          <Field label="단위">
            <input
              value={form.unit}
              onChange={(e) => setForm((v) => ({ ...v, unit: e.target.value }))}
              placeholder="EA"
              className={inputClassName}
            />
          </Field>
          <Field label="안전재고">
            <input
              type="number"
              min="0"
              value={form.safetyStock}
              onChange={(e) =>
                setForm((v) => ({ ...v, safetyStock: e.target.value }))
              }
              className={inputClassName}
            />
          </Field>
          <Field label="설명">
            <input
              value={form.description ?? ""}
              onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
              placeholder="사무용 의자"
              className={inputClassName}
            />
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              등록
            </button>
          </div>
        </form>

        <section className="mt-4 min-w-0 overflow-hidden rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold">품목 목록</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                총 {items.length.toLocaleString()}개 품목
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
              품목 데이터를 불러오지 못했습니다.
            </div>
          ) : (
            <div className="ag-theme-quartz h-[clamp(340px,calc(100vh-24rem),520px)] min-w-0 w-full">
              <AgGridReact<Item>
                theme="legacy"
                rowData={items}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                quickFilterText={quickFilter}
                loading={isLoading}
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
        title="품목 관리 용어 설명"
        onClose={() => setTermsOpen(false)}
      >
        <div className="grid gap-3 text-sm text-muted-foreground">
          <Term
            name="품목"
            description="MES에서 관리하는 제품, 반제품, 원자재의 공통 기준정보입니다."
            example="의자, 상판, 다리, 나사"
          />
          <Term
            name="제품"
            description="생산해서 출고하거나 생산계획의 대상이 되는 품목입니다."
            example="사무용 의자"
          />
          <Term
            name="자재"
            description="제품을 만들 때 BOM 상세에 들어가는 투입 품목입니다."
            example="나무, 볼트, 원단"
          />
          <Term
            name="단위"
            description="수량을 계산하는 기준 단위입니다. BOM과 재고 계산에서 같은 단위를 사용해야 합니다."
            example="EA, M, KG"
          />
          <Term
            name="안전재고"
            description="부족 위험을 줄이기 위해 항상 남겨두고 싶은 최소 재고입니다. MRP 계산 시 사용 가능 수량에서 제외합니다."
            example="나사 안전재고 100EA"
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

function itemTypeLabel(value: ItemType | undefined) {
  if (value === "PRODUCT") return "제품";
  if (value === "MATERIAL") return "자재";
  return value ?? "";
}

function formatDateTime(value: string | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
