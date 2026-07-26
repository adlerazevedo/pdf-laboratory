import { describe, expect, it } from "vitest";
import {
  planCustomRanges,
  planEachPage,
  planEveryNPages,
  planExtractSelection,
  planIntoNFiles,
  planOddEven,
} from "./splitPlanning";

describe("planEachPage", () => {
  it("gera um grupo de 1 página por página do documento", () => {
    const { groups, error } = planEachPage(4);
    expect(error).toBeNull();
    expect(groups).toHaveLength(4);
    expect(groups.map((g) => g.pages)).toEqual([[0], [1], [2], [3]]);
  });

  it("rejeita documento sem páginas", () => {
    const { error } = planEachPage(0);
    expect(error).toMatch(/não tem páginas/);
  });
});

describe("planCustomRanges", () => {
  it("cada linha vira um grupo, incluindo múltiplos sub-intervalos por linha", () => {
    const { groups, error } = planCustomRanges("1-2\n4\n3,5", 5);
    expect(error).toBeNull();
    expect(groups.map((g) => g.pages)).toEqual([[0, 1], [3], [2, 4]]);
  });

  it("rejeita e aponta a linha exata com erro de sintaxe", () => {
    const { error } = planCustomRanges("1-2\nabc\n4", 5);
    expect(error).toMatch(/Linha 2/);
  });

  it("rejeita texto vazio", () => {
    const { error } = planCustomRanges("   \n  ", 5);
    expect(error).toMatch(/Informe ao menos uma linha/);
  });

  it("ignora linhas em branco entre intervalos válidos", () => {
    const { groups, error } = planCustomRanges("1-2\n\n3-4", 5);
    expect(error).toBeNull();
    expect(groups).toHaveLength(2);
  });
});

describe("planEveryNPages", () => {
  it("divide em blocos consecutivos de N páginas", () => {
    const { groups, error } = planEveryNPages(3, 10);
    expect(error).toBeNull();
    expect(groups.map((g) => g.pages)).toEqual([[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]);
  });

  it("com N igual à contagem de páginas, gera um único arquivo", () => {
    const { groups } = planEveryNPages(5, 5);
    expect(groups).toHaveLength(1);
  });

  it("rejeita N menor que 1", () => {
    const { error } = planEveryNPages(0, 5);
    expect(error).toMatch(/no mínimo 1/);
  });

  it("rejeita N não inteiro", () => {
    const { error } = planEveryNPages(2.5, 5);
    expect(error).toMatch(/número inteiro/);
  });
});

describe("planIntoNFiles", () => {
  it("distribui páginas o mais igualmente possível", () => {
    const { groups, error } = planIntoNFiles(3, 10);
    expect(error).toBeNull();
    expect(groups.map((g) => g.pages.length)).toEqual([4, 3, 3]);
    expect(groups.flatMap((g) => g.pages)).toEqual(Array.from({ length: 10 }, (_, i) => i));
  });

  it("com divisão exata, todos os arquivos têm o mesmo tamanho", () => {
    const { groups } = planIntoNFiles(2, 10);
    expect(groups.map((g) => g.pages.length)).toEqual([5, 5]);
  });

  it("rejeita N maior que o número de páginas", () => {
    const { error } = planIntoNFiles(10, 3);
    expect(error).toMatch(/só tem 3 página/);
  });

  it("rejeita N menor que 1", () => {
    const { error } = planIntoNFiles(0, 5);
    expect(error).toMatch(/no mínimo 1/);
  });
});

describe("planOddEven", () => {
  it("separa páginas ímpares e pares (numeração 1-based visível ao usuário)", () => {
    const { groups, error } = planOddEven(5);
    expect(error).toBeNull();
    // Páginas 1,3,5 (índices 0,2,4) e páginas 2,4 (índices 1,3)
    expect(groups[0].pages).toEqual([0, 2, 4]);
    expect(groups[1].pages).toEqual([1, 3]);
  });

  it("com 1 página, gera apenas o grupo de ímpares", () => {
    const { groups } = planOddEven(1);
    expect(groups).toHaveLength(1);
    expect(groups[0].pages).toEqual([0]);
  });
});

describe("planExtractSelection", () => {
  it("combina a seleção em um único grupo/arquivo", () => {
    const { groups, error } = planExtractSelection("1-2, 5", 5);
    expect(error).toBeNull();
    expect(groups).toHaveLength(1);
    expect(groups[0].pages).toEqual([0, 1, 4]);
  });

  it("propaga o erro de sintaxe do parser de intervalos", () => {
    const { error } = planExtractSelection("xyz", 5);
    expect(error).toMatch(/inválido/);
  });
});
