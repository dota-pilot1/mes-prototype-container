import { readFileSync } from "node:fs";
import path from "node:path";
import { MermaidDiagram } from "@/features/bom-mrp/erd/MermaidDiagram";

const erdFilePath = path.join(
  process.cwd(),
  "..",
  "docs-for-mes 기본 기능 구현 해보기 계획",
  "02-production-plan-gantt",
  "production-plan-erd.mmd"
);

export default function ProductionPlanErdPage() {
  const erdSource = readFileSync(erdFilePath, "utf8");

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="border-b border-border pb-6">
          <p className="text-sm font-medium text-muted-foreground">생산계획</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            생산계획 ERD
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            생산계획은 승인된 BOM과 생산 품목을 기준으로 언제, 몇 개를 만들지
            정하고 작업지시로 넘기는 계획 데이터입니다.
          </p>
        </div>

        <section className="mt-8 rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-base font-semibold">Mermaid ERD</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                아래 다이어그램은 생산계획 mmd 파일 원본을 직접 읽어서 표시합니다.
              </p>
            </div>
            <code className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              docs-for-mes 기본 기능 구현 해보기 계획/02-production-plan-gantt/production-plan-erd.mmd
            </code>
          </div>
          <MermaidDiagram chart={erdSource} />
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold">읽는 순서</h2>
            <div className="mt-5 space-y-3 text-sm text-muted-foreground">
              <Relation from="items" to="production_plans" label="생산할 품목을 계획에 연결" />
              <Relation from="boms" to="production_plans" label="승인된 BOM을 기준 정보로 사용" />
              <Relation from="production_plans" to="work_orders" label="확정 계획을 현장 작업지시로 전환" />
              <Relation from="users" to="production_plans" label="작성자와 승인자를 추적" />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Mermaid 파일</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              생산계획 ERD 원본은 mmd 파일로 관리합니다. Mermaid 뷰어에서도 같은 파일을 열어 관계를 확인할 수 있습니다.
            </p>
            <code className="mt-4 block rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              docs-for-mes 기본 기능 구현 해보기 계획/02-production-plan-gantt/production-plan-erd.mmd
            </code>
          </section>
        </div>

        <section className="mt-4 rounded-lg border border-border bg-card p-5">
          <h2 className="text-base font-semibold">핵심 테이블</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <TableCard
              name="production_plans"
              fields={["plan_code", "item_id", "bom_id", "planned_quantity", "start_date", "end_date", "status"]}
            />
            <TableCard
              name="items"
              fields={["item_code", "item_name", "item_type", "unit"]}
            />
            <TableCard
              name="boms"
              fields={["bom_code", "product_item_id", "version", "status"]}
            />
            <TableCard
              name="work_orders"
              fields={["work_order_code", "production_plan_id", "ordered_quantity", "status"]}
            />
          </div>
        </section>
      </section>
    </main>
  );
}

function Relation({
  from,
  to,
  label,
}: {
  from: string;
  to: string;
  label: string;
}) {
  return (
    <div className="grid grid-cols-[130px_24px_160px_1fr] items-center gap-2 rounded-md border border-border px-3 py-2">
      <code className="font-semibold text-foreground">{from}</code>
      <span>→</span>
      <code className="font-semibold text-foreground">{to}</code>
      <span>{label}</span>
    </div>
  );
}

function TableCard({ name, fields }: { name: string; fields: string[] }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <h3 className="font-mono text-sm font-bold">{name}</h3>
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        {fields.map((field) => (
          <li key={field}>
            <code>{field}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
