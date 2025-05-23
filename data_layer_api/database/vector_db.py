from abc import ABC, abstractmethod
from typing import List
from classes.course import Course, CourseReview

class VectorDB(ABC):
    @abstractmethod
    def insert_course(self, course: Course, vector: List[float]):
        pass

    @abstractmethod
    def query_course_vector(self, query: List[float], limit: int = 3):
        pass
    
    @abstractmethod
    def insert_course_review(self, course_review: CourseReview):
        pass

    @abstractmethod
    def clear_courses(self):
        pass

    @abstractmethod
    def close(self):
        pass


