// src/pages/CourseSelectionForRating.js
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourses } from '../hooks/useCourses';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';

const CourseSelectionForRating = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const { 
    courses, 
    loading, 
    error, 
    query,
    search,
    page,
    pageSize,
    totalPages,
    goToPage,
    changePageSize
  } = useCourses();

  const handleSelectCourse = (courseId) => {
    navigate(`/user/${userId}/rate-course/${courseId}`);
  };

  return (
    <div className="course-selection-page">
      <h1>Select a Course to Rate</h1>
      
      <div className="search-container">
        <SearchBar 
          placeholder="Search for a course to rate..." 
          initialValue={query}
          onSearch={search}
        />
      </div>
      
      {error && <div className="error-message">Error: {error}</div>}
      
      {loading ? (
        <div className="loading">Loading courses...</div>
      ) : (
        <>
          {courses.length === 0 ? (
            <div className="no-results">
              <p>No courses found. Try a different search term.</p>
            </div>
          ) : (
            <>
              {query && (
                <div className="search-results-info">
                  <p>Showing results for: <strong>{query}</strong></p>
                </div>
              )}
              
              <div className="course-selection-grid">
                {courses.map(course => (
                  <div key={course.id} className="course-selection-item">
                    <div className="course-selection-image">
                      <img src={course.image_url} alt={course.title} />
                    </div>
                    <div className="course-selection-content">
                      <h3>{course.title}</h3>
                      <p className="course-selection-platform">{course.platform}</p>
                      <p className="course-selection-author">
                        {course.authors && course.authors.length > 0 
                          ? course.authors.join(', ') 
                          : 'Unknown author'}
                      </p>
                      <button 
                        onClick={() => handleSelectCourse(course.id)}
                        className="select-course-button"
                      >
                        Select to Rate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <Pagination 
                currentPage={page}
                totalPages={totalPages}
                onPageChange={goToPage}
                pageSize={pageSize}
                onPageSizeChange={changePageSize}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CourseSelectionForRating;