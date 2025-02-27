FROM python:3.11-slim

WORKDIR /server

COPY data_layer_api/requirements.txt data_layer_api/requirements.txt
RUN pip install -r data_layer_api/requirements.txt

COPY . .

CMD ["python", "data_layer_api/run.py"]