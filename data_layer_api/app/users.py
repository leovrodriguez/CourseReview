from flask import Blueprint, request, jsonify, current_app
from classes.user import User
from flask_cors import cross_origin
from database.db_factory import get_vector_db
import uuid
import secrets
import base64
import hashlib
from flask_jwt_extended import create_access_token, decode_token
from datetime import timedelta
import re

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

# Add this route to your users_bp Blueprint in users.py

@users_bp.route('/<user_id>', methods=['GET'])
def get_user_by_id_route(user_id):
    database = get_vector_db()
    try:
        # Get user from the database
        user = database.get_user_by_id(user_id)
        
        if user is None:
            return jsonify({"error": "User not found"}), 404
        
        # Remove sensitive information
        if "password" in user:
            del user["password"]
        if "salt" in user:
            del user["salt"]
        if "id" in user:
            del user["id"]
        
        # Convert UUID and datetime objects to strings for JSON serialization
        for key, value in user.items():
            if isinstance(value, (uuid.UUID, object)):
                user[key] = str(value)
        
        return jsonify(user)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        database.close()

@users_bp.route('/validatePassword', methods=['POST'])
def _validate_password():
    payload = request.get_json()
    password = payload["password"]
    return validate_password(password)
        
def validate_password(password):
    special_character_regex = re.compile(r'[!@#$%^&*(),.?":{}|<>-]')
    uppercase_regex = re.compile(r'[A-Z]')
    number_regex = re.compile(r'[0-9]')

    if not password.strip():
        return jsonify({'isValid': False, 'message': 'Password cannot be blank'})

    issues = []
    if (len(password) < 8):
        issues.append('at least 8 characters')
    if not special_character_regex.search(password):
        issues.append('includ at least one special character')
    if not uppercase_regex.search(password):
        issues.append('include at least one uppercase letter')
    if not number_regex.search(password):
        issues.append('include at least one number')
    
    if issues:
        message = "Password must be" + ', '.join(issues) + '.'
        return jsonify({'isValid': False, 'message': message})
    
    return jsonify({'isValid': True, 'message': 'Password is valid.'})

@users_bp.route('/checkUsername', methods=['POST'])
def check_username():
    payload = request.get_json()
    username = payload["username"]
    return validate_username(username)

def validate_username(username):
    # check if length is greater than 3
    if len(username) < 3:
        return jsonify({'isValid': False, 'message': 'Username must be at least 3 characters long.'})

    database = get_vector_db()  # Get a connection to the database
    
    try:
        # Use the get_user_by_username method to fetch the user
        user = database.get_user_by_username(username)

        if user is not None:
            return jsonify({'isValid': False, 'message': 'Username is already taken.'})
        
        return jsonify({'isValid': True, 'message': 'Username is available.'})

    except Exception as e:
        # Handle unexpected errors and return them in the response
        return jsonify({'isValid': False, "error": "error loading the database"}), 500

    finally:
        database.close()

@users_bp.route('/checkEmail', methods=['POST'])
def check_email():
    payload = request.get_json()
    email = payload["email"]
    return validate_email(email)

def validate_email(email):
    email_regex = re.compile(r'^[\w\.-]+@([\w-]+\.)+[\w-]{2,4}$')
    if not email_regex.match(email):
        return jsonify({'isValid': False, 'message': 'Invalid email format (e.g., johndoe@example.com).'})

    database = get_vector_db()  # Get a connection to the database
    
    try:
        user = database.find_by_email(email)

        if user is not None:
            return jsonify({'isValid': False, 'message': 'Email is already taken.'})
        
        return jsonify({'isValid': True, 'message': 'Email is available.'})

    except Exception as e:
        # Handle unexpected errors and return them in the response
        return jsonify({'isValid': False, "error": "error with connecting to database"}), 500

    finally:
        database.close()

