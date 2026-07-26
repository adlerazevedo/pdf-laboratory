import { ScreenHeader } from "./ScreenHeader";
import { InlineAlert } from "../InlineAlert";
import type { ToolDescriptor } from "../../lib/pdf/types";

interface PlaceholderToolProps {
  tool: ToolDescriptor;
}

/**
 * Para ferramentas "browser"/"limited" ainda não implementadas nesta versão
 * web, ou "desktop-only". Nunca finge um botão ativo — mostra o status real.
 */
export function PlaceholderTool({ tool }: PlaceholderToolProps) {
  const isDesktopOnly = tool.availability === "desktop-only";
  return (
    <div>
      <ScreenHeader title={tool.title} description={tool.description} />
      {isDesktopOnly ? (
        <InlineAlert
          level="info"
          title="Disponível no aplicativo desktop"
          message={tool.limitationNote ?? "Esta ferramenta depende de um componente nativo e não pode rodar com segurança no navegador."}
        />
      ) : (
        <InlineAlert
          level="warning"
          title="Em desenvolvimento nesta versão web"
          message="Esta ferramenta ainda não foi implementada nesta versão web. O motor de PDF já suporta a operação; falta apenas a interface. Use o aplicativo desktop enquanto isso."
          details={tool.limitationNote}
        />
      )}
    </div>
  );
}
