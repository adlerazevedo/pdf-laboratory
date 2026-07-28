/**
 * Fase 6 — Detecção inteligente de campos de formulário.
 *
 * Heurística LOCAL (sem rede, sem modelo externo, sem IA de terceiros):
 * a partir dos itens de texto já extraídos de uma página via pdf.js
 * (mesmo mecanismo usado pela Redação segura em detectSensitivePatterns,
 * ver redaction.ts), procura três sinais comuns em formulários digitalizados
 * ou gerados a partir de modelos de texto:
 *
 *  1. Rótulos conhecidos ("Nome:", "CPF:", "E-mail:", "Data:", ...) —
 *     sugere um campo de texto (ou do tipo mais específico) logo à
 *     direita do rótulo.
 *  2. Linhas em branco para preenchimento manual (sequências de "_" ou
 *     de "." usadas para simular uma linha) — sugere um campo de texto
 *     sobrepondo a linha.
 *  3. Glifos de caixa de seleção comuns em texto (☐ ☑ □ ■ ✓ ✔) —
 *     sugere um campo checkbox no lugar do glifo.
 *
 * Isto é uma HEURÍSTICA, não uma extração perfeita: depende de como o
 * PDF de origem quebra o texto em itens (dois PDFs com o mesmo visual
 * podem produzir itens de texto bem diferentes). O usuário sempre revê
 * e aceita/descarta cada sugestão manualmente antes de qualquer campo
 * real ser criado — nunca cria campos "no automático" sem confirmação.
 */
import type { TextItemInput } from "./redaction";
import type { FormFieldKind } from "./formTypes";

export interface DetectedFieldSuggestion {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: FormFieldKind;
  suggestedName: string;
  sourceLabel: string;
  confidence: "alta" | "media";
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function slugify(s: string): string {
  const base = normalize(s).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return base || "campo";
}

const LABEL_PATTERNS: Array<{ test: (norm: string) => boolean; kind: FormFieldKind }> = [
  { test: (n) => /^cpf:?$/.test(n), kind: "cpf" },
  { test: (n) => /^cnpj:?$/.test(n), kind: "cnpj" },
  { test: (n) => /^(e-?mail):?$/.test(n), kind: "email" },
  { test: (n) => /^(cep):?$/.test(n), kind: "cep" },
  { test: (n) => /^(telefone|celular|fone|whatsapp):?$/.test(n), kind: "phone" },
  { test: (n) => /^(data|dt\.?|data de nascimento):?$/.test(n), kind: "date" },
  { test: (n) => /^(hora|horario):?$/.test(n), kind: "time" },
  { test: (n) => /^(assinatura):?$/.test(n), kind: "signature" },
  { test: (n) => /^(valor|preco|montante):?$/.test(n), kind: "currency" },
  { test: (n) => /^(observacoes?|descricao|comentarios?|detalhes|endereco):?$/.test(n), kind: "multiline" },
  {
    test: (n) => /^(nome|nome completo|razao social|responsavel|solicitante|requerente):?$/.test(n),
    kind: "text",
  },
];

const BLANK_LINE_RE = /^_{3,}$/;
const DOTTED_LINE_RE = /^\.{4,}$/;
const CHECKBOX_GLYPH_RE = /^[☐☑□■✓✔]$/;

let suggestionCounter = 0;
function nextSuggestionId(): string {
  suggestionCounter += 1;
  return `suggestion_${Date.now()}_${suggestionCounter}`;
}

/**
 * Função pura: recebe os itens de texto já extraídos (uma página por vez
 * ou várias juntas — o pageIndex de cada item já indica a página) e a
 * largura da página (para não sugerir campos que ultrapassem a margem
 * direita), devolve sugestões de campo. Não depende de pdf.js/DOM —
 * por isso é testável diretamente com fixtures simples.
 */
export function detectFieldSuggestions(items: TextItemInput[], pageWidthByIndex: Record<number, number>): DetectedFieldSuggestion[] {
  const suggestions: DetectedFieldSuggestion[] = [];
  const usedNames = new Set<string>();

  function uniqueName(base: string): string {
    let name = base;
    let n = 1;
    while (usedNames.has(name)) {
      n += 1;
      name = `${base}_${n}`;
    }
    usedNames.add(name);
    return name;
  }

  for (const item of items) {
    const trimmed = item.str.trim();
    if (!trimmed) continue;

    if (CHECKBOX_GLYPH_RE.test(trimmed)) {
      suggestions.push({
        id: nextSuggestionId(),
        pageIndex: item.pageIndex,
        x: item.xPt,
        y: item.yPt,
        width: Math.max(14, item.widthPt || 14),
        height: Math.max(14, item.heightPt || 14),
        kind: "checkbox",
        suggestedName: uniqueName("caixa_selecao"),
        sourceLabel: trimmed,
        confidence: "alta",
      });
      continue;
    }

    if (BLANK_LINE_RE.test(trimmed) || DOTTED_LINE_RE.test(trimmed)) {
      suggestions.push({
        id: nextSuggestionId(),
        pageIndex: item.pageIndex,
        x: item.xPt,
        y: Math.max(0, item.yPt - 4),
        width: Math.max(60, item.widthPt),
        height: Math.max(18, item.heightPt + 8),
        kind: "text",
        suggestedName: uniqueName("preenchimento"),
        sourceLabel: trimmed,
        confidence: "media",
      });
      continue;
    }

    const norm = normalize(trimmed);
    const match = LABEL_PATTERNS.find((p) => p.test(norm));
    if (match) {
      const pageWidth = pageWidthByIndex[item.pageIndex] ?? item.xPt + item.widthPt + 240;
      const fieldX = item.xPt + item.widthPt + 6;
      const availableWidth = pageWidth - fieldX - 20; // margem direita mínima
      if (availableWidth < 20) continue; // sem espaço à direita do rótulo — não sugere um campo que ultrapassaria a página
      const desiredWidth = match.kind === "multiline" ? 260 : 200;
      const fieldWidth = Math.min(desiredWidth, availableWidth);
      const fieldHeight = match.kind === "multiline" ? 60 : match.kind === "signature" ? 30 : 22;
      suggestions.push({
        id: nextSuggestionId(),
        pageIndex: item.pageIndex,
        x: fieldX,
        y: item.yPt - 3,
        width: fieldWidth,
        height: fieldHeight,
        kind: match.kind,
        suggestedName: uniqueName(slugify(trimmed)),
        sourceLabel: trimmed,
        confidence: "alta",
      });
    }
  }

  return suggestions;
}
