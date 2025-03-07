from flask import Blueprint, request, jsonify, current_app
from database.db_factory import get_vector_db
from classes.course import Course
from embedder.embedder import get_embedding, embed_course_vector
course_bp = Blueprint('course', __name__)

import sys

@course_bp.route('/rank', methods=['POST'])
def rank_course():
    # Implement rank course logic here
    return jsonify({"message": "Rank course endpoint"})

@course_bp.route('/insert', methods=['POST'])
def insert_course():
    current_app.logger.info("Insert endpoint hit")
    database = get_vector_db() # must be in route handler to avoid thread failure
    payload = request.get_json()
    course_dict = payload["course"]
    course = Course.dict_to_course(course_dict)
    course_vector = embed_course_vector(course)
    
    database.insert_course(course, course_vector)
    database.close()
    return jsonify({"message": "Course Upload Endpoint"})

'''
@course_bp.route('/query', methods=['POST'])
def query_course():
    database = get_vector_db()
    payload = request.get_json()
    limit = payload["limit"]
    query = payload["query"]
    query_vector = get_embedding(query)
    courses = database.query_course_vector(query_vector, limit)
    print("Query Vector:", query_vector)  # For Debugging
    database.close()
    return jsonify({"courses": courses})
'''

@course_bp.route('/query', methods=['POST'])
def query_course():
    try:
        database = get_vector_db()
        payload = request.get_json()

        if not payload or "limit" not in payload or "query" not in payload:
            print("❌ Missing 'limit' or 'query' in request:", payload)
            sys.stdout.flush()
            return jsonify({"error": "Missing 'limit' or 'query' in request"}), 400

        limit = payload["limit"]
        query = payload["query"]

        # Debugging: Print the query and embedding
        print(f"🔍 Query Received: {query}")
        sys.stdout.flush()  # Force log output

        query_vector = get_embedding(query)
        print(f"🧬 Query Vector: {query_vector}")  # This should log numbers
        sys.stdout.flush()

        courses = database.query_course_vector(query_vector, limit)
        print(f"📚 Courses Found: {courses}")  # This should log course data
        sys.stdout.flush()

        database.close()
        return jsonify({"courses": courses})

    except Exception as e:
        print(f"🔥 ERROR: {str(e)}")
        sys.stdout.flush()
        return jsonify({"error": str(e)}), 500


@course_bp.route('/clear', methods=['POST'])
def clear_courses():
    database = get_vector_db()
    database.clear_courses()
    database.close()
    return jsonify({"message": "Course data cleared" })