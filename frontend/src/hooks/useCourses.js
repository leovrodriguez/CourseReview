// src/hooks/useCourses.js
import { useState, useEffect , useCallback} from 'react';
import { fetchAllCourses, searchCourses } from '../api/courses';

export const useCourses = (initialQuery = '', initialSort = {}) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState(initialQuery);
  const [sortConfig, setSortConfig] = useState(initialSort);
  const [refreshIndex, setRefreshIndex] = useState(0);
  
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let data;
        
        if (query && query.trim() !== '') {
          // For semantic search, we'll get all results at once and paginate client-side
          data = await searchCourses(query, 50); // Get a larger batch for client-side pagination
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
          data = applySort(data);
          
          if (Array.isArray(data)) {
            setCourses(data);
            // Estimate total based on whether we got a full page
            setTotalCourses(data.length < pageSize ? offset + data.length : offset + data.length + pageSize);
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
  }, [query, page, pageSize, refreshIndex, sortConfig, applySort]);

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
    sortConfig
  };
};