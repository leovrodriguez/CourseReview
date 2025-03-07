from flask import Blueprint, request, jsonify
from database.db_factory import get_vector_db
from classes.course import Course, CourseReview
from embedder.embedder import get_embedding, embed_course_vector
course_bp = Blueprint('course', __name__)

@course_bp.route('/insert', methods=['POST'])
def insert_course():
    payload = request.get_json()
    course_dict = payload["course"]
    course = Course.dict_to_course(course_dict)
    course_vector = embed_course_vector(course)
    
    # get_vector_db() must be in route handler to avoid thread failure
    database = get_vector_db() 
    database.insert_course(course, course_vector)
    database.close()
    
    return jsonify({"message": "Course Upload Endpoint"})

@course_bp.route('/query', methods=['POST'])
def query_course():
    payload = request.get_json()
    limit = payload["limit"]
    query = payload["query"]
    query_vector = get_embedding(query)
    
    database = get_vector_db()
    courses = database.query_course_vector(query_vector, limit)
    database.close()
    
    return jsonify({"courses": courses})

@course_bp.route('/review', methods=['POST'])
def review_course():
    payload = request.get_json()
    user_id = payload.get("user_id")
    course_id = payload.get("course_id")
    rating = payload.get("rating")
    description = payload.get("description", None)
    review = CourseReview(user_id, course_id, rating, description)
    
    database = get_vector_db()
    database.insert_course_review(review)
    database.close()

    return jsonify({"message": "Course Review Inserted"})

@course_bp.route('/clear', methods=['POST'])
def clear_courses():
    database = get_vector_db()
    database.clear_courses()
    database.close()
    
    return jsonify({"message": "Course data cleared" })