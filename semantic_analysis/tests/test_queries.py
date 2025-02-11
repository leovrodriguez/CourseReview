from data_utils.course import Course
from typing import List
from course_embedder.embedder import embed_course_vectors, get_embedding
from database.vector_db import VectorDB
from env import FORCE_EMBED


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


def test_queries(courses: List[Course], vector_db: VectorDB, queries: List[str] = example_queries):
    
    # Embed courses and store them in vector_db
    if FORCE_EMBED: 
        print("Forcing re-embedding of courses in data directory")
        vector_db.clear()
        embedded_course_vectors: List[List[float]] = embed_course_vectors(courses)
        for i, course_vector in enumerate(embedded_course_vectors):
            vector_db.insert_vector(i, course_vector)
    
    # Embed queries and query vector_db
    embedded_queries = [get_embedding(query) for query in queries]
    for query, query_vector in zip(queries, embedded_queries):
        results = vector_db.query_vector(query_vector)
        if not results:
            print(f"Query: {query}")
            print("No similar courses found.\n")
        else:
            print(f"Query: {query}")
            print(f"Top 3 similar courses: \n")
            for course in [courses[result[0]] for result in results]: 
                print(f"{course}\n")
            print("\n")

    vector_db.close()