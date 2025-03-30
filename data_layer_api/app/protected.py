from flask_jwt_extended import create_access_token, get_jwt_identity, decode_token
from flask import Blueprint, request, jsonify

protected_bp = Blueprint('protected', __name__)

@protected_bp.route('/validateToken', methods=['POST'])
def _validate_token():
    payload = request.get_json()
    return jsonify({"isValid": validate_token(payload["token"])})

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