# semantic_analysis/vector_db.py
from abc import ABC, abstractmethod
from typing import List

class VectorDB(ABC):
    @abstractmethod
    def insert_vector(self, rowid: int, vector: List[float]):
        pass

    @abstractmethod
    def query_vector(self, query: List[float], limit: int = 3) -> List[tuple]:
        pass

    @abstractmethod
    def clear(self):
        pass

    @abstractmethod
    def close(self):
        pass


