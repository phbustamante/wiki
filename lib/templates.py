import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"


def _load(nome_arquivo):
    with open(DATA_DIR / nome_arquivo, encoding="utf-8") as f:
        return json.load(f)


# --- equipamentos.json ---

def get_equipamentos():
    return _load("equipamentos.json")["equipamentos"]


def get_equipamento(equipamento_id):
    equipamento_id = equipamento_id.lower()
    return next((e for e in get_equipamentos() if e["id"].lower() == equipamento_id), None)


def get_comando(equipamento, nome_comando):
    return next((c for c in equipamento["comandos"] if c["nome"] == nome_comando), None)


# --- templates.json ---

def get_grupos_templates():
    return _load("templates.json")["equipamentos"]


def get_templates_do_equipamento(equipamento_id):
    equipamento_id = equipamento_id.lower()
    grupo = next(
        (g for g in get_grupos_templates()
         if g["equipamentoId"].lower() == equipamento_id),
        None,
    )
    return grupo["templates"] if grupo else []


def get_template(equipamento_id, template_id):
    templates = get_templates_do_equipamento(equipamento_id)
    return next((t for t in templates if t["id"] == template_id), None)


def resolver_comandos_do_template(equipamento_id, template):
    """Busca a definição completa (parâmetros, tipos, opções) de cada comando do template."""
    equipamento = get_equipamento(equipamento_id)
    if not equipamento:
        raise ValueError(f"Equipamento não encontrado: {equipamento_id}")

    comandos = []
    for nome_comando in template["comandos"]:
        comando = get_comando(equipamento, nome_comando)
        if not comando:
            raise ValueError(
                f"Comando '{nome_comando}' não existe em {equipamento['equipamento']}")
        comandos.append(comando)
    return equipamento, comandos


# --- formulário / geração ---

def campo_id(comando, parametro):
    """Chave única do campo no formulário: 'APN.apn', 'SERVER.servidor', etc."""
    return f"{comando['nome']}.{parametro['nome']}"


def campos_editaveis(comando):
    """Parâmetros que viram input no formulário (ignora os do tipo 'fixo')."""
    return [p for p in comando.get("parametros", []) if p.get("tipo") != "fixo"]


def _valor_parametro(comando, parametro, dados):
    if parametro.get("tipo") == "fixo":
        return parametro["valor"]
    valor = (dados.get(campo_id(comando, parametro)) or "").strip()
    if not valor:
        valor = str(parametro.get("padrao", ""))
    return valor


def validar_dados(comandos, dados):
    erros = []
    for comando in comandos:
        for p in campos_editaveis(comando):
            obrigatorio = p.get("obrigatorio", True)
            valor = (dados.get(campo_id(comando, p)) or "").strip()
            if obrigatorio and not valor and not p.get("padrao"):
                erros.append(
                    f"{comando['nome']}: campo '{p['nome']}' é obrigatório")
    return erros


def _formatar_comando(comando, dados):
    """Monta a string final no MESMO formato que writeconfig.py espera: 'NOME,val1,val2#'."""
    valores = [_valor_parametro(comando, p, dados)
               for p in comando.get("parametros", [])]
    partes = [comando["nome"]] + valores
    linha = ",".join(partes) if valores else comando["nome"]
    linha += comando.get("sufixo", "")
    return linha + "#"


def montar_comandos_do_template(equipamento_id, template, dados):
    """Retorna a lista de strings de comando prontas, para alimentar gerar_conteudo_writeconfig."""
    _, comandos = resolver_comandos_do_template(equipamento_id, template)
    return [_formatar_comando(c, dados) for c in comandos]


def get_equipamentos_com_templates(linha=None):
    """Para a home: equipamentos com templates cadastrados, opcionalmente filtrados por linha."""
    resultado = []
    for grupo in get_grupos_templates():
        equipamento = get_equipamento(grupo["equipamentoId"])
        if not equipamento or not grupo["templates"]:
            continue
        if linha and equipamento.get("linha") != linha:
            continue
        resultado.append({
            "equipamento": equipamento,
            "quantidade_templates": len(grupo["templates"]),
        })
    return resultado
