import json
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
STORE_PATH = BASE_DIR / "data" / "aceq-store.json"


def _extrair_comando(item):
    if isinstance(item, str):
        return item
    if isinstance(item, dict):
        return item.get("resultado") or item.get("comando") or item.get("texto")
    return None


def _is_server(comando):
    return comando.split(",", 1)[0].strip().upper() == "SERVER"


def _normalizar_comandos(itens):
    vistos = set()
    comandos = []
    servidores = []

    for item in itens or []:
        comando = _extrair_comando(item)
        if not comando or comando in vistos:
            continue

        vistos.add(comando)
        if _is_server(comando):
            servidores.append(comando)
        else:
            comandos.append(comando)

    return comandos + servidores


def _carregar_store(caminho=STORE_PATH):
    caminho = Path(caminho)
    if not caminho.exists():
        return {"favoritos": [], "historico": []}

    with caminho.open(encoding="utf-8") as arquivo:
        return json.load(arquivo)


def gerar_conteudo_writeconfig(itens):
    comandos = _normalizar_comandos(itens)
    conteudo = "\n".join(comandos)
    if conteudo:
        conteudo += "\n"
    return conteudo


def gerar_writeconfig(itens):
    return gerar_conteudo_writeconfig(itens)


def gerar_writeconfig_favoritos(favoritos=None):
    if favoritos is None:
        favoritos = _carregar_store().get("favoritos", [])
    return gerar_writeconfig(favoritos)


def gerar_writeconfig_historico(historico=None):
    if historico is None:
        historico = _carregar_store().get("historico", [])
    return gerar_writeconfig(historico)
