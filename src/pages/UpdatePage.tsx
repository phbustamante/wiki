import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileVideo,
  Images,
  ListChecks,
} from "lucide-react";
import { useAtualizacao } from "@/hooks/useAtualizacoes";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VideoUpload } from "@/components/updates/VideoUpload";
import { cn } from "@/lib/utils";

export function UpdatePage() {
  const { id } = useParams<{ id: string }>();
  const { atualizacao, carregando } = useAtualizacao(id);
  const [procIndex, setProcIndex] = useState(0);

  if (carregando) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted/50" />;
  }

  if (!atualizacao) {
    return (
      <Card className="flex flex-col items-center gap-4 p-12 text-center">
        <p className="text-muted-foreground">
          Atualização não encontrada para este equipamento.
        </p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>

      <div className="mb-8">
        <span className="text-xs font-medium uppercase tracking-wider text-emerald-500">
          Atualização de firmware
        </span>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          {atualizacao.equipamento}
        </h1>
        {atualizacao.descricao && (
          <p className="mt-2 max-w-prose text-muted-foreground">
            {atualizacao.descricao}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Passo a passo */}
        <Section
          icon={<ListChecks className="h-4 w-4" />}
          titulo="Passo a passo"
          className="lg:col-span-2"
        >
          {atualizacao.procedimentos.length === 0 ? (
            <Vazio texto="Nenhum procedimento cadastrado ainda." />
          ) : (
            (() => {
              const proc =
                atualizacao.procedimentos[procIndex] ??
                atualizacao.procedimentos[0];
              return (
                <>
                  {atualizacao.procedimentos.length > 1 && (
                    <div className="mb-5 flex flex-wrap gap-2">
                      {atualizacao.procedimentos.map((p, i) => (
                        <button
                          key={p.id}
                          onClick={() => setProcIndex(i)}
                          className={cn(
                            "rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98]",
                            i === procIndex
                              ? "border-primary bg-primary text-primary-foreground shadow-soft"
                              : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent"
                          )}
                        >
                          {p.titulo}
                        </button>
                      ))}
                    </div>
                  )}

                  {proc.descricao && (
                    <p className="mb-5 text-sm text-muted-foreground">
                      {proc.descricao}
                    </p>
                  )}

                  <ol className="space-y-4">
                    {proc.passos.map((p, i) => (
                      <li key={i} className="flex gap-3.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                          {i + 1}
                        </span>
                        <div className="pt-0.5">
                          {p.titulo && (
                            <p className="font-medium">{p.titulo}</p>
                          )}
                          <p
                            className={cn(
                              "text-sm leading-relaxed",
                              p.titulo
                                ? "mt-0.5 text-muted-foreground"
                                : "text-foreground"
                            )}
                          >
                            {p.descricao}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              );
            })()
          )}
        </Section>

        {/* Downloads */}
        <Section
          icon={<Download className="h-4 w-4" />}
          titulo="Arquivos para download"
        >
          {atualizacao.downloads.length === 0 ? (
            <Vazio texto="Nenhum arquivo disponível ainda." />
          ) : (
            <ul className="space-y-2">
              {atualizacao.downloads.map((d, i) => {
                const disponivel = Boolean(d.url) && d.url !== "#";
                const meta =
                  [d.versao && `v${d.versao}`, d.tamanho]
                    .filter(Boolean)
                    .join(" · ") || (disponivel ? "" : "link em breve");
                const conteudo = (
                  <>
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        disponivel
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Download className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.nome}</p>
                      {meta && (
                        <p className="text-xs text-muted-foreground">{meta}</p>
                      )}
                    </div>
                  </>
                );
                return (
                  <li key={i}>
                    {disponivel ? (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 transition-colors hover:bg-accent"
                      >
                        {conteudo}
                      </a>
                    ) : (
                      <div className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-dashed border-border px-3.5 py-3 opacity-70">
                        {conteudo}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* Imagens */}
        <Section icon={<Images className="h-4 w-4" />} titulo="Imagens">
          {atualizacao.imagens.length === 0 ? (
            <Vazio texto="Nenhuma imagem cadastrada ainda." />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {atualizacao.imagens.map((img, i) => (
                <figure key={i} className="overflow-hidden rounded-xl border border-border">
                  <img
                    src={img.url}
                    alt={img.legenda ?? `Imagem ${i + 1}`}
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                  {img.legenda && (
                    <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                      {img.legenda}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </Section>

        {/* Upload de vídeo */}
        <Section
          icon={<FileVideo className="h-4 w-4" />}
          titulo="Vídeo do processo"
          className="lg:col-span-2"
        >
          <VideoUpload />
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon,
  titulo,
  className,
  children,
}: {
  icon: ReactNode;
  titulo: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={`p-5 sm:p-6 ${className ?? ""}`}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-foreground">
          {icon}
        </span>
        <h2 className="text-base font-semibold tracking-tight">{titulo}</h2>
      </div>
      {children}
    </Card>
  );
}

function Vazio({ texto }: { texto: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {texto}
    </p>
  );
}
