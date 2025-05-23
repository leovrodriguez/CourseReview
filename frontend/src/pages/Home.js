/**
 * Home page
 * - list all courses
 *  - course ratings
 *  - authors
 *  - etc
 * 
 * - search courses
 *  - query bar
 * 
 * User_Test Page
 * - can create users
 * - list all users
 * - next to each user are buttons for common operations
 *  - rate course
 *      - click on rate course
 *      - shown a list of courses to choose from
 *      - choose a course and choose 1-5 rating
 *      - type rating for that course
 * 
 */
// src/pages/Home.js
import React from 'react';
import { useCourses } from '../hooks/useCourses';
import CourseList from '../components/courses/CourseList';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import SortBar from '../components/common/SortBar';
import FilterBar from '../components/common/FilterBar'


const Home = () => {
  const {
    courses,
    loading,
    error,
    query,
    search,
    refresh,
    page,
    pageSize,
    totalPages,
    goToPage,
    changePageSize,
    sortBy,
    sortConfig,
    setFilters,
    filters
  } = useCourses();

  return (
    <div>
      <h1>Course Explorer</h1>

      <div className="search-container">
        <SearchBar
          placeholder="Search for courses by topic, skill, or keyword..."
          initialValue={query}
          onSearch={search}
        />
        <button onClick={refresh} className="refresh-button">
          Refresh
        </button>
      </div>

      <div className="sort-filter-bar-container">
        <SortBar onSort={sortBy} sortConfig={sortConfig} />
      </div>

      {error && <div className="error-message">Error: {error}</div>}

      {loading ? (
        <div className="loading">Loading courses...</div>
      ) : (
        <>
          {courses.length === 0 ? (
            <div className="course-filter-container">
              <FilterBar filters={filters} onFiltersChange={setFilters} />
              <div className="no-results">
                <p>No courses found. Try adjusting your search criteria.</p>
              </div>
            </div>
          ) : (
            <>
              {query && (
                <div className="search-results-info">
                  <p>Showing results for: <strong>{query}</strong></p>
                </div>
              )}
              <div className="course-filter-container">
                <FilterBar filters={filters} onFiltersChange={setFilters} />
                <CourseList courses={courses} />
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

export default Home;