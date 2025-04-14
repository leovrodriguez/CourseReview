FROM python:3.11-slim

WORKDIR /server

COPY data_layer_api/requirements.txt data_layer_api/requirements.txt
RUN pip install -r data_layer_api/requirements.txt

# Install OpenTelemetry and Configure Variables
ENV OPENTELEMETRY_DISTRO_VERSION=0.53b0
RUN pip install --no-cache-dir "opentelemetry-distro[otlp]==$OPENTELEMETRY_DISTRO_VERSION"
RUN opentelemetry-bootstrap -a install
ENV OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED=true
ENV OTEL_LOGS_EXPORTER=otlp

ENV PYTHONPATH="${PYTHONPATH}:/server/data_layer_api"

# Set the Flask app (note: this path is relative to the PYTHONPATH now)
ENV FLASK_APP=app:create_app()

COPY . .

EXPOSE 5000

# Start the Flask app via OpenTelemetry instrumentation
CMD ["opentelemetry-instrument", "flask", "run", "--host", "0.0.0.0", "--port", "5000"]
