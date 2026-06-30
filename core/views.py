import json
from io import BytesIO
from pathlib import Path

from django.http import Http404, HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from lib.writeconfig import gerar_conteudo_writeconfig

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
LINHAS = {"jc", "vl"}


def _load(filename):
    with open(DATA_DIR / filename, encoding="utf-8") as f:
        return json.load(f)


def get_equipamentos(linha=None):
    eqs = _load("equipamentos.json")["equipamentos"]
    if linha:
        eqs = [e for e in eqs if e.get("linha") == linha]
    return eqs


def get_atualizacoes(linha=None):
    ats = _load("atualizacoes.json")["atualizacoes"]
    if linha:
        ats = [a for a in ats if a.get("linha") == linha]
    return ats


def landing(request):
    return render(request, "landing.html")


def home(request, linha):
    if linha not in LINHAS:
        raise Http404
    return render(request, "home.html", {
        "equipamentos": get_equipamentos(linha),
        "atualizacoes": get_atualizacoes(linha),
        "linha": linha,
    })


def equipment(request, linha, slug):
    if linha not in LINHAS:
        raise Http404
    eq = next((e for e in get_equipamentos(linha) if e["id"] == slug), None)
    if not eq:
        raise Http404
    return render(request, "equipment.html", {"equipamento": eq})


def update(request, linha, slug):
    if linha not in LINHAS:
        raise Http404
    at = next((a for a in get_atualizacoes(linha) if a["id"] == slug), None)
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
