import { useState } from "react";
import { ScreenHeader } from "./ScreenHeader";
import { DropZone } from "../DropZone";
import { InlineAlert } from "../InlineAlert";
import { ResultCard } from "../ResultCard";
import { loadPdfDocument, PdfOpenError, PdfPasswordRequiredError } from "../../lib/pdf/loadDocument";
import { runInWorker } from "../../lib/pdf/workerClient";
import { downloadBytes } from "../../lib/pdf/zip";

type Status = "idle" | "loaded" | "processing" | "done" | "error";

export function MetadataTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [keywords, setKeywords] = useState("");
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(files: File[]) {
    const file = files[0];
    try {
      const doc = await loadPdfDocument(file);
      setBytes(doc.bytes);
      setFileName(file.name);
      setStatus("loaded");
      setError(null);
    } catch (e) {
      if (e instanceof PdfPasswordRequiredError) setError("Este PDF está protegido por senha.");
      else if (e instanceof PdfOpenError) setError(e.message);
      else setError(String(e));
      setStatus("error");
    }
  }

  async function run() {
    if (!bytes) return;
    setStatus("processing");
    setError(null);
    try {
      const { promise } = runInWorker<{ bytes: Uint8Array }>({
        kind: "setSimpleMetadata",
        bytes,
        meta: { title, author, subject, keywords },
      });
      const { bytes: outBytes } = await promise;
      const base = fileName.replace(/\.pdf$/i, "");
      setResult({ bytes: outBytes, name: `${base}-metadados.pdf` });
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
  }

  const field = (label: string, value: string, onChange: (v: string) => void, id: string) => (
    <div style={{ marginBottom: "var(--space-3)" }}>
      <label htmlFor={id} style={{ display: "block", fontSize: 13, marginBottom: 4, color: "var(--text-2)" }}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", height: "var(--control-height)", padding: "0 var(--space-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
      />
    </div>
  );

  return (
    <div>
      <ScreenHeader title="Metadados" description="Edite título, autor, assunto e palavras-chave do documento." />

      {status === "idle" && <DropZone onFilesAccepted={(f) => void handleFile(f)} hint="Solte um arquivo PDF, ou clique para selecionar" />}

      {status === "loaded" && bytes && (
        <div className="card" style={{ padding: "var(--space-4)", maxWidth: 480 }}>
          <p style={{ margin: "0 0 var(--space-3)" }}>{fileName}</p>
          {field("Título", title, setTitle, "meta-title")}
          {field("Autor", author, setAuthor, "meta-author")}
          {field("Assunto", subject, setSubject, "meta-subject")}
          {field("Palavras-chave (separadas por vírgula)", keywords, setKeywords, "meta-keywords")}
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button type="button" className="btn btn-primary" onClick={() => void run()}>Salvar</button>
            <button type="button" className="btn" onClick={reset}>Trocar arquivo</button>
          </div>
        </div>
      )}

      {status === "processing" && <p className="text-muted">Salvando metadados…</p>}

      {status === "done" && result && (
        <ResultCard fileName={result.name} sizeBytes={result.bytes.length} onDownload={() => downloadBytes(result.bytes, result.name, "application/pdf")} onRunAgain={reset} />
      )}

      {status === "error" && error && (
        <InlineAlert level="danger" title="Não foi possível salvar os metadados" message={error} actions={<button type="button" className="btn" onClick={reset}>Tentar novamente</button>} />
      )}
    </div>
  );
}
