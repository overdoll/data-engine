import polars as pl
import boto3
import json
from typing import List, BinaryIO
from django.conf import settings
from .types import Metadata, ColumnDef, Column, Row
import random
import string
import re
import uuid
from django.utils.text import slugify


class CSVService:
    def __init__(self):
        # Initialize S3 client with optional credentials
        s3_kwargs = {}
        if hasattr(settings, "AWS_ACCESS_KEY_ID") and hasattr(
            settings, "AWS_SECRET_ACCESS_KEY"
        ):
            s3_kwargs.update(
                {
                    "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
                    "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
                }
            )

        self.s3 = boto3.client("s3", **s3_kwargs)
        self.bucket = settings.AWS_STORAGE_BUCKET_NAME

    def _get_user_path(self, user_id: str, file_uuid: str) -> str:
        """Generate the S3 path prefix for a user's file"""
        return f"{user_id}/{file_uuid}"

    def generate_friendly_id(self, filename: str) -> str:
        # Remove file extension
        base_name = filename.rsplit(".", 1)[0]
        # Create a slug from the filename
        slug = slugify(base_name, allow_unicode=False).replace("_", "-")[
            :30
        ]  # Limit slug length
        # Generate 6 random characters
        random_chars = "".join(
            random.choices(string.ascii_lowercase + string.digits, k=6)
        )
        # Combine slug and random chars
        return f"{slug}-{random_chars}"

    @classmethod
    def generate_column_id(cls, label: str) -> str:
        """Generate friendly column ID so its easier to debug on BE + FE"""
        # Convert to lowercase and replace all non-alphanumeric chars with underscore
        formatted_label = re.sub(r"[^a-z0-9_]", "_", label.lower())

        # Ensure it starts with a letter (prepend 'col' if it doesn't)
        if not formatted_label[0].isalpha():
            formatted_label = f"col_{formatted_label}"

        # Remove consecutive underscores
        formatted_label = re.sub(r"_+", "_", formatted_label)

        # Remove trailing underscores
        formatted_label = formatted_label.strip("_")

        # Truncate to max length (leaving room for the 5 chars: _ + 4 random letters)
        formatted_label = formatted_label[:27]

        # Remove _l or _r from the end if present
        formatted_label = re.sub(r"_[lr]$", "", formatted_label)

        # Generate the final ID with random suffix
        return (
            f"{formatted_label}_{''.join(random.choices(string.ascii_lowercase, k=4))}"
        )

    def get_metadata(self, user_id: str, file_uuid: str) -> Metadata:
        try:
            path = self._get_user_path(user_id, file_uuid)
            metadata_obj = self.s3.get_object(
                Bucket=self.bucket, Key=f"{path}/metadata.json"
            )
            metadata = json.loads(metadata_obj["Body"].read())
            metadata["created_at"] = (
                metadata.get("created_at") or metadata_obj["LastModified"].isoformat()
            )
            return metadata
        except self.s3.exceptions.NoSuchKey:
            raise ValueError("Metadata not found")

    def save_metadata(self, user_id: str, file_uuid: str, metadata: Metadata):
        path = self._get_user_path(user_id, file_uuid)
        self.s3.put_object(
            Bucket=self.bucket,
            Key=f"{path}/metadata.json",
            Body=json.dumps(metadata),
        )

    def parse_csv(self, file: BinaryIO) -> pl.DataFrame:
        df = pl.read_csv(file)
        return self._process_dataframe(df)

    def _process_dataframe(self, df: pl.DataFrame) -> pl.DataFrame:
        # Create a list of columns that have at least one non-empty value
        # (not null AND not empty string)
        non_empty_cols = [
            col
            for col in df.columns
            if df[col]
            .fill_null("")  # Replace nulls with empty string
            .cast(pl.Utf8)  # Convert to string type
            .str.strip_chars()  # Strip whitespace
            .ne("")  # Check if not empty string
            .any()  # Check if any value is True
        ]

        # If we have no non-empty columns, keep all columns to prevent empty DataFrame
        if not non_empty_cols:
            non_empty_cols = df.columns

        # Filter to keep only non-empty columns in original order
        df = df.select(non_empty_cols)

        # Rename unnamed or empty string columns to "(No name)" while preserving order
        new_names = {col: "(No name)" if not col.strip() else col for col in df.columns}
        df = df.rename(new_names)

        return df

    def save_data(self, user_id: str, file_uuid: str, columns: List[ColumnDef]):
        path = self._get_user_path(user_id, file_uuid)
        self.s3.put_object(
            Bucket=self.bucket,
            Key=f"{path}/data.json",
            Body=json.dumps(columns),
        )

    def get_data(self, user_id: str, file_uuid: str) -> List[ColumnDef]:
        path = self._get_user_path(user_id, file_uuid)
        try:
            data_obj = self.s3.get_object(Bucket=self.bucket, Key=f"{path}/data.json")
            data = data_obj["Body"].read()
            return json.loads(data)
        except self.s3.exceptions.NoSuchKey:
            raise ValueError("Data not found")

    def convert_df_to_columns(self, df: pl.DataFrame) -> List[ColumnDef]:
        # Generate row IDs once
        row_ids = [str(uuid.uuid4()) for _ in range(len(df))]

        columns: List[ColumnDef] = []
        for col_name in df.columns:
            column_id = self.generate_column_id(col_name)
            column_data = df[col_name].to_list()
            # Convert values to strings, treating empty/whitespace strings as None
            column_data = [
                str(val)
                if val is not None and str(val).strip() not in ["", "None"]
                else None
                for val in column_data
            ]

            columns.append(
                {
                    "id": column_id,
                    "label": col_name,
                    "classification": None,
                    "data": column_data,
                }
            )

        # Add row_id column
        columns.append(
            {
                "id": "row_id",
                "label": "Row ID",
                "classification": None,
                "data": row_ids,
            }
        )

        return columns

    def transform_to_row_format(
        self, columns: List[ColumnDef]
    ) -> tuple[List[Column], List[Row]]:
        if not columns or not columns[0]["data"]:
            return [], []

        # Extract column definitions without data and row_id column
        column_defs = [
            {
                "id": col["id"],
                "label": col["label"],
                "classification": col["classification"],
            }
            for col in columns
            if col["id"] != "row_id"
        ]

        # Find row_id column
        row_id_column = next((col for col in columns if col["id"] == "row_id"), None)
        if not row_id_column:
            raise ValueError("Row ID column not found")

        # Transform to row format using stored row IDs
        num_rows = len(columns[0]["data"])
        rows = []

        for row_idx in range(num_rows):
            row_data = {}
            for col in columns:
                if col["id"] != "row_id":  # Skip row_id column in data
                    row_data[col["id"]] = col["data"][row_idx]

            rows.append({"id": row_id_column["data"][row_idx], "data": row_data})

        return column_defs, rows

    def list_user_files(self, user_id: str) -> List[str]:
        """List all CSV file UUIDs for a user"""
        # List all objects with the user_id prefix
        response = self.s3.list_objects_v2(Bucket=self.bucket, Prefix=f"{user_id}/")

        if "Contents" not in response:
            return []

        # Get unique file UUIDs by looking at metadata.json files
        file_uuids = set()
        for obj in response["Contents"]:
            # Extract UUID from paths like "user_id/uuid/metadata.json"
            parts = obj["Key"].split("/")
            if len(parts) == 3 and parts[2] == "metadata.json":
                file_uuids.add(parts[1])

        return list(file_uuids)
