from abc import ABC, abstractmethod
from typing import Optional, Any, List
from enum import Enum
import re


class ClassifierId(Enum):
    FIRST_NAME = "first_name"
    LAST_NAME = "last_name"
    EMAIL = "email"
    PHONE = "phone"
    DATE = "date"


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


class NameClassifier(BaseClassifier):
    def transform(self, value: str) -> str:
        """Clean and standardize name values"""
        return " ".join(value.strip().split()).title()


class FirstNameClassifier(NameClassifier):
    @property
    def id(self) -> str:
        return ClassifierId.FIRST_NAME.value

    @property
    def situation(self) -> str:
        return "Column contains individual's first names"


class LastNameClassifier(NameClassifier):
    @property
    def id(self) -> str:
        return ClassifierId.LAST_NAME.value

    @property
    def situation(self) -> str:
        return "Column contains individual's last names"


class EmailClassifier(BaseClassifier):
    @property
    def id(self) -> str:
        return ClassifierId.EMAIL.value

    @property
    def situation(self) -> str:
        return "Column contains email addresses"

    def transform(self, value: str) -> str:
        """Clean and standardize email addresses"""
        return value.strip().lower()


class PhoneClassifier(BaseClassifier):
    @property
    def id(self) -> str:
        return ClassifierId.PHONE.value

    @property
    def situation(self) -> str:
        return "Column contains phone numbers"

    def transform(self, value: str) -> str:
        """Clean and standardize phone numbers"""
        digits = re.sub(r"\D", "", value)
        if len(digits) >= 10:
            return digits[-10:]  # Keep last 10 digits
        return digits


class DateClassifier(BaseClassifier):
    @property
    def id(self) -> str:
        return ClassifierId.DATE.value

    @property
    def situation(self) -> str:
        return "Column contains date values"

    def transform(self, value: str) -> str:
        """Clean and standardize dates"""
        return value.strip()


ALL_CLASSIFIERS = (
    FirstNameClassifier,
    LastNameClassifier,
    EmailClassifier,
    PhoneClassifier,
    DateClassifier,
)

CLASSIFIERS = {classifier().id: classifier() for classifier in ALL_CLASSIFIERS}


def get_classifier(classifier_id: str) -> Optional[BaseClassifier]:
    """Get a classifier by its ID"""
    return CLASSIFIERS.get(classifier_id)


def transform_values(values: List[str], classifier_id: str) -> List[str]:
    """Transform a list of values using the specified classifier"""
    classifier = get_classifier(classifier_id)
    if not classifier:
        return values

    return classifier.transform_values(values)
