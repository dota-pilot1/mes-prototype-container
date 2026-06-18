"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Gauge, PackageCheck, TriangleAlert } from "lucide-react";
import { monitoringApi } from "@/entities/monitoring/api/monitoringApi";
import type {
  LineStatus,
  MonitoringLineSnapshot,
} from "@/entities/monitoring/model/types";

const POLL_MS = 2000;

export function MonitoringDashboard() {
  const {
    data: lines = [],
    isLoading,
    isError,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["monitoring-snapshot"],
    queryFn: monitoringApi.snapshot,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: false,
  });

  const running = lines.filter((l) => l.status === "RUNNING").length;
  const idle = lines.filter((l) => l.status === "IDLE").length;
  const stopped = lines.filter((l) => l.status === "STOPPED").length;
  const runningLines = lines.filter((l) => l.status === "RUNNING");
  const avgOee =
    runningLines.length === 0
      ? 0
      : Math.round(
          runningLines.reduce((sum, l) => sum + l.oee, 0) / runningLines.length
        );
  const totalOutput = lines.reduce((sum, l) => sum + l.outputQty, 0);
  const updatedAt = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("ko-KR")
    : "-";

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-6 py-5">
      <section className="mx-auto min-w-0 max-w-[1600px]">
        <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">MES Prototype</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
              모니터링
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              작업지시 기반으로 라인별 가동 현황을 도출하고, 가동률·생산량·불량률은
              시뮬레이션으로 {POLL_MS / 1000}초마다 갱신합니다.
            </p>
          </div>
          <div className="inline-flex h-9 items-center gap-2 self-start rounded-md border border-border bg-card px-3 text-sm text-muted-foreground">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            실시간 · {updatedAt}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <SummaryCard icon={<Activity className="h-4 w-4" />} label="가동" value={`${running}`} tone="ok" />
          <SummaryCard label="대기" value={`${idle}`} />
          <SummaryCard icon={<TriangleAlert className="h-4 w-4" />} label="정지" value={`${stopped}`} tone={stopped > 0 ? "warn" : "default"} />
          <SummaryCard icon={<Gauge className="h-4 w-4" />} label="평균 OEE (가동)" value={`${avgOee}%`} />
        </div>

        {isError ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            모니터링 데이터를 불러오지 못했습니다. 백엔드(/api/monitoring/snapshot)와 로그인 상태를 확인하세요.
          </div>
        ) : isLoading ? (
          <div className="mt-4 text-sm text-muted-foreground">불러오는 중…</div>
        ) : lines.length === 0 ? (
          <div className="mt-4 rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            표시할 라인이 없습니다. 작업지시에 작업장이 등록되어 있어야 합니다.
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">라인별 현황</h2>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <PackageCheck className="h-4 w-4" />
                누적 생산 {totalOutput.toLocaleString()}개
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {lines.map((line) => (
                <LineCard key={line.line} snapshot={line} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function LineCard({ snapshot }: { snapshot: MonitoringLineSnapshot }) {
  const meta = statusMeta[snapshot.status];
  const outputPct =
    snapshot.targetQty > 0
      ? Math.min(100, Math.round((snapshot.outputQty / snapshot.targetQty) * 100))
      : 0;

  return (
    <article className={`rounded-lg border bg-card p-4 shadow-sm ${meta.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-foreground">{snapshot.line}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {snapshot.workOrderCode
              ? `${snapshot.workOrderCode} · ${snapshot.itemName ?? ""}${
                  snapshot.processName ? ` · ${snapshot.processName}` : ""
                }`
              : "배정된 작업 없음"}
          </p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        <Metric label="OEE 가동률" value={`${snapshot.oee}%`}>
          <Bar pct={snapshot.oee} className={oeeBarClass(snapshot.oee)} />
        </Metric>
        <Metric
          label="생산 / 목표"
          value={`${snapshot.outputQty.toLocaleString()} / ${snapshot.targetQty.toLocaleString()}`}
        >
          <Bar pct={outputPct} className="bg-sky-500" />
        </Metric>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">불량률</span>
          <span
            className={`font-semibold ${
              snapshot.defectRate >= 3 ? "text-red-600" : "text-foreground"
            }`}
          >
            {snapshot.defectRate.toFixed(1)}%
          </span>
        </div>
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{value}</span>
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Bar({ pct, className }: { pct: number; className: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all duration-500 ${className}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

function oeeBarClass(oee: number) {
  if (oee >= 80) return "bg-emerald-500";
  if (oee >= 60) return "bg-amber-500";
  if (oee > 0) return "bg-red-500";
  return "bg-slate-300";
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
  tone?: "default" | "ok" | "warn";
}) {
  const valueClass =
    tone === "warn"
      ? "text-red-600"
      : tone === "ok"
        ? "text-emerald-600"
        : "text-foreground";
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</div>
    </section>
  );
}

const statusMeta: Record<
  LineStatus,
  { label: string; badge: string; dot: string; border: string }
> = {
  RUNNING: {
    label: "가동",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  IDLE: {
    label: "대기",
    badge: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    border: "border-border",
  },
  STOPPED: {
    label: "정지",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    border: "border-red-200",
  },
};
