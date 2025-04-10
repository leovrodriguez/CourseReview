from flask_jwt_extended import get_jwt_identity, jwt_required
import jwt
from flask import Blueprint, request, jsonify, current_app
from database.db_factory import get_vector_db
from classes.like import Like

protected_bp = Blueprint('protected', __name__)

@protected_bp.route('/validateToken', methods=['POST'])
@jwt_required()
def _validate_token():    
    return get_jwt_identity()
    
def auth_add_like(user_id, object_id, object_type, get_object_by_id):
    if user_id is None:
        return jsonify({"error": "Invalid user_id"}), 401
    
    # Validate the object ID
    if object_id is None:
        return jsonify({"error": f"{object_type} ID is required"}), 400

    try:
        database = get_vector_db()

        object = get_object_by_id(object_id)
        if object is None:
            return jsonify({"error": f"{object_type} not found"}), 404
        
        like = Like(
            user_id=user_id,
            object_id=object_id,
            object_type=object_type
        )   
        
        # Add like to the database
        database.insert_like(like)
        
        return jsonify({"message": f"Liked {object_type} successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        database.close()

def auth_remove_like(user_id, object_id, object_type, get_object_by_id):
    if user_id is None:
        return jsonify({"error": "Invalid user_id"}), 401
    
    # Validate the discussion ID
    if object_id is None:
        return jsonify({"error": f"{object_type} ID is required"}), 400

    try:
        database = get_vector_db()
        # Check if the discussion exists
        object = get_object_by_id(object_id)
        if object is None:
            return jsonify({"error": f"{object_type} not found"}), 404
        
        # Add like to the database
        deleted = database.delete_like(user_id, object_id, object_type)
        
        return jsonify({"message": f"{object_type} not unliked" if deleted == 0 else f"Unliked {object_type} successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        database.close()