import { describe, expect, it } from "vitest";
import { parsePageRanges } from "./parseRanges";

describe("parsePageRanges", () => {
  it("aceita um único intervalo", () => {
    const { ranges, error } = parsePageRanges("1-3", 5);
    expect(error).toBeNull();
    expect(ranges).toEqual([{ start: 0, end: 2 }]);
  });

  it("aceita múltiplos intervalos e páginas avulsas", () => {
    const { ranges, error } = parsePageRanges("1-2, 4, 5-5", 5);
    expect(error).toBeNull();
    expect(ranges).toEqual([
      { start: 0, end: 1 },
      { start: 3, end: 3 },
      { start: 4, end: 4 },
    ]);
  });

  it("rejeita intervalos fora do documento", () => {
    const { error } = parsePageRanges("1-10", 5);
    expect(error).toMatch(/fora do intervalo/);
  });

  it("rejeita texto malformado", () => {
    const { error } = parsePageRanges("abc", 5);
    expect(error).toMatch(/inválido/);
  });

  it("rejeita entrada vazia", () => {
    const { error } = parsePageRanges("   ", 5);
    expect(error).toMatch(/Informe/);
  });
});
