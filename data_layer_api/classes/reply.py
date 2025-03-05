from dataclasses import dataclass
from uuid import UUID

@dataclass
class Reply:
    """
    Reply dataclass defines the structure of a reply object.
    A reply is associated with a specific discussion and user.
    """
    user_id: UUID
    discussion_id: UUID
    text: str