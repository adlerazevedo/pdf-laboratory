import { describe, expect, it } from "vitest";
import {
  commitFormHistory,
  createFormHistory,
  findDuplicateNames,
  makeDefaultField,
  nextFieldId,
  redoFormHistory,
  undoFormHistory,
  type FormField,
} from "./formTypes";

describe("nextFieldId", () => {
  it("gera identificadores únicos a cada chamada", () => {
    const ids = new Set([nextFieldId(), nextFieldId(), nextFieldId()]);
    expect(ids.size).toBe(3);
  });
});

describe("makeDefaultField", () => {
  it("cria um campo de texto com valores padrão sensatos", () => {
    const field = makeDefaultField("text", 0, 50, 60, []);
    expect(field.kind).toBe("text");
    expect(field.pageIndex).toBe(0);
    expect(field.x).toBe(50);
    expect(field.y).toBe(60);
    expect(field.name).toBe("text_1");
    expect(field.required).toBe(false);
    expect(field.readOnly).toBe(false);
    expect(field.printable).toBe(true);
  });

  it("evita colidir com nomes já existentes, incrementando o sufixo numérico", () => {
    const field = makeDefaultField("text", 0, 0, 0, ["text_1", "text_2"]);
    expect(field.name).toBe("text_3");
  });

  it("usa dimensões diferentes para checkbox, multiline e campos de texto simples", () => {
    const checkbox = makeDefaultField("checkbox", 0, 0, 0, []);
    const multiline = makeDefaultField("multiline", 0, 0, 0, []);
    const text = makeDefaultField("text", 0, 0, 0, []);
    expect(checkbox.width).toBe(18);
    expect(checkbox.height).toBe(18);
    expect(multiline.height).toBe(80);
    expect(text.height).toBe(24);
  });

  it("inicializa uma opção padrão para radio, list e combo, mas não para outros tipos", () => {
    expect(makeDefaultField("radio", 0, 0, 0, []).options).toHaveLength(1);
    expect(makeDefaultField("list", 0, 0, 0, []).options).toHaveLength(1);
    expect(makeDefaultField("combo", 0, 0, 0, []).options).toHaveLength(1);
    expect(makeDefaultField("text", 0, 0, 0, []).options).toBeUndefined();
  });
});

describe("findDuplicateNames", () => {
  it("retorna vazio quando todos os nomes são únicos", () => {
    const fields = [
      makeDefaultField("text", 0, 0, 0, []),
      makeDefaultField("text", 0, 0, 0, ["text_1"]),
    ];
    expect(findDuplicateNames(fields)).toEqual([]);
  });

  it("detecta nomes duplicados mesmo entre tipos de campo diferentes", () => {
    const a = makeDefaultField("text", 0, 0, 0, []);
    const b = { ...makeDefaultField("checkbox", 0, 0, 0, []), name: a.name };
    expect(findDuplicateNames([a, b])).toEqual([a.name]);
  });
});

describe("histórico de desfazer/refazer de formulário", () => {
  function field(name: string): FormField {
    return { ...makeDefaultField("text", 0, 0, 0, []), name };
  }

  it("commitFormHistory move o estado atual para o passado e limpa o futuro", () => {
    const h0 = createFormHistory([]);
    const h1 = commitFormHistory(h0, [field("a")]);
    expect(h1.present).toHaveLength(1);
    expect(h1.past).toEqual([[]]);
    expect(h1.future).toEqual([]);
  });

  it("undoFormHistory volta ao estado anterior e undo em histórico vazio não faz nada", () => {
    const empty = createFormHistory([]);
    expect(undoFormHistory(empty)).toBe(empty);

    const h1 = commitFormHistory(createFormHistory([]), [field("a")]);
    const h2 = commitFormHistory(h1, [field("a"), field("b")]);
    const undone = undoFormHistory(h2);
    expect(undone.present).toHaveLength(1);
    expect(undone.future).toHaveLength(1);
  });

  it("redoFormHistory reaplica um estado desfeito e redo sem futuro não faz nada", () => {
    const h1 = commitFormHistory(createFormHistory([]), [field("a")]);
    const h2 = commitFormHistory(h1, [field("a"), field("b")]);
    const undone = undoFormHistory(h2);
    const redone = redoFormHistory(undone);
    expect(redone.present).toHaveLength(2);
    expect(redone.future).toEqual([]);

    expect(redoFormHistory(h2)).toBe(h2);
  });
});
