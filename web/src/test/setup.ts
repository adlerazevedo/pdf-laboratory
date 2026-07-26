import "@testing-library/jest-dom/vitest";

// jsdom's próprio polyfill de Blob/File não implementa arrayBuffer()/text()/
// stream(), apenas slice(). Substituímos pelos globais nativos do Node
// (disponíveis desde o Node 20, baseados em undici), que implementam a
// especificação completa. Isso afeta somente o ambiente de teste — o
// código de produção roda em um navegador real, onde File/Blob já são
// completos.
import { Blob as NodeBlob, File as NodeFile } from "node:buffer";
globalThis.Blob = NodeBlob as unknown as typeof Blob;
globalThis.File = NodeFile as unknown as typeof File;
