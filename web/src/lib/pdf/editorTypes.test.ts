import { describe, expect, it } from "vitest";
import {
  alignObjects,
  canRedo,
  canUndo,
  commitHistory,
  createHistory,
  distributeObjects,
  nextObjectId,
  redoHistory,
  snapToGrid,
  undoHistory,
  type EditorRectObject,
} from "./editorTypes";

function rect(over: Partial<EditorRectObject> = {}): EditorRectObject {
  return {
    id: nextObjectId(),
    pageIndex: 0,
    kind: "rect",
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    rotationDeg: 0,
    opacity: 1,
    zIndex: 1,
    fill: "#ff0000",
    stroke: null,
    strokeWidth: 0,
    cornerRadius: 0,
    ...over,
  };
}

describe("historico (undo/redo)", () => {
  it("undo volta ao estado anterior e redo reaplica", () => {
    let h = createHistory([]);
    expect(canUndo(h)).toBe(false);
    const a = [rect()];
    h = commitHistory(h, a);
    const b = [...a, rect()];
    h = commitHistory(h, b);
    expect(h.present).toHaveLength(2);
    expect(canUndo(h)).toBe(true);

    h = undoHistory(h);
    expect(h.present).toHaveLength(1);
    expect(canRedo(h)).toBe(true);

    h = redoHistory(h);
    expect(h.present).toHaveLength(2);
    expect(canRedo(h)).toBe(false);
  });

  it("um novo commit apos um undo descarta o futuro (padrao undo/redo)", () => {
    let h = createHistory([]);
    h = commitHistory(h, [rect()]);
    h = commitHistory(h, [rect(), rect()]);
    h = undoHistory(h);
    h = commitHistory(h, [rect(), rect(), rect()]);
    expect(canRedo(h)).toBe(false);
    expect(h.present).toHaveLength(3);
  });

  it("undo/redo em historico vazio nao quebra", () => {
    const h = createHistory([]);
    expect(undoHistory(h)).toBe(h);
    expect(redoHistory(h)).toBe(h);
  });
});

describe("alignObjects", () => {
  it("alinha pela esquerda usando a caixa delimitadora da selecao", () => {
    const a = rect({ x: 0, width: 10 });
    const b = rect({ x: 50, width: 20 });
    const objs = [a, b];
    const out = alignObjects(objs, [a.id, b.id], "left");
    const outA = out.find((o) => o.id === a.id)!;
    const outB = out.find((o) => o.id === b.id)!;
    expect(outA.x).toBe(0);
    expect(outB.x).toBe(0);
  });

  it("centraliza horizontalmente mantendo a caixa delimitadora original", () => {
    const a = rect({ x: 0, width: 10 });
    const b = rect({ x: 40, width: 10 });
    const out = alignObjects([a, b], [a.id, b.id], "hcenter");
    const outA = out.find((o) => o.id === a.id)!;
    const outB = out.find((o) => o.id === b.id)!;
    // centro da uniao: minX=0, maxX=50 -> centro=25; cada item (largura 10) fica com x=20
    expect(outA.x).toBe(20);
    expect(outB.x).toBe(20);
  });

  it("nao afeta objetos fora da selecao", () => {
    const a = rect({ x: 0, width: 10 });
    const untouched = rect({ x: 999, width: 10 });
    const out = alignObjects([a, untouched], [a.id], "left");
    expect(out.find((o) => o.id === untouched.id)!.x).toBe(999);
  });
});

describe("distributeObjects", () => {
  it("distribui 3+ objetos com espacamento uniforme entre centros", () => {
    const a = rect({ x: 0, width: 10 }); // centro 5
    const b = rect({ x: 20, width: 10 }); // centro 25 (fora do meio ideal)
    const c = rect({ x: 100, width: 10 }); // centro 105
    const out = distributeObjects([a, b, c], [a.id, b.id, c.id], "horizontal");
    const centerOf = (id: string) => {
      const o = out.find((x) => x.id === id)!;
      return o.x + o.width / 2;
    };
    expect(centerOf(a.id)).toBeCloseTo(5);
    expect(centerOf(c.id)).toBeCloseTo(105);
    expect(centerOf(b.id)).toBeCloseTo(55); // ponto medio exato entre 5 e 105
  });

  it("nao altera nada com menos de 3 objetos", () => {
    const a = rect({ x: 0 });
    const b = rect({ x: 20 });
    const out = distributeObjects([a, b], [a.id, b.id], "horizontal");
    expect(out).toEqual([a, b]);
  });
});

describe("snapToGrid", () => {
  it("arredonda para o multiplo mais proximo", () => {
    expect(snapToGrid(13, 10)).toBe(10);
    expect(snapToGrid(16, 10)).toBe(20);
    expect(snapToGrid(13, 0)).toBe(13);
  });
});
