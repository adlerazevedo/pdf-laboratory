import type { ToolDescriptor } from "../lib/pdf/types";

/**
 * Classificação por ferramenta, conforme o prompt mestre:
 *  - "browser": totalmente implementável no navegador (nível A).
 *  - "limited": implementável com limitações relevantes (nível B).
 *  - "desktop-only": indisponível sem backend/componente nativo (nível C) —
 *    nunca vira um botão ativo falso; mostra "Disponível no aplicativo desktop".
 */
export const TOOLS: ToolDescriptor[] = [
  {
    id: "edit",
    title: "Editar PDF",
    description: "Adicione texto, imagens, formas e links diretamente sobre as páginas do seu PDF.",
    availability: "limited",
    limitationNote: "Isto adiciona novos objetos sobre o conteúdo existente — não reescreve texto já existente no PDF (edição real de texto incorporado tem suporte limitado; veja docs/PDF_EDITOR.md).",
    icon: "edit",
  },
  { id: "merge", title: "Unir PDFs", description: "Combine vários arquivos PDF em um único documento, na ordem que você escolher.", availability: "browser", icon: "merge" },
  { id: "split", title: "Dividir PDF", description: "Separe um PDF em vários arquivos por intervalos de página.", availability: "browser", icon: "split" },
  { id: "organize", title: "Organizar páginas", description: "Reordene, gire, duplique, exclua e insira páginas em branco.", availability: "browser", icon: "organize" },
  { id: "extract", title: "Extrair páginas", description: "Salve um subconjunto de páginas como um novo PDF.", availability: "browser", icon: "extract" },
  { id: "images-to-pdf", title: "Imagens em PDF", description: "Transforme imagens JPEG ou PNG em um PDF, uma por página.", availability: "browser", icon: "image" },
  { id: "pdf-to-images", title: "PDF em imagens", description: "Exporte cada página como uma imagem PNG, em um arquivo .zip.", availability: "browser", icon: "image" },
  { id: "watermark", title: "Marca d'água", description: "Aplique um texto sobreposto em todas as páginas.", availability: "browser", icon: "watermark" },
  { id: "page-numbers", title: "Numeração de páginas", description: "Adicione números de página no rodapé do documento.", availability: "browser", icon: "numbers" },
  { id: "metadata", title: "Metadados", description: "Edite título, autor, assunto e palavras-chave do documento.", availability: "browser", icon: "info" },
  {
    id: "ocr",
    title: "OCR (texto pesquisável)",
    description: "Reconhecimento de texto via Tesseract.js, processado localmente no seu navegador.",
    availability: "limited",
    limitationNote: "Qualidade e velocidade inferiores ao OCRmyPDF do aplicativo desktop; exige baixar um modelo de idioma (não seu documento) na primeira execução.",
    icon: "ocr",
  },
  {
    id: "compress",
    title: "Compressão básica",
    description: "Redução simples de tamanho por reamostragem de imagens.",
    availability: "limited",
    limitationNote: "Não equivale à otimização via Ghostscript do aplicativo desktop; resultados variam bastante por documento.",
    icon: "compress",
  },
  {
    id: "visual-signature",
    title: "Assinatura visual (carimbo)",
    description: "Insere uma imagem ou texto de assinatura sobre o documento.",
    availability: "limited",
    limitationNote: "É apenas visual — sem validade jurídica ou criptográfica. Para assinatura digital real (ICP-Brasil), use o aplicativo desktop.",
    icon: "signature",
  },
  {
    id: "optimize-advanced",
    title: "Otimização avançada (Ghostscript)",
    description: "Compressão avançada com controle fino de qualidade.",
    availability: "desktop-only",
    limitationNote: "Depende do Ghostscript instalado localmente — disponível apenas no aplicativo desktop.",
    icon: "compress",
  },
  {
    id: "office-convert",
    title: "Converter Word/Excel/PowerPoint",
    description: "Conversão fiel entre PDF e formatos do Office.",
    availability: "desktop-only",
    limitationNote: "Depende do LibreOffice instalado localmente — disponível apenas no aplicativo desktop.",
    icon: "convert",
  },
  {
    id: "digital-signature",
    title: "Assinatura digital (ICP-Brasil)",
    description: "Assinatura criptográfica com certificado PFX/P12.",
    availability: "desktop-only",
    limitationNote: "Certificados PFX/P12 nunca devem ser carregados em um navegador — disponível apenas no aplicativo desktop.",
    icon: "signature",
  },
  {
    id: "redaction",
    title: "Redação segura",
    description: "Remoção definitiva e irreversível de conteúdo sensível.",
    availability: "desktop-only",
    limitationNote: "Requer reprocessamento profundo do PDF (qpdf) para garantir remoção real — disponível apenas no aplicativo desktop.",
    icon: "redact",
  },
  {
    id: "repair",
    title: "Reparo avançado (qpdf)",
    description: "Reconstrução de arquivos corrompidos ou malformados.",
    availability: "desktop-only",
    limitationNote: "Depende do qpdf instalado localmente — disponível apenas no aplicativo desktop.",
    icon: "repair",
  },
  {
    id: "bookmarks",
    title: "Marcadores (bookmarks)",
    description: "Listar, adicionar ou remover marcadores/sumário do PDF.",
    availability: "desktop-only",
    limitationNote: "Manipulação de marcadores ainda não tem motor equivalente no navegador — disponível apenas no aplicativo desktop.",
    icon: "bookmarks",
  },
  {
    id: "compare",
    title: "Comparação de documentos",
    description: "Compara duas versões de um PDF, página a página, e aponta as diferenças.",
    availability: "desktop-only",
    limitationNote: "Renderização e comparação de alta fidelidade entre documentos ainda não têm motor equivalente no navegador — disponível apenas no aplicativo desktop.",
    icon: "compare",
  },
  {
    id: "inspect",
    title: "Inspeção técnica do PDF",
    description: "Detalhes internos: versão do PDF, criptografia, formulários, JavaScript, imagens e anexos embutidos.",
    availability: "desktop-only",
    limitationNote: "Inspeção profunda da estrutura interna do PDF ainda não tem motor equivalente no navegador — disponível apenas no aplicativo desktop.",
    icon: "inspect",
  },
];

export const TOOLS_PRINCIPAIS = TOOLS.filter((t) =>
  ["edit", "merge", "split", "organize", "extract", "images-to-pdf", "pdf-to-images", "watermark", "page-numbers", "metadata", "compress"].includes(t.id),
);

export const TOOLS_SEGURANCA = TOOLS.filter((t) =>
  [
    "ocr",
    "visual-signature",
    "optimize-advanced",
    "office-convert",
    "digital-signature",
    "redaction",
    "repair",
    "bookmarks",
    "compare",
    "inspect",
  ].includes(t.id),
);
