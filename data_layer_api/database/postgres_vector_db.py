import psycopg2
import psycopg2.extras
psycopg2.extras.register_uuid()
from typing import List, Optional
from database.vector_db import VectorDB
from env import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
from uuid import UUID
from datetime import datetime

# Import the dataclasses
from classes.course import Course, CourseReview
from classes.user import User
from classes.learning_journey import LearningJourney, LearningJourneyCourse
from classes.discussion import Discussion
from classes.reply import Reply
from classes.like import Like, LikeObjectType


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

            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            self.conn.commit()

            cursor.execute("""
            -- Users Table
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                password TEXT NOT NULL,
                salt TEXT NOT NULL
            );

            -- Courses Table
            CREATE TABLE IF NOT EXISTS courses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title TEXT NOT NULL,
                description TEXT, --nullable
                platform TEXT NOT NULL CHECK (platform IN ('coursera', 'udemy')),
                url TEXT NOT NULL,
                authors TEXT[] NOT NULL,
                skills TEXT[] NOT NULL,
                -- skills and author data is inconsistent across platforms
                -- so we store them in arrays instead of relational tables
                rating DECIMAL(3,2) DEFAULT 0,
                num_ratings INT DEFAULT 0,
                image_url TEXT NOT NULL,
                is_free BOOLEAN DEFAULT FALSE,
                embedding vector(768) NOT NULL, -- Added vector embedding
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                -- urls are resource locators for courses on their respective platforms
                -- urls by nature should uniquely identify a course
                UNIQUE (platform, url)
            );

            -- User review table
            CREATE TABLE IF NOT EXISTS course_reviews (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                rating INT CHECK (rating >= 0 AND rating <= 5) NOT NULL, 
                description TEXT, -- Optional review text
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (user_id, course_id) -- Ensures a user can only review a course once
            );               

            -- Discussions Table
            CREATE TABLE IF NOT EXISTS discussions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                embedding vector(768) NOT NULL, -- Added vector embedding
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Replies Table
            CREATE TABLE IF NOT EXISTS replies (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                embedding vector(768) NOT NULL, -- Added vector embedding
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Likes Table (tracks likes on multiple objects)
            CREATE TABLE IF NOT EXISTS likes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                object_id UUID NOT NULL,
                object_type TEXT NOT NULL CHECK (object_type IN ('discussion', 'reply')), 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (user_id, object_id, object_type)
            );
            """)
            self.conn.commit()
   
    
