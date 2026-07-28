import { useState } from "react";
import { ScreenHeader } from "./ScreenHeader";
import { DropZone } from "../DropZone";
import { ProgressBar } from "../ProgressBar";
import { InlineAlert } from "../InlineAlert";
import { ResultCard } from "../ResultCard";
import { loadPdfDocument, PdfOpenError, PdfPasswordRequiredError } from "../../lib/pdf/loadDocument";
import { extractPageTextItems, rasterizeAndRedactPage } from "../../lib/pdf/thumbnails";
import { detectSensitivePatterns, type PatternHit, type RedactionRect } from "../../lib/pdf/redaction";
import { runInWorker } from "../../lib/pdf/workerClient";
import { downloadBytes } from "../../lib/pdf/zip";
import { markSessionActive } from "../../lib/sessionActivity";
import type { OperationProgress } from "../../lib/pdf/types";

type Status = "idle" | "scanning" | "reviewing" | "processing" | "done" | "error";

const KIND_LABEL: Record<PatternHit["kind"], string> = { cpf: "CPF", cnpj: "CNPJ", email: "E-mail", telefone: "Telefone" };

export function RedactionTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [progress, setProgress] = useState<OperationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [verification, setVerification] = useState<string | null>(null);

  const [hits, setHits] = useState<PatternHit[]>([]);
  const [selectedHitIds, setSelectedHitIds] = useState<Set<number>>(new Set());
  const [manualRects, setManualRects] = useState<RedactionRect[]>([]);
  const [manualPage, setManualPage] = useState(1);
  const [manualX, setManualX] = useState(20);
  const [manualY, setManualY] = useState(20);
  const [manualW, setManualW] = useState(150);
  const [manualH, setManualH] = useState(20);

  const [clearMetadata, setClearMetadata] = useState(true);
  const [clearAnnotations, setClearAnnotations] = useState(true);
  const [clearAttachments, setClearAttachments] = useState(true);

  async function handleFile(files: File[]) {
    const file = files[0];
    try {
      const doc = await loadPdfDocument(file);
      setBytes(doc.bytes);
      setFileName(file.name);
      setPageCount(doc.pageCount);
      setError(null);
      setStatus("scanning");
      setProgress({ done: 0, total: doc.pageCount, stage: "Procurando CPF/CNPJ/e-mail/telefone" });
      const allHits: PatternHit[] = [];
      for (let i = 0; i < doc.pageCount; i++) {
        const items = await extractPageTextItems(doc.bytes, i);
        const pageHits = detectSensitivePatterns(items.map((it) => ({ pageIndex: i, ...it })));
        allHits.push(...pageHits);
        setProgress({ done: i + 1, total: doc.pageCount, stage: "Procurando CPF/CNPJ/e-mail/telefone" });
      }
      setHits(allHits);
      setSelectedHitIds(new Set(allHits.map((_, i) => i)));
      setStatus("reviewing");
    } catch (e) {
      if (e instanceof PdfPasswordRequiredError) setError("Este PDF está protegido por senha.");
      else if (e instanceof PdfOpenError) setError(e.message);
      else setError(String(e));
      setStatus("error");
    }
  }

  function toggleHit(idx: number) {
    const next = new Set(selectedHitIds);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedHitIds(next);
  }

  function addManualRect() {
    setManualRects([
      ...manualRects,
      { pageIndex: Math.min(Math.max(0, manualPage - 1), pageCount - 1), xPt: manualX, yPt: manualY, widthPt: manualW, heightPt: manualH },
    ]);
    markSessionActive();
  }

  async function run() {
    if (!bytes) return;
    const selectedAutoRects = hits.filter((_, i) => selectedHitIds.has(i)).map((h) => h.rect);
    const allRects = [...selectedAutoRects, ...manualRects];
    if (allRects.length === 0) {
      setError("Selecione ao menos uma ocorrência detectada ou adicione uma área manual antes de aplicar.");
      return;
    }
    setStatus("processing");
    setError(null);
    setVerification(null);
    try {
      const byPage = new Map<number, RedactionRect[]>();
      for (const r of allRects) {
        const list = byPage.get(r.pageIndex) ?? [];
        list.push(r);
        byPage.set(r.pageIndex, list);
      }
      const pagesToRedact = Array.from(byPage.keys());
      setProgress({ done: 0, total: pagesToRedact.length, stage: "Rasterizando páginas marcadas" });
      const replacements = [];
      for (let i = 0; i < pagesToRedact.length; i++) {
        const pageIndex = pagesToRedact[i];
        const rectsForPage = byPage.get(pageIndex)!.map((r) => ({ xPt: r.xPt, yPt: r.yPt, widthPt: r.widthPt, heightPt: r.heightPt }));
        const { pngBytes, widthPt, heightPt } = await rasterizeAndRedactPage(bytes, pageIndex, rectsForPage);
        replacements.push({ pageIndex, pngBytes, widthPt, heightPt });
        setProgress({ done: i + 1, total: pagesToRedact.length, stage: "Rasterizando páginas marcadas" });
      }

      const { promise } = runInWorker<{ bytes: Uint8Array }>(
        { kind: "applyRedaction", bytes, options: { replacements, clearMetadata, clearAnnotations, clearAttachments } },
        { onProgress: setProgress },
      );
      const { bytes: outBytes } = await promise;

      const remaining: string[] = [];
      for (const pageIndex of pagesToRedact) {
        const items = await extractPageTextItems(outBytes, pageIndex);
        if (items.length > 0) remaining.push(`página ${pageIndex + 1}`);
      }
      setVerification(
        remaining.length === 0
          ? "Verificação automática: nenhum texto encontrado nas páginas redigidas."
          : `Atenção: texto ainda detectado em ${remaining.join(", ")} — revise antes de compartilhar.`,
      );

      const base = fileName.replace(/\.pdf$/i, "");
      setResult({ bytes: outBytes, name: `${base}-redigido.pdf` });
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setBytes(null);
    setResult(null);
    setError(null);
    setProgress(null);
    setHits([]);
    setSelectedHitIds(new Set());
    setManualRects([]);
    setVerification(null);
  }

  return (
    <div>
      <ScreenHeader
        title="Redação segura"
        description="Remove de verdade o conteúdo marcado — a página inteira é reconstruída sem o texto/vetores originais, não apenas coberta visualmente."
      />

      <InlineAlert
        level="info"
        title="Como funciona a remoção real nesta versão web"
        message="Qualquer página com uma área marcada é convertida inteiramente em imagem (perde a camada de texto pesquisável da PÁGINA TODA, não só da área marcada). É a única forma desta versão garantir que o conteúdo não pode ser extraído sem depender do motor de reescrita do aplicativo desktop (qpdf/pikepdf). Páginas sem marcação continuam com o texto original, pesquisável."
      />

      {status === "idle" && <DropZone onFilesAccepted={(f) => void handleFile(f)} hint="Solte um arquivo PDF, ou clique para selecionar" />}

      {status === "scanning" && progress && <ProgressBar done={progress.done} total={progress.total} stage={progress.stage} />}

      {(status === "reviewing" || status === "error") && bytes && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 640 }}>
          {error && <InlineAlert level="danger" title="Não foi possível continuar" message={error} />}
          <p style={{ margin: 0 }}>
            {fileName} · {pageCount} página{pageCount === 1 ? "" : "s"}
          </p>

          <fieldset className="card" style={{ padding: "var(--space-4)" }}>
            <legend>Ocorrências detectadas automaticamente ({hits.length})</legend>
            {hits.length === 0 && <p className="text-muted" style={{ fontSize: 13 }}>Nenhum CPF, CNPJ, e-mail ou telefone em formato reconhecível foi encontrado.</p>}
            {hits.length > 0 && (
              <ul style={{ maxHeight: 220, overflow: "auto" }}>
                {hits.map((h, i) => (
                  <li key={i} style={{ fontSize: 13 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="checkbox" checked={selectedHitIds.has(i)} onChange={() => toggleHit(i)} />
                      {KIND_LABEL[h.kind]} · página {h.pageIndex + 1} · <code>{h.matchText}</code>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <fieldset className="card" style={{ padding: "var(--space-4)" }}>
            <legend>Área manual adicional</legend>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              <label style={{ fontSize: 13 }}>
                Página
                <input type="number" min={1} max={pageCount} value={manualPage} onChange={(e) => setManualPage(Number(e.target.value))} style={{ marginLeft: 6, width: 60 }} />
              </label>
              <label style={{ fontSize: 13 }}>
                X (pt)
                <input type="number" value={manualX} onChange={(e) => setManualX(Number(e.target.value))} style={{ marginLeft: 6, width: 70 }} />
              </label>
              <label style={{ fontSize: 13 }}>
                Y (pt, do topo)
                <input type="number" value={manualY} onChange={(e) => setManualY(Number(e.target.value))} style={{ marginLeft: 6, width: 70 }} />
              </label>
              <label style={{ fontSize: 13 }}>
                Largura
                <input type="number" value={manualW} onChange={(e) => setManualW(Number(e.target.value))} style={{ marginLeft: 6, width: 70 }} />
              </label>
              <label style={{ fontSize: 13 }}>
                Altura
                <input type="number" value={manualH} onChange={(e) => setManualH(Number(e.target.value))} style={{ marginLeft: 6, width: 70 }} />
              </label>
              <button type="button" className="btn" onClick={addManualRect}>Adicionar</button>
            </div>
            {manualRects.length > 0 && (
              <ul style={{ marginTop: 8 }}>
                {manualRects.map((r, i) => (
                  <li key={i} style={{ fontSize: 13 }}>
                    Página {r.pageIndex + 1} · {r.widthPt}×{r.heightPt}pt em ({r.xPt}, {r.yPt}){" "}
                    <button type="button" className="btn-text" onClick={() => setManualRects(manualRects.filter((_, idx) => idx !== i))}>
                      remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <fieldset className="card" style={{ padding: "var(--space-4)" }}>
            <legend>Limpeza adicional do documento</legend>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={clearMetadata} onChange={(e) => setClearMetadata(e.target.checked)} /> Limpar metadados (título, autor, assunto, palavras-chave)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={clearAnnotations} onChange={(e) => setClearAnnotations(e.target.checked)} /> Limpar comentários/anotações
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={clearAttachments} onChange={(e) => setClearAttachments(e.target.checked)} /> Limpar anexos
            </label>
          </fieldset>

          <button type="button" className="btn btn-danger" onClick={() => void run()}>Aplicar redação</button>
        </div>
      )}

      {status === "processing" && progress && <ProgressBar done={progress.done} total={progress.total} stage={progress.stage} />}

      {status === "done" && result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {verification && (
            <InlineAlert level={verification.startsWith("Atenção") ? "warning" : "success"} title="Verificação" message={verification} />
          )}
          <ResultCard fileName={result.name} sizeBytes={result.bytes.length} onDownload={() => downloadBytes(result.bytes, result.name, "application/pdf")} onRunAgain={reset} />
        </div>
      )}
    </div>
  );
}
