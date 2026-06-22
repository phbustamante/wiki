import type { AtualizacaoEquipamento, Equipamento } from "@/types";
import dados from "@/data/equipamentos.json";
import dadosAtualizacoes from "@/data/atualizacoes.json";

const equipamentos = (dados as { equipamentos: Equipamento[] }).equipamentos;

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

export async function listarEquipamentos(): Promise<Equipamento[]> {
  await delay();
  return equipamentos;
}

export async function obterEquipamento(
  id: string
): Promise<Equipamento | undefined> {
  await delay();
  return equipamentos.find((e) => e.id === id);
}

const atualizacoes = (
  dadosAtualizacoes as { atualizacoes: AtualizacaoEquipamento[] }
).atualizacoes;

export async function listarAtualizacoes(): Promise<AtualizacaoEquipamento[]> {
  await delay();
  return atualizacoes;
}

export async function obterAtualizacao(
  id: string
): Promise<AtualizacaoEquipamento | undefined> {
  await delay();
  return atualizacoes.find((a) => a.id === id);
}
