import { useEffect, useState } from "react";
import { ScreenHeader } from "./ScreenHeader";
import { DropZone } from "../DropZone";
import { ProgressBar } from "../ProgressBar";
import { InlineAlert } from "../InlineAlert";
import { ResultCard } from "../ResultCard";
import { loadPdfDocument, PdfOpenError, PdfPasswordRequiredError } from "../../lib/pdf/loadDocument";
import { renderPageThumbnail, extractPageTextItems } from "../../lib/pdf/thumbnails";
import { runInWorker } from "../../lib/pdf/workerClient";
import { downloadBytes } from "../../lib/pdf/zip";
import { markSessionActive } from "../../lib/sessionActivity";
import {
  createFormHistory,
  commitFormHistory,
  undoFormHistory,
  redoFormHistory,
  findDuplicateNames,
  makeDefaultField,
  type FormField,
  type FormFieldKind,
  type FormHistory,
} from "../../lib/pdf/formTypes";
import { detectFieldSuggestions, type DetectedFieldSuggestion } from "../../lib/pdf/formDetect";
import type { TextItemInput } from "../../lib/pdf/redaction";
import type { OperationProgress } from "../../lib/pdf/types";

type Status = "idle" | "loading" | "editing" | "processing" | "done" | "error";

interface FormPage {
  pageIndex: number;
  widthPt: number;
  heightPt: number;
  dataUrl: string;
}

const FIELD_KIND_LABELS: Record<FormFieldKind, string> = {
  text: "Texto",
  multiline: "Texto (múltiplas linhas)",
  number: "Número",
  currency: "Moeda",
  date: "Data",
  time: "Hora",
  cpf: "CPF",
  cnpj: "CNPJ",
  cep: "CEP",
  phone: "Telefone",
  email: "E-mail",
  checkbox: "Caixa de seleção",
  radio: "Grupo de opções (radio)",
  list: "Lista",
  combo: "Combo (dropdown)",
  button: "Botão",
  signature: "Assinatura (reserva de espaço)",
  hidden: "Oculto",
  calculated: "Calculado",
};

const PLACEABLE_KINDS: FormFieldKind[] = [
  "text",
  "multiline",
  "number",
  "currency",
  "date",
  "time",
  "cpf",
  "cnpj",
  "cep",
  "phone",
  "email",
  "checkbox",
  "radio",
  "list",
  "combo",
  "button",
  "signature",
  "hidden",
  "calculated",
];

const OPTION_KINDS: FormFieldKind[] = ["radio", "list", "combo"];

