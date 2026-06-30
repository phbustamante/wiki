from django.urls import path
from . import views

urlpatterns = [
    path("", views.landing, name="landing"),
    path("writeconfig/<str:origem>", views.writeconfig, name="writeconfig"),
    path("<str:linha>/", views.home, name="home"),
    path("<str:linha>/equipamento/<str:slug>", views.equipment, name="equipment"),
    path("<str:linha>/atualizacao/<str:slug>", views.update, name="update"),
]
