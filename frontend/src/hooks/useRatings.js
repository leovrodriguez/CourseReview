import { useState } from 'react';
import { rateCourse, getCourseRatings } from '../api';

export const useRatings = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitRating = async (userId, courseId, rating, reviewText = '') => {
    setLoading(true);
    try {
      const result = await rateCourse(userId, courseId, rating, reviewText);
      setError(null);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const fetchCourseRatings = async (courseId) => {
    setLoading(true);
    try {
      const data = await getCourseRatings(courseId);
      setRatings(data);
      setError(null);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return {
    ratings,
    loading,
    error,
    submitRating,
    fetchCourseRatings
  };
};