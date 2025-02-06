from data_utils.save_raw_data import write_raw_data
from data_utils.course import Course
from data_utils.clean_scraped_courses import normalized_courses
from typing import List
from course_embedder.embedder import embed_course_vectors, embed_query
import chromadb

if __name__ == "__main__":
    
    #Stores raw in respective path e.g data/{course_website}/
    write_raw_data()
    print("Finished writing raw data")
    courses: List[Course] = normalized_courses()
    print(f"Finished normalizing {len(courses)} courses")
    embedded_course_vectors: List[List[float]] = embed_course_vectors(courses)
    print(f"Finished embedding {len(embedded_course_vectors)} courses")

    # Test some queries
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

    #  Using chromadb as a placeholder for vector storage and retrieval
    client = chromadb.Client()
    collection = client.get_or_create_collection(name = "courses")

    # Store the course indexes in the collection
    for i, course_vector in enumerate(embedded_course_vectors):
        collection.add(ids=[str(i)], embeddings=course_vector,documents=[str(i)])

    # Run query and print course result
    for query, query_vector in zip(queries, embedded_queries):
        result = collection.query(query_embeddings=query_vector, n_results=1)
        documents = result.get('documents', [[]])
        if documents == None:
            print(f"Query: {query}")
            print("No similar courses found.\n")        
        else:
            course_index = int(documents[0][0])
            most_similar_course = courses[course_index]
            print(f"Query: {query}")
            print(f"Most similar course: {most_similar_course}\n")
      