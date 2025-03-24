from flask import Blueprint, request, jsonify
from database.db_factory import get_vector_db
from classes.course import Course, CourseReview
from embedder.embedder import get_embedding, embed_course_vector
from uuid import UUID
course_bp = Blueprint('course', __name__)

@course_bp.route('/', methods=['GET'])
def get_courses():
    try:
        # Get basic pagination parameters
        limit = request.args.get('limit', type=int)
        offset = request.args.get('offset', type=int)
        
        # Get database connection
        database = get_vector_db() 
        courses = database.get_courses(limit=limit, offset=offset)
        database.close()
        
        return jsonify(courses)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@course_bp.route('/<course_id>', methods=['GET'])
def get_course_by_id(course_id):
    try:
        # Get database connection
        database = get_vector_db()
        course = database.get_course_by_id(course_id)
        database.close()
        
        if not course:
            return jsonify({"error": "Course not found"}), 404
            
        # Fix Coursera URL if needed - temporary handler for issue #25
        if course['platform'] == 'coursera' and not course['url'].startswith('http'):
            course['url'] = f"https://www.coursera.org{course['url']}"
            
        return jsonify(course)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@course_bp.route('/<course_id>/reviews', methods=['GET'])
def get_course_reviews(course_id):
    """
    Get all reviews for a specific course.
    
    URL Parameters:
        course_id: The UUID of the course to fetch reviews for
        
    Query Parameters:
        limit (optional): Maximum number of reviews to return
        offset (optional): Number of reviews to skip (for pagination)
        
    Returns:
        JSON with reviews array and stats object
    """
    try:
        # Validate course_id format
        try:
            # Attempt to parse as UUID to validate format
            uuid_obj = UUID(course_id)
        except ValueError:
            return jsonify({"error": "Invalid course ID format"}), 400
            
        # Get pagination parameters
        limit = request.args.get('limit', type=int)
        offset = request.args.get('offset', type=int)
        
        # Get database connection
        database = get_vector_db()
        
        # First check if course exists
        course = database.get_course_by_id(course_id)
        if not course:
            database.close()
            return jsonify({"error": "Course not found"}), 404
            
        # Get reviews for the course
        result = database.get_course_reviews(course_id)
        
        # Apply pagination to reviews if specified
        if limit is not None or offset is not None:
            reviews = result["reviews"]
            offset = offset or 0
            
            if limit is not None:
                paginated_reviews = reviews[offset:offset+limit]
            else:
                paginated_reviews = reviews[offset:]
                
            result["reviews"] = paginated_reviews
            result["pagination"] = {
                "total": len(reviews),
                "offset": offset,
                "limit": limit,
                "returned": len(paginated_reviews)
            }
        
        database.close()
        return jsonify(result)
        
    except Exception as e:
        # Log the error for debugging
        print(f"Error getting course reviews: {str(e)}")
        return jsonify({"error": str(e)}), 500

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