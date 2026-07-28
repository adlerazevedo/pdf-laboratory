import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildAcroForm } from "./formExport";
import { fillFormFields, readFillableFields } from "./formFill";
import { makeDefaultField } from "./formTypes";
import type { FormField } from "./formTypes";

async function makeSyntheticPdf(pageCount = 1): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage([400, 400]);
  return doc.save();
}

function field(overrides: Partial<FormField> & { kind: FormField["kind"]; name: string }): FormField {
  return { ...makeDefaultField(overrides.kind, 0, 40, 40, []), ...overrides };
}

describe("readFillableFields", () => {
  it("lê um campo de texto obrigatório com posição e página corretas", async () => {
    const bytes = await makeSyntheticPdf(1);
    const { bytes: withForm } = await buildAcroForm(bytes, [
      field({ kind: "text", name: "nome", required: true, defaultValue: "Fulano" }),
    ]);
    const fields = await readFillableFields(withForm);
    expect(fields).toHaveLength(1);
    expect(fields[0].kind).toBe("text");
    expect(fields[0].required).toBe(true);
    expect(fields[0].pageIndex).toBe(0);
    expect(fields[0].value).toBe("Fulano");
    expect(fields[0].width).toBeGreaterThan(0);
  });

  it("lê um checkbox marcado por padrão como checked: true", async () => {
    const bytes = await makeSyntheticPdf(1);
    const { bytes: withForm } = await buildAcroForm(bytes, [
      field({ kind: "checkbox", name: "aceite", defaultValue: "true" }),
    ]);
    const fields = await readFillableFields(withForm);
    expect(fields[0].kind).toBe("checkbox");
    expect(fields[0].checked).toBe(true);
  });

  it("lê um grupo de radio com as opções e a seleção padrão", async () => {
    const bytes = await makeSyntheticPdf(1);
    const { bytes: withForm } = await buildAcroForm(bytes, [
      field({
        kind: "radio",
        name: "genero",
        defaultValue: "opcao1",
        options: [
          { value: "opcao1", label: "Opção 1" },
          { value: "opcao2", label: "Opção 2" },
        ],
      }),
    ]);
    const fields = await readFillableFields(withForm);
    expect(fields[0].kind).toBe("radio");
    expect(fields[0].value).toBe("opcao1");
    expect(fields[0].options.map((o) => o.value)).toEqual(["opcao1", "opcao2"]);
  });

  it("lê combo (dropdown) e lista (option list) com suas opções", async () => {
    const bytes = await makeSyntheticPdf(1);
    const { bytes: withForm } = await buildAcroForm(bytes, [
      field({ kind: "combo", name: "uf", options: [{ value: "SP", label: "SP" }, { value: "RJ", label: "RJ" }] }),
      field({ kind: "list", name: "interesses", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] }),
    ]);
    const fields = await readFillableFields(withForm);
    const combo = fields.find((f) => f.name === "uf")!;
    const list = fields.find((f) => f.name === "interesses")!;
    expect(combo.kind).toBe("combo");
    expect(combo.options).toHaveLength(2);
    expect(list.kind).toBe("list");
    expect(list.options).toHaveLength(2);
  });
});

describe("fillFormFields", () => {
  it("preenche um campo de texto e o valor persiste ao recarregar o PDF", async () => {
    const bytes = await makeSyntheticPdf(1);
    const { bytes: withForm } = await buildAcroForm(bytes, [field({ kind: "text", name: "nome" })]);
    const { bytes: filled } = await fillFormFields(withForm, { values: { nome: "Fulano de Tal" } });
    const reloaded = await PDFDocument.load(filled);
    expect(reloaded.getForm().getTextField("nome").getText()).toBe("Fulano de Tal");
  });

  it("marca e desmarca um checkbox conforme o valor booleano fornecido", async () => {
    const bytes = await makeSyntheticPdf(1);
    const { bytes: withForm } = await buildAcroForm(bytes, [field({ kind: "checkbox", name: "aceite" })]);
    const { bytes: checked } = await fillFormFields(withForm, { values: { aceite: true } });
    expect((await PDFDocument.load(checked)).getForm().getCheckBox("aceite").isChecked()).toBe(true);

    const { bytes: unchecked } = await fillFormFields(checked, { values: { aceite: false } });
    expect((await PDFDocument.load(unchecked)).getForm().getCheckBox("aceite").isChecked()).toBe(false);
  });

  it("achatar (flatten) remove o campo do AcroForm e o valor preenchido continua visível/pesquisável na página", async () => {
    const bytes = await makeSyntheticPdf(1);
    const { bytes: withForm } = await buildAcroForm(bytes, [field({ kind: "text", name: "nome" })]);
    const { bytes: flattened, flattened: wasFlattened } = await fillFormFields(withForm, {
      values: { nome: "TEXTO ACHATADO" },
      flatten: true,
    });
    expect(wasFlattened).toBe(true);
    const reloaded = await PDFDocument.load(flattened);
    expect(reloaded.getForm().getFields()).toHaveLength(0);

    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(flattened), useWorkerFetch: false, isEvalSupported: false });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(1);
    const content = await page.getTextContent();
    const text = content.items.map((it: unknown) => (it as { str?: string }).str ?? "").join(" ");
    expect(text).toContain("TEXTO ACHATADO");
  });

  it("campos somente leitura são ignorados no preenchimento e reportados em skippedReadOnly", async () => {
    const bytes = await makeSyntheticPdf(1);
    const { bytes: withForm } = await buildAcroForm(bytes, [
      field({ kind: "text", name: "bloqueado", defaultValue: "original", readOnly: true }),
    ]);
    const { bytes: filled, skippedReadOnly } = await fillFormFields(withForm, { values: { bloqueado: "tentativa" } });
    expect(skippedReadOnly).toEqual(["bloqueado"]);
    const reloaded = await PDFDocument.load(filled);
    expect(reloaded.getForm().getTextField("bloqueado").getText()).toBe("original");
  });

  it("campos ausentes do objeto de valores permanecem inalterados", async () => {
    const bytes = await makeSyntheticPdf(1);
    const { bytes: withForm } = await buildAcroForm(bytes, [
      field({ kind: "text", name: "a", defaultValue: "valor_a" }),
      field({ kind: "text", name: "b", defaultValue: "valor_b" }),
    ]);
    const { bytes: filled } = await fillFormFields(withForm, { values: { a: "novo_a" } });
    const reloaded = await PDFDocument.load(filled);
    expect(reloaded.getForm().getTextField("a").getText()).toBe("novo_a");
    expect(reloaded.getForm().getTextField("b").getText()).toBe("valor_b");
  });
});
