from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, verify_jwt_in_request, get_jwt_identity
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
    CORS(app)  # Allows cross-origin from any IP

    # Telemetry Configuration ------------------
    FlaskInstrumentor().instrument_app(app)
    RequestsInstrumentor().instrument()

    # Metrics setup
    exporter = OTLPMetricExporter()
    reader = PeriodicExportingMetricReader(exporter)
    provider = MeterProvider(metric_readers=[reader])
    set_meter_provider(provider)

    # Traces setup
    resource = Resource.create({"service.name": "data_layer"})
    tracer_provider = TracerProvider(resource=resource)
    otlp_exporter = OTLPSpanExporter()
    span_processor = BatchSpanProcessor(otlp_exporter)
    tracer_provider.add_span_processor(span_processor)
    trace.set_tracer_provider(tracer_provider)

    # request races pre processing
    @app.before_request
    def add_client_ip_to_span():
        span = trace.get_current_span()

        # add ips
        if span is not None:
            ip = request.headers.get("X-Forwarded-For", request.remote_addr)
            span.set_attribute("http.client_ip", ip)

        # add user_id if available
        # NOTE: can add log in status if we decide to always send JWT even on routes that don't require it
        try: 
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            if user_id is not None:
                #span.set_attribute("user.logged_in", True)
                span.set_attribute("user.id", user_id)
        except Exception:
            #span.set_attribute("user.logged_in", False)
            pass
            

    # Token Configuration ----------------------
    jwt_secret_key = os.environ.get('JWT_SECRET_KEY')

    def generate_secret_key():
        return binascii.hexlify(os.urandom(32)).decode()

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
