interface ProgressBarProps {
  done: number;
  total: number;
  stage: string;
}

export function ProgressBar({ done, total, stage }: ProgressBarProps) {
  const indeterminate = total <= 0;
  const percent = indeterminate ? 0 : Math.min(100, Math.round((done / total) * 100));
  return (
    <div role="progressbar" aria-valuenow={indeterminate ? undefined : percent} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
        <span className="text-muted">{stage}</span>
        {!indeterminate && <span className="text-muted">{percent}%</span>}
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: indeterminate ? "40%" : `${percent}%`,
            background: "var(--accent)",
            borderRadius: 999,
            animation: indeterminate ? "pdflab-indeterminate 1.1s ease-in-out infinite" : undefined,
          }}
        />
      </div>
      <style>{`
        @keyframes pdflab-indeterminate {
          0% { margin-left: 0%; }
          50% { margin-left: 60%; }
          100% { margin-left: 0%; }
        }
      `}</style>
    </div>
  );
}
