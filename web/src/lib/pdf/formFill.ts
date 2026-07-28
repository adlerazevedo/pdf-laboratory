/**
 * Fase 7 — Preenchimento de formulários.
 *
 * Diferente de formExport.ts (Fase 5, que CRIA campos AcroForm novos),
 * este módulo lê um PDF que JÁ TEM um AcroForm — criado por esta
 * ferramenta, por outro programa, ou pelo próprio usuário — inspeciona
 * os campos existentes (readFillableFields) e escreve valores neles
 * (fillFormFields), com opção de achatar (flatten) ao final, o que
 * torna os valores parte permanente da aparência da página e remove
 * os campos editáveis.
 */
import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
  PDFOptionList,
  PDFButton,
  PDFSignature,
  type PDFField,
} from "pdf-lib";

export type FillableFieldKind = "text" | "multiline" | "checkbox" | "radio" | "combo" | "list" | "button" | "signature" | "unknown";

export interface FillableFieldOption {
  value: string;
  label: string;
}

export interface FillableField {
  name: string;
  kind: FillableFieldKind;
  tooltip: string;
  pageIndex: number; // -1 quando a página do widget não pôde ser localizada
  x: number;
  y: number; // origem superior-esquerda, como no restante do app
  width: number;
  height: number;
  required: boolean;
  readOnly: boolean;
  value: string; // texto atual (campos de texto) ou valor selecionado (radio/combo)
  checked: boolean; // checkbox
  selectedMany: string[]; // seleção múltipla (option list)
  options: FillableFieldOption[];
}

/**
 * Localiza a página de um widget usando só API pública do pdf-lib:
 * primeiro tenta o /P do próprio widget (comparando com PDFPage.ref,
 * que é público), e cai para PDFDocument.findPageForAnnotationRef como
 * pdf-lib faz internamente em PDFForm.findWidgetPage (privado) — aqui
 * replicado com métodos públicos para não depender de API interna.
 */
function findWidgetPageIndex(doc: PDFDocument, widget: { P(): unknown; dict: unknown }): number {
  const pages = doc.getPages();
  const pageRef = widget.P();
  if (pageRef) {
    const idx = pages.findIndex((p) => p.ref === pageRef);
    if (idx !== -1) return idx;
  }
  const widgetRef = doc.context.getObjectRef(widget.dict as Parameters<typeof doc.context.getObjectRef>[0]);
  if (widgetRef) {
    const page = doc.findPageForAnnotationRef(widgetRef);
    if (page) return pages.indexOf(page);
  }
  return -1;
}

function rectOf(doc: PDFDocument, field: PDFField, pageIndex: number): { x: number; y: number; width: number; height: number } {
  const widgets = field.acroField.getWidgets();
  const widget = widgets[0];
  if (!widget) return { x: 0, y: 0, width: 0, height: 0 };
  const rect = widget.getRectangle();
  const page = pageIndex >= 0 ? doc.getPages()[pageIndex] : undefined;
  const pageHeight = page ? page.getHeight() : rect.y + rect.height;
  return { x: rect.x, y: pageHeight - rect.y - rect.height, width: rect.width, height: rect.height };
}

/** Lê os campos de um AcroForm já existente no PDF, prontos para uma UI de preenchimento. */
export async function readFillableFields(bytes: Uint8Array): Promise<FillableField[]> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const form = doc.getForm();
  const result: FillableField[] = [];

  for (const field of form.getFields()) {
    const widgets = field.acroField.getWidgets();
    const pageIndex = widgets[0] ? findWidgetPageIndex(doc, widgets[0]) : -1;
    const rect = rectOf(doc, field, pageIndex);
    const base = {
      name: field.getName(),
      tooltip: "",
      pageIndex,
      ...rect,
      required: field.isRequired(),
      readOnly: field.isReadOnly(),
    };

    if (field instanceof PDFTextField) {
      result.push({
        ...base,
        kind: field.isMultiline() ? "multiline" : "text",
        value: field.getText() ?? "",
        checked: false,
        selectedMany: [],
        options: [],
      });
    } else if (field instanceof PDFCheckBox) {
      result.push({ ...base, kind: "checkbox", value: "", checked: field.isChecked(), selectedMany: [], options: [] });
    } else if (field instanceof PDFRadioGroup) {
      result.push({
        ...base,
        kind: "radio",
        value: field.getSelected() ?? "",
        checked: false,
        selectedMany: [],
        options: field.getOptions().map((v) => ({ value: v, label: v })),
      });
    } else if (field instanceof PDFDropdown) {
      const selected = field.getSelected();
      result.push({
        ...base,
        kind: "combo",
        value: selected[0] ?? "",
        checked: false,
        selectedMany: selected,
        options: field.getOptions().map((v) => ({ value: v, label: v })),
      });
    } else if (field instanceof PDFOptionList) {
      result.push({
        ...base,
        kind: "list",
        value: "",
        checked: false,
        selectedMany: field.getSelected(),
        options: field.getOptions().map((v) => ({ value: v, label: v })),
      });
    } else if (field instanceof PDFButton) {
      result.push({ ...base, kind: "button", value: "", checked: false, selectedMany: [], options: [] });
    } else if (field instanceof PDFSignature) {
      result.push({ ...base, kind: "signature", value: "", checked: false, selectedMany: [], options: [] });
    } else {
      result.push({ ...base, kind: "unknown", value: "", checked: false, selectedMany: [], options: [] });
    }
  }

  return result;
}

export type FillValue = string | boolean | string[];

export interface FillFormOptions {
  values: Record<string, FillValue>;
  flatten?: boolean;
}

export interface FillFormResult {
  bytes: Uint8Array;
  flattened: boolean;
  skippedReadOnly: string[];
}

/**
 * Escreve valores nos campos de um AcroForm já existente. Campos somente
 * leitura são ignorados (e reportados em skippedReadOnly) — nunca
 * sobrescrevemos um campo readOnly silenciosamente. Se flatten=true,
 * os valores são "assados" na aparência da página e os campos deixam
 * de existir como AcroForm editável (form.flatten() do pdf-lib).
 */
export async function fillFormFields(bytes: Uint8Array, options: FillFormOptions): Promise<FillFormResult> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const form = doc.getForm();
  const skippedReadOnly: string[] = [];

  for (const field of form.getFields()) {
    const name = field.getName();
    if (!(name in options.values)) continue;
    if (field.isReadOnly()) {
      skippedReadOnly.push(name);
      continue;
    }
    const value = options.values[name];

    if (field instanceof PDFTextField) {
      field.setText(value === undefined || value === null ? undefined : String(value));
    } else if (field instanceof PDFCheckBox) {
      if (value) field.check();
      else field.uncheck();
    } else if (field instanceof PDFRadioGroup) {
      if (typeof value === "string" && value) field.select(value);
    } else if (field instanceof PDFDropdown) {
      if (typeof value === "string" && value) field.select(value);
      else if (Array.isArray(value) && value.length > 0) field.select(value);
    } else if (field instanceof PDFOptionList) {
      if (Array.isArray(value)) field.select(value);
      else if (typeof value === "string" && value) field.select([value]);
    }
    // PDFButton/PDFSignature: sem valor preenchível por esta ferramenta.
  }

  if (options.flatten) form.flatten();

  const outBytes = await doc.save();
  return { bytes: outBytes, flattened: Boolean(options.flatten), skippedReadOnly };
}
