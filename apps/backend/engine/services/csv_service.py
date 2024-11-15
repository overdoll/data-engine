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


class CSVService:
    def __init__(self):
        self.s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        self.bucket = settings.AWS_STORAGE_BUCKET_NAME

    @classmethod
    def generate_column_id(cls, label: str) -> str:
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

    def get_metadata(self, file_uuid: str) -> Metadata:
        try:
            metadata_obj = self.s3.get_object(
                Bucket=self.bucket, Key=f"{file_uuid}/metadata.json"
            )
            return json.loads(metadata_obj["Body"].read())
        except self.s3.exceptions.NoSuchKey:
            raise ValueError("Metadata not found")

    def save_metadata(self, file_uuid: str, metadata: Metadata):
        self.s3.put_object(
            Bucket=self.bucket,
            Key=f"{file_uuid}/metadata.json",
            Body=json.dumps(metadata),
        )

    def parse_csv(self, file: BinaryIO) -> pl.DataFrame:
        df = pl.read_csv(file)
        return self._process_dataframe(df)

    def _process_dataframe(self, df: pl.DataFrame) -> pl.DataFrame:
        # Create a list of columns that have at least one non-null value
        # while preserving their original order
        non_empty_cols = [col for col in df.columns if df[col].null_count() < len(df)]

        # Filter to keep only non-empty columns in original order
        df = df.select(non_empty_cols)

        # Rename unnamed columns to "(No name)" while preserving order
        new_names = {col: "(No name)" if not col.strip() else col for col in df.columns}
        df = df.rename(new_names)

        return df

    def save_data(self, file_uuid: str, columns: List[ColumnDef]):
        self.s3.put_object(
            Bucket=self.bucket,
            Key=f"{file_uuid}/data.json",
            Body=json.dumps(columns),
        )

    def get_data(self, file_uuid: str) -> List[ColumnDef]:
        data_obj = self.s3.get_object(Bucket=self.bucket, Key=f"{file_uuid}/data.json")
        data = data_obj["Body"].read()
        return json.loads(data)

    def convert_df_to_columns(self, df: pl.DataFrame) -> List[ColumnDef]:
        columns: List[ColumnDef] = []
        for col_name in df.columns:
            # Generate a simple ID by combining the column name with 4 random letters
            column_id = (
                f"{col_name}_{''.join(random.choices(string.ascii_lowercase, k=4))}"
            )
            column_data = df[col_name].to_list()
            # Convert all values to strings
            column_data = [str(val) if val is not None else None for val in column_data]

            columns.append(
                {
                    "id": column_id,
                    "label": col_name,
                    "classification": None,
                    "data": column_data,
                }
            )
        return columns

    def transform_to_row_format(
        self, columns: List[ColumnDef]
    ) -> tuple[List[Column], List[Row]]:
        if not columns or not columns[0]["data"]:
            return [], []

        # Extract column definitions without data
        column_defs = [
            {
                "id": col["id"],
                "label": col["label"],
                "classification": col["classification"],
            }
            for col in columns
        ]

        # Transform to row format using simple numeric IDs
        num_rows = len(columns[0]["data"])
        rows = []

        for row_idx in range(num_rows):
            row_data = {}
            for col in columns:
                row_data[col["id"]] = col["data"][row_idx]

            rows.append({"id": str(uuid.uuid4()), "data": row_data})

        return column_defs, rows
