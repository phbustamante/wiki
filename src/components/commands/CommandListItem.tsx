import { Link } from "react-router-dom";
import { Check, Copy, Trash2 } from "lucide-react";
import type { ComandoGerado } from "@/types";
import { useCopy } from "@/hooks/useCopy";
import { tempoRelativo } from "@/lib/utils";

interface Props {
  item: ComandoGerado;
  onRemover?: (id: string) => void;
  mostrarTempo?: boolean;
}

export function CommandListItem({ item, onRemover, mostrarTempo }: Props) {
  const { copiado, copiar } = useCopy();

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 transition-colors hover:border-border hover:bg-accent/50">
      <div className="min-w-0 flex-1">
        <code className="block truncate font-mono text-sm font-semibold">
          {item.resultado}
        </code>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link
            to={`/equipamento/${item.equipamentoId}`}
            className="truncate hover:text-foreground hover:underline"
          >
            {item.equipamentoNome}
          </Link>
          <span aria-hidden>·</span>
          <span className="truncate">{item.comandoNome}</span>
          {mostrarTempo && (
            <>
              <span aria-hidden>·</span>
              <span className="shrink-0">{tempoRelativo(item.criadoEm)}</span>
            </>
          )}
        </div>
      </div>

      <button
        onClick={() => copiar(item.resultado)}
        title="Copiar"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
      >
        {copiado ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>

      {onRemover && (
        <button
          onClick={() => onRemover(item.id)}
          title="Remover"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-card hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
