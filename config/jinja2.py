import json

from django.templatetags.static import static
from django.urls import reverse
from jinja2 import Environment
from markupsafe import Markup


def _tojson(value):
    s = json.dumps(value, ensure_ascii=False)
    s = s.replace("&", "\\u0026")
    s = s.replace("<", "\\u003c")
    s = s.replace(">", "\\u003e")
    s = s.replace("'", "\\u0027")
    return Markup(s)


def pluralize(value, singular="", plural="s"):
    try:
        return singular if int(value) == 1 else plural
    except Exception:
        return plural


def environment(**options):
    env = Environment(**options)

    env.filters["tojson"] = _tojson
    env.filters["pluralize"] = pluralize

    env.globals.update(
        url=reverse,
        static=static,
    )

    return env
