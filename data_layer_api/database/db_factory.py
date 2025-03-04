from database.vector_db import VectorDB
from database.sqlite_vector_db import SQLiteVectorDB
from database.postgres_vector_db import PostgresVectorDB
from env import DB_IMPLEMENTATION, DB_PATH


def get_vector_db() -> VectorDB:
    if DB_IMPLEMENTATION == "sqlite":
        print("sqlite: " + DB_IMPLEMENTATION)
        return SQLiteVectorDB(DB_PATH)
    elif DB_IMPLEMENTATION == "postgres":
        print("postgres: " + DB_IMPLEMENTATION)
        return PostgresVectorDB()
    else:
        raise ValueError(f"Unsupported DB_IMPLEMENTATION: {DB_IMPLEMENTATION}")