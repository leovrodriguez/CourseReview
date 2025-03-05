from dataclasses import dataclass
from uuid import UUID

@dataclass
class LearningJourney:
    """
    LearningJourney dataclass defines the structure of a learning journey object
    """
    title: str
    description: str
    user_id: UUID

@dataclass
class LearningJourneyCourse:
    """
    LearningJourneyCourse dataclass defines the structure of a learning journey course mapping
    """
    learning_journey_id: str
    course_id: UUID
    course_order: int