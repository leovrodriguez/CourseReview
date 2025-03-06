from tests.test_queries import test_queries


"""
Main entrypoint for course data ETL. 

This script will:
1. Write raw data from http requests to a file
2. Normalize the raw data into a list of Course objects
3. Embed the course objects into a list of vectors
4. Upload course vectors into database
"""

if __name__ == "__main__":
    
    test_queries() #just run tests for poc