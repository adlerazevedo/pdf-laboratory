import { useMemo, useState } from "react";
import { ScreenHeader } from "./ScreenHeader";
import { DropZone } from "../DropZone";
import { ProgressBar } from "../ProgressBar";
import { InlineAlert } from "../InlineAlert";
import { ResultCard } from "../ResultCard";
import { loadPdfDocument, PdfOpenError, PdfPasswordRequiredError } from "../../lib/pdf/loadDocument";
import { renderPageThumbnail } from "../../lib/pdf/thumbnails";
import { readFillableFields, type FillableField, type FillValue } from "../../lib/pdf/formFill";
import { runInWorker } from "../../lib/pdf/workerClient";
import { downloadBytes } from "../../lib/pdf/zip";
import { markSessionActive } from "../../lib/sessionActivity";
import type { OperationProgress } from "../../lib/pdf/types";

type Status = "idle" | "loading" | "editing" | "processing" | "done" | "error";

interface FormFillPage {
  pageIndex: number;
  dataUrl: string;
}

const KIND_LABELS: Record<FillableField["kind"], string> = {
  text: "Texto",
  multiline: "Texto (múltiplas linhas)",
  checkbox: "Caixa de seleção",
  radio: "Opções (radio)",
  combo: "Combo (dropdown)",
  list: "Lista",
  button: "Botão",
  signature: "Assinatura",
  unknown: "Desconhecido",
};

function isRequiredMissing(field: FillableField, value: FillValue | undefined): boolean {
  if (!field.required) return false;
  if (field.kind === "checkbox") return value !== true;
  if (field.kind === "list") return !Array.isArray(value) || value.length === 0;
  return typeof value !== "string" || value.trim() === "";
}

