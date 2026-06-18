"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type RowClickedEvent,
} from "ag-grid-community";
import { HelpCircle, Plus, RefreshCw, Trash2 } from "lucide-react";
import { bomApi } from "@/entities/bom/api/bomApi";
import { itemApi } from "@/entities/bom/api/itemApi";
import type {
  Bom,
  BomLine,
  BomStatus,
  CreateBomBody,
} from "@/entities/bom/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { InfoDialog } from "@/shared/ui/InfoDialog";
import { Select } from "@/shared/ui/Select";

ModuleRegistry.registerModules([AllCommunityModule]);

type BomLineForm = {
  key: string;
  materialItemId: string;
  requiredQty: string;
  lossRate: string;
  description: string;
};

type BomForm = {
  bomCode: string;
  bomName: string;
  productItemId: string;
  version: string;
  status: BomStatus;
  description: string;
  lines: BomLineForm[];
};

const emptyLine = (): BomLineForm => ({
  key: crypto.randomUUID(),
  materialItemId: "",
  requiredQty: "1",
  lossRate: "0",
  description: "",
});

const emptyForm = (): BomForm => ({
  bomCode: "",
  bomName: "",
  productItemId: "",
  version: "1.0",
  status: "APPROVED",
  description: "",
  lines: [emptyLine()],
});

