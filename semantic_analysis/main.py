from data_utils.save_raw_data import write_raw_data
from data_utils.course import Course
from data_utils.clean_scraped_courses import normalized_courses
from typing import List
from course_embedder.embedder import embed_course_vectors, embed_query
from database.db_factory import get_vector_db
from env import FORCE_EMBED

if __name__ == "__main__":
    
    write_raw_data() 
    courses: List[Course] = normalized_courses()

    vector_db = get_vector_db()
    if FORCE_EMBED: 
        print("Forcing re-embedding of courses")
        vector_db.clear()
        embedded_course_vectors: List[List[float]] = embed_course_vectors(courses[:10])
        for i, course_vector in enumerate(embedded_course_vectors):
            vector_db.insert_vector(i, course_vector)
    queries = [
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
    embedded_queries = [embed_query(query) for query in queries]

    for query, query_vector in zip(queries, embedded_queries):
        results = vector_db.query_vector(query_vector)
        if not results:
            print(f"Query: {query}")
            print("No similar courses found.\n")
        else:
            most_similar_courses = [courses[result[0]] for result in results]
            print(f"Query: {query}")
            print(f"Top 3 similar course: {most_similar_courses}\n")

    vector_db.close()