import json
from io import BytesIO
from pathlib import Path

from django.http import Http404, HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from lib.writeconfig import gerar_conteudo_writeconfig

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load(filename):
    with open(DATA_DIR / filename, encoding="utf-8") as f:
        return json.load(f)


def get_equipamentos():
    return _load("equipamentos.json")["equipamentos"]


def get_atualizacoes():
    return _load("atualizacoes.json")["atualizacoes"]


def home(request):
    return render(request, "home.html", {
        "equipamentos": get_equipamentos(),
        "atualizacoes": get_atualizacoes(),
    })


def equipment(request, slug):
    eq = next((e for e in get_equipamentos() if e["id"] == slug), None)
    if not eq:
        raise Http404
    return render(request, "equipment.html", {"equipamento": eq})


def update(request, slug):
    at = next((a for a in get_atualizacoes() if a["id"] == slug), None)
    if not at:
        raise Http404
    return render(request, "update.html", {"atualizacao": at})


@csrf_exempt
@require_POST
def writeconfig(request, origem):
    if origem not in ("favoritos", "historico"):
        raise Http404

    dados = json.loads(request.body or b"{}")
    itens = dados.get("itens", [])

    modelos = {
        item.get("equipamentoId")
        for item in itens
        if isinstance(item, dict) and item.get("equipamentoId")
    }
    if len(modelos) > 1:
        return HttpResponse(status=400)

    nome_arquivo = "config.txt" if "jc182" in modelos else "writeconfig.txt"
    conteudo = gerar_conteudo_writeconfig(itens).encode("utf-8")

    response = HttpResponse(conteudo, content_type="text/plain; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{nome_arquivo}"'
    return response


def page_not_found(request, exception=None):
    return render(request, "404.html", status=404)
