from enum import StrEnum
import uuid
from typing import List, Optional
from nameparser import HumanName
from .base import (
    BaseOperation,
    BaseClassifier,
    ColumnNotFoundError,
    InvalidClassificationError,
    InvalidActionError,
)
from .types import ColumnDef
import phonenumbers


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
        self.column_id = str(uuid.uuid4())
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
        self.classifier = get_classifier(classification)
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
        additional_ops = self.classifier.get_operations(self.column_id, target_column)

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
    @property
    def id(self) -> str:
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

    def get_operations(self, column_id: str, column: ColumnDef) -> List[BaseOperation]:
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
            RemoveColumnOperation(column_id),
        ]


class FirstNameClassifier(BaseClassifier):
    @property
    def id(self) -> str:
        return ClassifierId.FIRST_NAME.value

    @property
    def situation(self) -> str:
        return "Is a first name of a person"

    def transform(self, value: str) -> str:
        return value.strip().title()


class LastNameClassifier(BaseClassifier):
    @property
    def id(self) -> str:
        return ClassifierId.LAST_NAME.value

    @property
    def situation(self) -> str:
        return "Is a last name of a person"

    def transform(self, value: str) -> str:
        return value.strip().title()


class EmailClassifier(BaseClassifier):
    @property
    def id(self) -> str:
        return ClassifierId.EMAIL.value

    @property
    def situation(self) -> str:
        return "Is a valid email address, usually containing an '@' symbol"

    def transform(self, value: str) -> str:
        """Clean and standardize email addresses"""
        return value.strip().lower()


class PhoneClassifier(BaseClassifier):
    @property
    def id(self) -> str:
        return ClassifierId.PHONE.value

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

CLASSIFIERS = {classifier().id: classifier() for classifier in ALL_CLASSIFIERS}


def get_classifier(classifier_id: str) -> Optional[BaseClassifier]:
    """Get a classifier by its ID"""
    return CLASSIFIERS.get(classifier_id)
