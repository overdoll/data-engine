from typing import Dict, List, Tuple, NamedTuple
from splink import Linker, SettingsCreator, block_on, DuckDBAPI
from splink.blocking_rule_library import CustomRule
import pandas as pd
from .types import ColumnDef, Row
from .column_processor import get_classifier, ClassifierId
from pathlib import Path
import tempfile
from enum import Enum

from .base import (
    DatasetType,
)


class BlockingRuleType(Enum):
    PROBABILISTIC = "probabilistic"
    DETERMINISTIC = "deterministic"


class BlockingRule(NamedTuple):
    rule_type: BlockingRuleType
    # required_columns: All columns that must exist in the input data for this rule to be used
    # For example, to use first_name + last_name blocking, both columns must be present
    required_columns: Tuple[ClassifierId, ...]
    # blocking_rules: Each inner tuple represents a combination of columns to block on
    # Records are compared only within blocks that match on these column combinations
    # Multiple rules allow for different blocking strategies (e.g. match on first_name OR last_name)
    blocking_rules: Tuple[Tuple[ClassifierId, ...], ...]


# TODO:
# two choices here with deduplication rules:
# either get AI to generate this
# or we hardcode it based on our experience
DEDUPLICATION_RULES = {
    DatasetType.PERSON: [
        # Exact name match
        BlockingRule(
            rule_type=BlockingRuleType.DETERMINISTIC,
            required_columns=(
                ClassifierId.PERSON_FIRST_NAME,
                ClassifierId.PERSON_LAST_NAME,
            ),
            blocking_rules=(
                f"l.{ClassifierId.PERSON_LAST_NAME} = r.{ClassifierId.PERSON_LAST_NAME} AND l.{ClassifierId.PERSON_FIRST_NAME} = r.{ClassifierId.PERSON_FIRST_NAME}",
            ),
        ),
        # Fuzzy first name + exact last name
        BlockingRule(
            rule_type=BlockingRuleType.DETERMINISTIC,
            required_columns=(
                ClassifierId.PERSON_FIRST_NAME,
                ClassifierId.PERSON_LAST_NAME,
            ),
            blocking_rules=(
                f"l.{ClassifierId.PERSON_LAST_NAME} = r.{ClassifierId.PERSON_LAST_NAME} AND levenshtein(l.{ClassifierId.PERSON_FIRST_NAME}, r.{ClassifierId.PERSON_FIRST_NAME}) < 3",
            ),
        ),
        # Email match
        BlockingRule(
            rule_type=BlockingRuleType.DETERMINISTIC,
            required_columns=(ClassifierId.PERSON_EMAIL,),
            blocking_rules=((ClassifierId.PERSON_EMAIL,),),
        ),
        # Phone match
        BlockingRule(
            rule_type=BlockingRuleType.DETERMINISTIC,
            required_columns=(ClassifierId.PERSON_PHONE,),
            blocking_rules=((ClassifierId.PERSON_PHONE,),),
        ),
        # Social media profile match
        BlockingRule(
            rule_type=BlockingRuleType.DETERMINISTIC,
            required_columns=(ClassifierId.PERSON_SOCIAL,),
            blocking_rules=((ClassifierId.PERSON_SOCIAL,),),
        ),
        # Website match
        BlockingRule(
            rule_type=BlockingRuleType.DETERMINISTIC,
            required_columns=(ClassifierId.PERSON_WEBSITE,),
            blocking_rules=((ClassifierId.PERSON_WEBSITE,),),
        ),
        # Last name + phone combination
        BlockingRule(
            rule_type=BlockingRuleType.DETERMINISTIC,
            required_columns=(
                ClassifierId.PERSON_LAST_NAME,
                ClassifierId.PERSON_PHONE,
            ),
            blocking_rules=(
                f"l.{ClassifierId.PERSON_LAST_NAME} = r.{ClassifierId.PERSON_LAST_NAME} AND l.{ClassifierId.PERSON_PHONE} = r.{ClassifierId.PERSON_PHONE}",
            ),
        ),
        # Last name + email domain combination
        BlockingRule(
            rule_type=BlockingRuleType.DETERMINISTIC,
            required_columns=(
                ClassifierId.PERSON_LAST_NAME,
                ClassifierId.PERSON_EMAIL,
            ),
            blocking_rules=(
                f"l.{ClassifierId.PERSON_LAST_NAME} = r.{ClassifierId.PERSON_LAST_NAME} AND split_part(l.{ClassifierId.PERSON_EMAIL}, '@', 2) = split_part(r.{ClassifierId.PERSON_EMAIL}, '@', 2)",
            ),
        ),
    ],
    DatasetType.COMPANY: [
        # Exact company name match
        BlockingRule(
            rule_type=BlockingRuleType.DETERMINISTIC,
            required_columns=(ClassifierId.COMPANY_NAME,),
            blocking_rules=((ClassifierId.COMPANY_NAME,),),
        ),
        # Fuzzy company name match
        BlockingRule(
            rule_type=BlockingRuleType.DETERMINISTIC,
            required_columns=(ClassifierId.COMPANY_NAME,),
            blocking_rules=(
                f"levenshtein(l.{ClassifierId.COMPANY_NAME}, r.{ClassifierId.COMPANY_NAME}) < 3",
            ),
        ),
        # Website match
        BlockingRule(
            rule_type=BlockingRuleType.DETERMINISTIC,
            required_columns=(ClassifierId.COMPANY_WEBSITE,),
            blocking_rules=((ClassifierId.COMPANY_WEBSITE,),),
        ),
        # Phone match
        BlockingRule(
            rule_type=BlockingRuleType.DETERMINISTIC,
            required_columns=(ClassifierId.COMPANY_PHONE,),
            blocking_rules=((ClassifierId.COMPANY_PHONE,),),
        ),
        # Social media profile match
        BlockingRule(
            rule_type=BlockingRuleType.DETERMINISTIC,
            required_columns=(ClassifierId.COMPANY_SOCIAL,),
            blocking_rules=((ClassifierId.COMPANY_SOCIAL,),),
        ),
    ],
}


