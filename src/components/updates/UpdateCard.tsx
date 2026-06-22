import { Link } from "react-router-dom";
import { ChevronRight, RefreshCw } from "lucide-react";
import type { AtualizacaoEquipamento } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function UpdateCard({ item }: { item: AtualizacaoEquipamento }) {
  return (
    <Link
      to={`/atualizacao/${item.id}`}
      className="group block focus-visible:outline-none"
      aria-label={`Atualizar ${item.equipamento}`}
    >
      <Card className="h-full p-5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-soft-lg group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <RefreshCw className="h-5 w-5" />
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-foreground" />
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-semibold tracking-tight">
            {item.equipamento}
          </h3>
          {item.descricao && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {item.descricao}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Badge>
            {item.procedimentos.length} método
            {item.procedimentos.length === 1 ? "" : "s"}
          </Badge>
          {item.downloads.length > 0 && (
            <Badge className="bg-emerald-500/10 text-emerald-500">
              {item.downloads.length} arquivo
              {item.downloads.length === 1 ? "" : "s"}
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
