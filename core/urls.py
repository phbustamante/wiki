from django.urls import path
from . import views

urlpatterns = [
    path("", views.landing, name="landing"),
    path("writeconfig/<str:origem>", views.writeconfig, name="writeconfig"),

    path("<str:linha>/", views.home, name="home"),
    path("<str:linha>/equipamento/<str:slug>",
         views.equipment, name="equipment"),
    path("<str:linha>/equipamento/<str:slug>/comandos",
         views.equipment_comandos, name="equipment_comandos"),
    path("<str:linha>/atualizacao/<str:slug>", views.update, name="update"),

    path("<str:linha>/templates/<str:equipamento_id>/<str:template_id>/gerar",
         views.template_gerar, name="template_gerar"),
    path("<str:linha>/templates/<str:equipamento_id>/<str:template_id>",
         views.template_detail, name="template_detail"),
    path("<str:linha>/templates/<str:equipamento_id>",
         views.templates_do_equipamento, name="templates_do_equipamento"),
]