export function FormsTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [pages, setPages] = useState<FormPage[]>([]);
  const [progress, setProgress] = useState<OperationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    bytes: Uint8Array;
    name: string;
    signaturePlaceholders: Array<{ name: string; pageIndex: number }>;
    hadXFA: boolean;
  } | null>(null);

  const [history, setHistory] = useState<FormHistory>(() => createFormHistory([]));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placeKind, setPlaceKind] = useState<FormFieldKind | null>(null);
  const [zoom, setZoom] = useState(1);
  const [suggestions, setSuggestions] = useState<DetectedFieldSuggestion[]>([]);
  const [detecting, setDetecting] = useState(false);

  const fields = history.present;
  const selectedField = fields.find((f) => f.id === selectedId) ?? null;
  const duplicateNames = findDuplicateNames(fields);

  function commit(next: FormField[]) {
    setHistory((h) => commitFormHistory(h, next));
    markSessionActive();
  }

  function undo() {
    setHistory((h) => undoFormHistory(h));
  }

  function redo() {
    setHistory((h) => redoFormHistory(h));
  }

  useEffect(() => {
    if (selectedId && !fields.some((f) => f.id === selectedId)) setSelectedId(null);
  }, [fields, selectedId]);

  async function handleFile(files: File[]) {
    const file = files[0];
    try {
      const doc = await loadPdfDocument(file);
      setBytes(doc.bytes);
      setFileName(file.name);
      setError(null);
      setStatus("loading");
      setProgress({ done: 0, total: doc.pageCount, stage: "Gerando páginas" });
      const built: FormPage[] = [];
      for (let i = 0; i < doc.pageCount; i++) {
        const thumb = await renderPageThumbnail(doc.bytes, i, { maxWidthPx: 700 });
        built.push({ pageIndex: i, widthPt: thumb.widthPt, heightPt: thumb.heightPt, dataUrl: thumb.dataUrl });
        setProgress({ done: i + 1, total: doc.pageCount, stage: "Gerando páginas" });
      }
      setPages(built);
      setHistory(createFormHistory([]));
      setSelectedId(null);
      setStatus("editing");
    } catch (e) {
      if (e instanceof PdfPasswordRequiredError) setError("Este PDF está protegido por senha. Remova a senha antes de criar campos.");
      else if (e instanceof PdfOpenError) setError(e.message);
      else setError("Não foi possível abrir o arquivo.");
      setStatus("error");
    }
  }

  function pointToPagePt(pageIndex: number, clientX: number, clientY: number): { x: number; y: number } {
    const el = document.getElementById(`form-page-${pageIndex}`);
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
  }

  function uniqueAgainst(base: string, existingNames: string[]): string {
    let name = base;
    let n = 1;
    while (existingNames.includes(name)) {
      n += 1;
      name = `${base}_${n}`;
    }
    return name;
  }

  async function runDetection() {
    if (!bytes || pages.length === 0) return;
    setDetecting(true);
    try {
      const allItems: TextItemInput[] = [];
      const pageWidthByIndex: Record<number, number> = {};
      for (const p of pages) {
        pageWidthByIndex[p.pageIndex] = p.widthPt;
        const items = await extractPageTextItems(bytes, p.pageIndex);
        for (const it of items) allItems.push({ pageIndex: p.pageIndex, ...it });
      }
      const found = detectFieldSuggestions(allItems, pageWidthByIndex);
      setSuggestions(found);
    } finally {
      setDetecting(false);
    }
  }

  function acceptSuggestion(suggestion: DetectedFieldSuggestion) {
    const existingNames = fields.map((f) => f.name);
    const name = uniqueAgainst(suggestion.suggestedName, existingNames);
    const field: FormField = {
      ...makeDefaultField(suggestion.kind, suggestion.pageIndex, suggestion.x, suggestion.y, existingNames),
      name,
      width: suggestion.width,
      height: suggestion.height,
    };
    commit([...fields, field]);
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
  }

  function discardSuggestion(id: string) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }

  function acceptAllSuggestions() {
    let existingNames = fields.map((f) => f.name);
    const newFields: FormField[] = [];
    for (const suggestion of suggestions) {
      const name = uniqueAgainst(suggestion.suggestedName, existingNames);
      existingNames = [...existingNames, name];
      newFields.push({
        ...makeDefaultField(suggestion.kind, suggestion.pageIndex, suggestion.x, suggestion.y, existingNames),
        name,
        width: suggestion.width,
        height: suggestion.height,
      });
    }
    commit([...fields, ...newFields]);
    setSuggestions([]);
  }

  function discardAllSuggestions() {
    setSuggestions([]);
  }

  function handlePageClick(pageIndex: number, e: React.MouseEvent) {
    if (!placeKind) {
      if (e.target === e.currentTarget) setSelectedId(null);
      return;
    }
    const pt = pointToPagePt(pageIndex, e.clientX, e.clientY);
    const existingNames = fields.map((f) => f.name);
    const field = makeDefaultField(placeKind, pageIndex, pt.x, pt.y, existingNames);
    commit([...fields, field]);
    setSelectedId(field.id);
    setPlaceKind(null);
  }

  function startDrag(e: React.PointerEvent, field: FormField, kind: "move" | "resize") {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(field.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { ...field };
    let liveNext: FormField[] | null = null;

    function onMove(ev: PointerEvent) {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      let patch: Partial<FormField>;
      if (kind === "move") {
        patch = { x: orig.x + dx, y: orig.y + dy };
      } else {
        patch = { width: Math.max(10, orig.width + dx), height: Math.max(10, orig.height + dy) };
      }
      liveNext = fields.map((f) => (f.id === field.id ? { ...f, ...patch } : f));
      setHistory((h) => ({ ...h, present: liveNext! }));
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (liveNext) commit(liveNext);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function updateSelected(patch: Partial<FormField>) {
    if (!selectedField) return;
    commit(fields.map((f) => (f.id === selectedField.id ? { ...f, ...patch } : f)));
  }

  function removeSelected() {
    if (!selectedField) return;
    commit(fields.filter((f) => f.id !== selectedField.id));
    setSelectedId(null);
  }

  function addOption() {
    if (!selectedField) return;
    const options = selectedField.options ?? [];
    const n = options.length + 1;
    updateSelected({ options: [...options, { value: `opcao${n}`, label: `Opção ${n}` }] });
  }

  function updateOption(index: number, patch: Partial<{ value: string; label: string }>) {
    if (!selectedField?.options) return;
    const next = selectedField.options.map((o, i) => (i === index ? { ...o, ...patch } : o));
    updateSelected({ options: next });
  }

  function removeOption(index: number) {
    if (!selectedField?.options) return;
    updateSelected({ options: selectedField.options.filter((_, i) => i !== index) });
  }

  async function handleSave() {
    if (!bytes) return;
    if (duplicateNames.length > 0) return;
    setStatus("processing");
    setError(null);
    try {
      const { promise } = runInWorker<{
        bytes: Uint8Array;
        signaturePlaceholders: Array<{ name: string; pageIndex: number }>;
        hadXFA: boolean;
      }>({ kind: "buildAcroForm", bytes, fields }, { onProgress: setProgress });
      const out = await promise;
      setResult({
        bytes: out.bytes,
        name: fileName.replace(/\.pdf$/i, "") + "-formulario.pdf",
        signaturePlaceholders: out.signaturePlaceholders,
        hadXFA: out.hadXFA,
      });
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao gerar o formulário.");
      setStatus("error");
    }
  }

  if (status === "idle" || status === "error") {
    return (
      <div>
        <ScreenHeader
          title="Formulários (AcroForm)"
          description="Crie campos de formulário reais — texto, caixas de seleção, opções, listas e mais — clicando diretamente sobre as páginas do PDF."
        />
        {error && <InlineAlert level="danger" title="Não foi possível continuar" message={error} />}
        <DropZone onFilesAccepted={(files) => void handleFile(files)} hint="Selecione um PDF para adicionar campos de formulário" />
      </div>
    );
  }

  if (status === "loading" || status === "processing") {
    return (
      <div>
        <ScreenHeader title="Formulários (AcroForm)" description="Crie campos de formulário reais sobre as páginas do PDF." />
        {progress && <ProgressBar done={progress.done} total={progress.total} stage={progress.stage} />}
      </div>
    );
  }

  if (status === "done" && result) {
    return (
      <div>
        <ScreenHeader title="Formulários (AcroForm)" description="Crie campos de formulário reais sobre as páginas do PDF." />
        {result.hadXFA && (
          <InlineAlert
            level="warning"
            title="Formulário XFA removido"
            message="O PDF original continha dados XFA (Adobe LiveCycle), que o pdf-lib não suporta. Eles foram removidos para que os campos AcroForm criados aqui funcionem de forma previsível em outros leitores."
          />
        )}
        {result.signaturePlaceholders.length > 0 && (
          <InlineAlert
            level="info"
            title="Reservas de assinatura criadas"
            message={`${result.signaturePlaceholders.length} campo(s) de assinatura foram desenhados como área reservada (retângulo tracejado) — ainda não são um campo /Sig real nem uma assinatura digital. A assinatura visual/digital é feita nas ferramentas específicas (Fases 8-9).`}
          />
        )}
        <ResultCard
          fileName={result.name}
          sizeBytes={result.bytes.length}
          onDownload={() => downloadBytes(result.bytes, result.name, "application/pdf")}
          onRunAgain={() => {
            setStatus("editing");
            setResult(null);
          }}
          note="Os campos criados são AcroForm reais — preenchíveis e verificáveis em qualquer leitor de PDF compatível (Adobe Reader, pdf.js, etc.)."
        />
      </div>
    );
  }

  return (
    <div>
      <ScreenHeader
        title="Formulários (AcroForm)"
        description="Crie campos de formulário reais clicando sobre as páginas. Selecione um tipo, clique no local desejado e ajuste as propriedades ao lado."
      />

      {duplicateNames.length > 0 && (
        <InlineAlert
          level="danger"
          title="Nomes de campo duplicados"
          message={`Os seguintes nomes aparecem mais de uma vez: ${duplicateNames.join(", ")}. Nomes de campo devem ser únicos — renomeie antes de salvar.`}
        />
      )}

      <div id="FormsToolbar" role="toolbar" aria-label="Tipos de campo" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-3)", alignItems: "center" }}>
        <label style={{ fontSize: 13 }}>
          Tipo de campo
          <select
            value={placeKind ?? ""}
            onChange={(e) => setPlaceKind((e.target.value || null) as FormFieldKind | null)}
            style={{ marginLeft: 6 }}
          >
            <option value="">Selecionar…</option>
            {PLACEABLE_KINDS.map((k) => (
              <option key={k} value={k}>
                {FIELD_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <span className="text-muted" style={{ fontSize: 12 }}>
          {placeKind ? "Clique na página para posicionar o campo." : "Escolha um tipo para começar a posicionar campos."}
        </span>
        <span style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
        <button type="button" className="btn" disabled={history.past.length === 0} onClick={undo}>Desfazer</button>
        <button type="button" className="btn" disabled={history.future.length === 0} onClick={redo}>Refazer</button>
        <button type="button" className="btn btn-danger" disabled={!selectedField} onClick={removeSelected}>Excluir campo</button>
        <span style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
        <button type="button" className="btn" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} aria-label="Diminuir zoom">−</button>
        <span style={{ alignSelf: "center", fontSize: 13, minWidth: 42, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
        <button type="button" className="btn" onClick={() => setZoom((z) => Math.min(2, z + 0.1))} aria-label="Aumentar zoom">+</button>
        <span style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
        <button type="button" className="btn" disabled={detecting} onClick={() => void runDetection()}>
          {detecting ? "Detectando…" : "Detectar campos automaticamente"}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div id="FormsSuggestionsPanel" className="card" style={{ padding: "var(--space-4)", marginBottom: "var(--space-3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h2 style={{ fontSize: 14, margin: 0 }}>Sugestões de campos detectados ({suggestions.length})</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn-primary" onClick={acceptAllSuggestions}>Aceitar todas</button>
              <button type="button" className="btn" onClick={discardAllSuggestions}>Descartar todas</button>
            </div>
          </div>
          <p className="text-muted" style={{ fontSize: 12, margin: "0 0 8px" }}>
            Detecção heurística local, com base em rótulos comuns, linhas em branco e glifos de caixa de seleção do
            próprio texto do PDF — revise cada sugestão antes de aceitar; nenhum campo é criado sem confirmação.
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {suggestions.map((s) => (
              <li key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <span style={{ flex: 1 }}>
                  Página {s.pageIndex + 1} · {FIELD_KIND_LABELS[s.kind]} · "{s.sourceLabel}"
                </span>
                <button type="button" className="btn" onClick={() => acceptSuggestion(s)}>Aceitar</button>
                <button type="button" className="btn-text" onClick={() => discardSuggestion(s.id)}>Descartar</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-start" }}>
        <div id="FormsCanvasArea" style={{ flex: 1, maxHeight: "70vh", overflow: "auto", background: "var(--surface-2)", padding: "var(--space-4)", borderRadius: "var(--radius-md)" }}>
          {pages.map((p) => (
            <div key={p.pageIndex} style={{ marginBottom: "var(--space-4)" }}>
              <p className="text-muted" style={{ fontSize: 12, margin: "0 0 4px" }}>Página {p.pageIndex + 1}</p>
              <div
                id={`form-page-${p.pageIndex}`}
                onClick={(e) => handlePageClick(p.pageIndex, e)}
                style={{
                  position: "relative",
                  width: p.widthPt * zoom,
                  height: p.heightPt * zoom,
                  backgroundImage: `url(${p.dataUrl})`,
                  backgroundSize: "cover",
                  boxShadow: "var(--shadow-card)",
                  cursor: placeKind ? "crosshair" : "default",
                  backgroundColor: "#fff",
                }}
              >
                {fields
                  .filter((f) => f.pageIndex === p.pageIndex)
                  .map((f) => {
                    const isSelected = f.id === selectedId;
                    const isDup = duplicateNames.includes(f.name);
                    return (
                      <div
                        key={f.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!placeKind) setSelectedId(f.id);
                        }}
                        onPointerDown={(e) => !placeKind && startDrag(e, f, "move")}
                        title={`${FIELD_KIND_LABELS[f.kind]}: ${f.name}`}
                        style={{
                          position: "absolute",
                          left: f.x * zoom,
                          top: f.y * zoom,
                          width: Math.max(1, f.width * zoom),
                          height: Math.max(1, f.height * zoom),
                          background: "rgba(53,111,168,0.12)",
                          border: `1.5px ${isDup ? "solid var(--danger, #b3261e)" : "dashed var(--info, #356ca8)"}`,
                          boxSizing: "border-box",
                          outline: isSelected ? "2px solid var(--accent)" : "none",
                          cursor: placeKind ? "default" : "move",
                          fontSize: Math.min(11, f.height * zoom * 0.5),
                          color: "var(--info, #356ca8)",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          padding: "1px 3px",
                        }}
                      >
                        {f.name}
                        {isSelected && !placeKind && (
                          <div
                            onPointerDown={(e) => startDrag(e, f, "resize")}
                            style={{
                              position: "absolute",
                              right: -4,
                              bottom: -4,
                              width: 9,
                              height: 9,
                              background: "var(--accent)",
                              border: "1px solid #fff",
                              borderRadius: 2,
                              cursor: "nwse-resize",
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                {suggestions
                  .filter((s) => s.pageIndex === p.pageIndex)
                  .map((s) => (
                    <div
                      key={s.id}
                      title={`Sugestão: ${FIELD_KIND_LABELS[s.kind]} — "${s.sourceLabel}"`}
                      style={{
                        position: "absolute",
                        left: s.x * zoom,
                        top: s.y * zoom,
                        width: Math.max(1, s.width * zoom),
                        height: Math.max(1, s.height * zoom),
                        border: "1.5px dashed #b5780a",
                        background: "rgba(181,120,10,0.10)",
                        boxSizing: "border-box",
                        pointerEvents: "none",
                      }}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div id="FormsPropertiesPanel" className="card" style={{ width: 280, flexShrink: 0, padding: "var(--space-4)" }}>
          <h2 style={{ fontSize: 14, margin: "0 0 var(--space-3)" }}>Propriedades</h2>
          {!selectedField && <p className="text-muted" style={{ fontSize: 13 }}>Selecione um campo para editar suas propriedades.</p>}
          {selectedField && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>{FIELD_KIND_LABELS[selectedField.kind]}</p>
              <label style={{ fontSize: 12 }}>
                Nome do campo
                <input
                  type="text"
                  value={selectedField.name}
                  onChange={(e) => updateSelected({ name: e.target.value })}
                  style={{ width: "100%" }}
                />
              </label>
              <label style={{ fontSize: 12 }}>
                Dica (tooltip)
                <input
                  type="text"
                  value={selectedField.tooltip}
                  onChange={(e) => updateSelected({ tooltip: e.target.value })}
                  style={{ width: "100%" }}
                />
              </label>

              {selectedField.kind === "checkbox" ? (
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={selectedField.defaultValue === "true"}
                    onChange={(e) => updateSelected({ defaultValue: e.target.checked ? "true" : "", value: e.target.checked ? "true" : "" })}
                  />
                  Marcado por padrão
                </label>
              ) : selectedField.kind === "button" ? (
                <label style={{ fontSize: 12 }}>
                  Rótulo do botão
                  <input type="text" value={selectedField.value} onChange={(e) => updateSelected({ value: e.target.value })} style={{ width: "100%" }} />
                </label>
              ) : selectedField.kind !== "signature" ? (
                <label style={{ fontSize: 12 }}>
                  Valor padrão
                  <input
                    type="text"
                    value={selectedField.defaultValue}
                    onChange={(e) => updateSelected({ defaultValue: e.target.value })}
                    style={{ width: "100%" }}
                  />
                </label>
              ) : null}

              {OPTION_KINDS.includes(selectedField.kind) && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 4px" }}>Opções</p>
                  {(selectedField.options ?? []).map((opt, i) => (
                    <div key={i} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      <input
                        type="text"
                        aria-label={`Valor da opção ${i + 1}`}
                        value={opt.value}
                        onChange={(e) => updateOption(i, { value: e.target.value })}
                        style={{ width: "45%", fontSize: 12 }}
                      />
                      <input
                        type="text"
                        aria-label={`Rótulo da opção ${i + 1}`}
                        value={opt.label}
                        onChange={(e) => updateOption(i, { label: e.target.value })}
                        style={{ width: "45%", fontSize: 12 }}
                      />
                      <button type="button" className="btn-text" onClick={() => removeOption(i)} aria-label="Remover opção">×</button>
                    </div>
                  ))}
                  <button type="button" className="btn" onClick={addOption}>Adicionar opção</button>
                </div>
              )}

              {selectedField.kind !== "signature" && selectedField.kind !== "checkbox" && (
                <>
                  <label style={{ fontSize: 12 }}>
                    Tamanho da fonte
                    <input
                      type="number"
                      min={4}
                      max={72}
                      value={selectedField.fontSize}
                      onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                    />
                  </label>
                  <label style={{ fontSize: 12 }}>
                    Cor do texto
                    <input type="color" value={selectedField.color} onChange={(e) => updateSelected({ color: e.target.value })} />
                  </label>
                  <label style={{ fontSize: 12 }}>
                    Alinhamento
                    <select value={selectedField.align} onChange={(e) => updateSelected({ align: e.target.value as FormField["align"] })}>
                      <option value="left">Esquerda</option>
                      <option value="center">Centro</option>
                      <option value="right">Direita</option>
                    </select>
                  </label>
                </>
              )}

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4, display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <input type="checkbox" checked={selectedField.required} onChange={(e) => updateSelected({ required: e.target.checked })} />
                  Obrigatório
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <input type="checkbox" checked={selectedField.readOnly} onChange={(e) => updateSelected({ readOnly: e.target.checked })} />
                  Somente leitura
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <input type="checkbox" checked={selectedField.printable} onChange={(e) => updateSelected({ printable: e.target.checked })} />
                  Visível na impressão
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: "var(--space-4)", display: "flex", gap: "var(--space-2)" }}>
        <button type="button" className="btn btn-primary" disabled={duplicateNames.length > 0 || fields.length === 0} onClick={() => void handleSave()}>
          Gerar PDF com formulário
        </button>
      </div>
    </div>
  );
}
