import os

# Environment Variables (Default to test environment)
# See README.md for more information
FORCE_PARSE = os.getenv("FORCE_PARSE", "false").lower() == "true"
FORCE_EMBED = os.getenv("FORCE_EMBED", "false").lower() == "true"
DB_IMPLEMENTATION = os.getenv("DB_TYPE", "sqlite")
DB_PATH = os.getenv("DB_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "data/database/vectors.db")))