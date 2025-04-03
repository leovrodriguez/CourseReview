// src/components/courses/CourseSelector.js
import React, { useState } from 'react';
import { useCourses } from '../../hooks/useCourses';

const CourseSelector = ({ onSelect, onCancel }) => {
  const {
    courses,
    loading,
    error,
    search,
    page,
    totalPages,
    nextPage,
    prevPage
  } = useCourses();

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    search(query);
  };

  const handleCourseSelect = (course) => {
    if (onSelect) {
      onSelect(course);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="course-selector-modal">
      <div className="course-selector-content">
        <h3>Select a Course to Reference</h3>
        
        <div className="course-search-container">
          <input
            type="text"
            className="course-search-input"
            placeholder="Search for courses by title, skills, or authors..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        {loading && (
          <div className="course-search-loading">
            Loading courses...
          </div>
        )}

        {error && (
          <div className="course-search-error">
            {error}
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="no-courses-found">
            No courses found. Try a different search term.
          </div>
        )}
        
        <div className="course-search-results">
          <div className="course-results-list">
            {courses.map((course) => (
              <div 
                key={course.id} 
                className="course-result-item"
                onClick={() => handleCourseSelect(course)}
              >
                <div className="course-result-image">
                  {course.image_url ? (
                    <img src={course.image_url} alt={course.title} />
                  ) : (
                    <div className="placeholder-image">
                      <span>{course.title.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="course-result-info">
                  <h4 className="course-result-title">{course.title}</h4>
                  <p className="course-result-platform">{course.platform}</p>
                  {course.authors && course.authors.length > 0 && (
                    <p className="course-result-authors">
                      By: {course.authors.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-controls">
              <button 
                onClick={prevPage} 
                disabled={page === 1}
                className="pagination-prev-button"
              >
                Previous
              </button>
              <span className="pagination-pages">
                Page {page} of {totalPages}
              </span>
              <button 
                onClick={nextPage} 
                disabled={page === totalPages}
                className="pagination-next-button"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        <div className="course-selector-actions">
          <button 
            onClick={handleCancel}
            className="selector-cancel-button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseSelector;