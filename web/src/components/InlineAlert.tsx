import { useState, type ReactNode } from "react";

type AlertLevel = "info" | "success" | "warning" | "danger";

interface InlineAlertProps {
  level: AlertLevel;
  title: string;
  message: string;
  details?: string;
  actions?: ReactNode;
}

const LEVEL_COLOR: Record<AlertLevel, string> = {
  info: "var(--info)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};

export function InlineAlert({ level, title, message, details, actions }: InlineAlertProps) {
  const [expanded, setExpanded] = useState(false);
  const color = LEVEL_COLOR[level];
  return (
    <div
      id="InlineAlert"
      data-level={level}
      role={level === "danger" ? "alert" : "status"}
      style={{
        display: "flex",
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-4)",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${color}`,
        background: "var(--surface)",
      }}
    >
      <div style={{ width: 4, borderRadius: 2, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 600, color }}>{title}</p>
        <p style={{ margin: "2px 0 0", color: "var(--text-2)" }}>{message}</p>
        {details && (
          <>
            <button type="button" className="btn-text" onClick={() => setExpanded((v) => !v)} style={{ marginTop: 6, background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--accent)" }}>
              {expanded ? "Ocultar detalhes" : "Ver detalhes"}
            </button>
            {expanded && <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, marginTop: 6 }}>{details}</pre>}
          </>
        )}
        {actions && <div style={{ marginTop: "var(--space-2)", display: "flex", gap: "var(--space-2)" }}>{actions}</div>}
      </div>
    </div>
  );
}
