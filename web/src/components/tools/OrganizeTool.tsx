import { useRef, useState } from "react";
import { ScreenHeader } from "./ScreenHeader";
import { DropZone } from "../DropZone";
import { ProgressBar } from "../ProgressBar";
import { InlineAlert } from "../InlineAlert";
import { ResultCard } from "../ResultCard";
import { Icon } from "../Icon";
import { loadPdfDocument, PdfOpenError, PdfPasswordRequiredError } from "../../lib/pdf/loadDocument";
import { renderPageThumbnail } from "../../lib/pdf/thumbnails";
import { runInWorker } from "../../lib/pdf/workerClient";
import { downloadBytes } from "../../lib/pdf/zip";
import { markSessionActive } from "../../lib/sessionActivity";
import type { OperationProgress, PageState, RotationDegrees } from "../../lib/pdf/types";

type Status = "idle" | "loading-thumbnails" | "editing" | "processing" | "done" | "error";

interface OrganizePage {
  key: string;
  sourceIndex: number; // -1 para páginas em branco inseridas
  rotation: RotationDegrees;
  selected: boolean;
  isInsertedBlank?: boolean;
  dataUrl?: string;
}

const MAX_HISTORY = 25;

function makeKey(): string {
  return `pg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function rotateBy(rotation: RotationDegrees, delta: 90 | -90): RotationDegrees {
  return (((rotation + delta) % 360) + 360) % 360 as RotationDegrees;
}

export function OrganizeTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState<OperationProgress | null>(null);
  const [pages, setPages] = useState<OrganizePage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [cancelFn, setCancelFn] = useState<(() => void) | null>(null);

  const historyRef = useRef<OrganizePage[][]>([]);
  const futureRef = useRef<OrganizePage[][]>([]);
  const [historySize, setHistorySize] = useState(0);
  const [futureSize, setFutureSize] = useState(0);

  function commit(next: OrganizePage[]) {
    historyRef.current = [...historyRef.current, pages].slice(-MAX_HISTORY);
    futureRef.current = [];
    setHistorySize(historyRef.current.length);
    setFutureSize(0);
    setPages(next);
    markSessionActive();
  }

  function undo() {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    futureRef.current = [pages, ...futureRef.current].slice(0, MAX_HISTORY);
    setHistorySize(historyRef.current.length);
    setFutureSize(futureRef.current.length);
    setPages(prev);
  }

  function redo() {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    historyRef.current = [...historyRef.current, pages].slice(-MAX_HISTORY);
    setHistorySize(historyRef.current.length);
    setFutureSize(futureRef.current.length);
    setPages(next);
  }

  async function handleFile(files: File[]) {
    const file = files[0];
    try {
      const doc = await loadPdfDocument(file);
      setBytes(doc.bytes);
      setFileName(file.name);
      setError(null);
      setStatus("loading-thumbnails");
      setProgress({ done: 0, total: doc.pageCount, stage: "Gerando miniaturas" });
      const built: OrganizePage[] = [];
      for (let i = 0; i < doc.pageCount; i++) {
        const thumb = await renderPageThumbnail(doc.bytes, i, { maxWidthPx: 140 });
        built.push({ key: makeKey(), sourceIndex: i, rotation: 0, selected: false, dataUrl: thumb.dataUrl });
        setProgress({ done: i + 1, total: doc.pageCount, stage: "Gerando miniaturas" });
      }
      historyRef.current = [];
      futureRef.current = [];
      setHistorySize(0);
      setFutureSize(0);
      setPages(built);
      setStatus("editing");
    } catch (e) {
      if (e instanceof PdfPasswordRequiredError) setError("Este PDF está protegido por senha.");
      else if (e instanceof PdfOpenError) setError(e.message);
      else setError(String(e));
      setStatus("error");
    }
  }

  function toggleSelect(key: string) {
    setPages((prev) => prev.map((p) => (p.key === key ? { ...p, selected: !p.selected } : p)));
  }

  function selectAll() {
    setPages((prev) => prev.map((p) => ({ ...p, selected: true })));
  }

  function clearSelection() {
    setPages((prev) => prev.map((p) => ({ ...p, selected: false })));
  }

  function rotateOne(key: string, delta: 90 | -90) {
    commit(pages.map((p) => (p.key === key ? { ...p, rotation: rotateBy(p.rotation, delta) } : p)));
  }

  function rotateSelected(delta: 90 | -90) {
    commit(pages.map((p) => (p.selected ? { ...p, rotation: rotateBy(p.rotation, delta) } : p)));
  }

  function duplicateOne(key: string) {
    const index = pages.findIndex((p) => p.key === key);
    if (index === -1) return;
    const copy: OrganizePage = { ...pages[index], key: makeKey(), selected: false };
    const next = pages.slice();
    next.splice(index + 1, 0, copy);
    commit(next);
  }

  function duplicateSelected() {
    const next: OrganizePage[] = [];
    for (const p of pages) {
      next.push(p);
      if (p.selected) next.push({ ...p, key: makeKey(), selected: false });
    }
    commit(next);
  }

  function deleteOne(key: string) {
    commit(pages.filter((p) => p.key !== key));
  }

  function deleteSelected() {
    commit(pages.filter((p) => !p.selected));
  }

  function insertBlankAtEnd() {
    const blank: OrganizePage = { key: makeKey(), sourceIndex: -1, rotation: 0, selected: false, isInsertedBlank: true };
    commit([...pages, blank]);
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    const sourceIndex = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(sourceIndex) || sourceIndex === targetIndex) return;
    const next = pages.slice();
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    commit(next);
  }

  async function save() {
    if (!bytes) return;
    if (pages.length === 0) {
      setError("Não é possível salvar um PDF sem nenhuma página. Adicione ao menos uma página antes de salvar.");
      setStatus("error");
      return;
    }
    const pageStates: PageState[] = pages.map((p) => ({
      sourceIndex: p.sourceIndex,
      rotation: p.rotation,
      selected: p.selected,
      isInsertedBlank: p.isInsertedBlank,
    }));
    setStatus("processing");
    setError(null);
    setProgress({ done: 0, total: pages.length, stage: "Montando documento" });
    try {
      const { promise, cancel } = runInWorker<{ bytes: Uint8Array }>(
        { kind: "rebuildFromPageStates", bytes, pages: pageStates },
        { onProgress: setProgress },
      );
      setCancelFn(() => cancel);
      const { bytes: outBytes } = await promise;
      const base = fileName.replace(/\.pdf$/i, "");
      setResult({ bytes: outBytes, name: `${base}-organizado.pdf` });
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    } finally {
      setCancelFn(null);
    }
  }

  function reset() {
    setStatus("idle");
    setBytes(null);
    setPages([]);
    setResult(null);
    setError(null);
    setProgress(null);
    historyRef.current = [];
    futureRef.current = [];
    setHistorySize(0);
    setFutureSize(0);
  }

  const selectedCount = pages.filter((p) => p.selected).length;

  return (
    <div>
      <ScreenHeader title="Organizar páginas" description="Reordene, gire, duplique, exclua e insira páginas em branco. O arquivo original nunca é modificado — você sempre salva como um novo PDF." />

      {status === "idle" && <DropZone onFilesAccepted={(f) => void handleFile(f)} hint="Solte um arquivo PDF, ou clique para selecionar" />}

      {status === "loading-thumbnails" && progress && (
        <div className="card" style={{ padding: "var(--space-4)", maxWidth: 480 }}>
          <ProgressBar done={progress.done} total={progress.total} stage={progress.stage} />
        </div>
      )}

      {status === "editing" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div className="card" style={{ padding: "var(--space-3) var(--space-4)", display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center" }}>
            <button type="button" className="btn" onClick={selectAll}>Selecionar todas</button>
            <button type="button" className="btn" onClick={clearSelection} disabled={selectedCount === 0}>Limpar seleção</button>
            <span className="text-muted" style={{ fontSize: 13 }}>{selectedCount > 0 ? `${selectedCount} selecionada${selectedCount > 1 ? "s" : ""}` : `${pages.length} páginas`}</span>
            <div style={{ width: 1, height: 24, background: "var(--border)" }} />
            <button type="button" className="btn" onClick={() => rotateSelected(-90)} disabled={selectedCount === 0} aria-label="Girar selecionadas -90 graus"><Icon kind="rotate" size={16} />-90°</button>
            <button type="button" className="btn" onClick={() => rotateSelected(90)} disabled={selectedCount === 0} aria-label="Girar selecionadas +90 graus"><Icon kind="rotate" size={16} />+90°</button>
            <button type="button" className="btn" onClick={duplicateSelected} disabled={selectedCount === 0}><Icon kind="duplicate" size={16} />Duplicar</button>
            <button type="button" className="btn btn-danger" onClick={deleteSelected} disabled={selectedCount === 0}><Icon kind="trash" size={16} />Excluir</button>
            <button type="button" className="btn" onClick={insertBlankAtEnd}><Icon kind="blank-page" size={16} />Inserir página em branco</button>
            <div style={{ width: 1, height: 24, background: "var(--border)" }} />
            <button type="button" className="btn" onClick={undo} disabled={historySize === 0} aria-label="Desfazer"><Icon kind="undo" size={16} />Desfazer</button>
            <button type="button" className="btn" onClick={redo} disabled={futureSize === 0} aria-label="Refazer"><Icon kind="redo" size={16} />Refazer</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "var(--space-3)" }}>
            {pages.map((page, index) => (
              <div
                key={page.key}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, index)}
                className="card"
                style={{
                  padding: "var(--space-2)",
                  cursor: "grab",
                  outline: page.selected ? "2px solid var(--accent)" : "none",
                  outlineOffset: 2,
                }}
              >
                <div
                  role="checkbox"
                  aria-checked={page.selected}
                  aria-label={`Selecionar página ${index + 1}`}
                  tabIndex={0}
                  onClick={() => toggleSelect(page.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggleSelect(page.key);
                  }}
                  style={{
                    height: 110,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--surface-2)",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  {page.isInsertedBlank ? (
                    <Icon kind="blank-page" size={28} className="text-muted" />
                  ) : (
                    <img
                      src={page.dataUrl}
                      alt={`Página ${index + 1}`}
                      style={{ maxHeight: "100%", maxWidth: "100%", transform: `rotate(${page.rotation}deg)` }}
                    />
                  )}
                </div>
                <p style={{ margin: "4px 0 2px", fontSize: 12, textAlign: "center" }}>
                  {index + 1}{page.isInsertedBlank ? " (em branco)" : ""}
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                  <button type="button" className="btn-text" style={{ padding: 2 }} aria-label={`Girar página ${index + 1}`} onClick={() => rotateOne(page.key, 90)}>
                    <Icon kind="rotate" size={14} />
                  </button>
                  <button type="button" className="btn-text" style={{ padding: 2 }} aria-label={`Duplicar página ${index + 1}`} onClick={() => duplicateOne(page.key)}>
                    <Icon kind="duplicate" size={14} />
                  </button>
                  <button type="button" className="btn-text" style={{ padding: 2, color: "var(--danger)" }} aria-label={`Excluir página ${index + 1}`} onClick={() => deleteOne(page.key)}>
                    <Icon kind="trash" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && <InlineAlert level="danger" title="Não foi possível salvar" message={error} />}

          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button type="button" className="btn btn-primary" onClick={() => void save()}>Salvar como novo PDF</button>
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
        <ResultCard fileName={result.name} sizeBytes={result.bytes.length} onDownload={() => downloadBytes(result.bytes, result.name, "application/pdf")} onRunAgain={reset} note="O arquivo original não foi modificado." />
      )}

      {status === "error" && error && pages.length === 0 && (
        <InlineAlert level="danger" title="Não foi possível abrir o PDF" message={error} actions={<button type="button" className="btn" onClick={reset}>Tentar novamente</button>} />
      )}
    </div>
  );
}
