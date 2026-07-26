#!/usr/bin/env node
/**
 * Gera PDFs SINTÉTICOS mínimos (sem nenhum dado real) para uso em testes
 * automatizados, tanto do desktop (Python) quanto da versão web.
 *
 * IMPORTANTE: nunca commitar PDFs reais/pessoais neste repositório. Estes
 * arquivos são gerados por este script e podem ser recriados a qualquer
 * momento — nenhum deles deve ser editado manualmente.
 *
 * Uso: node generate.mjs [pasta-de-saida]
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

function buildMinimalPdf(pageCount, labelPrefix = "Pagina") {
  const objects = [];
  const pageObjIds = [];

  objects.push({ id: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" });

  const kids = Array.from({ length: pageCount }, (_, i) => `${3 + i * 2} 0 R`).join(" ");
  objects.push({ id: 2, body: `<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>` });

  for (let i = 0; i < pageCount; i++) {
    const pageId = 3 + i * 2;
    const contentId = pageId + 1;
    const text = `${labelPrefix} ${i + 1} de ${pageCount} (arquivo sintetico de teste)`;
    const stream = `BT /F1 14 Tf 40 200 Td (${text}) Tj ET`;
    objects.push({
      id: pageId,
      body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << /Font << /F1 ${3 + pageCount * 2} 0 R >> >> /Contents ${contentId} 0 R >>`,
    });
    objects.push({ id: contentId, body: `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream` });
    pageObjIds.push(pageId);
  }

  const fontId = 3 + pageCount * 2;
  objects.push({ id: fontId, body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" });

  objects.sort((a, b) => a.id - b.id);

  let pdf = "%PDF-1.7\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += `${obj.id} 0 obj\n${obj.body}\nendobj\n`;
  }
  const xrefStart = pdf.length;
  const totalObjects = objects.length + 1;
  pdf += `xref\n0 ${totalObjects}\n0000000000 65535 f \n`;
  for (let i = 1; i < totalObjects; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${totalObjects} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

const outDir = process.argv[2] ?? join(import.meta.dirname, "generated");
mkdirSync(outDir, { recursive: true });

const fixtures = [
  { name: "sintetico-1-pagina.pdf", pages: 1 },
  { name: "sintetico-3-paginas.pdf", pages: 3 },
  { name: "sintetico-10-paginas.pdf", pages: 10 },
];

for (const fixture of fixtures) {
  const bytes = buildMinimalPdf(fixture.pages);
  writeFileSync(join(outDir, fixture.name), bytes);
  console.log(`Gerado: ${fixture.name} (${fixture.pages} paginas, ${bytes.length} bytes)`);
}
