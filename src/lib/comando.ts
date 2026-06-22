import type {
  Comando,
  Opcao,
  OpcaoInput,
  Parametro,
  ParametroTipo,
} from "@/types";

/** Normaliza opções (string | objeto) para o formato { label, valor }. */
export function normalizarOpcoes(opcoes: OpcaoInput[] = []): Opcao[] {
  return opcoes.map((o) =>
    typeof o === "string" ? { label: o, valor: o } : o
  );
}

/** Tipo efetivo do parâmetro (infere `select`/`texto` quando omitido). */
export function tipoDe(p: Parametro): ParametroTipo {
  if (p.tipo) return p.tipo;
  return p.opcoes && p.opcoes.length > 0 ? "select" : "texto";
}

export function isObrigatorio(p: Parametro) {
  return p.obrigatorio !== false && tipoDe(p) !== "fixo";
}

/** Parâmetros visíveis ao usuário (esconde os `fixo`). */
export function parametrosVisiveis(comando: Comando) {
  return comando.parametros.filter((p) => tipoDe(p) !== "fixo");
}

/** Seleção inicial: aplica `padrao` quando definido, por nome de parâmetro. */
export function selecaoInicial(comando: Comando): Record<string, string> {
  const sel: Record<string, string> = {};
  for (const p of comando.parametros) {
    if (tipoDe(p) !== "fixo" && p.padrao !== undefined) sel[p.nome] = p.padrao;
  }
  return sel;
}

export interface ResultadoComando {
  /** String final montada. */
  texto: string;
  /** True quando todos os parâmetros obrigatórios foram preenchidos. */
  completo: boolean;
  /** Nomes dos parâmetros obrigatórios ainda pendentes. */
  faltando: string[];
}

/**
 * Monta o comando em tempo real (formato posicional).
 *
 * Ex.: ACC + { Status: "ON", Canal: "1" } => "ACC,ON,1".
 *
 * - Cada parâmetro ocupa uma posição (mantém as vírgulas internas).
 * - Parâmetros `fixo` sempre emitem seu `valor` (NA, IP, vazio…).
 * - Posições vazias no FIM são removidas, a não ser que `manterVazios`.
 */
export function montarComando(
  comando: Comando,
  selecao: Record<string, string>
): ResultadoComando {
  const sep = comando.separador ?? ",";
  const tokens: string[] = [];
  const faltando: string[] = [];

  for (const p of comando.parametros) {
    if (tipoDe(p) === "fixo") {
      tokens.push(p.valor ?? "");
      continue;
    }
    const valor = selecao[p.nome];
    if (valor !== undefined && valor !== "") {
      tokens.push(valor);
    } else {
      if (isObrigatorio(p)) faltando.push(p.nome);
      tokens.push("");
    }
  }

  // Remove posições vazias do fim, preservando as internas.
  if (!comando.manterVazios) {
    while (tokens.length > 0 && tokens[tokens.length - 1] === "") tokens.pop();
  }

  const corpo = [comando.nome, ...tokens].join(sep);
  const texto = `${comando.prefixo ?? ""}${corpo}${comando.sufixo ?? ""}`;

  return { texto, completo: faltando.length === 0, faltando };
}
