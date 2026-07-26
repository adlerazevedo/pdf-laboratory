#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PDF Laboratory Desktop — PDF_Laboratory.py

Suite local e offline de manipulacao de PDF, escrita do zero neste único
arquivo. Não reutiliza, converte ou concatena nenhum projeto modular
anterior: todo o código autoral abaixo foi escrito diretamente aqui.
pip install pyhanko
Versao: 1.7.0

Reformulacao visual (v1.7.0): a interface foi redesenhada em cima do MESMO
motor funcional das versoes anteriores (nenhum modelo, servico, parser de
paginas, worker ou fila foi alterado). Mudancas: design system centralizado
(UiColors claro/escuro, UiMetrics, tipografia — classes UiColors/UiMetrics/
ui_font perto do topo da secao 20); paleta e QSS reescritos com cobertura
ampla (sidebar, abas, listas, campos, QGroupBox, QMenu, QProgressBar,
QCheckBox, tooltips, estados disabled/focus/hover); sistema de icones
vetoriais desenhados em memoria com QPainter/QPainterPath (make_icon(),
sem nenhum arquivo/imagem externa) usado na barra lateral, nos cartoes da
tela inicial e nos menus; barra lateral com cabecalho "PDF Laboratory /
Local • Privado • Offline", icones e destaque de selecao; busca com icone,
botao de limpar e filtragem por titulo E descricao; tela inicial
reorganizada em "Ferramentas principais" e "Seguranca e documentos", com
cartoes de altura consistente, icone, foco por teclado e estado
indisponivel explicado; componente InlineAlert reutilizavel (info/sucesso/
atencao/erro, com detalhes expansiveis) substituindo os avisos de
dependencia opcional (Ghostscript, LibreOffice, Tesseract/OCRmyPDF, qpdf,
pyHanko) que antes eram apenas texto colorido; DropArea redesenhada com
icone, botao explicito "Selecionar arquivos" e quatro estados (vazio,
arrastando, aceito, rejeitado) que mudam icone e texto, nao só cor;
hierarquia de botoes (primario/secundario/perigo) via
mark_button_variant(), com exatamente uma acao principal em destaque por
tela; textos voltados ao usuario revisados para portugues acentuado
(sidebar, cartoes, cabecalhos de tela, alertas, dialogos, Sobre,
diagnostico), preservando termos tecnicos (PDF, OCR, Ghostscript, qpdf,
Tesseract, OCRmyPDF, LibreOffice, pyHanko, PFX/P12) e identificadores de
codigo/CLI (as flags --self-test e --diagnostico permanecem exatamente
como antes). Validado apos a reformulacao: py_compile limpo,
--diagnostico correto, --self-test completo com todas as verificacoes
passando, e navegacao real (headless, com capturas de tela inspecionadas)
em todas as 10 telas nos temas claro e escuro, em 1366x768 e 1280x720,
maximizada e restaurada. Limitacoes conhecidas desta passada: nem todo
painel interno recebeu uma reestruturacao profunda de layout (alguns
formularios mais densos — ex.: Otimizar PDF — continuam exigindo rolagem
dentro do proprio painel de opcoes para alcancar o botao principal); um
modo compacto opcional para a barra lateral e um alternador rapido de
tema não foram implementados nesta passada.

Nível de conclusao nesta entrega:
    - Nível 1 (MVP): completo. Abrir/validar PDF (incl. protegido por
      senha), miniaturas/visualizador com zoom e seleção, 15 modos de
      divisão, uniao/organizacao completa (unir com marcadores/intercalar/
      inverter, reordenar, girar, excluir, duplicar, inserir página em
      branco, substituir páginas, extrair páginas), processamento em
      segundo plano com fila/lote/progresso/cancelamento, ZIP, temas,
      configurações, diagnóstico.
    - Nível 2 (parcial, genuino): metadados (ver/editar/limpar),
      sanitizacao (remove JavaScript/anexos/formularios ao reconstruir o
      documento), proteção por senha (criptografia); otimização/compactação
      de PDF (tela "Otimizar PDF": otimização estrutural sem perdas sempre
      disponivel via pypdf, compactação avancada com Ghostscript quando
      detectado, níveis leve/equilibrado/máximo/personalizado); conversoes
      (tela "Converter PDF"): imagens (JPG/PNG/TIFF/WEBP) -> PDF, PDF ->
      imagens (com seleção de páginas, DPI, qualidade e ZIP), PDF -> texto,
      e documentos de escritorio -> PDF quando o LibreOffice ('soffice') e
      detectado no PATH; e — a partir desta versao — edicao por sobreposicao
      (tela "Editar PDF"): marca d'agua, numeracao de páginas e numeracao
      Bates, cabecalho e rodape, texto livre, imagem, formas (retangulo/
      linha) e anotacoes de link, cada uma aplicavel ao documento inteiro,
      a um intervalo, so páginas pares/impares ou a uma única página, com
      pre-visualizacao real (executa a mesma ferramenta de producao sobre
      uma copia de uma página) antes de salvar como um novo PDF. Isso NÃO e
      uma edicao estrutural do texto original do documento — o conteudo
      original permanece inalterado por baixo da sobreposicao. E — a partir
      desta versao — OCR local (tela "OCR"): reconhecimento de texto 100%
      local via OCRmyPDF (preferido, quando detectado — preserva marcadores/
      formularios) ou, na ausencia dele, diretamente via Tesseract página a
      página (não preserva marcadores/formularios, o que fica documentado
      no resultado); idioma escolhido a partir da lista real de idiomas
      instalados no Tesseract do usuário, opção de forcar reprocessamento de
      páginas que ja tem texto, e aplicavel ao documento inteiro, a um
      intervalo, so pares/impares ou a uma única página. Nenhum documento e
      enviado para qualquer serviço de OCR externo/na nuvem em nenhuma
      circunstancia. "PDF pesquisavel" (a combinacao de OCR + conversão,
      cartao ainda desabilitado na tela "Converter PDF") permanece NÃO
      implementado como fluxo dedicado nesta entrega, mas pode ser obtido
      manualmente rodando OCR e depois usando as ferramentas de conversão.
      A partir desta versao, tambem inclui a tela "Ferramentas avancadas"
      (Fase 5): comparacao de PDFs baseada em texto extraido (com relatorio
      de páginas divergentes); remocao automática de páginas em branco por
      deteccao de renderizacao (não apenas ausencia de texto); correcao de
      orientação via Tesseract OSD (Orientation and Script Detection);
      extração de imagens incorporadas e anexos; gerenciamento de
      marcadores (listar, adicionar, remover todos); inspeção técnica
      somente leitura (versao do PDF, tamanhos de página, criptografia,
      formularios, JavaScript, fontes, imagens, anexos, marcadores,
      metadados); verificação e reparo estrutural via qpdf; e redação real
      — que remove de verdade, do fluxo de conteudo da página, o texto e as
      imagens que intersectam a área selecionada (rastreando a matriz de
      transformacao e a matriz de texto do PDF), removendo tambem
      anotacoes sobrepostas, antes de desenhar uma cobertura visual opaca
      por cima. Isso e fundamentalmente diferente do carimbo de forma da
      Fase 3, que apenas desenha uma caixa por cima sem remover o conteudo
      original — os dois nunca devem ser confundidos. A partir desta
      versao, tambem inclui a tela "Assinaturas" (Fase 6), com duas
      capacidades deliberadamente separadas e nunca confundidas: (1)
      assinatura VISUAL (carimbo) — desenha nome do assinante, data e
      motivo opcional (mais uma imagem de assinatura opcional) por cima da
      página, exatamente como qualquer outra sobreposicao da tela "Editar
      PDF"; NÃO possui qualquer validade juridica ou criptográfica, o que
      fica declarado explicitamente no resultado; e (2) assinatura DIGITAL
      criptográfica real via pyHanko, quando detectado — carrega um
      certificado/chave de um arquivo PFX/P12 protegido por senha, assina
      de forma invisivel ou com um carimbo visivel vinculado ao campo de
      assinatura, e permite verificar depois se a assinatura esta intacta
      (documento não alterado desde a assinatura), se a cadeia de
      certificacao e confiavel, e os dados do assinante e do momento da
      assinatura. Certificados autoassinados (como o gerado no autoteste)
      corretamente aparecem como "não confiavel" na verificação — isso e o
      comportamento esperado de uma cadeia sem uma autoridade certificadora
      raiz reconhecida, não um defeito. Sem pyHanko instalado, apenas a
      assinatura visual fica disponivel; o cartao de assinatura digital
      informa a instalação necessaria em vez de simular a funcionalidade.
    - Nível 3 (conversão Office reversa, PDF/A): NÃO implementado nesta
      entrega. Os cartoes correspondentes aparecem desabilitados na tela
      inicial, com explicacao, nunca como botoes funcionais falsos.

Requisitos:
    Python 3.12 ou 3.13 de 64 bits (recomendado no Windows). Este arquivo
    evita recursos exclusivos de versoes muito novas da linguagem, mas NÃO
    foi executado em Python 3.14 por este autor: não alegar compatibilidade
    confirmada com 3.14 sem testar de verdade.

Instalar as dependencias obrigatorias:
    python -m pip install PySide6 pypdf pypdfium2 Pillow pydantic platformdirs psutil

Executar a interface grafica:
    python PDF_Laboratory.py

Autoteste (NÃO abre a interface; cria PDFs sinteticos em uma pasta
temporaria, exercita parser/divisão/uniao/reordenacao/rotacao/exclusao/
duplicacao/insercao de página em branco/ZIP/criptografia, reabre e valida
cada resultado, limpa tudo, e imprime um relatorio):
    python PDF_Laboratory.py --self-test

Diagnóstico técnico (NÃO abre a interface; imprime versao, Python, sistema
operacional, memória, disco e o estado de cada dependencia obrigatoria e
opcional):
    python PDF_Laboratory.py --diagnostico

Limitacoes conhecidas e decisoes deliberadas nesta versao:
    - As 7 dependencias obrigatorias listadas acima são verificadas em
      TODOS os modos (GUI, --self-test e --diagnostico), mesmo que um modo
      especifico não chegue a usar todas elas (ex.: --diagnostico nunca usa
      pypdfium2 para renderizar nada) — decisao deliberada para manter a
      checagem simples, única e sempre previsivel, em vez de um conjunto de
      dependencias diferente por modo.
    - "Perguntar" (comportamento ao encontrar nome ja existente) so e
      avaliado no momento em que a tarefa e criada, antes dela comecar a
      rodar em segundo plano; para operacoes que geram varios arquivos de
      saída de uma vez (ex.: dividir), a escolha feita se aplica a todos os
      arquivos daquela tarefa, sem perguntar arquivo por arquivo em plena
      execucao.
    - Nenhuma tentativa de forca bruta ou quebra de senha e implementada em
      lugar nenhum deste arquivo.
    - Este arquivo cria, durante o uso, configuracao/log/temporarios em
      pastas apropriadas do sistema operacional (via platformdirs) e PDFs/
      ZIPs de saída onde o usuário escolher — nunca ao lado do próprio
      código por obrigacao.
"""
from __future__ import annotations

# =============================================================================
# 2) IMPORTS PADRÃO (biblioteca padrão apenas; nenhuma dependencia de
#    terceiros e importada antes da checagem de dependencias, mais abaixo).
# =============================================================================
import argparse
import datetime as _dt
import difflib
import itertools
import json
import logging
import logging.handlers
import math
import os
import platform
import re
import secrets
import shutil
import subprocess
import sys
import time
from contextlib import contextmanager
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Iterator, Optional

# =============================================================================
# 3) VERIFICAÇÃO DE DEPENDENCIAS OBRIGATORIAS
#
# Roda ANTES de qualquer "import" de biblioteca de terceiros (PySide6,
# pypdf, pypdfium2, Pillow, pydantic, platformdirs, psutil), usando apenas
# ``__import__`` dentro de um try/except — nunca importa de fato os nomes
# necessarios ao restante do arquivo aqui. Isso garante que, se uma
# dependencia estiver ausente, o usuário ve uma mensagem clara em vez de um
# ModuleNotFoundError bruto interrompendo a instrução de import de topo de
# arquivo mais abaixo. Não instala nada sozinho (sem auto-instalação
# silenciosa) e encerra com código de saída diferente de zero.
# =============================================================================
_REQUIRED_DEPENDENCIES: list[tuple[str, str]] = [
    ("PySide6", "interface grafica (Qt for Python)"),
    ("shiboken6", "ligacoes nativas do PySide6"),
    ("pypdf", "leitura, escrita e manipulacao estrutural de PDF"),
    ("pypdfium2", "renderizacao de miniaturas e páginas"),
    ("PIL", "manipulacao de imagens (biblioteca Pillow)"),
    ("pydantic", "modelos de dados e validacao"),
    ("platformdirs", "localização de pastas de configuracao/cache/log do SO"),
    ("psutil", "diagnóstico de memória e disco"),
]

_INSTALL_COMMAND = (
    "python -m pip install PySide6 pypdf pypdfium2 Pillow pydantic "
    "platformdirs psutil"
)


def _find_missing_dependencies() -> list[str]:
    missing: list[str] = []
    for module_name, _description in _REQUIRED_DEPENDENCIES:
        try:
            __import__(module_name)
        except Exception:
            missing.append(module_name)
    return missing


def _report_missing_dependencies_and_exit(missing: list[str]) -> None:
    lines = [
        "=" * 74,
        "[PDF Laboratory] ERRO: dependencias obrigatorias ausentes.",
        "",
        "Faltam os seguintes pacotes:",
    ]
    by_name = dict(_REQUIRED_DEPENDENCIES)
    for name in missing:
        lines.append(f"  - {name}  ({by_name.get(name, 'dependencia obrigatoria')})")
    lines.extend(
        [
            "",
            "Instale com:",
            f"    {_INSTALL_COMMAND}",
            "",
            "Depois, rode novamente:",
            "    python PDF_Laboratory.py",
            "=" * 74,
        ]
    )
    message = "\n".join(lines)
    print(message, file=sys.stderr)

    # So tenta mostrar uma janela de erro se o próprio PySide6 estiver
    # presente (caso contrario não ha como construir uma QApplication).
    # Importado localmente aqui de proposito: esta e a ÚNICA referência a
    # PySide6 antes da checagem de dependencias terminar, entao não pode
    # estar no bloco de imports de terceiros mais abaixo neste arquivo.
    if "PySide6" not in missing:
        try:
            from PySide6.QtWidgets import QApplication, QMessageBox

            _tmp_app = QApplication.instance() or QApplication(sys.argv)
            QMessageBox.critical(
                None,
                "Dependencias ausentes",
                "PDF Laboratory Desktop não pode iniciar: faltam bibliotecas "
                f"obrigatorias ({', '.join(missing)}).\n\nInstale com:\n{_INSTALL_COMMAND}",
            )
        except Exception:
            pass  # ambiente sem display grafico; a mensagem no terminal ja foi impressa

    sys.exit(1)


_missing_dependencies = _find_missing_dependencies()
if _missing_dependencies:
    _report_missing_dependencies_and_exit(_missing_dependencies)

# A partir daqui e seguro importar as bibliotecas de terceiros de verdade: a
# checagem acima ja confirmou que todas estão presentes, ou o processo ja
# terminou com uma mensagem clara e código de saída != 0 antes de chegar
# aqui.
import psutil
import pypdfium2 as pdfium
from PIL import Image as PILImage
from PySide6.QtCore import QEvent, QObject, QRunnable, QSize, Qt, QThreadPool, Signal, Slot
from PySide6.QtGui import (
    QColor,
    QCursor,
    QDragEnterEvent,
    QDropEvent,
    QFont,
    QIcon,
    QImage,
    QKeySequence,
    QPainter,
    QPainterPath,
    QPalette,
    QPen,
    QPixmap,
)
from PySide6.QtWidgets import (
    QApplication,
    QCheckBox,
    QComboBox,
    QDialog,
    QDialogButtonBox,
    QDoubleSpinBox,
    QFileDialog,
    QFormLayout,
    QFrame,
    QGraphicsDropShadowEffect,
    QGridLayout,
    QGroupBox,
    QHBoxLayout,
    QInputDialog,
    QLabel,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QMainWindow,
    QMenu,
    QMessageBox,
    QPlainTextEdit,
    QProgressBar,
    QPushButton,
    QScrollArea,
    QSizePolicy,
    QSlider,
    QSpinBox,
    QStackedWidget,
    QStyle,
    QTabWidget,
    QTextEdit,
    QToolButton,
    QVBoxLayout,
    QWidget,
)
from platformdirs import user_cache_dir, user_config_dir, user_documents_dir, user_log_dir
from pydantic import BaseModel, Field, field_validator
from pypdf import PageObject, PdfReader, PdfWriter, Transformation
from pypdf.annotations import Link as PdfLinkAnnotation
from pypdf.errors import PdfReadError
from pypdf.generic import ArrayObject, ContentStream, DecodedStreamObject, DictionaryObject, FloatObject, NameObject, NumberObject

# =============================================================================
# 4) CONSTANTES E VERSAO
# =============================================================================
APP_VERSION = "1.7.0"
APP_DISPLAY_NAME = "PDF Laboratory Desktop"
APP_CONFIG_NAME = "PDFLaboratoryDesktop"  # sem espacos, para platformdirs
APP_CONFIG_AUTHOR = "PDFLaboratory"


# =============================================================================
# 5) EXCECOES
# =============================================================================
class OperationCancelled(Exception):
    """Levantada quando o usuário cancela uma tarefa em andamento.

    Serviços capturam esta exceção no nível do worker para garantir que
    nenhum arquivo parcial permaneca na pasta de saída final (a escrita
    ocorre sempre em um diretorio temporario, movido para o destino apenas
    ao final, com sucesso).
    """


class PdfOpenError(RuntimeError):
    """O arquivo não pode ser aberto ou não e um PDF válido/reparavel."""


class PdfPasswordRequired(RuntimeError):
    """O documento esta protegido e nenhuma senha valida foi fornecida."""


class PageRangeError(ValueError):
    """Erro de validacao de uma expressao de páginas."""


class ExternalToolError(RuntimeError):
    """Uma ferramenta externa (Ghostscript, qpdf, Tesseract, ...) retornou
    um erro ou não pode ser executada."""


# =============================================================================
# 6) ENUMS
# =============================================================================
class JobStatus(str, Enum):
    QUEUED = "na_fila"
    RUNNING = "em_execucao"
    DONE = "concluido"
    FAILED = "falhou"
    CANCELLED = "cancelado"


class Theme(str, Enum):
    LIGHT = "claro"
    DARK = "escuro"
    SYSTEM = "sistema"


class OverwriteBehavior(str, Enum):
    ASK = "perguntar"
    RENAME = "renomear"
    OVERWRITE = "sobrescrever"


class CompressionLevel(str, Enum):
    LIGHT = "leve"
    BALANCED = "equilibrado"
    MAXIMUM = "maximo"
    CUSTOM = "personalizado"


class SplitMode(str, Enum):
    EACH_PAGE = "cada_pagina"
    CUSTOM_RANGES = "paginas_especificas_ou_intervalos"
    EVERY_N_PAGES = "a_cada_n_paginas"
    INTO_N_FILES = "em_n_arquivos"
    EQUAL_PARTS = "partes_iguais"
    ODD_PAGES = "paginas_impares"
    EVEN_PAGES = "paginas_pares"
    CURRENT_SELECTION = "selecao_atual"
    BY_BOOKMARKS = "por_marcadores"
    BY_TOC_CHAPTERS = "por_capitulos_do_sumario"
    BY_BLANK_PAGES = "por_paginas_em_branco"
    BY_ORIENTATION_CHANGE = "por_mudanca_orientacao"
    BY_TEXT_MATCH = "por_texto"
    BY_REGEX = "por_expressao_regular"
    BY_MAX_SIZE = "por_tamanho_maximo"


class ImageFormat(str, Enum):
    JPEG = "jpeg"
    PNG = "png"
    TIFF = "tiff"
    WEBP = "webp"


class PageTargetMode(str, Enum):
    """Onde uma edicao (marca d'agua, numeracao, cabecalho/rodape, texto,
    imagem, forma) e aplicada — mesma escolha em todas as ferramentas da
    Fase 3, conforme exigido: página, intervalo, pares, impares ou
    documento inteiro."""

    ALL_PAGES = "documento_completo"
    RANGE = "intervalo"
    ODD_PAGES = "paginas_impares"
    EVEN_PAGES = "paginas_pares"
    CURRENT_PAGE = "pagina_atual"


class HorizontalAlign(str, Enum):
    LEFT = "esquerda"
    CENTER = "centro"
    RIGHT = "direita"


class NumberingMode(str, Enum):
    NUMERIC = "numerico"
    BATES = "bates"


class ShapeKind(str, Enum):
    RECTANGLE = "retangulo"
    LINE = "linha"


# =============================================================================
# 7) MODELOS (pydantic)
# =============================================================================
class PageInfo(BaseModel):
    index: int  # 0-based
    width_pt: float
    height_pt: float
    rotation: int
    is_blank: bool = False
    has_text: bool = False


class OutputNaming(BaseModel):
    prefix: str = ""
    suffix: str = ""
    use_range_label: bool = True
    zero_pad_width: int = 3
    create_subfolder: bool = True
    subfolder_name: Optional[str] = None

    def build_name(self, base_stem: str, label: str) -> str:
        parts = [p for p in (self.prefix, base_stem, label if self.use_range_label else None, self.suffix) if p]
        return "_".join(parts) + ".pdf"


class ValidationIssue(BaseModel):
    severity: str = Field(pattern="^(info|aviso|erro)$")
    message: str
    page_index: Optional[int] = None


class PreservationReport(BaseModel):
    preserved: list[str] = Field(default_factory=list)
    not_preserved: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class SplitRequest(BaseModel):
    source_path: Path
    mode: SplitMode
    output_dir: Path
    ranges_expression: Optional[str] = None
    every_n: Optional[int] = Field(default=None, ge=1)
    into_n_files: Optional[int] = Field(default=None, ge=1)
    max_size_mb: Optional[float] = Field(default=None, gt=0)
    text_needle: Optional[str] = None
    regex_pattern: Optional[str] = None
    allow_duplicate_pages: bool = True
    naming: OutputNaming = Field(default_factory=OutputNaming)
    create_zip: bool = False
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None  # usado apenas em memória; nunca persistido

    def model_post_init(self, __context) -> None:
        if self.mode is SplitMode.CUSTOM_RANGES and not self.ranges_expression:
            raise ValueError("Este modo requer 'ranges_expression' (ex.: 1,3,5-9,12).")
        if self.mode is SplitMode.CURRENT_SELECTION and not self.ranges_expression:
            raise ValueError("Seleção atual requer os indices selecionados no visualizador.")
        if self.mode is SplitMode.EVERY_N_PAGES and not self.every_n:
            raise ValueError("Modo 'a cada N páginas' requer 'every_n'.")
        if self.mode in (SplitMode.INTO_N_FILES, SplitMode.EQUAL_PARTS) and not self.into_n_files:
            raise ValueError("Este modo requer 'into_n_files' (numero de arquivos/partes).")
        if self.mode is SplitMode.BY_MAX_SIZE and not self.max_size_mb:
            raise ValueError("Modo 'por tamanho máximo' requer 'max_size_mb'.")
        if self.mode is SplitMode.BY_TEXT_MATCH and not self.text_needle:
            raise ValueError("Modo 'por texto' requer o texto a procurar.")
        if self.mode is SplitMode.BY_REGEX and not self.regex_pattern:
            raise ValueError("Modo 'por expressao regular' requer o padrão.")


class SplitResult(BaseModel):
    output_files: list[Path] = Field(default_factory=list)
    zip_path: Optional[Path] = None
    total_source_pages: int = 0
    issues: list[ValidationIssue] = Field(default_factory=list)
    preservation: PreservationReport = Field(default_factory=PreservationReport)
    duration_seconds: float = 0.0


class OrganizeResult(BaseModel):
    output_path: Path
    total_pages: int
    issues: list[ValidationIssue] = Field(default_factory=list)
    preservation: PreservationReport = Field(default_factory=PreservationReport)
    duration_seconds: float = 0.0


class MergeRequest(BaseModel):
    source_paths: list[Path]
    page_ranges: Optional[list[Optional[str]]] = None
    output_path: Path
    add_bookmark_per_source: bool = True
    preserve_existing_bookmarks: bool = True
    interleave: bool = False
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME


class ReorderRequest(BaseModel):
    source_path: Path
    new_order: list[int]
    output_path: Path


class RotateRequest(BaseModel):
    source_path: Path
    page_indices: Optional[list[int]] = None
    degrees: int = 90
    output_path: Path

    @field_validator("degrees")
    @classmethod
    def _multiple_of_90(cls, v: int) -> int:
        if v % 90 != 0:
            raise ValueError("A rotacao deve ser um multiplo de 90 graus.")
        return v


class DeleteRequest(BaseModel):
    source_path: Path
    page_indices: list[int]
    output_path: Path


class DuplicateRequest(BaseModel):
    source_path: Path
    page_indices: list[int]
    output_path: Path
    insert_after_original: bool = True


class InsertBlankRequest(BaseModel):
    source_path: Path
    insert_after_index: int  # -1 para inicio
    count: int = 1
    output_path: Path


class ReplacePagesRequest(BaseModel):
    source_path: Path
    target_indices: list[int]
    replacement_source_path: Path
    output_path: Path


class ExtractPagesRequest(BaseModel):
    source_path: Path
    ranges_expression: str
    output_path: Path
    allow_duplicate_pages: bool = True


class InvertOrderRequest(BaseModel):
    source_path: Path
    output_path: Path


class MetadataFields(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    subject: Optional[str] = None
    keywords: Optional[str] = None


class MetadataRequest(BaseModel):
    source_path: Path
    output_path: Path
    fields: Optional[MetadataFields] = None  # None = limpar tudo


class SanitizeRequest(BaseModel):
    source_path: Path
    output_path: Path
    remove_javascript: bool = True
    remove_attachments: bool = True
    remove_form_fields: bool = True


class EncryptRequest(BaseModel):
    source_path: Path
    output_path: Path
    user_password: str
    owner_password: Optional[str] = None


class CompressionRequest(BaseModel):
    source_path: Path
    output_path: Path
    level: CompressionLevel = CompressionLevel.BALANCED
    remove_metadata: bool = False
    custom_dpi: Optional[int] = Field(default=None, ge=36, le=1200)
    custom_quality: Optional[int] = Field(default=None, ge=1, le=100)
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None  # usado apenas em memória; nunca persistido
    force_structural_only: bool = False  # usado internamente pelo autoteste

    def model_post_init(self, __context) -> None:
        if self.level is CompressionLevel.CUSTOM and (self.custom_dpi is None or self.custom_quality is None):
            raise ValueError("Nível personalizado requer 'custom_dpi' e 'custom_quality'.")


class CompressionResult(BaseModel):
    output_path: Path
    original_size_bytes: int
    final_size_bytes: int
    reduction_percent: float
    used_ghostscript: bool
    duration_seconds: float = 0.0
    notes: list[str] = Field(default_factory=list)


class ImagesToPdfRequest(BaseModel):
    image_paths: list[Path]
    output_path: Path
    dpi: int = Field(default=150, ge=36, le=1200)
    quality: int = Field(default=90, ge=1, le=100)
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME

    @field_validator("image_paths")
    @classmethod
    def _non_empty(cls, v: list[Path]) -> list[Path]:
        if not v:
            raise ValueError("Informe ao menos uma imagem.")
        return v


class ImagesToPdfResult(BaseModel):
    output_path: Path
    page_count: int
    duration_seconds: float = 0.0


class PdfToImagesRequest(BaseModel):
    source_path: Path
    output_dir: Path
    image_format: ImageFormat = ImageFormat.PNG
    ranges_expression: Optional[str] = None  # None = todas as páginas
    dpi: int = Field(default=150, ge=36, le=1200)
    quality: int = Field(default=90, ge=1, le=100)  # aplicavel a JPEG/WEBP
    create_zip: bool = False
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None


class PdfToImagesResult(BaseModel):
    output_files: list[Path] = Field(default_factory=list)
    zip_path: Optional[Path] = None
    duration_seconds: float = 0.0


class PdfToTextRequest(BaseModel):
    source_path: Path
    output_path: Path
    ranges_expression: Optional[str] = None  # None = todas as páginas
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None


class PdfToTextResult(BaseModel):
    output_path: Path
    total_characters: int
    pages_processed: int
    duration_seconds: float = 0.0


class OfficeToPdfRequest(BaseModel):
    source_path: Path
    output_path: Path
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME


class OfficeToPdfResult(BaseModel):
    output_path: Path
    duration_seconds: float = 0.0
    notes: list[str] = Field(default_factory=list)


_HEX_COLOR_RE = re.compile(r"^[0-9A-Fa-f]{6}$")


def _check_hex_color(v: str) -> str:
    if not _HEX_COLOR_RE.match(v):
        raise ValueError(f"Cor inválida '{v}': use 6 digitos hexadecimais, ex.: 'FF0000'.")
    return v


class _PageTargetFields(BaseModel):
    """Campos compartilhados por todas as ferramentas de edicao da Fase 3:
    onde a edicao e aplicada (documento inteiro, intervalo, pares, impares
    ou apenas a página atualmente aberta no visualizador)."""

    target_mode: PageTargetMode = PageTargetMode.ALL_PAGES
    ranges_expression: Optional[str] = None
    current_page_index: Optional[int] = Field(default=None, ge=0)

    def model_post_init(self, __context) -> None:
        if self.target_mode is PageTargetMode.RANGE and not self.ranges_expression:
            raise ValueError("Modo 'intervalo' requer 'ranges_expression' (ex.: 1,3,5-9).")
        if self.target_mode is PageTargetMode.CURRENT_PAGE and self.current_page_index is None:
            raise ValueError("Modo 'página atual' requer 'current_page_index'.")


class WatermarkRequest(_PageTargetFields):
    source_path: Path
    output_path: Path
    text: str
    font_size: float = Field(default=48.0, gt=0, le=300)
    color_hex: str = "808080"
    opacity: float = Field(default=0.3, gt=0.0, le=1.0)
    rotation_degrees: float = Field(default=45.0, ge=-360, le=360)
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None

    @field_validator("text")
    @classmethod
    def _non_empty_text(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("O texto da marca d'agua não pode ser vazio.")
        return v

    @field_validator("color_hex")
    @classmethod
    def _valid_color(cls, v: str) -> str:
        return _check_hex_color(v)


class PageNumberRequest(_PageTargetFields):
    source_path: Path
    output_path: Path
    mode: NumberingMode = NumberingMode.NUMERIC
    format_template: str = "Página {page} de {total}"
    font_size: float = Field(default=10.0, gt=0, le=72)
    color_hex: str = "000000"
    align: HorizontalAlign = HorizontalAlign.CENTER
    margin_pt: float = Field(default=28.0, ge=0, le=200)
    bates_prefix: str = ""
    bates_start: int = Field(default=1, ge=0)
    bates_digits: int = Field(default=6, ge=1, le=12)
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None

    @field_validator("color_hex")
    @classmethod
    def _valid_color(cls, v: str) -> str:
        return _check_hex_color(v)


class PageNumberResult(BaseModel):
    output_path: Path
    pages_affected: int
    first_label: Optional[str] = None
    last_label: Optional[str] = None
    duration_seconds: float = 0.0


class HeaderFooterRequest(_PageTargetFields):
    source_path: Path
    output_path: Path
    header_text: Optional[str] = None
    footer_text: Optional[str] = None
    font_size: float = Field(default=10.0, gt=0, le=72)
    color_hex: str = "000000"
    align: HorizontalAlign = HorizontalAlign.CENTER
    margin_pt: float = Field(default=28.0, ge=0, le=200)
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None

    @field_validator("color_hex")
    @classmethod
    def _valid_color(cls, v: str) -> str:
        return _check_hex_color(v)

    def model_post_init(self, __context) -> None:
        super().model_post_init(__context)
        if not (self.header_text or "").strip() and not (self.footer_text or "").strip():
            raise ValueError("Informe ao menos um texto de cabecalho ou de rodape.")


class TextStampRequest(_PageTargetFields):
    source_path: Path
    output_path: Path
    text: str
    x_pt: float = Field(default=72.0, ge=0)
    y_pt: float = Field(default=72.0, ge=0)
    font_size: float = Field(default=14.0, gt=0, le=200)
    color_hex: str = "000000"
    rotation_degrees: float = Field(default=0.0, ge=-360, le=360)
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None

    @field_validator("text")
    @classmethod
    def _non_empty_text(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("O texto não pode ser vazio.")
        return v

    @field_validator("color_hex")
    @classmethod
    def _valid_color(cls, v: str) -> str:
        return _check_hex_color(v)


class ImageStampRequest(_PageTargetFields):
    source_path: Path
    output_path: Path
    image_path: Path
    x_pt: float = Field(default=72.0, ge=0)
    y_pt: float = Field(default=72.0, ge=0)
    width_pt: float = Field(gt=0)
    height_pt: float = Field(gt=0)
    opacity: float = Field(default=1.0, gt=0.0, le=1.0)
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None


class ShapeStampRequest(_PageTargetFields):
    source_path: Path
    output_path: Path
    kind: ShapeKind
    x1_pt: float
    y1_pt: float
    x2_pt: float
    y2_pt: float
    stroke_color_hex: str = "000000"
    fill_color_hex: Optional[str] = None  # None = sem preenchimento; aplicavel so a retangulo
    line_width_pt: float = Field(default=2.0, gt=0, le=50)
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None

    @field_validator("stroke_color_hex")
    @classmethod
    def _valid_stroke_color(cls, v: str) -> str:
        return _check_hex_color(v)

    @field_validator("fill_color_hex")
    @classmethod
    def _valid_fill_color(cls, v: Optional[str]) -> Optional[str]:
        return _check_hex_color(v) if v is not None else None


class LinkAnnotationRequest(_PageTargetFields):
    source_path: Path
    output_path: Path
    x1_pt: float
    y1_pt: float
    x2_pt: float
    y2_pt: float
    url: Optional[str] = None
    target_page_number: Optional[int] = Field(default=None, ge=1)  # 1-based; link interno
    show_border: bool = False
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None

    def model_post_init(self, __context) -> None:
        super().model_post_init(__context)
        if not self.url and self.target_page_number is None:
            raise ValueError("Informe uma URL externa ou uma página de destino interna para o link.")
        if self.url and self.target_page_number is not None:
            raise ValueError("Escolha apenas um destino: URL externa OU página interna, não ambos.")


class EditResult(BaseModel):
    output_path: Path
    pages_affected: int
    duration_seconds: float = 0.0
    notes: list[str] = Field(default_factory=list)


class OcrRequest(_PageTargetFields):
    """OCR local (Fase 4): nunca envia o documento para nenhum serviço
    externo — todo o reconhecimento roda via Tesseract e/ou OCRmyPDF
    instalados na máquina do usuário, detectados via ``shutil.which``."""

    source_path: Path
    output_path: Path
    language: str = "eng"
    force_ocr: bool = False  # True: reprocessa mesmo páginas que ja tem texto (rasteriza+OCR); False: pula páginas que ja tem texto quando possível
    dpi: int = Field(default=300, ge=72, le=1200)
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None

    @field_validator("language")
    @classmethod
    def _non_empty_language(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Informe ao menos um código de idioma do Tesseract (ex.: 'eng', 'por', 'eng+por').")
        return v.strip()


class OcrResult(BaseModel):
    output_path: Path
    pages_ocred: int
    engine_used: str  # "ocrmypdf" ou "tesseract_fallback"
    duration_seconds: float = 0.0
    notes: list[str] = Field(default_factory=list)


# --- Fase 5 (Ferramentas avancadas) --------------------------------------
class CompareRequest(BaseModel):
    source_path_a: Path
    source_path_b: Path
    output_path: Path
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password_a: Optional[str] = None
    password_b: Optional[str] = None


class CompareResult(BaseModel):
    output_path: Path
    total_pages_a: int
    total_pages_b: int
    pages_compared: int
    differing_pages: list[int] = Field(default_factory=list)
    overall_similarity_percent: float = 0.0
    duration_seconds: float = 0.0
    notes: list[str] = Field(default_factory=list)


class BlankPageRemovalRequest(BaseModel):
    source_path: Path
    output_path: Path
    # 99.9 (não 99.5): testes reais mostraram que ate uma única linha de
    # texto normal ja deixa uma página em ~99.6% de brancura nesta metrica
    # de pixels quase-brancos — um limiar mais baixo classificaria páginas
    # com conteudo esparso, porem real, como "em branco".
    whiteness_threshold_percent: float = Field(default=99.9, ge=50.0, le=100.0)
    render_dpi: int = Field(default=72, ge=36, le=300)
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None


class BlankPageRemovalResult(BaseModel):
    output_path: Path
    total_pages_before: int
    removed_page_numbers: list[int] = Field(default_factory=list)  # 1-based
    total_pages_after: int
    duration_seconds: float = 0.0


class OrientationFixRequest(BaseModel):
    source_path: Path
    output_path: Path
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None


class OrientationFixResult(BaseModel):
    output_path: Path
    pages_analyzed: int
    pages_rotated: int
    rotations_applied: dict[int, int] = Field(default_factory=dict)  # página 1-based -> graus
    duration_seconds: float = 0.0
    notes: list[str] = Field(default_factory=list)


class ExtractAssetsRequest(BaseModel):
    source_path: Path
    output_dir: Path
    extract_images: bool = True
    extract_attachments: bool = True
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None

    def model_post_init(self, __context) -> None:
        if not self.extract_images and not self.extract_attachments:
            raise ValueError("Selecione ao menos um tipo de item para extrair (imagens e/ou anexos).")


class ExtractAssetsResult(BaseModel):
    output_dir: Path
    image_files: list[Path] = Field(default_factory=list)
    attachment_files: list[Path] = Field(default_factory=list)
    duration_seconds: float = 0.0


class BookmarkEntry(BaseModel):
    title: str
    page_number: int  # 1-based; 0 se o destino não pode ser resolvido
    level: int = 0


class ListBookmarksRequest(BaseModel):
    source_path: Path
    password: Optional[str] = None


class ListBookmarksResult(BaseModel):
    entries: list[BookmarkEntry] = Field(default_factory=list)


class AddBookmarkRequest(BaseModel):
    source_path: Path
    output_path: Path
    title: str
    page_number: int = Field(ge=1)  # 1-based
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None

    @field_validator("title")
    @classmethod
    def _non_empty_title(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("O titulo do marcador não pode ser vazio.")
        return v


class ClearBookmarksRequest(BaseModel):
    source_path: Path
    output_path: Path
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None


class InspectionRequest(BaseModel):
    source_path: Path
    password: Optional[str] = None


class InspectionResult(BaseModel):
    file_size_bytes: int
    pdf_version: str
    page_count: int
    page_sizes_pt: list[str] = Field(default_factory=list)
    is_encrypted: bool
    has_forms: bool
    has_javascript: bool
    embedded_image_count: int
    attachment_count: int
    font_names: list[str] = Field(default_factory=list)
    outline_entry_count: int
    metadata: dict[str, str] = Field(default_factory=dict)
    report_text: str = ""


class RepairCheckRequest(BaseModel):
    source_path: Path
    password: Optional[str] = None


class RepairCheckResult(BaseModel):
    is_valid: bool
    report_text: str


class RepairRequest(BaseModel):
    source_path: Path
    output_path: Path
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None


class RepairResult(BaseModel):
    output_path: Path
    report_text: str
    duration_seconds: float = 0.0


class RedactionRequest(_PageTargetFields):
    """Redação real (Fase 5): remove de verdade o texto e as imagens que
    intersectam o retangulo informado do fluxo de conteudo da página, ao
    contrario do carimbo de forma da Fase 3 (que apenas desenha por cima).
    Nunca chamar o carimbo de forma da Fase 3 de 'redação'."""

    source_path: Path
    output_path: Path
    x1_pt: float
    y1_pt: float
    x2_pt: float
    y2_pt: float
    fill_color_hex: str = "000000"
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None

    @field_validator("fill_color_hex")
    @classmethod
    def _valid_color(cls, v: str) -> str:
        return _check_hex_color(v)


class RedactionResult(BaseModel):
    output_path: Path
    pages_affected: int
    text_runs_removed: int
    images_removed: int
    duration_seconds: float = 0.0
    notes: list[str] = Field(default_factory=list)


# --- Fase 6 (Assinaturas): visual (carimbo, sem validade criptográfica) ---
class VisualSignatureRequest(_PageTargetFields):
    """Assinatura VISUAL: apenas uma marca grafica (nome, data, motivo e,
    opcionalmente, uma imagem de assinatura manuscrita) desenhada sobre a
    página. NÃO possui qualquer validade criptográfica e NÃO deve jamais
    ser confundida com a assinatura digital real (secao seguinte, via
    pyHanko) — nem em código, nem na interface, nem em texto voltado ao
    usuário."""

    source_path: Path
    output_path: Path
    signer_name: str
    reason: Optional[str] = None
    image_path: Optional[Path] = None
    x_pt: float = Field(default=72.0, ge=0)
    y_pt: float = Field(default=72.0, ge=0)
    width_pt: float = Field(default=220.0, gt=0)
    height_pt: float = Field(default=90.0, gt=0)
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    password: Optional[str] = None

    @field_validator("signer_name")
    @classmethod
    def _non_empty_signer_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Informe o nome de quem esta assinando.")
        return v


# --- Fase 6 (Assinaturas): digital criptográfica real, via pyHanko -------
class DigitalSignatureRequest(BaseModel):
    """Assinatura digital criptográfica REAL, via pyHanko + certificado
    PKCS#12 (.pfx/.p12). Requer o pacote opcional 'pyhanko' instalado;
    nunca finge assinar quando ele não esta disponivel."""

    source_path: Path
    output_path: Path
    pfx_path: Path
    pfx_password: str
    field_name: str = "Assinatura1"
    reason: Optional[str] = None
    location: Optional[str] = None
    contact_info: Optional[str] = None
    visible: bool = True
    page_number: int = Field(default=1, ge=1)  # 1-based; usado somente se visible=True
    x1_pt: float = 50.0
    y1_pt: float = 50.0
    x2_pt: float = 300.0
    y2_pt: float = 130.0
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME

    @field_validator("field_name")
    @classmethod
    def _non_empty_field_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("O nome do campo de assinatura não pode ser vazio.")
        return v


class DigitalSignatureResult(BaseModel):
    output_path: Path
    signer_common_name: Optional[str] = None
    signing_time_utc: Optional[str] = None
    visible: bool
    duration_seconds: float = 0.0
    notes: list[str] = Field(default_factory=list)


class VerifySignaturesRequest(BaseModel):
    source_path: Path


class SignatureInfo(BaseModel):
    field_name: str
    signer_common_name: Optional[str] = None
    signing_time_utc: Optional[str] = None
    intact: bool  # o conteudo assinado não foi alterado
    document_modified_after_signing: bool  # houve alteracao incremental após esta assinatura
    trusted: bool  # a cadeia de certificacao e confiavel neste computador
    overall_ok: bool  # veredito final do pyHanko (bottom_line)


class VerifySignaturesResult(BaseModel):
    source_path: Path
    total_signatures: int
    signatures: list[SignatureInfo] = Field(default_factory=list)


# =============================================================================
# 8) CONFIGURAÇÕES (persistidas via platformdirs; nunca senhas/certificados)
# =============================================================================
_CONFIG_DIR = Path(user_config_dir(APP_CONFIG_NAME, APP_CONFIG_AUTHOR))
_CONFIG_FILE = _CONFIG_DIR / "settings.json"
_FORBIDDEN_SETTINGS_KEYS = {"password", "senha", "certificate", "certificado", "pfx", "p12"}


class AppSettings(BaseModel):
    theme: Theme = Theme.SYSTEM
    output_directory: str = Field(default_factory=lambda: str(Path(user_documents_dir()) / "PDF Laboratory"))
    overwrite_behavior: OverwriteBehavior = OverwriteBehavior.RENAME
    max_concurrent_tasks: int = 2
    open_output_folder_after_task: bool = True
    telemetry_enabled: bool = False  # sempre False; nunca exposto na interface

    @field_validator("max_concurrent_tasks")
    @classmethod
    def _tasks_range(cls, v: int) -> int:
        if not (1 <= v <= 16):
            raise ValueError("Numero de tarefas simultaneas deve estar entre 1 e 16")
        return v

    def model_post_init(self, __context) -> None:
        object.__setattr__(self, "telemetry_enabled", False)


def config_file_path() -> Path:
    return _CONFIG_FILE


def get_settings() -> AppSettings:
    if not _CONFIG_FILE.exists():
        return AppSettings()
    try:
        raw = json.loads(_CONFIG_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return AppSettings()
    for key in list(raw.keys()):
        if key.lower() in _FORBIDDEN_SETTINGS_KEYS:
            raw.pop(key)
    try:
        return AppSettings(**raw)
    except Exception:  # noqa: BLE001 - configuracao corrompida não derruba o app
        return AppSettings()


def save_settings(settings: AppSettings) -> None:
    data = settings.model_dump(mode="json")
    for key in list(data.keys()):
        if key.lower() in _FORBIDDEN_SETTINGS_KEYS:
            raise ValueError(f"Recusando persistir campo proibido: {key}")
    _CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    tmp_file = _CONFIG_FILE.with_suffix(".tmp")
    tmp_file.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp_file.replace(_CONFIG_FILE)


# =============================================================================
# 9) LOGS (rotativos; nunca conteudo de documento, senha, certificado ou OCR)
# =============================================================================
_LOG_DIR = Path(user_log_dir(APP_CONFIG_NAME, APP_CONFIG_AUTHOR))
_LOG_FILE = _LOG_DIR / "app.log"
_SENSITIVE_LOG_SUBSTRINGS = ("password=", "senha=", "pfx", "p12", "-----BEGIN")


class _RedactingLogFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage().lower()
        if any(s in msg for s in _SENSITIVE_LOG_SUBSTRINGS):
            record.msg = "[mensagem de log suprimida: possível conteudo sensivel]"
            record.args = ()
        return True


def log_dir() -> Path:
    return _LOG_DIR


def log_file() -> Path:
    return _LOG_FILE


def setup_logging(level: int = logging.INFO) -> None:
    _LOG_DIR.mkdir(parents=True, exist_ok=True)
    root = logging.getLogger()
    if root.handlers:
        return
    root.setLevel(level)
    formatter = logging.Formatter("%(asctime)s | %(levelname)-8s | %(name)s | %(message)s")

    file_handler = logging.handlers.RotatingFileHandler(_LOG_FILE, maxBytes=2_000_000, backupCount=5, encoding="utf-8")
    file_handler.setFormatter(formatter)
    file_handler.addFilter(_RedactingLogFilter())

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.addFilter(_RedactingLogFilter())

    root.addHandler(file_handler)
    root.addHandler(console_handler)


logger = logging.getLogger("pdf_laboratory")


# =============================================================================
# 10) ARQUIVOS TEMPORARIOS (isolados por tarefa, nunca a pasta original)
# =============================================================================
_TEMP_BASE = Path(user_cache_dir(APP_CONFIG_NAME, APP_CONFIG_AUTHOR)) / "tmp"


def base_temp_dir() -> Path:
    _TEMP_BASE.mkdir(parents=True, exist_ok=True)
    return _TEMP_BASE


@contextmanager
def task_temp_dir() -> Iterator[Path]:
    base = base_temp_dir()
    path = base / secrets.token_hex(16)
    path.mkdir(parents=True, exist_ok=False)
    try:
        yield path
    finally:
        shutil.rmtree(path, ignore_errors=True)


def clear_all_temp() -> int:
    base = base_temp_dir()
    removed = 0
    for child in base.iterdir():
        if child.is_dir():
            shutil.rmtree(child, ignore_errors=True)
            removed += 1
    return removed


# =============================================================================
# 11) UTILITARIOS (nomeacao segura, sem sobrescrita silenciosa)
# =============================================================================
def unique_path(path: Path) -> Path:
    if not path.exists():
        return path
    stem, suffix, parent = path.stem, path.suffix, path.parent
    counter = 2
    while True:
        candidate = parent / f"{stem} ({counter}){suffix}"
        if not candidate.exists():
            return candidate
        counter += 1


def resolve_output_path(path: Path, behavior: OverwriteBehavior) -> Path:
    """Aplica o comportamento escolhido (secao 21) ao caminho de destino
    final de UM arquivo. 'perguntar' so pode ser avaliado aqui, no momento em
    que a tarefa e preparada (thread principal) — nunca dentro do worker em
    segundo plano (regra dura da secao 19: nunca abrir dialogos no worker).
    Quem chama esta funcao com ``behavior == ASK`` deve fazer isso ANTES de
    enfileirar a tarefa."""
    if behavior is OverwriteBehavior.OVERWRITE:
        return path
    return unique_path(path)


def zero_pad(number: int, width: int) -> str:
    return str(number).zfill(max(width, len(str(number))))


def range_label(start_1based: int, end_1based: int, width: int) -> str:
    if start_1based == end_1based:
        return f"p{zero_pad(start_1based, width)}"
    return f"p{zero_pad(start_1based, width)}-{zero_pad(end_1based, width)}"


def zip_files(files: list[Path], zip_path: Path) -> Path:
    import zipfile

    zip_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            zf.write(f, arcname=f.name)
    return zip_path


# =============================================================================
# 12) VALIDACAO / ABERTURA DE PDF
# =============================================================================
class PdfDocument:
    """Wrapper fino sobre ``pypdf.PdfReader`` com validacao estrutural."""

    def __init__(self, path: Path, reader: PdfReader):
        self.path = path
        self._reader = reader

    @classmethod
    def open(cls, path: Path, password: Optional[str] = None) -> "PdfDocument":
        path = Path(path)
        if not path.exists():
            raise PdfOpenError(f"Arquivo não encontrado: {path.name}")
        if path.stat().st_size == 0:
            raise PdfOpenError(f"Arquivo vazio: {path.name}")
        try:
            reader = PdfReader(str(path))
        except PdfReadError as exc:
            raise PdfOpenError(f"Não foi possível ler '{path.name}': {exc}") from exc
        except Exception as exc:  # noqa: BLE001
            raise PdfOpenError(f"Falha inesperada ao abrir '{path.name}': {exc}") from exc

        if reader.is_encrypted:
            if password is None:
                raise PdfPasswordRequired(f"'{path.name}' esta protegido por senha.")
            result = reader.decrypt(password)
            if result == 0:
                raise PdfPasswordRequired(f"Senha inválida para '{path.name}'.")

        try:
            _ = len(reader.pages)
        except Exception as exc:  # noqa: BLE001
            raise PdfOpenError(f"'{path.name}' parece corrompido ou não e um PDF válido: {exc}") from exc

        return cls(path, reader)

    def __enter__(self) -> "PdfDocument":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()

    def close(self) -> None:
        stream = getattr(self._reader, "stream", None)
        if stream is not None and not getattr(stream, "closed", True):
            try:
                stream.close()
            except Exception:  # noqa: BLE001
                pass

    @property
    def reader(self) -> PdfReader:
        return self._reader

    @property
    def page_count(self) -> int:
        return len(self._reader.pages)

    def get_page_info(self, index: int) -> PageInfo:
        page = self._reader.pages[index]
        box = page.mediabox
        width, height = float(box.width), float(box.height)
        rotation = int(page.get("/Rotate", 0)) % 360

        try:
            has_text = bool((page.extract_text() or "").strip())
        except Exception:  # noqa: BLE001
            has_text = False

        has_images = False
        try:
            resources = page.get("/Resources", {})
            xobjects = resources.get("/XObject", {}) if resources else {}
            for _, xobj in xobjects.items():
                if xobj.get_object().get("/Subtype") == "/Image":
                    has_images = True
                    break
        except Exception:  # noqa: BLE001
            has_images = False

        return PageInfo(
            index=index, width_pt=width, height_pt=height, rotation=rotation,
            is_blank=not has_text and not has_images, has_text=has_text,
        )

    def all_page_info(self) -> list[PageInfo]:
        return [self.get_page_info(i) for i in range(self.page_count)]

    def orientation_of(self, index: int) -> str:
        info = self.get_page_info(index)
        w, h = info.width_pt, info.height_pt
        if info.rotation in (90, 270):
            w, h = h, w
        return "paisagem" if w > h else "retrato"


# =============================================================================
# 13) PARSER DE INTERVALOS DE PÁGINAS
# =============================================================================
_RANGE_TOKEN_RE = re.compile(r"^\s*(\d+)\s*(?:-\s*(\d+)\s*)?$")


@dataclass
class _ParsedToken:
    raw: str
    start: int
    end: int


def _split_range_tokens(expression: str) -> list[str]:
    tokens = [t.strip() for t in expression.split(",")]
    tokens = [t for t in tokens if t]
    if not tokens:
        raise PageRangeError("A expressao de páginas esta vazia.")
    return tokens


def _parse_range_token(token: str, total_pages: int) -> _ParsedToken:
    match = _RANGE_TOKEN_RE.match(token)
    if not match:
        raise PageRangeError(f"Trecho inválido '{token}'. Use numeros ou intervalos, ex.: '1,3,5-9,12'.")
    start = int(match.group(1))
    end = int(match.group(2)) if match.group(2) is not None else start
    if start == 0 or end == 0:
        raise PageRangeError(f"Trecho '{token}': a numeracao de páginas comeca em 1 (não aceita página 0).")
    if start > total_pages or end > total_pages:
        raise PageRangeError(f"Trecho '{token}' referência página alem do total do documento ({total_pages} páginas).")
    if match.group(2) is not None and end < start:
        raise PageRangeError(f"Trecho '{token}' e um intervalo invertido. Use '{end}-{start}' se essa for a intencao.")
    return _ParsedToken(raw=token, start=start, end=end)


def parse_range_groups(expression: str, total_pages: int) -> list[list[int]]:
    """Um grupo (lista de indices 0-based) por trecho separado por virgula."""
    groups: list[list[int]] = []
    for token in _split_range_tokens(expression):
        parsed = _parse_range_token(token, total_pages)
        groups.append(list(range(parsed.start - 1, parsed.end)))
    return groups


def parse_ranges(expression: str, total_pages: int, *, allow_duplicate_pages: bool = True) -> list[int]:
    """Uma única lista de indices 0-based, na ordem em que aparecem na expressao."""
    flat: list[int] = []
    seen: set[int] = set()
    for group in parse_range_groups(expression, total_pages):
        for idx in group:
            if idx in seen and not allow_duplicate_pages:
                raise PageRangeError(f"A página {idx + 1} aparece mais de uma vez e duplicatas não são permitidas aqui.")
            seen.add(idx)
            flat.append(idx)
    return flat


def validate_ranges_expression(expression: str, total_pages: int) -> list[str]:
    """Não lanca exceção: usada para validacao 'ao vivo' na interface."""
    try:
        parse_range_groups(expression, total_pages)
    except PageRangeError as exc:
        return [str(exc)]
    return []


# =============================================================================
# 14) SERVIÇOS DE DIVISÃO (15 modos)
# =============================================================================
_SAFE_FILENAME_RE = re.compile(r"[^\w\-. ]+", re.UNICODE)


def _sanitize_filename_piece(name: str, max_len: int = 60) -> str:
    cleaned = _SAFE_FILENAME_RE.sub("_", name).strip() or "sem_titulo"
    return cleaned[:max_len]


def _group_by_outline(doc: PdfDocument) -> list[tuple[str, list[int]]]:
    """Usada por BY_BOOKMARKS e BY_TOC_CHAPTERS: agrupa por marcadores/
    entradas de sumario de nível superior. Marcadores aninhados não geram
    pontos de corte adicionais nesta versao."""
    reader = doc.reader
    outline = reader.outline or []
    entries: list[tuple[str, int]] = []
    for item in outline:
        if isinstance(item, list):
            continue
        try:
            page_num = reader.get_destination_page_number(item)
        except Exception:  # noqa: BLE001
            continue
        if page_num is not None:
            entries.append((str(getattr(item, "title", "capitulo")), page_num))

    if not entries:
        return [("documento_completo", list(range(doc.page_count)))]

    entries.sort(key=lambda e: e[1])
    groups: list[tuple[str, list[int]]] = []
    for i, (title, start) in enumerate(entries):
        end = entries[i + 1][1] if i + 1 < len(entries) else doc.page_count
        if end > start:
            groups.append((title, list(range(start, end))))
    return groups


def _group_by_blank_pages(doc: PdfDocument) -> list[list[int]]:
    groups: list[list[int]] = []
    current: list[int] = []
    for info in doc.all_page_info():
        if info.is_blank:
            if current:
                groups.append(current)
                current = []
            continue
        current.append(info.index)
    if current:
        groups.append(current)
    return groups or [list(range(doc.page_count))]


def _group_by_orientation_change(doc: PdfDocument) -> list[list[int]]:
    groups: list[list[int]] = []
    current: list[int] = []
    last_orientation: Optional[str] = None
    for i in range(doc.page_count):
        orientation = doc.orientation_of(i)
        if last_orientation is not None and orientation != last_orientation:
            groups.append(current)
            current = []
        current.append(i)
        last_orientation = orientation
    if current:
        groups.append(current)
    return groups


def _extract_page_text_safe(doc: PdfDocument, index: int) -> str:
    try:
        return doc.reader.pages[index].extract_text() or ""
    except Exception:  # noqa: BLE001
        return ""


def _group_by_text_match(doc: PdfDocument, needle: str) -> list[list[int]]:
    """Comeca um novo grupo em toda página cujo texto extraido contenha
    ``needle`` (busca literal, sem diferenciar maiusculas/minusculas)."""
    needle_lower = needle.lower()
    groups: list[list[int]] = []
    current: list[int] = []
    for i in range(doc.page_count):
        text = _extract_page_text_safe(doc, i)
        if current and needle_lower in text.lower():
            groups.append(current)
            current = []
        current.append(i)
    if current:
        groups.append(current)
    return groups or [list(range(doc.page_count))]


def _group_by_regex(doc: PdfDocument, pattern: str) -> list[list[int]]:
    try:
        compiled = re.compile(pattern, re.IGNORECASE | re.MULTILINE)
    except re.error as exc:
        raise ValueError(f"Expressao regular inválida: {exc}") from exc
    groups: list[list[int]] = []
    current: list[int] = []
    for i in range(doc.page_count):
        text = _extract_page_text_safe(doc, i)
        if current and compiled.search(text):
            groups.append(current)
            current = []
        current.append(i)
    if current:
        groups.append(current)
    return groups or [list(range(doc.page_count))]


def _group_by_max_size(doc: PdfDocument, max_size_mb: float) -> list[list[int]]:
    """Estimativa aproximada e proporcional (não mede o peso real de cada
    página após a escrita): páginas com imagens pesadas serao subestimadas;
    páginas de texto puro, superestimadas."""
    total_bytes = doc.path.stat().st_size
    n = doc.page_count
    avg_per_page = total_bytes / n if n else 0
    max_bytes = max_size_mb * 1_000_000

    groups: list[list[int]] = []
    current: list[int] = []
    current_bytes = 0.0
    for i in range(n):
        if current and (current_bytes + avg_per_page) > max_bytes:
            groups.append(current)
            current = []
            current_bytes = 0.0
        current.append(i)
        current_bytes += avg_per_page
    if current:
        groups.append(current)
    return groups


def compute_split_groups(doc: PdfDocument, request: SplitRequest) -> list[tuple[str, list[int]]]:
    """Calcula (rotulo, indices_0based) para o modo pedido. Não escreve
    nenhum arquivo — tambem usado pela interface para pre-visualizar o
    resultado antes de processar."""
    n = doc.page_count
    mode = request.mode
    width = len(str(n)) if n else 1

    if mode is SplitMode.EACH_PAGE:
        return [(f"pg_{zero_pad(i + 1, 3)}", [i]) for i in range(n)]

    if mode is SplitMode.CUSTOM_RANGES:
        return [
            (range_label(g[0] + 1, g[-1] + 1, width), g)
            for g in parse_range_groups(request.ranges_expression or "", n)
            if g
        ]

    if mode is SplitMode.CURRENT_SELECTION:
        indices = parse_ranges(request.ranges_expression or "", n, allow_duplicate_pages=request.allow_duplicate_pages)
        return [("seleção", indices)]

    if mode is SplitMode.EVERY_N_PAGES:
        step = request.every_n or 1
        return [
            (range_label(start + 1, min(start + step, n), width), list(range(start, min(start + step, n))))
            for start in range(0, n, step)
        ]

    if mode in (SplitMode.INTO_N_FILES, SplitMode.EQUAL_PARTS):
        parts = max(1, min(request.into_n_files or 1, n)) if n else 0
        if parts == 0:
            return []
        base, extra = divmod(n, parts)
        groups: list[tuple[str, list[int]]] = []
        cursor = 0
        for k in range(parts):
            size = base + (1 if k < extra else 0)
            if size == 0:
                continue
            group = list(range(cursor, cursor + size))
            groups.append((range_label(group[0] + 1, group[-1] + 1, width), group))
            cursor += size
        return groups

    if mode is SplitMode.ODD_PAGES:
        return [("paginas_impares", [i for i in range(n) if (i + 1) % 2 == 1])]

    if mode is SplitMode.EVEN_PAGES:
        return [("paginas_pares", [i for i in range(n) if (i + 1) % 2 == 0])]

    if mode in (SplitMode.BY_BOOKMARKS, SplitMode.BY_TOC_CHAPTERS):
        return [(_sanitize_filename_piece(title), idxs) for title, idxs in _group_by_outline(doc)]

    if mode is SplitMode.BY_BLANK_PAGES:
        return [(range_label(g[0] + 1, g[-1] + 1, width), g) for g in _group_by_blank_pages(doc)]

    if mode is SplitMode.BY_ORIENTATION_CHANGE:
        return [(range_label(g[0] + 1, g[-1] + 1, width), g) for g in _group_by_orientation_change(doc)]

    if mode is SplitMode.BY_TEXT_MATCH:
        return [(range_label(g[0] + 1, g[-1] + 1, width), g) for g in _group_by_text_match(doc, request.text_needle or "")]

    if mode is SplitMode.BY_REGEX:
        return [(range_label(g[0] + 1, g[-1] + 1, width), g) for g in _group_by_regex(doc, request.regex_pattern or "")]

    if mode is SplitMode.BY_MAX_SIZE:
        return [(range_label(g[0] + 1, g[-1] + 1, width), g) for g in _group_by_max_size(doc, request.max_size_mb or 10.0)]

    raise ValueError(f"Modo de divisão não suportado: {mode}")


def _write_page_group(doc: PdfDocument, indices: list[int], destination: Path) -> None:
    writer = PdfWriter()
    for idx in indices:
        writer.add_page(doc.reader.pages[idx])
    if doc.reader.metadata:
        try:
            writer.add_metadata(dict(doc.reader.metadata))
        except Exception:  # noqa: BLE001
            pass
    destination.parent.mkdir(parents=True, exist_ok=True)
    with open(destination, "wb") as fh:
        writer.write(fh)


ProgressCallback = Callable[[int, int], None]
CancelCheck = Callable[[], bool]


def run_split(request: SplitRequest, progress_cb: Optional[ProgressCallback] = None, cancel_check: Optional[CancelCheck] = None) -> SplitResult:
    started = time.monotonic()
    preservation = PreservationReport(
        preserved=["conteudo de página (texto e imagens)", "dimensoes e orientação", "metadados do documento"],
        not_preserved=[
            "marcadores/sumario global (exceto no modo 'por marcadores'/'por capitulos')",
            "assinaturas digitais existentes (invalidadas ao recompor o documento)",
        ],
    )

    with PdfDocument.open(request.source_path, password=request.password) as doc:
        groups = [(label, idxs) for label, idxs in compute_split_groups(doc, request) if idxs]
        if not groups:
            raise ValueError("A operação de divisão resultaria em zero arquivos de saída.")

        base_stem = request.source_path.stem
        total = len(groups)
        written_temp: list[Path] = []

        with task_temp_dir() as tmp_dir:
            for i, (label, indices) in enumerate(groups, start=1):
                if cancel_check and cancel_check():
                    raise OperationCancelled()
                tmp_path = unique_path(tmp_dir / request.naming.build_name(base_stem, label))
                _write_page_group(doc, indices, tmp_path)
                written_temp.append(tmp_path)
                if progress_cb:
                    progress_cb(i, total)

            if cancel_check and cancel_check():
                raise OperationCancelled()

            final_dir = request.output_dir
            if request.naming.create_subfolder:
                subfolder = request.naming.subfolder_name or f"{base_stem}_dividido"
                final_dir = final_dir / _sanitize_filename_piece(subfolder)
            final_dir.mkdir(parents=True, exist_ok=True)

            final_files: list[Path] = []
            for tmp_path in written_temp:
                dest = resolve_output_path(final_dir / tmp_path.name, request.overwrite_behavior)
                shutil.move(str(tmp_path), str(dest))
                final_files.append(dest)

            zip_path = None
            if request.create_zip:
                zip_path = unique_path(final_dir / f"{base_stem}_dividido.zip")
                zip_files(final_files, zip_path)

        return SplitResult(
            output_files=final_files, zip_path=zip_path, total_source_pages=doc.page_count,
            preservation=preservation, duration_seconds=time.monotonic() - started,
        )


# =============================================================================
# 15) SERVIÇOS DE UNIAO
# =============================================================================
def _write_writer_to_destination(writer: PdfWriter, output_path: Path) -> Path:
    with task_temp_dir() as tmp_dir:
        tmp_path = tmp_dir / output_path.name
        with open(tmp_path, "wb") as fh:
            writer.write(fh)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        final_path = unique_path(output_path)
        shutil.move(str(tmp_path), str(final_path))
    return final_path


def run_merge(request: MergeRequest, progress_cb: Optional[ProgressCallback] = None, cancel_check: Optional[CancelCheck] = None) -> OrganizeResult:
    started = time.monotonic()
    ranges = request.page_ranges or [None] * len(request.source_paths)
    if len(ranges) != len(request.source_paths):
        raise ValueError("page_ranges deve ter o mesmo tamanho de source_paths (ou ser None).")

    opened_docs: list[PdfDocument] = []
    try:
        per_doc_indices: list[list[int]] = []
        for path, expr in zip(request.source_paths, ranges):
            doc = PdfDocument.open(path)
            opened_docs.append(doc)
            per_doc_indices.append(parse_ranges(expr, doc.page_count) if expr else list(range(doc.page_count)))

        writer = PdfWriter()
        total_pages = 0
        bookmark_entries: list[tuple[str, int]] = []
        preserved_outline_entries: list[tuple[str, int]] = []

        if request.interleave:
            max_len = max((len(idxs) for idxs in per_doc_indices), default=0)
            for round_i in range(max_len):
                for doc, indices in zip(opened_docs, per_doc_indices):
                    if cancel_check and cancel_check():
                        raise OperationCancelled()
                    if round_i < len(indices):
                        writer.add_page(doc.reader.pages[indices[round_i]])
                        total_pages += 1
                if progress_cb:
                    progress_cb(round_i + 1, max_len)
        else:
            for doc_i, (doc, indices) in enumerate(zip(opened_docs, per_doc_indices)):
                if cancel_check and cancel_check():
                    raise OperationCancelled()
                start_pos = total_pages
                for idx in indices:
                    writer.add_page(doc.reader.pages[idx])
                    total_pages += 1
                if request.add_bookmark_per_source:
                    bookmark_entries.append((request.source_paths[doc_i].stem, start_pos))
                if request.preserve_existing_bookmarks:
                    try:
                        for title, page_num in [
                            (str(getattr(item, "title", "marcador")), doc.reader.get_destination_page_number(item))
                            for item in (doc.reader.outline or [])
                            if not isinstance(item, list)
                        ]:
                            if page_num is not None and page_num in indices:
                                preserved_outline_entries.append((title, start_pos + indices.index(page_num)))
                    except Exception:  # noqa: BLE001
                        pass
                if progress_cb:
                    progress_cb(doc_i + 1, len(request.source_paths))

        for title, pos in bookmark_entries:
            writer.add_outline_item(title, pos)
        for title, pos in preserved_outline_entries:
            writer.add_outline_item(title, pos)

        if total_pages == 0:
            raise ValueError("A uniao resultaria em um documento sem páginas.")

        final_path = _write_writer_to_destination(writer, request.output_path)
        return OrganizeResult(
            output_path=final_path, total_pages=total_pages,
            preservation=PreservationReport(
                preserved=["conteudo de página", "marcador por documento de origem (se habilitado)"],
                not_preserved=["assinaturas digitais existentes"],
                notes=(["Uniao intercalada: marcadores por documento não são adicionados."] if request.interleave else []),
            ),
            duration_seconds=time.monotonic() - started,
        )
    finally:
        for doc in opened_docs:
            doc.close()


# =============================================================================
# 16) SERVIÇOS DE ORGANIZACAO (reordenar, girar, excluir, duplicar, inserir
#     página em branco, substituir, extrair, inverter ordem)
# =============================================================================
def _write_pages_to_new_document(doc: PdfDocument, page_objects: list, output_path: Path) -> OrganizeResult:
    started = time.monotonic()
    writer = PdfWriter()
    for page in page_objects:
        writer.add_page(page)
    if doc.reader.metadata:
        try:
            writer.add_metadata(dict(doc.reader.metadata))
        except Exception:  # noqa: BLE001
            pass
    final_path = _write_writer_to_destination(writer, output_path)
    return OrganizeResult(
        output_path=final_path, total_pages=len(page_objects),
        preservation=PreservationReport(
            preserved=["conteudo de página", "dimensoes e orientação", "metadados"],
            not_preserved=["assinaturas digitais existentes (invalidadas ao recompor)"],
        ),
        duration_seconds=time.monotonic() - started,
    )


def run_reorder(request: ReorderRequest) -> OrganizeResult:
    with PdfDocument.open(request.source_path) as doc:
        n = doc.page_count
        if sorted(request.new_order) != list(range(n)):
            raise ValueError(f"new_order deve ser uma permutacao de 0..{n - 1}.")
        pages = [doc.reader.pages[i] for i in request.new_order]
        return _write_pages_to_new_document(doc, pages, request.output_path)


def run_rotate(request: RotateRequest) -> OrganizeResult:
    with PdfDocument.open(request.source_path) as doc:
        target = set(request.page_indices) if request.page_indices is not None else None
        pages = []
        for i in range(doc.page_count):
            page = doc.reader.pages[i]
            if target is None or i in target:
                page = page.rotate(request.degrees)
            pages.append(page)
        return _write_pages_to_new_document(doc, pages, request.output_path)


def run_delete(request: DeleteRequest) -> OrganizeResult:
    with PdfDocument.open(request.source_path) as doc:
        to_delete = set(request.page_indices)
        remaining = [i for i in range(doc.page_count) if i not in to_delete]
        if not remaining:
            raise ValueError("A exclusao removeria todas as páginas do documento.")
        pages = [doc.reader.pages[i] for i in remaining]
        return _write_pages_to_new_document(doc, pages, request.output_path)


def run_duplicate(request: DuplicateRequest) -> OrganizeResult:
    with PdfDocument.open(request.source_path) as doc:
        to_duplicate = set(request.page_indices)
        pages = []
        for i in range(doc.page_count):
            pages.append(doc.reader.pages[i])
            if i in to_duplicate and request.insert_after_original:
                pages.append(doc.reader.pages[i])
        if not request.insert_after_original:
            for i in request.page_indices:
                pages.append(doc.reader.pages[i])
        return _write_pages_to_new_document(doc, pages, request.output_path)


_DEFAULT_BLANK_PAGE_SIZE_PT = (595.0, 842.0)  # A4


def _blank_page_dimensions(doc: PdfDocument, insert_after_index: int) -> tuple[float, float]:
    if doc.page_count == 0:
        return _DEFAULT_BLANK_PAGE_SIZE_PT
    reference_index = max(0, min(insert_after_index if insert_after_index >= 0 else 0, doc.page_count - 1))
    box = doc.reader.pages[reference_index].mediabox
    return float(box.width), float(box.height)


def run_insert_blank(request: InsertBlankRequest) -> OrganizeResult:
    if request.count < 1:
        raise ValueError("count deve ser >= 1")
    with PdfDocument.open(request.source_path) as doc:
        width, height = _blank_page_dimensions(doc, request.insert_after_index)
        pages = [doc.reader.pages[i] for i in range(doc.page_count)]
        insertion_point = max(0, min(request.insert_after_index + 1, len(pages)))
        blanks = [PageObject.create_blank_page(width=width, height=height) for _ in range(request.count)]
        pages[insertion_point:insertion_point] = blanks
        return _write_pages_to_new_document(doc, pages, request.output_path)


def run_replace_pages(request: ReplacePagesRequest) -> OrganizeResult:
    with PdfDocument.open(request.source_path) as doc, PdfDocument.open(request.replacement_source_path) as replacement_doc:
        to_replace = sorted(set(request.target_indices))
        if not to_replace:
            raise ValueError("Informe ao menos um indice de página para substituir.")
        if any(i < 0 or i >= doc.page_count for i in to_replace):
            raise ValueError("Indice de página fora do intervalo do documento de origem.")
        to_replace_set = set(to_replace)
        pages = []
        inserted = False
        for i in range(doc.page_count):
            if i in to_replace_set:
                if not inserted:
                    pages.extend(replacement_doc.reader.pages[j] for j in range(replacement_doc.page_count))
                    inserted = True
                continue
            pages.append(doc.reader.pages[i])
        if not inserted:
            pages.extend(replacement_doc.reader.pages[j] for j in range(replacement_doc.page_count))
        if not pages:
            raise ValueError("A substituicao resultaria em um documento sem páginas.")
        return _write_pages_to_new_document(doc, pages, request.output_path)


def run_extract_pages(request: ExtractPagesRequest) -> OrganizeResult:
    with PdfDocument.open(request.source_path) as doc:
        indices = parse_ranges(request.ranges_expression, doc.page_count, allow_duplicate_pages=request.allow_duplicate_pages)
        if not indices:
            raise ValueError("Nenhuma página foi selecionada para extração.")
        pages = [doc.reader.pages[i] for i in indices]
        return _write_pages_to_new_document(doc, pages, request.output_path)


def run_invert_order(request: InvertOrderRequest) -> OrganizeResult:
    with PdfDocument.open(request.source_path) as doc:
        pages = [doc.reader.pages[i] for i in reversed(range(doc.page_count))]
        return _write_pages_to_new_document(doc, pages, request.output_path)


# =============================================================================
# 16-B) NÍVEL 2 (subconjunto genuino): metadados, sanitizacao, senha
# =============================================================================
def run_view_metadata(source_path: Path) -> dict[str, str]:
    with PdfDocument.open(source_path) as doc:
        meta = doc.reader.metadata or {}
        return {str(k).lstrip("/"): str(v) for k, v in meta.items()}


def run_update_metadata(request: MetadataRequest) -> OrganizeResult:
    """Se ``request.fields`` for None, remove todos os metadados (apenas
    marca o Producer como esta aplicação). Caso contrario, grava exatamente
    os campos fornecidos (os demais não são copiados do original — reescrever
    e a forma mais confiavel de garantir que nada indesejado permaneca)."""
    with PdfDocument.open(request.source_path) as doc:
        pages = [doc.reader.pages[i] for i in range(doc.page_count)]
        writer = PdfWriter()
        for page in pages:
            writer.add_page(page)
        if request.fields is None:
            writer.add_metadata({"/Producer": APP_DISPLAY_NAME})
        else:
            data = {"/Producer": APP_DISPLAY_NAME}
            if request.fields.title:
                data["/Title"] = request.fields.title
            if request.fields.author:
                data["/Author"] = request.fields.author
            if request.fields.subject:
                data["/Subject"] = request.fields.subject
            if request.fields.keywords:
                data["/Keywords"] = request.fields.keywords
            writer.add_metadata(data)
        final_path = _write_writer_to_destination(writer, request.output_path)
        return OrganizeResult(
            output_path=final_path, total_pages=len(pages),
            preservation=PreservationReport(
                preserved=["conteudo de página"],
                not_preserved=["metadados originais não listados explicitamente (sobrescritos de proposito)"],
            ),
        )


def run_sanitize(request: SanitizeRequest) -> OrganizeResult:
    """Reconstroi o documento página a página (mesma técnica de
    ``_write_pages_to_new_document``): como o ``PdfWriter`` novo nunca clona
    o catalogo do documento de origem (apenas as páginas são copiadas via
    ``add_page``), JavaScript de documento e anexos incorporados (que vivem
    em `/Names` do catalogo) e formularios (`/AcroForm`, tambem no catalogo)
    ja NÃO são copiados por construcao. Complementarmente, remove tambem
    anotacoes de página do tipo Widget (campos de formulario) e quaisquer
    ações adicionais (`/AA`) de página, quando solicitado — reforco no
    nível de página, ja que alguns campos de formulario são implementados
    como anotacoes da própria página, não apenas via `/AcroForm` do
    catalogo."""
    from pypdf.generic import NameObject

    with PdfDocument.open(request.source_path) as doc:
        pages = []
        for i in range(doc.page_count):
            page = doc.reader.pages[i]
            if request.remove_form_fields or request.remove_javascript:
                try:
                    annots = page.get("/Annots")
                    if annots:
                        kept = []
                        for annot_ref in annots:
                            annot = annot_ref.get_object()
                            is_widget = annot.get("/Subtype") == "/Widget"
                            has_action = "/AA" in annot or "/A" in annot
                            if request.remove_form_fields and is_widget:
                                continue
                            if request.remove_javascript and has_action:
                                continue
                            kept.append(annot_ref)
                        page[NameObject("/Annots")] = kept
                except Exception:  # noqa: BLE001
                    pass  # página sem /Annots utilizavel: nada a filtrar
            pages.append(page)

        removed_notes = []
        if request.remove_javascript:
            removed_notes.append("JavaScript de documento e de página (ações /AA e /A)")
        if request.remove_attachments:
            removed_notes.append("anexos incorporados (/Names/EmbeddedFiles do catalogo original)")
        if request.remove_form_fields:
            removed_notes.append("campos de formulario (anotacoes /Widget e /AcroForm do catalogo original)")

        result = _write_pages_to_new_document(doc, pages, request.output_path)
        result.preservation.not_preserved.extend(removed_notes)
        result.preservation.notes.append(
            "Reconstrucao completa do documento: o catalogo original (onde vivem "
            "JavaScript de documento, anexos e formularios) nunca e copiado, apenas "
            "as páginas — por isso esses itens desaparecem mesmo sem uma remocao "
            "explicita adicional."
        )
        return result


def run_encrypt(request: EncryptRequest) -> OrganizeResult:
    with PdfDocument.open(request.source_path) as doc:
        pages = [doc.reader.pages[i] for i in range(doc.page_count)]
        writer = PdfWriter()
        for page in pages:
            writer.add_page(page)
        writer.encrypt(user_password=request.user_password, owner_password=request.owner_password, use_128bit=True)
        final_path = _write_writer_to_destination(writer, request.output_path)
        return OrganizeResult(
            output_path=final_path, total_pages=len(pages),
            preservation=PreservationReport(
                preserved=["conteudo de página", "metadados"],
                notes=["Documento agora exige senha para ser aberto. A senha NÃO e persistida em lugar nenhum pela aplicação."],
            ),
        )


# =============================================================================
# 16-C) OTIMIZAÇÃO / COMPACTAÇÃO (Fase 1 do Nível 2)
#
# Duas tecnicas distintas, nunca confundidas entre si:
#   - Otimização ESTRUTURAL (sempre disponivel, so com pypdf): clona o
#     documento inteiro (preservando marcadores/formularios/anexos, ao
#     contrario da sanitizacao), comprime os fluxos de conteudo de cada
#     página e funde/objetos identicos e remove objetos não referenciados
#     via ``PdfWriter.compress_identical_objects``. Não redimensiona nem
#     recomprime imagens: e uma otimização sem perdas de qualidade visual.
#   - Compactação AVANCADA via Ghostscript (somente se detectado no PATH):
#     re-renderiza/downsamples imagens incorporadas para o DPI escolhido e
#     reencoda com a qualidade escolhida — isso É uma operação com perdas
#     (lossy) quando ha imagens, e o resultado deixa isso explicito no
#     campo ``notes`` do resultado, nunca alegando "sem perdas".
# =============================================================================
_GS_PDFSETTINGS_BY_LEVEL: dict[CompressionLevel, str] = {
    CompressionLevel.LIGHT: "/prepress",
    CompressionLevel.BALANCED: "/ebook",
    CompressionLevel.MAXIMUM: "/screen",
}
_GS_DEFAULT_DPI_BY_LEVEL: dict[CompressionLevel, int] = {
    CompressionLevel.LIGHT: 300,
    CompressionLevel.BALANCED: 150,
    CompressionLevel.MAXIMUM: 96,
}


def _optimize_structural(doc: PdfDocument, remove_metadata: bool) -> PdfWriter:
    """Otimização estrutural sem perdas: clona o documento inteiro (mantendo
    marcadores, formularios e anexos, ao contrario de ``run_sanitize``),
    comprime os fluxos de conteudo de cada página e remove objetos
    duplicados/não referenciados. Usada sempre que Ghostscript não estiver
    disponivel, e tambem como primeiro passo antes de uma eventual
    compactação avancada."""
    writer = PdfWriter(clone_from=doc.reader)
    for page in writer.pages:
        try:
            page.compress_content_streams()
        except Exception:  # noqa: BLE001 - página com fluxo que não pode ser recomprimido: mantem como esta
            pass
    try:
        writer.compress_identical_objects(remove_duplicates=True, remove_unreferenced=True)
    except Exception:  # noqa: BLE001 - operação best-effort; não deve impedir a escrita do resultado
        pass
    if remove_metadata and writer.metadata:
        blanked = {key: "" for key in writer.metadata.keys()}
        writer.add_metadata(blanked)
        writer.add_metadata({"/Producer": APP_DISPLAY_NAME})
    return writer


def _optimize_with_ghostscript(
    gs_path: str,
    source_path: Path,
    destination_path: Path,
    request: CompressionRequest,
    cancel_check: Optional[CancelCheck] = None,
) -> None:
    """Chama o Ghostscript com uma lista de argumentos (nunca uma string
    concatenada), sempre com ``-dBATCH -dNOPAUSE -dSAFER`` e escrevendo em
    um caminho de destino isolado (o chamador e responsavel por usar um
    diretorio temporario e so mover o resultado ao final, com sucesso)."""
    args = [
        gs_path, "-q", "-dBATCH", "-dNOPAUSE", "-dSAFER",
        "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.5",
    ]
    if request.level is CompressionLevel.CUSTOM:
        dpi = request.custom_dpi or 150
        quality = request.custom_quality or 75
        args += [
            "-dDownsampleColorImages=true", f"-dColorImageResolution={dpi}",
            "-dDownsampleGrayImages=true", f"-dGrayImageResolution={dpi}",
            "-dDownsampleMonoImages=true", f"-dMonoImageResolution={dpi}",
            "-dAutoFilterColorImages=false", "-dColorImageFilter=/DCTEncode", f"-dJPEGQ={quality}",
        ]
    else:
        pdfsettings = _GS_PDFSETTINGS_BY_LEVEL[request.level]
        args += [f"-dPDFSETTINGS={pdfsettings}"]
    if request.remove_metadata:
        args += ["-dPreserveEPSInfo=false"]
    args += [f"-sOutputFile={destination_path}", str(source_path)]

    returncode, _stdout, stderr = _run_subprocess_cancellable(args, cancel_check=cancel_check, timeout_seconds=300.0)
    if returncode != 0:
        detail = stderr.strip().splitlines()[-1] if stderr.strip() else f"código de saída {returncode}"
        raise ExternalToolError(f"Ghostscript falhou ao compactar: {detail}")
    if not destination_path.exists() or destination_path.stat().st_size == 0:
        raise ExternalToolError("Ghostscript terminou sem erro, mas não produziu um arquivo de saída válido.")


def run_optimize(
    request: CompressionRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> CompressionResult:
    started = time.monotonic()
    original_size = request.source_path.stat().st_size
    gs_path = None if request.force_structural_only else shutil.which("gs")

    with task_temp_dir() as tmp_dir:
        with PdfDocument.open(request.source_path, password=request.password) as doc:
            structural_tmp = tmp_dir / f"estrutural_{request.output_path.name}"
            writer = _optimize_structural(doc, request.remove_metadata)
            with open(structural_tmp, "wb") as fh:
                writer.write(fh)
        if progress_cb:
            progress_cb(1, 2 if gs_path else 1)
        if cancel_check and cancel_check():
            raise OperationCancelled()

        notes: list[str] = []
        used_ghostscript = False
        final_tmp = structural_tmp

        if gs_path:
            gs_tmp = tmp_dir / f"compactado_{request.output_path.name}"
            try:
                _optimize_with_ghostscript(gs_path, structural_tmp, gs_tmp, request, cancel_check=cancel_check)
                used_ghostscript = True
                final_tmp = gs_tmp
                notes.append(
                    "Compactação avancada via Ghostscript aplicada: imagens incorporadas podem ter sido "
                    "reamostradas/recomprimidas (operação com perdas quando ha imagens)."
                )
            except OperationCancelled:
                raise
            except ExternalToolError as exc:
                notes.append(f"Ghostscript detectado, mas falhou ({exc}); mantido apenas o resultado estrutural (sem perdas).")
        else:
            notes.append(
                "Ghostscript não foi detectado no PATH: aplicada somente otimização estrutural sem perdas "
                "(fluxos de conteudo comprimidos, objetos duplicados/não referenciados removidos). "
                "Instale o Ghostscript para obter reducao adicional em documentos com imagens."
            )

        if progress_cb:
            progress_cb(2 if gs_path else 1, 2 if gs_path else 1)

        final_path = resolve_output_path(request.output_path, request.overwrite_behavior)
        final_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(final_tmp), str(final_path))

    final_size = final_path.stat().st_size
    reduction_percent = (1 - (final_size / original_size)) * 100 if original_size else 0.0
    return CompressionResult(
        output_path=final_path, original_size_bytes=original_size, final_size_bytes=final_size,
        reduction_percent=reduction_percent, used_ghostscript=used_ghostscript,
        duration_seconds=time.monotonic() - started, notes=notes,
    )


# =============================================================================
# 16-D) CONVERSOES (Fase 2 do Nível 2)
#
# Quatro conversoes genuinas nesta fase:
#   - Imagens (JPG/PNG/TIFF/WEBP) -> PDF, via Pillow.
#   - PDF -> imagens (JPG/PNG/TIFF), via pypdfium2 (renderizacao) + Pillow
#     (codificacao no formato/qualidade escolhidos), com seleção de páginas.
#   - PDF -> texto, via extração de texto do pypdf (mesma técnica ja usada
#     internamente para detectar páginas em branco).
#   - Office -> PDF, somente se o LibreOffice ('soffice') for detectado no
#     PATH; caso contrario a operação fica desabilitada com instrução de
#     instalação, nunca um botao decorativo.
# "PDF pesquisavel" (PDF -> PDF com OCR) fica deliberadamente de fora desta
# fase: depende do OCR (Fase 4, ainda não implementada nesta entrega).
# =============================================================================
_IMAGE_EXTENSIONS_BY_FORMAT: dict[ImageFormat, tuple[str, ...]] = {
    ImageFormat.JPEG: (".jpg", ".jpeg"),
    ImageFormat.PNG: (".png",),
    ImageFormat.TIFF: (".tif", ".tiff"),
    ImageFormat.WEBP: (".webp",),
}
_PIL_FORMAT_NAME: dict[ImageFormat, str] = {
    ImageFormat.JPEG: "JPEG",
    ImageFormat.PNG: "PNG",
    ImageFormat.TIFF: "TIFF",
    ImageFormat.WEBP: "WEBP",
}
SUPPORTED_IMAGE_INPUT_EXTENSIONS: tuple[str, ...] = (".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp")


def _load_image_as_rgb_or_l(path: Path):
    """Abre uma imagem e normaliza o modo de cor para algo que o Pillow
    aceita ao gravar PDF/JPEG (RGB para a maioria dos casos; preserva 'L'
    - escala de cinza - para não inchar digitalizacoes em preto e branco)."""
    img = PILImage.open(path)
    img.load()
    if img.mode in ("RGB", "L"):
        return img
    if img.mode == "RGBA":
        background = PILImage.new("RGB", img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        return background
    return img.convert("RGB")


def run_images_to_pdf(
    request: ImagesToPdfRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> ImagesToPdfResult:
    started = time.monotonic()
    total = len(request.image_paths)
    images = []
    try:
        for i, path in enumerate(request.image_paths, start=1):
            if cancel_check and cancel_check():
                raise OperationCancelled()
            images.append(_load_image_as_rgb_or_l(path))
            if progress_cb:
                progress_cb(i, total)

        if cancel_check and cancel_check():
            raise OperationCancelled()

        with task_temp_dir() as tmp_dir:
            tmp_path = tmp_dir / request.output_path.name
            first, rest = images[0], images[1:]
            first.save(
                tmp_path, "PDF", resolution=float(request.dpi), quality=request.quality,
                save_all=True, append_images=rest,
            )
            final_path = resolve_output_path(request.output_path, request.overwrite_behavior)
            final_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(tmp_path), str(final_path))
    finally:
        for img in images:
            try:
                img.close()
            except Exception:  # noqa: BLE001
                pass

    return ImagesToPdfResult(output_path=final_path, page_count=total, duration_seconds=time.monotonic() - started)


def run_pdf_to_images(
    request: PdfToImagesRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> PdfToImagesResult:
    started = time.monotonic()
    pil_format = _PIL_FORMAT_NAME[request.image_format]
    extension = _IMAGE_EXTENSIONS_BY_FORMAT[request.image_format][0]

    with PdfDocument.open(request.source_path, password=request.password) as doc:
        indices = (
            parse_ranges(request.ranges_expression, doc.page_count)
            if request.ranges_expression else list(range(doc.page_count))
        )
        if not indices:
            raise ValueError("Nenhuma página foi selecionada para conversão.")

        base_stem = request.source_path.stem
        width = len(str(doc.page_count))
        total = len(indices)
        # pypdfium2 abre o arquivo de forma independente do pypdf (usado em
        # PdfDocument acima), entao a senha precisa ser passada novamente
        # aqui se o documento estiver protegido.
        pdfium_doc = pdfium.PdfDocument(str(request.source_path), password=request.password)

        written_temp: list[Path] = []
        with task_temp_dir() as tmp_dir:
            for i, page_index in enumerate(indices, start=1):
                if cancel_check and cancel_check():
                    pdfium_doc.close()
                    raise OperationCancelled()
                page = pdfium_doc[page_index]
                scale = request.dpi / 72.0
                bitmap = page.render(scale=scale)
                pil_image = bitmap.to_pil()
                if pil_image.mode not in ("RGB", "L") or request.image_format is ImageFormat.JPEG:
                    pil_image = pil_image.convert("RGB")
                name = f"{base_stem}_pg{zero_pad(page_index + 1, width)}{extension}"
                tmp_path = unique_path(tmp_dir / name)
                save_kwargs: dict[str, Any] = {}
                if request.image_format in (ImageFormat.JPEG, ImageFormat.WEBP):
                    save_kwargs["quality"] = request.quality
                pil_image.save(tmp_path, pil_format, **save_kwargs)
                written_temp.append(tmp_path)
                if progress_cb:
                    progress_cb(i, total)

            pdfium_doc.close()

            if cancel_check and cancel_check():
                raise OperationCancelled()

            request.output_dir.mkdir(parents=True, exist_ok=True)
            final_files: list[Path] = []
            for tmp_path in written_temp:
                dest = resolve_output_path(request.output_dir / tmp_path.name, request.overwrite_behavior)
                shutil.move(str(tmp_path), str(dest))
                final_files.append(dest)

            zip_path = None
            if request.create_zip:
                zip_path = unique_path(request.output_dir / f"{base_stem}_imagens.zip")
                zip_files(final_files, zip_path)

    return PdfToImagesResult(output_files=final_files, zip_path=zip_path, duration_seconds=time.monotonic() - started)


def run_pdf_to_text(
    request: PdfToTextRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> PdfToTextResult:
    started = time.monotonic()
    with PdfDocument.open(request.source_path, password=request.password) as doc:
        indices = (
            parse_ranges(request.ranges_expression, doc.page_count)
            if request.ranges_expression else list(range(doc.page_count))
        )
        if not indices:
            raise ValueError("Nenhuma página foi selecionada para extração de texto.")

        total = len(indices)
        parts: list[str] = []
        for i, page_index in enumerate(indices, start=1):
            if cancel_check and cancel_check():
                raise OperationCancelled()
            text = _extract_page_text_safe(doc, page_index)
            parts.append(f"----- Página {page_index + 1} -----\n{text}\n")
            if progress_cb:
                progress_cb(i, total)

        if cancel_check and cancel_check():
            raise OperationCancelled()

        full_text = "\n".join(parts)
        with task_temp_dir() as tmp_dir:
            tmp_path = tmp_dir / request.output_path.name
            tmp_path.write_text(full_text, encoding="utf-8")
            final_path = resolve_output_path(request.output_path, request.overwrite_behavior)
            final_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(tmp_path), str(final_path))

    return PdfToTextResult(
        output_path=final_path, total_characters=len(full_text),
        pages_processed=total, duration_seconds=time.monotonic() - started,
    )


def run_office_to_pdf(
    request: OfficeToPdfRequest,
    cancel_check: Optional[CancelCheck] = None,
) -> OfficeToPdfResult:
    started = time.monotonic()
    soffice_path = shutil.which("soffice")
    if not soffice_path:
        raise ExternalToolError(
            "LibreOffice ('soffice') não foi detectado no PATH. Instale o LibreOffice para converter "
            "documentos de escritorio (Office) para PDF."
        )

    with task_temp_dir() as tmp_dir:
        args = [soffice_path, "--headless", "--norestore", "--convert-to", "pdf", "--outdir", str(tmp_dir), str(request.source_path)]
        # A conversão do LibreOffice pode levar alguns segundos para o processo iniciar
        # (carregamento do ambiente do LibreOffice), por isso um tempo limite maior.
        returncode, _stdout, stderr = _run_subprocess_cancellable(args, cancel_check=cancel_check, timeout_seconds=180.0)
        if returncode != 0:
            detail = stderr.strip().splitlines()[-1] if stderr.strip() else f"código de saída {returncode}"
            raise ExternalToolError(f"LibreOffice falhou ao converter: {detail}")

        produced = list(tmp_dir.glob("*.pdf"))
        if not produced:
            raise ExternalToolError("LibreOffice terminou sem erro, mas não produziu nenhum arquivo PDF.")

        final_path = resolve_output_path(request.output_path, request.overwrite_behavior)
        final_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(produced[0]), str(final_path))

    return OfficeToPdfResult(
        output_path=final_path, duration_seconds=time.monotonic() - started,
        notes=["Conversão via LibreOffice: a formatacao final pode variar de acordo com a complexidade do documento original."],
    )


# =============================================================================
# 16-E) EDICAO (Fase 3): marca d'agua, numeracao/Bates, cabecalho/rodape,
#       texto, imagem, formas, links.
#
# Técnica usada (validada empiricamente antes de escrever este código,
# renderizando o resultado de verdade com pypdfium2):
#   - Texto/formas: um fluxo de conteudo PDF mínimo e escrito a mao (BT/ET,
#     Tf/Tm/Tj para texto; re/m/l/S/f para formas), referenciando a fonte
#     padrão Helvetica (uma das 14 fontes base do PDF: nunca precisa ser
#     incorporada ao arquivo). Isso e desenhado em uma página "overlay"
#     separada e depois fundido na página de destino via
#     ``PageObject.merge_page`` — a MESMA técnica usada por praticamente
#     toda ferramenta de marca d'agua/carimbo em PDF. Isso e uma
#     SOBREPOSICAO de conteudo, não uma edicao estrutural do texto
#     original da página (o texto pre-existente na página não e alterado).
#   - Opacidade: um recurso /ExtGState com /ca e /CA controla a
#     transparencia do que for desenhado.
#   - Imagens: a imagem e salva como um PDF de uma página (Pillow, mesma
#     técnica da Fase 2) e fundida na página de destino com
#     ``merge_transformed_page`` (escala + translacao) para caber
#     exatamente no retangulo escolhido.
#   - Links: usam ``pypdf.annotations.Link`` (anotacao real, clicavel),
#     apontando para uma URL externa ou para uma página interna do próprio
#     documento.
#   - Largura de texto para centralizar/alinhar cabecalho, rodape e
#     numeracao usa uma tabela APROXIMADA de larguras da fonte Helvetica
#     (Adobe Core 14, valores por 1000 unidades de em); caracteres fora da
#     tabela (a maioria dos acentos ja esta coberta) usam uma largura media
#     como aproximacao. Isso e suficiente para um alinhamento visualmente
#     correto, mas não e uma medicao tipografica exata como a de um motor
#     de composicao de texto completo.
# =============================================================================
_HELVETICA_WIDTHS_1000: dict[str, int] = {
    " ": 278, "!": 278, '"': 355, "#": 556, "$": 556, "%": 889, "&": 667, "'": 191,
    "(": 333, ")": 333, "*": 389, "+": 584, ",": 278, "-": 333, ".": 278, "/": 278,
    "0": 556, "1": 556, "2": 556, "3": 556, "4": 556, "5": 556, "6": 556, "7": 556,
    "8": 556, "9": 556, ":": 278, ";": 278, "<": 584, "=": 584, ">": 584, "?": 556,
    "@": 1015,
    "A": 667, "B": 667, "C": 722, "D": 722, "E": 667, "F": 611, "G": 778, "H": 722,
    "I": 278, "J": 500, "K": 667, "L": 556, "M": 833, "N": 722, "O": 778, "P": 667,
    "Q": 778, "R": 722, "S": 667, "T": 611, "U": 722, "V": 667, "W": 944, "X": 667,
    "Y": 667, "Z": 611,
    "[": 278, "\\": 278, "]": 278, "^": 469, "_": 556, "`": 333,
    "a": 556, "b": 556, "c": 500, "d": 556, "e": 556, "f": 278, "g": 556, "h": 556,
    "i": 222, "j": 222, "k": 500, "l": 222, "m": 833, "n": 556, "o": 556, "p": 556,
    "q": 556, "r": 333, "s": 500, "t": 278, "u": 556, "v": 500, "w": 722, "x": 500,
    "y": 500, "z": 500,
    "{": 334, "|": 260, "}": 334, "~": 584,
}
_HELVETICA_AVERAGE_WIDTH_1000 = 556  # usado para qualquer caractere fora da tabela acima (ex.: acentos)


def _pdf_escape_text(text: str) -> str:
    """Escapa parenteses/barra invertida (obrigatorio dentro de uma string
    literal '(...)' de um fluxo de conteudo PDF) e converte para Latin-1
    (compativel com a codificacao WinAnsiEncoding usada pela fonte
    Helvetica padrão, que cobre os acentos do portugues). Caracteres fora
    dessa codificacao (ex.: emojis) viram '?' em vez de travar a geração."""
    escaped = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    return escaped.encode("latin-1", errors="replace").decode("latin-1")


def _approx_text_width(text: str, font_size: float) -> float:
    total_units = sum(_HELVETICA_WIDTHS_1000.get(ch, _HELVETICA_AVERAGE_WIDTH_1000) for ch in text)
    return total_units / 1000.0 * font_size


def _hex_to_rgb01(hex_color: str) -> tuple[float, float, float]:
    hex_color = hex_color.strip().lstrip("#")
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    return r, g, b


def _resolve_target_pages(
    total_pages: int,
    target_mode: PageTargetMode,
    ranges_expression: Optional[str],
    current_page_index: Optional[int],
) -> list[int]:
    """Sempre devolve indices 0-based, ordenados e sem duplicatas: para
    ferramentas de edicao/carimbo (ao contrario da divisão), a ordem de
    aplicação não importa e uma página nunca deve ser carimbada duas
    vezes."""
    if target_mode is PageTargetMode.ALL_PAGES:
        return list(range(total_pages))
    if target_mode is PageTargetMode.ODD_PAGES:
        return [i for i in range(total_pages) if (i + 1) % 2 == 1]
    if target_mode is PageTargetMode.EVEN_PAGES:
        return [i for i in range(total_pages) if (i + 1) % 2 == 0]
    if target_mode is PageTargetMode.CURRENT_PAGE:
        idx = current_page_index if current_page_index is not None else 0
        if idx < 0 or idx >= total_pages:
            raise ValueError(f"Página atual ({idx + 1}) esta fora do intervalo do documento ({total_pages} páginas).")
        return [idx]
    if target_mode is PageTargetMode.RANGE:
        return sorted(set(parse_ranges(ranges_expression or "", total_pages)))
    raise ValueError(f"Modo de alvo de páginas não suportado: {target_mode}")


def _build_overlay_page(width: float, height: float, content_ops: list[str], opacity: float = 1.0) -> PageObject:
    """Constroi uma página PDF isolada (mesmo tamanho da página de destino)
    contendo apenas o fluxo de conteudo informado, com a fonte Helvetica
    padrão e um /ExtGState de opacidade sempre disponiveis como recursos.
    A página retornada e destinada a ser fundida em uma página real via
    ``PageObject.merge_page`` — nunca aberta/exibida sozinha."""
    overlay_writer = PdfWriter()
    overlay_page = overlay_writer.add_blank_page(width=width, height=height)

    font_dict = DictionaryObject({
        NameObject("/Type"): NameObject("/Font"),
        NameObject("/Subtype"): NameObject("/Type1"),
        NameObject("/BaseFont"): NameObject("/Helvetica"),
        NameObject("/Encoding"): NameObject("/WinAnsiEncoding"),
    })
    gs_dict = DictionaryObject({
        NameObject("/Type"): NameObject("/ExtGState"),
        NameObject("/ca"): FloatObject(opacity),
        NameObject("/CA"): FloatObject(opacity),
    })
    overlay_page[NameObject("/Resources")] = DictionaryObject({
        NameObject("/Font"): DictionaryObject({NameObject("/F1"): font_dict}),
        NameObject("/ExtGState"): DictionaryObject({NameObject("/GS1"): gs_dict}),
    })

    content_bytes = "\n".join(content_ops).encode("latin-1", errors="replace")
    stream = DecodedStreamObject()
    stream.set_data(content_bytes)
    overlay_page[NameObject("/Contents")] = overlay_writer._add_object(stream)
    return overlay_page


def _write_writer_to_destination_with_behavior(writer: PdfWriter, output_path: Path, behavior: OverwriteBehavior) -> Path:
    """Igual a ``_write_writer_to_destination`` (escrita em temporario,
    depois move para o destino final), mas respeitando o comportamento de
    sobrescrita escolhido pelo usuário (as ferramentas de organizacao mais
    antigas sempre renomeiam; as ferramentas a partir da Fase 1/2/3 tambem
    permitem sobrescrever de proposito quando configurado assim)."""
    with task_temp_dir() as tmp_dir:
        tmp_path = tmp_dir / output_path.name
        with open(tmp_path, "wb") as fh:
            writer.write(fh)
        final_path = resolve_output_path(output_path, behavior)
        final_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(tmp_path), str(final_path))
    return final_path


def _stamp_target_pages(
    source_path: Path,
    output_path: Path,
    target_mode: PageTargetMode,
    ranges_expression: Optional[str],
    current_page_index: Optional[int],
    password: Optional[str],
    overwrite_behavior: OverwriteBehavior,
    build_ops_for_page: Callable[[int, float, float, int], list[str]],
    *,
    opacity: float = 1.0,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> tuple[Path, int]:
    """Motor generico compartilhado por marca d'agua, numeracao/Bates,
    cabecalho/rodape, texto e formas: resolve quais páginas são o alvo,
    clona o documento inteiro (preservando marcadores/formularios, como em
    ``run_optimize``/``run_sanitize``), e funde uma página overlay
    (construida por ``build_ops_for_page``) em cada página alvo."""
    with PdfDocument.open(source_path, password=password) as doc:
        total_pages = doc.page_count
        targets = _resolve_target_pages(total_pages, target_mode, ranges_expression, current_page_index)
        if not targets:
            raise ValueError("Nenhuma página corresponde ao alvo selecionado.")

        writer = PdfWriter(clone_from=doc.reader)
        total = len(targets)
        for i, idx in enumerate(targets, start=1):
            if cancel_check and cancel_check():
                raise OperationCancelled()
            page = writer.pages[idx]
            width, height = float(page.mediabox.width), float(page.mediabox.height)
            inner_ops = build_ops_for_page(idx, width, height, total_pages)
            if inner_ops:
                full_ops = ["q", "/GS1 gs"] + inner_ops + ["Q"]
                overlay_page = _build_overlay_page(width, height, full_ops, opacity=opacity)
                page.merge_page(overlay_page)
            if progress_cb:
                progress_cb(i, total)

        final_path = _write_writer_to_destination_with_behavior(writer, output_path, overwrite_behavior)
    return final_path, total


def run_add_watermark(
    request: WatermarkRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> EditResult:
    started = time.monotonic()
    r, g, b = _hex_to_rgb01(request.color_hex)
    escaped = _pdf_escape_text(request.text)
    angle = math.radians(request.rotation_degrees)
    cos_a, sin_a = math.cos(angle), math.sin(angle)

    def build_ops(page_index: int, width: float, height: float, total_pages: int) -> list[str]:
        cx, cy = width / 2.0, height / 2.0
        text_w = _approx_text_width(request.text, request.font_size)
        start_x = cx - (text_w / 2.0) * cos_a
        start_y = cy - (text_w / 2.0) * sin_a
        return [
            f"{r:.3f} {g:.3f} {b:.3f} rg",
            "BT",
            f"/F1 {request.font_size:.2f} Tf",
            f"{cos_a:.5f} {sin_a:.5f} {-sin_a:.5f} {cos_a:.5f} {start_x:.2f} {start_y:.2f} Tm",
            f"({escaped}) Tj",
            "ET",
        ]

    final_path, pages_affected = _stamp_target_pages(
        request.source_path, request.output_path, request.target_mode, request.ranges_expression,
        request.current_page_index, request.password, request.overwrite_behavior, build_ops,
        opacity=request.opacity, progress_cb=progress_cb, cancel_check=cancel_check,
    )
    return EditResult(
        output_path=final_path, pages_affected=pages_affected, duration_seconds=time.monotonic() - started,
        notes=["Marca d'agua aplicada por sobreposicao de conteudo (o texto original da página não e alterado)."],
    )


def run_add_page_numbers(
    request: PageNumberRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> PageNumberResult:
    started = time.monotonic()
    r, g, b = _hex_to_rgb01(request.color_hex)
    counter = {"n": request.bates_start}
    labels: list[str] = []

    def build_ops(page_index: int, width: float, height: float, total_pages: int) -> list[str]:
        if request.mode is NumberingMode.BATES:
            label = f"{request.bates_prefix}{str(counter['n']).zfill(request.bates_digits)}"
            counter["n"] += 1
        else:
            try:
                label = request.format_template.format(page=page_index + 1, total=total_pages)
            except (KeyError, IndexError, ValueError):
                label = request.format_template
        labels.append(label)
        escaped = _pdf_escape_text(label)
        text_w = _approx_text_width(label, request.font_size)
        if request.align is HorizontalAlign.LEFT:
            x = request.margin_pt
        elif request.align is HorizontalAlign.RIGHT:
            x = width - request.margin_pt - text_w
        else:
            x = (width - text_w) / 2.0
        y = request.margin_pt
        return [
            f"{r:.3f} {g:.3f} {b:.3f} rg",
            "BT",
            f"/F1 {request.font_size:.2f} Tf",
            f"1 0 0 1 {x:.2f} {y:.2f} Tm",
            f"({escaped}) Tj",
            "ET",
        ]

    final_path, pages_affected = _stamp_target_pages(
        request.source_path, request.output_path, request.target_mode, request.ranges_expression,
        request.current_page_index, request.password, request.overwrite_behavior, build_ops,
        progress_cb=progress_cb, cancel_check=cancel_check,
    )
    return PageNumberResult(
        output_path=final_path, pages_affected=pages_affected,
        first_label=labels[0] if labels else None, last_label=labels[-1] if labels else None,
        duration_seconds=time.monotonic() - started,
    )


def run_add_header_footer(
    request: HeaderFooterRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> EditResult:
    started = time.monotonic()
    r, g, b = _hex_to_rgb01(request.color_hex)

    def build_ops(page_index: int, width: float, height: float, total_pages: int) -> list[str]:
        ops: list[str] = []
        for raw_text, is_header in ((request.header_text, True), (request.footer_text, False)):
            if not raw_text or not raw_text.strip():
                continue
            try:
                rendered = raw_text.format(page=page_index + 1, total=total_pages)
            except (KeyError, IndexError, ValueError):
                rendered = raw_text
            escaped = _pdf_escape_text(rendered)
            text_w = _approx_text_width(rendered, request.font_size)
            if request.align is HorizontalAlign.LEFT:
                x = request.margin_pt
            elif request.align is HorizontalAlign.RIGHT:
                x = width - request.margin_pt - text_w
            else:
                x = (width - text_w) / 2.0
            y = (height - request.margin_pt - request.font_size) if is_header else request.margin_pt
            ops += [
                f"{r:.3f} {g:.3f} {b:.3f} rg",
                "BT",
                f"/F1 {request.font_size:.2f} Tf",
                f"1 0 0 1 {x:.2f} {y:.2f} Tm",
                f"({escaped}) Tj",
                "ET",
            ]
        return ops

    final_path, pages_affected = _stamp_target_pages(
        request.source_path, request.output_path, request.target_mode, request.ranges_expression,
        request.current_page_index, request.password, request.overwrite_behavior, build_ops,
        progress_cb=progress_cb, cancel_check=cancel_check,
    )
    return EditResult(output_path=final_path, pages_affected=pages_affected, duration_seconds=time.monotonic() - started)


def run_add_text_stamp(
    request: TextStampRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> EditResult:
    started = time.monotonic()
    r, g, b = _hex_to_rgb01(request.color_hex)
    escaped = _pdf_escape_text(request.text)
    angle = math.radians(request.rotation_degrees)
    cos_a, sin_a = math.cos(angle), math.sin(angle)

    def build_ops(page_index: int, width: float, height: float, total_pages: int) -> list[str]:
        return [
            f"{r:.3f} {g:.3f} {b:.3f} rg",
            "BT",
            f"/F1 {request.font_size:.2f} Tf",
            f"{cos_a:.5f} {sin_a:.5f} {-sin_a:.5f} {cos_a:.5f} {request.x_pt:.2f} {request.y_pt:.2f} Tm",
            f"({escaped}) Tj",
            "ET",
        ]

    final_path, pages_affected = _stamp_target_pages(
        request.source_path, request.output_path, request.target_mode, request.ranges_expression,
        request.current_page_index, request.password, request.overwrite_behavior, build_ops,
        progress_cb=progress_cb, cancel_check=cancel_check,
    )
    return EditResult(output_path=final_path, pages_affected=pages_affected, duration_seconds=time.monotonic() - started)


def run_add_shape_stamp(
    request: ShapeStampRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> EditResult:
    started = time.monotonic()
    sr, sg, sb = _hex_to_rgb01(request.stroke_color_hex)
    has_fill = request.fill_color_hex is not None and request.kind is ShapeKind.RECTANGLE
    fill_rgb = _hex_to_rgb01(request.fill_color_hex) if has_fill else None

    def build_ops(page_index: int, width: float, height: float, total_pages: int) -> list[str]:
        ops = [f"{request.line_width_pt:.2f} w", f"{sr:.3f} {sg:.3f} {sb:.3f} RG"]
        if request.kind is ShapeKind.RECTANGLE:
            x = min(request.x1_pt, request.x2_pt)
            y = min(request.y1_pt, request.y2_pt)
            rect_w = abs(request.x2_pt - request.x1_pt)
            rect_h = abs(request.y2_pt - request.y1_pt)
            if fill_rgb:
                ops.append(f"{fill_rgb[0]:.3f} {fill_rgb[1]:.3f} {fill_rgb[2]:.3f} rg")
            ops.append(f"{x:.2f} {y:.2f} {rect_w:.2f} {rect_h:.2f} re")
            ops.append("B" if fill_rgb else "S")
        else:
            ops.append(f"{request.x1_pt:.2f} {request.y1_pt:.2f} m")
            ops.append(f"{request.x2_pt:.2f} {request.y2_pt:.2f} l")
            ops.append("S")
        return ops

    final_path, pages_affected = _stamp_target_pages(
        request.source_path, request.output_path, request.target_mode, request.ranges_expression,
        request.current_page_index, request.password, request.overwrite_behavior, build_ops,
        progress_cb=progress_cb, cancel_check=cancel_check,
    )
    return EditResult(output_path=final_path, pages_affected=pages_affected, duration_seconds=time.monotonic() - started)


def run_add_image_stamp(
    request: ImageStampRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> EditResult:
    """Insere uma imagem em um retangulo (x, y, largura, altura, em pontos,
    origem no canto inferior esquerdo da página) das páginas selecionadas.
    A opacidade e aproximada mesclando a imagem contra um fundo branco
    antes de incorporar (não e uma transparencia real via canal alfa/SMask
    — funciona bem sobre páginas de fundo claro, mas não sobre conteudo
    escuro ja existente por baixo)."""
    started = time.monotonic()
    img = _load_image_as_rgb_or_l(request.image_path)
    try:
        if request.opacity < 1.0 and img.mode == "RGB":
            background = PILImage.new("RGB", img.size, (255, 255, 255))
            img = PILImage.blend(background, img, request.opacity)

        with task_temp_dir() as tmp_dir:
            overlay_pdf_path = tmp_dir / "overlay_imagem.pdf"
            img.save(overlay_pdf_path, "PDF", resolution=150.0)
            overlay_reader = PdfReader(str(overlay_pdf_path))
            overlay_source_page = overlay_reader.pages[0]
            src_w = float(overlay_source_page.mediabox.width)
            src_h = float(overlay_source_page.mediabox.height)
            sx = request.width_pt / src_w
            sy = request.height_pt / src_h

            with PdfDocument.open(request.source_path, password=request.password) as doc:
                total_pages = doc.page_count
                targets = _resolve_target_pages(total_pages, request.target_mode, request.ranges_expression, request.current_page_index)
                if not targets:
                    raise ValueError("Nenhuma página corresponde ao alvo selecionado.")

                writer = PdfWriter(clone_from=doc.reader)
                total = len(targets)
                transformation = Transformation().scale(sx, sy).translate(request.x_pt, request.y_pt)
                for i, idx in enumerate(targets, start=1):
                    if cancel_check and cancel_check():
                        raise OperationCancelled()
                    writer.pages[idx].merge_transformed_page(overlay_source_page, transformation)
                    if progress_cb:
                        progress_cb(i, total)

                final_path = _write_writer_to_destination_with_behavior(writer, request.output_path, request.overwrite_behavior)
    finally:
        try:
            img.close()
        except Exception:  # noqa: BLE001
            pass

    return EditResult(output_path=final_path, pages_affected=total, duration_seconds=time.monotonic() - started)


def run_add_link(
    request: LinkAnnotationRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> EditResult:
    started = time.monotonic()
    with PdfDocument.open(request.source_path, password=request.password) as doc:
        total_pages = doc.page_count
        targets = _resolve_target_pages(total_pages, request.target_mode, request.ranges_expression, request.current_page_index)
        if not targets:
            raise ValueError("Nenhuma página corresponde ao alvo selecionado.")
        if request.target_page_number is not None and request.target_page_number > total_pages:
            raise ValueError(f"Página de destino {request.target_page_number} esta alem do total do documento ({total_pages} páginas).")

        writer = PdfWriter(clone_from=doc.reader)
        x1, x2 = sorted((request.x1_pt, request.x2_pt))
        y1, y2 = sorted((request.y1_pt, request.y2_pt))
        total = len(targets)
        for i, idx in enumerate(targets, start=1):
            if cancel_check and cancel_check():
                raise OperationCancelled()
            if request.url:
                link = PdfLinkAnnotation(rect=(x1, y1, x2, y2), url=request.url)
            else:
                link = PdfLinkAnnotation(rect=(x1, y1, x2, y2), target_page_index=(request.target_page_number or 1) - 1)
            if not request.show_border:
                link[NameObject("/Border")] = ArrayObject([NumberObject(0), NumberObject(0), NumberObject(0)])
            writer.add_annotation(page_number=idx, annotation=link)
            if progress_cb:
                progress_cb(i, total)

        final_path = _write_writer_to_destination_with_behavior(writer, request.output_path, request.overwrite_behavior)
    return EditResult(output_path=final_path, pages_affected=total, duration_seconds=time.monotonic() - started)


def _extract_single_page_to_temp(source_path: Path, page_index: int, password: Optional[str], destination_dir: Path) -> Path:
    """Usado apenas pela pre-visualizacao da interface: extrai uma única
    página para um PDF temporario isolado, para que a ferramenta de edicao
    real possa ser executada nela (mesmo código de producao, so que em uma
    copia minima e descartavel) e o resultado seja renderizado como
    pre-visualizacao — nunca uma simulacao separada da logica real."""
    with PdfDocument.open(source_path, password=password) as doc:
        if page_index < 0 or page_index >= doc.page_count:
            page_index = 0
        writer = PdfWriter()
        writer.add_page(doc.reader.pages[page_index])
        preview_source = destination_dir / "preview_pagina_unica.pdf"
        with open(preview_source, "wb") as fh:
            writer.write(fh)
    return preview_source


# =============================================================================
# 16-F) OCR LOCAL (Fase 4) — Tesseract / OCRmyPDF, sempre local, nunca envia
#       o documento para nenhum serviço externo.
# =============================================================================
def _detect_tesseract_languages() -> list[str]:
    """Consulta o próprio Tesseract instalado (``tesseract --list-langs``)
    para saber quais idiomas estão de fato disponiveis nesta máquina — nunca
    assume uma lista fixa hardcoded, que poderia não bater com o que foi
    instalado pelo usuário."""
    tesseract_path = shutil.which("tesseract")
    if not tesseract_path:
        return []
    try:
        result = subprocess.run(
            [tesseract_path, "--list-langs"], capture_output=True, text=True, timeout=10, check=False,
        )
    except Exception:  # noqa: BLE001
        return []
    raw = result.stdout or result.stderr or ""
    lines = [ln.strip() for ln in raw.splitlines()]
    langs = [ln for ln in lines if ln and not ln.lower().startswith("list of")]
    return sorted(langs)


def _ocr_with_ocrmypdf(
    ocrmypdf_path: str, request: OcrRequest, targets: list[int],
    progress_cb: Optional[ProgressCallback], cancel_check: Optional[CancelCheck],
) -> tuple[Path, list[str]]:
    args = [ocrmypdf_path, "--language", request.language, "--output-type", "pdf", "--quiet"]
    args.append("--force-ocr" if request.force_ocr else "--skip-text")
    if request.target_mode is not PageTargetMode.ALL_PAGES:
        args += ["--pages", ",".join(str(i + 1) for i in targets)]

    with task_temp_dir() as tmp_dir:
        tmp_out = tmp_dir / f"ocr_{request.output_path.name}"
        args += [str(request.source_path), str(tmp_out)]
        if progress_cb:
            progress_cb(0, 1)
        returncode, _stdout, stderr = _run_subprocess_cancellable(args, cancel_check=cancel_check, timeout_seconds=600.0)
        if returncode != 0:
            detail = stderr.strip().splitlines()[-1] if stderr.strip() else f"código de saída {returncode}"
            raise ExternalToolError(f"OCRmyPDF falhou: {detail}")
        if not tmp_out.exists() or tmp_out.stat().st_size == 0:
            raise ExternalToolError("OCRmyPDF terminou sem erro, mas não produziu um arquivo de saída válido.")
        if progress_cb:
            progress_cb(1, 1)
        final_path = resolve_output_path(request.output_path, request.overwrite_behavior)
        final_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(tmp_out), str(final_path))

    notes = ["OCR aplicado via OCRmyPDF (orquestra o Tesseract e reconstroi o PDF preservando as páginas fora da seleção)."]
    if request.force_ocr:
        notes.append("Modo 'forcar OCR': as páginas selecionadas foram rasterizadas e reprocessadas mesmo as que ja tinham texto.")
    else:
        notes.append("Páginas selecionadas que ja possuiam uma camada de texto foram mantidas sem novo OCR (modo seguro).")
    return final_path, notes


def _ocr_with_tesseract_fallback(
    tesseract_path: str, request: OcrRequest, total_pages: int, targets: list[int],
    progress_cb: Optional[ProgressCallback], cancel_check: Optional[CancelCheck],
) -> tuple[Path, list[str]]:
    """Usado quando o OCRmyPDF não esta instalado, mas o Tesseract esta:
    renderiza cada página selecionada como imagem, chama ``tesseract <imagem>
    <base> -l <idioma> --dpi <dpi> pdf`` (o próprio Tesseract sabe gerar um
    PDF de uma página com camada de texto invisivel sobre a imagem) e
    remonta o documento final página a página — páginas fora da seleção são
    copiadas do original sem OCR."""
    target_set = set(targets)
    total = len(targets)
    done = 0
    pdfium_doc = pdfium.PdfDocument(str(request.source_path), password=request.password)
    source_reader = PdfReader(str(request.source_path), password=request.password)
    try:
        writer = PdfWriter()
        with task_temp_dir() as tmp_dir:
            for idx in range(total_pages):
                if idx not in target_set:
                    writer.add_page(source_reader.pages[idx])
                    continue
                if cancel_check and cancel_check():
                    raise OperationCancelled()
                page = pdfium_doc[idx]
                bitmap = page.render(scale=request.dpi / 72.0)
                pil_image = bitmap.to_pil().convert("RGB")
                image_path = tmp_dir / f"ocr_pagina_{idx + 1}.png"
                pil_image.save(image_path)
                out_stem = tmp_dir / f"ocr_pagina_{idx + 1}"
                args = [tesseract_path, str(image_path), str(out_stem), "-l", request.language, "--dpi", str(request.dpi), "pdf"]
                returncode, _stdout, stderr = _run_subprocess_cancellable(args, cancel_check=cancel_check, timeout_seconds=120.0)
                ocr_pdf_path = Path(f"{out_stem}.pdf")
                if returncode != 0 or not ocr_pdf_path.exists():
                    detail = stderr.strip().splitlines()[-1] if stderr.strip() else f"código de saída {returncode}"
                    raise ExternalToolError(f"Tesseract falhou na página {idx + 1}: {detail}")
                ocr_reader = PdfReader(str(ocr_pdf_path))
                writer.add_page(ocr_reader.pages[0])
                done += 1
                if progress_cb:
                    progress_cb(done, total)

            final_path = _write_writer_to_destination_with_behavior(writer, request.output_path, request.overwrite_behavior)
    finally:
        pdfium_doc.close()

    notes = [
        "Tesseract detectado sem OCRmyPDF: cada página selecionada foi renderizada como imagem e reprocessada "
        "individualmente pelo Tesseract (que gera um PDF de uma página com camada de texto invisivel sobre a "
        "imagem original); o documento final foi remontado página a página, copiando sem OCR as páginas fora "
        "da seleção. Diferente da clonagem completa usada em outras ferramentas desta suite, essa remontagem "
        "não preserva marcadores/formularios do documento original — instale o OCRmyPDF para uma reconstrucao "
        "que preserva esses elementos.",
    ]
    return final_path, notes


def run_ocr_pdf(
    request: OcrRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> OcrResult:
    """OCR local (Fase 4). Nunca envia o documento a nenhum serviço externo:
    usa exclusivamente o OCRmyPDF e/ou o Tesseract instalados no PATH da
    máquina do usuário, detectados via ``shutil.which`` (nunca assumidos
    presentes). Se nenhum dos dois estiver instalado, a operação e recusada
    com uma instrução clara de instalação — a tela de OCR nunca finge
    reconhecer texto que não foi realmente processado por um motor de OCR."""
    started = time.monotonic()
    ocrmypdf_path = shutil.which("ocrmypdf")
    tesseract_path = shutil.which("tesseract")
    if not ocrmypdf_path and not tesseract_path:
        raise ExternalToolError(
            "Nem 'ocrmypdf' nem 'tesseract' foram detectados no PATH. Instale o Tesseract OCR "
            "(https://github.com/tesseract-ocr/tesseract) e, opcionalmente, o OCRmyPDF "
            "(https://ocrmypdf.readthedocs.io/) para habilitar o reconhecimento de texto local."
        )

    with PdfDocument.open(request.source_path, password=request.password) as doc:
        total_pages = doc.page_count
        targets = _resolve_target_pages(total_pages, request.target_mode, request.ranges_expression, request.current_page_index)
    if not targets:
        raise ValueError("Nenhuma página corresponde ao alvo selecionado.")

    if ocrmypdf_path:
        final_path, notes = _ocr_with_ocrmypdf(ocrmypdf_path, request, targets, progress_cb, cancel_check)
        engine_used = "ocrmypdf"
    else:
        final_path, notes = _ocr_with_tesseract_fallback(tesseract_path, request, total_pages, targets, progress_cb, cancel_check)
        engine_used = "tesseract_fallback"

    return OcrResult(
        output_path=final_path, pages_ocred=len(targets), engine_used=engine_used,
        duration_seconds=time.monotonic() - started, notes=notes,
    )


# =============================================================================
# 16-G) FERRAMENTAS AVANCADAS (Fase 5): comparacao, remocao de páginas em
#       branco, correcao de orientação, extração de imagens/anexos,
#       marcadores, inspeção técnica, reparo via qpdf e redação real.
# =============================================================================
def run_compare(
    request: CompareRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> CompareResult:
    """Comparacao baseada em texto extraido de cada página (nunca visual):
    duas páginas com o mesmo texto mas imagens diferentes serao relatadas
    como identicas — limitacao documentada no resultado."""
    started = time.monotonic()
    with PdfDocument.open(request.source_path_a, password=request.password_a) as doc_a, \
         PdfDocument.open(request.source_path_b, password=request.password_b) as doc_b:
        total_a, total_b = doc_a.page_count, doc_b.page_count
        pages_compared = min(total_a, total_b)
        differing: list[int] = []
        ratios: list[float] = []
        lines_report = [
            "Comparacao de PDFs (baseada em texto extraido de cada página).",
            f"Documento A: {request.source_path_a.name} ({total_a} página(s))",
            f"Documento B: {request.source_path_b.name} ({total_b} página(s))",
            "",
        ]
        for i in range(pages_compared):
            if cancel_check and cancel_check():
                raise OperationCancelled()
            text_a = _extract_page_text_safe(doc_a, i)
            text_b = _extract_page_text_safe(doc_b, i)
            ratio = difflib.SequenceMatcher(None, text_a, text_b).ratio()
            ratios.append(ratio)
            if ratio < 0.999:
                differing.append(i + 1)
                lines_report.append(f"----- Página {i + 1}: similaridade de texto {ratio * 100:.1f}% -----")
                diff_lines = list(difflib.unified_diff(
                    text_a.splitlines(), text_b.splitlines(),
                    fromfile=f"A (página {i + 1})", tofile=f"B (página {i + 1})", lineterm="",
                ))
                lines_report.extend(diff_lines[:200])
                lines_report.append("")
            if progress_cb:
                progress_cb(i + 1, pages_compared)

        if total_a != total_b:
            lines_report.append(
                f"AVISO: os documentos tem quantidades de páginas diferentes ({total_a} vs {total_b}); "
                f"apenas as {pages_compared} páginas em comum foram comparadas."
            )

        overall = (sum(ratios) / len(ratios) * 100.0) if ratios else 0.0
        report_text = "\n".join(lines_report)
        with task_temp_dir() as tmp_dir:
            tmp_path = tmp_dir / request.output_path.name
            tmp_path.write_text(report_text, encoding="utf-8")
            final_path = resolve_output_path(request.output_path, request.overwrite_behavior)
            final_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(tmp_path), str(final_path))

    return CompareResult(
        output_path=final_path, total_pages_a=total_a, total_pages_b=total_b,
        pages_compared=pages_compared, differing_pages=differing, overall_similarity_percent=overall,
        duration_seconds=time.monotonic() - started,
        notes=[
            "Comparacao baseada em texto extraido de cada página; diferencas puramente visuais (ex.: "
            "imagens diferentes com o mesmo texto, ou mudancas so de formatacao) não são detectadas.",
        ],
    )


def _page_whiteness_percent(pdfium_doc: "pdfium.PdfDocument", page_index: int, render_dpi: int) -> float:
    page = pdfium_doc[page_index]
    bitmap = page.render(scale=render_dpi / 72.0)
    pil_image = bitmap.to_pil().convert("L")
    total_pixels = pil_image.width * pil_image.height
    if total_pixels == 0:
        return 100.0
    histogram = pil_image.histogram()
    near_white_pixels = sum(histogram[250:256])
    return (near_white_pixels / total_pixels) * 100.0


def run_remove_blank_pages(
    request: BlankPageRemovalRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> BlankPageRemovalResult:
    """Deteccao heuristica por renderizacao (não apenas ausencia de texto):
    uma página e considerada em branco quando a porcentagem de pixels quase
    brancos, após renderizada em baixa resolucao, atinge o limiar
    configurado. Isso detecta corretamente páginas em branco mesmo quando
    contem apenas uma imagem em branco (não apenas texto ausente)."""
    started = time.monotonic()
    with PdfDocument.open(request.source_path, password=request.password) as doc:
        total_before = doc.page_count
        pdfium_doc = pdfium.PdfDocument(str(request.source_path), password=request.password)
        blank_indices: list[int] = []
        try:
            for i in range(total_before):
                if cancel_check and cancel_check():
                    raise OperationCancelled()
                whiteness = _page_whiteness_percent(pdfium_doc, i, request.render_dpi)
                if whiteness >= request.whiteness_threshold_percent:
                    blank_indices.append(i)
                if progress_cb:
                    progress_cb(i + 1, total_before)
        finally:
            pdfium_doc.close()

        if len(blank_indices) == total_before:
            raise ValueError(
                "Todas as páginas foram detectadas como em branco; nada foi removido "
                "(ajuste o limiar de sensibilidade e tente novamente)."
            )

        blank_set = set(blank_indices)
        writer = PdfWriter()
        for i in range(total_before):
            if i not in blank_set:
                writer.add_page(doc.reader.pages[i])
        if doc.reader.metadata:
            try:
                writer.add_metadata(dict(doc.reader.metadata))
            except Exception:  # noqa: BLE001
                pass
        final_path = _write_writer_to_destination_with_behavior(writer, request.output_path, request.overwrite_behavior)

    return BlankPageRemovalResult(
        output_path=final_path, total_pages_before=total_before,
        removed_page_numbers=[i + 1 for i in blank_indices],
        total_pages_after=total_before - len(blank_indices),
        duration_seconds=time.monotonic() - started,
    )


def _detect_osd_rotation(tesseract_path: str, image_path: Path) -> Optional[int]:
    """Usa o modo de deteccao de orientação e script (OSD, ``--psm 0``) do
    próprio Tesseract — nunca adivinha a rotacao por conta própria."""
    try:
        result = subprocess.run(
            [tesseract_path, str(image_path), "stdout", "--psm", "0"],
            capture_output=True, text=True, timeout=30, check=False,
        )
    except Exception:  # noqa: BLE001
        return None
    for line in (result.stdout or "").splitlines():
        if line.lower().startswith("rotate:"):
            try:
                return int(line.split(":", 1)[1].strip())
            except ValueError:
                return None
    return None


def run_fix_orientation(
    request: OrientationFixRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> OrientationFixResult:
    started = time.monotonic()
    tesseract_path = shutil.which("tesseract")
    if not tesseract_path:
        raise ExternalToolError(
            "O Tesseract OCR não foi detectado no PATH. A correcao automática de orientação usa o modo de "
            "deteccao de orientação e script (OSD) do Tesseract; instale o Tesseract "
            "(https://github.com/tesseract-ocr/tesseract) para habilitar esta ferramenta."
        )

    with PdfDocument.open(request.source_path, password=request.password) as doc:
        total_pages = doc.page_count
        pdfium_doc = pdfium.PdfDocument(str(request.source_path), password=request.password)
        rotations: dict[int, int] = {}
        try:
            with task_temp_dir() as tmp_dir:
                for i in range(total_pages):
                    if cancel_check and cancel_check():
                        raise OperationCancelled()
                    page = pdfium_doc[i]
                    bitmap = page.render(scale=200.0 / 72.0)
                    pil_image = bitmap.to_pil().convert("RGB")
                    image_path = tmp_dir / f"osd_pagina_{i + 1}.png"
                    pil_image.save(image_path)
                    rotation = _detect_osd_rotation(tesseract_path, image_path)
                    if rotation and rotation % 360 != 0:
                        rotations[i] = rotation
                    if progress_cb:
                        progress_cb(i + 1, total_pages)
        finally:
            pdfium_doc.close()

        writer = PdfWriter(clone_from=doc.reader)
        for idx, degrees in rotations.items():
            writer.pages[idx].rotate(degrees)
        final_path = _write_writer_to_destination_with_behavior(writer, request.output_path, request.overwrite_behavior)

    return OrientationFixResult(
        output_path=final_path, pages_analyzed=total_pages, pages_rotated=len(rotations),
        rotations_applied={idx + 1: deg for idx, deg in rotations.items()},
        duration_seconds=time.monotonic() - started,
        notes=[
            "Deteccao via Tesseract OSD (Orientation and Script Detection): funciona melhor em páginas com "
            "texto real, mesmo que pouco. Páginas sem texto reconhecivel (ex.: so uma foto) podem não ter "
            "rotacao alguma detectada, mesmo se estiverem giradas.",
        ],
    )


def run_extract_assets(
    request: ExtractAssetsRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> ExtractAssetsResult:
    started = time.monotonic()
    request.output_dir.mkdir(parents=True, exist_ok=True)
    image_files: list[Path] = []
    attachment_files: list[Path] = []

    with PdfDocument.open(request.source_path, password=request.password) as doc:
        reader = doc.reader
        total_steps = doc.page_count if request.extract_images else 0
        total_steps += len(reader.attachments) if request.extract_attachments else 0
        total_steps = max(total_steps, 1)
        done = 0

        if request.extract_images:
            counter = 0
            for page_index in range(doc.page_count):
                if cancel_check and cancel_check():
                    raise OperationCancelled()
                page = reader.pages[page_index]
                for image_file in page.images:
                    counter += 1
                    try:
                        pil_image = image_file.image
                        if pil_image is None:
                            continue
                        name = f"{request.source_path.stem}_pagina{page_index + 1}_imagem{counter}.png"
                        dest = resolve_output_path(request.output_dir / name, request.overwrite_behavior)
                        save_image = pil_image if pil_image.mode in ("RGB", "L", "RGBA") else pil_image.convert("RGB")
                        save_image.save(dest)
                        image_files.append(dest)
                    except Exception:  # noqa: BLE001
                        continue
                done += 1
                if progress_cb:
                    progress_cb(done, total_steps)

        if request.extract_attachments:
            for name, contents_list in reader.attachments.items():
                if cancel_check and cancel_check():
                    raise OperationCancelled()
                for i, content_bytes in enumerate(contents_list):
                    safe_name = name if i == 0 else f"{Path(name).stem}_{i}{Path(name).suffix}"
                    dest = resolve_output_path(request.output_dir / safe_name, request.overwrite_behavior)
                    dest.write_bytes(content_bytes)
                    attachment_files.append(dest)
                done += 1
                if progress_cb:
                    progress_cb(done, total_steps)

    return ExtractAssetsResult(
        output_dir=request.output_dir, image_files=image_files, attachment_files=attachment_files,
        duration_seconds=time.monotonic() - started,
    )


def _flatten_outline(outline_items: list, reader: "PdfReader", level: int = 0) -> list[BookmarkEntry]:
    entries: list[BookmarkEntry] = []
    for item in outline_items:
        if isinstance(item, list):
            entries.extend(_flatten_outline(item, reader, level + 1))
            continue
        try:
            page_number = reader.get_destination_page_number(item)
        except Exception:  # noqa: BLE001
            page_number = None
        entries.append(BookmarkEntry(
            title=str(getattr(item, "title", "(sem titulo)")),
            page_number=(page_number + 1) if page_number is not None else 0,
            level=level,
        ))
    return entries


def run_list_bookmarks(request: ListBookmarksRequest) -> ListBookmarksResult:
    with PdfDocument.open(request.source_path, password=request.password) as doc:
        try:
            outline = doc.reader.outline or []
        except Exception:  # noqa: BLE001
            outline = []
        entries = _flatten_outline(outline, doc.reader)
    return ListBookmarksResult(entries=entries)


def run_add_bookmark(request: AddBookmarkRequest) -> EditResult:
    with PdfDocument.open(request.source_path, password=request.password) as doc:
        total_pages = doc.page_count
        if request.page_number > total_pages:
            raise ValueError(f"Página {request.page_number} esta alem do total do documento ({total_pages} páginas).")
        writer = PdfWriter(clone_from=doc.reader)
        writer.add_outline_item(request.title, request.page_number - 1)
        final_path = _write_writer_to_destination_with_behavior(writer, request.output_path, request.overwrite_behavior)
    return EditResult(
        output_path=final_path, pages_affected=1,
        notes=[f"Marcador '{request.title}' adicionado apontando para a página {request.page_number}."],
    )


def run_clear_bookmarks(request: ClearBookmarksRequest) -> EditResult:
    with PdfDocument.open(request.source_path, password=request.password) as doc:
        total_pages = doc.page_count
        writer = PdfWriter()
        for page in doc.reader.pages:
            writer.add_page(page)
        if doc.reader.metadata:
            try:
                writer.add_metadata(dict(doc.reader.metadata))
            except Exception:  # noqa: BLE001
                pass
        final_path = _write_writer_to_destination_with_behavior(writer, request.output_path, request.overwrite_behavior)
    return EditResult(
        output_path=final_path, pages_affected=total_pages,
        notes=[
            "Todos os marcadores (outline) foram removidos ao reconstruir o documento página a página — "
            "a mesma técnica de reconstrucao completa ja usada na sanitizacao, que tambem remove anexos e "
            "formularios do catalogo original como efeito colateral.",
        ],
    )


def run_inspect(request: InspectionRequest) -> InspectionResult:
    file_size = request.source_path.stat().st_size
    with PdfDocument.open(request.source_path, password=request.password) as doc:
        reader = doc.reader
        page_count = doc.page_count
        pdf_version = getattr(reader, "pdf_header", "desconhecida")

        size_counts: dict[tuple[float, float], int] = {}
        font_names: set[str] = set()
        image_count = 0
        for page in reader.pages:
            box = page.mediabox
            key = (round(float(box.width), 1), round(float(box.height), 1))
            size_counts[key] = size_counts.get(key, 0) + 1
            try:
                resources = page.get("/Resources")
                fonts = resources.get("/Font") if resources else None
                if fonts:
                    for font_ref in fonts.values():
                        font_obj = font_ref.get_object()
                        base_font = font_obj.get("/BaseFont")
                        if base_font:
                            font_names.add(str(base_font).lstrip("/"))
            except Exception:  # noqa: BLE001
                pass
            try:
                image_count += sum(1 for _ in page.images)
            except Exception:  # noqa: BLE001
                pass

        page_sizes_pt = [f"{w:.1f} x {h:.1f} pt ({count} página(s))" for (w, h), count in size_counts.items()]

        catalog = reader.trailer.get("/Root", {})
        has_forms = bool(reader.get_fields())
        has_javascript = False
        try:
            names_dict = catalog.get("/Names")
            if names_dict and "/JavaScript" in names_dict.get_object():
                has_javascript = True
        except Exception:  # noqa: BLE001
            pass

        try:
            attachment_count = len(reader.attachments)
        except Exception:  # noqa: BLE001
            attachment_count = 0

        try:
            outline_entries = _flatten_outline(reader.outline or [], reader)
            outline_entry_count = len(outline_entries)
        except Exception:  # noqa: BLE001
            outline_entry_count = 0

        metadata: dict[str, str] = {}
        if reader.metadata:
            for key, value in reader.metadata.items():
                try:
                    metadata[str(key).lstrip("/")] = str(value)
                except Exception:  # noqa: BLE001
                    continue

        report_lines = [
            f"Arquivo: {request.source_path.name} ({file_size / 1024:.1f} KB)",
            f"Versao do PDF: {pdf_version}",
            f"Páginas: {page_count}",
            "Tamanhos de página: " + ("; ".join(page_sizes_pt) if page_sizes_pt else "não determinado"),
            f"Protegido por senha: {'sim' if reader.is_encrypted else 'não'}",
            f"Possui formularios (AcroForm): {'sim' if has_forms else 'não'}",
            f"Possui JavaScript incorporado: {'sim' if has_javascript else 'não'}",
            f"Imagens incorporadas (contagem bruta, pode repetir a mesma imagem): {image_count}",
            f"Anexos incorporados: {attachment_count}",
            f"Marcadores (outline): {outline_entry_count}",
            "Fontes usadas: " + (", ".join(sorted(font_names)) if font_names else "nenhuma detectada"),
        ]
        if metadata:
            report_lines.append("Metadados:")
            for key, value in metadata.items():
                report_lines.append(f"  {key}: {value}")

    return InspectionResult(
        file_size_bytes=file_size, pdf_version=str(pdf_version), page_count=page_count,
        page_sizes_pt=page_sizes_pt, is_encrypted=reader.is_encrypted, has_forms=has_forms,
        has_javascript=has_javascript, embedded_image_count=image_count, attachment_count=attachment_count,
        font_names=sorted(font_names), outline_entry_count=outline_entry_count, metadata=metadata,
        report_text="\n".join(report_lines),
    )


def run_check_repair(request: RepairCheckRequest) -> RepairCheckResult:
    qpdf_path = shutil.which("qpdf")
    if not qpdf_path:
        raise ExternalToolError(
            "O qpdf não foi detectado no PATH. Instale o qpdf (https://qpdf.sourceforge.io/) para "
            "verificar e reparar a estrutura de documentos PDF."
        )
    args = [qpdf_path, "--check", str(request.source_path)]
    result = subprocess.run(args, capture_output=True, text=True, timeout=60, check=False)
    report = (result.stdout or "") + (result.stderr or "")
    return RepairCheckResult(is_valid=(result.returncode == 0), report_text=report.strip() or "(sem saída do qpdf)")


def run_repair(
    request: RepairRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> RepairResult:
    """O qpdf corrige varios tipos de problema estrutural simplesmente
    reescrevendo o arquivo (comportamento documentado do próprio qpdf);
    não ha garantia de recuperar 100% de arquivos gravemente corrompidos."""
    started = time.monotonic()
    qpdf_path = shutil.which("qpdf")
    if not qpdf_path:
        raise ExternalToolError(
            "O qpdf não foi detectado no PATH. Instale o qpdf (https://qpdf.sourceforge.io/) para "
            "reparar a estrutura de documentos PDF."
        )
    with task_temp_dir() as tmp_dir:
        tmp_out = tmp_dir / f"reparado_{request.output_path.name}"
        args = [qpdf_path, str(request.source_path), str(tmp_out)]
        if progress_cb:
            progress_cb(0, 1)
        returncode, _stdout, stderr = _run_subprocess_cancellable(args, cancel_check=cancel_check, timeout_seconds=180.0)
        report = stderr.strip() or "Reparo concluido sem avisos."
        if returncode not in (0, 3):  # qpdf usa código 3 para "avisos, mas processado com sucesso"
            raise ExternalToolError(f"qpdf falhou ao reparar o arquivo: {report}")
        if not tmp_out.exists() or tmp_out.stat().st_size == 0:
            raise ExternalToolError("qpdf terminou sem erro, mas não produziu um arquivo de saída válido.")
        if progress_cb:
            progress_cb(1, 1)
        final_path = resolve_output_path(request.output_path, request.overwrite_behavior)
        final_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(tmp_out), str(final_path))
    return RepairResult(output_path=final_path, report_text=report, duration_seconds=time.monotonic() - started)


# --- motor de redação real (Fase 5) --------------------------------------
def _mat_mul(m1: tuple, m2: tuple) -> tuple:
    """Composicao de matrizes PDF 2D (a,b,c,d,e,f): aplica m1 e depois m2."""
    a1, b1, c1, d1, e1, f1 = m1
    a2, b2, c2, d2, e2, f2 = m2
    return (
        a1 * a2 + b1 * c2, a1 * b2 + b1 * d2,
        c1 * a2 + d1 * c2, c1 * b2 + d1 * d2,
        e1 * a2 + f1 * c2 + e2, e1 * b2 + f1 * d2 + f2,
    )


def _mat_apply(m: tuple, x: float, y: float) -> tuple[float, float]:
    a, b, c, d, e, f = m
    return (x * a + y * c + e, x * b + y * d + f)


def _rects_overlap(rect_a: tuple, rect_b: tuple) -> bool:
    ax1, ay1, ax2, ay2 = rect_a
    bx1, by1, bx2, by2 = rect_b
    ax1, ax2 = min(ax1, ax2), max(ax1, ax2)
    ay1, ay2 = min(ay1, ay2), max(ay1, ay2)
    bx1, bx2 = min(bx1, bx2), max(bx1, bx2)
    by1, by2 = min(by1, by2), max(by1, by2)
    return not (ax2 < bx1 or ax1 > bx2 or ay2 < by1 or ay1 > by2)


def _text_run_bbox(text: str, font_size: float, tm: tuple, ctm: tuple) -> tuple:
    width = _approx_text_width(text, font_size)
    height = font_size
    combined = _mat_mul(tm, ctm)
    corners = [
        _mat_apply(combined, 0, 0), _mat_apply(combined, width, 0),
        _mat_apply(combined, 0, height), _mat_apply(combined, width, height),
    ]
    xs = [p[0] for p in corners]
    ys = [p[1] for p in corners]
    return (min(xs), min(ys), max(xs), max(ys))


def _unit_square_bbox(ctm: tuple) -> tuple:
    corners = [_mat_apply(ctm, 0, 0), _mat_apply(ctm, 1, 0), _mat_apply(ctm, 0, 1), _mat_apply(ctm, 1, 1)]
    xs = [p[0] for p in corners]
    ys = [p[1] for p in corners]
    return (min(xs), min(ys), max(xs), max(ys))


def _is_image_xobject(page: PageObject, name: Any) -> bool:
    try:
        resources = page.get("/Resources")
        if resources is None:
            return False
        xobjects = resources.get("/XObject")
        if xobjects is None:
            return False
        name_str = name.decode("latin-1") if isinstance(name, bytes) else str(name)
        if not name_str.startswith("/"):
            name_str = "/" + name_str
        xobj = xobjects.get(name_str)
        if xobj is None:
            return False
        return xobj.get_object().get("/Subtype") == "/Image"
    except Exception:  # noqa: BLE001
        return False


def _strip_content_in_rect(pdf_context: Any, page: PageObject, rect: tuple) -> tuple[Optional[bytes], int, int]:
    """Percorre o fluxo de conteudo real da página (não uma sobreposicao)
    rastreando a matriz de transformacao corrente (q/Q/cm) e a matriz de
    texto (BT/ET/Tm/Td/TD) para calcular, de forma aproximada mas real, a
    caixa delimitadora de cada operador de exibicao de texto (Tj/TJ/'/") e
    de cada insercao de imagem (Do). Qualquer operador cuja caixa
    intersecte o retangulo informado e removido do fluxo reconstruido —
    isso e uma remocao de verdade do conteudo, não uma caixa preta por
    cima. A largura do texto usa a mesma tabela aproximada de Helvetica
    ja usada nos carimbos da Fase 3 (limitacao documentada: fontes muito
    diferentes de Helvetica podem ter a caixa um pouco maior ou menor que
    o texto real)."""
    contents = page.get_contents()
    if contents is None:
        return None, 0, 0
    cs = ContentStream(contents, pdf_context)

    ctm_stack: list[tuple] = []
    ctm = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    tm = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    tlm = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    font_size = 12.0

    new_ops: list = []
    removed_text = 0
    removed_images = 0

    for operands, operator in cs.operations:
        if operator == b"q":
            ctm_stack.append(ctm)
        elif operator == b"Q":
            if ctm_stack:
                ctm = ctm_stack.pop()
        elif operator == b"cm":
            try:
                m = tuple(float(v) for v in operands)
                ctm = _mat_mul(m, ctm)
            except (TypeError, ValueError):
                pass
        elif operator == b"BT":
            tm = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
            tlm = tm
        elif operator == b"Tf":
            try:
                font_size = float(operands[1])
            except (IndexError, TypeError, ValueError):
                pass
        elif operator == b"Tm":
            try:
                m = tuple(float(v) for v in operands)
                tm = m
                tlm = m
            except (TypeError, ValueError):
                pass
        elif operator in (b"Td", b"TD"):
            try:
                tx, ty = float(operands[0]), float(operands[1])
                tlm = _mat_mul((1.0, 0.0, 0.0, 1.0, tx, ty), tlm)
                tm = tlm
            except (IndexError, TypeError, ValueError):
                pass
        elif operator == b"T*":
            tm = tlm
        elif operator in (b"Tj", b"'", b'"'):
            text = str(operands[-1]) if operands else ""
            if text and _rects_overlap(_text_run_bbox(text, font_size, tm, ctm), rect):
                removed_text += 1
                continue
            new_ops.append((operands, operator))
        elif operator == b"TJ":
            text = "".join(str(el) for el in operands[0] if isinstance(el, str)) if operands else ""
            if text and _rects_overlap(_text_run_bbox(text, font_size, tm, ctm), rect):
                removed_text += 1
                continue
            new_ops.append((operands, operator))
        elif operator == b"Do":
            xobj_name = operands[0] if operands else None
            if xobj_name is not None and _is_image_xobject(page, xobj_name) and _rects_overlap(_unit_square_bbox(ctm), rect):
                removed_images += 1
                continue
            new_ops.append((operands, operator))
        else:
            new_ops.append((operands, operator))

    cs.operations = new_ops
    return cs.get_data(), removed_text, removed_images


def run_true_redaction(
    request: RedactionRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> RedactionResult:
    """Redação real: diferente do carimbo de forma da Fase 3 (que so
    desenha por cima), aqui o texto e as imagens que intersectam a área
    selecionada são removidos do fluxo de conteudo de verdade antes de
    desenhar o retangulo de cobertura visual opaco por cima."""
    started = time.monotonic()
    r, g, b = _hex_to_rgb01(request.fill_color_hex)
    x1, x2 = sorted((request.x1_pt, request.x2_pt))
    y1, y2 = sorted((request.y1_pt, request.y2_pt))
    rect = (x1, y1, x2, y2)

    with PdfDocument.open(request.source_path, password=request.password) as doc:
        total_pages = doc.page_count
        targets = _resolve_target_pages(total_pages, request.target_mode, request.ranges_expression, request.current_page_index)
        if not targets:
            raise ValueError("Nenhuma página corresponde ao alvo selecionado.")

        writer = PdfWriter(clone_from=doc.reader)
        total = len(targets)
        total_text_removed = 0
        total_images_removed = 0

        for i, idx in enumerate(targets, start=1):
            if cancel_check and cancel_check():
                raise OperationCancelled()
            page = writer.pages[idx]

            new_bytes, removed_text, removed_images = _strip_content_in_rect(writer, page, rect)
            if new_bytes is not None:
                stream = DecodedStreamObject()
                stream.set_data(new_bytes)
                page[NameObject("/Contents")] = writer._add_object(stream)
            total_text_removed += removed_text
            total_images_removed += removed_images

            annots = page.get("/Annots")
            if annots:
                kept = ArrayObject()
                for annot_ref in annots:
                    annot = annot_ref.get_object()
                    annot_rect = annot.get("/Rect")
                    if annot_rect:
                        try:
                            ar = (float(annot_rect[0]), float(annot_rect[1]), float(annot_rect[2]), float(annot_rect[3]))
                            if _rects_overlap(ar, rect):
                                continue
                        except (TypeError, ValueError, IndexError):
                            pass
                    kept.append(annot_ref)
                page[NameObject("/Annots")] = kept

            width = float(page.mediabox.width)
            height = float(page.mediabox.height)
            cover_ops = [
                f"{r:.3f} {g:.3f} {b:.3f} rg",
                f"{x1:.2f} {y1:.2f} {x2 - x1:.2f} {y2 - y1:.2f} re", "f",
            ]
            overlay_page = _build_overlay_page(width, height, cover_ops, opacity=1.0)
            page.merge_page(overlay_page)

            if progress_cb:
                progress_cb(i, total)

        try:
            writer.compress_identical_objects(remove_identical=True, remove_unreferenced=True)
        except Exception:  # noqa: BLE001
            pass

        final_path = _write_writer_to_destination_with_behavior(writer, request.output_path, request.overwrite_behavior)

    notes = [
        "Redação real: os operadores de texto e as imagens cujo retangulo aproximado intersecta a área "
        "selecionada foram removidos do fluxo de conteudo da página antes de desenhar o retangulo de "
        "cobertura visual opaco por cima — isso NÃO e apenas uma caixa preta sobre o conteudo original "
        "(essa e a diferenca em relacao ao carimbo de forma da Fase 3).",
        "Limitacoes honestas: a deteccao de sobreposicao de texto usa a mesma largura aproximada de fonte "
        "(Helvetica) ja documentada nas ferramentas de carimbo da Fase 3, entao a caixa pode ser um pouco "
        "maior ou menor que o texto real em fontes muito diferentes. Imagens XObject de nível superior que "
        "se sobrepoem, mesmo parcialmente, são removidas por inteiro (não recortadas). Anotacoes cujo "
        "retangulo se sobrepoe são removidas. Objetos orfaos são purgados quando possível, mas metadados, "
        "miniaturas ou copias incorporadas fora do fluxo de conteudo da página não são verificados.",
    ]
    return RedactionResult(
        output_path=final_path, pages_affected=len(targets), text_runs_removed=total_text_removed,
        images_removed=total_images_removed, duration_seconds=time.monotonic() - started, notes=notes,
    )


# =============================================================================
# 16-H) ASSINATURAS (Fase 6): assinatura visual (carimbo, sem validade
#       criptográfica) e assinatura digital criptográfica real via pyHanko.
#       Uma NUNCA deve ser chamada da outra em nenhum texto ou código.
# =============================================================================
def run_add_visual_signature(
    request: VisualSignatureRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> EditResult:
    """Desenha uma marca grafica (nome, data, motivo e, opcionalmente, uma
    imagem de assinatura manuscrita) sobre a(s) página(s) selecionada(s).
    Isso e apenas um carimbo visual — não ha nenhuma operação criptográfica
    envolvida aqui. Reaproveita as mesmas tecnicas de sobreposicao de
    conteudo real da Fase 3 (fonte Helvetica padrão, ``merge_page``/
    ``merge_transformed_page``)."""
    started = time.monotonic()
    now_label = _dt.datetime.now().strftime("%d/%m/%Y %H:%M")
    text_lines = [request.signer_name, f"Assinado em: {now_label}"]
    if request.reason:
        text_lines.append(f"Motivo: {request.reason}")

    has_image = request.image_path is not None
    image_area_height = request.height_pt * 0.5 if has_image else 0.0
    text_area_height = request.height_pt - image_area_height

    img = _load_image_as_rgb_or_l(request.image_path) if has_image else None
    try:
        with task_temp_dir() as tmp_dir:
            image_overlay_page = None
            image_transform = None
            if img is not None:
                overlay_pdf_path = tmp_dir / "assinatura_visual_imagem.pdf"
                img.save(overlay_pdf_path, "PDF", resolution=150.0)
                overlay_reader = PdfReader(str(overlay_pdf_path))
                image_overlay_page = overlay_reader.pages[0]
                src_w = float(image_overlay_page.mediabox.width)
                src_h = float(image_overlay_page.mediabox.height)
                sx = request.width_pt / src_w
                sy = image_area_height / src_h
                image_transform = Transformation().scale(sx, sy).translate(
                    request.x_pt, request.y_pt + text_area_height,
                )

            with PdfDocument.open(request.source_path, password=request.password) as doc:
                total_pages = doc.page_count
                targets = _resolve_target_pages(total_pages, request.target_mode, request.ranges_expression, request.current_page_index)
                if not targets:
                    raise ValueError("Nenhuma página corresponde ao alvo selecionado.")

                writer = PdfWriter(clone_from=doc.reader)
                total = len(targets)
                text_top_y = request.y_pt + text_area_height - 14.0

                for i, idx in enumerate(targets, start=1):
                    if cancel_check and cancel_check():
                        raise OperationCancelled()
                    page = writer.pages[idx]
                    width = float(page.mediabox.width)
                    height = float(page.mediabox.height)

                    if image_overlay_page is not None:
                        page.merge_transformed_page(image_overlay_page, image_transform)

                    ops = [
                        "0.000 0.000 0.000 RG", "1.0 w",
                        f"{request.x_pt:.2f} {request.y_pt:.2f} {request.width_pt:.2f} {request.height_pt:.2f} re", "S",
                    ]
                    for li, line in enumerate(text_lines):
                        escaped = _pdf_escape_text(line)
                        y = text_top_y - li * 13.0
                        ops += [
                            "0.000 0.000 0.000 rg", "BT", "/F1 10.00 Tf",
                            f"1 0 0 1 {request.x_pt + 6.0:.2f} {y:.2f} Tm", f"({escaped}) Tj", "ET",
                        ]
                    overlay_page = _build_overlay_page(width, height, ops, opacity=1.0)
                    page.merge_page(overlay_page)

                    if progress_cb:
                        progress_cb(i, total)

                final_path = _write_writer_to_destination_with_behavior(writer, request.output_path, request.overwrite_behavior)
    finally:
        if img is not None:
            try:
                img.close()
            except Exception:  # noqa: BLE001
                pass

    return EditResult(
        output_path=final_path, pages_affected=len(targets), duration_seconds=time.monotonic() - started,
        notes=[
            "ATENCAO: esta e uma assinatura VISUAL — apenas uma marca grafica sobre a página. Ela NÃO possui "
            "qualquer validade criptográfica e NÃO pode ser verificada como uma assinatura digital real por "
            "nenhum leitor de PDF. Para uma assinatura com validade criptográfica, use a ferramenta "
            "'Assinatura digital' (requer certificado PFX/P12 e o pacote pyHanko instalado).",
        ],
    )


def _require_pyhanko():
    """Import tardio (nunca no topo do arquivo) do pyHanko, seguindo a
    mesma regra de todas as dependencias opcionais: a ausencia dele nunca
    impede a abertura do aplicativo, apenas desabilita esta ferramenta
    especifica com uma instrução clara de instalação."""
    import importlib.util

    if importlib.util.find_spec("pyhanko") is None:
        raise ExternalToolError(
            "O pacote opcional 'pyhanko' não esta instalado. Instale-o com "
            "'python -m pip install pyHanko' para habilitar a assinatura digital criptográfica "
            "e a verificação de assinaturas."
        )
    from pyhanko.sign import fields, signers, validation
    from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
    from pyhanko.pdf_utils.reader import PdfFileReader as HankoPdfFileReader
    from pyhanko import stamp as hanko_stamp

    return fields, signers, validation, IncrementalPdfFileWriter, HankoPdfFileReader, hanko_stamp


def run_sign_digital(
    request: DigitalSignatureRequest,
    progress_cb: Optional[ProgressCallback] = None,
    cancel_check: Optional[CancelCheck] = None,
) -> DigitalSignatureResult:
    """Assinatura digital criptográfica REAL via pyHanko: carrega a chave
    privada e o certificado de um arquivo PKCS#12 (.pfx/.p12) e produz uma
    assinatura CMS/PKCS#7 incorporada ao PDF, verificavel por qualquer
    leitor compativel (ex.: Adobe Acrobat) — não apenas por este aplicativo.
    A senha do PFX e usada somente em memória durante esta operação, nunca
    persistida em nenhum arquivo de configuracao."""
    started = time.monotonic()
    fields, signers, _validation, IncrementalPdfFileWriter, _HankoPdfFileReader, hanko_stamp = _require_pyhanko()

    if cancel_check and cancel_check():
        raise OperationCancelled()

    try:
        signer = signers.SimpleSigner.load_pkcs12(
            pfx_file=str(request.pfx_path), passphrase=request.pfx_password.encode("utf-8"),
        )
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"Não foi possível abrir o certificado PFX/P12 (senha incorreta ou arquivo inválido): {exc}") from None
    if signer is None:
        raise ValueError("Não foi possível carregar um certificado e chave privada válidos do arquivo PFX/P12 informado.")

    signer_cn = None
    try:
        signer_cn = signer.signing_cert.subject.native.get("common_name")
    except Exception:  # noqa: BLE001
        pass

    meta_kwargs: dict[str, Any] = {"field_name": request.field_name}
    if request.reason:
        meta_kwargs["reason"] = request.reason
    if request.location:
        meta_kwargs["location"] = request.location
    if request.contact_info:
        meta_kwargs["contact_info"] = request.contact_info
    signature_meta = signers.PdfSignatureMetadata(**meta_kwargs)

    if progress_cb:
        progress_cb(0, 1)

    with task_temp_dir() as tmp_dir:
        tmp_out = tmp_dir / f"assinado_{request.output_path.name}"
        with open(request.source_path, "rb") as inf:
            incremental_writer = IncrementalPdfFileWriter(inf)
            if request.visible:
                # Somente '%(signer)s' e '%(ts)s' são preenchidos automaticamente pelo
                # pyHanko (ver cms_embedder.SigAppearanceSetup._appearance_stamp); motivo
                # e local são interpolados aqui como texto literal, ja conhecido no momento
                # de montar o request, em vez de depender de placeholders internos não
                # documentados que o pyHanko não preenche por padrão.
                stamp_text = "Assinado digitalmente por: %(signer)s\nData: %(ts)s"
                if request.reason:
                    stamp_text += f"\nMotivo: {request.reason}".replace("%", "%%")
                if request.location:
                    stamp_text += f"\nLocal: {request.location}".replace("%", "%%")
                stamp_style = hanko_stamp.TextStampStyle(stamp_text=stamp_text)
                sig_field_spec = fields.SigFieldSpec(
                    sig_field_name=request.field_name, on_page=request.page_number - 1,
                    box=(request.x1_pt, request.y1_pt, request.x2_pt, request.y2_pt),
                )
                pdf_signer = signers.PdfSigner(
                    signature_meta, signer=signer, stamp_style=stamp_style, new_field_spec=sig_field_spec,
                )
                with open(tmp_out, "wb") as outf:
                    pdf_signer.sign_pdf(incremental_writer, output=outf)
            else:
                with open(tmp_out, "wb") as outf:
                    signers.sign_pdf(incremental_writer, signature_meta, signer=signer, output=outf)

        if not tmp_out.exists() or tmp_out.stat().st_size == 0:
            raise RuntimeError("pyHanko terminou sem erro, mas não produziu um arquivo assinado válido.")
        final_path = resolve_output_path(request.output_path, request.overwrite_behavior)
        final_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(tmp_out), str(final_path))

    if progress_cb:
        progress_cb(1, 1)

    return DigitalSignatureResult(
        output_path=final_path, signer_common_name=signer_cn,
        signing_time_utc=_dt.datetime.now(_dt.timezone.utc).isoformat(), visible=request.visible,
        duration_seconds=time.monotonic() - started,
        notes=[
            "Assinatura digital criptográfica real (CMS/PKCS#7), gerada via pyHanko a partir do certificado "
            "PFX/P12 informado. Verifique a validade em um leitor de PDF compativel (ex.: Adobe Acrobat) — o "
            "resultado ('confiavel' ou não) depende da cadeia de certificacao do certificado usado neste "
            "computador. Certificados de teste autoassinados aparecerao corretamente como 'não confiavel', "
            "o que e o comportamento esperado (não e um defeito desta ferramenta).",
        ],
    )


def run_verify_digital_signatures(request: VerifySignaturesRequest) -> VerifySignaturesResult:
    """Verificação criptográfica real (não apenas 'existe uma assinatura?')
    via pyHanko: recalcula o hash do conteudo assinado e valida a cadeia de
    certificacao contra as autoridades confiaveis do sistema."""
    _fields, _signers, validation, _IncrementalPdfFileWriter, HankoPdfFileReader, _hanko_stamp = _require_pyhanko()

    signatures: list[SignatureInfo] = []
    with open(request.source_path, "rb") as f:
        reader = HankoPdfFileReader(f)
        embedded = list(reader.embedded_signatures)
        for sig in embedded:
            try:
                status = validation.validate_pdf_signature(sig)
                signer_cn = None
                try:
                    signer_cn = status.signing_cert.subject.native.get("common_name")
                except Exception:  # noqa: BLE001
                    pass
                signing_time = None
                if getattr(status, "signer_reported_dt", None) is not None:
                    signing_time = status.signer_reported_dt.isoformat()
                signatures.append(SignatureInfo(
                    field_name=sig.field_name, signer_common_name=signer_cn, signing_time_utc=signing_time,
                    intact=bool(status.intact), document_modified_after_signing=(status.coverage.name != "ENTIRE_FILE" if hasattr(status.coverage, "name") else False),
                    trusted=bool(status.trusted), overall_ok=bool(status.bottom_line),
                ))
            except Exception as exc:  # noqa: BLE001
                signatures.append(SignatureInfo(
                    field_name=getattr(sig, "field_name", "?"), signer_common_name=None, signing_time_utc=None,
                    intact=False, document_modified_after_signing=False, trusted=False, overall_ok=False,
                ))

    return VerifySignaturesResult(source_path=request.source_path, total_signatures=len(signatures), signatures=signatures)


# =============================================================================
# 17) DEPENDENCIAS OPCIONAIS (deteccao apenas; nunca derruba a aplicação)
# =============================================================================
@dataclass
class OptionalDependencyStatus:
    name: str
    found: bool
    path: Optional[str] = None
    version: Optional[str] = None
    used_for: str = ""


def _probe_cli_tool(command: str, version_args: list[str], used_for: str) -> OptionalDependencyStatus:
    path = shutil.which(command)
    if not path:
        return OptionalDependencyStatus(name=command, found=False, used_for=used_for)
    version = None
    try:
        out = subprocess.run([path, *version_args], capture_output=True, text=True, timeout=5, shell=False)
        combined = (out.stdout or out.stderr or "").strip()
        version = combined.splitlines()[0] if combined else None
    except Exception:  # noqa: BLE001
        pass
    return OptionalDependencyStatus(name=command, found=True, path=path, version=version, used_for=used_for)


def _probe_python_package(module_name: str, used_for: str) -> OptionalDependencyStatus:
    import importlib.util

    spec = importlib.util.find_spec(module_name)
    return OptionalDependencyStatus(name=module_name, found=spec is not None, used_for=used_for)


def _run_subprocess_cancellable(
    args: list[str],
    cancel_check: Optional[CancelCheck] = None,
    timeout_seconds: float = 300.0,
    poll_interval: float = 0.25,
) -> tuple[int, str, str]:
    """Executa uma ferramenta externa com segurança (regra da secao 26):
    lista de argumentos (nunca uma string concatenada), ``shell=False``,
    caminho do executavel ja resolvido pelo chamador via ``shutil.which``,
    tempo limite total e cancelamento cooperativo. Em vez de bloquear em um
    único ``subprocess.run(timeout=...)``, faz polling periodico via
    ``Popen.communicate(timeout=poll_interval)`` (retentar após
    ``TimeoutExpired`` e seguro, conforme a documentacao do modulo
    ``subprocess``), permitindo verificar ``cancel_check`` entre uma
    tentativa e outra e encerrar o processo (terminate, com kill de
    segurança) caso o usuário cancele a tarefa."""
    if not args or not args[0]:
        raise ExternalToolError("Comando externo inválido (lista de argumentos vazia).")
    proc = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, shell=False)
    started = time.monotonic()
    while True:
        try:
            stdout_data, stderr_data = proc.communicate(timeout=poll_interval)
            return proc.returncode, stdout_data or "", stderr_data or ""
        except subprocess.TimeoutExpired:
            if cancel_check and cancel_check():
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()
                raise OperationCancelled()
            if time.monotonic() - started > timeout_seconds:
                proc.kill()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    pass
                raise ExternalToolError(
                    f"'{args[0]}' excedeu o tempo limite de {timeout_seconds:.0f}s e foi encerrado."
                )


def check_optional_dependencies() -> list[OptionalDependencyStatus]:
    """Pode disparar ate alguns ``subprocess.run(..., timeout=5)``; so deve
    ser chamada explicitamente (nunca automaticamente ao abrir uma tela),
    ver ``DiagnosticsDialog``."""
    return [
        _probe_cli_tool("qpdf", ["--version"], "Verificação/reparo estrutural de PDF na tela Avançado (implementado)"),
        _probe_cli_tool("gs", ["--version"], "Compactação avancada de imagens na tela Otimizar PDF (implementado) e PDF/A (Nível 3, não implementado)"),
        _probe_cli_tool("tesseract", ["--version"], "OCR local na tela OCR (implementado; usado diretamente se o OCRmyPDF não estiver instalado)"),
        _probe_cli_tool("ocrmypdf", ["--version"], "Orquestracao de OCR na tela OCR (implementado; preferido quando presente)"),
        _probe_cli_tool("soffice", ["--version"], "Conversão Office para PDF na tela Converter PDF (implementado)"),
        _probe_python_package("pyhanko", "Assinatura digital criptográfica e verificação na tela Assinaturas (implementado)"),
        _probe_python_package("cv2", "Processamento de imagem avançado / OpenCV (Nível 3, não implementado)"),
        _probe_python_package("weasyprint", "HTML para PDF (Nível 3, não implementado)"),
    ]


def _redact_home_dir(path: Path) -> str:
    text = str(path)
    home = str(Path.home())
    return ("~" + text[len(home):]) if text.startswith(home) else text


def build_base_diagnostics_report() -> str:
    """Rapido, sem subprocessos: seguro para chamar sempre."""
    vm = psutil.virtual_memory()
    disk = psutil.disk_usage(os.path.abspath(os.sep))
    lines = [
        f"{APP_DISPLAY_NAME} v{APP_VERSION}",
        f"Python: {sys.version.split()[0]} ({platform.architecture()[0]})",
        f"Sistema operacional: {platform.system()} {platform.release()} ({platform.machine()})",
        f"Memória disponivel: {vm.available // (1024 * 1024)} MB de {vm.total // (1024 * 1024)} MB",
        f"Espaco em disco livre: {disk.free // (1024 ** 3)} GB",
        f"Pasta de configuracao: {_redact_home_dir(_CONFIG_DIR)}",
        f"Pasta de logs: {_redact_home_dir(_LOG_DIR)}",
    ]
    return "\n".join(lines)


def build_optional_dependencies_report() -> str:
    lines = ["Dependencias opcionais (Nível 2/3, para fases futuras):"]
    for dep in check_optional_dependencies():
        if dep.found:
            extra = f" em {_redact_home_dir(Path(dep.path))}" if dep.path else ""
            version_txt = f" ({dep.version})" if dep.version else ""
            status = f"encontrado{extra}{version_txt}"
        else:
            status = "NÃO ENCONTRADO"
        lines.append(f"  - {dep.name}: {status} — {dep.used_for}")
    return "\n".join(lines)


# =============================================================================
# 18) WORKERS (segundo plano; nunca tocam widgets diretamente)
# =============================================================================
class WorkerSignals(QObject):
    progress = Signal(int, int)
    finished = Signal(object)
    error = Signal(str)
    cancelled = Signal()


class TaskWorker(QRunnable):
    def __init__(self, fn: Callable[..., Any], *args, **kwargs):
        super().__init__()
        self.fn = fn
        self.args = args
        self.kwargs = kwargs
        self.signals = WorkerSignals()
        self._cancel_requested = False

    def request_cancel(self) -> None:
        self._cancel_requested = True

    def _is_cancelled(self) -> bool:
        return self._cancel_requested

    @Slot()
    def run(self) -> None:
        try:
            kwargs = dict(self.kwargs)
            kwargs.setdefault("progress_cb", lambda done, total: self.signals.progress.emit(done, total))
            kwargs.setdefault("cancel_check", self._is_cancelled)
            try:
                result = self.fn(*self.args, **kwargs)
            except TypeError:
                # Alguns serviços (ex.: run_reorder) não aceitam
                # progress_cb/cancel_check porque a operação e curta demais
                # para justificar progresso incremental.
                kwargs.pop("progress_cb", None)
                kwargs.pop("cancel_check", None)
                result = self.fn(*self.args, **kwargs)
        except OperationCancelled:
            self.signals.cancelled.emit()
        except Exception as exc:  # noqa: BLE001 - o worker precisa capturar tudo
            logger.exception("Falha ao executar tarefa em segundo plano")
            self.signals.error.emit(_friendly_error_message(exc))
        else:
            self.signals.finished.emit(result)


def _friendly_error_message(exc: Exception) -> str:
    name = type(exc).__name__
    if name == "PdfPasswordRequired":
        return "O arquivo esta protegido por senha. Informe a senha correta e tente novamente."
    if name == "PdfOpenError":
        return f"Não foi possível abrir o arquivo: {exc}"
    if name == "PageRangeError":
        return f"Expressao de páginas inválida: {exc}"
    return f"Ocorreu um erro ao processar o arquivo: {exc}"


# =============================================================================
# 19) FILA DE TAREFAS (processamento em lote)
# =============================================================================
_job_id_counter = itertools.count(1)


@dataclass
class Job:
    id: int
    label: str
    fn: Callable[..., Any]
    args: tuple
    kwargs: dict
    status: JobStatus = JobStatus.QUEUED
    result: Any = None
    error_message: Optional[str] = None
    progress_done: int = 0
    progress_total: int = 0
    worker: Optional[TaskWorker] = field(default=None, repr=False)


class JobQueue(QObject):
    job_status_changed = Signal(int, str)
    job_progress = Signal(int, int, int)
    all_finished = Signal()

    def __init__(self, max_concurrent: int = 2, parent: Optional[QObject] = None):
        super().__init__(parent)
        self._pool = QThreadPool()
        self._pool.setMaxThreadCount(max(1, max_concurrent))
        self._jobs: dict[int, Job] = {}

    def set_max_concurrent(self, n: int) -> None:
        self._pool.setMaxThreadCount(max(1, n))

    def add_job(self, fn: Callable[..., Any], *args, label: str = "", **kwargs) -> int:
        job_id = next(_job_id_counter)
        self._jobs[job_id] = Job(id=job_id, label=label or f"Tarefa {job_id}", fn=fn, args=args, kwargs=kwargs)
        return job_id

    def jobs(self) -> list[Job]:
        return list(self._jobs.values())

    def start_all(self) -> None:
        for job in self._jobs.values():
            if job.status is JobStatus.QUEUED:
                self._start_job(job)

    def _start_job(self, job: Job) -> None:
        worker = TaskWorker(job.fn, *job.args, **job.kwargs)
        job.worker = worker
        job.status = JobStatus.RUNNING
        self.job_status_changed.emit(job.id, job.status.value)

        worker.signals.progress.connect(lambda done, total, jid=job.id: self._on_progress(jid, done, total))
        worker.signals.finished.connect(lambda result, jid=job.id: self._on_finished(jid, result))
        worker.signals.error.connect(lambda msg, jid=job.id: self._on_error(jid, msg))
        worker.signals.cancelled.connect(lambda jid=job.id: self._on_cancelled(jid))
        self._pool.start(worker)

    def _on_progress(self, job_id: int, done: int, total: int) -> None:
        job = self._jobs[job_id]
        job.progress_done, job.progress_total = done, total
        self.job_progress.emit(job_id, done, total)

    def _on_finished(self, job_id: int, result: Any) -> None:
        job = self._jobs[job_id]
        job.status, job.result = JobStatus.DONE, result
        self.job_status_changed.emit(job_id, job.status.value)
        self._maybe_emit_all_finished()

    def _on_error(self, job_id: int, message: str) -> None:
        job = self._jobs[job_id]
        job.status, job.error_message = JobStatus.FAILED, message
        logger.warning("Tarefa %s falhou: %s", job_id, message)
        self.job_status_changed.emit(job_id, job.status.value)
        self._maybe_emit_all_finished()

    def _on_cancelled(self, job_id: int) -> None:
        job = self._jobs[job_id]
        job.status = JobStatus.CANCELLED
        self.job_status_changed.emit(job_id, job.status.value)
        self._maybe_emit_all_finished()

    def _maybe_emit_all_finished(self) -> None:
        if all(j.status in (JobStatus.DONE, JobStatus.FAILED, JobStatus.CANCELLED) for j in self._jobs.values()):
            self.all_finished.emit()

    def cancel_job(self, job_id: int) -> None:
        job = self._jobs.get(job_id)
        if job and job.worker and job.status is JobStatus.RUNNING:
            job.worker.request_cancel()

    def cancel_all(self) -> None:
        for job in self._jobs.values():
            self.cancel_job(job.id)

    def retry_job(self, job_id: int) -> None:
        job = self._jobs.get(job_id)
        if job and job.status in (JobStatus.FAILED, JobStatus.CANCELLED):
            job.status, job.error_message = JobStatus.QUEUED, None
            job.progress_done = job.progress_total = 0
            self._start_job(job)

    def remove_job(self, job_id: int) -> None:
        job = self._jobs.get(job_id)
        if job and job.status is JobStatus.RUNNING:
            raise ValueError("Não e possível remover uma tarefa em execucao; cancele-a primeiro.")
        self._jobs.pop(job_id, None)

    def summary_report(self) -> dict[str, list[str]]:
        report: dict[str, list[str]] = {"sucesso": [], "falha": [], "cancelado": []}
        for job in self._jobs.values():
            if job.status is JobStatus.DONE:
                report["sucesso"].append(job.label)
            elif job.status is JobStatus.FAILED:
                report["falha"].append(f"{job.label}: {job.error_message}")
            elif job.status is JobStatus.CANCELLED:
                report["cancelado"].append(job.label)
        return report


# =============================================================================
# 20) DESIGN SYSTEM (paleta, metricas, tipografia, icones vetoriais e QSS)
#
# Toda a identidade visual do aplicativo fica centralizada aqui: nenhuma cor
# deve ser espalhada como string solta pelo resto do arquivo. Widgets pedem
# cores/metricas a ``UiMetrics``/``current_ui_colors()`` e icones a
# ``make_icon()``. Nada disto depende de arquivos, imagens ou QSS externos —
# os icones são desenhados em memória com QPainter/QPainterPath.
# =============================================================================
class UiMetrics:
    """Constantes de espacamento, raio e tamanho usadas em toda a interface,
    para reduzir numeros magicos repetidos e manter consistencia visual."""

    SPACE_XS = 4
    SPACE_SM = 8
    SPACE_MD = 12
    SPACE_LG = 16
    SPACE_XL = 24

    RADIUS_SM = 6
    RADIUS_MD = 10
    RADIUS_LG = 14

    CONTROL_HEIGHT = 34
    CONTROL_HEIGHT_LG = 40
    SIDEBAR_WIDTH = 214

    ICON_SM = 16
    ICON_MD = 20
    ICON_DEFAULT = 24
    ICON_LG = 32

    FONT_TITLE_XL = 26
    FONT_TITLE_SCREEN = 21
    FONT_TITLE_SECTION = 16
    FONT_BODY = 13
    FONT_AUX = 12
    FONT_STATUS = 11


@dataclass(frozen=True)
class UiColors:
    """Uma paleta de cores completa (tema claro OU escuro). Nunca misturar
    campos de temas diferentes — sempre usar a instancia de
    ``current_ui_colors()``, que reflete o tema ativo no momento."""

    dark: bool
    bg: str
    surface: str
    surface2: str
    text: str
    text2: str
    border: str
    accent: str
    accent_hover: str
    success: str
    warning: str
    danger: str
    info: str


UI_COLORS_LIGHT = UiColors(
    dark=False,
    bg="#F5F7FA", surface="#FFFFFF", surface2="#EEF2F5",
    text="#182125", text2="#5F6B72", border="#DCE3E8",
    accent="#147D82", accent_hover="#10666A",
    success="#27845A", warning="#B7791F", danger="#B83A3A", info="#356FA8",
)

UI_COLORS_DARK = UiColors(
    dark=True,
    bg="#111619", surface="#192024", surface2="#222B30",
    text="#EDF3F5", text2="#AAB6BC", border="#303B41",
    accent="#35A4A7", accent_hover="#47B8BB",
    success="#51AE7C", warning="#D7A84B", danger="#E16969", info="#6EA6D8",
)

_CURRENT_UI_COLORS: UiColors = UI_COLORS_LIGHT

# Mantidos para compatibilidade com qualquer leitura antiga do modulo.
_ACCENT = UI_COLORS_LIGHT.accent
_ACCENT_DARK = UI_COLORS_LIGHT.accent_hover


def current_ui_colors() -> UiColors:
    """Paleta do tema atualmente ativo. Widgets que desenham algo por conta
    própria (icones, indicadores) devem consultar esta funcao em vez de usar
    cores fixas, para permanecerem corretos ao trocar de tema."""
    return _CURRENT_UI_COLORS


_FONT_FAMILY_CANDIDATES = ["Segoe UI Variable", "Segoe UI", "Ubuntu", "Noto Sans", "sans-serif"]


def ui_font(size: int, *, weight: QFont.Weight = QFont.Weight.Normal, italic: bool = False) -> QFont:
    """Cria uma QFont com a familia preferida do design system (com
    fallback automático do próprio Qt caso 'Segoe UI' não exista no SO,
    como e o caso em Linux/macOS)."""
    font = QFont(_FONT_FAMILY_CANDIDATES[0])
    font.setFamilies(_FONT_FAMILY_CANDIDATES)
    font.setPixelSize(size)
    font.setWeight(weight)
    font.setItalic(italic)
    return font


# --- Sistema de icones vetoriais (desenhados em memória, sem arquivos) -----
_ICON_CACHE: dict[tuple[str, str, int], QIcon] = {}


def _paint_icon_glyph(painter: QPainter, kind: str) -> None:
    """Desenha o glifo ``kind`` em uma grade logica de 24x24 unidades. O
    QPainter recebido ja esta escalado para o pixmap de destino e com a
    caneta/pincel corretos configurados pelo chamador."""
    line = painter.drawLine
    ellipse = painter.drawEllipse
    rrect = painter.drawRoundedRect

    if kind == "home":
        line(3, 12, 12, 4); line(12, 4, 21, 12)
        rrect(6, 12, 12, 9, 1, 1)
        line(10, 21, 10, 16); line(14, 16, 14, 21)
    elif kind == "split":
        rrect(3, 3, 8, 18, 2, 2)
        rrect(13, 3, 8, 18, 2, 2)
        painter.save()
        pen = painter.pen(); pen.setStyle(Qt.PenStyle.DashLine); painter.setPen(pen)
        line(12, 3, 12, 21)
        painter.restore()
    elif kind in ("merge", "organize"):
        line(6, 4, 6, 12); line(18, 4, 18, 12)
        line(6, 12, 12, 17); line(18, 12, 12, 17)
        rrect(8, 16, 8, 5, 1, 1)
    elif kind == "optimize":
        ellipse(4, 4, 15, 15)
        line(11, 11, 20, 20)
        line(20, 20, 20, 15); line(20, 20, 15, 20)
    elif kind == "convert":
        line(4, 8, 15, 8); line(12, 5, 15, 8); line(12, 11, 15, 8)
        line(20, 16, 9, 16); line(12, 13, 9, 16); line(12, 19, 9, 16)
    elif kind == "edit":
        line(5, 19, 9, 19)
        line(6, 15, 16, 5); line(16, 5, 19, 8); line(19, 8, 9, 18); line(6, 15, 9, 18)
    elif kind == "ocr":
        ellipse(3, 3, 11, 11)
        line(12, 12, 20, 20)
        line(6, 6, 11, 6); line(6, 9, 10, 9)
    elif kind == "security":
        line(12, 3, 5, 6); line(5, 6, 5, 12); line(5, 12, 12, 21)
        line(12, 21, 19, 12); line(19, 12, 19, 6); line(19, 6, 12, 3)
        line(9, 12, 11, 15); line(11, 15, 16, 8)
    elif kind == "signatures":
        line(4, 20, 20, 20)
        line(5, 15, 7, 11); line(7, 11, 9, 15); line(9, 15, 11, 7)
        line(11, 7, 14, 15); line(14, 15, 16, 10); line(16, 10, 19, 15)
    elif kind == "advanced":
        ellipse(9, 9, 6, 6)
        for angle_deg in range(0, 360, 45):
            radians = math.radians(angle_deg)
            x1, y1 = 12 + math.cos(radians) * 7.5, 12 + math.sin(radians) * 7.5
            x2, y2 = 12 + math.cos(radians) * 10.5, 12 + math.sin(radians) * 10.5
            line(int(x1), int(y1), int(x2), int(y2))
    elif kind in ("open", "folder"):
        line(4, 8, 4, 18); line(4, 18, 20, 18); line(20, 18, 20, 10)
        line(20, 10, 10, 10); line(10, 10, 8, 8); line(8, 8, 4, 8)
    elif kind == "save":
        rrect(4, 4, 16, 16, 2, 2)
        rrect(7, 4, 10, 6, 1, 1)
        rrect(7, 14, 10, 6, 1, 1)
    elif kind == "run":
        path = QPainterPath(); path.moveTo(7, 5); path.lineTo(19, 12); path.lineTo(7, 19); path.closeSubpath()
        painter.drawPath(path)
    elif kind == "cancel":
        line(6, 6, 18, 18); line(18, 6, 6, 18)
    elif kind == "delete":
        line(5, 7, 19, 7); line(9, 7, 9, 4); line(9, 4, 15, 4); line(15, 4, 15, 7)
        line(7, 7, 8, 20); line(8, 20, 16, 20); line(16, 20, 17, 7)
        line(10, 10, 10, 17); line(14, 10, 14, 17)
    elif kind == "duplicate":
        rrect(4, 6, 12, 14, 2, 2)
        rrect(8, 3, 12, 14, 2, 2)
    elif kind == "rotate":
        painter.drawArc(4, 4, 16, 16, 40 * 16, 260 * 16)
        line(17, 5, 20, 7); line(17, 5, 15, 8)
    elif kind == "add":
        line(12, 5, 12, 19); line(5, 12, 19, 12)
    elif kind == "verify":
        ellipse(3, 3, 18, 18)
        line(8, 12, 11, 16); line(11, 16, 17, 8)
    elif kind == "settings":
        ellipse(9, 9, 6, 6)
        for angle_deg in range(0, 360, 30):
            radians = math.radians(angle_deg)
            x1, y1 = 12 + math.cos(radians) * 8, 12 + math.sin(radians) * 8
            x2, y2 = 12 + math.cos(radians) * 10, 12 + math.sin(radians) * 10
            line(int(x1), int(y1), int(x2), int(y2))
    elif kind == "help":
        ellipse(3, 3, 18, 18)
        line(9, 9, 9, 8.9)
        path = QPainterPath(); path.moveTo(9, 9); path.cubicTo(9, 6, 15, 6, 15, 9)
        path.cubicTo(15, 11, 12, 11, 12, 14)
        painter.drawPath(path)
        painter.save(); painter.setBrush(QColor(painter.pen().color())); painter.drawEllipse(11, 17, 2, 2); painter.restore()
    elif kind == "search":
        ellipse(3, 3, 12, 12)
        line(14, 14, 20, 20)
    elif kind == "clear":
        ellipse(3, 3, 18, 18)
        line(9, 9, 15, 15); line(15, 9, 9, 15)
    elif kind == "chevron":
        line(9, 5, 16, 12); line(16, 12, 9, 19)
    elif kind == "close":
        line(6, 6, 18, 18); line(18, 6, 6, 18)
    elif kind == "info":
        ellipse(3, 3, 18, 18)
        line(12, 11, 12, 17)
        painter.save(); painter.setBrush(QColor(painter.pen().color())); painter.drawEllipse(11, 7, 2, 2); painter.restore()
    elif kind == "success":
        ellipse(3, 3, 18, 18)
        line(7, 12, 11, 16); line(11, 16, 17, 8)
    elif kind == "warning":
        path = QPainterPath(); path.moveTo(12, 3); path.lineTo(21, 20); path.lineTo(3, 20); path.closeSubpath()
        painter.drawPath(path)
        line(12, 10, 12, 15)
        painter.save(); painter.setBrush(QColor(painter.pen().color())); painter.drawEllipse(11, 16.5, 2, 2); painter.restore()
    elif kind == "error":
        ellipse(3, 3, 18, 18)
        line(9, 9, 15, 15); line(15, 9, 9, 15)
    else:
        ellipse(9, 9, 6, 6)  # icone generico (kind desconhecido) — nunca quebra a UI


def make_icon(kind: str, color_hex: str, size: int = 24) -> QIcon:
    """Constroi (com cache) um QIcon vetorial desenhado em memória para o
    glifo ``kind`` na cor ``color_hex``. Sem dependencia de arquivos ou
    imagens externas; funciona identicamente em tema claro e escuro desde
    que se passe a cor correta do tema ativo."""
    cache_key = (kind, color_hex, size)
    cached = _ICON_CACHE.get(cache_key)
    if cached is not None:
        return cached

    icon = QIcon()
    for pixel_size in sorted({size, 16, 20, 24, 32}):
        pixmap = QPixmap(pixel_size, pixel_size)
        pixmap.fill(Qt.GlobalColor.transparent)
        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        scale = pixel_size / 24.0
        painter.scale(scale, scale)
        pen = QPen(QColor(color_hex))
        pen.setWidthF(1.8)
        pen.setCapStyle(Qt.PenCapStyle.RoundCap)
        pen.setJoinStyle(Qt.PenJoinStyle.RoundJoin)
        painter.setPen(pen)
        painter.setBrush(Qt.BrushStyle.NoBrush)
        _paint_icon_glyph(painter, kind)
        painter.end()
        icon.addPixmap(pixmap)
    _ICON_CACHE[cache_key] = icon
    return icon


# --- Folha de estilo (QSS) --------------------------------------------------
def _build_stylesheet(colors: UiColors) -> str:
    c = colors
    m = UiMetrics
    disabled_text = c.text2
    field_bg = c.surface if not c.dark else c.surface2
    return f"""
* {{ outline: none; }}
QWidget {{ background-color: {c.bg}; color: {c.text}; font-family: 'Segoe UI Variable', 'Segoe UI', sans-serif; font-size: {m.FONT_BODY}px; }}
QMainWindow {{ background-color: {c.bg}; }}
QToolTip {{ background-color: {c.surface2}; color: {c.text}; border: 1px solid {c.border}; padding: 4px 8px; border-radius: {m.RADIUS_SM}px; }}

/* --- Cabecalho / barra lateral --- */
#AppHeader {{ background-color: {c.surface}; border-bottom: 1px solid {c.border}; }}
#Sidebar {{ background-color: {c.surface}; border: none; border-right: 1px solid {c.border}; padding: {m.SPACE_SM}px 0px; outline: none; }}
#Sidebar::item {{ padding: 9px {m.SPACE_MD}px; margin: 1px {m.SPACE_SM}px; border-radius: {m.RADIUS_SM}px; color: {c.text2}; }}
#Sidebar::item:hover {{ background-color: {c.surface2}; color: {c.text}; }}
#Sidebar::item:selected {{ background-color: {c.accent}; color: #FFFFFF; font-weight: 600; }}
#SidebarBrand {{ font-weight: 600; font-size: {m.FONT_TITLE_SECTION}px; padding: {m.SPACE_SM}px {m.SPACE_MD}px 0px {m.SPACE_MD}px; }}
#SidebarSubtitle {{ color: {c.text2}; font-size: {m.FONT_STATUS}px; padding: 0px {m.SPACE_MD}px {m.SPACE_MD}px {m.SPACE_MD}px; }}

/* --- Cartoes e superficies --- */
#ToolCard {{ background-color: {c.surface}; border: 1px solid {c.border}; border-radius: {m.RADIUS_MD}px; }}
#ToolCard:hover {{ border: 1px solid {c.accent}; background-color: {c.surface2}; }}
#ToolCard:focus {{ border: 2px solid {c.accent}; }}
#ToolCard[available="false"] {{ background-color: {c.surface}; }}
#SectionHeading {{ color: {c.text2}; font-weight: 600; font-size: {m.FONT_STATUS}px; letter-spacing: 1px; }}
#ScreenTitle {{ font-weight: 600; font-size: {m.FONT_TITLE_SCREEN}px; }}
#ScreenSubtitle {{ color: {c.text2}; font-size: {m.FONT_AUX}px; }}
#LocalBadge {{ color: {c.accent}; font-weight: 600; font-size: {m.FONT_STATUS}px; }}
QGroupBox {{ background-color: {c.surface}; border: 1px solid {c.border}; border-radius: {m.RADIUS_MD}px; margin-top: 14px; padding-top: {m.SPACE_SM}px; font-weight: 600; }}
QGroupBox::title {{ subcontrol-origin: margin; left: {m.SPACE_MD}px; padding: 0px {m.SPACE_XS}px; color: {c.text}; }}
QScrollArea {{ border: none; background: transparent; }}
QScrollArea > QWidget > QWidget {{ background: transparent; }}
QScrollBar:vertical {{ background: transparent; width: 11px; margin: 2px; }}
QScrollBar::handle:vertical {{ background: {c.border}; border-radius: 5px; min-height: 24px; }}
QScrollBar::handle:vertical:hover {{ background: {c.text2}; }}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{ height: 0px; }}
QScrollBar:horizontal {{ background: transparent; height: 11px; margin: 2px; }}
QScrollBar::handle:horizontal {{ background: {c.border}; border-radius: 5px; min-width: 24px; }}

/* --- Botoes: secundario e o padrão; primario/perigo/texto via propriedade --- */
QPushButton {{
    background-color: {c.surface}; color: {c.text}; border: 1px solid {c.border};
    border-radius: {m.RADIUS_SM}px; padding: 6px {m.SPACE_MD}px; min-height: {m.CONTROL_HEIGHT}px;
}}
QPushButton:hover {{ background-color: {c.surface2}; border-color: {c.text2}; }}
QPushButton:pressed {{ background-color: {c.surface2}; }}
QPushButton:focus {{ border: 1px solid {c.accent}; }}
QPushButton:disabled {{ color: {disabled_text}; background-color: {c.surface}; border-color: {c.border}; }}
QPushButton[variant="primary"] {{ background-color: {c.accent}; color: #FFFFFF; border: 1px solid {c.accent}; font-weight: 600; }}
QPushButton[variant="primary"]:hover {{ background-color: {c.accent_hover}; border-color: {c.accent_hover}; }}
QPushButton[variant="primary"]:disabled {{ background-color: {c.surface2}; color: {disabled_text}; border-color: {c.border}; }}
QPushButton[variant="danger"] {{ background-color: transparent; color: {c.danger}; border: 1px solid {c.danger}; font-weight: 600; }}
QPushButton[variant="danger"]:hover {{ background-color: {c.danger}; color: #FFFFFF; }}
QPushButton[variant="text"] {{ background-color: transparent; border: none; color: {c.accent}; font-weight: 600; padding: 4px 6px; min-height: 0px; }}
QPushButton[variant="text"]:hover {{ text-decoration: underline; }}
QToolButton {{ background-color: transparent; border: none; border-radius: {m.RADIUS_SM}px; padding: 4px; }}
QToolButton:hover {{ background-color: {c.surface2}; }}

/* --- Campos --- */
QLineEdit, QComboBox, QSpinBox, QDoubleSpinBox, QPlainTextEdit, QTextEdit {{
    background-color: {field_bg}; color: {c.text}; border: 1px solid {c.border};
    border-radius: {m.RADIUS_SM}px; padding: 6px {m.SPACE_SM}px; selection-background-color: {c.accent}; selection-color: #FFFFFF;
}}
QLineEdit, QComboBox, QSpinBox, QDoubleSpinBox {{ min-height: {m.CONTROL_HEIGHT - 12}px; }}
QLineEdit:focus, QComboBox:focus, QSpinBox:focus, QDoubleSpinBox:focus, QPlainTextEdit:focus, QTextEdit:focus {{ border: 1px solid {c.accent}; }}
QLineEdit:disabled, QComboBox:disabled, QSpinBox:disabled, QDoubleSpinBox:disabled {{ color: {disabled_text}; background-color: {c.surface}; }}
QLineEdit[hasError="true"] {{ border: 1px solid {c.danger}; }}
QComboBox::drop-down {{ border: none; width: 22px; }}
QComboBox QAbstractItemView {{ background-color: {c.surface}; color: {c.text}; border: 1px solid {c.border}; selection-background-color: {c.accent}; selection-color: #FFFFFF; }}
QCheckBox {{ spacing: {m.SPACE_SM}px; }}
QCheckBox::indicator {{ width: 17px; height: 17px; border-radius: 4px; border: 1px solid {c.border}; background-color: {field_bg}; }}
QCheckBox::indicator:checked {{ background-color: {c.accent}; border-color: {c.accent}; }}
QCheckBox:disabled {{ color: {disabled_text}; }}
QSlider::groove:horizontal {{ height: 5px; background: {c.border}; border-radius: 2px; }}
QSlider::handle:horizontal {{ background: {c.accent}; width: 15px; height: 15px; margin: -6px 0; border-radius: 7px; }}

/* --- Abas --- */
QTabWidget::pane {{ border: 1px solid {c.border}; border-radius: {m.RADIUS_MD}px; top: -1px; background-color: {c.surface}; }}
QTabBar::tab {{
    background-color: transparent; color: {c.text2}; padding: 8px {m.SPACE_MD}px; margin-right: 2px;
    border-top-left-radius: {m.RADIUS_SM}px; border-top-right-radius: {m.RADIUS_SM}px;
}}
QTabBar::tab:selected {{ color: {c.text}; background-color: {c.surface}; border: 1px solid {c.border}; border-bottom: none; font-weight: 600; }}
QTabBar::tab:hover:!selected {{ color: {c.text}; }}

/* --- Listas --- */
QListWidget, QTreeWidget {{ background-color: {c.surface}; border: 1px solid {c.border}; border-radius: {m.RADIUS_MD}px; alternate-background-color: {c.surface2}; }}
QListWidget::item, QTreeWidget::item {{ padding: 5px; border-radius: {m.RADIUS_SM}px; }}
QListWidget::item:selected, QTreeWidget::item:selected {{ background-color: {c.accent}; color: #FFFFFF; }}
QListWidget::item:hover:!selected {{ background-color: {c.surface2}; }}
#Sidebar {{ alternate-background-color: transparent; }}

/* --- Progresso e status --- */
QProgressBar {{ background-color: {c.surface2}; border: 1px solid {c.border}; border-radius: {m.RADIUS_SM}px; text-align: center; color: {c.text}; min-height: 18px; }}
QProgressBar::chunk {{ background-color: {c.accent}; border-radius: {m.RADIUS_SM}px; }}
QStatusBar {{ background-color: {c.surface}; border-top: 1px solid {c.border}; color: {c.text2}; }}
QStatusBar::item {{ border: none; }}

/* --- Menus e dialogos --- */
QMenuBar {{ background-color: {c.surface}; color: {c.text}; border-bottom: 1px solid {c.border}; }}
QMenuBar::item:selected {{ background-color: {c.surface2}; border-radius: {m.RADIUS_SM}px; }}
QMenu {{ background-color: {c.surface}; color: {c.text}; border: 1px solid {c.border}; border-radius: {m.RADIUS_SM}px; padding: 4px; }}
QMenu::item {{ padding: 6px {m.SPACE_MD}px; border-radius: {m.RADIUS_SM}px; }}
QMenu::item:selected {{ background-color: {c.accent}; color: #FFFFFF; }}
QDialog {{ background-color: {c.bg}; }}
QMessageBox {{ background-color: {c.bg}; }}

/* --- Área de arrastar/soltar --- */
#DropArea {{ border: 2px dashed {c.border}; border-radius: {m.RADIUS_LG}px; background-color: {c.surface}; }}
#DropArea[dropState="drag"] {{ border: 2px dashed {c.accent}; background-color: {c.surface2}; }}
#DropArea[dropState="accepted"] {{ border: 2px solid {c.success}; background-color: {c.surface}; }}
#DropArea[dropState="rejected"] {{ border: 2px dashed {c.danger}; background-color: {c.surface}; }}
#DropAreaTitle {{ font-weight: 600; font-size: {m.FONT_TITLE_SECTION - 1}px; }}
#DropAreaHint {{ color: {c.text2}; font-size: {m.FONT_AUX}px; }}

/* --- Alertas embutidos --- */
#InlineAlert {{ border-radius: {m.RADIUS_MD}px; border: 1px solid {c.border}; background-color: {c.surface2}; }}
#InlineAlert[level="info"] {{ border-color: {c.info}; }}
#InlineAlert[level="success"] {{ border-color: {c.success}; }}
#InlineAlert[level="warning"] {{ border-color: {c.warning}; }}
#InlineAlert[level="error"] {{ border-color: {c.danger}; }}
#InlineAlertTitle {{ font-weight: 600; }}
#InlineAlertMessage {{ color: {c.text2}; }}

/* --- Resultado de operação --- */
#ResultCard {{ background-color: {c.surface2}; border: 1px solid {c.border}; border-radius: {m.RADIUS_MD}px; }}

/* --- Superficie de pre-visualizacao --- */
#PreviewSurface {{ background-color: {c.surface2}; border: 1px solid {c.border}; border-radius: {m.RADIUS_MD}px; color: {c.text2}; }}
"""


def _system_prefers_dark(app: QApplication) -> bool:
    return app.palette().color(QPalette.ColorRole.Window).lightness() < 128


def apply_theme(app: QApplication, theme: Theme) -> UiColors:
    """Aplica o tema (claro/escuro/sistema) globalmente via QSS e retorna a
    paleta ativa resultante, para que a janela principal possa atualizar
    icones/decoracoes desenhadas em Python (que não são alcancadas por QSS)."""
    global _CURRENT_UI_COLORS
    app.setStyle("Fusion")
    use_dark = _system_prefers_dark(app) if theme is Theme.SYSTEM else (theme is Theme.DARK)
    _CURRENT_UI_COLORS = UI_COLORS_DARK if use_dark else UI_COLORS_LIGHT
    app.setStyleSheet(_build_stylesheet(_CURRENT_UI_COLORS))
    app.setFont(ui_font(UiMetrics.FONT_BODY))
    return _CURRENT_UI_COLORS


def mark_button_variant(button: QPushButton, variant: str) -> QPushButton:
    """Marca a hierarquia visual de um botao: 'primary' (única ação
    principal por tela), 'danger' (exclusao/limpeza definitiva) ou 'text'
    (ação discreta). Sem chamada = estilo 'secondary' (padrão neutro)."""
    button.setProperty("variant", variant)
    style = button.style()
    style.unpolish(button)
    style.polish(button)
    return button


# =============================================================================
# 21) WIDGETS
# =============================================================================
class ToolCard(QFrame):
    """Cartao clicavel da tela inicial: icone, titulo, descricao curta (no
    máximo poucas linhas), foco por teclado (Enter/Espaco ativa) e, quando
    indisponivel, uma explicacao objetiva em vez de so aparecer apagado."""

    clicked = Signal()

    def __init__(
        self,
        title: str,
        description: str,
        available: bool = True,
        icon_kind: Optional[str] = None,
        unavailable_reason: str = "",
        parent: Optional[QWidget] = None,
    ):
        super().__init__(parent)
        self.setObjectName("ToolCard")
        self.available = available
        self.setProperty("available", "true" if available else "false")
        self.setMinimumSize(224, 128)
        self.setMaximumHeight(140)
        self.setCursor(Qt.CursorShape.PointingHandCursor if available else Qt.CursorShape.ArrowCursor)
        self.setFocusPolicy(Qt.FocusPolicy.StrongFocus if available else Qt.FocusPolicy.NoFocus)
        self.setAccessibleName(title)
        self.setAccessibleDescription(description)

        colors = current_ui_colors()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(UiMetrics.SPACE_LG, UiMetrics.SPACE_MD, UiMetrics.SPACE_LG, UiMetrics.SPACE_MD)
        layout.setSpacing(UiMetrics.SPACE_XS)

        top_row = QHBoxLayout()
        top_row.setSpacing(UiMetrics.SPACE_SM)
        if icon_kind:
            icon_label = QLabel()
            icon_color = colors.accent if available else colors.text2
            icon_label.setPixmap(make_icon(icon_kind, icon_color, UiMetrics.ICON_DEFAULT).pixmap(UiMetrics.ICON_DEFAULT, UiMetrics.ICON_DEFAULT))
            top_row.addWidget(icon_label, 0)
        title_label = QLabel(title)
        title_label.setFont(ui_font(UiMetrics.FONT_TITLE_SECTION - 1, weight=QFont.Weight.DemiBold))
        title_label.setWordWrap(True)
        top_row.addWidget(title_label, 1)
        layout.addLayout(top_row)

        desc_label = QLabel(description)
        desc_label.setWordWrap(True)
        desc_label.setFont(ui_font(UiMetrics.FONT_AUX))
        desc_label.setStyleSheet(f"color: {colors.text2};")
        layout.addWidget(desc_label, 1)

        if not available:
            reason = unavailable_reason or "Indisponivel nesta instalação."
            badge = QLabel(f"Indisponivel — {reason}")
            badge.setWordWrap(True)
            badge.setStyleSheet(f"color: {colors.warning}; font-weight: 600; font-size: {UiMetrics.FONT_STATUS}px;")
            layout.addWidget(badge)
            self.setToolTip(reason)
            self.setEnabled(False)
        else:
            self.setToolTip(description)

    def mousePressEvent(self, event) -> None:  # noqa: N802
        if self.available:
            self.clicked.emit()
        super().mousePressEvent(event)

    def keyPressEvent(self, event) -> None:  # noqa: N802
        if self.available and event.key() in (Qt.Key.Key_Return, Qt.Key.Key_Enter, Qt.Key.Key_Space):
            self.clicked.emit()
            return
        super().keyPressEvent(event)


class InlineAlert(QFrame):
    """Alerta compacto e reutilizavel (substitui textos grandes/assustadores
    por um cartao com icone, titulo curto, mensagem, detalhes opcionais
    expansiveis e ações opcionais). Níveis: 'info', 'success', 'warning',
    'error'. Nunca trava a tela inteira — e sempre um componente local."""

    def __init__(
        self,
        title: str,
        message: str = "",
        level: str = "info",
        details: str = "",
        actions: Optional[list[tuple[str, Callable[[], None]]]] = None,
        parent: Optional[QWidget] = None,
    ):
        super().__init__(parent)
        self.setObjectName("InlineAlert")
        self.setProperty("level", level)
        self._build_ui(title, message, level, details, actions or [])

    def _build_ui(self, title: str, message: str, level: str, details: str, actions: list[tuple[str, Callable[[], None]]]) -> None:
        colors = current_ui_colors()
        level_color = {"info": colors.info, "success": colors.success, "warning": colors.warning, "error": colors.danger}.get(level, colors.info)

        outer = QVBoxLayout(self)
        outer.setContentsMargins(UiMetrics.SPACE_MD, UiMetrics.SPACE_SM, UiMetrics.SPACE_MD, UiMetrics.SPACE_SM)
        outer.setSpacing(UiMetrics.SPACE_XS)

        header = QHBoxLayout()
        header.setSpacing(UiMetrics.SPACE_SM)
        icon_label = QLabel()
        icon_label.setPixmap(make_icon(level, level_color, UiMetrics.ICON_SM + 2).pixmap(UiMetrics.ICON_SM + 2, UiMetrics.ICON_SM + 2))
        header.addWidget(icon_label, 0, Qt.AlignmentFlag.AlignTop)
        title_label = QLabel(title)
        title_label.setObjectName("InlineAlertTitle")
        title_label.setWordWrap(True)
        header.addWidget(title_label, 1)
        outer.addLayout(header)

        if message:
            message_label = QLabel(message)
            message_label.setObjectName("InlineAlertMessage")
            message_label.setWordWrap(True)
            outer.addWidget(message_label)

        if details:
            details_label = QLabel(details)
            details_label.setObjectName("InlineAlertMessage")
            details_label.setWordWrap(True)
            details_label.setTextInteractionFlags(Qt.TextInteractionFlag.TextSelectableByMouse)
            details_label.setVisible(False)
            outer.addWidget(details_label)

            toggle_btn = mark_button_variant(QPushButton("Detalhes"), "text")
            toggle_btn.setCheckable(True)

            def _on_toggle(checked: bool) -> None:
                details_label.setVisible(checked)
                toggle_btn.setText("Ocultar detalhes" if checked else "Detalhes")

            toggle_btn.toggled.connect(_on_toggle)
            toggle_row = QHBoxLayout()
            toggle_row.addWidget(toggle_btn)
            toggle_row.addStretch(1)
            outer.addLayout(toggle_row)

        if actions:
            action_row = QHBoxLayout()
            action_row.setSpacing(UiMetrics.SPACE_MD)
            for label, callback in actions:
                action_btn = mark_button_variant(QPushButton(label), "text")
                action_btn.clicked.connect(callback)
                action_row.addWidget(action_btn)
            action_row.addStretch(1)
            outer.addLayout(action_row)


class DropArea(QWidget):
    """Área de arrastar-e-soltar generica: icone, titulo curto, texto
    auxiliar com os formatos aceitos e um botao explicito "Selecionar
    arquivos" (a ação nunca depende apenas do arrastar-e-soltar). Por
    padrão aceita apenas '.pdf'; telas de conversão que trabalham com
    outros tipos de arquivo informam ``accepted_extensions``/
    ``dialog_filter``/``dialog_title`` próprios. Os quatro estados
    (vazio, arrastando, aceito, rejeitado) mudam icone, cor da borda E
    texto — nunca so a cor, para não depender apenas de percepcao de cor."""

    files_dropped = Signal(list)  # list[Path]

    def __init__(
        self,
        parent: Optional[QWidget] = None,
        allow_multiple: bool = True,
        accepted_extensions: tuple[str, ...] = (".pdf",),
        dialog_filter: str = "Documentos PDF (*.pdf)",
        dialog_title: str = "Selecionar arquivos",
        placeholder_text: Optional[str] = None,
        hint_text: Optional[str] = None,
        icon_kind: str = "open",
    ):
        super().__init__(parent)
        self.setObjectName("DropArea")
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.setAcceptDrops(True)
        self.setMinimumHeight(80)
        self.allow_multiple = allow_multiple
        self.accepted_extensions = tuple(ext.lower() for ext in accepted_extensions)
        self.dialog_filter = dialog_filter
        self.dialog_title = dialog_title
        self._icon_kind = icon_kind
        default_title = "Arraste arquivos PDF aqui" if self.accepted_extensions == (".pdf",) else "Arraste arquivos aqui"
        self._title_text = placeholder_text.split("\n")[0] if placeholder_text else default_title
        self._hint_text = hint_text or ("Formatos aceitos: " + ", ".join(self.accepted_extensions))
        self.setProperty("dropState", "empty")
        self.setAccessibleName(self._title_text)

        outer = QVBoxLayout(self)
        outer.setContentsMargins(UiMetrics.SPACE_MD, UiMetrics.SPACE_SM, UiMetrics.SPACE_MD, UiMetrics.SPACE_SM)
        outer.setSpacing(2)

        top_row = QHBoxLayout()
        top_row.setSpacing(UiMetrics.SPACE_SM)
        self._icon_label = QLabel()
        top_row.addWidget(self._icon_label, 0)
        self._title_label = QLabel(self._title_text)
        self._title_label.setObjectName("DropAreaTitle")
        self._title_label.setWordWrap(True)
        top_row.addWidget(self._title_label, 1)
        self._browse_btn = QPushButton("Selecionar arquivos" if allow_multiple else "Selecionar arquivo")
        self._browse_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self._browse_btn.clicked.connect(self._browse)
        top_row.addWidget(self._browse_btn, 0)
        outer.addLayout(top_row)

        self._hint_label = QLabel(self._hint_text)
        self._hint_label.setObjectName("DropAreaHint")
        self._hint_label.setWordWrap(True)
        outer.addWidget(self._hint_label)

        self._refresh_icon()

    def _refresh_icon(self) -> None:
        colors = current_ui_colors()
        state = self.property("dropState") or "empty"
        color = {"drag": colors.accent, "accepted": colors.success, "rejected": colors.danger}.get(state, colors.text2)
        self._icon_label.setPixmap(make_icon(self._icon_kind, color, UiMetrics.ICON_MD).pixmap(UiMetrics.ICON_MD, UiMetrics.ICON_MD))

    def _set_state(self, state: str) -> None:
        self.setProperty("dropState", state)
        self.style().unpolish(self)
        self.style().polish(self)
        self._refresh_icon()

    def _matches(self, local_file: str) -> bool:
        return local_file.lower().endswith(self.accepted_extensions)

    def _browse(self) -> None:
        if self.allow_multiple:
            paths, _ = QFileDialog.getOpenFileNames(self, self.dialog_title, "", self.dialog_filter)
        else:
            path, _ = QFileDialog.getOpenFileName(self, self.dialog_title, "", self.dialog_filter)
            paths = [path] if path else []
        if paths:
            self._set_state("accepted")
            self._hint_label.setText(self._hint_text)
            self.files_dropped.emit([Path(p) for p in paths])

    def mousePressEvent(self, event) -> None:  # noqa: N802
        self._browse()
        super().mousePressEvent(event)

    def dragEnterEvent(self, event: QDragEnterEvent) -> None:  # noqa: N802
        if event.mimeData().hasUrls() and any(self._matches(u.toLocalFile()) for u in event.mimeData().urls()):
            self._set_state("drag")
            self._hint_label.setText("Solte para carregar.")
            event.acceptProposedAction()

    def dragLeaveEvent(self, event) -> None:  # noqa: N802
        self._set_state("empty")
        self._hint_label.setText(self._hint_text)

    def dropEvent(self, event: QDropEvent) -> None:  # noqa: N802
        urls = event.mimeData().urls()
        paths = [Path(u.toLocalFile()) for u in urls if self._matches(u.toLocalFile())]
        if not self.allow_multiple:
            paths = paths[:1]
        if paths:
            self._set_state("accepted")
            self._hint_label.setText(self._hint_text)
            self.files_dropped.emit(paths)
        elif urls:
            self._set_state("rejected")
            self._hint_label.setText("Nenhum arquivo válido nessa seleção. " + self._hint_text)
        event.acceptProposedAction()


_THUMB_BASE_WIDTH_PX = 120
_THUMB_CACHE_LIMIT = 80


class PdfViewer(QListWidget):
    """Visualizador/grade de miniaturas: renderizacao sob demanda via
    pypdfium2, zoom, ajuste a largura, rotacao visual, seleção multipla
    (clique simples, Ctrl, Shift, Ctrl+A) e reordenacao por arrastar."""

    selection_changed = Signal(list)
    order_changed = Signal(list)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setViewMode(QListWidget.ViewMode.IconMode)
        self.setResizeMode(QListWidget.ResizeMode.Adjust)
        self.setSelectionMode(QListWidget.SelectionMode.ExtendedSelection)
        self.setDragDropMode(QListWidget.DragDropMode.InternalMove)
        self.setSpacing(8)

        self._pdf: Optional[pdfium.PdfDocument] = None
        self._zoom_percent = 100
        self._rotations: dict[int, int] = {}
        self._removed: set[int] = set()
        self._cache: dict[int, QPixmap] = {}
        self._cache_order: list[int] = []
        self._apply_icon_size()

        self.itemSelectionChanged.connect(self._emit_selection)
        self.verticalScrollBar().valueChanged.connect(self._render_visible)
        self.model().rowsMoved.connect(self._emit_order)

    def _apply_icon_size(self) -> None:
        width = int(_THUMB_BASE_WIDTH_PX * self._zoom_percent / 100)
        self.setIconSize(QSize(width, int(width * 1.4)))

    def set_zoom_percent(self, percent: int) -> None:
        self._zoom_percent = max(25, min(400, percent))
        self._apply_icon_size()
        self._cache.clear()
        self._cache_order.clear()
        for i in range(self.count()):
            self.item(i).setSizeHint(QSize(self.iconSize().width() + 16, self.iconSize().height() + 28))
        self._render_visible()

    def zoom_percent(self) -> int:
        return self._zoom_percent

    def fit_to_width(self, viewport_width_px: int) -> None:
        columns_target = max(1, viewport_width_px // (_THUMB_BASE_WIDTH_PX + 24))
        available = viewport_width_px / columns_target
        percent = int((available / (_THUMB_BASE_WIDTH_PX + 24)) * 100)
        self.set_zoom_percent(percent)

    def load_document(self, path: Path) -> int:
        self.close_document()
        self._pdf = pdfium.PdfDocument(str(path))
        count = len(self._pdf)
        for i in range(count):
            item = QListWidgetItem(f"Página {i + 1}")
            item.setData(Qt.ItemDataRole.UserRole, i)
            item.setSizeHint(QSize(self.iconSize().width() + 16, self.iconSize().height() + 28))
            self.addItem(item)
        self._render_visible()
        return count

    def close_document(self) -> None:
        if self._pdf is not None:
            self._pdf.close()
        self._pdf = None
        self._rotations.clear()
        self._removed.clear()
        self._cache.clear()
        self._cache_order.clear()
        self.clear()

    def _render_visible(self) -> None:
        if self._pdf is None or self.count() == 0:
            return
        first = self.indexAt(self.viewport().rect().topLeft()).row()
        last = self.indexAt(self.viewport().rect().bottomRight()).row()
        first = 0 if first < 0 else first
        last = self.count() - 1 if last < 0 else last
        margin = 6
        for i in range(max(0, first - margin), min(self.count() - 1, last + margin) + 1):
            self._ensure_rendered(i)

    def _ensure_rendered(self, index: int) -> None:
        if index in self._cache or self._pdf is None or index >= len(self._pdf):
            return
        page = self._pdf[index]
        rotation_steps = (self._rotations.get(index, 0) // 90) % 4
        scale = self.iconSize().width() / page.get_size()[0]
        bitmap = page.render(scale=max(scale, 0.05), rotation=rotation_steps)
        pil_image = bitmap.to_pil().convert("RGB")
        qimage = QImage(pil_image.tobytes("raw", "RGB"), pil_image.width, pil_image.height, pil_image.width * 3, QImage.Format.Format_RGB888)
        pixmap = QPixmap.fromImage(qimage)

        item = self.item(index)
        if item is not None:
            item.setIcon(pixmap)
            item.setForeground(QColor("#B23B3B") if index in self._removed else QColor("#000000"))
            item.setText(f"Página {index + 1}" + (" (removida)" if index in self._removed else ""))

        self._cache[index] = pixmap
        self._cache_order.append(index)
        while len(self._cache_order) > _THUMB_CACHE_LIMIT:
            oldest = self._cache_order.pop(0)
            self._cache.pop(oldest, None)
            oldest_item = self.item(oldest) if oldest < self.count() else None
            if oldest_item is not None:
                oldest_item.setIcon(QPixmap())

    def rotate_selected(self, degrees: int) -> None:
        for item in self.selectedItems():
            idx = item.data(Qt.ItemDataRole.UserRole)
            self._rotations[idx] = (self._rotations.get(idx, 0) + degrees) % 360
            self._cache.pop(idx, None)
            if idx in self._cache_order:
                self._cache_order.remove(idx)
        self._render_visible()

    def mark_selected_removed(self) -> None:
        for item in self.selectedItems():
            idx = item.data(Qt.ItemDataRole.UserRole)
            self._removed.add(idx)
            self._cache.pop(idx, None)
            if idx in self._cache_order:
                self._cache_order.remove(idx)
        self._render_visible()

    def unmark_removed(self, indices: Optional[list[int]] = None) -> None:
        targets = set(indices) if indices is not None else set(self._removed)
        for idx in targets:
            self._removed.discard(idx)
            self._cache.pop(idx, None)
        self._render_visible()

    def rotations(self) -> dict[int, int]:
        return dict(self._rotations)

    def removed_indices(self) -> set[int]:
        return set(self._removed)

    def selected_indices(self) -> list[int]:
        return sorted(item.data(Qt.ItemDataRole.UserRole) for item in self.selectedItems())

    def current_order(self) -> list[int]:
        return [self.item(row).data(Qt.ItemDataRole.UserRole) for row in range(self.count())]

    def select_all_pages(self) -> None:
        self.selectAll()

    def _emit_selection(self) -> None:
        self.selection_changed.emit(self.selected_indices())

    def _emit_order(self, *_args) -> None:
        self.order_changed.emit(self.current_order())

    def resizeEvent(self, event) -> None:  # noqa: N802
        super().resizeEvent(event)
        self._render_visible()


def ask_password_dialog(parent: QWidget, filename: str) -> tuple[Optional[str], bool]:
    text, ok = QInputDialog.getText(parent, "Documento protegido", f"'{filename}' exige senha para ser aberto:", QLineEdit.EchoMode.Password)
    return (text if ok else None), ok


# =============================================================================
# 22) DIALOGOS
# =============================================================================
class SettingsDialog(QDialog):
    def __init__(self, settings: AppSettings, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Configurações")
        self.settings = settings
        layout = QVBoxLayout(self)
        form = QFormLayout()
        layout.addLayout(form)

        self.theme_combo = QComboBox()
        for t in Theme:
            self.theme_combo.addItem(t.value, t)
        self.theme_combo.setCurrentIndex(list(Theme).index(settings.theme))
        form.addRow("Tema:", self.theme_combo)

        self.output_edit = QLineEdit(settings.output_directory)
        choose_btn = QPushButton("Escolher...")
        choose_btn.clicked.connect(self._choose_output)
        form.addRow("Pasta de saída padrão:", self.output_edit)
        form.addRow("", choose_btn)

        self.overwrite_combo = QComboBox()
        for o in OverwriteBehavior:
            self.overwrite_combo.addItem(o.value, o)
        self.overwrite_combo.setCurrentIndex(list(OverwriteBehavior).index(settings.overwrite_behavior))
        form.addRow("Ao encontrar nome existente:", self.overwrite_combo)
        form.addRow("", QLabel("'Perguntar' e avaliado apenas ao criar a tarefa, antes dela comecar a rodar em segundo plano."))

        self.max_tasks_spin = QSpinBox()
        self.max_tasks_spin.setRange(1, 16)
        self.max_tasks_spin.setValue(settings.max_concurrent_tasks)
        form.addRow("Tarefas simultaneas:", self.max_tasks_spin)

        self.open_folder_checkbox = QCheckBox("Abrir pasta de saída automaticamente ao concluir")
        self.open_folder_checkbox.setChecked(settings.open_output_folder_after_task)
        form.addRow("", self.open_folder_checkbox)

        self.clear_temp_btn = QPushButton("Limpar arquivos temporarios agora")
        mark_button_variant(self.clear_temp_btn, "danger")
        self.clear_temp_btn.clicked.connect(self._clear_temp)
        form.addRow("", self.clear_temp_btn)

        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def _choose_output(self) -> None:
        directory = QFileDialog.getExistingDirectory(self, "Pasta de saída padrão", self.output_edit.text())
        if directory:
            self.output_edit.setText(directory)

    def _clear_temp(self) -> None:
        n = clear_all_temp()
        self.clear_temp_btn.setText(f"Limpo ({n} diretorio(s) removido(s))")

    def result_settings(self) -> AppSettings:
        updated = self.settings.model_copy(update={
            "theme": self.theme_combo.currentData(),
            "output_directory": self.output_edit.text(),
            "overwrite_behavior": self.overwrite_combo.currentData(),
            "max_concurrent_tasks": self.max_tasks_spin.value(),
            "open_output_folder_after_task": self.open_folder_checkbox.isChecked(),
        })
        save_settings(updated)
        return updated


class DiagnosticsDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Diagnóstico do sistema")
        self.resize(600, 440)
        layout = QVBoxLayout(self)

        layout.addWidget(QLabel(
            "Estas informações não incluem senhas, certificados, conteudo de "
            "documentos ou texto reconhecido por OCR. Caminhos de pasta abaixo "
            "tem a pasta do usuário substituida por '~'."
        ))

        self.text = QTextEdit()
        self.text.setReadOnly(True)
        self.text.setPlainText(
            build_base_diagnostics_report()
            + "\n\nDependencias opcionais: clique em \"Verificar dependencias externas\" abaixo."
        )
        layout.addWidget(self.text)

        check_btn = QPushButton("Verificar dependencias externas")
        check_btn.clicked.connect(self._check_optional)
        layout.addWidget(check_btn)

        copy_btn = QPushButton("Copiar diagnóstico")
        copy_btn.clicked.connect(self._copy)
        layout.addWidget(copy_btn)

    def _check_optional(self) -> None:
        self.text.setPlainText(build_base_diagnostics_report() + "\n\n" + build_optional_dependencies_report())

    def _copy(self) -> None:
        QApplication.clipboard().setText(self.text.toPlainText())


# =============================================================================
# 23) TELAS (VIEWS)
# =============================================================================
_SPLIT_MODE_LABELS: dict[SplitMode, str] = {
    SplitMode.EACH_PAGE: "Separar cada página em um PDF",
    SplitMode.CUSTOM_RANGES: "Páginas especificas / intervalos (ex.: 1,3,5-9,12)",
    SplitMode.EVERY_N_PAGES: "A cada N páginas",
    SplitMode.INTO_N_FILES: "Dividir em N arquivos",
    SplitMode.EQUAL_PARTS: "Partes aproximadamente iguais",
    SplitMode.ODD_PAGES: "Apenas páginas impares",
    SplitMode.EVEN_PAGES: "Apenas páginas pares",
    SplitMode.CURRENT_SELECTION: "Extrair a seleção atual (miniaturas)",
    SplitMode.BY_BOOKMARKS: "Por marcadores",
    SplitMode.BY_TOC_CHAPTERS: "Por capitulos do sumario",
    SplitMode.BY_BLANK_PAGES: "Ao detectar página em branco",
    SplitMode.BY_ORIENTATION_CHANGE: "Ao mudar a orientação da página",
    SplitMode.BY_TEXT_MATCH: "Ao encontrar um texto especifico",
    SplitMode.BY_REGEX: "Por expressao regular",
    SplitMode.BY_MAX_SIZE: "Por tamanho máximo aproximado (MB)",
}


class SplitView(QWidget):
    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        self.settings = settings
        self.source_paths: list[Path] = []
        self._password: Optional[str] = None
        self.job_queue = JobQueue(max_concurrent=settings.max_concurrent_tasks, parent=self)
        self._build_ui()
        self.job_queue.job_progress.connect(self._on_progress)
        self.job_queue.job_status_changed.connect(self._on_status_changed)

    def _build_ui(self) -> None:
        # NOTA DE LAYOUT (correcao de responsividade da tela "Dividir PDF"):
        # o corpo (visualizador + opções) recebe todo o stretch vertical
        # disponivel; titulo, área de arrastar, lista de arquivos, lista de
        # resultados e botao de abrir pasta tem altura controlada e nunca
        # expandem. O painel "Opções de divisão" fica dentro do seu próprio
        # QScrollArea, entao mesmo em janelas pequenas ou com escala alta do
        # Windows, todos os controles (incluindo os botoes Dividir/Cancelar
        # e a barra de progresso) permanecem alcancaveis via rolagem, nunca
        # cortados para fora da janela.
        root = QVBoxLayout(self)

        title = QLabel("Dividir PDF")
        title.setObjectName("ScreenTitle")
        title.setSizePolicy(QSizePolicy.Policy.Preferred, QSizePolicy.Policy.Fixed)
        root.addWidget(title, stretch=0)

        badge = QLabel("Processamento realizado localmente neste computador")
        badge.setObjectName("LocalBadge")
        badge.setSizePolicy(QSizePolicy.Policy.Preferred, QSizePolicy.Policy.Fixed)
        root.addWidget(badge, stretch=0)

        self.drop_area = DropArea(self, allow_multiple=True)
        self.drop_area.files_dropped.connect(self._on_files_dropped)
        self.drop_area.setMaximumHeight(150)
        root.addWidget(self.drop_area, stretch=0)

        files_label = QLabel("Arquivos carregados (processamento em lote — cada um vira uma tarefa):")
        files_label.setSizePolicy(QSizePolicy.Policy.Preferred, QSizePolicy.Policy.Fixed)
        root.addWidget(files_label, stretch=0)

        self.files_list = QListWidget()
        self.files_list.currentRowChanged.connect(self._on_file_selected)
        self.files_list.setMinimumHeight(80)
        self.files_list.setMaximumHeight(120)
        root.addWidget(self.files_list, stretch=0)

        # Corpo principal: visualizador (esquerda) + opções de divisão
        # (direita, com rolagem própria). E este bloco que recebe o
        # stretch vertical principal da tela.
        body = QHBoxLayout()
        root.addLayout(body, stretch=1)

        viewer_col = QVBoxLayout()
        self.viewer = PdfViewer(self)
        self.viewer.setMinimumHeight(260)
        self.viewer.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        viewer_col.addWidget(self.viewer)
        zoom_row = QHBoxLayout()
        zoom_row.addWidget(QLabel("Zoom:"))
        self.zoom_slider = QSlider(Qt.Orientation.Horizontal)
        self.zoom_slider.setRange(25, 400)
        self.zoom_slider.setValue(100)
        self.zoom_slider.valueChanged.connect(lambda v: self.viewer.set_zoom_percent(v))
        zoom_row.addWidget(self.zoom_slider)
        fit_btn = QPushButton("Ajustar a largura")
        fit_btn.clicked.connect(lambda: self.viewer.fit_to_width(self.viewer.viewport().width()))
        zoom_row.addWidget(fit_btn)
        viewer_col.addLayout(zoom_row)
        body.addLayout(viewer_col, stretch=2)

        options_box = QGroupBox("Opções de divisão")
        options_box.setMinimumWidth(320)
        self.options_form = QFormLayout(options_box)
        self.options_form.setRowWrapPolicy(QFormLayout.RowWrapPolicy.WrapLongRows)
        self.options_form.setFieldGrowthPolicy(QFormLayout.FieldGrowthPolicy.ExpandingFieldsGrow)

        # O painel de opções fica dentro do seu próprio QScrollArea: em
        # resolucoes pequenas (ex.: 1366x768) ou com escala do Windows acima
        # de 100%, o conteudo rola verticalmente em vez de ser cortado ou de
        # empurrar os botoes Dividir/Cancelar/Progresso para fora da janela.
        options_scroll = QScrollArea()
        options_scroll.setWidgetResizable(True)
        options_scroll.setFrameShape(QFrame.Shape.NoFrame)
        options_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        options_scroll.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        options_scroll.setMinimumWidth(340)
        options_scroll.setWidget(options_box)
        body.addWidget(options_scroll, stretch=1)

        self.mode_combo = QComboBox()
        self.mode_combo.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.mode_combo.setMinimumContentsLength(20)
        self.mode_combo.setSizeAdjustPolicy(QComboBox.SizeAdjustPolicy.AdjustToMinimumContentsLengthWithIcon)
        for mode, label in _SPLIT_MODE_LABELS.items():
            self.mode_combo.addItem(label, mode)
            self.mode_combo.setItemData(self.mode_combo.count() - 1, label, Qt.ItemDataRole.ToolTipRole)
        self.mode_combo.setToolTip(self.mode_combo.currentText())
        self.mode_combo.currentIndexChanged.connect(lambda _i: self.mode_combo.setToolTip(self.mode_combo.currentText()))
        self.mode_combo.currentIndexChanged.connect(self._update_visible_params)
        self.options_form.addRow("Modo:", self.mode_combo)

        self.ranges_edit = QLineEdit()
        self.ranges_edit.setPlaceholderText("ex.: 1,3,5-9,12")
        self.ranges_edit.textChanged.connect(self._validate_ranges_live)
        self.options_form.addRow("Páginas:", self.ranges_edit)
        self.ranges_feedback = QLabel("")
        self.ranges_feedback.setWordWrap(True)
        self.ranges_feedback.setStyleSheet("color: #B23B3B;")
        self.options_form.addRow("", self.ranges_feedback)

        self.text_needle_edit = QLineEdit()
        self.text_needle_edit.setPlaceholderText("texto a procurar em cada página")
        self.options_form.addRow("Texto:", self.text_needle_edit)

        self.regex_edit = QLineEdit()
        self.regex_edit.setPlaceholderText("expressao regular (re do Python)")
        self.options_form.addRow("Regex:", self.regex_edit)

        self.every_n_spin = QSpinBox()
        self.every_n_spin.setRange(1, 10000)
        self.every_n_spin.setValue(5)
        self.options_form.addRow("A cada N páginas:", self.every_n_spin)

        self.into_n_spin = QSpinBox()
        self.into_n_spin.setRange(1, 1000)
        self.into_n_spin.setValue(2)
        self.options_form.addRow("Numero de arquivos/partes:", self.into_n_spin)

        self.max_size_spin = QSpinBox()
        self.max_size_spin.setRange(1, 10000)
        self.max_size_spin.setValue(10)
        self.options_form.addRow("Tamanho máximo (MB):", self.max_size_spin)

        self.zip_checkbox = QCheckBox("Gerar arquivo ZIP com os resultados")
        self.options_form.addRow("", self.zip_checkbox)

        self.output_dir_edit = QLineEdit(self.settings.output_directory)
        self.output_dir_edit.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.output_dir_edit.setCursorPosition(0)
        self.output_dir_edit.setToolTip(self.output_dir_edit.text())
        self.output_dir_edit.textChanged.connect(lambda t: self.output_dir_edit.setToolTip(t))
        choose_btn = QPushButton("Escolher...")
        choose_btn.setSizePolicy(QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Fixed)
        choose_btn.clicked.connect(self._choose_output_dir)
        out_row = QHBoxLayout()
        out_row.addWidget(self.output_dir_edit, stretch=1)
        out_row.addWidget(choose_btn, stretch=0)
        self.options_form.addRow("Salvar em:", out_row)

        # Botoes de ação em linhas separadas (em vez de lado a lado) para
        # que não fiquem espremidos em paineis estreitos; cada um ocupa a
        # largura total disponivel do painel de opções.
        self.split_button = QPushButton("Dividir (todos os arquivos carregados)")
        mark_button_variant(self.split_button, "primary")
        self.split_button.clicked.connect(self._start_split)
        self.split_button.setMinimumHeight(32)
        self.options_form.addRow(self.split_button)

        self.cancel_button = QPushButton("Cancelar tudo")
        self.cancel_button.setEnabled(False)
        self.cancel_button.clicked.connect(self.job_queue.cancel_all)
        self.cancel_button.setMinimumHeight(32)
        self.options_form.addRow(self.cancel_button)

        self.progress_bar = QProgressBar()
        self.options_form.addRow("Progresso:", self.progress_bar)

        results_label = QLabel("Resultado:")
        results_label.setSizePolicy(QSizePolicy.Policy.Preferred, QSizePolicy.Policy.Fixed)
        root.addWidget(results_label, stretch=0)

        self.results_list = QListWidget()
        self.results_list.setMinimumHeight(100)
        self.results_list.setMaximumHeight(140)
        root.addWidget(self.results_list, stretch=0)

        self.open_folder_btn = QPushButton("Abrir pasta de saída")
        self.open_folder_btn.clicked.connect(self._open_output_folder)
        self.open_folder_btn.setSizePolicy(QSizePolicy.Policy.Preferred, QSizePolicy.Policy.Fixed)
        root.addWidget(self.open_folder_btn, stretch=0)

        self._update_visible_params()

    def _on_files_dropped(self, paths: list[Path]) -> None:
        for p in paths:
            if p not in self.source_paths:
                self.source_paths.append(p)
                self.files_list.addItem(str(p.name))
        if self.source_paths and self.files_list.currentRow() < 0:
            self.files_list.setCurrentRow(0)

    def _on_file_selected(self, row: int) -> None:
        if row < 0 or row >= len(self.source_paths):
            return
        path = self.source_paths[row]
        try:
            with PdfDocument.open(path, password=self._password) as doc:
                self.viewer.load_document(path)
                _ = doc.page_count
        except PdfPasswordRequired:
            password, ok = ask_password_dialog(self, path.name)
            if ok:
                self._password = password
                try:
                    with PdfDocument.open(path, password=password):
                        self.viewer.load_document(path)
                except Exception as exc:  # noqa: BLE001
                    QMessageBox.warning(self, "Não foi possível abrir", str(exc))
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Não foi possível abrir", str(exc))

    def _set_form_row_visible(self, field_widget: QWidget, visible: bool) -> None:
        """Oculta a linha inteira do QFormLayout (rotulo + campo), não
        apenas o widget de campo. Isso evita rotulos orfaos e linhas vazias
        que antes inflavam desnecessariamente a altura do painel de opções.
        Usa ``QFormLayout.setRowVisible`` quando disponivel (PySide6 6.4+);
        cai para um fallback manual, buscando o rotulo correspondente via
        ``QFormLayout.labelForField`` — nunca por indices frageis — em
        versoes mais antigas do PySide6."""
        set_row_visible = getattr(self.options_form, "setRowVisible", None)
        if callable(set_row_visible):
            set_row_visible(field_widget, visible)
            return

        field_widget.setVisible(visible)
        label_item = self.options_form.labelForField(field_widget)
        if label_item is not None:
            label_item.setVisible(visible)

    def _update_visible_params(self) -> None:
        # A conversão explicita para SplitMode(...) e necessaria aqui: o
        # QComboBox guarda o dado do item em um QVariant internamente, e ao
        # ler de volta com currentData() o PySide6 pode devolver a string
        # crua (ja que SplitMode e um Enum de str) em vez da instancia do
        # Enum. Comparacoes com 'is' abaixo dependem de ser exatamente a
        # mesma instancia do Enum, entao reconstruimos o Enum explicitamente
        # para não depender do tipo exato devolvido pelo Qt.
        mode = SplitMode(self.mode_combo.currentData())
        show_ranges = mode in (SplitMode.CUSTOM_RANGES, SplitMode.CURRENT_SELECTION)
        self._set_form_row_visible(self.ranges_edit, show_ranges)
        self._set_form_row_visible(self.ranges_feedback, show_ranges)
        self._set_form_row_visible(self.text_needle_edit, mode is SplitMode.BY_TEXT_MATCH)
        self._set_form_row_visible(self.regex_edit, mode is SplitMode.BY_REGEX)
        self._set_form_row_visible(self.every_n_spin, mode is SplitMode.EVERY_N_PAGES)
        self._set_form_row_visible(self.into_n_spin, mode in (SplitMode.INTO_N_FILES, SplitMode.EQUAL_PARTS))
        self._set_form_row_visible(self.max_size_spin, mode is SplitMode.BY_MAX_SIZE)

    def _validate_ranges_live(self, text: str) -> None:
        row = self.files_list.currentRow()
        if not text.strip() or row < 0 or row >= len(self.source_paths):
            self.ranges_feedback.setText("")
            return
        try:
            with PdfDocument.open(self.source_paths[row], password=self._password) as doc:
                messages = validate_ranges_expression(text, doc.page_count)
        except Exception:  # noqa: BLE001
            messages = []
        self.ranges_feedback.setText(messages[0] if messages else "")

    def _choose_output_dir(self) -> None:
        directory = QFileDialog.getExistingDirectory(self, "Escolher pasta de saída", self.output_dir_edit.text())
        if directory:
            self.output_dir_edit.setText(directory)

    def _start_split(self) -> None:
        if not self.source_paths:
            QMessageBox.information(self, "Nenhum arquivo", "Adicione ao menos um arquivo PDF.")
            return

        # Mesma reconstrucao explicita do Enum feita em _update_visible_params
        # (ver comentario la): necessaria para que as comparacoes com 'is'
        # logo abaixo funcionem de forma confiavel.
        mode: SplitMode = SplitMode(self.mode_combo.currentData())
        behavior = self.settings.overwrite_behavior
        self.results_list.clear()
        self.progress_bar.setValue(0)

        current_selection = self.viewer.selected_indices() if mode is SplitMode.CURRENT_SELECTION else None
        queued = 0
        for path in self.source_paths:
            ranges_expr = self.ranges_edit.text() or None
            if mode is SplitMode.CURRENT_SELECTION and current_selection:
                ranges_expr = ",".join(str(i + 1) for i in current_selection)
            try:
                request = SplitRequest(
                    source_path=path, mode=mode, output_dir=Path(self.output_dir_edit.text()),
                    ranges_expression=ranges_expr, every_n=self.every_n_spin.value(),
                    into_n_files=self.into_n_spin.value(), max_size_mb=float(self.max_size_spin.value()),
                    text_needle=self.text_needle_edit.text() or None, regex_pattern=self.regex_edit.text() or None,
                    naming=OutputNaming(), create_zip=self.zip_checkbox.isChecked(),
                    overwrite_behavior=behavior, password=self._password,
                )
            except Exception as exc:  # noqa: BLE001
                QMessageBox.warning(self, "Parametros invalidos", f"{path.name}: {exc}")
                continue
            self.job_queue.add_job(run_split, request, label=path.name)
            queued += 1

        if queued == 0:
            return
        self.split_button.setEnabled(False)
        self.cancel_button.setEnabled(True)
        self.job_queue.start_all()

    def _on_progress(self, job_id: int, done: int, total: int) -> None:
        if total:
            self.progress_bar.setMaximum(total)
            self.progress_bar.setValue(done)

    def _on_status_changed(self, job_id: int, status: str) -> None:
        job = next((j for j in self.job_queue.jobs() if j.id == job_id), None)
        if job is None:
            return
        if status == JobStatus.DONE.value:
            result: SplitResult = job.result
            for f in result.output_files:
                self.results_list.addItem(f"{job.label} -> {f.name}")
            if result.zip_path:
                self.results_list.addItem(f"{job.label} -> ZIP: {result.zip_path.name}")
        elif status == JobStatus.FAILED.value:
            self.results_list.addItem(f"{job.label}: FALHOU — {job.error_message}")

        if all(j.status in (JobStatus.DONE, JobStatus.FAILED, JobStatus.CANCELLED) for j in self.job_queue.jobs()):
            self.split_button.setEnabled(True)
            self.cancel_button.setEnabled(False)
            if self.settings.open_output_folder_after_task:
                self._open_output_folder()

    def _open_output_folder(self) -> None:
        directory = Path(self.output_dir_edit.text())
        if not directory.exists():
            return
        if sys.platform.startswith("win"):
            subprocess.run(["explorer", str(directory)], check=False)
        elif sys.platform == "darwin":
            subprocess.run(["open", str(directory)], check=False)
        else:
            subprocess.run(["xdg-open", str(directory)], check=False)


class _MergePanel(QWidget):
    def __init__(self, settings: AppSettings, job_queue: JobQueue, parent=None):
        super().__init__(parent)
        self.settings = settings
        self.job_queue = job_queue
        layout = QVBoxLayout(self)

        self.drop_area = DropArea(self, allow_multiple=True)
        self.drop_area.files_dropped.connect(self._on_files_dropped)
        layout.addWidget(self.drop_area)

        self.file_list = QListWidget()
        self.file_list.setDragDropMode(QListWidget.DragDropMode.InternalMove)
        layout.addWidget(QLabel("Arquivos a unir (arraste para reordenar):"))
        layout.addWidget(self.file_list)

        options_row = QHBoxLayout()
        self.bookmark_checkbox = QCheckBox("Marcador por documento")
        self.bookmark_checkbox.setChecked(True)
        self.preserve_checkbox = QCheckBox("Preservar marcadores existentes (melhor esforco)")
        self.preserve_checkbox.setChecked(True)
        self.interleave_checkbox = QCheckBox("Intercalar páginas (em vez de concatenar)")
        options_row.addWidget(self.bookmark_checkbox)
        options_row.addWidget(self.preserve_checkbox)
        options_row.addWidget(self.interleave_checkbox)
        layout.addLayout(options_row)

        self.output_edit = QLineEdit(str(Path(settings.output_directory) / "documento_unido.pdf"))
        row = QHBoxLayout()
        row.addWidget(self.output_edit)
        choose_btn = QPushButton("Escolher destino...")
        choose_btn.clicked.connect(self._choose_output)
        row.addWidget(choose_btn)
        layout.addLayout(row)

        action_row = QHBoxLayout()
        self.merge_btn = QPushButton("Unir")
        mark_button_variant(self.merge_btn, "primary")
        self.merge_btn.clicked.connect(self._start_merge)
        remove_btn = QPushButton("Remover selecionado")
        remove_btn.clicked.connect(self._remove_selected)
        action_row.addWidget(self.merge_btn)
        action_row.addWidget(remove_btn)
        layout.addLayout(action_row)

        self.progress = QProgressBar()
        layout.addWidget(self.progress)

        self.job_queue.job_status_changed.connect(self._on_status_changed)
        self._current_job_id: Optional[int] = None

    def _on_files_dropped(self, paths: list[Path]) -> None:
        for p in paths:
            item = QListWidgetItem(p.name)
            item.setData(Qt.ItemDataRole.UserRole, str(p))
            self.file_list.addItem(item)

    def _remove_selected(self) -> None:
        for item in self.file_list.selectedItems():
            self.file_list.takeItem(self.file_list.row(item))

    def _choose_output(self) -> None:
        path, _ = QFileDialog.getSaveFileName(self, "Salvar como", self.output_edit.text(), "PDF (*.pdf)")
        if path:
            self.output_edit.setText(path)

    def _start_merge(self) -> None:
        paths = [Path(self.file_list.item(i).data(Qt.ItemDataRole.UserRole)) for i in range(self.file_list.count())]
        if len(paths) < 2:
            QMessageBox.information(self, "Arquivos insuficientes", "Adicione ao menos dois arquivos PDF para unir.")
            return
        request = MergeRequest(
            source_paths=paths, output_path=Path(self.output_edit.text()),
            add_bookmark_per_source=self.bookmark_checkbox.isChecked(),
            preserve_existing_bookmarks=self.preserve_checkbox.isChecked(),
            interleave=self.interleave_checkbox.isChecked(),
            overwrite_behavior=self.settings.overwrite_behavior,
        )
        self.merge_btn.setEnabled(False)
        self.progress.setValue(0)
        self._current_job_id = self.job_queue.add_job(run_merge, request, label="Uniao de PDFs")
        self.job_queue.start_all()

    def _on_status_changed(self, job_id: int, status: str) -> None:
        if job_id != self._current_job_id:
            return
        job = next(j for j in self.job_queue.jobs() if j.id == job_id)
        if status in (JobStatus.DONE.value, JobStatus.FAILED.value, JobStatus.CANCELLED.value):
            self.merge_btn.setEnabled(True)
        if status == JobStatus.DONE.value:
            QMessageBox.information(self, "Concluido", f"Documento unido salvo em:\n{job.result.output_path}")
        elif status == JobStatus.FAILED.value:
            QMessageBox.warning(self, "Falha ao unir", job.error_message or "Erro desconhecido.")


class _OrganizePagesPanel(QWidget):
    """Reordenar, girar e marcar páginas para exclusao de um documento, com
    edicao não destrutiva ate o clique em 'Salvar como novo PDF'. Tambem
    oferece substituir páginas, extrair páginas e inverter a ordem."""

    def __init__(self, settings: AppSettings, job_queue: JobQueue, parent=None):
        super().__init__(parent)
        self.settings = settings
        self.job_queue = job_queue
        self.source_path: Optional[Path] = None

        layout = QVBoxLayout(self)
        self.drop_area = DropArea(self, allow_multiple=False)
        self.drop_area.files_dropped.connect(self._on_file_dropped)
        layout.addWidget(self.drop_area)

        self.viewer = PdfViewer(self)
        layout.addWidget(self.viewer)

        btn_row = QHBoxLayout()
        for label, handler in (
            ("Girar -90°", lambda: self.viewer.rotate_selected(-90)),
            ("Girar +90°", lambda: self.viewer.rotate_selected(90)),
            ("Marcar para excluir", self.viewer.mark_selected_removed),
            ("Desmarcar exclusao", lambda: self.viewer.unmark_removed(self.viewer.selected_indices())),
            ("Selecionar tudo (Ctrl+A)", self.viewer.select_all_pages),
            ("Inverter ordem", self._invert_order),
        ):
            btn = QPushButton(label)
            btn.clicked.connect(handler)
            btn_row.addWidget(btn)
        layout.addLayout(btn_row)

        extract_row = QHBoxLayout()
        self.extract_ranges_edit = QLineEdit()
        self.extract_ranges_edit.setPlaceholderText("Extrair páginas (ex.: 1,3,5-9) para um novo arquivo")
        extract_btn = QPushButton("Extrair")
        mark_button_variant(extract_btn, "primary")
        extract_btn.clicked.connect(self._extract_pages)
        extract_row.addWidget(self.extract_ranges_edit)
        extract_row.addWidget(extract_btn)
        layout.addLayout(extract_row)

        replace_row = QHBoxLayout()
        self.replacement_path_edit = QLineEdit()
        self.replacement_path_edit.setPlaceholderText("PDF de substituicao")
        choose_replacement_btn = QPushButton("Escolher...")
        choose_replacement_btn.clicked.connect(self._choose_replacement)
        replace_btn = QPushButton("Substituir páginas selecionadas")
        mark_button_variant(replace_btn, "primary")
        replace_btn.clicked.connect(self._replace_selected)
        replace_row.addWidget(self.replacement_path_edit)
        replace_row.addWidget(choose_replacement_btn)
        replace_row.addWidget(replace_btn)
        layout.addLayout(replace_row)

        self.output_edit = QLineEdit()
        out_row = QHBoxLayout()
        out_row.addWidget(self.output_edit)
        choose_btn = QPushButton("Salvar como...")
        choose_btn.clicked.connect(self._choose_output)
        out_row.addWidget(choose_btn)
        layout.addLayout(out_row)

        self.save_btn = QPushButton("Salvar como novo PDF (aplica ordem/rotacao/exclusao)")
        mark_button_variant(self.save_btn, "primary")
        self.save_btn.clicked.connect(self._save)
        layout.addWidget(self.save_btn)

    def _on_file_dropped(self, paths: list[Path]) -> None:
        if not paths:
            return
        self.source_path = paths[0]
        self.viewer.load_document(self.source_path)
        default_out = self.source_path.with_stem(self.source_path.stem + "_organizado")
        self.output_edit.setText(str(default_out))

    def _choose_output(self) -> None:
        path, _ = QFileDialog.getSaveFileName(self, "Salvar como", self.output_edit.text(), "PDF (*.pdf)")
        if path:
            self.output_edit.setText(path)

    def _choose_replacement(self) -> None:
        path, _ = QFileDialog.getOpenFileName(self, "PDF de substituicao", "", "PDF (*.pdf)")
        if path:
            self.replacement_path_edit.setText(path)

    def _invert_order(self) -> None:
        if self.source_path is None:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento primeiro.")
            return
        out_text = self.output_edit.text() or str(self.source_path.with_stem(self.source_path.stem + "_invertido"))
        try:
            result = run_invert_order(InvertOrderRequest(source_path=self.source_path, output_path=Path(out_text)))
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Falha ao inverter", str(exc))
            return
        QMessageBox.information(self, "Concluido", f"Salvo em:\n{result.output_path}")

    def _extract_pages(self) -> None:
        if self.source_path is None:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento primeiro.")
            return
        expr = self.extract_ranges_edit.text().strip()
        if not expr:
            QMessageBox.information(self, "Expressao vazia", "Informe quais páginas extrair, ex.: 1,3,5-9.")
            return
        out_path = self.source_path.with_stem(self.source_path.stem + "_extraido")
        try:
            result = run_extract_pages(ExtractPagesRequest(source_path=self.source_path, ranges_expression=expr, output_path=out_path))
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Falha ao extrair", str(exc))
            return
        QMessageBox.information(self, "Concluido", f"Salvo em:\n{result.output_path}")

    def _replace_selected(self) -> None:
        if self.source_path is None:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento primeiro.")
            return
        replacement = self.replacement_path_edit.text().strip()
        selected = self.viewer.selected_indices()
        if not replacement or not selected:
            QMessageBox.information(self, "Dados incompletos", "Selecione as páginas a substituir e escolha o PDF de substituicao.")
            return
        out_path = self.source_path.with_stem(self.source_path.stem + "_substituido")
        try:
            result = run_replace_pages(ReplacePagesRequest(
                source_path=self.source_path, target_indices=selected,
                replacement_source_path=Path(replacement), output_path=out_path,
            ))
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Falha ao substituir", str(exc))
            return
        QMessageBox.information(self, "Concluido", f"Salvo em:\n{result.output_path}")

    def _save(self) -> None:
        if self.source_path is None:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento primeiro.")
            return
        order = [i for i in self.viewer.current_order() if i not in self.viewer.removed_indices()]
        if not order:
            QMessageBox.warning(self, "Nada para salvar", "Todas as páginas estão marcadas para exclusao.")
            return
        try:
            with PdfDocument.open(self.source_path) as doc:
                rotations = self.viewer.rotations()
                pages = []
                for idx in order:
                    page = doc.reader.pages[idx]
                    degrees = rotations.get(idx, 0)
                    if degrees:
                        page = page.rotate(degrees)
                    pages.append(page)
                result = _write_pages_to_new_document(doc, pages, Path(self.output_edit.text()))
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Falha ao salvar", str(exc))
            return
        QMessageBox.information(self, "Concluido", f"Salvo em:\n{result.output_path}")


class OrganizeView(QWidget):
    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        title = QLabel("Organizar PDF")
        title.setObjectName("ScreenTitle")
        layout.addWidget(title)

        job_queue = JobQueue(max_concurrent=settings.max_concurrent_tasks, parent=self)
        tabs = QTabWidget()
        tabs.addTab(_MergePanel(settings, job_queue, self), "Unir PDFs")
        tabs.addTab(_OrganizePagesPanel(settings, job_queue, self), "Reordenar / Girar / Excluir / Substituir / Extrair")
        layout.addWidget(tabs)


class SecurityView(QWidget):
    """Metadados, sanitizacao e senha (subconjunto genuino do Nível 2)."""

    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        self.settings = settings
        self.source_path: Optional[Path] = None
        layout = QVBoxLayout(self)

        title = QLabel("Segurança e metadados")
        title.setObjectName("ScreenTitle")
        layout.addWidget(title)

        self.drop_area = DropArea(self, allow_multiple=False)
        self.drop_area.files_dropped.connect(self._on_file_dropped)
        layout.addWidget(self.drop_area)

        self.file_label = QLabel("Nenhum arquivo selecionado.")
        layout.addWidget(self.file_label)

        tabs = QTabWidget()
        layout.addWidget(tabs)

        # --- aba metadados ---
        meta_tab = QWidget()
        meta_layout = QFormLayout(meta_tab)
        self.title_edit = QLineEdit()
        self.author_edit = QLineEdit()
        self.subject_edit = QLineEdit()
        self.keywords_edit = QLineEdit()
        meta_layout.addRow("Titulo:", self.title_edit)
        meta_layout.addRow("Autor:", self.author_edit)
        meta_layout.addRow("Assunto:", self.subject_edit)
        meta_layout.addRow("Palavras-chave:", self.keywords_edit)
        meta_btn_row = QHBoxLayout()
        save_meta_btn = QPushButton("Salvar metadados (novo arquivo)")
        mark_button_variant(save_meta_btn, "primary")
        save_meta_btn.clicked.connect(self._save_metadata)
        clear_meta_btn = QPushButton("Limpar todos os metadados (novo arquivo)")
        mark_button_variant(clear_meta_btn, "danger")
        clear_meta_btn.clicked.connect(self._clear_metadata)
        meta_btn_row.addWidget(save_meta_btn)
        meta_btn_row.addWidget(clear_meta_btn)
        meta_layout.addRow(meta_btn_row)
        tabs.addTab(meta_tab, "Metadados")

        # --- aba sanitizacao ---
        sanitize_tab = QWidget()
        sanitize_layout = QVBoxLayout(sanitize_tab)
        self.remove_js_checkbox = QCheckBox("Remover JavaScript")
        self.remove_js_checkbox.setChecked(True)
        self.remove_attachments_checkbox = QCheckBox("Remover anexos incorporados")
        self.remove_attachments_checkbox.setChecked(True)
        self.remove_forms_checkbox = QCheckBox("Remover campos de formulario")
        self.remove_forms_checkbox.setChecked(True)
        sanitize_layout.addWidget(self.remove_js_checkbox)
        sanitize_layout.addWidget(self.remove_attachments_checkbox)
        sanitize_layout.addWidget(self.remove_forms_checkbox)
        sanitize_btn = QPushButton("Sanitizar (novo arquivo)")
        mark_button_variant(sanitize_btn, "primary")
        sanitize_btn.clicked.connect(self._sanitize)
        sanitize_layout.addWidget(sanitize_btn)
        sanitize_layout.addStretch(1)
        tabs.addTab(sanitize_tab, "Sanitizacao")

        # --- aba senha ---
        password_tab = QWidget()
        password_layout = QFormLayout(password_tab)
        self.user_password_edit = QLineEdit()
        self.user_password_edit.setEchoMode(QLineEdit.EchoMode.Password)
        self.owner_password_edit = QLineEdit()
        self.owner_password_edit.setEchoMode(QLineEdit.EchoMode.Password)
        password_layout.addRow("Senha de abertura:", self.user_password_edit)
        password_layout.addRow("Senha de proprietario (opcional):", self.owner_password_edit)
        encrypt_btn = QPushButton("Proteger com senha (novo arquivo)")
        mark_button_variant(encrypt_btn, "primary")
        encrypt_btn.clicked.connect(self._encrypt)
        password_layout.addRow(encrypt_btn)
        password_layout.addRow(QLabel("Nenhuma senha e armazenada por esta aplicação em nenhuma circunstancia."))
        tabs.addTab(password_tab, "Senha")

        layout.addWidget(QLabel(
            "Nível 2 restante (marca d'agua, numeracao, compactação, conversão de "
            "imagens) e Nível 3 (OCR, conversão Office, PDF/A, comparacao, redação, "
            "assinaturas) ainda não estão implementados — ver tela inicial."
        ))

    def _on_file_dropped(self, paths: list[Path]) -> None:
        if not paths:
            return
        self.source_path = paths[0]
        self.file_label.setText(self.source_path.name)
        try:
            meta = run_view_metadata(self.source_path)
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Não foi possível ler metadados", str(exc))
            return
        self.title_edit.setText(meta.get("Title", ""))
        self.author_edit.setText(meta.get("Author", ""))
        self.subject_edit.setText(meta.get("Subject", ""))
        self.keywords_edit.setText(meta.get("Keywords", ""))

    def _require_source(self) -> Optional[Path]:
        if self.source_path is None:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento primeiro.")
            return None
        return self.source_path

    def _save_metadata(self) -> None:
        source = self._require_source()
        if source is None:
            return
        fields = MetadataFields(
            title=self.title_edit.text() or None, author=self.author_edit.text() or None,
            subject=self.subject_edit.text() or None, keywords=self.keywords_edit.text() or None,
        )
        out_path = source.with_stem(source.stem + "_metadados")
        try:
            result = run_update_metadata(MetadataRequest(source_path=source, output_path=out_path, fields=fields))
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Falha ao salvar metadados", str(exc))
            return
        QMessageBox.information(self, "Concluido", f"Salvo em:\n{result.output_path}")

    def _clear_metadata(self) -> None:
        source = self._require_source()
        if source is None:
            return
        out_path = source.with_stem(source.stem + "_sem_metadados")
        try:
            result = run_update_metadata(MetadataRequest(source_path=source, output_path=out_path, fields=None))
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Falha ao limpar metadados", str(exc))
            return
        QMessageBox.information(self, "Concluido", f"Salvo em:\n{result.output_path}")

    def _sanitize(self) -> None:
        source = self._require_source()
        if source is None:
            return
        out_path = source.with_stem(source.stem + "_sanitizado")
        try:
            result = run_sanitize(SanitizeRequest(
                source_path=source, output_path=out_path,
                remove_javascript=self.remove_js_checkbox.isChecked(),
                remove_attachments=self.remove_attachments_checkbox.isChecked(),
                remove_form_fields=self.remove_forms_checkbox.isChecked(),
            ))
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Falha ao sanitizar", str(exc))
            return
        QMessageBox.information(self, "Concluido", f"Salvo em:\n{result.output_path}\n\n" + "\n".join(result.preservation.not_preserved))

    def _encrypt(self) -> None:
        source = self._require_source()
        if source is None:
            return
        user_password = self.user_password_edit.text()
        if not user_password:
            QMessageBox.information(self, "Senha vazia", "Informe uma senha de abertura.")
            return
        out_path = source.with_stem(source.stem + "_protegido")
        try:
            result = run_encrypt(EncryptRequest(
                source_path=source, output_path=out_path, user_password=user_password,
                owner_password=self.owner_password_edit.text() or None,
            ))
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Falha ao proteger", str(exc))
            return
        QMessageBox.information(self, "Concluido", f"Salvo em:\n{result.output_path}")
        self.user_password_edit.clear()
        self.owner_password_edit.clear()


_COMPRESSION_LEVEL_LABELS: dict[CompressionLevel, str] = {
    CompressionLevel.LIGHT: "Leve (qualidade maxima preservada)",
    CompressionLevel.BALANCED: "Equilibrado (recomendado)",
    CompressionLevel.MAXIMUM: "Máximo (menor tamanho possível)",
    CompressionLevel.CUSTOM: "Personalizado (DPI e qualidade manuais)",
}


def _format_bytes(num_bytes: int) -> str:
    value = float(num_bytes)
    for unit in ("B", "KB", "MB", "GB"):
        if value < 1024 or unit == "GB":
            return f"{value:.1f} {unit}" if unit != "B" else f"{int(value)} {unit}"
        value /= 1024
    return f"{value:.1f} GB"


class OptimizeView(QWidget):
    """Tela de otimização/compactação (Fase 1). Segue o mesmo padrão
    responsivo corrigido na tela "Dividir PDF": o painel de opções fica
    dentro do seu próprio QScrollArea, com stretch explicito no layout
    principal, para continuar utilizavel em janelas pequenas ou com escala
    alta do Windows."""

    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        self.settings = settings
        self.source_paths: list[Path] = []
        self._password: Optional[str] = None
        self.job_queue = JobQueue(max_concurrent=settings.max_concurrent_tasks, parent=self)
        self._build_ui()
        self.job_queue.job_progress.connect(self._on_progress)
        self.job_queue.job_status_changed.connect(self._on_status_changed)

    def _build_ui(self) -> None:
        root = QVBoxLayout(self)

        title = QLabel("Otimizar PDF")
        title.setObjectName("ScreenTitle")
        title.setSizePolicy(QSizePolicy.Policy.Preferred, QSizePolicy.Policy.Fixed)
        root.addWidget(title, stretch=0)

        badge = QLabel("Processamento realizado localmente neste computador")
        badge.setObjectName("LocalBadge")
        badge.setSizePolicy(QSizePolicy.Policy.Preferred, QSizePolicy.Policy.Fixed)
        root.addWidget(badge, stretch=0)

        gs_path = shutil.which("gs")
        if gs_path:
            gs_alert = InlineAlert(
                "Compactação avancada disponivel",
                f"Ghostscript detectado ({gs_path}): as imagens do PDF podem ser recomprimidas.",
                level="success",
            )
        else:
            gs_alert = InlineAlert(
                "Compactação avancada indisponivel",
                "Instale o Ghostscript para recomprimir imagens. A otimização estrutural sem perdas continua disponivel.",
                level="warning",
                details="Ghostscript não foi encontrado no PATH do sistema. Download: https://www.ghostscript.com/",
            )
        root.addWidget(gs_alert, stretch=0)

        self.drop_area = DropArea(self, allow_multiple=True)
        self.drop_area.files_dropped.connect(self._on_files_dropped)
        self.drop_area.setMaximumHeight(150)
        root.addWidget(self.drop_area, stretch=0)

        files_label = QLabel("Arquivos carregados (processamento em lote — cada um vira uma tarefa):")
        files_label.setSizePolicy(QSizePolicy.Policy.Preferred, QSizePolicy.Policy.Fixed)
        root.addWidget(files_label, stretch=0)

        self.files_list = QListWidget()
        self.files_list.currentRowChanged.connect(self._on_file_selected)
        self.files_list.setMinimumHeight(80)
        self.files_list.setMaximumHeight(120)
        root.addWidget(self.files_list, stretch=0)

        body = QHBoxLayout()
        root.addLayout(body, stretch=1)

        info_col = QVBoxLayout()
        self.size_info_label = QLabel("Selecione um arquivo para ver o tamanho original.")
        self.size_info_label.setWordWrap(True)
        self.size_info_label.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.size_info_label.setAlignment(Qt.AlignmentFlag.AlignTop | Qt.AlignmentFlag.AlignLeft)
        info_col.addWidget(self.size_info_label)
        body.addLayout(info_col, stretch=2)

        options_box = QGroupBox("Opções de otimização")
        options_box.setMinimumWidth(320)
        self.options_form = QFormLayout(options_box)
        self.options_form.setRowWrapPolicy(QFormLayout.RowWrapPolicy.WrapLongRows)
        self.options_form.setFieldGrowthPolicy(QFormLayout.FieldGrowthPolicy.ExpandingFieldsGrow)

        options_scroll = QScrollArea()
        options_scroll.setWidgetResizable(True)
        options_scroll.setFrameShape(QFrame.Shape.NoFrame)
        options_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        options_scroll.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        options_scroll.setMinimumWidth(340)
        options_scroll.setWidget(options_box)
        body.addWidget(options_scroll, stretch=1)

        self.level_combo = QComboBox()
        self.level_combo.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.level_combo.setMinimumContentsLength(18)
        self.level_combo.setSizeAdjustPolicy(QComboBox.SizeAdjustPolicy.AdjustToMinimumContentsLengthWithIcon)
        for level, label in _COMPRESSION_LEVEL_LABELS.items():
            self.level_combo.addItem(label, level)
            self.level_combo.setItemData(self.level_combo.count() - 1, label, Qt.ItemDataRole.ToolTipRole)
        self.level_combo.setCurrentIndex(list(_COMPRESSION_LEVEL_LABELS.keys()).index(CompressionLevel.BALANCED))
        self.level_combo.setToolTip(self.level_combo.currentText())
        self.level_combo.currentIndexChanged.connect(lambda _i: self.level_combo.setToolTip(self.level_combo.currentText()))
        self.level_combo.currentIndexChanged.connect(self._update_visible_params)
        self.options_form.addRow("Nível:", self.level_combo)

        self.custom_dpi_spin = QSpinBox()
        self.custom_dpi_spin.setRange(36, 1200)
        self.custom_dpi_spin.setValue(150)
        self.custom_dpi_spin.setSuffix(" DPI")
        self.options_form.addRow("DPI personalizado:", self.custom_dpi_spin)

        self.custom_quality_spin = QSpinBox()
        self.custom_quality_spin.setRange(1, 100)
        self.custom_quality_spin.setValue(75)
        self.custom_quality_spin.setSuffix(" %")
        self.options_form.addRow("Qualidade personalizada:", self.custom_quality_spin)

        self.remove_metadata_checkbox = QCheckBox("Remover metadados do documento")
        self.options_form.addRow("", self.remove_metadata_checkbox)

        self.output_dir_edit = QLineEdit(self.settings.output_directory)
        self.output_dir_edit.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.output_dir_edit.setCursorPosition(0)
        self.output_dir_edit.setToolTip(self.output_dir_edit.text())
        self.output_dir_edit.textChanged.connect(lambda t: self.output_dir_edit.setToolTip(t))
        choose_btn = QPushButton("Escolher...")
        choose_btn.setSizePolicy(QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Fixed)
        choose_btn.clicked.connect(self._choose_output_dir)
        out_row = QHBoxLayout()
        out_row.addWidget(self.output_dir_edit, stretch=1)
        out_row.addWidget(choose_btn, stretch=0)
        self.options_form.addRow("Salvar em:", out_row)

        self.optimize_button = QPushButton("Otimizar (todos os arquivos carregados)")
        mark_button_variant(self.optimize_button, "primary")
        self.optimize_button.clicked.connect(self._start_optimize)
        self.optimize_button.setMinimumHeight(32)
        self.options_form.addRow(self.optimize_button)

        self.cancel_button = QPushButton("Cancelar tudo")
        self.cancel_button.setEnabled(False)
        self.cancel_button.clicked.connect(self.job_queue.cancel_all)
        self.cancel_button.setMinimumHeight(32)
        self.options_form.addRow(self.cancel_button)

        self.progress_bar = QProgressBar()
        self.options_form.addRow("Progresso:", self.progress_bar)

        results_label = QLabel("Resultado:")
        results_label.setSizePolicy(QSizePolicy.Policy.Preferred, QSizePolicy.Policy.Fixed)
        root.addWidget(results_label, stretch=0)

        self.results_list = QListWidget()
        self.results_list.setMinimumHeight(100)
        self.results_list.setMaximumHeight(140)
        root.addWidget(self.results_list, stretch=0)

        self.open_folder_btn = QPushButton("Abrir pasta de saída")
        self.open_folder_btn.clicked.connect(self._open_output_folder)
        self.open_folder_btn.setSizePolicy(QSizePolicy.Policy.Preferred, QSizePolicy.Policy.Fixed)
        root.addWidget(self.open_folder_btn, stretch=0)

        self._update_visible_params()

    def _set_form_row_visible(self, field_widget: QWidget, visible: bool) -> None:
        set_row_visible = getattr(self.options_form, "setRowVisible", None)
        if callable(set_row_visible):
            set_row_visible(field_widget, visible)
            return
        field_widget.setVisible(visible)
        label_item = self.options_form.labelForField(field_widget)
        if label_item is not None:
            label_item.setVisible(visible)

    def _update_visible_params(self) -> None:
        # Mesma reconstrucao explicita do Enum aplicada na tela "Dividir
        # PDF": QComboBox.currentData() pode devolver a string crua em vez
        # da instancia de CompressionLevel após o round-trip pelo QVariant.
        level = CompressionLevel(self.level_combo.currentData())
        is_custom = level is CompressionLevel.CUSTOM
        self._set_form_row_visible(self.custom_dpi_spin, is_custom)
        self._set_form_row_visible(self.custom_quality_spin, is_custom)

    def _on_files_dropped(self, paths: list[Path]) -> None:
        for p in paths:
            if p not in self.source_paths:
                self.source_paths.append(p)
                self.files_list.addItem(str(p.name))
        if self.source_paths and self.files_list.currentRow() < 0:
            self.files_list.setCurrentRow(0)

    def _on_file_selected(self, row: int) -> None:
        if row < 0 or row >= len(self.source_paths):
            return
        path = self.source_paths[row]
        try:
            size = path.stat().st_size
            self.size_info_label.setText(f"Arquivo: {path.name}\nTamanho original: {_format_bytes(size)}")
        except OSError as exc:
            self.size_info_label.setText(f"Não foi possível ler o arquivo: {exc}")

    def _choose_output_dir(self) -> None:
        directory = QFileDialog.getExistingDirectory(self, "Escolher pasta de saída", self.output_dir_edit.text())
        if directory:
            self.output_dir_edit.setText(directory)

    def _start_optimize(self) -> None:
        if not self.source_paths:
            QMessageBox.information(self, "Nenhum arquivo", "Adicione ao menos um arquivo PDF.")
            return

        level = CompressionLevel(self.level_combo.currentData())
        behavior = self.settings.overwrite_behavior
        self.results_list.clear()
        self.progress_bar.setValue(0)

        queued = 0
        for path in self.source_paths:
            out_path = Path(self.output_dir_edit.text()) / f"{path.stem}_otimizado.pdf"
            try:
                request = CompressionRequest(
                    source_path=path, output_path=out_path, level=level,
                    remove_metadata=self.remove_metadata_checkbox.isChecked(),
                    custom_dpi=self.custom_dpi_spin.value() if level is CompressionLevel.CUSTOM else None,
                    custom_quality=self.custom_quality_spin.value() if level is CompressionLevel.CUSTOM else None,
                    overwrite_behavior=behavior, password=self._password,
                )
            except Exception as exc:  # noqa: BLE001
                QMessageBox.warning(self, "Parametros invalidos", f"{path.name}: {exc}")
                continue
            self.job_queue.add_job(run_optimize, request, label=path.name)
            queued += 1

        if queued == 0:
            return
        self.optimize_button.setEnabled(False)
        self.cancel_button.setEnabled(True)
        self.job_queue.start_all()

    def _on_progress(self, job_id: int, done: int, total: int) -> None:
        if total:
            self.progress_bar.setMaximum(total)
            self.progress_bar.setValue(done)

    def _on_status_changed(self, job_id: int, status: str) -> None:
        job = next((j for j in self.job_queue.jobs() if j.id == job_id), None)
        if job is None:
            return
        if status == JobStatus.DONE.value:
            result: CompressionResult = job.result
            backend = "Ghostscript" if result.used_ghostscript else "estrutural (sem Ghostscript)"
            self.results_list.addItem(
                f"{job.label} -> {result.output_path.name} "
                f"({_format_bytes(result.original_size_bytes)} -> {_format_bytes(result.final_size_bytes)}, "
                f"{result.reduction_percent:+.1f}% , {backend})"
            )
        elif status == JobStatus.FAILED.value:
            self.results_list.addItem(f"{job.label}: FALHOU — {job.error_message}")

        if all(j.status in (JobStatus.DONE, JobStatus.FAILED, JobStatus.CANCELLED) for j in self.job_queue.jobs()):
            self.optimize_button.setEnabled(True)
            self.cancel_button.setEnabled(False)
            if self.settings.open_output_folder_after_task:
                self._open_output_folder()

    def _open_output_folder(self) -> None:
        directory = Path(self.output_dir_edit.text())
        if not directory.exists():
            return
        if sys.platform.startswith("win"):
            subprocess.run(["explorer", str(directory)], check=False)
        elif sys.platform == "darwin":
            subprocess.run(["open", str(directory)], check=False)
        else:
            subprocess.run(["xdg-open", str(directory)], check=False)


def _open_folder_cross_platform(directory: Path) -> None:
    if not directory.exists():
        return
    if sys.platform.startswith("win"):
        subprocess.run(["explorer", str(directory)], check=False)
    elif sys.platform == "darwin":
        subprocess.run(["open", str(directory)], check=False)
    else:
        subprocess.run(["xdg-open", str(directory)], check=False)


_IMAGE_DIALOG_FILTER = "Imagens (*.jpg *.jpeg *.png *.tif *.tiff *.webp)"
_OFFICE_DIALOG_FILTER = "Documentos de escritorio (*.doc *.docx *.odt *.rtf *.txt *.xls *.xlsx *.ods *.ppt *.pptx *.odp)"
_OFFICE_EXTENSIONS = (".doc", ".docx", ".odt", ".rtf", ".txt", ".xls", ".xlsx", ".ods", ".ppt", ".pptx", ".odp")


class _ImagesToPdfPanel(QWidget):
    """Imagens (JPG/PNG/TIFF/WEBP) -> um único PDF combinado, na ordem em
    que aparecem na lista (arrastavel para reordenar).

    Cada aba de ``ConvertView`` tem sua PRÓPRIA ``JobQueue`` (em vez de uma
    fila compartilhada entre todas as abas): como cada aba dispara tipos de
    tarefa diferentes (``ImagesToPdfResult``, ``PdfToImagesResult``, etc.),
    uma fila compartilhada faria o retorno de uma aba ser processado
    (incorretamente) pelo callback de outra aba, causando erro ao tentar ler
    um atributo que so existe no tipo de resultado errado."""

    def __init__(self, settings: AppSettings, parent=None):
        super().__init__(parent)
        self.settings = settings
        self.job_queue = JobQueue(max_concurrent=settings.max_concurrent_tasks, parent=self)
        self._current_job_id: Optional[int] = None
        layout = QVBoxLayout(self)

        self.drop_area = DropArea(
            self, allow_multiple=True, accepted_extensions=SUPPORTED_IMAGE_INPUT_EXTENSIONS,
            dialog_filter=_IMAGE_DIALOG_FILTER, dialog_title="Selecionar imagens",
            placeholder_text="Arraste imagens (JPG/PNG/TIFF/WEBP) aqui\nou clique para selecionar",
        )
        self.drop_area.files_dropped.connect(self._on_files_dropped)
        layout.addWidget(self.drop_area)

        self.file_list = QListWidget()
        self.file_list.setDragDropMode(QListWidget.DragDropMode.InternalMove)
        layout.addWidget(QLabel("Imagens a combinar, na ordem final do PDF (arraste para reordenar):"))
        layout.addWidget(self.file_list)

        remove_btn = QPushButton("Remover selecionada")
        remove_btn.clicked.connect(self._remove_selected)
        layout.addWidget(remove_btn)

        options_row = QHBoxLayout()
        options_row.addWidget(QLabel("DPI:"))
        self.dpi_spin = QSpinBox()
        self.dpi_spin.setRange(36, 1200)
        self.dpi_spin.setValue(150)
        options_row.addWidget(self.dpi_spin)
        options_row.addWidget(QLabel("Qualidade:"))
        self.quality_spin = QSpinBox()
        self.quality_spin.setRange(1, 100)
        self.quality_spin.setValue(90)
        self.quality_spin.setSuffix(" %")
        options_row.addWidget(self.quality_spin)
        layout.addLayout(options_row)

        self.output_edit = QLineEdit(str(Path(settings.output_directory) / "imagens_combinadas.pdf"))
        out_row = QHBoxLayout()
        out_row.addWidget(self.output_edit)
        choose_btn = QPushButton("Escolher destino...")
        choose_btn.clicked.connect(self._choose_output)
        out_row.addWidget(choose_btn)
        layout.addLayout(out_row)

        self.convert_btn = QPushButton("Converter para PDF")
        mark_button_variant(self.convert_btn, "primary")
        self.convert_btn.clicked.connect(self._start_convert)
        layout.addWidget(self.convert_btn)

        self.progress = QProgressBar()
        layout.addWidget(self.progress)

        self.job_queue.job_progress.connect(self._on_progress)
        self.job_queue.job_status_changed.connect(self._on_status_changed)

    def _on_files_dropped(self, paths: list[Path]) -> None:
        for p in paths:
            item = QListWidgetItem(p.name)
            item.setData(Qt.ItemDataRole.UserRole, str(p))
            self.file_list.addItem(item)

    def _remove_selected(self) -> None:
        for item in self.file_list.selectedItems():
            self.file_list.takeItem(self.file_list.row(item))

    def _choose_output(self) -> None:
        path, _ = QFileDialog.getSaveFileName(self, "Salvar como", self.output_edit.text(), "PDF (*.pdf)")
        if path:
            self.output_edit.setText(path)

    def _start_convert(self) -> None:
        paths = [Path(self.file_list.item(i).data(Qt.ItemDataRole.UserRole)) for i in range(self.file_list.count())]
        if not paths:
            QMessageBox.information(self, "Nenhuma imagem", "Adicione ao menos uma imagem.")
            return
        try:
            request = ImagesToPdfRequest(
                image_paths=paths, output_path=Path(self.output_edit.text()),
                dpi=self.dpi_spin.value(), quality=self.quality_spin.value(),
                overwrite_behavior=self.settings.overwrite_behavior,
            )
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Parametros invalidos", str(exc))
            return
        self.convert_btn.setEnabled(False)
        self.progress.setValue(0)
        self._current_job_id = self.job_queue.add_job(run_images_to_pdf, request, label="Imagens -> PDF")
        self.job_queue.start_all()

    def _on_progress(self, job_id: int, done: int, total: int) -> None:
        if job_id != self._current_job_id or not total:
            return
        self.progress.setMaximum(total)
        self.progress.setValue(done)

    def _on_status_changed(self, job_id: int, status: str) -> None:
        if job_id != self._current_job_id:
            return
        job = next(j for j in self.job_queue.jobs() if j.id == job_id)
        if status in (JobStatus.DONE.value, JobStatus.FAILED.value, JobStatus.CANCELLED.value):
            self.convert_btn.setEnabled(True)
        if status == JobStatus.DONE.value:
            QMessageBox.information(self, "Concluido", f"PDF salvo em:\n{job.result.output_path}")
        elif status == JobStatus.FAILED.value:
            QMessageBox.warning(self, "Falha na conversão", job.error_message or "Erro desconhecido.")


_PDF_TO_IMAGE_FORMAT_LABELS: dict[ImageFormat, str] = {
    ImageFormat.JPEG: "JPG",
    ImageFormat.PNG: "PNG",
    ImageFormat.TIFF: "TIFF",
    ImageFormat.WEBP: "WEBP",
}


class _PdfToImagesPanel(QWidget):
    """PDF(s) -> imagens, com seleção de páginas, DPI, qualidade, lote e
    ZIP. Cada PDF carregado vira uma tarefa separada (mesmo padrão usado em
    Dividir PDF e Otimizar PDF)."""

    def __init__(self, settings: AppSettings, parent=None):
        super().__init__(parent)
        self.settings = settings
        self.job_queue = JobQueue(max_concurrent=settings.max_concurrent_tasks, parent=self)
        self.source_paths: list[Path] = []
        layout = QVBoxLayout(self)

        self.drop_area = DropArea(self, allow_multiple=True)
        self.drop_area.files_dropped.connect(self._on_files_dropped)
        layout.addWidget(self.drop_area)

        self.file_list = QListWidget()
        self.file_list.setMaximumHeight(100)
        layout.addWidget(QLabel("PDFs carregados (processamento em lote):"))
        layout.addWidget(self.file_list)

        form = QFormLayout()
        layout.addLayout(form)

        self.ranges_edit = QLineEdit()
        self.ranges_edit.setPlaceholderText("vazio = todas as páginas; ex.: 1,3,5-9")
        form.addRow("Páginas:", self.ranges_edit)

        self.format_combo = QComboBox()
        for fmt, label in _PDF_TO_IMAGE_FORMAT_LABELS.items():
            self.format_combo.addItem(label, fmt)
        self.format_combo.currentIndexChanged.connect(self._update_visible_params)
        form.addRow("Formato:", self.format_combo)

        self.dpi_spin = QSpinBox()
        self.dpi_spin.setRange(36, 1200)
        self.dpi_spin.setValue(150)
        form.addRow("DPI:", self.dpi_spin)

        self.quality_spin = QSpinBox()
        self.quality_spin.setRange(1, 100)
        self.quality_spin.setValue(90)
        self.quality_spin.setSuffix(" %")
        form.addRow("Qualidade (JPG/WEBP):", self.quality_spin)

        self.zip_checkbox = QCheckBox("Gerar arquivo ZIP com as imagens")
        form.addRow("", self.zip_checkbox)

        self.output_dir_edit = QLineEdit(settings.output_directory)
        choose_btn = QPushButton("Escolher pasta de saída...")
        choose_btn.clicked.connect(self._choose_output_dir)
        out_row = QHBoxLayout()
        out_row.addWidget(self.output_dir_edit)
        out_row.addWidget(choose_btn)
        form.addRow("Salvar em:", out_row)

        self.convert_btn = QPushButton("Converter (todos os arquivos carregados)")
        mark_button_variant(self.convert_btn, "primary")
        self.convert_btn.clicked.connect(self._start_convert)
        layout.addWidget(self.convert_btn)

        self.progress = QProgressBar()
        layout.addWidget(self.progress)

        self.results_list = QListWidget()
        self.results_list.setMaximumHeight(100)
        layout.addWidget(self.results_list)

        self.job_queue.job_progress.connect(self._on_progress)
        self.job_queue.job_status_changed.connect(self._on_status_changed)
        self._update_visible_params()

    def _update_visible_params(self) -> None:
        fmt = ImageFormat(self.format_combo.currentData())
        self.quality_spin.setEnabled(fmt in (ImageFormat.JPEG, ImageFormat.WEBP))

    def _on_files_dropped(self, paths: list[Path]) -> None:
        for p in paths:
            if p not in self.source_paths:
                self.source_paths.append(p)
                self.file_list.addItem(str(p.name))

    def _choose_output_dir(self) -> None:
        directory = QFileDialog.getExistingDirectory(self, "Escolher pasta de saída", self.output_dir_edit.text())
        if directory:
            self.output_dir_edit.setText(directory)

    def _start_convert(self) -> None:
        if not self.source_paths:
            QMessageBox.information(self, "Nenhum arquivo", "Adicione ao menos um arquivo PDF.")
            return
        fmt = ImageFormat(self.format_combo.currentData())
        self.results_list.clear()
        self.progress.setValue(0)
        queued = 0
        for path in self.source_paths:
            out_subdir = Path(self.output_dir_edit.text()) / f"{path.stem}_imagens"
            try:
                request = PdfToImagesRequest(
                    source_path=path, output_dir=out_subdir, image_format=fmt,
                    ranges_expression=self.ranges_edit.text() or None,
                    dpi=self.dpi_spin.value(), quality=self.quality_spin.value(),
                    create_zip=self.zip_checkbox.isChecked(), overwrite_behavior=self.settings.overwrite_behavior,
                )
            except Exception as exc:  # noqa: BLE001
                QMessageBox.warning(self, "Parametros invalidos", f"{path.name}: {exc}")
                continue
            self.job_queue.add_job(run_pdf_to_images, request, label=path.name)
            queued += 1
        if queued == 0:
            return
        self.convert_btn.setEnabled(False)
        self.job_queue.start_all()

    def _on_progress(self, job_id: int, done: int, total: int) -> None:
        if total:
            self.progress.setMaximum(total)
            self.progress.setValue(done)

    def _on_status_changed(self, job_id: int, status: str) -> None:
        job = next((j for j in self.job_queue.jobs() if j.id == job_id), None)
        if job is None:
            return
        if status == JobStatus.DONE.value:
            result: PdfToImagesResult = job.result
            self.results_list.addItem(f"{job.label} -> {len(result.output_files)} imagem(ns)" + (f" + ZIP" if result.zip_path else ""))
        elif status == JobStatus.FAILED.value:
            self.results_list.addItem(f"{job.label}: FALHOU — {job.error_message}")
        if all(j.status in (JobStatus.DONE, JobStatus.FAILED, JobStatus.CANCELLED) for j in self.job_queue.jobs()):
            self.convert_btn.setEnabled(True)
            if self.settings.open_output_folder_after_task:
                _open_folder_cross_platform(Path(self.output_dir_edit.text()))


class _PdfToTextPanel(QWidget):
    """PDF(s) -> texto simples (.txt), com seleção de páginas e lote."""

    def __init__(self, settings: AppSettings, parent=None):
        super().__init__(parent)
        self.settings = settings
        self.job_queue = JobQueue(max_concurrent=settings.max_concurrent_tasks, parent=self)
        self.source_paths: list[Path] = []
        layout = QVBoxLayout(self)

        self.drop_area = DropArea(self, allow_multiple=True)
        self.drop_area.files_dropped.connect(self._on_files_dropped)
        layout.addWidget(self.drop_area)

        self.file_list = QListWidget()
        self.file_list.setMaximumHeight(100)
        layout.addWidget(QLabel("PDFs carregados (processamento em lote):"))
        layout.addWidget(self.file_list)

        form = QFormLayout()
        layout.addLayout(form)
        self.ranges_edit = QLineEdit()
        self.ranges_edit.setPlaceholderText("vazio = todas as páginas; ex.: 1,3,5-9")
        form.addRow("Páginas:", self.ranges_edit)

        self.output_dir_edit = QLineEdit(settings.output_directory)
        choose_btn = QPushButton("Escolher pasta de saída...")
        choose_btn.clicked.connect(self._choose_output_dir)
        out_row = QHBoxLayout()
        out_row.addWidget(self.output_dir_edit)
        out_row.addWidget(choose_btn)
        form.addRow("Salvar em:", out_row)

        self.convert_btn = QPushButton("Extrair texto (todos os arquivos carregados)")
        mark_button_variant(self.convert_btn, "primary")
        self.convert_btn.clicked.connect(self._start_convert)
        layout.addWidget(self.convert_btn)

        self.progress = QProgressBar()
        layout.addWidget(self.progress)

        self.results_list = QListWidget()
        self.results_list.setMaximumHeight(100)
        layout.addWidget(self.results_list)

        self.job_queue.job_progress.connect(self._on_progress)
        self.job_queue.job_status_changed.connect(self._on_status_changed)

    def _on_files_dropped(self, paths: list[Path]) -> None:
        for p in paths:
            if p not in self.source_paths:
                self.source_paths.append(p)
                self.file_list.addItem(str(p.name))

    def _choose_output_dir(self) -> None:
        directory = QFileDialog.getExistingDirectory(self, "Escolher pasta de saída", self.output_dir_edit.text())
        if directory:
            self.output_dir_edit.setText(directory)

    def _start_convert(self) -> None:
        if not self.source_paths:
            QMessageBox.information(self, "Nenhum arquivo", "Adicione ao menos um arquivo PDF.")
            return
        self.results_list.clear()
        self.progress.setValue(0)
        queued = 0
        for path in self.source_paths:
            out_path = Path(self.output_dir_edit.text()) / f"{path.stem}.txt"
            try:
                request = PdfToTextRequest(
                    source_path=path, output_path=out_path, ranges_expression=self.ranges_edit.text() or None,
                    overwrite_behavior=self.settings.overwrite_behavior,
                )
            except Exception as exc:  # noqa: BLE001
                QMessageBox.warning(self, "Parametros invalidos", f"{path.name}: {exc}")
                continue
            self.job_queue.add_job(run_pdf_to_text, request, label=path.name)
            queued += 1
        if queued == 0:
            return
        self.convert_btn.setEnabled(False)
        self.job_queue.start_all()

    def _on_progress(self, job_id: int, done: int, total: int) -> None:
        if total:
            self.progress.setMaximum(total)
            self.progress.setValue(done)

    def _on_status_changed(self, job_id: int, status: str) -> None:
        job = next((j for j in self.job_queue.jobs() if j.id == job_id), None)
        if job is None:
            return
        if status == JobStatus.DONE.value:
            result: PdfToTextResult = job.result
            self.results_list.addItem(f"{job.label} -> {result.output_path.name} ({result.total_characters} caracteres)")
        elif status == JobStatus.FAILED.value:
            self.results_list.addItem(f"{job.label}: FALHOU — {job.error_message}")
        if all(j.status in (JobStatus.DONE, JobStatus.FAILED, JobStatus.CANCELLED) for j in self.job_queue.jobs()):
            self.convert_btn.setEnabled(True)
            if self.settings.open_output_folder_after_task:
                _open_folder_cross_platform(Path(self.output_dir_edit.text()))


class _OfficeToPdfPanel(QWidget):
    """Documentos de escritorio -> PDF, somente se o LibreOffice ('soffice')
    for detectado no PATH. Caso contrario, o botao de converter fica
    desabilitado (nunca decorativo) com a instrução de instalação visivel."""

    def __init__(self, settings: AppSettings, parent=None):
        super().__init__(parent)
        self.settings = settings
        self.job_queue = JobQueue(max_concurrent=settings.max_concurrent_tasks, parent=self)
        self.source_paths: list[Path] = []
        self._soffice_available = shutil.which("soffice") is not None
        layout = QVBoxLayout(self)

        if self._soffice_available:
            status_alert = InlineAlert(
                "Conversão de documentos de escritorio disponivel",
                f"LibreOffice detectado ({shutil.which('soffice')}).",
                level="success",
            )
        else:
            status_alert = InlineAlert(
                "Conversão de documentos de escritorio indisponivel",
                "Instale o LibreOffice para converter Word, Excel, PowerPoint e ODF em PDF.",
                level="warning",
                details="LibreOffice ('soffice') não foi encontrado no PATH. Download: https://www.libreoffice.org/download/",
            )
        layout.addWidget(status_alert)

        self.drop_area = DropArea(
            self, allow_multiple=True, accepted_extensions=_OFFICE_EXTENSIONS,
            dialog_filter=_OFFICE_DIALOG_FILTER, dialog_title="Selecionar documentos",
            placeholder_text="Arraste documentos (Word/Excel/PowerPoint/ODF/TXT) aqui\nou clique para selecionar",
        )
        self.drop_area.setEnabled(self._soffice_available)
        self.drop_area.files_dropped.connect(self._on_files_dropped)
        layout.addWidget(self.drop_area)

        self.file_list = QListWidget()
        self.file_list.setMaximumHeight(100)
        layout.addWidget(QLabel("Documentos carregados (processamento em lote):"))
        layout.addWidget(self.file_list)

        self.output_dir_edit = QLineEdit(settings.output_directory)
        choose_btn = QPushButton("Escolher pasta de saída...")
        choose_btn.clicked.connect(self._choose_output_dir)
        out_row = QHBoxLayout()
        out_row.addWidget(self.output_dir_edit)
        out_row.addWidget(choose_btn)
        layout.addLayout(out_row)

        self.convert_btn = QPushButton("Converter para PDF (todos os arquivos carregados)")
        mark_button_variant(self.convert_btn, "primary")
        self.convert_btn.setEnabled(self._soffice_available)
        self.convert_btn.clicked.connect(self._start_convert)
        layout.addWidget(self.convert_btn)

        self.progress = QProgressBar()
        layout.addWidget(self.progress)

        self.results_list = QListWidget()
        self.results_list.setMaximumHeight(100)
        layout.addWidget(self.results_list)

        self.job_queue.job_progress.connect(self._on_progress)
        self.job_queue.job_status_changed.connect(self._on_status_changed)

    def _on_files_dropped(self, paths: list[Path]) -> None:
        for p in paths:
            if p not in self.source_paths:
                self.source_paths.append(p)
                self.file_list.addItem(str(p.name))

    def _choose_output_dir(self) -> None:
        directory = QFileDialog.getExistingDirectory(self, "Escolher pasta de saída", self.output_dir_edit.text())
        if directory:
            self.output_dir_edit.setText(directory)

    def _start_convert(self) -> None:
        if not self._soffice_available:
            return  # botao ja fica desabilitado; guarda extra por segurança
        if not self.source_paths:
            QMessageBox.information(self, "Nenhum arquivo", "Adicione ao menos um documento.")
            return
        self.results_list.clear()
        self.progress.setValue(0)
        queued = 0
        for path in self.source_paths:
            out_path = Path(self.output_dir_edit.text()) / f"{path.stem}.pdf"
            try:
                request = OfficeToPdfRequest(source_path=path, output_path=out_path, overwrite_behavior=self.settings.overwrite_behavior)
            except Exception as exc:  # noqa: BLE001
                QMessageBox.warning(self, "Parametros invalidos", f"{path.name}: {exc}")
                continue
            self.job_queue.add_job(run_office_to_pdf, request, label=path.name)
            queued += 1
        if queued == 0:
            return
        self.convert_btn.setEnabled(False)
        self.job_queue.start_all()

    def _on_progress(self, job_id: int, done: int, total: int) -> None:
        if total:
            self.progress.setMaximum(total)
            self.progress.setValue(done)

    def _on_status_changed(self, job_id: int, status: str) -> None:
        job = next((j for j in self.job_queue.jobs() if j.id == job_id), None)
        if job is None:
            return
        if status == JobStatus.DONE.value:
            result: OfficeToPdfResult = job.result
            self.results_list.addItem(f"{job.label} -> {result.output_path.name}")
        elif status == JobStatus.FAILED.value:
            self.results_list.addItem(f"{job.label}: FALHOU — {job.error_message}")
        if all(j.status in (JobStatus.DONE, JobStatus.FAILED, JobStatus.CANCELLED) for j in self.job_queue.jobs()):
            self.convert_btn.setEnabled(self._soffice_available)
            if self.settings.open_output_folder_after_task:
                _open_folder_cross_platform(Path(self.output_dir_edit.text()))


class _SearchablePdfPlaceholderPanel(QWidget):
    """PDF pesquisavel (via OCR) depende da Fase 4 (OCR), ainda não
    implementada nesta entrega. Aparece desabilitada, com explicacao —
    nunca como um botao decorativo que finge funcionar."""

    def __init__(self, parent=None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        label = QLabel(
            "PDF pesquisavel (adicionar uma camada de texto reconhecida por OCR sobre o PDF) "
            "depende do OCR local (Tesseract/OCRmyPDF), que será implementado na Fase 4 desta suite. "
            "Esta funcionalidade ainda não esta disponivel nesta versao."
        )
        label.setWordWrap(True)
        label.setStyleSheet("color: #6B7A7D; font-style: italic;")
        layout.addWidget(label)
        layout.addStretch(1)


class ConvertView(QWidget):
    """Tela de conversoes (Fase 2): imagens<->PDF, PDF->texto, Office->PDF.
    Cada aba usa o padrão ja estabelecido nas telas anteriores (lote via
    fila de tarefas em segundo plano, cancelamento, progresso)."""

    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        title = QLabel("Converter PDF")
        title.setObjectName("ScreenTitle")
        layout.addWidget(title)

        badge = QLabel("Processamento realizado localmente neste computador")
        badge.setObjectName("LocalBadge")
        layout.addWidget(badge)

        # Cada aba tem sua própria JobQueue interna (ver docstring de
        # _ImagesToPdfPanel) para evitar que o resultado de uma aba seja
        # processado, por engano, pelo callback de outra aba.
        tabs = QTabWidget()
        tabs.addTab(_ImagesToPdfPanel(settings, self), "Imagens -> PDF")
        tabs.addTab(_PdfToImagesPanel(settings, self), "PDF -> Imagens")
        tabs.addTab(_PdfToTextPanel(settings, self), "PDF -> Texto")
        tabs.addTab(_OfficeToPdfPanel(settings, self), "Office -> PDF")
        tabs.addTab(_SearchablePdfPlaceholderPanel(self), "PDF pesquisavel (Fase 4)")
        layout.addWidget(tabs)


# =============================================================================
# 23-B) TELA DE EDICAO (Fase 3): marca d'agua, numeracao/Bates,
#       cabecalho/rodape, texto, imagem, formas, links.
# =============================================================================
_PAGE_TARGET_LABELS: dict[PageTargetMode, str] = {
    PageTargetMode.ALL_PAGES: "Documento completo",
    PageTargetMode.RANGE: "Intervalo de páginas",
    PageTargetMode.ODD_PAGES: "Somente páginas impares",
    PageTargetMode.EVEN_PAGES: "Somente páginas pares",
    PageTargetMode.CURRENT_PAGE: "Somente uma página especifica",
}
_HALIGN_LABELS: dict[HorizontalAlign, str] = {
    HorizontalAlign.LEFT: "Esquerda",
    HorizontalAlign.CENTER: "Centro",
    HorizontalAlign.RIGHT: "Direita",
}
_NUMBERING_MODE_LABELS: dict[NumberingMode, str] = {
    NumberingMode.NUMERIC: "Numeracao simples (ex.: Página 1 de 10)",
    NumberingMode.BATES: "Numeracao Bates (identificador sequencial único)",
}
_SHAPE_KIND_LABELS: dict[ShapeKind, str] = {
    ShapeKind.RECTANGLE: "Retangulo",
    ShapeKind.LINE: "Linha",
}


def _render_pdf_page_to_pixmap(path: Path, page_index: int = 0, target_width_px: int = 340) -> QPixmap:
    pdf = pdfium.PdfDocument(str(path))
    try:
        if page_index < 0 or page_index >= len(pdf):
            page_index = 0
        page = pdf[page_index]
        width_pt, _height_pt = page.get_size()
        scale = target_width_px / width_pt if width_pt else 1.0
        bitmap = page.render(scale=scale)
        pil_image = bitmap.to_pil().convert("RGB")
        qimage = QImage(
            pil_image.tobytes("raw", "RGB"), pil_image.width, pil_image.height,
            pil_image.width * 3, QImage.Format.Format_RGB888,
        )
        return QPixmap.fromImage(qimage)
    finally:
        pdf.close()


class PageTargetSelector(QWidget):
    """Widget composto reutilizado por todas as 7 ferramentas de edicao:
    escolher onde a edicao e aplicada (documento completo, intervalo,
    pares, impares ou uma única página). Evita repetir a mesma logica de
    visibilidade condicional de linhas em 7 telas diferentes."""

    changed = Signal()

    def __init__(self, parent: Optional[QWidget] = None):
        super().__init__(parent)
        self._form = QFormLayout(self)

        self.mode_combo = QComboBox()
        for mode, label in _PAGE_TARGET_LABELS.items():
            self.mode_combo.addItem(label, mode)
        self.mode_combo.currentIndexChanged.connect(self._update_visible_rows)
        self.mode_combo.currentIndexChanged.connect(self.changed.emit)
        self._form.addRow("Aplicar em:", self.mode_combo)

        self.ranges_edit = QLineEdit()
        self.ranges_edit.setPlaceholderText("ex.: 1,3,5-9")
        self._form.addRow("Intervalo:", self.ranges_edit)

        self.current_page_spin = QSpinBox()
        self.current_page_spin.setRange(1, 1)
        self._form.addRow("Numero da página:", self.current_page_spin)

        self._update_visible_rows()

    def set_total_pages(self, total_pages: int) -> None:
        self.current_page_spin.setRange(1, max(1, total_pages))

    def _update_visible_rows(self) -> None:
        mode = PageTargetMode(self.mode_combo.currentData())
        show_ranges = mode is PageTargetMode.RANGE
        show_current = mode is PageTargetMode.CURRENT_PAGE
        set_row_visible = getattr(self._form, "setRowVisible", None)
        if callable(set_row_visible):
            set_row_visible(self.ranges_edit, show_ranges)
            set_row_visible(self.current_page_spin, show_current)
        else:
            self.ranges_edit.setVisible(show_ranges)
            self.current_page_spin.setVisible(show_current)

    def target_kwargs(self) -> dict:
        mode = PageTargetMode(self.mode_combo.currentData())
        return {
            "target_mode": mode,
            "ranges_expression": self.ranges_edit.text() or None,
            "current_page_index": (self.current_page_spin.value() - 1) if mode is PageTargetMode.CURRENT_PAGE else None,
        }

    def preview_page_index(self) -> int:
        mode = PageTargetMode(self.mode_combo.currentData())
        return (self.current_page_spin.value() - 1) if mode is PageTargetMode.CURRENT_PAGE else 0


class _EditToolPanelBase(QWidget):
    """Base comum as 7 telas de edicao: carregar um PDF (com senha se
    necessario), escolher o alvo de páginas, pre-visualizar o resultado em
    uma única página (executando a MESMA funcao de producao sobre uma copia
    minima e descartavel — nunca uma simulacao separada), aplicar em
    segundo plano com cancelamento, e salvar como um novo PDF."""

    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        self.settings = settings
        self.source_path: Optional[Path] = None
        self._password: Optional[str] = None
        self.job_queue = JobQueue(max_concurrent=settings.max_concurrent_tasks, parent=self)
        self._current_job_id: Optional[int] = None
        self._build_ui()
        self.job_queue.job_progress.connect(self._on_progress)
        self.job_queue.job_status_changed.connect(self._on_status_changed)

    # --- pontos de extensao para cada ferramenta concreta ---
    def _tool_title(self) -> str:
        raise NotImplementedError

    def _default_output_suffix(self) -> str:
        raise NotImplementedError

    def _build_tool_fields(self, form: QFormLayout) -> None:
        raise NotImplementedError

    def _build_request(self, output_path: Path):
        raise NotImplementedError

    def _run_service(self, request):
        raise NotImplementedError

    def _format_result_line(self, result) -> str:
        return f"Concluido: {result.pages_affected} página(s) afetada(s)."

    # --- interface comum ---
    def _build_ui(self) -> None:
        root = QVBoxLayout(self)

        self.drop_area = DropArea(self, allow_multiple=False)
        self.drop_area.setMaximumHeight(110)
        self.drop_area.files_dropped.connect(self._on_file_dropped)
        root.addWidget(self.drop_area, stretch=0)

        self.file_label = QLabel("Nenhum arquivo carregado.")
        self.file_label.setWordWrap(True)
        root.addWidget(self.file_label, stretch=0)

        body = QHBoxLayout()
        root.addLayout(body, stretch=1)

        preview_col = QVBoxLayout()
        preview_col.addWidget(QLabel("Pre-visualizacao (página de amostra, aplicada de verdade em uma copia temporaria):"))
        self.preview_label = QLabel("Sem pre-visualizacao ainda.")
        self.preview_label.setObjectName("PreviewSurface")
        self.preview_label.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.preview_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.preview_label.setMinimumSize(240, 320)
        preview_col.addWidget(self.preview_label, stretch=1)
        self.preview_btn = QPushButton("Pre-visualizar")
        self.preview_btn.clicked.connect(self._on_preview)
        preview_col.addWidget(self.preview_btn, stretch=0)
        body.addLayout(preview_col, stretch=1)

        options_box = QGroupBox(self._tool_title())
        options_box.setMinimumWidth(340)
        self.options_form = QFormLayout(options_box)
        self.options_form.setRowWrapPolicy(QFormLayout.RowWrapPolicy.WrapLongRows)
        self.options_form.setFieldGrowthPolicy(QFormLayout.FieldGrowthPolicy.ExpandingFieldsGrow)

        options_scroll = QScrollArea()
        options_scroll.setWidgetResizable(True)
        options_scroll.setFrameShape(QFrame.Shape.NoFrame)
        options_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        options_scroll.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        options_scroll.setMinimumWidth(360)
        options_scroll.setWidget(options_box)
        body.addWidget(options_scroll, stretch=1)

        self.target_selector = PageTargetSelector(self)
        self.options_form.addRow(self.target_selector)

        self._build_tool_fields(self.options_form)

        self.output_edit = QLineEdit()
        self.output_edit.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        choose_btn = QPushButton("Escolher...")
        choose_btn.clicked.connect(self._choose_output)
        out_row = QHBoxLayout()
        out_row.addWidget(self.output_edit, stretch=1)
        out_row.addWidget(choose_btn, stretch=0)
        self.options_form.addRow("Salvar em:", out_row)

        self.apply_btn = QPushButton("Aplicar e salvar como novo PDF")
        mark_button_variant(self.apply_btn, "primary")
        self.apply_btn.clicked.connect(self._on_apply)
        self.apply_btn.setMinimumHeight(32)
        self.options_form.addRow(self.apply_btn)

        self.cancel_btn = QPushButton("Cancelar")
        self.cancel_btn.setEnabled(False)
        self.cancel_btn.clicked.connect(self._on_cancel)
        self.cancel_btn.setMinimumHeight(32)
        self.options_form.addRow(self.cancel_btn)

        self.progress_bar = QProgressBar()
        self.options_form.addRow("Progresso:", self.progress_bar)

        self.results_list = QListWidget()
        self.results_list.setMaximumHeight(90)
        root.addWidget(self.results_list, stretch=0)

    def _on_file_dropped(self, paths: list[Path]) -> None:
        if not paths:
            return
        path = paths[0]
        self._password = None
        try:
            with PdfDocument.open(path) as doc:
                total = doc.page_count
        except PdfPasswordRequired:
            password, ok = ask_password_dialog(self, path.name)
            if not ok:
                return
            try:
                with PdfDocument.open(path, password=password) as doc:
                    total = doc.page_count
                self._password = password
            except Exception as exc:  # noqa: BLE001
                QMessageBox.warning(self, "Não foi possível abrir", str(exc))
                return
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Não foi possível abrir", str(exc))
            return

        self.source_path = path
        self.file_label.setText(f"{path.name} ({total} página(s))")
        self.target_selector.set_total_pages(total)
        default_out = path.with_stem(path.stem + self._default_output_suffix())
        self.output_edit.setText(str(default_out))

    def _choose_output(self) -> None:
        path, _ = QFileDialog.getSaveFileName(self, "Salvar como", self.output_edit.text(), "PDF (*.pdf)")
        if path:
            self.output_edit.setText(path)

    def _on_preview(self) -> None:
        if self.source_path is None:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento PDF primeiro.")
            return
        try:
            with task_temp_dir() as tmp_dir:
                preview_idx = self.target_selector.preview_page_index()
                single_page_src = _extract_single_page_to_temp(self.source_path, preview_idx, self._password, tmp_dir)
                preview_out = tmp_dir / "preview_resultado.pdf"
                request = self._build_request(preview_out)
                # A pre-visualizacao roda no único página extraida, sempre
                # com alvo "documento completo" (ela ja e so aquela página).
                request = request.model_copy(update={
                    "source_path": single_page_src, "output_path": preview_out,
                    "target_mode": PageTargetMode.ALL_PAGES, "ranges_expression": None, "current_page_index": None,
                })
                result = self._run_service(request)
                pixmap = _render_pdf_page_to_pixmap(result.output_path)
                self.preview_label.setPixmap(pixmap.scaled(
                    self.preview_label.width(), self.preview_label.height() * 4,
                    Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation,
                ))
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Não foi possível pre-visualizar", str(exc))

    def _on_apply(self) -> None:
        if self.source_path is None:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento PDF primeiro.")
            return
        if not self.output_edit.text():
            QMessageBox.information(self, "Destino vazio", "Escolha onde salvar o resultado.")
            return
        try:
            request = self._build_request(Path(self.output_edit.text()))
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Parametros invalidos", str(exc))
            return
        self.results_list.clear()
        self.progress_bar.setValue(0)
        self.apply_btn.setEnabled(False)
        self.cancel_btn.setEnabled(True)
        self._current_job_id = self.job_queue.add_job(self._run_service, request, label=self._tool_title())
        self.job_queue.start_all()

    def _on_cancel(self) -> None:
        if self._current_job_id is not None:
            self.job_queue.cancel_job(self._current_job_id)

    def _on_progress(self, job_id: int, done: int, total: int) -> None:
        if job_id != self._current_job_id or not total:
            return
        self.progress_bar.setMaximum(total)
        self.progress_bar.setValue(done)

    def _on_status_changed(self, job_id: int, status: str) -> None:
        if job_id != self._current_job_id:
            return
        job = next(j for j in self.job_queue.jobs() if j.id == job_id)
        if status in (JobStatus.DONE.value, JobStatus.FAILED.value, JobStatus.CANCELLED.value):
            self.apply_btn.setEnabled(True)
            self.cancel_btn.setEnabled(False)
        if status == JobStatus.DONE.value:
            self.results_list.addItem(self._format_result_line(job.result))
            if self.settings.open_output_folder_after_task:
                _open_folder_cross_platform(Path(self.output_edit.text()).parent)
        elif status == JobStatus.FAILED.value:
            self.results_list.addItem(f"FALHOU — {job.error_message}")
        elif status == JobStatus.CANCELLED.value:
            self.results_list.addItem("Cancelado.")


class _ColorField(QWidget):
    """Campo de cor simples: QLineEdit com 6 digitos hexadecimais +
    amostra visual, evitando depender de um seletor de cores nativo (que
    variaria de comportamento entre plataformas)."""

    def __init__(self, default_hex: str = "000000", parent: Optional[QWidget] = None):
        super().__init__(parent)
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        self.edit = QLineEdit(default_hex)
        self.edit.setMaxLength(6)
        self.edit.setPlaceholderText("ex.: FF0000")
        self.swatch = QLabel()
        self.swatch.setFixedSize(24, 24)
        self.swatch.setStyleSheet(f"background-color: #{default_hex}; border: 1px solid #888;")
        self.edit.textChanged.connect(self._update_swatch)
        layout.addWidget(self.edit)
        layout.addWidget(self.swatch)

    def _update_swatch(self, text: str) -> None:
        if _HEX_COLOR_RE.match(text):
            self.swatch.setStyleSheet(f"background-color: #{text}; border: 1px solid #888;")

    def value(self) -> str:
        return self.edit.text() or "000000"


class WatermarkPanel(_EditToolPanelBase):
    def _tool_title(self) -> str:
        return "Marca d'agua"

    def _default_output_suffix(self) -> str:
        return "_marca_dagua"

    def _build_tool_fields(self, form: QFormLayout) -> None:
        self.text_edit = QLineEdit("CONFIDENCIAL")
        form.addRow("Texto:", self.text_edit)

        self.font_size_spin = QSpinBox()
        self.font_size_spin.setRange(6, 300)
        self.font_size_spin.setValue(48)
        form.addRow("Tamanho da fonte:", self.font_size_spin)

        self.color_field = _ColorField("808080")
        form.addRow("Cor:", self.color_field)

        self.opacity_spin = QSpinBox()
        self.opacity_spin.setRange(1, 100)
        self.opacity_spin.setValue(30)
        self.opacity_spin.setSuffix(" %")
        form.addRow("Opacidade:", self.opacity_spin)

        self.rotation_spin = QSpinBox()
        self.rotation_spin.setRange(-180, 180)
        self.rotation_spin.setValue(45)
        self.rotation_spin.setSuffix(" graus")
        form.addRow("Rotacao:", self.rotation_spin)

    def _build_request(self, output_path: Path) -> WatermarkRequest:
        return WatermarkRequest(
            source_path=self.source_path, output_path=output_path, text=self.text_edit.text(),
            font_size=float(self.font_size_spin.value()), color_hex=self.color_field.value(),
            opacity=self.opacity_spin.value() / 100.0, rotation_degrees=float(self.rotation_spin.value()),
            password=self._password, overwrite_behavior=self.settings.overwrite_behavior,
            **self.target_selector.target_kwargs(),
        )

    def _run_service(self, request: WatermarkRequest) -> EditResult:
        return run_add_watermark(request)

    def _format_result_line(self, result: EditResult) -> str:
        return f"Marca d'agua aplicada em {result.pages_affected} página(s) -> {result.output_path.name}"


class PageNumberingPanel(_EditToolPanelBase):
    def _tool_title(self) -> str:
        return "Numeracao de páginas / Bates"

    def _default_output_suffix(self) -> str:
        return "_numerado"

    def _build_tool_fields(self, form: QFormLayout) -> None:
        self.mode_combo = QComboBox()
        for mode, label in _NUMBERING_MODE_LABELS.items():
            self.mode_combo.addItem(label, mode)
        self.mode_combo.currentIndexChanged.connect(self._update_mode_fields)
        form.addRow("Tipo:", self.mode_combo)

        self.format_edit = QLineEdit("Página {page} de {total}")
        form.addRow("Formato (numerico):", self.format_edit)

        self.bates_prefix_edit = QLineEdit()
        form.addRow("Prefixo (Bates):", self.bates_prefix_edit)

        self.bates_start_spin = QSpinBox()
        self.bates_start_spin.setRange(0, 999999999)
        self.bates_start_spin.setValue(1)
        form.addRow("Numero inicial (Bates):", self.bates_start_spin)

        self.bates_digits_spin = QSpinBox()
        self.bates_digits_spin.setRange(1, 12)
        self.bates_digits_spin.setValue(6)
        form.addRow("Digitos (Bates):", self.bates_digits_spin)

        self.font_size_spin = QSpinBox()
        self.font_size_spin.setRange(6, 72)
        self.font_size_spin.setValue(10)
        form.addRow("Tamanho da fonte:", self.font_size_spin)

        self.color_field = _ColorField("000000")
        form.addRow("Cor:", self.color_field)

        self.align_combo = QComboBox()
        for align, label in _HALIGN_LABELS.items():
            self.align_combo.addItem(label, align)
        self.align_combo.setCurrentIndex(list(_HALIGN_LABELS.keys()).index(HorizontalAlign.CENTER))
        form.addRow("Alinhamento:", self.align_combo)

        self.margin_spin = QSpinBox()
        self.margin_spin.setRange(0, 200)
        self.margin_spin.setValue(28)
        self.margin_spin.setSuffix(" pt")
        form.addRow("Margem inferior:", self.margin_spin)

        self._form_ref = form
        self._update_mode_fields()

    def _update_mode_fields(self) -> None:
        mode = NumberingMode(self.mode_combo.currentData())
        is_bates = mode is NumberingMode.BATES
        set_row_visible = getattr(self._form_ref, "setRowVisible", None)
        pairs = [
            (self.format_edit, not is_bates),
            (self.bates_prefix_edit, is_bates),
            (self.bates_start_spin, is_bates),
            (self.bates_digits_spin, is_bates),
        ]
        for widget, visible in pairs:
            if callable(set_row_visible):
                set_row_visible(widget, visible)
            else:
                widget.setVisible(visible)

    def _build_request(self, output_path: Path) -> PageNumberRequest:
        return PageNumberRequest(
            source_path=self.source_path, output_path=output_path,
            mode=NumberingMode(self.mode_combo.currentData()), format_template=self.format_edit.text(),
            font_size=float(self.font_size_spin.value()), color_hex=self.color_field.value(),
            align=HorizontalAlign(self.align_combo.currentData()), margin_pt=float(self.margin_spin.value()),
            bates_prefix=self.bates_prefix_edit.text(), bates_start=self.bates_start_spin.value(),
            bates_digits=self.bates_digits_spin.value(), password=self._password,
            overwrite_behavior=self.settings.overwrite_behavior, **self.target_selector.target_kwargs(),
        )

    def _run_service(self, request: PageNumberRequest) -> PageNumberResult:
        return run_add_page_numbers(request)

    def _format_result_line(self, result: PageNumberResult) -> str:
        return f"{result.pages_affected} página(s) numerada(s): {result.first_label} .. {result.last_label} -> {result.output_path.name}"


class HeaderFooterPanel(_EditToolPanelBase):
    def _tool_title(self) -> str:
        return "Cabecalho e rodape"

    def _default_output_suffix(self) -> str:
        return "_cabecalho_rodape"

    def _build_tool_fields(self, form: QFormLayout) -> None:
        self.header_edit = QLineEdit()
        self.header_edit.setPlaceholderText("vazio = sem cabecalho; aceita {page} e {total}")
        form.addRow("Cabecalho:", self.header_edit)

        self.footer_edit = QLineEdit()
        self.footer_edit.setPlaceholderText("vazio = sem rodape; aceita {page} e {total}")
        form.addRow("Rodape:", self.footer_edit)

        self.font_size_spin = QSpinBox()
        self.font_size_spin.setRange(6, 72)
        self.font_size_spin.setValue(10)
        form.addRow("Tamanho da fonte:", self.font_size_spin)

        self.color_field = _ColorField("000000")
        form.addRow("Cor:", self.color_field)

        self.align_combo = QComboBox()
        for align, label in _HALIGN_LABELS.items():
            self.align_combo.addItem(label, align)
        self.align_combo.setCurrentIndex(list(_HALIGN_LABELS.keys()).index(HorizontalAlign.CENTER))
        form.addRow("Alinhamento:", self.align_combo)

        self.margin_spin = QSpinBox()
        self.margin_spin.setRange(0, 200)
        self.margin_spin.setValue(28)
        self.margin_spin.setSuffix(" pt")
        form.addRow("Margem:", self.margin_spin)

    def _build_request(self, output_path: Path) -> HeaderFooterRequest:
        return HeaderFooterRequest(
            source_path=self.source_path, output_path=output_path,
            header_text=self.header_edit.text() or None, footer_text=self.footer_edit.text() or None,
            font_size=float(self.font_size_spin.value()), color_hex=self.color_field.value(),
            align=HorizontalAlign(self.align_combo.currentData()), margin_pt=float(self.margin_spin.value()),
            password=self._password, overwrite_behavior=self.settings.overwrite_behavior,
            **self.target_selector.target_kwargs(),
        )

    def _run_service(self, request: HeaderFooterRequest) -> EditResult:
        return run_add_header_footer(request)


class TextStampPanel(_EditToolPanelBase):
    def _tool_title(self) -> str:
        return "Texto"

    def _default_output_suffix(self) -> str:
        return "_texto"

    def _build_tool_fields(self, form: QFormLayout) -> None:
        self.text_edit = QLineEdit("Texto de exemplo")
        form.addRow("Texto:", self.text_edit)

        self.x_spin = QSpinBox()
        self.x_spin.setRange(0, 5000)
        self.x_spin.setValue(72)
        self.x_spin.setSuffix(" pt")
        form.addRow("Posicao X (do canto inferior esquerdo):", self.x_spin)

        self.y_spin = QSpinBox()
        self.y_spin.setRange(0, 5000)
        self.y_spin.setValue(72)
        self.y_spin.setSuffix(" pt")
        form.addRow("Posicao Y (do canto inferior esquerdo):", self.y_spin)

        self.font_size_spin = QSpinBox()
        self.font_size_spin.setRange(6, 200)
        self.font_size_spin.setValue(14)
        form.addRow("Tamanho da fonte:", self.font_size_spin)

        self.color_field = _ColorField("000000")
        form.addRow("Cor:", self.color_field)

        self.rotation_spin = QSpinBox()
        self.rotation_spin.setRange(-180, 180)
        self.rotation_spin.setValue(0)
        self.rotation_spin.setSuffix(" graus")
        form.addRow("Rotacao:", self.rotation_spin)

    def _build_request(self, output_path: Path) -> TextStampRequest:
        return TextStampRequest(
            source_path=self.source_path, output_path=output_path, text=self.text_edit.text(),
            x_pt=float(self.x_spin.value()), y_pt=float(self.y_spin.value()),
            font_size=float(self.font_size_spin.value()), color_hex=self.color_field.value(),
            rotation_degrees=float(self.rotation_spin.value()), password=self._password,
            overwrite_behavior=self.settings.overwrite_behavior, **self.target_selector.target_kwargs(),
        )

    def _run_service(self, request: TextStampRequest) -> EditResult:
        return run_add_text_stamp(request)


class ImageStampPanel(_EditToolPanelBase):
    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        self.image_path: Optional[Path] = None
        super().__init__(settings, parent)

    def _tool_title(self) -> str:
        return "Imagem"

    def _default_output_suffix(self) -> str:
        return "_com_imagem"

    def _build_tool_fields(self, form: QFormLayout) -> None:
        self.image_path_edit = QLineEdit()
        self.image_path_edit.setReadOnly(True)
        choose_img_btn = QPushButton("Escolher imagem...")
        choose_img_btn.clicked.connect(self._choose_image)
        img_row = QHBoxLayout()
        img_row.addWidget(self.image_path_edit, stretch=1)
        img_row.addWidget(choose_img_btn, stretch=0)
        form.addRow("Imagem:", img_row)

        self.x_spin = QSpinBox()
        self.x_spin.setRange(0, 5000)
        self.x_spin.setValue(72)
        self.x_spin.setSuffix(" pt")
        form.addRow("Posicao X:", self.x_spin)

        self.y_spin = QSpinBox()
        self.y_spin.setRange(0, 5000)
        self.y_spin.setValue(72)
        self.y_spin.setSuffix(" pt")
        form.addRow("Posicao Y:", self.y_spin)

        self.width_spin = QSpinBox()
        self.width_spin.setRange(1, 5000)
        self.width_spin.setValue(150)
        self.width_spin.setSuffix(" pt")
        form.addRow("Largura:", self.width_spin)

        self.height_spin = QSpinBox()
        self.height_spin.setRange(1, 5000)
        self.height_spin.setValue(100)
        self.height_spin.setSuffix(" pt")
        form.addRow("Altura:", self.height_spin)

        self.opacity_spin = QSpinBox()
        self.opacity_spin.setRange(1, 100)
        self.opacity_spin.setValue(100)
        self.opacity_spin.setSuffix(" %")
        form.addRow("Opacidade (aproximada):", self.opacity_spin)

    def _choose_image(self) -> None:
        path, _ = QFileDialog.getOpenFileName(self, "Selecionar imagem", "", _IMAGE_DIALOG_FILTER)
        if path:
            self.image_path = Path(path)
            self.image_path_edit.setText(path)

    def _build_request(self, output_path: Path) -> ImageStampRequest:
        if self.image_path is None:
            raise ValueError("Escolha uma imagem primeiro.")
        return ImageStampRequest(
            source_path=self.source_path, output_path=output_path, image_path=self.image_path,
            x_pt=float(self.x_spin.value()), y_pt=float(self.y_spin.value()),
            width_pt=float(self.width_spin.value()), height_pt=float(self.height_spin.value()),
            opacity=self.opacity_spin.value() / 100.0, password=self._password,
            overwrite_behavior=self.settings.overwrite_behavior, **self.target_selector.target_kwargs(),
        )

    def _run_service(self, request: ImageStampRequest) -> EditResult:
        return run_add_image_stamp(request)


class ShapeStampPanel(_EditToolPanelBase):
    def _tool_title(self) -> str:
        return "Formas"

    def _default_output_suffix(self) -> str:
        return "_com_forma"

    def _build_tool_fields(self, form: QFormLayout) -> None:
        self.kind_combo = QComboBox()
        for kind, label in _SHAPE_KIND_LABELS.items():
            self.kind_combo.addItem(label, kind)
        self.kind_combo.currentIndexChanged.connect(self._update_kind_fields)
        form.addRow("Tipo:", self.kind_combo)

        self.x1_spin = QSpinBox(); self.x1_spin.setRange(0, 5000); self.x1_spin.setValue(50); self.x1_spin.setSuffix(" pt")
        form.addRow("X1:", self.x1_spin)
        self.y1_spin = QSpinBox(); self.y1_spin.setRange(0, 5000); self.y1_spin.setValue(700); self.y1_spin.setSuffix(" pt")
        form.addRow("Y1:", self.y1_spin)
        self.x2_spin = QSpinBox(); self.x2_spin.setRange(0, 5000); self.x2_spin.setValue(250); self.x2_spin.setSuffix(" pt")
        form.addRow("X2:", self.x2_spin)
        self.y2_spin = QSpinBox(); self.y2_spin.setRange(0, 5000); self.y2_spin.setValue(780); self.y2_spin.setSuffix(" pt")
        form.addRow("Y2:", self.y2_spin)

        self.stroke_color_field = _ColorField("000000")
        form.addRow("Cor do contorno:", self.stroke_color_field)

        self.fill_checkbox = QCheckBox("Preencher (somente retangulo)")
        form.addRow("", self.fill_checkbox)

        self.fill_color_field = _ColorField("FFFF00")
        form.addRow("Cor de preenchimento:", self.fill_color_field)

        self.line_width_spin = QSpinBox()
        self.line_width_spin.setRange(1, 50)
        self.line_width_spin.setValue(2)
        self.line_width_spin.setSuffix(" pt")
        form.addRow("Espessura da linha:", self.line_width_spin)

        self._form_ref = form
        self._update_kind_fields()

    def _update_kind_fields(self) -> None:
        kind = ShapeKind(self.kind_combo.currentData())
        is_rect = kind is ShapeKind.RECTANGLE
        set_row_visible = getattr(self._form_ref, "setRowVisible", None)
        for widget, visible in ((self.fill_checkbox, is_rect), (self.fill_color_field, is_rect)):
            if callable(set_row_visible):
                set_row_visible(widget, visible)
            else:
                widget.setVisible(visible)

    def _build_request(self, output_path: Path) -> ShapeStampRequest:
        kind = ShapeKind(self.kind_combo.currentData())
        fill_hex = self.fill_color_field.value() if (kind is ShapeKind.RECTANGLE and self.fill_checkbox.isChecked()) else None
        return ShapeStampRequest(
            source_path=self.source_path, output_path=output_path, kind=kind,
            x1_pt=float(self.x1_spin.value()), y1_pt=float(self.y1_spin.value()),
            x2_pt=float(self.x2_spin.value()), y2_pt=float(self.y2_spin.value()),
            stroke_color_hex=self.stroke_color_field.value(), fill_color_hex=fill_hex,
            line_width_pt=float(self.line_width_spin.value()), password=self._password,
            overwrite_behavior=self.settings.overwrite_behavior, **self.target_selector.target_kwargs(),
        )

    def _run_service(self, request: ShapeStampRequest) -> EditResult:
        return run_add_shape_stamp(request)


class LinkStampPanel(_EditToolPanelBase):
    def _tool_title(self) -> str:
        return "Links"

    def _default_output_suffix(self) -> str:
        return "_com_link"

    def _build_tool_fields(self, form: QFormLayout) -> None:
        self.x1_spin = QSpinBox(); self.x1_spin.setRange(0, 5000); self.x1_spin.setValue(50); self.x1_spin.setSuffix(" pt")
        form.addRow("X1:", self.x1_spin)
        self.y1_spin = QSpinBox(); self.y1_spin.setRange(0, 5000); self.y1_spin.setValue(700); self.y1_spin.setSuffix(" pt")
        form.addRow("Y1:", self.y1_spin)
        self.x2_spin = QSpinBox(); self.x2_spin.setRange(0, 5000); self.x2_spin.setValue(250); self.x2_spin.setSuffix(" pt")
        form.addRow("X2:", self.x2_spin)
        self.y2_spin = QSpinBox(); self.y2_spin.setRange(0, 5000); self.y2_spin.setValue(780); self.y2_spin.setSuffix(" pt")
        form.addRow("Y2:", self.y2_spin)

        self.url_edit = QLineEdit()
        self.url_edit.setPlaceholderText("https://... (deixe vazio para link interno)")
        form.addRow("URL externa:", self.url_edit)

        self.target_page_spin = QSpinBox()
        self.target_page_spin.setRange(0, 999999)
        self.target_page_spin.setValue(0)
        form.addRow("Página interna de destino (0 = usar URL):", self.target_page_spin)

        self.border_checkbox = QCheckBox("Mostrar borda visivel do link")
        form.addRow("", self.border_checkbox)

    def _build_request(self, output_path: Path) -> LinkAnnotationRequest:
        url = self.url_edit.text().strip() or None
        target_page = self.target_page_spin.value() or None
        if url and target_page:
            raise ValueError("Escolha apenas um destino: URL externa OU página interna (deixe a página em 0 se usar URL).")
        return LinkAnnotationRequest(
            source_path=self.source_path, output_path=output_path,
            x1_pt=float(self.x1_spin.value()), y1_pt=float(self.y1_spin.value()),
            x2_pt=float(self.x2_spin.value()), y2_pt=float(self.y2_spin.value()),
            url=url, target_page_number=target_page, show_border=self.border_checkbox.isChecked(),
            password=self._password, overwrite_behavior=self.settings.overwrite_behavior,
            **self.target_selector.target_kwargs(),
        )

    def _run_service(self, request: LinkAnnotationRequest) -> EditResult:
        return run_add_link(request)


class EditView(QWidget):
    """Tela de edicao (Fase 3): marca d'agua, numeracao/Bates, cabecalho e
    rodape, texto, imagem, formas e links. Cada aba edita um único
    documento por vez (diferente das telas de lote), com pre-visualizacao
    real antes de aplicar, e sempre salva como um novo PDF (nunca sobrescreve
    o original por padrão)."""

    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        title = QLabel("Editar PDF")
        title.setObjectName("ScreenTitle")
        layout.addWidget(title)

        badge = QLabel("Processamento realizado localmente neste computador")
        badge.setObjectName("LocalBadge")
        layout.addWidget(badge)

        note = QLabel(
            "As ferramentas abaixo adicionam conteudo por sobreposicao (marca d'agua, texto, "
            "numeracao, formas, imagens, links) sobre a página existente — isso NÃO e uma edicao "
            "estrutural do texto original do documento, que permanece inalterado por baixo."
        )
        note.setWordWrap(True)
        note.setStyleSheet("color: #6B7A7D; font-style: italic;")
        layout.addWidget(note)

        tabs = QTabWidget()
        tabs.addTab(WatermarkPanel(settings, self), "Marca d'agua")
        tabs.addTab(PageNumberingPanel(settings, self), "Numeracao / Bates")
        tabs.addTab(HeaderFooterPanel(settings, self), "Cabecalho e rodape")
        tabs.addTab(TextStampPanel(settings, self), "Texto")
        tabs.addTab(ImageStampPanel(settings, self), "Imagem")
        tabs.addTab(ShapeStampPanel(settings, self), "Formas")
        tabs.addTab(LinkStampPanel(settings, self), "Links")
        layout.addWidget(tabs)


# =============================================================================
# 23-C) TELA DE OCR (Fase 4): reconhecimento de texto 100% local, via
#       Tesseract e/ou OCRmyPDF — nunca enviado a nenhum serviço externo.
# =============================================================================
class OcrPanel(_EditToolPanelBase):
    """Reutiliza a mesma base de ferramenta de edicao de um único documento
    (drop, senha, alvo de páginas, pre-visualizacao real, fila própria,
    cancelamento) da Fase 3, adaptada para OCR: o motor de fato usado
    (OCRmyPDF preferencialmente, ou Tesseract diretamente como alternativa)
    e detectado de verdade via ``shutil.which`` na hora de montar a tela —
    se nenhum dos dois estiver instalado, o botao de aplicar e desabilitado
    com uma instrução de instalação, em vez de fingir que o OCR funciona."""

    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        self._ocrmypdf_path = shutil.which("ocrmypdf")
        self._tesseract_path = shutil.which("tesseract")
        super().__init__(settings, parent)
        if not self._ocrmypdf_path and not self._tesseract_path:
            self.apply_btn.setEnabled(False)
            self.preview_btn.setEnabled(False)

    def _tool_title(self) -> str:
        return "OCR (reconhecimento de texto local)"

    def _default_output_suffix(self) -> str:
        return "_ocr"

    def _build_tool_fields(self, form: QFormLayout) -> None:
        if self._ocrmypdf_path:
            banner = InlineAlert(
                "OCR disponivel (motor preferido)",
                f"OCRmyPDF detectado ({self._ocrmypdf_path}): preserva marcadores e formularios do PDF original.",
                level="success",
            )
        elif self._tesseract_path:
            banner = InlineAlert(
                "OCR disponivel (motor alternativo)",
                f"Tesseract detectado ({self._tesseract_path}), sem OCRmyPDF: o reconhecimento roda página a "
                "página e não preserva marcadores/formularios do original.",
                level="warning",
                details="Instale o OCRmyPDF para uma reconstrucao mais completa: https://ocrmypdf.readthedocs.io/",
            )
        else:
            banner = InlineAlert(
                "OCR indisponivel",
                "Instale o Tesseract OCR para habilitar o reconhecimento de texto nesta tela.",
                level="error",
                details=(
                    "Nem o Tesseract nem o OCRmyPDF foram detectados no PATH. "
                    "Tesseract: https://github.com/tesseract-ocr/tesseract — "
                    "OCRmyPDF (opcional, recomendado): https://ocrmypdf.readthedocs.io/"
                ),
            )
        form.addRow(banner)

        self.language_combo = QComboBox()
        available_langs = _detect_tesseract_languages()
        if available_langs:
            for lang in available_langs:
                self.language_combo.addItem(lang, lang)
            default_index = self.language_combo.findData("eng")
            if default_index >= 0:
                self.language_combo.setCurrentIndex(default_index)
        else:
            self.language_combo.addItem("eng (padrão — nenhum idioma detectado no Tesseract instalado)", "eng")
        form.addRow("Idioma do OCR:", self.language_combo)

        self.force_ocr_checkbox = QCheckBox("Forcar OCR mesmo em páginas que ja tem texto (reprocessa/rasteriza a página)")
        form.addRow("", self.force_ocr_checkbox)

        self.dpi_spin = QSpinBox()
        self.dpi_spin.setRange(72, 1200)
        self.dpi_spin.setValue(300)
        self.dpi_spin.setSuffix(" DPI")
        form.addRow("Resolucao de renderizacao:", self.dpi_spin)

    def _build_request(self, output_path: Path) -> OcrRequest:
        return OcrRequest(
            source_path=self.source_path, output_path=output_path,
            language=self.language_combo.currentData(), force_ocr=self.force_ocr_checkbox.isChecked(),
            dpi=self.dpi_spin.value(), password=self._password,
            overwrite_behavior=self.settings.overwrite_behavior, **self.target_selector.target_kwargs(),
        )

    def _run_service(self, request: OcrRequest) -> OcrResult:
        return run_ocr_pdf(request)

    def _format_result_line(self, result: OcrResult) -> str:
        return f"OCR ({result.engine_used}) aplicado em {result.pages_ocred} página(s) -> {result.output_path.name}"


class OcrView(QWidget):
    """Tela de OCR local (Fase 4). Reconhecimento de texto 100% local via
    Tesseract e/ou OCRmyPDF: nenhum documento e enviado para nenhum serviço
    de OCR na nuvem."""

    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        title = QLabel("OCR")
        title.setObjectName("ScreenTitle")
        layout.addWidget(title)

        badge = QLabel("Processamento realizado localmente neste computador")
        badge.setObjectName("LocalBadge")
        layout.addWidget(badge)

        note = QLabel(
            "O reconhecimento de texto roda inteiramente nesta máquina, usando o Tesseract e/ou o "
            "OCRmyPDF instalados localmente. Nenhum documento e enviado para nenhum serviço de OCR na nuvem."
        )
        note.setWordWrap(True)
        note.setStyleSheet("color: #6B7A7D; font-style: italic;")
        layout.addWidget(note)

        self.panel = OcrPanel(settings, self)
        layout.addWidget(self.panel)


# =============================================================================
# 23-D) TELA DE FERRAMENTAS AVANCADAS (Fase 5): comparacao, remocao de
#       páginas em branco, correcao de orientação, extração de imagens e
#       anexos, marcadores, inspeção técnica, reparo via qpdf e redação real.
# =============================================================================
def _open_single_pdf_with_password(parent: QWidget, path: Path) -> tuple[Optional[int], Optional[str]]:
    """Helper comum: abre um PDF para descobrir a contagem de páginas,
    pedindo a senha ao usuário se necessario. Retorna (total_paginas,
    senha) ou (None, None) se o usuário cancelar ou o arquivo não puder
    ser aberto."""
    try:
        with PdfDocument.open(path) as doc:
            return doc.page_count, None
    except PdfPasswordRequired:
        password, ok = ask_password_dialog(parent, path.name)
        if not ok:
            return None, None
        try:
            with PdfDocument.open(path, password=password) as doc:
                return doc.page_count, password
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(parent, "Não foi possível abrir", str(exc))
            return None, None
    except Exception as exc:  # noqa: BLE001
        QMessageBox.warning(parent, "Não foi possível abrir", str(exc))
        return None, None


class ComparePanel(QWidget):
    """Compara dois PDFs (baseado em texto extraido de cada página) e
    gera um relatorio .txt com as páginas divergentes."""

    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        self.settings = settings
        self.path_a: Optional[Path] = None
        self.path_b: Optional[Path] = None
        self.password_a: Optional[str] = None
        self.password_b: Optional[str] = None
        self.job_queue = JobQueue(max_concurrent=settings.max_concurrent_tasks, parent=self)
        self._current_job_id: Optional[int] = None
        self._build_ui()
        self.job_queue.job_progress.connect(self._on_progress)
        self.job_queue.job_status_changed.connect(self._on_status_changed)

    def _build_ui(self) -> None:
        root = QVBoxLayout(self)
        drops = QHBoxLayout()
        root.addLayout(drops, stretch=0)

        col_a = QVBoxLayout()
        col_a.addWidget(QLabel("Documento A:"))
        self.drop_a = DropArea(self, allow_multiple=False)
        self.drop_a.setMaximumHeight(90)
        self.drop_a.files_dropped.connect(lambda paths: self._on_file_dropped(paths, is_a=True))
        col_a.addWidget(self.drop_a)
        self.label_a = QLabel("Nenhum arquivo carregado.")
        self.label_a.setWordWrap(True)
        col_a.addWidget(self.label_a)
        drops.addLayout(col_a)

        col_b = QVBoxLayout()
        col_b.addWidget(QLabel("Documento B:"))
        self.drop_b = DropArea(self, allow_multiple=False)
        self.drop_b.setMaximumHeight(90)
        self.drop_b.files_dropped.connect(lambda paths: self._on_file_dropped(paths, is_a=False))
        col_b.addWidget(self.drop_b)
        self.label_b = QLabel("Nenhum arquivo carregado.")
        self.label_b.setWordWrap(True)
        col_b.addWidget(self.label_b)
        drops.addLayout(col_b)

        form = QFormLayout()
        root.addLayout(form, stretch=0)
        self.output_edit = QLineEdit()
        choose_btn = QPushButton("Escolher...")
        choose_btn.clicked.connect(self._choose_output)
        out_row = QHBoxLayout()
        out_row.addWidget(self.output_edit, stretch=1)
        out_row.addWidget(choose_btn, stretch=0)
        form.addRow("Relatorio de saída (.txt):", out_row)

        self.compare_btn = QPushButton("Comparar")
        mark_button_variant(self.compare_btn, "primary")
        self.compare_btn.clicked.connect(self._on_compare)
        form.addRow(self.compare_btn)
        self.cancel_btn = QPushButton("Cancelar")
        self.cancel_btn.setEnabled(False)
        self.cancel_btn.clicked.connect(lambda: self._current_job_id is not None and self.job_queue.cancel_job(self._current_job_id))
        form.addRow(self.cancel_btn)

        self.progress_bar = QProgressBar()
        form.addRow("Progresso:", self.progress_bar)

        self.results_list = QListWidget()
        self.results_list.setMaximumHeight(120)
        root.addWidget(self.results_list, stretch=1)

    def _on_file_dropped(self, paths: list[Path], is_a: bool) -> None:
        if not paths:
            return
        path = paths[0]
        total, password = _open_single_pdf_with_password(self, path)
        if total is None:
            return
        if is_a:
            self.path_a, self.password_a = path, password
            self.label_a.setText(f"{path.name} ({total} página(s))")
        else:
            self.path_b, self.password_b = path, password
            self.label_b.setText(f"{path.name} ({total} página(s))")
        if self.path_a and not self.output_edit.text():
            self.output_edit.setText(str(self.path_a.with_name(f"{self.path_a.stem}_comparacao.txt")))

    def _choose_output(self) -> None:
        path, _ = QFileDialog.getSaveFileName(self, "Salvar relatorio como", self.output_edit.text(), "Texto (*.txt)")
        if path:
            self.output_edit.setText(path)

    def _on_compare(self) -> None:
        if not self.path_a or not self.path_b:
            QMessageBox.information(self, "Arquivos incompletos", "Carregue os dois documentos (A e B) primeiro.")
            return
        if not self.output_edit.text():
            QMessageBox.information(self, "Destino vazio", "Escolha onde salvar o relatorio.")
            return
        request = CompareRequest(
            source_path_a=self.path_a, source_path_b=self.path_b, output_path=Path(self.output_edit.text()),
            password_a=self.password_a, password_b=self.password_b, overwrite_behavior=self.settings.overwrite_behavior,
        )
        self.results_list.clear()
        self.progress_bar.setValue(0)
        self.compare_btn.setEnabled(False)
        self.cancel_btn.setEnabled(True)
        self._current_job_id = self.job_queue.add_job(run_compare, request, label="Comparar PDFs")
        self.job_queue.start_all()

    def _on_progress(self, job_id: int, done: int, total: int) -> None:
        if job_id != self._current_job_id or not total:
            return
        self.progress_bar.setMaximum(total)
        self.progress_bar.setValue(done)

    def _on_status_changed(self, job_id: int, status: str) -> None:
        if job_id != self._current_job_id:
            return
        job = next(j for j in self.job_queue.jobs() if j.id == job_id)
        if status in (JobStatus.DONE.value, JobStatus.FAILED.value, JobStatus.CANCELLED.value):
            self.compare_btn.setEnabled(True)
            self.cancel_btn.setEnabled(False)
        if status == JobStatus.DONE.value:
            result: CompareResult = job.result
            if result.differing_pages:
                self.results_list.addItem(
                    f"Similaridade geral: {result.overall_similarity_percent:.1f}% — "
                    f"{len(result.differing_pages)} página(s) divergente(s): {result.differing_pages}"
                )
            else:
                self.results_list.addItem(f"Documentos identicos em texto (similaridade {result.overall_similarity_percent:.1f}%).")
            self.results_list.addItem(f"Relatorio salvo em: {result.output_path.name}")
        elif status == JobStatus.FAILED.value:
            self.results_list.addItem(f"FALHOU — {job.error_message}")
        elif status == JobStatus.CANCELLED.value:
            self.results_list.addItem("Cancelado.")


class BlankPageRemovalPanel(QWidget):
    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        self.settings = settings
        self.source_path: Optional[Path] = None
        self.password: Optional[str] = None
        self.job_queue = JobQueue(max_concurrent=settings.max_concurrent_tasks, parent=self)
        self._current_job_id: Optional[int] = None
        self._build_ui()
        self.job_queue.job_progress.connect(self._on_progress)
        self.job_queue.job_status_changed.connect(self._on_status_changed)

    def _build_ui(self) -> None:
        root = QVBoxLayout(self)
        self.drop_area = DropArea(self, allow_multiple=False)
        self.drop_area.setMaximumHeight(100)
        self.drop_area.files_dropped.connect(self._on_file_dropped)
        root.addWidget(self.drop_area, stretch=0)
        self.file_label = QLabel("Nenhum arquivo carregado.")
        self.file_label.setWordWrap(True)
        root.addWidget(self.file_label, stretch=0)

        note = QLabel(
            "Deteccao por renderizacao: uma página e considerada em branco quando fica quase toda "
            "branca ao ser renderizada, não apenas quando não tem texto (detecta tambem páginas com "
            "uma imagem em branco)."
        )
        note.setWordWrap(True)
        note.setStyleSheet("color: #6B7A7D; font-style: italic;")
        root.addWidget(note, stretch=0)

        form = QFormLayout()
        root.addLayout(form, stretch=0)
        self.threshold_spin = QDoubleSpinBox()
        self.threshold_spin.setRange(50.0, 100.0)
        self.threshold_spin.setDecimals(1)
        self.threshold_spin.setValue(99.9)
        self.threshold_spin.setSuffix(" %")
        form.addRow("Sensibilidade (limiar de brancura):", self.threshold_spin)

        self.output_edit = QLineEdit()
        choose_btn = QPushButton("Escolher...")
        choose_btn.clicked.connect(self._choose_output)
        out_row = QHBoxLayout()
        out_row.addWidget(self.output_edit, stretch=1)
        out_row.addWidget(choose_btn, stretch=0)
        form.addRow("Salvar em:", out_row)

        self.apply_btn = QPushButton("Remover páginas em branco")
        mark_button_variant(self.apply_btn, "primary")
        self.apply_btn.clicked.connect(self._on_apply)
        form.addRow(self.apply_btn)
        self.cancel_btn = QPushButton("Cancelar")
        self.cancel_btn.setEnabled(False)
        self.cancel_btn.clicked.connect(lambda: self._current_job_id is not None and self.job_queue.cancel_job(self._current_job_id))
        form.addRow(self.cancel_btn)

        self.progress_bar = QProgressBar()
        form.addRow("Progresso:", self.progress_bar)

        self.results_list = QListWidget()
        self.results_list.setMaximumHeight(100)
        root.addWidget(self.results_list, stretch=1)

    def _on_file_dropped(self, paths: list[Path]) -> None:
        if not paths:
            return
        path = paths[0]
        total, password = _open_single_pdf_with_password(self, path)
        if total is None:
            return
        self.source_path, self.password = path, password
        self.file_label.setText(f"{path.name} ({total} página(s))")
        self.output_edit.setText(str(path.with_stem(path.stem + "_sem_brancas")))

    def _choose_output(self) -> None:
        path, _ = QFileDialog.getSaveFileName(self, "Salvar como", self.output_edit.text(), "PDF (*.pdf)")
        if path:
            self.output_edit.setText(path)

    def _on_apply(self) -> None:
        if not self.source_path:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento PDF primeiro.")
            return
        if not self.output_edit.text():
            QMessageBox.information(self, "Destino vazio", "Escolha onde salvar o resultado.")
            return
        request = BlankPageRemovalRequest(
            source_path=self.source_path, output_path=Path(self.output_edit.text()),
            whiteness_threshold_percent=self.threshold_spin.value(), password=self.password,
            overwrite_behavior=self.settings.overwrite_behavior,
        )
        self.results_list.clear()
        self.progress_bar.setValue(0)
        self.apply_btn.setEnabled(False)
        self.cancel_btn.setEnabled(True)
        self._current_job_id = self.job_queue.add_job(run_remove_blank_pages, request, label="Remover páginas em branco")
        self.job_queue.start_all()

    def _on_progress(self, job_id: int, done: int, total: int) -> None:
        if job_id != self._current_job_id or not total:
            return
        self.progress_bar.setMaximum(total)
        self.progress_bar.setValue(done)

    def _on_status_changed(self, job_id: int, status: str) -> None:
        if job_id != self._current_job_id:
            return
        job = next(j for j in self.job_queue.jobs() if j.id == job_id)
        if status in (JobStatus.DONE.value, JobStatus.FAILED.value, JobStatus.CANCELLED.value):
            self.apply_btn.setEnabled(True)
            self.cancel_btn.setEnabled(False)
        if status == JobStatus.DONE.value:
            result: BlankPageRemovalResult = job.result
            self.results_list.addItem(
                f"{len(result.removed_page_numbers)} página(s) em branco removida(s) "
                f"({result.total_pages_before} -> {result.total_pages_after}): {result.removed_page_numbers}"
            )
            if self.settings.open_output_folder_after_task:
                _open_folder_cross_platform(result.output_path.parent)
        elif status == JobStatus.FAILED.value:
            self.results_list.addItem(f"FALHOU — {job.error_message}")
        elif status == JobStatus.CANCELLED.value:
            self.results_list.addItem("Cancelado.")


class OrientationFixPanel(QWidget):
    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        self.settings = settings
        self.source_path: Optional[Path] = None
        self.password: Optional[str] = None
        self.job_queue = JobQueue(max_concurrent=settings.max_concurrent_tasks, parent=self)
        self._current_job_id: Optional[int] = None
        self._build_ui()
        self.job_queue.job_progress.connect(self._on_progress)
        self.job_queue.job_status_changed.connect(self._on_status_changed)

    def _build_ui(self) -> None:
        root = QVBoxLayout(self)
        tesseract_path = shutil.which("tesseract")
        if tesseract_path:
            banner = InlineAlert(
                "Deteccao automática de orientação disponivel",
                f"Tesseract detectado ({tesseract_path}).",
                level="success",
            )
        else:
            banner = InlineAlert(
                "Correcao de orientação indisponivel",
                "Instale o Tesseract OCR para detectar e corrigir a orientação automaticamente.",
                level="error",
                details="Tesseract não foi encontrado no PATH: https://github.com/tesseract-ocr/tesseract",
            )
        root.addWidget(banner, stretch=0)

        self.drop_area = DropArea(self, allow_multiple=False)
        self.drop_area.setMaximumHeight(100)
        self.drop_area.files_dropped.connect(self._on_file_dropped)
        root.addWidget(self.drop_area, stretch=0)
        self.file_label = QLabel("Nenhum arquivo carregado.")
        self.file_label.setWordWrap(True)
        root.addWidget(self.file_label, stretch=0)

        form = QFormLayout()
        root.addLayout(form, stretch=0)
        self.output_edit = QLineEdit()
        choose_btn = QPushButton("Escolher...")
        choose_btn.clicked.connect(self._choose_output)
        out_row = QHBoxLayout()
        out_row.addWidget(self.output_edit, stretch=1)
        out_row.addWidget(choose_btn, stretch=0)
        form.addRow("Salvar em:", out_row)

        self.apply_btn = QPushButton("Detectar e corrigir orientação")
        mark_button_variant(self.apply_btn, "primary")
        self.apply_btn.clicked.connect(self._on_apply)
        self.apply_btn.setEnabled(bool(tesseract_path))
        form.addRow(self.apply_btn)
        self.cancel_btn = QPushButton("Cancelar")
        self.cancel_btn.setEnabled(False)
        self.cancel_btn.clicked.connect(lambda: self._current_job_id is not None and self.job_queue.cancel_job(self._current_job_id))
        form.addRow(self.cancel_btn)

        self.progress_bar = QProgressBar()
        form.addRow("Progresso:", self.progress_bar)

        self.results_list = QListWidget()
        self.results_list.setMaximumHeight(100)
        root.addWidget(self.results_list, stretch=1)

    def _on_file_dropped(self, paths: list[Path]) -> None:
        if not paths:
            return
        path = paths[0]
        total, password = _open_single_pdf_with_password(self, path)
        if total is None:
            return
        self.source_path, self.password = path, password
        self.file_label.setText(f"{path.name} ({total} página(s))")
        self.output_edit.setText(str(path.with_stem(path.stem + "_orientacao_corrigida")))

    def _choose_output(self) -> None:
        path, _ = QFileDialog.getSaveFileName(self, "Salvar como", self.output_edit.text(), "PDF (*.pdf)")
        if path:
            self.output_edit.setText(path)

    def _on_apply(self) -> None:
        if not self.source_path:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento PDF primeiro.")
            return
        if not self.output_edit.text():
            QMessageBox.information(self, "Destino vazio", "Escolha onde salvar o resultado.")
            return
        request = OrientationFixRequest(
            source_path=self.source_path, output_path=Path(self.output_edit.text()),
            password=self.password, overwrite_behavior=self.settings.overwrite_behavior,
        )
        self.results_list.clear()
        self.progress_bar.setValue(0)
        self.apply_btn.setEnabled(False)
        self.cancel_btn.setEnabled(True)
        self._current_job_id = self.job_queue.add_job(run_fix_orientation, request, label="Corrigir orientação")
        self.job_queue.start_all()

    def _on_progress(self, job_id: int, done: int, total: int) -> None:
        if job_id != self._current_job_id or not total:
            return
        self.progress_bar.setMaximum(total)
        self.progress_bar.setValue(done)

    def _on_status_changed(self, job_id: int, status: str) -> None:
        if job_id != self._current_job_id:
            return
        job = next(j for j in self.job_queue.jobs() if j.id == job_id)
        if status in (JobStatus.DONE.value, JobStatus.FAILED.value, JobStatus.CANCELLED.value):
            self.apply_btn.setEnabled(True)
            self.cancel_btn.setEnabled(False)
        if status == JobStatus.DONE.value:
            result: OrientationFixResult = job.result
            self.results_list.addItem(
                f"{result.pages_rotated} de {result.pages_analyzed} página(s) corrigida(s): {result.rotations_applied}"
            )
            if self.settings.open_output_folder_after_task:
                _open_folder_cross_platform(result.output_path.parent)
        elif status == JobStatus.FAILED.value:
            self.results_list.addItem(f"FALHOU — {job.error_message}")
        elif status == JobStatus.CANCELLED.value:
            self.results_list.addItem("Cancelado.")


class ExtractAssetsPanel(QWidget):
    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        self.settings = settings
        self.source_path: Optional[Path] = None
        self.password: Optional[str] = None
        self.job_queue = JobQueue(max_concurrent=settings.max_concurrent_tasks, parent=self)
        self._current_job_id: Optional[int] = None
        self._build_ui()
        self.job_queue.job_progress.connect(self._on_progress)
        self.job_queue.job_status_changed.connect(self._on_status_changed)

    def _build_ui(self) -> None:
        root = QVBoxLayout(self)
        self.drop_area = DropArea(self, allow_multiple=False)
        self.drop_area.setMaximumHeight(100)
        self.drop_area.files_dropped.connect(self._on_file_dropped)
        root.addWidget(self.drop_area, stretch=0)
        self.file_label = QLabel("Nenhum arquivo carregado.")
        self.file_label.setWordWrap(True)
        root.addWidget(self.file_label, stretch=0)

        form = QFormLayout()
        root.addLayout(form, stretch=0)
        self.images_checkbox = QCheckBox("Extrair imagens (salvas como .png)")
        self.images_checkbox.setChecked(True)
        form.addRow("", self.images_checkbox)
        self.attachments_checkbox = QCheckBox("Extrair anexos incorporados")
        self.attachments_checkbox.setChecked(True)
        form.addRow("", self.attachments_checkbox)

        self.output_dir_edit = QLineEdit()
        choose_btn = QPushButton("Escolher...")
        choose_btn.clicked.connect(self._choose_output_dir)
        out_row = QHBoxLayout()
        out_row.addWidget(self.output_dir_edit, stretch=1)
        out_row.addWidget(choose_btn, stretch=0)
        form.addRow("Pasta de saída:", out_row)

        self.apply_btn = QPushButton("Extrair")
        mark_button_variant(self.apply_btn, "primary")
        self.apply_btn.clicked.connect(self._on_apply)
        form.addRow(self.apply_btn)
        self.cancel_btn = QPushButton("Cancelar")
        self.cancel_btn.setEnabled(False)
        self.cancel_btn.clicked.connect(lambda: self._current_job_id is not None and self.job_queue.cancel_job(self._current_job_id))
        form.addRow(self.cancel_btn)

        self.progress_bar = QProgressBar()
        form.addRow("Progresso:", self.progress_bar)

        self.results_list = QListWidget()
        self.results_list.setMaximumHeight(100)
        root.addWidget(self.results_list, stretch=1)

    def _on_file_dropped(self, paths: list[Path]) -> None:
        if not paths:
            return
        path = paths[0]
        total, password = _open_single_pdf_with_password(self, path)
        if total is None:
            return
        self.source_path, self.password = path, password
        self.file_label.setText(f"{path.name} ({total} página(s))")
        self.output_dir_edit.setText(str(path.with_name(f"{path.stem}_extraido")))

    def _choose_output_dir(self) -> None:
        path = QFileDialog.getExistingDirectory(self, "Escolher pasta de saída", self.output_dir_edit.text())
        if path:
            self.output_dir_edit.setText(path)

    def _on_apply(self) -> None:
        if not self.source_path:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento PDF primeiro.")
            return
        if not self.output_dir_edit.text():
            QMessageBox.information(self, "Destino vazio", "Escolha a pasta de saída.")
            return
        try:
            request = ExtractAssetsRequest(
                source_path=self.source_path, output_dir=Path(self.output_dir_edit.text()),
                extract_images=self.images_checkbox.isChecked(), extract_attachments=self.attachments_checkbox.isChecked(),
                password=self.password, overwrite_behavior=self.settings.overwrite_behavior,
            )
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Parametros invalidos", str(exc))
            return
        self.results_list.clear()
        self.progress_bar.setValue(0)
        self.apply_btn.setEnabled(False)
        self.cancel_btn.setEnabled(True)
        self._current_job_id = self.job_queue.add_job(run_extract_assets, request, label="Extrair imagens/anexos")
        self.job_queue.start_all()

    def _on_progress(self, job_id: int, done: int, total: int) -> None:
        if job_id != self._current_job_id or not total:
            return
        self.progress_bar.setMaximum(total)
        self.progress_bar.setValue(done)

    def _on_status_changed(self, job_id: int, status: str) -> None:
        if job_id != self._current_job_id:
            return
        job = next(j for j in self.job_queue.jobs() if j.id == job_id)
        if status in (JobStatus.DONE.value, JobStatus.FAILED.value, JobStatus.CANCELLED.value):
            self.apply_btn.setEnabled(True)
            self.cancel_btn.setEnabled(False)
        if status == JobStatus.DONE.value:
            result: ExtractAssetsResult = job.result
            self.results_list.addItem(f"{len(result.image_files)} imagem(ns) e {len(result.attachment_files)} anexo(s) extraidos.")
            if self.settings.open_output_folder_after_task:
                _open_folder_cross_platform(result.output_dir)
        elif status == JobStatus.FAILED.value:
            self.results_list.addItem(f"FALHOU — {job.error_message}")
        elif status == JobStatus.CANCELLED.value:
            self.results_list.addItem("Cancelado.")


class BookmarksPanel(QWidget):
    """Combina listar, adicionar e limpar marcadores (outline) — as tres
    ações de gerenciamento de marcadores desta ferramenta."""

    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        self.settings = settings
        self.source_path: Optional[Path] = None
        self.password: Optional[str] = None
        self.total_pages = 1
        self._build_ui()

    def _build_ui(self) -> None:
        root = QVBoxLayout(self)
        self.drop_area = DropArea(self, allow_multiple=False)
        self.drop_area.setMaximumHeight(100)
        self.drop_area.files_dropped.connect(self._on_file_dropped)
        root.addWidget(self.drop_area, stretch=0)
        self.file_label = QLabel("Nenhum arquivo carregado.")
        self.file_label.setWordWrap(True)
        root.addWidget(self.file_label, stretch=0)

        list_btn = QPushButton("Listar marcadores existentes")
        list_btn.clicked.connect(self._on_list)
        root.addWidget(list_btn, stretch=0)
        self.bookmarks_list = QListWidget()
        self.bookmarks_list.setMaximumHeight(140)
        root.addWidget(self.bookmarks_list, stretch=1)

        add_box = QGroupBox("Adicionar novo marcador")
        add_form = QFormLayout(add_box)
        self.title_edit = QLineEdit()
        add_form.addRow("Titulo:", self.title_edit)
        self.page_spin = QSpinBox()
        self.page_spin.setRange(1, 1)
        add_form.addRow("Página:", self.page_spin)
        self.add_output_edit = QLineEdit()
        choose_add_btn = QPushButton("Escolher...")
        choose_add_btn.clicked.connect(lambda: self._choose_output(self.add_output_edit))
        add_out_row = QHBoxLayout()
        add_out_row.addWidget(self.add_output_edit, stretch=1)
        add_out_row.addWidget(choose_add_btn, stretch=0)
        add_form.addRow("Salvar em:", add_out_row)
        add_btn = QPushButton("Adicionar marcador e salvar")
        mark_button_variant(add_btn, "primary")
        add_btn.clicked.connect(self._on_add)
        add_form.addRow(add_btn)
        root.addWidget(add_box, stretch=0)

        clear_box = QGroupBox("Remover todos os marcadores")
        clear_form = QFormLayout(clear_box)
        self.clear_output_edit = QLineEdit()
        choose_clear_btn = QPushButton("Escolher...")
        choose_clear_btn.clicked.connect(lambda: self._choose_output(self.clear_output_edit))
        clear_out_row = QHBoxLayout()
        clear_out_row.addWidget(self.clear_output_edit, stretch=1)
        clear_out_row.addWidget(choose_clear_btn, stretch=0)
        clear_form.addRow("Salvar em:", clear_out_row)
        clear_btn = QPushButton("Limpar marcadores e salvar")
        mark_button_variant(clear_btn, "danger")
        clear_btn.clicked.connect(self._on_clear)
        clear_form.addRow(clear_btn)
        root.addWidget(clear_box, stretch=0)

    def _on_file_dropped(self, paths: list[Path]) -> None:
        if not paths:
            return
        path = paths[0]
        total, password = _open_single_pdf_with_password(self, path)
        if total is None:
            return
        self.source_path, self.password, self.total_pages = path, password, total
        self.file_label.setText(f"{path.name} ({total} página(s))")
        self.page_spin.setRange(1, total)
        self.add_output_edit.setText(str(path.with_stem(path.stem + "_com_marcador")))
        self.clear_output_edit.setText(str(path.with_stem(path.stem + "_sem_marcadores")))
        self.bookmarks_list.clear()

    def _choose_output(self, edit: QLineEdit) -> None:
        path, _ = QFileDialog.getSaveFileName(self, "Salvar como", edit.text(), "PDF (*.pdf)")
        if path:
            edit.setText(path)

    def _on_list(self) -> None:
        if not self.source_path:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento PDF primeiro.")
            return
        try:
            result = run_list_bookmarks(ListBookmarksRequest(source_path=self.source_path, password=self.password))
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Erro ao listar marcadores", str(exc))
            return
        self.bookmarks_list.clear()
        if not result.entries:
            self.bookmarks_list.addItem("(nenhum marcador encontrado neste documento)")
            return
        for entry in result.entries:
            indent = "    " * entry.level
            self.bookmarks_list.addItem(f"{indent}{entry.title} -> página {entry.page_number}")

    def _on_add(self) -> None:
        if not self.source_path:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento PDF primeiro.")
            return
        if not self.add_output_edit.text():
            QMessageBox.information(self, "Destino vazio", "Escolha onde salvar o resultado.")
            return
        try:
            request = AddBookmarkRequest(
                source_path=self.source_path, output_path=Path(self.add_output_edit.text()),
                title=self.title_edit.text(), page_number=self.page_spin.value(),
                password=self.password, overwrite_behavior=self.settings.overwrite_behavior,
            )
            result = run_add_bookmark(request)
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Não foi possível adicionar o marcador", str(exc))
            return
        QMessageBox.information(self, "Marcador adicionado", f"Salvo em: {result.output_path.name}")
        if self.settings.open_output_folder_after_task:
            _open_folder_cross_platform(result.output_path.parent)

    def _on_clear(self) -> None:
        if not self.source_path:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento PDF primeiro.")
            return
        if not self.clear_output_edit.text():
            QMessageBox.information(self, "Destino vazio", "Escolha onde salvar o resultado.")
            return
        try:
            request = ClearBookmarksRequest(
                source_path=self.source_path, output_path=Path(self.clear_output_edit.text()),
                password=self.password, overwrite_behavior=self.settings.overwrite_behavior,
            )
            result = run_clear_bookmarks(request)
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Não foi possível limpar os marcadores", str(exc))
            return
        QMessageBox.information(self, "Marcadores removidos", f"Salvo em: {result.output_path.name}")
        if self.settings.open_output_folder_after_task:
            _open_folder_cross_platform(result.output_path.parent)


class InspectionPanel(QWidget):
    """Somente leitura: inspeciona a estrutura técnica do documento sem
    modifica-lo."""

    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        self.settings = settings
        self.source_path: Optional[Path] = None
        self.password: Optional[str] = None
        self._last_report_text = ""
        self._build_ui()

    def _build_ui(self) -> None:
        root = QVBoxLayout(self)
        self.drop_area = DropArea(self, allow_multiple=False)
        self.drop_area.setMaximumHeight(100)
        self.drop_area.files_dropped.connect(self._on_file_dropped)
        root.addWidget(self.drop_area, stretch=0)
        self.file_label = QLabel("Nenhum arquivo carregado.")
        self.file_label.setWordWrap(True)
        root.addWidget(self.file_label, stretch=0)

        buttons_row = QHBoxLayout()
        inspect_btn = QPushButton("Inspecionar")
        mark_button_variant(inspect_btn, "primary")
        inspect_btn.clicked.connect(self._on_inspect)
        buttons_row.addWidget(inspect_btn)
        save_btn = QPushButton("Salvar relatorio como .txt")
        save_btn.clicked.connect(self._on_save_report)
        buttons_row.addWidget(save_btn)
        root.addLayout(buttons_row, stretch=0)

        self.report_view = QPlainTextEdit()
        self.report_view.setReadOnly(True)
        self.report_view.setPlaceholderText("Clique em 'Inspecionar' para ver o relatorio técnico do documento.")
        root.addWidget(self.report_view, stretch=1)

    def _on_file_dropped(self, paths: list[Path]) -> None:
        if not paths:
            return
        path = paths[0]
        total, password = _open_single_pdf_with_password(self, path)
        if total is None:
            return
        self.source_path, self.password = path, password
        self.file_label.setText(f"{path.name} ({total} página(s))")
        self.report_view.clear()

    def _on_inspect(self) -> None:
        if not self.source_path:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento PDF primeiro.")
            return
        try:
            result = run_inspect(InspectionRequest(source_path=self.source_path, password=self.password))
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Não foi possível inspecionar", str(exc))
            return
        self._last_report_text = result.report_text
        self.report_view.setPlainText(result.report_text)

    def _on_save_report(self) -> None:
        if not self._last_report_text:
            QMessageBox.information(self, "Nada para salvar", "Inspecione um documento primeiro.")
            return
        default_name = str(self.source_path.with_suffix(".txt")) if self.source_path else ""
        path, _ = QFileDialog.getSaveFileName(self, "Salvar relatorio como", default_name, "Texto (*.txt)")
        if path:
            Path(path).write_text(self._last_report_text, encoding="utf-8")
            QMessageBox.information(self, "Relatorio salvo", f"Salvo em: {Path(path).name}")


class RepairPanel(QWidget):
    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        self.settings = settings
        self.source_path: Optional[Path] = None
        self.job_queue = JobQueue(max_concurrent=settings.max_concurrent_tasks, parent=self)
        self._current_job_id: Optional[int] = None
        self._build_ui()
        self.job_queue.job_progress.connect(self._on_progress)
        self.job_queue.job_status_changed.connect(self._on_status_changed)

    def _build_ui(self) -> None:
        root = QVBoxLayout(self)
        qpdf_path = shutil.which("qpdf")
        if qpdf_path:
            banner = InlineAlert(
                "Verificação e reparo estrutural disponiveis",
                f"qpdf detectado ({qpdf_path}).",
                level="success",
            )
        else:
            banner = InlineAlert(
                "Verificação e reparo estrutural indisponiveis",
                "Instale o qpdf para verificar e reparar a estrutura de arquivos PDF danificados.",
                level="error",
                details="qpdf não foi encontrado no PATH: https://qpdf.sourceforge.io/",
            )
        root.addWidget(banner, stretch=0)

        self.drop_area = DropArea(self, allow_multiple=False)
        self.drop_area.setMaximumHeight(100)
        self.drop_area.files_dropped.connect(self._on_file_dropped)
        root.addWidget(self.drop_area, stretch=0)
        self.file_label = QLabel("Nenhum arquivo carregado.")
        self.file_label.setWordWrap(True)
        root.addWidget(self.file_label, stretch=0)

        buttons_row = QHBoxLayout()
        self.check_btn = QPushButton("Verificar estrutura (qpdf --check)")
        mark_button_variant(self.check_btn, "primary")
        self.check_btn.clicked.connect(self._on_check)
        self.check_btn.setEnabled(bool(qpdf_path))
        buttons_row.addWidget(self.check_btn)
        root.addLayout(buttons_row, stretch=0)

        self.check_view = QPlainTextEdit()
        self.check_view.setReadOnly(True)
        self.check_view.setMaximumHeight(120)
        self.check_view.setPlaceholderText("Resultado da verificação aparecera aqui.")
        root.addWidget(self.check_view, stretch=0)

        form = QFormLayout()
        root.addLayout(form, stretch=0)
        self.output_edit = QLineEdit()
        choose_btn = QPushButton("Escolher...")
        choose_btn.clicked.connect(self._choose_output)
        out_row = QHBoxLayout()
        out_row.addWidget(self.output_edit, stretch=1)
        out_row.addWidget(choose_btn, stretch=0)
        form.addRow("Salvar em:", out_row)
        self.repair_btn = QPushButton("Reparar e salvar como novo PDF")
        mark_button_variant(self.repair_btn, "primary")
        self.repair_btn.clicked.connect(self._on_repair)
        self.repair_btn.setEnabled(bool(qpdf_path))
        form.addRow(self.repair_btn)
        self.cancel_btn = QPushButton("Cancelar")
        self.cancel_btn.setEnabled(False)
        self.cancel_btn.clicked.connect(lambda: self._current_job_id is not None and self.job_queue.cancel_job(self._current_job_id))
        form.addRow(self.cancel_btn)
        self.progress_bar = QProgressBar()
        form.addRow("Progresso:", self.progress_bar)

        self.results_list = QListWidget()
        self.results_list.setMaximumHeight(90)
        root.addWidget(self.results_list, stretch=1)

    def _on_file_dropped(self, paths: list[Path]) -> None:
        if not paths:
            return
        path = paths[0]
        self.source_path = path
        self.file_label.setText(path.name)
        self.output_edit.setText(str(path.with_stem(path.stem + "_reparado")))
        self.check_view.clear()

    def _choose_output(self) -> None:
        path, _ = QFileDialog.getSaveFileName(self, "Salvar como", self.output_edit.text(), "PDF (*.pdf)")
        if path:
            self.output_edit.setText(path)

    def _on_check(self) -> None:
        if not self.source_path:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento PDF primeiro.")
            return
        try:
            result = run_check_repair(RepairCheckRequest(source_path=self.source_path))
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Não foi possível verificar", str(exc))
            return
        prefix = "VÁLIDO" if result.is_valid else "PROBLEMAS ENCONTRADOS"
        self.check_view.setPlainText(f"[{prefix}]\n{result.report_text}")

    def _on_repair(self) -> None:
        if not self.source_path:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento PDF primeiro.")
            return
        if not self.output_edit.text():
            QMessageBox.information(self, "Destino vazio", "Escolha onde salvar o resultado.")
            return
        request = RepairRequest(
            source_path=self.source_path, output_path=Path(self.output_edit.text()),
            overwrite_behavior=self.settings.overwrite_behavior,
        )
        self.results_list.clear()
        self.progress_bar.setValue(0)
        self.repair_btn.setEnabled(False)
        self.cancel_btn.setEnabled(True)
        self._current_job_id = self.job_queue.add_job(run_repair, request, label="Reparar PDF")
        self.job_queue.start_all()

    def _on_progress(self, job_id: int, done: int, total: int) -> None:
        if job_id != self._current_job_id or not total:
            return
        self.progress_bar.setMaximum(total)
        self.progress_bar.setValue(done)

    def _on_status_changed(self, job_id: int, status: str) -> None:
        if job_id != self._current_job_id:
            return
        job = next(j for j in self.job_queue.jobs() if j.id == job_id)
        if status in (JobStatus.DONE.value, JobStatus.FAILED.value, JobStatus.CANCELLED.value):
            self.repair_btn.setEnabled(True)
            self.cancel_btn.setEnabled(False)
        if status == JobStatus.DONE.value:
            result: RepairResult = job.result
            self.results_list.addItem(f"Reparo concluido -> {result.output_path.name}")
            if self.settings.open_output_folder_after_task:
                _open_folder_cross_platform(result.output_path.parent)
        elif status == JobStatus.FAILED.value:
            self.results_list.addItem(f"FALHOU — {job.error_message}")
        elif status == JobStatus.CANCELLED.value:
            self.results_list.addItem("Cancelado.")


class RedactionPanel(_EditToolPanelBase):
    """Redação real (Fase 5): reutiliza a mesma base das ferramentas de
    edicao da Fase 3 (drop, senha, alvo de páginas, pre-visualizacao real,
    fila própria, cancelamento), mas o motor por baixo remove de verdade o
    texto e as imagens da área selecionada — não e apenas um carimbo de
    forma preto por cima (isso e a diferenca fundamental em relacao ao
    carimbo de forma da Fase 3)."""

    def _tool_title(self) -> str:
        return "Redação real"

    def _default_output_suffix(self) -> str:
        return "_redigido"

    def _build_tool_fields(self, form: QFormLayout) -> None:
        note = InlineAlert(
            "Diferente de um carimbo preto",
            "Esta ferramenta remove de verdade o texto e as imagens dentro do retangulo informado, antes de "
            "desenhar a cobertura visual opaca. Não e o mesmo que a forma preta da tela 'Editar PDF', que "
            "apenas desenha por cima sem remover o conteudo original.",
            level="info",
        )
        form.addRow(note)

        self.x1_spin = QSpinBox(); self.x1_spin.setRange(0, 5000); self.x1_spin.setValue(50); self.x1_spin.setSuffix(" pt")
        form.addRow("X1:", self.x1_spin)
        self.y1_spin = QSpinBox(); self.y1_spin.setRange(0, 5000); self.y1_spin.setValue(700); self.y1_spin.setSuffix(" pt")
        form.addRow("Y1:", self.y1_spin)
        self.x2_spin = QSpinBox(); self.x2_spin.setRange(0, 5000); self.x2_spin.setValue(300); self.x2_spin.setSuffix(" pt")
        form.addRow("X2:", self.x2_spin)
        self.y2_spin = QSpinBox(); self.y2_spin.setRange(0, 5000); self.y2_spin.setValue(780); self.y2_spin.setSuffix(" pt")
        form.addRow("Y2:", self.y2_spin)

        self.fill_color_field = _ColorField("000000")
        form.addRow("Cor da cobertura visual:", self.fill_color_field)

    def _build_request(self, output_path: Path) -> RedactionRequest:
        return RedactionRequest(
            source_path=self.source_path, output_path=output_path,
            x1_pt=float(self.x1_spin.value()), y1_pt=float(self.y1_spin.value()),
            x2_pt=float(self.x2_spin.value()), y2_pt=float(self.y2_spin.value()),
            fill_color_hex=self.fill_color_field.value(), password=self._password,
            overwrite_behavior=self.settings.overwrite_behavior, **self.target_selector.target_kwargs(),
        )

    def _run_service(self, request: RedactionRequest) -> RedactionResult:
        return run_true_redaction(request)

    def _format_result_line(self, result: RedactionResult) -> str:
        return (
            f"Redação real: {result.text_runs_removed} trecho(s) de texto e {result.images_removed} imagem(ns) "
            f"removidos de verdade em {result.pages_affected} página(s) -> {result.output_path.name}"
        )


class AdvancedView(QWidget):
    """Tela de ferramentas avancadas (Fase 5): comparacao, remocao de
    páginas em branco, correcao de orientação, extração de imagens e
    anexos, marcadores, inspeção técnica, reparo via qpdf e redação real."""

    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        title = QLabel("Ferramentas avancadas")
        title.setObjectName("ScreenTitle")
        layout.addWidget(title)

        badge = QLabel("Processamento realizado localmente neste computador")
        badge.setObjectName("LocalBadge")
        layout.addWidget(badge)

        tabs = QTabWidget()
        tabs.addTab(ComparePanel(settings, self), "Comparar PDFs")
        tabs.addTab(BlankPageRemovalPanel(settings, self), "Remover páginas em branco")
        tabs.addTab(OrientationFixPanel(settings, self), "Corrigir orientação")
        tabs.addTab(ExtractAssetsPanel(settings, self), "Extrair imagens/anexos")
        tabs.addTab(BookmarksPanel(settings, self), "Marcadores")
        tabs.addTab(InspectionPanel(settings, self), "Inspeção técnica")
        tabs.addTab(RepairPanel(settings, self), "Reparo (qpdf)")
        tabs.addTab(RedactionPanel(settings, self), "Redação real")
        layout.addWidget(tabs)


# =============================================================================
# 23-E) TELA DE ASSINATURAS (Fase 6): assinatura visual (carimbo, sem
#       validade criptográfica) e assinatura digital criptográfica real via
#       pyHanko (assinar e verificar). As duas NUNCA devem ser confundidas.
# =============================================================================
def _pyhanko_available() -> bool:
    import importlib.util

    return importlib.util.find_spec("pyhanko") is not None


class VisualSignaturePanel(_EditToolPanelBase):
    """Assinatura VISUAL: apenas um carimbo grafico (nome, data, motivo e,
    opcionalmente, uma imagem de assinatura manuscrita). NUNCA possui
    validade criptográfica — ver a aba 'Assinar digitalmente' para isso."""

    def _tool_title(self) -> str:
        return "Assinatura visual (sem validade criptográfica)"

    def _default_output_suffix(self) -> str:
        return "_assinado_visual"

    def _build_tool_fields(self, form: QFormLayout) -> None:
        note = InlineAlert(
            "Sem validade criptográfica",
            "Isto e apenas uma marca grafica (carimbo) sobre a página. Não pode ser verificada como uma "
            "assinatura digital real. Para isso, use a aba 'Assinar digitalmente'.",
            level="warning",
        )
        form.addRow(note)

        self.signer_name_edit = QLineEdit()
        form.addRow("Nome de quem assina:", self.signer_name_edit)

        self.reason_edit = QLineEdit()
        self.reason_edit.setPlaceholderText("opcional, ex.: Aprovacao")
        form.addRow("Motivo:", self.reason_edit)

        self.image_path_edit = QLineEdit()
        self.image_path_edit.setReadOnly(True)
        self.image_path_edit.setPlaceholderText("opcional: imagem de assinatura manuscrita")
        choose_img_btn = QPushButton("Escolher imagem...")
        choose_img_btn.clicked.connect(self._choose_image)
        img_row = QHBoxLayout()
        img_row.addWidget(self.image_path_edit, stretch=1)
        img_row.addWidget(choose_img_btn, stretch=0)
        form.addRow("Imagem (opcional):", img_row)
        self._signature_image_path: Optional[Path] = None

        self.x_spin = QSpinBox(); self.x_spin.setRange(0, 5000); self.x_spin.setValue(72); self.x_spin.setSuffix(" pt")
        form.addRow("Posicao X:", self.x_spin)
        self.y_spin = QSpinBox(); self.y_spin.setRange(0, 5000); self.y_spin.setValue(72); self.y_spin.setSuffix(" pt")
        form.addRow("Posicao Y:", self.y_spin)
        self.width_spin = QSpinBox(); self.width_spin.setRange(50, 5000); self.width_spin.setValue(220); self.width_spin.setSuffix(" pt")
        form.addRow("Largura:", self.width_spin)
        self.height_spin = QSpinBox(); self.height_spin.setRange(30, 5000); self.height_spin.setValue(90); self.height_spin.setSuffix(" pt")
        form.addRow("Altura:", self.height_spin)

    def _choose_image(self) -> None:
        path, _ = QFileDialog.getOpenFileName(self, "Selecionar imagem de assinatura", "", _IMAGE_DIALOG_FILTER)
        if path:
            self._signature_image_path = Path(path)
            self.image_path_edit.setText(path)

    def _build_request(self, output_path: Path) -> VisualSignatureRequest:
        return VisualSignatureRequest(
            source_path=self.source_path, output_path=output_path,
            signer_name=self.signer_name_edit.text(), reason=self.reason_edit.text() or None,
            image_path=self._signature_image_path,
            x_pt=float(self.x_spin.value()), y_pt=float(self.y_spin.value()),
            width_pt=float(self.width_spin.value()), height_pt=float(self.height_spin.value()),
            password=self._password, overwrite_behavior=self.settings.overwrite_behavior,
            **self.target_selector.target_kwargs(),
        )

    def _run_service(self, request: VisualSignatureRequest) -> EditResult:
        return run_add_visual_signature(request)

    def _format_result_line(self, result: EditResult) -> str:
        return f"Assinatura visual aplicada em {result.pages_affected} página(s) -> {result.output_path.name} (sem validade criptográfica)"


class DigitalSignPanel(QWidget):
    """Assinatura digital criptográfica REAL via pyHanko + certificado
    PKCS#12 (.pfx/.p12). Requer o pacote opcional 'pyhanko'."""

    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        self.settings = settings
        self.source_path: Optional[Path] = None
        self.total_pages = 1
        self.pfx_path: Optional[Path] = None
        self.job_queue = JobQueue(max_concurrent=settings.max_concurrent_tasks, parent=self)
        self._current_job_id: Optional[int] = None
        self._build_ui()
        self.job_queue.job_progress.connect(self._on_progress)
        self.job_queue.job_status_changed.connect(self._on_status_changed)

    def _build_ui(self) -> None:
        root = QVBoxLayout(self)
        available = _pyhanko_available()
        if available:
            banner = InlineAlert("Assinatura digital criptográfica disponivel", "pyHanko detectado.", level="success")
        else:
            banner = InlineAlert(
                "Assinatura digital criptográfica indisponivel",
                "Instale o pyHanko para assinar documentos com validade criptográfica real.",
                level="error",
                details="Comando: python -m pip install pyHanko",
            )
        root.addWidget(banner, stretch=0)

        note = InlineAlert(
            "Diferente da assinatura visual",
            "Esta e uma assinatura criptográfica REAL (CMS/PKCS#7) — completamente diferente do carimbo da "
            "aba 'Assinatura visual'. Requer um certificado PKCS#12 (.pfx/.p12) com chave privada.",
            level="info",
        )
        root.addWidget(note, stretch=0)

        self.drop_area = DropArea(self, allow_multiple=False)
        self.drop_area.setMaximumHeight(90)
        self.drop_area.files_dropped.connect(self._on_file_dropped)
        root.addWidget(self.drop_area, stretch=0)
        self.file_label = QLabel("Nenhum arquivo carregado.")
        self.file_label.setWordWrap(True)
        root.addWidget(self.file_label, stretch=0)

        form = QFormLayout()
        root.addLayout(form, stretch=0)

        self.pfx_path_edit = QLineEdit()
        self.pfx_path_edit.setReadOnly(True)
        choose_pfx_btn = QPushButton("Escolher certificado (.pfx/.p12)...")
        choose_pfx_btn.clicked.connect(self._choose_pfx)
        pfx_row = QHBoxLayout()
        pfx_row.addWidget(self.pfx_path_edit, stretch=1)
        pfx_row.addWidget(choose_pfx_btn, stretch=0)
        form.addRow("Certificado PFX/P12:", pfx_row)

        self.pfx_password_edit = QLineEdit()
        self.pfx_password_edit.setEchoMode(QLineEdit.EchoMode.Password)
        form.addRow("Senha do certificado:", self.pfx_password_edit)

        self.field_name_edit = QLineEdit("Assinatura1")
        form.addRow("Nome do campo de assinatura:", self.field_name_edit)
        self.reason_edit = QLineEdit()
        self.reason_edit.setPlaceholderText("opcional")
        form.addRow("Motivo:", self.reason_edit)
        self.location_edit = QLineEdit()
        self.location_edit.setPlaceholderText("opcional")
        form.addRow("Local:", self.location_edit)
        self.contact_edit = QLineEdit()
        self.contact_edit.setPlaceholderText("opcional, ex.: e-mail")
        form.addRow("Contato:", self.contact_edit)

        self.visible_checkbox = QCheckBox("Mostrar um carimbo visivel da assinatura na página")
        self.visible_checkbox.setChecked(True)
        self.visible_checkbox.toggled.connect(self._update_visible_fields)
        form.addRow("", self.visible_checkbox)

        self.page_spin = QSpinBox(); self.page_spin.setRange(1, 1)
        form.addRow("Página do carimbo:", self.page_spin)
        self.x1_spin = QSpinBox(); self.x1_spin.setRange(0, 5000); self.x1_spin.setValue(50); self.x1_spin.setSuffix(" pt")
        form.addRow("X1:", self.x1_spin)
        self.y1_spin = QSpinBox(); self.y1_spin.setRange(0, 5000); self.y1_spin.setValue(50); self.y1_spin.setSuffix(" pt")
        form.addRow("Y1:", self.y1_spin)
        self.x2_spin = QSpinBox(); self.x2_spin.setRange(0, 5000); self.x2_spin.setValue(300); self.x2_spin.setSuffix(" pt")
        form.addRow("X2:", self.x2_spin)
        self.y2_spin = QSpinBox(); self.y2_spin.setRange(0, 5000); self.y2_spin.setValue(130); self.y2_spin.setSuffix(" pt")
        form.addRow("Y2:", self.y2_spin)
        self._form_ref = form
        self._update_visible_fields(True)

        self.output_edit = QLineEdit()
        choose_out_btn = QPushButton("Escolher...")
        choose_out_btn.clicked.connect(self._choose_output)
        out_row = QHBoxLayout()
        out_row.addWidget(self.output_edit, stretch=1)
        out_row.addWidget(choose_out_btn, stretch=0)
        form.addRow("Salvar em:", out_row)

        self.sign_btn = QPushButton("Assinar digitalmente")
        mark_button_variant(self.sign_btn, "primary")
        self.sign_btn.clicked.connect(self._on_sign)
        self.sign_btn.setEnabled(available)
        form.addRow(self.sign_btn)
        self.cancel_btn = QPushButton("Cancelar")
        self.cancel_btn.setEnabled(False)
        self.cancel_btn.clicked.connect(lambda: self._current_job_id is not None and self.job_queue.cancel_job(self._current_job_id))
        form.addRow(self.cancel_btn)
        self.progress_bar = QProgressBar()
        form.addRow("Progresso:", self.progress_bar)

        self.results_list = QListWidget()
        self.results_list.setMaximumHeight(90)
        root.addWidget(self.results_list, stretch=1)

    def _update_visible_fields(self, checked: bool) -> None:
        set_row_visible = getattr(self._form_ref, "setRowVisible", None)
        widgets = (self.page_spin, self.x1_spin, self.y1_spin, self.x2_spin, self.y2_spin)
        for widget in widgets:
            if callable(set_row_visible):
                set_row_visible(widget, checked)
            else:
                widget.setVisible(checked)

    def _on_file_dropped(self, paths: list[Path]) -> None:
        if not paths:
            return
        path = paths[0]
        total, password = _open_single_pdf_with_password(self, path)
        if total is None:
            return
        self.source_path = path
        self.total_pages = total
        self.file_label.setText(f"{path.name} ({total} página(s))")
        self.page_spin.setRange(1, total)
        self.output_edit.setText(str(path.with_stem(path.stem + "_assinado_digital")))

    def _choose_pfx(self) -> None:
        path, _ = QFileDialog.getOpenFileName(self, "Selecionar certificado", "", "Certificado PKCS#12 (*.pfx *.p12)")
        if path:
            self.pfx_path = Path(path)
            self.pfx_path_edit.setText(path)

    def _choose_output(self) -> None:
        path, _ = QFileDialog.getSaveFileName(self, "Salvar como", self.output_edit.text(), "PDF (*.pdf)")
        if path:
            self.output_edit.setText(path)

    def _on_sign(self) -> None:
        if not self.source_path:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento PDF primeiro.")
            return
        if not self.pfx_path:
            QMessageBox.information(self, "Certificado não selecionado", "Escolha um arquivo de certificado PFX/P12.")
            return
        if not self.pfx_password_edit.text():
            QMessageBox.information(self, "Senha vazia", "Informe a senha do certificado.")
            return
        if not self.output_edit.text():
            QMessageBox.information(self, "Destino vazio", "Escolha onde salvar o resultado.")
            return
        try:
            request = DigitalSignatureRequest(
                source_path=self.source_path, output_path=Path(self.output_edit.text()),
                pfx_path=self.pfx_path, pfx_password=self.pfx_password_edit.text(),
                field_name=self.field_name_edit.text(), reason=self.reason_edit.text() or None,
                location=self.location_edit.text() or None, contact_info=self.contact_edit.text() or None,
                visible=self.visible_checkbox.isChecked(), page_number=self.page_spin.value(),
                x1_pt=float(self.x1_spin.value()), y1_pt=float(self.y1_spin.value()),
                x2_pt=float(self.x2_spin.value()), y2_pt=float(self.y2_spin.value()),
                overwrite_behavior=self.settings.overwrite_behavior,
            )
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Parametros invalidos", str(exc))
            return
        self.results_list.clear()
        self.progress_bar.setValue(0)
        self.sign_btn.setEnabled(False)
        self.cancel_btn.setEnabled(True)
        self._current_job_id = self.job_queue.add_job(run_sign_digital, request, label="Assinar digitalmente")
        self.job_queue.start_all()
        # A senha nunca e persistida: usada somente em memória para esta operação.
        self.pfx_password_edit.clear()

    def _on_progress(self, job_id: int, done: int, total: int) -> None:
        if job_id != self._current_job_id or not total:
            return
        self.progress_bar.setMaximum(total)
        self.progress_bar.setValue(done)

    def _on_status_changed(self, job_id: int, status: str) -> None:
        if job_id != self._current_job_id:
            return
        job = next(j for j in self.job_queue.jobs() if j.id == job_id)
        if status in (JobStatus.DONE.value, JobStatus.FAILED.value, JobStatus.CANCELLED.value):
            self.sign_btn.setEnabled(True)
            self.cancel_btn.setEnabled(False)
        if status == JobStatus.DONE.value:
            result: DigitalSignatureResult = job.result
            self.results_list.addItem(
                f"Assinado por '{result.signer_common_name}' -> {result.output_path.name} "
                f"({'visivel' if result.visible else 'invisivel'})"
            )
            if self.settings.open_output_folder_after_task:
                _open_folder_cross_platform(result.output_path.parent)
        elif status == JobStatus.FAILED.value:
            self.results_list.addItem(f"FALHOU — {job.error_message}")
        elif status == JobStatus.CANCELLED.value:
            self.results_list.addItem("Cancelado.")


class VerifySignaturesPanel(QWidget):
    """Verificação criptográfica REAL de assinaturas digitais existentes
    (não apenas 'existe uma assinatura?') via pyHanko."""

    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        self.settings = settings
        self.source_path: Optional[Path] = None
        self._build_ui()

    def _build_ui(self) -> None:
        root = QVBoxLayout(self)
        available = _pyhanko_available()
        if available:
            banner = InlineAlert("Verificação criptográfica disponivel", "pyHanko detectado.", level="success")
        else:
            banner = InlineAlert(
                "Verificação criptográfica indisponivel",
                "Instale o pyHanko para verificar assinaturas digitais criptograficas.",
                level="error",
                details="Comando: python -m pip install pyHanko",
            )
        root.addWidget(banner, stretch=0)

        self.drop_area = DropArea(self, allow_multiple=False)
        self.drop_area.setMaximumHeight(90)
        self.drop_area.files_dropped.connect(self._on_file_dropped)
        root.addWidget(self.drop_area, stretch=0)
        self.file_label = QLabel("Nenhum arquivo carregado.")
        self.file_label.setWordWrap(True)
        root.addWidget(self.file_label, stretch=0)

        self.verify_btn = QPushButton("Verificar assinaturas")
        mark_button_variant(self.verify_btn, "primary")
        self.verify_btn.clicked.connect(self._on_verify)
        self.verify_btn.setEnabled(available)
        root.addWidget(self.verify_btn, stretch=0)

        self.results_list = QListWidget()
        root.addWidget(self.results_list, stretch=1)

    def _on_file_dropped(self, paths: list[Path]) -> None:
        if not paths:
            return
        self.source_path = paths[0]
        self.file_label.setText(self.source_path.name)
        self.results_list.clear()

    def _on_verify(self) -> None:
        if not self.source_path:
            QMessageBox.information(self, "Nenhum arquivo", "Carregue um documento PDF primeiro.")
            return
        try:
            result = run_verify_digital_signatures(VerifySignaturesRequest(source_path=self.source_path))
        except Exception as exc:  # noqa: BLE001
            QMessageBox.warning(self, "Não foi possível verificar", str(exc))
            return
        self.results_list.clear()
        if not result.signatures:
            self.results_list.addItem("Nenhuma assinatura digital encontrada neste documento.")
            return
        for sig in result.signatures:
            veredito = "OK (integra e confiavel)" if sig.overall_ok else (
                "integra, mas NÃO confiavel (cadeia de certificacao não reconhecida)" if sig.intact and not sig.trusted
                else "ADULTERADA OU INVÁLIDA" if not sig.intact else "com ressalvas"
            )
            self.results_list.addItem(
                f"Campo '{sig.field_name}' — assinado por: {sig.signer_common_name or 'desconhecido'} "
                f"em {sig.signing_time_utc or '?'} — {veredito}"
            )


class SignaturesView(QWidget):
    """Tela de assinaturas (Fase 6): assinatura visual (carimbo, sem
    validade criptográfica) e assinatura digital criptográfica real via
    pyHanko (assinar e verificar). As duas ferramentas nunca devem ser
    confundidas — nem no código, nem no texto voltado ao usuário."""

    def __init__(self, settings: AppSettings, parent: Optional[QWidget] = None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        title = QLabel("Assinaturas")
        title.setObjectName("ScreenTitle")
        layout.addWidget(title)

        badge = QLabel("Processamento realizado localmente neste computador")
        badge.setObjectName("LocalBadge")
        layout.addWidget(badge)

        tabs = QTabWidget()
        tabs.addTab(VisualSignaturePanel(settings, self), "Assinatura visual")
        tabs.addTab(DigitalSignPanel(settings, self), "Assinar digitalmente")
        tabs.addTab(VerifySignaturesPanel(settings, self), "Verificar assinaturas")
        layout.addWidget(tabs)


# =============================================================================
# 24) JANELA PRINCIPAL
# =============================================================================
_SIDEBAR_CATEGORIES = ["Inicio", "Organizar", "Otimizar", "Converter", "Editar", "OCR", "Segurança", "Assinaturas", "Avançado"]
_SIDEBAR_ICON_BY_CATEGORY = {
    "Inicio": "home", "Organizar": "merge", "Otimizar": "optimize", "Converter": "convert",
    "Editar": "edit", "OCR": "ocr", "Segurança": "security", "Assinaturas": "signatures", "Avançado": "advanced",
}

# (titulo, descricao, disponivel, destino_ou_None, icone)
_HOME_CARDS_PRINCIPAIS = [
    ("Dividir PDF", "15 modos de divisão: páginas, intervalos, marcadores, texto, regex e mais.", True, "split", "split"),
    ("Unir e organizar PDF", "Unir, reordenar, girar, excluir, duplicar, substituir e extrair páginas.", True, "organize", "merge"),
    ("Otimizar PDF", "Otimização estrutural sempre disponivel + compactação de imagens via Ghostscript, quando instalado.", True, "optimize", "optimize"),
    ("Converter PDF", "Imagens e PDF em ambas as direcoes, PDF para texto, e Office para PDF via LibreOffice, quando instalado.", True, "convert", "convert"),
    ("Editar PDF", "Marca d'agua, numeracao e Bates, cabecalho e rodape, texto, imagem, formas e links.", True, "edit", "edit"),
    ("OCR", "Reconhecimento de texto 100% local via Tesseract e/ou OCRmyPDF, quando instalados.", True, "ocr", "ocr"),
]
_HOME_CARDS_SEGURANCA = [
    ("Segurança e metadados", "Ver, editar e limpar metadados, sanitizar e proteger com senha.", True, "security", "security"),
    ("Assinaturas", "Assinatura visual (carimbo) e assinatura digital criptográfica real com verificação, via pyHanko.", True, "signatures", "signatures"),
    ("Ferramentas avancadas", "Comparar PDFs, remover páginas em branco, corrigir orientação, extrair imagens e anexos, marcadores, inspeção técnica, reparo e redação real.", True, "advanced", "advanced"),
]


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.settings: AppSettings = get_settings()
        self.setWindowTitle(APP_DISPLAY_NAME)
        self.resize(1280, 800)
        self.setMinimumSize(1000, 640)
        self._build_menu()
        self._build_central_widget()
        self._build_status_bar()

    def _icon(self, kind: str, size: int = UiMetrics.ICON_DEFAULT) -> QIcon:
        return make_icon(kind, current_ui_colors().text, size)

    def _build_menu(self) -> None:
        menu = self.menuBar()
        file_menu = menu.addMenu("&Arquivo")
        sair_action = file_menu.addAction(self._icon("cancel", UiMetrics.ICON_SM), "Sair")
        sair_action.setShortcut(QKeySequence("Ctrl+Q"))
        sair_action.triggered.connect(self.close)

        settings_menu = menu.addMenu("&Configurações")
        prefs_action = settings_menu.addAction(self._icon("settings", UiMetrics.ICON_SM), "Preferencias...")
        prefs_action.setShortcut(QKeySequence("Ctrl+,"))
        prefs_action.triggered.connect(self._open_settings)

        help_menu = menu.addMenu("A&juda")
        diag_action = help_menu.addAction(self._icon("verify", UiMetrics.ICON_SM), "Diagnóstico do sistema")
        diag_action.triggered.connect(self._open_diagnostics)
        about_action = help_menu.addAction(self._icon("help", UiMetrics.ICON_SM), "Sobre")
        about_action.setShortcut(QKeySequence("F1"))
        about_action.triggered.connect(self._show_about)

    def _build_central_widget(self) -> None:
        container = QWidget()
        outer = QHBoxLayout(container)
        outer.setContentsMargins(0, 0, 0, 0)
        outer.setSpacing(0)

        outer.addWidget(self._build_sidebar())

        right = QVBoxLayout()
        right.setContentsMargins(UiMetrics.SPACE_LG, UiMetrics.SPACE_MD, UiMetrics.SPACE_LG, UiMetrics.SPACE_LG)
        right.setSpacing(UiMetrics.SPACE_MD)
        outer.addLayout(right, stretch=1)

        right.addWidget(self._build_search_bar())

        self.stack = QStackedWidget()
        right.addWidget(self.stack, stretch=1)

        self.home_page = self._build_home_page()
        self.split_view = SplitView(self.settings)
        self.organize_view = OrganizeView(self.settings)
        self.security_view = SecurityView(self.settings)
        self.optimize_view = OptimizeView(self.settings)
        self.convert_view = ConvertView(self.settings)
        self.edit_view = EditView(self.settings)
        self.ocr_view = OcrView(self.settings)
        self.advanced_view = AdvancedView(self.settings)
        self.signatures_view = SignaturesView(self.settings)

        self.stack.addWidget(self.home_page)       # 0
        self.stack.addWidget(self.split_view)      # 1
        self.stack.addWidget(self.organize_view)   # 2
        self.stack.addWidget(self.security_view)   # 3
        self.stack.addWidget(self.optimize_view)   # 4
        self.stack.addWidget(self.convert_view)    # 5
        self.stack.addWidget(self.edit_view)       # 6
        self.stack.addWidget(self.ocr_view)        # 7
        self.stack.addWidget(self.advanced_view)   # 8
        self.stack.addWidget(self.signatures_view) # 9

        self.setCentralWidget(container)

    def _build_sidebar(self) -> QWidget:
        colors = current_ui_colors()
        panel = QWidget()
        panel.setObjectName("Sidebar")
        panel.setFixedWidth(UiMetrics.SIDEBAR_WIDTH)
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(0, UiMetrics.SPACE_MD, 0, UiMetrics.SPACE_MD)
        layout.setSpacing(0)

        brand = QLabel(APP_DISPLAY_NAME.replace(" Desktop", ""))
        brand.setObjectName("SidebarBrand")
        layout.addWidget(brand)
        subtitle = QLabel("Local  •  Privado  •  Offline")
        subtitle.setObjectName("SidebarSubtitle")
        layout.addWidget(subtitle)

        self.sidebar = QListWidget()
        self.sidebar.setObjectName("Sidebar")
        self.sidebar.setFrameShape(QFrame.Shape.NoFrame)
        self.sidebar.setFocusPolicy(Qt.FocusPolicy.StrongFocus)
        self.sidebar.setUniformItemSizes(True)
        self.sidebar.setIconSize(QSize(UiMetrics.ICON_MD, UiMetrics.ICON_MD))
        for cat in _SIDEBAR_CATEGORIES:
            item = QListWidgetItem(make_icon(_SIDEBAR_ICON_BY_CATEGORY.get(cat, "home"), colors.text2), cat)
            item.setToolTip(cat)
            item.setSizeHint(QSize(UiMetrics.SIDEBAR_WIDTH - 16, 34))
            self.sidebar.addItem(item)
        self.sidebar.setCurrentRow(0)
        self.sidebar.currentRowChanged.connect(self._on_category_selected)
        layout.addWidget(self.sidebar, stretch=1)
        return panel

    def _build_search_bar(self) -> QWidget:
        colors = current_ui_colors()
        self.search_edit = QLineEdit()
        self.search_edit.setPlaceholderText("Pesquisar ferramenta...")
        self.search_edit.setClearButtonEnabled(True)
        self.search_edit.addAction(make_icon("search", colors.text2, UiMetrics.ICON_SM), QLineEdit.ActionPosition.LeadingPosition)
        self.search_edit.setAccessibleName("Pesquisar ferramenta")
        self.search_edit.textChanged.connect(self._filter_cards)
        return self.search_edit

    def _build_home_page(self) -> QWidget:
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        page = QWidget()
        page_layout = QVBoxLayout(page)
        page_layout.setContentsMargins(UiMetrics.SPACE_SM, UiMetrics.SPACE_SM, UiMetrics.SPACE_SM, UiMetrics.SPACE_XL)
        page_layout.setSpacing(UiMetrics.SPACE_LG)

        title = QLabel("O que voce deseja fazer?")
        title.setObjectName("ScreenTitle")
        title.setFont(ui_font(UiMetrics.FONT_TITLE_XL - 4, weight=QFont.Weight.DemiBold))
        page_layout.addWidget(title)
        subtitle = QLabel("Escolha uma ferramenta abaixo. Todo o processamento acontece neste computador.")
        subtitle.setObjectName("ScreenSubtitle")
        page_layout.addWidget(subtitle)

        self._cards: list[tuple[ToolCard, str]] = []
        page_layout.addLayout(self._build_card_section("FERRAMENTAS PRINCIPAIS", _HOME_CARDS_PRINCIPAIS))
        page_layout.addLayout(self._build_card_section("SEGURANÇA E DOCUMENTOS", _HOME_CARDS_SEGURANCA))
        page_layout.addStretch(1)

        scroll.setWidget(page)
        return scroll

    def _build_card_section(self, heading: str, cards_spec: list[tuple[str, str, bool, str, str]]) -> QVBoxLayout:
        section = QVBoxLayout()
        section.setSpacing(UiMetrics.SPACE_SM)
        heading_label = QLabel(heading)
        heading_label.setObjectName("SectionHeading")
        section.addWidget(heading_label)

        grid = QGridLayout()
        grid.setSpacing(UiMetrics.SPACE_MD)
        for i, (title, desc, available, target, icon_kind) in enumerate(cards_spec):
            card = ToolCard(title, desc, available=available, icon_kind=icon_kind)
            if available and target:
                card.clicked.connect(lambda t=target: self._navigate_to(t))
            row, col = divmod(i, 3)
            grid.addWidget(card, row, col)
            self._cards.append((card, f"{title.lower()} {desc.lower()}"))
        for col in range(3):
            grid.setColumnStretch(col, 1)
        section.addLayout(grid)
        return section

    def _build_status_bar(self) -> None:
        bar = self.statusBar()
        colors = current_ui_colors()
        icon_label = QLabel()
        icon_label.setPixmap(make_icon("security", colors.accent, UiMetrics.ICON_SM).pixmap(UiMetrics.ICON_SM, UiMetrics.ICON_SM))
        bar.addWidget(icon_label)
        badge = QLabel("Processamento realizado localmente neste computador")
        badge.setObjectName("LocalBadge")
        bar.addWidget(badge)
        bar.addPermanentWidget(QLabel(f"v{APP_VERSION}"))

    def _navigate_to(self, target: str) -> None:
        mapping = {
            "split": 1, "organize": 2, "security": 3, "optimize": 4, "convert": 5,
            "edit": 6, "ocr": 7, "advanced": 8, "signatures": 9,
        }
        if target in mapping:
            self.stack.setCurrentIndex(mapping[target])
            self.sidebar.blockSignals(True)
            self.sidebar.setCurrentRow(-1)
            self.sidebar.blockSignals(False)

    def _on_category_selected(self, row: int) -> None:
        if row < 0:
            return
        category = _SIDEBAR_CATEGORIES[row]
        mapping = {
            "Organizar": 2, "Segurança": 3, "Otimizar": 4, "Converter": 5,
            "Editar": 6, "OCR": 7, "Assinaturas": 9, "Avançado": 8,
        }
        self.stack.setCurrentIndex(mapping.get(category, 0))

    def _filter_cards(self, text: str) -> None:
        text = text.strip().lower()
        for card, search_text in self._cards:
            card.setVisible(text in search_text if text else True)

    def _open_settings(self) -> None:
        dialog = SettingsDialog(self.settings, self)
        if dialog.exec():
            self.settings = dialog.result_settings()
            apply_theme(QApplication.instance(), self.settings.theme)

    def _open_diagnostics(self) -> None:
        DiagnosticsDialog(self).exec()

    def _show_about(self) -> None:
        QMessageBox.information(
            self, "Sobre",
            f"{APP_DISPLAY_NAME} v{APP_VERSION}\n\n"
            "Suite local e offline de manipulacao de PDF.\n"
            "Processamento realizado localmente neste computador.\n\n"
            "Identidade visual, código e nomes próprios deste projeto.",
        )


# =============================================================================
# 25) CRIACAO DA QApplication / EXECUCAO DA GUI
# =============================================================================
def _install_exception_hook() -> None:
    def hook(exc_type, exc_value, exc_tb):
        logger.error("Exceção não tratada", exc_info=(exc_type, exc_value, exc_tb))
        QMessageBox.critical(
            None, "Erro inesperado",
            f"Ocorreu um erro inesperado:\n{exc_value}\n\nDetalhes tecnicos foram gravados no log da aplicação.",
        )
    sys.excepthook = hook


def run_gui() -> int:
    setup_logging()
    logger.info("Iniciando %s", APP_DISPLAY_NAME)

    app = QApplication(sys.argv)
    app.setApplicationName(APP_DISPLAY_NAME)
    app.setOrganizationName(APP_CONFIG_AUTHOR)
    _install_exception_hook()

    settings = get_settings()
    apply_theme(app, settings.theme)

    window = MainWindow()
    window.show()
    return app.exec()


# =============================================================================
# 26) --self-test (não abre a GUI)
# =============================================================================
def _make_synthetic_pdf(path: Path, page_count: int) -> None:
    writer = PdfWriter()
    for _ in range(page_count):
        writer.add_page(PageObject.create_blank_page(width=595, height=842))
    with open(path, "wb") as fh:
        writer.write(fh)


def _raises(fn: Callable[[], Any]) -> bool:
    try:
        fn()
    except Exception:  # noqa: BLE001
        return True
    return False


def run_self_test() -> int:
    print("=" * 74)
    print(f"{APP_DISPLAY_NAME} v{APP_VERSION} — autoteste (--self-test)")
    print("=" * 74)
    failures: list[str] = []

    def check(label: str, condition: bool, detail: str = "") -> None:
        status = "OK" if condition else "FALHOU"
        print(f"[{status}] {label}" + (f" — {detail}" if detail and not condition else ""))
        if not condition:
            failures.append(label)

    with task_temp_dir() as tmp_dir:
        source = tmp_dir / "sintetico_10paginas.pdf"
        _make_synthetic_pdf(source, 10)
        output_dir = tmp_dir / "saída"
        output_dir.mkdir()

        # --- parser de intervalos ---
        try:
            groups = parse_range_groups("1,3,5-9", 10)
            check("Parser: '1,3,5-9' produz 3 grupos", len(groups) == 3, str(groups))
            check("Parser: intervalo invertido e rejeitado", _raises(lambda: parse_range_groups("9-5", 10)))
            check("Parser: página 0 e rejeitada", _raises(lambda: parse_range_groups("0", 10)))
            check("Parser: página alem do total e rejeitada", _raises(lambda: parse_range_groups("99", 10)))
        except Exception as exc:  # noqa: BLE001
            check("Parser de intervalos", False, str(exc))

        # --- divisão ---
        try:
            split_req = SplitRequest(source_path=source, mode=SplitMode.EACH_PAGE, output_dir=output_dir)
            split_result = run_split(split_req)
            check("Dividir: cada página em um PDF gera 10 arquivos", len(split_result.output_files) == 10)
            for f in split_result.output_files:
                with PdfDocument.open(f) as doc:
                    check(f"Reabrir {f.name} tem 1 página", doc.page_count == 1)
        except Exception as exc:  # noqa: BLE001
            check("Divisão (cada página)", False, str(exc))

        try:
            split_req_zip = SplitRequest(source_path=source, mode=SplitMode.INTO_N_FILES, into_n_files=3, output_dir=output_dir, create_zip=True)
            split_result_zip = run_split(split_req_zip)
            total_after_split = sum(PdfDocument.open(f).page_count for f in split_result_zip.output_files)
            check("Dividir em 3 arquivos preserva total de páginas", total_after_split == 10)
            check("ZIP foi gerado", split_result_zip.zip_path is not None and split_result_zip.zip_path.exists())
        except Exception as exc:  # noqa: BLE001
            check("Divisão em N arquivos + ZIP", False, str(exc))

        # --- uniao ---
        try:
            source_b = tmp_dir / "sintetico_5paginas.pdf"
            _make_synthetic_pdf(source_b, 5)
            merge_req = MergeRequest(source_paths=[source, source_b], output_path=output_dir / "unido.pdf")
            merge_result = run_merge(merge_req)
            check("Uniao produz 15 páginas", merge_result.total_pages == 15)
            with PdfDocument.open(merge_result.output_path) as doc:
                check("Reabrir uniao confirma 15 páginas", doc.page_count == 15)
        except Exception as exc:  # noqa: BLE001
            check("Uniao de PDFs", False, str(exc))

        # --- reordenar / girar / excluir / duplicar / inserir página em branco ---
        try:
            reorder_result = run_reorder(ReorderRequest(source_path=source, new_order=list(reversed(range(10))), output_path=output_dir / "reordenado.pdf"))
            with PdfDocument.open(reorder_result.output_path) as doc:
                check("Reordenar preserva contagem de páginas", doc.page_count == 10)
        except Exception as exc:  # noqa: BLE001
            check("Reordenacao", False, str(exc))

        try:
            rotate_result = run_rotate(RotateRequest(source_path=source, page_indices=[0], degrees=90, output_path=output_dir / "girado.pdf"))
            with PdfDocument.open(rotate_result.output_path) as doc:
                rotated_page_rotation = int(doc.reader.pages[0].get("/Rotate", 0)) % 360
                check("Rotacao aplicada na página 0", rotated_page_rotation == 90)
        except Exception as exc:  # noqa: BLE001
            check("Rotacao", False, str(exc))

        try:
            delete_result = run_delete(DeleteRequest(source_path=source, page_indices=[0, 1], output_path=output_dir / "sem_2paginas.pdf"))
            check("Exclusao remove 2 páginas (10 -> 8)", delete_result.total_pages == 8)
        except Exception as exc:  # noqa: BLE001
            check("Exclusao de páginas", False, str(exc))

        try:
            duplicate_result = run_duplicate(DuplicateRequest(source_path=source, page_indices=[0], output_path=output_dir / "duplicado.pdf"))
            check("Duplicacao de 1 página (10 -> 11)", duplicate_result.total_pages == 11)
        except Exception as exc:  # noqa: BLE001
            check("Duplicacao de páginas", False, str(exc))

        try:
            insert_result = run_insert_blank(InsertBlankRequest(source_path=source, insert_after_index=-1, count=2, output_path=output_dir / "com_brancas.pdf"))
            check("Insercao de 2 páginas em branco (10 -> 12)", insert_result.total_pages == 12)
        except Exception as exc:  # noqa: BLE001
            check("Insercao de página em branco", False, str(exc))

        try:
            extract_result = run_extract_pages(ExtractPagesRequest(source_path=source, ranges_expression="1,3,5", output_path=output_dir / "extraido.pdf"))
            check("Extração de 3 páginas especificas", extract_result.total_pages == 3)
        except Exception as exc:  # noqa: BLE001
            check("Extração de páginas", False, str(exc))

        try:
            invert_result = run_invert_order(InvertOrderRequest(source_path=source, output_path=output_dir / "invertido.pdf"))
            check("Inversao de ordem preserva contagem", invert_result.total_pages == 10)
        except Exception as exc:  # noqa: BLE001
            check("Inversao de ordem", False, str(exc))

        # --- criptografia (round-trip real: protege e reabre com senha) ---
        try:
            encrypt_result = run_encrypt(EncryptRequest(source_path=source, output_path=output_dir / "protegido.pdf", user_password="teste-123"))
            rejection_ok = False
            try:
                PdfDocument.open(encrypt_result.output_path)
            except PdfPasswordRequired:
                rejection_ok = True
            check("Abrir PDF protegido sem senha e rejeitado", rejection_ok)
            with PdfDocument.open(encrypt_result.output_path, password="teste-123") as doc:
                check("Abrir PDF protegido com a senha correta funciona", doc.page_count == 10)
        except Exception as exc:  # noqa: BLE001
            check("Proteção por senha (criptografia)", False, str(exc))

        # --- sanitizacao e metadados ---
        try:
            sanitize_result = run_sanitize(SanitizeRequest(source_path=source, output_path=output_dir / "sanitizado.pdf"))
            check("Sanitizacao preserva contagem de páginas", sanitize_result.total_pages == 10)
        except Exception as exc:  # noqa: BLE001
            check("Sanitizacao", False, str(exc))

        try:
            meta_result = run_update_metadata(MetadataRequest(source_path=source, output_path=output_dir / "com_metadados.pdf", fields=MetadataFields(title="Titulo de teste")))
            with PdfDocument.open(meta_result.output_path) as doc:
                gravado = (doc.reader.metadata or {}).get("/Title")
                check("Metadados: titulo gravado corretamente", gravado == "Titulo de teste")
        except Exception as exc:  # noqa: BLE001
            check("Atualizacao de metadados", False, str(exc))

        # --- otimização / compactação (Fase 1) ---
        try:
            optimize_result = run_optimize(CompressionRequest(
                source_path=source, output_path=output_dir / "otimizado_estrutural.pdf",
                level=CompressionLevel.BALANCED, force_structural_only=True,
            ))
            check("Otimização estrutural não usou Ghostscript (forcado)", optimize_result.used_ghostscript is False)
            with PdfDocument.open(optimize_result.output_path) as doc:
                check("Otimização estrutural preserva contagem de páginas", doc.page_count == 10)
            check(
                "Otimização estrutural relata tamanhos e percentual coerentes",
                optimize_result.original_size_bytes > 0 and optimize_result.final_size_bytes > 0,
            )
        except Exception as exc:  # noqa: BLE001
            check("Otimização estrutural (sem Ghostscript)", False, str(exc))

        try:
            gs_path = shutil.which("gs")
            optimize_auto = run_optimize(CompressionRequest(
                source_path=source, output_path=output_dir / "otimizado_auto.pdf", level=CompressionLevel.MAXIMUM,
            ))
            check(
                f"Otimização automática usa Ghostscript somente se detectado (detectado={bool(gs_path)})",
                optimize_auto.used_ghostscript == bool(gs_path),
            )
            with PdfDocument.open(optimize_auto.output_path) as doc:
                check("Saída da otimização automática reabre com a mesma contagem de páginas", doc.page_count == 10)
        except Exception as exc:  # noqa: BLE001
            check("Otimização automática (deteccao de Ghostscript)", False, str(exc))

        try:
            remove_meta_result = run_optimize(CompressionRequest(
                source_path=source, output_path=output_dir / "otimizado_sem_metadados.pdf",
                level=CompressionLevel.BALANCED, remove_metadata=True, force_structural_only=True,
            ))
            with PdfDocument.open(remove_meta_result.output_path) as doc:
                titulo_restante = (doc.reader.metadata or {}).get("/Title", "")
                check("Otimização com remocao de metadados limpa o titulo", not titulo_restante)
        except Exception as exc:  # noqa: BLE001
            check("Otimização com remocao de metadados", False, str(exc))

        check(
            "Nível personalizado sem DPI/qualidade e rejeitado",
            _raises(lambda: CompressionRequest(source_path=source, output_path=output_dir / "inválido.pdf", level=CompressionLevel.CUSTOM)),
        )

        try:
            optimize_cancelled_ok = False
            try:
                run_optimize(
                    CompressionRequest(source_path=source, output_path=output_dir / "otimizado_cancelado.pdf", level=CompressionLevel.BALANCED),
                    cancel_check=lambda: True,
                )
            except OperationCancelled:
                optimize_cancelled_ok = True
            check("Cancelamento da otimização levanta OperationCancelled", optimize_cancelled_ok)
            check("Cancelamento da otimização não deixa arquivo de saída parcial", not (output_dir / "otimizado_cancelado.pdf").exists())
        except Exception as exc:  # noqa: BLE001
            check("Cancelamento da otimização", False, str(exc))

        # --- conversoes (Fase 2) ---
        try:
            img_a = tmp_dir / "img_a.png"
            img_b = tmp_dir / "img_b.jpg"
            PILImage.new("RGB", (120, 160), (255, 0, 0)).save(img_a)
            PILImage.new("RGB", (120, 160), (0, 255, 0)).save(img_b)
            images_result = run_images_to_pdf(ImagesToPdfRequest(
                image_paths=[img_a, img_b], output_path=output_dir / "imagens_combinadas.pdf", dpi=150, quality=85,
            ))
            with PdfDocument.open(images_result.output_path) as doc:
                check("Imagens->PDF combina 2 imagens em 2 páginas", doc.page_count == 2)
        except Exception as exc:  # noqa: BLE001
            check("Conversão Imagens->PDF", False, str(exc))

        check(
            "Imagens->PDF rejeita lista vazia de imagens",
            _raises(lambda: ImagesToPdfRequest(image_paths=[], output_path=output_dir / "vazio.pdf")),
        )

        try:
            for fmt in ImageFormat:
                images_out_dir = output_dir / f"pdf_para_{fmt.value}"
                images_result2 = run_pdf_to_images(PdfToImagesRequest(
                    source_path=source, output_dir=images_out_dir, image_format=fmt,
                    ranges_expression="1,2", dpi=96, quality=80,
                ))
                check(f"PDF->{fmt.value}: 2 páginas selecionadas geram 2 imagens", len(images_result2.output_files) == 2)
        except Exception as exc:  # noqa: BLE001
            check("Conversão PDF->Imagens", False, str(exc))

        try:
            text_result = run_pdf_to_text(PdfToTextRequest(source_path=source, output_path=output_dir / "texto_extraido.txt"))
            check("PDF->Texto processa todas as 10 páginas", text_result.pages_processed == 10)
            conteudo = text_result.output_path.read_text(encoding="utf-8")
            check("PDF->Texto inclui marcador da página 1", "Página 1" in conteudo)
        except Exception as exc:  # noqa: BLE001
            check("Conversão PDF->Texto", False, str(exc))

        try:
            images_cancelled_ok = False
            try:
                run_images_to_pdf(
                    ImagesToPdfRequest(image_paths=[img_a, img_b], output_path=output_dir / "imagens_cancelado.pdf"),
                    cancel_check=lambda: True,
                )
            except OperationCancelled:
                images_cancelled_ok = True
            check("Cancelamento de Imagens->PDF levanta OperationCancelled", images_cancelled_ok)
            check("Cancelamento de Imagens->PDF não deixa arquivo parcial", not (output_dir / "imagens_cancelado.pdf").exists())
        except Exception as exc:  # noqa: BLE001
            check("Cancelamento de Imagens->PDF", False, str(exc))

        soffice_path = shutil.which("soffice")
        try:
            office_src = tmp_dir / "documento_teste.txt"
            office_src.write_text("Documento de teste para autoteste de conversão Office -> PDF.", encoding="utf-8")
            if soffice_path:
                office_result = run_office_to_pdf(OfficeToPdfRequest(source_path=office_src, output_path=output_dir / "office_convertido.pdf"))
                check("Office->PDF (LibreOffice detectado) produz um PDF válido", office_result.output_path.exists())
                with PdfDocument.open(office_result.output_path) as doc:
                    check("PDF gerado pelo LibreOffice reabre com ao menos 1 página", doc.page_count >= 1)
            else:
                office_rejected_ok = False
                try:
                    run_office_to_pdf(OfficeToPdfRequest(source_path=office_src, output_path=output_dir / "office_convertido.pdf"))
                except ExternalToolError:
                    office_rejected_ok = True
                check("Office->PDF sem LibreOffice detectado levanta ExternalToolError com instrução clara", office_rejected_ok)
        except Exception as exc:  # noqa: BLE001
            check(f"Conversão Office->PDF (LibreOffice detectado={bool(soffice_path)})", False, str(exc))

        # --- edicao: marca d'agua, numeracao/Bates, cabecalho/rodape, texto, imagem, formas, links (Fase 3) ---
        try:
            wm_result = run_add_watermark(WatermarkRequest(
                source_path=source, output_path=output_dir / "marca_dagua.pdf", text="CONFIDENCIAL",
                target_mode=PageTargetMode.ALL_PAGES,
            ))
            check("Marca d'agua aplicada em todas as 10 páginas", wm_result.pages_affected == 10)
            with PdfDocument.open(wm_result.output_path) as doc:
                texto_pag0 = doc.reader.pages[0].extract_text()
                check("Texto da marca d'agua e encontrado na página extraida", "CONFIDENCIAL" in texto_pag0)
        except Exception as exc:  # noqa: BLE001
            check("Marca d'agua", False, str(exc))

        try:
            num_result = run_add_page_numbers(PageNumberRequest(
                source_path=source, output_path=output_dir / "numerado_impares.pdf",
                mode=NumberingMode.NUMERIC, target_mode=PageTargetMode.ODD_PAGES,
            ))
            check("Numeracao em páginas impares afeta 5 de 10 páginas", num_result.pages_affected == 5)
        except Exception as exc:  # noqa: BLE001
            check("Numeracao de páginas (impares)", False, str(exc))

        try:
            bates_result = run_add_page_numbers(PageNumberRequest(
                source_path=source, output_path=output_dir / "bates.pdf", mode=NumberingMode.BATES,
                bates_prefix="ABC", bates_start=100, bates_digits=6, target_mode=PageTargetMode.ALL_PAGES,
            ))
            check("Bates: primeiro rotulo e ABC000100", bates_result.first_label == "ABC000100")
            check("Bates: ultimo rotulo e ABC000109 (10 páginas a partir de 100)", bates_result.last_label == "ABC000109")
        except Exception as exc:  # noqa: BLE001
            check("Numeracao Bates", False, str(exc))

        try:
            hf_result = run_add_header_footer(HeaderFooterRequest(
                source_path=source, output_path=output_dir / "cabecalho_rodape.pdf",
                header_text="Relatorio {page}/{total}", footer_text="Confidencial", target_mode=PageTargetMode.ALL_PAGES,
            ))
            check("Cabecalho e rodape aplicados nas 10 páginas", hf_result.pages_affected == 10)
        except Exception as exc:  # noqa: BLE001
            check("Cabecalho e rodape", False, str(exc))

        try:
            text_stamp_result = run_add_text_stamp(TextStampRequest(
                source_path=source, output_path=output_dir / "texto_pagina_atual.pdf", text="Nota",
                x_pt=72, y_pt=72, target_mode=PageTargetMode.CURRENT_PAGE, current_page_index=2,
            ))
            check("Carimbo de texto em página especifica afeta somente 1 página", text_stamp_result.pages_affected == 1)
        except Exception as exc:  # noqa: BLE001
            check("Carimbo de texto", False, str(exc))

        try:
            shape_result = run_add_shape_stamp(ShapeStampRequest(
                source_path=source, output_path=output_dir / "com_forma.pdf", kind=ShapeKind.RECTANGLE,
                x1_pt=50, y1_pt=700, x2_pt=250, y2_pt=780, stroke_color_hex="FF0000", fill_color_hex="FFFF00",
                target_mode=PageTargetMode.ALL_PAGES,
            ))
            check("Forma (retangulo preenchido) aplicada nas 10 páginas", shape_result.pages_affected == 10)
        except Exception as exc:  # noqa: BLE001
            check("Carimbo de forma", False, str(exc))

        try:
            stamp_img = tmp_dir / "carimbo.png"
            PILImage.new("RGB", (80, 60), (0, 0, 255)).save(stamp_img)
            image_stamp_result = run_add_image_stamp(ImageStampRequest(
                source_path=source, output_path=output_dir / "com_imagem.pdf", image_path=stamp_img,
                x_pt=72, y_pt=72, width_pt=100, height_pt=75, target_mode=PageTargetMode.ALL_PAGES,
            ))
            check("Carimbo de imagem aplicado nas 10 páginas", image_stamp_result.pages_affected == 10)
        except Exception as exc:  # noqa: BLE001
            check("Carimbo de imagem", False, str(exc))

        try:
            link_result = run_add_link(LinkAnnotationRequest(
                source_path=source, output_path=output_dir / "com_link.pdf",
                x1_pt=50, y1_pt=700, x2_pt=250, y2_pt=780, url="https://example.com",
                target_mode=PageTargetMode.ALL_PAGES,
            ))
            check("Anotacao de link aplicada nas 10 páginas", link_result.pages_affected == 10)
            with PdfDocument.open(link_result.output_path) as doc:
                annots = doc.reader.pages[0].get("/Annots")
                check("Página 0 do PDF com link possui pelo menos uma anotacao", bool(annots) and len(annots) >= 1)
        except Exception as exc:  # noqa: BLE001
            check("Anotacao de link", False, str(exc))

        check(
            "Link exige URL OU página interna, não ambos",
            _raises(lambda: LinkAnnotationRequest(
                source_path=source, output_path=output_dir / "link_invalido.pdf",
                x1_pt=0, y1_pt=0, x2_pt=10, y2_pt=10, url="https://example.com", target_page_number=2,
                target_mode=PageTargetMode.ALL_PAGES,
            )),
        )

        check(
            "Alvo RANGE sem expressao de intervalo e rejeitado",
            _raises(lambda: WatermarkRequest(
                source_path=source, output_path=output_dir / "invalido2.pdf", text="X", target_mode=PageTargetMode.RANGE,
            )),
        )

        try:
            edit_cancelled_ok = False
            try:
                run_add_watermark(
                    WatermarkRequest(source_path=source, output_path=output_dir / "marca_dagua_cancelada.pdf", text="X", target_mode=PageTargetMode.ALL_PAGES),
                    cancel_check=lambda: True,
                )
            except OperationCancelled:
                edit_cancelled_ok = True
            check("Cancelamento da marca d'agua levanta OperationCancelled", edit_cancelled_ok)
            check("Cancelamento da marca d'agua não deixa arquivo parcial", not (output_dir / "marca_dagua_cancelada.pdf").exists())
        except Exception as exc:  # noqa: BLE001
            check("Cancelamento de edicao", False, str(exc))

        # --- OCR local (Fase 4): nunca envia o documento a nenhum serviço externo ---
        tesseract_path = shutil.which("tesseract")
        ocrmypdf_path = shutil.which("ocrmypdf")
        try:
            from PIL import ImageDraw as _ImageDraw, ImageFont as _ImageFont
            scanned_img = PILImage.new("RGB", (800, 300), "white")
            draw = _ImageDraw.Draw(scanned_img)
            try:
                font = _ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 70)
            except Exception:  # noqa: BLE001
                font = _ImageFont.load_default()
            draw.text((50, 100), "AUTOTESTE", fill="black", font=font)
            scanned_pdf = tmp_dir / "escaneado_sintetico.pdf"
            scanned_img.save(scanned_pdf, "PDF", resolution=200.0)

            with PdfDocument.open(scanned_pdf) as doc:
                pre_ocr_text = doc.reader.pages[0].extract_text()
            check("PDF escaneado sintetico não tem camada de texto antes do OCR", not pre_ocr_text.strip())

            if tesseract_path or ocrmypdf_path:
                ocr_result = run_ocr_pdf(OcrRequest(
                    source_path=scanned_pdf, output_path=output_dir / "ocr_resultado.pdf",
                    language="eng", target_mode=PageTargetMode.ALL_PAGES,
                ))
                check(
                    f"OCR ({ocr_result.engine_used}) processa a página escaneada",
                    ocr_result.pages_ocred == 1,
                )
                with PdfDocument.open(ocr_result.output_path) as doc:
                    post_ocr_text = doc.reader.pages[0].extract_text()
                check("Texto 'AUTOTESTE' e reconhecido de verdade após o OCR", "autoteste" in post_ocr_text.lower())
                expected_engine = "ocrmypdf" if ocrmypdf_path else "tesseract_fallback"
                check(f"Motor de OCR usado bate com a deteccao real (esperado={expected_engine})", ocr_result.engine_used == expected_engine)
            else:
                ocr_rejected_ok = False
                try:
                    run_ocr_pdf(OcrRequest(source_path=scanned_pdf, output_path=output_dir / "ocr_deveria_falhar.pdf", language="eng"))
                except ExternalToolError:
                    ocr_rejected_ok = True
                check("OCR sem Tesseract/OCRmyPDF detectado levanta ExternalToolError com instrução clara", ocr_rejected_ok)
        except Exception as exc:  # noqa: BLE001
            check(f"OCR local (Tesseract detectado={bool(tesseract_path)}, OCRmyPDF detectado={bool(ocrmypdf_path)})", False, str(exc))

        if tesseract_path or ocrmypdf_path:
            try:
                ocr_range_result = run_ocr_pdf(OcrRequest(
                    source_path=scanned_pdf, output_path=output_dir / "ocr_intervalo.pdf",
                    language="eng", target_mode=PageTargetMode.RANGE, ranges_expression="1",
                ))
                check("OCR com alvo de intervalo explicito processa a página esperada", ocr_range_result.pages_ocred == 1)
            except Exception as exc:  # noqa: BLE001
                check("OCR com alvo de intervalo explicito", False, str(exc))

            try:
                ocr_cancelled_ok = False
                try:
                    run_ocr_pdf(
                        OcrRequest(source_path=scanned_pdf, output_path=output_dir / "ocr_cancelado.pdf", language="eng"),
                        cancel_check=lambda: True,
                    )
                except OperationCancelled:
                    ocr_cancelled_ok = True
                check("Cancelamento do OCR levanta OperationCancelled", ocr_cancelled_ok)
                check("Cancelamento do OCR não deixa arquivo de saída parcial", not (output_dir / "ocr_cancelado.pdf").exists())
            except Exception as exc:  # noqa: BLE001
                check("Cancelamento do OCR", False, str(exc))

        check(
            "OCR rejeita idioma vazio",
            _raises(lambda: OcrRequest(source_path=source, output_path=output_dir / "ocr_idioma_invalido.pdf", language="   ")),
        )

        # --- ferramentas avancadas (Fase 5) ---
        try:
            cmp_a = tmp_dir / "cmp_a.pdf"
            cmp_b = tmp_dir / "cmp_b.pdf"
            _make_synthetic_pdf(cmp_a, 3)
            _make_synthetic_pdf(cmp_b, 3)
            run_add_text_stamp(TextStampRequest(
                source_path=cmp_b, output_path=cmp_b, text="MUDOU AQUI", x_pt=50, y_pt=50,
                overwrite_behavior=OverwriteBehavior.OVERWRITE,
                target_mode=PageTargetMode.CURRENT_PAGE, current_page_index=1,
            ))
            compare_result = run_compare(CompareRequest(source_path_a=cmp_a, source_path_b=cmp_b, output_path=output_dir / "comparacao.txt"))
            check("Comparacao detecta exatamente a página 2 como divergente", compare_result.differing_pages == [2])
            check("Relatorio de comparacao foi salvo em disco", compare_result.output_path.exists())
        except Exception as exc:  # noqa: BLE001
            check("Comparacao de PDFs", False, str(exc))

        try:
            blank_src = tmp_dir / "com_brancas.pdf"
            _make_synthetic_pdf(blank_src, 4)
            blank_stamped = tmp_dir / "com_brancas_stamped.pdf"
            run_add_text_stamp(TextStampRequest(
                source_path=blank_src, output_path=blank_stamped, text="CONTEUDO REAL", x_pt=50, y_pt=700, font_size=24,
                target_mode=PageTargetMode.RANGE, ranges_expression="2,4",
            ))
            blank_result = run_remove_blank_pages(BlankPageRemovalRequest(source_path=blank_stamped, output_path=output_dir / "sem_brancas.pdf"))
            check("Remocao de páginas em branco detecta as 2 páginas em branco corretas", blank_result.removed_page_numbers == [1, 3])
            check("Remocao de páginas em branco preserva as 2 páginas com conteudo", blank_result.total_pages_after == 2)
        except Exception as exc:  # noqa: BLE001
            check("Remocao de páginas em branco", False, str(exc))

        tesseract_path_adv = shutil.which("tesseract")
        if tesseract_path_adv:
            try:
                from PIL import ImageDraw as _ImageDraw2, ImageFont as _ImageFont2
                img_normal = PILImage.new("RGB", (600, 800), "white")
                draw2 = _ImageDraw2.Draw(img_normal)
                try:
                    font2 = _ImageFont2.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32)
                except Exception:  # noqa: BLE001
                    font2 = _ImageFont2.load_default()
                for li, line in enumerate([
                    "TEXTO NORMAL PARA TESTE DE ORIENTAÇÃO OSD",
                    "SEGUNDA LINHA DE TEXTO PARA GARANTIR VOLUME",
                    "TERCEIRA LINHA COM MAIS CONTEUDO RECONHECIVEL",
                    "QUARTA LINHA FINAL DO PARAGRAFO DE TESTE AQUI",
                ]):
                    draw2.text((40, 50 + li * 60), line, fill="black", font=font2)
                img_rotated = img_normal.rotate(180)
                orient_p1 = tmp_dir / "orient_p1.pdf"
                orient_p2 = tmp_dir / "orient_p2.pdf"
                img_normal.save(orient_p1, "PDF", resolution=150.0)
                img_rotated.save(orient_p2, "PDF", resolution=150.0)
                orient_writer = PdfWriter()
                for p in (orient_p1, orient_p2):
                    orient_writer.add_page(PdfReader(str(p)).pages[0])
                orient_combo = tmp_dir / "orient_combo.pdf"
                with open(orient_combo, "wb") as fh:
                    orient_writer.write(fh)
                orient_result = run_fix_orientation(OrientationFixRequest(source_path=orient_combo, output_path=output_dir / "orientacao_corrigida.pdf"))
                check("Correcao de orientação detecta a página 2 girada 180 graus", orient_result.rotations_applied.get(2) == 180)
            except Exception as exc:  # noqa: BLE001
                check("Correcao de orientação (Tesseract detectado)", False, str(exc))
        else:
            orient_rejected_ok = False
            try:
                run_fix_orientation(OrientationFixRequest(source_path=source, output_path=output_dir / "deveria_falhar.pdf"))
            except ExternalToolError:
                orient_rejected_ok = True
            check("Correcao de orientação sem Tesseract detectado levanta ExternalToolError", orient_rejected_ok)

        try:
            extract_src = tmp_dir / "extract_base.pdf"
            _make_synthetic_pdf(extract_src, 2)
            extract_img = tmp_dir / "extract_img.png"
            PILImage.new("RGB", (60, 40), (200, 50, 50)).save(extract_img)
            with_img = tmp_dir / "extract_with_img.pdf"
            run_add_image_stamp(ImageStampRequest(
                source_path=extract_src, output_path=with_img, image_path=extract_img,
                x_pt=50, y_pt=50, width_pt=60, height_pt=40, target_mode=PageTargetMode.ALL_PAGES,
            ))
            extract_writer = PdfWriter(clone_from=PdfReader(str(with_img)))
            extract_writer.add_attachment("anexo_teste.txt", b"conteudo do anexo de teste")
            extract_combo = tmp_dir / "extract_combo.pdf"
            with open(extract_combo, "wb") as fh:
                extract_writer.write(fh)
            extract_result = run_extract_assets(ExtractAssetsRequest(source_path=extract_combo, output_dir=output_dir / "extraidos"))
            check("Extração encontra as 2 imagens incorporadas", len(extract_result.image_files) == 2)
            check("Extração encontra o anexo incorporado", len(extract_result.attachment_files) == 1)
        except Exception as exc:  # noqa: BLE001
            check("Extração de imagens/anexos", False, str(exc))

        try:
            bookmark_src = tmp_dir / "bookmark_base.pdf"
            _make_synthetic_pdf(bookmark_src, 3)
            list_before = run_list_bookmarks(ListBookmarksRequest(source_path=bookmark_src))
            check("Documento sintetico comeca sem marcadores", list_before.entries == [])
            added_bm = run_add_bookmark(AddBookmarkRequest(source_path=bookmark_src, output_path=output_dir / "com_marcador.pdf", title="Capitulo 1", page_number=2))
            list_after = run_list_bookmarks(ListBookmarksRequest(source_path=added_bm.output_path))
            check("Marcador adicionado aparece na listagem com a página correta", len(list_after.entries) == 1 and list_after.entries[0].page_number == 2)
            cleared_bm = run_clear_bookmarks(ClearBookmarksRequest(source_path=added_bm.output_path, output_path=output_dir / "sem_marcador.pdf"))
            list_cleared = run_list_bookmarks(ListBookmarksRequest(source_path=cleared_bm.output_path))
            check("Limpeza de marcadores remove todos os marcadores", list_cleared.entries == [])
        except Exception as exc:  # noqa: BLE001
            check("Gerenciamento de marcadores", False, str(exc))

        try:
            inspect_result = run_inspect(InspectionRequest(source_path=source))
            check("Inspeção técnica relata a contagem de páginas correta", inspect_result.page_count == 10)
            check("Inspeção técnica relata documento não criptografado corretamente", inspect_result.is_encrypted is False)
        except Exception as exc:  # noqa: BLE001
            check("Inspeção técnica", False, str(exc))

        qpdf_path_adv = shutil.which("qpdf")
        if qpdf_path_adv:
            try:
                check_result = run_check_repair(RepairCheckRequest(source_path=source))
                check("qpdf --check considera o PDF sintetico válido", check_result.is_valid is True)
                repair_result = run_repair(RepairRequest(source_path=source, output_path=output_dir / "reparado.pdf"))
                with PdfDocument.open(repair_result.output_path) as doc:
                    check("PDF reparado pelo qpdf reabre com a mesma contagem de páginas", doc.page_count == 10)
            except Exception as exc:  # noqa: BLE001
                check("Verificação/reparo via qpdf (detectado)", False, str(exc))
        else:
            qpdf_rejected_ok = False
            try:
                run_repair(RepairRequest(source_path=source, output_path=output_dir / "deveria_falhar_qpdf.pdf"))
            except ExternalToolError:
                qpdf_rejected_ok = True
            check("Reparo sem qpdf detectado levanta ExternalToolError", qpdf_rejected_ok)

        try:
            redact_src = tmp_dir / "redact_base.pdf"
            _make_synthetic_pdf(redact_src, 1)
            redact_secret = tmp_dir / "redact_secret.pdf"
            run_add_text_stamp(TextStampRequest(
                source_path=redact_src, output_path=redact_secret, text="SEGREDO CONFIDENCIAL", x_pt=100, y_pt=700, font_size=24,
                target_mode=PageTargetMode.CURRENT_PAGE, current_page_index=0,
            ))
            redact_public = tmp_dir / "redact_public.pdf"
            run_add_text_stamp(TextStampRequest(
                source_path=redact_secret, output_path=redact_public, text="INFORMACAO PÚBLICA", x_pt=100, y_pt=100, font_size=24,
                target_mode=PageTargetMode.CURRENT_PAGE, current_page_index=0,
            ))
            redact_result = run_true_redaction(RedactionRequest(
                source_path=redact_public, output_path=output_dir / "redigido.pdf",
                x1_pt=50, y1_pt=600, x2_pt=400, y2_pt=780, target_mode=PageTargetMode.ALL_PAGES,
            ))
            with PdfDocument.open(redact_result.output_path) as doc:
                post_redact_text = doc.reader.pages[0].extract_text()
            check("Redação real remove de verdade o texto secreto (extract_text confirma ausencia)", "SEGREDO" not in post_redact_text)
            check("Redação real preserva o texto público fora da área selecionada", "PÚBLICA" in post_redact_text)
        except Exception as exc:  # noqa: BLE001
            check("Redação real", False, str(exc))

        try:
            redact_cancelled_ok = False
            try:
                run_true_redaction(
                    RedactionRequest(source_path=source, output_path=output_dir / "redacao_cancelada.pdf", x1_pt=0, y1_pt=0, x2_pt=50, y2_pt=50, target_mode=PageTargetMode.ALL_PAGES),
                    cancel_check=lambda: True,
                )
            except OperationCancelled:
                redact_cancelled_ok = True
            check("Cancelamento da redação real levanta OperationCancelled", redact_cancelled_ok)
            check("Cancelamento da redação real não deixa arquivo parcial", not (output_dir / "redacao_cancelada.pdf").exists())
        except Exception as exc:  # noqa: BLE001
            check("Cancelamento da redação real", False, str(exc))

        # --- assinaturas (Fase 6): visual (carimbo) e digital criptográfica real ---
        try:
            sig_src = tmp_dir / "sig_base.pdf"
            _make_synthetic_pdf(sig_src, 2)
            visual_result = run_add_visual_signature(VisualSignatureRequest(
                source_path=sig_src, output_path=output_dir / "assinado_visual.pdf",
                signer_name="Fulano de Tal", reason="Aprovacao",
                target_mode=PageTargetMode.CURRENT_PAGE, current_page_index=0,
            ))
            check("Assinatura visual aplicada em 1 página", visual_result.pages_affected == 1)
            with PdfDocument.open(visual_result.output_path) as doc:
                visual_text = doc.reader.pages[0].extract_text()
            check("Assinatura visual: nome do assinante aparece na página", "Fulano de Tal" in visual_text)
            check(
                "Assinatura visual declara explicitamente que não tem validade criptográfica",
                any("NÃO possui" in n and "criptográfica" in n for n in visual_result.notes),
            )
        except Exception as exc:  # noqa: BLE001
            check("Assinatura visual", False, str(exc))

        if _pyhanko_available():
            try:
                from cryptography import x509 as _x509
                from cryptography.x509.oid import NameOID as _NameOID
                from cryptography.hazmat.primitives import hashes as _hashes, serialization as _serialization
                from cryptography.hazmat.primitives.asymmetric import rsa as _rsa
                from cryptography.hazmat.primitives.serialization import pkcs12 as _pkcs12

                test_key = _rsa.generate_private_key(public_exponent=65537, key_size=2048)
                test_name = _x509.Name([_x509.NameAttribute(_NameOID.COMMON_NAME, "Autoteste PDF Laboratory")])
                test_cert = (
                    _x509.CertificateBuilder()
                    .subject_name(test_name).issuer_name(test_name).public_key(test_key.public_key())
                    .serial_number(_x509.random_serial_number())
                    .not_valid_before(_dt.datetime.now(_dt.timezone.utc) - _dt.timedelta(days=1))
                    .not_valid_after(_dt.datetime.now(_dt.timezone.utc) + _dt.timedelta(days=1))
                    .sign(test_key, _hashes.SHA256())
                )
                test_pfx_bytes = _pkcs12.serialize_key_and_certificates(
                    name=b"autoteste", key=test_key, cert=test_cert, cas=None,
                    encryption_algorithm=_serialization.BestAvailableEncryption(b"autoteste123"),
                )
                test_pfx_path = tmp_dir / "autoteste_self_test.pfx"
                test_pfx_path.write_bytes(test_pfx_bytes)

                digital_src = tmp_dir / "digital_base.pdf"
                _make_synthetic_pdf(digital_src, 2)

                sign_result = run_sign_digital(DigitalSignatureRequest(
                    source_path=digital_src, output_path=output_dir / "assinado_digital_invisivel.pdf",
                    pfx_path=test_pfx_path, pfx_password="autoteste123", visible=False,
                ))
                check("Assinatura digital extrai o nome comum (CN) correto do certificado", sign_result.signer_common_name == "Autoteste PDF Laboratory")

                verify_result = run_verify_digital_signatures(VerifySignaturesRequest(source_path=sign_result.output_path))
                check("Verificação encontra exatamente 1 assinatura", verify_result.total_signatures == 1)
                sig_info = verify_result.signatures[0]
                check("Verificação confirma que a assinatura esta intacta (documento não alterado)", sig_info.intact is True)
                check(
                    "Verificação reporta certificado de teste autoassinado como NÃO confiavel (comportamento correto e esperado)",
                    sig_info.trusted is False,
                )

                sign_result_visible = run_sign_digital(DigitalSignatureRequest(
                    source_path=digital_src, output_path=output_dir / "assinado_digital_visivel.pdf",
                    pfx_path=test_pfx_path, pfx_password="autoteste123", visible=True,
                    page_number=1, x1_pt=50, y1_pt=50, x2_pt=300, y2_pt=130, reason="Autoteste",
                ))
                verify_visible = run_verify_digital_signatures(VerifySignaturesRequest(source_path=sign_result_visible.output_path))
                check("Assinatura digital visivel tambem verifica como intacta", verify_visible.signatures[0].intact is True)

                # Deteccao de adulteracao: altera um byte dentro do primeiro segmento do
                # ByteRange (ou seja, dentro da área realmente coberta pela assinatura).
                signed_bytes = bytearray(sign_result.output_path.read_bytes())
                signed_bytes[20] = (signed_bytes[20] + 1) % 256
                tampered_path = tmp_dir / "assinatura_adulterada.pdf"
                tampered_path.write_bytes(bytes(signed_bytes))
                verify_tampered = run_verify_digital_signatures(VerifySignaturesRequest(source_path=tampered_path))
                check(
                    "Verificação detecta adulteracao após a assinatura (intact=False)",
                    bool(verify_tampered.signatures) and verify_tampered.signatures[0].intact is False,
                )

                wrong_password_rejected = False
                try:
                    run_sign_digital(DigitalSignatureRequest(
                        source_path=digital_src, output_path=output_dir / "nao_deveria_existir.pdf",
                        pfx_path=test_pfx_path, pfx_password="senha_errada", visible=False,
                    ))
                except Exception:
                    wrong_password_rejected = True
                check("Assinatura digital com senha de PFX incorreta e rejeitada", wrong_password_rejected)
            except Exception as exc:  # noqa: BLE001
                check("Assinatura digital criptográfica (pyHanko detectado)", False, str(exc))
        else:
            pyhanko_rejected_ok = False
            try:
                run_sign_digital(DigitalSignatureRequest(
                    source_path=source, output_path=output_dir / "nao_deveria_existir2.pdf",
                    pfx_path=Path("inexistente.pfx"), pfx_password="x", visible=False,
                ))
            except ExternalToolError:
                pyhanko_rejected_ok = True
            check("Assinatura digital sem pyHanko detectado levanta ExternalToolError com instrução clara", pyhanko_rejected_ok)

        # --- cancelamento cooperativo (divisão) ---
        try:
            cancel_req = SplitRequest(source_path=source, mode=SplitMode.EACH_PAGE, output_dir=output_dir / "cancelado")
            cancelled_ok = False
            try:
                run_split(cancel_req, cancel_check=lambda: True)
            except OperationCancelled:
                cancelled_ok = True
            check("Cancelamento antes de escrever levanta OperationCancelled", cancelled_ok)
            check("Cancelamento não deixa pasta de saída parcial", not (output_dir / "cancelado").exists())
        except Exception as exc:  # noqa: BLE001
            check("Cancelamento cooperativo", False, str(exc))

        # --- limpeza de temporarios ---
        removed = clear_all_temp()
        check("Limpeza de temporarios executa sem erro", isinstance(removed, int))

    print("=" * 74)
    if failures:
        print(f"AUTOTESTE FALHOU ({len(failures)} verificação(oes) com problema):")
        for f in failures:
            print(f"  - {f}")
        print("=" * 74)
        return 1
    print("Autoteste concluido: todas as verificacoes passaram.")
    print("=" * 74)
    return 0


# =============================================================================
# 27) --diagnóstico (não abre a GUI)
# =============================================================================
def run_diagnostico() -> int:
    print(build_base_diagnostics_report())
    print()
    print(build_optional_dependencies_report())
    return 0


# =============================================================================
# 28) main() e despacho por linha de comando
# =============================================================================
def _build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="PDF_Laboratory.py", description=f"{APP_DISPLAY_NAME} — suite local e offline de manipulacao de PDF.")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--self-test", action="store_true", help="Executa o autoteste interno (não abre a interface) e sai.")
    mode.add_argument("--diagnostico", action="store_true", help="Imprime um relatorio de diagnóstico técnico (não abre a interface) e sai.")
    return parser


def main() -> None:
    args = _build_arg_parser().parse_args()
    if args.self_test:
        sys.exit(run_self_test())
    if args.diagnostico:
        sys.exit(run_diagnostico())
    sys.exit(run_gui())


if __name__ == "__main__":
    main()
