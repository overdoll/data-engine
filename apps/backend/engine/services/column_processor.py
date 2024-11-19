from enum import StrEnum
from typing import List, Optional
from nameparser import HumanName
from .base import (
    BaseOperation,
    BaseClassifier,
    ColumnNotFoundError,
    InvalidClassificationError,
    InvalidActionError,
)
from .csv_service import CSVService
from .types import ColumnDef
import phonenumbers
import splink.comparison_library as cl


class ClassifierId(StrEnum):
    NAME = "name"
    FIRST_NAME = "first_name"
    LAST_NAME = "last_name"
    EMAIL = "email"
    PHONE = "phone"


class RemoveColumnOperation(BaseOperation):
    def __init__(self, column_id: str):
        self.column_id = column_id

    def apply(self, columns: List[ColumnDef]) -> List[ColumnDef]:
        result = [col for col in columns if col["id"] != self.column_id]
        if len(result) == len(columns):
            raise ColumnNotFoundError(f"Column not found: {self.column_id}")
        return result


class AddColumnOperation(BaseOperation):
    def __init__(self, label: str, data: List[str], classification: str | None = None):
        self.column_id = CSVService.generate_column_id(label)
        self.label = label
        self.data = data
        self.classification = classification

    def apply(self, columns: List[ColumnDef]) -> List[ColumnDef]:
        columns.append(
            {
                "id": self.column_id,
                "label": self.label,
                "classification": self.classification,
                "data": self.data,
            }
        )
        return columns


class ClassifyColumnOperation(BaseOperation):
    def __init__(self, column_id: str, classification: str):
        self.column_id = column_id
        self.classification = classification
        self.classifier = get_classifier(classification, column_id)
        if not self.classifier:
            raise InvalidClassificationError(
                f"Invalid classification: {classification}"
            )

    def apply(self, columns: List[ColumnDef]) -> List[ColumnDef]:
        target_column = next(
            (col for col in columns if col["id"] == self.column_id), None
        )
        if not target_column:
            raise ColumnNotFoundError(f"Column not found: {self.column_id}")

        # Get additional operations from classifier
        additional_ops = self.classifier.get_operations(target_column)

        # Apply classifier's transform if no additional operations
        if not additional_ops:
            target_column["classification"] = self.classification
            target_column["data"] = self.classifier.transform_values(
                target_column["data"]
            )
            return columns

        # Apply additional operations
        result = columns
        for op in additional_ops:
            result = op.apply(result)

        return result


class NameClassifier(BaseClassifier):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    @classmethod
    def id(cls) -> str:
        return ClassifierId.NAME.value

    @property
    def situation(self) -> str:
        return "Is a full name of a person. For example - Albert Einstein. URLs are not names."

    def transform(self, value: str) -> str:
        return value

    def parse_name(self, value: str) -> tuple[str, str]:
        """Parse a name into first and last components"""
        name = HumanName(value.strip())
        return (
            name.first.title() if name.first else "",
            name.last.title() if name.last else "",
        )

    def get_operations(self, column: ColumnDef) -> List[BaseOperation]:
        """Split name column into first and last name columns"""
        first_names = []
        last_names = []
        column_data = column["data"]

        for value in column_data:
            first, last = self.parse_name(value)
            first_names.append(first)
            last_names.append(last)

        return [
            AddColumnOperation(
                "First Name",
                first_names,
                ClassifierId.FIRST_NAME.value,
            ),
            AddColumnOperation("Last Name", last_names, ClassifierId.LAST_NAME.value),
            RemoveColumnOperation(self.column_id),
        ]

    @property
    def description(self) -> str:
        return "Splits full names into separate first and last name columns"


class FirstNameClassifier(BaseClassifier):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    @classmethod
    def id(cls) -> str:
        return ClassifierId.FIRST_NAME.value

    @property
    def splink_comparator(self) -> cl.NameComparison:
        return cl.NameComparison(self.column_id)

    @property
    def situation(self) -> str:
        return "Is a first name of a person"

    def transform(self, value: str) -> str:
        return self.standardize_name(value.strip().title())

    @property
    def description(self) -> str:
        return "Standardizes first names by trimming whitespace and proper casing"


class LastNameClassifier(BaseClassifier):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    @classmethod
    def id(cls) -> str:
        return ClassifierId.LAST_NAME.value

    @property
    def splink_comparator(self) -> cl.NameComparison:
        return cl.NameComparison(self.column_id)

    @property
    def situation(self) -> str:
        return "Is a last name of a person"

    def transform(self, value: str) -> str:
        return self.standardize_name(value.strip().title())

    @property
    def description(self) -> str:
        return "Standardizes last names by trimming whitespace and proper casing"


class EmailClassifier(BaseClassifier):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    @classmethod
    def id(cls) -> str:
        return ClassifierId.EMAIL.value

    @property
    def splink_comparator(self) -> cl.EmailComparison:
        return cl.EmailComparison(self.column_id)

    @property
    def situation(self) -> str:
        return "Is a valid email address, usually containing an '@' symbol"

    def transform(self, value: str) -> str:
        """Clean and standardize email addresses"""
        return value.strip().lower()

    @property
    def description(self) -> str:
        return "Standardizes email addresses by converting to lowercase and trimming whitespace"


class PhoneClassifier(BaseClassifier):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    @classmethod
    def id(cls) -> str:
        return ClassifierId.PHONE.value

    @property
    def splink_comparator(self) -> cl.ExactMatch:
        return cl.ExactMatch(self.column_id).configure(term_frequency_adjustments=True)

    @property
    def situation(self) -> str:
        return "Is a mobile, landline, or other phone number"

    def transform(self, value: str) -> str:
        """Clean and standardize phone numbers"""
        try:
            # Parse phone number (assume US if no country code provided)
            parsed = phonenumbers.parse(value, None)
            if phonenumbers.is_valid_number(parsed):
                # Format in E.164 format (+12345678900)
                return phonenumbers.format_number(
                    parsed, phonenumbers.PhoneNumberFormat.E164
                )
        except phonenumbers.NumberParseException:
            pass

        # Fallback to original value if parsing fails
        return value.strip()

    @property
    def description(self) -> str:
        return "Formats phone numbers into standardized E.164 format (+12345678900)"


class ColumnOperationService:
    def create_operation(self, action: str, **kwargs) -> BaseOperation:
        if action == "remove_column":
            return RemoveColumnOperation(kwargs["column_id"])
        elif action == "classify_column":
            return ClassifyColumnOperation(
                kwargs["column_id"], kwargs["classification"]
            )
        else:
            raise InvalidActionError(f"Invalid action: {action}")

    def apply_operations(
        self, columns: List[ColumnDef], operations: List[BaseOperation]
    ) -> List[ColumnDef]:
        result = columns
        for operation in operations:
            result = operation.apply(result)
        return result


ALL_CLASSIFIERS = (
    NameClassifier,
    FirstNameClassifier,
    LastNameClassifier,
    EmailClassifier,
    PhoneClassifier,
)

CLASSIFIERS = {classifier.id(): classifier for classifier in ALL_CLASSIFIERS}


def get_classifier(classifier_id: str, column_id: str) -> Optional[BaseClassifier]:
    """Get a classifier by its ID"""
    classifier_class = CLASSIFIERS.get(classifier_id)
    if classifier_class:
        return classifier_class(column_id=column_id)
    return None
