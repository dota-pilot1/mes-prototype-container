"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  GitBranch,
  ListFilter,
  Workflow,
} from "lucide-react";
import {
  splitWorkOrders,
  workOrderApi,
} from "@/entities/work-order/api/workOrderApi";
import type {
  ProcessStatus,
  WorkOrder,
  WorkOrderProcess,
  WorkOrderStatus,
} from "@/entities/work-order/model/types";

type WbsRow = {
  order: WorkOrder;
  process: WorkOrderProcess;
};

type WbsGroup = {
  order: WorkOrder;
  processes: WorkOrderProcess[];
  avgProgress: number;
};

const allOrderValue = "ALL";

export function WorkOrderWbs() {
  const [selectedOrderCode, setSelectedOrderCode] = useState(allOrderValue);
  const { data: workOrders = [] } = useQuery({
    queryKey: ["work-orders"],
    queryFn: workOrderApi.list,
  });
  const { orders, processList } = useMemo(() => {
    const split = splitWorkOrders(workOrders);
    return { orders: split.orders, processList: split.processes };
  }, [workOrders]);

  const allGroups = useMemo<WbsGroup[]>(
    () =>
      orders
        .map((order) => {
          const processes = processList
            .filter((process) => process.orderId === order.id)
            .sort((a, b) => a.sequence - b.sequence);
          const avgProgress =
            processes.length === 0
              ? 0
              : Math.round(
                  processes.reduce((sum, process) => sum + process.progress, 0) /
                    processes.length
                );
          return { order, processes, avgProgress };
        })
        .filter((group) => group.processes.length > 0)
        .sort((a, b) => a.order.code.localeCompare(b.order.code)),
    [orders, processList]
  );

  const groups = useMemo(
    () =>
      selectedOrderCode === allOrderValue
        ? allGroups
        : allGroups.filter((group) => group.order.code === selectedOrderCode),
    [allGroups, selectedOrderCode]
  );

  const rows = useMemo<WbsRow[]>(
    () =>
      groups.flatMap((group) =>
        group.processes.map((process) => ({ order: group.order, process }))
      ),
    [groups]
  );

  const chartDays = useMemo(() => makeChartDays(rows), [rows]);
  const activeOrders = groups.length;
  const delayedCount = rows.filter((row) => row.process.status === "HOLD").length;
  const inProgressCount = rows.filter((row) => row.process.status === "IN_PROGRESS").length;
  const averageProgress =
    rows.length === 0
      ? 0
      : Math.round(rows.reduce((sum, row) => sum + row.process.progress, 0) / rows.length);

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-6 py-5">
      <section className="mx-auto min-w-0 max-w-[1600px]">
        <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">MES Prototype</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
              작업지시 WBS
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              작업지시에 등록된 상세 공정을 날짜별로 펼쳐 일정 겹침과 지연을 확인하는 화면입니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {chartDays.length}일 범위
            </div>
            <div className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground">
              <ListFilter className="h-4 w-4" />
              {selectedOrderCode === allOrderValue
                ? "전체 보기"
                : `${selectedOrderCode} 단일 보기`}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <SummaryCard icon={<Workflow className="h-4 w-4" />} label="작업지시" value={`${activeOrders}건`} />
          <SummaryCard icon={<GitBranch className="h-4 w-4" />} label="상세 공정" value={`${rows.length}건`} />
          <SummaryCard icon={<ListFilter className="h-4 w-4" />} label="진행 공정" value={`${inProgressCount}건`} />
          <SummaryCard label="평균 진행률" value={`${averageProgress}%`} tone={delayedCount > 0 ? "warn" : "default"} />
        </div>

        <section className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-foreground">업무 흐름</h2>
            <p className="text-sm text-muted-foreground">
              WBS는 별도 입력 화면이 아니라 작업지시에 등록된 상세 공정을 일정표로 보여주는 화면입니다.
            </p>
          </div>
          <div className="grid gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
            <FlowStep
              title="생산계획 기본"
              description="품목, 수량, 시작일, 종료일을 정합니다."
            />
            <FlowArrow />
            <FlowStep
              title="작업지시"
              description="계획을 현장 실행 단위로 내립니다."
            />
            <FlowArrow />
            <FlowStep
              title="상세 공정"
              description="자재 출고, 가공, 조립, 검사로 쪼갭니다."
            />
            <FlowArrow />
            <FlowStep
              title="WBS"
              description="상세 공정을 날짜별 막대로 확인합니다."
            />
          </div>
        </section>

        <section className="mt-4 min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">작업지시 공정 간트</h2>
              <p className="text-sm text-muted-foreground">
                기본은 전체 작업지시를 한눈에 비교합니다. 왼쪽 목록에서 한 건을 고르면 그 작업지시만 자세히 봅니다.
              </p>
            </div>
            <StatusLegend />
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <WbsOrderSidebar
              groups={allGroups}
              selectedOrderCode={selectedOrderCode}
              onSelect={setSelectedOrderCode}
            />

            <div className="min-w-0 flex-1 overflow-x-auto rounded-md border border-border">
              <div
                className="grid min-w-[1120px]"
                style={{
                  gridTemplateColumns: `260px repeat(${chartDays.length}, minmax(44px, 1fr)) 120px`,
                }}
              >
                <div className="sticky left-0 z-20 border-b border-r border-border bg-muted/80 px-3 py-2 text-sm font-semibold">
                  WBS
                </div>
                {chartDays.map((day) => (
                  <div
                    key={day}
                    className="border-b border-r border-border bg-muted/80 px-1 py-2 text-center text-xs text-muted-foreground"
                  >
                    <div>{formatDay(day)}</div>
                    <div className="mt-0.5">{formatWeekday(day)}</div>
                  </div>
                ))}
                <div className="sticky right-0 z-20 border-b border-l border-border bg-muted/80 px-3 py-2 text-right text-sm font-semibold">
                  진행률
                </div>

                {groups.map((group) => (
                  <WbsGanttGroup key={group.order.id} group={group} days={chartDays} />
                ))}
              </div>
            </div>
          </div>
        </section>

      </section>
    </main>
  );
}

