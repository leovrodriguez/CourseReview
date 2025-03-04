import os

# Environment Variables (Default to test environment)
# See README.md for more information
FORCE_PARSE = os.getenv("FORCE_PARSE", "false").lower() == "true"
FORCE_EMBED = os.getenv("FORCE_EMBED", "false").lower() == "true"
DB_IMPLEMENTATION = os.getenv("DB_IMPLEMENTATION", "sqlite")
DB_PATH = os.getenv("DB_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "data/database/vectors.db")))

# Postgres connection details
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_NAME = os.getenv("DB_NAME", "semantic_analysis")