import { useMemo, useState } from "react";
import type { Comando } from "@/types";
import {
  montarComando,
  parametrosVisiveis,
  selecaoInicial,
} from "@/lib/comando";
import { useStore } from "@/store/useStore";
import { ParametroField } from "@/components/commands/ParametroField";
import { CommandResult } from "@/components/commands/CommandResult";

interface Props {
  equipamentoId: string;
  equipamentoNome: string;
  comando: Comando;
}

export function CommandBuilder({
  equipamentoId,
  equipamentoNome,
  comando,
}: Props) {
  const [selecao, setSelecao] = useState<Record<string, string>>(() =>
    selecaoInicial(comando)
  );

  const registrarHistorico = useStore((s) => s.registrarHistorico);
  const alternarFavorito = useStore((s) => s.alternarFavorito);
  const favoritos = useStore((s) => s.favoritos);

  // Montagem em tempo real do comando final.
  const resultado = useMemo(
    () => montarComando(comando, selecao),
    [comando, selecao]
  );

  const favorito = favoritos.some((f) => f.resultado === resultado.texto);
  const visiveis = parametrosVisiveis(comando);

  const itemAtual = () => ({
    equipamentoId,
    equipamentoNome,
    comandoNome: comando.nome,
    resultado: resultado.texto,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,400px)] lg:items-start">
      {/* Parâmetros */}
      <div className="space-y-6">
        {comando.descricao && (
          <p className="text-sm text-muted-foreground">{comando.descricao}</p>
        )}
        {visiveis.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este comando não possui parâmetros — já está pronto para copiar.
          </p>
        ) : (
          visiveis.map((p, i) => (
            <ParametroField
              key={`${p.nome}-${i}`}
              parametro={p}
              valor={selecao[p.nome]}
              onChange={(valor) =>
                setSelecao((prev) => ({ ...prev, [p.nome]: valor }))
              }
            />
          ))
        )}
      </div>

      {/* Resultado fixo ao lado (sticky no desktop) */}
      <div className="lg:sticky lg:top-32">
        <CommandResult
          resultado={resultado}
          favorito={favorito}
          onCopiar={() => registrarHistorico(itemAtual())}
          onFavoritar={() => alternarFavorito(itemAtual())}
        />
      </div>
    </div>
  );
}
