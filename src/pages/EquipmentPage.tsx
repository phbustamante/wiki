import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react";
import { useEquipamento } from "@/hooks/useEquipamentos";
import { normalize } from "@/lib/utils";
import type { Comando } from "@/types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CommandBuilder } from "@/components/commands/CommandBuilder";
import { cn } from "@/lib/utils";

export function EquipmentPage() {
  const { id } = useParams<{ id: string }>();
  const { equipamento, carregando } = useEquipamento(id);
  const [busca, setBusca] = useState("");
  const [selecionadoNome, setSelecionadoNome] = useState<string | null>(null);

  const comandosFiltrados = useMemo<Comando[]>(() => {
    if (!equipamento) return [];
    const q = normalize(busca);
    if (!q) return equipamento.comandos;
    return equipamento.comandos.filter((c) =>
      [c.nome, c.descricao].filter(Boolean).some((campo) =>
        normalize(String(campo)).includes(q)
      )
    );
  }, [equipamento, busca]);

  if (carregando) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted/50" />;
  }

  if (!equipamento) {
    return (
      <Card className="flex flex-col items-center gap-4 p-12 text-center">
        <p className="text-muted-foreground">Equipamento não encontrado.</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>
      </Card>
    );
  }

  // Comando ativo: o selecionado, senão o primeiro da lista filtrada.
  const comandoAtivo =
    comandosFiltrados.find((c) => c.nome === selecionadoNome) ??
    comandosFiltrados[0];

  return (
    <div>
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Equipamentos
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {equipamento.equipamento}
        </h1>
        {equipamento.descricao && (
          <p className="mt-2 max-w-prose text-muted-foreground">
            {equipamento.descricao}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
        {/* Lista de comandos */}
        <div className="lg:sticky lg:top-32">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar comando..."
              className="h-10 pl-9"
              aria-label="Buscar comando"
            />
          </div>

          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Comandos
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {comandosFiltrados.length}
            </span>
          </div>

          {/* Mobile: chips horizontais. Desktop: lista vertical compacta e rolável. */}
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scroll-thin lg:mx-0 lg:max-h-[calc(100dvh-12rem)] lg:flex-col lg:gap-0.5 lg:overflow-x-visible lg:overflow-y-auto lg:px-0 lg:pb-0 lg:pr-1">
            {comandosFiltrados.map((c) => {
              const ativo = comandoAtivo?.nome === c.nome;
              return (
                <button
                  key={c.nome}
                  onClick={() => setSelecionadoNome(c.nome)}
                  title={c.descricao}
                  className={cn(
                    "shrink-0 rounded-lg border px-3 py-1.5 text-left font-mono text-[13px] font-medium transition-colors duration-150 lg:w-full lg:truncate",
                    ativo
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-transparent text-foreground hover:border-border hover:bg-accent"
                  )}
                >
                  {c.nome}
                </button>
              );
            })}
            {comandosFiltrados.length === 0 && (
              <p className="px-1 py-4 text-sm text-muted-foreground">
                Nenhum comando encontrado.
              </p>
            )}
          </div>
        </div>

        {/* Montador do comando */}
        <Card className="p-6 sm:p-7">
          {comandoAtivo ? (
            <>
              <div className="mb-6 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-mono text-lg font-semibold leading-none">
                    {comandoAtivo.nome}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Selecione os parâmetros
                  </p>
                </div>
              </div>

              <CommandBuilder
                key={comandoAtivo.nome}
                equipamentoId={equipamento.id}
                equipamentoNome={equipamento.equipamento}
                comando={comandoAtivo}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecione um comando à esquerda para começar.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
