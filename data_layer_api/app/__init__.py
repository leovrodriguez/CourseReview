from flask import Flask
from flask_jwt_extended import JWTManager
import os
import binascii

def create_app():
    app = Flask(__name__)

    
    # Generate a random secret key for JWT
    def generate_secret_key():
        return binascii.hexlify(os.urandom(32)).decode()

    app.config['JWT_SECRET_KEY'] = generate_secret_key()
    jwt = JWTManager(app)

    from .search import search_bp
    from .discussion import discussion_bp
    from .course import course_bp
    from .users import users_bp

    app.register_blueprint(search_bp, url_prefix='/search')
    app.register_blueprint(discussion_bp, url_prefix='/discussion')
    app.register_blueprint(course_bp, url_prefix='/course')
    app.register_blueprint(users_bp, url_prefix='/users')

    return app