from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
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
from django.http import HttpResponse
from pathlib import Path
import tempfile
from rest_framework.permissions import IsAuthenticated
from .authentication import ClerkJWTAuthentication

import datetime
from .services.email_service import EmailService
import requests

csv_service = CSVService()
column_operation_service = ColumnOperationService()
ai_service = AIService()
deduplication_service = DeduplicationService()
email_service = EmailService()


@api_view(["POST"])
@authentication_classes([ClerkJWTAuthentication])
@permission_classes([IsAuthenticated])
def upload_csv(request):
    if "file" not in request.FILES:
        return Response(
            {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Check user's paid status from the user instance
    if not request.user.is_paid:
        file_uuids = csv_service.list_user_files(request.user.id)
        if len(file_uuids) >= 3:
            return Response(
                {
                    "error": "Free users can only upload up to 3 files. Please upgrade to upload more files."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

    file = request.FILES["file"]
    df = csv_service.parse_csv(file)
    file_uuid = csv_service.generate_friendly_id(file.name)

    # Create metadata with detected dataset type and user information
    metadata: Metadata = {
        "uuid": file_uuid,
        "storage_engine": "v1",
        "original_filename": file.name,
        "user_id": request.user.id,  # Add user ID to metadata
        "created_at": datetime.datetime.now().isoformat(),
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
    csv_service.save_data(request.user.id, file_uuid, columns)
    csv_service.save_metadata(request.user.id, file_uuid, metadata)

    return Response(
        {
            "uuid": file_uuid,
            "metadata": metadata,
        }
    )


@api_view(["GET"])
@authentication_classes([ClerkJWTAuthentication])
@permission_classes([IsAuthenticated])
def get_csv(request, uuid):
    try:
        columns = csv_service.get_data(request.user.id, str(uuid))
        _, rows = csv_service.transform_to_row_format(columns)
        return Response({"rows": rows})
    except ValueError:
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@authentication_classes([ClerkJWTAuthentication])
@permission_classes([IsAuthenticated])
def get_metadata(request, uuid):
    try:
        metadata = csv_service.get_metadata(request.user.id, str(uuid))
        columns = csv_service.get_data(request.user.id, str(uuid))
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
@authentication_classes([ClerkJWTAuthentication])
@permission_classes([IsAuthenticated])
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

        columns = csv_service.get_data(request.user.id, str(uuid))
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
        metadata = csv_service.get_metadata(request.user.id, str(uuid)) or {}
        metadata["dataset_type"] = metadata_update
        csv_service.save_metadata(request.user.id, str(uuid), metadata)

        return Response({"status": "success"})

    except ValueError:
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@authentication_classes([ClerkJWTAuthentication])
@permission_classes([IsAuthenticated])
def apply_classifications(request, uuid):
    try:
        classifications = request.data.get("classifications", [])
        if not classifications:
            return Response(
                {"error": "No classifications provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        columns = csv_service.get_data(request.user.id, str(uuid))
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
        csv_service.save_data(request.user.id, str(uuid), columns)

        # Update metadata to remove applied suggestions
        metadata = csv_service.get_metadata(request.user.id, str(uuid)) or {}
        if "suggestions" in metadata:
            classified_columns = [
                classification["column_id"] for classification in classifications
            ]
            metadata["suggestions"] = [
                s
                for s in metadata["suggestions"]
                if s.get("column_id") not in classified_columns
            ]
            csv_service.save_metadata(request.user.id, str(uuid), metadata)

        return Response({"status": "success"})

    except ValueError:
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@authentication_classes([ClerkJWTAuthentication])
@permission_classes([IsAuthenticated])
def get_suggestions(request, uuid):
    print(f"Received suggestion request for UUID: {uuid}")
    try:
        metadata = csv_service.get_metadata(request.user.id, str(uuid))

        # Check if we have cached suggestions
        if metadata and "suggestions" in metadata:
            print("Returning cached suggestions from metadata")
            return Response(metadata["suggestions"])

        columns = csv_service.get_data(request.user.id, str(uuid))

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
        csv_service.save_metadata(request.user.id, str(uuid), metadata)

        print("Successfully got and cached suggestions")
        return Response(suggestions)

    except ValueError:
        print(f"CSV not found for UUID: {uuid}")
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@authentication_classes([ClerkJWTAuthentication])
@permission_classes([IsAuthenticated])
def deduplicate_csv(request, uuid):
    # Get column_ids from request body
    column_ids = request.data.get("column_ids", [])
    if not column_ids:
        return Response(
            {"error": "No column_ids provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Get the existing classified data
    metadata = csv_service.get_metadata(request.user.id, str(uuid))
    columns = csv_service.get_data(request.user.id, str(uuid))
    column_defs, rows = csv_service.transform_to_row_format(columns)

    # Perform deduplication
    result = deduplication_service.deduplicate(
        column_defs,
        rows,
        column_ids,
        uuid,
        metadata["dataset_type"],
    )
    return Response(result)


@api_view(["GET"])
@authentication_classes([ClerkJWTAuthentication])
@permission_classes([IsAuthenticated])
def visualize_deduplication(request, uuid):
    try:
        # Get the visualization file
        tmp_dir = Path(tempfile.gettempdir()) / "cluster_studio" / str(uuid)
        file_path = tmp_dir / "cluster_studio.html"

        if not file_path.exists():
            return Response(
                {"error": "Visualization not found. Please run deduplication first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        with file_path.open("r", encoding="utf-8") as f:
            content = f.read()
            return HttpResponse(content, content_type="text/html")

    except FileNotFoundError:
        return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@authentication_classes([ClerkJWTAuthentication])
@permission_classes([IsAuthenticated])
def remove_column(request, uuid):
    try:
        column_id = request.data.get("column_id")
        if not column_id:
            return Response(
                {"error": "column_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        columns = csv_service.get_data(request.user.id, str(uuid))

        # Create and apply remove column operation
        try:
            operation = column_operation_service.create_operation(
                action="remove_column", column_id=column_id
            )
            columns = column_operation_service.apply_operations(columns, [operation])
            csv_service.save_data(request.user.id, str(uuid), columns)

            return Response({"status": "success"})

        except ColumnNotFoundError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    except ValueError:
        return Response({"error": "CSV not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@authentication_classes([ClerkJWTAuthentication])
@permission_classes([IsAuthenticated])
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
        columns = csv_service.get_data(request.user.id, str(uuid))

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
@authentication_classes([ClerkJWTAuthentication])
@permission_classes([IsAuthenticated])
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
        columns = csv_service.get_data(request.user.id, str(uuid))

        # Create and apply the update operation
        operation = column_operation_service.create_operation(
            action="update_column_values", column_id=column_id, updates=transformations
        )

        updated_columns = column_operation_service.apply_operations(
            columns, [operation]
        )
        csv_service.save_data(request.user.id, str(uuid), updated_columns)

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
def send_message(request):
    """Handle incoming messages from users"""
    # Get message data
    title = request.data.get("title")
    description = request.data.get("description", "")
    customer_message = request.data.get("customer_message", "")

    if not title:
        return Response(
            {"error": "message type is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Prepare email content
    email_data = {
        "title": title,
        "description": description,
        "customer_message": customer_message,
        "timestamp": datetime.datetime.now().isoformat(),
    }

    # Add user info if authenticated
    if hasattr(request, "user") and request.user.is_authenticated:
        email_data["clerk_id"] = request.user.id
        email_data["clerk_email"] = request.user.email

    try:
        # Send email via EmailService
        email_service.send_transactional_email(
            transactional_id="cm4932bve006e7c90z3zv0tyw",
            email="ilya@wispbit.com",
            data=email_data,
        )
    except requests.exceptions.RequestException as e:
        return Response(
            {"error": f"Failed to send email: {str(e)}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({"status": "success", "message": "Message received and sent"})


@api_view(["GET"])
@authentication_classes([ClerkJWTAuthentication])
@permission_classes([IsAuthenticated])
def list_csv_files(request):
    # Get list of file UUIDs
    file_uuids = csv_service.list_user_files(request.user.id)

    # Fetch metadata for each file
    files = []
    for file_uuid in file_uuids:
        try:
            metadata = csv_service.get_metadata(request.user.id, file_uuid)
            files.append(
                {
                    "uuid": file_uuid,
                    "original_filename": metadata.get("original_filename"),
                    "dataset_type": metadata.get("dataset_type"),
                    "created_at": metadata.get(
                        "created_at"
                    ),  # Will be None if not present
                }
            )
        except ValueError:
            # Skip files with missing/invalid metadata
            continue

    # Sort by created_at if available, newest first
    files.sort(key=lambda x: x["created_at"] if x["created_at"] else "", reverse=True)

    return Response(files)
