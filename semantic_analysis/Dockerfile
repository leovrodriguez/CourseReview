FROM python:3.11
WORKDIR /job
COPY . .
RUN pip install --no-cache-dir -r semantic_analysis/requirements.txt
RUN mypy .
CMD ["bash", "-c", "python semantic_analysis/main.py"]