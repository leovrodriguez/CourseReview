// src/hooks/useCourses.js
import { useState, useEffect , useCallback} from 'react';
import { fetchAllCourses, searchCourses } from '../api/courses';
import { getCourseReviews } from '../api/courses';

export const useCourses = (initialQuery = '', initialSort = {}) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState(initialQuery);
  const [sortConfig, setSortConfig] = useState(initialSort);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [filters, setFilters] = useState({
    internalRating: null,
    externalRating: null,
    internalReviewCount: null,
    externalReviewCount: null, 
    isFree: null,
  });
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalCourses, setTotalCourses] = useState(0);

  const applySort = useCallback((items) => {
    if (!sortConfig.key) return items;
    
    return [...items].sort((a, b) => {
      const aValue = getSortValue(a, sortConfig.key);
      const bValue = getSortValue(b, sortConfig.key);
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sortConfig]);

  const getSortValue = (course, key) => {
    switch (key) {
      case 'internal_rating':
        return course.internalRatings?.avg_rating || 0;
      case 'external_rating':
        return course.rating || 0;
      default:
        //When no specified sort order, ensuring all sort values are equal will mantain sort oder
        return 0; 
    }
  };

  // loads internal reviews
  const preloadReviews = async (courses) => {
    const coursesWithReviews = await Promise.all(
      courses.map(async (course) => {
        const reviews = await getCourseReviews(course.id);
        return { ...course, reviews };
      })
    );
    return coursesWithReviews;
  };

  const applyFilters = useCallback((courses) => {
    return courses.filter((course) => {
      // Internal minimum star rating filter
      if (
        filters.internalRating &&
        course.reviews.stats.avg_rating < filters.internalRating
      ) {
        return false;
      }

      // External minimum star rating filter
      if (filters.externalRating && course.rating < filters.externalRating) {
        return false;
      }

      // Internal Review count filter
      if (
        filters.internalReviewCount &&
        course.reviews.stats.review_count < filters.internalReviewCount
      ) {
        return false;
      }

      // External Review count filter
      if (
        filters.externalReviewCount &&
        course.num_ratings < filters.externalReviewCount
      ) {
        return false;
      }

      // Is Free filter
      if ((filters.isFree == "true" && !course.is_free) || (filters.isFree == "false" && course.is_free)) {
        return false;
      }

      return true;
    });
  }, [filters]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let data;

        if (query && query.trim() !== '') {
          // For semantic search, we'll get all results at once and paginate client-side
          data = await searchCourses(query, 50); // Get a larger batch for client-side pagination
          data = await preloadReviews(data); // Preload reviews
          data = applyFilters(data);
          data = applySort(data);

          // Client-side pagination - apply after receiving all results
          const offset = (page - 1) * pageSize;
          const paginatedData = data.slice(offset, offset + pageSize);

          setCourses(paginatedData);
          setTotalCourses(data.length);
        } else {
          // For regular fetching, use the server pagination
          const offset = (page - 1) * pageSize;
          data = await fetchAllCourses(pageSize, offset);
          data = await preloadReviews(data); // Preload reviews
          data = applyFilters(data);
          data = applySort(data);

          if (Array.isArray(data)) {
            setCourses(data);
            // Estimate total based on whether we got a full page
            setTotalCourses(
              data.length < pageSize
                ? offset + data.length
                : offset + data.length + pageSize
            );
          } else if (data && typeof data === 'object') {
            // Response with pagination metadata
            if (Array.isArray(data.courses)) {
              setCourses(data.courses);
              if (typeof data.total === 'number') {
                setTotalCourses(data.total);
              }
            } else {
              // Fallback if structure is unexpected
              setCourses(data);
            }
          }
        }
        
        setError(null);
      } catch (err) {
        setError(err.message || 'Error fetching courses');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query, page, pageSize, refreshIndex, sortConfig, applySort, filters, applyFilters]);

  const sortBy = (key, direction = 'asc') => {
    setSortConfig({ key, direction });
  };

  const refresh = () => setRefreshIndex(prev => prev + 1);
  
  const nextPage = () => setPage(prev => prev + 1);
  
  const prevPage = () => setPage(prev => Math.max(1, prev - 1));
  
  const goToPage = (pageNum) => setPage(pageNum);
  
  const changePageSize = (size) => {
    setPageSize(size);
    setPage(1); // Reset to first page when changing page size
  };
  
  const totalPages = Math.ceil(totalCourses / pageSize);

  // Search with debounce feature
  const search = (searchQuery) => {
    setQuery(searchQuery);
    setPage(1); // Reset to first page on new search
  };

  return {
    courses,
    loading,
    error,
    query,
    search,
    refresh,
    // Pagination controls
    page,
    pageSize,
    totalCourses,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    changePageSize,
    sortBy,
    sortConfig,
    setFilters,
    filters
  };
};