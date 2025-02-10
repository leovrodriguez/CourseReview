import os

# Test Environment:
    # We don't parse raw data (on assumption it is already stored in volumes)
        # Can change with FORCE_PARSE=TRUE
    # We don't embed course objects (on assumption it is already stored in volumes)
        # Can change with FORCE_EMBED=TRUE
    # We use an SQLite database
        # We store the database in a data directory in the project
        # Can change with DB_TYPE={type}
        # Can change with DB_PATH={path}
        # NOTE we are using a db factory to abstract the database choice.
        # We only support SQLite at the moment


# Environment Variables (Default to test environment)
FORCE_PARSE = os.getenv("FORCE_PARSE", "false").lower() == "true"
FORCE_EMBED = os.getenv("FORCE_EMBED", "false").lower() == "true"
DB_IMPLEMENTATION = os.getenv("DB_TYPE", "sqlite")
DB_PATH = os.getenv("DB_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "data/database/vectors.db")))