import { Icon } from "./Icon";
import type { ToolDescriptor } from "../lib/pdf/types";

interface ToolCardProps {
  tool: ToolDescriptor;
  onSelect: (id: string) => void;
}

export function ToolCard({ tool, onSelect }: ToolCardProps) {
  const disabled = tool.availability === "desktop-only";
  return (
    <button
      type="button"
      id="ToolCard"
      className="card"
      disabled={disabled}
      onClick={() => !disabled && onSelect(tool.id)}
      aria-label={tool.title}
      aria-description={tool.description}
      title={disabled ? tool.limitationNote : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "var(--space-2)",
        padding: "var(--space-4)",
        minHeight: 148,
        textAlign: "left",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        color: "var(--text)",
      }}
    >
      <div style={{ color: "var(--accent)" }}>
        <Icon kind={tool.icon} size={24} />
      </div>
      <span style={{ fontWeight: 600 }}>{tool.title}</span>
      <span className="text-muted" style={{ fontSize: 13, lineHeight: 1.4 }}>
        {disabled ? tool.limitationNote : tool.description}
      </span>
      {tool.availability === "limited" && (
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--warning)" }}>COM LIMITAÇÕES</span>
      )}
      {disabled && (
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>DISPONÍVEL NO APLICATIVO DESKTOP</span>
      )}
    </button>
  );
}
