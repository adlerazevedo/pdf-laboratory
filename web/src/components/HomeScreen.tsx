import { useMemo, useState } from "react";
import { Icon } from "./Icon";
import { ToolCard } from "./ToolCard";
import { TOOLS_PRINCIPAIS, TOOLS_SEGURANCA } from "../data/tools";

interface HomeScreenProps {
  onSelectTool: (id: string) => void;
}

export function HomeScreen({ onSelectTool }: HomeScreenProps) {
  const [query, setQuery] = useState("");

  const filterFn = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (list: typeof TOOLS_PRINCIPAIS) =>
      q ? list.filter((t) => `${t.title} ${t.description}`.toLowerCase().includes(q)) : list;
  }, [query]);

  const principais = filterFn(TOOLS_PRINCIPAIS);
  const seguranca = filterFn(TOOLS_SEGURANCA);

  return (
    <div>
      <h1 style={{ margin: "0 0 var(--space-1)", fontSize: 22 }}>O que você deseja fazer?</h1>
      <p className="text-muted" style={{ margin: "0 0 var(--space-5)" }}>
        Todo o processamento acontece neste navegador. Nenhum documento é enviado a servidores.
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: "0 var(--space-3)",
          height: "var(--control-height)",
          background: "var(--surface)",
          maxWidth: 420,
          marginBottom: "var(--space-6)",
        }}
      >
        <Icon kind="search" size={16} className="text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou descrição da ferramenta"
          aria-label="Buscar ferramentas"
          style={{ border: "none", outline: "none", background: "transparent", flex: 1, color: "var(--text)" }}
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)" }}>
            <Icon kind="close" size={14} />
          </button>
        )}
      </div>

      {principais.length > 0 && (
        <section style={{ marginBottom: "var(--space-6)" }}>
          <h2 id="SectionHeading" style={{ fontSize: 12, letterSpacing: 0.6, color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 var(--space-3)" }}>
            Ferramentas principais
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
            {principais.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onSelect={onSelectTool} />
            ))}
          </div>
        </section>
      )}

      {seguranca.length > 0 && (
        <section>
          <h2 id="SectionHeading" style={{ fontSize: 12, letterSpacing: 0.6, color: "var(--text-2)", textTransform: "uppercase", margin: "0 0 var(--space-3)" }}>
            Segurança e documentos
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
            {seguranca.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onSelect={onSelectTool} />
            ))}
          </div>
        </section>
      )}

      {principais.length === 0 && seguranca.length === 0 && (
        <p className="text-muted">Nenhuma ferramenta encontrada para "{query}".</p>
      )}
    </div>
  );
}
