import polars as pl
import boto3
import json
import uuid
from typing import List, BinaryIO
from django.conf import settings
from .types import Metadata, ColumnDef, Column, Row


class CSVService:
    def __init__(self):
        self.s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        self.bucket = settings.AWS_STORAGE_BUCKET_NAME

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
            column_id = str(uuid.uuid4())
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

        # Transform to row format
        num_rows = len(columns[0]["data"])
        rows = []

        for row_idx in range(num_rows):
            row_data = {}
            for col in columns:
                row_data[col["id"]] = col["data"][row_idx]

            rows.append({"id": str(uuid.uuid4()), "data": row_data})

        return column_defs, rows
