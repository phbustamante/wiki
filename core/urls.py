from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("equipamento/<str:slug>", views.equipment, name="equipment"),
    path("atualizacao/<str:slug>", views.update, name="update"),
    path("writeconfig/<str:origem>", views.writeconfig, name="writeconfig"),
]
