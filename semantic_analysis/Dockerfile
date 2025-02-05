FROM python:3.11

WORKDIR /job

COPY . .

RUN pip install --no-cache-dir -r semantic_analysis/requirements.txt

RUN mypy .

CMD ["python", "semantic_analysis/main.py"]