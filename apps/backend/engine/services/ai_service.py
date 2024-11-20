from typing import List, Dict
from openai import OpenAI
from .column_processor import CLASSIFIERS, ClassifierId, get_classifier, DatasetType
from .types import ColumnDef
from django.conf import settings
from pydantic import BaseModel
from uuid import uuid4
import tiktoken


class DatasetTypeResponse(BaseModel):
    dataset_type: DatasetType


class ColumnClassification(BaseModel):
    column_id: str
    classification: ClassifierId


class ClassificationResponse(BaseModel):
    classifications: List[ColumnClassification]


class TokenLimitExceededError(Exception):
    """Raised when a request would exceed the token limit"""

    def __init__(self, token_count: int, limit: int):
        self.token_count = token_count
        self.limit = limit
        super().__init__(f"Token limit exceeded: {token_count} tokens (limit: {limit})")


class TransformationMapping(BaseModel):
    original: str
    transformed: str


class TransformationResponse(BaseModel):
    transformations: List[TransformationMapping]


class AIService:
    def __init__(self):
        self.model = "openai/gpt-4o"
        self.tokenizer_encoding = "o200k_base"  # Base model name for tokenizer
        self.token_limit = 10000  # Add token limit as class attribute
        self.column_sample_size = 10

        self.client = OpenAI(
            base_url=settings.AI_BASE_URL,
            api_key=settings.AI_API_KEY,
        )

        # Initialize tokenizer
        self.encoding = tiktoken.get_encoding(self.tokenizer_encoding)

    def _count_sample_tokens(self, sample: List[str]) -> int:
        """Count tokens in a sample of column values"""
        return sum(len(self.encoding.encode(val)) for val in sample)

    def _count_tokens(self, messages: List[Dict[str, str]]) -> int:
        """Count the number of tokens in the messages"""
        num_tokens = 0
        for message in messages:
            num_tokens += (
                4  # Every message follows <im_start>{role/name}\n{content}<im_end>\n
            )
            for key, value in message.items():
                if isinstance(value, str):
                    num_tokens += self._count_sample_tokens([value])
                if key == "name":  # If there's a name, the role is omitted
                    num_tokens += -1  # Role is always required and always 1 token
        num_tokens += 2  # Every reply is primed with <im_start>assistant
        return num_tokens

    def _get_column_sample(self, column: ColumnDef, max_tokens: int = 100) -> List[str]:
        """Get first x non-null values from column, limiting by token count"""
        non_empty_values = [val for val in column["data"] if val and val.strip()]
        if len(non_empty_values) == 0:
            return []

        # First try with requested sample size
        initial_sample = non_empty_values[: self.column_sample_size]
        token_count = self._count_sample_tokens(initial_sample)

        if token_count <= max_tokens:
            return initial_sample

        # If too many tokens, reduce sample size
        for size in range(self.column_sample_size - 1, 0, -1):
            reduced_sample = non_empty_values[:size]
            if self._count_sample_tokens(reduced_sample) <= max_tokens:
                return reduced_sample

        # If even one sample is too large, skip the column
        return []

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
                valid_columns.append((col["id"], col["label"], sample))

        return valid_columns

    def _get_column_context(self, columns: List[ColumnDef]) -> str:
        """Get context for columns for AI"""
        sample_columns = self._get_valid_columns(columns)

        return "\n".join(
            [
                f"Column: '{id}' (labelled as '{label}') Sample Content: Sample Data: {', '.join(sample)}"
                for id, label, sample in sample_columns
            ]
        )

    def _get_classifier_context(self, dataset_type: DatasetType) -> str:
        """Get context for classifiers for AI"""
        return "\n".join(
            [
                f"- {c_id}: {classifier.situation}"
                for c_id, classifier in CLASSIFIERS.items()
                if dataset_type in classifier.allowed_dataset_types
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
            classifier = get_classifier(suggestion.classification, suggestion.column_id)
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
        self, columns: List[ColumnDef], dataset_type: DatasetType
    ) -> List[ColumnClassification]:
        """Get AI suggestions for column classifications"""
        classifiers_context = self._get_classifier_context(dataset_type)
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

        token_count = self._count_tokens(messages)
        print(f"Token count for request: {token_count}")

        if token_count > self.token_limit:
            print(f"Context: {messages}")
            raise TokenLimitExceededError(token_count, self.token_limit)

        response = self.client.beta.chat.completions.parse(
            model=self.model,
            messages=messages,
            response_format=ClassificationResponse,
        )

        raw_suggestions = response.choices[0].message.parsed.classifications
        return self._validate_suggestions(raw_suggestions, columns)

    def generate_column_transformation(
        self, column: ColumnDef, prompt: str, max_unique_values: int = 100
    ) -> Dict:
        """
        Generate transformation suggestions for column values based on user prompt

        Args:
            column: Column to transform
            prompt: User's transformation request
            max_unique_values: Maximum number of unique values to process

        Returns:
            Dictionary containing column_id and transformations mapping
        """
        # Get unique values for the column
        unique_values = set(
            val.strip() for val in column["data"] if val and val.strip()
        )
        if len(unique_values) > max_unique_values:
            raise ValueError(
                f"Column has too many unique values ({len(unique_values)}). "
                f"Maximum allowed is {max_unique_values}"
            )

        # Build context string
        column_context = f"Unique Values: {', '.join(unique_values)}"

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a data transformation assistant. For each unique value in the column, "
                    "you will suggest a transformed value based on the user's request. "
                    "Respond with a mapping of original values to transformed values. "
                    "Only transform values if they match the user's requirements. "
                    "If a value should not be transformed, still include it in the response."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Transform these values according to this request: {prompt}\n\n"
                    f"Here are the unique values:\n{column_context}"
                ),
            },
        ]

        token_count = self._count_tokens(messages)
        print(f"Token count for transformation request: {token_count}")

        if token_count > self.token_limit:
            raise TokenLimitExceededError(token_count, self.token_limit)

        response = self.client.beta.chat.completions.parse(
            model=self.model,
            messages=messages,
            response_format=TransformationResponse,
        )

        # Get the first (and only) mapping from response
        mappings = response.choices[0].message.parsed.transformations

        # Validate transformations
        valid_transformations = {
            mapping.original: mapping.transformed
            for mapping in mappings
            if mapping.original in unique_values
        }

        return valid_transformations

    def detect_dataset_type(self, columns: List[ColumnDef]) -> DatasetTypeResponse:
        """Detect the type of dataset based on column contents"""
        columns_context = self._get_column_context(columns)

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a data classifier that analyzes CSV contents to determine the type of dataset. "
                    "Available dataset types are:\n"
                    "- PERSON: Contains personal/individual information like names, emails, addresses\n"
                    "- COMPANY: Contains business/organizational data like company names, revenue, employees\n"
                    "\nAnalyze the column contents and determine if this is PERSON or COMPANY data."
                ),
            },
            {
                "role": "user",
                "content": f"Analyze these columns and determine the dataset type:\n{columns_context}",
            },
        ]

        token_count = self._count_tokens(messages)
        if token_count > self.token_limit:
            raise TokenLimitExceededError(token_count, self.token_limit)

        response = self.client.beta.chat.completions.parse(
            model="openai/gpt-4o-mini",  # so it is fast
            messages=messages,
            response_format=DatasetTypeResponse,
        )

        return response.choices[0].message.parsed
