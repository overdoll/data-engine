import uuid
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .services.csv_service import CSVService, Metadata
from .services.ai_service import AIService, TokenLimitExceededError
from .services.base import (
    ColumnNotFoundError,
    InvalidActionError,
    InvalidClassificationError,
    DatasetType,
)
from .services.column_processor import ColumnOperationService
from .services.deduplication_service import DeduplicationService

csv_service = CSVService()
column_operation_service = ColumnOperationService()
ai_service = AIService()
deduplication_service = DeduplicationService()


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
        metadata_updates = request.data.get("metadata", {})

        # Handle dataset_type update if provided
        if "dataset_type" in metadata_updates:
            dataset_type = metadata_updates["dataset_type"]
            # Validate dataset_type value
            if not dataset_type or dataset_type not in [dt.value for dt in DatasetType]:
                return Response(
                    {"error": f"Invalid dataset_type: {dataset_type}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if any columns are already classified
            classified_columns = [col for col in columns if col.get("classification")]
            if classified_columns:
                return Response(
                    {
                        "error": "Cannot change dataset_type after columns have been classified. Please upload a new file."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        operations = []
        for update in updates:
            try:
                operation = column_operation_service.create_operation(**update)
                operations.append(operation)
            except (
                ColumnNotFoundError,
                InvalidActionError,
                InvalidClassificationError,
            ) as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if operations:
            columns = column_operation_service.apply_operations(columns, operations)
            csv_service.save_data(str(uuid), columns)

        # Update metadata
        try:
            metadata = csv_service.get_metadata(str(uuid)) or {}

            # Update dataset_type if provided
            if "dataset_type" in metadata_updates:
                metadata["dataset_type"] = metadata_updates["dataset_type"]

            # Handle existing suggestion removal logic
            if "suggestions" in metadata and operations:
                classified_columns = [
                    update["column_id"]
                    for update in updates
                    if update.get("action") == "classify_column"
                ]
                metadata["suggestions"] = [
                    s
                    for s in metadata["suggestions"]
                    if s.get("column_id") not in classified_columns
                ]

            csv_service.save_metadata(str(uuid), metadata)
        except Exception as e:
            # Don't fail the operation if metadata update fails
            print(f"Failed to update metadata: {str(e)}")
            pass

        return Response({"status": "success"})

    except ValueError:
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
def get_suggestions(request, uuid):
    print(f"Received suggestion request for UUID: {uuid}")
    try:
        metadata = csv_service.get_metadata(str(uuid))

        # Check if we have cached suggestions
        if metadata and "suggestions" in metadata:
            print("Returning cached suggestions from metadata")
            return Response(metadata["suggestions"])

        columns = csv_service.get_data(str(uuid))

        # Generate new suggestions if none exist
        print(f"Retrieved {len(columns)} columns, getting AI suggestions")
        try:
            suggestions = ai_service.get_column_suggestions(
                columns, metadata["dataset_type"]
            )
        except TokenLimitExceededError as e:
            return Response(
                {
                    "error": "token_limit_exceeded",
                    "message": "This file is too large to process automatically. Please try a file with fewer columns or shorter content.",
                    "details": f"Token count: {e.token_count}, Limit: {e.limit}",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update metadata with new suggestions
        metadata = metadata or {}
        metadata["suggestions"] = suggestions
        csv_service.save_metadata(str(uuid), metadata)

        print("Successfully got and cached suggestions")
        return Response(suggestions)

    except ValueError:
        print(f"CSV not found for UUID: {uuid}")
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
def deduplicate_csv(request, uuid):
    try:
        # Get column_ids from request body
        column_ids = request.data.get("column_ids", [])
        if not column_ids:
            return Response(
                {"error": "No column_ids provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get the existing classified data
        columns = csv_service.get_data(str(uuid))
        column_defs, rows = csv_service.transform_to_row_format(columns)

        # Perform deduplication
        result = deduplication_service.deduplicate(column_defs, rows, column_ids)
        return Response(result)

    except ValueError:
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)
