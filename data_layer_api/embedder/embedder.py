import requests
from typing import List
from classes.course import Course

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
    parts = [
        course.name,
        " ".join(course.authors),
        " ".join(course.skills),
        course.description or ""
    ]
    return " ".join(parts)    


OLLAMA_EMBED_ENDPOINT = "http://ollama:11434/api/embed"
OLLAMA_MODEL_PULL_ENDPOINT = "http://ollama:11434/api/pull"

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