import { readFileSync } from "node:fs";
import path from "node:path";
import { MermaidDiagram } from "@/features/bom-mrp/erd/MermaidDiagram";

const erdFilePath = path.join(
  process.cwd(),
  "..",
  "docs-for-mes 기본 기능 구현 해보기 계획",
  "01-bom-mrp",
  "bom-mrp-erd.mmd"
);

export default function BomMrpErdPage() {
  const erdSource = readFileSync(erdFilePath, "utf8");

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="border-b border-border pb-6">
          <p className="text-sm font-medium text-muted-foreground">
            BOM/MRP
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            ERD
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            BOM은 제품을 만들기 위한 설계서입니다. 품목을 먼저 만들고, BOM 헤더에 생산 품목을 연결한 뒤, BOM 상세에 필요한 자재 품목과 수량을 등록합니다.
          </p>
        </div>

        <section className="mt-8 rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-base font-semibold">Mermaid ERD</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                아래 다이어그램은 mmd 파일 원본을 직접 읽어서 표시합니다.
              </p>
            </div>
            <code className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              docs-for-mes 기본 기능 구현 해보기 계획/01-bom-mrp/bom-mrp-erd.mmd
            </code>
          </div>
          <MermaidDiagram chart={erdSource} />
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold">읽는 순서</h2>
            <div className="mt-5 space-y-3 text-sm text-muted-foreground">
              <Relation from="items" to="boms" label="의자 같은 생산 품목을 BOM 설계서에 연결" />
              <Relation from="boms" to="bom_lines" label="설계서 안에 필요한 자재 라인을 등록" />
              <Relation from="items" to="bom_lines" label="나무, 나사 같은 자재 품목을 라인에서 선택" />
              <Relation from="items" to="inventories" label="품목별 현재고와 예약 수량 관리" />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Mermaid 파일</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              다이어그램 원본은 mmd 파일로 관리합니다. Mermaid 뷰어에서 열면 관계가 그림으로 보입니다.
            </p>
            <code className="mt-4 block rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              docs-for-mes 기본 기능 구현 해보기 계획/01-bom-mrp/bom-mrp-erd.mmd
            </code>
          </section>
        </div>

        <section className="mt-4 rounded-lg border border-border bg-card p-5">
          <h2 className="text-base font-semibold">예시 흐름</h2>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-5">
            <FlowCard title="품목" text="의자, 나무, 나사를 등록" />
            <FlowArrow />
            <FlowCard title="BOM" text="의자 표준 BOM 생성" />
            <FlowArrow />
            <FlowCard title="BOM 상세" text="나무 1개, 나사 4개 필요" />
          </div>
        </section>

        <section className="mt-4 rounded-lg border border-border bg-card p-5">
          <h2 className="text-base font-semibold">테이블</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <TableCard
              name="items"
              fields={["item_code", "item_name", "item_type", "unit", "safety_stock"]}
            />
            <TableCard
              name="boms"
              fields={["bom_code", "bom_name", "product_item_id", "version", "status"]}
            />
            <TableCard
              name="bom_lines"
              fields={["bom_id", "material_item_id", "required_qty", "loss_rate"]}
            />
            <TableCard
              name="inventories"
              fields={["item_id", "on_hand_qty", "reserved_qty", "available_qty"]}
            />
          </div>
        </section>
      </section>
    </main>
  );
}

function FlowCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-xs leading-5">{text}</p>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="hidden items-center justify-center text-muted-foreground md:flex">
      →
    </div>
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
    <div className="grid grid-cols-[110px_24px_120px_1fr] items-center gap-2 rounded-md border border-border px-3 py-2">
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
