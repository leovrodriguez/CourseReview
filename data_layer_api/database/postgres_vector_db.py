# postgres_vector_db.py
import psycopg2
from typing import List
from database.vector_db import VectorDB
from env import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

class PostgresVectorDB(VectorDB):
    def __init__(self):
        # Can be a connection string or dictionary of params
        connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        self.conn = psycopg2.connect(connection_string)
        self.create_tables()
    
    """
    Columns with vector type can only be inserted/updated with a
    specially formatted string in python (e.g. '[1,2,3]').
    Run this funcion to get a string representation of a
    vector that can be insrted into a vector column.
    """
    def pgvector_format(self, vector: List[float]) -> str:
        return f"[{','.join(map(str, vector))}]"
    
    def create_tables(self):
        with self.conn.cursor() as cursor:
            cursor.execute("""
            -- Users Table
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Courses Table
            CREATE TABLE IF NOT EXISTS courses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                platform VARCHAR(50) NOT NULL,
                rating DECIMAL(3,2) DEFAULT 0,
                num_reviews INT DEFAULT 0,
                embedding vector(768), -- Added vector embedding
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Learning Journeys Table
            CREATE TABLE IF NOT EXISTS learning_journeys (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Learning Journey Courses (to maintain order)
            CREATE TABLE IF NOT EXISTS learning_journey_courses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                learning_journey_id UUID REFERENCES learning_journeys(id) ON DELETE CASCADE,
                course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
                course_order INT NOT NULL CHECK (course_order > 0),
                UNIQUE (learning_journey_id, course_order)
            );

            -- Discussions Table
            CREATE TABLE IF NOT EXISTS discussions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
                learning_journey_id UUID REFERENCES learning_journeys(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                embedding vector(768), -- Added vector embedding
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CHECK (
                    (course_id IS NOT NULL AND learning_journey_id IS NULL) OR 
                    (learning_journey_id IS NOT NULL AND course_id IS NULL)
                )
            );

            -- Replies Table
            CREATE TABLE IF NOT EXISTS replies (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                embedding vector(768), -- Added vector embedding
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Likes Table (tracks likes on multiple objects)
            CREATE TABLE IF NOT EXISTS likes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                object_id UUID NOT NULL,
                object_type VARCHAR(50) CHECK (object_type IN ('course', 'learning_journey', 'discussion', 'reply')), 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (user_id, object_id, object_type)
            );
            """)
            self.conn.commit()
    
    # remove or update for new schema
    def insert_course(self, course: dict, vector: List[float]):
        # with self.conn.cursor() as cursor:
        #     # Format the vector properly for pgvector
        #     vector_str = self.pgvector_format(vector)

        #     cursor.execute(
        #         "INSERT INTO (vec_items rowid, embedding) VALUES (%s, %s)",
        #         [rowid, vector_str]
        #     )
        #     self.conn.commit()
        pass
    
    # remove or update for new schema
    def query_course_vector(self, query: List[float], limit: int = 3) -> List[tuple]:
        with self.conn.cursor() as cursor:
            # Format the query vector for pgvector
            query_str = f"[{','.join(map(str, query))}]"
            cursor.execute("""
                SELECT 
                    rowid,
                    1 - (embedding <=> %s) as similarity
                FROM vec_items
                ORDER BY embedding <=> %s
                LIMIT %s
            """, [query_str, query_str, limit])
            # Return results in the same format as SQLite implementation
            return [(row[0], row[1]) for row in cursor.fetchall()]
    
    # remove or update for new schema
    def clear_courses(self):
        with self.conn.cursor() as cursor:
            cursor.execute("DELETE FROM vec_items")
            self.conn.commit()
    
    # remove or update for new schema
    def close(self):
        self.conn.close()