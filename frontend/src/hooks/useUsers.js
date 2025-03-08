import { useState, useEffect } from 'react';
import { fetchAllUsers, createUser } from '../api';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchAllUsers();
        setUsers(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshIndex]);

  const addUser = async (userData) => {
    try {
      await createUser(userData);
      // Refresh the user list
      setRefreshIndex(prev => prev + 1);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  return {
    users,
    loading,
    error,
    addUser,
    refreshUsers: () => setRefreshIndex(prev => prev + 1)
  };
};