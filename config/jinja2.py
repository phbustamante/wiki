import json
from jinja2 import Environment
from markupsafe import Markup


def _tojson(value):
    s = json.dumps(value, ensure_ascii=False)
    s = s.replace("&", "\\u0026")
    s = s.replace("<", "\\u003c")
    s = s.replace(">", "\\u003e")
    s = s.replace("'", "\\u0027")
    return Markup(s)


def environment(**options):
    env = Environment(**options)
    env.filters["tojson"] = _tojson
    return env
