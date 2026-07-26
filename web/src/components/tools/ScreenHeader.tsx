interface ScreenHeaderProps {
  title: string;
  description: string;
}

export function ScreenHeader({ title, description }: ScreenHeaderProps) {
  return (
    <div style={{ marginBottom: "var(--space-5)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <h1 id="ScreenTitle" style={{ margin: 0, fontSize: 20 }}>{title}</h1>
        <span
          id="LocalBadge"
          style={{ fontSize: 11, fontWeight: 600, color: "var(--info)", border: "1px solid var(--info)", borderRadius: 999, padding: "1px 8px" }}
        >
          Processamento local neste navegador
        </span>
      </div>
      <p id="ScreenSubtitle" className="text-muted" style={{ margin: "4px 0 0" }}>{description}</p>
    </div>
  );
}
