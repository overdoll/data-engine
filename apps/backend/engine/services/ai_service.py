from typing import List, Dict
from openai import OpenAI
from .column_processor import CLASSIFIERS, ClassifierId
from .types import ColumnDef
from django.conf import settings
from pydantic import BaseModel
from uuid import uuid4


class ColumnClassification(BaseModel):
    column_id: str
    classification: ClassifierId


class ResponseFormatList(BaseModel):
    classifications: List[ColumnClassification]


COLUMN_SAMPLE_SIZE = 10


class AIService:
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.AI_API_KEY,
        )

    def _get_column_sample(self, column: ColumnDef) -> List[str]:
        """Get first x non-null values from column"""
        non_empty_values = [val for val in column["data"] if val and val.strip()]
        if len(non_empty_values) == 0:
            return []
        return non_empty_values[:COLUMN_SAMPLE_SIZE]

    def _get_valid_columns(
        self, columns: List[ColumnDef]
    ) -> List[tuple[ColumnDef, List[str]]]:
        """Get columns that are valid for AI classification along with their samples.
        Returns list of tuples containing (column, sample_data)"""
        valid_columns = []

        for col in columns:
            if col["classification"]:
                continue

            sample = self._get_column_sample(col)
            if sample:
                valid_columns.append((col, sample))

        return valid_columns

    def _get_column_context(self, columns: List[ColumnDef]) -> str:
        """Get context for columns for AI"""
        sample_columns = self._get_valid_columns(columns)

        return "\n".join(
            [
                f"Column '{id}' Sample Content: {', '.join(sample)}"
                for id, sample in sample_columns
            ]
        )

    def _get_classifier_context(self) -> str:
        """Get context for classifiers for AI"""
        return "\n".join(
            [
                f"- {c_id}: {classifier.situation}"
                for c_id, classifier in CLASSIFIERS.items()
            ]
        )

    def _validate_suggestions(
        self, raw_suggestions: List[ColumnClassification], columns: List[ColumnDef]
    ) -> List[Dict[str, str]]:
        # Get set of valid column IDs and create mapping to labels
        valid_column_ids = {col["id"] for col in columns}
        column_labels = {col["id"]: col["label"] for col in columns}

        # Filter valid suggestions
        valid_suggestions = []
        for suggestion in raw_suggestions:
            # Check if classifier exists and column exists
            classifier = CLASSIFIERS.get(suggestion.classification)
            if classifier and suggestion.column_id in valid_column_ids:
                valid_suggestions.append(
                    {
                        "suggestion_id": str(uuid4()),
                        "column_id": suggestion.column_id,
                        "classification": suggestion.classification,
                        "description": classifier.description,
                        "label": column_labels[suggestion.column_id],
                    }
                )
            else:
                if suggestion.classification not in CLASSIFIERS:
                    print(
                        f"Dropping invalid classifier suggestion: {suggestion.classification} for column '{column_labels.get(suggestion.column_id, 'unknown')}' ({suggestion.column_id})"
                    )
                if suggestion.column_id not in valid_column_ids:
                    print(
                        f"Dropping invalid column ID suggestion: {suggestion.column_id} with classification {suggestion.classification}"
                    )

        return valid_suggestions

    def get_column_suggestions(
        self, columns: List[ColumnDef]
    ) -> List[ColumnClassification]:
        """Get AI suggestions for column classifications"""
        classifiers_context = self._get_classifier_context()
        columns_context = self._get_column_context(columns)

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a data classifier that analyzes column contents and determines their type. "
                    "For each column, you must:\n"
                    "1. Look at the sample data\n"
                    "2. Compare against all available classifiers\n"
                    "3. Only classify if there is a strong match\n"
                    "4. Each column should get at most one classification\n"
                    "5. It's okay to leave columns unclassified if unsure\n"
                    "6. Respond with a list of classifications in the exact format requested"
                ),
            },
            {
                "role": "system",
                "content": f"Available classifiers:\n{classifiers_context}",
            },
            {
                "role": "user",
                "content": (
                    "Analyze these columns and provide classifications. "
                    f"Here are the column samples:\n{columns_context}"
                ),
            },
        ]

        response = self.client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06",
            messages=messages,
            response_format=ResponseFormatList,
        )

        raw_suggestions = response.choices[0].message.parsed.classifications
        return self._validate_suggestions(raw_suggestions, columns)