export function FormFillTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [pages, setPages] = useState<FormFillPage[]>([]);
  const [fields, setFields] = useState<FillableField[]>([]);
  const [values, setValues] = useState<Record<string, FillValue>>({});
  const [flattenOnSave, setFlattenOnSave] = useState(false);
  const [progress, setProgress] = useState<OperationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string; skippedReadOnly: string[] } | null>(null);

  const missingRequired = useMemo(
    () => fields.filter((f) => isRequiredMissing(f, values[f.name])),
    [fields, values],
  );

  function setValue(name: string, value: FillValue) {
    setValues((prev) => ({ ...prev, [name]: value }));
    markSessionActive();
  }

  async function handleFile(files: File[]) {
    const file = files[0];
    try {
      const doc = await loadPdfDocument(file);
      setBytes(doc.bytes);
      setFileName(file.name);
      setError(null);
      setStatus("loading");
      setProgress({ done: 0, total: doc.pageCount, stage: "Gerando páginas" });
      const built: FormFillPage[] = [];
      for (let i = 0; i < doc.pageCount; i++) {
        const thumb = await renderPageThumbnail(doc.bytes, i, { maxWidthPx: 220 });
        built.push({ pageIndex: i, dataUrl: thumb.dataUrl });
        setProgress({ done: i + 1, total: doc.pageCount, stage: "Gerando páginas" });
      }
      setPages(built);

      const found = await readFillableFields(doc.bytes);
      setFields(found);
      const initialValues: Record<string, FillValue> = {};
      for (const f of found) {
        if (f.kind === "checkbox") initialValues[f.name] = f.checked;
        else if (f.kind === "list") initialValues[f.name] = f.selectedMany;
        else initialValues[f.name] = f.value;
      }
      setValues(initialValues);
      setStatus("editing");
    } catch (e) {
      if (e instanceof PdfPasswordRequiredError) setError("Este PDF está protegido por senha. Remova a senha antes de preencher.");
      else if (e instanceof PdfOpenError) setError(e.message);
      else setError("Não foi possível abrir o arquivo.");
      setStatus("error");
    }
  }

  async function handleSave() {
    if (!bytes) return;
    setStatus("processing");
    setError(null);
    try {
      const { promise } = runInWorker<{ bytes: Uint8Array; skippedReadOnly: string[] }>(
        { kind: "fillFormFields", bytes, values, flatten: flattenOnSave },
        { onProgress: setProgress },
      );
      const out = await promise;
      const base = fileName.replace(/\.pdf$/i, "");
      setResult({ bytes: out.bytes, name: `${base}-preenchido.pdf`, skippedReadOnly: out.skippedReadOnly });
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao preencher o formulário.");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setBytes(null);
    setPages([]);
    setFields([]);
    setValues({});
    setResult(null);
    setError(null);
    setFlattenOnSave(false);
  }

  if (status === "idle" || status === "error") {
    return (
      <div>
        <ScreenHeader
          title="Preencher formulário"
          description="Abra um PDF que já tenha campos de formulário (AcroForm) — criados nesta ferramenta ou em qualquer outro programa — e preencha os valores."
        />
        {error && <InlineAlert level="danger" title="Não foi possível continuar" message={error} />}
        <DropZone onFilesAccepted={(files) => void handleFile(files)} hint="Selecione um PDF com campos de formulário para preencher" />
      </div>
    );
  }

  if (status === "loading" || status === "processing") {
    return (
      <div>
        <ScreenHeader title="Preencher formulário" description="Abra um PDF com campos de formulário e preencha os valores." />
        {progress && <ProgressBar done={progress.done} total={progress.total} stage={progress.stage} />}
      </div>
    );
  }

  if (status === "done" && result) {
    return (
      <div>
        <ScreenHeader title="Preencher formulário" description="Abra um PDF com campos de formulário e preencha os valores." />
        {result.skippedReadOnly.length > 0 && (
          <InlineAlert
            level="info"
            title="Campos somente leitura não foram alterados"
            message={`Os campos a seguir são somente leitura e mantiveram o valor original: ${result.skippedReadOnly.join(", ")}.`}
          />
        )}
        <ResultCard
          fileName={result.name}
          sizeBytes={result.bytes.length}
          onDownload={() => downloadBytes(result.bytes, result.name, "application/pdf")}
          onRunAgain={reset}
          note={
            flattenOnSave
              ? "Os campos foram achatados (flatten): os valores agora fazem parte permanente da página e o PDF resultante não tem mais campos editáveis."
              : "Os campos continuam editáveis — este PDF pode ser reaberto em qualquer leitor compatível para revisar ou alterar os valores."
          }
        />
      </div>
    );
  }

  return (
    <div>
      <ScreenHeader
        title="Preencher formulário"
        description="Revise as páginas e preencha cada campo abaixo. Campos obrigatórios ficam destacados até serem preenchidos."
      />

      {fields.length === 0 ? (
        <InlineAlert
          level="warning"
          title="Nenhum campo de formulário encontrado"
          message="Este PDF não tem campos AcroForm preenchíveis. Use a ferramenta 'Formulários (AcroForm)' para criar campos antes de preencher."
        />
      ) : (
        <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-start" }}>
          <div id="FormFillThumbnails" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", flexShrink: 0 }}>
            {pages.map((p) => (
              <div key={p.pageIndex}>
                <p className="text-muted" style={{ fontSize: 11, margin: "0 0 2px" }}>Página {p.pageIndex + 1}</p>
                <img src={p.dataUrl} alt={`Página ${p.pageIndex + 1}`} style={{ width: 140, boxShadow: "var(--shadow-card)", display: "block" }} />
              </div>
            ))}
          </div>

          <div id="FormFillFieldsList" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {fields.map((f) => {
              const missing = isRequiredMissing(f, values[f.name]);
              return (
                <div
                  key={f.name}
                  className="card"
                  style={{ padding: "var(--space-3)", border: missing ? "1.5px solid var(--danger, #b3261e)" : undefined }}
                >
                  <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                    {f.tooltip || f.name}
                    {f.required && <span style={{ color: "var(--danger, #b3261e)" }}> *</span>}
                    <span className="text-muted"> — {KIND_LABELS[f.kind]} · página {f.pageIndex >= 0 ? f.pageIndex + 1 : "?"}</span>
                  </label>

                  {(f.kind === "text" || f.kind === "unknown") && (
                    <input
                      type="text"
                      aria-label={f.tooltip || f.name}
                      value={(values[f.name] as string) ?? ""}
                      disabled={f.readOnly}
                      onChange={(e) => setValue(f.name, e.target.value)}
                      style={{ width: "100%" }}
                    />
                  )}
                  {f.kind === "multiline" && (
                    <textarea
                      aria-label={f.tooltip || f.name}
                      value={(values[f.name] as string) ?? ""}
                      disabled={f.readOnly}
                      onChange={(e) => setValue(f.name, e.target.value)}
                      rows={3}
                      style={{ width: "100%" }}
                    />
                  )}
                  {f.kind === "checkbox" && (
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(values[f.name])}
                        disabled={f.readOnly}
                        onChange={(e) => setValue(f.name, e.target.checked)}
                      />
                      Marcado
                    </label>
                  )}
                  {f.kind === "radio" && (
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {f.options.map((opt) => (
                        <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                          <input
                            type="radio"
                            name={f.name}
                            checked={values[f.name] === opt.value}
                            disabled={f.readOnly}
                            onChange={() => setValue(f.name, opt.value)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  )}
                  {f.kind === "combo" && (
                    <select
                      aria-label={f.tooltip || f.name}
                      value={(values[f.name] as string) ?? ""}
                      disabled={f.readOnly}
                      onChange={(e) => setValue(f.name, e.target.value)}
                    >
                      <option value="">Selecionar…</option>
                      {f.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {f.kind === "list" && (
                    <select
                      aria-label={f.tooltip || f.name}
                      multiple
                      value={(values[f.name] as string[]) ?? []}
                      disabled={f.readOnly}
                      onChange={(e) => setValue(f.name, Array.from(e.target.selectedOptions).map((o) => o.value))}
                    >
                      {f.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {(f.kind === "button" || f.kind === "signature") && (
                    <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>
                      {f.kind === "signature"
                        ? "Reserva de assinatura — preencha usando a ferramenta de assinatura visual ou digital."
                        : "Botão — não recebe valor preenchível."}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: "var(--space-4)", display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={flattenOnSave} onChange={(e) => setFlattenOnSave(e.target.checked)} />
          Achatar (tornar somente leitura) ao salvar
        </label>
        <button
          type="button"
          className="btn btn-primary"
          disabled={fields.length === 0 || missingRequired.length > 0}
          onClick={() => void handleSave()}
        >
          Salvar PDF preenchido
        </button>
        {missingRequired.length > 0 && (
          <span className="text-muted" style={{ fontSize: 12 }}>
            Faltam {missingRequired.length} campo(s) obrigatório(s).
          </span>
        )}
      </div>
    </div>
  );
}
