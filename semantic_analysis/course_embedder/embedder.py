from ollama import embed
from typing import List
from data_utils.course import Course

"""
Return a list of embedded vectors from each course based on relevant fields
"""
def embed_course_vectors(courses: List[Course]) -> List[List[float]]:
    embeddings: List[List[float]] = []
    num_courses = len(courses)
    for course in courses:
        course_str = course_to_string(course)
        response = embed(model='nomic-embed-text', input=course_str)
        embeddings.append(response['embeddings'][0])
        if len(embeddings) % 100 == 0:
            print(f"Embedded {len(embeddings)} / {num_courses} courses")
    print(f"Embedded {len(embeddings)} courses")
    return embeddings

"""
Parses relevant fields from course object to a string for embedding
"""
def course_to_string(course: Course) -> str:
    parts = [
        course.name,
        " ".join(course.authors),
        " ".join(course.skills),
        course.description or ""
    ]
    return " ".join(parts)    

def embed_query(query: str) -> List[float]:
    response = embed(model='nomic-embed-text', input=query)
    return response['embeddings'][0]