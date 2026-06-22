/**
 * Modelo de dados da Automação de Comandos (Equipamentos JIMI).
 *
 * Tudo é dirigido por dados (JSON / API). Nenhum comando fica fixo na UI.
 * As chaves seguem o exemplo fornecido pelo cliente (português) para que os
 * dados enviados sejam colados diretamente, com campos opcionais para
 * flexibilizar formatação sem quebrar o que já existe.
 */

/** Uma opção selecionável de um parâmetro. */
export interface Opcao {
  /** Texto exibido ao usuário. Ex.: "Ligado". */
  label: string;
  /** Valor inserido no comando. Ex.: "ON". Se ausente, usa-se o label. */
  valor: string;
}

/** Forma aceita no JSON: string simples ("ON") ou objeto { label, valor }. */
export type OpcaoInput = string | { label: string; valor: string };

/**
 * Tipo de entrada do parâmetro:
 * - `select`  → escolha entre opções (pills). Padrão quando há `opcoes`.
 * - `texto`   → campo de texto livre. Padrão quando não há `opcoes`.
 * - `numero`  → slider + campo numérico com faixa (`min`/`max`).
 * - `fixo`    → valor constante posicional (NA, IP, vazio). Não editável e
 *               não exibido; serve só para manter o formato do comando.
 */
export type ParametroTipo = "select" | "texto" | "numero" | "fixo";

export interface Parametro {
  /** Rótulo do parâmetro. Ex.: "Status", "Canal". */
  nome: string;
  /** Descrição opcional exibida abaixo do nome. */
  descricao?: string;
  /** Tipo de entrada. Se omitido: `select` quando há `opcoes`, senão `texto`. */
  tipo?: ParametroTipo;
  /** Opções disponíveis (para `select`). */
  opcoes?: OpcaoInput[];
  /**
   * Se o parâmetro é obrigatório para montar o comando.
   * Default: true. Campos opcionais vazios mantêm a posição (vírgula) mas
   * vazios no fim do comando são removidos automaticamente.
   */
  obrigatorio?: boolean;
  /** Valor inicial pré-preenchido. */
  padrao?: string;

  // --- texto ---
  /** Texto de exemplo dentro do campo. */
  placeholder?: string;
  /** Tamanho máximo (texto). */
  maxLength?: number;

  // --- numero ---
  min?: number;
  max?: number;
  step?: number;
  /** Unidade exibida ao lado. Ex.: "km/h", "mm", "s". */
  unidade?: string;

  // --- fixo ---
  /** Valor constante emitido (para `tipo: "fixo"`). Pode ser "" (vazio). */
  valor?: string;
}

export interface Comando {
  /** Nome/código do comando. Ex.: "ACC". É o primeiro token gerado. */
  nome: string;
  /** Descrição opcional. Ex.: "Controle de acesso". */
  descricao?: string;
  /** Parâmetros na ordem em que aparecem no comando. */
  parametros: Parametro[];
  /**
   * Separador entre tokens. Default: ",". Permite equipamentos que usam
   * outro formato (ex.: ";" ou " ").
   */
  separador?: string;
  /**
   * Prefixo/sufixo opcionais do comando final.
   * Ex.: prefixo "#" + sufixo "*" => "#ACC,ON,1*".
   */
  prefixo?: string;
  sufixo?: string;
  /**
   * Mantém TODOS os campos vazios, inclusive no fim (preserva vírgulas finais).
   * Default: false (campos vazios no fim são removidos). Use `true` para
   * comandos com formato posicional exato (ex.: APN termina em vírgula).
   */
  manterVazios?: boolean;
}

export interface Equipamento {
  /** Identificador usado na URL (slug). Ex.: "jc181". */
  id: string;
  /** Nome do equipamento. Ex.: "JC181". */
  equipamento: string;
  /** Descrição opcional exibida na página. */
  descricao?: string;
  /** Categoria opcional para agrupamento futuro. */
  categoria?: string;
  comandos: Comando[];
}

/* ------------------------------------------------------------------ */
/* Atualização de equipamentos (firmware)                              */
/* ------------------------------------------------------------------ */

/** Um passo do tutorial de atualização. */
export interface PassoAtualizacao {
  /** Texto do passo. */
  descricao: string;
  /** Título curto opcional, exibido em negrito acima da descrição. */
  titulo?: string;
}

/** Um procedimento/método de atualização (um equipamento pode ter vários). */
export interface ProcedimentoAtualizacao {
  /** Slug curto. Ex.: "modulo-video". */
  id: string;
  /** Rótulo curto do método. Ex.: "Módulo de vídeo (cartão SD)". */
  titulo: string;
  /** Descrição completa do procedimento. */
  descricao?: string;
  passos: PassoAtualizacao[];
}

/** Arquivo disponível para download (firmware, ferramenta, manual…). */
export interface ArquivoDownload {
  nome: string;
  /** URL do arquivo. */
  url: string;
  /** Versão, ex.: "1.6.3". */
  versao?: string;
  /** Tamanho legível, ex.: "12 MB". */
  tamanho?: string;
}

/** Imagem ilustrativa do processo. */
export interface ImagemAtualizacao {
  url: string;
  legenda?: string;
}

/** Conteúdo de atualização de um equipamento (espelha o `id` do equipamento). */
export interface AtualizacaoEquipamento {
  id: string;
  equipamento: string;
  descricao?: string;
  categoria?: string;
  /** Métodos de atualização disponíveis para este equipamento. */
  procedimentos: ProcedimentoAtualizacao[];
  downloads: ArquivoDownload[];
  imagens: ImagemAtualizacao[];
}

/** Item registrado no histórico / favoritos. */
export interface ComandoGerado {
  id: string;
  equipamentoId: string;
  equipamentoNome: string;
  comandoNome: string;
  /** String final pronta para copiar. */
  resultado: string;
  /** Timestamp em ms. */
  criadoEm: number;
}
