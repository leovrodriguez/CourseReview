from dataclasses import dataclass
from uuid import UUID
from enum import Enum

class LikeObjectType(str, Enum):
    COURSE = "course"
    LEARNING_JOURNEY = "learning_journey"
    DISCUSSION = "discussion"
    REPLY = "reply"

@dataclass
class Like:
    """
    Like dataclass defines the structure of a like object.
    A like associates a user with a specific object (course, learning journey, discussion, or reply).
    """
    user_id: UUID
    object_id: UUID
    object_type: LikeObjectType