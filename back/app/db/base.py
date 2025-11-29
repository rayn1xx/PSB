from __future__ import annotations

import uuid
from datetime import datetime, date
from typing import List, Optional

from sqlalchemy import (
    String,
    Integer,
    Date,
    DECIMAL,
    TIMESTAMP,
    ForeignKey,
    func,
    DateTime,
    types
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship
)

class Base(DeclarativeBase):
    pass
