import { describe, expect, it } from "vitest";
import { validatePdfFile, validateImageFile, MAX_FILE_SIZE_BYTES } from "./validation";

function makeFile(bytes: Uint8Array, name: string, type: string): File {
  return new File([bytes.slice().buffer as ArrayBuffer], name, { type });
}

describe("validatePdfFile", () => {
  it("aceita um arquivo com assinatura %PDF- válida", async () => {
    const bytes = new TextEncoder().encode("%PDF-1.7\n%…resto do arquivo sintético…");
    const result = await validatePdfFile(makeFile(bytes, "doc.pdf", "application/pdf"));
    expect(result.valid).toBe(true);
  });

  it("rejeita um arquivo sem a assinatura mágica, mesmo com extensão .pdf", async () => {
    const bytes = new TextEncoder().encode("isto nao e um pdf de verdade");
    const result = await validatePdfFile(makeFile(bytes, "falso.pdf", "application/pdf"));
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/assinatura|PDF/i);
  });

  it("rejeita arquivos maiores que o limite configurado", async () => {
    const bytes = new Uint8Array(16);
    bytes.set(new TextEncoder().encode("%PDF-1.7"));
    const file = makeFile(bytes, "grande.pdf", "application/pdf");
    Object.defineProperty(file, "size", { value: MAX_FILE_SIZE_BYTES + 1 });
    const result = await validatePdfFile(file);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/limite|MB/i);
  });
});

describe("validateImageFile", () => {
  it("aceita PNG e JPEG", () => {
    const png = makeFile(new Uint8Array([1, 2, 3]), "img.png", "image/png");
    const jpg = makeFile(new Uint8Array([1, 2, 3]), "img.jpg", "image/jpeg");
    expect(validateImageFile(png).valid).toBe(true);
    expect(validateImageFile(jpg).valid).toBe(true);
  });

  it("rejeita outros tipos", () => {
    const gif = makeFile(new Uint8Array([1, 2, 3]), "img.gif", "image/gif");
    expect(validateImageFile(gif).valid).toBe(false);
  });
});
