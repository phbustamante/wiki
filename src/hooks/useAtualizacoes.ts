import { useEffect, useState } from "react";
import type { AtualizacaoEquipamento } from "@/types";
import { listarAtualizacoes, obterAtualizacao } from "@/lib/dataSource";

export function useAtualizacoes() {
  const [data, setData] = useState<AtualizacaoEquipamento[] | null>(null);

  useEffect(() => {
    let ativo = true;
    listarAtualizacoes().then((r) => ativo && setData(r));
    return () => {
      ativo = false;
    };
  }, []);

  return { atualizacoes: data, carregando: data === null };
}

export function useAtualizacao(id: string | undefined) {
  const [data, setData] = useState<AtualizacaoEquipamento | undefined | null>(
    null
  );

  useEffect(() => {
    if (!id) {
      setData(undefined);
      return;
    }
    let ativo = true;
    setData(null);
    obterAtualizacao(id).then((r) => ativo && setData(r));
    return () => {
      ativo = false;
    };
  }, [id]);

  return { atualizacao: data, carregando: data === null };
}
