from utils.save_raw_data import write_raw_data
from utils.course import Course
from utils.clean_scraped_courses import clean_courses
from typing import List

if __name__ == "__main__":
    
    #Stores raw in respective path e.g data/{course_website}/
    write_raw_data() # for local dev can comment this out after successful run
    courses: List[Course] = clean_courses()
    
    for course in courses:
        print(course)
        print("\n")