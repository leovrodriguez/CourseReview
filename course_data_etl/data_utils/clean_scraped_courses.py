from .course import Course
from .course import CourseWebsite
from .course import COURSERA_DIR, UDEMY_DIR
from typing import List
import json
import os

"""
Core normalization logic for scraped courses

Here is where we will parse the raw scraped data into a list of Course objects
"""

def normalized_courses() -> List[Course]:
    """
    Return a list of normalized courses from raw scraped data stored in data/ directory

    """

    courses: List[Course] = []

    # parse coursera courses
    for filename in os.listdir(COURSERA_DIR):
        print(f"Reading coursera file: {filename}")
        if filename.endswith('.json'):
            path = os.path.join(COURSERA_DIR, filename)
            with open(path) as file:
                raw_data = json.load(file)
                courses.extend(parse_coursera_courses(raw_data, CourseWebsite.COURSERA))
    
    # then parse udemy courses
    for filename in os.listdir(UDEMY_DIR):
        print(f"Reading udemy file: {filename}")
        if filename.endswith('.json'):
            path = os.path.join(UDEMY_DIR, filename)
            with open(path) as file:
                raw_data = json.load(file)
                courses.extend(parse_udemy_courses(raw_data, CourseWebsite.UDEMY))

    print(f"Normalized {len(courses)} total courses from raw json format")
    return courses

def parse_udemy_courses(raw_data, course_website: CourseWebsite) -> List[Course]:
    """
    Parse raw coursera data into a list of Course objects
    """
    courses: List[Course] = []
    
    raw_courses = raw_data

    if not raw_courses:
        print("No udemy courses found")

    for course in raw_courses:
        name = course.get("title", "N/A")
        authors = [instructor["display_name"] for instructor in course.get("visible_instructors", [])]
        description = course.get("headline", "No description available")
        skills = course.get("objectives_summary", [])
        rating = course.get("rating", 0.0)
        num_ratings = course.get("num_reviews", 0)
        image_url = course.get("image_480x270", "")
        is_free = not course.get("is_paid", False)
        url = "https://www.udemy.com" + course.get("url", "")

        course = Course(
            original_website=course_website,
            name=name,
            authors=authors,
            description=description,
            skills=skills,
            rating=rating,
            num_ratings=num_ratings,
            image_url=image_url,
            is_free=is_free,
            url=url
        )
        courses.append(course)
    return courses

def parse_coursera_courses(raw_data, course_website: CourseWebsite) -> List[Course]:
    """
    Parse raw coursera data into a list of Course objects
    """
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