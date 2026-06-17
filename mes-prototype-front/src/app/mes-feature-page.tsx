type FeaturePageProps = {
  title: string;
  description: string;
  planPath: string;
  review?: boolean;
};

export function MesFeaturePage({
  title,
  description,
  planPath,
  review = false,
}: FeaturePageProps) {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <div className="border-b border-border pb-6">
          <p className="text-sm font-medium text-muted-foreground">
            MES Prototype
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold">현재 단계</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {review
                ? "기능 구현 후 리뷰 결과와 개선 사항을 정리하는 화면입니다."
                : "기능 구현 전 placeholder 화면입니다. 계획 문서 기준으로 작은 단위부터 구현합니다."}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold">계획 문서</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              DB, API, UI 구현 범위는 기능별 계획 폴더에서 관리합니다.
            </p>
            <code className="mt-4 block rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              {planPath}
            </code>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold">다음 작업</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              엔티티, API, 화면을 한 기능 단위로 연결하고 검증합니다.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
