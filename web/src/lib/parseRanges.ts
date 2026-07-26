export interface ParsedRange {
  start: number;
  end: number;
}

/**
 * Analisa uma string como "1-3, 5, 8-10" (números de página visíveis ao
 * usuário, 1-based) em intervalos internos 0-based (start/end inclusivos).
 */
export function parsePageRanges(input: string, pageCount: number): { ranges: ParsedRange[]; error: string | null } {
  const trimmed = input.trim();
  if (!trimmed) return { ranges: [], error: "Informe ao menos um intervalo de páginas." };

  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  const ranges: ParsedRange[] = [];

  for (const part of parts) {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!match) return { ranges: [], error: `Intervalo inválido: "${part}". Use o formato 1-3 ou 5.` };
    const start1 = Number(match[1]);
    const end1 = match[2] ? Number(match[2]) : start1;
    if (start1 < 1 || end1 > pageCount || start1 > end1) {
      return { ranges: [], error: `Intervalo "${part}" fora do intervalo válido (1–${pageCount}).` };
    }
    ranges.push({ start: start1 - 1, end: end1 - 1 });
  }

  return { ranges, error: null };
}