# Course Queries    
    def insert_course(self, course: Course, vector: List[float]):
        """
        Insert a course into the courses table.
        
        Args:
            course (Course): The course object to insert
            vector (List[float]): The embedding vector for the course
            
        Returns:
            UUID: The ID of the inserted course
        """
        with self.conn.cursor() as cursor:
            # Format the vector properly for pgvector
            vector_str = self.pgvector_format(vector)
            
            # Convert the platform enum to match the check constraint in the DB
            # The enum values are tuples, so we need the first element without the comma
            platform = course.original_website.value.lower()
            print("plat test: ")
            print(platform)
            
            # Check if course already exists
            cursor.execute(
                "SELECT id FROM courses WHERE platform = %s AND url = %s",
                [platform, course.url]
            )
            existing_course = cursor.fetchone()
            
            if existing_course:
                # If course exists, return the existing course ID
                print("Course already exists") # test
                course_id = existing_course[0]
                self.conn.commit()
                return course_id
                
            # If course doesn't exist, insert new course
            cursor.execute("""
                INSERT INTO courses (
                    title, 
                    description, 
                    platform, 
                    url, 
                    authors, 
                    skills, 
                    rating, 
                    num_ratings, 
                    image_url, 
                    is_free,
                    embedding
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, [
                course.name,                   # title
                course.description,            # description
                platform,                      # platform (lowercase)
                course.url,                    # url
                course.authors,                # authors (as array)
                course.skills,                 # skills (as array)
                course.rating,                 # rating
                course.num_ratings,            # num_ratings
                course.image_url,              # image_url
                course.is_free,                # is_free
                vector_str                     # embedding
            ])
            
            # Get the generated course ID
            course_id = cursor.fetchone()[0]
            self.conn.commit()
            
        return course_id
    
    def delete_course(self, course_id=None, platform=None, url=None):
        """
        Delete a course from the courses table by either its ID or platform/url combination.
        
        Args:
            course_id (UUID, optional): The ID of the course to delete
            platform (str, optional): The platform of the course to delete
            url (str, optional): The URL of the course to delete
            
        Returns:
            bool: True if a course was deleted, False otherwise
        """
        with self.conn.cursor() as cursor:
            if course_id:
                # Delete by course ID
                cursor.execute("DELETE FROM courses WHERE id = %s", [course_id])
            elif platform and url:
                # Delete by platform and URL combination
                cursor.execute("DELETE FROM courses WHERE platform = %s AND url = %s", 
                            [platform.lower(), url])
            else:
                raise ValueError("Either course_id or both platform and url must be provided")
            
            # Check if any rows were deleted
            rows_deleted = cursor.rowcount
            self.conn.commit()
            
        return rows_deleted > 0

    def get_courses(self, limit=None, offset=None):
        """
        Get all courses from the courses table with optional pagination.
        
        Args:
            limit (int, optional): Maximum number of courses to return
            offset (int, optional): Number of courses to skip
            
        Returns:
            list: A list of dictionaries containing course information
        """
        query = """
            SELECT 
                id,
                title,
                description,
                platform,
                url,
                authors,
                skills,
                rating,
                num_ratings,
                image_url,
                is_free,
                created_at
            FROM 
                courses
            ORDER BY 
                title
        """
        params = []
        
        # Add pagination if specified
        if limit is not None:
            query += " LIMIT %s"
            params.append(limit)
            
            if offset is not None:
                query += " OFFSET %s"
                params.append(offset)
        
        with self.conn.cursor() as cursor:
            cursor.execute(query, params)
            
            # Get column names
            columns = [desc[0] for desc in cursor.description]
            
            # Convert query results to list of dictionaries
            courses = []
            for row in cursor.fetchall():
                course_dict = dict(zip(columns, row))
                
                # Convert UUID and datetime to strings for JSON serialization
                for key, value in course_dict.items():
                    if isinstance(value, UUID):
                        course_dict[key] = str(value)
                    elif isinstance(value, datetime):
                        course_dict[key] = value.isoformat()
                        
                courses.append(course_dict)
                
            return courses

    def get_course_by_id(self, course_id):
        """
        Get details for a specific course by its ID.
        
        Args:
            course_id (str): The ID of the course to fetch
            
        Returns:
            dict: A dictionary containing the course information or None if not found
        """
        query = """
            SELECT 
                id,
                title,
                description,
                platform,
                url,
                authors,
                skills,
                rating,
                num_ratings,
                image_url,
                is_free,
                created_at
            FROM 
                courses
            WHERE 
                id = %s
        """
        
        with self.conn.cursor() as cursor:
            cursor.execute(query, [course_id])
            
            # Get column names
            columns = [desc[0] for desc in cursor.description]
            
            # Fetch the row
            row = cursor.fetchone()
            
            if not row:
                return None
                
            # Convert row to dictionary
            course_dict = dict(zip(columns, row))
            
            # Convert UUID and datetime to strings for JSON serialization
            for key, value in course_dict.items():
                if isinstance(value, UUID):
                    course_dict[key] = str(value)
                elif isinstance(value, datetime):
                    course_dict[key] = value.isoformat()
                    
            return course_dict
        
    def find_by_email(self, email):
        """
        Find a user by their email.
        
        Args:
            email (str): The user's email to search for
            
        Returns:
            dict: A dictionary containing the user information or None if not found
        """
        with self.conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM users WHERE email = %s",
                [email]
            )
            
            columns = [desc[0] for desc in cursor.description]
            user = cursor.fetchone()
            
            if user:
                user_dict = dict(zip(columns, user))
                return user_dict
                
        return None

    def get_user_by_id(self, id):
        """
        Get a user by their id.
        
        Args:
            email (str): The user's id to search for
            
        Returns:
            dict: A dictionary containing the user information or None if not found
        """
        with self.conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM users WHERE id = %s",
                [id]
            )
            
            columns = [desc[0] for desc in cursor.description]
            user = cursor.fetchone()
            
            if user:
                user_dict = dict(zip(columns, user))
                return user_dict
                
        return None
        
    def get_user_by_username(self, username):
        """
        Get a user by their username.
        
        Args:
            username (str): The username to search for
            
        Returns:
            dict: A dictionary containing the user information or None if not found
        """
        with self.conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM users WHERE username = %s",
                [username]
            )
            
            columns = [desc[0] for desc in cursor.description]
            user = cursor.fetchone()
            
            if user:
                user_dict = dict(zip(columns, user))
                return user_dict
                
        return None

# User Queries
    def insert_user(self, user: User):
        """
        Insert a user into the users table.
        
        Args:
            user (User): The user object to insert
            
        Returns:
            UUID: The ID of the inserted user
        """
        with self.conn.cursor() as cursor:
            # Check if user already exists
            cursor.execute(
                "SELECT id FROM users WHERE username = %s OR email = %s",
                [user.username, user.email]
            )
            existing_user = cursor.fetchone()
            
            if existing_user:
                # If user exists, return the existing user ID
                user_id = existing_user[0]
                self.conn.commit()
                return user_id
                
            # If user doesn't exist, insert new user
            cursor.execute("""
                INSERT INTO users (
                    username,
                    email,
                    password,
                    salt
                ) VALUES (%s, %s, %s, %s)
                RETURNING id
            """, [
                user.username,
                user.email,
                user.password,
                user.salt
            ])
            
            # Get the generated user ID
            user_id = cursor.fetchone()[0]
            self.conn.commit()
            
        return user_id

    def delete_user(self, user_id=None, username=None, email=None):
        """
        Delete a user from the users table by ID, username, or email.
        
        Args:
            user_id (UUID, optional): The ID of the user to delete
            username (str, optional): The username of the user to delete
            email (str, optional): The email of the user to delete
            
        Returns:
            bool: True if a user was deleted, False otherwise
        """
        with self.conn.cursor() as cursor:
            if user_id:
                # Delete by user ID
                cursor.execute("DELETE FROM users WHERE id = %s", [user_id])
            elif username:
                # Delete by username
                cursor.execute("DELETE FROM users WHERE username = %s", [username])
            elif email:
                # Delete by email
                cursor.execute("DELETE FROM users WHERE email = %s", [email])
            else:
                raise ValueError("Either user_id, username, or email must be provided")
            
            # Check if any rows were deleted
            rows_deleted = cursor.rowcount
            self.conn.commit()
            
        return rows_deleted > 0
    
    def get_all_users(self):
        """
        Get all users from the users table.
        
        Returns:
            list: A list of user dictionaries
        """
        with self.conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    id,
                    username,
                    email,
                    created_at
                FROM
                    users
                ORDER BY
                    username
            """)
            
            columns = [desc[0] for desc in cursor.description]
            users = []
            
            for row in cursor.fetchall():
                user = dict(zip(columns, row))
                users.append(user)
                
            return users

    # Review Queries
    def get_course_reviews(self, course_id):
        """
        Get all reviews for a specific course.
        
        Args:
            course_id (str or UUID): The ID of the course to fetch reviews for
            
        Returns:
            list: A list of review dictionaries with user information
        """
        query = """
            SELECT 
                cr.id,
                cr.user_id,
                u.username,
                u.email,
                cr.course_id,
                cr.rating,
                cr.description,
                cr.created_at
            FROM 
                course_reviews cr
            JOIN
                users u ON cr.user_id = u.id
            WHERE 
                cr.course_id = %s
            ORDER BY 
                cr.created_at DESC
        """
        
        with self.conn.cursor() as cursor:
            cursor.execute(query, [course_id])
            
            # Get column names
            columns = [desc[0] for desc in cursor.description]
            
            # Convert query results to list of dictionaries
            reviews = []
            for row in cursor.fetchall():
                review_dict = dict(zip(columns, row))
                
                # Convert UUID and datetime to strings for JSON serialization
                for key, value in review_dict.items():
                    if isinstance(value, UUID):
                        review_dict[key] = str(value)
                    elif isinstance(value, datetime):
                        review_dict[key] = value.isoformat()
                
                # Limit email exposure - only include the first part
                if 'email' in review_dict and review_dict['email']:
                    email_parts = review_dict['email'].split('@')
                    if len(email_parts) > 1:
                        review_dict['email'] = f"{email_parts[0][0:3]}...@{email_parts[1]}"
                        
                reviews.append(review_dict)
            
            # Get aggregate statistics
            stats_query = """
                SELECT 
                    COUNT(*) as review_count,
                    AVG(rating) as avg_rating,
                    MIN(rating) as min_rating,
                    MAX(rating) as max_rating
                FROM 
                    course_reviews
                WHERE 
                    course_id = %s
            """
            
            cursor.execute(stats_query, [course_id])
            stats = dict(zip([desc[0] for desc in cursor.description], cursor.fetchone()))
            
            # Round average rating to 2 decimal places
            if stats['avg_rating'] is not None:
                stats['avg_rating'] = round(float(stats['avg_rating']), 2)
                
            result = {
                "reviews": reviews,
                "stats": stats
            }
                
            return result

    def insert_course_review(self, review: CourseReview):
        """
        Insert or update a course review in the course_reviews table.
        
        Args:
            review (CourseReview): The CourseReview object containing review details.
            
        Returns:
            UUID: The ID of the inserted or updated review.
        """
        with self.conn.cursor() as cursor:
            # Ensure rating is within valid range
            if review.rating < 0 or review.rating > 5:
                raise ValueError("Rating must be between 0 and 5")

            # Check if the user has already reviewed the course
            cursor.execute(
                "SELECT id FROM course_reviews WHERE user_id = %s AND course_id = %s",
                [review.user_id, review.course_id]
            )
            existing_review = cursor.fetchone()

            if existing_review:
                # If review exists, update it
                cursor.execute("""
                    UPDATE course_reviews
                    SET rating = %s, description = %s, created_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING id
                """, [review.rating, review.description, existing_review[0]])

                review_id = cursor.fetchone()[0]
            else:
                # Insert new review
                cursor.execute("""
                    INSERT INTO course_reviews (user_id, course_id, rating, description)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                """, [review.user_id, review.course_id, review.rating, review.description])

                review_id = cursor.fetchone()[0]

            self.conn.commit()

        return review_id

    #TODO
    def delete_course_review(self, review_id):
        """
        Delete a course review by its ID.
        
        Args:
            review_id (str or UUID): The ID of the review to delete
            
        Returns:
            bool: True if the review was successfully deleted, False otherwise
        """
        try:
            with self.conn.cursor() as cursor:
                # Check if the review exists first
                cursor.execute(
                    "SELECT * FROM course_reviews WHERE id = %s",
                    [review_id]
                )
                
                review = cursor.fetchone()
                if not review:
                    return False
                
                # Delete the review
                cursor.execute(
                    "DELETE FROM course_reviews WHERE id = %s",
                    [review_id]
                )
                
                # Get the number of affected rows
                affected_rows = cursor.rowcount
                
                # Commit the transaction
                self.conn.commit()
                
                return affected_rows > 0
        except Exception as e:
            print(f"Error deleting course review: {e}")
            # Rollback the transaction in case of error
            self.conn.rollback()
            return False
    
