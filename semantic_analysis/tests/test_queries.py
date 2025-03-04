from data_utils.course import Course
from typing import List
from course_embedder.embedder import embed_course_vectors, get_embedding
from env import FORCE_EMBED
import requests
from dataclasses import asdict
import json


example_queries = [
        "Python programming",
        "data science",
        "machine learning",
        "web development",
        "AI courses",
        "cloud computing",
        "cybersecurity",
        "JavaScript",
        "SQL databases",
        "mobile app development",
        "blockchain technology",
        "C++ programming",
        "big data",
        "natural language processing",
        "DevOps practices"
    ]

DATA_LAYER_API = "http://data_layer_api:5000"
DATA_LAYER_API_COURSE_INSERTION = f"{DATA_LAYER_API}/course/insert"
DATA_LAYER_API_COURSE_CLEAR = f"{DATA_LAYER_API}/course/clear"
DATA_LAYER_API_QUERY_COURSE = f"{DATA_LAYER_API}/course/query"

def test_queries(courses: List[Course], queries: List[str] = example_queries):
    
    # Embed courses and store them in vector_db
    if FORCE_EMBED: 
        print("Forcing re-embedding of courses in data directory")
        clear_request_result = requests.post(DATA_LAYER_API_COURSE_CLEAR)
        clear_request_result.raise_for_status()
        embedded_course_vectors: List[List[float]] = embed_course_vectors(courses)
        for course,course_vector in zip(courses,embedded_course_vectors):
            payload = {"course": asdict(course), "course_vector": course_vector}
            insert_request_result = requests.post(DATA_LAYER_API_COURSE_INSERTION, json = payload)
            insert_request_result.raise_for_status()
            print("Sucessfully uploaded course via data layer API")

    
    #Embed queries and query vector_db
    embedded_queries = [get_embedding(query) for query in queries]
    for query, query_vector in zip(queries, embedded_queries):
        query_post_result = requests.post(DATA_LAYER_API_QUERY_COURSE, json = {"query_vector": query_vector, "limit": 3})
        query_post_result.raise_for_status()
        similar_courses = query_post_result.json().get("courses", [])
        if not similar_courses:
            print(f"Query: {query}")
            print("No similar courses found.\n")
        else:
            print(f"Query: {query}")
            print(f"Top 3 similar courses: \n")
            for course in similar_courses: 
                print(f"{json.dumps(course, indent=2)}\n")
            print("\n")
