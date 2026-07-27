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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const initial = getPreferredTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  function toggleTheme() {
    const next: ThemeName = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  }

  // Em telas largas o CSS ignora o atributo data-open (a barra lateral fica
  // sempre visível); só em telas <=640px o menu vira uma gaveta controlada
  // por este estado (ver @media em global.css).
  function navigateAndCloseSidebar(id: string) {
    onNavigateTool(id);
    setSidebarOpen(false);
  }

  return (
    <div className="app-shell-grid">
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
          position: "relative",
          zIndex: 41,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <button
            type="button"
            id="MenuToggle"
            className="btn"
            aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={sidebarOpen}
            aria-controls="Sidebar"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <Icon kind={sidebarOpen ? "close" : "menu"} size={18} />
          </button>
          <button type="button" onClick={onNavigateHome} className="btn-text" style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15, color: "var(--text)", padding: 0 }}>
            PDF Laboratory
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span className="text-muted" title="Processamento local no navegador" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon kind="shield" size={14} /> <span id="PrivacyBadgeText">Processamento local no navegador</span>
          </span>
          <button type="button" className="btn" onClick={onClearSession} title="Limpar sessão" aria-label="Limpar sessão">
            <Icon kind="trash" size={16} /> <span id="ClearSessionLabel">Limpar sessão</span>
          </button>
          <button type="button" className="btn" onClick={toggleTheme} aria-label="Alternar tema">
            <Icon kind={theme === "light" ? "moon" : "sun"} size={16} />
          </button>
        </div>
      </header>

      <button
        type="button"
        id="SidebarBackdrop"
        data-open={sidebarOpen}
        aria-label="Fechar menu"
        onClick={() => setSidebarOpen(false)}
      />

      <nav
        id="Sidebar"
        data-open={sidebarOpen}
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
                onClick={() => navigateAndCloseSidebar(tool.id)}
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

        <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            id="WebDesktopLink"
            onClick={() => navigateAndCloseSidebar("web-desktop")}
            style={{
              width: "100%",
              textAlign: "left",
              background: activeToolId === "web-desktop" ? "var(--surface-2)" : "transparent",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "8px 10px",
              cursor: "pointer",
              color: "var(--text-2)",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon kind="info" size={14} /> Web × Desktop: qual usar?
          </button>
        </div>
      </nav>

      <main style={{ overflowY: "auto", padding: "var(--space-6)" }}>{children}</main>
    </div>
  );
}
