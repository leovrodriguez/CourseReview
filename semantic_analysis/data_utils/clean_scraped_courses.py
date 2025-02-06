from .course import Course
from .course import CourseWebsite
from .course import COURSERA_DIR
from typing import List
import json
import os

"""
Return a list of normalized courses from raw scraped data
"""
def normalized_courses() -> List[Course]:
    
    courses: List[Course] = []

    for filename in os.listdir(COURSERA_DIR):
        print(f"Reading coursera file: {filename}")
        if filename.endswith('.json'):
            path = os.path.join(COURSERA_DIR, filename)
            with open(path) as file:
                raw_data = json.load(file)
                courses.extend(parse_coursera_courses(raw_data, CourseWebsite.COURSERA))

    print(f"Found {len(courses)} total courses")
    return courses

#TODO: Add udemy course logic 

def parse_coursera_courses(raw_data, course_website: CourseWebsite) -> List[Course]:
    courses: List[Course] = []
    elements = raw_data[0].get("data", {}).get("SearchResult", {}).get("search", [])[0].get("elements", [])
    if (len(elements) == 0): 
        print("No coursera courses found")
    else:
        print(f"Found {len(elements)} coursera courses")
    for element in elements:
        name = element.get("name")
        authors = element.get("partners", [])
        skills = element.get("skills", [])
        rating = element.get("avgProductRating", 0.0)
        num_ratings = element.get("numProductRatings", 0)
        image_url = element.get("imageUrl", "")
        is_free = element.get("isCourseFree", False)
        url = element.get("url", "")

        course = Course(
            original_website=course_website,
            name=name,
            authors=authors,
            description=None,
            skills=skills,
            rating=rating,
            num_ratings=num_ratings,
            image_url=image_url,
            is_free=is_free,
            url=url
        )
        courses.append(course)
    
    return courses