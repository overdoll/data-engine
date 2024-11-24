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
from .services.column_processor import ColumnOperationService, get_classifier
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

    # Create metadata with detected dataset type
    metadata: Metadata = {
        "storage_engine": "v1",
        "original_filename": file.name,
    }

    # Convert DataFrame to column-based format
    columns = csv_service.convert_df_to_columns(df)

    # Detect dataset type using AI
    try:
        dataset_type_result = ai_service.detect_dataset_type(columns)
        metadata["dataset_type"] = dataset_type_result
    except TokenLimitExceededError:
        # If too many tokens we don't detect the dataset type
        metadata["dataset_type"] = None

    # Save data and metadata
    csv_service.save_data(file_uuid, columns)
    csv_service.save_metadata(file_uuid, metadata)

    return Response(
        {
            "uuid": file_uuid,
            "metadata": metadata,
        }
    )


@api_view(["GET"])
def get_csv(request, uuid):
    try:
        columns = csv_service.get_data(str(uuid))
        _, rows = csv_service.transform_to_row_format(columns)
        return Response({"rows": rows})
    except ValueError:
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
def get_metadata(request, uuid):
    try:
        metadata = csv_service.get_metadata(str(uuid))
        columns = csv_service.get_data(str(uuid))
        column_defs, _ = csv_service.transform_to_row_format(columns)

        # Enhance column definitions with classifier metadata
        dataset_type = metadata.get("dataset_type")
        # Returns everything from s3 including suggestions
        # which is not ideal
        for col in column_defs:
            classification = col.get("classification")
            if classification:
                classifier = get_classifier(classification, col["id"])
                if classifier:
                    col["is_default_deduplication"] = (
                        dataset_type in classifier.allowed_dataset_types
                        if dataset_type
                        else False
                    )

        return Response({"columns": column_defs, "metadata": metadata})
    except ValueError:
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
def update_dataset_type(request, uuid):
    try:
        metadata_update = request.data.get("dataset_type")
        if not metadata_update:
            return Response(
                {"error": "dataset_type is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate dataset_type value
        if metadata_update not in [dt.value for dt in DatasetType]:
            return Response(
                {"error": f"Invalid dataset_type: {metadata_update}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        columns = csv_service.get_data(str(uuid))
        # Check if any columns are already classified
        classified_columns = [col for col in columns if col.get("classification")]
        if classified_columns:
            return Response(
                {
                    "error": "Cannot change dataset_type after columns have been classified. Please upload a new file."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update metadata
        metadata = csv_service.get_metadata(str(uuid)) or {}
        metadata["dataset_type"] = metadata_update
        csv_service.save_metadata(str(uuid), metadata)

        return Response({"status": "success"})

    except ValueError:
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
def apply_classifications(request, uuid):
    try:
        classifications = request.data.get("classifications", [])
        if not classifications:
            return Response(
                {"error": "No classifications provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        columns = csv_service.get_data(str(uuid))
        operations = []

        for classification in classifications:
            try:
                operation = column_operation_service.create_operation(
                    action="classify_column", **classification
                )
                operations.append(operation)
            except (
                ColumnNotFoundError,
                InvalidActionError,
                InvalidClassificationError,
            ) as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        columns = column_operation_service.apply_operations(columns, operations)
        csv_service.save_data(str(uuid), columns)

        # Update metadata to remove applied suggestions
        metadata = csv_service.get_metadata(str(uuid)) or {}
        if "suggestions" in metadata:
            classified_columns = [
                classification["column_id"] for classification in classifications
            ]
            metadata["suggestions"] = [
                s
                for s in metadata["suggestions"]
                if s.get("column_id") not in classified_columns
            ]
            csv_service.save_metadata(str(uuid), metadata)

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


@api_view(["POST"])
def generate_column_values(request, uuid):
    try:
        column_id = request.data.get("column_id")
        prompt = request.data.get("prompt")

        if not column_id or not prompt:
            return Response(
                {"error": "column_id and prompt are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get all columns
        columns = csv_service.get_data(str(uuid))

        # Find the target column
        target_column = next((col for col in columns if col["id"] == column_id), None)

        if not target_column:
            return Response(
                {"error": f"Column {column_id} not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            transformations = ai_service.generate_column_transformation(
                column=target_column, prompt=prompt
            )

            return Response(transformations)

        except TokenLimitExceededError as e:
            return Response(
                {
                    "error": "token_limit_exceeded",
                    "message": "This column has too much content to process. Please try with fewer unique values.",
                    "details": f"Token count: {e.token_count}, Limit: {e.limit}",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    except ValueError:
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
def update_column_values(request, uuid):
    """Update values in a column based on provided transformations"""
    try:
        column_id = request.data.get("column_id")
        transformations = request.data.get("transformations")

        if not column_id or not transformations:
            return Response(
                {"error": "column_id and transformations are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(transformations, dict):
            return Response(
                {"error": "transformations must be a dictionary"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get all columns
        columns = csv_service.get_data(str(uuid))

        # Create and apply the update operation
        operation = column_operation_service.create_operation(
            action="update_column_values", column_id=column_id, updates=transformations
        )

        updated_columns = column_operation_service.apply_operations(
            columns, [operation]
        )
        csv_service.save_data(str(uuid), updated_columns)

        return Response(
            {
                "status": "success",
                "column_id": column_id,
                "transformations_applied": len(transformations),
            }
        )

    except ColumnNotFoundError:
        return Response(
            {"error": f"Column {column_id} not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except ValueError:
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
def remove_column(request, uuid):
    try:
        column_id = request.data.get("column_id")
        if not column_id:
            return Response(
                {"error": "column_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        columns = csv_service.get_data(str(uuid))

        # Create and apply remove column operation
        try:
            operation = column_operation_service.create_operation(
                action="remove_column", column_id=column_id
            )
            columns = column_operation_service.apply_operations(columns, [operation])
            csv_service.save_data(str(uuid), columns)

            return Response({"status": "success"})

        except ColumnNotFoundError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    except ValueError:
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)
