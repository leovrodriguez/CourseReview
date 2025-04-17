from dataclasses import dataclass
from uuid import UUID
from typing import Optional

@dataclass
class Discussion:
    """
    Discussion dataclass defines the structure of a discussion object.
    A discussion can be associated with either a course or a learning journey, but not both.
    """
    title: str
    description: str
    user_id: UUID