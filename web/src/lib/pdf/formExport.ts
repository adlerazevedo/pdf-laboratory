/**
 * Fase 5 — Formulários AcroForm: constrói/atualiza campos reais de
 * formulário (AcroForm) a partir do modelo de FormField (formTypes.ts),
 * usando a API nativa de formulários do pdf-lib. Preserva um AcroForm já
 * existente no PDF (pdf-lib cria um novo só se realmente não houver um).
 */
import { PDFDocument, PDFName, PDFString, StandardFonts, rgb, type Color, TextAlignment } from "pdf-lib";
import type { FormField } from "./formTypes";
import { TEXT_LIKE_KINDS } from "./formTypes";

function hexToColor(hex: string): Color {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

/** Converte um FormField (origem superior-esquerda) para a âncora inferior-esquerda que a API de formulários do pdf-lib espera. */
function toPageAnchor(field: FormField, pageHeight: number) {
  return { x: field.x, y: pageHeight - field.y - field.height, width: field.width, height: field.height };
}

export interface FormBuildResult {
  bytes: Uint8Array;
  /** Campos do tipo "signature" não viram um /Sig real (pdf-lib não expõe essa API publicamente) — apenas uma área reservada. Ver docs/SMART_FORMS.md. */
  signaturePlaceholders: Array<{ name: string; pageIndex: number }>;
  hadXFA: boolean;
}

export async function buildAcroForm(bytes: Uint8Array, fields: FormField[]): Promise<FormBuildResult> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  // IMPORTANTE: doc.getForm() do pdf-lib remove o XFA como efeito colateral assim que e chamado
  // (loga um aviso e apaga a chave /XFA internamente), entao checar hasXFA() DEPOIS de getForm()
  // sempre retorna false. Para detectar corretamente se o documento TINHA XFA, olhamos a chave
  // diretamente no dicionario do AcroForm do catalogo, antes de qualquer chamada a getForm().
  const existingAcroForm = doc.catalog.getAcroForm();
  const hadXFA = existingAcroForm ? existingAcroForm.dict.has(PDFName.of("XFA")) : false;
  // A primeira chamada a getForm() ja remove o XFA (se presente); deleteXFA() aqui e apenas
  // uma garantia explicita e idempotente.
  const form = doc.getForm();
  if (hadXFA) {
    form.deleteXFA();
  }
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const signaturePlaceholders: Array<{ name: string; pageIndex: number }> = [];

  for (const field of fields) {
    const page = pages[field.pageIndex];
    if (!page) continue;
    const pageHeight = page.getHeight();
    const anchor = toPageAnchor(field, pageHeight);
    const appearance = {
      ...anchor,
      textColor: hexToColor(field.color),
      backgroundColor: field.backgroundColor ? hexToColor(field.backgroundColor) : undefined,
      borderColor: field.borderColor ? hexToColor(field.borderColor) : undefined,
      borderWidth: field.borderColor ? 1 : 0,
      font,
      hidden: field.kind === "hidden",
    };

    if (TEXT_LIKE_KINDS.includes(field.kind)) {
      const tf = form.createTextField(field.name);
      if (field.kind === "multiline") tf.enableMultiline();
      tf.addToPage(page, appearance);
      tf.setFontSize(field.fontSize);
      tf.setAlignment(field.align === "left" ? TextAlignment.Left : field.align === "center" ? TextAlignment.Center : TextAlignment.Right);
      tf.setText(field.value || field.defaultValue || "");
      if (field.required) tf.enableRequired();
      if (field.readOnly) tf.enableReadOnly();
      setTooltip(tf, field.tooltip);
      setPrintFlag(tf, field.printable);
    } else if (field.kind === "checkbox") {
      const cb = form.createCheckBox(field.name);
      cb.addToPage(page, appearance);
      if (field.value === "true" || field.defaultValue === "true") cb.check();
      if (field.required) cb.enableRequired();
      if (field.readOnly) cb.enableReadOnly();
      setTooltip(cb, field.tooltip);
      setPrintFlag(cb, field.printable);
    } else if (field.kind === "radio") {
      const rg = form.createRadioGroup(field.name);
      const options = field.options ?? [];
      options.forEach((opt, i) => {
        const optAnchor = { ...anchor, y: anchor.y - i * (field.height + 4) };
        rg.addOptionToPage(opt.value, page, { ...appearance, ...optAnchor });
      });
      if (field.defaultValue) rg.select(field.defaultValue);
      if (field.required) rg.enableRequired();
      if (field.readOnly) rg.enableReadOnly();
      setTooltip(rg, field.tooltip);
    } else if (field.kind === "combo") {
      const dd = form.createDropdown(field.name);
      const options = field.options ?? [];
      dd.addOptions(options.map((o) => o.value));
      dd.addToPage(page, appearance);
      if (field.defaultValue) dd.select(field.defaultValue);
      dd.setFontSize(field.fontSize);
      if (field.required) dd.enableRequired();
      if (field.readOnly) dd.enableReadOnly();
      setTooltip(dd, field.tooltip);
      setPrintFlag(dd, field.printable);
    } else if (field.kind === "list") {
      const ol = form.createOptionList(field.name);
      const options = field.options ?? [];
      ol.addOptions(options.map((o) => o.value));
      ol.addToPage(page, appearance);
      if (field.defaultValue) ol.select(field.defaultValue);
      ol.setFontSize(field.fontSize);
      if (field.required) ol.enableRequired();
      if (field.readOnly) ol.enableReadOnly();
      setTooltip(ol, field.tooltip);
      setPrintFlag(ol, field.printable);
    } else if (field.kind === "button") {
      const btn = form.createButton(field.name);
      btn.addToPage(field.value || field.name, page, appearance);
      btn.setFontSize(field.fontSize);
      setTooltip(btn, field.tooltip);
      setPrintFlag(btn, field.printable);
    } else if (field.kind === "signature") {
      // pdf-lib não expõe API pública para criar um campo /Sig real — ver
      // docs/SMART_FORMS.md. Reservamos a posição via anotação neutra e
      // devolvemos a lista para a UI indicar claramente que é um placeholder.
      signaturePlaceholders.push({ name: field.name, pageIndex: field.pageIndex });
      page.drawRectangle({
        x: anchor.x,
        y: anchor.y,
        width: anchor.width,
        height: anchor.height,
        borderColor: rgb(0.35, 0.35, 0.35),
        borderWidth: 1,
        borderDashArray: [4, 3],
        color: undefined,
      });
      page.drawText(`[assinatura: ${field.name}]`, {
        x: anchor.x + 4,
        y: anchor.y + anchor.height / 2 - 4,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
  }

  const outBytes = await doc.save();
  return { bytes: outBytes, signaturePlaceholders, hadXFA };
}

// pdf-lib não expõe um setter público de alto nível para a Alternate Text
// (TU) do dicionário do campo, mas `acroField.dict` (PDFDict) é público —
// gravamos a chave /TU diretamente, do mesmo jeito que o próprio pdf-lib
// grava /T (nome) e /DA (aparência padrão) internamente.
function setTooltip(field: { acroField: { dict: PDFDictLike } }, tooltip: string) {
  if (!tooltip) return;
  field.acroField.dict.set(PDFName.of("TU"), PDFString.of(tooltip));
}

// A flag "Print" (bit 3, valor 4) do dicionário /F de cada anotação de
// widget não tem setter de alto nível no pdf-lib, mas PDFWidgetAnnotation
// (retornado por `getWidgets()`) expõe `setFlagTo`, que é público.
const PRINT_FLAG = 4;
function setPrintFlag(field: { acroField: { getWidgets(): Array<{ setFlagTo(flag: number, enable: boolean): void }> } }, printable: boolean) {
  for (const widget of field.acroField.getWidgets()) {
    widget.setFlagTo(PRINT_FLAG, printable);
  }
}

interface PDFDictLike {
  set(key: PDFName, value: unknown): void;
}
