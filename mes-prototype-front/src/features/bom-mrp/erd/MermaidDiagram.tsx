"use client";

import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";

type MermaidDiagramProps = {
  chart: string;
};

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: {
        background: "transparent",
        primaryColor: "#ffffff",
        primaryTextColor: "#171717",
        primaryBorderColor: "#d4d4d4",
        lineColor: "#737373",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      },
    });

    mermaid
      .render(`bom-mrp-erd-${id}`, chart)
      .then(({ svg }) => {
        if (!mounted) return;
        setSvg(svg);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "다이어그램을 렌더링하지 못했습니다.");
      });

    return () => {
      mounted = false;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="max-h-[520px] overflow-auto rounded-md border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">
        {error}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-md border border-border text-sm text-muted-foreground">
        ERD 렌더링 중...
      </div>
    );
  }

  return (
    <div
      className="overflow-auto rounded-md border border-border bg-background p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
