/**
 * Tipos compartilhados da camada de PDF. Espelham (em espírito, não em
 * código — são duas bases independentes) os modelos pydantic do aplicativo
 * desktop, para manter a terminologia consistente entre as duas versões.
 */

export interface LoadedDocument {
  /** Identificador local (não persistido), gerado ao carregar o arquivo. */
  id: string;
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  /** Bytes originais do arquivo, mantidos em memória (nunca em disco). */
  bytes: Uint8Array;
}

export interface PageThumbnail {
  pageIndex: number; // 0-based
  dataUrl: string;
  widthPt: number;
  heightPt: number;
}

export type RotationDegrees = 0 | 90 | 180 | 270;

export interface PageState {
  /** Índice original da página no documento carregado (0-based). */
  sourceIndex: number;
  rotation: RotationDegrees;
  selected: boolean;
  /** Verdadeiro para páginas em branco inseridas pelo usuário (não existem no documento original). */
  isInsertedBlank?: boolean;
}

export type ToolAvailability = "browser" | "limited" | "desktop-only";

export interface ToolDescriptor {
  id: string;
  title: string;
  description: string;
  availability: ToolAvailability;
  /** Explicação exibida quando availability !== "browser". */
  limitationNote?: string;
  icon: string;
}

export interface OperationProgress {
  done: number;
  total: number;
  stage: string;
}

export type CancelToken = { cancelled: boolean };

export function createCancelToken(): CancelToken {
  return { cancelled: false };
}

export class OperationCancelledError extends Error {
  constructor() {
    super("Operação cancelada pelo usuário.");
    this.name = "OperationCancelledError";
  }
}

export interface SimpleMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
}
