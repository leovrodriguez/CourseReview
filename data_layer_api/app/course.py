from flask import Blueprint, request, jsonify, current_app
from database.db_factory import get_vector_db
from classes.course import Course

course_bp = Blueprint('course', __name__)

@course_bp.route('/rank', methods=['POST'])
def rank_course():
    # Implement rank course logic here
    return jsonify({"message": "Rank course endpoint"})

@course_bp.route('/insert', methods=['POST'])
def insert_course():
    current_app.logger.info("Insert endpoint hit")
    database = get_vector_db() # must be in route handler to avoid thread failure
    payload = request.get_json()
    current_app.logger.info(f"{payload}")
    course_dict = payload["course"]
    course_vector = payload["course_vector"]
    
    database.insert_course(Course.dict_to_course(course_dict), course_vector)
    database.close()
    return jsonify({"message": "Course Upload Endpoint"})

@course_bp.route('/query', methods=['POST'])
def query_course():
    database = get_vector_db()
    payload = request.get_json()
    vector = payload["query_vector"]
    limit = payload["limit"]
    courses = database.query_course_vector(vector, limit)
    database.close()
    return jsonify({"courses": courses})

@course_bp.route('/clear', methods=['POST'])
def clear_courses():
    database = get_vector_db()
    database.clear_courses()
    database.close()
    return jsonify({"message": "Course data cleared" })