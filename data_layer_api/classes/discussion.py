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
    # Either course_id or learning_journey_id must be provided, but not both
    course_id: Optional[UUID] = None
    learning_journey_id: Optional[UUID] = None