import requests
from typing import List
from classes.course import Course
from classes.discussion import Discussion

OLLAMA_EMBED_ENDPOINT = "http://ollama:11434/api/embed"
OLLAMA_MODEL_PULL_ENDPOINT = "http://ollama:11434/api/pull"

"""
Embedder module for courses and queries

Relies on underlying Ollama API hosted via a docker container
"""

def embed_course_vector(course: Course) ->List[float]:
    """
    Return an embedded vectors a course based on relevant semantic fields
    """
    return get_embedding(course_to_string(course))


def course_to_string(course: Course) -> str:
    """
    Parses relevant fields from course object to a string for embedding
    """
    authors_string = ", ".join(course.authors)
    course_skills_string = ", ".join(course.skills)
    parts = [
        f"This educational course is named {course.name}",
        f"The authors of {course.name} are {authors_string} ",
        f"The skills to be learned in this course are {course_skills_string}",
    ]
    if course.description:
        parts.append(f"A description of this course is: {course.description}")
    
    return " ".join(parts)  

def embed_discussion_vector(discussion: Discussion) -> List[float]:
    """
    Return an embedded vector for a discussion based on relevant semantic fields
    
    Args:
        discussion (Discussion): The discussion object to embed
        
    Returns:
        List[float]: The embedding vector for the discussion
    """
    return get_embedding(discussion_to_string(discussion))

def discussion_to_string(discussion: Discussion) -> str:
    """
    Parses relevant fields from discussion object to a string for embedding
    
    Args:
        discussion (Discussion): The discussion object to parse
        
    Returns:
        str: A string representation of the discussion for embedding
    """
    parts = [
        f"Discussion titled: {discussion.title}",
        f"Discussion content: {discussion.description}"
    ]
    
    # If the discussion is associated with a course, include that information
    if discussion.course_id:
        parts.append(f"This discussion is related to a course with ID: {discussion.course_id}")
    
    return " ".join(parts)  

def get_embedding(query: str) -> List[float]:
    """
    Makes request to Ollama container API to get embedding for a query
    """
    # request to pull nomic-embed-text model
    # TODO: look into a better way to handle pulling (rather than pulling on each query)
    # model might be cached in volumes of ollama service - might be worth looking into later to confirm
    # can probably wrap in a singleton class that only pulls once on first call 
    pull_response = requests.post(OLLAMA_MODEL_PULL_ENDPOINT, json={"model": "nomic-embed-text"}) 
    pull_response.raise_for_status()
    response = requests.post(OLLAMA_EMBED_ENDPOINT, json={"model": "nomic-embed-text", "input": query})
    response.raise_for_status()
    return response.json()['embeddings'][0]