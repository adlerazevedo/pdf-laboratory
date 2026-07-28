/**
 * Exportação do Editor de PDF (Fase 2): recebe o PDF original (bytes) e a
 * lista de objetos adicionados pelo usuário e devolve um NOVO PDF (o
 * original nunca é mutado em memória além da cópia carregada pelo pdf-lib).
 *
 * Importante (ver docs/PDF_EDITOR.md): isto é composição de NOVOS objetos
 * sobre o conteúdo existente — não é edição do fluxo de conteúdo original.
 * Um retângulo opaco por cima de texto é uma COBERTURA VISUAL, não uma
 * exclusão do conteúdo subjacente (o texto continua extraível). Para
 * remoção real, use a ferramenta "Redação segura".
 */
import { PDFArray, PDFDocument, PDFFont, PDFImage, PDFName, PDFRef, PDFString, StandardFonts, degrees, rgb, type Color } from "pdf-lib";
import type { EditorImageObject, EditorObject, StandardFontId } from "./editorTypes";
import type { OperationProgress } from "./types";
import { OperationCancelledError, type CancelToken } from "./types";

function hexToColor(hex: string): Color {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

const STANDARD_FONT_MAP: Record<StandardFontId, StandardFonts> = {
  Helvetica: StandardFonts.Helvetica,
  "Helvetica-Bold": StandardFonts.HelveticaBold,
  TimesRoman: StandardFonts.TimesRoman,
  "TimesRoman-Bold": StandardFonts.TimesRomanBold,
  Courier: StandardFonts.Courier,
};

/**
 * Calcula a âncora (x, y no espaço PDF, origem inferior-esquerda) que deve
 * ser passada às funções `draw*` do pdf-lib para que a rotação aconteça em
 * torno do CENTRO do objeto (como o usuário vê no editor), em vez do canto
 * inferior-esquerdo (comportamento padrão do pdf-lib ao usar `rotate`).
 */
function centerRotationAnchor(centerX: number, centerY: number, halfW: number, halfH: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rotatedOffsetX = halfW * cos - halfH * sin;
  const rotatedOffsetY = halfW * sin + halfH * cos;
  return { x: centerX - rotatedOffsetX, y: centerY - rotatedOffsetY };
}

/** Converte um objeto (origem superior-esquerda) para a âncora inferior-esquerda do pdf-lib, já compensando rotação em torno do centro. */
function toPdfSpace(o: { x: number; y: number; width: number; height: number; rotationDeg: number }, pageHeight: number) {
  const centerX = o.x + o.width / 2;
  const centerYBottomLeft = pageHeight - (o.y + o.height / 2);
  return centerRotationAnchor(centerX, centerYBottomLeft, o.width / 2, o.height / 2, -o.rotationDeg);
}

function addLinkAnnotationToPage(page: import("pdf-lib").PDFPage, linkRef: PDFRef) {
  const existing = page.node.get(PDFName.of("Annots"));
  if (existing instanceof PDFArray) {
    existing.push(linkRef);
  } else {
    const arr = PDFArray.withContext(page.doc.context);
    arr.push(linkRef);
    page.node.set(PDFName.of("Annots"), arr);
  }
}

export interface ExportEditorPdfOptions {
  objects: EditorObject[];
}

export async function applyEditorObjects(
  bytes: Uint8Array,
  options: ExportEditorPdfOptions,
  onProgress?: (p: OperationProgress) => void,
  token?: CancelToken,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();
  const fontCache = new Map<StandardFontId, PDFFont>();
  const imageCache = new Map<string, PDFImage>();

  async function getFont(id: StandardFontId): Promise<PDFFont> {
    let f = fontCache.get(id);
    if (!f) {
      f = await doc.embedFont(STANDARD_FONT_MAP[id]);
      fontCache.set(id, f);
    }
    return f;
  }

  async function getImage(obj: EditorImageObject): Promise<PDFImage> {
    let img = imageCache.get(obj.id);
    if (!img) {
      img = obj.mimeType === "image/png" ? await doc.embedPng(obj.bytes) : await doc.embedJpg(obj.bytes);
      imageCache.set(obj.id, img);
    }
    return img;
  }

  const sorted = [...options.objects].sort((a, b) => a.zIndex - b.zIndex);
  const total = sorted.length;
  let done = 0;

  for (const obj of sorted) {
    if (token?.cancelled) throw new OperationCancelledError();
    const page = pages[obj.pageIndex];
    if (!page) {
      done += 1;
      continue;
    }
    const pageHeight = page.getHeight();
    const anchor = toPdfSpace(obj, pageHeight);
    const rotate = degrees(-obj.rotationDeg);

    switch (obj.kind) {
      case "text": {
        const font = await getFont(obj.font);
        const lines = obj.text.length > 0 ? obj.text.split("\n") : [""];
        const lineHeight = obj.fontSize * 1.2;
        for (let i = 0; i < lines.length; i += 1) {
          const line = lines[i];
          const lineWidth = font.widthOfTextAtSize(line, obj.fontSize);
          let lineX = 0;
          if (obj.align === "center") lineX = (obj.width - lineWidth) / 2;
          else if (obj.align === "right") lineX = obj.width - lineWidth;
          const topLeftLineX = obj.x + lineX;
          const topLeftLineY = obj.y + i * lineHeight;
          const localAnchor = toPdfSpace(
            { x: topLeftLineX, y: topLeftLineY, width: lineWidth, height: lineHeight, rotationDeg: obj.rotationDeg },
            pageHeight,
          );
          const baselineAdjust = (lineHeight - obj.fontSize) / 2;
          page.drawText(line, {
            x: localAnchor.x,
            y: localAnchor.y + baselineAdjust,
            size: obj.fontSize,
            font,
            color: hexToColor(obj.color),
            opacity: obj.opacity,
            rotate,
          });
        }
        break;
      }
      case "image": {
        const img = await getImage(obj);
        page.drawImage(img, { x: anchor.x, y: anchor.y, width: obj.width, height: obj.height, opacity: obj.opacity, rotate });
        break;
      }
      case "rect": {
        if (obj.cornerRadius > 0) {
          const r = Math.min(obj.cornerRadius, obj.width / 2, obj.height / 2);
          const w = obj.width;
          const h = obj.height;
          const svgPath = `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
          page.drawSvgPath(svgPath, {
            x: anchor.x,
            y: anchor.y + obj.height,
            scale: 1,
            color: obj.fill ? hexToColor(obj.fill) : undefined,
            borderColor: obj.stroke ? hexToColor(obj.stroke) : undefined,
            borderWidth: obj.stroke ? obj.strokeWidth : 0,
            opacity: obj.opacity,
            borderOpacity: obj.opacity,
            rotate,
          });
        } else {
          page.drawRectangle({
            x: anchor.x,
            y: anchor.y,
            width: obj.width,
            height: obj.height,
            color: obj.fill ? hexToColor(obj.fill) : undefined,
            borderColor: obj.stroke ? hexToColor(obj.stroke) : undefined,
            borderWidth: obj.stroke ? obj.strokeWidth : 0,
            opacity: obj.opacity,
            borderOpacity: obj.opacity,
            rotate,
          });
        }
        break;
      }
      case "ellipse": {
        const centerAnchor = centerRotationAnchor(
          obj.x + obj.width / 2,
          pageHeight - (obj.y + obj.height / 2),
          0,
          0,
          -obj.rotationDeg,
        );
        page.drawEllipse({
          x: centerAnchor.x,
          y: centerAnchor.y,
          xScale: obj.width / 2,
          yScale: obj.height / 2,
          color: obj.fill ? hexToColor(obj.fill) : undefined,
          borderColor: obj.stroke ? hexToColor(obj.stroke) : undefined,
          borderWidth: obj.stroke ? obj.strokeWidth : 0,
          opacity: obj.opacity,
          borderOpacity: obj.opacity,
          rotate,
        });
        break;
      }
      case "line": {
        const start = { x: obj.x, y: pageHeight - obj.y };
        const end = { x: obj.x + obj.width, y: pageHeight - (obj.y + obj.height) };
        page.drawLine({ start, end, thickness: obj.strokeWidth, color: hexToColor(obj.stroke), opacity: obj.opacity });
        break;
      }
      case "link": {
        const rectArr = [anchor.x, anchor.y, anchor.x + obj.width, anchor.y + obj.height];
        const linkAnnotDict = doc.context.obj({
          Type: "Annot",
          Subtype: "Link",
          Rect: rectArr,
          Border: [0, 0, 0],
          A: doc.context.obj({ Type: "Action", S: "URI", URI: PDFString.of(obj.url) }),
        });
        const linkRef = doc.context.register(linkAnnotDict);
        addLinkAnnotationToPage(page, linkRef);
        break;
      }
      default:
        break;
    }

    done += 1;
    onProgress?.({ done, total, stage: "Aplicando objetos do editor" });
  }

  return doc.save();
}
