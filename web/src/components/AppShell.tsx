import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { applyTheme, getPreferredTheme, type ThemeName } from "../lib/theme";
import { TOOLS } from "../data/tools";

interface AppShellProps {
  activeToolId: string | null;
  onNavigateHome: () => void;
  onNavigateTool: (id: string) => void;
  onClearSession: () => void;
  children: ReactNode;
}

export function AppShell({ activeToolId, onNavigateHome, onNavigateTool, onClearSession, children }: AppShellProps) {
  const [theme, setTheme] = useState<ThemeName>("light");

  useEffect(() => {
    const initial = getPreferredTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggleTheme() {
    const next: ThemeName = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gridTemplateRows: "auto 1fr", height: "100%" }}>
      <header
        id="AppHeader"
        style={{
          gridColumn: "1 / 3",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 var(--space-5)",
          height: 56,
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <button type="button" onClick={onNavigateHome} className="btn-text" style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15, color: "var(--text)", padding: 0 }}>
          PDF Laboratory
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span className="text-muted" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon kind="shield" size={14} /> Processamento local no navegador
          </span>
          <button type="button" className="btn" onClick={onClearSession} title="Limpar sessão">
            <Icon kind="trash" size={16} /> Limpar sessão
          </button>
          <button type="button" className="btn" onClick={toggleTheme} aria-label="Alternar tema">
            <Icon kind={theme === "light" ? "moon" : "sun"} size={16} />
          </button>
        </div>
      </header>

      <nav
        id="Sidebar"
        style={{
          borderRight: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "var(--space-4)",
          overflowY: "auto",
        }}
      >
        <p id="SidebarBrand" style={{ fontWeight: 700, margin: "0 0 2px" }}>PDF Laboratory</p>
        <p id="SidebarSubtitle" className="text-muted" style={{ fontSize: 12, margin: "0 0 var(--space-4)" }}>
          Local • Privado • Offline
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          {TOOLS.map((tool) => (
            <li key={tool.id}>
              <button
                type="button"
                disabled={tool.availability === "desktop-only"}
                onClick={() => onNavigateTool(tool.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: activeToolId === tool.id ? "var(--surface-2)" : "transparent",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 10px",
                  cursor: tool.availability === "desktop-only" ? "not-allowed" : "pointer",
                  color: tool.availability === "desktop-only" ? "var(--text-2)" : "var(--text)",
                  fontSize: 13,
                }}
              >
                {tool.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main style={{ overflowY: "auto", padding: "var(--space-6)" }}>{children}</main>
    </div>
  );
}