function WbsOrderSidebar({
  groups,
  selectedOrderCode,
  onSelect,
}: {
  groups: WbsGroup[];
  selectedOrderCode: string;
  onSelect: (value: string) => void;
}) {
  const isAll = selectedOrderCode === allOrderValue;
  return (
    <aside className="w-full shrink-0 lg:w-60">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        작업지시 목록
      </div>
      <div className="grid gap-1.5">
        <button
          type="button"
          onClick={() => onSelect(allOrderValue)}
          aria-pressed={isAll}
          className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
            isAll
              ? "border-primary bg-primary/10 font-semibold text-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-muted/60"
          }`}
        >
          <span>전체 보기</span>
          <span className="text-xs text-muted-foreground">{groups.length}건</span>
        </button>
        {groups.map((group) => {
          const selected = selectedOrderCode === group.order.code;
          return (
            <button
              key={group.order.id}
              type="button"
              onClick={() => onSelect(group.order.code)}
              aria-pressed={selected}
              className={`rounded-md border px-3 py-2 text-left transition ${
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-muted/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClassName[group.order.status]}`} />
                <span className="text-xs font-semibold text-muted-foreground">
                  {group.order.code}
                </span>
                <span className="ml-auto text-xs font-semibold text-foreground">
                  {group.avgProgress}%
                </span>
              </div>
              <div className="mt-1 truncate text-sm font-medium text-foreground">
                {group.order.itemName}
              </div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                공정 {group.processes.length}개 / {group.order.assignee}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function WbsGanttGroup({ group, days }: { group: WbsGroup; days: string[] }) {
  const { order, avgProgress } = group;
  return (
    <>
      <div className="sticky left-0 z-10 min-w-0 border-b border-r border-border bg-muted/60 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-bold text-foreground">{order.code}</span>
          <span className="truncate text-sm font-bold text-foreground">{order.itemName}</span>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-1 truncate text-xs text-muted-foreground">
          {order.quantity.toLocaleString()}개 / {order.assignee} / {formatPeriod(order.startDate, order.dueDate)}
        </div>
      </div>
      {days.map((day) => {
        const active = day >= order.startDate && day <= order.dueDate;
        const isStart = day === order.startDate;
        return (
          <div
            key={`${order.id}-rollup-${day}`}
            className="flex min-h-12 items-center border-b border-r border-border bg-muted/40 px-0.5"
          >
            {active ? (
              <div
                className={`h-2.5 w-full bg-foreground/25 ${isStart ? "rounded-l-full" : ""} ${
                  day === order.dueDate ? "rounded-r-full" : ""
                }`}
                title={`${order.code} 전체 일정 ${formatPeriod(order.startDate, order.dueDate)}`}
              />
            ) : null}
          </div>
        );
      })}
      <div className="sticky right-0 z-10 flex items-center justify-end border-b border-l border-border bg-muted/60 px-3 py-2.5">
        <span className="text-xs font-bold text-foreground">평균 {avgProgress}%</span>
      </div>
      {group.processes.map((process) => (
        <WbsGanttRow key={`${order.id}-${process.id}`} row={{ order, process }} days={days} />
      ))}
    </>
  );
}

function WbsGanttRow({ row, days }: { row: WbsRow; days: string[] }) {
  const { order, process } = row;
  const label = `${process.sequence}. ${process.processName}`;

  return (
    <>
      <div className="sticky left-0 z-10 min-w-0 border-b border-r border-border bg-card py-3 pl-6 pr-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">
            {process.sequence}.
          </span>
          <span className="truncate text-sm font-semibold text-foreground">
            {process.processName}
          </span>
        </div>
        <div className="mt-1 truncate text-xs text-muted-foreground">
          {process.workstation} / {process.assignee}
        </div>
      </div>
      {(() => {
        const activeDays = days.filter(
          (day) => day >= process.startDate && day <= process.dueDate
        );
        const totalDays = activeDays.length;
        const progressFrac = process.progress / 100;
        return days.map((day) => {
          const activeIndex = activeDays.indexOf(day);
          const active = activeIndex !== -1;
          const isStart = day === process.startDate;
          // 이 칸이 진행 바에서 채워지는 비율 (전체 진행률을 일자별로 분배)
          const fillRatio = active
            ? Math.min(1, Math.max(0, progressFrac * totalDays - activeIndex))
            : 0;
          return (
            <div
              key={`${process.id}-${day}`}
              className="flex min-h-16 items-center border-b border-r border-border px-0.5"
            >
              {active ? (
                <div
                  className={`relative h-7 w-full overflow-hidden ${statusTrackClassName[process.status]} ${
                    isStart ? "rounded-l-sm" : ""
                  } ${day === process.dueDate ? "rounded-r-sm" : ""}`}
                  title={`${order.code} ${label} · ${formatPeriod(
                    process.startDate,
                    process.dueDate
                  )} · ${process.progress}%`}
                >
                  <div
                    className={`h-full ${statusBarClassName[process.status]}`}
                    style={{ width: `${fillRatio * 100}%` }}
                  />
                </div>
              ) : null}
            </div>
          );
        });
      })()}
      <div className="sticky right-0 z-10 border-b border-l border-border bg-card px-3 py-3">
        <div className="flex items-center justify-end gap-2">
          <div className="h-2 w-14 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${statusProgressClassName[process.status]}`}
              style={{ width: `${process.progress}%` }}
            />
          </div>
          <span className="w-9 text-right text-xs font-semibold text-foreground">
            {process.progress}%
          </span>
        </div>
      </div>
    </>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "warn";
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${tone === "warn" ? "text-red-600" : "text-foreground"}`}>
        {value}
      </div>
    </section>
  );
}

function FlowStep({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="hidden items-center justify-center text-muted-foreground lg:flex">
      <ArrowRight className="h-4 w-4" />
    </div>
  );
}

function StatusLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {statusOrder.map((status) => (
        <div
          key={status}
          className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground"
        >
          <span className={`h-2.5 w-2.5 rounded-full ${statusDotClassName[status]}`} />
          {statusLabel[status]}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold ${statusBadgeClassName[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}

function makeChartDays(rows: WbsRow[]) {
  if (rows.length === 0) return [];

  const start = new Date(
    Math.min(...rows.map((row) => new Date(row.process.startDate).getTime()))
  );
  const end = new Date(
    Math.max(...rows.map((row) => new Date(row.process.dueDate).getTime()))
  );
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

const statusOrder: ProcessStatus[] = ["READY", "IN_PROGRESS", "COMPLETED", "HOLD"];

const statusLabel: Record<ProcessStatus, string> = {
  READY: "대기",
  IN_PROGRESS: "진행",
  COMPLETED: "완료",
  HOLD: "보류",
};

const statusBarClassName: Record<ProcessStatus, string> = {
  READY: "bg-slate-400",
  IN_PROGRESS: "bg-amber-500",
  COMPLETED: "bg-emerald-600",
  HOLD: "bg-red-600",
};

// 계획 구간(바탕) — 진행률만큼만 위의 진한 색으로 채워집니다.
const statusTrackClassName: Record<ProcessStatus, string> = {
  READY: "bg-slate-200",
  IN_PROGRESS: "bg-amber-200",
  COMPLETED: "bg-emerald-200",
  HOLD: "bg-red-200",
};

const statusDotClassName: Record<ProcessStatus, string> = {
  READY: "bg-slate-400",
  IN_PROGRESS: "bg-amber-500",
  COMPLETED: "bg-emerald-600",
  HOLD: "bg-red-600",
};

const statusProgressClassName: Record<ProcessStatus, string> = {
  READY: "bg-slate-500",
  IN_PROGRESS: "bg-amber-500",
  COMPLETED: "bg-emerald-600",
  HOLD: "bg-red-600",
};

const statusBadgeClassName: Record<WorkOrderStatus, string> = {
  READY: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  HOLD: "bg-red-100 text-red-700",
};
