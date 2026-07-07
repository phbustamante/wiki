import json
from io import BytesIO
from pathlib import Path
from flask import Flask, render_template, abort, request, send_file

from lib.templates import (
    get_equipamento,
    get_equipamentos_com_templates, get_templates_do_equipamento,
    get_template, get_grupos_templates, resolver_comandos_do_template,
    validar_dados, montar_comandos_do_template,
)

from lib.writeconfig import gerar_conteudo_writeconfig

app = Flask(__name__)

DATA_DIR = Path(__file__).parent / "data"


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


@app.route("/")
def landing():
    return render_template("landing.html")


@app.route("/<linha>")
def home(linha):
    templates_equipamentos = get_equipamentos_com_templates(linha=linha)
    return render_template(
        "home.html",
        equipamentos=get_equipamentos(linha=linha),
        atualizacoes=get_atualizacoes(linha=linha),
        templates_equipamentos=templates_equipamentos,
        linha=linha,
    )


@app.route("/<linha>/templates/<equipamento_id>")
def templates_do_equipamento(linha, equipamento_id):
    templates = get_templates_do_equipamento(equipamento_id)
    equipamento = get_equipamento(equipamento_id)
    if not templates or not equipamento:
        abort(404)
    return render_template(
        "templates_equipamento.html",
        equipamento=equipamento,
        templates=templates,
        linha=linha,
    )


@app.route("/<linha>/templates/<equipamento_id>/<template_id>")
def template_detail(linha, equipamento_id, template_id):
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
    conteudo = gerar_conteudo_writeconfig(comandos_prontos).encode("utf-8")

    arquivo = BytesIO(conteudo)
    arquivo.seek(0)
    return send_file(
        arquivo,
        mimetype="text/plain; charset=utf-8",
        as_attachment=True,
        download_name=f"{template_id}.txt",
    )


@app.route("/equipamento/<slug>")
def equipment(slug):
    eq = next((e for e in get_equipamentos() if e["id"] == slug), None)
    if not eq:
        abort(404)
    return render_template("equipment.html", equipamento=eq)


@app.route("/atualizacao/<slug>")
def update(slug):
    at = next((a for a in get_atualizacoes() if a["id"] == slug), None)
    if not at:
        abort(404)
    return render_template("update.html", atualizacao=at)


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
    nome_arquivo = "config.txt" if "jc182" in modelos else "writeconfig.txt"

    conteudo = gerar_conteudo_writeconfig(itens).encode("utf-8")
    arquivo = BytesIO(conteudo)
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
