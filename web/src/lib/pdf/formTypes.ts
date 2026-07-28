/**
 * Modelo de campos do construtor de formulários AcroForm (Fase 5).
 * Origem de coordenadas: superior-esquerda, em pontos PDF — mesmo
 * referencial usado pelo Editor de PDF (ver editorTypes.ts).
 */

export type FormFieldKind =
  | "text"
  | "multiline"
  | "number"
  | "currency"
  | "date"
  | "time"
  | "cpf"
  | "cnpj"
  | "cep"
  | "phone"
  | "email"
  | "checkbox"
  | "radio"
  | "list"
  | "combo"
  | "button"
  | "signature"
  | "hidden"
  | "calculated";

/** Tipos que, no PDF, viram um campo de texto (/Tx) — a diferença entre eles é a MÁSCARA/validação aplicada pela ferramenta de preenchimento (Fase 7), não uma estrutura de PDF diferente. */
export const TEXT_LIKE_KINDS: FormFieldKind[] = [
  "text",
  "multiline",
  "number",
  "currency",
  "date",
  "time",
  "cpf",
  "cnpj",
  "cep",
  "phone",
  "email",
  "hidden",
  "calculated",
];

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  kind: FormFieldKind;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  tooltip: string;
  value: string;
  defaultValue: string;
  required: boolean;
  readOnly: boolean;
  printable: boolean;
  fontSize: number;
  color: string;
  backgroundColor: string | null;
  borderColor: string | null;
  align: "left" | "center" | "right";
  tabOrder: number;
  /** Só relevante para radio/list/combo. */
  options?: FormFieldOption[];
  /** Só relevante para "calculated": expressão avaliada pela ferramenta de preenchimento (Fase 7), não é JavaScript incorporado no PDF. */
  calculationExpression?: string;
}

let idCounter = 0;
export function nextFieldId(): string {
  idCounter += 1;
  return `field_${Date.now()}_${idCounter}`;
}

export function makeDefaultField(kind: FormFieldKind, pageIndex: number, x: number, y: number, existingNames: string[]): FormField {
  let baseName = kind;
  let n = 1;
  let name = `${baseName}_${n}`;
  while (existingNames.includes(name)) {
    n += 1;
    name = `${baseName}_${n}`;
  }
  const isCheckboxLike = kind === "checkbox";
  const isMultiline = kind === "multiline";
  return {
    id: nextFieldId(),
    kind,
    pageIndex,
    x,
    y,
    width: isCheckboxLike ? 18 : 180,
    height: isCheckboxLike ? 18 : isMultiline ? 80 : 24,
    name,
    tooltip: "",
    value: "",
    defaultValue: "",
    required: false,
    readOnly: false,
    printable: true,
    fontSize: 11,
    color: "#182125",
    backgroundColor: null,
    borderColor: "#5F6B72",
    align: "left",
    tabOrder: 0,
    options: kind === "radio" || kind === "list" || kind === "combo" ? [{ value: "opcao1", label: "Opção 1" }] : undefined,
    calculationExpression: kind === "calculated" ? "" : undefined,
  };
}

export function findDuplicateNames(fields: FormField[]): string[] {
  const counts = new Map<string, number>();
  for (const f of fields) counts.set(f.name, (counts.get(f.name) ?? 0) + 1);
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([name]) => name);
}

const MAX_HISTORY = 50;

export interface FormHistory {
  past: FormField[][];
  present: FormField[];
  future: FormField[][];
}

export function createFormHistory(initial: FormField[] = []): FormHistory {
  return { past: [], present: initial, future: [] };
}

export function commitFormHistory(history: FormHistory, next: FormField[]): FormHistory {
  return { past: [...history.past, history.present].slice(-MAX_HISTORY), present: next, future: [] };
}

export function undoFormHistory(history: FormHistory): FormHistory {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1];
  return { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] };
}

export function redoFormHistory(history: FormHistory): FormHistory {
  if (history.future.length === 0) return history;
  const next = history.future[0];
  return { past: [...history.past, history.present], present: next, future: history.future.slice(1) };
}
