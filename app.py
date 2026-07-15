import json
from io import BytesIO
from pathlib import Path
from flask import Flask, render_template, abort, request, send_file, url_for

from lib.templates import (
    get_equipamento,
    get_equipamentos_com_templates, get_templates_do_equipamento,
    get_template, resolver_comandos_do_template,
    validar_dados, montar_comandos_do_template,
)

from lib.writeconfig import gerar_writeconfig

app = Flask(__name__)

DATA_DIR = Path(__file__).parent / "data"
LINHAS = {"jc", "vl"}


def _url(name, kwargs=None):
    """Compatível com o `url()` dos templates (assinatura do reverse do Django)."""
    return url_for(name, **(kwargs or {}))


def _pluralize(value, singular="", plural="s"):
    try:
        return singular if int(value) == 1 else plural
    except Exception:
        return plural


app.jinja_env.globals["url"] = _url
app.jinja_env.filters["pluralize"] = _pluralize


def _load(filename):
    with open(DATA_DIR / filename, encoding="utf-8") as f:
        return json.load(f)


def get_equipamentos(linha=None):
    equipamentos = _load("equipamentos.json")["equipamentos"]
    if linha:
        return [e for e in equipamentos if e.get("linha") == linha]
    return equipamentos


def get_atualizacoes(linha=None):
    atualizacoes = _load("atualizacoes.json")["atualizacoes"]
    if linha:
        return [a for a in atualizacoes if a.get("linha") == linha]
    return atualizacoes


def _secoes_do_equipamento(linha, slug):
    """Flags usadas pelo hub e pela navegação entre as seções do equipamento."""
    return {
        "n_templates": len(get_templates_do_equipamento(slug)),
        "tem_atualizacao": any(a["id"] == slug for a in get_atualizacoes(linha)),
    }


@app.route("/")
def landing():
    return render_template("landing.html")


@app.route("/<linha>")
@app.route("/<linha>/")
def home(linha):
    if linha not in LINHAS:
        abort(404)
    ids_com_atualizacao = {a["id"] for a in get_atualizacoes(linha)}
    templates_por_equipamento = {
        g["equipamento"]["id"]: g["quantidade_templates"]
        for g in get_equipamentos_com_templates(linha=linha)
    }
    equipamentos = []
    for e in get_equipamentos(linha=linha):
        e = dict(e)
        e["n_templates"] = templates_por_equipamento.get(e["id"], 0)
        e["tem_atualizacao"] = e["id"] in ids_com_atualizacao
        equipamentos.append(e)
    return render_template(
        "home.html",
        equipamentos=equipamentos,
        linha=linha,
    )


@app.route("/<linha>/equipamento/<slug>")
def equipment(linha, slug):
    if linha not in LINHAS:
        abort(404)
    eq = next((e for e in get_equipamentos(linha) if e["id"] == slug), None)
    if not eq:
        abort(404)
    return render_template(
        "equipment_hub.html",
        equipamento=eq,
        linha=linha,
        **_secoes_do_equipamento(linha, slug),
    )


@app.route("/<linha>/equipamento/<slug>/comandos")
def equipment_comandos(linha, slug):
    if linha not in LINHAS:
        abort(404)
    eq = next((e for e in get_equipamentos(linha) if e["id"] == slug), None)
    if not eq:
        abort(404)
    return render_template(
        "equipment.html",
        equipamento=eq,
        linha=linha,
        **_secoes_do_equipamento(linha, slug),
    )


@app.route("/<linha>/atualizacao/<slug>")
def update(linha, slug):
    if linha not in LINHAS:
        abort(404)
    at = next((a for a in get_atualizacoes(linha) if a["id"] == slug), None)
    if not at:
        abort(404)
    equipamento = next(
        (e for e in get_equipamentos(linha) if e["id"] == slug), None)
    return render_template(
        "update.html",
        atualizacao=at,
        equipamento=equipamento,
        linha=linha,
        **_secoes_do_equipamento(linha, slug),
    )


@app.route("/<linha>/templates/<equipamento_id>")
def templates_do_equipamento(linha, equipamento_id):
    if linha not in LINHAS:
        abort(404)
    templates = get_templates_do_equipamento(equipamento_id)
    equipamento = get_equipamento(equipamento_id)
    if not templates or not equipamento:
        abort(404)
    return render_template(
        "templates_equipamento.html",
        equipamento=equipamento,
        templates=templates,
        linha=linha,
        **_secoes_do_equipamento(linha, equipamento_id),
    )


@app.route("/<linha>/templates/<equipamento_id>/<template_id>")
def template_detail(linha, equipamento_id, template_id):
    if linha not in LINHAS:
        abort(404)
    template = get_template(equipamento_id, template_id)
    if not template:
        abort(404)
    equipamento, comandos = resolver_comandos_do_template(
        equipamento_id, template)
    return render_template(
        "template_detail.html",
        template=template,
        equipamento=equipamento,
        comandos=comandos,
        linha=linha,
    )


@app.post("/<linha>/templates/<equipamento_id>/<template_id>/gerar")
def template_gerar(linha, equipamento_id, template_id):
    if linha not in LINHAS:
        abort(404)
    template = get_template(equipamento_id, template_id)
    if not template:
        abort(404)

    dados = request.get_json(silent=True) or {}
    _, comandos_def = resolver_comandos_do_template(equipamento_id, template)

    erros = validar_dados(comandos_def, dados)
    if erros:
        return {"erros": erros}, 400

    comandos_prontos = montar_comandos_do_template(
        equipamento_id, template, dados)
    conteudo, nome_arquivo = gerar_writeconfig(
        comandos_prontos, equipamento_id)

    arquivo = BytesIO(conteudo.encode("utf-8"))
    arquivo.seek(0)
    return send_file(
        arquivo,
        mimetype="text/plain; charset=utf-8",
        as_attachment=True,
        download_name=nome_arquivo,
    )


@app.post("/writeconfig/<origem>")
def writeconfig(origem):
    dados = request.get_json(silent=True) or {}
    itens = dados.get("itens", [])

    if origem not in ("favoritos", "historico"):
        abort(404)

    modelos = {item.get("equipamentoId") for item in itens if isinstance(
        item, dict) and item.get("equipamentoId")}
    if len(modelos) > 1:
        abort(400)

    equipamento_id = next(iter(modelos), "")
    conteudo, nome_arquivo = gerar_writeconfig(itens, equipamento_id)

    arquivo = BytesIO(conteudo.encode("utf-8"))
    arquivo.seek(0)
    return send_file(
        arquivo,
        mimetype="text/plain; charset=utf-8",
        as_attachment=True,
        download_name=nome_arquivo,
    )


@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(debug=True, port=5001)
