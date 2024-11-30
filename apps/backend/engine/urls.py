from django.urls import path
from . import views

urlpatterns = [
    path("list-csv", views.list_csv_files, name="list_csv_files"),
    path("upload-csv", views.upload_csv, name="upload_csv"),
    path("csv/<str:uuid>", views.get_csv, name="get_csv"),
    path("csv/<str:uuid>/remove-column", views.remove_column, name="remove_column"),
    path(
        "csv/<str:uuid>/update-dataset-type",
        views.update_dataset_type,
        name="update_dataset_type",
    ),
    path(
        "csv/<str:uuid>/apply-classifications",
        views.apply_classifications,
        name="apply_classifications",
    ),
    path("csv/<str:uuid>/suggestions", views.get_suggestions, name="get_suggestions"),
    path("csv/<str:uuid>/deduplicate", views.deduplicate_csv, name="deduplicate_csv"),
    path(
        "csv/<str:uuid>/generate-column-values",
        views.generate_column_values,
        name="generate_column_values",
    ),
    path(
        "csv/<str:uuid>/update-column-values",
        views.update_column_values,
        name="update_column_values",
    ),
    path(
        "csv/<str:uuid>/metadata",
        views.get_metadata,
        name="get_metadata",
    ),
    path(
        "deduplicate/visualize",
        views.visualize_deduplication,
        name="visualize_deduplication",
    ),
    path(
        "csv/<str:uuid>/deduplicate/visualize",
        views.visualize_deduplication,
        name="visualize_deduplication",
    ),
    path("feature-request", views.feature_request, name="feature_request"),
]
