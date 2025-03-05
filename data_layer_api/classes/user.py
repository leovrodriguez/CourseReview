from dataclasses import dataclass

@dataclass
class User:
    """
    User dataclass defines the structure of a user object
    """
    username: str
    email: str