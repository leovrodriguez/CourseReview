import os

# Default DB choice (test implementation)
DB_IMPLEMENTATION = os.getenv("DB_IMPLEMENTATION", "sqlite")

# SQLLite DB Path
DB_PATH = os.getenv("DB_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "data/database/vectors.db")))

# Postgres connection details
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_NAME = os.getenv("DB_NAME", "semantic_analysis")