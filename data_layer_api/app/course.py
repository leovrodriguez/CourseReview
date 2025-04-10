from flask import Blueprint, request, jsonify, current_app
from database.db_factory import get_vector_db
from classes.course import Course, CourseReview
from classes.discussion import Discussion
from classes.reply import Reply
from classes.like import Like
from embedder.embedder import get_embedding, embed_course_vector, embed_discussion_vector, embed_reply_vector
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from uuid import UUID
from app.protected import auth_add_like, auth_remove_like
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
@jwt_required()
def review_course(course_id):
    # validate first
    user_id = get_jwt_identity()
    if user_id is None:
        return jsonify({"error": "Invalid token"}), 401
    
    payload = request.get_json()

    rating = payload.get("rating")
    description = payload.get("description", None)
    
    if not user_id or not rating:
        return jsonify({"error": "Missing required fields: user_id and rating are required"}), 400
    
    user_ip = request.remote_addr
    user_agent = request.headers.get('User-Agent', 'unknown')

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

@course_bp.route('/<course_id>/discussion/<discussion_id>/replies', methods=['GET'])
def get_discussion_replies(course_id, discussion_id):
    """
    Get all replies for a specific discussion.
    
    URL Parameters:
        course_id: The UUID of the course
        discussion_id: The UUID of the discussion to fetch replies for
        
    Query Parameters:
        limit (optional): Maximum number of replies to return
        offset (optional): Number of replies to skip (for pagination)
        
    Returns:
        JSON with replies array
    """
    try:
        # Validate discussion_id format
        try:
            # Attempt to parse as UUID to validate format
            uuid_obj = UUID(discussion_id)
        except ValueError:
            return jsonify({"error": "Invalid discussion ID format"}), 400
            
        # Get pagination parameters
        limit = request.args.get('limit', type=int)
        offset = request.args.get('offset', type=int)
        
        # Get database connection
        database = get_vector_db()
        
        # Get replies for the discussion
        replies = database.get_replies_by_discussion(discussion_id)
        
        # Process replies to handle deleted replies
        for reply in replies:
            if reply.get('text') == '[deleted]':
                reply['username'] = 'Anonymous'
        
        # Apply pagination if specified
        if limit is not None or offset is not None:
            offset = offset or 0
            
            if limit is not None:
                paginated_replies = replies[offset:offset+limit]
            else:
                paginated_replies = replies[offset:]
                
            result = {
                "replies": paginated_replies,
                "pagination": {
                    "total": len(replies),
                    "offset": offset,
                    "limit": limit,
                    "returned": len(paginated_replies)
                }
            }
        else:
            result = {
                "replies": replies
            }
        
        database.close()
        return jsonify(result)
        
    except Exception as e:
        # Log the error for debugging
        print(f"Error getting discussion replies: {str(e)}")
        return jsonify({"error": str(e)}), 500

