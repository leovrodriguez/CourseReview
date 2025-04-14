from app import create_app
import logging
from flask_cors import CORS

app = create_app()

#Configuration
app.logger.setLevel(logging.INFO)
app.config['JSON_SORT_KEYS'] = False

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)