export function BomManagementGrid() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BomForm>(emptyForm);
  const [quickFilter, setQuickFilter] = useState("");
  const [termsOpen, setTermsOpen] = useState(false);
  const [selectedBom, setSelectedBom] = useState<Bom | null>(null);

  const {
    data: boms = [],
    isLoading: bomsLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["boms"],
    queryFn: bomApi.list,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["bom-items"],
    queryFn: itemApi.list,
  });

  const productOptions = useMemo(
    () =>
      items
        .filter((item) => item.itemType === "PRODUCT")
        .map((item) => ({
          value: String(item.id),
          label: `${item.itemCode} ${item.itemName}`,
        })),
    [items]
  );

  const materialOptions = useMemo(
    () =>
      items
        .filter((item) => item.itemType === "MATERIAL")
        .map((item) => ({
          value: String(item.id),
          label: `${item.itemCode} ${item.itemName}`,
        })),
    [items]
  );

  const createMutation = useMutation({
    mutationFn: bomApi.create,
    onSuccess: (saved) => {
      toast.success("BOM이 등록되었습니다.");
      setForm(emptyForm());
      setSelectedBom(saved);
      queryClient.invalidateQueries({ queryKey: ["boms"] });
    },
    onError: (e) => toastError(e, "BOM 등록에 실패했습니다."),
  });

  const bomColumnDefs = useMemo<ColDef<Bom>[]>(
    () => [
      { field: "id", headerName: "ID", width: 90, pinned: "left" },
      { field: "bomCode", headerName: "BOM 코드", minWidth: 140, pinned: "left" },
      { field: "bomName", headerName: "BOM명", minWidth: 180, flex: 1 },
      { field: "productItem.itemName", headerName: "생산 품목", minWidth: 150 },
      { field: "version", headerName: "버전", width: 100 },
      {
        field: "status",
        headerName: "상태",
        width: 120,
        valueFormatter: ({ value }) => statusLabel(value),
      },
      {
        headerName: "필요 자재 수",
        width: 110,
        valueGetter: ({ data }) => data?.lines.length ?? 0,
        type: "numericColumn",
      },
      { field: "description", headerName: "설명", minWidth: 220, flex: 1 },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const productItemId = Number(form.productItemId);
    const lines = form.lines
      .map((line) => ({
        materialItemId: Number(line.materialItemId),
        requiredQty: Number(line.requiredQty || 0),
        lossRate: Number(line.lossRate || 0),
        description: line.description.trim() || undefined,
      }))
      .filter((line) => line.materialItemId && line.requiredQty > 0);

    if (!form.bomCode.trim() || !form.bomName.trim() || !productItemId) {
      toast.error("BOM 코드, BOM명, 생산 품목을 입력하세요.");
      return;
    }
    if (lines.length === 0) {
      toast.error("자재 라인을 최소 1개 이상 입력하세요.");
      return;
    }

    const body: CreateBomBody = {
      bomCode: form.bomCode.trim(),
      bomName: form.bomName.trim(),
      productItemId,
      version: form.version.trim() || "1.0",
      status: form.status,
      description: form.description.trim() || undefined,
      lines,
    };

    createMutation.mutate(body);
  };

  const updateLine = (
    key: string,
    updater: (line: BomLineForm) => BomLineForm
  ) => {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.key === key ? updater(line) : line)),
    }));
  };
  const displayedBom = selectedBom ?? boms[0] ?? null;

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-6 py-5">
      <section className="mx-auto min-w-0 max-w-[1600px]">
        <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            BOM 관리
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

        <form onSubmit={submit} className="mt-4 rounded-lg border border-border bg-card p-4">
          <div className="mb-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setForm((v) => ({ ...v, lines: [...v.lines, emptyLine()] }))}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
            >
              <Plus className="h-4 w-4" />
              라인 추가
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              BOM 저장
            </button>
          </div>

          <div className="grid min-w-0 gap-3 lg:grid-cols-[140px_280px_320px_90px_130px_minmax(260px,1fr)]">
            <Field label="BOM 코드">
              <input
                value={form.bomCode}
                onChange={(e) => setForm((v) => ({ ...v, bomCode: e.target.value }))}
                placeholder="BOM-001"
                className={inputClassName}
              />
            </Field>
            <Field label="BOM명">
              <input
                value={form.bomName}
                onChange={(e) => setForm((v) => ({ ...v, bomName: e.target.value }))}
                placeholder="의자 표준 BOM"
                className={inputClassName}
              />
            </Field>
            <Field label="생산 품목">
              <Select
                value={form.productItemId}
                onValueChange={(productItemId) => setForm((v) => ({ ...v, productItemId }))}
                options={[{ value: "", label: itemsLoading ? "품목 로딩 중" : "생산 품목 선택" }, ...productOptions]}
                disabled={itemsLoading}
                ariaLabel="생산 품목"
              />
            </Field>
            <Field label="버전">
              <input
                value={form.version}
                onChange={(e) => setForm((v) => ({ ...v, version: e.target.value }))}
                className={inputClassName}
              />
            </Field>
            <Field label="상태">
              <Select<BomStatus>
                value={form.status}
                onValueChange={(status) => setForm((v) => ({ ...v, status }))}
                options={[
                  { value: "DRAFT", label: "초안" },
                  { value: "APPROVED", label: "승인" },
                  { value: "INACTIVE", label: "비활성" },
                ]}
                ariaLabel="BOM 상태"
              />
            </Field>
            <Field label="설명">
              <input
                value={form.description}
                onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
                placeholder="기본 생산용"
                className={inputClassName}
              />
            </Field>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-base font-semibold">BOM 상세 자재 라인</h2>
            </div>

            <div className="grid gap-2">
              {form.lines.map((line, index) => (
                <div
                  key={line.key}
                    className="grid gap-2 rounded-md border border-border bg-muted/20 p-3 lg:grid-cols-[42px_480px_120px_120px_minmax(260px,1fr)_42px]"
                >
                  <div className="flex h-9 items-center text-sm font-medium text-muted-foreground">
                    #{index + 1}
                  </div>
                  <Select
                    value={line.materialItemId}
                    onValueChange={(materialItemId) =>
                      updateLine(line.key, (v) => ({ ...v, materialItemId }))
                    }
                    options={[{ value: "", label: itemsLoading ? "품목 로딩 중" : "자재 품목 선택" }, ...materialOptions]}
                    disabled={itemsLoading}
                    ariaLabel="자재 품목"
                  />
                  <input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={line.requiredQty}
                    onChange={(e) =>
                      updateLine(line.key, (v) => ({
                        ...v,
                        requiredQty: e.target.value,
                      }))
                    }
                    className={inputClassName}
                    aria-label="필요수량"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.lossRate}
                    onChange={(e) =>
                      updateLine(line.key, (v) => ({
                        ...v,
                        lossRate: e.target.value,
                      }))
                    }
                    className={inputClassName}
                    aria-label="손실률"
                  />
                  <input
                    value={line.description}
                    onChange={(e) =>
                      updateLine(line.key, (v) => ({
                        ...v,
                        description: e.target.value,
                      }))
                    }
                    placeholder="예: 의자 1개당 나무 1개"
                    className={inputClassName}
                    aria-label="라인 설명"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((v) => ({
                        ...v,
                        lines: v.lines.length === 1 ? [emptyLine()] : v.lines.filter((l) => l.key !== line.key),
                      }))
                    }
                    className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent"
                    aria-label="라인 삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </form>

        <section className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold">BOM 목록</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  총 {boms.length.toLocaleString()}개 BOM
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
                BOM 데이터를 불러오지 못했습니다.
              </div>
            ) : (
              <div className="ag-theme-quartz h-[clamp(300px,calc(100vh-29rem),380px)] min-w-0 w-full">
                <AgGridReact<Bom>
                  theme="legacy"
                  rowData={boms}
                  columnDefs={bomColumnDefs}
                  defaultColDef={defaultColDef}
                  quickFilterText={quickFilter}
                  loading={bomsLoading}
                  pagination
                  paginationPageSize={20}
                  paginationPageSizeSelector={[20, 50, 100]}
                  animateRows
                  rowSelection="single"
                  onRowClicked={(event: RowClickedEvent<Bom>) =>
                    setSelectedBom(event.data ?? null)
                  }
                />
              </div>
            )}
          </div>

          <aside className="min-w-0 rounded-lg border border-border bg-card p-4">
            <div className="mb-4">
              <h2 className="text-base font-semibold">선택 BOM 상세</h2>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {displayedBom
                  ? `${displayedBom.bomCode} ${displayedBom.bomName}`
                  : "BOM 목록에서 행을 선택하세요."}
              </p>
            </div>

            {displayedBom ? (
              <BomLineList lines={displayedBom.lines} />
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                선택된 BOM이 없습니다.
              </div>
            )}
          </aside>
        </section>
      </section>

      <InfoDialog
        open={termsOpen}
        title="BOM 관리 용어 설명"
        onClose={() => setTermsOpen(false)}
      >
        <div className="grid gap-3 text-sm text-muted-foreground">
          <Term
            name="BOM"
            description="제품을 만들기 위해 필요한 자재 구성표입니다. 설계서 역할을 합니다."
            example="의자 표준 BOM"
          />
          <Term
            name="생산 품목"
            description="BOM으로 만들 최종 제품 품목입니다."
            example="의자, 책상"
          />
          <Term
            name="자재 라인"
            description="제품 1개를 만들 때 필요한 자재 품목과 필요수량입니다."
            example="나무 1EA, 볼트 4EA"
          />
          <Term
            name="손실률"
            description="가공 중 손실이나 여유분을 반영하는 비율입니다. 0.05는 5%를 의미합니다."
            example="필요수량 10, 손실률 0.05 = 10.5"
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

function BomLineList({ lines }: { lines: BomLine[] }) {
  if (lines.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
        등록된 자재 라인이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {lines.map((line) => (
        <div
          key={line.id}
          className="rounded-md border border-border bg-muted/20 px-3 py-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {line.materialItem.itemName}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {line.materialItem.itemCode}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-foreground">
                {formatQty(line.requiredQty)} {line.materialItem.unit}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                손실률 {formatPercent(line.lossRate)}
              </p>
            </div>
          </div>
          {line.description ? (
            <p className="mt-2 truncate text-xs text-muted-foreground">
              {line.description}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function statusLabel(value: BomStatus | undefined) {
  if (value === "DRAFT") return "초안";
  if (value === "APPROVED") return "승인";
  if (value === "INACTIVE") return "비활성";
  return value ?? "";
}

function formatQty(value: unknown) {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 4,
  }).format(Number(value ?? 0));
}

function formatPercent(value: unknown) {
  return `${new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0) * 100)}%`;
}
