from django.urls import path
from . import views

urlpatterns = [
    path("csv/upload", views.upload_csv, name="upload_csv"),
    path("csv/<uuid:uuid>", views.get_csv, name="get_csv"),
    path("csv/<uuid:uuid>/update", views.update_csv, name="update_csv"),
    path("csv/<uuid:uuid>/suggestions", views.get_suggestions, name="get_suggestions"),
    path("csv/<uuid:uuid>/deduplicate", views.deduplicate_csv, name="deduplicate_csv"),
    path("csv/<uuid:uuid>/generate-column-values", views.generate_column_values, name="generate_column_values"),
    path("csv/<uuid:uuid>/update-column-values", views.update_column_values, name="update_column_values"),
]
