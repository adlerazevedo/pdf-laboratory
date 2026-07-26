import { useMemo, useState } from "react";
import { ScreenHeader } from "./ScreenHeader";
import { DropZone } from "../DropZone";
import { ProgressBar } from "../ProgressBar";
import { InlineAlert } from "../InlineAlert";
import { ResultCard } from "../ResultCard";
import { loadPdfDocument, PdfOpenError, PdfPasswordRequiredError } from "../../lib/pdf/loadDocument";
import { runInWorker } from "../../lib/pdf/workerClient";
import { buildZip, downloadBytes } from "../../lib/pdf/zip";
import {
  planCustomRanges,
  planEachPage,
  planEveryNPages,
  planExtractSelection,
  planIntoNFiles,
  planOddEven,
  type SplitMode,
  type SplitPlan,
} from "../../lib/splitPlanning";
import type { OperationProgress } from "../../lib/pdf/types";

type Status = "idle" | "loaded" | "processing" | "done" | "error";

const MODE_LABELS: Record<SplitMode, string> = {
  "each-page": "Cada página em um arquivo",
  "custom-ranges": "Intervalos personalizados",
  "every-n": "A cada N páginas",
  "into-n-files": "Dividir em N arquivos",
  "odd-even": "Páginas pares e ímpares",
  "extract-selection": "Extrair seleção (um único arquivo)",
};

function computePlan(
  mode: SplitMode,
  pageCount: number,
  customRangesText: string,
  everyN: string,
  intoNFiles: string,
  extractSelectionText: string,
): SplitPlan {
  switch (mode) {
    case "each-page":
      return planEachPage(pageCount);
    case "custom-ranges":
      return planCustomRanges(customRangesText, pageCount);
    case "every-n":
      return planEveryNPages(Number(everyN), pageCount);
    case "into-n-files":
      return planIntoNFiles(Number(intoNFiles), pageCount);
    case "odd-even":
      return planOddEven(pageCount);
    case "extract-selection":
      return planExtractSelection(extractSelectionText, pageCount);
  }
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "var(--control-height)",
  padding: "0 var(--space-3)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
};

