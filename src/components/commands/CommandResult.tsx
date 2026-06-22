import { Check, Copy, Star } from "lucide-react";
import type { ResultadoComando } from "@/lib/comando";
import { Button } from "@/components/ui/Button";
import { useCopy } from "@/hooks/useCopy";
import { cn } from "@/lib/utils";

interface Props {
  resultado: ResultadoComando;
  favorito: boolean;
  onCopiar: () => void;
  onFavoritar: () => void;
}

export function CommandResult({
  resultado,
  favorito,
  onCopiar,
  onFavoritar,
}: Props) {
  const { copiado, copiar } = useCopy();

  const handleCopiar = async () => {
    const ok = await copiar(resultado.texto);
    if (ok) onCopiar();
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-b from-accent/40 to-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Comando gerado
        </span>
        {resultado.completo ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
            <Check className="h-3.5 w-3.5" /> pronto
          </span>
        ) : (
          <span className="text-xs text-amber-500">
            faltam: {resultado.faltando.join(", ")}
          </span>
        )}
      </div>

      <div className="mt-3 overflow-x-auto scroll-thin">
        <code className="block whitespace-nowrap font-mono text-2xl font-semibold tracking-tight">
          {resultado.texto}
        </code>
      </div>

      <div className="mt-5 flex gap-2">
        <Button
          size="lg"
          onClick={handleCopiar}
          disabled={!resultado.completo}
          className="flex-1"
        >
          {copiado ? (
            <>
              <Check className="h-4 w-4" /> Copiado!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copiar comando
            </>
          )}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onFavoritar}
          aria-pressed={favorito}
          title={favorito ? "Remover dos favoritos" : "Salvar nos favoritos"}
          className="px-4"
        >
          <Star
            className={cn(
              "h-4 w-4 transition-colors",
              favorito && "fill-amber-400 text-amber-400"
            )}
          />
        </Button>
      </div>
    </div>
  );
}
