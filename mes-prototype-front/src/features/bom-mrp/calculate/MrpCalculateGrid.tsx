"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type RowClassRules,
} from "ag-grid-community";
import { Calculator, HelpCircle, RefreshCw } from "lucide-react";
import { bomApi } from "@/entities/bom/api/bomApi";
import { mrpApi } from "@/entities/bom/api/mrpApi";
import type { MrpMaterial } from "@/entities/bom/model/types";
import { toast } from "@/shared/lib/toast";
import { InfoDialog } from "@/shared/ui/InfoDialog";
import { Select } from "@/shared/ui/Select";

ModuleRegistry.registerModules([AllCommunityModule]);

type FormState = {
  productItemId: string;
  quantity: number;
};

export function MrpCalculateGrid() {
  const [form, setForm] = useState<FormState>({
    productItemId: "",
    quantity: 100,
  });
  const [termsOpen, setTermsOpen] = useState(false);

  const {
    data: boms = [],
    isLoading: bomsLoading,
    isFetching: bomsFetching,
    refetch,
  } = useQuery({
    queryKey: ["boms"],
    queryFn: bomApi.list,
  });

  const approvedBoms = useMemo(
    () => boms.filter((bom) => bom.status === "APPROVED"),
    [boms]
  );

  const productOptions = useMemo(
    () =>
      approvedBoms.map((bom) => ({
        value: String(bom.productItem.id),
        label: `${bom.productItem.itemCode} ${bom.productItem.itemName} (${bom.bomCode})`,
      })),
    [approvedBoms]
  );

  const selectedBom = useMemo(
    () =>
      approvedBoms.find(
        (bom) => String(bom.productItem.id) === form.productItemId
      ) ?? null,
    [approvedBoms, form.productItemId]
  );

  const calculateMutation = useMutation({
    mutationFn: mrpApi.calculate,
    onError: () => toast.error("MRP 계산에 실패했습니다. 승인된 BOM과 재고 데이터를 확인하세요."),
  });

  const columnDefs = useMemo<ColDef<MrpMaterial>[]>(
    () => [
      { field: "itemCode", headerName: "자재 코드", minWidth: 130, pinned: "left" },
      { field: "itemName", headerName: "자재명", minWidth: 150, flex: 1, pinned: "left" },
      { field: "unit", headerName: "단위", width: 90 },
      {
        field: "requiredQuantity",
        headerName: "필요수량",
        width: 130,
        type: "numericColumn",
        valueFormatter: numberFormatter,
      },
      {
        field: "onHandQty",
        headerName: "현재고",
        width: 120,
        type: "numericColumn",
        valueFormatter: numberFormatter,
      },
      {
        field: "reservedQty",
        headerName: "예약수량",
        width: 120,
        type: "numericColumn",
        valueFormatter: numberFormatter,
      },
      {
        field: "availableQty",
        headerName: "가용수량",
        width: 120,
        type: "numericColumn",
        valueFormatter: numberFormatter,
      },
      {
        field: "safetyStock",
        headerName: "안전재고",
        width: 120,
        type: "numericColumn",
        valueFormatter: numberFormatter,
      },
      {
        field: "shortageQuantity",
        headerName: "부족수량",
        width: 130,
        type: "numericColumn",
        valueFormatter: numberFormatter,
      },
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

  const rowClassRules = useMemo<RowClassRules<MrpMaterial>>(
    () => ({
      "bg-red-50 text-red-900": ({ data }) =>
        Number(data?.shortageQuantity ?? 0) > 0,
    }),
    []
  );

  const result = calculateMutation.data;
  const shortageCount =
    result?.materials.filter((material) => Number(material.shortageQuantity) > 0)
      .length ?? 0;
  const totalRequired =
    result?.materials.reduce(
      (sum, material) => sum + Number(material.requiredQuantity ?? 0),
      0
    ) ?? 0;
  const totalShortage =
    result?.materials.reduce(
      (sum, material) => sum + Number(material.shortageQuantity ?? 0),
      0
    ) ?? 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const productItemId = Number(form.productItemId);
    const quantity = Number(form.quantity);

    if (!productItemId) {
      toast.error("생산 품목을 선택하세요.");
      return;
    }
    if (quantity <= 0) {
      toast.error("생산수량은 0보다 커야 합니다.");
      return;
    }

    calculateMutation.mutate({ productItemId, quantity });
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background px-6 py-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">BOM/MRP</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              MRP 계산
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              생산 품목과 수량을 입력하면 승인된 BOM 기준으로 필요 자재, 현재고,
              안전재고, 부족수량을 계산합니다.
            </p>
          </div>
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
              disabled={bomsFetching}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${bomsFetching ? "animate-spin" : ""}`} />
              BOM 새로고침
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 rounded-lg border border-border bg-card p-4">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_180px_auto] lg:items-end">
            <Field label="생산 품목">
              <Select
                value={form.productItemId}
                onChange={(productItemId) => setForm((v) => ({ ...v, productItemId }))}
                options={[
                  {
                    value: "",
                    label: bomsLoading ? "BOM 로딩 중" : "승인된 BOM 품목 선택",
                  },
                  ...productOptions,
                ]}
                disabled={bomsLoading}
                ariaLabel="생산 품목"
              />
            </Field>
            <Field label="생산수량">
              <input
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={(e) =>
                  setForm((v) => ({ ...v, quantity: Number(e.target.value) }))
                }
                className={inputClassName}
              />
            </Field>
            <button
              type="submit"
              disabled={calculateMutation.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              <Calculator className="h-4 w-4" />
              계산
            </button>
          </div>
          {selectedBom ? (
            <div className="mt-4 grid gap-3 rounded-md border border-border bg-background p-3 text-sm md:grid-cols-4">
              <SummaryItem label="BOM" value={`${selectedBom.bomCode} ${selectedBom.bomName}`} />
              <SummaryItem label="버전" value={selectedBom.version} />
              <SummaryItem label="자재 수" value={`${selectedBom.lines.length}개`} />
              <SummaryItem label="상태" value="승인" />
            </div>
          ) : null}
        </form>

        <section className="mt-5 grid gap-3 md:grid-cols-3">
          <Metric title="계산 품목" value={result ? result.productItemName : "-"} />
          <Metric title="총 필요수량" value={result ? formatNumber(totalRequired) : "-"} />
          <Metric
            title="부족 자재"
            value={result ? `${shortageCount}개 / ${formatNumber(totalShortage)}` : "-"}
            danger={totalShortage > 0}
          />
        </section>

        <section className="mt-5 rounded-lg border border-border bg-card p-4">
          <div className="mb-3">
            <h2 className="text-base font-semibold">MRP 계산 결과</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {result
                ? `${result.productItemName} ${formatNumber(result.quantity)}개 생산 기준`
                : "생산 품목과 수량을 입력한 뒤 계산하세요."}
            </p>
          </div>
          <div className="ag-theme-quartz h-[520px] w-full">
            <AgGridReact<MrpMaterial>
              theme="legacy"
              rowData={result?.materials ?? []}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowClassRules={rowClassRules}
              loading={calculateMutation.isPending}
              overlayNoRowsTemplate="MRP 계산 결과가 없습니다."
              pagination
              paginationPageSize={20}
              paginationPageSizeSelector={[20, 50, 100]}
              animateRows
            />
          </div>
        </section>
      </section>

      <InfoDialog
        open={termsOpen}
        title="MRP 계산 용어 설명"
        onClose={() => setTermsOpen(false)}
      >
        <div className="grid gap-3 text-sm text-muted-foreground">
          <Term
            name="MRP"
            description="생산하려는 수량을 기준으로 필요한 자재와 부족 수량을 계산하는 절차입니다."
            example="의자 100개 생산"
          />
          <Term
            name="필요수량"
            description="BOM의 제품 1개당 자재 수량에 생산수량과 손실률을 곱한 값입니다."
            example="볼트 4EA x 의자 100개 = 400EA"
          />
          <Term
            name="가용수량"
            description="현재고에서 예약수량을 뺀 실제 사용 가능 수량입니다."
            example="현재고 500 - 예약 20 = 480"
          />
          <Term
            name="부족수량"
            description="필요수량이 가용수량에서 안전재고를 제외한 수량보다 클 때 발생합니다."
            example="필요 600, 가용 500, 안전재고 100 = 부족 200"
          />
        </div>
      </InfoDialog>
    </main>
  );
}

const inputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring";

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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-medium text-foreground">{value}</p>
    </div>
  );
}

function Metric({
  title,
  value,
  danger = false,
}: {
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className={`mt-2 text-2xl font-semibold ${danger ? "text-red-600" : "text-foreground"}`}>
        {value}
      </p>
    </div>
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

function numberFormatter({ value }: { value: unknown }) {
  return formatNumber(Number(value ?? 0));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 4,
  }).format(value);
}
