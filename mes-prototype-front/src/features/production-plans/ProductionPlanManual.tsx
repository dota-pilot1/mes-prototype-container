import {
  CalendarCheck,
  ClipboardList,
  Factory,
  GitBranch,
  PackageCheck,
} from "lucide-react";

const flow = [
  {
    title: "수요 확인",
    description: "주문, 예측, 재고 부족량을 보고 어떤 품목을 생산할지 정합니다.",
  },
  {
    title: "BOM 선택",
    description: "승인된 BOM으로 필요한 자재와 기준 수량을 확인합니다.",
  },
  {
    title: "일정 배치",
    description: "시작일, 종료일, 계획 수량을 정해 생산 가능 기간에 배치합니다.",
  },
  {
    title: "확정 후 지시",
    description: "계획을 확정하면 작업지시에서 현장 실행 단위로 전환합니다.",
  },
];

export function ProductionPlanManual() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="border-b border-border pb-6">
          <p className="text-sm font-medium text-muted-foreground">생산계획</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            생산계획 매뉴얼
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            생산계획은 고객 주문이나 예상 수요를 실제 생산 일정으로 바꾸는 기준
            데이터입니다. 무엇을, 언제부터 언제까지, 몇 개 만들지 정하고 BOM,
            재고, 작업지시가 같은 기준을 보게 합니다.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <ManualCard
            icon={<Factory className="h-5 w-5" />}
            title="무엇을 만드는가"
            description="생산 품목과 BOM을 연결해 만들 제품과 투입 기준을 명확히 합니다."
          />
          <ManualCard
            icon={<CalendarCheck className="h-5 w-5" />}
            title="언제 만드는가"
            description="시작일과 종료일로 생산 기간을 잡아 일정 겹침과 납기 위험을 확인합니다."
          />
          <ManualCard
            icon={<PackageCheck className="h-5 w-5" />}
            title="몇 개 만드는가"
            description="계획 수량으로 자재 소요량, 작업량, 완료 기준을 계산할 수 있게 합니다."
          />
        </div>

        <section className="mt-4 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-semibold">업무 흐름</h2>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {flow.map((step, index) => (
              <div key={step.title} className="rounded-md border border-border bg-background p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-base font-semibold">상태 의미</h2>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <StatusTerm title="계획" text="아직 확정 전인 초안입니다. 품목, 수량, 기간을 조정할 수 있습니다." />
              <StatusTerm title="확정" text="현장 실행 기준으로 승인된 상태입니다. 작업지시 생성 대상이 됩니다." />
              <StatusTerm title="진행" text="연결된 작업지시가 실행 중이거나 생산이 시작된 상태입니다." />
              <StatusTerm title="완료" text="계획 수량 생산이 끝나고 실적 확인까지 마친 상태입니다." />
            </dl>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold">작업지시와의 차이</h2>
            <div className="mt-5 overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="bg-muted/70 text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-semibold">구분</th>
                    <th className="px-3 py-2 font-semibold">생산계획</th>
                    <th className="px-3 py-2 font-semibold">작업지시</th>
                  </tr>
                </thead>
                <tbody>
                  <ManualRow title="목적" plan="무엇을 언제 몇 개 만들지 결정" order="현장 작업자가 수행할 작업을 지시" />
                  <ManualRow title="단위" plan="품목과 기간 중심" order="작업장, 담당자, 공정 중심" />
                  <ManualRow title="시점" plan="생산 전 계획 단계" order="계획 확정 후 실행 단계" />
                  <ManualRow title="결과" plan="일정과 수량 기준" order="실적, 진행률, 완료 처리" />
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function ManualCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
        {icon}
      </div>
      <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </section>
  );
}

function StatusTerm({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <dt className="font-semibold text-foreground">{title}</dt>
      <dd className="mt-1 leading-6 text-muted-foreground">{text}</dd>
    </div>
  );
}

function ManualRow({
  title,
  plan,
  order,
}: {
  title: string;
  plan: string;
  order: string;
}) {
  return (
    <tr className="border-t border-border">
      <td className="px-3 py-3 font-semibold text-foreground">{title}</td>
      <td className="px-3 py-3 text-muted-foreground">{plan}</td>
      <td className="px-3 py-3 text-muted-foreground">{order}</td>
    </tr>
  );
}
