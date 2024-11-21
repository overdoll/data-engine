from typing import Dict, List, Tuple
from splink import DuckDBAPI, Linker, SettingsCreator, block_on
import pandas as pd
from .types import ColumnDef, Row
from .column_processor import get_classifier


class DeduplicationService:
    def __init__(self):
        self.threshold = 0.1
        self.db_api = DuckDBAPI()

    def deduplicate(
        self, column_defs: List[ColumnDef], rows: List[Row], column_ids: List[str]
    ) -> Dict:
        """
        Deduplicate data using Splink with Polars

        Args:
            column_defs: List of column definitions with id, label, and classification
            rows: List of rows where each row has an id and data dict keyed by column id
            column_ids: List of column IDs to use for deduplication
        """

        # Transform data to format expected by Splink
        transformed_rows = self._rows_to_splink(rows)
        df = pd.DataFrame(transformed_rows)

        # Create settings using column IDs
        settings = self._create_splink_settings(column_defs, column_ids)
        linker = Linker(df, settings, self.db_api)

        # Train the model
        linker.training.estimate_u_using_random_sampling(max_pairs=1e6)

        # Get predictions
        # TODO: why can the pairwise predictions be empty?
        pairwise_predictions = linker.inference.predict(
            threshold_match_probability=self.threshold
        )

        # Check if pairwise_predictions is empty
        if pairwise_predictions.as_pandas_dataframe().empty:
            return {
                # "rows": rows,  # Return original rows unchanged
                "original_count": len(rows),
                "deduplicated_count": len(rows),  # No deduplication occurred
                "reason": "pairwise predictions empty",
            }

        # Cluster results
        clusters = linker.clustering.cluster_pairwise_predictions_at_threshold(
            pairwise_predictions, self.threshold
        )

        duplicate_mapping = self._create_duplicate_mapping(clusters)
        processed_rows, deduplicated_count = self._process_rows_with_duplicates(
            rows, duplicate_mapping
        )

        return {
            "original_count": len(rows),
            "deduplicated_count": deduplicated_count,
            "reason": "calculated using splink",
            # "rows": processed_rows,
        }

    def _rows_to_splink(self, rows: List[Row]) -> List[Dict]:
        """Transform rows to format expected by Splink"""
        return [{"unique_id": row["id"]} | row["data"] for row in rows]

    def _create_duplicate_mapping(self, clusters) -> Dict[str, str]:
        """
        Create mapping of duplicate IDs to their canonical record IDs

        Args:
            clusters: Splink clustering results

        Returns:
            Dict mapping duplicate IDs to canonical record IDs
        """
        duplicate_mapping = {}
        cluster_groups = clusters.as_pandas_dataframe()

        for _, cluster_rows in cluster_groups.groupby("cluster_id"):
            # Sort cluster rows to consistently pick the same canonical record
            cluster_rows = cluster_rows.sort_values("unique_id")

            if len(cluster_rows) > 1:
                # First row in cluster is canonical
                canonical_id = cluster_rows.iloc[0]["unique_id"]

                # Mark other rows as duplicates
                for duplicate_id in cluster_rows.iloc[1:]["unique_id"]:
                    duplicate_mapping[duplicate_id] = canonical_id

        return duplicate_mapping

    def _process_rows_with_duplicates(
        self, rows: List[Row], duplicate_mapping: Dict[str, str]
    ) -> Tuple[List[Row], int]:
        """
        Process rows and add duplicate information

        Args:
            rows: Original list of rows
            duplicate_mapping: Mapping of duplicate IDs to canonical record IDs

        Returns:
            Tuple of (processed rows, count of unique records)
        """
        processed_rows = []

        for row in rows:
            row_copy = row.copy()
            row_id = row["id"]
            row_copy["is_duplicate_of"] = duplicate_mapping.get(row_id, None)
            processed_rows.append(row_copy)

        deduplicated_count = len(rows) - len(duplicate_mapping)

        return processed_rows, deduplicated_count

    def _create_splink_settings(
        self, column_defs: List[ColumnDef], column_ids: List[str]
    ) -> SettingsCreator:
        """Create Splink settings based on classified columns"""
        comparisons = []

        # Filter columns first
        filtered_columns = [col for col in column_defs if col["id"] in column_ids]

        for col in filtered_columns:
            classification = col.get("classification")
            if classification:
                classifier = get_classifier(classification, col["id"])
                if classifier and classifier.splink_comparator:
                    comparison = classifier.splink_comparator
                    comparisons.append(comparison)

        return SettingsCreator(
            link_type="dedupe_only",
            comparisons=comparisons,
            blocking_rules_to_generate_predictions=[
                block_on("emails0address_kiuk")
            ],  # we dont use blocking rules for now - not enough data
        )
