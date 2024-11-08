from django.urls import path
from . import views

urlpatterns = [
    path("csv/upload", views.upload_csv, name="upload_csv"),
    path("csv/<uuid:uuid>", views.get_csv, name="get_csv"),
    path("csv/<uuid:uuid>/update", views.update_csv, name="update_csv"),
    path("csv/<uuid:uuid>/suggestions", views.get_suggestions, name="get_suggestions"),
]
