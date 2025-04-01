from flask import Blueprint, request, jsonify
from database.db_factory import get_vector_db
from classes.course import Course, CourseReview
from classes.discussion import Discussion
from embedder.embedder import get_embedding, embed_course_vector, embed_discussion_vector
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

@course_bp.route('/<course_id>/review', methods=['POST'])
def review_course(course_id):
    payload = request.get_json()
    user_id = payload.get("user_id")
    rating = payload.get("rating")
    description = payload.get("description", None)
    
    if not user_id or not rating:
        return jsonify({"error": "Missing required fields: user_id and rating are required"}), 400
    
    database = get_vector_db()
    
    try:
        # Check if the user already has a review for this course
        with database.conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM course_reviews WHERE user_id = %s AND course_id = %s",
                [user_id, course_id]
            )
            existing_review = cursor.fetchone()
            
            if existing_review:
                database.close()
                return jsonify({"message": "You have already reviewed this course. You can only submit one review per course."}), 400
        
        # Create and insert review if no existing review was found
        review = CourseReview(user_id, course_id, rating, description)
        database.insert_course_review(review)
        
        return jsonify({"message": "Course Review Inserted"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        database.close()

@course_bp.route('/<course_id>/review/<review_id>', methods=['DELETE'])
def delete_review(course_id, review_id):
    """
    Delete a specific review for a course.
    
    URL Parameters:
        course_id: The UUID of the course
        review_id: The UUID of the review to delete
        
    Returns:
        JSON response with success or error message
    """

    # Connect to database
    database = get_vector_db()
    
    # Check if the review exists and belongs to the user
    with database.conn.cursor() as cursor:
        cursor.execute(
            "SELECT user_id FROM course_reviews WHERE id = %s AND course_id = %s",
            [review_id, course_id]
        )
        
        review = cursor.fetchone()
        if not review:
            database.close()
            return jsonify({"error": "Review not found"}), 404
        
        # Delete the review
        success = database.delete_course_review(review_id)
        database.close()
        
        if success:
            return jsonify({"message": "Review successfully deleted"}), 200
        else:
            return jsonify({"error": "Failed to delete the review"}), 500


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

@course_bp.route('/clear', methods=['POST'])
def clear_courses():
    database = get_vector_db()
    database.clear_courses()
    database.close()
    
    return jsonify({"message": "Course data cleared" })

@course_bp.route('/<course_id>/discussions', methods=['GET'])
def get_course_discussions(course_id):
    """
    Get all discussions for a specific course.
    
    URL Parameters:
        course_id: The UUID of the course to fetch discussions for
        
    Query Parameters:
        limit (optional): Maximum number of discussions to return
        offset (optional): Number of discussions to skip (for pagination)
        
    Returns:
        JSON with discussions array
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
            
        # Get discussions for the course
        discussions = database.get_discussions_by_course(course_id)
        
        # Apply pagination if specified
        if limit is not None or offset is not None:
            offset = offset or 0
            
            if limit is not None:
                paginated_discussions = discussions[offset:offset+limit]
            else:
                paginated_discussions = discussions[offset:]
                
            result = {
                "discussions": paginated_discussions,
                "pagination": {
                    "total": len(discussions),
                    "offset": offset,
                    "limit": limit,
                    "returned": len(paginated_discussions)
                }
            }
        else:
            result = {
                "discussions": discussions
            }
        
        database.close()
        return jsonify(result)
        
    except Exception as e:
        # Log the error for debugging
        print(f"Error getting course discussions: {str(e)}")
        return jsonify({"error": str(e)}), 500

@course_bp.route('/<course_id>/discussion', methods=['POST'])
def create_discussion(course_id):
    """
    Create a new discussion for a course.
    
    URL Parameters:
        course_id: The UUID of the course to create a discussion for
        
    Request body:
        {
            "user_id": UUID,
            "title": str,
            "description": str
        }
        
    Returns:
        JSON with success message and discussion ID
    """
    try:
        # Validate course_id format
        try:
            course_uuid = UUID(course_id)
        except ValueError:
            return jsonify({"error": "Invalid course ID format"}), 400
        
        # Get request payload
        payload = request.get_json()
        
        # Validate required fields
        if not payload.get("user_id") or not payload.get("title") or not payload.get("description"):
            return jsonify({"error": "Missing required fields: user_id, title, and description are required"}), 400
        
        user_id = payload["user_id"]
        title = payload["title"]
        description = payload["description"]
        
        # Validate user_id format
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            return jsonify({"error": "Invalid user ID format"}), 400
        
        # Get database connection
        database = get_vector_db()
        
        # Check if course exists
        course = database.get_course_by_id(course_id)
        if not course:
            database.close()
            return jsonify({"error": "Course not found"}), 404
        
        # Create discussion object
        discussion = Discussion(
            title=title,
            description=description,
            user_id=user_uuid,
            course_id=course_uuid
        )
        
        # Generate embedding for the discussion
        discussion_vector = embed_discussion_vector(discussion)
        
        # Insert discussion into database
        discussion_id = database.insert_discussion(discussion, discussion_vector)
        database.close()
        
        return jsonify({
            "message": "Discussion created successfully",
            "discussion_id": str(discussion_id)
        }), 201
        
    except Exception as e:
        # Log the error for debugging
        print(f"Error creating discussion: {str(e)}")
        return jsonify({"error": str(e)}), 500