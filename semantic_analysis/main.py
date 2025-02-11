from data_utils.save_raw_data import write_raw_data
from data_utils.clean_scraped_courses import normalized_courses
from database.db_factory import get_vector_db
from tests.test_queries import test_queries


"""
Main entrypoint for semantic analysis. 

This script will:
1. Write raw data from http requests to a file
2. Normalize the raw data into a list of Course objects
3. Embed the course objects into a list of vectors
4. Upload course vectors into database
"""

if __name__ == "__main__":
    write_raw_data()
    test_queries(normalized_courses(), get_vector_db()) #just run tests for poc