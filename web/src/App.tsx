import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { HomeScreen } from "./components/HomeScreen";
import { MergeTool } from "./components/tools/MergeTool";
import { SplitTool } from "./components/tools/SplitTool";
import { ExtractTool } from "./components/tools/ExtractTool";
import { WatermarkTool } from "./components/tools/WatermarkTool";
import { PageNumbersTool } from "./components/tools/PageNumbersTool";
import { MetadataTool } from "./components/tools/MetadataTool";
import { PlaceholderTool } from "./components/tools/PlaceholderTool";
import { TOOLS } from "./data/tools";
import { hasActiveWork, resetSessionActivity } from "./lib/sessionActivity";

export default function App() {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!hasActiveWork()) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  function clearSession() {
    if (hasActiveWork()) {
      const confirmed = window.confirm("Limpar a sessão descarta os arquivos carregados na memória. Deseja continuar?");
      if (!confirmed) return;
    }
    resetSessionActivity();
    setActiveToolId(null);
    setSessionKey((k) => k + 1); // remonta as telas, descartando estado/arquivos em memória
  }

  const tool = TOOLS.find((t) => t.id === activeToolId) ?? null;

  return (
    <AppShell
      activeToolId={activeToolId}
      onNavigateHome={() => setActiveToolId(null)}
      onNavigateTool={(id) => setActiveToolId(id)}
      onClearSession={clearSession}
    >
      <div key={sessionKey}>
        {!tool && <HomeScreen onSelectTool={setActiveToolId} />}
        {tool?.id === "merge" && <MergeTool />}
        {tool?.id === "split" && <SplitTool />}
        {tool?.id === "extract" && <ExtractTool />}
        {tool?.id === "watermark" && <WatermarkTool />}
        {tool?.id === "page-numbers" && <PageNumbersTool />}
        {tool?.id === "metadata" && <MetadataTool />}
        {tool && !["merge", "split", "extract", "watermark", "page-numbers", "metadata"].includes(tool.id) && (
          <PlaceholderTool tool={tool} />
        )}
      </div>
    </AppShell>
  );
}
