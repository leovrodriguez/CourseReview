from enum import Enum
from typing import List, Optional
from dataclasses import dataclass
from uuid import UUID

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

    @staticmethod
    def dict_to_course(course_dict: dict) -> 'Course':
        """
        Convert a dictionary representation of a course back to a Course object.
        
        Args:
            course_dict (dict): Dictionary containing course data
            
        Returns:
            Course: The converted Course object
        """
        # Handle the CourseWebsite enum conversion
        # The original_website might be stored in different formats depending on how it was serialized
        original_website = course_dict.get('original_website')
        
        # If it's a string, convert it to the enum
        if isinstance(original_website, str):
            # Handle case where it might be stored as 'COURSERA' or as '('COURSERA',)'
            clean_website = original_website.strip("(),'")
            if clean_website in [e.name for e in CourseWebsite]:
                original_website = CourseWebsite[clean_website]
            else:
                # Try lowercase version
                for enum_val in CourseWebsite:
                    if enum_val.value[0].lower() == clean_website.lower():
                        original_website = enum_val
                        break
        
        # If it's a tuple or list (from the enum value), get the first element
        elif isinstance(original_website, (tuple, list)) and len(original_website) > 0:
            website_str = original_website[0]
            for enum_val in CourseWebsite:
                if enum_val.value[0] == website_str:
                    original_website = enum_val
                    break
        
        # Extract other fields with appropriate type conversions and defaults
        return Course(
            original_website=original_website,
            name=course_dict.get('name', course_dict.get('title', '')),  # Handle potential field name differences
            authors=course_dict.get('authors', []),
            description=course_dict.get('description', None),
            skills=course_dict.get('skills', []),
            rating=float(course_dict.get('rating', 0.0)),
            num_ratings=int(course_dict.get('num_ratings', 0)),
            image_url=course_dict.get('image_url', ''),
            is_free=bool(course_dict.get('is_free', False)),
            url=course_dict.get('url', '')
        )
    
@dataclass
class CourseReview:
    user_id: UUID
    course_id: UUID
    rating: int
    description: Optional[str] = None