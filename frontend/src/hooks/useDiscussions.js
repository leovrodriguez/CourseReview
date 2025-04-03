// src/hooks/useDiscussions.js
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api/config';

export const useDiscussions = (courseId, limit, offset) => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchDiscussions = async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      let url = `${API_BASE_URL}/course/${courseId}/discussions`;
      
      // Add pagination parameters if provided
      const params = new URLSearchParams();
      if (limit !== undefined) params.append('limit', limit);
      if (offset !== undefined) params.append('offset', offset);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch discussions');
      }
      
      const result = await response.json();
      setDiscussions(result.discussions || []);
      
      // Set pagination data if available
      if (result.pagination) {
        setPagination(result.pagination);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error in useDiscussions hook:', err);
      setError(err.message || 'Error loading discussions');
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, [courseId, limit, offset]);

  return {
    discussions,
    loading,
    error,
    pagination,
    refreshDiscussions: fetchDiscussions
  };
};

export default useDiscussions;