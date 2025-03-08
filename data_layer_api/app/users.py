from flask import Blueprint, request, jsonify
from classes.user import User
from flask_cors import cross_origin
from database.db_factory import get_vector_db
import uuid

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
def get_users():
    database = get_vector_db()
    try:
        # Get all users from the database
        users = database.get_all_users()
        
        # Convert UUID and datetime objects to strings for JSON serialization
        for user in users:
            for key, value in user.items():
                if isinstance(value, (uuid.UUID, object)):
                    user[key] = str(value)
        
        return jsonify(users)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        database.close()

@users_bp.route('/insert', methods=['POST'])
@cross_origin()
def insert_user():
    payload = request.get_json()
    username = payload["username"]
    email = payload["email"]
    database = get_vector_db()
    user_id = database.insert_user(User(username, email))
    user_id = 32
    database.close()
    # Implement search logic here
    return jsonify({"message": "User Inserted Successfully",
                    "user_id": user_id,
                    "username": username,
                    "email": email})