from typing import Dict, List, Tuple, NamedTuple
from splink import DuckDBAPI, Linker, SettingsCreator, block_on
import pandas as pd
from .types import ColumnDef, Row, BlockingRuleType
from .column_processor import get_classifier, ClassifierId
from pathlib import Path
import tempfile


class BlockingRule(NamedTuple):
    classifiers: Tuple[ClassifierId, ...]
    rule_type: BlockingRuleType


class DeduplicationService:
    def __init__(self):
        self.threshold = 0.5
        self.db_api = DuckDBAPI()
        # Define blocking rule combinations with their types
        self.blocking_rules = [
            # High match rate rules
            BlockingRule(
                (ClassifierId.PERSON_EMAIL,), BlockingRuleType.HIGH_MATCH_RATE
            ),
            BlockingRule(
                (ClassifierId.PERSON_PHONE,), BlockingRuleType.HIGH_MATCH_RATE
            ),
            BlockingRule(
                (ClassifierId.COMPANY_PHONE,), BlockingRuleType.HIGH_MATCH_RATE
            ),
            BlockingRule(
                (ClassifierId.COMPANY_EMAIL,), BlockingRuleType.HIGH_MATCH_RATE
            ),
            BlockingRule(
                (ClassifierId.PERSON_FIRST_NAME, ClassifierId.PERSON_LAST_NAME),
                BlockingRuleType.HIGH_MATCH_RATE,
            ),
            # Standard rules
            BlockingRule((ClassifierId.PERSON_LAST_NAME,), BlockingRuleType.STANDARD),
        ]

    def deduplicate(
        self,
        column_defs: List[ColumnDef],
        rows: List[Row],
        column_ids: List[str],
        uuid: str,
    ) -> Dict:
        """
        Deduplicate data using Splink with parameter estimation
        """
        # Transform data to format expected by Splink
        transformed_rows = self._rows_to_splink(rows)
        df = pd.DataFrame(transformed_rows)

        # Create settings using column IDs
        splink_settings = self._create_splink_settings(column_defs, column_ids)
        linker = Linker(df, splink_settings, self.db_api)

        blocking_rules = self._get_blocking_rules(column_defs, column_ids)

        if not any(rules for rules in blocking_rules.values()):
            return {
                "original_count": len(rows),
                "deduplicated_count": 0,
                "reason": "no blocking rules available",
                "grouped_results": [],
            }

        # Estimate u values using random sampling
        linker.training.estimate_u_using_random_sampling(max_pairs=1e6)

        # First estimate parameters using high match rate rules if available
        high_match_rules = blocking_rules[BlockingRuleType.HIGH_MATCH_RATE]
        if high_match_rules:
            for rule in high_match_rules:
                linker.training.estimate_parameters_using_expectation_maximisation(
                    rule,
                )

        # Then estimate using standard rules if no high match rate rules were available
        if not high_match_rules and blocking_rules[BlockingRuleType.STANDARD]:
            linker.training.estimate_parameters_using_expectation_maximisation(
                blocking_rules[BlockingRuleType.STANDARD][0],
                populate_probability_two_random_records_match_from_trained_values=True,
            )

        # Get predictions
        pairwise_predictions = linker.inference.predict(threshold_match_weight=-5)

        # Check if pairwise_predictions is empty
        if pairwise_predictions.as_pandas_dataframe().empty:
            return {
                "original_count": len(rows),
                "deduplicated_count": 0,  # No deduplication occurred
                "reason": "pairwise predictions empty",
            }

        # Cluster results
        clusters = linker.clustering.cluster_pairwise_predictions_at_threshold(
            pairwise_predictions, self.threshold
        )

        # Generate visualization
        self._generate_visualization(linker, pairwise_predictions, clusters, uuid)

        duplicate_mapping = self._create_duplicate_mapping(clusters)
        processed_rows, deduplicated_count = self._process_rows_with_duplicates(
            rows, duplicate_mapping
        )

        return {
            "original_count": len(rows),
            "deduplicated_count": deduplicated_count,
            "reason": "calculated using splink",
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

    def _get_blocking_rules(
        self, column_defs: List[ColumnDef], column_ids: List[str]
    ) -> Dict[BlockingRuleType, List[block_on]]:
        """Generate blocking rules based on available classified columns"""
        # Get classified columns that match our column_ids
        classified_columns = {
            col["id"]: col["classification"]
            for col in column_defs
            if col["id"] in column_ids and col.get("classification")
        }

        # Get valid classifiers for our columns
        column_classifiers = {
            col_id: get_classifier(classification, col_id)
            for col_id, classification in classified_columns.items()
        }

        # Generate blocking rules based on available classifiers
        blocking_rules: Dict[BlockingRuleType, List[block_on]] = {
            BlockingRuleType.HIGH_MATCH_RATE: [],
            BlockingRuleType.STANDARD: [],
        }

        # Check each blocking rule combination
        for rule in self.blocking_rules:
            matching_columns = []
            for classifier_id in rule.classifiers:
                # Find column that has this classification
                matching_col = next(
                    (
                        col_id
                        for col_id, classifier in column_classifiers.items()
                        if classifier and classifier.id() == classifier_id.value
                    ),
                    None,
                )
                if matching_col:
                    matching_columns.append(matching_col)

            # If we found all needed columns for this rule, add it
            if len(matching_columns) == len(rule.classifiers):
                blocking_rules[rule.rule_type].append(block_on(*matching_columns))

        return blocking_rules

    def _create_splink_settings(
        self, column_defs: List[ColumnDef], column_ids: List[str]
    ) -> SettingsCreator:
        """Create Splink settings with comparisons but no blocking rules"""
        # Get comparisons from classifiers
        comparisons = []
        for col in column_defs:
            if col["id"] in column_ids and col.get("classification"):
                classifier = get_classifier(col["classification"], col["id"])
                if classifier and classifier.splink_comparator:
                    comparisons.append(classifier.splink_comparator)

        if not comparisons:
            raise ValueError("No suitable comparisons could be generated")

        return SettingsCreator(
            link_type="dedupe_only",
            comparisons=comparisons,
            retain_intermediate_calculation_columns=True,
            retain_matching_columns=True,
            blocking_rules_to_generate_predictions=[],  # Empty list for blocking rules
        )

    def _generate_visualization(
        self,
        linker,
        pairwise_predictions,
        clusters,
        uuid: str,
    ) -> Path:
        """
        Generate and save the cluster studio visualization

        Args:
            linker: Splink linker instance
            pairwise_predictions: Splink pairwise predictions
            clusters: Splink clusters
            uuid: UUID of the CSV file

        Returns:
            Path to the generated visualization file
        """
        # Create temp directory if it doesn't exist
        tmp_dir = Path(tempfile.gettempdir()) / "cluster_studio"
        tmp_dir.mkdir(exist_ok=True)

        # Create visualization path
        visualization_path = tmp_dir / f"{uuid}_cluster_studio.html"

        # Generate visualization
        linker.visualisations.cluster_studio_dashboard(
            pairwise_predictions,
            clusters,
            str(
                visualization_path
            ),  # Convert to string as Splink expects a string path
            sampling_method="by_cluster_size",
            overwrite=True,
        )

        return visualization_path
