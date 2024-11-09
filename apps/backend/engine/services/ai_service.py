from typing import List, Dict, Any
from openai import OpenAI
from .column_processor import CLASSIFIERS
from django.conf import settings
from pydantic import BaseModel


class ColumnClassification(BaseModel):
    column_id: str
    classification: str  # TODO this may need to be enforced by the ClassiferId enum


class ResponseFormatList(BaseModel):
    classifications: List[ColumnClassification]


class AIService:
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.AI_API_KEY,
        )

    def _get_column_sample(self, column: Dict[str, Any]) -> List[str]:
        """Get first 10 non-null values from column"""
        return [val for val in column["data"] if val and val.strip()][:10]

    def _get_column_context(self, columns: List[Dict[str, Any]]) -> str:
        return "\n".join(
            [
                f"Column '{col['id']}' examples: {', '.join(self._get_column_sample(col))}"
                for col in columns
            ]
        )

    def _get_classifier_context(self) -> str:
        return "\n".join(
            [
                f"- {c_id}: {classifier.situation}"
                for c_id, classifier in CLASSIFIERS.items()
            ]
        )

    def get_column_suggestions(self, columns: List[Dict[str, Any]]) -> str:
        """Get AI suggestions for column classifications"""
        classifiers = self._get_classifier_context()
        columns = self._get_column_context(columns)

        # TODO try prompting each column with each case
        # i.e. "does this column fit this? no? what about this? yes? great, classify it"

        # TODO if the response format does not contain the column IDs or classifications
        # just remove the item from the response

        response = self.client.beta.chat.completions.parse(
            model="gpt-4o-mini-2024-07-18",
            messages=[
                {
                    "role": "system",
                    "content": "Using the classifiers and their situtations, and given the contents of the column, classify each column. Do not classify a column if it does not fit the situation.",
                },
                {"role": "system", "content": f"Classifiers: {classifiers}"},
                {
                    "role": "user",
                    "content": columns,
                },
            ],
            response_format=ResponseFormatList,
        )

        return response.choices[0].message.parsed
