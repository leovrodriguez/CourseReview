import React, { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import UserList from '../components/users/UserList';
import UserForm from '../components/users/UserForm';

const UserTest = () => {
  const { users, loading, error, addUser, refreshUsers } = useUsers();
  const [formVisible, setFormVisible] = useState(false);

  const handleAddUser = async (userData) => {
    const success = await addUser(userData);
    if (success) {
      setFormVisible(false);
    }
  };

  return (
    <div>
      <h1>User Management</h1>
      
      <div className="actions">
        <button onClick={() => setFormVisible(!formVisible)}>
          {formVisible ? 'Cancel' : 'Add New User'}
        </button>
        <button onClick={refreshUsers}>Refresh Users</button>
      </div>
      
      {formVisible && <UserForm onSubmit={handleAddUser} />}
      
      {error && <div className="error-message">Error: {error}</div>}
      
      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <UserList users={users} />
      )}
    </div>
  );
};

export default UserTest;