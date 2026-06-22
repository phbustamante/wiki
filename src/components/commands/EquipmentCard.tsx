import { Link } from "react-router-dom";
import { ChevronRight, Cpu } from "lucide-react";
import type { Equipamento } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function EquipmentCard({ equipamento }: { equipamento: Equipamento }) {
  const totalComandos = equipamento.comandos.length;

  return (
    <Link
      to={`/equipamento/${equipamento.id}`}
      className="group block focus-visible:outline-none"
      aria-label={`Abrir ${equipamento.equipamento}`}
    >
      <Card className="h-full p-5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-soft-lg group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Cpu className="h-5 w-5" />
          </div>
          <ChevronRight className="h-5 w-5 translate-x-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-foreground" />
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-semibold tracking-tight">
            {equipamento.equipamento}
          </h3>
          {equipamento.descricao && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {equipamento.descricao}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Badge>
            {totalComandos} comando{totalComandos === 1 ? "" : "s"}
          </Badge>
          {equipamento.categoria && (
            <Badge className="bg-primary/10 text-primary">
              {equipamento.categoria}
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
