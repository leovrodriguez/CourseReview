from flask_jwt_extended import create_access_token, get_jwt_identity, decode_token
import jwt
from flask import Blueprint, request, jsonify
from database.db_factory import get_vector_db
from classes.like import Like

protected_bp = Blueprint('protected', __name__)

@protected_bp.route('/validateToken', methods=['POST'])
def _validate_token():    
    return jsonify({"isValid": validate_request(request)})

def get_user_id_from_request(req):
    token = get_token(req)
    
    if token is None:
        return None

    user_id = get_user_id(token)
    
    if user_id is None:
        return None

    return user_id

def get_token(req):
    auth_header = req.headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return None

    return auth_header.split(' ')[1]

def validate_request(req):
    token = get_token(req)
    
    return validate_token(token)

def validate_token(token):
    try:
        # Decode the token and check for validity
        decoded_token = decode_token(token)
        
        # If decoding was successful, the token is valid and has not expired
        return True
    except Exception as e:
        # If decoding fails (e.g., expired or tampered token), handle it here
        return False

def get_user_id(token):
    # Decode the JWT token to extract the user ID
    try:
        decoded_token = decode_token(token)
        user_id = decoded_token.get('identity')
        return user_id
    except Exception as e:
        # Handle token decoding errors (e.g., expired or invalid token)
        return None
    
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