// src/hooks/useAllDiscussions.js
import { useState, useEffect } from 'react';
import { getAllDiscussions } from '../api/discussions';

const useAllDiscussions = (limit = 10, initialOffset = 0) => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    offset: initialOffset,
    limit,
    returned: 0
  });

  const fetchDiscussions = async (offset = initialOffset) => {
    setLoading(true);
    try {
      const result = await getAllDiscussions(limit, offset);
      setDiscussions(result.discussions);
      setPagination(result.pagination);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error in useAllDiscussions hook:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions(initialOffset);
  }, [initialOffset, limit]);

  const loadMore = () => {
    const newOffset = pagination.offset + pagination.limit;
    fetchDiscussions(newOffset);
  };

  const refreshDiscussions = () => {
    fetchDiscussions(pagination.offset);
  };

  return {
    discussions,
    loading,
    error,
    pagination,
    loadMore,
    refreshDiscussions
  };
};

export default useAllDiscussions;