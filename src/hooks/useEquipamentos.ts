import { useEffect, useState } from "react";
import type { Equipamento } from "@/types";
import { listarEquipamentos, obterEquipamento } from "@/lib/dataSource";

export function useEquipamentos() {
  const [data, setData] = useState<Equipamento[] | null>(null);

  useEffect(() => {
    let ativo = true;
    listarEquipamentos().then((r) => ativo && setData(r));
    return () => {
      ativo = false;
    };
  }, []);

  return { equipamentos: data, carregando: data === null };
}

export function useEquipamento(id: string | undefined) {
  const [data, setData] = useState<Equipamento | undefined | null>(null);

  useEffect(() => {
    if (!id) {
      setData(undefined);
      return;
    }
    let ativo = true;
    setData(null);
    obterEquipamento(id).then((r) => ativo && setData(r));
    return () => {
      ativo = false;
    };
  }, [id]);

  return { equipamento: data, carregando: data === null };
}
