from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core import views

handler404 = "core.views.page_not_found"

urlpatterns = [
    path("", include("core.urls")),
] + static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
