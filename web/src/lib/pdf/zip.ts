import JSZip from "jszip";

export interface ZipEntry {
  fileName: string;
  bytes: Uint8Array;
}

/** Empacota múltiplos arquivos em um único .zip, inteiramente em memória. */
export async function buildZip(entries: ZipEntry[]): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const entry of entries) {
    zip.file(entry.fileName, entry.bytes);
  }
  const blob = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  return blob;
}

/**
 * Dispara o download de um arquivo no navegador via Blob + link temporário.
 * Sempre libera o objeto URL logo em seguida (nunca deixa referências penduradas).
 */
export function downloadBytes(bytes: Uint8Array, fileName: string, mimeType = "application/octet-stream"): void {
  const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Adia a revogação para o próximo tick, garantindo que o navegador já
  // tenha iniciado o download antes de invalidar a URL do Blob.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
