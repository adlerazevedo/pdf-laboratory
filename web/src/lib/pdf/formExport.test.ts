import { PDFDocument, PDFName, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { buildAcroForm } from "./formExport";
import { makeDefaultField, nextFieldId, type FormField } from "./formTypes";

async function makeSyntheticPdf(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([300, 400]);
    page.drawText(`pagina ${i + 1}`, { x: 20, y: 350, size: 12, font });
  }
  return doc.save();
}

function field(over: Partial<FormField>): FormField {
  const base = makeDefaultField(over.kind ?? "text", 0, 20, 20, []);
  return { ...base, id: nextFieldId(), ...over };
}

describe("buildAcroForm", () => {
  it("cria um campo de texto real, com valor, obrigatorio, dica (tooltip) e alinhamento", async () => {
    const bytes = await makeSyntheticPdf(1);
    const fields: FormField[] = [
      field({ kind: "text", name: "nome_completo", value: "Fulano de Teste", required: true, tooltip: "Digite seu nome completo", align: "center" }),
    ];
    const { bytes: out } = await buildAcroForm(bytes, fields);
    const doc = await PDFDocument.load(out);
    const form = doc.getForm();
    const tf = form.getTextField("nome_completo");
    expect(tf.getText()).toBe("Fulano de Teste");
    expect(tf.isRequired()).toBe(true);
  });

  it("cria checkbox marcado quando o valor padrao e 'true'", async () => {
    const bytes = await makeSyntheticPdf(1);
    const fields: FormField[] = [field({ kind: "checkbox", name: "aceite", defaultValue: "true" })];
    const { bytes: out } = await buildAcroForm(bytes, fields);
    const doc = await PDFDocument.load(out);
    expect(doc.getForm().getCheckBox("aceite").isChecked()).toBe(true);
  });

  it("cria grupo de radio com as opcoes informadas e a selecao padrao", async () => {
    const bytes = await makeSyntheticPdf(1);
    const fields: FormField[] = [
      field({
        kind: "radio",
        name: "sexo",
        options: [
          { value: "m", label: "Masculino" },
          { value: "f", label: "Feminino" },
        ],
        defaultValue: "f",
      }),
    ];
    const { bytes: out } = await buildAcroForm(bytes, fields);
    const doc = await PDFDocument.load(out);
    const rg = doc.getForm().getRadioGroup("sexo");
    expect(rg.getOptions().sort()).toEqual(["f", "m"]);
    expect(rg.getSelected()).toBe("f");
  });

  it("cria combo (dropdown) e lista (option list) com as opcoes informadas", async () => {
    const bytes = await makeSyntheticPdf(1);
    const fields: FormField[] = [
      field({ kind: "combo", name: "estado", options: [{ value: "SP", label: "SP" }, { value: "RJ", label: "RJ" }] }),
      field({ kind: "list", name: "cidades", pageIndex: 0, x: 20, y: 100, options: [{ value: "A", label: "A" }, { value: "B", label: "B" }] }),
    ];
    const { bytes: out } = await buildAcroForm(bytes, fields);
    const doc = await PDFDocument.load(out);
    expect(doc.getForm().getDropdown("estado").getOptions().sort()).toEqual(["RJ", "SP"]);
    expect(doc.getForm().getOptionList("cidades").getOptions().sort()).toEqual(["A", "B"]);
  });

  it("campo oculto (hidden) fica com a flag Hidden ligada na anotação", async () => {
    const bytes = await makeSyntheticPdf(1);
    const fields: FormField[] = [field({ kind: "hidden", name: "id_interno", value: "abc123" })];
    const { bytes: out } = await buildAcroForm(bytes, fields);
    const doc = await PDFDocument.load(out);
    const tf = doc.getForm().getTextField("id_interno");
    expect(tf.getText()).toBe("abc123");
    const widget = tf.acroField.getWidgets()[0];
    const HIDDEN_FLAG = 2;
    expect(widget.getFlags() & HIDDEN_FLAG).toBe(HIDDEN_FLAG);
  });

  it("respeita a flag printable=false (bit Print desligado na anotação)", async () => {
    const bytes = await makeSyntheticPdf(1);
    const fields: FormField[] = [field({ kind: "text", name: "rascunho", printable: false })];
    const { bytes: out } = await buildAcroForm(bytes, fields);
    const doc = await PDFDocument.load(out);
    const widget = doc.getForm().getTextField("rascunho").acroField.getWidgets()[0];
    const PRINT_FLAG = 4;
    expect(widget.getFlags() & PRINT_FLAG).toBe(0);
  });

  it("campo do tipo assinatura NAO cria um campo de formulario real — apenas reserva a posicao (placeholder)", async () => {
    const bytes = await makeSyntheticPdf(1);
    const fields: FormField[] = [field({ kind: "signature", name: "assinatura_1" })];
    const { bytes: out, signaturePlaceholders } = await buildAcroForm(bytes, fields);
    const doc = await PDFDocument.load(out);
    expect(doc.getForm().getFields()).toHaveLength(0);
    expect(signaturePlaceholders).toEqual([{ name: "assinatura_1", pageIndex: 0 }]);
  });

  it("detecta e remove XFA quando presente, sem lancar erro", async () => {
    const bytes = await makeSyntheticPdf(1);
    const doc = await PDFDocument.load(bytes);
    const acroFormDict = doc.context.obj({ Fields: [], XFA: [] });
    const acroFormRef = doc.context.register(acroFormDict);
    doc.catalog.set(PDFName.of("AcroForm"), acroFormRef);
    const bytesWithXfa = await doc.save();

    const { bytes: out, hadXFA } = await buildAcroForm(bytesWithXfa, [field({ kind: "text", name: "campo1" })]);
    expect(hadXFA).toBe(true);
    const result = await PDFDocument.load(out);
    expect(result.getForm().hasXFA()).toBe(false);
    expect(result.getForm().getTextField("campo1")).toBeTruthy();
  });

  it("preserva um AcroForm ja existente (nao recria os campos anteriores)", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([300, 400]);
    const form = doc.getForm();
    const existing = form.createTextField("campo_existente");
    existing.setText("valor original");
    existing.addToPage(doc.getPages()[0], { x: 10, y: 10, width: 100, height: 20 });
    const bytes = await doc.save();

    const { bytes: out } = await buildAcroForm(bytes, [field({ kind: "text", name: "campo_novo", pageIndex: 0, x: 10, y: 100 })]);
    const result = await PDFDocument.load(out);
    expect(result.getForm().getTextField("campo_existente").getText()).toBe("valor original");
    expect(result.getForm().getTextField("campo_novo")).toBeTruthy();
  });
});
