from flask import Blueprint, request, jsonify
from database.db_factory import get_vector_db
from app.protected import auth_add_like, auth_remove_like
from flask_jwt_extended import jwt_required, get_jwt_identity
from classes.discussion import Discussion
from classes.like import Like

discussion_bp = Blueprint('discussion', __name__)

"""
-- Discussions Table
    CREATE TABLE IF NOT EXISTS discussions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        embedding vector(768) NOT NULL, -- Added vector embedding
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

     -- Likes Table (tracks likes on multiple objects)
            CREATE TABLE IF NOT EXISTS likes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                object_id UUID NOT NULL,
                object_type TEXT NOT NULL CHECK (object_type IN ('discussion', 'reply')), 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (user_id, object_id, object_type)
            );
"""

@discussion_bp.route('/post', methods=['POST'])
@jwt_required()
def post_discussion():
    # validate first
    user_id = get_jwt_identity()
    if user_id is None:
        return jsonify({"error": "Invalid token"}), 401

    payload = request.get_json()
    
    # Extract discussion details from the payload
    course_id = payload.get("course_id")
    title = payload.get("title")
    description = payload.get("description")

    # whats the embedding???
    embedding = payload.get("embedding")

    # Validate the course ID, title, and description
    if course_id is None or title is None or description is None:
        return jsonify({"error": "Course ID, title, and description are required"}), 400
    
    try:
        database = get_vector_db()
        # Check if the course exists
        course = database.get_course_by_id(course_id)
        if course is None:
            return jsonify({"error": "Course not found"}), 404
        
        discussion = Discussion(
            title=title,
            description=description,
            user_id=user_id,
            course_id=course_id
        )
        
        # then we can insert this into the discussion table
        database.insert_discussion(discussion, embedding)
        
        return jsonify({"message": "Discussion added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        database.close()

@discussion_bp.route('/remove', methods=['POST'])
@jwt_required()
def remove_discussion():
    # validate first
    user_id = get_jwt_identity()
    if user_id is None:
        return jsonify({"error": "Invalid token"}), 401
    
    payload = request.get_json()
    
    discussion_id = payload["discussion_id"]

    # Validate the discussion ID
    if discussion_id is None:
        return jsonify({"error": "Discussion ID is required"}), 400

    try:
        database = get_vector_db()
        # Check if the discussion exists
        discussion = database.get_discussion_by_id(discussion_id)
        if discussion is None:
            return jsonify({"error": "Discussion not found"}), 404
        
        # ensure the user is the owner of the discussion
        if discussion.user_id != user_id:
            return jsonify({"error": "You are not the owner of this discussion"}), 403
        
        # Add like to the database
        deleted = database.delete_discussion(discussion_id)
        
        return jsonify({"message": "Discussion not deleted" if deleted == 0 else "Discussion deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        database.close()

@discussion_bp.route('/edit', methods=['POST'])
@jwt_required()
def edit_discussion():
    # validate first
    user_id = get_jwt_identity()
    if user_id is None:
        return jsonify({"error": "Invalid token"}), 401

    payload = request.get_json()
    
    # Extract discussion details from the payload
    discussion_id = payload.get("discussion_id")
    title = payload.get("title")
    description = payload.get("description")

    # Validate the course ID, title, and description
    if discussion_id is None or title is None or description is None:
        return jsonify({"error": "Course ID, title, and description are required"}), 400
    
    try:
        database = get_vector_db()
        
        # ensure that the user is the owner of the discussion
        discussion = database.get_discussion_by_id(discussion_id)
        if discussion is None:
            return jsonify({"error": "Discussion not found"}), 404
        if discussion.user_id != user_id:
            return jsonify({"error": "You are not the owner of this discussion"}), 403
        
        # then we can insert this into the discussion table
        edited = database.edit_discussion(discussion_id, title, description)
        
        return jsonify({"message": "Discussion not edited" if edited == 0 else "Discussion edited successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        database.close()

def get_discussion_by_id(discussion_id):
    database = get_vector_db()
    discussion = database.get_discussion_by_id(discussion_id)
    database.close()
    return discussion

@discussion_bp.route('/like', methods=['POST'])
@jwt_required()
def like_reply():
    # validate first
    user_id = get_jwt_identity()
    if user_id is None:
        return jsonify({"error": "Invalid token"}), 401
    
    payload = request.get_json()
    
    discussion_id = payload["discussion_id"]

    return auth_add_like(user_id, discussion_id, 'discussion', get_discussion_by_id)

@discussion_bp.route('/unlike', methods=['POST'])
@jwt_required()
def unlike_reply():
    # validate first
    user_id = get_jwt_identity()
    if user_id is None:
        return jsonify({"error": "Invalid token"}), 401

    payload = request.get_json()
    
    discussion_id = payload["discussion_id"]

    return auth_remove_like(user_id, discussion_id, 'discussion', get_discussion_by_id)