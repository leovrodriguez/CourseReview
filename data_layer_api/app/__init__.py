from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.metrics import get_meter_provider, set_meter_provider
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
import binascii
import os


def create_app():
    app = Flask(__name__)
    CORS(app) # Allows cross origin from any ip

    # Telemetry Configuration ------------------
    FlaskInstrumentor().instrument_app(app)
    RequestsInstrumentor().instrument()

    # metrics
    exporter = OTLPMetricExporter()
    reader = PeriodicExportingMetricReader(exporter)
    provider = MeterProvider(metric_readers=[reader])
    set_meter_provider(provider)
    
    # traces
    resource = Resource.create({"service.name":"data_layer"})
    tracer_provider = TracerProvider(resource=resource)
    otlp_exporter = OTLPSpanExporter()
    span_processor = BatchSpanProcessor(otlp_exporter)
    tracer_provider.add_span_processor(span_processor)
    trace.set_tracer_provider(tracer_provider)

    # Token Configuration  ---------------------

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

    # Route Registration -----------------------

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