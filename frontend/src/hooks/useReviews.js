// src/hooks/useReviews.js
import { useState, useEffect, useCallback } from 'react';
import { getCourseReviews } from '../api/courses';

export const useReviews = (courseId) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    avg_rating: 0,
    review_count: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async () => {
    console.log('useReviews hook - courseId:', courseId);
    
    if (!courseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getCourseReviews(courseId);
      console.log('useReviews - received review data:', data);
      
      setReviews(data.reviews || []);
      setStats({
        avg_rating: data.stats?.avg_rating || 0,
        review_count: data.stats?.review_count || 0,
        distribution: data.stats?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.message || 'Failed to load reviews');
      setReviews([]);
      setStats({
        avg_rating: 0,
        review_count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const refreshReviews = () => {
    fetchReviews();
  };

  return { reviews, stats, loading, error, refreshReviews };
};