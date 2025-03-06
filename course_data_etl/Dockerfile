FROM python:3.11
WORKDIR /job

COPY course_data_etl/requirements.txt course_data_etl/requirements.txt
RUN pip install -r course_data_etl/requirements.txt

COPY . .
RUN mypy course_data_etl/

CMD ["bash", "-c", "python course_data_etl/main.py"]
