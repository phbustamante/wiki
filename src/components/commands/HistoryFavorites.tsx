import { Clock, Star, Trash2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Card } from "@/components/ui/Card";
import { CommandListItem } from "@/components/commands/CommandListItem";

function EmptyState({ texto }: { texto: string }) {
  return (
    <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">
      {texto}
    </p>
  );
}

export function HistoryPanel() {
  const historico = useStore((s) => s.historico);
  const limparHistorico = useStore((s) => s.limparHistorico);

  return (
    <Card className="p-4">
      <header className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Histórico recente</h2>
        </div>
        {historico.length > 0 && (
          <button
            onClick={limparHistorico}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Trash2 className="h-3 w-3" /> Limpar
          </button>
        )}
      </header>
      {historico.length === 0 ? (
        <EmptyState texto="Os comandos que você copiar aparecem aqui." />
      ) : (
        <div className="space-y-0.5">
          {historico.map((item) => (
            <CommandListItem key={item.id} item={item} mostrarTempo />
          ))}
        </div>
      )}
    </Card>
  );
}

export function FavoritesPanel() {
  const favoritos = useStore((s) => s.favoritos);
  const removerFavorito = useStore((s) => s.removerFavorito);

  return (
    <Card className="p-4">
      <header className="mb-2 flex items-center gap-2 px-1">
        <Star className="h-4 w-4 text-amber-400" />
        <h2 className="text-sm font-semibold">Favoritos</h2>
      </header>
      {favoritos.length === 0 ? (
        <EmptyState texto="Salve comandos frequentes com a estrela ⭐." />
      ) : (
        <div className="space-y-0.5">
          {favoritos.map((item) => (
            <CommandListItem
              key={item.id}
              item={item}
              onRemover={removerFavorito}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
