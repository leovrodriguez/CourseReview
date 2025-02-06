from enum import Enum
from typing import List, Optional
from dataclasses import dataclass
import os
"""
CourseWebsite enum defines the platforms that we are retrieving data from
"""
class CourseWebsite(Enum):
    COURSERA = 1
    UDEMY =2

@dataclass
class Course:
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

COURSERA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/coursera"))
UDEMY_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/udemy"))