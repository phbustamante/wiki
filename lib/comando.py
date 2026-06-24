def normalizar_opcoes(opcoes=None):
    result = []
    for o in (opcoes or []):
        if isinstance(o, str):
            result.append({"label": o, "valor": o})
        else:
            result.append(o)
    return result


def tipo_de(p):
    if p.get("tipo"):
        return p["tipo"]
    return "select" if p.get("opcoes") else "texto"


def is_obrigatorio(p):
    return p.get("obrigatorio", True) and tipo_de(p) != "fixo"


def parametros_visiveis(comando):
    return [p for p in comando["parametros"] if tipo_de(p) != "fixo"]


def selecao_inicial(comando):
    sel = {}
    for p in comando["parametros"]:
        if tipo_de(p) != "fixo" and "padrao" in p:
            sel[p["nome"]] = p["padrao"]
    return sel


def montar_comando(comando, selecao):
    sep = comando.get("separador", ",")
    tokens = []
    faltando = []

    for p in comando["parametros"]:
        if tipo_de(p) == "fixo":
            tokens.append(p.get("valor", ""))
            continue
        valor = selecao.get(p["nome"], "")
        if valor:
            tokens.append(valor)
        else:
            if is_obrigatorio(p):
                faltando.append(p["nome"])
            tokens.append("")

    if not comando.get("manterVazios"):
        while tokens and tokens[-1] == "":
            tokens.pop()

    corpo = sep.join([comando["nome"]] + tokens)
    texto = "{}{}{}".format(
        comando.get("prefixo", ""),
        corpo,
        comando.get("sufixo", ""),
    )
    return {"texto": texto, "completo": len(faltando) == 0, "faltando": faltando}
