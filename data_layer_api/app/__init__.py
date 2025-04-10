from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
import os
import binascii

def create_app():
    app = Flask(__name__)
    
    # Generate a random secret key for JWT
    def generate_secret_key():
        return 'super-secret-key'#binascii.hexlify(os.urandom(32)).decode()

    app.config['JWT_SECRET_KEY'] = generate_secret_key()
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