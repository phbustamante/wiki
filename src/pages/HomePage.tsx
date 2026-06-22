import { useMemo, useState } from "react";
import { PackageSearch, RefreshCw } from "lucide-react";
import { useEquipamentos } from "@/hooks/useEquipamentos";
import { useAtualizacoes } from "@/hooks/useAtualizacoes";
import { normalize } from "@/lib/utils";
import { SearchBar } from "@/components/layout/SearchBar";
import { EquipmentCard } from "@/components/commands/EquipmentCard";
import { UpdateCard } from "@/components/updates/UpdateCard";
import { HistoryPanel, FavoritesPanel } from "@/components/commands/HistoryFavorites";
import { Card } from "@/components/ui/Card";

export function HomePage() {
  const { equipamentos, carregando } = useEquipamentos();
  const { atualizacoes } = useAtualizacoes();
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    if (!equipamentos) return [];
    const q = normalize(busca);
    if (!q) return equipamentos;
    return equipamentos.filter((e) =>
      [e.equipamento, e.descricao, e.categoria, ...e.comandos.map((c) => c.nome)]
        .filter(Boolean)
        .some((campo) => normalize(String(campo)).includes(q))
    );
  }, [equipamentos, busca]);

  const atualizacoesFiltradas = useMemo(() => {
    if (!atualizacoes) return [];
    const q = normalize(busca);
    if (!q) return atualizacoes;
    return atualizacoes.filter((a) =>
      [a.equipamento, a.descricao, a.categoria]
        .filter(Boolean)
        .some((campo) => normalize(String(campo)).includes(q))
    );
  }, [atualizacoes, busca]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
      <div>
        <div className="mb-7">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Central de Automação JIMI
          </h1>
          <p className="mt-2 max-w-prose text-muted-foreground">
            Gerencie comandos, atualizações e processos operacionais dos
            equipamentos JIMI com mais rapidez e controle.
          </p>
        </div>

        <div className="mb-8 max-w-md">
          <SearchBar
            value={busca}
            onChange={setBusca}
            placeholder="Buscar equipamento ou comando..."
            autoFocus
          />
        </div>

        <section>
          <h2 className="mb-5 text-2xl font-bold tracking-tight sm:text-3xl">
            Automação de Comandos
          </h2>

          {carregando ? (
            <SkeletonGrid />
          ) : filtrados.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <PackageSearch className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhum equipamento encontrado para{" "}
                <span className="font-medium text-foreground">“{busca}”</span>.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtrados.map((e) => (
                <EquipmentCard key={e.id} equipamento={e} />
              ))}
            </div>
          )}
        </section>

        {/* Seção de atualização de equipamentos */}
        <section className="mt-12">
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
              <RefreshCw className="h-6 w-6 text-emerald-500" />
              Atualização de Equipamentos
            </h2>
            <p className="mt-2 max-w-prose text-muted-foreground">
              Tutoriais de atualização de firmware: passo a passo, arquivos para
              download, imagens e o vídeo do processo.
            </p>
          </div>

          {atualizacoesFiltradas.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <RefreshCw className="h-9 w-9 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhuma atualização encontrada
                {busca && (
                  <>
                    {" "}para{" "}
                    <span className="font-medium text-foreground">
                      “{busca}”
                    </span>
                  </>
                )}
                .
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {atualizacoesFiltradas.map((a) => (
                <UpdateCard key={a.id} item={a} />
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-32">
        <FavoritesPanel />
        <HistoryPanel />
      </aside>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-2xl border border-border bg-muted/50"
        />
      ))}
    </div>
  );
}
