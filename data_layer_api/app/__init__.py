from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
import binascii
import os


def create_app():
    app = Flask(__name__)
    
    # Use JWT_SECRET_KEY from environment variables
    jwt_secret_key = os.environ.get('JWT_SECRET_KEY')

    # Generate a random secret key for JWT
    def generate_secret_key():
        return binascii.hexlify(os.urandom(32)).decode()
    
    # Fallback to a default value if environment variable is not set
    if not jwt_secret_key:
        print("WARNING: JWT_SECRET_KEY not found in environment variables. Using default key (not recommended for production).")
        jwt_secret_key = generate_secret_key()

    app.config['JWT_SECRET_KEY'] = jwt_secret_key
    app.config["JWT_TOKEN_LOCATION"] = ["headers"]
    app.config["JWT_HEADER_NAME"] = "Authorization"
    app.config["JWT_HEADER_TYPE"] = "Bearer"
    jwt = JWTManager(app)
    @jwt.invalid_token_loader
    def custom_invalid_token_response(error_str):
        return jsonify({"error": "Invalid token provided", "detail": error_str}), 422

    from .search import search_bp
    from .discussion import discussion_bp
    from .course import course_bp
    from .users import users_bp
    from .protected import protected_bp

    app.register_blueprint(search_bp, url_prefix='/search')
    app.register_blueprint(discussion_bp, url_prefix='/discussion')
    app.register_blueprint(course_bp, url_prefix='/course')
    app.register_blueprint(users_bp, url_prefix='/users')
    app.register_blueprint(protected_bp, url_prefix='/protected')

    return app