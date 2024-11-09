import uuid
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .services.csv_service import CSVService, Metadata
from .services.ai_service import AIService
from .services.base import (
    ColumnNotFoundError,
    InvalidActionError,
    InvalidClassificationError,
)
from .services.column_processor import ColumnOperationService

csv_service = CSVService()
column_operation_service = ColumnOperationService()
ai_service = AIService()


@api_view(["POST"])
def upload_csv(request):
    if "file" not in request.FILES:
        return Response(
            {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    file = request.FILES["file"]
    df = csv_service.parse_csv(file)
    file_uuid = str(uuid.uuid4())

    # Create metadata
    metadata: Metadata = {
        "storageEngine": "v1",
        "originalFilename": file.name,
    }

    # Convert DataFrame to column-based format and save
    columns = csv_service.convert_df_to_columns(df)
    csv_service.save_data(file_uuid, columns)
    csv_service.save_metadata(file_uuid, metadata)

    return Response({"uuid": file_uuid})


@api_view(["GET"])
def get_csv(request, uuid):
    try:
        columns = csv_service.get_data(str(uuid))
        column_defs, rows = csv_service.transform_to_row_format(columns)

        return Response({"columns": column_defs, "rows": rows})
    except ValueError:
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
def update_csv(request, uuid):
    try:
        columns = csv_service.get_data(str(uuid))
        updates = request.data.get("updates", [])

        operations = []
        for update in updates:
            try:
                # TODO we may want to pass silently if operation is invalid
                # because AI could hallucinate
                operation = column_operation_service.create_operation(**update)
                operations.append(operation)
            except (
                ColumnNotFoundError,
                InvalidActionError,
                InvalidClassificationError,
            ) as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        columns = column_operation_service.apply_operations(columns, operations)
        csv_service.save_data(str(uuid), columns)
        return Response({"status": "success"})

    except ValueError:
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
def get_suggestions(request, uuid):
    try:
        columns = csv_service.get_data(str(uuid))
        suggestions = ai_service.get_column_suggestions(columns)
        return Response({"suggestions": suggestions})
    except ValueError:
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"error": f"Error generating suggestions: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