def _get_full_user(username):
    # This is a backend function to get everything on the user, including the password and salt
    database = get_vector_db()  # Get a connection to the database
    
    try:
        # Use the get_user_by_username method to fetch the user
        user = database.get_user_by_username(username)

        if user is None:
            return None
        
        # Convert UUID and datetime objects to strings for JSON serialization
        user_dict = {}
        for key, value in user.items():
            if isinstance(value, (uuid.UUID, object)):
                user_dict[key] = str(value)
            else:
                user_dict[key] = value

        return user_dict

    except Exception as e:
        # Handle unexpected errors
        print(f"Error in _get_full_user: {str(e)}")
        return None

    finally:
        database.close()

def get_user(username):
    # This is to get the user without the password and salt
    user = _get_full_user(username)
    
    if user is None:
        return None
        
    # Remove sensitive information
    if "password" in user:
        del user["password"]
    if "salt" in user:
        del user["salt"]
    
    return user

@users_bp.route('/insert', methods=['POST'])
@cross_origin()
def insert_user():
    payload = request.get_json()
    username = payload["username"]
    email = payload["email"]
    password = payload["password"]

    # Validate the password
    password_validation = validate_password(password)
    username_validation = validate_username(username)
    email_validation = validate_email(email)
    if not password_validation.json['isValid'] or not username_validation.json['isValid'] or not email_validation.json['isValid']:
        errors = {"success": False, "error": 'Invalid input',
                  "password_error": "",
                    "username_error": "",
                   "email_error": ""}, 401
        if not password_validation.json['isValid']:
            errors["password_error"] = password_validation.json['message']
        if not username_validation.json['isValid']:
            errors["username_error"] = username_validation.json['message']
        if not email_validation.json['isValid']:
            errors["email_error"] = email_validation.json['message']
        return jsonify(errors)

    database = get_vector_db()

    decoded_salt = generate_salt()
    hashed_password = hash_password(password, decoded_salt)
    salt_string = encode_base64(decoded_salt)
    password_hashed_string = encode_base64(hashed_password)
    user_id = database.insert_user(User(username, email, password_hashed_string, salt_string))
    database.close()

    # now create the login token
    access_token = create_access_token(identity=str(user_id), expires_delta=timedelta(hours=1))

    # Implement search logic here
    return jsonify({"success": True, "message": "User Inserted Successfully",
                    "user_id": user_id,
                    "username": username,
                    "email": email,
                    "access_token": access_token})

@users_bp.route('/login', methods=['POST'])
@cross_origin()
def login():
    payload = request.get_json()
    username = payload["username"]
    password = payload["password"]

    user = _get_full_user(username)
    
    # Check if user is a tuple (error response from _get_full_user)
    if isinstance(user, tuple):
        # This means an error occurred in _get_full_user
        return jsonify({"successful": False, "message": "Invalid username or password"})
    
    # Check if user is None
    if user is None:
        return jsonify({"successful": False, "message": "Invalid username or password"})

    # Now we know user is a dictionary, we can proceed
    if not verify_password(user["salt"], user["password"], password):
        return jsonify({"successful": False, "message": "Invalid username or password"})
    
    # Create the login token
    access_token = create_access_token(identity=str(user["id"]), expires_delta=timedelta(hours=1))

    # For debugging only
    decoded_token = decode_token(access_token)
    current_app.logger.info(f"Decode token: {decoded_token}")
    
    # Just log the sub value directly from the decoded token
    user_id_from_token = decoded_token.get('sub')  # 'sub' is where Flask-JWT-Extended stores the identity
    current_app.logger.info(f"User ID from token 'sub' field: {user_id_from_token}")
    
    # Return successful login with user_id for client-side storage
    return jsonify({
        "successful": True, 
        "access_token": access_token,
        "user_id": user["id"],
        "username": user["username"]
    })

def encode_base64(data):
    return base64.b64encode(data).decode('utf-8')

def generate_salt():
    return secrets.token_bytes(16)

def hash_password(password, salt):
    # ensure the iterations is always put at 1000, chaning it will mean we can't log into older accounts
    hashed_password = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 1000)
    return hashed_password

def verify_password(stored_salt, stored_hash, input_password):
    # decode the salt
    decoded_salt = base64.b64decode(stored_salt)
    decoded_hash = base64.b64decode(stored_hash)

    # hash with the salt
    input_hash = hash_password(input_password, decoded_salt)
    
    # compare
    return input_hash == decoded_hash