export function SplitTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [pageCount, setPageCount] = useState(0);

  const [mode, setMode] = useState<SplitMode>("custom-ranges");
  const [customRangesText, setCustomRangesText] = useState("");
  const [everyN, setEveryN] = useState("1");
  const [intoNFiles, setIntoNFiles] = useState("2");
  const [extractSelectionText, setExtractSelectionText] = useState("");

  const [progress, setProgress] = useState<OperationProgress | null>(null);
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cancelFn, setCancelFn] = useState<(() => void) | null>(null);

  const plan = useMemo(
    () => computePlan(mode, pageCount, customRangesText, everyN, intoNFiles, extractSelectionText),
    [mode, pageCount, customRangesText, everyN, intoNFiles, extractSelectionText],
  );

  async function handleFile(files: File[]) {
    const file = files[0];
    try {
      const doc = await loadPdfDocument(file);
      setBytes(doc.bytes);
      setFileName(file.name);
      setPageCount(doc.pageCount);
      setCustomRangesText(`1-${doc.pageCount}`);
      setExtractSelectionText(`1-${doc.pageCount}`);
      setStatus("loaded");
      setLoadError(null);
    } catch (e) {
      if (e instanceof PdfPasswordRequiredError) setLoadError("Este PDF está protegido por senha. Ainda não é possível dividir arquivos protegidos nesta versão web.");
      else if (e instanceof PdfOpenError) setLoadError(e.message);
      else setLoadError(String(e));
      setStatus("error");
    }
  }

  async function runSplit() {
    if (!bytes || plan.error || plan.groups.length === 0) return;
    setStatus("processing");
    setProgress({ done: 0, total: plan.groups.length, stage: "Preparando" });
    const base = fileName.replace(/\.pdf$/i, "");
    try {
      const { promise, cancel } = runInWorker<{ documents: Uint8Array[] }>(
        { kind: "splitByPageGroups", bytes, groups: plan.groups.map((g) => g.pages) },
        { onProgress: setProgress },
      );
      setCancelFn(() => cancel);
      const { documents } = await promise;
      if (documents.length === 1) {
        setResult({ bytes: documents[0], name: `${base}-extraido.pdf` });
      } else {
        const zipBytes = await buildZip(documents.map((doc, i) => ({ fileName: `${base}-parte-${i + 1}.pdf`, bytes: doc })));
        setResult({ bytes: zipBytes, name: `${base}-dividido.zip` });
      }
      setStatus("done");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    } finally {
      setCancelFn(null);
    }
  }

  function reset() {
    setStatus("idle");
    setBytes(null);
    setResult(null);
    setLoadError(null);
    setProgress(null);
  }

  return (
    <div>
      <ScreenHeader title="Dividir PDF" description="Separe um PDF em vários arquivos, do jeito que você precisar. Quando há mais de uma saída, tudo é baixado junto em um .zip." />

      {status === "idle" && <DropZone onFilesAccepted={(f) => void handleFile(f)} hint="Solte um arquivo PDF, ou clique para selecionar" />}

      {status === "loaded" && bytes && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 640 }}>
          <div className="card" style={{ padding: "var(--space-4)" }}>
            <p style={{ margin: "0 0 var(--space-3)" }}>{fileName} — {pageCount} páginas</p>

            <label style={{ fontSize: 13, display: "block", marginBottom: "var(--space-3)" }}>
              Modo de divisão
              <select value={mode} onChange={(e) => setMode(e.target.value as SplitMode)} style={{ ...inputStyle, marginTop: 4 }}>
                {(Object.keys(MODE_LABELS) as SplitMode[]).map((m) => (
                  <option key={m} value={m}>{MODE_LABELS[m]}</option>
                ))}
              </select>
            </label>

            {mode === "custom-ranges" && (
              <label style={{ fontSize: 13, display: "block" }}>
                Um intervalo por linha (cada linha vira um arquivo)
                <textarea
                  value={customRangesText}
                  onChange={(e) => setCustomRangesText(e.target.value)}
                  rows={4}
                  style={{ ...inputStyle, height: "auto", padding: "var(--space-2) var(--space-3)", marginTop: 4, resize: "vertical", fontFamily: "monospace" }}
                />
                <span className="text-muted" style={{ fontSize: 12 }}>
                  Exemplo: uma linha "1-3" e outra "5,8-10" geram dois arquivos — o primeiro com as páginas 1 a 3, o segundo com as páginas 5, 8, 9 e 10.
                </span>
              </label>
            )}

            {mode === "every-n" && (
              <label style={{ fontSize: 13, display: "block" }}>
                Páginas por arquivo
                <input type="number" min={1} value={everyN} onChange={(e) => setEveryN(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
                <span className="text-muted" style={{ fontSize: 12 }}>Exemplo: com 3, um documento de 10 páginas vira 4 arquivos (3+3+3+1 páginas).</span>
              </label>
            )}

            {mode === "into-n-files" && (
              <label style={{ fontSize: 13, display: "block" }}>
                Número de arquivos
                <input type="number" min={1} value={intoNFiles} onChange={(e) => setIntoNFiles(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
                <span className="text-muted" style={{ fontSize: 12 }}>As páginas são distribuídas o mais igualmente possível entre os arquivos.</span>
              </label>
            )}

            {mode === "extract-selection" && (
              <label style={{ fontSize: 13, display: "block" }}>
                Páginas a extrair (ex.: 1-3, 5, 8-10)
                <input value={extractSelectionText} onChange={(e) => setExtractSelectionText(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
                <span className="text-muted" style={{ fontSize: 12 }}>Gera um único PDF novo só com as páginas indicadas, na ordem indicada.</span>
              </label>
            )}

            {(mode === "each-page" || mode === "odd-even") && (
              <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>
                {mode === "each-page" ? `Gera ${pageCount} arquivo${pageCount > 1 ? "s" : ""}, um por página.` : "Gera 2 arquivos: um só com as páginas ímpares, outro só com as pares."}
              </p>
            )}
          </div>

          <div className="card" style={{ padding: "var(--space-4)" }}>
            <p style={{ margin: "0 0 var(--space-2)", fontWeight: 600 }}>
              {plan.error
                ? "Corrija a configuração para ver o resumo"
                : `${plan.groups.length} arquivo${plan.groups.length > 1 ? "s" : ""} de saída`}
            </p>
            {plan.error && <InlineAlert level="warning" title="Configuração inválida" message={plan.error} />}
            {!plan.error && (
              <ul style={{ margin: 0, paddingLeft: "var(--space-4)", maxHeight: 220, overflowY: "auto", fontSize: 13 }}>
                {plan.groups.map((g, i) => (
                  <li key={i}>{g.label}</li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button type="button" className="btn btn-primary" disabled={!!plan.error || plan.groups.length === 0} onClick={() => void runSplit()}>
              Dividir
            </button>
            <button type="button" className="btn" onClick={reset}>Trocar arquivo</button>
          </div>
        </div>
      )}

      {status === "processing" && progress && (
        <div className="card" style={{ padding: "var(--space-4)", maxWidth: 480 }}>
          <ProgressBar done={progress.done} total={progress.total} stage={progress.stage} />
          <button type="button" className="btn" style={{ marginTop: "var(--space-3)" }} onClick={() => cancelFn?.()}>Cancelar</button>
        </div>
      )}

      {status === "done" && result && (
        <ResultCard
          fileName={result.name}
          sizeBytes={result.bytes.length}
          onDownload={() => downloadBytes(result.bytes, result.name, result.name.endsWith(".zip") ? "application/zip" : "application/pdf")}
          onRunAgain={reset}
        />
      )}

      {status === "error" && loadError && (
        <InlineAlert level="danger" title="Não foi possível processar o arquivo" message={loadError} actions={<button type="button" className="btn" onClick={reset}>Tentar novamente</button>} />
      )}
    </div>
  );
}
