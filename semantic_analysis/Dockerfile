FROM python:3.11
WORKDIR /job

COPY . .

# Ollama installation for embedding model
RUN curl -fsSL https://ollama.com/install.sh | sh

RUN pip install --no-cache-dir -r semantic_analysis/requirements.txt

RUN mypy .

# Command to:
# 1. Start Ollama in the background
# 2. Wait until it's ready
# 3. Pull the nomic-embed-text model
# 4. Start the Python application
CMD ["bash", "-c", "ollama serve & while ! ollama list >/dev/null 2>&1; do sleep 1; done; ollama pull nomic-embed-text && python semantic_analysis/main.py"]