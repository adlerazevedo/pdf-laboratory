import { describe, expect, it } from "vitest";
import { buildPageImageFileName } from "./pageExport";

describe("buildPageImageFileName", () => {
  it("usa zero-padding de 2 dígitos para documentos com até 99 páginas", () => {
    expect(buildPageImageFileName("relatorio.pdf", 3, 10, "png")).toBe("relatorio-pagina-03.png");
  });

  it("usa zero-padding proporcional ao total de páginas quando são 3+ dígitos", () => {
    expect(buildPageImageFileName("relatorio.pdf", 7, 120, "jpg")).toBe("relatorio-pagina-007.jpg");
  });

  it("remove a extensão .pdf do nome base e ignora maiúsculas/minúsculas", () => {
    expect(buildPageImageFileName("Contrato.PDF", 1, 1, "png")).toBe("Contrato-pagina-01.png");
  });

  it("usa um nome padrão quando o nome base fica vazio", () => {
    expect(buildPageImageFileName(".pdf", 1, 1, "png")).toBe("documento-pagina-01.png");
  });
});
