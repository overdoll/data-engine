from abc import ABC, abstractmethod
from typing import List, Optional, Any
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
    @property
    @abstractmethod
    def id(self) -> str:
        pass

    @property
    @abstractmethod
    def situation(self) -> str:
        pass

    @property
    def splink_comparator(self) -> Optional[Any]:
        return None

    @abstractmethod
    def transform(self, value: str) -> str:
        pass

    def transform_values(self, values: List[str]) -> List[str]:
        return [self.transform(val) for val in values]

    def get_operations(self, column_id: str, column: ColumnDef) -> List[BaseOperation]:
        """Get additional operations to perform when classifying"""
        return []
