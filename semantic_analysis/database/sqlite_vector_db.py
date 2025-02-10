import sqlite3
import sqlite_vec #type: ignore
from typing import List
import struct
from .vector_db import VectorDB

def serialize_f32(vector: List[float]) -> bytes:
    """Serializes a list of floats into a compact "raw bytes" format"""
    if not all(isinstance(v, float) for v in vector):
        raise ValueError(f"All elements in the vector must be floats, vector: {vector}")
    return struct.pack("%sf" % len(vector), *vector)

class SQLiteVectorDB(VectorDB):
    def __init__(self, db_path: str):
        self.db = sqlite3.connect(db_path)
        self.db.enable_load_extension(True)
        sqlite_vec.load(self.db)
        self.db.enable_load_extension(False)
        self._create_table()

    def _create_table(self):
        self.db.execute("CREATE VIRTUAL TABLE IF NOT EXISTS vec_items USING vec0(embedding float[768])")

    def insert_vector(self, rowid: int, vector: List[float]):
        with self.db:
            self.db.execute(
                "INSERT INTO vec_items(rowid, embedding) VALUES (?, ?)",
                [rowid, serialize_f32(vector)],
            )

    def query_vector(self, query: List[float], limit: int = 3) -> List[tuple]:
        query_str = serialize_f32(query)
        sql_query = f"""
            SELECT
                rowid,
                distance
            FROM vec_items
            WHERE embedding MATCH ?
                AND k = {limit}
            ORDER BY distance
        """
        rows = self.db.execute(sql_query, [query_str]).fetchall()
        return rows

    def clear(self):
        self.db.execute("DELETE FROM vec_items")

    def close(self):
        self.db.close()