# Discussion Queries

    #TODO turn this into "get recent discussions"
    def get_all_discussions(self):
        """
        Get all discussions from the database.
        
        Returns:
            list: A list of discussion dictionaries
        """
        with self.conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    d.id, 
                    d.user_id, 
                    u.username as user_username,
                    d.course_id,
                    c.title as course_title,
                    d.title, 
                    d.description, 
                    d.created_at
                FROM 
                    discussions d
                JOIN 
                    users u ON d.user_id = u.id
                LEFT JOIN 
                    courses c ON d.course_id = c.id
                ORDER BY 
                    d.created_at DESC
            """)
            
            columns = [desc[0] for desc in cursor.description]
            discussions = []
            
            for row in cursor.fetchall():
                discussion_dict = dict(zip(columns, row))
                
                # Convert UUID and datetime objects to strings for JSON serialization
                for key, value in discussion_dict.items():
                    if isinstance(value, UUID):
                        discussion_dict[key] = str(value)
                    elif isinstance(value, datetime):
                        discussion_dict[key] = value.isoformat()
                        
                discussions.append(discussion_dict)
                
            return discussions

    def insert_discussion(self, discussion: Discussion, vector: List[float]):
        """
        Insert a discussion into the discussions table.
        
        Args:
            discussion (Discussion): The discussion object to insert
            vector (List[float]): The embedding vector for the discussion content
            
        Returns:
            UUID: The ID of the inserted discussion
        """
        
        with self.conn.cursor() as cursor:
            # Format the vector for pgvector
            vector_str = self.pgvector_format(vector)
            
            # Insert the discussion
            cursor.execute("""
                INSERT INTO discussions (
                    user_id,
                    course_id,
                    title,
                    description,
                    embedding
                ) VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, [
                discussion.user_id,
                discussion.course_id,
                discussion.title,
                discussion.description,
                vector_str
            ])
            
            # Get the generated discussion ID
            discussion_id = cursor.fetchone()[0]
            self.conn.commit()
            
        return discussion_id

    def delete_discussion(self, discussion_id):
        """
        Delete a discussion from the discussions table.
        
        Args:
            discussion_id (UUID): The ID of the discussion to delete
            
        Returns:
            bool: True if a discussion was deleted, False otherwise
        """
        with self.conn.cursor() as cursor:
            cursor.execute("DELETE FROM discussions WHERE id = %s", [discussion_id])
            
            # Check if any rows were deleted
            rows_deleted = cursor.rowcount
            self.conn.commit()
            
        return rows_deleted > 0

    def get_discussions_by_course(self, course_id):
        """
        Get all discussions for a specific course.
        
        Args:
            course_id (UUID): The ID of the course
            
        Returns:
            List[Dict]: List of discussions
        """
        with self.conn.cursor() as cursor:
            cursor.execute("""
                SELECT d.id, d.title, d.description, d.user_id, u.username,
                    d.created_at
                FROM discussions d
                JOIN users u ON d.user_id = u.id
                WHERE d.course_id = %s
                ORDER BY d.created_at DESC
            """, [course_id])
            
            columns = [desc[0] for desc in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                # Convert row to dictionary
                discussion_dict = dict(zip(columns, row))
                # Convert UUID and datetime objects to strings for JSON serialization
                for key, value in discussion_dict.items():
                    if isinstance(value, UUID):
                        discussion_dict[key] = str(value)
                    elif isinstance(value, datetime):
                        discussion_dict[key] = value.isoformat()
                        
                results.append(discussion_dict)
                
        return results

    #TODO
    def get_discussions_by_user(self, user_id):
        return None

# Reply Queries
    def insert_reply(self, reply: Reply, vector: List[float]):
        """
        Insert a reply into the replies table.
        
        Args:
            reply (Reply): The reply object to insert
            vector (List[float]): The embedding vector for the reply text
            
        Returns:
            UUID: The ID of the inserted reply
        """
        with self.conn.cursor() as cursor:
            # Format the vector properly for pgvector
            vector_str = self.pgvector_format(vector)
            
            # Insert the reply
            cursor.execute("""
                INSERT INTO replies (
                    user_id,
                    discussion_id,
                    text,
                    embedding
                ) VALUES (%s, %s, %s, %s)
                RETURNING id
            """, [
                reply.user_id,
                reply.discussion_id,
                reply.text,
                vector_str
            ])
            
            # Get the generated reply ID
            reply_id = cursor.fetchone()[0]
            self.conn.commit()
            
        return reply_id

    def delete_reply(self, reply_id):
        """
        Delete a reply from the replies table.
        
        Args:
            reply_id (UUID): The ID of the reply to delete
            
        Returns:
            bool: True if a reply was deleted, False otherwise
        """
        with self.conn.cursor() as cursor:
            cursor.execute("DELETE FROM replies WHERE id = %s", [reply_id])
            
            # Check if any rows were deleted
            rows_deleted = cursor.rowcount
            self.conn.commit()
            
        return rows_deleted > 0

    def get_replies_by_discussion(self, discussion_id):
        """
        Get all replies for a specific discussion.
        
        Args:
            discussion_id (UUID): The ID of the discussion
            
        Returns:
            List[Dict]: List of replies with user information
        """
        with self.conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    r.id, 
                    r.text, 
                    r.created_at,
                    r.user_id,
                    u.username
                FROM 
                    replies r
                JOIN 
                    users u ON r.user_id = u.id
                WHERE 
                    r.discussion_id = %s
                ORDER BY 
                    r.created_at ASC
            """, [discussion_id])
            
            columns = [desc[0] for desc in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                # Convert row to dictionary
                reply_dict = dict(zip(columns, row))
                results.append(reply_dict)
                
        return results

    #TODO
    def get_replies_by_user(self, user_id):
        return None

# Like Queries
    def insert_like(self, like: Like):
        """
        Insert a like into the likes table.
        If the like already exists (same user, object, and type), it won't create a duplicate.
        
        Args:
            like (Like): The like object to insert
            
        Returns:
            UUID or None: The ID of the inserted like, or None if it already exists
        """
        with self.conn.cursor() as cursor:
            # Check if like already exists
            cursor.execute(
                "SELECT id FROM likes WHERE user_id = %s AND object_id = %s AND object_type = %s",
                [like.user_id, like.object_id, like.object_type.value]
            )
            existing_like = cursor.fetchone()
            
            if existing_like:
                # Like already exists, return the existing like ID
                self.conn.commit()
                return existing_like[0]
                
            # Insert the like
            cursor.execute("""
                INSERT INTO likes (
                    user_id,
                    object_id,
                    object_type
                ) VALUES (%s, %s, %s)
                RETURNING id
            """, [
                like.user_id,
                like.object_id,
                like.object_type.value
            ])
            
            # Get the generated like ID
            like_id = cursor.fetchone()[0]
            self.conn.commit()
            
        return like_id

    def delete_like(self, user_id, object_id, object_type: LikeObjectType):
        """
        Delete a like from the likes table.
        
        Args:
            user_id (UUID): The ID of the user who liked the object
            object_id (UUID): The ID of the liked object
            object_type (LikeObjectType or str): The type of the liked object
            
        Returns:
            bool: True if a like was deleted, False otherwise
        """
        # Convert object_type to string if it's an enum
        object_type = object_type.value
            
        with self.conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM likes WHERE user_id = %s AND object_id = %s AND object_type = %s",
                [user_id, object_id, object_type]
            )
            
            # Check if any rows were deleted
            rows_deleted = cursor.rowcount
            self.conn.commit()
            
        return rows_deleted > 0

    def get_liked_learning_journeys_by_user(self, user_id):
        """
        Get all learning journeys liked by a specific user.
        
        Args:
            user_id (UUID): The ID of the user
            
        Returns:
            List[Dict]: List of liked learning journeys with basic information
        """
        with self.conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    lj.id, 
                    lj.title, 
                    lj.description, 
                    lj.created_at,
                    u.username as creator_username,
                    l.created_at as liked_at,
                    (SELECT COUNT(*) FROM learning_journey_courses WHERE learning_journey_id = lj.id) as course_count
                FROM 
                    likes l
                JOIN 
                    learning_journeys lj ON l.object_id = lj.id
                JOIN 
                    users u ON lj.user_id = u.id
                WHERE 
                    l.user_id = %s AND 
                    l.object_type = 'learning_journey'
                ORDER BY 
                    l.created_at DESC
            """, [user_id])
            
            columns = [desc[0] for desc in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                # Convert row to dictionary
                journey_dict = dict(zip(columns, row))
                results.append(journey_dict)
                
        return results

    def get_liked_courses_by_user(self, user_id):
        """
        Get all courses liked by a specific user.
        
        Args:
            user_id (UUID): The ID of the user
            
        Returns:
            List[Dict]: List of liked courses with basic information
        """
        with self.conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    c.id, 
                    c.title, 
                    c.description, 
                    c.platform,
                    c.rating,
                    c.num_ratings,
                    c.image_url,
                    c.is_free,
                    c.authors,
                    c.skills,
                    l.created_at as liked_at
                FROM 
                    likes l
                JOIN 
                    courses c ON l.object_id = c.id
                WHERE 
                    l.user_id = %s AND 
                    l.object_type = 'course'
                ORDER BY 
                    l.created_at DESC
            """, [user_id])
            
            columns = [desc[0] for desc in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                # Convert row to dictionary
                course_dict = dict(zip(columns, row))
                results.append(course_dict)
                
        return results

    def get_like_count(self, object_id, object_type: LikeObjectType):
        """
        Get the number of likes for a specific object.
        
        Args:
            object_id (UUID): The ID of the object
            object_type (LikeObjectType or str): The type of the object
            
        Returns:
            int: The number of likes
        """
        object_type = object_type.value
            
        with self.conn.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) FROM likes WHERE object_id = %s AND object_type = %s",
                [object_id, object_type]
            )
            
            count = cursor.fetchone()[0]
            
        return count
    

# Vector Search Queries
    def query_course_vector(self, query_vector: List[float], limit: int = 10, threshold: float = 0.5, similarity_weight: float = .7):
        """
        Search for courses similar to the given query vector.
        
        Args:
            query_vector (List[float]): The query embedding vector
            limit (int): Maximum number of results to return
            threshold (float): Minimum similarity threshold (0-1)
            
        Returns:
            List[Dict]: List of courses with similarity scores
        """
        with self.conn.cursor() as cursor:
            # Format the query vector for pgvector
            vector_str = self.pgvector_format(query_vector)
            
            cursor.execute("""
                WITH review_ratings AS (
                    SELECT r.course_id, AVG(r.rating) AS avg_rating, COUNT(r.id) AS num_reviews 
                    FROM course_reviews r 
                    GROUP BY r.course_id
                ),
                similar_courses AS (
                    SELECT 
                        c.id, c.title, c.description, c.platform, c.authors, c.skills, c.rating, 
                        c.num_ratings, c.image_url, c.is_free, c.url,
                        rr.avg_rating AS course_review_rating,
                        rr.num_reviews AS course_review_rating_num,
                        c.rating AS original_website_rating,
                        c.num_ratings AS original_website_num_ratings,
                        1 - (c.embedding <=> %s) as similarity,
                        COALESCE(rr.avg_rating, c.rating) AS merged_rating,
                        COALESCE(rr.num_reviews, c.num_ratings) AS merged_num_ratings
                    FROM courses c
                    LEFT JOIN review_ratings rr ON c.id = rr.course_id
                    WHERE 1 - (c.embedding <=> %s) > %s
                    ORDER BY similarity DESC
                    LIMIT %s
                ),
                normalized_courses AS (
                    SELECT 
                        *,
                        merged_rating / 5 AS norm_rating,
                        -- Normalize the log of review counts
                        LOG(1 + merged_num_ratings) / LOG(1 + MAX(merged_num_ratings) OVER ()) AS norm_reviews,
                        -- Calculate normalized effective rating (0-1 range)
                        (merged_rating / 5) * (LOG(1 + merged_num_ratings) / LOG(1 + MAX(merged_num_ratings) OVER ())) AS normalized_effective_rating
                    FROM similar_courses
                )
                SELECT 
                    id, title, description, platform, authors, skills, image_url, is_free, url,
                    course_review_rating, course_review_rating_num,
                    original_website_rating, original_website_num_ratings, 
                    merged_rating AS rating_used_for_query, merged_num_ratings AS num_ratings_used_for_query,
                    -- Ordering related fields at the end
                    similarity, norm_rating, norm_reviews, normalized_effective_rating,
                    %s * similarity + (1-%s) * normalized_effective_rating AS custom_ranking
                FROM normalized_courses
                ORDER BY custom_ranking DESC
                LIMIT %s
            """, [vector_str, vector_str, threshold, limit * 2, similarity_weight, similarity_weight, limit])


            
            columns = [desc[0] for desc in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                # Convert row to dictionary
                course_dict = dict(zip(columns, row))
                results.append(course_dict)
                
        return results

    def query_discussion_vectors(self, query_vector: List[float], limit: int = 10, threshold: float = 0.5):
        """
        Search for discussions similar to the given query vector.
        
        Args:
            query_vector (List[float]): The query embedding vector
            limit (int): Maximum number of results to return
            threshold (float): Minimum similarity threshold (0-1)
            
        Returns:
            List[Dict]: List of discussions with similarity scores
        """
        with self.conn.cursor() as cursor:
            # Format the query vector for pgvector
            vector_str = self.pgvector_format(query_vector)
            
            cursor.execute("""
                SELECT 
                    d.id, 
                    d.title, 
                    d.description,
                    d.created_at,
                    u.username as author,
                    CASE 
                        WHEN d.course_id IS NOT NULL THEN 'course'
                        ELSE 'learning_journey'
                    END as context_type,
                    COALESCE(d.course_id, d.learning_journey_id) as context_id,
                    COALESCE(c.title, lj.title) as context_title,
                    1 - (d.embedding <=> %s) as similarity
                FROM 
                    discussions d
                JOIN 
                    users u ON d.user_id = u.id
                LEFT JOIN 
                    courses c ON d.course_id = c.id
                LEFT JOIN 
                    learning_journeys lj ON d.learning_journey_id = lj.id
                WHERE 
                    1 - (d.embedding <=> %s) > %s
                ORDER BY 
                    d.embedding <=> %s
                LIMIT %s
            """, [vector_str, vector_str, threshold, vector_str, limit])
            
            columns = [desc[0] for desc in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                # Convert row to dictionary
                discussion_dict = dict(zip(columns, row))
                results.append(discussion_dict)
                
        return results

    def query_reply_vectors(self, query_vector: List[float], limit: int = 10, threshold: float = 0.5):
        """
        Search for replies similar to the given query vector.
        
        Args:
            query_vector (List[float]): The query embedding vector
            limit (int): Maximum number of results to return
            threshold (float): Minimum similarity threshold (0-1)
            
        Returns:
            List[Dict]: List of replies with similarity scores
        """
        with self.conn.cursor() as cursor:
            # Format the query vector for pgvector
            vector_str = self.pgvector_format(query_vector)
            
            cursor.execute("""
                SELECT 
                    r.id, 
                    r.text,
                    r.created_at,
                    u.username as author,
                    d.id as discussion_id,
                    d.title as discussion_title,
                    CASE 
                        WHEN d.course_id IS NOT NULL THEN 'course'
                        ELSE 'learning_journey'
                    END as context_type,
                    COALESCE(d.course_id, d.learning_journey_id) as context_id,
                    COALESCE(c.title, lj.title) as context_title,
                    1 - (r.embedding <=> %s) as similarity
                FROM 
                    replies r
                JOIN 
                    users u ON r.user_id = u.id
                JOIN 
                    discussions d ON r.discussion_id = d.id
                LEFT JOIN 
                    courses c ON d.course_id = c.id
                LEFT JOIN 
                    learning_journeys lj ON d.learning_journey_id = lj.id
                WHERE 
                    1 - (r.embedding <=> %s) > %s
                ORDER BY 
                    r.embedding <=> %s
                LIMIT %s
            """, [vector_str, vector_str, threshold, vector_str, limit])
            
            columns = [desc[0] for desc in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                # Convert row to dictionary
                reply_dict = dict(zip(columns, row))
                results.append(reply_dict)
                
        return results

    def query_discussions_and_replies_vectors(self, query_vector: List[float], limit: int = 10, threshold: float = 0.5):
        """
        Search for discussions and replies similar to the given query vector.
        Results are combined and sorted by similarity score.
        
        Args:
            query_vector (List[float]): The query embedding vector
            limit (int): Maximum number of results to return
            threshold (float): Minimum similarity threshold (0-1)
            
        Returns:
            List[Dict]: List of discussions and replies with similarity scores and content type
        """
        with self.conn.cursor() as cursor:
            # Format the query vector for pgvector
            vector_str = self.pgvector_format(query_vector)
            
            cursor.execute("""
                -- Discussions query
                SELECT 
                    d.id,
                    'discussion' as content_type,
                    d.title as content_title,
                    d.description as content_text,
                    d.created_at,
                    u.username as author,
                    CASE 
                        WHEN d.course_id IS NOT NULL THEN 'course'
                        ELSE 'learning_journey'
                    END as context_type,
                    COALESCE(d.course_id, d.learning_journey_id) as context_id,
                    COALESCE(c.title, lj.title) as context_title,
                    1 - (d.embedding <=> %s) as similarity
                FROM 
                    discussions d
                JOIN 
                    users u ON d.user_id = u.id
                LEFT JOIN 
                    courses c ON d.course_id = c.id
                LEFT JOIN 
                    learning_journeys lj ON d.learning_journey_id = lj.id
                WHERE 
                    1 - (d.embedding <=> %s) > %s
                    
                UNION ALL
                
                -- Replies query
                SELECT 
                    r.id,
                    'reply' as content_type,
                    d.title as content_title,
                    r.text as content_text,
                    r.created_at,
                    u.username as author,
                    CASE 
                        WHEN d.course_id IS NOT NULL THEN 'course'
                        ELSE 'learning_journey'
                    END as context_type,
                    COALESCE(d.course_id, d.learning_journey_id) as context_id,
                    COALESCE(c.title, lj.title) as context_title,
                    1 - (r.embedding <=> %s) as similarity
                FROM 
                    replies r
                JOIN 
                    users u ON r.user_id = u.id
                JOIN 
                    discussions d ON r.discussion_id = d.id
                LEFT JOIN 
                    courses c ON d.course_id = c.id
                LEFT JOIN 
                    learning_journeys lj ON d.learning_journey_id = lj.id
                WHERE 
                    1 - (r.embedding <=> %s) > %s
                    
                ORDER BY 
                    similarity DESC
                LIMIT %s
            """, [vector_str, vector_str, threshold, vector_str, vector_str, threshold, limit])
            
            columns = [desc[0] for desc in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                # Convert row to dictionary
                result_dict = dict(zip(columns, row))
                results.append(result_dict)
                
        return results
    
    # remove or update for new schema
    def clear_courses(self):
        pass

    def close(self):
        self.conn.close()