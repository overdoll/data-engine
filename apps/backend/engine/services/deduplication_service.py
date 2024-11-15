from typing import Dict, List, Tuple
from splink import DuckDBAPI, Linker, SettingsCreator, block_on
import pandas as pd
from .types import ColumnDef, Row
from .column_processor import get_classifier, ClassifierId


class DeduplicationService:
    def __init__(self, threshold: float = 0.8):
        self.threshold = threshold
        self.db_api = DuckDBAPI()

    def deduplicate(self, column_defs: List[ColumnDef], rows: List[Row]) -> Dict:
        """
        Deduplicate data using Splink with Polars

        Args:
            column_defs: List of column definitions with id, label, and classification
            rows: List of rows where each row has an id and data dict keyed by column id
        """

        # Transform data to format expected by Splink
        transformed_rows = self._rows_to_splink(rows)
        df = pd.DataFrame(transformed_rows)

        # Create settings using column IDs
        settings = self._create_splink_settings(column_defs)
        linker = Linker(df, settings, self.db_api)

        # Train the model
        linker.training.estimate_u_using_random_sampling(max_pairs=1e6)

        # Get predictions
        pairwise_predictions = linker.inference.predict(threshold_match_weight=-5)

        # Cluster results
        clusters = linker.clustering.cluster_pairwise_predictions_at_threshold(
            pairwise_predictions, self.threshold
        )

        duplicate_mapping = self._create_duplicate_mapping(clusters)
        processed_rows, deduplicated_count = self._process_rows_with_duplicates(
            rows, duplicate_mapping
        )

        return {
            "rows": processed_rows,
            "original_count": len(rows),
            "deduplicated_count": deduplicated_count,
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

    def _create_splink_settings(self, column_defs: List[ColumnDef]) -> SettingsCreator:
        """Create Splink settings based on classified columns"""
        comparisons = []
        blocking_columns = []

        # Map of high-confidence classifiers for blocking rules
        blocking_classifiers = {ClassifierId.EMAIL.value, ClassifierId.PHONE.value}

        for col in column_defs:
            classification = col.get("classification")
            if classification:
                classifier = get_classifier(classification, col["id"])
                if classifier and classifier.splink_comparator:
                    comparison = classifier.splink_comparator
                    comparisons.append(comparison)

                    # Add columns with high-confidence classifiers to blocking rules
                    if classifier.id() in blocking_classifiers:
                        blocking_columns.append(col["id"])

        # Create blocking rules from appropriate columns
        blocking_rules = [block_on(col_id) for col_id in blocking_columns]
        return SettingsCreator(
            link_type="dedupe_only",
            comparisons=comparisons,
            blocking_rules_to_generate_predictions=blocking_rules,
        )
