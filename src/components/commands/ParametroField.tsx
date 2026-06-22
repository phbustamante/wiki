import { Check } from "lucide-react";
import type { Parametro } from "@/types";
import { isObrigatorio, normalizarOpcoes, tipoDe } from "@/lib/comando";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";

interface Props {
  parametro: Parametro;
  valor: string | undefined;
  onChange: (valor: string) => void;
}

export function ParametroField({ parametro, valor, onChange }: Props) {
  const tipo = tipoDe(parametro);
  const opcional = !isObrigatorio(parametro);

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-sm font-semibold">{parametro.nome}</span>
        {opcional ? (
          <span className="text-xs text-muted-foreground">opcional</span>
        ) : (
          <span className="text-xs text-primary">obrigatório</span>
        )}
        {parametro.descricao && (
          <span className="text-xs text-muted-foreground">
            — {parametro.descricao}
          </span>
        )}
      </div>

      {tipo === "select" && (
        <SelectField parametro={parametro} valor={valor} onChange={onChange} />
      )}
      {tipo === "numero" && (
        <NumeroField parametro={parametro} valor={valor} onChange={onChange} />
      )}
      {tipo === "texto" && (
        <Input
          value={valor ?? ""}
          maxLength={parametro.maxLength}
          placeholder={parametro.placeholder ?? "Digite o valor..."}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-md"
        />
      )}
    </div>
  );
}

function SelectField({ parametro, valor, onChange }: Props) {
  const opcoes = normalizarOpcoes(parametro.opcoes);
  const opcional = !isObrigatorio(parametro);

  return (
    <div
      className="flex flex-wrap gap-2"
      role="radiogroup"
      aria-label={parametro.nome}
    >
      {opcoes.map((op) => {
        const ativo = valor === op.valor;
        return (
          <button
            key={op.valor}
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(ativo && opcional ? "" : op.valor)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.97]",
              ativo
                ? "border-primary bg-primary text-primary-foreground shadow-soft"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent"
            )}
          >
            {ativo && <Check className="h-3.5 w-3.5" />}
            {op.label}
          </button>
        );
      })}
    </div>
  );
}

function NumeroField({ parametro, valor, onChange }: Props) {
  const min = parametro.min ?? 0;
  const max = parametro.max ?? 100;
  const step = parametro.step ?? 1;
  const temFaixa = parametro.min !== undefined && parametro.max !== undefined;
  const atual = valor !== undefined && valor !== "" ? Number(valor) : undefined;
  const sliderVal = atual ?? min;

  return (
    <div className="max-w-md space-y-3">
      <div className="flex items-center gap-3">
        <Input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={valor ?? ""}
          placeholder={parametro.placeholder ?? `${min}–${max}`}
          onChange={(e) => onChange(e.target.value)}
          className="w-32"
        />
        {parametro.unidade && (
          <span className="text-sm text-muted-foreground">
            {parametro.unidade}
          </span>
        )}
        {temFaixa && (
          <span className="ml-auto text-xs text-muted-foreground">
            {min}–{max}
          </span>
        )}
      </div>
      {temFaixa && (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={sliderVal}
          onChange={(e) => onChange(e.target.value)}
          aria-label={parametro.nome}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-accent accent-primary"
        />
      )}
    </div>
  );
}
