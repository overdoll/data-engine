from abc import ABC, abstractmethod
from typing import List, Optional, Union
import splink.comparison_library as cl
from .types import ColumnDef


class OperationError(Exception):
    """Base exception for operation errors"""

    pass


class ColumnNotFoundError(OperationError):
    """Raised when a column is not found"""

    pass


class InvalidActionError(OperationError):
    """Raised when an invalid action is specified"""

    pass


class InvalidClassificationError(OperationError):
    """Raised when an invalid classification is specified"""

    pass


class BaseOperation(ABC):
    @abstractmethod
    def apply(self, columns: List[ColumnDef]) -> List[ColumnDef]:
        pass


class BaseClassifier(ABC):
    def __init__(self, column_id: str | None = None):
        self.column_id = column_id

    @classmethod
    @abstractmethod
    def id(cls) -> str:
        pass

    @property
    @abstractmethod
    def situation(self) -> str:
        "Tell the AI how to handle this column"
        pass

    @property
    def splink_comparator(
        self,
    ) -> Optional[Union[cl.NameComparison, cl.EmailComparison, cl.ExactMatch]]:
        """Define how Splink should compare values for this type"""
        return None

    @abstractmethod
    def transform(self, value: str) -> str:
        pass

    def transform_values(self, values: List[str]) -> List[str]:
        return [self.transform(val) if val else val for val in values]

    def get_operations(self, column: ColumnDef) -> List[BaseOperation]:
        """Get additional operations to perform when classifying"""
        return []

    @property
    def description(self) -> str:
        """Return a description of what this classifier does"""
        return ""

    @classmethod
    def standardize_name(cls, value: str) -> str:
        """Standardize a name by removing special characters and proper casing"""
        cleaned = "".join(char for char in value if char.isalnum() or char.isspace())
        return cleaned.strip().title()
