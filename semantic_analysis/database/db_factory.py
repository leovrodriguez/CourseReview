from .vector_db import VectorDB
from .sqlite_vector_db import SQLiteVectorDB
from env import DB_IMPLEMENTATION, DB_PATH


def get_vector_db() -> VectorDB:
    if DB_IMPLEMENTATION == "sqlite":
        return SQLiteVectorDB(DB_PATH)
    else:
        raise ValueError(f"Unsupported DB_IMPLEMENTATION: {DB_IMPLEMENTATION}")