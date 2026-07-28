import { useState } from "react";
import { ScreenHeader } from "./ScreenHeader";
import { DropZone } from "../DropZone";
import { ProgressBar } from "../ProgressBar";
import { InlineAlert } from "../InlineAlert";
import { ResultCard } from "../ResultCard";
import { loadPdfDocument, PdfOpenError, PdfPasswordRequiredError } from "../../lib/pdf/loadDocument";
import { runInWorker } from "../../lib/pdf/workerClient";
import { downloadBytes } from "../../lib/pdf/zip";
import { markSessionActive } from "../../lib/sessionActivity";
import type { AttachmentInput, BookmarkInput, InternalLinkInput, PageAdvancedOptions } from "../../lib/pdf/pageAdvanced";
import type { OperationProgress } from "../../lib/pdf/types";

type Status = "idle" | "loaded" | "processing" | "done" | "error";

export function PageToolsTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [progress, setProgress] = useState<OperationProgress | null>(null);
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [cropEnabled, setCropEnabled] = useState(false);
  const [cropMargin, setCropMargin] = useState(20);

  const [batesEnabled, setBatesEnabled] = useState(false);
  const [batesPrefix, setBatesPrefix] = useState("DOC");
  const [batesStart, setBatesStart] = useState(1);
  const [batesDigits, setBatesDigits] = useState(6);

  const [attachments, setAttachments] = useState<AttachmentInput[]>([]);

  const [bookmarks, setBookmarks] = useState<BookmarkInput[]>([]);
  const [newBookmarkTitle, setNewBookmarkTitle] = useState("");
  const [newBookmarkPage, setNewBookmarkPage] = useState(1);

  const [internalLinks, setInternalLinks] = useState<InternalLinkInput[]>([]);
  const [linkFromPage, setLinkFromPage] = useState(1);
  const [linkToPage, setLinkToPage] = useState(1);

  const anyEnabled = cropEnabled || batesEnabled || attachments.length > 0 || bookmarks.length > 0 || internalLinks.length > 0;

  async function handleFile(files: File[]) {
    const file = files[0];
    try {
      const doc = await loadPdfDocument(file);
      setBytes(doc.bytes);
      setFileName(file.name);
      setPageCount(doc.pageCount);
      setStatus("loaded");
      setError(null);
    } catch (e) {
      if (e instanceof PdfPasswordRequiredError) setError("Este PDF está protegido por senha.");
      else if (e instanceof PdfOpenError) setError(e.message);
      else setError(String(e));
      setStatus("error");
    }
  }

  async function handleAttachmentFiles(files: File[]) {
    const next: AttachmentInput[] = [...attachments];
    for (const file of files) {
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      next.push({ fileName: file.name, bytes: fileBytes, mimeType: file.type || undefined });
    }
    setAttachments(next);
    markSessionActive();
  }

  function addBookmark() {
    if (!newBookmarkTitle.trim()) return;
    setBookmarks([...bookmarks, { title: newBookmarkTitle.trim(), pageIndex: Math.min(Math.max(0, newBookmarkPage - 1), pageCount - 1) }]);
    setNewBookmarkTitle("");
    markSessionActive();
  }

  function addInternalLink() {
    const fromIdx = Math.min(Math.max(0, linkFromPage - 1), pageCount - 1);
    const toIdx = Math.min(Math.max(0, linkToPage - 1), pageCount - 1);
    setInternalLinks([...internalLinks, { pageIndex: fromIdx, x: 40, y: 20, width: 120, height: 24, targetPageIndex: toIdx }]);
    markSessionActive();
  }

  async function run() {
    if (!bytes) return;
    setStatus("processing");
    setError(null);
    setProgress({ done: 0, total: 0, stage: "Preparando" });
    try {
      const options: PageAdvancedOptions = {};
      if (cropEnabled) {
        options.boxes = { pageIndices: [], cropMarginsPt: { top: cropMargin, right: cropMargin, bottom: cropMargin, left: cropMargin } };
      }
      if (batesEnabled) {
        options.bates = { prefix: batesPrefix, startNumber: batesStart, digits: batesDigits };
      }
      if (attachments.length > 0) options.attachments = attachments;
      if (bookmarks.length > 0) options.bookmarks = bookmarks;
      if (internalLinks.length > 0) options.internalLinks = internalLinks;

      const { promise } = runInWorker<{ bytes: Uint8Array }>({ kind: "applyPageAdvanced", bytes, options }, { onProgress: setProgress });
      const { bytes: outBytes } = await promise;
      const base = fileName.replace(/\.pdf$/i, "");
      setResult({ bytes: outBytes, name: `${base}-avancado.pdf` });
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
    setCropEnabled(false);
    setBatesEnabled(false);
    setAttachments([]);
    setBookmarks([]);
    setInternalLinks([]);
  }

  return (
    <div>
      <ScreenHeader
        title="Ferramentas de página avançadas"
        description="Ajuste caixas de página (recorte/redimensionamento), numeração Bates, anexos, marcadores e links internos."
      />

      {status === "idle" && <DropZone onFilesAccepted={(f) => void handleFile(f)} hint="Solte um arquivo PDF, ou clique para selecionar" />}

      {(status === "loaded" || status === "error") && bytes && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 640 }}>
          {error && <InlineAlert level="danger" title="Erro" message={error} />}
          <p style={{ margin: 0 }}>
            {fileName} · {pageCount} página{pageCount === 1 ? "" : "s"}
          </p>

          <fieldset className="card" style={{ padding: "var(--space-4)" }}>
            <legend>Caixas de página (CropBox)</legend>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={cropEnabled} onChange={(e) => setCropEnabled(e.target.checked)} />
              Recortar margens iguais em todas as páginas (não remove conteúdo, apenas a área visível)
            </label>
            {cropEnabled && (
              <label style={{ display: "block", marginTop: 8, fontSize: 13 }}>
                Margem (pontos, 1pt = 1/72")
                <input type="number" min={0} value={cropMargin} onChange={(e) => setCropMargin(Number(e.target.value))} style={{ marginLeft: 8, width: 80 }} />
              </label>
            )}
          </fieldset>

          <fieldset className="card" style={{ padding: "var(--space-4)" }}>
            <legend>Numeração Bates</legend>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={batesEnabled} onChange={(e) => setBatesEnabled(e.target.checked)} />
              Aplicar identificador sequencial (ex.: DOC000001)
            </label>
            {batesEnabled && (
              <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                <label style={{ fontSize: 13 }}>
                  Prefixo
                  <input type="text" value={batesPrefix} onChange={(e) => setBatesPrefix(e.target.value)} style={{ marginLeft: 6, width: 80 }} />
                </label>
                <label style={{ fontSize: 13 }}>
                  Início
                  <input type="number" min={0} value={batesStart} onChange={(e) => setBatesStart(Number(e.target.value))} style={{ marginLeft: 6, width: 80 }} />
                </label>
                <label style={{ fontSize: 13 }}>
                  Dígitos
                  <input type="number" min={1} max={12} value={batesDigits} onChange={(e) => setBatesDigits(Number(e.target.value))} style={{ marginLeft: 6, width: 60 }} />
                </label>
              </div>
            )}
          </fieldset>

          <fieldset className="card" style={{ padding: "var(--space-4)" }}>
            <legend>Anexos</legend>
            <input
              type="file"
              multiple
              aria-label="Selecionar arquivos para anexar"
              onChange={(e) => {
                void handleAttachmentFiles(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
            {attachments.length > 0 && (
              <ul style={{ marginTop: 8 }}>
                {attachments.map((a, i) => (
                  <li key={`${a.fileName}-${i}`} style={{ fontSize: 13 }}>
                    {a.fileName}{" "}
                    <button type="button" className="btn-text" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}>
                      remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <fieldset className="card" style={{ padding: "var(--space-4)" }}>
            <legend>Marcadores (bookmarks)</legend>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              <label style={{ fontSize: 13 }}>
                Título
                <input type="text" value={newBookmarkTitle} onChange={(e) => setNewBookmarkTitle(e.target.value)} style={{ marginLeft: 6 }} />
              </label>
              <label style={{ fontSize: 13 }}>
                Página
                <input type="number" min={1} max={pageCount} value={newBookmarkPage} onChange={(e) => setNewBookmarkPage(Number(e.target.value))} style={{ marginLeft: 6, width: 60 }} />
              </label>
              <button type="button" className="btn" onClick={addBookmark}>Adicionar</button>
            </div>
            {bookmarks.length > 0 && (
              <ul style={{ marginTop: 8 }}>
                {bookmarks.map((b, i) => (
                  <li key={`${b.title}-${i}`} style={{ fontSize: 13 }}>
                    "{b.title}" → página {b.pageIndex + 1}{" "}
                    <button type="button" className="btn-text" onClick={() => setBookmarks(bookmarks.filter((_, idx) => idx !== i))}>
                      remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <fieldset className="card" style={{ padding: "var(--space-4)" }}>
            <legend>Links internos</legend>
            <p className="text-muted" style={{ fontSize: 12, marginTop: 0 }}>Cria uma área clicável no canto superior esquerdo da página de origem que navega para a página de destino.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              <label style={{ fontSize: 13 }}>
                Da página
                <input type="number" min={1} max={pageCount} value={linkFromPage} onChange={(e) => setLinkFromPage(Number(e.target.value))} style={{ marginLeft: 6, width: 60 }} />
              </label>
              <label style={{ fontSize: 13 }}>
                Para a página
                <input type="number" min={1} max={pageCount} value={linkToPage} onChange={(e) => setLinkToPage(Number(e.target.value))} style={{ marginLeft: 6, width: 60 }} />
              </label>
              <button type="button" className="btn" onClick={addInternalLink}>Adicionar</button>
            </div>
            {internalLinks.length > 0 && (
              <ul style={{ marginTop: 8 }}>
                {internalLinks.map((l, i) => (
                  <li key={i} style={{ fontSize: 13 }}>
                    Página {l.pageIndex + 1} → página {l.targetPageIndex + 1}{" "}
                    <button type="button" className="btn-text" onClick={() => setInternalLinks(internalLinks.filter((_, idx) => idx !== i))}>
                      remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <button type="button" className="btn btn-primary" disabled={!anyEnabled} onClick={() => void run()}>
            Aplicar
          </button>
        </div>
      )}

      {status === "processing" && progress && <ProgressBar done={progress.done} total={progress.total} stage={progress.stage} />}

      {status === "done" && result && (
        <ResultCard
          fileName={result.name}
          sizeBytes={result.bytes.length}
          onDownload={() => downloadBytes(result.bytes, result.name, "application/pdf")}
          onRunAgain={reset}
        />
      )}
    </div>
  );
}
