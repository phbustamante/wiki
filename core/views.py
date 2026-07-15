import json
from pathlib import Path

from django.http import Http404, HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from lib.writeconfig import gerar_writeconfig
from lib.templates import (
    get_equipamento,
    get_equipamentos_com_templates,
    get_templates_do_equipamento,
    get_template,
    resolver_comandos_do_template,
    validar_dados,
    montar_comandos_do_template,
)

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
    ids_com_atualizacao = {a["id"] for a in get_atualizacoes(linha)}
    templates_por_equipamento = {
        g["equipamento"]["id"]: g["quantidade_templates"]
        for g in get_equipamentos_com_templates(linha=linha)
    }
    equipamentos = []
    for e in get_equipamentos(linha):
        e = dict(e)
        e["n_templates"] = templates_por_equipamento.get(e["id"], 0)
        e["tem_atualizacao"] = e["id"] in ids_com_atualizacao
        equipamentos.append(e)
    return render(request, "home.html", {
        "equipamentos": equipamentos,
        "linha": linha,
    })


def _secoes_do_equipamento(linha, slug):
    """Flags usadas pelo hub e pela navegação entre as seções do equipamento."""
    return {
        "n_templates": len(get_templates_do_equipamento(slug)),
        "tem_atualizacao": any(a["id"] == slug for a in get_atualizacoes(linha)),
    }


def equipment(request, linha, slug):
    if linha not in LINHAS:
        raise Http404
    eq = next((e for e in get_equipamentos(linha) if e["id"] == slug), None)
    if not eq:
        raise Http404
    return render(request, "equipment_hub.html", {
        "equipamento": eq,
        "linha": linha,
        **_secoes_do_equipamento(linha, slug),
    })


def equipment_comandos(request, linha, slug):
    if linha not in LINHAS:
        raise Http404
    eq = next((e for e in get_equipamentos(linha) if e["id"] == slug), None)
    if not eq:
        raise Http404
    return render(request, "equipment.html", {
        "equipamento": eq,
        "linha": linha,
        **_secoes_do_equipamento(linha, slug),
    })


def update(request, linha, slug):
    if linha not in LINHAS:
        raise Http404
    at = next((a for a in get_atualizacoes(linha) if a["id"] == slug), None)
    if not at:
        raise Http404
    equipamento = next(
        (e for e in get_equipamentos(linha) if e["id"] == slug), None)
    return render(request, "update.html", {
        "atualizacao": at,
        "equipamento": equipamento,
        "linha": linha,
        **_secoes_do_equipamento(linha, slug),
    })


# --- Templates de Configuração (novo) ---

def templates_do_equipamento(request, linha, equipamento_id):
    if linha not in LINHAS:
        raise Http404
    templates = get_templates_do_equipamento(equipamento_id)
    equipamento = get_equipamento(equipamento_id)
    if not templates or not equipamento:
        raise Http404
    return render(request, "templates_equipamento.html", {
        "equipamento": equipamento,
        "templates": templates,
        "linha": linha,
        **_secoes_do_equipamento(linha, equipamento_id),
    })


def template_detail(request, linha, equipamento_id, template_id):
    if linha not in LINHAS:
        raise Http404
    template = get_template(equipamento_id, template_id)
    if not template:
        raise Http404
    equipamento, comandos = resolver_comandos_do_template(
        equipamento_id, template)
    return render(request, "template_detail.html", {
        "template": template,
        "equipamento": equipamento,
        "comandos": comandos,
        "linha": linha,
    })


@csrf_exempt
@require_POST
def template_gerar(request, linha, equipamento_id, template_id):
    if linha not in LINHAS:
        raise Http404

    template = get_template(equipamento_id, template_id)
    if not template:
        raise Http404

    dados = json.loads(request.body or b"{}")
    _, comandos_def = resolver_comandos_do_template(equipamento_id, template)

    erros = validar_dados(comandos_def, dados)
    if erros:
        return JsonResponse({"erros": erros}, status=400)

    comandos_prontos = montar_comandos_do_template(
        equipamento_id,
        template,
        dados,
    )

    conteudo, nome_arquivo = gerar_writeconfig(
        comandos_prontos,
        equipamento_id,
    )

    response = HttpResponse(
        conteudo.encode("utf-8"),
        content_type="text/plain; charset=utf-8",
    )

    response["Content-Disposition"] = (
        f'attachment; filename="{nome_arquivo}"'
    )

    return response


# --- já existente ---

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

    equipamento_id = next(iter(modelos), "")

    conteudo, nome_arquivo = gerar_writeconfig(
        itens,
        equipamento_id,
    )

    response = HttpResponse(
        conteudo.encode("utf-8"),
        content_type="text/plain; charset=utf-8",
    )

    response["Content-Disposition"] = (
        f'attachment; filename="{nome_arquivo}"'
    )

    return response


def page_not_found(request, exception=None):
    return render(request, "404.html", status=404)
