/**
 * Fase 4 — Redação segura. Diferente do Editor de PDF (que só ADICIONA
 * objetos por cima), esta ferramenta GARANTE remoção real de conteúdo:
 * qualquer página com pelo menos uma área marcada para redação é
 * inteiramente rasterizada (convertida em uma única imagem) ANTES de
 * voltar a virar página de PDF — ou seja, o texto/vetores originais
 * daquela página deixam de existir no arquivo de saída (não apenas
 * ficam cobertos). Páginas sem nenhuma marcação permanecem com o
 * conteúdo original (vetorial/pesquisável), sem perda de qualidade.
 *
 * Isto é mais agressivo que "apagar só a palavra": a página inteira
 * perde a camada de texto pesquisável. É a única forma que esta versão
 * web consegue GARANTIR remoção real sem depender de um motor de
 * reescrita de fluxo de conteúdo (qpdf/pikepdf, disponíveis apenas no
 * aplicativo desktop). Ver docs/PDF_EDITOR.md e docs/LIMITATIONS.md.
 */
import { PDFDocument, PDFName, PDFDict } from "pdf-lib";

export interface RedactionRect {
  pageIndex: number;
  xPt: number;
  yPt: number; // origem superior-esquerda, como no Editor de PDF
  widthPt: number;
  heightPt: number;
}

export type PatternKind = "cpf" | "cnpj" | "email" | "telefone";

export interface TextItemInput {
  pageIndex: number;
  str: string;
  xPt: number;
  yPt: number; // topo do item (origem superior-esquerda)
  widthPt: number;
  heightPt: number;
}

export interface PatternHit {
  pageIndex: number;
  kind: PatternKind;
  matchText: string;
  rect: RedactionRect;
}

const PATTERNS: Array<{ kind: PatternKind; regex: RegExp }> = [
  { kind: "cpf", regex: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g },
  { kind: "cnpj", regex: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g },
  { kind: "email", regex: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g },
  { kind: "telefone", regex: /\(\d{2}\)\s?\d{4,5}-\d{4}/g },
];

/**
 * Detecta CPF/CNPJ/e-mail/telefone no texto de cada item (pura, sem DOM —
 * recebe os itens de texto já extraídos via pdf.js `getTextContent`).
 * A caixa delimitadora de cada ocorrência é uma APROXIMAÇÃO proporcional
 * (largura do item dividida pela posição do caractere), pois pdf.js não
 * expõe a largura de cada glifo individualmente nesta API.
 */
export function detectSensitivePatterns(items: TextItemInput[]): PatternHit[] {
  const hits: PatternHit[] = [];
  for (const item of items) {
    for (const { kind, regex } of PATTERNS) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(item.str))) {
        const start = match.index;
        const end = start + match[0].length;
        const charWidth = item.widthPt / Math.max(1, item.str.length);
        hits.push({
          pageIndex: item.pageIndex,
          kind,
          matchText: match[0],
          rect: {
            pageIndex: item.pageIndex,
            xPt: item.xPt + start * charWidth,
            yPt: item.yPt,
            widthPt: (end - start) * charWidth,
            heightPt: item.heightPt,
          },
        });
        if (!regex.global) break;
      }
    }
  }
  return hits;
}

export interface RasterReplacement {
  pageIndex: number;
  pngBytes: Uint8Array;
  widthPt: number;
  heightPt: number;
}

export interface ApplyRedactionOptions {
  replacements: RasterReplacement[];
  clearMetadata?: boolean;
  clearAnnotations?: boolean;
  clearAttachments?: boolean;
}

/**
 * Reconstrói o PDF: páginas listadas em `replacements` são substituídas
 * por uma página nova contendo só a imagem rasterizada (já com as áreas
 * marcadas pintadas de preto, feito no lado do chamador antes de
 * chegar aqui); as demais páginas são copiadas sem alteração.
 */
export async function applyRedactionRaster(bytes: Uint8Array, options: ApplyRedactionOptions): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(bytes, { updateMetadata: false });
  const outDoc = await PDFDocument.create();
  const replacementByPage = new Map(options.replacements.map((r) => [r.pageIndex, r]));
  const pageCount = srcDoc.getPageCount();

  for (let i = 0; i < pageCount; i += 1) {
    const replacement = replacementByPage.get(i);
    if (replacement) {
      const png = await outDoc.embedPng(replacement.pngBytes);
      const page = outDoc.addPage([replacement.widthPt, replacement.heightPt]);
      page.drawImage(png, { x: 0, y: 0, width: replacement.widthPt, height: replacement.heightPt });
    } else {
      const [copied] = await outDoc.copyPages(srcDoc, [i]);
      outDoc.addPage(copied);
    }
  }

  if (options.clearMetadata) {
    outDoc.setTitle("");
    outDoc.setAuthor("");
    outDoc.setSubject("");
    outDoc.setKeywords([]);
    outDoc.setProducer("");
    outDoc.setCreator("");
  }
  if (options.clearAnnotations) {
    for (const page of outDoc.getPages()) {
      page.node.delete(PDFName.of("Annots"));
    }
  }
  if (options.clearAttachments) {
    const namesRef = outDoc.catalog.get(PDFName.of("Names"));
    const names = namesRef ? outDoc.context.lookup(namesRef, PDFDict) : undefined;
    names?.delete(PDFName.of("EmbeddedFiles"));
  }

  return outDoc.save();
}
