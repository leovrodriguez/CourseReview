from flask import Blueprint, request, jsonify
from classes.user import User
from flask_cors import cross_origin
from database.db_factory import get_vector_db
import uuid
import secrets
import base64
import hashlib
from flask_jwt_extended import create_access_token, get_jwt_identity, decode_token
from datetime import timedelta
import re


users_bp = Blueprint('users', __name__)

def get_user_id(token):
    # Decode the JWT token to extract the user ID
    try:
        decoded_token = decode_token(token)
        user_id = decoded_token.get('identity')
        return user_id
    except Exception as e:
        # Handle token decoding errors (e.g., expired or invalid token)
        return None

@users_bp.route('/validateToken', methods=['POST'])
def validate_token():
    payload = request.get_json()
    token = payload["token"]

    try:
        # Decode the token and check for validity
        decoded_token = decode_token(token)
        
        # If decoding was successful, the token is valid and has not expired
        return jsonify({"isValid": True})
    except Exception as e:
        # If decoding fails (e.g., expired or tampered token), handle it here
        return jsonify({"isValid": False})

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

@users_bp.route('/validatePassword', methods=['POST'])
def validate_password():
    payload = request.get_json()
    password = payload["password"]

    special_character_regex = re.compile(r'[!@#$%^&*(),.?":{}|<>]')
    uppercase_regex = re.compile(r'[A-Z]')
    number_regex = re.compile(r'[0-9]')

    if not password.strip():
        return jsonify({'isValid': False, 'message': 'Password cannot be blank'})

    if (len(password) < 8 or 
        not special_character_regex.search(password) or 
        not uppercase_regex.search(password) or 
        not number_regex.search(password)):
        return jsonify({'isValid': False, 'message': 'Password must be at least 8 characters, include at least one special character one uppercase letter, and one number.'})

    return jsonify({'isValid': True, 'message': 'Password is valid.'})

@users_bp.route('/checkUsername', methods=['POST'])
def check_username():
    payload = request.get_json()
    username = payload["username"]

    # check if length is greater than 3
    if len(username) < 3:
        return jsonify({'isAvailable': False, 'message': 'Username must be at least 3 characters long.'})

    database = get_vector_db()  # Get a connection to the database
    
    try:
        # Use the find_by_username method to fetch the user
        user = database.find_by_username(username)

        if user is not None:
            return jsonify({'isAvailable': False, 'message': 'Username is already taken.'})
        
        return jsonify({'isAvailable': True, 'message': 'Username is available.'})

    except Exception as e:
        # Handle unexpected errors and return them in the response
        return jsonify({"error loading the database"}), 500

    finally:
        database.close()

@users_bp.route('/checkEmail', methods=['POST'])
def check_email():
    payload = request.get_json()
    email = payload["email"]

    email_regex = re.compile(r'^[\w\.-]+@([\w-]+\.)+[\w-]{2,4}$')
    if not email_regex.match(email):
        return jsonify({'isAvailable': False, 'message': 'Invalid email format (e.g., johndoe@example.com).'})

    database = get_vector_db()  # Get a connection to the database
    
    try:
        user = database.find_by_email(email)

        if user is not None:
            return jsonify({'isAvailable': False, 'message': 'Email is already taken.'})
        
        return jsonify({'isAvailable': True, 'message': 'Email is available.'})

    except Exception as e:
        # Handle unexpected errors and return them in the response
        return jsonify({"error with connecting to database"}), 500

    finally:
        database.close()

def _get_full_user(username):
    # this is a backend function to get everything on the user, including the password and salt
    database = get_vector_db()  # Get a connection to the database
    
    try:
        # Use the find_by_username method to fetch the user
        user = database.find_by_username(username)

        if user is None:
            return jsonify({"error": "User not found"}), 404
        
        for key, value in user.items():
            if isinstance(value, (uuid.UUID, object)):
                user[key] = str(value)

        return user

    except Exception as e:
        # Handle unexpected errors and return them in the response
        return None

    finally:
        database.close()

def get_user(username):
    # this is to get the user without the password and salt
    user = _get_full_user(username)
    del user["password"]
    del user["salt"]
    del user['id']

@users_bp.route('/insert', methods=['POST'])
@cross_origin()
def insert_user():
    payload = request.get_json()
    username = payload["username"]
    email = payload["email"]
    password = payload["password"]
    database = get_vector_db()
    decoded_salt = generate_salt()
    hashed_password = hash_password(password, decoded_salt)
    salt_string = encode_base64(decoded_salt)
    password_hashed_string = encode_base64(hashed_password)
    user_id = database.insert_user(User(username, email, password_hashed_string, salt_string))
    database.close()

    # now create the login token
    access_token = create_access_token(identity=str(user_id), expires_delta=timedelta(hours=1))

    try:
        # Decode the token and check for validity
        decoded_token = decode_token(access_token)
        
        # If decoding was successful, the token is valid and has not expired
        print('valid token')
    except Exception as e:
        # If decoding fails (e.g., expired or tampered token), handle it here
        print('invalid token')

    print(user_id, get_user_id(access_token))

    # Implement search logic here
    return jsonify({"message": "User Inserted Successfully",
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
    if user is None:
        return jsonify({"successful": False})

    if not verify_password(user["salt"], user["password"], password):
        return jsonify({"successful": False})
    
    # now create the login token
    access_token = create_access_token(identity=str(user["id"]), expires_delta=timedelta(hours=1))
    
    return jsonify({"successful": True, "access_token": access_token})

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