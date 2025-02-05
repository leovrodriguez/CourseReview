from enum import Enum
from typing import List, Optional
from dataclasses import dataclass
"""
CourseWebsite enum defines the types of platforms that we are cleanin data from

Since the parsed data from each website can come in different platforms, we need to strictly define the website data we are cleaning
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