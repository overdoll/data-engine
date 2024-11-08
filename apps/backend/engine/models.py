from enum import Enum
from typing import TypedDict, List, Optional, Dict, Any

# Create your models here.


class Classification(Enum):
    FIRST_NAME = "first_name"
    LAST_NAME = "last_name"
    # Add other classifications as needed

    @classmethod
    def choices(cls):
        return [(item.value, item.name) for item in cls]


class Metadata(TypedDict):
    storageEngine: str
    originalFilename: str


class ColumnDef(TypedDict):
    id: str
    label: str
    classification: Optional[str]
    data: List[Any]


# Types for API responses
class Column(TypedDict):
    id: str
    label: str
    classification: Optional[str]


class Row(TypedDict):
    id: str
    data: Dict[str, str]  # columnId -> value mapping
