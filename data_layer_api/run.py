from app import create_app
import logging 

app = create_app()
app.logger.setLevel(logging.INFO)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)