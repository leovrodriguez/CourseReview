import sqlite3
import sqlite_vec #type: ignore
from typing import List
import struct
from .vector_db import VectorDB
import json

def serialize_f32(vector: List[float]) -> bytes:
    """Serializes a list of floats into a compact "raw bytes" format"""
    if not all(isinstance(v, float) for v in vector):
        raise ValueError(f"All elements in the vector must be floats, vector: {vector}")
    return struct.pack("%sf" % len(vector), *vector)

class SQLiteVectorDB(VectorDB):
    def __init__(self, db_path: str):
        self.db = sqlite3.connect(db_path)
        self.db.row_factory = sqlite3.Row
        self.db.enable_load_extension(True)
        sqlite_vec.load(self.db)
        self.db.enable_load_extension(False)
        self._create_table()

    def _create_table(self):
        self.db.execute(
        """
        CREATE TABLE IF NOT EXISTS courses (
            name TEXT NOT NULL,
            original_website TEXT NOT NULL,
            authors TEXT NOT NULL,  -- JSON array as string
            description TEXT,
            skills TEXT NOT NULL,   -- JSON array as string
            rating REAL DEFAULT 0,
            num_ratings INTEGER DEFAULT 0,
            image_url TEXT,
            is_free BOOLEAN,
            url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (name, original_website)
        )
        """
        )
        self.db.execute(
            """
            CREATE VIRTUAL TABLE IF NOT EXISTS vec_courses USING vec0(
                embedding float[768]
            );
            """
        )

    def insert_course(self, course: dict, vector: List[float]):
        print(f"Inserting course: {course}")

        with self.db:
            self.db.execute(
                """
                INSERT INTO courses (
                    name, original_website, authors, description, 
                    skills, rating, num_ratings, image_url, is_free, url
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    course["name"],
                    course["original_website"],
                    # Should change in prod db if we want to reference artists somewhere in website besides semanticly searching
                    ", ".join(map(str, course.get("authors", []))),
                    course.get("description", ""),
                    ", ".join(map(str, course.get("skills", []))),
                    course.get("rating", 0.0),
                    course.get("num_ratings", 0),
                    course.get("image_url", ""),
                    course.get("is_free", False),
                    course.get("url", ""),
                ),
            )
            self.db.execute(
                """
                INSERT INTO vec_courses (rowid, embedding)
                VALUES ((SELECT rowid FROM courses WHERE name = ? AND original_website = ?), ?)
                """,
                (
                    course["name"],
                    course["original_website"],
                    serialize_f32(vector),
                ),
            )

    def query_course_vector(self, query: List[float], limit: int = 3):
        query_str = serialize_f32(query)
        sql_query = f"""
            SELECT 
                courses.name, 
                courses.original_website, 
                courses.authors, 
                courses.description,
                courses.skills,
                courses.rating, 
                courses.num_ratings,
                courses.image_url,
                courses.is_free,
                courses.url,
                vec_courses.distance
            FROM courses
            JOIN vec_courses ON courses.rowid = vec_courses.rowid
            WHERE vec_courses.embedding MATCH ?
                AND k = {limit}
            ORDER BY vec_courses.distance
        """
        rows = self.db.execute(sql_query, [query_str]).fetchall()
        return [dict(tuple_entry) for tuple_entry in rows]

    def clear_courses(self):
        with self.db:
            self.db.execute("DELETE FROM courses")
            self.db.execute("DELETE FROM vec_courses")
            # Uncomment to change schema on test runs
            #self.db.execute("DROP TABLE vec_courses")
            #self.db.execute("DROP TABLE courses")

    def close(self):
        self.db.close()