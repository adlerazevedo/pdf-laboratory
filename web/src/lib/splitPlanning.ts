import { parsePageRanges } from "./parseRanges";

export type SplitMode = "each-page" | "custom-ranges" | "every-n" | "into-n-files" | "odd-even" | "extract-selection";

export interface SplitGroup {
  /** Índices de página 0-based, na ordem em que devem aparecer no arquivo de saída. */
  pages: number[];
  /** Resumo legível para humanos, ex.: "Páginas 1–3 (3 páginas)". */
  label: string;
}

export interface SplitPlan {
  groups: SplitGroup[];
  error: string | null;
}

function describeRun(pages: number[]): string {
  // Resume uma lista de índices 0-based em algo como "1–3" ou "1, 4, 7" para exibição.
  const sorted = [...pages].sort((a, b) => a - b);
  const runs: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
      continue;
    }
    runs.push(start === prev ? `${start + 1}` : `${start + 1}–${prev + 1}`);
    start = current;
    prev = current;
  }
  return runs.join(", ");
}

function groupLabel(pages: number[]): string {
  const count = pages.length;
  return `Páginas ${describeRun(pages)} (${count} página${count > 1 ? "s" : ""})`;
}

export function planEachPage(pageCount: number): SplitPlan {
  if (pageCount <= 0) return { groups: [], error: "O documento não tem páginas." };
  const groups: SplitGroup[] = Array.from({ length: pageCount }, (_, i) => ({
    pages: [i],
    label: `Página ${i + 1}`,
  }));
  return { groups, error: null };
}

export function planCustomRanges(text: string, pageCount: number): SplitPlan {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { groups: [], error: "Informe ao menos uma linha com um intervalo de páginas (ex.: 1-3)." };
  }
  const groups: SplitGroup[] = [];
  for (let i = 0; i < lines.length; i++) {
    const { ranges, error } = parsePageRanges(lines[i], pageCount);
    if (error) {
      return { groups: [], error: `Linha ${i + 1} ("${lines[i]}"): ${error}` };
    }
    const pages = ranges.flatMap((r) => Array.from({ length: r.end - r.start + 1 }, (_, k) => r.start + k));
    groups.push({ pages, label: `${lines[i]} — ${groupLabel(pages).replace(/^Páginas /, "")}` });
  }
  return { groups, error: null };
}

export function planEveryNPages(n: number, pageCount: number): SplitPlan {
  if (!Number.isInteger(n) || n < 1) {
    return { groups: [], error: "Informe um número inteiro de páginas por arquivo, no mínimo 1." };
  }
  if (pageCount <= 0) return { groups: [], error: "O documento não tem páginas." };
  const groups: SplitGroup[] = [];
  for (let start = 0; start < pageCount; start += n) {
    const end = Math.min(start + n, pageCount) - 1;
    const pages = Array.from({ length: end - start + 1 }, (_, k) => start + k);
    groups.push({ pages, label: groupLabel(pages) });
  }
  return { groups, error: null };
}

export function planIntoNFiles(n: number, pageCount: number): SplitPlan {
  if (!Number.isInteger(n) || n < 1) {
    return { groups: [], error: "Informe um número inteiro de arquivos, no mínimo 1." };
  }
  if (pageCount <= 0) return { groups: [], error: "O documento não tem páginas." };
  if (n > pageCount) {
    return { groups: [], error: `Não é possível dividir em ${n} arquivos: o documento só tem ${pageCount} página${pageCount > 1 ? "s" : ""}.` };
  }
  const base = Math.floor(pageCount / n);
  const remainder = pageCount % n;
  const groups: SplitGroup[] = [];
  let cursor = 0;
  for (let i = 0; i < n; i++) {
    const size = base + (i < remainder ? 1 : 0);
    const pages = Array.from({ length: size }, (_, k) => cursor + k);
    cursor += size;
    groups.push({ pages, label: groupLabel(pages) });
  }
  return { groups, error: null };
}

export function planOddEven(pageCount: number): SplitPlan {
  if (pageCount <= 0) return { groups: [], error: "O documento não tem páginas." };
  const odd = Array.from({ length: pageCount }, (_, i) => i).filter((i) => i % 2 === 0);
  const even = Array.from({ length: pageCount }, (_, i) => i).filter((i) => i % 2 === 1);
  const groups: SplitGroup[] = [];
  if (odd.length > 0) groups.push({ pages: odd, label: `Páginas ímpares (${odd.length} página${odd.length > 1 ? "s" : ""})` });
  if (even.length > 0) groups.push({ pages: even, label: `Páginas pares (${even.length} página${even.length > 1 ? "s" : ""})` });
  return { groups, error: null };
}

export function planExtractSelection(text: string, pageCount: number): SplitPlan {
  const { ranges, error } = parsePageRanges(text, pageCount);
  if (error) return { groups: [], error };
  const pages = ranges.flatMap((r) => Array.from({ length: r.end - r.start + 1 }, (_, k) => r.start + k));
  return { groups: [{ pages, label: groupLabel(pages) }], error: null };
}
