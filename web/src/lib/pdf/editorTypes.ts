/**
 * Modelo de objetos do Editor de PDF (Fase 2).
 *
 * Cada objeto vive em um sistema de coordenadas por página, com origem no
 * canto SUPERIOR esquerdo (como uma tela/DOM), em pontos PDF (1/72").
 * A conversão para o sistema do PDF (origem inferior esquerda) acontece só
 * na exportação (ver editorExport.ts).
 */

export type EditorObjectKind = "text" | "image" | "rect" | "ellipse" | "line" | "link";

export interface EditorObjectBase {
  id: string;
  pageIndex: number; // 0-based
  kind: EditorObjectKind;
  x: number;
  y: number;
  width: number;
  height: number;
  rotationDeg: number; // sentido horário, em graus
  opacity: number; // 0..1
  zIndex: number;
  locked?: boolean;
}

export type StandardFontId = "Helvetica" | "Helvetica-Bold" | "TimesRoman" | "TimesRoman-Bold" | "Courier";

export interface EditorTextObject extends EditorObjectBase {
  kind: "text";
  text: string;
  fontSize: number;
  color: string; // "#rrggbb"
  font: StandardFontId;
  align: "left" | "center" | "right";
}

export interface EditorImageObject extends EditorObjectBase {
  kind: "image";
  bytes: Uint8Array;
  mimeType: "image/png" | "image/jpeg";
  previewUrl: string; // object URL, só para exibição na UI
}

export interface EditorRectObject extends EditorObjectBase {
  kind: "rect";
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  cornerRadius: number;
}

export interface EditorEllipseObject extends EditorObjectBase {
  kind: "ellipse";
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
}

export interface EditorLineObject extends EditorObjectBase {
  kind: "line";
  stroke: string;
  strokeWidth: number;
}

export interface EditorLinkObject extends EditorObjectBase {
  kind: "link";
  url: string;
  label: string;
}

export type EditorObject =
  | EditorTextObject
  | EditorImageObject
  | EditorRectObject
  | EditorEllipseObject
  | EditorLineObject
  | EditorLinkObject;

export interface EditorState {
  objects: EditorObject[];
  selectedIds: string[];
}

const MAX_HISTORY = 50;

export interface EditorHistory {
  past: EditorObject[][];
  present: EditorObject[];
  future: EditorObject[][];
}

export function createHistory(initial: EditorObject[] = []): EditorHistory {
  return { past: [], present: initial, future: [] };
}

/** Registra uma nova versão do array de objetos, truncando o futuro (padrão undo/redo). */
export function commitHistory(history: EditorHistory, next: EditorObject[]): EditorHistory {
  const past = [...history.past, history.present].slice(-MAX_HISTORY);
  return { past, present: next, future: [] };
}

export function undoHistory(history: EditorHistory): EditorHistory {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1];
  const past = history.past.slice(0, -1);
  const future = [history.present, ...history.future];
  return { past, present: previous, future };
}

export function redoHistory(history: EditorHistory): EditorHistory {
  if (history.future.length === 0) return history;
  const next = history.future[0];
  const future = history.future.slice(1);
  const past = [...history.past, history.present];
  return { past, present: next, future };
}

export function canUndo(history: EditorHistory): boolean {
  return history.past.length > 0;
}

export function canRedo(history: EditorHistory): boolean {
  return history.future.length > 0;
}

let idCounter = 0;
export function nextObjectId(): string {
  idCounter += 1;
  return `obj_${Date.now()}_${idCounter}`;
}

export function nextZIndex(objects: EditorObject[]): number {
  return objects.reduce((max, o) => Math.max(max, o.zIndex), 0) + 1;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function boundsOf(o: EditorObjectBase): Bounds {
  return { minX: o.x, minY: o.y, maxX: o.x + o.width, maxY: o.y + o.height };
}

export function unionBounds(objs: EditorObjectBase[]): Bounds | null {
  if (objs.length === 0) return null;
  return objs.reduce<Bounds>(
    (acc, o) => {
      const b = boundsOf(o);
      return {
        minX: Math.min(acc.minX, b.minX),
        minY: Math.min(acc.minY, b.minY),
        maxX: Math.max(acc.maxX, b.maxX),
        maxY: Math.max(acc.maxY, b.maxY),
      };
    },
    boundsOf(objs[0]),
  );
}

export type AlignMode = "left" | "hcenter" | "right" | "top" | "vcenter" | "bottom";

/** Alinha os objetos selecionados entre si (usa a caixa delimitadora da seleção). */
export function alignObjects(objects: EditorObject[], ids: string[], mode: AlignMode): EditorObject[] {
  const selected = objects.filter((o) => ids.includes(o.id));
  const bounds = unionBounds(selected);
  if (!bounds) return objects;
  return objects.map((o) => {
    if (!ids.includes(o.id)) return o;
    switch (mode) {
      case "left":
        return { ...o, x: bounds.minX };
      case "right":
        return { ...o, x: bounds.maxX - o.width };
      case "hcenter":
        return { ...o, x: (bounds.minX + bounds.maxX) / 2 - o.width / 2 };
      case "top":
        return { ...o, y: bounds.minY };
      case "bottom":
        return { ...o, y: bounds.maxY - o.height };
      case "vcenter":
        return { ...o, y: (bounds.minY + bounds.maxY) / 2 - o.height / 2 };
      default:
        return o;
    }
  });
}

/** Distribui espaçamento uniforme entre 3+ objetos selecionados (centro a centro). */
export function distributeObjects(objects: EditorObject[], ids: string[], axis: "horizontal" | "vertical"): EditorObject[] {
  const selected = objects.filter((o) => ids.includes(o.id));
  if (selected.length < 3) return objects;
  const sorted = [...selected].sort((a, b) =>
    axis === "horizontal" ? a.x + a.width / 2 - (b.x + b.width / 2) : a.y + a.height / 2 - (b.y + b.height / 2),
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const firstCenter = axis === "horizontal" ? first.x + first.width / 2 : first.y + first.height / 2;
  const lastCenter = axis === "horizontal" ? last.x + last.width / 2 : last.y + last.height / 2;
  const step = (lastCenter - firstCenter) / (sorted.length - 1);
  const updates = new Map<string, number>();
  sorted.forEach((o, i) => {
    const targetCenter = firstCenter + step * i;
    updates.set(o.id, axis === "horizontal" ? targetCenter - o.width / 2 : targetCenter - o.height / 2);
  });
  return objects.map((o) => {
    if (!updates.has(o.id)) return o;
    const v = updates.get(o.id)!;
    return axis === "horizontal" ? { ...o, x: v } : { ...o, y: v };
  });
}

/** Aplica um snap de grade (arredonda x/y para o múltiplo mais próximo de `gridSize`). */
export function snapToGrid(value: number, gridSize: number): number {
  if (gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
}
