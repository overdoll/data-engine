from typing import List, Dict, Any
from openai import OpenAI
from .column_processor import CLASSIFIERS, ClassifierId
from django.conf import settings


class AIService:
    def __init__(self):
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.AI_API_KEY,
        )

    def _get_column_sample(self, column: Dict[str, Any]) -> List[str]:
        """Get first 10 non-null values from column"""
        return [val for val in column["data"] if val and val.strip()][:10]

    def _create_classification_prompt(self, columns: List[Dict[str, Any]]) -> str:
        # Create context about available classifications
        classifications_context = "\n".join(
            [
                f"- {c_id}: {classifier.situation}"
                for c_id, classifier in CLASSIFIERS.items()
            ]
        )

        # Create context about columns
        columns_context = "\n".join(
            [
                f"Column '{col['label']}' examples: {', '.join(self._get_column_sample(col))}"
                for col in columns
            ]
        )

        return f"""Given these classification types:
{classifications_context}

And these columns with example values:
{columns_context}

Return a JSON array of objects with this structure:
[{{"column_id": "string", "label": "string", "classification": "string"}}]

Where classification must be one of: {', '.join(ClassifierId.__members__.keys())}
Only return the JSON array, no other text."""

    def get_column_suggestions(self, columns: List[Dict[str, Any]]) -> str:
        """Get AI suggestions for column classifications"""
        response = self.client.chat.completions.create(
            model="openai/gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": self._create_classification_prompt(columns)}
            ],
            response_format={"type": "json_object"},
        )

        return response.choices[0].message.content
