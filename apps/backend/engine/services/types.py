from typing import TypedDict, Optional, Dict, List, Any


class Metadata(TypedDict):
    storageEngine: str
    originalFilename: str


class ColumnDef(TypedDict):
    id: str
    label: str
    classification: Optional[str]
    data: List[Any]


class Column(TypedDict):
    id: str
    label: str
    classification: Optional[str]


class Row(TypedDict):
    id: str
    data: Dict[str, str]
