import json
from io import BytesIO
from pathlib import Path
from flask import Flask, render_template, abort, request, send_file

from lib.writeconfig import gerar_conteudo_writeconfig

app = Flask(__name__)

DATA_DIR = Path(__file__).parent / "data"


def _load(filename):
    with open(DATA_DIR / filename, encoding="utf-8") as f:
        return json.load(f)


def get_equipamentos():
    return _load("equipamentos.json")["equipamentos"]


def get_atualizacoes():
    return _load("atualizacoes.json")["atualizacoes"]


@app.route("/")
def home():
    return render_template(
        "home.html",
        equipamentos=get_equipamentos(),
        atualizacoes=get_atualizacoes(),
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

    modelos = {item.get("equipamentoId") for item in itens if isinstance(item, dict) and item.get("equipamentoId")}
    if len(modelos) > 1:
        abort(400)

    conteudo = gerar_conteudo_writeconfig(itens).encode("utf-8")
    arquivo = BytesIO(conteudo)
    arquivo.seek(0)

    return send_file(
        arquivo,
        mimetype="text/plain; charset=utf-8",
        as_attachment=True,
        download_name="writeconfig.txt",
    )


@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(debug=True, port=5001)
