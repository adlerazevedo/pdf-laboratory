import { describe, expect, it } from "vitest";
import { detectFieldSuggestions } from "./formDetect";
import type { TextItemInput } from "./redaction";

function item(partial: Partial<TextItemInput> & { str: string }): TextItemInput {
  return { pageIndex: 0, xPt: 40, yPt: 100, widthPt: 60, heightPt: 12, ...partial };
}

describe("detectFieldSuggestions", () => {
  it("sugere um campo de texto (kind cpf) à direita do rótulo 'CPF:'", () => {
    const suggestions = detectFieldSuggestions([item({ str: "CPF:", xPt: 40, yPt: 100, widthPt: 30, heightPt: 12 })], { 0: 595 });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].kind).toBe("cpf");
    expect(suggestions[0].x).toBeGreaterThan(40 + 30);
    expect(suggestions[0].sourceLabel).toBe("CPF:");
  });

  it("reconhece rótulos comuns acentuados e sem acento (Endereço/Endereco) como multiline", () => {
    const a = detectFieldSuggestions([item({ str: "Endereço:" })], { 0: 595 });
    const b = detectFieldSuggestions([item({ str: "Endereco:" })], { 0: 595 });
    expect(a[0].kind).toBe("multiline");
    expect(b[0].kind).toBe("multiline");
  });

  it("sugere um campo de texto sobre uma linha em branco composta de sublinhados", () => {
    const suggestions = detectFieldSuggestions([item({ str: "________________", widthPt: 160 })], { 0: 595 });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].kind).toBe("text");
    expect(suggestions[0].width).toBeGreaterThanOrEqual(160);
  });

  it("sugere um campo de texto sobre uma linha pontilhada", () => {
    const suggestions = detectFieldSuggestions([item({ str: "...................", widthPt: 140 })], { 0: 595 });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].kind).toBe("text");
  });

  it("sugere um checkbox para glifos comuns de caixa de seleção", () => {
    const suggestions = detectFieldSuggestions([item({ str: "☐" }), item({ str: "☑" })], { 0: 595 });
    expect(suggestions).toHaveLength(2);
    expect(suggestions.every((s) => s.kind === "checkbox")).toBe(true);
  });

  it("ignora itens de texto que não batem com nenhum padrão conhecido", () => {
    const suggestions = detectFieldSuggestions([item({ str: "Parágrafo qualquer sem rótulo." })], { 0: 595 });
    expect(suggestions).toEqual([]);
  });

  it("gera nomes sugeridos únicos mesmo quando dois rótulos normalizam para o mesmo texto", () => {
    const suggestions = detectFieldSuggestions(
      [item({ str: "Nome:", yPt: 100 }), item({ str: "Nome:", yPt: 130 })],
      { 0: 595 },
    );
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].suggestedName).not.toBe(suggestions[1].suggestedName);
  });

  it("mantém o campo sugerido dentro da largura da página", () => {
    const suggestions = detectFieldSuggestions([item({ str: "Nome:", xPt: 500, widthPt: 40 })], { 0: 595 });
    expect(suggestions[0].x + suggestions[0].width).toBeLessThanOrEqual(595);
  });

  it("respeita o pageIndex de cada item", () => {
    const suggestions = detectFieldSuggestions(
      [item({ str: "CPF:", pageIndex: 0 }), item({ str: "CPF:", pageIndex: 1 })],
      { 0: 595, 1: 595 },
    );
    expect(suggestions.map((s) => s.pageIndex)).toEqual([0, 1]);
  });
});
