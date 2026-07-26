import { pdfjsLib } from "./pdfjsSetup";
import { validatePdfFile } from "./validation";
import type { LoadedDocument } from "./types";

export class PdfPasswordRequiredError extends Error {
  constructor() {
    super("Este PDF está protegido por senha.");
    this.name = "PdfPasswordRequiredError";
  }
}

export class PdfOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfOpenError";
  }
}

function makeId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function loadPdfDocument(file: File, password?: string): Promise<LoadedDocument> {
  const validation = await validatePdfFile(file);
  if (!validation.valid) {
    throw new PdfOpenError(validation.reason ?? "Arquivo inválido.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({
    data: bytes.slice(),
    password,
    disableAutoFetch: true,
    disableStream: true,
  });
  try {
    const doc = await loadingTask.promise;
    const pageCount = doc.numPages;
    return {
      id: makeId(),
      fileName: file.name,
      fileSizeBytes: file.size,
      pageCount,
      bytes,
    };
  } catch (error: unknown) {
    const name = (error as { name?: string } | null)?.name;
    if (name === "PasswordException") {
      throw new PdfPasswordRequiredError();
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new PdfOpenError(`Não foi possível abrir o PDF: ${message}`);
  } finally {
    await loadingTask.destroy();
  }
}
