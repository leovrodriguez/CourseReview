FROM python:3.11
WORKDIR /job

COPY semantic_analysis/requirements.txt semantic_analysis/requirements.txt
RUN pip install -r semantic_analysis/requirements.txt

COPY . .
RUN mypy semantic_analysis/

CMD ["bash", "-c", "python semantic_analysis/main.py"]
