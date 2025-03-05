from enum import Enum
from typing import List, Optional
from dataclasses import dataclass

class CourseWebsite(str, Enum):
    """
    CourseWebsite enum defines the platforms that we are retrieving data from
    """
    COURSERA = "COURSERA",
    UDEMY = "UDEMY"


@dataclass
class Course:
    """
    Course dataclass defines the structure of a course object
    """
    original_website: CourseWebsite
    name: str
    authors: List[str]
    description: Optional[str]
    skills: List[str]
    rating: float
    num_ratings: int
    image_url: str
    is_free: bool
    url: str