@course_bp.route('/<course_id>/discussion/<discussion_id>/reply', methods=['POST'])
def create_reply(course_id, discussion_id):
    """
    Create a new reply for a discussion.
    
    URL Parameters:
        course_id: The UUID of the course
        discussion_id: The UUID of the discussion to reply to
        
    Request body:
        {
            "user_id": UUID,
            "text": str
        }
        
    Returns:
        JSON with success message and reply ID
    """
    try:
        # Validate discussion_id format
        try:
            discussion_uuid = UUID(discussion_id)
        except ValueError:
            return jsonify({"error": "Invalid discussion ID format"}), 400
        
        # Get request payload
        payload = request.get_json()
        
        # Validate required fields
        if not payload.get("user_id") or not payload.get("text"):
            return jsonify({"error": "Missing required fields: user_id and text are required"}), 400
        
        user_id = payload["user_id"]
        text = payload["text"]
        
        # Validate user_id format
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            return jsonify({"error": "Invalid user ID format"}), 400
        
        # Get database connection
        database = get_vector_db()
        
        # Create reply object
        reply = Reply(
            text=text,
            user_id=user_uuid,
            discussion_id=discussion_uuid
        )
        
        # Generate embedding for the reply
        reply_vector = embed_reply_vector(reply)
        
        # Insert reply into database
        reply_id = database.insert_reply(reply, reply_vector)
        database.close()
        
        return jsonify({
            "message": "Reply created successfully",
            "reply_id": str(reply_id)
        }), 201
        
    except Exception as e:
        # Log the error for debugging
        print(f"Error creating reply: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@course_bp.route('/<course_id>/discussion/<discussion_id>/reply/<reply_id>/reply', methods=['POST'])
def reply_to_reply(course_id, discussion_id, reply_id):
    """
    Create a new reply to an existing reply.
    
    URL Parameters:
        course_id: The UUID of the course
        discussion_id: The UUID of the discussion
        reply_id: The UUID of the reply to respond to
        
    Request body:
        {
            "user_id": UUID,
            "text": str
        }
        
    Returns:
        JSON with success message and reply ID
    """
    try:
        # Validate UUIDs
        try:
            course_uuid = UUID(course_id)
            discussion_uuid = UUID(discussion_id)
            parent_reply_uuid = UUID(reply_id)
        except ValueError:
            return jsonify({"error": "Invalid UUID format"}), 400
        
        # Get request payload
        payload = request.get_json()
        
        # Validate required fields
        if not payload.get("user_id") or not payload.get("text"):
            return jsonify({"error": "Missing required fields: user_id and text are required"}), 400
        
        user_id = payload["user_id"]
        text = payload["text"]
        
        # Validate user_id format
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            return jsonify({"error": "Invalid user ID format"}), 400
        
        # Get database connection
        database = get_vector_db()
        
        # Create reply object
        reply = Reply(
            text=text,
            user_id=user_uuid,
            discussion_id=discussion_uuid
        )
        
        # Generate embedding for the reply
        reply_vector = embed_reply_vector(reply)
        
        # Insert reply to reply into database
        reply_id = database.insert_reply_to_reply(reply, parent_reply_uuid, reply_vector)
        database.close()
        
        return jsonify({
            "message": "Reply created successfully",
            "reply_id": str(reply_id)
        }), 201
        
    except Exception as e:
        # Log the error for debugging
        print(f"Error creating reply to reply: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@course_bp.route('/<course_id>/discussion/<discussion_id>/reply/<reply_id>', methods=['DELETE'])
@jwt_required()
def delete_reply(course_id, discussion_id, reply_id):
    """
    Delete a reply by setting its text to '[deleted]'.
    
    URL Parameters:
        course_id: The UUID of the course
        discussion_id: The UUID of the discussion
        reply_id: The UUID of the reply to delete
        
    Request body:
        {
            "user_id": UUID  # The user requesting the deletion (for authorization)
        }
        
    Returns:
        JSON with success or error message
    """
    try:
        # Validate UUIDs
        try:
            reply_uuid = UUID(reply_id)
        except ValueError:
            return jsonify({"error": "Invalid reply ID format"}), 400
        
        # validate first
        user_id = get_jwt_identity()
        if user_id is None:
            return jsonify({"error": "Invalid token"}), 401
        
        # Get database connection
        database = get_vector_db()

        # check that this is the owner of the reply
        reply = database.get_reply_by_id(reply_id)
        if reply is None:
            database.close()
            return jsonify({"error": "Reply not found"}), 404
        if reply.user_id != user_id:
            database.close()
            return jsonify({"error": "You are not the owner of this reply"}), 403
        
        # Update the reply text to '[deleted]'
        success = database.update_reply_text(reply_id, "[deleted]")
        
        database.close()
        
        if success:
            return jsonify({"message": "Reply deleted successfully"}), 200
        else:
            return jsonify({"error": "Failed to delete reply"}), 500
        
    except Exception as e:
        # Log the error for debugging
        print(f"Error deleting reply: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
def get_reply_by_id(reply_id):
    database = get_vector_db()
    reply = database.get_reply_by_id(reply_id)
    database.close()
    return reply

@course_bp.route('/like_reply', methods=['POST'])
@jwt_required()
def like_reply():
    # validate first
    user_id = get_jwt_identity()
    if user_id is None:
        return jsonify({"error": "Invalid token"}), 401
    
    payload = request.get_json()
    
    reply_id = payload["reply_id"]

    return auth_add_like(user_id, reply_id, 'reply', get_reply_by_id)

@course_bp.route('/unlike_reply', methods=['POST'])
@jwt_required()
def unlike_reply():
    # validate first
    user_id = get_jwt_identity()
    if user_id is None:
        return jsonify({"error": "Invalid token"}), 401
    
    payload = request.get_json()
    
    reply_id = payload["reply_id"]

    return auth_remove_like(user_id, reply_id, 'reply', get_reply_by_id)
    
def get_course_by_id(course_id):
        database = get_vector_db()
        course = database.get_course_by_id(course_id)
        database.close()
        return course

@course_bp.route('/like', methods=['POST'])
@jwt_required()
def like_course():
    # validate first
    jwt_data = get_jwt()
    current_app.logger.info(f"Full JWT data: {jwt_data}")

    user_id = get_jwt_identity()
    current_app.logger.info(f"Retrieved user_id from token: {user_id}")
    if user_id is None:
        return jsonify({"error": "Invalid token"}), 401
    

    payload = request.get_json()
    
    course_id = payload["course_id"]

    return auth_add_like(user_id, course_id, 'course', get_course_by_id)

@course_bp.route('/unlike', methods=['POST'])
@jwt_required()
def unlike_course():
    # validate first
    user_id = get_jwt_identity()
    if user_id is None:
        return jsonify({"error": "Invalid token"}), 401
    
    payload = request.get_json()
    
    course_id = payload["course_id"]

    return auth_remove_like(user_id, course_id, 'course', get_course_by_id)
    
    
    

 