class DeduplicationError(Exception):
    """Base exception for deduplication errors"""

    pass


class DeduplicationService:
    def deduplicate(
        self,
        column_defs: List[ColumnDef],
        rows: List[Row],
        column_ids: List[str],
        uuid: str,
        dataset_type: str,
    ) -> Dict:
        try:
            if not column_ids:
                raise DeduplicationError("NO_COLUMNS_SELECTED")

            dataset_type = DatasetType(dataset_type)

            # Transform data to format expected by Splink
            transformed_rows = self._rows_to_splink(rows)
            df = pd.DataFrame(transformed_rows)

            # Get matching approach, blocking rules, and comparisons
            rule_type, blocking_rules, comparisons = self._get_blocking_rules(
                column_defs, column_ids, dataset_type
            )

            # Get predictions based on deduplication type
            if rule_type == BlockingRuleType.DETERMINISTIC:
                pairwise_predictions, linker = self._get_deterministic_predictions(
                    df, blocking_rules
                )
                threshold = None
            else:
                pairwise_predictions, linker = self._get_probabilistic_predictions(
                    df, blocking_rules, comparisons
                )
                threshold = 0.5

            # Check if pairwise_predictions is empty
            if pairwise_predictions.as_pandas_dataframe().empty:
                raise DeduplicationError("NO_MATCHES")

            # Cluster predictions
            clusters = linker.clustering.cluster_pairwise_predictions_at_threshold(
                pairwise_predictions, threshold_match_probability=threshold
            )

            # Generate visualization
            # TODO: this fails sometimes
            # self._generate_visualization(linker, pairwise_predictions, clusters, uuid)

            # Process results
            duplicate_mapping = self._create_duplicate_mapping(clusters)
            print(duplicate_mapping)
            processed_rows, deduplicated_count = self._process_rows_with_duplicates(
                rows, duplicate_mapping
            )

            return {
                "original_count": len(rows),
                "deduplicated_count": deduplicated_count,
                "deduplication_type": "deterministic"
                if rule_type == BlockingRuleType.DETERMINISTIC
                else "probabilistic",
                "rows": processed_rows,
            }
        except DeduplicationError as e:
            return {
                "original_count": len(rows),
                "deduplicated_count": 0,
                "error": str(e),
            }

    def _get_deterministic_predictions(
        self, df: pd.DataFrame, blocking_rules: List[block_on]
    ):
        """Get predictions using deterministic matching"""
        db_api = DuckDBAPI()

        settings = SettingsCreator(
            link_type="dedupe_only",
            retain_intermediate_calculation_columns=True,
            retain_matching_columns=True,
            blocking_rules_to_generate_predictions=blocking_rules,
        )

        linker = Linker(df, settings, db_api)
        return linker.inference.deterministic_link(), linker

    def _get_probabilistic_predictions(
        self,
        df: pd.DataFrame,
        blocking_rules: List[block_on],
        comparisons: List,
    ):
        """Get predictions using probabilistic matching"""
        if not comparisons:
            raise DeduplicationError(
                "No valid comparison columns available after blocking"
            )

        splink_settings = SettingsCreator(
            link_type="dedupe_only",
            comparisons=comparisons,
            retain_intermediate_calculation_columns=True,
            retain_matching_columns=True,
            blocking_rules_to_generate_predictions=[],
        )

        db_api = DuckDBAPI()

        linker = Linker(df, splink_settings, db_api)

        # Estimate u values using random sampling
        linker.training.estimate_u_using_random_sampling(max_pairs=1e6)

        # We train the m values for each blocking rule
        for rule in blocking_rules:
            linker.training.estimate_parameters_using_expectation_maximisation(rule)

        return linker.inference.predict(threshold_match_weight=-5), linker

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
            row_copy = {}
            row_id = row["id"]
            row_copy["id"] = row_id
            row_copy["is_duplicate_of"] = duplicate_mapping.get(row_id, None)
            processed_rows.append(row_copy)

        deduplicated_count = len(rows) - len(duplicate_mapping)

        return processed_rows, deduplicated_count

    def _get_blocking_rules(
        self,
        column_defs: List[ColumnDef],
        column_ids: List[str],
        dataset_type: DatasetType,
    ) -> Tuple[BlockingRuleType, List[block_on], List]:
        """
        Determine blocking rules, matching approach, and comparisons based on available columns
        Returns tuple of (rule_type, blocking_rules, comparisons)
        """
        # Map columns to their classifiers and collect comparisons
        column_classifiers: Dict[ClassifierId, str] = {}
        comparisons = []

        for col in column_defs:
            if col["id"] in column_ids and col.get("classification"):
                classifier = get_classifier(col["classification"], col["id"])
                if classifier:
                    column_classifiers[ClassifierId(classifier.id())] = col["id"]
                    if classifier.splink_comparator:
                        comparisons.append(classifier.splink_comparator)

        if not column_classifiers:
            raise DeduplicationError("NO_CLASSIFIED_COLUMNS")

        # Get applicable rules for this dataset type
        dataset_rules = DEDUPLICATION_RULES.get(dataset_type, [])
        if not dataset_rules:
            raise DeduplicationError("NO_RULES_FOR_DATASET_TYPE")

        # Find matching rules based on available columns
        matching_rules: List[BlockingRule] = []
        for rule in dataset_rules:
            if all(col_id in column_classifiers for col_id in rule.required_columns):
                matching_rules.append(rule)

        if not matching_rules:
            raise DeduplicationError("NO_MATCHING_RULES")

        # Convert matching rules to Splink blocking rules
        splink_rules = []
        block_rules = []
        for rule in matching_rules:
            for blocking_combo in rule.blocking_rules:
                if isinstance(blocking_combo, str):  # Custom SQL expression
                    # Replace the classifier IDs with actual column names in the expression
                    expression = blocking_combo
                    for classifier_id, col_name in column_classifiers.items():
                        # Replace both l.CLASSIFIER_ID and r.CLASSIFIER_ID with actual column names
                        expression = expression.replace(
                            f"l.{classifier_id}", f"l.{col_name}"
                        )
                        expression = expression.replace(
                            f"r.{classifier_id}", f"r.{col_name}"
                        )

                    splink_rules.append(CustomRule(expression))
                    block_rules.append(expression)
                else:
                    # Handle simple column-based blocking
                    block_columns = []
                    for col_id in blocking_combo:
                        matching_columns = [
                            col_name
                            for classifier_id, col_name in column_classifiers.items()
                            if classifier_id == col_id
                        ]
                        block_columns.extend(matching_columns)

                    if block_columns:
                        splink_rules.append(block_on(*block_columns))
                        block_rules.append(block_columns)

        # Determine matching approach
        has_deterministic = any(
            rule.rule_type == BlockingRuleType.DETERMINISTIC for rule in matching_rules
        )
        has_probabilistic = any(
            rule.rule_type == BlockingRuleType.PROBABILISTIC for rule in matching_rules
        )

        if has_deterministic and not has_probabilistic:
            return BlockingRuleType.DETERMINISTIC, splink_rules, []
        elif has_probabilistic:
            if not comparisons:
                raise DeduplicationError("NO_COMPARISONS")
            return BlockingRuleType.PROBABILISTIC, splink_rules, comparisons
        else:
            raise DeduplicationError("NO_VALID_MATCHING_RULES")

    def _generate_visualization(
        self,
        linker,
        pairwise_predictions,
        clusters,
        uuid: str,
    ) -> Path:
        # Create temp directory if it doesn't exist
        tmp_dir = Path(tempfile.gettempdir()) / "cluster_studio" / str(uuid)
        tmp_dir.mkdir(parents=True, exist_ok=True)

        # Create visualization path
        visualization_path = tmp_dir / "cluster_studio.html"

        # Generate visualization
        linker.visualisations.cluster_studio_dashboard(
            pairwise_predictions,
            clusters,
            str(visualization_path),
            sampling_method="by_cluster_size",
            overwrite=True,
        )

        return visualization_path
