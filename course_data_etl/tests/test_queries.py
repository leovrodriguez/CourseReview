from data_utils.course import Course
from env import FORCE_INSERT, FORCE_PARSE
from dataclasses import asdict
from data_utils.save_raw_data import write_raw_data
from data_utils.clean_scraped_courses import normalized_courses
import requests
from typing import List
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

def test_queries(queries: List[str] = example_queries):

    if not FORCE_PARSE:
        print("Not making API call and parsing raw data. Raw data persisted in docker volume. To force a restart run: FORCE_PARSE=true docker-compose up ")
    else:
        write_raw_data()
    
    # Insert courses into database via data layer api
    if FORCE_INSERT: 
        print("Inserting courses into data layer api")
        clear_request_result = requests.post(DATA_LAYER_API_COURSE_CLEAR)
        clear_request_result.raise_for_status()
        for course in normalized_courses():
            payload = {"course": asdict(course)}
            insert_request_result = requests.post(DATA_LAYER_API_COURSE_INSERTION, json = payload)
            insert_request_result.raise_for_status()
    
        print("Sucessfully uploaded courses via data layer API")

    #Query database
    for query in queries:
        query_post_result = requests.post(DATA_LAYER_API_QUERY_COURSE, json = {"query": query, "limit": 3})
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
