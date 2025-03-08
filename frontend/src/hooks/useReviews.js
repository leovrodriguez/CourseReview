// src/hooks/useReviews.js
import { useState, useEffect } from 'react';
import { getCourseReviews } from '../api/ratings';

export const useReviews = (courseId, initialLimit = 5) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    review_count: 0,
    avg_rating: 0,
    min_rating: 0,
    max_rating: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(initialLimit);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!courseId) return;
      
      setLoading(true);
      try {
        const data = await getCourseReviews(courseId, limit, offset);
        
        setReviews(data.reviews || []);
        setStats(data.stats || {});
        
        if (data.pagination) {
          setTotal(data.pagination.total);
        }
        
        setError(null);
      } catch (err) {
        setError(err.message || 'Error fetching reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [courseId, limit, offset, refreshIndex]);

  const refresh = () => setRefreshIndex(prev => prev + 1);
  
  const loadMore = () => {
    setLimit(prevLimit => prevLimit + initialLimit);
  };
  
  const hasMore = reviews.length < total;

  return {
    reviews,
    stats,
    loading,
    error,
    refresh,
    loadMore,
    hasMore
  };
};